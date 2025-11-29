# Manual AWS Console Deployment Guide

Due to an AWS account-level validation hook (`AWS::EarlyValidation::ResourceExistenceCheck`), 
the SAM CLI deployment is failing. Here's how to deploy manually via the AWS Console:

## Step 1: Upload Template to S3

1. Go to AWS S3 Console
2. Navigate to bucket: `aws-sam-cli-managed-default-samclisourcebucket-rvfkceia1gsu`
3. Upload the file: `.aws-sam/build/template.yaml`
4. Note the S3 URL (should look like: `s3://bucket-name/template.yaml`)

## Step 2: Deploy via CloudFormation Console

1. Go to AWS CloudFormation Console (us-west-2 region)
2. Click "Create stack" → "With new resources"
3. Choose "Template is ready"
4. Choose "Amazon S3 URL" and paste the URL from Step 1
5. Click "Next"

### Stack Details:
- **Stack name**: `bayon-coagent-dev`
- **Parameters**:
  - Environment: `development`
  - AlarmEmail: (leave empty or add your email)
- Click "Next"

### Configure Stack Options:
- Leave defaults
- Click "Next"

### Review:
- Check the box: "I acknowledge that AWS CloudFormation might create IAM resources with custom names"
- Check the box: "I acknowledge that AWS CloudFormation might require CAPABILITY_AUTO_EXPAND"
- Click "Submit"

## Step 3: Wait for Deployment

The stack will take 10-15 minutes to create all resources.
Watch the "Events" tab for progress.

## Step 4: Get Outputs

Once complete, go to the "Outputs" tab and copy all values.
Run: `./scripts/update-env-from-sam.sh development` to populate your `.env` file.

## Alternative: Disable the Validation Hook

Contact AWS Support and ask them to disable the `AWS::EarlyValidation::ResourceExistenceCheck` 
hook for your account, or check if you have any Cloud Formation Hooks configured in:

AWS Console → CloudFormation → Hooks (left sidebar)

If you see any hooks listed, you can deactivate them.
