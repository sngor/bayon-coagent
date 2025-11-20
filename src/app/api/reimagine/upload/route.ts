import { NextRequest, NextResponse } from 'next/server';
import { handleImageUpload } from '@/lib/reimagine-upload';

// Route configuration
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    // Call the shared upload logic
    const result = await handleImageUpload(formData);
    
    // Return the result as JSON
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Upload API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
