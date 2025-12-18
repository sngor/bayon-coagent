/**
 * AWS S3 Client Module
 * 
 * This module provides S3 storage operations including:
 * - File upload (with multipart support for large files)
 * - File download
 * - Presigned URL generation
 * - File deletion
 * - File listing
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type DeleteObjectCommandInput,
  type ListObjectsV2CommandInput,
  CopyObjectCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getConfig, getAWSCredentials } from '../config';
import { getConnectionPoolManager } from '../performance/connection-pool';

// Multipart upload threshold: 5MB
const MULTIPART_THRESHOLD = 5 * 1024 * 1024;
// Part size for multipart uploads: 5MB
const PART_SIZE = 5 * 1024 * 1024;

let s3Client: S3Client | null = null;

/**
 * Gets or creates the S3 client instance with connection pooling
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    const config = getConfig();
    const credentials = getAWSCredentials();

    const clientConfig: any = {
      region: config.s3.region,
      endpoint: config.s3.endpoint,
      forcePathStyle: config.environment === 'local', // Required for LocalStack
    };

    // Add credentials if available, otherwise let AWS SDK use default credential chain
    if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      };
    }

    // Add optimized request handler with connection pooling
    // Only in Node.js environment (not in browser or edge runtime)
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const poolManager = getConnectionPoolManager({
          maxSockets: 50,
          maxFreeSockets: 10,
          keepAlive: true,
          keepAliveTimeout: 60000,
        });
        clientConfig.requestHandler = poolManager.getRequestHandler();
      } catch (error) {
        // Fallback to default if connection pooling fails
        console.warn('Failed to initialize connection pooling for S3:', error);
      }
    }

    s3Client = new S3Client(clientConfig);
  }

  return s3Client;
}

/**
 * Resets the S3 client instance
 * Useful for testing or when configuration changes
 */
export function resetS3Client(): void {
  s3Client = null;
}

/**
 * Attempts to detect the correct region for a bucket
 */
async function detectBucketRegion(bucketName: string): Promise<string | null> {
  try {
    // Try with us-east-1 client (global endpoint)
    const config = getConfig();
    const credentials = getAWSCredentials();

    const globalClientConfig: any = {
      region: 'us-east-1',
    };

    // Add credentials if available, otherwise let AWS SDK use default credential chain
    if (credentials && credentials.accessKeyId && credentials.secretAccessKey) {
      globalClientConfig.credentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      };
    }

    const globalClient = new S3Client(globalClientConfig);

    const command = new GetBucketLocationCommand({ Bucket: bucketName });
    const response = await globalClient.send(command);

    // LocationConstraint is empty for us-east-1, 'EU' for eu-west-1 (legacy), or the region string
    let region = response.LocationConstraint || 'us-east-1';
    if (region === 'EU') region = 'eu-west-1';

    return region;
  } catch (error) {
    console.warn('Failed to detect bucket region:', error);
    return null;
  }
}

/**
 * Uploads a file to S3
 * Automatically uses multipart upload for files larger than 5MB
 * 
 * @param key - The S3 object key (path)
 * @param file - The file content as Buffer or Blob
 * @param contentType - The MIME type of the file
 * @param metadata - Optional metadata to attach to the file
 * @returns The S3 URL of the uploaded file
 */
