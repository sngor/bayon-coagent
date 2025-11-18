# Production Deployment Checklist

Use this checklist to ensure a smooth deployment to production.

## Pre-Deployment

### Infrastructure

- [ ] AWS account created and configured
- [ ] AWS CLI installed and configured
- [ ] IAM user/role with appropriate permissions
- [ ] Infrastructure deployed via CDK
  ```bash
  npm run infra:deploy:prod
  ```
- [ ] Infrastructure verified
  ```bash
  cd infrastructure && ./scripts/verify-infrastructure.sh production
  ```
- [ ] All CloudFormation stacks show `CREATE_COMPLETE` or `UPDATE_COMPLETE`

### Environment Configuration

- [ ] Production environment variables configured
- [ ] Infrastructure outputs retrieved
  ```bash
  cd infrastructure && ./scripts/update-env.sh production
  ```
- [ ] Sensitive credentials stored securely (AWS Secrets Manager)
- [ ] Google OAuth credentials configured for production domain
- [ ] External API keys (Bridge, NewsAPI) configured
- [ ] Bedrock model access enabled in AWS account

### Code Preparation

- [ ] All code changes committed to Git
- [ ] Main/production branch up to date
- [ ] Build succeeds locally
  ```bash
  npm run build
  ```
- [ ] TypeScript compilation succeeds
  ```bash
  npm run typecheck
  ```
- [ ] No critical linting errors
  ```bash
  npm run lint
  ```
- [ ] All tests pass (if applicable)

### Security Review

- [ ] Environment variables don't contain hardcoded secrets
- [ ] IAM policies follow least privilege principle
- [ ] S3 buckets have appropriate access controls
- [ ] Cognito User Pool has strong password policy
- [ ] MFA enabled for admin accounts
- [ ] CloudTrail logging enabled
- [ ] Security headers configured (in amplify.yml or CloudFront)

### Monitoring Setup

- [ ] CloudWatch alarms configured
- [ ] SNS topic for alerts created
- [ ] Email notifications configured
- [ ] CloudWatch dashboard created
- [ ] Log retention policies set
- [ ] Cost alerts configured

## Deployment

### Choose Deployment Method

Select one:

- [ ] **Option A: AWS Amplify Hosting** (Recommended)

  - [ ] Run deployment script: `npm run deploy:amplify`
  - [ ] Or manually create app in Amplify Console
  - [ ] Connect Git repository
  - [ ] Configure build settings (uses amplify.yml)
  - [ ] Add environment variables in Amplify Console
  - [ ] Attach IAM service role
  - [ ] Start deployment

- [ ] **Option B: Vercel**

  - [ ] Install Vercel CLI: `npm install -g vercel`
  - [ ] Configure environment variables as secrets
  - [ ] Deploy: `vercel --prod`

- [ ] **Option C: CloudFront + Lambda**
  - [ ] Deploy CloudFormation stack
  - [ ] Configure Lambda functions
  - [ ] Set up CloudFront distribution
  - [ ] Configure origins and behaviors

### Deployment Verification

- [ ] Deployment completed successfully
- [ ] Build logs reviewed (no errors)
- [ ] Application URL accessible
- [ ] Homepage loads correctly
- [ ] Static assets load (images, CSS, JS)
- [ ] No console errors in browser
- [ ] API routes respond correctly

### Custom Domain (Optional)

- [ ] Domain name purchased/available
- [ ] DNS provider accessible
- [ ] SSL certificate requested in ACM (us-east-1)
- [ ] Certificate validated (DNS or email)
- [ ] Domain added to Amplify/CloudFront
- [ ] DNS records configured (CNAME or A record)
- [ ] SSL certificate attached to distribution
- [ ] HTTPS redirect configured
- [ ] Domain accessible via HTTPS

## Post-Deployment

### Functional Testing

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Password reset works (if implemented)
- [ ] Profile page loads and updates
- [ ] Dashboard displays data correctly
- [ ] AI content generation works
  - [ ] Agent bio generation
  - [ ] Blog post generation
  - [ ] Social media post generation
  - [ ] Market update generation
  - [ ] Video script generation
- [ ] File upload works (profile images)
- [ ] Google OAuth integration works
- [ ] Real estate news feed loads
- [ ] All navigation links work
- [ ] Mobile responsive design works

