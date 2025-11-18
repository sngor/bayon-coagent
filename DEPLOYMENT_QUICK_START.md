# Deployment Quick Start Guide

This guide provides quick commands to deploy the Bayon CoAgent application to AWS.

## Prerequisites

✅ Infrastructure deployed (see `infrastructure/DEPLOYMENT_GUIDE.md`)  
✅ AWS CLI configured  
✅ Git repository set up  
✅ Environment variables ready

## Option 1: AWS Amplify Hosting (Recommended)

### Automated Setup

```bash
# Run the automated setup script
npm run deploy:amplify
```

The script will:

1. Create Amplify app
2. Set up IAM service role
3. Configure environment variables
4. Create branch and start deployment

### Manual Setup

1. **Go to AWS Amplify Console**

   ```
   https://console.aws.amazon.com/amplify/
   ```

2. **Create New App**

   - Click "New app" → "Host web app"
   - Connect your Git repository
   - Select branch (e.g., `main`)

3. **Configure Build Settings**

   - Amplify auto-detects Next.js
   - Uses `amplify.yml` from repository
   - Review and confirm

4. **Add Environment Variables**

   Get values from infrastructure:

   ```bash
   cd infrastructure
   ./scripts/update-env.sh production
   cat .env.production
   ```

   Add in Amplify Console:

   - `NODE_ENV=production`
   - `AWS_REGION=us-east-1`
   - `COGNITO_USER_POOL_ID=<from-output>`
   - `COGNITO_CLIENT_ID=<from-output>`
   - `DYNAMODB_TABLE_NAME=<from-output>`
   - `S3_BUCKET_NAME=<from-output>`
   - `BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0`
   - `BEDROCK_REGION=us-east-1`
   - Plus: Google OAuth and API keys

5. **Set Service Role**

   - App settings → General → Service role
   - Select the role created by script or CDK

6. **Deploy**
   - Click "Save and deploy"
   - Monitor build logs

### Test Deployment

```bash
# Get your Amplify URL from console, then:
npm run deploy:test https://main.d1234567890.amplifyapp.com
```

## Option 2: Vercel (Alternative)

### Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Add Environment Variables

```bash
# Add each variable as a secret
vercel env add NODE_ENV production
vercel env add AWS_REGION us-east-1
vercel env add COGNITO_USER_POOL_ID <value>
# ... add all other variables
```

## Option 3: CloudFront + Lambda (Advanced)

### Deploy CloudFormation Stack

```bash
# Deploy the CloudFront stack
aws cloudformation create-stack \
  --stack-name bayon-coagent-cloudfront-prod \
  --template-body file://infrastructure/cloudfront-deployment.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=StaticAssetsBucket,ParameterValue=<s3-bucket-name> \
  --capabilities CAPABILITY_IAM
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-cloudfront-prod \
  --query 'Stacks[0].StackStatus'
```

## Custom Domain Setup

### For Amplify

1. **In Amplify Console**

   - Domain management → Add domain
   - Enter domain name
   - Follow DNS configuration steps

2. **DNS Configuration**

   - If Route 53: Automatic
   - If external: Add provided CNAME records

3. **SSL Certificate**
   - Automatically provisioned
   - Wait 15-30 minutes for validation

### For CloudFront

1. **Request Certificate in ACM**

   ```bash
   aws acm request-certificate \
     --domain-name coagent.yourdomain.com \
     --validation-method DNS \
     --region us-east-1
   ```

2. **Validate Certificate**

   - Add DNS validation records
   - Wait for validation

3. **Update CloudFront**
   - Add certificate ARN to distribution
   - Add domain to aliases

## Environment Variables Reference

### Required for All Deployments

```bash
NODE_ENV=production
AWS_REGION=us-east-1

# From infrastructure outputs
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-prod
S3_BUCKET_NAME=bayon-coagent-storage-prod

# Bedrock configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback

# External APIs
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
```

### Get Infrastructure Values

```bash
# Generate .env file with all infrastructure values
cd infrastructure
./scripts/update-env.sh production

# View values
cat .env.production
```

## Deployment Checklist

Before deploying to production:

- [ ] Infrastructure deployed and verified
- [ ] All environment variables configured
- [ ] IAM roles and policies set up
- [ ] Build succeeds locally (`npm run build`)
- [ ] Tests pass locally
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate ready (if applicable)
- [ ] Monitoring and alerts configured
- [ ] Backup plan in place

## Common Commands

```bash
# Deploy infrastructure
npm run infra:deploy:prod

# Set up Amplify hosting
npm run deploy:amplify

# Test deployment
npm run deploy:test <url>

# View infrastructure outputs
cd infrastructure && ./scripts/update-env.sh production

# Verify infrastructure
cd infrastructure && ./scripts/verify-infrastructure.sh production

# View Amplify logs
aws amplify list-apps
aws amplify get-app --app-id <app-id>

# View CloudFront distributions
aws cloudfront list-distributions
```

## Monitoring

### Amplify Console

- Build logs: Amplify Console → App → Branch → Build
- Access logs: CloudWatch → Log groups → `/aws/amplify/<app-id>`
- Metrics: Amplify Console → Monitoring

### CloudWatch

```bash
# View logs
aws logs tail /aws/amplify/<app-id> --follow

# View metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Amplify \
  --metric-name Requests \
  --dimensions Name=App,Value=<app-id> \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Troubleshooting

### Build Fails

1. Check build logs in Amplify Console
2. Verify environment variables are set
3. Test build locally: `npm run build`
4. Check Node.js version compatibility

### Can't Connect to AWS Services

1. Verify IAM service role is attached
2. Check environment variables
3. Verify infrastructure is deployed
4. Check CloudWatch logs for errors

### SSL Certificate Issues

1. Verify DNS records are correct
2. Wait 15-30 minutes for propagation
3. Check ACM console for validation status

### Performance Issues

1. Enable CloudFront caching
2. Check DynamoDB query performance
3. Review Bedrock API latency
4. Optimize Next.js build

## Support

- **Documentation**: See `DEPLOYMENT.md` for detailed guide
- **Infrastructure**: See `infrastructure/DEPLOYMENT_GUIDE.md`
- **AWS Support**: https://console.aws.amazon.com/support/
- **Amplify Docs**: https://docs.amplify.aws/

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Choose deployment option
3. ✅ Configure environment variables
4. ✅ Deploy application
5. ✅ Test deployment
6. ✅ Set up custom domain (optional)
7. ✅ Configure monitoring
8. ✅ Go live!

---

**Quick Links**

- [Full Deployment Guide](DEPLOYMENT.md)
- [Infrastructure Guide](infrastructure/DEPLOYMENT_GUIDE.md)
- [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
- [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)
