'use server';

/**
 * Server Actions for Reimagine Image Toolkit
 * 
 * Handles image upload, edit processing, history management, and other
 * operations for the AI-powered image editing toolkit.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 13.1
 */

import { v4 as uuidv4 } from 'uuid';
import { getPresignedDownloadUrl, uploadFile } from '@/aws/s3';
import { getRepository } from '@/aws/dynamodb/repository';
import {
  validateEditParams,
  type EditType,
  type EditParams,
  type EditSuggestion,
  type VirtualStagingParams,
  type DayToDuskParams,
  type EnhanceParams,
  type ItemRemovalParams,
  type VirtualRenovationParams,
  type UploadResponse,
  type ProcessEditResponse,
} from '@/ai/schemas/reimagine-schemas';

import {
  withRetry,
  formatErrorResponse,
  logError,
} from '@/aws/bedrock/reimagine-error-handler';

import {
  checkRateLimit,
  formatRateLimitError,
  getRateLimitStatus,
} from '@/lib/rate-limiter';

import {
  invalidateSuggestions,
} from '@/lib/reimagine-cache';

/**
 * Uploads an image file and generates AI-powered edit suggestions
 * 
 * This action:
 * 1. Validates the uploaded file (size, format)
 * 2. Uploads the file to S3 with user-specific key pattern
 * 3. Saves metadata to DynamoDB
 * 4. Invokes AI analysis to generate edit suggestions
 * 5. Returns image ID and suggestions
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 13.1
 * 
 * @param formData - Form data containing the file
 * @returns Upload response with image ID and suggestions
 */
export async function uploadImageAction(
  formData: FormData
): Promise<UploadResponse> {
  const { handleImageUpload } = await import('@/lib/reimagine-upload');
  return handleImageUpload(formData);
}

/**
 * Processes an edit operation on an image
 * 
 * This action:
 * 1. Validates edit parameters based on edit type
 * 2. Retrieves the source image from DynamoDB
 * 3. Routes to the appropriate Bedrock flow
 * 4. Saves the result to S3
 * 5. Creates an edit record in DynamoDB with status 'preview'
 * 6. Returns edit ID and presigned result URL
 * 
 * Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 9.1, 9.2
 * 
 * @param userId - User ID
 * @param imageId - Source image ID
 * @param editType - Type of edit operation
 * @param params - Edit parameters specific to the edit type
 * @param parentEditId - Optional parent edit ID for chained edits (Requirement 9.2)
 * @returns Process edit response with edit ID and result URL
 */
