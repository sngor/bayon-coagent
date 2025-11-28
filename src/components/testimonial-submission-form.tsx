'use client';

/**
 * Testimonial Submission Form
 * 
 * Form for clients to submit testimonials via public link
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TestimonialSubmissionFormProps {
    requestId: string;
    userId: string;
    clientName: string;
    agentInfo: {
        name: string;
        agencyName: string;
    };
}

export function TestimonialSubmissionForm({
    requestId,
    userId,
    clientName,
    agentInfo,
}: TestimonialSubmissionFormProps) {
    const router = useRouter();
    const [testimonialText, setTestimonialText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate testimonial text
        if (!testimonialText.trim()) {
            setError('Please enter your testimonial');
            return;
        }

        if (testimonialText.trim().length < 10) {
            setError('Please provide a more detailed testimonial (at least 10 characters)');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/testimonial/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId,
                    userId,
                    testimonialText: testimonialText.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit testimonial');
            }

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred while submitting your testimonial');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
                <p className="text-muted-foreground mb-4">
                    Your testimonial has been submitted successfully.
                </p>
                <p className="text-sm text-muted-foreground">
                    {agentInfo.name} appreciates your feedback and will review it shortly.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pre-populated Agent Info */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
                <div>
                    <Label className="text-sm text-muted-foreground">Agent</Label>
                    <p className="font-medium">{agentInfo.name}</p>
                </div>
                {agentInfo.agencyName && (
                    <div>
                        <Label className="text-sm text-muted-foreground">Agency</Label>
                        <p className="font-medium">{agentInfo.agencyName}</p>
                    </div>
                )}
                <div>
                    <Label className="text-sm text-muted-foreground">Your Name</Label>
                    <p className="font-medium">{clientName}</p>
                </div>
            </div>

            {/* Testimonial Text */}
            <div className="space-y-2">
                <Label htmlFor="testimonial">
                    Your Testimonial <span className="text-destructive">*</span>
                </Label>
                <Textarea
                    id="testimonial"
                    placeholder="Share your experience working with this agent..."
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value)}
                    rows={8}
                    className="resize-none"
                    disabled={isSubmitting}
                    required
                />
                <p className="text-sm text-muted-foreground">
                    {testimonialText.length} characters
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting || !testimonialText.trim()}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
                By submitting this testimonial, you agree to allow {agentInfo.name} to use it for marketing purposes.
            </p>
        </form>
    );
}
