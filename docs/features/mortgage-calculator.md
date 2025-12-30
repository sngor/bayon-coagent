# Mortgage Calculator Feature Documentation

## Overview

The Mortgage Calculator is a comprehensive financial analysis suite located at `/tools/calculator` that helps real estate agents provide detailed payment calculations, affordability analysis, and loan comparisons for their clients. It has been enhanced from a basic calculator to a full-featured financial planning tool with three distinct analysis modes.

## Features

### Payment Calculator

Complete mortgage payment analysis with detailed breakdown:

- **Loan Details Input**: Home price, down payment, loan term, and interest rate
- **Additional Costs**: Property taxes, home insurance, PMI, and HOA fees
- **Payment Breakdown**: Principal & interest, taxes, insurance, PMI, and HOA fees
- **Loan Summary**: Total loan amount, total interest, and total payment over loan term
- **Amortization Schedule**: First-year payment breakdown showing principal vs interest

### Affordability Analysis

Income-based home price recommendations:

- **Financial Information**: Monthly gross income, existing debt payments, available down payment
- **Debt-to-Income Analysis**: Front-end and back-end ratio calculations with visual progress bars
- **Price Recommendations**: Maximum and recommended home price based on income
- **Financial Ratios**: Visual representation of debt-to-income ratios with recommended thresholds
- **Personalized Recommendations**: AI-powered suggestions for improving affordability

### Loan Comparison

Side-by-side comparison of different loan scenarios:

- **Multiple Loan Types**: 30-year fixed, 15-year fixed, and 5/1 ARM comparisons
- **Payment Analysis**: Monthly payment, total interest, and total payment comparisons
- **Comparison Insights**: Highlights lowest monthly payment and lowest total interest options
- **Scenario Analysis**: Easy comparison of different loan terms and rates

## User Interface

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header: Mortgage Calculator + Export/Share Controls     │
├─────────────────────────────────────────────────────────┤
│ Feature Banner: Best Practices Tips                     │
├─────────────────────────────────────────────────────────┤
│ Tabs: [Payment Calculator] [Affordability] [Comparison] │
├─────────────────────────────────────────────────────────┤
│ Content: Interactive Forms + Real-time Results         │
│ - Payment Tab: Input Form + Results + Amortization     │
│ - Affordability Tab: Financial Info + Analysis         │
│ - Comparison Tab: Loan Scenarios + Insights            │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

```typescript
MortgageCalculatorPage
├── PageHeader (Title + Export/Share Actions)
├── FeatureBanner (Best Practices Tips)
├── AnimatedTabs (3 tabs with smooth transitions)
│   ├── PaymentCalculatorTab
│   │   ├── LoanDetailsCard (Input Form)
│   │   ├── PaymentBreakdownCard (Results Display)
│   │   └── AmortizationScheduleCard (First Year Schedule)
│   ├── AffordabilityTab
│   │   ├── FinancialInformationCard (Income/Debt Inputs)
│   │   └── AffordabilityAnalysisCard (Results + Recommendations)
│   └── ComparisonTab
│       ├── LoanComparisonTable (Side-by-side Analysis)
│       └── ComparisonInsightsCard (Best Options Highlights)
└── Real-time Calculations (useEffect hooks)
```

## Technical Implementation

### Core Components

#### 1. Main Calculator Page (`/src/app/(app)/tools/calculator/page.tsx`)

```typescript
'use client';

interface MortgageCalculation {
    loanAmount: number;
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    paymentBreakdown: {
        principal: number;
        interest: number;
        taxes: number;
        insurance: number;
        pmi: number;
        hoa: number;
    };
    amortizationSchedule: Array<{
        month: number;
        payment: number;
        principal: number;
        interest: number;
        balance: number;
    }>;
}

interface AffordabilityAnalysis {
    maxHomePrice: number;
    recommendedPrice: number;
    monthlyIncome: number;
    debtToIncomeRatio: number;
    frontEndRatio: number;
    backEndRatio: number;
    recommendations: string[];
}

export default function MortgageCalculatorPage() {
    const [activeTab, setActiveTab] = useState<'calculator' | 'affordability' | 'comparison'>('calculator');
    const [calculatorInputs, setCalculatorInputs] = useState(MORTGAGE_DEFAULTS);
    const [affordabilityInputs, setAffordabilityInputs] = useState(AFFORDABILITY_DEFAULTS);
    const [calculation, setCalculation] = useState<MortgageCalculation | null>(null);
    const [affordabilityAnalysis, setAffordabilityAnalysis] = useState<AffordabilityAnalysis | null>(null);

    // Real-time calculations with useEffect hooks
    useEffect(() => {
        calculateMortgage();
    }, [calculatorInputs]);

    useEffect(() => {
        calculateAffordability();
    }, [affordabilityInputs]);
}
```

