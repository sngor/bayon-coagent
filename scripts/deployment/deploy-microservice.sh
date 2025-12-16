#!/bin/bash

# Individual Microservice Deployment Script
# Usage: ./deploy-microservice.sh <service-name> <environment> [options]

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
    echo "Usage: $0 <service-name> <environment> [options]"
    echo ""
    echo "Arguments:"
    echo "  service-name    Name of the microservice to deploy"
    echo "  environment     Target environment (development|production)"
    echo ""
    echo "Options:"
    echo "  --dry-run       Show what would be deployed without making changes"
    echo "  --force         Force deployment even if no changes detected"
    echo "  --rollback      Rollback to previous version"
    echo "  --health-check  Run health checks after deployment"
    echo "  --help          Show this help message"
    echo ""
    echo "Available Services:"
    echo "  content-generation    Content generation microservices"
    echo "  research-analysis     Research and analysis microservices"
    echo "  brand-management      Brand management microservices"
    echo "  notification          Notification microservices"
    echo "  integration           Integration microservices"
    echo "  data-processing       Data processing microservices"
    echo "  admin                 Administrative microservices"
    echo "  file-storage          File storage microservices"
    echo "  workflow              Workflow orchestration microservices"
    echo "  performance           Performance optimization microservices"
    echo "  infrastructure        Infrastructure microservices"
    echo "  all                   Deploy all microservices"
    echo ""
    echo "Examples:"
    echo "  $0 content-generation development"
    echo "  $0 notification production --health-check"
    echo "  $0 all development --dry-run"
}

# Parse arguments
SERVICE_NAME=""
ENVIRONMENT=""
DRY_RUN=false
FORCE_DEPLOY=false
ROLLBACK=false
HEALTH_CHECK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE_DEPLOY=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --health-check)
            HEALTH_CHECK=true
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
            if [ -z "$SERVICE_NAME" ]; then
                SERVICE_NAME="$1"
            elif [ -z "$ENVIRONMENT" ]; then
                ENVIRONMENT="$1"
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
if [ -z "$SERVICE_NAME" ] || [ -z "$ENVIRONMENT" ]; then
    print_error "Missing required arguments"
    usage
    exit 1
fi

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Must be 'development' or 'production'"
    exit 1
fi

# Set AWS profile and region
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-west-2}
STACK_NAME="bayon-coagent-${ENVIRONMENT}"

print_info "========================================="
print_info "Microservice Deployment"
print_info "========================================="
print_info "Service:      ${SERVICE_NAME}"
print_info "Environment:  ${ENVIRONMENT}"
print_info "AWS Profile:  ${PROFILE}"
print_info "AWS Region:   ${REGION}"
if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN MODE - No changes will be made"
fi
print_info "========================================="

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi

if ! command -v sam &> /dev/null; then
    print_error "AWS SAM CLI is not installed"
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

ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --query Account --output text)
print_success "Authenticated as account: ${ACCOUNT_ID}"

