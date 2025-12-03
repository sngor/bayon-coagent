import { NextRequest, NextResponse } from 'next/server';
import { deleteFile } from '@/aws/s3/client';

/**
 * API route to delete voice recordings from S3
 * POST /api/mobile/delete-voice-recording
 */
export async function POST(request: NextRequest) {
    try {
        const { audioUrl } = await request.json();

        if (!audioUrl || typeof audioUrl !== 'string') {
            return NextResponse.json(
                { error: 'Invalid audio URL' },
                { status: 400 }
            );
        }

        // Extract bucket and key from S3 URL
        const url = new URL(audioUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);

        if (pathParts.length < 2) {
            return NextResponse.json(
                { error: 'Invalid S3 URL format' },
                { status: 400 }
            );
        }

        // If using path-style URL (LocalStack), first part is bucket
        // If using virtual-hosted style, entire path is the key
        const key = url.hostname.includes('s3') && !url.hostname.startsWith('s3')
            ? pathParts.join('/') // Virtual-hosted style
            : pathParts.slice(1).join('/'); // Path style

        // Delete from S3
        await deleteFile(key);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting voice recording from S3:', error);
        return NextResponse.json(
            { error: 'Failed to delete voice recording' },
            { status: 500 }
        );
    }
}
