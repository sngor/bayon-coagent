# Troubleshooting Guide

## Common Issues & Solutions

This guide covers the most frequently encountered issues and their solutions.

## Development Environment Issues

### LocalStack Problems

#### LocalStack Won't Start

**Symptoms:**
- `npm run localstack:start` fails
- Docker connection errors
- Port conflicts

**Solutions:**

```bash
# Check if Docker is running
docker ps

# If Docker isn't running, start it
# On macOS: Start Docker Desktop
# On Linux: sudo systemctl start docker

# Check for port conflicts
lsof -i :4566
lsof -i :4571

# Kill conflicting processes
sudo kill -9 <PID>

# Restart LocalStack
npm run localstack:stop
npm run localstack:start
```

#### LocalStack Services Not Responding

**Symptoms:**
- AWS services return connection errors
- `curl http://localhost:4566/_localstack/health` fails

**Solutions:**

```bash
# Check LocalStack logs
npm run localstack:logs

# Restart and reinitialize
npm run localstack:stop
npm run localstack:start
npm run localstack:init

# Verify health
curl http://localhost:4566/_localstack/health
```

#### LocalStack Initialization Fails

**Symptoms:**
- `npm run localstack:init` fails
- AWS resources not created

**Solutions:**

```bash
# Check AWS CLI configuration
aws configure list

# Verify LocalStack environment
echo $USE_LOCAL_AWS  # Should be "true"

# Manual initialization
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 s3 ls

# Recreate resources
npm run localstack:init
```

### Environment Variable Issues

#### Missing Environment Variables

**Symptoms:**
- Application crashes on startup
- "Environment variable not found" errors
- Features not working

**Solutions:**

```bash
# Check if .env.local exists
ls -la .env.local

# Copy from example if missing
cp .env.example .env.local

# Verify required variables
cat .env.local | grep -E "(COGNITO|DYNAMODB|S3|TAVILY)"

# Restart development server
npm run dev
```

#### Environment Variables Not Loading

**Symptoms:**
- `process.env.VARIABLE_NAME` returns undefined
- Configuration not applied

**Solutions:**

```bash
# Check file naming (.env.local not .env.development)
ls -la .env*

# Verify no syntax errors in .env.local
cat .env.local

# Restart Next.js server (environment variables are loaded on startup)
npm run dev

# Check if variables are client-side (need NEXT_PUBLIC_ prefix)
# Client-side: NEXT_PUBLIC_API_URL
# Server-side: API_SECRET_KEY
```

### TypeScript Issues

#### Type Errors

**Symptoms:**
- TypeScript compilation errors
- `npm run typecheck` fails
- IDE showing type errors

**Solutions:**

```bash
# Run type checking
npm run typecheck

# Common fixes:
# 1. Install missing type definitions
npm install @types/node @types/react @types/react-dom

# 2. Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# 3. Restart TypeScript server in IDE
# VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

# 4. Check tsconfig.json for issues
npx tsc --showConfig
```

#### Import/Export Errors

**Symptoms:**
- "Module not found" errors
- Import path issues

**Solutions:**

```bash
# Check import paths (use @ alias for src/)
# ✅ import { Button } from "@/components/ui/button"
# ❌ import { Button } from "../../components/ui/button"

# Verify file exists
ls -la src/components/ui/button.tsx

# Check for case sensitivity issues
# File: Button.tsx
# Import: import { Button } from "./button"  # ❌
# Import: import { Button } from "./Button"  # ✅

# Clear module cache
rm -rf .next
npm run dev
```

### Build Issues

#### Build Failures

**Symptoms:**
- `npm run build` fails
- Compilation errors
- Out of memory errors

**Solutions:**

```bash
# Check for TypeScript errors first
npm run typecheck

# Check for linting errors
npm run lint

# Increase Node.js memory (if needed)
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Clear cache and rebuild
rm -rf .next
rm -rf node_modules/.cache
npm run build
```

## Authentication Issues

### Cognito Authentication Problems

#### Login Failures

**Symptoms:**
- Login form doesn't work
- "Invalid credentials" errors
- Redirect loops

**Solutions:**

```bash
# Check Cognito configuration
echo $NEXT_PUBLIC_COGNITO_USER_POOL_ID
echo $NEXT_PUBLIC_COGNITO_CLIENT_ID

# Verify LocalStack Cognito is running
aws --endpoint-url=http://localhost:4566 cognito-idp list-user-pools --max-results 10

# Check if user exists
aws --endpoint-url=http://localhost:4566 cognito-idp admin-get-user \
  --user-pool-id $COGNITO_USER_POOL_ID \
  --username test@example.com

# Create test user if needed
npm run admin:create
```

