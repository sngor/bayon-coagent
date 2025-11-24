# Secrets Manager Deployment Guide

This guide walks you through deploying and configuring AWS Secrets Manager for the Bayon Coagent platform.

## Prerequisites

- AWS CLI configured with appropriate credentials
- SAM CLI installed
- Node.js and npm installed
- Access to OAuth provider developer consoles

## Step-by-Step Deployment

### Step 1: Deploy Infrastructure

Deploy the SAM template which creates all secret resources:

```bash
# Development environment
npm run sam:deploy:dev

# Production environment
npm run sam:deploy:prod
```

This creates:

- 6 empty secrets (Google, Facebook, Instagram, LinkedIn, Twitter, MLS)
- Secret rotation Lambda function
- Rotation schedules (90-day intervals)
- IAM roles and permissions

**Expected Output:**

```
Successfully created/updated stack - bayon-coagent-development
```

### Step 2: Verify Secret Creation

Check that all secrets were created:

```bash
aws secretsmanager list-secrets \
  --filters Key=name,Values=bayon-coagent \
  --query 'SecretList[].Name' \
  --output table
```

**Expected Output:**

```
---------------------------------------------------------
|                     ListSecrets                       |
+-------------------------------------------------------+
|  bayon-coagent/oauth/google-development              |
|  bayon-coagent/oauth/facebook-development            |
|  bayon-coagent/oauth/instagram-development           |
|  bayon-coagent/oauth/linkedin-development            |
|  bayon-coagent/oauth/twitter-development             |
|  bayon-coagent/mls/api-credentials-development       |
+-------------------------------------------------------+
```

### Step 3: Obtain OAuth Credentials

Before populating secrets, obtain credentials from each provider:

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs:
     - Dev: `http://localhost:3000/api/oauth/google/callback`
     - Prod: `https://yourdomain.com/api/oauth/google/callback`
5. Copy Client ID and Client Secret

#### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app or select existing
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs in Settings > Basic
5. Copy App ID and App Secret

#### Instagram OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Same app as Facebook or create new
3. Add "Instagram Basic Display" product
4. Configure OAuth redirect URIs
5. Copy App ID and App Secret

#### LinkedIn OAuth

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Configure OAuth redirect URIs in Auth tab
5. Copy Client ID and Client Secret

#### Twitter OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or select existing
3. Go to Keys and Tokens tab
4. Generate:
   - API Key and Secret
   - Bearer Token
5. Configure OAuth 2.0 redirect URIs in User authentication settings
6. Copy all credentials

#### MLS API

1. Contact your MLS provider (MLSGrid, Bridge Interactive)
2. Request API credentials
3. Obtain:
   - MLSGrid: API Key, API Secret, Base URL
   - Bridge Interactive: API Key, Base URL

### Step 4: Populate Secrets

Use the interactive setup script:

```bash
npm run setup:secrets -- --environment development
```

The script will prompt you for credentials for each provider. You can skip any provider by leaving fields empty.

**Example Session:**

```
🔐 Setting up AWS Secrets Manager secrets for development environment

Checking existing secrets...

Found secrets:
  - bayon-coagent/oauth/google-development
  - bayon-coagent/oauth/facebook-development
  ...

Do you want to set up all secrets now? (y/n): y

--- Google OAuth Credentials ---
Get these from: https://console.cloud.google.com/apis/credentials

Google Client ID: 123456789.apps.googleusercontent.com
Google Client Secret: GOCSPX-abc123def456
Production Redirect URI (default: http://localhost:3000/api/oauth/google/callback):
✓ Google OAuth credentials saved

...

✅ All secrets have been set up successfully!
```

### Step 5: Verify Configuration

Run the verification script:

```bash
npm run verify:secrets -- --environment development
```

**Expected Output:**

```
🔐 Verifying AWS Secrets Manager setup for development environment

📊 Verification Results:

────────────────────────────────────────────────────────────────────────────────
✅ bayon-coagent/oauth/google-development
   🔄 Rotation enabled
      Next rotation: 2024-04-01T00:00:00.000Z

✅ bayon-coagent/oauth/facebook-development
   🔄 Rotation enabled
      Next rotation: 2024-04-01T00:00:00.000Z

...

────────────────────────────────────────────────────────────────────────────────

✅ All secrets are properly configured!
```

### Step 6: Test Integration

Test that your application can retrieve secrets:

```bash
# Create a test script
cat > test-secrets.ts << 'EOF'
import { getGoogleOAuthCredentials } from './src/aws/secrets-manager/client';

async function test() {
  try {
    const creds = await getGoogleOAuthCredentials();
    console.log('✅ Successfully retrieved Google OAuth credentials');
    console.log('Client ID:', creds.clientId.substring(0, 10) + '...');
    console.log('Redirect URI:', creds.redirectUri);
  } catch (error) {
    console.error('❌ Failed to retrieve credentials:', error);
  }
}

test();
EOF

# Run the test
tsx test-secrets.ts
```

**Expected Output:**

```
✅ Successfully retrieved Google OAuth credentials
Client ID: 1234567890...
Redirect URI: http://localhost:3000/api/oauth/google/callback
```

### Step 7: Configure Rotation Monitoring

