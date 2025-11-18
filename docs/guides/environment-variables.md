# Environment Variables Reference

This document lists all environment variables used by the Co-agent Marketer platform.

## Quick Setup

1. Copy `.env.local` for local development
2. Update AWS credentials and API keys
3. Verify configuration: `npm run verify:setup`

## AWS Configuration

### Core AWS Settings

#### `AWS_REGION`

- **Required**: Yes
- **Default**: `us-east-1`
- **Description**: AWS region for all services
- **Example**: `us-east-1`, `us-west-2`

#### `AWS_ACCESS_KEY_ID`

- **Required**: For local development
- **Default**: None (uses IAM roles in production)
- **Description**: AWS access key for authentication
- **Example**: `AKIAIOSFODNN7EXAMPLE`

#### `AWS_SECRET_ACCESS_KEY`

- **Required**: For local development
- **Default**: None (uses IAM roles in production)
- **Description**: AWS secret key for authentication
- **Example**: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### AWS Cognito (Authentication)

#### `COGNITO_USER_POOL_ID`

- **Required**: Yes
- **Default**: None
- **Description**: Cognito User Pool ID for authentication
- **Example**: `us-east-1_OemQiHAGl`

#### `COGNITO_CLIENT_ID`

- **Required**: Yes
- **Default**: None
- **Description**: Cognito App Client ID
- **Example**: `gc1a91hf5dujkjt6k87alb7jn`

### DynamoDB (Database)

#### `DYNAMODB_TABLE_NAME`

- **Required**: Yes
- **Default**: `BayonCoAgent`
- **Description**: DynamoDB table name for application data
- **Example**: `BayonCoAgent-development`, `BayonCoAgent-production`

### S3 (File Storage)

#### `S3_BUCKET_NAME`

- **Required**: Yes
- **Default**: `bayon-coagent-storage`
- **Description**: S3 bucket name for file uploads
- **Example**: `bayon-coagent-storage-development-409136660268`

### AWS Bedrock (AI Models)

#### `BEDROCK_MODEL_ID`

- **Required**: Yes
- **Default**: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Description**: Default Bedrock model ID for AI flows
- **Valid Options**:
  - `anthropic.claude-3-haiku-20240307-v1:0` (Fast, cost-effective)
  - `anthropic.claude-3-sonnet-20240229-v1:0` (Legacy Sonnet)
  - `anthropic.claude-3-5-sonnet-20240620-v1:0` (Sonnet 3.5 v1)
  - `us.anthropic.claude-3-5-sonnet-20241022-v2:0` (Sonnet 3.5 v2 - recommended)
  - `anthropic.claude-3-opus-20240229-v1:0` (Most capable)
- **See**: [Bedrock Environment Configuration](./src/aws/bedrock/ENVIRONMENT_CONFIGURATION.md)

#### `BEDROCK_REGION`

- **Required**: Yes
- **Default**: Same as `AWS_REGION`
- **Description**: AWS region for Bedrock service
- **Example**: `us-east-1`

## External API Keys

### Google OAuth

#### `GOOGLE_CLIENT_ID`

- **Required**: For Google Business Profile integration
- **Default**: None
- **Description**: Google OAuth client ID
- **Example**: `123456789-abc123.apps.googleusercontent.com`

#### `GOOGLE_CLIENT_SECRET`

- **Required**: For Google Business Profile integration
- **Default**: None
- **Description**: Google OAuth client secret
- **Example**: `GOCSPX-abc123def456`

#### `GOOGLE_REDIRECT_URI`

- **Required**: For Google OAuth
- **Default**: None
- **Description**: OAuth callback URL
- **Example**:
  - Local: `http://localhost:3000/api/oauth/google/callback`
  - Production: `https://yourdomain.com/api/oauth/google/callback`

### Web Search APIs

#### `TAVILY_API_KEY`

- **Required**: For AI flows using web search
- **Default**: None
- **Description**: Tavily API key for web search (recommended)
- **Get Key**: https://app.tavily.com/sign-up
- **Example**: `tvly-abc123def456`

#### `SERPER_API_KEY`

- **Required**: Alternative to Tavily
- **Default**: None
- **Description**: Serper API key for Google Search
- **Get Key**: https://serper.dev/signup
- **Example**: `abc123def456`

