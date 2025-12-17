# Production Deployment Setup Guide

## Prerequisites

Before deploying to production, ensure you have:

1. **AWS Account Setup**
   - AWS CLI configured with appropriate permissions
   - IAM roles for Lambda functions, DynamoDB, S3, Bedrock access
   - Production AWS resources deployed via SAM

2. **Third-Party API Keys**
   - Google AI API key for Gemini models
   - Tavily API key for web search functionality
   - Bridge API key for Zillow integration
   - Google OAuth credentials for Business Profile integration

3. **Domain Configuration**
   - Domain `bayoncoagent.app` configured and pointing to Amplify
   - SSL certificate configured
   - DNS records properly set up

## Environment Variables Setup

### Required Production API Keys

Update `.env.production` with real values for:

```bash
# Google AI API (for image generation and content)
GOOGLE_AI_API_KEY=your_actual_google_ai_key

# External API Keys
BRIDGE_API_KEY=your_actual_bridge_api_key
TAVILY_API_KEY=your_actual_tavily_api_key

# OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
```

### API Key Sources

1. **Google AI API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Enable Gemini Pro and Vision models

2. **Tavily API Key**
   - Sign up at [Tavily](https://tavily.com/)
   - Get API key from dashboard
   - Used for web search in research agent

3. **Bridge API Key**
   - Contact Bridge API for production access
   - Used for Zillow review integration

4. **Google OAuth Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://bayoncoagent.app/api/oauth/google/callback`

## Deployment Steps

### 1. Infrastructure Deployment

```bash
# Deploy AWS infrastructure
./scripts/sam-deploy.sh production
```

### 2. Application Deployment

```bash
# Deploy to Amplify
./scripts/deploy-amplify.sh
```

### 3. Post-Deployment Verification

```bash
# Test deployment
./scripts/test-deployment.sh https://bayoncoagent.app
```

## Security Checklist

- [ ] All API keys are production values (not test/development)
- [ ] Environment files are not committed to version control
- [ ] AWS IAM roles follow least privilege principle
- [ ] HTTPS is enforced for all traffic
- [ ] Security headers are properly configured
- [ ] Rate limiting is enabled for API endpoints

## Monitoring Setup

After deployment, verify:

- [ ] CloudWatch logs are being generated
- [ ] X-Ray tracing is working
- [ ] Error alerts are configured
- [ ] Performance metrics are being collected

## Rollback Plan

If issues occur:

1. **Application Rollback**: Use Amplify console to rollback to previous deployment
2. **Infrastructure Rollback**: Use CloudFormation console to rollback stack
3. **Database Rollback**: DynamoDB point-in-time recovery if needed

## Support Contacts

- **AWS Support**: Use AWS Support Center for infrastructure issues
- **Application Issues**: Check CloudWatch logs and X-Ray traces
- **Third-Party APIs**: Contact respective API providers for service issues