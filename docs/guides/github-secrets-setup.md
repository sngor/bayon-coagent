# GitHub Secrets Setup Guide

This guide explains how to configure GitHub Actions secrets for secure CI/CD deployment.

## Why Use GitHub Secrets?

- ✅ Keeps API keys and credentials out of your codebase
- ✅ Encrypted at rest and in transit
- ✅ Only accessible during workflow execution
- ✅ Can be scoped to specific environments
- ✅ Audit logs for secret access

## Setting Up Secrets

### 1. Navigate to Repository Settings

1. Go to your GitHub repository
2. Click **Settings** (top right)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 2. Add Required Secrets

Add each of the following secrets one by one:

#### AWS Configuration

| Secret Name             | Description    | Example Value                              |
| ----------------------- | -------------- | ------------------------------------------ |
| `AWS_REGION`            | AWS region     | `us-east-1`                                |
| `AWS_ACCESS_KEY_ID`     | AWS access key | `AKIAIOSFODNN7EXAMPLE`                     |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |

**Important**: Create a dedicated IAM user for CI/CD with minimal permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "cloudfront:CreateInvalidation",
        "amplify:StartDeployment"
      ],
      "Resource": "*"
    }
  ]
}
```

#### AWS Services

| Secret Name            | Description           |
| ---------------------- | --------------------- |
| `COGNITO_USER_POOL_ID` | Cognito user pool ID  |
| `COGNITO_CLIENT_ID`    | Cognito app client ID |
| `DYNAMODB_TABLE_NAME`  | DynamoDB table name   |
| `S3_BUCKET_NAME`       | S3 bucket name        |
| `BEDROCK_MODEL_ID`     | Bedrock model ID      |
| `BEDROCK_REGION`       | Bedrock region        |

#### OAuth Providers

| Secret Name              | Description                |
| ------------------------ | -------------------------- |
| `GOOGLE_CLIENT_ID`       | Google OAuth client ID     |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI`    | OAuth callback URL         |
| `FACEBOOK_APP_ID`        | Facebook app ID            |
| `FACEBOOK_APP_SECRET`    | Facebook app secret        |
| `LINKEDIN_CLIENT_ID`     | LinkedIn client ID         |
| `LINKEDIN_CLIENT_SECRET` | LinkedIn client secret     |

#### External APIs

| Secret Name         | Description           | Get Key From                                                 |
| ------------------- | --------------------- | ------------------------------------------------------------ |
| `BRIDGE_API_KEY`    | Bridge API key        | [Bridge API](https://bridge.com)                             |
| `NEWS_API_KEY`      | NewsAPI.org key       | [NewsAPI](https://newsapi.org)                               |
| `GOOGLE_AI_API_KEY` | Google AI API key     | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `TAVILY_API_KEY`    | Tavily search API key | [Tavily](https://app.tavily.com/sign-up)                     |

#### MLS Providers

| Secret Name             | Description             |
| ----------------------- | ----------------------- |
| `MLSGRID_ACCESS_TOKEN`  | MLS Grid access token   |
| `FLEXMLS_CLIENT_ID`     | FlexMLS client ID       |
| `FLEXMLS_CLIENT_SECRET` | FlexMLS client secret   |
| `CRMLS_CLIENT_ID`       | CRMLS client ID         |
| `CRMLS_CLIENT_SECRET`   | CRMLS client secret     |
| `BRIGHT_CLIENT_ID`      | BrightMLS client ID     |
| `BRIGHT_CLIENT_SECRET`  | BrightMLS client secret |

#### App Configuration

| Secret Name           | Description     | Example                  |
| --------------------- | --------------- | ------------------------ |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://yourdomain.com` |

### 3. Environment-Specific Secrets

For different environments (dev, staging, prod), use GitHub Environments:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it (e.g., `production`, `development`)
4. Add environment-specific secrets

Then in your workflow:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # Uses production secrets
```

## Using Secrets in Workflows

### Basic Usage

```yaml
- name: Build application
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
  run: npm run build
```

### Conditional Secrets

```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main'
  env:
    API_KEY: ${{ secrets.PROD_API_KEY }}
  run: npm run deploy
```

## Security Best Practices

### 1. Rotate Secrets Regularly

Set up a rotation schedule:

- **Critical secrets** (AWS keys): Every 30 days
- **API keys**: Every 90 days
- **OAuth secrets**: Every 180 days

### 2. Use Least Privilege

- Create dedicated service accounts for CI/CD
- Grant only required permissions
- Use AWS IAM roles when possible

### 3. Monitor Secret Usage

- Enable audit logs in GitHub
- Set up AWS CloudTrail
- Review access logs regularly

### 4. Never Log Secrets

```yaml
# ❌ WRONG - Secrets might appear in logs
- run: echo "API_KEY=${{ secrets.API_KEY }}"

# ✅ CORRECT - Use secrets only in env vars
- env:
    API_KEY: ${{ secrets.API_KEY }}
  run: npm run deploy
```

### 5. Validate Secrets

Add a validation step to your workflow:

```yaml
- name: Validate secrets
  run: |
    if [ -z "${{ secrets.AWS_ACCESS_KEY_ID }}" ]; then
      echo "AWS_ACCESS_KEY_ID is not set"
      exit 1
    fi
```

## Troubleshooting

### Secret Not Found

**Error**: `Secret AWS_ACCESS_KEY_ID not found`

**Solution**:

1. Check secret name matches exactly (case-sensitive)
2. Verify secret is added to the correct repository
3. Check if using environment-specific secrets

### Secret Not Working

**Error**: `Authentication failed`

**Solution**:

1. Verify secret value is correct (no extra spaces)
2. Check if secret has expired or been rotated
3. Ensure IAM permissions are correct

### Workflow Can't Access Secret

**Error**: `Permission denied`

**Solution**:

1. Check workflow permissions in Settings → Actions
2. Verify environment protection rules
3. Ensure branch has access to environment

## AWS Secrets Manager Alternative

For production, consider using AWS Secrets Manager:

```typescript
// In your application code
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

async function getSecret(secretName: string) {
  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION,
  });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );

  return JSON.parse(response.SecretString || "{}");
}

// Usage
const apiKeys = await getSecret("bayon-coagent/api-keys");
const tavilyKey = apiKeys.TAVILY_API_KEY;
```

### Benefits of AWS Secrets Manager

- ✅ Automatic rotation
- ✅ Fine-grained access control
- ✅ Audit logging
- ✅ Cross-service integration
- ✅ Encryption at rest

## Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
