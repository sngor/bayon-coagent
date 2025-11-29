#!/bin/bash

# Direct deployment bypassing SAM CLI validation

set -e

REGION="us-west-2"
STACK_NAME="bayon-coagent-dev"
TEMPLATE_FILE=".aws-sam/build/template.yaml"

echo "========================================="
echo "Direct CloudFormation Deployment"
echo "========================================="
echo ""

# Package the template
echo "1. Packaging template..."
aws cloudformation package \
  --template-file $TEMPLATE_FILE \
  --s3-bucket aws-sam-cli-managed-default-samclisourcebucket-rvfkceia1gsu \
  --output-template-file .aws-sam/packaged-template.yaml \
  --region $REGION

echo ""
echo "2. Creating stack with disable-rollback..."
aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file://.aws-sam/packaged-template.yaml \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameters ParameterKey=Environment,ParameterValue=development \
  --disable-rollback \
  --region $REGION

echo ""
echo "3. Waiting for stack creation..."
aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $REGION

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