# Function to get service functions
get_service_functions() {
    local service=$1
    case $service in
        content-generation)
            echo "ai-blog-post-generator ai-social-media-generator ai-listing-description-generator ai-market-update-generator"
            ;;
        research-analysis)
            echo "competitor-monitor-processor trend-detector-processor life-event-processor"
            ;;
        brand-management)
            echo "brand-audit-service brand-analytics-service brand-reporting-service reputation-monitoring-service seo-monitoring-service"
            ;;
        notification)
            echo "notification-processor notification-digest-generator notification-retry-processor notification-cleanup-maintenance"
            ;;
        integration)
            echo "integration-google-oauth integration-social-oauth integration-mls-sync"
            ;;
        data-processing)
            echo "analytics-aggregation-service event-processing-service report-generation-service trend-detection-service scheduler-service"
            ;;
        admin)
            echo "admin-user-management admin-system-config admin-audit-log-query admin-metrics-aggregation admin-alert-processor admin-monitoring-dashboard"
            ;;
        file-storage)
            echo "file-upload-service image-processing-service thumbnail-service metadata-service access-control-service"
            ;;
        workflow)
            echo "workflow-engine-service rules-engine-service process-manager-service saga-coordinator-service template-service"
            ;;
        performance)
            echo "cache-service query-optimization-service cdn-management-service rate-limiting-service performance-monitoring-service"
            ;;
        infrastructure)
            echo "circuit-breaker-service api-gateway-service service-mesh-service distributed-tracing-service health-monitoring-service"
            ;;
        all)
            echo "ai-blog-post-generator ai-social-media-generator ai-listing-description-generator ai-market-update-generator competitor-monitor-processor trend-detector-processor life-event-processor brand-audit-service brand-analytics-service brand-reporting-service reputation-monitoring-service seo-monitoring-service notification-processor notification-digest-generator notification-retry-processor notification-cleanup-maintenance integration-google-oauth integration-social-oauth integration-mls-sync analytics-aggregation-service event-processing-service report-generation-service trend-detection-service scheduler-service admin-user-management admin-system-config admin-audit-log-query admin-metrics-aggregation admin-alert-processor admin-monitoring-dashboard file-upload-service image-processing-service thumbnail-service metadata-service access-control-service workflow-engine-service rules-engine-service process-manager-service saga-coordinator-service template-service cache-service query-optimization-service cdn-management-service rate-limiting-service performance-monitoring-service circuit-breaker-service api-gateway-service service-mesh-service distributed-tracing-service health-monitoring-service"
            ;;
        *)
            echo ""
            ;;
    esac
}



# Get functions to deploy
FUNCTIONS_TO_DEPLOY=$(get_service_functions "$SERVICE_NAME")

if [ -z "$FUNCTIONS_TO_DEPLOY" ]; then
    print_error "Unknown service: $SERVICE_NAME"
    print_info "Available services: content-generation research-analysis brand-management notification integration data-processing admin file-storage workflow performance infrastructure all"
    exit 1
fi

print_info "Functions to deploy: $FUNCTIONS_TO_DEPLOY"

# Function to check if function exists in stack
function_exists() {
    local function_name=$1
    aws cloudformation describe-stack-resources \
        --stack-name $STACK_NAME \
        --profile $PROFILE \
        --region $REGION \
        --query "StackResources[?LogicalResourceId=='${function_name}Function'].ResourceStatus" \
        --output text 2>/dev/null | grep -q "CREATE_COMPLETE\|UPDATE_COMPLETE"
}

# Function to get function version
get_function_version() {
    local function_name=$1
    local full_function_name="bayon-coagent-${function_name}-${ENVIRONMENT}"
    aws lambda get-function \
        --function-name $full_function_name \
        --profile $PROFILE \
        --region $REGION \
        --query 'Configuration.Version' \
        --output text 2>/dev/null || echo "N/A"
}

# Function to deploy individual function
deploy_function() {
    local function_name=$1
    local full_function_name="bayon-coagent-${function_name}-${ENVIRONMENT}"
    
    print_info "Deploying function: $function_name"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would deploy $function_name"
        return 0
    fi
    
    # Check if function exists
    if function_exists "$function_name"; then
        current_version=$(get_function_version "$function_name")
        print_info "Current version: $current_version"
        
        # Update function code
        if [ -f "src/lambda/${function_name}.ts" ]; then
            print_info "Updating function code..."
            
            # Build the function
            cd src/lambda
            npm run build 2>/dev/null || true
            cd ../..
            
            # Create deployment package
            zip_file="/tmp/${function_name}-deployment.zip"
            cd src/lambda/dist
            zip -r "$zip_file" "${function_name}.js" node_modules/ 2>/dev/null || {
                print_error "Failed to create deployment package for $function_name"
                return 1
            }
            cd ../../..
            
            # Update function
            aws lambda update-function-code \
                --function-name $full_function_name \
                --zip-file "fileb://$zip_file" \
                --profile $PROFILE \
                --region $REGION \
                --output json > /tmp/update-result.json
            
            new_version=$(jq -r '.Version' /tmp/update-result.json)
            print_success "Updated to version: $new_version"
            
            # Clean up
            rm -f "$zip_file" /tmp/update-result.json
        else
            print_warning "Function source not found: src/lambda/${function_name}.ts"
        fi
    else
        print_warning "Function $function_name not found in stack. Use full SAM deployment."
    fi
}