export async function processEditAction(
  userId: string,
  imageId: string,
  editType: EditType,
  params: EditParams,
  parentEditId?: string
): Promise<ProcessEditResponse> {
  try {
    // Validate user ID and image ID
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    if (!imageId) {
      return {
        success: false,
        error: 'Image ID is required. Please provide a valid image.',
      };
    }

    // Check rate limit for edit operations (20 per hour)
    const rateLimitResult = await checkRateLimit(userId, 'edit');
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: formatRateLimitError('edit', rateLimitResult.retryAfter || 0),
      };
    }

    // Validate edit parameters based on edit type (Requirement 2.1, 3.1, 4.1, 5.1, 6.1)
    const validation = validateEditParams(editType, params);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid edit parameters.',
      };
    }

    const validatedParams = validation.data!;

    // Get repository
    const repository = getRepository();

    // Determine source key based on whether this is a chained edit (Requirement 9.2)
    let sourceKey: string;
    let sourceImageId = imageId;

    if (parentEditId) {
      // This is a chained edit - use the result from the parent edit as source
      const { getEditRecordKeys } = await import('@/aws/dynamodb/keys');
      const parentKeys = getEditRecordKeys(userId, parentEditId);
      const parentEdit = await repository.get<any>(parentKeys.PK, parentKeys.SK);

      if (!parentEdit) {
        return {
          success: false,
          error: 'Parent edit not found. Please try again.',
        };
      }

      // Verify parent edit is completed
      if (parentEdit.status !== 'completed') {
        return {
          success: false,
          error: 'Parent edit must be completed before chaining. Please accept the preview first.',
        };
      }

      // Use the parent edit's result as the source
      sourceKey = parentEdit.resultKey;
      sourceImageId = parentEdit.imageId; // Keep track of original image
    } else {
      // Regular edit - use the original image
      const imageMetadata = await repository.getImageMetadata(userId, imageId);
      if (!imageMetadata) {
        return {
          success: false,
          error: 'Source image not found. Please upload an image first.',
        };
      }
      sourceKey = imageMetadata.originalKey;
    }

    // Download source image from S3
    const { downloadFile } = await import('@/aws/s3');
    const sourceImageBuffer = await downloadFile(sourceKey);

    // Convert buffer to base64 for Bedrock
    const base64Image = sourceImageBuffer.toString('base64');

    // Determine image format from source key extension
    let imageFormat: 'jpeg' | 'png' | 'webp' = 'jpeg';
    const keyLower = sourceKey.toLowerCase();
    if (keyLower.endsWith('.png')) {
      imageFormat = 'png';
    } else if (keyLower.endsWith('.webp')) {
      imageFormat = 'webp';
    }

    // Track processing start time
    const startTime = Date.now();

    // Route to appropriate Bedrock flow based on edit type (Requirement 2.2, 3.2, 4.2, 5.2, 6.2)
    let resultImageData: string;
    let resultFormat: string;
    let modelId: string;

    // Route to appropriate Gemini flow with retry logic (Requirement 2.2, 3.2, 4.2, 5.2, 6.2)
    try {
      const editResult = await withRetry(
        async () => {
          switch (editType) {
            case 'virtual-staging': {
              const { virtualStaging } = await import('@/aws/google-ai/flows/gemini-image-generation');
              const result = await virtualStaging({
                imageData: base64Image,
                imageFormat,
                params: validatedParams as VirtualStagingParams,
              });
              return {
                imageData: result.stagedImageData,
                format: result.imageFormat,
                modelId: 'gemini-2.5-flash-image',
              };
            }

            case 'day-to-dusk': {
              // Use Gemini 2.5 Flash Image for day-to-dusk transformation
              const { dayToDusk } = await import('@/aws/google-ai/flows/gemini-image-generation');
              const result = await dayToDusk({
                imageData: base64Image,
                imageFormat,
                params: validatedParams as DayToDuskParams,
              });
              return {
                imageData: result.duskImageData,
                format: result.imageFormat,
                modelId: 'gemini-2.5-flash-image',
              };
            }

            case 'enhance': {
              const { enhanceImage } = await import('@/aws/google-ai/flows/gemini-image-generation');
              const result = await enhanceImage({
                imageData: base64Image,
                imageFormat,
                params: validatedParams as EnhanceParams,
              });
              return {
                imageData: result.enhancedImageData,
                format: result.imageFormat,
                modelId: 'gemini-2.5-flash-image',
              };
            }

            case 'item-removal': {
              // Use Gemini 2.5 Flash Image for item removal
              const { removeItems } = await import('@/aws/google-ai/flows/gemini-image-generation');
              const result = await removeItems({
                imageData: base64Image,
                imageFormat,
                params: validatedParams as ItemRemovalParams,
              });
              return {
                imageData: result.cleanedImageData,
                format: result.imageFormat,
                modelId: 'gemini-2.5-flash-image',
              };
            }

            case 'virtual-renovation': {
              const { virtualRenovation } = await import('@/aws/google-ai/flows/gemini-image-generation');
              const result = await virtualRenovation({
                imageData: base64Image,
                imageFormat,
                params: validatedParams as VirtualRenovationParams,
              });
              return {
                imageData: result.renovatedImageData,
                format: result.imageFormat,
                modelId: 'gemini-2.5-flash-image',
              };
            }

            default:
              throw new Error(`Unsupported edit type: ${editType}`);
          }
        },
        'edit',
        { maxRetries: 3, timeoutMs: 90000 } // 90 second timeout for edits
      );

      resultImageData = editResult.imageData;
      resultFormat = editResult.format;
      modelId = editResult.modelId;
    } catch (error) {
      // Log detailed error for debugging
      console.error('[Process Edit] Error details:', error);
      console.error('[Process Edit] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[Process Edit] Edit type:', editType);

      // Log error to CloudWatch (Requirement 8.4)
      logError(error, 'process-edit', {
        userId,
        imageId,
        editType,
        operation: 'processEditAction',
      });

      // Return formatted error response with recovery suggestions (Requirement 2.4, 8.4)
      return formatErrorResponse(error, 'process-edit');
    }

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Generate unique edit ID
    const editId = uuidv4();
    const timestamp = Date.now();

    // Generate S3 key for result image
    const resultKey = `users/${userId}/reimagine/edits/${editId}/${timestamp}-${editType}.${resultFormat}`;

    // Convert base64 result to buffer
    const resultBuffer = Buffer.from(resultImageData, 'base64');

    // Determine content type from format
    let contentType = 'image/png';
    if (resultFormat === 'jpeg' || resultFormat === 'jpg') {
      contentType = 'image/jpeg';
    } else if (resultFormat === 'webp') {
      contentType = 'image/webp';
    }

    // Save result to S3 with retry logic
    await withRetry(
      () => uploadFile(resultKey, resultBuffer, contentType),
      'storage',
      { maxRetries: 3 }
    );

    // Create edit record in DynamoDB with status 'preview' (Requirement 12.1)
    // Include parentEditId for chained edits (Requirement 9.3)
    const createdAt = new Date().toISOString();

    await withRetry(
      () => repository.saveEditRecord(userId, editId, {
        imageId: sourceImageId, // Use original image ID for tracking
        editType,
        params: validatedParams,
        sourceKey,
        resultKey,
        status: 'preview',
        createdAt,
        modelId,
        processingTime,
        parentEditId, // Track parent edit for chains (Requirement 9.3)
      }),
      'database',
      { maxRetries: 3 }
    );

    // Generate presigned URL for result (1 hour expiration)
    const { getPresignedUrl } = await import('@/aws/s3');
    const resultUrl = await getPresignedUrl(resultKey, 3600);

    // Return success response with edit ID and result URL
    return {
      success: true,
      editId,
      resultUrl,
    };
  } catch (error) {
    // Log error to CloudWatch (Requirement 8.4)
    logError(error, 'process-edit-save', {
      userId,
      imageId,
      editType,
      operation: 'processEditAction',
    });

    // Return formatted error response with recovery suggestions (Requirement 2.4, 8.4)
    return formatErrorResponse(error, 'process-edit-save');
  }
}

