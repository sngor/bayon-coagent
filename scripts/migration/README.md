# Data Migration Scripts

This directory contains scripts for migrating data from Firebase (Firestore and Storage) to AWS (DynamoDB and S3).

## Prerequisites

1. **Firebase Admin SDK**: Ensure you have a Firebase service account key file
2. **AWS Credentials**: Configure AWS credentials with access to DynamoDB and S3
3. **Environment Variables**: Set up required environment variables

## Environment Setup

Create a `.env.migration` file in the project root:

```bash
# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/serviceAccountKey.json

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
DYNAMODB_TABLE_NAME=BayonCoAgent
S3_BUCKET_NAME=bayon-coagent-storage

# Migration Options
DRY_RUN=false
BATCH_SIZE=25
VALIDATE_DATA=true
```

## Scripts

### 1. Export from Firestore

```bash
npm run migrate:export
```

Exports all data from Firestore to JSON files in `./migration-data/firestore/`.

### 2. Transform Data

```bash
npm run migrate:transform
```

Transforms exported Firestore data to DynamoDB format in `./migration-data/dynamodb/`.

### 3. Import to DynamoDB

```bash
npm run migrate:import
```

Imports transformed data into DynamoDB.

### 4. Migrate Storage Files

```bash
npm run migrate:storage
```

Migrates files from Firebase Storage to S3.

### 5. Validate Migration

```bash
npm run migrate:validate
```

Validates that all data was migrated correctly by comparing counts and sampling data.

### 6. Full Migration

```bash
npm run migrate:all
```

Runs all migration steps in sequence.

### 7. Rollback

```bash
npm run migrate:rollback
```

Deletes all migrated data from DynamoDB and S3 (use with caution!).

## Migration Process

1. **Backup**: Always backup your Firebase data before starting
2. **Dry Run**: Run with `DRY_RUN=true` first to test
3. **Export**: Export data from Firestore
4. **Transform**: Transform to DynamoDB format
5. **Validate**: Review transformed data in `./migration-data/dynamodb/`
6. **Import**: Import to DynamoDB
7. **Storage**: Migrate storage files
8. **Verify**: Run validation script to ensure data integrity

## Data Mapping

### Firestore → DynamoDB

| Firestore Path                          | DynamoDB Keys                                   |
| --------------------------------------- | ----------------------------------------------- |
| `/users/{userId}`                       | PK: `USER#{userId}`, SK: `PROFILE`              |
| `/users/{userId}/agentProfiles/{id}`    | PK: `USER#{userId}`, SK: `AGENT#{id}`           |
| `/reviews/{reviewId}`                   | PK: `REVIEW#{agentId}`, SK: `REVIEW#{reviewId}` |
| `/users/{userId}/brandAudits/{id}`      | PK: `USER#{userId}`, SK: `AUDIT#{id}`           |
| `/users/{userId}/competitors/{id}`      | PK: `USER#{userId}`, SK: `COMPETITOR#{id}`      |
| `/users/{userId}/researchReports/{id}`  | PK: `USER#{userId}`, SK: `REPORT#{id}`          |
| `/users/{userId}/projects/{id}`         | PK: `USER#{userId}`, SK: `PROJECT#{id}`         |
| `/users/{userId}/savedContent/{id}`     | PK: `USER#{userId}`, SK: `CONTENT#{id}`         |
| `/users/{userId}/trainingProgress/{id}` | PK: `USER#{userId}`, SK: `TRAINING#{id}`        |
| `/users/{userId}/marketingPlans/{id}`   | PK: `USER#{userId}`, SK: `PLAN#{id}`            |
| `/users/{userId}/reviewAnalyses/{id}`   | PK: `USER#{userId}`, SK: `ANALYSIS#{id}`        |
| `/googleBusinessProfiles/{userId}`      | PK: `OAUTH#{userId}`, SK: `GOOGLE_BUSINESS`     |

### Firebase Storage → S3

| Firebase Storage Path         | S3 Key                       |
| ----------------------------- | ---------------------------- |
| `/users/{userId}/profile.jpg` | `users/{userId}/profile.jpg` |

## Error Handling

- Failed items are logged to `./migration-data/errors.json`
- Migration can be resumed by re-running the import script (it skips existing items)
- Use rollback script only if you need to start over completely

## Monitoring

The scripts provide detailed progress information:

- Total items to migrate
- Current progress (percentage)
- Items per second
- Estimated time remaining
- Error count

## Safety Features

- **Dry Run Mode**: Test without making changes
- **Batch Processing**: Processes items in batches to avoid rate limits
- **Error Recovery**: Continues on errors and logs them
- **Validation**: Compares source and destination data
- **Rollback**: Can undo migration if needed
