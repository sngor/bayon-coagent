#!/bin/bash

# Monitoring Dashboard Setup Script for Microservices
# Usage: ./setup-monitoring-dashboard.sh <environment> [options]

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
    echo "  --dashboard-name    Custom dashboard name"
    echo "  --update           Update existing dashboard"
    echo "  --delete           Delete existing dashboard"
    echo "  --export           Export dashboard configuration"
    echo "  --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production --dashboard-name \"Production Microservices\""
    echo "  $0 development --update"
}

# Parse arguments
ENVIRONMENT=""
DASHBOARD_NAME=""
UPDATE_DASHBOARD=false
DELETE_DASHBOARD=false
EXPORT_DASHBOARD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dashboard-name)
            DASHBOARD_NAME="$2"
            shift 2
            ;;
        --update)
            UPDATE_DASHBOARD=true
            shift
            ;;
        --delete)
            DELETE_DASHBOARD=true
            shift
            ;;
        --export)
            EXPORT_DASHBOARD=true
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

# Set default dashboard name if not provided
if [ -z "$DASHBOARD_NAME" ]; then
    DASHBOARD_NAME="Bayon CoAgent Microservices - ${ENVIRONMENT^}"
fi

# Set AWS configuration
PROFILE=${AWS_PROFILE:-default}
REGION=${AWS_REGION:-us-west-2}
STACK_NAME="bayon-coagent-${ENVIRONMENT}"

print_info "========================================="
print_info "Monitoring Dashboard Setup"
print_info "========================================="
print_info "Environment:    ${ENVIRONMENT}"
print_info "Dashboard Name: ${DASHBOARD_NAME}"
print_info "AWS Profile:    ${PROFILE}"
print_info "AWS Region:     ${REGION}"
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

# Function to get stack resources
get_stack_resources() {
    aws cloudformation describe-stack-resources \
        --stack-name $STACK_NAME \
        --profile $PROFILE \
        --region $REGION \
        --output json 2>/dev/null || echo '{"StackResources": []}'
}

# Function to get Lambda functions
get_lambda_functions() {
    local resources=$(get_stack_resources)
    echo "$resources" | jq -r '.StackResources[] | select(.ResourceType == "AWS::Lambda::Function") | .PhysicalResourceId'
}

# Function to get API Gateways
get_api_gateways() {
    local resources=$(get_stack_resources)
    echo "$resources" | jq -r '.StackResources[] | select(.ResourceType == "AWS::ApiGateway::RestApi") | .PhysicalResourceId'
}

# Function to get DynamoDB tables
get_dynamodb_tables() {
    local resources=$(get_stack_resources)
    echo "$resources" | jq -r '.StackResources[] | select(.ResourceType == "AWS::DynamoDB::Table") | .PhysicalResourceId'
}

# Function to create dashboard configuration
create_dashboard_config() {
    local lambda_functions=$(get_lambda_functions)
    local api_gateways=$(get_api_gateways)
    local dynamodb_tables=$(get_dynamodb_tables)
    
    print_info "Creating dashboard configuration..."
    
    # Start building the dashboard JSON
    cat > /tmp/dashboard-config.json <<EOF
{
    "widgets": [
        {
            "type": "text",
            "x": 0,
            "y": 0,
            "width": 24,
            "height": 1,
            "properties": {
                "markdown": "# ${DASHBOARD_NAME}\n\nOverview of microservices health, performance, and metrics for the ${ENVIRONMENT} environment."
            }
        }
EOF
    
    local widget_y=1
    
    # Add Lambda function metrics
    if [ -n "$lambda_functions" ]; then
        print_info "Adding Lambda function metrics..."
        
        # Lambda Invocations widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 0,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        local first_lambda=true
        while IFS= read -r function_name; do
            if [ -n "$function_name" ]; then
                if [ "$first_lambda" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_lambda=false
                echo "                    [ \"AWS/Lambda\", \"Invocations\", \"FunctionName\", \"$function_name\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$lambda_functions"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "Lambda Invocations",
                "period": 300
            }
        }
EOF
        
        # Lambda Errors widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 12,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        first_lambda=true
        while IFS= read -r function_name; do
            if [ -n "$function_name" ]; then
                if [ "$first_lambda" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_lambda=false
                echo "                    [ \"AWS/Lambda\", \"Errors\", \"FunctionName\", \"$function_name\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$lambda_functions"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "Lambda Errors",
                "period": 300
            }
        }
EOF
        
        widget_y=$((widget_y + 6))
        
        # Lambda Duration widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 0,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        first_lambda=true
        while IFS= read -r function_name; do
            if [ -n "$function_name" ]; then
                if [ "$first_lambda" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_lambda=false
                echo "                    [ \"AWS/Lambda\", \"Duration\", \"FunctionName\", \"$function_name\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$lambda_functions"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "Lambda Duration (ms)",
                "period": 300
            }
        }
