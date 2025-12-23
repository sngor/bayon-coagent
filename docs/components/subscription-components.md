# Subscription Components

This document provides a technical reference for the subscription management components in the Bayon CoAgent platform.

## Component Overview

The subscription system is built with modular React components that handle different aspects of subscription management:

### Main Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SubscriptionManagement` | `src/components/subscription-management.tsx` | Main subscription interface |
| `UsageLimitsSection` | `src/components/subscription/usage-limits-section.tsx` | Usage tracking and limits |
| `PlanComparisonTable` | `src/components/subscription/plan-comparison-table.tsx` | Feature comparison matrix |

### Supporting Files

| File | Location | Purpose |
|------|----------|---------|
| `subscription-constants.ts` | `src/lib/constants/subscription-constants.ts` | Usage limits and messaging |
| `use-subscription-status.ts` | `src/hooks/use-subscription-status.ts` | Subscription data hook |
| `stripe-config.ts` | `src/lib/constants/stripe-config.ts` | Plan definitions |

## Component Details

### SubscriptionManagement

**Purpose**: Primary subscription management interface displayed in Settings

**Key Features**:
- Current subscription status display with plan icons
- Upgrade/downgrade functionality with Stripe integration
- Trial countdown and expiry notifications
- Subscription cancellation with period-end handling
- Defensive error handling for invalid plan data

**Props**: None (uses internal state and hooks)

**State Management**:
```typescript
interface SubscriptionStatus {
    isActive: boolean;
    plan: SubscriptionPlan | null;
    status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    customerId: string | null;
    subscriptionId: string | null;
    trialEndsAt: Date | null;
    isInTrial: boolean;
    trialDaysRemaining: number;
}
```

**Error Handling**:
- Safe plan name retrieval with fallback to "Free Tier"
- Network error handling with user-friendly messages
- Loading states during subscription operations

### UsageLimitsSection

**Purpose**: Display usage limits and progress for free tier and trial users

**Props**:
```typescript
interface UsageLimitsSectionProps {
    subscriptionStatus: SubscriptionStatus;
}
```

**Features**:
- Dynamic usage data based on trial vs. free tier status
- Visual progress bars with color-coded states:
  - Green: Normal usage (< 80%)
  - Amber: Near limit (80-99%)
  - Red: At limit (100%)
- Consistent usage data using memoization
- Upgrade prompts with contextual messaging

**Usage Data Structure**:
```typescript
interface UsageLimit {
    feature: string;
    used: number;
    limit: number;
    unlimited: boolean;
}
```

### PlanComparisonTable

**Purpose**: Comprehensive feature comparison across all subscription tiers

**Props**: None (uses static plan data)

**Features**:
- Accessible table structure with proper ARIA labels
- Categorized feature groups:
  - Content & Studio
  - Learning Hub
  - Brand & Market
  - Support & Advanced
- Live chat access level explanations
- Responsive design for mobile devices

**Accessibility**:
- Proper table semantics with `scope` attributes
- ARIA labels for screen readers
- Keyboard navigation support

## Usage Patterns

### Basic Implementation

```typescript
import { SubscriptionManagement } from '@/components/subscription-management';

// In Settings page
export default function SettingsPage() {
    return (
        <div>
            <SubscriptionManagement />
        </div>
    );
}
```

### Custom Usage Limits Display

```typescript
import { UsageLimitsSection } from '@/components/subscription/usage-limits-section';
import { useSubscriptionStatus } from '@/hooks/use-subscription-status';

export default function CustomDashboard() {
    const { subscriptionStatus } = useSubscriptionStatus();
    
    return (
        <div>
            <UsageLimitsSection subscriptionStatus={subscriptionStatus} />
        </div>
    );
}
```

### Plan Comparison Integration

```typescript
import { PlanComparisonTable } from '@/components/subscription/plan-comparison-table';

export default function PricingPage() {
    return (
        <div>
            <PlanComparisonTable />
        </div>
    );
}
```

