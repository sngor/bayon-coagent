# Quick Reference Guide

## Common Commands

### Setup

```bash
# Install dependencies
npm run infra:install

# Bootstrap CDK (first time only)
cd infrastructure && npm run bootstrap
```

### Development

```bash
# Deploy to development
npm run infra:deploy:dev

# Show what will change
npm run infra:diff

# Synthesize CloudFormation
npm run infra:synth

# Destroy development
npm run infra:destroy:dev
```

### Production

```bash
# Deploy to production
npm run infra:deploy:prod

# Destroy production (careful!)
npm run infra:destroy:prod
```

## Stack Outputs

After deployment, get outputs:

```bash
cd infrastructure
cat outputs.json
```

## Environment Variables

Update your .env file with these values from outputs:

```bash
COGNITO_USER_POOL_ID=<UserPoolId>
COGNITO_CLIENT_ID=<UserPoolClientId>
DYNAMODB_TABLE_NAME=<TableName>
S3_BUCKET_NAME=<StorageBucketName>
```

## Monitoring

### CloudWatch Dashboard

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BayonCoAgent-{env}
```

### CloudFormation Console

```
https://console.aws.amazon.com/cloudformation
```

## Troubleshooting

### Check Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name BayonCoAgent-development-Cognito
```

### View Stack Events

```bash
aws cloudformation describe-stack-events \
  --stack-name BayonCoAgent-development-Cognito \
  --max-items 10
```

### Delete Failed Stack

```bash
aws cloudformation delete-stack \
  --stack-name BayonCoAgent-development-Cognito
```

## Cost Estimation

Approximate monthly costs (development):

- Cognito: $0 (free tier)
- DynamoDB: $1-5 (pay-per-request)
- S3: $1-3 (storage + requests)
- Bedrock: Variable (pay-per-use)
- CloudWatch: $0-2 (logs + metrics)

Total: ~$5-15/month for light usage

## Support

- Documentation: See README.md and DEPLOYMENT_GUIDE.md
- AWS Console: https://console.aws.amazon.com
- CDK Docs: https://docs.aws.amazon.com/cdk/
