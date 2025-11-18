# Authentication Setup Guide

## Problem

The signup/signin functionality is not working because the app is configured to use LocalStack (local AWS emulation) but LocalStack is not running.

## Solution Options

### Option 1: Use Real AWS Cognito (Recommended)

1. **Create a Cognito User Pool** (if you don't have one):

   - Go to AWS Console → Cognito
   - Click "Create user pool"
   - Choose "Email" as sign-in option
   - Configure password requirements
   - Create an app client (without client secret)
   - Note down the User Pool ID and Client ID

2. **Update `.env.local`**:

   ```bash
   USE_LOCAL_AWS=false
   COGNITO_USER_POOL_ID=your-actual-user-pool-id
   COGNITO_CLIENT_ID=your-actual-client-id
   AWS_REGION=us-east-1  # or your region
   ```

3. **Configure AWS Credentials**:

   - Either use AWS CLI: `aws configure`
   - Or add to `.env.local`:
     ```bash
     AWS_ACCESS_KEY_ID=your-access-key
     AWS_SECRET_ACCESS_KEY=your-secret-key
     ```

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Set Up LocalStack (For Local Development)

1. **Install LocalStack**:

   ```bash
   pip install localstack
   # or
   brew install localstack/tap/localstack-cli
   ```

2. **Start LocalStack**:

   ```bash
   localstack start
   ```

3. **Create Local Cognito Resources**:

   ```bash
   # Create user pool
   aws --endpoint-url=http://localhost:4566 cognito-idp create-user-pool \
     --pool-name local-pool \
     --region us-east-1

   # Create user pool client
   aws --endpoint-url=http://localhost:4566 cognito-idp create-user-pool-client \
     --user-pool-id <pool-id-from-above> \
     --client-name local-client \
     --region us-east-1
   ```

4. **Update `.env.local` with the IDs from above**

5. **Restart your dev server**

## Debugging

I've added console logging to help debug authentication issues. Check your browser console for:

- Cognito configuration details
- Sign in/up attempt logs
- Detailed error messages

## Current Changes Made

1. ✅ Updated `.env.local` to disable LocalStack by default
2. ✅ Added console logging to `cognito-client.ts` for debugging
3. ✅ Added error logging to login page for better visibility
4. ✅ Created this guide

## Next Steps

1. Choose Option 1 or Option 2 above
2. Update your environment variables
3. Restart your development server
4. Try signing up again
5. Check browser console for any errors

## Common Errors

- **"Network error"** or **"ECONNREFUSED"**: LocalStack is not running or wrong endpoint
- **"User pool does not exist"**: Wrong User Pool ID in environment variables
- **"Invalid client id"**: Wrong Client ID in environment variables
- **"Access denied"**: AWS credentials are missing or invalid