## Configuration

### Environment Variables

Required environment variables for subscription functionality:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Plan Price IDs
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_OMNIA_PRICE_ID=price_...
```

### Usage Limits Configuration

Usage limits are configured in `src/lib/constants/subscription-constants.ts`:

```typescript
export const SUBSCRIPTION_CONSTANTS = {
    USAGE_THRESHOLDS: {
        NEAR_LIMIT: 80, // 80% of limit
        AT_LIMIT: 100,  // 100% of limit
    },
    TRIAL_USAGE_LIMITS: {
        AI_CONTENT_GENERATION: { used: 12, limit: 100 },
        IMAGE_ENHANCEMENTS: { used: 5, limit: 50 },
        // ... other limits
    },
    FREE_TIER_USAGE_LIMITS: {
        AI_CONTENT_GENERATION: { used: 8, limit: 10 },
        IMAGE_ENHANCEMENTS: { used: 2, limit: 5 },
        // ... other limits
    },
};
```

## Error Handling

### Defensive Programming Patterns

The subscription components implement several defensive programming patterns:

1. **Plan Validation**:
   ```typescript
   const getPlanName = (plan: SubscriptionPlan | null): string => {
       return plan && plan in SUBSCRIPTION_PLANS ? SUBSCRIPTION_PLANS[plan].name : 'Free Tier';
   };
   ```

2. **Safe Property Access**:
   ```typescript
   // Safe access with type guard
   {subscriptionStatus.plan && subscriptionStatus.plan in SUBSCRIPTION_PLANS 
       ? SUBSCRIPTION_PLANS[subscriptionStatus.plan].name 
       : 'Free Tier'}
   ```

3. **Loading States**:
   ```typescript
   if (isLoading) {
       return (
           <div className="flex items-center justify-center py-8">
               <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
           </div>
       );
   }
   ```

### Common Error Scenarios

- **Invalid Plan Data**: When subscription plan in database doesn't match current configuration
- **Network Failures**: API calls to subscription endpoints fail
- **Missing Configuration**: Environment variables or plan configuration missing
- **Type Mismatches**: Subscription data doesn't match expected TypeScript types

## Testing

### Component Testing

```bash
# Run component tests
npm test -- --testPathPattern=subscription

# Test specific component
npm test -- UsageLimitsSection.test.tsx
```

### Integration Testing

```bash
# Test subscription flow end-to-end
npm run test:e2e -- --spec="subscription.cy.ts"
```

### Manual Testing Checklist

- [ ] Free tier usage limits display correctly
- [ ] Trial countdown shows accurate days remaining
- [ ] Plan comparison table renders all features
- [ ] Upgrade flow works with Stripe integration
- [ ] Error states display user-friendly messages
- [ ] Loading states appear during async operations
- [ ] Invalid plan data doesn't crash the interface

## Troubleshooting

### Common Issues

**Component Not Rendering**:
- Check if user is authenticated
- Verify subscription status hook is working
- Check console for JavaScript errors

**Plan Names Showing as "Free Tier"**:
- Verify plan data in database matches `SUBSCRIPTION_PLANS` keys
- Check if plan configuration is properly loaded
- Ensure environment variables are set correctly

**Usage Limits Not Updating**:
- Check if usage data is being fetched correctly
- Verify memoization dependencies in `UsageLimitsSection`
- Ensure subscription status is being updated

### Debug Commands

```bash
# Check subscription status API
curl -H "Authorization: Bearer $TOKEN" \
  https://bayoncoagent.app/api/subscription/status?userId=$USER_ID

# Verify Stripe configuration
node -e "console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"

# Test component rendering
npm run storybook
```

## Related Documentation

- [Subscription System Overview](../features/subscription-system.md)
- [Stripe Integration](../features/stripe-integration.md)
- [Settings Page](../pages/settings.md)
- [Component Library](./ui-components.md)