# Deploy to AWS - Quick Guide

## Your Current Setup

✅ AWS CLI configured (Account: 409136660268)  
✅ SAM CLI installed (v1.138.0)  
✅ Infrastructure templates ready  
✅ Deployment scripts ready

## Deployment Steps

### Step 1: Deploy Infrastructure (Backend Services)

This creates Cognito, DynamoDB, S3, and IAM roles:

```bash
# Deploy to development
npm run sam:deploy:dev

# Or deploy to production
npm run sam:deploy:prod
```

This will create:

- **Cognito User Pool** - For authentication
- **DynamoDB Table** - For data storage
- **S3 Bucket** - For file storage
- **IAM Roles** - For permissions
- **CloudWatch Dashboard** - For monitoring

### Step 2: Update Environment Variables

After infrastructure deployment, update your environment variables:

```bash
# Generate .env file from SAM outputs
npm run sam:update-env

# Copy to your local environment
cp .env.development .env.local
```

### Step 3: Deploy Frontend (Choose One)

#### Option A: AWS Amplify (Recommended)

Automated deployment with CI/CD:

```bash
npm run deploy:amplify
```

This will:

1. Create Amplify app
2. Connect to your Git repository
3. Set up environment variables
4. Configure IAM roles
5. Start deployment

#### Option B: Manual Amplify Setup

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Connect your Git repository
4. Use the `amplify.yml` file (already configured)
5. Add environment variables from `.env.development`
6. Deploy

#### Option C: Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Step 4: Test Deployment

```bash
# Test your deployment
npm run deploy:test https://your-app-url.amplifyapp.com
```

## Environment Variables Needed

After infrastructure deployment, you'll have:

```bash
# From SAM outputs (auto-generated)
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-development
S3_BUCKET_NAME=bayon-coagent-storage-development-409136660268

# You need to add manually
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/oauth/google/callback
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
TAVILY_API_KEY=your-tavily-api-key
```

## Quick Commands

```bash
# View infrastructure outputs
npm run sam:outputs

# Validate SAM template
npm run sam:validate

# Destroy infrastructure (careful!)
npm run sam:destroy:dev
```

## Monitoring

After deployment:

1. **CloudWatch Dashboard**: Check the dashboard URL in SAM outputs
2. **Amplify Console**: Monitor builds and deployments
3. **CloudWatch Logs**: View application logs

## Troubleshooting

### Build Fails

- Check CloudWatch logs
- Verify all environment variables are set
- Test build locally: `npm run build`

### Can't Connect to AWS Services

- Verify IAM roles are attached
- Check environment variables
- Review CloudWatch logs

### Authentication Issues

- Verify Cognito User Pool is created
- Check COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID
- Test with AWS CLI: `aws cognito-idp list-users --user-pool-id <pool-id>`

## Next Steps After Deployment

1. ✅ Test authentication (signup/signin)
2. ✅ Test file uploads to S3
3. ✅ Test AI features (Bedrock)
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring alerts
6. ✅ Set up backup strategy

## Cost Estimate

Development environment (low traffic):

- Cognito: Free tier (50,000 MAUs)
- DynamoDB: ~$1-5/month (on-demand)
- S3: ~$1-3/month
- Amplify: ~$0-15/month
- Bedrock: Pay per use (~$0.003/1K tokens)

**Total: ~$5-25/month for development**

## Support

- [Full Deployment Guide](DEPLOYMENT.md)
- [SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Amplify Documentation](https://docs.amplify.aws/)