/**
 * Retrieves user's edit history with pagination
 * 
 * This action:
 * 1. Queries DynamoDB for user's edit records
 * 2. Retrieves associated image metadata for original images
 * 3. Generates presigned URLs for both original and result images
 * 4. Returns formatted edit history items
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 * 
 * @param userId - User ID
 * @param limit - Maximum number of items to return (default: 50)
 * @returns Edit history response with array of edit items
 */
export async function getEditHistoryAction(
  userId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  edits?: Array<{
    editId: string;
    imageId: string;
    editType: EditType;
    originalUrl: string;
    resultUrl: string;
    createdAt: string;
    status: string;
    parentEditId?: string;
  }>;
  error?: string;
}> {
  try {
    // Validate user ID
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    // Get repository
    const repository = getRepository();

    // Query edit history from DynamoDB (Requirement 7.2)
    const historyResult = await repository.getEditHistory(userId, limit);

    if (!historyResult.items || historyResult.items.length === 0) {
      return {
        success: true,
        edits: [],
      };
    }

    // Import S3 functions for presigned URLs
    const { getPresignedUrl } = await import('@/aws/s3');

    // Process each edit record to generate presigned URLs (Requirement 7.3, 7.4)
    const edits = await Promise.all(
      historyResult.items.map(async (editRecord: any) => {
        try {
          // Get the original image metadata to get the original S3 key
          const imageMetadata = await repository.getImageMetadata(
            userId,
            editRecord.imageId
          );

          // Generate presigned URLs (1 hour expiration)
          const originalUrl = imageMetadata
            ? await getPresignedUrl(imageMetadata.originalKey, 3600)
            : '';
          const resultUrl = await getPresignedUrl(editRecord.resultKey, 3600);

          return {
            editId: editRecord.editId,
            imageId: editRecord.imageId,
            editType: editRecord.editType,
            originalUrl,
            resultUrl,
            createdAt: editRecord.createdAt,
            status: editRecord.status,
            parentEditId: editRecord.parentEditId,
          };
        } catch (error) {
          console.error(
            `Error processing edit record ${editRecord.editId}:`,
            error
          );
          // Return partial data if URL generation fails
          return {
            editId: editRecord.editId,
            imageId: editRecord.imageId,
            editType: editRecord.editType,
            originalUrl: '',
            resultUrl: '',
            createdAt: editRecord.createdAt,
            status: 'error',
            parentEditId: editRecord.parentEditId,
          };
        }
      })
    );

    return {
      success: true,
      edits,
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 'get-edit-history', {
      userId,
      operation: 'getEditHistoryAction',
    });

    // Return formatted error response
    return formatErrorResponse(error, 'get-edit-history');
  }
}

