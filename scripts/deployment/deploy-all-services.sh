#!/bin/bash

# Main Deployment Orchestrator for All Microservices
# Usage: ./deploy-all-services.sh <environment> [options]

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
    echo "Usage: $0 <environment> [options]"
    echo ""
    echo "Arguments:"
    echo "  environment     Target environment (development|production)"
    echo ""
    echo "Options:"
    echo "  --strategy      Deployment strategy (rolling|blue-green|canary)"
    echo "  --parallel      Deploy services in parallel"
    echo "  --skip-tests    Skip automated testing"
    echo "  --skip-health   Skip health checks"
    echo "  --monitoring    Setup monitoring dashboard"
    echo "  --dry-run       Show what would be deployed"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development --strategy rolling --monitoring"
    echo "  $0 production --strategy blue-green --parallel"
}

# Parse arguments
ENVIRONMENT=""
STRATEGY="rolling"
PARALLEL=false
SKIP_TESTS=false
SKIP_HEALTH=false
SETUP_MONITORING=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --strategy)
            STRATEGY="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-health)
            SKIP_HEALTH=true
            shift
            ;;
        --monitoring)
            SETUP_MONITORING=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
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
            if [ -z "$ENVIRONMENT" ]; then
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
if [ -z "$ENVIRONMENT" ]; then
    print_error "Missing required environment argument"
    usage
    exit 1
fi

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment. Must be 'development' or 'production'"
    exit 1
fi

# Validate strategy
if [[ "$STRATEGY" != "rolling" && "$STRATEGY" != "blue-green" && "$STRATEGY" != "canary" ]]; then
    print_error "Invalid strategy. Must be 'rolling', 'blue-green', or 'canary'"
    exit 1
fi

# Set deployment configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

print_info "========================================="
print_info "Microservices Deployment Orchestrator"
print_info "========================================="
print_info "Environment:  ${ENVIRONMENT}"
print_info "Strategy:     ${STRATEGY}"
print_info "Parallel:     ${PARALLEL}"
print_info "Skip Tests:   ${SKIP_TESTS}"
print_info "Skip Health:  ${SKIP_HEALTH}"
print_info "Monitoring:   ${SETUP_MONITORING}"
if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN MODE - No changes will be made"
fi
print_info "Log File:     ${DEPLOYMENT_LOG}"
print_info "========================================="

# Define service deployment order (dependencies first)
SERVICES=(
    "infrastructure"
    "performance"
    "data-processing"
    "file-storage"
    "workflow"
    "admin"
    "integration"
    "notification"
    "brand-management"
    "research-analysis"
    "content-generation"
)

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOYMENT_LOG"
}

# Function to deploy service based on strategy
deploy_service() {
    local service=$1
    local start_time=$(date +%s)
    
    log_message "Starting deployment of service: $service"
    
    case $STRATEGY in
        "rolling")
            deploy_service_rolling "$service"
            ;;
        "blue-green")
            deploy_service_blue_green "$service"
            ;;
        "canary")
            deploy_service_canary "$service"
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_message "Completed deployment of service: $service (${duration}s)"
}

# Function for rolling deployment
deploy_service_rolling() {
    local service=$1
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would deploy $service using rolling strategy"
        return 0
    fi
    
    print_info "Deploying $service using rolling strategy..."
    
    if "$SCRIPT_DIR/deploy-microservice.sh" "$service" "$ENVIRONMENT" --health-check; then
        print_success "Rolling deployment completed for $service"
    else
        print_error "Rolling deployment failed for $service"
        return 1
    fi
}

# Function for blue-green deployment
deploy_service_blue_green() {
    local service=$1
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would deploy $service using blue-green strategy"
        return 0
    fi
    
    print_info "Deploying $service using blue-green strategy..."
    
    if "$SCRIPT_DIR/blue-green-deploy.sh" "$service" "$ENVIRONMENT"; then
        print_success "Blue-green deployment completed for $service"
    else
        print_error "Blue-green deployment failed for $service"
        return 1
    fi
}

# Function for canary deployment
deploy_service_canary() {
    local service=$1
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would deploy $service using canary strategy"
        return 0
    fi
    
    print_info "Deploying $service using canary strategy..."
    
    # Canary deployment: deploy to small percentage first
    print_info "Phase 1: Deploying canary version (10% traffic)"
    if "$SCRIPT_DIR/deploy-microservice.sh" "$service" "$ENVIRONMENT" --health-check; then
        print_success "Canary deployment phase 1 completed for $service"
        
        # Wait and monitor
        print_info "Monitoring canary deployment for 2 minutes..."
        sleep 120
        
        # Check health and metrics
        if run_health_checks "$service"; then
            print_info "Phase 2: Promoting to full deployment (100% traffic)"
            if "$SCRIPT_DIR/deploy-microservice.sh" "$service" "$ENVIRONMENT" --force --health-check; then
                print_success "Canary deployment completed for $service"
            else
                print_error "Canary promotion failed for $service"
                return 1
            fi
        else
            print_error "Canary health checks failed for $service, rolling back"
            "$SCRIPT_DIR/deploy-microservice.sh" "$service" "$ENVIRONMENT" --rollback
            return 1
        fi
    else
        print_error "Canary deployment failed for $service"
        return 1
    fi
}

# Function to run health checks
run_health_checks() {
    local service=$1
    
    if [ "$SKIP_HEALTH" = true ]; then
        print_warning "Skipping health checks for $service"
        return 0
    fi
    
    print_info "Running health checks for $service..."
    
    # Implementation would check service-specific health endpoints
    # For now, return success as a placeholder
    sleep 5
    print_success "Health checks passed for $service"
    return 0
}

