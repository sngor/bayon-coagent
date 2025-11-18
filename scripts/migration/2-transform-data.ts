#!/usr/bin/env tsx

/**
 * Transform Firestore Data to DynamoDB Format
 * 
 * Transforms exported Firestore data to DynamoDB single-table design
 */

import { migrationConfig, validateConfig, logConfig } from './config';
import { readJsonFile, writeJsonFile, ensureDir, ProgressTracker, ErrorLogger } from './utils';
import * as path from 'path';
import * as fs from 'fs';

// Import key generation functions
import {
  getUserProfileKeys,
  getAgentProfileKeys,
  getReviewKeys,
  getBrandAuditKeys,
  getCompetitorKeys,
  getResearchReportKeys,
  getProjectKeys,
  getSavedContentKeys,
  getTrainingProgressKeys,
  getMarketingPlanKeys,
  getReviewAnalysisKeys,
  getOAuthTokenKeys,
} from '../../src/aws/dynamodb/keys';

interface FirestoreDocument {
  id: string;
  parentId?: string;
  data: any;
  path: string;
}

interface DynamoDBItem {
  PK: string;
  SK: string;
  EntityType: string;
  Data: any;
  CreatedAt: number;
  UpdatedAt: number;
  GSI1PK?: string;
}

/**
 * Transform UserProfile
 */
