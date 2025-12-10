/**
 * Custom error classes for billing operations
 * Provides better error handling and user-friendly messages
 */

export class BillingError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'BillingError';
    }
}

export class StripeError extends BillingError {
    constructor(message: string, stripeError: any) {
        const code = stripeError.code || 'stripe_error';
        const statusCode = stripeError.statusCode || 500;

        super(message, code, statusCode, {
            stripeCode: stripeError.code,
            stripeType: stripeError.type,
            stripeParam: stripeError.param,
        });

        this.name = 'StripeError';
    }
}

export class CustomerNotFoundError extends BillingError {
    constructor(customerId: string) {
        super(`Customer not found: ${customerId}`, 'customer_not_found', 404);
        this.name = 'CustomerNotFoundError';
    }
}

export class SubscriptionNotFoundError extends BillingError {
    constructor(subscriptionId: string) {
        super(`Subscription not found: ${subscriptionId}`, 'subscription_not_found', 404);
        this.name = 'SubscriptionNotFoundError';
    }
}

export class PaymentFailedError extends BillingError {
    constructor(message: string, paymentIntentId?: string) {
        super(message, 'payment_failed', 402, { paymentIntentId });
        this.name = 'PaymentFailedError';
    }
}

/**
 * Maps Stripe errors to user-friendly billing errors
 */
export function mapStripeError(error: any): BillingError {
    if (error.type === 'StripeCardError') {
        return new PaymentFailedError(
            'Your payment method was declined. Please try a different payment method.',
            error.payment_intent?.id
        );
    }

    if (error.code === 'resource_missing') {
        if (error.param === 'customer') {
            return new CustomerNotFoundError(error.param);
        }
        if (error.param === 'subscription') {
            return new SubscriptionNotFoundError(error.param);
        }
    }

    if (error.code === 'parameter_invalid_empty') {
        return new BillingError(
            'Invalid request parameters. Please check your input.',
            'invalid_parameters',
            400
        );
    }

    // Generic Stripe error
    return new StripeError(
        error.message || 'An error occurred with the payment service.',
        error
    );
}

/**
 * Error handler for billing operations
 */
export function handleBillingError(error: any): never {
    if (error instanceof BillingError) {
        throw error;
    }

    if (error.type?.startsWith('Stripe')) {
        throw mapStripeError(error);
    }

    // Generic error
    throw new BillingError(
        error.message || 'An unexpected billing error occurred.',
        'unknown_error',
        500,
        { originalError: error }
    );
}