#!/bin/bash

# Stripe Setup Script
# This script helps you configure Stripe for local development

echo "🔧 Stripe Integration Setup"
echo "============================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
fi

echo "Please provide your Stripe credentials:"
echo ""

# Get Stripe publishable key
read -p "Stripe Publishable Key (pk_test_...): " STRIPE_PK
if [ -z "$STRIPE_PK" ]; then
    echo "❌ Publishable key is required"
    exit 1
fi

# Get Stripe secret key
read -p "Stripe Secret Key (sk_test_...): " STRIPE_SK
if [ -z "$STRIPE_SK" ]; then
    echo "❌ Secret key is required"
    exit 1
fi

# Get Stripe webhook secret
read -p "Stripe Webhook Secret (whsec_...): " STRIPE_WH
if [ -z "$STRIPE_WH" ]; then
    echo "⚠️  Webhook secret not provided. You can add it later."
    STRIPE_WH="your-stripe-webhook-secret"
fi

echo ""
echo "Please provide your Stripe Price IDs:"
echo "(You can create these in the Stripe Dashboard under Products)"
echo ""

# Get price IDs
read -p "Starter Plan Price ID (price_...): " PRICE_STARTER
read -p "Professional Plan Price ID (price_...): " PRICE_PRO
read -p "Enterprise Plan Price ID (price_...): " PRICE_ENT

# Update .env.local
echo "" >> .env.local
echo "# Stripe Configuration" >> .env.local
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$STRIPE_PK" >> .env.local
echo "STRIPE_SECRET_KEY=$STRIPE_SK" >> .env.local
echo "STRIPE_WEBHOOK_SECRET=$STRIPE_WH" >> .env.local
echo "" >> .env.local
echo "# Stripe Price IDs" >> .env.local
echo "NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=${PRICE_STARTER:-price_starter_monthly}" >> .env.local
echo "NEXT_PUBLIC_STRIPE_PROFESSIONAL_PRICE_ID=${PRICE_PRO:-price_professional_monthly}" >> .env.local
echo "NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID=${PRICE_ENT:-price_enterprise_monthly}" >> .env.local

echo ""
echo "✅ Stripe configuration added to .env.local"
echo ""
echo "Next steps:"
echo "1. Create products and prices in Stripe Dashboard"
echo "2. Update the price IDs in .env.local"
echo "3. Set up webhook endpoint: https://yourdomain.com/api/stripe/webhook"
echo "4. For local testing, run: stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""
echo "📚 See STRIPE_INTEGRATION.md for detailed setup instructions"
