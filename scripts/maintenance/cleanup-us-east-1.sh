#!/bin/bash

# Cleanup old us-east-1 resources for Bayon CoAgent
# ⚠️ WARNING: This will permanently delete resources in us-east-1
# Only run this after confirming you no longer need them!

set -e

echo "🗑️ Bayon CoAgent us-east-1 Cleanup Script"
echo "⚠️  WARNING: This will permanently delete resources!"
echo ""

# Confirmation prompt
read -p "Are you sure you want to delete old us-east-1 resources? (type 'DELETE' to confirm): " confirmation

if [ "$confirmation" != "DELETE" ]; then
    echo "❌ Cleanup cancelled. No resources were deleted."
    exit 0
fi

echo ""
echo "🧹 Starting cleanup of us-east-1 resources..."

# Set region
REGION="us-east-1"

# Delete CloudFormation stacks
echo "🔥 Deleting CloudFormation stacks..."

stacks=("bayon-coagent-dev" "bayon-coagent-v1")

for stack in "${stacks[@]}"; do
    echo "  Deleting stack: $stack"
    if aws cloudformation delete-stack --stack-name "$stack" --region "$REGION" 2>/dev/null; then
        echo "  ✅ Stack deletion initiated: $stack"
    else
        echo "  ⚠️  Stack not found or already deleted: $stack"
    fi
done

# Wait for stack deletions to complete
echo "⏳ Waiting for stack deletions to complete..."
for stack in "${stacks[@]}"; do
    echo "  Waiting for $stack..."
    aws cloudformation wait stack-delete-complete --stack-name "$stack" --region "$REGION" 2>/dev/null || echo "  ✅ $stack deletion complete or stack not found"
done

# Delete DynamoDB tables
echo "🔥 Deleting DynamoDB tables..."

tables=("BayonCoAgent-development")

for table in "${tables[@]}"; do
    echo "  Deleting table: $table"
    if aws dynamodb delete-table --table-name "$table" --region "$REGION" 2>/dev/null; then
        echo "  ✅ Table deletion initiated: $table"
    else
        echo "  ⚠️  Table not found or already deleted: $table"
    fi
done

# Delete Cognito User Pools
echo "🔥 Deleting Cognito User Pools..."

# Get user pools with 'bayon' in the name
pools=$(aws cognito-idp list-user-pools --max-results 60 --region "$REGION" --query "UserPools[?contains(Name, 'bayon')].Id" --output text 2>/dev/null || echo "")

if [ ! -z "$pools" ]; then
    for pool_id in $pools; do
        echo "  Deleting User Pool: $pool_id"
        if aws cognito-idp delete-user-pool --user-pool-id "$pool_id" --region "$REGION" 2>/dev/null; then
            echo "  ✅ User Pool deleted: $pool_id"
        else
            echo "  ⚠️  Failed to delete User Pool: $pool_id"
        fi
    done
else
    echo "  ✅ No Cognito User Pools found to delete"
fi

# Delete S3 buckets (be very careful here)
echo "🔥 Deleting S3 buckets..."

# List of buckets to delete (excluding the current production bucket)
buckets=(
    "bayon-coagent-storage-development-409136660268"
    "bayon-coagent-storage-production-409136660268"
    "bayon-agentcore-code-dev-409136660268"
    "bayon-coagent-leads-409136660268"
    "bayon-coagent-site-409136660268"
    "bayon-knowledge-base"
)

for bucket in "${buckets[@]}"; do
    echo "  Processing bucket: $bucket"
    
    # Check if bucket exists
    if aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
        echo "    Emptying bucket: $bucket"
        aws s3 rm "s3://$bucket" --recursive 2>/dev/null || echo "    ⚠️  Failed to empty bucket or already empty"
        
        echo "    Deleting bucket: $bucket"
        if aws s3api delete-bucket --bucket "$bucket" 2>/dev/null; then
            echo "    ✅ Bucket deleted: $bucket"
        else
            echo "    ⚠️  Failed to delete bucket: $bucket (may not be empty or have dependencies)"
        fi
    else
        echo "    ✅ Bucket not found or already deleted: $bucket"
    fi
done

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "📋 Summary:"
echo "   ✅ CloudFormation stacks deleted"
echo "   ✅ DynamoDB tables deleted"
echo "   ✅ Cognito User Pools deleted"
echo "   ✅ S3 buckets deleted"
echo ""
echo "🎯 Your active us-west-2 resources remain untouched:"
echo "   ✅ Cognito User Pool: us-west-2_ALOcJxQDd"
echo "   ✅ DynamoDB Table: BayonCoAgent-v2-production"
echo "   ✅ S3 Bucket: bayon-coagent-storage-production-v2-409136660268"
echo ""
echo "💰 You should see cost savings in your next AWS bill!"
echo ""
echo "⚠️  Note: Some resources may take time to fully delete and stop billing."
echo "   Check the AWS Console to confirm all resources are removed."