EOF
        
        # Lambda Throttles widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 12,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        first_lambda=true
        while IFS= read -r function_name; do
            if [ -n "$function_name" ]; then
                if [ "$first_lambda" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_lambda=false
                echo "                    [ \"AWS/Lambda\", \"Throttles\", \"FunctionName\", \"$function_name\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$lambda_functions"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "Lambda Throttles",
                "period": 300
            }
        }
EOF
        
        widget_y=$((widget_y + 6))
    fi
    
    # Add API Gateway metrics
    if [ -n "$api_gateways" ]; then
        print_info "Adding API Gateway metrics..."
        
        # API Gateway Requests widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 0,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        local first_api=true
        while IFS= read -r api_id; do
            if [ -n "$api_id" ]; then
                if [ "$first_api" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_api=false
                echo "                    [ \"AWS/ApiGateway\", \"Count\", \"ApiName\", \"$api_id\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$api_gateways"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "API Gateway Requests",
                "period": 300
            }
        }
EOF
        
        # API Gateway Latency widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 12,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        first_api=true
        while IFS= read -r api_id; do
            if [ -n "$api_id" ]; then
                if [ "$first_api" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_api=false
                echo "                    [ \"AWS/ApiGateway\", \"Latency\", \"ApiName\", \"$api_id\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$api_gateways"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "API Gateway Latency (ms)",
                "period": 300
            }
        }
EOF
        
        widget_y=$((widget_y + 6))
        
        # API Gateway Errors widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 0,
            "y": $widget_y,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        first_api=true
        while IFS= read -r api_id; do
            if [ -n "$api_id" ]; then
                if [ "$first_api" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_api=false
                echo "                    [ \"AWS/ApiGateway\", \"4XXError\", \"ApiName\", \"$api_id\" ]," >> /tmp/dashboard-config.json
                echo "                    [ \"AWS/ApiGateway\", \"5XXError\", \"ApiName\", \"$api_id\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$api_gateways"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "API Gateway Errors",
                "period": 300
            }
        }
EOF
        
        widget_y=$((widget_y + 6))
    fi
    
    # Add DynamoDB metrics
    if [ -n "$dynamodb_tables" ]; then
        print_info "Adding DynamoDB metrics..."
        
        # DynamoDB Read/Write Capacity widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 0,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        local first_table=true
        while IFS= read -r table_name; do
            if [ -n "$table_name" ]; then
                if [ "$first_table" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_table=false
                echo "                    [ \"AWS/DynamoDB\", \"ConsumedReadCapacityUnits\", \"TableName\", \"$table_name\" ]," >> /tmp/dashboard-config.json
                echo "                    [ \"AWS/DynamoDB\", \"ConsumedWriteCapacityUnits\", \"TableName\", \"$table_name\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$dynamodb_tables"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "DynamoDB Capacity Units",
                "period": 300
            }
        }
EOF
        
        # DynamoDB Throttles widget
        cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 12,
            "y": $widget_y,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
EOF
        
        first_table=true
        while IFS= read -r table_name; do
            if [ -n "$table_name" ]; then
                if [ "$first_table" = false ]; then
                    echo "," >> /tmp/dashboard-config.json
                fi
                first_table=false
                echo "                    [ \"AWS/DynamoDB\", \"ReadThrottles\", \"TableName\", \"$table_name\" ]," >> /tmp/dashboard-config.json
                echo "                    [ \"AWS/DynamoDB\", \"WriteThrottles\", \"TableName\", \"$table_name\" ]" >> /tmp/dashboard-config.json
            fi
        done <<< "$dynamodb_tables"
        
        cat >> /tmp/dashboard-config.json <<EOF
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "DynamoDB Throttles",
                "period": 300
            }
        }
EOF
        
        widget_y=$((widget_y + 6))
    fi
    
    # Add custom application metrics
    cat >> /tmp/dashboard-config.json <<EOF
        ,{
            "type": "metric",
            "x": 0,
            "y": $widget_y,
            "width": 24,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "ContentGeneration" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "ResearchAnalysis" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "BrandManagement" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "Notification" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "Integration" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "DataProcessing" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "Admin" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "FileStorage" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "Workflow" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "Performance" ],
                    [ "BayonCoAgent/${ENVIRONMENT}", "ServiceHealth", "Service", "Infrastructure" ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$REGION",
                "title": "Microservice Health Status",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 1
                    }
                }
            }
        }