export async function uploadFile(
  key: string,
  file: Buffer | Blob,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const config = getConfig();
  const client = getS3Client();

  // Convert Blob to Buffer if needed
  let buffer: Buffer;
  if (file instanceof Blob) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }

  // Use multipart upload for large files
  if (buffer.length > MULTIPART_THRESHOLD) {
    return uploadFileMultipart(key, buffer, contentType, metadata);
  }

  // Simple upload for small files
  const command = new PutObjectCommand({
    Bucket: config.s3.bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
  });

  try {
    await client.send(command);
  } catch (error: any) {
    // Check for region error
    if (error.name === 'PermanentRedirect' ||
      error.message?.includes('addressed using the specified endpoint') ||
      error.$metadata?.httpStatusCode === 301) {

      console.log('S3 region mismatch detected. Attempting to auto-correct...');
      const detectedRegion = await detectBucketRegion(config.s3.bucketName);

      if (detectedRegion && detectedRegion !== config.s3.region) {
        console.log(`Auto-detected correct region: ${detectedRegion}. Retrying upload...`);

        // Update config and reset client
        config.s3.region = detectedRegion;
        resetS3Client();

        // Retry with new client
        const newClient = getS3Client();
        await newClient.send(command);

        // Return the S3 URL with correct region
        if (config.s3.endpoint) {
          return `${config.s3.endpoint}/${config.s3.bucketName}/${key}`;
        }
        return `https://${config.s3.bucketName}.s3.${detectedRegion}.amazonaws.com/${key}`;
      }
    }

    // Provide more helpful error message
    const errorMessage = error.message || 'Unknown S3 error';
    if (errorMessage.includes('addressed using the specified endpoint')) {
      throw new Error(`Storage Error: The bucket you are attempting to access must be addressed using the specified endpoint. Please send all future requests to this endpoint.`);
    }

    throw error;
  }

  // Return the S3 URL
  if (config.s3.endpoint) {
    return `${config.s3.endpoint}/${config.s3.bucketName}/${key}`;
  }
  return `https://${config.s3.bucketName}.s3.${config.s3.region}.amazonaws.com/${key}`;
}

/**
 * Uploads a large file using multipart upload
 * 
 * @param key - The S3 object key (path)
 * @param buffer - The file content as Buffer
 * @param contentType - The MIME type of the file
 * @param metadata - Optional metadata to attach to the file
 * @returns The S3 URL of the uploaded file
 */
