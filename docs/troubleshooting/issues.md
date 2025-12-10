# Troubleshooting Guide

This guide consolidates common issues and their solutions for the Bayon CoAgent platform.

## Agent-Related Issues

### Agent ID Format Issues

**Problem**: Agent ID doesn't match AWS Bedrock Agent Runtime requirements

**Symptoms**:

- Agent ID contains underscores or hyphens
- Agent ID is longer than 10 characters
- Error: "Invalid agent ID format"

**Solution**:
AWS Bedrock Agent Runtime requires:

- Agent ID must be alphanumeric only (no underscores or hyphens)
- Agent ID must be 10 characters or less
- Pattern: `[0-9a-zA-Z]+`

**Steps to fix**:

1. Go to AWS Bedrock console: https://console.aws.amazon.com/bedrock/
2. Navigate to **Agents** (not AgentCore)
3. Look for your agent - ID should be 10 characters, alphanumeric only
4. If using AgentCore Runtime (different service), consider migrating to Bedrock Agents

**Example of correct format**: `ABC123DEF4`

### Agent Memory Status

**Current Implementation**:

- ✅ **Chatbot/Assistant HAS Memory** - Stored in localStorage per user
- ❌ **Content Generation DON'T Have Memory** - By design (one-shot tasks)

**Chatbot Memory Features**:

- Conversation history persisted
- Multiple chat sessions
- Session management (new, edit, delete)
- Message history per session
- User-specific storage

**Storage**: Browser localStorage (client-side)

**Memory Architecture**:

```
User sends message
    ↓
Load conversation history from localStorage
    ↓
Send message + history to Bedrock
    ↓
Get response
    ↓
Append to history
    ↓
Save to localStorage
```

### Agent Not Responding Correctly

**Problem**: Agent responds with generic Claude messages instead of custom logic

**Cause**: Deployed agent doesn't have your Python code

**Solution - Update via AWS Console**:

1. Go to: https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2
2. Navigate to **Agents** in left sidebar
3. Find your agent (search for agent ID or "research")
4. Click agent name → **Edit** or **Update code**
5. Upload your code: `agents/research-agent/research-agent.zip`
6. Set **Entrypoint**: `main.py`
7. Click **Save** and wait for "Active" status

**Test the fix**:

```bash
npx tsx test-agentcore-integration.ts
```

**Expected output**:

```json
{
  "answer": "Based on research and analysis...",
  "summary": "Brief summary...",
  "keyPoints": ["point1", "point2"],
  "sources": [],
  "knowledgeBaseUsed": false,
  "documentsRetrieved": 0,
  "confidence": 0.7,
  "executionTime": 2500
}
```

## Routing Issues

### Onboarding 404 Errors

**Problem**: Onboarding routes return 404 errors despite correct file structure

**Symptoms**:

- `/onboarding/welcome` returns 404
- `/onboarding/user/profile` returns 404
- Routes exist in `src/app/(onboarding)/` but don't work

**Root Cause**: Next.js route group `(onboarding)` compatibility issue

**Solution**: Move routes outside of route group structure

**Fixed Structure**:

- `src/app/onboarding/welcome/page.tsx` ✅
- `src/app/onboarding/user/profile/page.tsx` ✅
- `src/app/onboarding/layout.tsx` ✅

**Additional Fix - Server Actions**:
If you encounter DynamoDB browser errors:

1. Use Server Actions instead of direct service calls
2. Add onboarding actions in `src/app/actions.ts`
3. Call from client components via Server Actions

**Architecture**:

- **Before**: Client Component → Service → DynamoDB ❌
- **After**: Client Component → Server Action → DynamoDB ✅

## Build and Development Issues

### TypeScript Import Errors

**Problem**: Missing exports or import errors

**Common Issues**:

- `getOnboardingStateKeys` not found
- DynamoDB key functions missing
- Logging module export errors

**Solutions**:

1. **Clear build cache**:

   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check export structure**:

   ```typescript
   // src/aws/dynamodb/keys.ts
   export const getOnboardingStateKeys = (userId: string) => {
     // implementation
   };
   ```

3. **Verify import paths**:
   ```typescript
   import { getOnboardingStateKeys } from "@/aws/dynamodb/keys";
   ```

### Middleware Issues

**Problem**: Edge Runtime compatibility errors

**Symptoms**:

- Build fails with middleware errors
- Components not compatible with Edge Runtime

**Solution**: Temporarily disable problematic middleware components

**In `src/middleware.ts`**:

```typescript
// Temporarily disable Edge Runtime incompatible components
// TODO: Re-enable after fixing compatibility
```

### LocalStack Connection Issues

**Problem**: Can't connect to LocalStack services

**Symptoms**:

- "Connection refused" errors
- DynamoDB table not found
- S3 bucket access denied

**Solutions**:

