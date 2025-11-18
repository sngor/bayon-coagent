#!/usr/bin/env tsx

/**
 * Validate Migration
 * 
 * Validates that data was migrated correctly from Firebase to AWS
 */

import * as admin from 'firebase-admin';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { migrationConfig, validateConfig, logConfig } from './config';
import { readJsonFile } from './utils';
import * as path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

interface ValidationReport {
  timestamp: string;
  overallPassed: boolean;
  checks: ValidationResult[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
  };
}

/**
 * Initialize Firebase Admin
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
 * Initialize DynamoDB client
 */
function initializeDynamoDB(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: migrationConfig.aws.region,
    endpoint: migrationConfig.aws.dynamodb.endpoint,
    credentials: migrationConfig.aws.accessKeyId ? {
      accessKeyId: migrationConfig.aws.accessKeyId,
      secretAccessKey: migrationConfig.aws.secretAccessKey!,
    } : undefined,
  });
  
  return DynamoDBDocumentClient.from(client);
}

/**
 * Initialize S3 client
 */
function initializeS3(): S3Client {
  return new S3Client({
    region: migrationConfig.aws.region,
    endpoint: migrationConfig.aws.s3.endpoint,
    forcePathStyle: !!migrationConfig.aws.s3.endpoint,
    credentials: migrationConfig.aws.accessKeyId ? {
      accessKeyId: migrationConfig.aws.accessKeyId,
      secretAccessKey: migrationConfig.aws.secretAccessKey!,
    } : undefined,
  });
}

/**
 * Count documents in Firestore collection
 */
async function countFirestoreDocuments(collectionPath: string): Promise<number> {
  const db = admin.firestore();
  const snapshot = await db.collection(collectionPath).get();
  return snapshot.size;
}

/**
 * Count documents in Firestore subcollection
 */
async function countFirestoreSubcollection(
  parentPath: string,
  subcollectionName: string
): Promise<number> {
  const db = admin.firestore();
  const parentSnapshot = await db.collection(parentPath).get();
  
  let total = 0;
  for (const parentDoc of parentSnapshot.docs) {
    const subcollectionSnapshot = await parentDoc.ref.collection(subcollectionName).get();
    total += subcollectionSnapshot.size;
  }
  
  return total;
}

/**
 * Count items in DynamoDB by entity type
 */
