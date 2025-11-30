# Production Deployment Checklist

## Pre-Deployment Phase

### Environment Preparation
- [ ] **AWS Account Access**
  - [ ] Production AWS account created
  - [ ] IAM user created with appropriate permissions
  - [ ] AWS CLI configured with production credentials
  - [ ] MFA enabled on AWS account

- [ ] **Domain and DNS**
  - [ ] Production domain registered
  - [ ] DNS access available (Route 53 or external provider)
  - [ ] SSL certificate requested (or will use ACM)

- [ ] **Tools Installed**
  - [ ] Node.js 18.x or higher
  - [ ] AWS CLI v2
  - [ ] AWS SAM CLI
  - [ ] Git

### Configuration Review
- [ ] **Code Preparation**
  - [ ] All code merged to production branch
  - [ ] `template.yaml` reviewed for production settings
  - [ ] `next.config.ts` production settings verified
  - [ ] Security headers configured
  - [ ] CSP policies reviewed

- [ ] **Environment Variables**
  - [ ] All required production environment variables documented
  - [ ] Sensitive secrets identified for Secrets Manager
  - [ ] `.env.production` template created
  - [ ] OAuth callback URLs updated for production domain

- [ ] **Security Review**
  - [ ] IAM policies reviewed
  - [ ] S3 bucket policies verified
  - [ ] CORS configurations checked
  - [ ] DynamoDB encryption enabled
  - [ ] Secrets rotation policy defined

### Cost Management
- [ ] **Budget Setup**
  - [ ] AWS Cost Explorer enabled
  - [ ] Budget alerts configured
  - [ ] Cost allocation tags defined
  - [ ] Service quotas checked

## Deployment Phase

### Infrastructure Deployment (SAM)
- [ ] **Pre-Deployment**
  - [ ] SAM template validated: `npm run sam:validate`
  - [ ] Changeset reviewed (dry-run deployment)
  - [ ] Backup strategy confirmed

- [ ] **Execute Deployment**
  - [ ] Run: `npm run sam:deploy:prod`
  - [ ] Monitor CloudFormation stack creation
  - [ ] Verify no errors in CloudFormation console

- [ ] **Post-Infrastructure**
  - [ ] Infrastructure outputs saved
  - [ ] Cognito User Pool ID noted
  - [ ] DynamoDB table name noted
  - [ ] S3 bucket name noted

### Secrets Management
- [ ] **Create Secrets**
  - [ ] Google OAuth secrets created
  - [ ] Facebook/LinkedIn secrets created
  - [ ] Stripe secrets created
  - [ ] MLS provider secrets created
  - [ ] Third-party API keys stored
  - [ ] Secrets Manager permissions verified

### Frontend Deployment (Amplify)
- [ ] **Pre-Deployment**
  - [ ] Code pushed to Git repository
  - [ ] Production branch protection enabled

- [ ] **Amplify Setup**
  - [ ] Amplify app created: `npm run deploy:amplify`
  - [ ] Environment variables configured in Amplify Console
  - [ ] Build settings reviewed
  - [ ] IAM service role attached

- [ ] **Execute Deployment**
  - [ ] Initial build triggered
  - [ ] Build logs monitored for errors
  - [ ] Build completed successfully

### Domain and SSL Configuration
- [ ] **SSL Certificate**
  - [ ] ACM certificate requested
  - [ ] DNS validation records added
  - [ ] Certificate validated and issued

- [ ] **Domain Configuration**
  - [ ] Custom domain added to Amplify
  - [ ] DNS records configured (Route 53 or external)
  - [ ] SSL binding verified

- [ ] **OAuth Updates**
  - [ ] Cognito callback URLs updated
  - [ ] Google OAuth Console updated
  - [ ] Facebook/LinkedIn redirect URIs updated

## Post-Deployment Phase

### Verification Testing
- [ ] **Infrastructure Verification**
  - [ ] CloudFormation stack shows CREATE_COMPLETE
  - [ ] All resources created successfully
  - [ ] CloudWatch dashboard accessible

- [ ] **Application Verification**
  - [ ] Application loads at production URL
  - [ ] SSL certificate valid (green lock)
  - [ ] No browser console errors
  - [ ] Static assets loading correctly

- [ ] **Authentication Testing**
  - [ ] User registration works
  - [ ] Email verification works
  - [ ] User login works
  - [ ] OAuth login works (Google)
  - [ ] Password reset works
  - [ ] Logout works

- [ ] **Core Functionality Testing**
  - [ ] Dashboard loads with data
  - [ ] File upload to S3 works
  - [ ] File download from S3 works
  - [ ] AI content generation works (Bedrock)
  - [ ] Forms submit successfully
  - [ ] Database read/write operations work