1. **Verify LocalStack is running**:

   ```bash
   curl http://localhost:4566/_localstack/health
   ```

2. **Check environment variables**:

   ```bash
   echo $USE_LOCAL_AWS  # Should be "true"
   ```

3. **Restart LocalStack**:

   ```bash
   npm run localstack:stop
   npm run localstack:start
   npm run localstack:init
   ```

4. **Check Docker**:
   ```bash
   docker ps  # Should show LocalStack container
   ```

## Authentication Issues

### Cognito Configuration

**Problem**: Authentication not working in local development

**Symptoms**:

- Login fails
- "User pool not found" errors
- JWT token validation fails

**Solutions**:

1. **Verify Cognito configuration**:

   ```bash
   # Check .env.local has correct values from localstack:init
   COGNITO_USER_POOL_ID=<from-localstack-init>
   COGNITO_CLIENT_ID=<from-localstack-init>
   ```

2. **Re-initialize LocalStack**:

   ```bash
   npm run localstack:init
   # Copy new User Pool ID and Client ID to .env.local
   ```

3. **Create test user manually**:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id <pool-id> \
     --username testuser \
     --temporary-password TempPass123! \
     --endpoint-url http://localhost:4566
   ```

## Performance Issues

### Slow Build Times

**Problem**: Development server takes too long to start

**Solutions**:

1. **Use Turbopack** (if not already enabled):

   ```bash
   npm run dev  # Should use Turbopack by default
   ```

2. **Clear caches**:

   ```bash
   rm -rf .next node_modules/.cache
   npm install
   ```

3. **Check for large files**:
   ```bash
   find . -name "*.js" -size +1M
   find . -name "*.ts" -size +1M
   ```

### Memory Issues

**Problem**: Development server runs out of memory

**Solutions**:

1. **Increase Node.js memory**:

   ```bash
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run dev
   ```

2. **Check for memory leaks**:
   - Look for infinite loops in useEffect
   - Check for uncleaned event listeners
   - Monitor browser dev tools memory tab

## Database Issues

### DynamoDB Table Not Found

**Problem**: "Table not found" errors in local development

**Solutions**:

1. **Re-initialize LocalStack resources**:

   ```bash
   npm run localstack:init
   ```

2. **Verify table exists**:

   ```bash
   aws dynamodb list-tables --endpoint-url http://localhost:4566
   ```

3. **Check table name in environment**:
   ```bash
   echo $DYNAMODB_TABLE_NAME  # Should match initialized table
   ```

### Data Not Persisting

**Problem**: Data disappears between sessions

**Cause**: LocalStack data not persisted

**Solution**: Check LocalStack volume mounting:

```bash
# In docker-compose.yml, ensure:
volumes:
  - "./localstack-data:/tmp/localstack"
```

## API Issues

### External API Failures

**Problem**: Tavily, NewsAPI, or other external APIs not working

**Solutions**:

1. **Check API keys**:

   ```bash
   echo $TAVILY_API_KEY
   echo $NEWS_API_KEY
   ```

2. **Test API directly**:

   ```bash
   curl -H "Authorization: Bearer $TAVILY_API_KEY" \
     "https://api.tavily.com/search"
   ```

3. **Check rate limits**: Many APIs have rate limits for free tiers

4. **Verify network access**: Some corporate networks block external APIs

## Quick Diagnostic Commands

### System Health Check

```bash
# Check all services
npm run verify:setup

# Check LocalStack
curl http://localhost:4566/_localstack/health

# Check environment
env | grep -E "(AWS|COGNITO|DYNAMODB|S3)"

# Check build
npm run typecheck
npm run lint
```

### Common Fixes

```bash
# Nuclear option - reset everything
npm run localstack:stop
rm -rf .next node_modules/.cache localstack-data
npm install
npm run localstack:start
npm run localstack:init
# Update .env.local with new Cognito values
npm run dev
```

## Getting Help

If you're still stuck after trying these solutions:

1. **Check the logs**:

   - Browser console for client-side errors
   - Terminal for server-side errors
   - LocalStack logs: `npm run localstack:logs`

2. **Search existing documentation**:

   - Check `docs/` folder for specific guides
   - Review `README.md` for setup instructions

3. **Create a minimal reproduction**:

   - Isolate the issue to smallest possible case
   - Note exact error messages and steps to reproduce

4. **Check git history**:
   - See if issue appeared after recent changes
   - Consider reverting to last known working state

## Prevention

### Best Practices

- Always run `npm run verify:setup` after environment changes
- Keep `.env.local` backed up (without committing to git)
- Test locally before deploying
- Use TypeScript strict mode to catch errors early
- Run linting and type checking before commits

### Monitoring

- Check CloudWatch logs for production issues
- Monitor LocalStack logs during development
- Use browser dev tools for client-side debugging
- Enable verbose logging when troubleshooting
