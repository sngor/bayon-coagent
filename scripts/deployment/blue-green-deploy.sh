#!/bin/bash

# Blue-Green Deployment Script for Microservices
# Usage: ./blue-green-deploy.sh <service-name> <environment> [options]

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
    echo "  service-name    Name of the microservice for blue-green deployment"
    echo "  environment     Target environment (development|production)"
    echo ""
    echo "Options:"
    echo "  --timeout       Deployment timeout in seconds (default: 300)"
    echo "  --health-check  Health check endpoint path (default: /health)"
    echo "  --rollback      Rollback to blue environment"
    echo "  --status        Show current deployment status"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 content-generation production"
    echo "  $0 notification development --timeout 600"
    echo "  $0 integration production --rollback"
}

# Parse arguments
SERVICE_NAME=""
ENVIRONMENT=""
TIMEOUT=300
HEALTH_CHECK_PATH="/health"
ROLLBACK=false
STATUS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --health-check)
            HEALTH_CHECK_PATH="$2"
            shift 2
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --status)
            STATUS_ONLY=true
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

# Set AWS configuration
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-west-2}
STACK_NAME="bayon-coagent-${ENVIRONMENT}"

print_info "========================================="
print_info "Blue-Green Deployment"
print_info "========================================="
print_info "Service:      ${SERVICE_NAME}"
print_info "Environment:  ${ENVIRONMENT}"
print_info "AWS Profile:  ${PROFILE}"
print_info "AWS Region:   ${REGION}"
print_info "Timeout:      ${TIMEOUT}s"
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

# Function to get API Gateway stage info
get_api_gateway_info() {
    local service_type=$1
    
    case $service_type in
        content-generation|research-analysis|brand-management)
            echo "bayon-coagent-ai-${ENVIRONMENT}"
            ;;
        integration)
            echo "bayon-coagent-integration-${ENVIRONMENT}"
            ;;
        admin)
            echo "bayon-coagent-admin-${ENVIRONMENT}"
            ;;
        *)
            echo "bayon-coagent-background-${ENVIRONMENT}"
            ;;
    esac
}

# Function to get current deployment status
get_deployment_status() {
    local api_name=$(get_api_gateway_info "$SERVICE_NAME")
    
    # Get API Gateway ID
    api_id=$(aws apigateway get-rest-apis \
        --profile $PROFILE \
        --region $REGION \
        --query "items[?name=='$api_name'].id" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$api_id" ]; then
        print_error "API Gateway not found: $api_name"
        return 1
    fi
    
    # Get current stage information
    blue_stage=$(aws apigateway get-stage \
        --rest-api-id $api_id \
        --stage-name blue \
        --profile $PROFILE \
        --region $REGION \
        --output json 2>/dev/null || echo "{}")
    
    green_stage=$(aws apigateway get-stage \
        --rest-api-id $api_id \
        --stage-name green \
        --profile $PROFILE \
        --region $REGION \
        --output json 2>/dev/null || echo "{}")
    
    live_stage=$(aws apigateway get-stage \
        --rest-api-id $api_id \
        --stage-name v1 \
        --profile $PROFILE \
        --region $REGION \
        --output json 2>/dev/null || echo "{}")
    
    # Determine active environment
    live_deployment_id=$(echo "$live_stage" | jq -r '.deploymentId // "unknown"')
    blue_deployment_id=$(echo "$blue_stage" | jq -r '.deploymentId // "unknown"')
    green_deployment_id=$(echo "$green_stage" | jq -r '.deploymentId // "unknown"')
    
    if [ "$live_deployment_id" = "$blue_deployment_id" ]; then
        echo "blue"
    elif [ "$live_deployment_id" = "$green_deployment_id" ]; then
        echo "green"
    else
        echo "unknown"
    fi
}

# Function to create deployment
create_deployment() {
    local api_id=$1
    local description=$2
    
    aws apigateway create-deployment \
        --rest-api-id $api_id \
        --description "$description" \
        --profile $PROFILE \
        --region $REGION \
        --query 'id' \
        --output text
}

# Function to update stage
update_stage() {
    local api_id=$1
    local stage_name=$2
    local deployment_id=$3
    
    aws apigateway update-stage \
        --rest-api-id $api_id \
        --stage-name $stage_name \
        --patch-ops op=replace,path=/deploymentId,value=$deployment_id \
        --profile $PROFILE \
        --region $REGION \
        >/dev/null
}

# Function to run health check
run_health_check() {
    local api_id=$1
    local stage_name=$2
    local max_attempts=10
    local attempt=1
    
    base_url="https://${api_id}.execute-api.${REGION}.amazonaws.com/${stage_name}"
    health_url="${base_url}${HEALTH_CHECK_PATH}"
    
    print_info "Running health check: $health_url"
    
    while [ $attempt -le $max_attempts ]; do
        print_info "Health check attempt $attempt/$max_attempts"
        
        response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null || echo "000")
        
        if [ "$response" = "200" ]; then
            print_success "Health check passed"
            return 0
        fi
        
        print_warning "Health check failed (HTTP $response), retrying in 10s..."
        sleep 10
        ((attempt++))
    done
    
    print_error "Health check failed after $max_attempts attempts"
    return 1
}