EOF
    
    # Close the widgets array and dashboard JSON
    cat >> /tmp/dashboard-config.json <<EOF
    ]
}
EOF
    
    print_success "Dashboard configuration created"
}

# Function to create or update dashboard
create_dashboard() {
    print_info "Creating CloudWatch dashboard..."
    
    create_dashboard_config
    
    if aws cloudwatch put-dashboard \
        --dashboard-name "$DASHBOARD_NAME" \
        --dashboard-body file:///tmp/dashboard-config.json \
        --profile $PROFILE \
        --region $REGION \
        >/dev/null 2>&1; then
        print_success "Dashboard created successfully: $DASHBOARD_NAME"
        
        # Get dashboard URL
        local encoded_name=$(echo "$DASHBOARD_NAME" | sed 's/ /%20/g')
        local dashboard_url="https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${encoded_name}"
        print_info "Dashboard URL: $dashboard_url"
    else
        print_error "Failed to create dashboard"
        return 1
    fi
    
    # Clean up temporary file
    rm -f /tmp/dashboard-config.json
}

# Function to delete dashboard
delete_dashboard() {
    print_warning "Deleting CloudWatch dashboard: $DASHBOARD_NAME"
    
    if aws cloudwatch delete-dashboards \
        --dashboard-names "$DASHBOARD_NAME" \
        --profile $PROFILE \
        --region $REGION \
        >/dev/null 2>&1; then
        print_success "Dashboard deleted successfully"
    else
        print_error "Failed to delete dashboard (it may not exist)"
        return 1
    fi
}

# Function to export dashboard
export_dashboard() {
    print_info "Exporting dashboard configuration..."
    
    local export_file="dashboard-export-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S).json"
    
    if aws cloudwatch get-dashboard \
        --dashboard-name "$DASHBOARD_NAME" \
        --profile $PROFILE \
        --region $REGION \
        --query 'DashboardBody' \
        --output text > "$export_file" 2>/dev/null; then
        print_success "Dashboard exported to: $export_file"
    else
        print_error "Failed to export dashboard (it may not exist)"
        return 1
    fi
}

# Function to setup alarms
setup_alarms() {
    print_info "Setting up CloudWatch alarms..."
    
    local lambda_functions=$(get_lambda_functions)
    
    # Create alarms for each Lambda function
    while IFS= read -r function_name; do
        if [ -n "$function_name" ]; then
            print_info "Creating alarms for function: $function_name"
            
            # Error rate alarm
            aws cloudwatch put-metric-alarm \
                --alarm-name "${function_name}-ErrorRate-${ENVIRONMENT}" \
                --alarm-description "Error rate alarm for $function_name" \
                --metric-name Errors \
                --namespace AWS/Lambda \
                --statistic Sum \
                --period 300 \
                --threshold 5 \
                --comparison-operator GreaterThanThreshold \
                --evaluation-periods 2 \
                --dimensions Name=FunctionName,Value="$function_name" \
                --profile $PROFILE \
                --region $REGION \
                >/dev/null 2>&1 || true
            
            # Duration alarm
            aws cloudwatch put-metric-alarm \
                --alarm-name "${function_name}-Duration-${ENVIRONMENT}" \
                --alarm-description "Duration alarm for $function_name" \
                --metric-name Duration \
                --namespace AWS/Lambda \
                --statistic Average \
                --period 300 \
                --threshold 10000 \
                --comparison-operator GreaterThanThreshold \
                --evaluation-periods 2 \
                --dimensions Name=FunctionName,Value="$function_name" \
                --profile $PROFILE \
                --region $REGION \
                >/dev/null 2>&1 || true
        fi
    done
    
    print_success "CloudWatch alarms created"
}

# Main execution
if [ "$DELETE_DASHBOARD" = true ]; then
    delete_dashboard
elif [ "$EXPORT_DASHBOARD" = true ]; then
    export_dashboard
else
    if [ "$UPDATE_DASHBOARD" = true ]; then
        print_info "Updating existing dashboard..."
    fi
    
    create_dashboard
    setup_alarms
    
    print_success "========================================="
    print_success "Monitoring Dashboard Setup Complete!"
    print_success "========================================="
    print_info "Dashboard Name: $DASHBOARD_NAME"
    print_info "Environment: $ENVIRONMENT"
    print_info ""
    print_info "Next steps:"
    print_info "1. Visit the CloudWatch console to view your dashboard"
    print_info "2. Customize widgets and metrics as needed"
    print_info "3. Set up SNS notifications for alarms"
    print_info "4. Configure additional custom metrics in your applications"
fi