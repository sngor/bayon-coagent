# API Testing Guide

This guide covers testing the Bayon CoAgent API endpoints after deployment to ensure all services are working correctly.

## Overview

The Bayon CoAgent platform exposes several API endpoints for different functionalities:

- **Subscription Management**: Handle user subscriptions and billing
- **Environment Debug**: Verify environment variable configuration
- **Admin Analytics**: Provide administrative insights and metrics
- **Cron Jobs**: Handle scheduled tasks like trial notifications

## Automated Testing Script

### Quick Test

Use the provided script to test all endpoints:

```bash
./scripts/test-api-endpoints.sh
```

This script automatically tests:

1. **Subscription Status API** (`/api/subscription/status`)
2. **Environment Debug API** (`/api/debug/env`)
3. **Admin Analytics API** (`/api/admin/subscription-analytics`)
4. **Trial Notifications API** (`/api/cron/trial-notifications`)

### Expected Results

The script provides clear feedback for each endpoint:

- ✅ **Subscription API working!** - Core functionality is ready
- ✅ **Debug API working!** - Environment variables are set correctly
- ❌ **Admin API failed (may need authentication)** - Expected for unauthenticated requests
- ❌ **Cron API failed (may need proper token)** - Expected without valid authentication

### Script Output Example

```
🧪 Testing Bayon CoAgent API Endpoints
========================================

1. Testing Subscription Status API...
Response: {"success":true,"data":{"status":"active","plan":"free"}}
✅ Subscription API working!

2. Testing Environment Debug API...
Response: {"success":true,"environment":"production","region":"us-east-1"}
✅ Debug API working!

3. Testing Admin Analytics API...
Response: {"success":false,"error":"Unauthorized"}
❌ Admin API failed (may need authentication)

4. Testing Trial Notifications API...
Response: {"success":false,"error":"Invalid token"}
❌ Cron API failed (may need proper token)

🎯 Summary:
- If Subscription API works, core functionality is ready
- If Debug API works, environment variables are set correctly
- Admin and Cron APIs may need authentication

Next steps:
1. Set environment variables in Amplify Console
2. Redeploy the application
3. Run this script again to verify
```

## Manual API Testing

### 1. Subscription Status API

Test user subscription functionality:

```bash
# Test with sample user ID
curl "https://bayoncoagent.app/api/subscription/status?userId=test"

# Expected response (success):
{
  "success": true,
  "data": {
    "status": "active",
    "plan": "free",
    "trialDaysRemaining": null
  }
}

# Expected response (error):
{
  "success": false,
  "error": "User not found"
}
```

**What this tests:**
- Database connectivity (DynamoDB)
- User lookup functionality
- Subscription logic
- Error handling

### 2. Environment Debug API

Verify environment configuration:

```bash
curl "https://bayoncoagent.app/api/debug/env"

# Expected response (success):
{
  "success": true,
  "environment": "production",
  "region": "us-east-1",
  "hasDatabase": true,
  "hasStorage": true,
  "hasBedrock": true
}
```

**What this tests:**
- Environment variables are set
- AWS service configuration
- Basic connectivity
- Deployment environment

### 3. Admin Analytics API

Test administrative functionality:

```bash
curl "https://bayoncoagent.app/api/admin/subscription-analytics"

# Expected response (without auth):
{
  "success": false,
  "error": "Unauthorized"
}

# Expected response (with valid auth):
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeSubscriptions": 45,
    "trialUsers": 12,
    "revenue": 2500
  }
}
```

**What this tests:**
- Authentication middleware
- Admin-only access control
- Analytics data aggregation
- Database queries

### 4. Trial Notifications API

Test scheduled job functionality:

```bash
curl -X POST "https://bayoncoagent.app/api/cron/trial-notifications" \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json"

# Expected response (invalid token):
{
  "success": false,
  "error": "Invalid token"
}

# Expected response (valid token):
{
  "success": true,
  "data": {
    "processed": 5,
    "notifications": 3,
    "errors": 0
  }
}
```

**What this tests:**
- Cron job authentication
- Email notification system
- Trial user processing
- Background job functionality

## API Endpoints Reference

### Core Application APIs

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/subscription/status` | GET | Check user subscription | Optional |
| `/api/subscription/create` | POST | Create new subscription | Required |
| `/api/subscription/cancel` | POST | Cancel subscription | Required |
| `/api/subscription/update` | POST | Update subscription | Required |

### Debug and Health APIs

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/debug/env` | GET | Environment info | None |
| `/api/health` | GET | Health check | None |
| `/api/debug/database` | GET | Database connectivity | Admin |
| `/api/debug/storage` | GET | Storage connectivity | Admin |

### Admin APIs

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/admin/subscription-analytics` | GET | Subscription metrics | Super Admin |
| `/api/admin/users` | GET | User management | Admin |
| `/api/admin/content` | GET | Content moderation | Admin |
| `/api/admin/system` | GET | System status | Super Admin |

### Cron Job APIs

| Endpoint | Method | Purpose | Authentication |
|----------|--------|---------|----------------|
| `/api/cron/trial-notifications` | POST | Send trial reminders | Cron Token |
| `/api/cron/cleanup` | POST | Clean up expired data | Cron Token |
| `/api/cron/analytics` | POST | Generate analytics | Cron Token |

## Authentication Testing

### User Authentication

Test with valid user session:

```bash
# Get auth token (replace with actual login flow)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test authenticated endpoint
curl "https://bayoncoagent.app/api/subscription/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"professional"}'
```

### Admin Authentication

Test admin-only endpoints:

```bash
# Admin token (super admin user)
ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Test admin endpoint
curl "https://bayoncoagent.app/api/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Cron Authentication

