# Stripe Integration - Quick Start

## What Was Added

Stripe subscription billing has been integrated into the signup flow with custom UI components.

### New Files Created

1. **`src/lib/stripe-config.ts`** - Stripe configuration and plan definitions
2. **`src/components/stripe-pricing.tsx`** - Pricing plan selection component
3. **`src/components/stripe-payment-form.tsx`** - Stripe payment form with Elements
4. **`src/app/api/stripe/create-subscription/route.ts`** - API to create subscriptions
5. **`src/app/api/stripe/webhook/route.ts`** - Webhook handler for Stripe events
6. **`scripts/setup-stripe.sh`** - Setup script for configuration
7. **`STRIPE_INTEGRATION.md`** - Comprehensive integration guide

### Modified Files

1. **`src/app/login/page.tsx`** - Updated signup flow with Stripe integration
2. **`src/aws/auth/auth-provider.tsx`** - Added userSub to signUp return type
3. **`.env.example`** - Added Stripe environment variables
4. **`package.json`** - Added Stripe dependencies

## New Signup Flow

1. **Account Creation** → User enters email and password
2. **Plan Selection** → User chooses Starter ($49), Professional ($99), or Enterprise ($199)
3. **Payment** → User enters payment details via Stripe Elements
4. **Email Verification** → User verifies email with code
5. **Dashboard Access** → User is redirected to dashboard

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

Dependencies added:

- `@stripe/stripe-js` - Stripe.js library
- `@stripe/react-stripe-js` - React components for Stripe
- `stripe` - Stripe Node.js SDK

### 2. Get Stripe Keys

1. Sign up at [stripe.com](https://stripe.com)
2. Go to [API Keys](https://dashboard.stripe.com/apikeys)
3. Copy your test keys (pk*test*... and sk*test*...)

### 3. Create Products in Stripe

In the [Stripe Dashboard](https://dashboard.stripe.com/products):

**Starter Plan:**

- Name: Starter
- Price: $49/month
- Copy the Price ID (price\_...)

**Professional Plan:**

- Name: Professional
- Price: $99/month
- Copy the Price ID

**Enterprise Plan:**

- Name: Enterprise
- Price: $199/month
- Copy the Price ID

### 4. Configure Environment

Run the setup script:

```bash
bash scripts/setup-stripe.sh
```

Or manually add to `.env.local`:

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=price_...
```

### 5. Test Locally

Start the dev server:

```bash
npm run dev
```

In another terminal, forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret and update `.env.local`.

### 6. Test Signup

1. Go to http://localhost:3000/login
2. Click "Create an Account"
3. Enter email and password
4. Select a plan
5. Use test card: `4242 4242 4242 4242`
6. Any future expiration date and CVC
7. Complete payment and verify email

## Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Customization

### Update Plan Pricing

Edit `src/lib/stripe-config.ts`:

```typescript
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    price: 49, // Change price
    features: [
      "AI Content Generation",
      // Add/remove features
    ],
  },
  // ...
};
```

### Customize Payment Form

Edit `src/components/stripe-payment-form.tsx`:

```typescript
const options = {
  appearance: {
    theme: "stripe",
    variables: {
      colorPrimary: "#0070f3", // Change colors
      // ...
    },
  },
};
```

## Production Deployment

1. Replace test keys with live keys in production environment
2. Set up production webhook: `https://yourdomain.com/api/stripe/webhook`
3. Select these webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to production environment

## Database Schema

User profiles now include subscription fields:

```typescript
{
  PK: "USER#userId",
  SK: "PROFILE",
  subscriptionId: "sub_...",
  subscriptionStatus: "active" | "past_due" | "canceled",
  subscriptionPriceId: "price_...",
  subscriptionCurrentPeriodEnd: "2024-12-31T23:59:59Z"
}
```

## Troubleshooting

**Payment fails silently:**

- Check browser console for errors
- Verify API keys are correct
- Ensure price IDs match Stripe Dashboard

**Webhook not working:**

- Verify webhook endpoint is accessible
- Check webhook signing secret matches
- Review CloudWatch logs for errors

**User can't access features:**

- Check subscription status in DynamoDB
- Verify webhook processed successfully
- Ensure user profile has subscription fields

## Next Steps

- Implement subscription management in settings
- Add usage-based billing if needed
- Set up billing portal for customers
- Add subscription status checks to protected routes
- Implement feature gating based on plan

## Support

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- See `STRIPE_INTEGRATION.md` for detailed guide
