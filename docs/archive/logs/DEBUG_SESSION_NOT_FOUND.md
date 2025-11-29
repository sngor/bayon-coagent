# Debug: "Staging session not found" Error

## What to Check Now

With the new logging added, please try the flow again and check the console for these specific logs:

### Step 1: Create Session

When you click "Start Multi-Angle Staging", you should see:

```
[createStagingSession] Starting: { userId: "...", roomType: "...", style: "..." }
[createStagingSession] Generated sessionId: "uuid-here"
[createStagingSession] Creating session in DynamoDB: { PK: "USER#...", SK: "STAGING_SESSION#...", ... }
[createStagingSession] Session created successfully
[createStagingSession] Session verified in DynamoDB: { ... }
```

**If you see:** `WARNING: Session not found after creation!`

- This means DynamoDB write failed silently
- Check if LocalStack is running (if using local)
- Check AWS credentials
- Check DynamoDB table exists

### Step 2: Upload Image

When you upload an image, you should see:

```
[UI] handleUploadComplete called with imageId: "uuid-here"
[UI] Current sessionId: "uuid-here"
[UI] Current userId: "user-id-here"
[UI] Starting angle processing: { imageId: "...", sessionId: "...", userId: "...", angleDescription: "" }
```

**If you see:** `No session ID found`

- The sessionId state wasn't set properly
- Check if session creation succeeded
- Check React state management

### Step 3: Add Angle to Session

After upload completes, you should see:

```
[addAngleToSession] Starting: { userId: "...", sessionId: "...", imageId: "..." }
[addAngleToSession] Fetching session...
[addAngleToSession] Session found: { PK: "USER#...", SK: "STAGING_SESSION#...", ... }
```

**If you see:** `Session not found`

- The session exists in state but not in DynamoDB
- Possible causes:
  1. DynamoDB write failed
  2. Wrong table name
  3. Wrong AWS region
  4. LocalStack not running
  5. Permissions issue

## Quick Fixes to Try

### Fix 1: Check LocalStack (if using local development)

```bash
# Check if LocalStack is running
docker ps | grep localstack

# If not running, start it
npm run localstack:start

# Initialize resources
npm run localstack:init

# Verify DynamoDB table exists
aws dynamodb list-tables --endpoint-url http://localhost:4566
```

### Fix 2: Check Environment Variables

```bash
# Check your .env.local file
cat .env.local | grep -E "USE_LOCAL_AWS|AWS_REGION|DYNAMODB_TABLE_NAME"

# Should show:
# USE_LOCAL_AWS=true (for local dev)
# AWS_REGION=us-east-1
# DYNAMODB_TABLE_NAME=bayon-coagent-dev
```

### Fix 3: Test DynamoDB Directly

Create a test file `test-dynamodb.js`:

```javascript
import { getRepository } from "./src/aws/dynamodb/repository";

async function testDynamoDB() {
  const repository = getRepository();

  // Test write
  console.log("Testing DynamoDB write...");
  await repository.put({
    PK: "TEST#123",
    SK: "TEST#456",
    data: "test",
  });

  // Test read
  console.log("Testing DynamoDB read...");
  const result = await repository.get("TEST#123", "TEST#456");
  console.log("Result:", result);

  if (result) {
    console.log("✅ DynamoDB is working!");
  } else {
    console.log("❌ DynamoDB read failed");
  }
}

testDynamoDB();
```

Run it:

```bash
node test-dynamodb.js
```

### Fix 4: Check AWS Configuration

```javascript
// Add this to your page temporarily to debug
console.log("AWS Config:", {
  region: process.env.AWS_REGION,
  useLocal: process.env.USE_LOCAL_AWS,
  tableName: process.env.DYNAMODB_TABLE_NAME,
  endpoint:
    process.env.USE_LOCAL_AWS === "true" ? "http://localhost:4566" : "AWS",
});
```

## Expected Console Output (Success Case)

```
[createStagingSession] Starting: { userId: "abc123", roomType: "living-room", style: "modern" }
[createStagingSession] Generated sessionId: "def456"
[createStagingSession] Creating session in DynamoDB: { PK: "USER#abc123", SK: "STAGING_SESSION#def456", ... }
[createStagingSession] Session created successfully
[createStagingSession] Session verified in DynamoDB: { sessionId: "def456", roomType: "living-room", ... }

[UI] handleUploadComplete called with imageId: "ghi789"
[UI] Current sessionId: "def456"
[UI] Current userId: "abc123"
[UI] Starting angle processing: { imageId: "ghi789", sessionId: "def456", userId: "abc123" }

[addAngleToSession] Starting: { userId: "abc123", sessionId: "def456", imageId: "ghi789" }
[addAngleToSession] Fetching session...
[addAngleToSession] Session found: { sessionId: "def456", angles: [], ... }
[addAngleToSession] Angle order: 0
[addAngleToSession] Fetching image metadata...
[addAngleToSession] Image metadata found: { imageId: "ghi789", originalKey: "...", ... }
[addAngleToSession] Original URL generated
[addAngleToSession] First angle - using basic params
[addAngleToSession] Starting staging with params: { roomType: "living-room", style: "modern" }
... (staging continues)
```

## What to Report Back

Please copy and paste:

1. **All console logs** from when you click "Start Multi-Angle Staging" to when you see the error

2. **Environment info:**

   - Are you using LocalStack or real AWS?
   - What's in your `.env.local` file (without sensitive values)?

3. **Specific questions:**
   - Do you see `[createStagingSession] Session verified in DynamoDB`?
   - Do you see `[UI] Current sessionId: "..."`?
   - At what point does it say "Session not found"?

## Possible Root Causes

### Cause 1: DynamoDB Not Available

- LocalStack not running
- Wrong endpoint configuration
- Network issue

### Cause 2: Table Doesn't Exist

- Table not created
- Wrong table name in config
- Wrong AWS region

### Cause 3: Permissions Issue

- IAM permissions missing (if using real AWS)
- LocalStack not configured properly

### Cause 4: Timing Issue

- Session write is async and not completing
- Need to add retry logic

### Cause 5: State Management Issue

- sessionId not being set in React state
- Component re-rendering and losing state

---

**Next Step:** Run the flow again with the new logging and share the console output!
