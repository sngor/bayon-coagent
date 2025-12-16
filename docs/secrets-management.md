# AWS Secrets Manager Setup Guide

This guide explains how to set up and manage OAuth credentials and API keys using AWS Secrets Manager.

## Overview

The Bayon Coagent platform uses AWS Secrets Manager to securely store and manage sensitive credentials:

- **Google OAuth** - For Google Business Profile integration (profile management only)
- **Facebook OAuth** - For Facebook social media integration and analytics
- **Instagram OAuth** - For Instagram social media integration and analytics
- **LinkedIn OAuth** - For LinkedIn social media integration and analytics
- **Twitter OAuth** - For Twitter social media integration and analytics
- **MLS API** - For MLS listing data integration (MLSGrid and Bridge Interactive)

## Architecture

### Secret Structure

All secrets follow a consistent naming pattern:

```
bayon-coagent/{category}/{provider}-{environment}
```

Examples:

- `bayon-coagent/oauth/google-development`
- `bayon-coagent/oauth/facebook-production`
- `bayon-coagent/mls/api-credentials-development`

### Automatic Rotation

All secrets are configured with automatic rotation every 90 days:

- Rotation is handled by a Lambda function (`secret-rotation.ts`)
- OAuth credentials require manual update with the provider
- The rotation function validates secret structure
- Rotation events are logged to CloudWatch

### Caching

The Secrets Manager client includes built-in caching:

- Secrets are cached for 5 minutes by default
- Reduces API calls and improves performance
- Cache can be cleared manually if needed

## Setup Instructions

### 1. Deploy Infrastructure

First, deploy the SAM template which creates all secret resources:

```bash
# Development environment
npm run sam:deploy:dev

# Production environment
npm run sam:deploy:prod
```

This creates:

- Empty secret placeholders for all OAuth providers
- Secret rotation Lambda function
- IAM roles and permissions
- Rotation schedules (90 days)

### 2. Populate Secrets

Use the interactive setup script to populate your credentials:

```bash
# Development environment
npm run setup:secrets -- --environment development

# Production environment
npm run setup:secrets -- --environment production
```

The script will prompt you for credentials for each provider. You can skip any provider by leaving the fields empty.

### 3. Get OAuth Credentials

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/api/oauth/google/callback` (dev) or your production URL
4. Copy the Client ID and Client Secret

#### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create a new app or use existing
3. Add Facebook Login product
4. Configure OAuth redirect URI
5. Copy the App ID and App Secret

#### Instagram OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Add Instagram Basic Display product
3. Configure OAuth redirect URI
4. Copy the App ID and App Secret

#### LinkedIn OAuth

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Add Sign In with LinkedIn product
4. Configure OAuth redirect URI
5. Copy the Client ID and Client Secret

#### Twitter OAuth

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use existing
3. Generate API Key, API Secret, and Bearer Token
4. Configure OAuth redirect URI
5. Copy all credentials

#### MLS API

1. Contact your MLS provider (MLSGrid, Bridge Interactive)
2. Request API credentials
3. Copy API keys and base URLs

## Usage in Code

### Retrieving Secrets

Use the helper functions in `src/aws/secrets-manager/client.ts`:

```typescript
import {
  getGoogleOAuthCredentials,
  getFacebookOAuthCredentials,
  getMLSAPICredentials,
} from "@/aws/secrets-manager/client";

// Get Google OAuth credentials
const googleCreds = await getGoogleOAuthCredentials();
console.log(googleCreds.clientId);
console.log(googleCreds.clientSecret);

// Get MLS API credentials
const mlsCreds = await getMLSAPICredentials();
console.log(mlsCreds.mlsgrid.apiKey);
```

### Generic Secret Retrieval

For custom secrets or direct access:

```typescript
import { getSecret } from "@/aws/secrets-manager/client";

// Get any secret by name
const secret = await getSecret("bayon-coagent/oauth/google-development");

// Disable caching for fresh value
const freshSecret = await getSecret("my-secret", false);
```

### Cache Management

```typescript
import { clearSecretCache, clearSecret } from "@/aws/secrets-manager/client";

// Clear entire cache
clearSecretCache();

