'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { STRIPE_CONFIG } from '@/lib/stripe-config';
import { useToast } from '@/hooks/use-toast';

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);

interface PaymentFormProps {
    clientSecret: string;
    onSuccess: () => void;
    onBack: () => void;
}

function PaymentForm({ clientSecret, onSuccess, onBack }: PaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/dashboard?subscription=success`,
                },
            });

            if (error) {
                toast({
                    variant: 'destructive',
                    title: 'Payment failed',
                    description: error.message,
                });
            } else {
                onSuccess();
            }
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Payment error',
                description: 'An unexpected error occurred',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1"
                    disabled={isProcessing}
                >
                    Back
                </Button>
                <Button
                    type="submit"
                    variant="premium"
                    className="flex-1"
                    disabled={!stripe || isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        'Complete Signup'
                    )}
                </Button>
            </div>
        </form>
    );
}

export function StripePaymentForm({ clientSecret, onSuccess, onBack }: PaymentFormProps) {
    const options = {
        clientSecret,
        appearance: {
            theme: 'stripe' as const,
            variables: {
                colorPrimary: '#0070f3',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm clientSecret={clientSecret} onSuccess={onSuccess} onBack={onBack} />
        </Elements>
    );
}
