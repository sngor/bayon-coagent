#!/bin/bash

# Service Migration Utility Script
# Usage: ./service-migration.sh <source-env> <target-env> <service-name> [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# Usage function
usage() {
    echo "Usage: $0 <source-env> <target-env> <service-name> [options]"
    echo ""
    echo "Arguments:"
    echo "  source-env      Source environment (development|production)"
    echo "  target-env      Target environment (development|production)"
    echo "  service-name    Name of the service to migrate"
    echo ""
    echo "Options:"
    echo "  --data-only     Migrate only data, not configuration"
    echo "  --config-only   Migrate only configuration, not data"
    echo "  --dry-run       Show what would be migrated without making changes"
    echo "  --backup        Create backup before migration"
    echo "  --help          Show this help message"
    echo ""
    echo "Available Services:"
    echo "  content-generation    Content generation service data"
    echo "  research-analysis     Research and analysis data"
    echo "  brand-management      Brand management data"
    echo "  notification          Notification preferences and history"
    echo "  integration           Integration configurations and tokens"
    echo "  user-data            User profiles and settings"
    echo "  all                  All service data"
    echo ""
    echo "Examples:"
    echo "  $0 development production content-generation --backup"
    echo "  $0 production development user-data --dry-run"
}

# Parse arguments
SOURCE_ENV=""
TARGET_ENV=""
SERVICE_NAME=""
DATA_ONLY=false
CONFIG_ONLY=false
DRY_RUN=false
BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --data-only)
            DATA_ONLY=true
            shift
            ;;
        --config-only)
            CONFIG_ONLY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --backup)
            BACKUP=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        -*)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
        *)
            if [ -z "$SOURCE_ENV" ]; then
                SOURCE_ENV="$1"
            elif [ -z "$TARGET_ENV" ]; then
                TARGET_ENV="$1"
            elif [ -z "$SERVICE_NAME" ]; then
                SERVICE_NAME="$1"
            else
                print_error "Too many arguments"
                usage
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate required arguments
if [ -z "$SOURCE_ENV" ] || [ -z "$TARGET_ENV" ] || [ -z "$SERVICE_NAME" ]; then
    print_error "Missing required arguments"
    usage
    exit 1
fi

# Validate environments
for env in "$SOURCE_ENV" "$TARGET_ENV"; do
    if [[ "$env" != "development" && "$env" != "production" ]]; then
        print_error "Invalid environment: $env. Must be 'development' or 'production'"
        exit 1
    fi
done

# Prevent same environment migration
if [ "$SOURCE_ENV" = "$TARGET_ENV" ]; then
    print_error "Source and target environments cannot be the same"
    exit 1
fi

# Set AWS configuration
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-west-2}
SOURCE_TABLE="BayonCoAgent-${SOURCE_ENV}"
TARGET_TABLE="BayonCoAgent-${TARGET_ENV}"

print_info "========================================="
print_info "Service Migration"
print_info "========================================="
print_info "Source:       ${SOURCE_ENV}"
print_info "Target:       ${TARGET_ENV}"
print_info "Service:      ${SERVICE_NAME}"
print_info "AWS Profile:  ${PROFILE}"
print_info "AWS Region:   ${REGION}"
if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN MODE - No changes will be made"
fi
print_info "========================================="

# Check prerequisites
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    print_error "jq is not installed"
    exit 1
fi

# Verify AWS credentials
if ! aws sts get-caller-identity --profile $PROFILE &> /dev/null; then
    print_error "Invalid AWS credentials"
    exit 1
fi

# Function to check if table exists
table_exists() {
    local table_name=$1
    aws dynamodb describe-table \
        --table-name $table_name \
        --profile $PROFILE \
        --region $REGION \
        >/dev/null 2>&1
}

# Function to create backup
create_backup() {
    local table_name=$1
    local backup_name="${table_name}-migration-backup-$(date +%Y%m%d-%H%M%S)"
    
    print_info "Creating backup: $backup_name"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would create backup $backup_name"
        return 0
    fi
    
    aws dynamodb create-backup \
        --table-name $table_name \
        --backup-name $backup_name \
        --profile $PROFILE \
        --region $REGION \
        >/dev/null
    
    print_success "Backup created: $backup_name"
}

# Function to get service data patterns
get_service_patterns() {
    local service=$1
    
    case $service in
        content-generation)
            echo "CONTENT# BLOG# SOCIAL# LISTING# MARKETING#"
            ;;
        research-analysis)
            echo "RESEARCH# COMPETITOR# TREND# ANALYSIS#"
            ;;
        brand-management)
            echo "BRAND# AUDIT# REPUTATION# SEO#"
            ;;
        notification)
            echo "NOTIFICATION# PREFERENCE# DIGEST#"
            ;;
        integration)
            echo "OAUTH# INTEGRATION# SYNC#"
            ;;
        user-data)
            echo "PROFILE AGENT# USER#"
            ;;
        all)
            echo "CONTENT# BLOG# SOCIAL# LISTING# MARKETING# RESEARCH# COMPETITOR# TREND# ANALYSIS# BRAND# AUDIT# REPUTATION# SEO# NOTIFICATION# PREFERENCE# DIGEST# OAUTH# INTEGRATION# SYNC# PROFILE AGENT# USER#"
            ;;
        *)
            print_error "Unknown service: $service"
            exit 1
            ;;
    esac
}

