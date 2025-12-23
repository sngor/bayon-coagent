# Common Issues & Solutions

Comprehensive troubleshooting guide for the Bayon CoAgent platform.

## 🐳 LocalStack Issues

### LocalStack Won't Start

**Problem**: `docker-compose up -d` fails or LocalStack container doesn't start

**Solutions**:

```bash
# 1. Check if Docker is running
docker ps
# If this fails, start Docker Desktop

# 2. Check if port 4566 is available
lsof -i :4566
# If port is in use, kill the process:
kill -9 $(lsof -t -i:4566)

# 3. Restart Docker Desktop completely
# Close Docker Desktop → Restart → Try again

# 4. Clear Docker cache
docker system prune -a
docker volume prune

# 5. Restart LocalStack
npm run localstack:stop
npm run localstack:start
```

### Can't Connect to LocalStack Services

**Problem**: "Connection refused" or "Service not available" errors

**Solutions**:

```bash
# 1. Verify LocalStack is running and healthy
curl http://localhost:4566/_localstack/health

# Expected response: {"status": "running", "services": {...}}

# 2. Check environment variables
echo $USE_LOCAL_AWS  # Should be "true"
echo $AWS_ENDPOINT_URL  # Should be empty or "http://localhost:4566"

# 3. Restart LocalStack with fresh initialization
npm run localstack:stop
rm -rf localstack-data  # Clear all LocalStack data
npm run localstack:start
npm run localstack:init

# 4. Check LocalStack logs for errors
npm run localstack:logs
```

### LocalStack Services Not Initialized

**Problem**: "Table not found" or "Bucket not found" errors

**Solutions**:

```bash
# 1. Re-initialize LocalStack resources
npm run localstack:init

# 2. Verify resources were created
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 s3 ls

# 3. Check the init script output for errors
# Look for Cognito User Pool ID and Client ID
# Update .env.local with the correct values

# 4. Restart dev server after updating .env.local
```

## 🔐 Authentication Issues

### "Missing credentials" Error

**Problem**: AWS SDK can't find credentials

**Solutions**:

```bash
# For local development (.env.local):
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
USE_LOCAL_AWS=true

# For production, configure AWS CLI:
aws configure
# Or use IAM roles/instance profiles

# Verify credentials are loaded:
echo $AWS_ACCESS_KEY_ID
echo $USE_LOCAL_AWS
```

### Cognito Authentication Not Working

**Problem**: Can't sign up, sign in, or authentication fails

**Solutions**:

```bash
# 1. Verify Cognito User Pool exists
aws --endpoint-url=http://localhost:4566 cognito-idp list-user-pools --max-results 10

# 2. Check .env.local has correct Cognito IDs
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# 3. Re-initialize LocalStack
npm run localstack:init
# Copy the new IDs to .env.local

# 4. Clear browser storage and cookies
# Open DevTools → Application → Storage → Clear All

# 5. Try creating a test user manually
npm run clear-auth  # Clear any existing session
```

### Session Expired or Invalid Token

**Problem**: "Token expired" or "Invalid token" errors

**Solutions**:

```bash
# 1. Clear authentication session
npm run clear-auth

# 2. Clear browser storage
# DevTools → Application → Storage → Clear All

# 3. Sign out and sign back in

# 4. Check token expiration settings in Cognito
# LocalStack uses default settings (1 hour access token)
```

### Large Token Cookie Issues

**Problem**: Authentication fails with large JWT tokens or "Cookie too large" errors

**Background**: The platform automatically handles large JWT tokens by splitting them into multiple cookies when they exceed 3.5KB to avoid browser cookie size limits (4096 bytes).

**Solutions**:

```bash
# 1. Check if chunked cookies are being used
# DevTools → Application → Cookies → localhost:3000
# Look for: cognito_session_chunks, cognito_session_0, cognito_session_1, etc.

# 2. Clear all authentication cookies
npm run clear-auth

# 3. If cookies seem corrupted, clear manually:
# DevTools → Application → Cookies → Delete all cognito_session* cookies

# 4. Check server logs for cookie reconstruction errors
# Look for "Missing chunk" or "Failed to reconstruct session" messages

# 5. Verify cookie chunking is working:
# Large tokens should create multiple cognito_session_N cookies
# Small tokens should use single cognito_session cookie
```

