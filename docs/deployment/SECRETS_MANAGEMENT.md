# AWS Secrets Management Guide

## Overview

This guide covers managing sensitive credentials and API keys using AWS Secrets Manager for the Bayon CoAgent application. Secrets Manager provides secure storage, automatic rotation, and fine-grained access control for sensitive data.

## Why Use Secrets Manager?

- **Security**: Encrypted at rest and in transit
- **Rotation**: Automatic secret rotation capabilities
- **Audit**: All access logged in CloudTrail
- **Access Control**: IAM-based permissions
- **No Code Changes**: Update secrets without redeploying

## Secrets Structure

### Naming Convention

Secrets follow this naming pattern:
```
bayon-coagent/{environment}/{service-name}
```

Examples:
- `bayon-coagent/production/google-oauth`
- `bayon-coagent/production/stripe`
- `bayon-coagent/production/facebook-oauth`

## Required Secrets

### 1. Google OAuth
```json
{
  "client_id": "your-google-client-id.apps.googleusercontent.com",
  "client_secret": "GOCSPX-xxxxxxxxxxxxxxxxxxxx",
  "redirect_uri": "https://your-domain.com/api/oauth/google/callback"
}
```

### 2. Facebook OAuth
```json
{
  "app_id": "your-facebook-app-id",
  "app_secret": "your-facebook-app-secret",
  "redirect_uri": "https://your-domain.com/api/oauth/facebook/callback"
}
```

### 3. LinkedIn OAuth
```json
{
  "client_id": "your-linkedin-client-id",
  "client_secret": "your-linkedin-client-secret",
  "redirect_uri": "https://your-domain.com/api/oauth/linkedin/callback"
}
```

### 4. Stripe
```json
{
  "publishable_key": "pk_live_your_publishable_key_here",
  "secret_key": "sk_live_your_secret_key_here",
  "webhook_secret": "whsec_your_webhook_secret_here"
}
```

### 5. External APIs
```json
{
  "bridge_api_key": "your-bridge-api-key",
  "news_api_key": "your-news-api-key",
  "tavily_api_key": "your-tavily-api-key",
  "google_ai_api_key": "your-google-ai-api-key"
}
```

### 6. MLS Providers
Each MLS provider should have its own secret:

**FlexMLS**:
```json
{
  "client_id": "your-flexmls-client-id",
  "client_secret": "your-flexmls-client-secret",
  "api_url": "https://api.flexmls.com/v1"
}
```

**CRMLS**:
```json
{
  "client_id": "your-crmls-client-id",
  "client_secret": "your-crmls-client-secret",
  "api_url": "https://api.crmls.org/RESO/OData"
}
```

### 7. CRM Integrations
```json
{
  "followupboss_api_key": "your-followupboss-api-key",
  "hubspot_client_id": "your-hubspot-client-id",
  "hubspot_client_secret": "your-hubspot-client-secret",
  "calendly_client_id": "your-calendly-client-id",
  "calendly_client_secret": "your-calendly-client-secret"
}
```

## Creating Secrets

### Method 1: Using the Setup Script (Recommended)

```bash
# Run the automated setup script
./scripts/setup-secrets-manager.sh production
```

The script will prompt you for each secret value and create them in Secrets Manager.

### Method 2: AWS CLI

#### Create a Secret

```bash
aws secretsmanager create-secret \
  --name bayon-coagent/production/google-oauth \
  --description "Google OAuth credentials for production" \
  --secret-string '{
    "client_id": "your-client-id",
    "client_secret": "your-client-secret",
    "redirect_uri": "https://your-domain.com/api/oauth/google/callback"
  }' \
  --region us-west-2
```

#### Update a Secret

```bash
aws secretsmanager update-secret \
  --secret-id bayon-coagent/production/google-oauth \
  --secret-string '{
    "client_id": "new-client-id",
    "client_secret": "new-client-secret",
    "redirect_uri": "https://your-domain.com/api/oauth/google/callback"
  }' \
  --region us-west-2
```

### Method 3: AWS Console

1. Navigate to AWS Secrets Manager:
   ```
   https://console.aws.amazon.com/secretsmanager/
   ```

2. Click "Store a new secret"

3. Select "Other type of secret"

4. Choose "Plaintext" and paste JSON:
   ```json
   {
     "client_id": "your-value",
     "client_secret": "your-value"
   }
   ```

5. Name the secret: `bayon-coagent/production/google-oauth`

6. Configure rotation (optional)

7. Review and store

## Retrieving Secrets in Application

### Server-Side (Node.js)

Create a secrets helper:

```typescript
// src/lib/secrets.ts
import { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ 
  region: process.env.AWS_REGION || 'us-west-2' 
});

export async function getSecret(secretName: string): Promise<any> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    
    throw new Error('Secret not found');
  } catch (error) {
    console.error(`Error retrieving secret ${secretName}:`, error);
    throw error;
  }
}

// Usage example
export async function getGoogleOAuthConfig() {
  const secret = await getSecret(
    `bayon-coagent/${process.env.NODE_ENV}/google-oauth`
  );
  
  return {
    clientId: secret.client_id,
    clientSecret: secret.client_secret,
    redirectUri: secret.redirect_uri,
  };
}
```

### Lambda Functions

