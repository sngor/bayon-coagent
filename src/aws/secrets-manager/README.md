# AWS Secrets Manager Integration

This module provides secure credential management for OAuth providers and external API integrations using AWS Secrets Manager.

## Features

- **Secure Storage**: OAuth credentials and API keys stored encrypted in AWS Secrets Manager
- **Automatic Rotation**: Secrets automatically rotate every 90 days
- **Caching**: In-memory caching to reduce API calls (5-minute TTL)
- **Type Safety**: TypeScript interfaces for all credential types
- **Environment Isolation**: Separate secrets for development and production

## Supported Providers

### OAuth Providers

- Google (Business Profile integration)
- Facebook (Social media publishing)
- Instagram (Social media publishing)
- LinkedIn (Social media publishing)
- Twitter (Social media publishing)

### API Providers

- MLSGrid (MLS listing data)
- Bridge Interactive (MLS listing data)

## Usage

### Retrieving Credentials

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

```typescript
import { getSecret } from "@/aws/secrets-manager/client";

// Get any secret by name
const customSecret = await getSecret("my-custom-secret");

// Disable caching for sensitive operations
const freshSecret = await getSecret("my-secret", false);
```

### Cache Management

```typescript
import { clearSecretCache, clearSecret } from "@/aws/secrets-manager/client";

// Clear all cached secrets
clearSecretCache();

// Clear a specific secret
clearSecret("bayon-coagent/oauth/google-development");
```

## Secret Structure

### Google OAuth

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "https://yourdomain.com/api/oauth/google/callback"
}
```

### Facebook/Instagram OAuth

```json
{
  "appId": "your-app-id",
  "appSecret": "your-app-secret",
  "redirectUri": "https://yourdomain.com/api/oauth/facebook/callback"
}
```

### LinkedIn OAuth

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "https://yourdomain.com/api/oauth/linkedin/callback"
}
```

### Twitter OAuth

```json
{
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "bearerToken": "your-bearer-token",
  "redirectUri": "https://yourdomain.com/api/oauth/twitter/callback"
}
```

### MLS API

```json
{
  "mlsgrid": {
    "apiKey": "your-mlsgrid-api-key",
    "apiSecret": "your-mlsgrid-api-secret",
    "baseUrl": "https://api.mlsgrid.com/v2"
  },
  "bridgeInteractive": {
    "apiKey": "your-bridge-api-key",
    "baseUrl": "https://api.bridgeinteractive.com/v2"
  }
}
```

## Secret Rotation

Secrets are automatically rotated every 90 days using AWS Secrets Manager's rotation feature.

### Rotation Process

1. **createSecret**: Creates a new version of the secret
2. **setSecret**: Updates the secret in the external service (if applicable)
3. **testSecret**: Verifies the new secret works
4. **finishSecret**: Marks the new version as current

### Manual Rotation

For OAuth credentials that require manual updates in the provider's console:

1. Update credentials in the provider's console (Google, Facebook, etc.)
2. Update the secret in AWS Secrets Manager:
   ```bash
   aws secretsmanager update-secret \
     --secret-id bayon-coagent/oauth/google-development \
     --secret-string '{"clientId":"new-id","clientSecret":"new-secret","redirectUri":"..."}'
   ```
3. Clear the cache to force refresh:
   ```typescript
   clearSecret("bayon-coagent/oauth/google-development");
   ```

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment-specific secrets** (development vs production)
3. **Rotate secrets regularly** (automatic 90-day rotation)
4. **Use IAM policies** to restrict access to secrets
5. **Monitor secret access** using CloudWatch Logs
6. **Clear cache** after rotation to ensure fresh credentials

## IAM Permissions

Lambda functions need the following permissions to access secrets:

```yaml
- Effect: Allow
  Action:
    - secretsmanager:GetSecretValue
  Resource:
    - arn:aws:secretsmanager:region:account:secret:bayon-coagent/oauth/*
    - arn:aws:secretsmanager:region:account:secret:bayon-coagent/mls/*
```

## Environment Variables

- `AWS_REGION`: AWS region for Secrets Manager (default: us-east-1)
- `NODE_ENV`: Environment name for secret selection (development or production)

## Troubleshooting

### Secret Not Found

- Verify the secret exists in AWS Secrets Manager
- Check the environment name matches (development vs production)
- Ensure IAM permissions are correct

### Cached Credentials Not Updating

- Clear the cache using `clearSecretCache()` or `clearSecret()`
- Disable caching by passing `false` as the second parameter to `getSecret()`

### Rotation Failures

- Check CloudWatch Logs for the rotation Lambda function
- Verify the rotation Lambda has correct IAM permissions
- Ensure the secret structure matches the expected format

## Related Documentation

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Secret Rotation Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)
- [OAuth Integration Guide](../../docs/social-media-oauth-setup.md)
