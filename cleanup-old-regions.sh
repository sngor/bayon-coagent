#!/bin/bash

# Cleanup old AWS resources from other regions
# This script helps identify and remove resources outside us-west-2

set -e

echo "🧹 Cleaning up old AWS resources outside us-west-2..."

# List of common AWS regions to check
REGIONS=("us-east-1" "us-east-2" "us-west-1" "eu-west-1" "eu-central-1" "ap-southeast-1")

echo "🔍 Scanning for Bayon CoAgent resources in other regions..."

for region in "${REGIONS[@]}"; do
    echo ""
    echo "📍 Checking region: $region"
    
    # Check for CloudFormation stacks
    echo "  🔍 CloudFormation stacks..."
    stacks=$(aws cloudformation list-stacks --region "$region" --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query "StackSummaries[?contains(StackName, 'bayon')].StackName" --output text 2>/dev/null || echo "")
    
    if [ ! -z "$stacks" ]; then
        echo "  ⚠️  Found CloudFormation stacks: $stacks"
        echo "     To delete: aws cloudformation delete-stack --stack-name <stack-name> --region $region"
    else
        echo "  ✅ No CloudFormation stacks found"
    fi
    
    # Check for Cognito User Pools
    echo "  🔍 Cognito User Pools..."
    pools=$(aws cognito-idp list-user-pools --max-results 60 --region "$region" --query "UserPools[?contains(Name, 'bayon')].Name" --output text 2>/dev/null || echo "")
    
    if [ ! -z "$pools" ]; then
        echo "  ⚠️  Found Cognito User Pools: $pools"
        echo "     Review and delete manually if no longer needed"
    else
        echo "  ✅ No Cognito User Pools found"
    fi
    
    # Check for DynamoDB tables
    echo "  🔍 DynamoDB tables..."
    tables=$(aws dynamodb list-tables --region "$region" --query "TableNames[?contains(@, 'Bayon') || contains(@, 'bayon')]" --output text 2>/dev/null || echo "")
    
    if [ ! -z "$tables" ]; then
        echo "  ⚠️  Found DynamoDB tables: $tables"
        echo "     Review and delete manually if no longer needed"
    else
        echo "  ✅ No DynamoDB tables found"
    fi
    
    # Check for S3 buckets (S3 is global but has regional endpoints)
    if [ "$region" = "us-east-1" ]; then
        echo "  🔍 S3 buckets..."
        buckets=$(aws s3api list-buckets --query "Buckets[?contains(Name, 'bayon')].Name" --output text 2>/dev/null || echo "")
        
        if [ ! -z "$buckets" ]; then
            echo "  ⚠️  Found S3 buckets: $buckets"
            echo "     Review and delete manually if no longer needed"
        else
            echo "  ✅ No S3 buckets found"
        fi
    fi
done

echo ""
echo "🎯 Current us-west-2 resources (KEEP THESE):"
echo "   Cognito User Pool: us-west-2_ALOcJxQDd"
echo "   DynamoDB Table: BayonCoAgent-v2-production"
echo "   S3 Bucket: bayon-coagent-storage-production-v2-409136660268"

echo ""
echo "⚠️  IMPORTANT NOTES:"
echo "   - Only delete resources you're certain are no longer needed"
echo "   - Always backup data before deletion"
echo "   - Some resources may have dependencies"
echo "   - Consider using AWS Config or CloudTrail to verify resource usage"

echo ""
echo "🔧 Manual cleanup commands (use with caution):"
echo ""
echo "# Delete CloudFormation stack:"
echo "aws cloudformation delete-stack --stack-name <stack-name> --region <region>"
echo ""
echo "# Delete DynamoDB table:"
echo "aws dynamodb delete-table --table-name <table-name> --region <region>"
echo ""
echo "# Delete S3 bucket (must be empty first):"
echo "aws s3 rm s3://<bucket-name> --recursive"
echo "aws s3api delete-bucket --bucket <bucket-name>"
echo ""
echo "# Delete Cognito User Pool:"
echo "aws cognito-idp delete-user-pool --user-pool-id <pool-id> --region <region>"

echo ""
echo "✅ Cleanup scan complete!"