# Function to scan and migrate data
migrate_service_data() {
    local patterns=$(get_service_patterns "$SERVICE_NAME")
    local total_items=0
    local migrated_items=0
    
    print_info "Migrating data for patterns: $patterns"
    
    for pattern in $patterns; do
        print_info "Processing pattern: $pattern"
        
        # Create filter expression based on pattern
        if [[ "$pattern" == *"#" ]]; then
            # Pattern with prefix
            prefix=${pattern%#}
            filter_expression="begins_with(SK, :pattern)"
            expression_values="{\":pattern\":{\"S\":\"$prefix\"}}"
        else
            # Exact match pattern
            filter_expression="SK = :pattern"
            expression_values="{\":pattern\":{\"S\":\"$pattern\"}}"
        fi
        
        # Scan source table
        scan_output="/tmp/scan-${pattern//[^a-zA-Z0-9]/-}.json"
        
        print_info "Scanning source table for pattern: $pattern"
        
        aws dynamodb scan \
            --table-name $SOURCE_TABLE \
            --filter-expression "$filter_expression" \
            --expression-attribute-values "$expression_values" \
            --profile $PROFILE \
            --region $REGION \
            --output json > "$scan_output"
        
        items_count=$(jq '.Items | length' "$scan_output")
        total_items=$((total_items + items_count))
        
        if [ "$items_count" -eq 0 ]; then
            print_info "No items found for pattern: $pattern"
            continue
        fi
        
        print_info "Found $items_count items for pattern: $pattern"
        
        if [ "$DRY_RUN" = true ]; then
            print_warning "DRY RUN: Would migrate $items_count items"
            migrated_items=$((migrated_items + items_count))
            continue
        fi
        
        # Process items in batches of 25 (DynamoDB limit)
        batch_size=25
        item_index=0
        
        while [ $item_index -lt $items_count ]; do
            batch_end=$((item_index + batch_size - 1))
            if [ $batch_end -ge $items_count ]; then
                batch_end=$((items_count - 1))
            fi
            
            print_info "Migrating items $((item_index + 1))-$((batch_end + 1)) of $items_count"
            
            # Extract batch items
            batch_items=$(jq ".Items[$item_index:$((batch_end + 1))]" "$scan_output")
            
            # Create batch write request
            batch_request=$(echo "$batch_items" | jq "{
                \"RequestItems\": {
                    \"$TARGET_TABLE\": [
                        .[] | {
                            \"PutRequest\": {
                                \"Item\": .
                            }
                        }
                    ]
                }
            }")
            
            # Write batch to target table
            echo "$batch_request" > "/tmp/batch-request.json"
            
            aws dynamodb batch-write-item \
                --request-items file:///tmp/batch-request.json \
                --profile $PROFILE \
                --region $REGION \
                >/dev/null
            
            batch_count=$((batch_end - item_index + 1))
            migrated_items=$((migrated_items + batch_count))
            item_index=$((batch_end + 1))
            
            # Small delay to avoid throttling
            sleep 0.1
        done
        
        # Clean up temporary files
        rm -f "$scan_output"
    done
    
    # Clean up
    rm -f /tmp/batch-request.json
    
    print_success "Migration completed: $migrated_items/$total_items items"
}

# Function to migrate configuration
migrate_service_config() {
    print_info "Migrating service configuration..."
    
    # Get source stack outputs
    source_stack="bayon-coagent-${SOURCE_ENV}"
    target_stack="bayon-coagent-${TARGET_ENV}"
    
    print_info "Copying configuration from $source_stack to $target_stack"
    
    # Get source configuration
    source_config=$(aws cloudformation describe-stacks \
        --stack-name $source_stack \
        --profile $PROFILE \
        --region $REGION \
        --query 'Stacks[0].Parameters' \
        --output json 2>/dev/null || echo "[]")
    
    if [ "$source_config" = "[]" ]; then
        print_warning "No configuration found in source stack"
        return 0
    fi
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would copy configuration parameters"
        echo "$source_config" | jq -r '.[] | "\(.ParameterKey)=\(.ParameterValue)"'
        return 0
    fi
    
    # Note: Configuration migration would typically involve updating
    # CloudFormation parameters or environment variables
    print_info "Configuration migration requires manual intervention"
    print_info "Source configuration:"
    echo "$source_config" | jq -r '.[] | "\(.ParameterKey)=\(.ParameterValue)"'
}

# Main migration logic
print_info "Checking source and target tables..."

if ! table_exists "$SOURCE_TABLE"; then
    print_error "Source table does not exist: $SOURCE_TABLE"
    exit 1
fi

if ! table_exists "$TARGET_TABLE"; then
    print_error "Target table does not exist: $TARGET_TABLE"
    exit 1
fi

print_success "Both tables exist"

# Create backup if requested
if [ "$BACKUP" = true ]; then
    create_backup "$TARGET_TABLE"
fi

# Perform migration based on options
if [ "$CONFIG_ONLY" = true ]; then
    migrate_service_config
elif [ "$DATA_ONLY" = true ]; then
    migrate_service_data
else
    # Migrate both data and configuration
    migrate_service_data
    migrate_service_config
fi

print_success "========================================="
print_success "Migration Complete!"
print_success "========================================="

if [ "$DRY_RUN" = false ]; then
    print_info "Next steps:"
    print_info "1. Verify migrated data in target environment"
    print_info "2. Update application configuration if needed"
    print_info "3. Test service functionality in target environment"
    print_info "4. Consider running integration tests"
fi