- [ ] **API Testing**
  - [ ] All critical API endpoints responding
  - [ ] External integrations working
  - [ ] Error handling working correctly

### Monitoring Setup
- [ ] **CloudWatch Configuration**
  - [ ] Dashboards accessible
  - [ ] Metrics populating correctly
  - [ ] Log groups created
  - [ ] Logs streaming correctly

- [ ] **Alarms Configuration**
  - [ ] SNS topic subscription confirmed
  - [ ] Test alarm triggered successfully
  - [ ] Email notifications received
  - [ ] Error rate alarms configured
  - [ ] Latency alarms configured
  - [ ] Cost alarms configured

- [ ] **X-Ray Tracing**
  - [ ] X-Ray enabled and collecting traces
  - [ ] Service map visible
  - [ ] Trace data available

### Performance Verification
- [ ] **Load Testing**
  - [ ] Page load times acceptable (< 3s)
  - [ ] API response times acceptable
  - [ ] Database query performance acceptable
  - [ ] No throttling observed

- [ ] **Optimization Checks**
  - [ ] Images optimized
  - [ ] Code splitting working
  - [ ] Caching headers configured
  - [ ] CDN (CloudFront) working

### Security Verification
- [ ] **Security Scan**
  - [ ] No exposed secrets in code
  - [ ] HTTPS enforced
  - [ ] Security headers present
  - [ ] CORS configured correctly
  - [ ] No public S3 access

- [ ] **Compliance**
  - [ ] Data encryption at rest enabled
  - [ ] Data encryption in transit enabled
  - [ ] Audit logging enabled (CloudTrail)
  - [ ] Backup retention configured

## Post-Launch Phase

### Documentation
- [ ] **Team Documentation**
  - [ ] Production access documented
  - [ ] Runbooks created for common operations
  - [ ] Incident response procedures documented
  - [ ] Escalation procedures defined

- [ ] **Operational Documentation**
  - [ ] Monitoring procedures documented
  - [ ] Backup procedures documented
  - [ ] Deployment procedures documented
  - [ ] Rollback procedures documented

### Team Readiness
- [ ] **Access and Permissions**
  - [ ] Production access granted to team
  - [ ] AWS Console access configured
  - [ ] MFA enforced for all users
  - [ ] Least privilege permissions applied

- [ ] **Training**
  - [ ] Team trained on production access
  - [ ] Team trained on monitoring
  - [ ] Team trained on incident response
  - [ ] On-call rotation established (if applicable)

### Ongoing Operations
- [ ] **Monitoring**
  - [ ] Daily health checks scheduled
  - [ ] Weekly metrics review scheduled
  - [ ] Monthly cost review scheduled
  - [ ] Quarterly security audit scheduled

- [ ] **Maintenance**
  - [ ] Dependency update schedule defined
  - [ ] Security patch process defined
  - [ ] Database maintenance schedule defined
  - [ ] Backup verification schedule defined

## Rollback Plan (If Needed)

### Application Rollback
- [ ] Previous deployment ID identified
- [ ] Rollback command ready: `aws amplify start-job --commit-id PREVIOUS_ID`
- [ ] Team notified of rollback
- [ ] Rollback executed and verified

### Infrastructure Rollback
- [ ] Previous CloudFormation template available
- [ ] Rollback command ready
- [ ] Data migration plan (if schema changed)
- [ ] Team notified of rollback

## Sign-Off

### Deployment Team
- [ ] Technical Lead approval
- [ ] Security team approval (if applicable)
- [ ] Business stakeholder approval

### Post-Deployment
- [ ] Deployment summary documented
- [ ] Lessons learned captured
- [ ] Issues and resolutions documented
- [ ] Next steps identified

---

## Quick Reference Commands

### Deployment
```bash
# Infrastructure
npm run sam:deploy:prod

# Frontend
npm run deploy:amplify
```

### Verification
```bash
# Run smoke tests
./scripts/smoke-tests/test-auth.sh https://your-domain.com
./scripts/smoke-tests/test-database.sh
./scripts/smoke-tests/test-storage.sh
./scripts/smoke-tests/test-ai.sh
```

### Monitoring
```bash
# View CloudWatch logs
aws logs tail /aws/amplify/YOUR_APP_ID --follow

# View stack outputs
npm run sam:outputs
```

### Rollback
```bash
# Amplify rollback
aws amplify start-job --app-id APP_ID --branch-name main --commit-id PREVIOUS_COMMIT

# Infrastructure rollback
aws cloudformation cancel-update-stack --stack-name bayon-coagent-prod
```

## Emergency Contacts

- **AWS Support**: [Your AWS Support Plan]
- **Technical Lead**: [Name/Contact]
- **On-Call Engineer**: [Contact/Pager]
- **Security Team**: [Contact]
