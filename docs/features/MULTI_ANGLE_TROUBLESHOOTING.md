# Multi-Angle Staging - Troubleshooting Guide

## Issue: Image uploads but nothing happens

### What to Check

#### 1. Browser Console Logs

Open your browser's Developer Tools (F12) and check the Console tab. You should see logs like:

```
Starting angle processing: { imageId: "...", sessionId: "...", angleDescription: "" }
[addAngleToSession] Starting: { userId: "...", sessionId: "...", imageId: "..." }
[addAngleToSession] Fetching session...
[addAngleToSession] Session found: { ... }
[addAngleToSession] Fetching image metadata...
[addAngleToSession] Image metadata found: { ... }
[addAngleToSession] Starting staging with params: { ... }
```

**If you see an error**, note what it says and where it occurs.

#### 2. Network Tab

Check the Network tab in Developer Tools:

1. Look for the `/api/reimagine/upload` request
   - Should return `{ success: true, imageId: "..." }`
2. Look for server action calls (they might show as `POST` requests)
   - Check the response for errors

#### 3. Common Issues

##### Issue A: Session Not Found

**Symptoms:** Console shows "Session not found"

**Solution:**

- The session might not have been created properly
- Check if `createStagingSessionAction` succeeded
- Verify the sessionId is being passed correctly

##### Issue B: Image Metadata Not Found

**Symptoms:** Console shows "Image metadata not found"

**Solution:**

- The image upload might have failed
- Check if the upload returned a valid `imageId`
- Verify the image was saved to DynamoDB

##### Issue C: Staging Fails

**Symptoms:** Console shows "Failed to stage image"

**Solution:**

- Check if Google AI API key is configured
- Verify `processEditAction` is working
- Check rate limits
- Look for AI service errors

##### Issue D: Nothing Happens (No Logs)

**Symptoms:** No console logs appear after upload

**Solution:**

- The `handleUploadComplete` callback might not be firing
- Check if `simpleMode={true}` is set on ImageUploader
- Verify the ImageUploader is calling `onUploadComplete(imageId)`

#### 4. Step-by-Step Debug

Run these checks in order:

**Step 1: Verify Session Creation**

```javascript
// In browser console, check if session exists
console.log("Session ID:", sessionId); // Should show a UUID
```

**Step 2: Verify Upload Completes**

```javascript
// After upload, check the response
// Look in Network tab for /api/reimagine/upload
// Response should be: { success: true, imageId: "uuid", suggestions: [...] }
```

**Step 3: Verify Callback Fires**

```javascript
// You should see this log after upload:
// "Starting angle processing: { imageId: "...", sessionId: "..." }"
```

**Step 4: Check Server Action**

```javascript
// You should see these logs:
// "[addAngleToSession] Starting: ..."
// "[addAngleToSession] Fetching session..."
// etc.
```

#### 5. Manual Test

Try calling the action manually in the console:

```javascript
// Get the user ID from the page
const userId = "your-user-id"; // Replace with actual

// Create a session
const sessionResult = await createStagingSessionAction(
  userId,
  "living-room",
  "modern"
);
console.log("Session:", sessionResult);

// Upload an image (use the UI)
// Then get the imageId from the upload response

// Manually call addAngleToSessionAction
const result = await addAngleToSessionAction(
  userId,
  sessionResult.sessionId,
  "image-id-from-upload",
  "test angle"
);
console.log("Result:", result);
```

### Expected Flow

1. **User uploads image**
   - ImageUploader shows progress bar
   - Upload completes → `onUploadComplete(imageId)` fires
2. **handleUploadComplete runs**
   - Sets `isAddingAngle = true`
   - ImageUploader hides, loading spinner shows
   - Calls `addAngleToSessionAction`
3. **addAngleToSessionAction runs**
   - Fetches session from DynamoDB
   - Gets image metadata
   - Calls `processEditAction` to stage the image
   - Extracts furniture context (first angle only)
   - Updates session with new angle
   - Returns success
4. **UI updates**
   - Fetches updated session
   - Updates angles array
   - Hides uploader
   - Shows gallery with new angle

### Quick Fixes

#### Fix 1: Clear State and Retry

```javascript
// In browser console
location.reload(); // Refresh the page
// Then try again
```

#### Fix 2: Check Environment Variables

```bash
# Verify these are set:
GOOGLE_AI_API_KEY=...
AWS_REGION=...
DYNAMODB_TABLE_NAME=...
```

#### Fix 3: Check DynamoDB

```bash
# Verify the session was created
aws dynamodb get-item \
  --table-name YourTableName \
  --key '{"PK":{"S":"USER#userId"},"SK":{"S":"STAGING_SESSION#sessionId"}}'
```

#### Fix 4: Check S3

```bash
# Verify the image was uploaded
aws s3 ls s3://your-bucket/users/userId/reimagine/uploads/
```

### Error Messages

#### "Missing required parameters"

- Check that userId, sessionId, and imageId are all provided
- Verify none are undefined or null

#### "Staging session not found"

- The session might have been deleted
- Create a new session and try again

#### "Image not found"

- The image upload might have failed
- Check the upload response
- Verify the imageId is correct

#### "Failed to stage image"

- Check Google AI API key
- Check rate limits
- Look for AI service errors in logs

### Still Not Working?

1. **Check Server Logs**

   - Look at CloudWatch logs (if deployed)
   - Check terminal output (if local)

2. **Verify Dependencies**

   ```bash
   npm install
   ```

3. **Restart Dev Server**

   ```bash
   npm run dev
   ```

4. **Check LocalStack** (if using local AWS)

   ```bash
   npm run localstack:start
   npm run localstack:init
   ```

5. **Test Single Edit First**
   - Go to "Single Edit" tab
   - Try a regular virtual staging
   - If that works, the issue is specific to multi-angle

### Debug Checklist

- [ ] Browser console shows no errors
- [ ] Network tab shows successful upload
- [ ] Session was created successfully
- [ ] Image upload returned valid imageId
- [ ] handleUploadComplete is being called
- [ ] addAngleToSessionAction is being called
- [ ] Loading spinner appears after upload
- [ ] No errors in server logs
- [ ] Google AI API key is configured
- [ ] DynamoDB table exists and is accessible
- [ ] S3 bucket exists and is accessible

### Contact Support

If you've tried everything and it still doesn't work:

1. Copy all console logs
2. Copy the Network tab responses
3. Note what step fails
4. Provide:
   - Browser and version
   - Environment (local/staging/production)
   - Steps to reproduce
   - Error messages

---

**Last Updated:** 2024-11-24
