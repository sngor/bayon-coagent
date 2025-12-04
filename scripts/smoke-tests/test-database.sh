#!/bin/bash

# DynamoDB Smoke Test
# Tests database connectivity and basic operations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not installed"
    exit 1
fi

# Get environment from argument or environment variable
ENVIRONMENT=${1:-${ENVIRONMENT:-development}}

TABLE_NAME="BayonCoAgent-${ENVIRONMENT}"

print_info "Testing DynamoDB table: $TABLE_NAME"
echo ""

# Test 1: Table exists
print_info "Test 1: Check if table exists"
if aws dynamodb describe-table --table-name "$TABLE_NAME" &> /dev/null; then
    print_success "Table exists: $TABLE_NAME"
else
    print_error "Table not found: $TABLE_NAME"
    exit 1
fi

# Test 2: Table status
print_info "Test 2: Check table status"
TABLE_STATUS=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --query 'Table.TableStatus' --output text)
if [ "$TABLE_STATUS" = "ACTIVE" ]; then
    print_success "Table status: ACTIVE"
else
    print_error "Table status: $TABLE_STATUS"
    exit 1
fi

# Test 3: Billing mode
print_info "Test 3: Check billing mode"
BILLING_MODE=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --query 'Table.BillingModeSummary.BillingMode' --output text)
print_info "Billing mode: $BILLING_MODE"

# Test 4: Encryption
print_info "Test 4: Check encryption status"
SSE_DESCRIPTION=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --query 'Table.SSEDescription.Status' --output text)
if [ "$SSE_DESCRIPTION" = "ENABLED" ]; then
    print_success "Encryption enabled"
else
    print_warning "Encryption not enabled or status unclear"
fi

# Test 5: Point-in-time recovery
if [ "$ENVIRONMENT" = "production" ]; then
    print_info "Test 5: Check point-in-time recovery (production)"
    PITR_STATUS=$(aws dynamodb describe-continuous-backups --table-name "$TABLE_NAME" --query 'ContinuousBackupsDescription.PointInTimeRecoveryDescription.PointInTimeRecoveryStatus' --output text)
    if [ "$PITR_STATUS" = "ENABLED" ]; then
        print_success "Point-in-time recovery enabled"
    else
        print_warning "Point-in-time recovery not enabled"
    fi
fi

# Test 6: Read/write operations (simple test)
print_info "Test 6: Testing write operation"
TEST_ID="test-$(date +%s)"
PUT_RESULT=$(aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "{
        \"PK\": {\"S\": \"TEST#${TEST_ID}\"},
        \"SK\": {\"S\": \"METADATA\"},
        \"EntityType\": {\"S\": \"SmokeTest\"},
        \"CreatedAt\": {\"N\": \"$(date +%s)\"},
        \"Data\": {\"S\": \"Smoke test data\"}
    }" \
    --return-consumed-capacity TOTAL 2>&1)

if [ $? -eq 0 ]; then
    print_success "Write operation successful"
    
    # Test 7: Read operation
    print_info "Test 7: Testing read operation"
    GET_RESULT=$(aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --key "{
            \"PK\": {\"S\": \"TEST#${TEST_ID}\"},
            \"SK\": {\"S\": \"METADATA\"}
        }" \
        --return-consumed-capacity TOTAL)
    
    if [ $? -eq 0 ]; then
        print_success "Read operation successful"
        
        # Test 8: Delete operation
        print_info "Test 8: Testing delete operation (cleanup)"
        DELETE_RESULT=$(aws dynamodb delete-item \
            --table-name "$TABLE_NAME" \
            --key "{
                \"PK\": {\"S\": \"TEST#${TEST_ID}\"},
                \"SK\": {\"S\": \"METADATA\"}
            }" \
            --return-consumed-capacity TOTAL)
        
        if [ $? -eq 0 ]; then
            print_success "Delete operation successful"
        else
            print_warning "Delete operation failed (item may remain in table)"
        fi
    else
        print_error "Read operation failed"
    fi
else
    print_error "Write operation failed"
    print_error "$PUT_RESULT"
fi

# Test 9: GSI status
print_info "Test 9: Check Global Secondary Indexes"
GSI_COUNT=$(aws dynamodb describe-table --table-name "$TABLE_NAME" --query 'length(Table.GlobalSecondaryIndexes)' --output text)
if [ "$GSI_COUNT" != "None" ] && [ "$GSI_COUNT" -gt 0 ]; then
    print_success "GSI count: $GSI_COUNT"
    
    # Check each GSI status
    aws dynamodb describe-table --table-name "$TABLE_NAME" --query 'Table.GlobalSecondaryIndexes[*].[IndexName,IndexStatus]' --output text | while read INDEX_NAME INDEX_STATUS; do
        if [ "$INDEX_STATUS" = "ACTIVE" ]; then
            print_success "  $INDEX_NAME: $INDEX_STATUS"
        else
            print_warning "  $INDEX_NAME: $INDEX_STATUS"
        fi
    done
else
    print_warning "No GSIs configured"
fi

echo ""
print_success "DynamoDB smoke test complete!"
echo ""
print_info "Manual tests to perform:"
echo "1. Create a new record via the application UI"
echo "2. Update an existing record"
echo "3. Delete a record"
echo "4. Verify data persistence after refresh"
echo "5. TestQuerying with filters"
