/**
 * Unit tests for Reimagine Image Toolkit server actions
 * 
 * Tests the processEditAction function to ensure:
 * - Parameter validation works correctly
 * - Edit type routing is correct
 * - Error handling is appropriate
 * - S3 and DynamoDB operations are called correctly
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock AWS modules before importing the actions
jest.mock('@/aws/s3', () => ({
  uploadFile: jest.fn().mockResolvedValue('https://s3.example.com/test.png'),
  downloadFile: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
  getPresignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-url'),
  getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://s3.example.com/presigned-download-url'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/aws/dynamodb/repository', () => ({
  getRepository: jest.fn().mockReturnValue({
    getImageMetadata: jest.fn().mockResolvedValue({
      originalKey: 'users/test-user/reimagine/originals/test-image/image.jpg',
      contentType: 'image/jpeg',
      fileName: 'test.jpg',
      fileSize: 1024000,
      width: 1920,
      height: 1080,
      uploadedAt: '2024-01-01T00:00:00.000Z',
    }),
    saveEditRecord: jest.fn().mockResolvedValue(undefined),
    getEditHistory: jest.fn().mockResolvedValue({
      items: [],
      count: 0,
    }),
    get: jest.fn().mockResolvedValue(null),
    deleteEdit: jest.fn().mockResolvedValue(undefined),
    updateEditStatus: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock('@/aws/bedrock/flows/reimagine-staging', () => ({
  virtualStaging: jest.fn().mockResolvedValue({
    stagedImageData: 'base64-staged-image',
    imageFormat: 'png',
  }),
}));

jest.mock('@/aws/bedrock/flows/reimagine-day-to-dusk', () => ({
  dayToDusk: jest.fn().mockResolvedValue({
    duskImageData: 'base64-dusk-image',
    imageFormat: 'png',
  }),
}));

jest.mock('@/aws/bedrock/flows/reimagine-enhance', () => ({
  enhanceImage: jest.fn().mockResolvedValue({
    enhancedImageData: 'base64-enhanced-image',
    imageFormat: 'png',
  }),
}));

jest.mock('@/aws/bedrock/flows/reimagine-remove', () => ({
  removeItems: jest.fn().mockResolvedValue({
    cleanedImageData: 'base64-cleaned-image',
    imageFormat: 'png',
  }),
}));

jest.mock('@/aws/bedrock/flows/reimagine-renovate', () => ({
  virtualRenovation: jest.fn().mockResolvedValue({
    renovatedImageData: 'base64-renovated-image',
    imageFormat: 'png',
  }),
}));

// Import after mocks are set up
import { 
  processEditAction,
  getEditHistoryAction,
  deleteEditAction,
  acceptEditAction,
  getOriginalImageAction,
  getDownloadUrlAction,
} from '../reimagine-actions';

describe('processEditAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should reject missing userId', async () => {
      const result = await processEditAction(
        '',
        'test-image-id',
        'enhance',
        { autoAdjust: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });

    it('should reject missing imageId', async () => {
      const result = await processEditAction(
        'test-user-id',
        '',
        'enhance',
        { autoAdjust: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Image ID is required');
    });

    it('should reject invalid edit parameters', async () => {
      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'enhance',
        { autoAdjust: 'invalid' } as any // Invalid type
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Edit Type Routing', () => {
    it('should process virtual-staging edit correctly', async () => {
      const params = {
        roomType: 'living-room' as const,
        style: 'modern' as const,
      };

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'virtual-staging',
        params
      );

      expect(result.success).toBe(true);
      expect(result.editId).toBeDefined();
      expect(result.resultUrl).toBeDefined();
    });

    it('should process day-to-dusk edit correctly', async () => {
      const params = {
        intensity: 'moderate' as const,
      };

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'day-to-dusk',
        params
      );

      expect(result.success).toBe(true);
      expect(result.editId).toBeDefined();
      expect(result.resultUrl).toBeDefined();
    });

    it('should process enhance edit correctly', async () => {
      const params = {
        autoAdjust: true,
        brightness: 10,
        contrast: 5,
      };

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'enhance',
        params
      );

      expect(result.success).toBe(true);
      expect(result.editId).toBeDefined();
      expect(result.resultUrl).toBeDefined();
    });

    it('should process item-removal edit correctly', async () => {
      const params = {
        maskData: 'base64-mask-data',
        objects: ['trash can', 'power lines'],
      };

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'item-removal',
        params
      );

      expect(result.success).toBe(true);
      expect(result.editId).toBeDefined();
      expect(result.resultUrl).toBeDefined();
    });

    it('should process virtual-renovation edit correctly', async () => {
      const params = {
        description: 'Update kitchen with modern appliances and new countertops',
        style: 'modern',
      };

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'virtual-renovation',
        params
      );

      expect(result.success).toBe(true);
      expect(result.editId).toBeDefined();
      expect(result.resultUrl).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing source image', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();
      (mockRepo.getImageMetadata as jest.Mock).mockResolvedValueOnce(null);

      const result = await processEditAction(
        'test-user-id',
        'non-existent-image',
        'enhance',
        { autoAdjust: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Source image not found');
    });

    it('should handle Bedrock processing errors', async () => {
      const { enhanceImage } = await import('@/aws/bedrock/flows/reimagine-enhance');
      (enhanceImage as jest.Mock).mockRejectedValueOnce(
        new Error('Bedrock service unavailable')
      );

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'enhance',
        { autoAdjust: true }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('S3 and DynamoDB Integration', () => {
    it('should save result to S3 and create edit record', async () => {
      const { uploadFile } = await import('@/aws/s3');
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'enhance',
        { autoAdjust: true }
      );

      expect(result.success).toBe(true);
      expect(uploadFile).toHaveBeenCalled();
      expect(mockRepo.saveEditRecord).toHaveBeenCalledWith(
        'test-user-id',
        expect.any(String),
        expect.objectContaining({
          imageId: 'test-image-id',
          editType: 'enhance',
          status: 'preview',
          modelId: 'amazon.titan-image-generator-v1',
        })
      );
    });

    it('should generate presigned URL for result', async () => {
      const { getPresignedUrl } = await import('@/aws/s3');

      const result = await processEditAction(
        'test-user-id',
        'test-image-id',
        'enhance',
        { autoAdjust: true }
      );

      expect(result.success).toBe(true);
      expect(getPresignedUrl).toHaveBeenCalled();
      expect(result.resultUrl).toBeDefined();
    });
  });

  describe('Model Selection', () => {
    it('should use Titan model for virtual-staging', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      await processEditAction(
        'test-user-id',
        'test-image-id',
        'virtual-staging',
        { roomType: 'living-room', style: 'modern' }
      );

      expect(mockRepo.saveEditRecord).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          modelId: 'amazon.titan-image-generator-v1',
        })
      );
    });

    it('should use SDXL model for item-removal', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      await processEditAction(
        'test-user-id',
        'test-image-id',
        'item-removal',
        { maskData: 'base64-mask', objects: ['object'] }
      );

      expect(mockRepo.saveEditRecord).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          modelId: 'stability.stable-diffusion-xl-v1',
        })
      );
    });
  });
});

describe('getEditHistoryAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject missing userId', async () => {
    const result = await getEditHistoryAction('');

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID is required');
  });

  it('should return empty array when no edits exist', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();
    (mockRepo.getEditHistory as jest.Mock).mockResolvedValueOnce({
      items: [],
      count: 0,
    });

    const result = await getEditHistoryAction('test-user-id');

    expect(result.success).toBe(true);
    expect(result.edits).toEqual([]);
  });

  it('should retrieve edit history with presigned URLs', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();
    
    const mockEdits = [
      {
        editId: 'edit-1',
        imageId: 'image-1',
        editType: 'enhance',
        resultKey: 'users/test-user/reimagine/edits/edit-1/result.png',
        createdAt: '2024-01-01T00:00:00.000Z',
        status: 'completed',
      },
      {
        editId: 'edit-2',
        imageId: 'image-2',
        editType: 'virtual-staging',
        resultKey: 'users/test-user/reimagine/edits/edit-2/result.png',
        createdAt: '2024-01-02T00:00:00.000Z',
        status: 'preview',
        parentEditId: 'edit-1',
      },
    ];

    (mockRepo.getEditHistory as jest.Mock).mockResolvedValueOnce({
      items: mockEdits,
      count: 2,
    });

    const result = await getEditHistoryAction('test-user-id', 50);

    expect(result.success).toBe(true);
    expect(result.edits).toHaveLength(2);
    expect(result.edits![0]).toMatchObject({
      editId: 'edit-1',
      imageId: 'image-1',
      editType: 'enhance',
      status: 'completed',
    });
    expect(result.edits![0].originalUrl).toBeDefined();
    expect(result.edits![0].resultUrl).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();
    (mockRepo.getEditHistory as jest.Mock).mockRejectedValueOnce(
      new Error('DynamoDB error')
    );

    const result = await getEditHistoryAction('test-user-id');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should respect limit parameter', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    await getEditHistoryAction('test-user-id', 25);

    expect(mockRepo.getEditHistory).toHaveBeenCalledWith('test-user-id', 25);
  });
});

describe('deleteEditAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject missing userId', async () => {
    const result = await deleteEditAction('', 'edit-id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID is required');
  });

  it('should reject missing editId', async () => {
    const result = await deleteEditAction('test-user-id', '');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Edit ID is required');
  });

  it('should delete edit from both S3 and DynamoDB', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const { deleteFile } = await import('@/aws/s3');
    const mockRepo = getRepository();

    // Mock get to return an edit record
    (mockRepo.get as jest.Mock).mockResolvedValueOnce({
      editId: 'edit-1',
      resultKey: 'users/test-user/reimagine/edits/edit-1/result.png',
      status: 'completed',
    });

    const result = await deleteEditAction('test-user-id', 'edit-1');

    expect(result.success).toBe(true);
    expect(deleteFile).toHaveBeenCalledWith(
      'users/test-user/reimagine/edits/edit-1/result.png'
    );
    expect(mockRepo.deleteEdit).toHaveBeenCalledWith('test-user-id', 'edit-1');
  });

  it('should handle non-existent edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();
    (mockRepo.get as jest.Mock).mockResolvedValueOnce(null);

    const result = await deleteEditAction('test-user-id', 'non-existent');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Edit not found');
  });

  it('should continue with DynamoDB deletion even if S3 deletion fails', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const { deleteFile } = await import('@/aws/s3');
    const mockRepo = getRepository();

    (mockRepo.get as jest.Mock).mockResolvedValueOnce({
      editId: 'edit-1',
      resultKey: 'users/test-user/reimagine/edits/edit-1/result.png',
    });

    (deleteFile as jest.Mock).mockRejectedValueOnce(new Error('S3 error'));

    const result = await deleteEditAction('test-user-id', 'edit-1');

    expect(result.success).toBe(true);
    expect(mockRepo.deleteEdit).toHaveBeenCalledWith('test-user-id', 'edit-1');
  });
});

describe('acceptEditAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject missing userId', async () => {
    const result = await acceptEditAction('', 'edit-id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID is required');
  });

  it('should reject missing editId', async () => {
    const result = await acceptEditAction('test-user-id', '');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Edit ID is required');
  });

  it('should accept preview edit and update status to completed', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    (mockRepo.get as jest.Mock).mockResolvedValueOnce({
      editId: 'edit-1',
      status: 'preview',
    });

    const result = await acceptEditAction('test-user-id', 'edit-1');

    expect(result.success).toBe(true);
    expect(mockRepo.updateEditStatus).toHaveBeenCalledWith(
      'test-user-id',
      'edit-1',
      'completed',
      expect.objectContaining({
        completedAt: expect.any(String),
      })
    );
  });

  it('should handle non-existent edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();
    (mockRepo.get as jest.Mock).mockResolvedValueOnce(null);

    const result = await acceptEditAction('test-user-id', 'non-existent');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Edit not found');
  });

  it('should reject accepting non-preview edits', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    (mockRepo.get as jest.Mock).mockResolvedValueOnce({
      editId: 'edit-1',
      status: 'completed',
    });

    const result = await acceptEditAction('test-user-id', 'edit-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('cannot be accepted');
    expect(result.error).toContain('completed');
  });

  it('should handle errors gracefully', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    (mockRepo.get as jest.Mock).mockResolvedValueOnce({
      editId: 'edit-1',
      status: 'preview',
    });

    (mockRepo.updateEditStatus as jest.Mock).mockRejectedValueOnce(
      new Error('DynamoDB error')
    );

    const result = await acceptEditAction('test-user-id', 'edit-1');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Chained Edit Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processEditAction with parentEditId', () => {
    it('should process chained edit using parent edit result as source', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const { downloadFile } = await import('@/aws/s3');
      const mockRepo = getRepository();

      // Mock parent edit record
      (mockRepo.get as jest.Mock).mockResolvedValueOnce({
        editId: 'parent-edit-id',
        imageId: 'original-image-id',
        resultKey: 'users/test-user/reimagine/edits/parent-edit-id/result.png',
        status: 'completed',
        editType: 'enhance',
      });

      const result = await processEditAction(
        'test-user-id',
        'original-image-id',
        'virtual-staging',
        { roomType: 'living-room', style: 'modern' },
        'parent-edit-id' // Parent edit ID for chaining
      );

      expect(result.success).toBe(true);
      expect(result.editId).toBeDefined();
      expect(result.resultUrl).toBeDefined();

      // Verify it downloaded the parent edit result, not the original
      expect(downloadFile).toHaveBeenCalledWith(
        'users/test-user/reimagine/edits/parent-edit-id/result.png'
      );

      // Verify the edit record includes parentEditId
      expect(mockRepo.saveEditRecord).toHaveBeenCalledWith(
        'test-user-id',
        expect.any(String),
        expect.objectContaining({
          imageId: 'original-image-id', // Should maintain original image ID
          parentEditId: 'parent-edit-id',
          editType: 'virtual-staging',
          status: 'preview',
        })
      );
    });

    it('should reject chained edit if parent edit not found', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      // Mock parent edit not found
      (mockRepo.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await processEditAction(
        'test-user-id',
        'original-image-id',
        'enhance',
        { autoAdjust: true },
        'non-existent-parent'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Parent edit not found');
    });

    it('should reject chained edit if parent edit not completed', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      // Mock parent edit in preview status
      (mockRepo.get as jest.Mock).mockResolvedValueOnce({
        editId: 'parent-edit-id',
        imageId: 'original-image-id',
        resultKey: 'users/test-user/reimagine/edits/parent-edit-id/result.png',
        status: 'preview', // Not completed
        editType: 'enhance',
      });

      const result = await processEditAction(
        'test-user-id',
        'original-image-id',
        'virtual-staging',
        { roomType: 'living-room', style: 'modern' },
        'parent-edit-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('must be completed');
    });

    it('should maintain original image ID through edit chain', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      // Mock parent edit that itself was a chained edit
      (mockRepo.get as jest.Mock).mockResolvedValueOnce({
        editId: 'parent-edit-id',
        imageId: 'original-image-id', // Original image from first upload
        resultKey: 'users/test-user/reimagine/edits/parent-edit-id/result.png',
        status: 'completed',
        editType: 'enhance',
        parentEditId: 'grandparent-edit-id', // This was also a chained edit
      });

      const result = await processEditAction(
        'test-user-id',
        'original-image-id',
        'day-to-dusk',
        { intensity: 'moderate' },
        'parent-edit-id'
      );

      expect(result.success).toBe(true);

      // Verify the new edit maintains the original image ID
      expect(mockRepo.saveEditRecord).toHaveBeenCalledWith(
        'test-user-id',
        expect.any(String),
        expect.objectContaining({
          imageId: 'original-image-id', // Should still reference the original
          parentEditId: 'parent-edit-id',
        })
      );
    });
  });

  describe('getOriginalImageAction', () => {
    it('should retrieve original image for an edit', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const { getPresignedUrl } = await import('@/aws/s3');
      const mockRepo = getRepository();

      // Mock edit record
      (mockRepo.get as jest.Mock).mockResolvedValueOnce({
        editId: 'edit-1',
        imageId: 'original-image-id',
        editType: 'enhance',
      });

      // Mock image metadata
      (mockRepo.getImageMetadata as jest.Mock).mockResolvedValueOnce({
        imageId: 'original-image-id',
        originalKey: 'users/test-user/reimagine/originals/original-image-id/image.jpg',
        fileName: 'original.jpg',
      });

      const result = await getOriginalImageAction('test-user-id', 'edit-1');

      expect(result.success).toBe(true);
      expect(result.imageId).toBe('original-image-id');
      expect(result.originalUrl).toBeDefined();
      expect(getPresignedUrl).toHaveBeenCalledWith(
        'users/test-user/reimagine/originals/original-image-id/image.jpg',
        3600
      );
    });

    it('should retrieve original image for chained edit', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      // Mock chained edit record (maintains original image ID)
      (mockRepo.get as jest.Mock).mockResolvedValueOnce({
        editId: 'chained-edit-id',
        imageId: 'original-image-id', // Points to original
        editType: 'virtual-staging',
        parentEditId: 'parent-edit-id',
      });

      // Mock image metadata
      (mockRepo.getImageMetadata as jest.Mock).mockResolvedValueOnce({
        imageId: 'original-image-id',
        originalKey: 'users/test-user/reimagine/originals/original-image-id/image.jpg',
        fileName: 'original.jpg',
      });

      const result = await getOriginalImageAction('test-user-id', 'chained-edit-id');

      expect(result.success).toBe(true);
      expect(result.imageId).toBe('original-image-id');
      expect(result.originalUrl).toBeDefined();
    });

    it('should reject missing userId', async () => {
      const result = await getOriginalImageAction('', 'edit-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('User ID is required');
    });

    it('should reject missing editId', async () => {
      const result = await getOriginalImageAction('test-user-id', '');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Edit ID is required');
    });

    it('should handle non-existent edit', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();
      (mockRepo.get as jest.Mock).mockResolvedValueOnce(null);

      const result = await getOriginalImageAction('test-user-id', 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Edit not found');
    });

    it('should handle non-existent original image', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      (mockRepo.get as jest.Mock).mockResolvedValueOnce({
        editId: 'edit-1',
        imageId: 'original-image-id',
      });

      (mockRepo.getImageMetadata as jest.Mock).mockResolvedValueOnce(null);

      const result = await getOriginalImageAction('test-user-id', 'edit-1');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Original image not found');
    });
  });

  describe('Edit History with Chains', () => {
    it('should include parentEditId in edit history items', async () => {
      const { getRepository } = await import('@/aws/dynamodb/repository');
      const mockRepo = getRepository();

      const mockEdits = [
        {
          editId: 'edit-1',
          imageId: 'image-1',
          editType: 'enhance',
          resultKey: 'users/test-user/reimagine/edits/edit-1/result.png',
          createdAt: '2024-01-01T00:00:00.000Z',
          status: 'completed',
        },
        {
          editId: 'edit-2',
          imageId: 'image-1', // Same original image
          editType: 'virtual-staging',
          resultKey: 'users/test-user/reimagine/edits/edit-2/result.png',
          createdAt: '2024-01-02T00:00:00.000Z',
          status: 'completed',
          parentEditId: 'edit-1', // Chained from edit-1
        },
        {
          editId: 'edit-3',
          imageId: 'image-1', // Same original image
          editType: 'day-to-dusk',
          resultKey: 'users/test-user/reimagine/edits/edit-3/result.png',
          createdAt: '2024-01-03T00:00:00.000Z',
          status: 'completed',
          parentEditId: 'edit-2', // Chained from edit-2
        },
      ];

      (mockRepo.getEditHistory as jest.Mock).mockResolvedValueOnce({
        items: mockEdits,
        count: 3,
      });

      const result = await getEditHistoryAction('test-user-id', 50);

      expect(result.success).toBe(true);
      expect(result.edits).toHaveLength(3);
      
      // Verify chain structure
      expect(result.edits![0].parentEditId).toBeUndefined();
      expect(result.edits![1].parentEditId).toBe('edit-1');
      expect(result.edits![2].parentEditId).toBe('edit-2');
      
      // Verify all maintain same original image ID
      expect(result.edits![0].imageId).toBe('image-1');
      expect(result.edits![1].imageId).toBe('image-1');
      expect(result.edits![2].imageId).toBe('image-1');
    });
  });
});

describe('getDownloadUrlAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject missing userId', async () => {
    const result = await getDownloadUrlAction('', 'edit-id');

    expect(result.success).toBe(false);
    expect(result.error).toContain('User ID is required');
  });

  it('should reject missing editId', async () => {
    const result = await getDownloadUrlAction('test-user-id', '');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Edit ID is required');
  });

  it('should generate download URL with proper filename for enhance edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const { getPresignedDownloadUrl } = await import('@/aws/s3');
    const mockRepo = getRepository();

    // Mock edit record
    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-1',
      userId: 'test-user-id',
      imageId: 'image-1',
      editType: 'enhance',
      resultKey: 'users/test-user-id/reimagine/edits/edit-1/result.png',
      createdAt: '2024-01-15T10:30:00.000Z',
      status: 'completed',
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-1');

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBeDefined();
    expect(result.downloadUrl).toContain('response-content-disposition=attachment');
    expect(result.filename).toBe('Enhance-2024-01-15.png');
  });

  it('should generate download URL with proper filename for virtual-staging edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-2',
      userId: 'test-user-id',
      imageId: 'image-2',
      editType: 'virtual-staging',
      resultKey: 'users/test-user-id/reimagine/edits/edit-2/result.jpg',
      createdAt: '2024-02-20T14:45:00.000Z',
      status: 'completed',
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-2');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('Virtual-Staging-2024-02-20.jpg');
  });

  it('should generate download URL with proper filename for day-to-dusk edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-3',
      userId: 'test-user-id',
      imageId: 'image-3',
      editType: 'day-to-dusk',
      resultKey: 'users/test-user-id/reimagine/edits/edit-3/result.webp',
      createdAt: '2024-03-10T08:15:00.000Z',
      status: 'completed',
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-3');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('Day-To-Dusk-2024-03-10.webp');
  });

  it('should generate download URL with proper filename for item-removal edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-4',
      userId: 'test-user-id',
      imageId: 'image-4',
      editType: 'item-removal',
      resultKey: 'users/test-user-id/reimagine/edits/edit-4/result.png',
      createdAt: '2024-04-05T16:20:00.000Z',
      status: 'completed',
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-4');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('Item-Removal-2024-04-05.png');
  });

  it('should generate download URL with proper filename for virtual-renovation edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-5',
      userId: 'test-user-id',
      imageId: 'image-5',
      editType: 'virtual-renovation',
      resultKey: 'users/test-user-id/reimagine/edits/edit-5/result.jpg',
      createdAt: '2024-05-12T12:00:00.000Z',
      status: 'completed',
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-5');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('Virtual-Renovation-2024-05-12.jpg');
  });

  it('should handle non-existent edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();
    mockRepo.get = jest.fn().mockResolvedValueOnce(null);

    const result = await getDownloadUrlAction('test-user-id', 'non-existent');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Edit not found');
  });

  it('should reject unauthorized access to edit', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    // Mock edit record belonging to different user
    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-1',
      userId: 'different-user-id',
      imageId: 'image-1',
      editType: 'enhance',
      resultKey: 'users/different-user-id/reimagine/edits/edit-1/result.png',
      createdAt: '2024-01-15T10:30:00.000Z',
      status: 'completed',
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-1');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized access');
  });

  it('should handle errors gracefully', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    mockRepo.get = jest.fn().mockRejectedValueOnce(
      new Error('DynamoDB error')
    );

    const result = await getDownloadUrlAction('test-user-id', 'edit-1');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should default to jpg extension if extension cannot be determined', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-6',
      userId: 'test-user-id',
      imageId: 'image-6',
      editType: 'enhance',
      resultKey: 'users/test-user-id/reimagine/edits/edit-6/result', // No extension
      createdAt: '2024-06-01T09:00:00.000Z',
      status: 'completed',
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-6');

    expect(result.success).toBe(true);
    expect(result.filename).toBe('Enhance-2024-06-01.jpg'); // Default to jpg
  });

  it('should work with preview status edits', async () => {
    const { getRepository } = await import('@/aws/dynamodb/repository');
    const mockRepo = getRepository();

    mockRepo.get = jest.fn().mockResolvedValueOnce({
      editId: 'edit-7',
      userId: 'test-user-id',
      imageId: 'image-7',
      editType: 'enhance',
      resultKey: 'users/test-user-id/reimagine/edits/edit-7/result.png',
      createdAt: '2024-07-01T11:00:00.000Z',
      status: 'preview', // Preview status
    });

    const result = await getDownloadUrlAction('test-user-id', 'edit-7');

    expect(result.success).toBe(true);
    expect(result.downloadUrl).toBeDefined();
    expect(result.filename).toBeDefined();
  });
});
