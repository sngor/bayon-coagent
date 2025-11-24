# Security Guidelines

## API Key Management

### ⚠️ NEVER commit API keys or secrets to the repository

All sensitive credentials must be managed through:

1. **Local Development**: `.env.local` (gitignored)
2. **Production**: AWS Secrets Manager or GitHub Actions Secrets
3. **CI/CD**: GitHub Actions Secrets

### Environment Variables

All API keys and secrets should be stored as environment variables:

```bash
# ❌ WRONG - Hardcoded in code
const apiKey = "tvly-abc123def456";

# ✅ CORRECT - From environment
const apiKey = process.env.TAVILY_API_KEY;
```

## Required Secrets

### GitHub Actions Secrets

Configure these in your repository settings (Settings → Secrets and variables → Actions):

#### AWS Configuration

- `AWS_REGION` - AWS region (e.g., us-east-1)
- `AWS_ACCESS_KEY_ID` - AWS access key (use IAM user with minimal permissions)
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

#### AWS Services

- `COGNITO_USER_POOL_ID` - Cognito user pool ID
- `COGNITO_CLIENT_ID` - Cognito app client ID
- `DYNAMODB_TABLE_NAME` - DynamoDB table name
- `S3_BUCKET_NAME` - S3 bucket name
- `BEDROCK_MODEL_ID` - Bedrock model ID
- `BEDROCK_REGION` - Bedrock region

#### OAuth Providers

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GOOGLE_REDIRECT_URI` - OAuth callback URL
- `FACEBOOK_APP_ID` - Facebook app ID
- `FACEBOOK_APP_SECRET` - Facebook app secret
- `LINKEDIN_CLIENT_ID` - LinkedIn client ID
- `LINKEDIN_CLIENT_SECRET` - LinkedIn client secret

#### External APIs

- `BRIDGE_API_KEY` - Bridge API key
- `NEWS_API_KEY` - NewsAPI.org key
- `GOOGLE_AI_API_KEY` - Google AI API key
- `TAVILY_API_KEY` - Tavily search API key

#### MLS Providers

- `MLSGRID_ACCESS_TOKEN` - MLS Grid access token
- `FLEXMLS_CLIENT_ID` - FlexMLS client ID
- `FLEXMLS_CLIENT_SECRET` - FlexMLS client secret
- `CRMLS_CLIENT_ID` - CRMLS client ID
- `CRMLS_CLIENT_SECRET` - CRMLS client secret
- `BRIGHT_CLIENT_ID` - BrightMLS client ID
- `BRIGHT_CLIENT_SECRET` - BrightMLS client secret

#### App Configuration

- `NEXT_PUBLIC_APP_URL` - Application URL

### AWS Secrets Manager (Recommended for Production)

For production deployments, use AWS Secrets Manager:

```typescript
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

async function getSecret(secretName: string) {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return JSON.parse(response.SecretString || "{}");
}
```

## Security Best Practices

### 1. Rotate Keys Regularly

- Rotate API keys every 90 days
- Use AWS IAM roles instead of access keys when possible
- Enable MFA for AWS accounts

### 2. Principle of Least Privilege

- Grant minimum required permissions
- Use separate IAM users for CI/CD
- Restrict API key scopes

### 3. Monitor for Exposed Secrets

- GitHub Actions security scan runs automatically
- Use tools like TruffleHog and Snyk
- Enable AWS CloudTrail for audit logs

### 4. Environment Separation

- Use different keys for development/staging/production
- Never use production keys in development
- Keep `.env.local` in `.gitignore`

### 5. Code Review

- Review all PRs for hardcoded secrets
- Use automated secret scanning in CI/CD
- Reject commits with exposed credentials

## What to Do If a Secret is Exposed

1. **Immediately revoke** the exposed credential
2. **Generate a new** key/secret
3. **Update** all environments with the new credential
4. **Investigate** where the secret was used
5. **Review** git history and remove the secret if committed
6. **Report** the incident to your security team

## Checking for Exposed Secrets

Run locally before committing:

```bash
# Install TruffleHog
brew install trufflesecurity/trufflehog/trufflehog

# Scan repository
trufflehog filesystem . --only-verified

# Check git history
trufflehog git file://. --only-verified
```

## Resources

- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [TruffleHog](https://github.com/trufflesecurity/trufflehog)
