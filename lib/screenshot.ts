import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

export interface WebsiteMetadata {
  title: string;
  description?: string;
  category?: string;
  colorPalette?: string[];
}

export async function captureWebsite(url: string): Promise<{ screenshotPath: string; metadata: WebsiteMetadata }> {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Injecter un style pour accélérer les animations si nécessaire
    await page.evaluateOnNewDocument(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        * {
          animation-duration: 0.01s !important;
          animation-delay: 0s !important;
          transition-duration: 0.01s !important;
          transition-delay: 0s !important;
        }
      `;
      // Ajouter le style dès que possible
      if (document.head) {
        document.head.appendChild(style);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.head.appendChild(style);
        });
      }
    });
    
    // Navigate to the URL avec stratégie de fallback
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2', // Moins strict que networkidle0
        timeout: 30000 
      });
    } catch (error) {
      // Si networkidle2 échoue, essayer avec load seulement
      console.log('Falling back to "load" wait strategy');
      await page.goto(url, { 
        waitUntil: 'load',
        timeout: 30000 
      });
    }
    
    // Attendre un peu pour que la page soit complètement chargée
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simuler un scroll progressif pour déclencher toutes les animations
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100; // pixels à scroller à chaque fois
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            // Revenir en haut de la page pour le screenshot
            window.scrollTo(0, 0);
            resolve();
          }
        }, 50); // scroll rapide toutes les 50ms
      });
    });
    
    // Attendre que toutes les animations soient terminées et que la page soit stable
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get the page content for metadata extraction
    const html = await page.content();
    const metadata = extractMetadata(html, url);
    
    // Take full page screenshot
    const screenshot = await page.screenshot({ 
      fullPage: true,
      type: 'jpeg',
      quality: 80
    });
    
    // Save screenshot
    const screenshotsDir = join(process.cwd(), 'public', 'screenshots');
    if (!existsSync(screenshotsDir)) {
      mkdirSync(screenshotsDir, { recursive: true });
    }
    
    const filename = `${Date.now()}-${sanitizeFilename(url)}.jpg`;
    const screenshotPath = join(screenshotsDir, filename);
    writeFileSync(screenshotPath, screenshot);
    
    // Extract color palette from screenshot (approche simple avec sharp)
    let colorPalette: string[] = [];
    try {
      const imageBuffer = readFileSync(screenshotPath);
      
      // Redimensionner pour accélérer l'analyse
      const { data, info } = await sharp(imageBuffer)
        .resize(100, 100, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });
      
      // Extraire quelques couleurs dominantes par échantillonnage
      const colors = new Map<string, number>();
      const step = 4; // Échantillonner tous les 4 pixels
      
      for (let i = 0; i < data.length; i += info.channels * step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Arrondir les couleurs pour regrouper les similaires
        const rr = Math.round(r / 30) * 30;
        const gg = Math.round(g / 30) * 30;
        const bb = Math.round(b / 30) * 30;
        
        // Ignorer les couleurs trop claires ou trop sombres
        const brightness = (rr + gg + bb) / 3;
        if (brightness > 20 && brightness < 235) {
          const hex = `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`;
          colors.set(hex, (colors.get(hex) || 0) + 1);
        }
      }
      
      // Trier par fréquence et prendre les 5 couleurs les plus communes
      colorPalette = Array.from(colors.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);
    } catch (error) {
      console.error('Error extracting color palette:', error);
    }
    
    return {
      screenshotPath: `/screenshots/${filename}`,
      metadata: {
        ...metadata,
        colorPalette,
      },
    };
  } catch (error) {
    console.error('Error capturing website:', error);
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        throw new Error('Le site web prend trop de temps à charger. Veuillez réessayer.');
      }
      throw new Error(`Erreur lors de la capture: ${error.message}`);
    }
    throw new Error('Failed to capture website screenshot');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function extractMetadata(html: string, url: string): WebsiteMetadata {
  const $ = cheerio.load(html);
  
  // Try to get title from various sources
  let title = 
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('title').text() ||
    new URL(url).hostname;
  
  // Clean up title
  title = title.trim();
  
  // Try to get description
  const description = 
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    '';
  
  // Try to infer category from keywords or site type
  const keywords = $('meta[name="keywords"]').attr('content') || '';
  const category = inferCategory(title, description, keywords);
  
  return {
    title,
    description: description.trim() || undefined,
    category: category || undefined,
  };
}

function inferCategory(title: string, description: string, keywords: string): string {
  const text = `${title} ${description} ${keywords}`.toLowerCase();
  
  if (text.match(/portfolio|design|creative|agency/)) return 'Design';
  if (text.match(/e-commerce|shop|store|product/)) return 'E-commerce';
  if (text.match(/blog|article|news|magazine/)) return 'Blog';
  if (text.match(/app|software|saas|tool/)) return 'App';
  if (text.match(/video|animation|motion/)) return 'Video';
  if (text.match(/landing|marketing/)) return 'Landing';
  
  return 'Website';
}

function sanitizeFilename(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/[^a-z0-9]/gi, '-').substring(0, 50);
  } catch {
    return 'website';
  }
}
