#!/bin/bash

# Automated Testing Pipeline for Microservices
# Usage: ./automated-testing-pipeline.sh <environment> [options]

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
    echo "  --unit-tests    Run unit tests only"
    echo "  --integration   Run integration tests only"
    echo "  --property      Run property-based tests only"
    echo "  --performance   Run performance tests"
    echo "  --security      Run security tests"
    echo "  --all           Run all test suites (default)"
    echo "  --parallel      Run tests in parallel"
    echo "  --report        Generate detailed test report"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development --all --report"
    echo "  $0 production --integration --performance"
}

# Parse arguments
ENVIRONMENT=""
RUN_UNIT=false
RUN_INTEGRATION=false
RUN_PROPERTY=false
RUN_PERFORMANCE=false
RUN_SECURITY=false
RUN_ALL=true
PARALLEL=false
GENERATE_REPORT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --unit-tests)
            RUN_UNIT=true
            RUN_ALL=false
            shift
            ;;
        --integration)
            RUN_INTEGRATION=true
            RUN_ALL=false
            shift
            ;;
        --property)
            RUN_PROPERTY=true
            RUN_ALL=false
            shift
            ;;
        --performance)
            RUN_PERFORMANCE=true
            RUN_ALL=false
            shift
            ;;
        --security)
            RUN_SECURITY=true
            RUN_ALL=false
            shift
            ;;
        --all)
            RUN_ALL=true
            shift
            ;;
        --parallel)
            PARALLEL=true
            shift
            ;;
        --report)
            GENERATE_REPORT=true
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

# Set test configuration based on flags
if [ "$RUN_ALL" = true ]; then
    RUN_UNIT=true
    RUN_INTEGRATION=true
    RUN_PROPERTY=true
    RUN_PERFORMANCE=true
    RUN_SECURITY=true
fi

# Set AWS configuration
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-west-2}
STACK_NAME="bayon-coagent-${ENVIRONMENT}"

# Test results directory
TEST_RESULTS_DIR="test-results/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$TEST_RESULTS_DIR"

print_info "========================================="
print_info "Automated Testing Pipeline"
print_info "========================================="
print_info "Environment:  ${ENVIRONMENT}"
print_info "AWS Profile:  ${PROFILE}"
print_info "AWS Region:   ${REGION}"
print_info "Results Dir:  ${TEST_RESULTS_DIR}"
print_info "Parallel:     ${PARALLEL}"
print_info "========================================="

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

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

print_success "Prerequisites check passed"

# Function to run unit tests
run_unit_tests() {
    print_info "Running unit tests..."
    
    local start_time=$(date +%s)
    local result_file="$TEST_RESULTS_DIR/unit-tests.json"
    
    if [ "$PARALLEL" = true ]; then
        npm test -- --maxWorkers=4 --outputFile="$result_file" --json > "$TEST_RESULTS_DIR/unit-tests.log" 2>&1 &
        local unit_pid=$!
        echo $unit_pid > "$TEST_RESULTS_DIR/unit-tests.pid"
    else
        if npm test -- --outputFile="$result_file" --json > "$TEST_RESULTS_DIR/unit-tests.log" 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_success "Unit tests passed (${duration}s)"
            echo "PASSED" > "$TEST_RESULTS_DIR/unit-tests.status"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_error "Unit tests failed (${duration}s)"
            echo "FAILED" > "$TEST_RESULTS_DIR/unit-tests.status"
            return 1
        fi
    fi
}

# Function to run integration tests
run_integration_tests() {
    print_info "Running integration tests..."
    
    local start_time=$(date +%s)
    local result_file="$TEST_RESULTS_DIR/integration-tests.json"
    
    # Set environment variables for integration tests
    export TEST_ENVIRONMENT="$ENVIRONMENT"
    export AWS_PROFILE="$PROFILE"
    export AWS_REGION="$REGION"
    
    if [ "$PARALLEL" = true ]; then
        npm run test:integration -- --outputFile="$result_file" --json > "$TEST_RESULTS_DIR/integration-tests.log" 2>&1 &
        local integration_pid=$!
        echo $integration_pid > "$TEST_RESULTS_DIR/integration-tests.pid"
    else
        if npm run test:integration -- --outputFile="$result_file" --json > "$TEST_RESULTS_DIR/integration-tests.log" 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_success "Integration tests passed (${duration}s)"
            echo "PASSED" > "$TEST_RESULTS_DIR/integration-tests.status"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_error "Integration tests failed (${duration}s)"
            echo "FAILED" > "$TEST_RESULTS_DIR/integration-tests.status"
            return 1
        fi
    fi
}