**How Cookie Chunking Works**:
- **Single Cookie Mode**: Session data < 3.5KB stored in `cognito_session`
- **Chunked Mode**: Session data ≥ 3.5KB split into `cognito_session_0`, `cognito_session_1`, etc.
- **Chunk Count**: Stored in `cognito_session_chunks` cookie
- **Automatic Cleanup**: Unused cookies are automatically cleared when switching modes

## 🏗️ Build Issues

### TypeScript Errors

**Problem**: Type checking fails or TypeScript compilation errors

**Solutions**:

```bash
# 1. Analyze TypeScript errors with categorization and priority
node scripts/analyze-typescript-errors.js

# 2. Run type checking to see specific errors
npm run typecheck

# 3. Check for missing dependencies
npm install

# 4. Clear TypeScript cache
rm -rf .next
rm -f tsconfig.tsbuildinfo

# 5. Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# 6. Check for version conflicts
npm ls typescript
npm ls @types/node
```

**TypeScript Error Analysis Tool**:

The `analyze-typescript-errors.js` script provides intelligent error categorization:

- **Missing Modules**: Import path issues, missing dependencies
- **Type Mismatches**: Incompatible type assignments
- **Missing Properties**: Required object properties not provided
- **Parameter Issues**: Function parameter type problems
- **Any Type Issues**: Implicit any types that reduce type safety
- **Import/Export Issues**: Module resolution problems

The tool shows:

- Total error count by category
- Top 3 examples per category with file locations
- Priority recommendations (High → Medium → Low)
- Quick wins (simple fixes for maximum impact)
- Files with the most errors for focused debugging

### Build Fails

**Problem**: `npm run build` fails with various errors

**Solutions**:

```bash
# 1. Clear Next.js cache
rm -rf .next
rm -rf node_modules/.cache

# 2. Reinstall dependencies
rm -rf node_modules
rm package-lock.json
npm install

# 3. Check environment variables
# Make sure all required env vars are set
npm run verify:setup

# 4. Try fast build (skips some checks)
npm run build:fast

# 5. Check for memory issues
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### ESLint Errors

**Problem**: Linting fails or shows many errors

**Solutions**:

```bash
# 1. Run ESLint to see specific errors
npm run lint

# 2. Auto-fix fixable issues
npm run lint -- --fix

# 3. Check ESLint configuration
cat .eslintrc.json

# 4. Update ESLint and related packages
npm update eslint eslint-config-next

# 5. Ignore specific rules if needed (temporarily)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
```

## 🌐 Network & API Issues

### External API Failures

**Problem**: Tavily, NewsAPI, or other external APIs not working

**Solutions**:

```bash
# 1. Check API keys in .env.local
echo $TAVILY_API_KEY
echo $NEWS_API_KEY
echo $BRIDGE_API_KEY

# 2. Test API keys manually
curl -H "Authorization: Bearer $TAVILY_API_KEY" https://api.tavily.com/search

# 3. Check API rate limits and quotas
# Most APIs have daily/monthly limits

# 4. Use mock data for development
# Set USE_MOCK_DATA=true in .env.local

# 5. Check network connectivity
ping api.tavily.com
```

### AWS Bedrock Issues

**Problem**: AI content generation fails

**Solutions**:

```bash
# 1. Verify Bedrock model access
npm run verify:bedrock-models

# 2. Check AWS credentials for Bedrock
# Bedrock uses real AWS even in local development
aws sts get-caller-identity

# 3. Verify model availability in your region
aws bedrock list-foundation-models --region us-east-1

# 4. Check CloudWatch logs for Bedrock errors
aws logs describe-log-groups --log-group-name-prefix "/aws/bedrock"

# 5. Test with a simple Bedrock call
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --body '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":100}' \
  --cli-binary-format raw-in-base64-out \
  response.json
```

## 📱 Frontend Issues

### Page Not Loading

**Problem**: Blank page, loading forever, or JavaScript errors

**Solutions**:

```bash
# 1. Check browser console for errors
# Open DevTools → Console