/**
 * Deletes an edit from both S3 and DynamoDB
 * 
 * This action:
 * 1. Retrieves the edit record to get S3 keys
 * 2. Deletes the result image from S3
 * 3. Deletes the edit record from DynamoDB
 * 4. Ensures both operations succeed for consistency
 * 
 * Requirements: 7.5
 * 
 * @param userId - User ID
 * @param editId - Edit ID to delete
 * @returns Delete response indicating success or failure
 */
export async function deleteEditAction(
  userId: string,
  editId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    if (!editId) {
      return {
        success: false,
        error: 'Edit ID is required.',
      };
    }

    // Get repository
    const repository = getRepository();

    // Retrieve edit record to get S3 key
    const { getEditRecordKeys } = await import('@/aws/dynamodb/keys');
    const keys = getEditRecordKeys(userId, editId);
    const editRecord = await repository.get<any>(keys.PK, keys.SK);

    if (!editRecord) {
      return {
        success: false,
        error: 'Edit not found. It may have already been deleted.',
      };
    }

    // Import S3 delete function
    const { deleteFile } = await import('@/aws/s3');

    // Delete result image from S3 (Requirement 7.5)
    try {
      await deleteFile(editRecord.resultKey);
    } catch (error) {
      console.error('Error deleting S3 file:', error);
      // Continue with DynamoDB deletion even if S3 deletion fails
      // The file might already be deleted or the key might be invalid
    }

    // Delete edit record from DynamoDB (Requirement 7.5)
    await repository.deleteEdit(userId, editId);

    return {
      success: true,
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 'delete-edit', {
      userId,
      editId,
      operation: 'deleteEditAction',
    });

    // Return formatted error response
    return formatErrorResponse(error, 'delete-edit');
  }
}

/**
 * Accepts an edit preview and changes its status to 'completed'
 * 
 * This action:
 * 1. Validates the edit exists and is in 'preview' status
 * 2. Updates the edit status to 'completed'
 * 3. Sets the completedAt timestamp
 * 4. Makes the edit permanent in the user's history
 * 
 * Requirements: 12.3
 * 
 * @param userId - User ID
 * @param editId - Edit ID to accept
 * @returns Accept response indicating success or failure
 */
export async function acceptEditAction(
  userId: string,
  editId: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    if (!editId) {
      return {
        success: false,
        error: 'Edit ID is required.',
      };
    }

    // Get repository
    const repository = getRepository();

    // Retrieve edit record to verify it exists and is in preview status
    const { getEditRecordKeys } = await import('@/aws/dynamodb/keys');
    const keys = getEditRecordKeys(userId, editId);
    const editRecord = await repository.get<any>(keys.PK, keys.SK);

    if (!editRecord) {
      return {
        success: false,
        error: 'Edit not found. It may have been deleted.',
      };
    }

    // Verify edit is in preview status
    if (editRecord.status !== 'preview') {
      return {
        success: false,
        error: `Edit cannot be accepted. Current status: ${editRecord.status}`,
      };
    }

    // Update edit status to 'completed' (Requirement 12.3)
    const completedAt = new Date().toISOString();
    await repository.updateEditStatus(userId, editId, 'completed', {
      completedAt,
    });

    return {
      success: true,
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 'accept-edit', {
      userId,
      editId,
      operation: 'acceptEditAction',
    });

    // Return formatted error response
    return formatErrorResponse(error, 'accept-edit');
  }
}