# Function to run property-based tests
run_property_tests() {
    print_info "Running property-based tests..."
    
    local start_time=$(date +%s)
    local result_file="$TEST_RESULTS_DIR/property-tests.json"
    
    if [ "$PARALLEL" = true ]; then
        npm run test:property -- --outputFile="$result_file" --json > "$TEST_RESULTS_DIR/property-tests.log" 2>&1 &
        local property_pid=$!
        echo $property_pid > "$TEST_RESULTS_DIR/property-tests.pid"
    else
        if npm run test:property -- --outputFile="$result_file" --json > "$TEST_RESULTS_DIR/property-tests.log" 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_success "Property-based tests passed (${duration}s)"
            echo "PASSED" > "$TEST_RESULTS_DIR/property-tests.status"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_error "Property-based tests failed (${duration}s)"
            echo "FAILED" > "$TEST_RESULTS_DIR/property-tests.status"
            return 1
        fi
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_info "Running performance tests..."
    
    local start_time=$(date +%s)
    local result_file="$TEST_RESULTS_DIR/performance-tests.json"
    
    # Get API Gateway endpoints
    local api_endpoints=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --profile $PROFILE \
        --region $REGION \
        --query 'Stacks[0].Outputs[?contains(OutputKey, `ApiEndpoint`)].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [ -z "$api_endpoints" ]; then
        print_warning "No API endpoints found for performance testing"
        echo "SKIPPED" > "$TEST_RESULTS_DIR/performance-tests.status"
        return 0
    fi
    
    # Create performance test configuration
    cat > "$TEST_RESULTS_DIR/performance-config.json" <<EOF
{
  "environment": "$ENVIRONMENT",
  "endpoints": [$(echo "$api_endpoints" | sed 's/\t/","/g' | sed 's/^/"/;s/$/"/')]
}
EOF
    
    if [ "$PARALLEL" = true ]; then
        npm run test:performance -- --config="$TEST_RESULTS_DIR/performance-config.json" --outputFile="$result_file" > "$TEST_RESULTS_DIR/performance-tests.log" 2>&1 &
        local performance_pid=$!
        echo $performance_pid > "$TEST_RESULTS_DIR/performance-tests.pid"
    else
        if npm run test:performance -- --config="$TEST_RESULTS_DIR/performance-config.json" --outputFile="$result_file" > "$TEST_RESULTS_DIR/performance-tests.log" 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_success "Performance tests passed (${duration}s)"
            echo "PASSED" > "$TEST_RESULTS_DIR/performance-tests.status"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_error "Performance tests failed (${duration}s)"
            echo "FAILED" > "$TEST_RESULTS_DIR/performance-tests.status"
            return 1
        fi
    fi
}

# Function to run security tests
run_security_tests() {
    print_info "Running security tests..."
    
    local start_time=$(date +%s)
    local result_file="$TEST_RESULTS_DIR/security-tests.json"
    
    if [ "$PARALLEL" = true ]; then
        npm run test:security -- --environment="$ENVIRONMENT" --outputFile="$result_file" > "$TEST_RESULTS_DIR/security-tests.log" 2>&1 &
        local security_pid=$!
        echo $security_pid > "$TEST_RESULTS_DIR/security-tests.pid"
    else
        if npm run test:security -- --environment="$ENVIRONMENT" --outputFile="$result_file" > "$TEST_RESULTS_DIR/security-tests.log" 2>&1; then
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_success "Security tests passed (${duration}s)"
            echo "PASSED" > "$TEST_RESULTS_DIR/security-tests.status"
        else
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            print_error "Security tests failed (${duration}s)"
            echo "FAILED" > "$TEST_RESULTS_DIR/security-tests.status"
            return 1
        fi
    fi
}

# Function to wait for parallel tests
wait_for_parallel_tests() {
    print_info "Waiting for parallel tests to complete..."
    
    local all_passed=true
    
    # Wait for each test suite
    for test_type in unit-tests integration-tests property-tests performance-tests security-tests; do
        local pid_file="$TEST_RESULTS_DIR/${test_type}.pid"
        
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            print_info "Waiting for $test_type (PID: $pid)..."
            
            if wait $pid; then
                print_success "$test_type completed successfully"
                echo "PASSED" > "$TEST_RESULTS_DIR/${test_type}.status"
            else
                print_error "$test_type failed"
                echo "FAILED" > "$TEST_RESULTS_DIR/${test_type}.status"
                all_passed=false
            fi
            
            rm -f "$pid_file"
        fi
    done
    
    return $([ "$all_passed" = true ] && echo 0 || echo 1)
}

