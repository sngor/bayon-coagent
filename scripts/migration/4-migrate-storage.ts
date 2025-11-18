#!/usr/bin/env tsx

/**
 * Migrate Firebase Storage to S3
 * 
 * Migrates files from Firebase Storage to AWS S3
 */

import * as admin from 'firebase-admin';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { migrationConfig, validateConfig, logConfig } from './config';
import { ProgressTracker, ErrorLogger, retryWithBackoff } from './utils';
import * as path from 'path';

interface StorageFile {
  name: string;
  bucket: string;
  fullPath: string;
  contentType: string;
  size: number;
}

/**
 * Initialize Firebase Admin (if not already initialized)
 */
function initializeFirebase(): void {
  try {
    if (admin.apps.length === 0) {
      const serviceAccount = require(path.resolve(migrationConfig.firebase.serviceAccountPath));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: migrationConfig.firebase.projectId,
        storageBucket: `${migrationConfig.firebase.projectId}.appspot.com`,
      });
    }
    
    console.log('✓ Firebase Admin initialized');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

/**
 * Initialize S3 client
 */
function initializeS3(): S3Client {
  const client = new S3Client({
    region: migrationConfig.aws.region,
    endpoint: migrationConfig.aws.s3.endpoint,
    forcePathStyle: !!migrationConfig.aws.s3.endpoint, // Required for LocalStack
    credentials: migrationConfig.aws.accessKeyId ? {
      accessKeyId: migrationConfig.aws.accessKeyId,
      secretAccessKey: migrationConfig.aws.secretAccessKey!,
    } : undefined,
  });
  
  console.log('✓ S3 client initialized');
  return client;
}

/**
 * List all files in Firebase Storage
 */
async function listFirebaseFiles(): Promise<StorageFile[]> {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles();
  
  const storageFiles: StorageFile[] = files.map(file => ({
    name: file.name,
    bucket: file.bucket.name,
    fullPath: file.name,
    contentType: file.metadata.contentType || 'application/octet-stream',
    size: parseInt(file.metadata.size || '0', 10),
  }));
  
  console.log(`Found ${storageFiles.length} files in Firebase Storage`);
  return storageFiles;
}

/**
 * Check if file exists in S3
 */
async function fileExistsInS3(
  s3Client: S3Client,
  key: string
): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: migrationConfig.aws.s3.bucketName,
      Key: key,
    }));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Migrate a single file from Firebase Storage to S3
 */
async function migrateFile(
  s3Client: S3Client,
  file: StorageFile,
  errorLogger: ErrorLogger,
  skipExisting: boolean = true
): Promise<boolean> {
  try {
    // Check if file already exists in S3
    if (skipExisting) {
      const exists = await fileExistsInS3(s3Client, file.fullPath);
      if (exists) {
        return true; // Skip, already exists
      }
    }
    
    // Download from Firebase Storage
    const bucket = admin.storage().bucket();
    const firebaseFile = bucket.file(file.fullPath);
    const [buffer] = await firebaseFile.download();
    
    // Upload to S3
    await retryWithBackoff(async () => {
      await s3Client.send(new PutObjectCommand({
        Bucket: migrationConfig.aws.s3.bucketName,
        Key: file.fullPath,
        Body: buffer,
        ContentType: file.contentType,
        Metadata: {
          'migrated-from': 'firebase-storage',
          'original-size': file.size.toString(),
        },
      }));
    });
    
    return true;
  } catch (error) {
    errorLogger.log(`migrate-file-${file.fullPath}`, error as Error, file);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrateStorage(): Promise<void> {
  console.log('\n=== Migrating Firebase Storage to S3 ===\n');
  
  validateConfig();
  logConfig();
  
  if (migrationConfig.options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be migrated\n');
    return;
  }
  
  initializeFirebase();
  const s3Client = initializeS3();
  const errorLogger = new ErrorLogger(migrationConfig.paths.errorLog);
  
  // List all files in Firebase Storage
  console.log('Listing files in Firebase Storage...');
  const files = await listFirebaseFiles();
  
  if (files.length === 0) {
    console.log('No files to migrate');
    return;
  }
  
  console.log(`\nMigrating ${files.length} files...\n`);
  
  const progress = new ProgressTracker(files.length, 'Migrating files');
  let successCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    const success = await migrateFile(s3Client, file, errorLogger, true);
    
    if (success) {
      successCount++;
    }
    
    progress.increment(success);
  }
  
  progress.finish();
  
  console.log('\n=== Migration Complete ===');
  console.log(`Total Files: ${files.length}`);
  console.log(`Successfully Migrated: ${successCount}`);
  console.log(`Skipped (already exist): ${files.length - successCount}`);
  
  if (errorLogger.getErrors().length > 0) {
    console.log(`\n⚠️  ${errorLogger.getErrors().length} errors occurred during migration`);
    console.log(`See ${migrationConfig.paths.errorLog} for details`);
  }
}

// Run if called directly
if (require.main === module) {
  migrateStorage()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateStorage };
