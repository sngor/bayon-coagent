# Migration Scripts Implementation Summary

## Overview

Comprehensive data migration scripts have been implemented to migrate data from Firebase (Firestore and Storage) to AWS (DynamoDB and S3). The implementation follows best practices for data migration including validation, error handling, rollback capabilities, and progress tracking.

## Files Created

### Core Scripts

1. **config.ts** - Centralized configuration management

   - Loads environment variables from `.env.migration`
   - Validates configuration before migration
   - Supports both local (LocalStack) and remote AWS environments

2. **utils.ts** - Shared utility functions
   - Progress tracking with ETA calculation
   - Error logging with detailed context
   - Batch processing utilities
   - Retry logic with exponential backoff
   - File system helpers

### Migration Scripts

3. **1-export-firestore.ts** - Export data from Firestore

   - Exports all root collections (users, reviews, googleBusinessProfiles)
   - Exports all subcollections (agentProfiles, brandAudits, competitors, etc.)
   - Saves data as JSON files in `migration-data/firestore/`
   - Generates export summary with statistics

4. **2-transform-data.ts** - Transform data to DynamoDB format

   - Transforms Firestore documents to DynamoDB single-table design
   - Uses key generation functions from `src/aws/dynamodb/keys.ts`
   - Preserves all data while adding DynamoDB metadata
   - Generates transformation summary by entity type

5. **3-import-dynamodb.ts** - Import data to DynamoDB

   - Batch imports with DynamoDB BatchWrite API
   - Skips items that already exist (idempotent)
   - Handles unprocessed items with retry logic
   - Progress tracking with items/second metrics

6. **4-migrate-storage.ts** - Migrate Firebase Storage to S3

   - Lists all files in Firebase Storage
   - Downloads and uploads to S3 with metadata
   - Skips files that already exist
   - Preserves content types and file paths

7. **5-validate.ts** - Validate migration integrity

   - Compares document counts between Firestore and DynamoDB
   - Compares file counts between Firebase Storage and S3
   - Performs sample data comparison for integrity check
   - Generates detailed validation report

8. **6-rollback.ts** - Rollback migration

   - Deletes all items from DynamoDB
   - Deletes all files from S3
   - Requires double confirmation for safety
   - Progress tracking for deletion operations

9. **run-all.ts** - Execute complete migration
   - Runs all migration steps in sequence
   - Provides clear progress indicators
   - Handles errors gracefully
   - Displays total migration time

### Documentation

10. **README.md** - Migration scripts documentation

    - Prerequisites and setup instructions
    - Script descriptions and usage
    - Data mapping reference
    - Error handling and monitoring

11. **IMPLEMENTATION_SUMMARY.md** (this file)
    - Implementation overview
    - Technical details
    - Testing recommendations

### Configuration Files

12. **.env.migration.example** - Example configuration

    - Firebase settings
    - AWS settings
    - Migration options
    - Comments explaining each setting

13. **MIGRATION_GUIDE.md** - Comprehensive migration guide
    - Step-by-step instructions
    - Troubleshooting guide
    - Post-migration checklist
    - Security notes

## Data Mapping

The migration implements the following Firestore → DynamoDB mappings:

| Firestore Path                          | DynamoDB Keys                                   | Entity Type            |
| --------------------------------------- | ----------------------------------------------- | ---------------------- |
| `/users/{userId}`                       | PK: `USER#{userId}`, SK: `PROFILE`              | UserProfile            |
| `/users/{userId}/agentProfiles/{id}`    | PK: `USER#{userId}`, SK: `AGENT#{id}`           | RealEstateAgentProfile |
| `/reviews/{reviewId}`                   | PK: `REVIEW#{agentId}`, SK: `REVIEW#{reviewId}` | Review                 |
| `/users/{userId}/brandAudits/{id}`      | PK: `USER#{userId}`, SK: `AUDIT#{id}`           | BrandAudit             |
| `/users/{userId}/competitors/{id}`      | PK: `USER#{userId}`, SK: `COMPETITOR#{id}`      | Competitor             |
| `/users/{userId}/researchReports/{id}`  | PK: `USER#{userId}`, SK: `REPORT#{id}`          | ResearchReport         |
| `/users/{userId}/projects/{id}`         | PK: `USER#{userId}`, SK: `PROJECT#{id}`         | Project                |
| `/users/{userId}/savedContent/{id}`     | PK: `USER#{userId}`, SK: `CONTENT#{id}`         | SavedContent           |
| `/users/{userId}/trainingProgress/{id}` | PK: `USER#{userId}`, SK: `TRAINING#{id}`        | TrainingProgress       |
| `/users/{userId}/marketingPlans/{id}`   | PK: `USER#{userId}`, SK: `PLAN#{id}`            | MarketingPlan          |
| `/users/{userId}/reviewAnalyses/{id}`   | PK: `USER#{userId}`, SK: `ANALYSIS#{id}`        | ReviewAnalysis         |
| `/googleBusinessProfiles/{userId}`      | PK: `OAUTH#{userId}`, SK: `GOOGLE_BUSINESS`     | OAuthToken             |