async function uploadFileMultipart(
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const config = getConfig();
  const client = getS3Client();

  // Initiate multipart upload
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: config.s3.bucketName,
    Key: key,
    ContentType: contentType,
    Metadata: metadata,
  });

  const { UploadId } = await client.send(createCommand);

  if (!UploadId) {
    throw new Error('Failed to initiate multipart upload');
  }

  try {
    // Upload parts
    const parts: Array<{ ETag: string; PartNumber: number }> = [];
    const numParts = Math.ceil(buffer.length / PART_SIZE);

    for (let i = 0; i < numParts; i++) {
      const start = i * PART_SIZE;
      const end = Math.min(start + PART_SIZE, buffer.length);
      const partBuffer = buffer.slice(start, end);

      const uploadPartCommand = new UploadPartCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        UploadId,
        PartNumber: i + 1,
        Body: partBuffer,
      });

      const { ETag } = await client.send(uploadPartCommand);

      if (ETag) {
        parts.push({ ETag, PartNumber: i + 1 });
      }
    }

    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: config.s3.bucketName,
      Key: key,
      UploadId,
      MultipartUpload: { Parts: parts },
    });

    await client.send(completeCommand);

    // Return the S3 URL
    if (config.s3.endpoint) {
      return `${config.s3.endpoint}/${config.s3.bucketName}/${key}`;
    }
    return `https://${config.s3.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
  } catch (error: any) {
    // Check for region error in multipart upload
    if (error.name === 'PermanentRedirect' ||
      error.message?.includes('addressed using the specified endpoint') ||
      error.$metadata?.httpStatusCode === 301) {

      // Abort the failed upload
      try {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: config.s3.bucketName,
          Key: key,
          UploadId,
        });
        await client.send(abortCommand);
      } catch (e) {
        // Ignore abort errors
      }

      console.log('S3 region mismatch detected in multipart upload. Attempting to auto-correct...');
      const detectedRegion = await detectBucketRegion(config.s3.bucketName);

      if (detectedRegion && detectedRegion !== config.s3.region) {
        console.log(`Auto-detected correct region: ${detectedRegion}. Retrying multipart upload...`);

        // Update config and reset client
        config.s3.region = detectedRegion;
        resetS3Client();

        // Retry the entire function
        return uploadFileMultipart(key, buffer, contentType, metadata);
      }
    }

    // Abort multipart upload on error
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: config.s3.bucketName,
      Key: key,
      UploadId,
    });

    await client.send(abortCommand);
    throw error;
  }
}

/**
 * Downloads a file from S3
 * 
 * @param key - The S3 object key (path)
 * @returns The file content as Buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const config = getConfig();
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: config.s3.bucketName,
    Key: key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error(`File not found: ${key}`);
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as any) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Generates a presigned URL for secure temporary access to a file
 * 
 * @param key - The S3 object key (path)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns The presigned URL
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getConfig();
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: config.s3.bucketName,
    Key: key,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

/**
 * Generates a presigned URL for downloading a file with proper headers
 * This ensures the browser treats the URL as a download rather than viewing inline
 * 
 * @param key - The S3 object key (path)
 * @param filename - The filename to use for the download
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns The presigned download URL
 */
export async function getPresignedDownloadUrl(
  key: string,
  filename: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getConfig();
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: config.s3.bucketName,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

/**
 * Generates a presigned URL for uploading a file
 * Allows clients to upload directly to S3 without going through the server
 * 
 * @param key - The S3 object key (path)
 * @param contentType - The MIME type of the file to be uploaded
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns The presigned URL for upload
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getConfig();
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: config.s3.bucketName,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn });
  return url;
}

/**
 * Deletes a file from S3
 * 
 * @param key - The S3 object key (path)
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getConfig();
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: config.s3.bucketName,
    Key: key,
  });

  await client.send(command);
}

/**
 * Lists files in S3 with a given prefix
 * 
 * @param prefix - The prefix to filter files (e.g., "users/123/")
 * @param maxKeys - Maximum number of keys to return (default: 1000)
 * @returns Array of file keys
 */
export async function listFiles(
  prefix: string = '',
  maxKeys: number = 1000
): Promise<string[]> {
  const config = getConfig();
  const client = getS3Client();

  const command = new ListObjectsV2Command({
    Bucket: config.s3.bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await client.send(command);

  if (!response.Contents) {
    return [];
  }

  return response.Contents.map((item) => item.Key).filter(
    (key): key is string => key !== undefined
  );
}

/**
 * Lists files with detailed information
 * 
 * @param prefix - The prefix to filter files (e.g., "users/123/")
 * @param maxKeys - Maximum number of keys to return (default: 1000)
 * @returns Array of file objects with metadata
 */
export async function listFilesDetailed(
  prefix: string = '',
  maxKeys: number = 1000
): Promise<
  Array<{
    key: string;
    size: number;
    lastModified: Date;
    etag: string;
  }>
> {
  const config = getConfig();
  const client = getS3Client();

  const command = new ListObjectsV2Command({
    Bucket: config.s3.bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await client.send(command);

  if (!response.Contents) {
    return [];
  }

  return response.Contents.filter((item) => item.Key !== undefined).map(
    (item) => ({
      key: item.Key!,
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
      etag: item.ETag || '',
    })
  );
}

/**
 * Checks if a file exists in S3
 * 
 * @param key - The S3 object key (path)
 * @returns True if the file exists, false otherwise
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const config = getConfig();
    const client = getS3Client();

    const command = new GetObjectCommand({
      Bucket: config.s3.bucketName,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Copies a file within S3
 * 
 * @param sourceKey - The source S3 object key
 * @param destinationKey - The destination S3 object key
 */
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const config = getConfig();
  const client = getS3Client();

  const command = new CopyObjectCommand({
    Bucket: config.s3.bucketName,
    Key: destinationKey,
    CopySource: `${config.s3.bucketName}/${sourceKey}`,
  });

  await client.send(command);
}