#### 2. Calculation Logic

**Mortgage Payment Calculation**:
```typescript
const calculateMortgage = () => {
    const loanAmount = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;

    // Monthly principal and interest using standard mortgage formula
    const monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                     (Math.pow(1 + monthlyRate, numPayments) - 1);

    // Additional monthly costs
    const monthlyTaxes = (homePrice * propertyTax / 100) / 12;
    const monthlyInsurance = (homePrice * homeInsurance / 100) / 12;
    const monthlyPMI = downPayment < homePrice * 0.2 ? (loanAmount * pmi / 100) / 12 : 0;

    const totalMonthlyPayment = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyPMI + hoaFees;
};
```

**Affordability Analysis**:
```typescript
const calculateAffordability = () => {
    // 28% rule for housing costs (front-end ratio)
    const maxHousingPayment = monthlyIncome * 0.28;
    
    // 36% rule for total debt (back-end ratio)
    const maxTotalDebt = monthlyIncome * 0.36;
    const maxHousingPaymentWithDebt = maxTotalDebt - monthlyDebts;

    // Use the more conservative limit
    const maxMonthlyPayment = Math.min(maxHousingPayment, maxHousingPaymentWithDebt);
    
    // Calculate maximum home price based on payment capacity
    const maxHomePrice = calculateMaxHomePrice(maxMonthlyPayment, downPaymentAmount, interestRate, loanTerm);
    const recommendedPrice = maxHomePrice * 0.8; // Conservative recommendation
};
```

#### 3. Constants and Defaults (`/src/lib/mortgage-calculator/constants.ts`)

```typescript
export const MORTGAGE_DEFAULTS = {
    homePrice: 400000,
    downPayment: 80000,
    loanTerm: 30,
    interestRate: 6.5,
    propertyTax: 1.2,
    homeInsurance: 0.5,
    pmi: 0.5,
    hoaFees: 0
} as const;

export const AFFORDABILITY_DEFAULTS = {
    monthlyIncome: 8000,
    monthlyDebts: 500,
    downPaymentAmount: 80000,
    interestRate: 6.5,
    loanTerm: 30,
    propertyTaxRate: 1.2,
    insuranceRate: 0.5,
    pmiRate: 0.5
} as const;

export const DEFAULT_SCENARIOS = [
    { name: '30-Year Fixed', rate: 6.5, term: 30 },
    { name: '15-Year Fixed', rate: 6.0, term: 15 },
    { name: '5/1 ARM', rate: 5.8, term: 30 }
] as const;
```

#### 4. Utility Functions (`/src/lib/utils/common.ts`)

```typescript
/**
 * Format a number as currency (USD)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}
```

### Enhanced Features

#### Real-time Calculations
- **Automatic Updates**: Calculations update immediately when inputs change
- **Performance Optimized**: Uses useEffect hooks to prevent unnecessary recalculations
- **Error Handling**: Graceful handling of invalid inputs with fallback values

#### Export and Sharing
- **Data Export**: Export calculation results as JSON for client records
- **URL Sharing**: Share calculator link with clients for easy access
- **Professional Presentation**: Clean, client-friendly interface

#### Responsive Design
- **Mobile Optimized**: Touch-friendly inputs and responsive layout
- **Tablet Support**: Optimized for tablet presentations with clients
- **Desktop Experience**: Full-featured interface for detailed analysis

## User Experience

### Key User Flows

1. **Basic Payment Calculation**
   - Navigate to Tools → Calculator
   - Enter home price and down payment
   - Adjust loan terms and rates
   - Review monthly payment breakdown
   - View amortization schedule

