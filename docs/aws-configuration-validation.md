# AWS Configuration Validation

## Overview

The Bayon Coagent application includes automatic validation of AWS configuration on startup to prevent runtime errors and improve developer experience. This validation runs when the `AuthProvider` component initializes and checks all critical AWS service configurations.

## How It Works

### Validation Trigger

The validation runs automatically when the application starts, specifically when the `AuthProvider` component mounts:

```typescript
// In src/aws/auth/auth-provider.tsx
useEffect(() => {
    const { valid, errors } = validateConfig();
    if (!valid && process.env.NODE_ENV === 'development') {
        console.error('AWS Configuration Errors:', errors);
        // In development, show warnings but don't block the app
        errors.forEach(error => console.warn(`⚠️ ${error}`));
    }
}, []);
```

### Validation Function

The `validateConfig()` function in `src/aws/config.ts` checks:

1. **AWS Cognito Configuration**
   - `NEXT_PUBLIC_USER_POOL_ID` or `COGNITO_USER_POOL_ID`
   - `NEXT_PUBLIC_USER_POOL_CLIENT_ID` or `COGNITO_CLIENT_ID`

2. **DynamoDB Configuration**
   - `DYNAMODB_TABLE_NAME`

3. **S3 Configuration**
   - `S3_BUCKET_NAME`

4. **AWS Bedrock Configuration**
   - `BEDROCK_MODEL_ID` (must be a valid inference profile)
   - Validates against approved model list

5. **Google AI Configuration**
   - `GOOGLE_AI_API_KEY` (required for Gemini image generation in production, optional in development)

### Valid Bedrock Models

The validation ensures the Bedrock model ID is one of the approved inference profiles:

```typescript
export const VALID_BEDROCK_MODELS = [
  'us.anthropic.claude-3-haiku-20240307-v1:0',
  'us.anthropic.claude-3-sonnet-20240229-v1:0',
  'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  'us.anthropic.claude-3-opus-20240229-v1:0',
] as const;
```

## Behavior by Environment

### Development Environment

- **Shows warnings**: Configuration errors are logged to console with warning icons
- **Non-blocking**: Application continues to run even with configuration errors
- **Detailed feedback**: Each missing configuration is listed individually

Example output:
```
AWS Configuration Errors: [
  "NEXT_PUBLIC_USER_POOL_ID or COGNITO_USER_POOL_ID is not set",
  "GOOGLE_AI_API_KEY is not set (required for Gemini image generation)"
]
⚠️ NEXT_PUBLIC_USER_POOL_ID or COGNITO_USER_POOL_ID is not set
⚠️ GOOGLE_AI_API_KEY is not set (required for Gemini image generation)
```

### Production Environment

- **Silent validation**: No console output for configuration errors
- **Graceful degradation**: Application handles missing configurations at runtime
- **Error tracking**: Configuration errors should be monitored through application logging

## Configuration Fallbacks

The system includes fallback values for development to prevent complete application failure:

### Cognito Fallbacks

```typescript
userPoolId: process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_USER_POOL_ID || (() => {
    if (process.env.NODE_ENV === 'development') {
        console.warn('COGNITO_USER_POOL_ID not set, using fallback for development');
    }
    return 'us-west-2_wqsUAbADO';
})(),
```

### Service Defaults

- **DynamoDB Table**: `BayonCoAgent`
- **S3 Bucket**: `bayon-coagent-storage`
- **Bedrock Model**: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- **SES From Email**: `noreply@bayoncoagent.com`

## Environment Variables Reference

### Required Variables

```bash
# AWS Cognito (choose one set)
NEXT_PUBLIC_USER_POOL_ID=us-west-2_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=your_client_id_here
# OR
COGNITO_USER_POOL_ID=us-west-2_XXXXXXXXX
COGNITO_CLIENT_ID=your_client_id_here

# DynamoDB
DYNAMODB_TABLE_NAME=BayonCoAgent

# S3
S3_BUCKET_NAME=your-s3-bucket-name

# AWS Bedrock
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0

# Google AI
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### Optional Variables

```bash
# AWS Region
AWS_REGION=us-west-2

# SES Configuration
SES_FROM_EMAIL=noreply@yourdomain.com
SES_REPLY_TO_EMAIL=support@yourdomain.com

# SNS Configuration
SNS_PLATFORM_APPLICATION_ARN=arn:aws:sns:us-west-2:123456789012:your-platform-app

# API Gateway URLs
MAIN_API_URL=https://api.yourdomain.com
AI_SERVICE_API_URL=https://ai-api.yourdomain.com

# SQS Queue URLs
AI_JOB_REQUEST_QUEUE_URL=https://sqs.us-west-2.amazonaws.com/123456789012/ai-requests
AI_JOB_RESPONSE_QUEUE_URL=https://sqs.us-west-2.amazonaws.com/123456789012/ai-responses
```

## Local Development

### LocalStack Configuration

When `USE_LOCAL_AWS=true`, the validation still runs but uses LocalStack endpoints:

```bash
# Enable LocalStack
USE_LOCAL_AWS=true

