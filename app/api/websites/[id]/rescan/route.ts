import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { captureWebsite } from '@/lib/screenshot';
import { unlinkSync } from 'fs';
import { join } from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const websiteId = parseInt(id);
    
    if (isNaN(websiteId)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Get existing website
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM websites WHERE id = ?');
    const website = stmt.get(websiteId) as any;
    
    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }
    
    // Delete old screenshot
    try {
      const oldScreenshotPath = join(process.cwd(), 'public', website.screenshotPath);
      unlinkSync(oldScreenshotPath);
    } catch (error) {
      console.log('Could not delete old screenshot:', error);
    }
    
    // Capture new screenshot and extract metadata
    const { screenshotPath, metadata } = await captureWebsite(website.url);
    
    // Update database
    const updateStmt = db.prepare(`
      UPDATE websites 
      SET screenshotPath = ?, 
          colorPalette = ?,
          title = ?,
          description = ?,
          category = ?
      WHERE id = ?
    `);
    
    updateStmt.run(
      screenshotPath,
      metadata.colorPalette ? JSON.stringify(metadata.colorPalette) : null,
      metadata.title,
      metadata.description || null,
      metadata.category || null,
      websiteId
    );
    
    // Get updated website
    const updatedWebsite = stmt.get(websiteId);
    
    return NextResponse.json(updatedWebsite);
  } catch (error) {
    console.error('Error rescanning website:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('capture')) {
        return NextResponse.json(
          { error: error.message },
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to rescan website' },
      { status: 500 }
    );
  }
}






