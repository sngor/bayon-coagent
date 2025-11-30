#!/bin/bash

# S3 Storage Smoke Test
# Tests S3 bucket access and file operations

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
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not installed"
    exit 1
fi

# Get environment
read -p "Enter environment (development/production): " ENVIRONMENT
ENVIRONMENT=${ENVIRONMENT:-production}

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="bayon-coagent-storage-${ENVIRONMENT}-${ACCOUNT_ID}"

print_info "Testing S3 bucket: $BUCKET_NAME"
echo ""

# Test 1: Bucket exists
print_info "Test 1: Check if bucket exists"
if aws s3 ls "s3://${BUCKET_NAME}" &> /dev/null; then
    print_success "Bucket exists: $BUCKET_NAME"
else
    print_error "Bucket not found: $BUCKET_NAME"
    exit 1
fi

# Test 2: Bucket encryption
print_info "Test 2: Check bucket encryption"
ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "$BUCKET_NAME" --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text 2>/dev/null || echo "NOT_SET")
if [ "$ENCRYPTION" = "AES256" ] || [ "$ENCRYPTION" = "aws:kms" ]; then
    print_success "Bucket encryption enabled: $ENCRYPTION"
else
    print_warning "Bucket encryption not set or disabled"
fi

# Test 3: Public access block
print_info "Test 3: Check public access block"
PUBLIC_ACCESS=$(aws s3api get-public-access-block --bucket "$BUCKET_NAME" --query 'PublicAccessBlockConfiguration.BlockPublicAcls' --output text 2>/dev/null || echo "false")
if [ "$PUBLIC_ACCESS" = "True" ]; then
    print_success "Public access blocked"
else
    print_warning "Public access may not be fully blocked"
fi

# Test 4: Versioning (production only)
if [ "$ENVIRONMENT" = "production" ]; then
    print_info "Test 4: Check versioning (production)"
    VERSIONING=$(aws s3api get-bucket-versioning --bucket "$BUCKET_NAME" --query 'Status' --output text 2>/dev/null || echo "NOT_SET")
    if [ "$VERSIONING" = "Enabled" ]; then
        print_success "Versioning enabled"
    else
        print_warning "Versioning not enabled"
    fi
fi

# Test 5: CORS configuration
print_info "Test 5: Check CORS configuration"
if aws s3api get-bucket-cors --bucket "$BUCKET_NAME" &> /dev/null; then
    print_success "CORS configuration exists"
else
    print_warning "CORS configuration not found (may be OK)"
fi

# Test 6: Write test
print_info "Test 6: Testing file upload"
TEST_FILE="/tmp/s3-smoke-test-$(date +%s).txt"
echo "S3 smoke test file - $(date)" > "$TEST_FILE"

if aws s3 cp "$TEST_FILE" "s3://${BUCKET_NAME}/smoke-tests/" &> /dev/null; then
    print_success "File upload successful"
    
    # Test 7: Read test
    print_info "Test 7: Testing file download"
    DOWNLOAD_FILE="/tmp/s3-download-$(date +%s).txt"
    if aws s3 cp "s3://${BUCKET_NAME}/smoke-tests/$(basename $TEST_FILE)" "$DOWNLOAD_FILE" &> /dev/null; then
        print_success "File download successful"
        
        # Verify content
        if diff "$TEST_FILE" "$DOWNLOAD_FILE" &> /dev/null; then
            print_success "File content verified"
        else
            print_error "File content mismatch"
        fi
        
        rm -f "$DOWNLOAD_FILE"
    else
        print_error "File download failed"
    fi
    
    # Test 8: Delete test
    print_info "Test 8: Testing file deletion (cleanup)"
    if aws s3 rm "s3://${BUCKET_NAME}/smoke-tests/$(basename $TEST_FILE)" &> /dev/null; then
        print_success "File deletion successful"
    else
        print_warning "File deletion failed (file may remain in bucket)"
    fi
else
    print_error "File upload failed"
fi

rm -f "$TEST_FILE"

# Test 9: List objects
print_info "Test 9: Testing list objects"
OBJECT_COUNT=$(aws s3 ls "s3://${BUCKET_NAME}/" --recursive | wc -l)
print_info "Total objects in bucket: $OBJECT_COUNT"

# Test 10: Storage usage
print_info "Test 10: Check storage metrics"
SIZE_BYTES=$(aws s3 ls "s3://${BUCKET_NAME}/" --recursive --summarize | grep "Total Size" | awk '{print $3}')
if [ -n "$SIZE_BYTES" ]; then
    SIZE_MB=$((SIZE_BYTES / 1024 / 1024))
    print_info "Total storage used: ${SIZE_MB} MB"
else
    print_info "Storage usage: Unable to calculate"
fi

echo ""
print_success "S3 storage smoke test complete!"
echo ""
print_info "Manual tests to perform:"
echo "1. Upload an image via the application UI"
echo "2. Verify image displays correctly"
echo "3. Upload a document (PDF, DOCX, etc.)"
echo "4. Download the uploaded document"
echo "5. Delete an uploaded file"
echo "6. Verify file is removed from UI"