Test cron job endpoints:

```bash
# Cron token (from environment variables)
CRON_TOKEN="your-secure-cron-token"

# Test cron endpoint
curl -X POST "https://bayoncoagent.app/api/cron/trial-notifications" \
  -H "Authorization: Bearer $CRON_TOKEN"
```

## Error Handling Testing

### Test Invalid Requests

```bash
# Missing required parameters
curl "https://bayoncoagent.app/api/subscription/status"
# Expected: 400 Bad Request

# Invalid user ID format
curl "https://bayoncoagent.app/api/subscription/status?userId=invalid-format"
# Expected: 400 Bad Request

# Unauthorized access
curl "https://bayoncoagent.app/api/admin/users"
# Expected: 401 Unauthorized
```

### Test Rate Limiting

```bash
# Send multiple rapid requests
for i in {1..20}; do
  curl "https://bayoncoagent.app/api/subscription/status?userId=test$i" &
done
wait

# Some requests should return 429 Too Many Requests
```

## Performance Testing

### Response Time Testing

```bash
# Test response times
time curl "https://bayoncoagent.app/api/subscription/status?userId=test"

# Should complete in < 2 seconds for most endpoints
```

### Load Testing

Use tools like Apache Bench or Artillery:

```bash
# Install Apache Bench
brew install httpie

# Test with 100 concurrent requests
ab -n 1000 -c 100 "https://bayoncoagent.app/api/subscription/status?userId=test"
```

## Troubleshooting

### Common Issues

#### 1. "Connection Refused" or 404 Errors

**Cause**: Application not deployed or wrong URL

**Solution**:
- Verify deployment completed successfully
- Check Amplify Console for deployment status
- Verify the correct domain name

#### 2. "Environment Variables Not Set"

**Cause**: Missing environment variables in deployment

**Solution**:
- Check Amplify Console → Environment Variables
- Verify all required variables are set
- Redeploy after adding variables

#### 3. "Database Connection Failed"

**Cause**: DynamoDB permissions or configuration issue

**Solution**:
- Verify IAM service role has DynamoDB permissions
- Check table name matches environment variable
- Verify region configuration

#### 4. "Unauthorized" for Public Endpoints

**Cause**: Authentication middleware misconfiguration

**Solution**:
- Check API route configuration
- Verify middleware setup
- Review authentication logic

### Debug Steps

1. **Check Deployment Status**
   ```bash
   # Amplify deployment status
   aws amplify get-app --app-id <your-app-id>
   ```

2. **Check Environment Variables**
   ```bash
   # Test debug endpoint
   curl "https://bayoncoagent.app/api/debug/env"
   ```

3. **Check CloudWatch Logs**
   ```bash
   # View application logs
   aws logs tail /aws/amplify/<app-id> --follow
   ```

4. **Test Individual Services**
   ```bash
   # Test database directly
   aws dynamodb scan --table-name BayonCoAgent-production --limit 1
   
   # Test S3 access
   aws s3 ls s3://your-bucket-name
   ```

## Integration with CI/CD

### Automated Testing in Pipeline

Add API testing to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml
- name: Test API Endpoints
  run: |
    # Wait for deployment to be ready
    sleep 30
    
    # Run API tests
    ./scripts/test-api-endpoints.sh
    
    # Fail pipeline if critical APIs don't work
    if ! curl -f "https://bayoncoagent.app/api/subscription/status?userId=test"; then
      echo "Critical API test failed"
      exit 1
    fi
```

### Monitoring Integration

Set up monitoring alerts for API failures:

```bash
# CloudWatch alarm for API errors
aws cloudwatch put-metric-alarm \
  --alarm-name api-error-rate \
  --alarm-description "Alert on high API error rate" \
  --metric-name 4XXError \
  --namespace AWS/Amplify \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Best Practices

### 1. Test After Every Deployment

Always run the API test script after deployment:

```bash
# Deploy
npm run deploy:amplify

# Test
./scripts/test-api-endpoints.sh
```

### 2. Monitor API Health

Set up regular health checks:

```bash
# Add to cron job (every 5 minutes)
*/5 * * * * curl -f "https://bayoncoagent.app/api/health" || echo "API down"
```

### 3. Test Different Scenarios

- Test with valid and invalid data
- Test authentication and authorization
- Test error conditions
- Test performance under load

### 4. Document API Changes

Update this guide when adding new endpoints:

- Add endpoint to reference table
- Add testing examples
- Update automated test script

## Next Steps

1. ✅ Run automated API tests after deployment
2. ✅ Verify all critical endpoints work
3. ✅ Set up monitoring for API health
4. ✅ Add API tests to CI/CD pipeline
5. ✅ Document any new endpoints
6. ✅ Train team on API testing procedures

---

**Quick Reference**: Use `./scripts/test-api-endpoints.sh` for immediate API testing after any deployment.