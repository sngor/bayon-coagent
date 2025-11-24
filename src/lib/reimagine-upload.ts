/**
 * Shared upload logic for Reimagine Image Toolkit
 * 
 * This module contains the core upload logic that can be used by both
 * server actions and API routes.
 */

import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/aws/s3';
import { getRepository } from '@/aws/dynamodb/repository';
import { analyzeImage } from '@/aws/google-ai/flows/gemini-analyze';
import {
  validateFileUpload,
  type EditSuggestion,
  type UploadResponse,
} from '@/ai/schemas/reimagine-schemas';

import {
  withRetry,
  formatErrorResponse,
  logError,
} from '@/aws/bedrock/reimagine-error-handler';

import {
  checkRateLimit,
  formatRateLimitError,
} from '@/lib/rate-limiter';

import {
  getCachedSuggestions,
  cacheSuggestions,
} from '@/lib/reimagine-cache';

/**
 * Core upload logic that handles image upload and analysis
 */
export async function handleImageUpload(
  formData: FormData
): Promise<UploadResponse> {
  try {
    // Get user ID from form data
    const userId = formData.get('userId') as string;
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    // Check rate limit for uploads (10 per hour)
    const rateLimitResult = await checkRateLimit(userId, 'upload');
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: formatRateLimitError('upload', rateLimitResult.retryAfter || 0),
      };
    }

    // Extract file from form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided. Please select an image to upload.',
      };
    }

    // Validate file size and format
    const validation = validateFileUpload(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique image ID
    const imageId = uuidv4();
    const timestamp = Date.now();

    // Sanitize filename
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Generate S3 key with user-specific pattern
    const s3Key = `users/${userId}/reimagine/originals/${imageId}/${timestamp}-${sanitizedFileName}`;

    // Convert File to Buffer for S3 upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3 with retry logic
    await withRetry(
      () => uploadFile(s3Key, buffer, file.type),
      'upload',
      { maxRetries: 3 }
    );

    // Use placeholder dimensions for now
    const width = 1920;
    const height = 1080;

    // Prepare image metadata
    const uploadedAt = new Date().toISOString();

    // Invoke AI analysis to generate suggestions
    let suggestions: EditSuggestion[] = [];
    let analysisError: string | undefined;

    const cachedSuggestions = getCachedSuggestions(imageId);
    if (cachedSuggestions) {
      suggestions = cachedSuggestions;
    } else {
      try {
        // Convert image to base64 for analysis
        const base64Image = buffer.toString('base64');

        // Determine image format
        let imageFormat: 'jpeg' | 'png' | 'webp' = 'jpeg';
        if (file.type === 'image/png') {
          imageFormat = 'png';
        } else if (file.type === 'image/webp') {
          imageFormat = 'webp';
        }

        // Analyze image and get suggestions with retry logic
        const analysisResult = await withRetry(
          () => analyzeImage({
            imageData: base64Image,
            imageFormat,
          }),
          'analysis',
          { maxRetries: 2 }
        );

        suggestions = analysisResult.suggestions;

        // Cache suggestions for 5 minutes
        cacheSuggestions(imageId, suggestions);
      } catch (error) {
        // Log error to CloudWatch
        logError(error, 'image-analysis', {
          userId,
          imageId,
          operation: 'handleImageUpload',
        });

        analysisError = 'Image analysis failed, but upload succeeded.';

        // Provide fallback suggestions
        suggestions = [
          {
            editType: 'enhance',
            priority: 'medium',
            reason: 'Image analysis unavailable. Enhancement can improve overall image quality.',
            suggestedParams: {
              autoAdjust: true,
            },
            confidence: 0.5,
          },
        ];
      }
    }

    // Save metadata to DynamoDB with retry logic
    const repository = getRepository();
    await withRetry(
      () => repository.saveImageMetadata(userId, imageId, {
        originalKey: s3Key,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        width,
        height,
        uploadedAt,
        suggestions,
      }),
      'database',
      { maxRetries: 3 }
    );

    // Return success response with image ID and suggestions
    return {
      success: true,
      imageId,
      suggestions,
      error: analysisError,
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 'upload-image', {
      operation: 'handleImageUpload',
    });

    // Return formatted error response
    return formatErrorResponse(error, 'upload-image');
  }
}