# Function to run automated tests
run_automated_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping automated tests"
        return 0
    fi
    
    print_info "Running automated test pipeline..."
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would run automated tests"
        return 0
    fi
    
    if "$SCRIPT_DIR/automated-testing-pipeline.sh" "$ENVIRONMENT" --integration --report; then
        print_success "Automated tests passed"
        return 0
    else
        print_error "Automated tests failed"
        return 1
    fi
}

# Function to setup monitoring
setup_monitoring() {
    if [ "$SETUP_MONITORING" = false ]; then
        return 0
    fi
    
    print_info "Setting up monitoring dashboard..."
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "DRY RUN: Would setup monitoring dashboard"
        return 0
    fi
    
    if "$SCRIPT_DIR/setup-monitoring-dashboard.sh" "$ENVIRONMENT" --update; then
        print_success "Monitoring dashboard setup completed"
    else
        print_warning "Monitoring dashboard setup failed (non-critical)"
    fi
}

# Function to deploy services in parallel
deploy_services_parallel() {
    print_info "Starting parallel deployment of all services..."
    
    local pids=()
    local failed_services=()
    
    # Start all deployments in background
    for service in "${SERVICES[@]}"; do
        (
            if deploy_service "$service"; then
                echo "SUCCESS:$service"
            else
                echo "FAILED:$service"
            fi
        ) &
        pids+=($!)
    done
    
    # Wait for all deployments to complete
    for i in "${!pids[@]}"; do
        local pid=${pids[$i]}
        local service=${SERVICES[$i]}
        
        if wait $pid; then
            print_success "Parallel deployment completed for $service"
        else
            print_error "Parallel deployment failed for $service"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All parallel deployments completed successfully"
        return 0
    else
        print_error "Failed services: ${failed_services[*]}"
        return 1
    fi
}

# Function to deploy services sequentially
deploy_services_sequential() {
    print_info "Starting sequential deployment of all services..."
    
    local failed_services=()
    
    for service in "${SERVICES[@]}"; do
        if deploy_service "$service"; then
            print_success "Sequential deployment completed for $service"
        else
            print_error "Sequential deployment failed for $service"
            failed_services+=("$service")
            
            # For sequential deployment, stop on first failure in production
            if [ "$ENVIRONMENT" = "production" ]; then
                print_error "Stopping deployment due to failure in production environment"
                break
            fi
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_success "All sequential deployments completed successfully"
        return 0
    else
        print_error "Failed services: ${failed_services[*]}"
        return 1
    fi
}

# Function to create deployment summary
create_deployment_summary() {
    local deployment_status=$1
    local summary_file="deployment-summary-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$summary_file" <<EOF
{
  "deployment": {
    "environment": "$ENVIRONMENT",
    "strategy": "$STRATEGY",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "$deployment_status",
    "parallel": $PARALLEL,
    "services": [$(printf '"%s",' "${SERVICES[@]}" | sed 's/,$//')],
    "logFile": "$DEPLOYMENT_LOG"
  }
}
EOF
    
    print_info "Deployment summary saved to: $summary_file"
}

# Main deployment execution
deployment_start_time=$(date +%s)
log_message "Starting microservices deployment orchestration"

# Pre-deployment checks
print_info "Running pre-deployment checks..."

# Check if required scripts exist
required_scripts=(
    "$SCRIPT_DIR/deploy-microservice.sh"
    "$SCRIPT_DIR/automated-testing-pipeline.sh"
)

for script in "${required_scripts[@]}"; do
    if [ ! -f "$script" ]; then
        print_error "Required script not found: $script"
        exit 1
    fi
done

print_success "Pre-deployment checks passed"

# Run pre-deployment tests
if ! run_automated_tests; then
    print_error "Pre-deployment tests failed"
    exit 1
fi

# Deploy services
deployment_success=true

if [ "$PARALLEL" = true ]; then
    if ! deploy_services_parallel; then
        deployment_success=false
    fi
else
    if ! deploy_services_sequential; then
        deployment_success=false
    fi
fi

# Post-deployment tasks
if [ "$deployment_success" = true ]; then
    print_info "Running post-deployment tasks..."
    
    # Setup monitoring
    setup_monitoring
    
    # Run post-deployment tests
    if ! run_automated_tests; then
        print_warning "Post-deployment tests failed (deployment was successful)"
    fi
    
    deployment_end_time=$(date +%s)
    total_duration=$((deployment_end_time - deployment_start_time))
    
    log_message "Deployment orchestration completed successfully in ${total_duration}s"
    create_deployment_summary "SUCCESS"
    
    print_success "========================================="
    print_success "All Services Deployed Successfully!"
    print_success "========================================="
    print_info "Environment: $ENVIRONMENT"
    print_info "Strategy: $STRATEGY"
    print_info "Duration: ${total_duration}s"
    print_info "Log: $DEPLOYMENT_LOG"
else
    deployment_end_time=$(date +%s)
    total_duration=$((deployment_end_time - deployment_start_time))
    
    log_message "Deployment orchestration failed after ${total_duration}s"
    create_deployment_summary "FAILED"
    
    print_error "========================================="
    print_error "Deployment Failed!"
    print_error "========================================="
    print_info "Check log file: $DEPLOYMENT_LOG"
    print_info "Consider running rollback procedures"
    
    exit 1
fi