Lambda functions automatically have access to Secrets Manager if their execution role has the appropriate permissions:

```typescript
// In Lambda function
import { getSecret } from './secrets';

export async function handler(event: any) {
  const stripeConfig = await getSecret('bayon-coagent/production/stripe');
  
  // Use stripeConfig.secret_key
}
```

### Caching Secrets

To reduce API calls and costs, cache secrets:

```typescript
// src/lib/secrets-cache.ts
const secretCache = new Map<string, { value: any; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedSecret(secretName: string): Promise<any> {
  const cached = secretCache.get(secretName);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  
  const secret = await getSecret(secretName);
  
  secretCache.set(secretName, {
    value: secret,
    expiry: Date.now() + CACHE_TTL,
  });
  
  return secret;
}
```

## IAM Permissions

### Application Role Permissions

Your application's IAM role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-west-2:ACCOUNT_ID:secret:bayon-coagent/production/*"
      ]
    }
  ]
}
```

This is already included in the `template.yaml` ApplicationRole.

### Developer Access

Developers who need to create/update secrets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:CreateSecret",
        "secretsmanager:UpdateSecret",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecrets"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-west-2:ACCOUNT_ID:secret:bayon-coagent/*"
      ]
    }
  ]
}
```

## Secret Rotation

### Automatic Rotation

For secrets that support automatic rotation (like database credentials):

```bash
aws secretsmanager rotate-secret \
  --secret-id bayon-coagent/production/database \
  --rotation-lambda-arn arn:aws:lambda:us-west-2:ACCOUNT_ID:function:SecretsManagerRotation \
  --rotation-rules AutomaticallyAfterDays=30
```

### Manual Rotation

For API keys and OAuth secrets, rotation is typically manual:

1. Generate new credentials with the provider
2. Update the secret in Secrets Manager
3. Verify the application works with new credentials
4. Revoke old credentials with the provider

## Security Best Practices

### 1. Use Resource-Based Policies

Restrict access to specific secrets:

```bash
aws secretsmanager put-resource-policy \
  --secret-id bayon-coagent/production/stripe \
  --resource-policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/bayon-coagent-app-production"
      },
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "*"
    }]
  }'
```

### 2. Enable CloudTrail Logging

Monitor all Secrets Manager access:

```bash
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::SecretsManager::Secret \
  --max-results 50
```

### 3. Tag Secrets

Apply tags for organization and cost tracking:

```bash
aws secretsmanager tag-resource \
  --secret-id bayon-coagent/production/google-oauth \
  --tags Key=Environment,Value=production Key=Application,Value=BayonCoAgent
```

### 4. Use Encryption

Secrets are encrypted with AWS KMS by default. Optionally use your own KMS key:

```bash
aws secretsmanager create-secret \
  --name bayon-coagent/production/sensitive-data \
  --kms-key-id arn:aws:kms:us-west-2:ACCOUNT_ID:key/YOUR-KEY-ID \
  --secret-string '{"key":"value"}'
```

## Cost Optimization

### Secrets Manager Pricing

- **Storage**: $0.40 per secret per month
- **API Calls**: $0.05 per 10,000 API calls

### Optimization Tips

1. **Cache secrets** to reduce API calls
2. **Consolidate secrets** where appropriate (combine related keys)
3. **Delete unused secrets**
4. **Use batch retrieval** if fetching multiple secrets

## Troubleshooting

### Secret Not Found

**Error**: `ResourceNotFoundException`

**Solutions**:
- Verify secret name is correct
- Check region matches
- Verify IAM permissions
- Check secret wasn't deleted

### Access Denied

**Error**: `AccessDeniedException`

**Solutions**:
- Verify IAM role has `secretsmanager:GetSecretValue` permission
- Check resource-based policy on the secret
- Verify KMS key permissions (if using custom KMS key)

### Invalid JSON

**Error**: `JSON parse error`

**Solutions**:
- Validate JSON format
- Check for trailing commas
- Verify quotes are properly escaped

## Migration from Environment Variables

To migrate from environment variables to Secrets Manager:

1. **Identify sensitive values** in `.env` files
2. **Create secrets** for each service/group
3. **Update application code** to fetch from Secrets Manager
4. **Test thoroughly** in development
5. **Deploy to production**
6. **Remove old environment variables**

Example migration:

```typescript
// Before
const stripeKey = process.env.STRIPE_SECRET_KEY;

// After
const stripeSecret = await getSecret('bayon-coagent/production/stripe');
const stripeKey = stripeSecret.secret_key;
```

## Backup and Recovery

### Export Secrets (for backup)

```bash
#!/bin/bash
# Backup all secrets to a file (store securely!)

for secret in $(aws secretsmanager list-secrets --query 'SecretList[?starts_with(Name, `bayon-coagent/production`)].Name' --output text); do
  echo "Backing up $secret"
  aws secretsmanager get-secret-value --secret-id $secret --query 'SecretString' --output text > "backup-${secret//\//-}.json"
done
```

### Restore Secrets

```bash
#!/bin/bash
# Restore secrets from backup

for file in backup-*.json; do
  secret_name=$(echo $file | sed 's/backup-//; s/.json//; s/-/\//g')
  echo "Restoring $secret_name"
  aws secretsmanager create-secret --name $secret_name --secret-string file://$file
done
```

## Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/)
