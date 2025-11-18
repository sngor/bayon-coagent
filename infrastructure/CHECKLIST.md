# Infrastructure Deployment Checklist

Use this checklist to ensure your infrastructure is properly deployed and configured.

## Pre-Deployment

- [ ] AWS CLI installed (`aws --version`)
- [ ] AWS CDK installed (`cdk --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] AWS account created
- [ ] IAM user created with appropriate permissions
- [ ] AWS credentials configured (`aws configure`)
- [ ] Dependencies installed (`npm run infra:install`)

## Initial Deployment

- [ ] CDK bootstrapped (`cd infrastructure && npm run bootstrap`)
- [ ] TypeScript compiled (`npm run build`)
- [ ] CloudFormation templates synthesized (`npm run synth`)
- [ ] Changes reviewed (`npm run diff`)
- [ ] Infrastructure deployed (`npm run deploy:dev`)
- [ ] Deployment completed successfully
- [ ] Outputs saved to `outputs.json`

## Post-Deployment Configuration

- [ ] Environment file generated (`./scripts/update-env.sh development`)
- [ ] Environment variables copied to application (`.env.local`)
- [ ] Application configuration updated
- [ ] Infrastructure verified (`./scripts/verify-infrastructure.sh development`)

## Stack Verification

### Cognito Stack

- [ ] User Pool created
- [ ] User Pool Client created
- [ ] Identity Pool created
- [ ] IAM roles attached
- [ ] Email verification configured

### DynamoDB Stack

- [ ] Table created with correct name
- [ ] Primary key (PK/SK) configured
- [ ] GSI1 created
- [ ] EntityTypeIndex created
- [ ] UserIndex created
- [ ] Streams enabled

### S3 Stack

- [ ] Storage bucket created
- [ ] Encryption enabled
- [ ] CORS configured
- [ ] Lifecycle policies set
- [ ] (Production) Versioning enabled
- [ ] (Production) CloudFront distribution created

### IAM Stack

- [ ] Application role created
- [ ] Bedrock access role created
- [ ] User-scoped policy created
- [ ] Permissions verified

### Monitoring Stack

- [ ] CloudWatch dashboard created
- [ ] Alarms configured
- [ ] SNS topic created
- [ ] (Optional) Email subscription confirmed

## Application Integration

- [ ] Cognito configuration in application
- [ ] DynamoDB client configured
- [ ] S3 client configured
- [ ] Bedrock client configured
- [ ] Environment variables set correctly

## Testing

- [ ] User registration works
- [ ] User login works
- [ ] Database read/write works
- [ ] File upload works
- [ ] File download works
- [ ] AI features work
- [ ] Monitoring dashboard accessible

## Monitoring Setup

- [ ] CloudWatch dashboard accessible
- [ ] Alarms visible in dashboard
- [ ] SNS email subscription confirmed
- [ ] Test alarm triggered successfully
- [ ] Email notification received

## Security Review

- [ ] No credentials in code
- [ ] Environment variables not committed
- [ ] IAM roles follow least privilege
- [ ] Encryption enabled for all services
- [ ] CORS configured correctly
- [ ] MFA enabled (optional but recommended)

## Production Readiness (Before Production Deployment)

- [ ] Domain name configured
- [ ] SSL certificate created (ACM)
- [ ] OAuth callback URLs updated
- [ ] Alarm email configured
- [ ] Backup strategy documented
- [ ] Disaster recovery plan created
- [ ] Cost monitoring set up
- [ ] Team trained on AWS console access

## Documentation

- [ ] README.md reviewed
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] Team has access to documentation
- [ ] Deployment process documented
- [ ] Troubleshooting guide reviewed

## Cleanup (Development Only)

- [ ] Backup any important data
- [ ] Run destroy script (`./scripts/destroy.sh development`)
- [ ] Verify all resources deleted
- [ ] Check for any remaining resources in AWS Console

## Notes

Use this space to track any issues or customizations:

```
Date: ___________
Deployed by: ___________
Environment: ___________
Issues encountered: ___________
Customizations made: ___________
```

## Support

If you encounter issues:

1. ✅ Check this checklist
2. ✅ Review documentation
3. ✅ Check CloudFormation events
4. ✅ Run verification script
5. ✅ Check CloudWatch logs
6. ✅ Contact AWS support if needed