# Function to generate test report
generate_test_report() {
    print_info "Generating test report..."
    
    local report_file="$TEST_RESULTS_DIR/test-report.html"
    local summary_file="$TEST_RESULTS_DIR/test-summary.json"
    
    # Create test summary
    cat > "$summary_file" <<EOF
{
  "environment": "$ENVIRONMENT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "results": {
EOF
    
    local first=true
    local total_tests=0
    local passed_tests=0
    
    for test_type in unit-tests integration-tests property-tests performance-tests security-tests; do
        local status_file="$TEST_RESULTS_DIR/${test_type}.status"
        
        if [ -f "$status_file" ]; then
            local status=$(cat "$status_file")
            
            if [ "$first" = false ]; then
                echo "," >> "$summary_file"
            fi
            first=false
            
            echo "    \"$test_type\": \"$status\"" >> "$summary_file"
            
            total_tests=$((total_tests + 1))
            if [ "$status" = "PASSED" ]; then
                passed_tests=$((passed_tests + 1))
            fi
        fi
    done
    
    cat >> "$summary_file" <<EOF
  },
  "summary": {
    "total": $total_tests,
    "passed": $passed_tests,
    "failed": $((total_tests - passed_tests)),
    "success_rate": $(echo "scale=2; $passed_tests * 100 / $total_tests" | bc -l 2>/dev/null || echo "0")
  }
}
EOF
    
    # Generate HTML report
    cat > "$report_file" <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - $ENVIRONMENT</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; }
        .test-suite { margin: 10px 0; padding: 10px; border-left: 4px solid #ccc; }
        .passed { border-left-color: #4CAF50; }
        .failed { border-left-color: #f44336; }
        .skipped { border-left-color: #ff9800; }
        .status { font-weight: bold; }
        .logs { background: #f9f9f9; padding: 10px; margin: 10px 0; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report</h1>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> $total_tests</p>
        <p><strong>Passed:</strong> $passed_tests</p>
        <p><strong>Failed:</strong> $((total_tests - passed_tests))</p>
    </div>
    
    <h2>Test Results</h2>
EOF
    
    # Add test results to HTML report
    for test_type in unit-tests integration-tests property-tests performance-tests security-tests; do
        local status_file="$TEST_RESULTS_DIR/${test_type}.status"
        local log_file="$TEST_RESULTS_DIR/${test_type}.log"
        
        if [ -f "$status_file" ]; then
            local status=$(cat "$status_file")
            local css_class=$(echo "$status" | tr '[:upper:]' '[:lower:]')
            
            cat >> "$report_file" <<EOF
    <div class="test-suite $css_class">
        <h3>$test_type</h3>
        <p class="status">Status: $status</p>
EOF
            
            if [ -f "$log_file" ]; then
                echo "        <div class=\"logs\">" >> "$report_file"
                echo "            <h4>Logs:</h4>" >> "$report_file"
                echo "            <pre>$(tail -20 "$log_file" | sed 's/</\&lt;/g; s/>/\&gt;/g')</pre>" >> "$report_file"
                echo "        </div>" >> "$report_file"
            fi
            
            echo "    </div>" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" <<EOF
</body>
</html>
EOF
    
    print_success "Test report generated: $report_file"
    print_success "Test summary: $summary_file"
}

# Main execution
pipeline_start_time=$(date +%s)

# Run test suites
failed_suites=0

if [ "$RUN_UNIT" = true ]; then
    if ! run_unit_tests; then
        ((failed_suites++))
    fi
fi

if [ "$RUN_INTEGRATION" = true ]; then
    if ! run_integration_tests; then
        ((failed_suites++))
    fi
fi

if [ "$RUN_PROPERTY" = true ]; then
    if ! run_property_tests; then
        ((failed_suites++))
    fi
fi

if [ "$RUN_PERFORMANCE" = true ]; then
    if ! run_performance_tests; then
        ((failed_suites++))
    fi
fi

if [ "$RUN_SECURITY" = true ]; then
    if ! run_security_tests; then
        ((failed_suites++))
    fi
fi

# Wait for parallel tests if running in parallel mode
if [ "$PARALLEL" = true ]; then
    if ! wait_for_parallel_tests; then
        failed_suites=1
    fi
fi

# Generate report if requested
if [ "$GENERATE_REPORT" = true ]; then
    generate_test_report
fi

# Calculate total execution time
pipeline_end_time=$(date +%s)
total_duration=$((pipeline_end_time - pipeline_start_time))

print_info "========================================="
if [ $failed_suites -eq 0 ]; then
    print_success "All tests passed! (${total_duration}s)"
    print_success "Testing Pipeline Complete!"
else
    print_error "$failed_suites test suite(s) failed (${total_duration}s)"
    print_error "Testing Pipeline Failed!"
fi
print_info "========================================="

exit $failed_suites