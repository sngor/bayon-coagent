# SAM Quick Reference

## Essential Commands

### Validation

```bash
sam validate                    # Validate template
sam validate --lint            # Validate with linting
```

### Deployment

```bash
# Development
./scripts/sam-deploy.sh development

# Production
./scripts/sam-deploy.sh production your-email@example.com

# Manual deployment
sam deploy --config-env development
sam deploy --config-env production
```

### Stack Management

```bash
# List stacks
sam list stacks

# View outputs
sam list stack-outputs --stack-name bayon-coagent-development

# View resources
sam list resources --stack-name bayon-coagent-development

# Delete stack
./scripts/sam-destroy.sh development
```

### Environment Setup

```bash
# Update .env from stack outputs
./scripts/update-env-from-sam.sh development

# Copy to application
cp .env.development .env.local
```

## Stack Outputs

After deployment, get these values:

```bash
# All outputs
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs' \
  --output table

# Specific output
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
  --output text
```

## Environment Variables

Required in your `.env.local`:

```bash
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=<from outputs>
COGNITO_CLIENT_ID=<from outputs>
DYNAMODB_TABLE_NAME=<from outputs>
S3_BUCKET_NAME=<from outputs>
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Monitoring

### Dashboard

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BayonCoAgent-development
```

### Logs

```bash
# View CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --max-items 20

# View specific resource
aws cloudformation describe-stack-resource \
  --stack-name bayon-coagent-development \
  --logical-resource-id DynamoDBTable
```

## Troubleshooting

### Check Stack Status

```bash
aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].StackStatus'
```

### View Failed Events

```bash
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Delete Failed Stack

```bash
aws cloudformation delete-stack \
  --stack-name bayon-coagent-development
```

### Empty S3 Bucket

```bash
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name bayon-coagent-development \
  --query 'Stacks[0].Outputs[?OutputKey==`StorageBucketName`].OutputValue' \
  --output text)

aws s3 rm s3://${BUCKET} --recursive
```

## Cost Estimation

### Development (~$5-15/month)

- Cognito: Free tier
- DynamoDB: $1-5 (pay-per-request)
- S3: $1-3
- CloudWatch: $0-2
- Bedrock: Variable (pay-per-use)

### Production (~$20-50/month)

- Cognito: Free tier
- DynamoDB: $5-15 (with PITR)
- S3: $3-10 (with versioning)
- CloudWatch: $2-5
- Bedrock: Variable (pay-per-use)

## Common Tasks

### Update Stack

```bash
# Make changes to template.yaml
sam validate
sam deploy --config-env development
```

### View Drift

```bash
aws cloudformation detect-stack-drift \
  --stack-name bayon-coagent-development

# Check drift status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <id-from-above>
```

### Export Template

```bash
aws cloudformation get-template \
  --stack-name bayon-coagent-development \
  --query 'TemplateBody' > deployed-template.yaml
```

## Package.json Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "sam:validate": "sam validate",
    "sam:deploy:dev": "./scripts/sam-deploy.sh development",
    "sam:deploy:prod": "./scripts/sam-deploy.sh production",
    "sam:destroy:dev": "./scripts/sam-destroy.sh development",
    "sam:destroy:prod": "./scripts/sam-destroy.sh production",
    "sam:outputs": "sam list stack-outputs --stack-name bayon-coagent-development"
  }
}
```

## AWS Console Links

### CloudFormation

```
https://console.aws.amazon.com/cloudformation/home?region=us-east-1
```

### Cognito

```
https://console.aws.amazon.com/cognito/home?region=us-east-1
```

### DynamoDB

```
https://console.aws.amazon.com/dynamodb/home?region=us-east-1
```

### S3

```
https://console.aws.amazon.com/s3/home?region=us-east-1
```

### CloudWatch

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1
```

## Tips

1. **Always validate before deploying**

   ```bash
   sam validate && sam deploy
   ```

2. **Use --guided for first deployment**

   ```bash
   sam deploy --guided
   ```

3. **Save outputs immediately**

   ```bash
   ./scripts/update-env-from-sam.sh development
   ```

4. **Check costs regularly**

   ```bash
   aws ce get-cost-and-usage \
     --time-period Start=2024-01-01,End=2024-01-31 \
     --granularity MONTHLY \
     --metrics BlendedCost
   ```

5. **Tag resources for cost tracking**
   All resources are tagged with Environment and Application

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Update .env file
3. ✅ Test application
4. ✅ Set up monitoring
5. ✅ Configure alarms
6. ✅ Document deployment