# LocalStack uses test credentials
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# LocalStack resource names
COGNITO_USER_POOL_ID=<from localstack init>
COGNITO_CLIENT_ID=<from localstack init>
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local
```

### Validation with LocalStack

The validation function automatically detects LocalStack mode and adjusts expectations:

- Uses LocalStack endpoints (`http://localhost:4566`)
- Accepts test credentials
- Validates LocalStack-specific resource names

## Troubleshooting

### Common Configuration Issues

1. **Missing Cognito Configuration**
   ```
   Error: NEXT_PUBLIC_USER_POOL_ID or COGNITO_USER_POOL_ID is not set
   ```
   **Solution**: Set either the public or server-side Cognito variables

2. **Invalid Bedrock Model**
   ```
   Error: BEDROCK_MODEL_ID "anthropic.claude-3-sonnet-20240229-v1:0" is not a valid model
   ```
   **Solution**: Use inference profile format (prefix with `us.`)

3. **Missing Google AI Key**
   ```
   Error: GOOGLE_AI_API_KEY is not set (required for Gemini image generation)
   ```
   **Solution**: Obtain API key from Google AI Studio

### Debugging Configuration

To debug configuration issues:

1. **Check Environment Variables**
   ```bash
   # List all environment variables
   printenv | grep -E "(COGNITO|DYNAMODB|S3|BEDROCK|GOOGLE)"
   ```

2. **Validate Configuration Manually**
   ```typescript
   import { validateConfig } from '@/aws/config';
   
   const { valid, errors } = validateConfig();
   console.log('Valid:', valid);
   console.log('Errors:', errors);
   ```

3. **Check Configuration Object**
   ```typescript
   import { getConfig } from '@/aws/config';
   
   const config = getConfig();
   console.log('Environment:', config.environment);
   console.log('Cognito:', config.cognito);
   ```

### Environment-Specific Issues

#### Development
- Fallback values prevent complete failure
- Warnings help identify missing configuration
- LocalStack provides local AWS services

#### Production
- No fallback values (except defaults)
- Silent validation (no console output)
- Real AWS services required

## Best Practices

### Environment Setup

1. **Use .env.example as Template**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

2. **Validate Before Deployment**
   ```bash
   # Check configuration in development
   npm run dev
   # Look for warning messages in console
   ```

3. **Test with Real Services**
   ```bash
   # Temporarily disable LocalStack
   USE_LOCAL_AWS=false npm run dev
   ```

### Security Considerations

1. **Never Commit Secrets**
   - Add `.env.*` to `.gitignore`
   - Use environment-specific files

2. **Use IAM Roles in Production**
   - Avoid hardcoded AWS credentials
   - Let AWS SDK use default credential chain

3. **Rotate Keys Regularly**
   - Especially Google AI API keys
   - Monitor usage and access patterns

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Validate Configuration

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Validate configuration
        run: |
          node -e "
            const { validateConfig } = require('./src/aws/config.ts');
            const { valid, errors } = validateConfig();
            if (!valid) {
              console.error('Configuration errors:', errors);
              process.exit(1);
            }
            console.log('Configuration is valid');
          "
        env:
          NEXT_PUBLIC_USER_POOL_ID: ${{ secrets.COGNITO_USER_POOL_ID }}
          NEXT_PUBLIC_USER_POOL_CLIENT_ID: ${{ secrets.COGNITO_CLIENT_ID }}
          DYNAMODB_TABLE_NAME: ${{ secrets.DYNAMODB_TABLE_NAME }}
          S3_BUCKET_NAME: ${{ secrets.S3_BUCKET_NAME }}
          BEDROCK_MODEL_ID: ${{ secrets.BEDROCK_MODEL_ID }}
          GOOGLE_AI_API_KEY: ${{ secrets.GOOGLE_AI_API_KEY }}
```

## Related Documentation

- [AWS Local Development](./aws-local-development.md) - LocalStack setup and usage
- [Environment Setup](../FINAL_ENV_SETUP.md) - Complete environment configuration
- [Critical Fixes Summary](../CRITICAL_FIXES_SUMMARY.md) - Security improvements including this feature
- [AWS Configuration](../docs/aws-local-development.md) - AWS service configuration details

## Future Enhancements

### Planned Improvements

1. **Runtime Validation**
   - Validate configuration before each AWS service call
   - Graceful degradation for missing services

2. **Configuration UI**
   - Admin panel for configuration management
   - Visual validation status indicators

3. **Enhanced Error Messages**
   - Suggested fixes for common issues
   - Links to documentation

4. **Health Checks**
   - Periodic validation of AWS service connectivity
   - Dashboard showing service status

### Monitoring Integration

Future versions may include:

- CloudWatch metrics for configuration errors
- Slack/email notifications for production issues
- Configuration drift detection
- Automated configuration updates