#### Session Issues

**Symptoms:**
- User gets logged out frequently
- Session not persisting
- "Unauthorized" errors

**Solutions:**

```bash
# Check cookie settings in browser dev tools
# Look for cognito_session cookie

# Clear browser cookies and localStorage
# Chrome: Dev Tools → Application → Storage → Clear storage

# Check server-side session handling
# Look for JWT token validation errors in console

# Verify session cookie configuration
# Check src/aws/auth/server-auth.ts
```

#### JWT Token Issues

**Symptoms:**
- "Invalid token" errors
- Token expiration issues
- Malformed token errors

**Solutions:**

```bash
# Check token in browser dev tools
# Application → Cookies → cognito_session

# Decode JWT token (for debugging)
# Use jwt.io to decode and inspect token

# Check token expiration
# Tokens expire after 1 hour by default

# Clear session and re-login
# Delete cognito_session cookie
```

## API Issues

### Server Action Failures

#### Action Not Found

**Symptoms:**
- "Action not found" errors
- Form submissions fail
- API calls return 404

**Solutions:**

```bash
# Check if action is properly exported
# src/app/actions.ts should export the action

# Verify action is imported correctly in component
# import { actionName } from "@/app/actions"

# Check for typos in action name
# Action: createContentAction
# Usage: <form action={createContentAction}>

# Restart development server
npm run dev
```

#### Validation Errors

**Symptoms:**
- "Validation failed" messages
- Form data not accepted
- Schema validation errors

**Solutions:**

```bash
# Check Zod schema definition
# Ensure schema matches form data structure

# Verify FormData extraction
# Check field names match form inputs

# Test with minimal data
# Start with required fields only

# Check console for detailed validation errors
```

#### Database Connection Issues

**Symptoms:**
- DynamoDB connection errors
- "Table not found" errors
- AWS SDK errors

**Solutions:**

```bash
# Check DynamoDB table exists
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# Verify table name in environment
echo $DYNAMODB_TABLE_NAME

# Check AWS configuration
aws configure list

# Test DynamoDB connection
aws --endpoint-url=http://localhost:4566 dynamodb scan \
  --table-name $DYNAMODB_TABLE_NAME --limit 1
```

## AI/Bedrock Issues

### Bedrock Connection Problems

#### Model Access Issues

**Symptoms:**
- "Model not found" errors
- Access denied errors
- Bedrock API failures

**Solutions:**

```bash
# Check Bedrock model ID
echo $BEDROCK_MODEL_ID

# Verify AWS region
echo $BEDROCK_REGION

# Test Bedrock access (requires real AWS credentials)
aws bedrock list-foundation-models --region us-east-1

# Check if model is available in region
aws bedrock get-foundation-model \
  --model-identifier anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --region us-east-1
```

#### API Rate Limiting

**Symptoms:**
- "Rate limit exceeded" errors
- Slow AI responses
- Throttling errors

**Solutions:**

```bash
# Implement exponential backoff in code
# Check src/aws/bedrock/client.ts for retry logic

# Monitor Bedrock usage in CloudWatch
# Check for throttling metrics

# Consider using different model or region
# Some models have higher rate limits

# Implement caching for repeated requests
```

### Content Generation Issues

#### Poor Quality Output

**Symptoms:**
- AI generates irrelevant content
- Output doesn't match requirements
- Inconsistent results

**Solutions:**

```bash
# Check prompt engineering
# Review system prompts in AI flows

# Verify input validation
# Ensure all required fields are provided

# Test with different inputs
# Try various topics and parameters

# Review AI flow configuration
# Check temperature and other parameters
```

## Performance Issues

### Slow Page Loading

#### Large Bundle Size

**Symptoms:**
- Slow initial page load
- Large JavaScript bundles
- Poor Lighthouse scores

**Solutions:**

```bash
# Analyze bundle size
npm run build:analyze

# Check for large dependencies
npm run bundle:check

# Implement code splitting
# Use dynamic imports for heavy components

# Optimize images
# Use Next.js Image component with optimization
```

#### Memory Issues

**Symptoms:**
- Browser crashes
- Out of memory errors
- Slow performance

**Solutions:**

```bash
# Check for memory leaks
# Use browser dev tools Memory tab

# Implement virtual scrolling for large lists
# Use react-window or similar

# Optimize React components
# Use memo, useMemo, useCallback appropriately

# Clear unused data
# Implement proper cleanup in useEffect
```