/**
 * Gets the original image ID for a given edit
 * 
 * This action traverses the edit chain to find the root original image,
 * ensuring users can always access the unedited source.
 * 
 * Requirements: 9.5
 * 
 * @param userId - User ID
 * @param editId - Edit ID to trace back
 * @returns Original image ID and metadata
 */
export async function getOriginalImageAction(
  userId: string,
  editId: string
): Promise<{
  success: boolean;
  imageId?: string;
  originalUrl?: string;
  error?: string;
}> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    if (!editId) {
      return {
        success: false,
        error: 'Edit ID is required.',
      };
    }

    // Get repository
    const repository = getRepository();

    // Retrieve edit record
    const { getEditRecordKeys } = await import('@/aws/dynamodb/keys');
    const keys = getEditRecordKeys(userId, editId);
    const editRecord = await repository.get<any>(keys.PK, keys.SK);

    if (!editRecord) {
      return {
        success: false,
        error: 'Edit not found.',
      };
    }

    // The imageId in the edit record always points to the original image
    // (we maintain this even in chained edits)
    const imageId = editRecord.imageId;

    // Get the original image metadata
    const imageMetadata = await repository.getImageMetadata(userId, imageId);
    if (!imageMetadata) {
      return {
        success: false,
        error: 'Original image not found.',
      };
    }

    // Generate presigned URL for original image
    const { getPresignedUrl } = await import('@/aws/s3');
    const originalUrl = await getPresignedUrl(imageMetadata.originalKey, 3600);

    return {
      success: true,
      imageId,
      originalUrl,
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 'get-original-image', {
      userId,
      editId,
      operation: 'getOriginalImageAction',
    });

    // Return formatted error response
    return formatErrorResponse(error, 'get-original-image');
  }
}

/**
 * Re-analyzes an image to generate new edit suggestions
 * 
 * This action:
 * 1. Retrieves the image metadata from DynamoDB
 * 2. Downloads the original image from S3
 * 3. Invokes AI analysis to generate fresh suggestions
 * 4. Updates the image metadata with new suggestions
 * 5. Returns the new suggestions
 * 
 * Requirements: 13.10
 * 
 * @param userId - User ID
 * @param imageId - Image ID to re-analyze
 * @returns Re-analysis response with new suggestions
 */
export async function reAnalyzeImageAction(
  userId: string,
  imageId: string
): Promise<{
  success: boolean;
  suggestions?: EditSuggestion[];
  error?: string;
}> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    if (!imageId) {
      return {
        success: false,
        error: 'Image ID is required.',
      };
    }

    // Get repository
    const repository = getRepository();

    // Retrieve image metadata
    const imageMetadata = await repository.getImageMetadata(userId, imageId);
    if (!imageMetadata) {
      return {
        success: false,
        error: 'Image not found. Please upload an image first.',
      };
    }

    // Download image from S3
    const { downloadFile } = await import('@/aws/s3');
    const imageBuffer = await downloadFile(imageMetadata.originalKey);

    // Convert to base64 for analysis
    const base64Image = imageBuffer.toString('base64');

    // Determine image format from content type
    let imageFormat: 'jpeg' | 'png' | 'webp' = 'jpeg';
    if (imageMetadata.contentType === 'image/png') {
      imageFormat = 'png';
    } else if (imageMetadata.contentType === 'image/webp') {
      imageFormat = 'webp';
    }

    // Invoke AI analysis to generate new suggestions (Requirement 13.10)
    let suggestions: EditSuggestion[] = [];

    try {
      const { analyzeImage } = await import('@/aws/google-ai/flows/gemini-analyze');
      const analysisResult = await analyzeImage({
        imageData: base64Image,
        imageFormat,
      });

      suggestions = analysisResult.suggestions;

      // Invalidate old cache and cache new suggestions (Performance optimization)
      invalidateSuggestions(imageId);
      cacheSuggestions(imageId, suggestions);
    } catch (error) {
      console.error('Error re-analyzing image:', error);

      // Provide fallback suggestions if analysis fails
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

    // Update image metadata with new suggestions
    await repository.updateImageSuggestions(userId, imageId, suggestions);

    return {
      success: true,
      suggestions,
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 're-analyze-image', {
      userId,
      imageId,
      operation: 'reAnalyzeImageAction',
    });

    // Return formatted error response
    return formatErrorResponse(error, 're-analyze-image');
  }
}

