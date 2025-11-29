# Next Steps to Debug "Session Not Found" Error

## Quick Summary

The error "Staging session not found" means the session is being created in the UI but can't be found in DynamoDB when we try to add an angle. This is likely a DynamoDB connectivity or configuration issue.

## Step 1: Test DynamoDB Connection

Run this command to verify DynamoDB is working:

```bash
npx tsx test-dynamodb-connection.ts
```

**Expected output:**

```
🔍 Testing DynamoDB Connection...

Test 1: Writing test item...
✅ Write successful

Test 2: Reading test item...
✅ Read successful
   Data: { ... }

Test 3: Testing session creation pattern...
✅ Session write successful

Test 4: Reading session back...
✅ Session read successful
   Session ID: test-session-...
   Room Type: living-room
   Style: modern

Test 5: Cleaning up test data...
✅ Cleanup successful

🎉 All tests passed! DynamoDB is working correctly.
```

**If it fails:**

- Follow the tips shown in the error message
- Check if LocalStack is running: `docker ps | grep localstack`
- Check your `.env.local` file

## Step 2: Try the Multi-Angle Flow Again

1. **Open browser console** (F12)
2. **Navigate to** Studio → Reimagine → Multi-Angle
3. **Click** "Start Multi-Angle Staging"
4. **Watch console** for these logs:

```
[createStagingSession] Starting: ...
[createStagingSession] Generated sessionId: ...
[createStagingSession] Creating session in DynamoDB: ...
[createStagingSession] Session created successfully
[createStagingSession] Session verified in DynamoDB: ...
```

5. **Upload an image**
6. **Watch console** for:

```
[UI] handleUploadComplete called with imageId: ...
[UI] Current sessionId: ...
[UI] Current userId: ...
[UI] Starting angle processing: ...
[addAngleToSession] Starting: ...
[addAngleToSession] Fetching session...
[addAngleToSession] Session found: ...
```

## Step 3: Report Back

Copy and paste from your console:

### A. Session Creation Logs

```
[createStagingSession] ...
```

### B. Upload Logs

```
[UI] handleUploadComplete ...
```

### C. Add Angle Logs

```
[addAngleToSession] ...
```

### D. Any Errors

```
Error: ...
```

## Common Issues & Quick Fixes

### Issue 1: LocalStack Not Running

**Symptoms:**

- `ECONNREFUSED` error
- Connection timeout

**Fix:**

```bash
npm run localstack:start
npm run localstack:init
```

### Issue 2: Wrong Table Name

**Symptoms:**

- `ResourceNotFoundException`
- Table not found

**Fix:**
Check `.env.local`:

```bash
DYNAMODB_TABLE_NAME=bayon-coagent-dev
```

### Issue 3: Wrong AWS Region

**Symptoms:**

- Session created but not found
- No error but data missing

**Fix:**
Check `.env.local`:

```bash
AWS_REGION=us-east-1
```

### Issue 4: Using Real AWS Instead of LocalStack

**Symptoms:**

- Credentials error
- Permission denied

**Fix:**
Check `.env.local`:

```bash
USE_LOCAL_AWS=true
```

## Environment Checklist

- [ ] LocalStack is running (`docker ps`)
- [ ] DynamoDB table exists (`npm run localstack:init`)
- [ ] `.env.local` has correct settings
- [ ] `USE_LOCAL_AWS=true` (for local dev)
- [ ] `AWS_REGION=us-east-1`
- [ ] `DYNAMODB_TABLE_NAME=bayon-coagent-dev`
- [ ] Dev server restarted after env changes

## Files to Check

### 1. `.env.local`

Should contain:

```bash
USE_LOCAL_AWS=true
AWS_REGION=us-east-1
DYNAMODB_TABLE_NAME=bayon-coagent-dev
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### 2. `src/aws/dynamodb/client.ts`

Check if it's using the right endpoint:

- LocalStack: `http://localhost:4566`
- Real AWS: Default endpoint

## What We Added for Debugging

1. ✅ Comprehensive console logging in all actions
2. ✅ Session verification after creation
3. ✅ UI state logging
4. ✅ Better error messages
5. ✅ DynamoDB connection test script

## Expected Timeline

Once DynamoDB is working:

- Session creation: < 1 second
- Image upload: 2-5 seconds
- First angle staging: 30-45 seconds
- Gallery update: < 1 second

## If Still Not Working

Try this manual test in browser console:

```javascript
// 1. Import the action (if possible)
// 2. Or use the Network tab to see the actual request/response

// Check if session exists in state
console.log("Session ID from state:", sessionId);

// Check if userId is correct
console.log("User ID:", userId);

// Try creating a session manually
// (This would require calling the server action directly)
```

## Contact Points

If you've tried everything:

1. Share the output of `npx tsx test-dynamodb-connection.ts`
2. Share all console logs from the browser
3. Share your `.env.local` (without sensitive values)
4. Share any error messages from terminal

---

**Priority:** Test DynamoDB connection first!

Run: `npx tsx test-dynamodb-connection.ts`
