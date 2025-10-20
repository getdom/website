import { NextRequest, NextResponse } from 'next/server';
import { getAllWebsites, addWebsite } from '@/lib/db';
import { captureWebsite } from '@/lib/screenshot';

export async function GET() {
  try {
    const websites = getAllWebsites();
    return NextResponse.json(websites);
  } catch (error) {
    console.error('Error fetching websites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch websites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }
    
    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL' },
        { status: 400 }
      );
    }
    
    // Capture screenshot and extract metadata
    const { screenshotPath, metadata } = await captureWebsite(url);
    
    // Save to database
    const website = addWebsite({
      title: metadata.title,
      url,
      description: metadata.description,
      category: metadata.category,
      screenshotPath,
      colorPalette: metadata.colorPalette ? JSON.stringify(metadata.colorPalette) : undefined,
    });
    
    return NextResponse.json(website, { status: 201 });
  } catch (error) {
    console.error('Error adding website:', error);
    
    // Gérer les erreurs spécifiques
    if (error instanceof Error) {
      // Erreur de contrainte unique (URL déjà existante)
      if (error.message.includes('UNIQUE constraint') || 
          (error as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return NextResponse.json(
          { error: 'Ce site web existe déjà dans votre collection' },
          { status: 409 }
        );
      }
      
      // Erreur de timeout ou de capture
      if (error.message.includes('timeout') || error.message.includes('capture')) {
        return NextResponse.json(
          { error: error.message },
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to add website' },
      { status: 500 }
    );
  }
}