// Clear specific secret
clearSecret("bayon-coagent/oauth/google-development");
```

## Secret Rotation

### How It Works

1. **createSecret**: Creates a new version with `AWSPENDING` stage
2. **setSecret**: Prepares the secret for rotation (logs warning for OAuth)
3. **testSecret**: Validates the secret structure
4. **finishSecret**: Moves `AWSCURRENT` stage to new version

### Manual Rotation

For OAuth credentials, rotation requires manual steps:

1. Generate new credentials with the OAuth provider
2. Update the secret in AWS Secrets Manager:

```bash
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --secret-string '{
    "clientId": "new-client-id",
    "clientSecret": "new-client-secret",
    "redirectUri": "http://localhost:3000/api/oauth/google/callback"
  }'
```

3. Test the new credentials
4. Update the old credentials with the provider

### Monitoring Rotation

Check CloudWatch Logs for rotation events:

```bash
aws logs tail /aws/lambda/bayon-coagent-secret-rotation-development --follow
```

## Security Best Practices

### IAM Permissions

Lambda functions have minimal permissions:

- Only access to their required secrets
- No permission to list all secrets
- Read-only access (except rotation function)

### Network Security

- Secrets are encrypted at rest using AWS KMS
- All API calls use TLS 1.2+
- Secrets are never logged or exposed in error messages

### Access Patterns

```typescript
// ✅ Good: Use helper functions
const creds = await getGoogleOAuthCredentials();

// ✅ Good: Cache is enabled by default
const creds = await getSecret("my-secret");

// ⚠️ Caution: Disable cache only when necessary
const freshCreds = await getSecret("my-secret", false);

// ❌ Bad: Don't log secrets
console.log(creds); // Never do this!

// ✅ Good: Log only non-sensitive info
console.log("Retrieved credentials for:", creds.redirectUri);
```

### Environment Variables

Never store credentials in environment variables. Always use Secrets Manager:

```typescript
// ❌ Bad
const clientId = process.env.GOOGLE_CLIENT_ID;

// ✅ Good
const { clientId } = await getGoogleOAuthCredentials();
```

## Troubleshooting

### Secret Not Found

```
Error: Secret not found: bayon-coagent/oauth/google-development
```

**Solution**: Deploy the SAM template first:

```bash
npm run sam:deploy:dev
```

### Permission Denied

```
Error: User is not authorized to perform: secretsmanager:GetSecretValue
```

**Solution**: Ensure your Lambda function has the correct IAM role with Secrets Manager permissions.

### Invalid Secret Structure

```
Error: Google OAuth secret missing required fields
```

**Solution**: Ensure your secret has all required fields:

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/api/oauth/google/callback"
}
```

### Rotation Failed

Check CloudWatch Logs:

```bash
aws logs tail /aws/lambda/bayon-coagent-secret-rotation-development --follow
```

Common issues:

- Missing required fields in secret
- Invalid JSON format
- Network connectivity issues

## Manual Secret Management

### AWS Console

1. Go to [AWS Secrets Manager Console](https://console.aws.amazon.com/secretsmanager/)
2. Find your secret (e.g., `bayon-coagent/oauth/google-development`)
3. Click "Retrieve secret value"
4. Click "Edit" to update
5. Save changes

### AWS CLI

```bash
# Get secret value
aws secretsmanager get-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --query SecretString \
  --output text | jq .

# Update secret value
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --secret-string file://secret.json

# List all secrets
aws secretsmanager list-secrets \
  --filters Key=name,Values=bayon-coagent

# Describe secret (includes rotation info)
aws secretsmanager describe-secret \
  --secret-id bayon-coagent/oauth/google-development
```

## Cost Optimization

### Pricing

- $0.40 per secret per month
- $0.05 per 10,000 API calls
- Caching reduces API calls significantly

### Recommendations

1. **Use caching**: Default 5-minute cache reduces costs
2. **Batch operations**: Retrieve multiple secrets at once when possible
3. **Monitor usage**: Check CloudWatch metrics for API call patterns
4. **Clean up**: Delete unused secrets in non-production environments

## References

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Secret Rotation Documentation](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [IAM Permissions for Secrets Manager](https://docs.aws.amazon.com/secretsmanager/latest/userguide/auth-and-access.html)