Set up CloudWatch alarms for rotation failures:

```bash
# Create SNS topic for alerts (if not exists)
aws sns create-topic --name bayon-coagent-secrets-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:bayon-coagent-secrets-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create CloudWatch alarm for rotation failures
aws cloudwatch put-metric-alarm \
  --alarm-name bayon-coagent-secret-rotation-failures \
  --alarm-description "Alert on secret rotation failures" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=bayon-coagent-secret-rotation-development \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:bayon-coagent-secrets-alerts
```

## Manual Secret Update

If you need to update a secret manually:

```bash
# Create a JSON file with the new credentials
cat > google-oauth.json << 'EOF'
{
  "clientId": "new-client-id",
  "clientSecret": "new-client-secret",
  "redirectUri": "http://localhost:3000/api/oauth/google/callback"
}
EOF

# Update the secret
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --secret-string file://google-oauth.json

# Verify the update
aws secretsmanager get-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --query SecretString \
  --output text | jq .
```

## Troubleshooting

### Secret Not Found

**Problem:** `ResourceNotFoundException: Secrets Manager can't find the specified secret`

**Solution:**

```bash
# Check if secret exists
aws secretsmanager list-secrets --filters Key=name,Values=bayon-coagent

# If not found, redeploy infrastructure
npm run sam:deploy:dev
```

### Permission Denied

**Problem:** `AccessDeniedException: User is not authorized to perform: secretsmanager:GetSecretValue`

**Solution:**

```bash
# Check IAM role permissions
aws iam get-role-policy \
  --role-name bayon-coagent-app-development \
  --policy-name SecretsManagerAccess

# If missing, redeploy infrastructure
npm run sam:deploy:dev
```

### Invalid Secret Format

**Problem:** `ValidationException: Invalid JSON`

**Solution:**

```bash
# Validate JSON before updating
cat secret.json | jq .

# If valid, update secret
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --secret-string file://secret.json
```

### Rotation Failure

**Problem:** Secret rotation fails

**Solution:**

```bash
# Check rotation Lambda logs
aws logs tail /aws/lambda/bayon-coagent-secret-rotation-development --follow

# Check rotation configuration
aws secretsmanager describe-secret \
  --secret-id bayon-coagent/oauth/google-development

# Manually trigger rotation to test
aws secretsmanager rotate-secret \
  --secret-id bayon-coagent/oauth/google-development
```

## Production Deployment

For production deployment, follow the same steps but use production environment:

```bash
# Deploy infrastructure
npm run sam:deploy:prod

# Setup secrets
npm run setup:secrets -- --environment production

# Verify
npm run verify:secrets -- --environment production
```

**Important Production Considerations:**

1. **Use production OAuth credentials** - Don't reuse development credentials
2. **Update redirect URIs** - Use your production domain
3. **Enable CloudWatch alarms** - Monitor rotation and access
4. **Set up backup** - Enable AWS Backup for secrets
5. **Document credentials** - Keep secure record of where credentials came from
6. **Test thoroughly** - Verify all OAuth flows work in production

## Rollback Procedure

If you need to rollback to previous secret values:

```bash
# List secret versions
aws secretsmanager list-secret-version-ids \
  --secret-id bayon-coagent/oauth/google-development

# Get previous version
aws secretsmanager get-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --version-id PREVIOUS_VERSION_ID

# Restore previous version
aws secretsmanager update-secret-version-stage \
  --secret-id bayon-coagent/oauth/google-development \
  --version-stage AWSCURRENT \
  --move-to-version-id PREVIOUS_VERSION_ID
```

## Monitoring and Maintenance

### Daily Checks

```bash
# Check for rotation failures
aws logs filter-log-events \
  --log-group-name /aws/lambda/bayon-coagent-secret-rotation-development \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 day ago' +%s)000

# Check secret access patterns
aws cloudwatch get-metric-statistics \
  --namespace AWS/SecretsManager \
  --metric-name SecretRetrievalCount \
  --dimensions Name=SecretId,Value=bayon-coagent/oauth/google-development \
  --start-time $(date -d '1 day ago' --iso-8601) \
  --end-time $(date --iso-8601) \
  --period 3600 \
  --statistics Sum
```

### Monthly Tasks

1. Review rotation schedules
2. Check for unused secrets
3. Verify IAM permissions are still minimal
4. Review CloudWatch costs
5. Update documentation if credentials changed

## Cost Monitoring

```bash
# Get Secrets Manager costs for current month
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://filter.json

# filter.json:
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["AWS Secrets Manager"]
  }
}
```

Expected cost: **~$2.50/month per environment**

## Security Checklist

- [ ] All secrets encrypted at rest
- [ ] IAM permissions follow least privilege
- [ ] Rotation enabled for all secrets
- [ ] CloudWatch logging enabled
- [ ] Alerts configured for failures
- [ ] No secrets in environment variables
- [ ] No secrets in version control
- [ ] Production secrets separate from development
- [ ] Backup strategy in place
- [ ] Access audit trail enabled

## Support

For issues or questions:

1. Check CloudWatch Logs
2. Review documentation in `docs/secrets-management.md`
3. Run verification script: `npm run verify:secrets`
4. Check AWS Secrets Manager console
5. Contact DevOps team