# 2. Check network tab for failed requests
# DevTools → Network → Look for red (failed) requests

# 3. Clear browser cache and storage
# DevTools → Application → Storage → Clear All
# Or use incognito/private browsing

# 4. Check if dev server is running
curl http://localhost:3000

# 5. Restart dev server
# Ctrl+C to stop, then npm run dev
```

### Hydration Errors

**Problem**: "Hydration failed" or content mismatch errors

**Solutions**:

```bash
# 1. Check for server/client rendering differences
# Look for Date objects, random values, or browser-only APIs

# 2. Use useEffect for client-only code
useEffect(() => {
  // Client-only code here
}, []);

# 3. Use dynamic imports with ssr: false
const ClientOnlyComponent = dynamic(() => import('./ClientComponent'), {
  ssr: false
});

# 4. Check for missing suppressHydrationWarning
<div suppressHydrationWarning>
  {/* Content that differs between server and client */}
</div>
```

### Styling Issues

**Problem**: Styles not loading, Tailwind classes not working

**Solutions**:

```bash
# 1. Check if Tailwind is properly configured
cat tailwind.config.ts

# 2. Verify PostCSS configuration
cat postcss.config.mjs

# 3. Check if styles are being purged incorrectly
# Add classes to safelist in tailwind.config.ts

# 4. Clear Next.js cache
rm -rf .next

# 5. Check for CSS conflicts
# Use browser DevTools to inspect computed styles
```

## 🗄️ Database Issues

### DynamoDB Connection Failed

**Problem**: Can't connect to DynamoDB or operations fail

**Solutions**:

```bash
# 1. Verify DynamoDB table exists
aws --endpoint-url=http://localhost:4566 dynamodb list-tables

# 2. Check table schema
aws --endpoint-url=http://localhost:4566 dynamodb describe-table \
  --table-name BayonCoAgent-local

# 3. Re-create table if needed
npm run localstack:init

# 4. Check DynamoDB client configuration
# Verify endpoint URL and credentials in aws/dynamodb/client.ts

# 5. Test basic DynamoDB operations
aws --endpoint-url=http://localhost:4566 dynamodb scan \
  --table-name BayonCoAgent-local --max-items 5
```

### Data Not Persisting

**Problem**: Data disappears after restart or operations don't save

**Solutions**:

```bash
# 1. Check if LocalStack data is persisted
ls -la localstack-data/

# 2. Verify docker-compose.yml has volume mapping
# Should have: ./localstack-data:/tmp/localstack

# 3. Check for transaction errors
# Look for DynamoDB transaction failures in logs

# 4. Verify item structure matches table schema
# Check partition key (PK) and sort key (SK) format

# 5. Test with AWS CLI
aws --endpoint-url=http://localhost:4566 dynamodb put-item \
  --table-name BayonCoAgent-local \
  --item '{"PK":{"S":"TEST"},"SK":{"S":"test"},"data":{"S":"test"}}'
```

## 🚀 Deployment Issues

### SAM Deployment Fails

**Problem**: `sam deploy` fails with various errors

**Solutions**:

```bash
# 1. Validate SAM template
npm run sam:validate

# 2. Check AWS credentials
aws sts get-caller-identity

# 3. Verify S3 bucket for SAM artifacts exists
aws s3 ls s3://aws-sam-cli-managed-default-samclisourcebucket-*

# 4. Check CloudFormation events for specific errors
aws cloudformation describe-stack-events \
  --stack-name bayon-coagent-development

# 5. Try deploying with guided mode
sam deploy --guided
```

### Amplify Deployment Issues

**Problem**: Amplify build or deployment fails

**Solutions**:

```bash
# 1. Check Amplify build logs
# Go to AWS Console → Amplify → Your App → Build History

# 2. Verify environment variables in Amplify
# Console → Amplify → Environment Variables

# 3. Check build settings
# Make sure build commands match package.json scripts

# 4. Test build locally
npm run build

# 5. Check for memory issues in Amplify
# Increase build instance size if needed
```

## 🔧 Performance Issues

### Slow Loading Times

**Problem**: Application loads slowly or feels sluggish

**Solutions**:

```bash
# 1. Run performance analysis
npm run lighthouse