2. **Affordability Analysis**
   - Switch to "Affordability Analysis" tab
   - Enter monthly income and existing debts
   - Specify available down payment
   - Review recommended home price range
   - Analyze debt-to-income ratios
   - Follow personalized recommendations

3. **Loan Comparison**
   - Switch to "Loan Comparison" tab
   - Review different loan scenarios
   - Compare monthly payments and total costs
   - Identify best options for client needs
   - Export comparison for client presentation

4. **Client Consultation**
   - Use calculator during client meetings
   - Adjust parameters in real-time
   - Export results for client records
   - Share calculator link for client reference

### Best Practices Integration

The calculator includes built-in best practices guidance:

- **Property Tax and Insurance**: Always include for accurate monthly payments
- **Down Payment Scenarios**: Show different down payment options to help clients plan
- **Amortization Education**: Use schedule to explain equity building over time
- **Loan Term Comparison**: Compare 15-year vs 30-year loans to show interest savings

## Integration Points

### Tools Hub Integration

The Mortgage Calculator is the flagship tool in the Tools Hub at `/tools/calculator` and integrates with other financial analysis tools:

- **ROI Calculator**: Cross-reference with investment analysis
- **Property Valuation**: Use valuation data for payment calculations
- **Document Scanner**: Process loan documents and extract key terms

### Client Dashboard Integration

- **Embedded Calculator**: Include calculator widget in client dashboards
- **Saved Calculations**: Store client-specific calculations for future reference
- **Progress Tracking**: Track client affordability improvements over time

### Library Integration

- **Saved Reports**: Export calculations to Library for client presentations
- **Template Creation**: Create calculation templates for different client types
- **Content Generation**: Use calculation data for marketing content

## Performance Considerations

- **Real-time Updates**: Optimized calculation functions with minimal re-renders
- **Memory Management**: Efficient state management with proper cleanup
- **Input Validation**: Client-side validation prevents invalid calculations
- **Error Boundaries**: Graceful error handling for edge cases

## Accessibility

- **Keyboard Navigation**: Full keyboard support for all inputs and controls
- **Screen Reader Support**: Proper ARIA labels and semantic HTML structure
- **Color Contrast**: High contrast colors for better readability
- **Focus Management**: Clear focus indicators and logical tab order

## Testing

### Unit Testing

```typescript
describe('Mortgage Calculator', () => {
    it('calculates monthly payment correctly', () => {
        // Test payment calculation formula
    });
    
    it('determines affordability accurately', () => {
        // Test affordability analysis logic
    });
    
    it('compares loan scenarios properly', () => {
        // Test loan comparison functionality
    });
});
```

### Integration Testing

- Test real-time calculation updates
- Verify export functionality
- Confirm responsive behavior across devices
- Validate accessibility compliance

## Future Enhancements

### Planned Features

1. **Advanced Loan Types**: Support for VA loans, FHA loans, and jumbo mortgages
2. **Rate Shopping**: Integration with live mortgage rate APIs
3. **Pre-approval Integration**: Connect with lender pre-approval systems
4. **Tax Benefits**: Calculate mortgage interest deduction benefits
5. **Refinancing Analysis**: Compare current loan with refinancing options
6. **Investment Property**: Specialized calculations for rental properties
7. **Closing Cost Calculator**: Estimate total closing costs and cash needed
8. **Payment Schedule**: Full amortization schedule with extra payment scenarios

### Technical Improvements

1. **API Integration**: Connect to live interest rate feeds
2. **Advanced Charts**: Interactive payment and equity charts
3. **PDF Generation**: Professional calculation reports
4. **CRM Integration**: Save calculations to client records
5. **Mobile App**: Native mobile calculator app
6. **Voice Input**: Voice-activated input for hands-free operation

## Related Documentation

- [Tools Hub Overview](../app/tools-hub.md)
- [Component Library](../design-system/components.md)
- [Animation System](../design-system/animation-system.md)
- [Responsive Design Guidelines](../design-system/mobile-optimizations.md)
- [Client Dashboard Integration](./client-dashboards.md)
- [Library Management](./library-management.md)
- [Export and Sharing](../api/export-sharing.md)
- [Financial Calculations API](../api/financial-calculations.md)