function transformUserProfile(doc: FirestoreDocument): DynamoDBItem {
  const keys = getUserProfileKeys(doc.id);
  
  return {
    ...keys,
    EntityType: 'UserProfile',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform RealEstateAgentProfile
 */
function transformAgentProfile(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('AgentProfile missing parentId (userId)');
  }
  
  const keys = getAgentProfileKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'RealEstateAgentProfile',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform Review
 */
function transformReview(doc: FirestoreDocument): DynamoDBItem {
  const agentId = doc.data.agentId;
  if (!agentId) {
    throw new Error('Review missing agentId');
  }
  
  const keys = getReviewKeys(agentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'Review',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform BrandAudit
 */
function transformBrandAudit(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('BrandAudit missing parentId (userId)');
  }
  
  const keys = getBrandAuditKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'BrandAudit',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform Competitor
 */
function transformCompetitor(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('Competitor missing parentId (userId)');
  }
  
  const keys = getCompetitorKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'Competitor',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform ResearchReport
 */
function transformResearchReport(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('ResearchReport missing parentId (userId)');
  }
  
  const keys = getResearchReportKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'ResearchReport',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform Project
 */
function transformProject(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('Project missing parentId (userId)');
  }
  
  const keys = getProjectKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'Project',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform SavedContent
 */
function transformSavedContent(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('SavedContent missing parentId (userId)');
  }
  
  const keys = getSavedContentKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'SavedContent',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform TrainingProgress
 */
function transformTrainingProgress(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('TrainingProgress missing parentId (userId)');
  }
  
  const keys = getTrainingProgressKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'TrainingProgress',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform MarketingPlan
 */
function transformMarketingPlan(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('MarketingPlan missing parentId (userId)');
  }
  
  const keys = getMarketingPlanKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'MarketingPlan',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform ReviewAnalysis
 */
function transformReviewAnalysis(doc: FirestoreDocument): DynamoDBItem {
  if (!doc.parentId) {
    throw new Error('ReviewAnalysis missing parentId (userId)');
  }
  
  const keys = getReviewAnalysisKeys(doc.parentId, doc.id);
  
  return {
    ...keys,
    EntityType: 'ReviewAnalysis',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform OAuthToken (Google Business Profile)
 */
function transformOAuthToken(doc: FirestoreDocument): DynamoDBItem {
  const keys = getOAuthTokenKeys(doc.id, 'GOOGLE_BUSINESS');
  
  return {
    ...keys,
    EntityType: 'OAuthToken',
    Data: doc.data,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };
}

/**
 * Transform a collection based on its path
 */
function transformCollection(
  collectionPath: string,
  documents: FirestoreDocument[],
  errorLogger: ErrorLogger
): DynamoDBItem[] {
  const items: DynamoDBItem[] = [];
  const progress = new ProgressTracker(documents.length, `Transforming ${collectionPath}`);
  
  for (const doc of documents) {
    try {
      let item: DynamoDBItem;
      
      // Determine entity type and transform accordingly
      if (collectionPath === 'users') {
        item = transformUserProfile(doc);
      } else if (collectionPath.includes('agentProfiles')) {
        item = transformAgentProfile(doc);
      } else if (collectionPath === 'reviews') {
        item = transformReview(doc);
      } else if (collectionPath.includes('brandAudits')) {
        item = transformBrandAudit(doc);
      } else if (collectionPath.includes('competitors')) {
        item = transformCompetitor(doc);
      } else if (collectionPath.includes('researchReports')) {
        item = transformResearchReport(doc);
      } else if (collectionPath.includes('projects')) {
        item = transformProject(doc);
      } else if (collectionPath.includes('savedContent')) {
        item = transformSavedContent(doc);
      } else if (collectionPath.includes('trainingProgress')) {
        item = transformTrainingProgress(doc);
      } else if (collectionPath.includes('marketingPlans')) {
        item = transformMarketingPlan(doc);
      } else if (collectionPath.includes('reviewAnalyses')) {
        item = transformReviewAnalysis(doc);
      } else if (collectionPath === 'googleBusinessProfiles') {
        item = transformOAuthToken(doc);
      } else {
        throw new Error(`Unknown collection path: ${collectionPath}`);
      }
      
      items.push(item);
      progress.increment(true);
    } catch (error) {
      errorLogger.log(`transform-${collectionPath}-${doc.id}`, error as Error, doc);
      progress.increment(false);
    }
  }
  
  progress.finish();
  return items;
}

/**
 * Main transform function
 */
async function transformData(): Promise<void> {
  console.log('\n=== Transforming Data ===\n');
  
  validateConfig();
  logConfig();
  
  if (migrationConfig.options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be transformed\n');
    return;
  }
  
  const exportDir = migrationConfig.paths.exportDir;
  const transformDir = migrationConfig.paths.transformDir;
  const errorLogger = new ErrorLogger(migrationConfig.paths.errorLog);
  
  ensureDir(transformDir);
  
  // Read summary to get list of collections
  const summaryPath = path.join(exportDir, '_summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error('Export summary not found. Run export script first.');
  }
  
  const summary = readJsonFile(summaryPath);
  console.log(`Found ${summary.totalCollections} collections with ${summary.totalDocuments} documents\n`);
  
  const allItems: DynamoDBItem[] = [];
  
  // Transform each collection
  for (const collection of summary.collections) {
    const fileName = collection.path.replace(/\//g, '_').replace(/{id}/g, 'id');
    const filePath = path.join(exportDir, `${fileName}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${fileName}.json`);
      continue;
    }
    
    const exportedCollection = readJsonFile(filePath);
    const items = transformCollection(
      exportedCollection.collectionPath,
      exportedCollection.documents,
      errorLogger
    );
    
    allItems.push(...items);
    
    // Save transformed collection
    const transformedFileName = `${fileName}_transformed.json`;
    writeJsonFile(path.join(transformDir, transformedFileName), items);
    console.log(`  ✓ Saved ${transformedFileName} (${items.length} items)\n`);
  }
  
  // Save all items in a single file for import
  writeJsonFile(path.join(transformDir, 'all_items.json'), allItems);
  
  // Save transformation summary
  const transformSummary = {
    transformDate: new Date().toISOString(),
    totalItems: allItems.length,
    itemsByType: allItems.reduce((acc, item) => {
      acc[item.EntityType] = (acc[item.EntityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    errors: errorLogger.getErrors().length,
  };
  
  writeJsonFile(path.join(transformDir, '_summary.json'), transformSummary);
  
  console.log('\n=== Transformation Complete ===');
  console.log(`Total Items: ${transformSummary.totalItems}`);
  console.log('Items by Type:');
  for (const [type, count] of Object.entries(transformSummary.itemsByType)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log(`Transform Directory: ${transformDir}`);
  
  if (errorLogger.getErrors().length > 0) {
    console.log(`\n⚠️  ${errorLogger.getErrors().length} errors occurred during transformation`);
    console.log(`See ${migrationConfig.paths.errorLog} for details`);
  }
}

// Run if called directly
if (require.main === module) {
  transformData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { transformData };