# 2. Check bundle size
npm run build:analyze

# 3. Check for large dependencies
npm run bundle:check

# 4. Enable performance profiling
# DevTools → Performance → Record

# 5. Check for memory leaks
# DevTools → Memory → Take heap snapshot
```

### High Memory Usage

**Problem**: Application uses too much memory or crashes

**Solutions**:

```bash
# 1. Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# 2. Check for memory leaks
# Use React DevTools Profiler

# 3. Optimize images and assets
# Use next/image for automatic optimization

# 4. Implement virtual scrolling for large lists
# Use react-window or similar

# 5. Check for circular references
# Use heap snapshots to identify leaks
```

## 🔍 Debugging Tips

### Enable Debug Logging

```bash
# Next.js debug mode
DEBUG=* npm run dev

# AWS SDK debug mode
AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1 \
DEBUG=aws-sdk:* npm run dev

# LocalStack debug mode
DEBUG=localstack npm run localstack:start
```

### Browser DevTools

1. **Console**: Check for JavaScript errors
2. **Network**: Monitor API requests and responses
3. **Application**: Inspect localStorage, cookies, service workers

### PWA and Service Worker Issues

**Service Worker Registration Disabled by Default**:
- Service worker registration and background sync are disabled by default to prevent 404 errors
- PWA manager initialization is also disabled to avoid service worker dependencies
- To enable: Set `NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true` in your environment variables
- Ensure `/sw.js` or `/sw-custom.js` file exists in the `public` directory
- Service workers require HTTPS in production (localhost works for development)

**PWA Install Prompt Not Showing**:
- PWA features are disabled by default - enable service worker first
- Verify service worker is enabled and registered successfully
- Check PWA manifest configuration in `public/manifest.json`
- Ensure site meets PWA installability criteria (HTTPS, manifest, service worker)
- Test in Chrome or Edge browsers (best PWA support)

**Background Sync Not Working**:
- Background sync is disabled by default along with service worker registration
- Enable service worker first, then background sync will be available
- Verify the service worker file includes background sync event handlers
- Check browser support for Background Sync API

**Service Worker Update Issues**:
- Only applies when service worker is enabled
- Updates are checked hourly automatically when enabled
- Clear browser cache if updates aren't applying
- Check browser DevTools → Application → Service Workers for status

**Push Notifications Not Working**:
- Push notifications require an active service worker
- Verify notification permissions are granted
- Check VAPID keys are properly configured
- Ensure service worker includes push event handlers
4. **Performance**: Profile rendering and JavaScript execution
5. **Memory**: Check for memory leaks

### VS Code Debugging

1. Install "JavaScript Debugger" extension
2. Set breakpoints in your code
3. Run "Debug: Start Debugging" (F5)
4. Use "Debug Console" for interactive debugging

## 🆘 Getting Help

### Before Asking for Help

1. **Check this guide** for your specific issue
2. **Search the documentation** in `docs/`
3. **Check browser console** for error messages
4. **Run verification scripts** to identify issues
5. **Try the suggested solutions** step by step

### When Asking for Help

Include this information:

1. **Error message** (full text)
2. **Steps to reproduce** the issue
3. **Environment details** (OS, Node version, etc.)
4. **What you've tried** already
5. **Relevant logs** (browser console, LocalStack logs, etc.)

### Useful Commands for Debugging

```bash
# System information
node --version
npm --version
docker --version

# Environment check
npm run verify:setup

# Service status
curl http://localhost:4566/_localstack/health
curl http://localhost:3000/api/health

# Logs
npm run localstack:logs
# Browser DevTools → Console
```

### Emergency Reset

If everything is broken and you need to start fresh:

```bash
# 1. Stop all services
npm run localstack:stop

# 2. Clear all caches and data
rm -rf .next
rm -rf node_modules
rm -rf localstack-data
rm package-lock.json

# 3. Reinstall everything
npm install

# 4. Restart services
npm run localstack:start
npm run localstack:init

# 5. Update .env.local with new Cognito IDs

# 6. Start dev server
npm run dev
```

This should resolve most issues by giving you a completely clean environment.
