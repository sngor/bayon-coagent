# Stripe Integration Guide

This guide explains how to set up and use the Stripe subscription integration in Bayon Coagent.

## Overview

The application uses Stripe's embedded payment components to handle subscription billing during the signup flow. Users select a plan, enter payment details, and verify their email to complete registration.

## Setup Instructions

### 1. Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business profile
3. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

### 2. Create Products and Prices

In the Stripe Dashboard, create three products with recurring monthly prices:

#### Starter Plan

- Name: Starter
- Price: $49/month
- Copy the Price ID (starts with `price_`)

#### Professional Plan

- Name: Professional
- Price: $99/month
- Copy the Price ID

#### Enterprise Plan

- Name: Enterprise
- Price: $199/month
- Copy the Price ID

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

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

### 4. Set Up Webhooks

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to your environment variables

### 5. Test the Integration

For local testing:

1. Install the Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks to local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret from the CLI output
5. Test with Stripe test cards: `4242 4242 4242 4242`

## Signup Flow

The new signup flow includes these steps:

1. **Account Creation**: User enters email and password
2. **Plan Selection**: User chooses a subscription plan (Starter, Professional, or Enterprise)
3. **Payment**: User enters payment details using Stripe's embedded form
4. **Email Verification**: User verifies email with a code sent to their inbox
5. **Dashboard Access**: User is redirected to the dashboard

## Architecture

### Components

- **`StripePricing`**: Displays the three subscription plans with features
- **`StripePaymentForm`**: Embedded Stripe payment form using Elements
- **`SignUpForm`**: Updated to include multi-step signup with Stripe

### API Routes

- **`/api/stripe/create-subscription`**: Creates a Stripe subscription and returns client secret
- **`/api/stripe/webhook`**: Handles Stripe webhook events and updates DynamoDB

### Database Schema

User profiles in DynamoDB include these subscription fields:

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

## Customization

### Update Plan Features

Edit `src/lib/stripe-config.ts` to modify plan names, prices, and features:

```typescript
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    price: 49,
    features: [
      "AI Content Generation",
      // Add more features
    ],
  },
  // ...
};
```

### Customize Payment Form Appearance

Edit the `appearance` object in `src/components/stripe-payment-form.tsx`:

```typescript
const options = {
  appearance: {
    theme: "stripe",
    variables: {
      colorPrimary: "#0070f3",
      // Customize colors
    },
  },
};
```

## Testing

### Test Cards

Use these test cards in development:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiration date and any 3-digit CVC.

### Webhook Testing

Test webhooks locally:

```bash
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

## Production Deployment

1. Replace test API keys with live keys
2. Update webhook endpoint to production URL
3. Test the complete flow with real payment methods
4. Monitor the Stripe Dashboard for subscription activity

## Security Notes

- Never expose `STRIPE_SECRET_KEY` in client-side code
- Always verify webhook signatures
- Use HTTPS in production
- Store sensitive data in environment variables
- Validate all inputs on the server side

## Troubleshooting

### Payment fails silently

- Check browser console for errors
- Verify API keys are correct
- Ensure webhook secret matches

### Subscription not updating in database

- Check webhook endpoint is accessible
- Verify webhook events are being received
- Check CloudWatch logs for errors

### User can't access features after payment

- Verify subscription status in DynamoDB
- Check that webhook processed successfully
- Ensure user profile has correct subscription fields

## Support

For Stripe-specific issues, consult:

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Stripe API Reference](https://stripe.com/docs/api)
