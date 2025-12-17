#!/bin/bash

# Bayon CoAgent - Split Template Validation Script
# This script validates the split CloudFormation templates

set -e

# Configuration
TEMPLATES_DIR="infrastructure/cloudformation"
REGION=${AWS_DEFAULT_REGION:-us-east-1}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation counters
TOTAL_TEMPLATES=0
VALID_TEMPLATES=0
INVALID_TEMPLATES=0

log_info "Starting CloudFormation template validation..."

# Find all YAML templates
TEMPLATE_FILES=($(find "$TEMPLATES_DIR" -name "*.yaml" -o -name "*.yml" | sort))

if [[ ${#TEMPLATE_FILES[@]} -eq 0 ]]; then
    log_error "No CloudFormation templates found in $TEMPLATES_DIR"
    exit 1
fi

log_info "Found ${#TEMPLATE_FILES[@]} template(s) to validate"

# Validate each template
for template in "${TEMPLATE_FILES[@]}"; do
    TOTAL_TEMPLATES=$((TOTAL_TEMPLATES + 1))
    template_name=$(basename "$template")
    
    log_info "Validating template: $template_name"
    
    # Check if file exists and is readable
    if [[ ! -r "$template" ]]; then
        log_error "Cannot read template file: $template"
        INVALID_TEMPLATES=$((INVALID_TEMPLATES + 1))
        continue
    fi
    
    # Check file size (warn if over 1MB)
    file_size=$(stat -f%z "$template" 2>/dev/null || stat -c%s "$template" 2>/dev/null || echo "0")
    if [[ $file_size -gt 1048576 ]]; then
        log_warning "Template $template_name is large ($(($file_size / 1024))KB) - consider further splitting"
    fi
    
    # Count lines (warn if over 1000)
    line_count=$(wc -l < "$template")
    if [[ $line_count -gt 1000 ]]; then
        log_warning "Template $template_name has $line_count lines - consider splitting for better performance"
    fi
    
    # Validate YAML syntax
    if ! python3 -c "import yaml; yaml.safe_load(open('$template'))" 2>/dev/null; then
        log_error "Invalid YAML syntax in $template_name"
        INVALID_TEMPLATES=$((INVALID_TEMPLATES + 1))
        continue
    fi
    
    # Validate CloudFormation template
    validation_output=$(aws cloudformation validate-template \
        --template-body "file://$template" \
        --region "$REGION" 2>&1)
    
    if [[ $? -eq 0 ]]; then
        log_success "✓ $template_name is valid"
        VALID_TEMPLATES=$((VALID_TEMPLATES + 1))
        
        # Extract and display template info
        description=$(echo "$validation_output" | jq -r '.Description // "No description"' 2>/dev/null || echo "No description")
        parameters=$(echo "$validation_output" | jq -r '.Parameters | length' 2>/dev/null || echo "0")
        
        log_info "  Description: $description"
        log_info "  Parameters: $parameters"
        
    else
        log_error "✗ $template_name validation failed:"
        echo "$validation_output" | sed 's/^/    /'
        INVALID_TEMPLATES=$((INVALID_TEMPLATES + 1))
    fi
    
    echo ""
done

# Validate template relationships and dependencies
log_info "Validating template relationships..."

# Check if main template exists
MAIN_TEMPLATE="$TEMPLATES_DIR/main-template.yaml"
if [[ -f "$MAIN_TEMPLATE" ]]; then
    log_info "Checking nested stack references in main template..."
    
    # Extract nested stack template URLs
    nested_templates=$(grep -o "TemplateURL:.*\.yaml" "$MAIN_TEMPLATE" | sed 's/TemplateURL: *\.\///' || true)
    
    for nested_template in $nested_templates; do
        nested_path="$TEMPLATES_DIR/$nested_template"
        if [[ -f "$nested_path" ]]; then
            log_success "✓ Nested template found: $nested_template"
        else
            log_error "✗ Nested template missing: $nested_template"
            INVALID_TEMPLATES=$((INVALID_TEMPLATES + 1))
        fi
    done
else
    log_warning "Main template not found: $MAIN_TEMPLATE"
fi

# Check for circular dependencies (basic check)
log_info "Checking for potential circular dependencies..."

# This is a simplified check - in a real scenario, you'd want more sophisticated dependency analysis
for template in "${TEMPLATE_FILES[@]}"; do
    template_name=$(basename "$template" .yaml)
    
    # Check if template references itself
    if grep -q "$template_name" "$template" 2>/dev/null; then
        log_warning "Potential self-reference in $template_name (manual review recommended)"
    fi
done

# Performance analysis
log_info "Analyzing template performance characteristics..."

total_size=0
total_lines=0

for template in "${TEMPLATE_FILES[@]}"; do
    file_size=$(stat -f%z "$template" 2>/dev/null || stat -c%s "$template" 2>/dev/null || echo "0")
    line_count=$(wc -l < "$template")
    
    total_size=$((total_size + file_size))
    total_lines=$((total_lines + line_count))
done

log_info "Performance Summary:"
log_info "  Total templates: $TOTAL_TEMPLATES"
log_info "  Total size: $(($total_size / 1024))KB"
log_info "  Total lines: $total_lines"
log_info "  Average lines per template: $(($total_lines / $TOTAL_TEMPLATES))"

# Compare with original template if it exists
ORIGINAL_TEMPLATE="template.yaml"
if [[ -f "$ORIGINAL_TEMPLATE" ]]; then
    original_size=$(stat -f%z "$ORIGINAL_TEMPLATE" 2>/dev/null || stat -c%s "$ORIGINAL_TEMPLATE" 2>/dev/null || echo "0")
    original_lines=$(wc -l < "$ORIGINAL_TEMPLATE")
    
    log_info "Comparison with original template:"
    log_info "  Original size: $(($original_size / 1024))KB → Split size: $(($total_size / 1024))KB"
    log_info "  Original lines: $original_lines → Split lines: $total_lines"
    log_info "  Largest split template: $(find "$TEMPLATES_DIR" -name "*.yaml" -exec wc -l {} + | sort -n | tail -1 | awk '{print $1}') lines"
fi

# Final summary
echo ""
log_info "Validation Summary:"
log_success "Valid templates: $VALID_TEMPLATES"
if [[ $INVALID_TEMPLATES -gt 0 ]]; then
    log_error "Invalid templates: $INVALID_TEMPLATES"
else
    log_success "Invalid templates: $INVALID_TEMPLATES"
fi

# Exit with appropriate code
if [[ $INVALID_TEMPLATES -eq 0 ]]; then
    log_success "All templates are valid! ✨"
    exit 0
else
    log_error "Some templates have validation errors. Please fix them before deployment."
    exit 1
fi