# Fresh Amplify Deployment - Quick Fix

## Step 1: Create New Amplify App

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify/home?region=us-west-2

2. **Create New App**:
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select branch: `main`
   - App name: `bayon-coagent-v2` (or similar)

3. **Build Settings**: 
   - Amplify will auto-detect the `amplify.yml` file
   - Review and accept the build configuration

4. **Environment Variables** (Add these immediately):
   ```
   NODE_ENV=production
   NEXT_PUBLIC_AWS_REGION=us-west-2
   NEXT_PUBLIC_USER_POOL_ID=us-west-2_ALOcJxQDd
   NEXT_PUBLIC_USER_POOL_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
   NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
   AWS_REGION=us-west-2
   COGNITO_USER_POOL_ID=us-west-2_ALOcJxQDd
   COGNITO_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
   DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
   S3_BUCKET_NAME=bayon-coagent-storage-production-v2-409136660268
   BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
   BEDROCK_REGION=us-west-2
   NEWS_API_KEY=0c0dadd0c8f8418cabbb24dc3baccd0a
   ```

5. **Deploy**: Click "Save and deploy"

## Step 2: Update Domain

1. **After successful deployment**:
   - Go to "Domain management" in the new app
   - Add custom domain: `bayoncoagent.app`
   - Update DNS to point to the new Amplify app

2. **Remove old app**:
   - Once the new app is working, delete the old Amplify app

## Step 3: Test

After deployment:
1. Visit the new Amplify URL (will be something like `https://main.d1234567890.amplifyapp.com`)
2. Check console logs - should show `us-west-2` and correct values
3. Test login functionality
4. If working, update your domain to point to the new app

## Why This Will Work

- **Fresh build environment**: No cached configurations
- **Clean environment variables**: Set from scratch
- **No legacy issues**: Completely new deployment pipeline
- **Faster**: 10 minutes vs hours of debugging

This is the most efficient solution at this point.