# Function to perform blue-green deployment
perform_deployment() {
    local api_name=$(get_api_gateway_info "$SERVICE_NAME")
    
    # Get API Gateway ID
    api_id=$(aws apigateway get-rest-apis \
        --profile $PROFILE \
        --region $REGION \
        --query "items[?name=='$api_name'].id" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$api_id" ]; then
        print_error "API Gateway not found: $api_name"
        return 1
    fi
    
    print_info "API Gateway ID: $api_id"
    
    # Get current active environment
    current_env=$(get_deployment_status)
    print_info "Current active environment: $current_env"
    
    # Determine target environment
    if [ "$current_env" = "blue" ]; then
        target_env="green"
        source_env="blue"
    else
        target_env="blue"
        source_env="green"
    fi
    
    print_info "Deploying to: $target_env"
    
    # Create new deployment
    print_info "Creating new deployment..."
    deployment_id=$(create_deployment "$api_id" "Blue-Green deployment to $target_env - $(date)")
    
    if [ -z "$deployment_id" ]; then
        print_error "Failed to create deployment"
        return 1
    fi
    
    print_success "Created deployment: $deployment_id"
    
    # Update target stage
    print_info "Updating $target_env stage..."
    if ! update_stage "$api_id" "$target_env" "$deployment_id"; then
        print_error "Failed to update $target_env stage"
        return 1
    fi
    
    print_success "Updated $target_env stage"
    
    # Run health check on target environment
    print_info "Running health check on $target_env environment..."
    if ! run_health_check "$api_id" "$target_env"; then
        print_error "Health check failed on $target_env environment"
        print_warning "Deployment created but not promoted to live"
        return 1
    fi
    
    # Switch live traffic to target environment
    print_info "Switching live traffic to $target_env..."
    if ! update_stage "$api_id" "v1" "$deployment_id"; then
        print_error "Failed to switch live traffic"
        return 1
    fi
    
    print_success "Live traffic switched to $target_env"
    
    # Final health check on live environment
    print_info "Running final health check on live environment..."
    if ! run_health_check "$api_id" "v1"; then
        print_error "Final health check failed"
        print_warning "Consider rolling back"
        return 1
    fi
    
    print_success "Blue-green deployment completed successfully"
    print_info "Active environment: $target_env"
    print_info "Previous environment: $source_env (available for rollback)"
}

# Function to perform rollback
perform_rollback() {
    local api_name=$(get_api_gateway_info "$SERVICE_NAME")
    
    # Get API Gateway ID
    api_id=$(aws apigateway get-rest-apis \
        --profile $PROFILE \
        --region $REGION \
        --query "items[?name=='$api_name'].id" \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$api_id" ]; then
        print_error "API Gateway not found: $api_name"
        return 1
    fi
    
    # Get current active environment
    current_env=$(get_deployment_status)
    print_info "Current active environment: $current_env"
    
    # Determine rollback target
    if [ "$current_env" = "blue" ]; then
        rollback_env="green"
    elif [ "$current_env" = "green" ]; then
        rollback_env="blue"
    else
        print_error "Cannot determine rollback target"
        return 1
    fi
    
    print_warning "Rolling back from $current_env to $rollback_env"
    
    # Get rollback deployment ID
    rollback_stage=$(aws apigateway get-stage \
        --rest-api-id $api_id \
        --stage-name $rollback_env \
        --profile $PROFILE \
        --region $REGION \
        --output json 2>/dev/null || echo "{}")
    
    rollback_deployment_id=$(echo "$rollback_stage" | jq -r '.deploymentId // ""')
    
    if [ -z "$rollback_deployment_id" ]; then
        print_error "No deployment found in $rollback_env environment"
        return 1
    fi
    
    # Switch live traffic to rollback environment
    print_info "Switching live traffic to $rollback_env..."
    if ! update_stage "$api_id" "v1" "$rollback_deployment_id"; then
        print_error "Failed to rollback"
        return 1
    fi
    
    # Run health check
    print_info "Running health check after rollback..."
    if ! run_health_check "$api_id" "v1"; then
        print_error "Health check failed after rollback"
        return 1
    fi
    
    print_success "Rollback completed successfully"
    print_info "Active environment: $rollback_env"
}

# Main execution
if [ "$STATUS_ONLY" = true ]; then
    current_env=$(get_deployment_status)
    print_info "Current deployment status:"
    print_info "Active environment: $current_env"
    exit 0
fi

if [ "$ROLLBACK" = true ]; then
    print_warning "Starting rollback process..."
    if perform_rollback; then
        print_success "Rollback completed successfully"
    else
        print_error "Rollback failed"
        exit 1
    fi
else
    print_info "Starting blue-green deployment..."
    if perform_deployment; then
        print_success "Blue-green deployment completed successfully"
    else
        print_error "Blue-green deployment failed"
        exit 1
    fi
fi

print_success "========================================="
print_success "Operation Complete!"
print_success "========================================="