# Function to run health check
run_health_check() {
    local function_name=$1
    local full_function_name="bayon-coagent-${function_name}-${ENVIRONMENT}"
    
    print_info "Running health check for: $function_name"
    
    # Invoke function with test payload
    test_payload='{"source":"health-check","detail-type":"Health Check","detail":{}}'
    
    result=$(aws lambda invoke \
        --function-name $full_function_name \
        --payload "$test_payload" \
        --profile $PROFILE \
        --region $REGION \
        --output json \
        /tmp/health-check-response.txt 2>/dev/null || echo '{"StatusCode": 500}')
    
    status_code=$(echo "$result" | jq -r '.StatusCode // 500')
    
    if [ "$status_code" = "200" ]; then
        print_success "Health check passed for $function_name"
        return 0
    else
        print_error "Health check failed for $function_name (Status: $status_code)"
        if [ -f /tmp/health-check-response.txt ]; then
            print_error "Response: $(cat /tmp/health-check-response.txt)"
        fi
        return 1
    fi
}

# Function to rollback function
rollback_function() {
    local function_name=$1
    local full_function_name="bayon-coagent-${function_name}-${ENVIRONMENT}"
    
    print_info "Rolling back function: $function_name"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would rollback $function_name"
        return 0
    fi
    
    # Get previous version
    versions=$(aws lambda list-versions-by-function \
        --function-name $full_function_name \
        --profile $PROFILE \
        --region $REGION \
        --query 'Versions[?Version!=`$LATEST`].Version' \
        --output text | tr '\t' '\n' | sort -nr | head -2)
    
    if [ $(echo "$versions" | wc -l) -lt 2 ]; then
        print_error "No previous version found for rollback"
        return 1
    fi
    
    previous_version=$(echo "$versions" | tail -1)
    
    print_info "Rolling back to version: $previous_version"
    
    # Update alias to point to previous version
    aws lambda update-alias \
        --function-name $full_function_name \
        --name LIVE \
        --function-version $previous_version \
        --profile $PROFILE \
        --region $REGION \
        >/dev/null
    
    print_success "Rolled back to version: $previous_version"
}

# Main deployment logic
if [ "$ROLLBACK" = true ]; then
    print_info "Starting rollback process..."
    
    failed_rollbacks=0
    for function_name in $FUNCTIONS_TO_DEPLOY; do
        if ! rollback_function "$function_name"; then
            ((failed_rollbacks++))
        fi
    done
    
    if [ $failed_rollbacks -eq 0 ]; then
        print_success "All rollbacks completed successfully"
    else
        print_error "$failed_rollbacks rollback(s) failed"
        exit 1
    fi
else
    print_info "Starting deployment process..."
    
    # Deploy functions
    failed_deployments=0
    for function_name in $FUNCTIONS_TO_DEPLOY; do
        if ! deploy_function "$function_name"; then
            ((failed_deployments++))
        fi
    done
    
    if [ $failed_deployments -gt 0 ]; then
        print_error "$failed_deployments deployment(s) failed"
        exit 1
    fi
    
    print_success "All deployments completed successfully"
    
    # Run health checks if requested
    if [ "$HEALTH_CHECK" = true ]; then
        print_info "Running health checks..."
        
        failed_health_checks=0
        for function_name in $FUNCTIONS_TO_DEPLOY; do
            if ! run_health_check "$function_name"; then
                ((failed_health_checks++))
            fi
        done
        
        if [ $failed_health_checks -eq 0 ]; then
            print_success "All health checks passed"
        else
            print_error "$failed_health_checks health check(s) failed"
            exit 1
        fi
    fi
fi

print_success "========================================="
print_success "Deployment Complete!"
print_success "========================================="