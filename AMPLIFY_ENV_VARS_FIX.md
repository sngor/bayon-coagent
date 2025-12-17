# Fix Cognito Login Issue - Amplify Environment Variables

## Problem
The login is failing because Cognito is configured with `us-east-1` instead of `us-west-2`, and the `clientId` and `userPoolId` are empty.

## Root Cause
The `NEXT_PUBLIC_*` environment variables are not set in your Amplify deployment, so the browser can't access the Cognito configuration.

## Solution

### 1. Add Environment Variables in Amplify Console

Go to your Amplify app in the AWS Console:
1. Navigate to: https://console.aws.amazon.com/amplify/home?region=us-west-2
2. Select your Bayon CoAgent app
3. Go to "App settings" → "Environment variables"
4. Add these **NEXT_PUBLIC_** variables (these are accessible in the browser):

```
NEXT_PUBLIC_AWS_REGION=us-west-2
NEXT_PUBLIC_USER_POOL_ID=us-west-2_ALOcJxQDd
NEXT_PUBLIC_USER_POOL_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
NEXT_PUBLIC_APP_URL=https://bayoncoagent.app
```

### 2. Also Add Server-Side Variables

Add these for server-side functionality:

```
NODE_ENV=production
AWS_REGION=us-west-2
COGNITO_USER_POOL_ID=us-west-2_ALOcJxQDd
COGNITO_CLIENT_ID=1vnmp9v58opg04o480fokp0sct
DYNAMODB_TABLE_NAME=BayonCoAgent-v2-production
S3_BUCKET_NAME=bayon-coagent-storage-production-v2-409136660268
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-west-2
NEWS_API_KEY=0c0dadd0c8f8418cabbb24dc3baccd0a
```

### 3. Redeploy

After adding the environment variables:
1. Go to the "Hosting" tab in your Amplify app
2. Click "Redeploy this version" or trigger a new build
3. Wait for the deployment to complete

### 4. Verify the Fix

After redeployment:
1. Open your browser's developer console
2. Go to https://bayoncoagent.app
3. Check the console logs - you should now see:
   ```
   Cognito Config: {
     region: "us-west-2",
     endpoint: undefined,
     clientId: "1vnmp9v58opg04o480fokp0sct",
     userPoolId: "us-west-2_ALOcJxQDd"
   }
   ```

## Why This Happened

Next.js has two types of environment variables:
- **Server-side**: Available during build and server runtime (e.g., `AWS_REGION`)
- **Client-side**: Available in the browser (must start with `NEXT_PUBLIC_`)

Since Cognito authentication happens in the browser, it needs the `NEXT_PUBLIC_*` variables to access the configuration.

## Quick Test

You can test this immediately by:
1. Opening browser dev tools
2. Going to Console tab
3. Running: `console.log(process.env)`
4. You should see the `NEXT_PUBLIC_*` variables listed

If they're not there, the environment variables aren't set correctly in Amplify.