### Database Performance

#### Slow Queries

**Symptoms:**
- Long response times
- DynamoDB throttling
- High read/write costs

**Solutions:**

```bash
# Check DynamoDB metrics in CloudWatch
# Monitor consumed capacity units

# Optimize query patterns
# Use proper partition and sort keys

# Implement caching
# Cache frequently accessed data

# Consider pagination
# Limit query results and implement pagination
```

## Deployment Issues

### SAM Deployment Failures

#### CloudFormation Errors

**Symptoms:**
- SAM deploy fails
- CloudFormation stack errors
- Resource creation failures

**Solutions:**

```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-dev

# Validate SAM template
sam validate --template template.yaml

# Check IAM permissions
# Ensure deployment user has required permissions

# Clean up failed stack
aws cloudformation delete-stack \
  --stack-name bayon-coagent-dev
```

#### Lambda Function Issues

**Symptoms:**
- Lambda deployment fails
- Function timeout errors
- Memory issues

**Solutions:**

```bash
# Check Lambda logs
sam logs -n FunctionName --stack-name bayon-coagent-dev

# Increase memory/timeout in template.yaml
MemorySize: 1024
Timeout: 30

# Check function dependencies
# Ensure all required packages are included

# Test function locally
sam local invoke FunctionName -e event.json
```

### Amplify Deployment Issues

#### Build Failures

**Symptoms:**
- Amplify build fails
- Environment variable errors
- Dependency issues

**Solutions:**

```bash
# Check build logs in Amplify Console
# Look for specific error messages

# Verify environment variables
# Check Amplify Console → App Settings → Environment Variables

# Update build settings
# Modify amplify.yml if needed

# Clear build cache
# Redeploy from Amplify Console
```

## Browser-Specific Issues

### Safari Issues

#### Cookie Problems

**Symptoms:**
- Authentication doesn't work in Safari
- Session not persisting
- Cross-site cookie issues

**Solutions:**

```bash
# Check cookie SameSite settings
# Ensure cookies are set with proper attributes

# Test in Safari private browsing
# Rule out extension conflicts

# Check for third-party cookie blocking
# Safari blocks third-party cookies by default
```

### Mobile Browser Issues

#### Touch/Scroll Problems

**Symptoms:**
- Poor touch responsiveness
- Scroll issues on mobile
- Layout problems

**Solutions:**

```bash
# Test on actual devices
# Use browser dev tools device simulation

# Check CSS touch-action properties
# Ensure proper touch handling

# Optimize for mobile viewport
# Use proper viewport meta tag

# Test with different screen sizes
# Ensure responsive design works
```

## Getting Help

### Debug Information to Collect

When reporting issues, include:

1. **Environment Information:**
   ```bash
   node --version
   npm --version
   docker --version
   aws --version
   sam --version
   ```

2. **Error Messages:**
   - Full error message and stack trace
   - Browser console errors
   - Server logs

3. **Steps to Reproduce:**
   - Exact steps that cause the issue
   - Expected vs actual behavior
   - Screenshots if applicable

4. **Configuration:**
   - Environment variables (sanitized)
   - Browser and version
   - Operating system

### Useful Commands for Debugging

```bash
# Check all services status
npm run verify:setup

# View all logs
npm run localstack:logs
docker logs bayon-coagent-dev

# Test API endpoints
npm run test:api

# Check TypeScript issues
npm run typecheck

# Analyze bundle
npm run build:analyze

# Performance testing
npm run lighthouse
```

### Resources

- **[Architecture Guide](./ARCHITECTURE.md)** - Understanding system design
- **[Development Guide](./DEVELOPMENT.md)** - Development patterns
- **[Deployment Guide](./DEPLOYMENT.md)** - Deployment procedures
- **[Quick Reference](./quick-reference/)** - Command and API references

### Creating Issues

When creating GitHub issues:

1. **Use descriptive titles**
2. **Include debug information**
3. **Provide reproduction steps**
4. **Add relevant labels**
5. **Reference related issues**

### Emergency Procedures

#### Production Issues

1. **Check monitoring dashboards**
2. **Review recent deployments**
3. **Check error rates and logs**
4. **Consider rollback if necessary**
5. **Communicate with team**

#### Data Loss Prevention

1. **Never delete production data without backup**
2. **Test recovery procedures regularly**
3. **Maintain multiple backup copies**
4. **Document recovery procedures**

This troubleshooting guide covers the most common issues you'll encounter. Keep it updated as new issues are discovered and resolved.