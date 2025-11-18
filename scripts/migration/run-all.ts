#!/usr/bin/env tsx

/**
 * Run All Migration Steps
 * 
 * Executes the complete migration process:
 * 1. Export from Firestore
 * 2. Transform data
 * 3. Import to DynamoDB
 * 4. Migrate storage
 * 5. Validate migration
 */

import { exportFirestoreData } from './1-export-firestore';
import { transformData } from './2-transform-data';
import { importData } from './3-import-dynamodb';
import { migrateStorage } from './4-migrate-storage';
import { validateMigration } from './5-validate';
import { migrationConfig, validateConfig, logConfig } from './config';

/**
 * Main function to run all migration steps
 */
async function runAllMigration(): Promise<void> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         FIREBASE TO AWS MIGRATION - FULL PROCESS          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  validateConfig();
  logConfig();
  
  const startTime = Date.now();
  
  try {
    // Step 1: Export from Firestore
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STEP 1: Export from Firestore                           │');
    console.log('└─────────────────────────────────────────────────────────┘');
    await exportFirestoreData();
    
    // Step 2: Transform data
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STEP 2: Transform data to DynamoDB format               │');
    console.log('└─────────────────────────────────────────────────────────┘');
    await transformData();
    
    // Step 3: Import to DynamoDB
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STEP 3: Import to DynamoDB                               │');
    console.log('└─────────────────────────────────────────────────────────┘');
    await importData();
    
    // Step 4: Migrate storage
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STEP 4: Migrate Firebase Storage to S3                  │');
    console.log('└─────────────────────────────────────────────────────────┘');
    await migrateStorage();
    
    // Step 5: Validate migration
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ STEP 5: Validate migration                               │');
    console.log('└─────────────────────────────────────────────────────────┘');
    await validateMigration();
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              MIGRATION COMPLETED SUCCESSFULLY              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\nTotal time: ${duration} minutes`);
    console.log('\nNext steps:');
    console.log('  1. Review the validation report');
    console.log('  2. Test your application with AWS services');
    console.log('  3. Monitor for any issues');
    console.log('  4. Keep Firebase services running as backup');
    console.log('  5. Once confident, you can decommission Firebase\n');
    
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║                  MIGRATION FAILED                          ║');
    console.error('╚════════════════════════════════════════════════════════════╝');
    console.error('\nError:', error);
    console.error('\nThe migration process has been stopped.');
    console.error('Review the error logs and fix any issues before retrying.');
    console.error(`Error log: ${migrationConfig.paths.errorLog}\n`);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runAllMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runAllMigration };
