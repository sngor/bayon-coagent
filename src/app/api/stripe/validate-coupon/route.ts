/**
 * Stripe Validate Coupon API Route
 * 
 * Validates a coupon code and returns coupon details.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRIPE_CONFIG } from '@/lib/constants/stripe-config';

// Initialize Stripe only if secret key is available
const stripe = STRIPE_CONFIG.secretKey
    ? new Stripe(STRIPE_CONFIG.secretKey, {
        apiVersion: '2025-11-17.clover',
    })
    : null;

export async function POST(request: NextRequest) {
    try {
        if (!stripe) {
            return NextResponse.json(
                { error: 'Stripe is not configured' },
                { status: 500 }
            );
        }

        const { couponId } = await request.json();

        if (!couponId) {
            return NextResponse.json(
                { error: 'Coupon ID is required' },
                { status: 400 }
            );
        }

        // Retrieve coupon from Stripe
        const coupon = await stripe.coupons.retrieve(couponId);

        // Check if coupon is valid (not deleted and within date range if applicable)
        const now = Math.floor(Date.now() / 1000);
        const isValid = coupon.valid &&
            (!coupon.redeem_by || coupon.redeem_by > now) &&
            (!coupon.max_redemptions || (coupon.times_redeemed || 0) < coupon.max_redemptions);

        if (!isValid) {
            return NextResponse.json(
                { error: 'This coupon is no longer valid or has expired' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            coupon: {
                id: coupon.id,
                name: coupon.name || coupon.id,
                percent_off: coupon.percent_off,
                amount_off: coupon.amount_off,
                currency: coupon.currency,
                duration: coupon.duration,
                valid: isValid,
            },
        });
    } catch (error: any) {
        console.error('Error validating coupon:', error);

        // Handle specific Stripe errors
        if (error.type === 'StripeInvalidRequestError' && error.code === 'resource_missing') {
            return NextResponse.json(
                { error: 'Coupon code not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to validate coupon' },
            { status: 500 }
        );
    }
}