## Features

### Safety Features

1. **Dry Run Mode**: Test migration without making changes
2. **Idempotent Operations**: Safe to re-run scripts (skips existing items)
3. **Error Recovery**: Continues on errors and logs them for review
4. **Rollback Capability**: Can undo migration if needed
5. **Double Confirmation**: Rollback requires two confirmations

### Performance Features

1. **Batch Processing**: Processes items in configurable batches
2. **Retry Logic**: Exponential backoff for transient failures
3. **Progress Tracking**: Real-time progress with ETA
4. **Parallel Operations**: Efficient use of AWS APIs

### Validation Features

1. **Count Validation**: Ensures all documents were migrated
2. **Data Integrity**: Samples and compares actual data
3. **Detailed Reports**: JSON reports for audit trail
4. **Error Logging**: Comprehensive error tracking

## NPM Scripts

Added to `package.json`:

```json
{
  "migrate:export": "Export from Firestore",
  "migrate:transform": "Transform to DynamoDB format",
  "migrate:import": "Import to DynamoDB",
  "migrate:storage": "Migrate Firebase Storage to S3",
  "migrate:validate": "Validate migration",
  "migrate:rollback": "Rollback migration (delete all AWS data)",
  "migrate:all": "Run complete migration process"
}
```

## Configuration

### Environment Variables

The migration uses `.env.migration` file with the following settings:

- **Firebase**: Project ID, service account path
- **AWS**: Region, credentials, DynamoDB table, S3 bucket
- **Options**: Dry run, batch size, validation, error handling

### Local Development

Supports LocalStack for local testing:

- Set `USE_LOCAL_AWS=true`
- Scripts automatically use LocalStack endpoints

## Error Handling

### Error Logging

All errors are logged to `migration-data/errors.json` with:

- Timestamp
- Operation name
- Error message
- Context data (sanitized)

### Error Recovery

- Scripts continue on errors (configurable)
- Failed items are logged for manual review
- Import can be re-run to retry failed items

## Validation

### Automated Checks

1. **Document Counts**: Compares counts for each entity type
2. **File Counts**: Compares Firebase Storage vs S3
3. **Sample Data**: Verifies data structure preservation

### Validation Report

Generated at `migration-data/dynamodb/validation-report.json`:

- Overall pass/fail status
- Individual check results
- Detailed statistics

## Usage Examples

### Complete Migration

```bash
npm run migrate:all
```

### Individual Steps

```bash
npm run migrate:export
npm run migrate:transform
npm run migrate:import
npm run migrate:storage
npm run migrate:validate
```

### Rollback

```bash
npm run migrate:rollback
```

## Testing Recommendations

### Before Production Migration

1. **Test with LocalStack**:

   ```bash
   USE_LOCAL_AWS=true npm run migrate:all
   ```

2. **Dry Run**:

   ```bash
   DRY_RUN=true npm run migrate:all
   ```

3. **Small Dataset**: Test with a subset of data first

### During Migration

1. Monitor progress output
2. Check error logs in real-time
3. Verify AWS resources (DynamoDB, S3)

### After Migration

1. Review validation report
2. Test application functionality
3. Compare data samples manually
4. Monitor application logs

## Requirements Validation

This implementation satisfies the following requirements from the spec:

- **Requirement 2.7**: Maps Firestore collections to DynamoDB tables with appropriate key schemas ✓
- **Requirement 8.1**: Creates table definitions for all entities ✓
- **Requirement 8.2**: Uses userId in partition key for user-scoped data ✓
- **Requirement 8.3**: Uses entity IDs or composite keys for hierarchical data ✓

## Next Steps

After implementing these migration scripts:

1. **Test Migration**: Run migration on a test environment
2. **Validate Data**: Ensure all data migrated correctly
3. **Update Application**: Switch application to use AWS services
4. **Monitor**: Watch for issues in production
5. **Decommission Firebase**: After successful migration period

## Security Notes

- Service account key is excluded from version control
- Migration config is excluded from version control
- Sensitive data is sanitized in logs
- AWS credentials should use IAM roles when possible

## Maintenance

### Adding New Entity Types

To add a new entity type to migration:

1. Add key generation function in `src/aws/dynamodb/keys.ts`
2. Add transform function in `2-transform-data.ts`
3. Add validation mapping in `5-validate.ts`
4. Update documentation

### Modifying Key Patterns

If DynamoDB key patterns change:

1. Update key generation functions
2. Update transform functions
3. Re-run transformation step
4. Validate before importing

## Known Limitations

1. **Large Files**: Very large files (>5GB) may need special handling
2. **Rate Limits**: May hit AWS rate limits with large datasets (adjust batch size)
3. **Firestore Queries**: Complex queries may need manual migration
4. **Real-time Updates**: Data modified during migration may be missed

## Support

For issues or questions:

1. Check error logs: `migration-data/errors.json`
2. Review validation report: `migration-data/dynamodb/validation-report.json`
3. Consult MIGRATION_GUIDE.md
4. Check AWS CloudWatch logs