/**
 * Gets the current rate limit status for a user
 * 
 * This action retrieves the current rate limit status without incrementing
 * the counter, allowing users to see their remaining quota.
 * 
 * Requirements: Security considerations
 * 
 * @param userId - User ID
 * @param operation - Operation type ('upload' or 'edit')
 * @returns Rate limit status
 */
export async function getRateLimitStatusAction(
  userId: string,
  operation: 'upload' | 'edit'
): Promise<{
  success: boolean;
  status?: {
    allowed: boolean;
    remaining: number;
    resetAt: string;
    retryAfter?: number;
  };
  error?: string;
}> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    // Get rate limit status
    const status = await getRateLimitStatus(userId, operation);

    return {
      success: true,
      status: {
        allowed: status.allowed,
        remaining: status.remaining,
        resetAt: status.resetAt.toISOString(),
        retryAfter: status.retryAfter,
      },
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 'get-rate-limit-status', {
      userId,
      operation,
    });

    // Return formatted error response
    return formatErrorResponse(error, 'get-rate-limit-status');
  }
}

/**
 * Generates a presigned download URL for an edit result
 * 
 * This action:
 * 1. Retrieves the edit record to get the result S3 key
 * 2. Generates a presigned URL with download headers
 * 3. Creates a filename with edit type and timestamp
 * 4. Returns the download URL and filename
 * 
 * Requirements: 7.3
 * 
 * @param userId - User ID
 * @param editId - Edit ID to download
 * @returns Download response with URL and filename
 */
export async function getDownloadUrlAction(
  userId: string,
  editId: string
): Promise<{
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}> {
  try {
    // Validate inputs
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      };
    }

    if (!editId) {
      return {
        success: false,
        error: 'Edit ID is required.',
      };
    }

    // Get repository
    const repository = getRepository();

    // Retrieve edit record to get S3 key and metadata
    const { getEditRecordKeys } = await import('@/aws/dynamodb/keys');
    const keys = getEditRecordKeys(userId, editId);
    const editRecord = await repository.get<any>(keys.PK, keys.SK);

    if (!editRecord) {
      return {
        success: false,
        error: 'Edit not found. It may have been deleted.',
      };
    }

    // Verify edit belongs to the user
    if (editRecord.userId !== userId) {
      return {
        success: false,
        error: 'Unauthorized access to edit.',
      };
    }

    // Format edit type for filename
    const editTypeFormatted = editRecord.editType
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');

    // Format timestamp for filename (YYYY-MM-DD)
    const date = new Date(editRecord.createdAt);
    const dateFormatted = date.toISOString().split('T')[0];

    // Determine file extension from result key
    const resultKey = editRecord.resultKey;
    const parts = resultKey.split('.');
    const extension = parts.length > 1 ? parts[parts.length - 1] : 'jpg';

    // Create filename with edit type and timestamp (Requirement 7.3)
    const filename = `${editTypeFormatted}-${dateFormatted}.${extension}`;

    // Generate presigned download URL with proper headers (1 hour expiration)
    const downloadUrl = await getPresignedDownloadUrl(
      resultKey,
      filename,
      3600
    );

    return {
      success: true,
      downloadUrl,
      filename,
    };
  } catch (error) {
    // Log error to CloudWatch
    logError(error, 'get-download-url', {
      userId,
      editId,
      operation: 'getDownloadUrlAction',
    });

    // Return formatted error response
    return formatErrorResponse(error, 'get-download-url');
  }
}
