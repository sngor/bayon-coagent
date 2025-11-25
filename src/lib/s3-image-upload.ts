'use server';

/**
 * @fileOverview S3 image upload utility for base64 images
 * Uploads base64-encoded images to S3 and returns public URLs
 */

// S3 client imported dynamically in the function

/**
 * Upload a base64-encoded image to S3
 * @param base64DataUrl - Base64 data URL (e.g., "data:image/png;base64,...")
 * @param folder - S3 folder/prefix (e.g., "blog-headers", "avatars")
 * @returns Public S3 URL of the uploaded image
 */
export async function uploadBase64ImageToS3(
    base64DataUrl: string,
    folder: string = 'images'
): Promise<string> {
    try {
        // Extract the base64 data and mime type
        const matches = base64DataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 data URL format');
        }

        const mimeType = matches[1];
        const base64Data = matches[2];

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine file extension from mime type
        const extension = mimeType.split('/')[1] || 'png';

        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const filename = `${folder}/${timestamp}-${randomString}.${extension}`;

        // Upload to S3
        const { uploadFile, getPresignedUrl } = await import('@/aws/s3/client');
        await uploadFile(filename, buffer, mimeType);

        // Generate a presigned URL that expires in 7 days (604800 seconds)
        // This allows the image to be viewed without making the bucket public
        const presignedUrl = await getPresignedUrl(filename, 604800);

        return presignedUrl;
    } catch (error) {
        console.error('Error uploading base64 image to S3:', error);
        throw new Error(`Failed to upload image to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
