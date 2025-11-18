/**
 * Migration Configuration
 * 
 * Centralized configuration for data migration scripts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load migration-specific environment variables
dotenv.config({ path: '.env.migration' });
dotenv.config({ path: '.env.local' });

export interface MigrationConfig {
  // Firebase
  firebase: {
    projectId: string;
    serviceAccountPath: string;
  };
  
  // AWS
  aws: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    dynamodb: {
      tableName: string;
      endpoint?: string;
    };
    s3: {
      bucketName: string;
      endpoint?: string;
    };
  };
  
  // Migration Options
  options: {
    dryRun: boolean;
    batchSize: number;
    validateData: boolean;
    continueOnError: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  // Paths
  paths: {
    exportDir: string;
    transformDir: string;
    errorLog: string;
    progressLog: string;
  };
}

export const migrationConfig: MigrationConfig = {
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'studio-6950585124-de454',
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json',
  },
  
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    dynamodb: {
      tableName: process.env.DYNAMODB_TABLE_NAME || 'BayonCoAgent',
      endpoint: process.env.DYNAMODB_ENDPOINT || (process.env.USE_LOCAL_AWS === 'true' ? 'http://localhost:4566' : undefined),
    },
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || 'bayon-coagent-storage',
      endpoint: process.env.S3_ENDPOINT || (process.env.USE_LOCAL_AWS === 'true' ? 'http://localhost:4566' : undefined),
    },
  },
  
  options: {
    dryRun: process.env.DRY_RUN === 'true',
    batchSize: parseInt(process.env.BATCH_SIZE || '25', 10),
    validateData: process.env.VALIDATE_DATA !== 'false',
    continueOnError: process.env.CONTINUE_ON_ERROR !== 'false',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  },
  
  paths: {
    exportDir: path.join(process.cwd(), 'migration-data', 'firestore'),
    transformDir: path.join(process.cwd(), 'migration-data', 'dynamodb'),
    errorLog: path.join(process.cwd(), 'migration-data', 'errors.json'),
    progressLog: path.join(process.cwd(), 'migration-data', 'progress.json'),
  },
};

/**
 * Validate configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!migrationConfig.firebase.projectId) {
    errors.push('FIREBASE_PROJECT_ID is required');
  }
  
  if (!migrationConfig.aws.dynamodb.tableName) {
    errors.push('DYNAMODB_TABLE_NAME is required');
  }
  
  if (!migrationConfig.aws.s3.bucketName) {
    errors.push('S3_BUCKET_NAME is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Log configuration (without sensitive data)
 */
export function logConfig(): void {
  console.log('Migration Configuration:');
  console.log('  Firebase Project:', migrationConfig.firebase.projectId);
  console.log('  DynamoDB Table:', migrationConfig.aws.dynamodb.tableName);
  console.log('  S3 Bucket:', migrationConfig.aws.s3.bucketName);
  console.log('  Dry Run:', migrationConfig.options.dryRun);
  console.log('  Batch Size:', migrationConfig.options.batchSize);
  console.log('  Validate Data:', migrationConfig.options.validateData);
  console.log('');
}
