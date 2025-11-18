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
# Authentication Improvements

## Changes Made

### 1. Email Verification Flow

Added complete email verification support for Cognito sign-up:

- **New Methods in `cognito-client.ts`**:

  - `confirmSignUp(email, code)` - Verify email with confirmation code
  - `resendConfirmationCode(email)` - Resend verification code

- **Updated Auth Provider**:
  - `signUp()` now returns `{ userConfirmed: boolean }`
  - Added `confirmSignUp()` method
  - Added `resendConfirmationCode()` method
  - Removed automatic sign-in after registration (requires verification first)

### 2. Improved Error Messages

Enhanced error handling with user-friendly messages:

- **UserNotFoundException**: "No account found with this email. Please sign up first."
- **NotAuthorizedException**: "Incorrect email or password. Please try again."
- **UserNotConfirmedException**: "Please verify your email with the confirmation code sent to your inbox before signing in."
- **InvalidPasswordException**: "Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols."
- **CodeMismatchException**: "Invalid verification code. Please check and try again."
- **ExpiredCodeException**: "Verification code has expired. Please request a new one."

### 3. Updated Login Page

Added verification UI to the sign-up flow:

- Shows verification form after successful registration
- Displays user's email for confirmation
- 6-digit code input with proper formatting
- "Resend Code" button for expired codes
- Success/error alerts with clear messaging
- Auto-redirects to sign-in after successful verification

### 4. Next.js Configuration

Fixed environment variable exposure:

- Added `env` config to `next.config.ts`
- Exposed AWS credentials to browser for client-side SDK usage
- Variables now available: `AWS_REGION`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, etc.

## User Flow

### Sign Up

1. User enters email and password
2. Account is created in Cognito
3. Verification code sent to email
4. User enters 6-digit code
5. Email verified
6. Redirected to sign-in

### Sign In

1. User enters email and password
2. If email not verified → Clear error message with instructions
3. If credentials wrong → Clear error message
4. If successful → Redirected to dashboard

## Testing

To test the complete flow:

1. **Start dev server**: `npm run dev`
2. **Sign up** with a real email address
3. **Check email** for verification code (from AWS Cognito)
4. **Enter code** in verification form
5. **Sign in** with your credentials
6. **Access dashboard**

## AWS Cognito Configuration

Current settings:

- **User Pool**: `us-east-1_OemQiHAGl`
- **Client ID**: `gc1a91hf5dujkjt6k87alb7jn`
- **Auto-verified attributes**: Email
- **MFA**: Disabled
- **Password policy**: Min 8 chars, uppercase, lowercase, numbers, symbols

## Notes

- Verification codes expire after a certain time (configurable in Cognito)
- Users can request new codes if expired
- Unverified users cannot sign in
- All error messages are user-friendly and actionable
