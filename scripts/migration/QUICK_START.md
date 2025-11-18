# Migration Quick Start

## 5-Minute Setup

### 1. Get Firebase Service Account Key

```bash
# Download from Firebase Console → Project Settings → Service Accounts
# Save as serviceAccountKey.json in project root
```

### 2. Configure Environment

```bash
cp .env.migration.example .env.migration
# Edit .env.migration with your settings
```

### 3. Verify AWS Resources

```bash
# Check DynamoDB table exists
aws dynamodb describe-table --table-name BayonCoAgent

# Check S3 bucket exists
aws s3 ls s3://bayon-coagent-storage
```

### 4. Run Migration

```bash
npm run migrate:all
```

### 5. Validate

```bash
# Check validation report
cat migration-data/dynamodb/validation-report.json
```

## Common Commands

```bash
# Full migration
npm run migrate:all

# Individual steps
npm run migrate:export      # Export from Firestore
npm run migrate:transform   # Transform data
npm run migrate:import      # Import to DynamoDB
npm run migrate:storage     # Migrate files to S3
npm run migrate:validate    # Validate migration

# Rollback (DANGER!)
npm run migrate:rollback
```

## Troubleshooting

### Issue: "Service account key not found"

**Fix**: Ensure `serviceAccountKey.json` exists in project root

### Issue: "AWS credentials not configured"

**Fix**: Run `aws configure` or set environment variables

### Issue: "Table does not exist"

**Fix**: Create DynamoDB table (see MIGRATION_GUIDE.md)

### Issue: "Rate limit exceeded"

**Fix**: Reduce `BATCH_SIZE` in `.env.migration`

## Files to Check

- **Errors**: `migration-data/errors.json`
- **Validation**: `migration-data/dynamodb/validation-report.json`
- **Export Data**: `migration-data/firestore/`
- **Transformed Data**: `migration-data/dynamodb/`

## Safety Checklist

- [ ] Backup Firebase data
- [ ] Test with `DRY_RUN=true` first
- [ ] Run on test environment before production
- [ ] Keep Firebase running as backup
- [ ] Monitor application after migration

## Need Help?

See detailed guide: [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md)
