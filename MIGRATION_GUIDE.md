# Firebase to AWS Migration Guide

This guide provides step-by-step instructions for migrating your Bayon CoAgent application data from Firebase (Firestore and Storage) to AWS (DynamoDB and S3).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Migration Process](#migration-process)
4. [Validation](#validation)
5. [Rollback](#rollback)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Access

- **Firebase Admin SDK**: Service account key with read access to Firestore and Storage
- **AWS Credentials**: IAM user/role with permissions for:
  - DynamoDB: `PutItem`, `GetItem`, `Query`, `Scan`, `BatchWriteItem`
  - S3: `PutObject`, `GetObject`, `ListBucket`, `DeleteObject`

### Required Software

- Node.js 18+ and npm
- Firebase Admin SDK
- AWS SDK v3
- tsx (TypeScript executor)

### Data Backup

⚠️ **IMPORTANT**: Before starting the migration, create backups of your Firebase data:

1. **Firestore**: Use Firebase Console to export data
2. **Storage**: Download all files from Firebase Storage
3. **Authentication**: Export user list from Firebase Console

## Setup

### 1. Get Firebase Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `serviceAccountKey.json` in your project root
4. **Keep this file secure and never commit it to version control**

### 2. Configure AWS Credentials

Option A: Use AWS CLI credentials (recommended)

```bash
aws configure
```

Option B: Set environment variables

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

### 3. Create Migration Configuration

Copy the example configuration:

```bash
cp .env.migration.example .env.migration
```

Edit `.env.migration` with your settings:

```bash
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json

# AWS
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=BayonCoAgent
S3_BUCKET_NAME=bayon-coagent-storage

# Options
DRY_RUN=false
BATCH_SIZE=25
VALIDATE_DATA=true
```

### 4. Ensure AWS Resources Exist

Make sure your DynamoDB table and S3 bucket are created:

```bash
# Check DynamoDB table
aws dynamodb describe-table --table-name BayonCoAgent

# Check S3 bucket
aws s3 ls s3://bayon-coagent-storage
```

If they don't exist, create them:

```bash
# Create DynamoDB table
aws dynamodb create-table \
  --table-name BayonCoAgent \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --billing-mode PAY_PER_REQUEST

# Create S3 bucket
aws s3 mb s3://bayon-coagent-storage
```

## Migration Process

### Option 1: Run Complete Migration (Recommended)

Run all migration steps in sequence:

```bash
npm run migrate:all
```

This will:

1. Export data from Firestore
2. Transform data to DynamoDB format
3. Import data to DynamoDB
4. Migrate files from Firebase Storage to S3
5. Validate the migration

### Option 2: Run Individual Steps

For more control, run each step separately:

#### Step 1: Export from Firestore

```bash
npm run migrate:export
```

This exports all Firestore data to `./migration-data/firestore/` as JSON files.

**Output:**

- Individual collection files (e.g., `users.json`, `reviews.json`)
- `_summary.json` with export statistics

#### Step 2: Transform Data

```bash
npm run migrate:transform
```

This transforms Firestore data to DynamoDB single-table format.

**Output:**

- Transformed files in `./migration-data/dynamodb/`
- `all_items.json` containing all items ready for import
- `_summary.json` with transformation statistics

#### Step 3: Import to DynamoDB

```bash
npm run migrate:import
```

This imports transformed data into DynamoDB.

**Features:**

- Skips items that already exist (safe to re-run)
- Processes in batches to avoid rate limits
- Retries failed items with exponential backoff

#### Step 4: Migrate Storage

```bash
npm run migrate:storage
```

This migrates files from Firebase Storage to S3.

**Features:**

- Preserves file paths and metadata
- Skips files that already exist
- Handles large files efficiently

#### Step 5: Validate Migration

```bash
npm run migrate:validate
```

This validates that all data was migrated correctly.

**Checks:**

- Document counts match between Firestore and DynamoDB
- File counts match between Firebase Storage and S3
- Sample data comparison for data integrity

**Output:**

- Console report with pass/fail for each check
- `validation-report.json` with detailed results

## Validation

After migration, review the validation report:

```bash
cat migration-data/dynamodb/validation-report.json
```

### What to Check

1. **Document Counts**: All entity types should have matching counts
2. **Storage Files**: File counts should match
3. **Sample Data**: Spot-check that data structure is preserved
4. **Error Log**: Review `migration-data/errors.json` for any issues

### Manual Testing

Test your application with AWS services:

1. Start your application with AWS configuration
2. Test user authentication (Cognito)
3. Test data retrieval (DynamoDB)
4. Test file uploads/downloads (S3)
5. Test AI features (Bedrock)

## Rollback

If you need to undo the migration:

⚠️ **WARNING**: This will DELETE ALL data from DynamoDB and S3!

```bash
npm run migrate:rollback
```

You will be prompted twice to confirm before deletion proceeds.

### When to Rollback

- Critical bugs discovered after migration
- Data integrity issues
- Performance problems
- Need to re-run migration with different settings

### After Rollback

1. Fix any issues identified
2. Update migration configuration if needed
3. Re-run the migration process

## Troubleshooting

### Common Issues

#### 1. "Service account key not found"

**Solution**: Ensure `serviceAccountKey.json` exists and path is correct in `.env.migration`

#### 2. "AWS credentials not configured"

**Solution**: Run `aws configure` or set AWS environment variables

#### 3. "DynamoDB table does not exist"

**Solution**: Create the table using AWS CLI or Console (see Setup section)

#### 4. "Rate limit exceeded"

**Solution**: Reduce `BATCH_SIZE` in `.env.migration` and re-run

#### 5. "Some items failed to import"

**Solution**:

- Check `migration-data/errors.json` for details
- Fix any data issues
- Re-run import (it will skip existing items)

#### 6. "Validation failed - count mismatch"

**Possible causes:**

- Migration still in progress
- Some items failed to import (check error log)
- Data was modified during migration

**Solution:**

- Review error log
- Re-run import for failed items
- Re-run validation

### Dry Run Mode

Test the migration without making changes:

```bash
# In .env.migration
DRY_RUN=true
```

Then run any migration script. It will show what would happen without actually migrating data.

### Incremental Migration

You can migrate data incrementally:

1. Run export and transform once
2. Import in batches by modifying the import script
3. Validate after each batch
4. Continue until all data is migrated

### Performance Tuning

Adjust these settings in `.env.migration`:

```bash
# Increase for faster migration (may hit rate limits)
BATCH_SIZE=50

# Decrease if hitting rate limits
BATCH_SIZE=10
```

## Post-Migration

### 1. Monitor Application

- Watch CloudWatch metrics for DynamoDB and S3
- Monitor application logs for errors
- Check user reports for issues

### 2. Keep Firebase Running

Keep Firebase services running for at least 1-2 weeks as a backup:

- Don't delete Firebase data immediately
- Monitor both systems in parallel
- Be ready to switch back if needed

### 3. Update Application Configuration

Once confident in AWS migration:

- Update environment variables to use AWS services
- Remove Firebase dependencies (see task 17 in tasks.md)
- Update documentation

### 4. Decommission Firebase

After successful migration and monitoring period:

1. Export final backup from Firebase
2. Delete Firebase data
3. Downgrade Firebase plan
4. Remove Firebase configuration from application

## Support

If you encounter issues:

1. Check the error log: `migration-data/errors.json`
2. Review validation report: `migration-data/dynamodb/validation-report.json`
3. Check AWS CloudWatch logs
4. Review this guide's troubleshooting section

## Migration Checklist

- [ ] Backup Firebase data
- [ ] Get Firebase service account key
- [ ] Configure AWS credentials
- [ ] Create `.env.migration` file
- [ ] Verify AWS resources exist (DynamoDB table, S3 bucket)
- [ ] Run migration (all steps or individually)
- [ ] Review validation report
- [ ] Test application with AWS services
- [ ] Monitor for issues
- [ ] Keep Firebase running as backup
- [ ] After 1-2 weeks, decommission Firebase

## Data Mapping Reference

| Firestore Collection                    | DynamoDB Keys                                   | Entity Type            |
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

## Post-Migration Verification

### Application Testing Checklist

After migration, thoroughly test all features:

#### Authentication

- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Session persistence works
- [ ] Logout works

#### Data Operations

- [ ] User profile loads correctly
- [ ] Agent profile displays properly
- [ ] Saved content appears in library
- [ ] Research reports are accessible
- [ ] Marketing plans load correctly
- [ ] Competitors list displays
- [ ] Brand audits are viewable

#### File Operations

- [ ] Profile image upload works
- [ ] File download works
- [ ] Presigned URLs are generated
- [ ] Files are accessible

#### AI Features

- [ ] Agent bio generation works
- [ ] Blog post generation works
- [ ] Social media posts generate
- [ ] Market updates generate
- [ ] Research agent works
- [ ] NAP audit runs successfully

#### Integrations

- [ ] Google OAuth flow works
- [ ] Zillow reviews fetch
- [ ] News API integration works
- [ ] Tavily search works

### Performance Comparison

Compare performance metrics before and after migration:

| Metric              | Firebase | AWS | Change |
| ------------------- | -------- | --- | ------ |
| Page Load Time      |          |     |        |
| Auth Response Time  |          |     |        |
| Database Query Time |          |     |        |
| File Upload Time    |          |     |        |
| AI Generation Time  |          |     |        |

### Data Integrity Checks

Run these queries to verify data integrity:

```bash
# Count users in DynamoDB
aws dynamodb query \
  --table-name BayonCoAgent \
  --key-condition-expression "begins_with(PK, :pk)" \
  --expression-attribute-values '{":pk":{"S":"USER#"}}' \
  --select COUNT

# Count files in S3
aws s3 ls s3://bayon-coagent-storage --recursive | wc -l

# Sample random records
aws dynamodb scan \
  --table-name BayonCoAgent \
  --limit 10
```

## Rollback Procedure

If you need to rollback to Firebase:

### 1. Stop AWS Application

```bash
# Stop Amplify deployment or take down production
# Redirect traffic back to Firebase hosting
```

### 2. Re-enable Firebase Services

Update `.env.production` to use Firebase:

```bash
USE_FIREBASE=true
USE_AWS=false
```

### 3. Verify Firebase Data

Ensure Firebase data is current and complete.

### 4. Update DNS

Point domain back to Firebase hosting if needed.

### 5. Monitor

Watch for errors and user reports.

## Migration Timeline

Recommended timeline for a smooth migration:

### Week 1: Preparation

- [ ] Review migration guide
- [ ] Set up AWS account and services
- [ ] Deploy infrastructure with CDK
- [ ] Test local development setup
- [ ] Create backup of Firebase data

### Week 2: Migration

- [ ] Run data export from Firebase
- [ ] Transform data to DynamoDB format
- [ ] Import data to DynamoDB
- [ ] Migrate files to S3
- [ ] Run validation scripts

### Week 3: Testing

- [ ] Test all features in staging
- [ ] Performance testing
- [ ] Load testing
- [ ] Security audit
- [ ] User acceptance testing

### Week 4: Deployment

- [ ] Deploy to production
- [ ] Monitor closely for 48 hours
- [ ] Keep Firebase running as backup
- [ ] Gradual traffic migration (if possible)

### Week 5-6: Monitoring

- [ ] Monitor application performance
- [ ] Track error rates
- [ ] Gather user feedback
- [ ] Optimize as needed

### Week 7-8: Cleanup

- [ ] Verify AWS is stable
- [ ] Export final Firebase backup
- [ ] Decommission Firebase services
- [ ] Update documentation

## Troubleshooting Common Issues

### Issue: "Cannot read property 'PK' of undefined"

**Cause**: Data transformation didn't create proper keys

**Solution**:

```bash
# Re-run transformation with verbose logging
npm run migrate:transform -- --verbose

# Check transformed data
cat migration-data/dynamodb/all_items.json | jq '.[0]'
```

### Issue: "DynamoDB throughput exceeded"

**Cause**: Importing too fast

**Solution**:

```bash
# Reduce batch size in .env.migration
BATCH_SIZE=10

# Re-run import
npm run migrate:import
```

### Issue: "S3 upload failed: Access Denied"

**Cause**: Incorrect IAM permissions

**Solution**:

```bash
# Verify IAM policy includes s3:PutObject
aws iam get-user-policy --user-name migration-user --policy-name S3Access

# Update policy if needed
```

### Issue: "Validation shows count mismatch"

**Cause**: Some items failed to import

**Solution**:

```bash
# Check error log
cat migration-data/errors.json

# Re-run import (skips existing items)
npm run migrate:import

# Re-run validation
npm run migrate:validate
```

### Issue: "Application can't connect to DynamoDB"

**Cause**: Environment variables not set correctly

**Solution**:

```bash
# Verify environment variables
echo $DYNAMODB_TABLE_NAME
echo $AWS_REGION

# Update .env.production
# Restart application
```

## Migration Scripts Reference

### Export Script (`1-export-firestore.ts`)

Exports all Firestore collections to JSON files.

**Options**:

- `--collections`: Specific collections to export
- `--output`: Output directory

**Output**: `migration-data/firestore/*.json`

### Transform Script (`2-transform-data.ts`)

Transforms Firestore data to DynamoDB format.

**Key Transformations**:

- Converts collection paths to PK/SK patterns
- Adds EntityType field
- Adds timestamps
- Flattens nested data

**Output**: `migration-data/dynamodb/all_items.json`

### Import Script (`3-import-dynamodb.ts`)

Imports transformed data to DynamoDB.

**Features**:

- Batch writes (25 items per batch)
- Automatic retries with exponential backoff
- Skips existing items
- Progress tracking

**Output**: Console logs and `migration-data/import-log.json`

### Storage Migration Script (`4-migrate-storage.ts`)

Migrates files from Firebase Storage to S3.

**Features**:

- Preserves file paths
- Copies metadata
- Skips existing files
- Progress tracking

**Output**: Console logs and `migration-data/storage-log.json`

### Validation Script (`5-validate.ts`)

Validates migration completeness and correctness.

**Checks**:

- Document counts match
- File counts match
- Sample data comparison
- Key pattern validation

**Output**: `migration-data/validation-report.json`

### Rollback Script (`6-rollback.ts`)

Deletes all migrated data from AWS.

**Warning**: This is destructive and cannot be undone!

**Actions**:

- Deletes all DynamoDB items
- Deletes all S3 objects
- Requires double confirmation

## Security Notes

- Never commit `serviceAccountKey.json` to version control
- Never commit `.env.migration` to version control
- Use IAM roles with least privilege for AWS access
- Rotate AWS credentials after migration
- Delete service account key after migration is complete
- Enable CloudTrail for audit logging
- Use AWS Secrets Manager for sensitive credentials
- Implement VPC endpoints for private access
- Enable MFA for AWS root account
- Review and update security groups regularly
