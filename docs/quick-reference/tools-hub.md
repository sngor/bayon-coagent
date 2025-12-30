# Tools Hub Quick Reference

## Overview

The Tools Hub (`/tools`) provides comprehensive financial analysis and deal evaluation tools for real estate professionals.

## Calculator (`/tools/calculator`)

### Payment Calculator Tab

**Purpose**: Calculate complete monthly mortgage payments with detailed breakdown

**Key Features**:
- Home price and down payment inputs
- Loan term selection (15, 20, 25, 30 years)
- Interest rate configuration
- Property tax and insurance percentages
- PMI calculation (auto-disabled when down payment ≥ 20%)
- HOA fees inclusion
- Real-time payment breakdown display
- First-year amortization schedule

**Outputs**:
- Total monthly payment
- Principal & interest breakdown
- Property taxes, insurance, PMI, HOA breakdown
- Loan amount, total interest, total payment summary

### Affordability Analysis Tab

**Purpose**: Determine maximum home price based on income and debt

**Key Features**:
- Monthly gross income input
- Existing debt payments tracking
- Available down payment specification
- Debt-to-income ratio calculations
- Visual progress bars for financial ratios
- Personalized recommendations

**Calculations**:
- Front-end ratio (housing costs ÷ income, recommended ≤ 28%)
- Back-end ratio (total debt ÷ income, recommended ≤ 36%)
- Maximum home price (based on stricter ratio)
- Recommended home price (80% of maximum for conservative approach)

**Recommendations**:
- Income improvement suggestions
- Debt reduction advice
- Down payment optimization
- Financial health assessment

### Loan Comparison Tab

**Purpose**: Compare different loan scenarios side-by-side

**Default Scenarios**:
- 30-Year Fixed (6.5% rate)
- 15-Year Fixed (6.0% rate)
- 5/1 ARM (5.8% rate)

**Comparison Metrics**:
- Monthly payment amounts
- Total interest over loan term
- Total payment (principal + interest)
- Rate and term differences

**Insights**:
- Lowest monthly payment option
- Lowest total interest option
- Savings analysis between scenarios

## ROI Calculator (`/tools/roi`)

**Purpose**: Calculate return on investment for renovation projects

**Features**:
- Project cost estimation
- Property value increase calculation
- ROI percentage and dollar return
- Payback period analysis

## Property Valuation (`/tools/valuation`)

**Purpose**: AI-powered property value estimation

**Features**:
- Automated valuation models (AVM)
- Comparable sales analysis
- Market trend integration
- Confidence scoring

## Document Scanner (`/tools/document-scanner`)

**Purpose**: Scan and process real estate documents

**Features**:
- OCR text extraction
- Document type recognition
- Key information parsing
- Digital storage and organization

## Common Workflows

### Client Consultation Workflow

1. **Start with Affordability Analysis**
   - Input client's financial information
   - Review recommended price range
   - Discuss debt-to-income ratios

2. **Move to Payment Calculator**
   - Use recommended price as home price
   - Adjust down payment scenarios
   - Show complete payment breakdown

3. **Compare Loan Options**
   - Review different loan scenarios
   - Explain interest savings vs payment differences
   - Help client choose optimal loan structure

4. **Export and Share**
   - Export calculations for client records
   - Share calculator link for client reference

### Investment Analysis Workflow

1. **Property Valuation**
   - Get current market value estimate
   - Review comparable sales data

2. **ROI Analysis**
   - Calculate renovation return potential
   - Analyze different improvement scenarios

3. **Financing Analysis**
   - Use mortgage calculator for financing options
   - Compare cash vs financed scenarios

## Best Practices

### Mortgage Calculator Tips

- **Always Include All Costs**: Property taxes, insurance, PMI, and HOA fees for accurate monthly payments
- **Show Multiple Down Payment Scenarios**: Help clients understand the impact of different down payment amounts
- **Use Amortization Schedule**: Explain how equity builds over time and the principal/interest split
- **Compare Loan Terms**: Show 15-year vs 30-year loans to demonstrate interest savings vs payment differences

### Client Education Points

- **28/36 Rule**: Housing costs should not exceed 28% of gross income, total debt should not exceed 36%
- **PMI Elimination**: Explain how PMI is removed when loan balance reaches 80% of home value
- **Interest vs Principal**: Use amortization schedule to show how payments shift over time
- **Total Cost of Ownership**: Include all monthly costs, not just principal and interest

## Keyboard Shortcuts

- **Tab Navigation**: Use Tab key to move between input fields
- **Enter**: Submit forms or move to next field
- **Escape**: Close modals or cancel edits

## Export Options

- **JSON Export**: Raw calculation data for integration with other tools
- **URL Sharing**: Share calculator with pre-filled values
- **Print-Friendly**: Clean layout for printing client reports

## Integration Points

- **Client Dashboards**: Embed calculator widgets in client portals
- **Library**: Save calculations as reports for future reference
- **CRM Systems**: Export data to external CRM platforms

## Troubleshooting

### Common Issues

- **PMI Not Calculating**: Check that down payment is less than 20% of home price
- **Negative Affordability**: Reduce debt payments or increase income in analysis
- **Export Not Working**: Ensure browser allows file downloads

### Validation Rules

- **Home Price**: Must be greater than $0
- **Down Payment**: Cannot exceed home price
- **Interest Rate**: Must be between 0.1% and 30%
- **Income**: Must be greater than $0 for affordability analysis

## Related Documentation

- [Mortgage Calculator Feature Guide](../features/mortgage-calculator.md)
- [Tools Hub Architecture](../architecture/tools-hub.md)
- [Client Dashboard Integration](../features/client-dashboards.md)
- [Financial Calculations API](../api/financial-calculations.md)