### Performance Testing

- [ ] Page load time < 3 seconds
- [ ] Time to First Byte (TTFB) < 500ms
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] API response times acceptable
- [ ] AI generation completes in reasonable time
- [ ] No memory leaks observed
- [ ] Database queries optimized

### Security Testing

- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present
  - [ ] Strict-Transport-Security
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] X-XSS-Protection
  - [ ] Referrer-Policy
- [ ] CORS configured correctly
- [ ] Authentication required for protected routes
- [ ] JWT tokens validated correctly
- [ ] Session management works correctly
- [ ] No sensitive data in client-side code
- [ ] No API keys exposed in frontend

### Monitoring Verification

- [ ] CloudWatch logs receiving data
- [ ] Application logs visible in CloudWatch
- [ ] Metrics appearing in CloudWatch dashboard
- [ ] Alarms configured and active
- [ ] Test alarm triggers (optional)
- [ ] Email notifications working
- [ ] Error tracking working

### Load Testing (Optional but Recommended)

- [ ] Load testing tool configured (k6, Artillery, etc.)
- [ ] Baseline performance metrics recorded
- [ ] Load test executed (simulate expected traffic)
- [ ] Results analyzed
- [ ] No errors under expected load
- [ ] Response times acceptable under load
- [ ] Auto-scaling working (if configured)

### Documentation

- [ ] Deployment documented
- [ ] Environment variables documented
- [ ] Custom domain setup documented (if applicable)
- [ ] Monitoring setup documented
- [ ] Runbook created for common issues
- [ ] Team trained on deployment process
- [ ] Rollback procedure documented

## Monitoring & Maintenance

### Daily

- [ ] Check CloudWatch dashboard
- [ ] Review error logs
- [ ] Monitor user activity
- [ ] Check for any alarms

### Weekly

- [ ] Review performance metrics
- [ ] Check cost reports
- [ ] Review security logs
- [ ] Update dependencies (if needed)

### Monthly

- [ ] Review and optimize costs
- [ ] Update documentation
- [ ] Review and update alarms
- [ ] Security audit
- [ ] Performance optimization review

## Rollback Plan

If issues occur after deployment:

### Immediate Actions

- [ ] Identify the issue
- [ ] Assess severity (critical, high, medium, low)
- [ ] Notify team
- [ ] Check CloudWatch logs for errors

### Rollback Options

**For Amplify:**

- [ ] Redeploy previous version in Amplify Console
- [ ] Or revert Git commit and trigger new deployment

**For Vercel:**

- [ ] Use Vercel dashboard to rollback to previous deployment

**For CloudFront + Lambda:**

- [ ] Update Lambda function to previous version
- [ ] Or update CloudFormation stack to previous version

### Post-Rollback

- [ ] Verify application is working
- [ ] Notify users (if needed)
- [ ] Investigate root cause
- [ ] Fix issue in development
- [ ] Test thoroughly
- [ ] Redeploy when ready

## Emergency Contacts

Document key contacts for production issues:

- **AWS Support:** [Support Plan Level]
- **Team Lead:** [Name, Contact]
- **DevOps:** [Name, Contact]
- **On-Call:** [Rotation Schedule]

## Success Criteria

Deployment is considered successful when:

- [ ] All functional tests pass
- [ ] Performance meets requirements
- [ ] Security tests pass
- [ ] Monitoring is active
- [ ] No critical errors in logs
- [ ] User feedback is positive
- [ ] Application stable for 24 hours

## Sign-Off

- [ ] Technical Lead Approval: ********\_******** Date: **\_\_\_**
- [ ] Product Owner Approval: ********\_******** Date: **\_\_\_**
- [ ] Security Review: ********\_******** Date: **\_\_\_**

---

## Quick Test Commands

```bash
# Test deployment
npm run deploy:test <deployment-url>

# Check infrastructure
cd infrastructure && ./scripts/verify-infrastructure.sh production

# View logs
aws logs tail /aws/amplify/<app-id> --follow

# Check CloudWatch alarms
aws cloudwatch describe-alarms --state-value ALARM

# Test API endpoint
curl https://<your-domain>/api/health

# Test authentication
curl https://<your-domain>/login
```

---

**Last Updated:** [Date]  
**Deployment Version:** [Version]  
**Deployed By:** [Name]
