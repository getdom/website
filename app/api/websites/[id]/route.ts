import { NextRequest, NextResponse } from 'next/server';
import { deleteWebsite } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const websiteId = parseInt(id, 10);
    
    if (isNaN(websiteId)) {
      return NextResponse.json(
        { error: 'Invalid website ID' },
        { status: 400 }
      );
    }
    
    // Delete from database
    deleteWebsite(websiteId);
    
    // Note: For simplicity, we're not deleting the screenshot file
    // In production, you might want to track and clean up orphaned files
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting website:', error);
    return NextResponse.json(
      { error: 'Failed to delete website' },
      { status: 500 }
    );
  }
}