async function countDynamoDBItems(
  docClient: DynamoDBDocumentClient,
  entityType: string
): Promise<number> {
  let count = 0;
  let lastEvaluatedKey: any = undefined;
  
  do {
    const result = await docClient.send(new ScanCommand({
      TableName: migrationConfig.aws.dynamodb.tableName,
      FilterExpression: 'EntityType = :entityType',
      ExpressionAttributeValues: {
        ':entityType': entityType,
      },
      Select: 'COUNT',
      ExclusiveStartKey: lastEvaluatedKey,
    }));
    
    count += result.Count || 0;
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  return count;
}

/**
 * Count files in Firebase Storage
 */
async function countFirebaseFiles(): Promise<number> {
  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles();
  return files.length;
}

/**
 * Count files in S3
 */
async function countS3Files(s3Client: S3Client): Promise<number> {
  let count = 0;
  let continuationToken: string | undefined;
  
  do {
    const result = await s3Client.send(new ListObjectsV2Command({
      Bucket: migrationConfig.aws.s3.bucketName,
      ContinuationToken: continuationToken,
    }));
    
    count += result.KeyCount || 0;
    continuationToken = result.NextContinuationToken;
  } while (continuationToken);
  
  return count;
}

/**
 * Sample and compare data
 */
async function sampleDataComparison(
  docClient: DynamoDBDocumentClient
): Promise<ValidationResult> {
  try {
    const db = admin.firestore();
    
    // Get a sample user from Firestore
    const usersSnapshot = await db.collection('users').limit(1).get();
    
    if (usersSnapshot.empty) {
      return {
        passed: true,
        message: 'No users to sample',
      };
    }
    
    const sampleUser = usersSnapshot.docs[0];
    const userId = sampleUser.id;
    const firestoreData = sampleUser.data();
    
    // Get the same user from DynamoDB
    const dynamoResult = await docClient.send(new GetCommand({
      TableName: migrationConfig.aws.dynamodb.tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    }));
    
    if (!dynamoResult.Item) {
      return {
        passed: false,
        message: `Sample user ${userId} not found in DynamoDB`,
      };
    }
    
    const dynamoData = dynamoResult.Item.Data;
    
    // Compare key fields
    const fieldsMatch = 
      firestoreData.email === dynamoData.email &&
      firestoreData.displayName === dynamoData.displayName;
    
    return {
      passed: fieldsMatch,
      message: fieldsMatch 
        ? 'Sample data comparison passed'
        : 'Sample data comparison failed - data mismatch',
      details: {
        userId,
        firestore: firestoreData,
        dynamodb: dynamoData,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Sample data comparison error: ${(error as Error).message}`,
    };
  }
}

/**
 * Validate document counts
 */
async function validateCounts(
  docClient: DynamoDBDocumentClient
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  
  // Define entity mappings
  const entityMappings = [
    { 
      name: 'UserProfile',
      firestorePath: 'users',
      entityType: 'UserProfile',
      isSubcollection: false,
    },
    {
      name: 'AgentProfile',
      firestorePath: 'users',
      firestoreSubcollection: 'agentProfiles',
      entityType: 'RealEstateAgentProfile',
      isSubcollection: true,
    },
    {
      name: 'Review',
      firestorePath: 'reviews',
      entityType: 'Review',
      isSubcollection: false,
    },
    {
      name: 'BrandAudit',
      firestorePath: 'users',
      firestoreSubcollection: 'brandAudits',
      entityType: 'BrandAudit',
      isSubcollection: true,
    },
    {
      name: 'Competitor',
      firestorePath: 'users',
      firestoreSubcollection: 'competitors',
      entityType: 'Competitor',
      isSubcollection: true,
    },
    {
      name: 'ResearchReport',
      firestorePath: 'users',
      firestoreSubcollection: 'researchReports',
      entityType: 'ResearchReport',
      isSubcollection: true,
    },
    {
      name: 'Project',
      firestorePath: 'users',
      firestoreSubcollection: 'projects',
      entityType: 'Project',
      isSubcollection: true,
    },
    {
      name: 'SavedContent',
      firestorePath: 'users',
      firestoreSubcollection: 'savedContent',
      entityType: 'SavedContent',
      isSubcollection: true,
    },
    {
      name: 'TrainingProgress',
      firestorePath: 'users',
      firestoreSubcollection: 'trainingProgress',
      entityType: 'TrainingProgress',
      isSubcollection: true,
    },
    {
      name: 'MarketingPlan',
      firestorePath: 'users',
      firestoreSubcollection: 'marketingPlans',
      entityType: 'MarketingPlan',
      isSubcollection: true,
    },
    {
      name: 'ReviewAnalysis',
      firestorePath: 'users',
      firestoreSubcollection: 'reviewAnalyses',
      entityType: 'ReviewAnalysis',
      isSubcollection: true,
    },
    {
      name: 'OAuthToken',
      firestorePath: 'googleBusinessProfiles',
      entityType: 'OAuthToken',
      isSubcollection: false,
    },
  ];
  
  for (const mapping of entityMappings) {
    try {
      const firestoreCount = mapping.isSubcollection
        ? await countFirestoreSubcollection(mapping.firestorePath, mapping.firestoreSubcollection!)
        : await countFirestoreDocuments(mapping.firestorePath);
      
      const dynamoCount = await countDynamoDBItems(docClient, mapping.entityType);
      
      const passed = firestoreCount === dynamoCount;
      
      results.push({
        passed,
        message: passed
          ? `${mapping.name}: Counts match (${firestoreCount})`
          : `${mapping.name}: Count mismatch (Firestore: ${firestoreCount}, DynamoDB: ${dynamoCount})`,
        details: {
          firestore: firestoreCount,
          dynamodb: dynamoCount,
        },
      });
    } catch (error) {
      results.push({
        passed: false,
        message: `${mapping.name}: Validation error - ${(error as Error).message}`,
      });
    }
  }
  
  return results;
}

/**
 * Validate storage migration
 */
async function validateStorage(s3Client: S3Client): Promise<ValidationResult> {
  try {
    const firebaseCount = await countFirebaseFiles();
    const s3Count = await countS3Files(s3Client);
    
    const passed = firebaseCount === s3Count;
    
    return {
      passed,
      message: passed
        ? `Storage: File counts match (${firebaseCount})`
        : `Storage: File count mismatch (Firebase: ${firebaseCount}, S3: ${s3Count})`,
      details: {
        firebase: firebaseCount,
        s3: s3Count,
      },
    };
  } catch (error) {
    return {
      passed: false,
      message: `Storage validation error: ${(error as Error).message}`,
    };
  }
}

/**
 * Main validation function
 */
async function validateMigration(): Promise<void> {
  console.log('\n=== Validating Migration ===\n');
  
  validateConfig();
  logConfig();
  
  initializeFirebase();
  const docClient = initializeDynamoDB();
  const s3Client = initializeS3();
  
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    overallPassed: true,
    checks: [],
    summary: {
      totalChecks: 0,
      passed: 0,
      failed: 0,
    },
  };
  
  console.log('Validating document counts...\n');
  const countResults = await validateCounts(docClient);
  report.checks.push(...countResults);
  
  console.log('\nValidating storage migration...\n');
  const storageResult = await validateStorage(s3Client);
  report.checks.push(storageResult);
  
  console.log('\nValidating sample data...\n');
  const sampleResult = await sampleDataComparison(docClient);
  report.checks.push(sampleResult);
  
  // Calculate summary
  report.summary.totalChecks = report.checks.length;
  report.summary.passed = report.checks.filter(c => c.passed).length;
  report.summary.failed = report.checks.filter(c => !c.passed).length;
  report.overallPassed = report.summary.failed === 0;
  
  // Print results
  console.log('\n=== Validation Results ===\n');
  
  for (const check of report.checks) {
    const icon = check.passed ? '✓' : '✗';
    console.log(`${icon} ${check.message}`);
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total Checks: ${report.summary.totalChecks}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Overall: ${report.overallPassed ? 'PASSED ✓' : 'FAILED ✗'}`);
  
  // Save report
  const reportPath = path.join(migrationConfig.paths.transformDir, 'validation-report.json');
  require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nValidation report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  validateMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { validateMigration };
