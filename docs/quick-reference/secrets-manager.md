# Secrets Manager Quick Reference

## Common Commands

```bash
# Setup secrets interactively
npm run setup:secrets -- --environment development

# Verify secrets are configured
npm run verify:secrets -- --environment development

# Deploy infrastructure with secrets
npm run sam:deploy:dev
```

## Code Examples

### Get OAuth Credentials

```typescript
import {
  getGoogleOAuthCredentials,
  getFacebookOAuthCredentials,
  getLinkedInOAuthCredentials,
} from "@/aws/secrets-manager/client";

// Google OAuth
const google = await getGoogleOAuthCredentials();
// { clientId, clientSecret, redirectUri }

// Facebook OAuth
const facebook = await getFacebookOAuthCredentials();
// { appId, appSecret, redirectUri }

// LinkedIn OAuth
const linkedin = await getLinkedInOAuthCredentials();
// { clientId, clientSecret, redirectUri }
```

### Get MLS API Credentials

```typescript
import { getMLSAPICredentials } from "@/aws/secrets-manager/client";

const mls = await getMLSAPICredentials();
// {
//   mlsgrid: { apiKey, apiSecret, baseUrl },
//   bridgeInteractive: { apiKey, baseUrl }
// }
```

### Generic Secret Access

```typescript
import { getSecret } from "@/aws/secrets-manager/client";

// Get any secret (cached)
const secret = await getSecret("bayon-coagent/oauth/google-development");

// Get fresh value (bypass cache)
const freshSecret = await getSecret("my-secret", false);
```

### Cache Management

```typescript
import { clearSecretCache, clearSecret } from "@/aws/secrets-manager/client";

// Clear all cached secrets
clearSecretCache();

// Clear specific secret
clearSecret("bayon-coagent/oauth/google-development");
```

## AWS CLI Commands

```bash
# List all secrets
aws secretsmanager list-secrets \
  --filters Key=name,Values=bayon-coagent

# Get secret value
aws secretsmanager get-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --query SecretString --output text | jq .

# Update secret
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --secret-string file://secret.json

# Describe secret (includes rotation info)
aws secretsmanager describe-secret \
  --secret-id bayon-coagent/oauth/google-development

# Trigger rotation manually
aws secretsmanager rotate-secret \
  --secret-id bayon-coagent/oauth/google-development
```

## Secret Structure

### Google OAuth

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/api/oauth/google/callback"
}
```

### Facebook/Instagram OAuth

```json
{
  "appId": "your-app-id",
  "appSecret": "your-app-secret",
  "redirectUri": "http://localhost:3000/api/oauth/facebook/callback"
}
```

### LinkedIn OAuth

```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/api/oauth/linkedin/callback"
}
```

### Twitter OAuth

```json
{
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "bearerToken": "your-bearer-token",
  "redirectUri": "http://localhost:3000/api/oauth/twitter/callback"
}
```

### MLS API

```json
{
  "mlsgrid": {
    "apiKey": "your-mlsgrid-key",
    "apiSecret": "your-mlsgrid-secret",
    "baseUrl": "https://api.mlsgrid.com/v2"
  },
  "bridgeInteractive": {
    "apiKey": "your-bridge-key",
    "baseUrl": "https://api.bridgeinteractive.com/v2"
  }
}
```

## Troubleshooting

### Secret Not Found

```bash
# Check if secret exists
aws secretsmanager list-secrets --filters Key=name,Values=bayon-coagent

# Deploy infrastructure if missing
npm run sam:deploy:dev
```

### Permission Denied

```bash
# Check IAM role has correct permissions
aws iam get-role-policy \
  --role-name bayon-coagent-app-development \
  --policy-name SecretsManagerAccess
```

### Invalid Secret Structure

```bash
# Validate JSON before updating
cat secret.json | jq .

# Update with validated JSON
aws secretsmanager put-secret-value \
  --secret-id bayon-coagent/oauth/google-development \
  --secret-string file://secret.json
```

### Check Rotation Status

```bash
# View rotation configuration
aws secretsmanager describe-secret \
  --secret-id bayon-coagent/oauth/google-development

# Check rotation Lambda logs
aws logs tail /aws/lambda/bayon-coagent-secret-rotation-development --follow
```

## Best Practices

1. ✅ **Always use helper functions** instead of direct secret access
2. ✅ **Rely on caching** - default 5-minute cache is optimal
3. ✅ **Never log secrets** - only log non-sensitive metadata
4. ✅ **Use environment-specific secrets** - separate dev/prod
5. ✅ **Rotate regularly** - 90-day automatic rotation enabled
6. ❌ **Never store secrets in environment variables**
7. ❌ **Never commit secrets to version control**
8. ❌ **Never expose secrets in error messages**

## Getting OAuth Credentials

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add redirect URI
4. Copy Client ID and Secret

### Facebook/Instagram

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Create app or use existing
3. Add Facebook Login / Instagram Basic Display
4. Copy App ID and Secret

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create app
3. Add Sign In with LinkedIn
4. Copy Client ID and Secret

### Twitter

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create app or use existing
3. Generate API Key, Secret, and Bearer Token
4. Copy all credentials

## Monitoring

```bash
# View secret access logs
aws logs tail /aws/lambda/your-function-name --follow | grep secretsmanager

# Check rotation logs
aws logs tail /aws/lambda/bayon-coagent-secret-rotation-development --follow

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/SecretsManager \
  --metric-name SecretRetrievalCount \
  --dimensions Name=SecretId,Value=bayon-coagent/oauth/google-development \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Cost Optimization

- **Caching**: Reduces API calls by ~99%
- **Batch retrieval**: Get multiple secrets in parallel
- **Monitor usage**: Check CloudWatch metrics monthly
- **Clean up**: Delete unused secrets in dev environments

Estimated cost: **~$2.50/month per environment**
