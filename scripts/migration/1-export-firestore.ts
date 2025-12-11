#!/usr/bin/env tsx

/**
 * Export Firestore Data
 * 
 * Exports all data from Firestore to JSON files
 */

// @ts-ignore - firebase-admin may not be installed in production
import * as admin from 'firebase-admin';
import { migrationConfig, validateConfig, logConfig } from './config';
import { ensureDir, writeJsonFile, ProgressTracker, ErrorLogger } from './utils';
import * as path from 'path';

interface ExportedCollection {
  collectionPath: string;
  documents: any[];
  count: number;
}

/**
 * Initialize Firebase Admin
 */
function initializeFirebase(): void {
  try {
    const serviceAccount = require(path.resolve(migrationConfig.firebase.serviceAccountPath));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: migrationConfig.firebase.projectId,
    });

    console.log('✓ Firebase Admin initialized');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    throw error;
  }
}

/**
 * Export a collection
 */
async function exportCollection(
  collectionPath: string,
  errorLogger: ErrorLogger
): Promise<ExportedCollection> {
  const db = admin.firestore();
  const documents: any[] = [];

  try {
    const snapshot = await db.collection(collectionPath).get();

    for (const doc of snapshot.docs) {
      documents.push({
        id: doc.id,
        data: doc.data(),
        path: doc.ref.path,
      });
    }

    console.log(`  ✓ Exported ${documents.length} documents from ${collectionPath}`);

    return {
      collectionPath,
      documents,
      count: documents.length,
    };
  } catch (error) {
    errorLogger.log(`export-collection-${collectionPath}`, error as Error);
    throw error;
  }
}

/**
 * Export a subcollection for all documents in a parent collection
 */
async function exportSubcollection(
  parentPath: string,
  subcollectionName: string,
  errorLogger: ErrorLogger
): Promise<ExportedCollection> {
  const db = admin.firestore();
  const documents: any[] = [];

  try {
    // Get all parent documents
    const parentSnapshot = await db.collection(parentPath).get();

    // For each parent, get subcollection documents
    for (const parentDoc of parentSnapshot.docs) {
      const subcollectionRef = parentDoc.ref.collection(subcollectionName);
      const subcollectionSnapshot = await subcollectionRef.get();

      for (const doc of subcollectionSnapshot.docs) {
        documents.push({
          id: doc.id,
          parentId: parentDoc.id,
          data: doc.data(),
          path: doc.ref.path,
        });
      }
    }

    const fullPath = `${parentPath}/{id}/${subcollectionName}`;
    console.log(`  ✓ Exported ${documents.length} documents from ${fullPath}`);

    return {
      collectionPath: fullPath,
      documents,
      count: documents.length,
    };
  } catch (error) {
    errorLogger.log(`export-subcollection-${parentPath}/${subcollectionName}`, error as Error);
    throw error;
  }
}

/**
 * Main export function
 */
async function exportFirestoreData(): Promise<void> {
  console.log('\n=== Exporting Firestore Data ===\n');

  validateConfig();
  logConfig();

  if (migrationConfig.options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be exported\n');
    return;
  }

  initializeFirebase();

  const errorLogger = new ErrorLogger(migrationConfig.paths.errorLog);
  const exportDir = migrationConfig.paths.exportDir;
  ensureDir(exportDir);

  const collections: ExportedCollection[] = [];

  try {
    // Export root collections
    console.log('Exporting root collections...');

    // Users collection
    const users = await exportCollection('users', errorLogger);
    collections.push(users);

    // Reviews collection
    const reviews = await exportCollection('reviews', errorLogger);
    collections.push(reviews);

    // Google Business Profiles (OAuth tokens)
    const googleBusinessProfiles = await exportCollection('googleBusinessProfiles', errorLogger);
    collections.push(googleBusinessProfiles);

    // Export subcollections
    console.log('\nExporting subcollections...');

    const subcollections = [
      { parent: 'users', name: 'agentProfiles' },
      { parent: 'users', name: 'brandAudits' },
      { parent: 'users', name: 'reviewAnalyses' },
      { parent: 'users', name: 'competitors' },
      { parent: 'users', name: 'researchReports' },
      { parent: 'users', name: 'projects' },
      { parent: 'users', name: 'savedContent' },
      { parent: 'users', name: 'trainingProgress' },
      { parent: 'users', name: 'marketingPlans' },
    ];

    for (const { parent, name } of subcollections) {
      const subcollection = await exportSubcollection(parent, name, errorLogger);
      collections.push(subcollection);
    }

    // Save all collections to individual files
    console.log('\nSaving exported data...');

    for (const collection of collections) {
      const fileName = collection.collectionPath.replace(/\//g, '_').replace(/{id}/g, 'id');
      const filePath = path.join(exportDir, `${fileName}.json`);
      writeJsonFile(filePath, collection);
      console.log(`  ✓ Saved ${fileName}.json (${collection.count} documents)`);
    }

    // Save summary
    const summary = {
      exportDate: new Date().toISOString(),
      totalCollections: collections.length,
      totalDocuments: collections.reduce((sum, c) => sum + c.count, 0),
      collections: collections.map(c => ({
        path: c.collectionPath,
        count: c.count,
      })),
    };

    writeJsonFile(path.join(exportDir, '_summary.json'), summary);

    console.log('\n=== Export Complete ===');
    console.log(`Total Collections: ${summary.totalCollections}`);
    console.log(`Total Documents: ${summary.totalDocuments}`);
    console.log(`Export Directory: ${exportDir}`);

    if (errorLogger.getErrors().length > 0) {
      console.log(`\n⚠️  ${errorLogger.getErrors().length} errors occurred during export`);
      console.log(`See ${migrationConfig.paths.errorLog} for details`);
    }

  } catch (error) {
    console.error('\n❌ Export failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  exportFirestoreData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { exportFirestoreData };