### Other APIs

#### `BRIDGE_API_KEY`

- **Required**: For Zillow review integration
- **Default**: None
- **Description**: Bridge API key for Zillow data
- **Example**: `bridge_abc123def456`

#### `NEWS_API_KEY`

- **Required**: For real estate news feed
- **Default**: None
- **Description**: NewsAPI.org API key
- **Get Key**: https://newsapi.org/register
- **Example**: `abc123def456789`

## Development Settings

### `NODE_ENV`

- **Required**: Yes
- **Default**: `development`
- **Description**: Node environment
- **Valid Options**: `development`, `production`, `test`

### `USE_LOCAL_AWS`

- **Required**: For local development with LocalStack
- **Default**: `false`
- **Description**: Use LocalStack for local AWS services
- **Valid Options**: `true`, `false`

## Environment Files

### `.env.local`

Used for local development. Contains:

- LocalStack configuration (when `USE_LOCAL_AWS=true`)
- Development AWS credentials
- Test API keys

### `.env.production`

Used for production deployment. Contains:

- Production AWS resource names
- Production API keys
- No AWS credentials (uses IAM roles)

### `.env.migration.example`

Template for Firebase to AWS migration. Contains:

- Firebase configuration
- Migration-specific settings
- Batch processing options

## Validation

The application validates configuration on startup:

```typescript
import { validateConfig } from "@/aws/config";

const { valid, errors } = validateConfig();
if (!valid) {
  console.error("Configuration errors:", errors);
  process.exit(1);
}
```

### Common Validation Errors

**"BEDROCK_MODEL_ID is not a valid model"**

- Check that your model ID exactly matches one of the valid options
- Ensure you include the version suffix (e.g., `-v1:0`)
- See [valid model IDs](./src/aws/bedrock/ENVIRONMENT_CONFIGURATION.md#valid-model-ids)

**"COGNITO_USER_POOL_ID is not set"**

- Add `COGNITO_USER_POOL_ID` to your environment file
- Get the value from AWS Cognito console or infrastructure output

**"S3_BUCKET_NAME is not set"**

- Add `S3_BUCKET_NAME` to your environment file
- Get the value from AWS S3 console or infrastructure output

## Security Best Practices

1. **Never commit environment files** - They're in `.gitignore`
2. **Use IAM roles in production** - Don't use access keys
3. **Rotate API keys regularly** - Especially for external services
4. **Use different keys per environment** - Separate dev/staging/prod
5. **Restrict API key permissions** - Use least privilege principle
6. **Monitor API usage** - Set up alerts for unusual activity

## Local Development with LocalStack

Set `USE_LOCAL_AWS=true` to use LocalStack:

```bash
# Start LocalStack
npm run localstack:start

# Initialize resources
npm run localstack:init

# Verify setup
npm run verify:setup
```

LocalStack endpoints:

- Cognito: `http://localhost:4566`
- DynamoDB: `http://localhost:4566`
- S3: `http://localhost:4566`

## Production Deployment

1. Set up AWS infrastructure:

   ```bash
   npm run sam:deploy:prod
   ```

2. Update `.env.production` with resource names from deployment output

3. Deploy application:

   ```bash
   npm run deploy:amplify
   ```

4. Verify deployment:
   ```bash
   npm run deploy:test <production-url>
   ```

## Troubleshooting

### "Cannot connect to AWS services"

- Check `AWS_REGION` is correct
- Verify AWS credentials are set (local) or IAM role is attached (production)
- Ensure security groups allow traffic

### "Bedrock model not found"

- Verify model is available in your region
- Check you have access to the model in AWS Bedrock console
- Some models require requesting access

### "LocalStack connection refused"

- Ensure LocalStack is running: `docker ps`
- Start LocalStack: `npm run localstack:start`
- Check Docker is running

## Related Documentation

- [Bedrock Environment Configuration](./src/aws/bedrock/ENVIRONMENT_CONFIGURATION.md) - Detailed Bedrock setup
- [AWS Setup Guide](./AWS_SETUP.md) - Infrastructure setup
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Getting Started](./GETTING_STARTED.md) - Quick start guide

---

**Last Updated**: November 2024
