/**
 * Tests for AWS S3 Client Module
 * 
 * Note: These tests require Jest to be configured.
 * To run these tests:
 * 1. Install Jest: npm install --save-dev jest @types/jest ts-jest
 * 2. Configure Jest in package.json or jest.config.js
 * 3. Run: npm test src/aws/s3/client.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  getS3Client,
  resetS3Client,
  uploadFile,
  downloadFile,
  getPresignedUrl,
  getPresignedUploadUrl,
  deleteFile,
  listFiles,
  listFilesDetailed,
  fileExists,
  copyFile,
} from './client';
import { resetConfig } from '../config';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    HeadObjectCommand: jest.fn(),
    CopyObjectCommand: jest.fn(),
    CreateMultipartUploadCommand: jest.fn(),
    UploadPartCommand: jest.fn(),
    CompleteMultipartUploadCommand: jest.fn(),
    AbortMultipartUploadCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.example.com'),
  };
});

describe('S3 Client', () => {
  const originalEnv = process.env;
  let mockSend: jest.Mock;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    Object.assign(process.env, {
      NODE_ENV: 'development',
      USE_LOCAL_AWS: 'true',
      AWS_REGION: 'us-east-1',
      S3_BUCKET_NAME: 'test-bucket',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
    });
    
    jest.clearAllMocks();
    resetConfig();
    resetS3Client();
    
    // Setup mock send function
    const { S3Client } = require('@aws-sdk/client-s3');
    mockSend = jest.fn();
    S3Client.mockImplementation(() => ({
      send: mockSend,
    }));
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    resetConfig();
    resetS3Client();
  });

  describe('Client Initialization', () => {
    it('should create S3 client with local configuration', () => {
      const client = getS3Client();
      expect(client).toBeDefined();
    });

    it('should reuse the same client instance', () => {
      const client1 = getS3Client();
      const client2 = getS3Client();
      expect(client1).toBe(client2);
    });

    it('should create new client after reset', () => {
      const client1 = getS3Client();
      resetS3Client();
      const client2 = getS3Client();
      expect(client1).not.toBe(client2);
    });
  });

  describe('File Upload', () => {
    it('should upload a small file', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const buffer = Buffer.from('test content');
      const key = 'test/small-file.txt';

      const url = await uploadFile(key, buffer, 'text/plain');
      expect(url).toContain(key);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should upload file with metadata', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const buffer = Buffer.from('test content');
      const key = 'test/file-with-metadata.txt';
      const metadata = {
        uploadedBy: 'user123',
        originalName: 'test.txt',
      };

      const url = await uploadFile(key, buffer, 'text/plain', metadata);
      expect(url).toContain(key);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should handle Blob input', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const key = 'test/blob-file.txt';

      const url = await uploadFile(key, blob, 'text/plain');
      expect(url).toContain(key);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('File Download', () => {
    it('should download an uploaded file', async () => {
      const content = 'test download content';
      const buffer = Buffer.from(content);
      const key = 'test/download-file.txt';

      // Mock upload
      mockSend.mockResolvedValueOnce({});
      await uploadFile(key, buffer, 'text/plain');

      // Mock download with async iterable stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield buffer;
        },
      };
      mockSend.mockResolvedValueOnce({ Body: mockStream });

      // Download
      const downloaded = await downloadFile(key);
      expect(downloaded.toString()).toBe(content);
    });

    it('should throw error for non-existent file', async () => {
      const key = 'test/non-existent-file.txt';
      
      const error = new Error('NoSuchKey');
      (error as any).name = 'NoSuchKey';
      mockSend.mockRejectedValueOnce(error);

      await expect(downloadFile(key)).rejects.toThrow();
    });
  });

  describe('Presigned URLs', () => {
    it('should generate presigned download URL', async () => {
      const key = 'test/presigned-file.txt';
      const buffer = Buffer.from('test content');

      // Mock upload
      mockSend.mockResolvedValueOnce({});
      await uploadFile(key, buffer, 'text/plain');

      // Generate presigned URL (mocked in module)
      const url = await getPresignedUrl(key, 3600);
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('should generate presigned upload URL', async () => {
      const key = 'test/presigned-upload.txt';

      const url = await getPresignedUploadUrl(key, 'text/plain', 3600);
      expect(url).toBeDefined();
      expect(typeof url).toBe('string');
    });

    it('should use custom expiration time', async () => {
      const key = 'test/custom-expiry.txt';
      const buffer = Buffer.from('test content');

      mockSend.mockResolvedValueOnce({});
      await uploadFile(key, buffer, 'text/plain');

      const url = await getPresignedUrl(key, 300); // 5 minutes
      expect(url).toBeDefined();
    });
  });

  describe('File Deletion', () => {
    it('should delete an uploaded file', async () => {
      const key = 'test/delete-file.txt';
      const buffer = Buffer.from('test content');

      // Mock upload
      mockSend.mockResolvedValueOnce({});
      await uploadFile(key, buffer, 'text/plain');

      // Mock delete
      mockSend.mockResolvedValueOnce({});
      await deleteFile(key);

      // Mock fileExists check (file not found)
      const error = new Error('NotFound');
      (error as any).name = 'NotFound';
      (error as any).$metadata = { httpStatusCode: 404 };
      mockSend.mockRejectedValueOnce(error);
      
      // Verify deletion
      const exists = await fileExists(key);
      expect(exists).toBe(false);
    });

    it('should not throw error when deleting non-existent file', async () => {
      const key = 'test/non-existent-delete.txt';

      // Mock successful delete (S3 doesn't error on deleting non-existent files)
      mockSend.mockResolvedValueOnce({});

      // Should not throw
      await expect(deleteFile(key)).resolves.not.toThrow();
    });
  });

  describe('File Listing', () => {
    it('should list files with prefix', async () => {
      // Mock list response
      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: 'test/list/file1.txt' },
          { Key: 'test/list/file2.txt' },
          { Key: 'test/list/file3.txt' },
        ],
      });
      
      const files = await listFiles('test/list/');
      expect(files.length).toBe(3);
      expect(files).toContain('test/list/file1.txt');
      expect(files).toContain('test/list/file2.txt');
      expect(files).toContain('test/list/file3.txt');
    });

    it('should list files with detailed information', async () => {
      // Mock list response with details
      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: 'test/list/file1.txt', Size: 100, LastModified: new Date(), ETag: '"abc123"' },
          { Key: 'test/list/file2.txt', Size: 200, LastModified: new Date(), ETag: '"def456"' },
          { Key: 'test/list/file3.txt', Size: 300, LastModified: new Date(), ETag: '"ghi789"' },
        ],
      });
      
      const files = await listFilesDetailed('test/list/');
      expect(files.length).toBe(3);
      
      files.forEach(file => {
        expect(file).toHaveProperty('key');
        expect(file).toHaveProperty('size');
        expect(file).toHaveProperty('lastModified');
        expect(file).toHaveProperty('etag');
      });
    });

    it('should return empty array for non-existent prefix', async () => {
      // Mock empty list response
      mockSend.mockResolvedValueOnce({
        Contents: [],
      });
      
      const files = await listFiles('non-existent-prefix/');
      expect(files).toEqual([]);
    });

    it('should respect maxKeys parameter', async () => {
      // Mock list response with limited results
      mockSend.mockResolvedValueOnce({
        Contents: [
          { Key: 'test/list/file1.txt' },
          { Key: 'test/list/file2.txt' },
        ],
      });
      
      const files = await listFiles('test/list/', 2);
      expect(files.length).toBe(2);
    });
  });

  describe('File Existence Check', () => {
    it('should return true for existing file', async () => {
      const key = 'test/exists-file.txt';
      
      // Mock successful head object (file exists)
      mockSend.mockResolvedValueOnce({});

      const exists = await fileExists(key);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const key = 'test/non-existent-check.txt';

      // Mock 404 error (file doesn't exist)
      const error = new Error('NotFound');
      (error as any).name = 'NotFound';
      (error as any).$metadata = { httpStatusCode: 404 };
      mockSend.mockRejectedValueOnce(error);

      const exists = await fileExists(key);
      expect(exists).toBe(false);
    });
  });

  describe('File Copy', () => {
    it('should copy file within bucket', async () => {
      const sourceKey = 'test/copy/source.txt';
      const destKey = 'test/copy/destination.txt';
      const content = 'copy test content';

      // Mock upload
      mockSend.mockResolvedValueOnce({});
      await uploadFile(sourceKey, Buffer.from(content), 'text/plain');

      // Mock copy
      mockSend.mockResolvedValueOnce({});
      await copyFile(sourceKey, destKey);

      // Mock fileExists checks
      mockSend.mockResolvedValueOnce({}); // source exists
      mockSend.mockResolvedValueOnce({}); // dest exists
      
      // Verify both exist
      const sourceExists = await fileExists(sourceKey);
      const destExists = await fileExists(destKey);
      expect(sourceExists).toBe(true);
      expect(destExists).toBe(true);

      // Mock download with async iterable stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from(content);
        },
      };
      mockSend.mockResolvedValueOnce({ Body: mockStream });
      
      // Verify content is the same
      const destContent = await downloadFile(destKey);
      expect(destContent.toString()).toBe(content);
    });
  });

  describe('Multipart Upload', () => {
    it('should use multipart upload for large files', async () => {
      // Create a buffer larger than 5MB
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
      largeBuffer.fill('a');
      const key = 'test/large-file.bin';

      // Mock multipart upload sequence
      mockSend.mockResolvedValueOnce({ UploadId: 'test-upload-id' }); // CreateMultipartUpload
      mockSend.mockResolvedValueOnce({ ETag: '"part1"' }); // UploadPart 1
      mockSend.mockResolvedValueOnce({ ETag: '"part2"' }); // UploadPart 2
      mockSend.mockResolvedValueOnce({}); // CompleteMultipartUpload

      const url = await uploadFile(key, largeBuffer, 'application/octet-stream');
      expect(url).toContain(key);

      // Mock fileExists check
      mockSend.mockResolvedValueOnce({});
      
      // Verify file exists
      const exists = await fileExists(key);
      expect(exists).toBe(true);

      // Mock delete
      mockSend.mockResolvedValueOnce({});
      
      // Cleanup
      await deleteFile(key);
    });
  });

  describe('Round Trip', () => {
    it('should preserve file content through upload and download', async () => {
      const originalContent = 'This is a test file with special characters: 你好世界 🚀';
      const buffer = Buffer.from(originalContent, 'utf-8');
      const key = 'test/round-trip.txt';

      // Mock upload
      mockSend.mockResolvedValueOnce({});
      await uploadFile(key, buffer, 'text/plain; charset=utf-8');

      // Mock download with async iterable stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield buffer;
        },
      };
      mockSend.mockResolvedValueOnce({ Body: mockStream });
      
      // Download
      const downloaded = await downloadFile(key);

      // Verify
      expect(downloaded.toString('utf-8')).toBe(originalContent);

      // Mock cleanup
      mockSend.mockResolvedValueOnce({});
      await deleteFile(key);
    });

    it('should preserve binary data', async () => {
      const binaryData = Buffer.from([0x00, 0x01, 0x02, 0xFF, 0xFE, 0xFD]);
      const key = 'test/binary-round-trip.bin';

      // Mock upload
      mockSend.mockResolvedValueOnce({});
      await uploadFile(key, binaryData, 'application/octet-stream');

      // Mock download with async iterable stream
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield binaryData;
        },
      };
      mockSend.mockResolvedValueOnce({ Body: mockStream });
      
      // Download
      const downloaded = await downloadFile(key);

      // Verify
      expect(downloaded).toEqual(binaryData);

      // Mock cleanup
      mockSend.mockResolvedValueOnce({});
      await deleteFile(key);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid bucket configuration', async () => {
      process.env.S3_BUCKET_NAME = '';
      resetConfig();
      resetS3Client();

      const buffer = Buffer.from('test');
      
      // Mock error response
      mockSend.mockRejectedValueOnce(new Error('Bucket name is required'));
      
      await expect(
        uploadFile('test/error.txt', buffer, 'text/plain')
      ).rejects.toThrow();
    });

    it('should handle network errors gracefully', async () => {
      const buffer = Buffer.from('test');
      
      // Mock network error
      const networkError = new Error('Network error');
      (networkError as any).code = 'NetworkingError';
      mockSend.mockRejectedValueOnce(networkError);
      
      await expect(
        uploadFile('test/error.txt', buffer, 'text/plain')
      ).rejects.toThrow('Network error');
    });
  });
});
