/**
 * Public Testimonial Submission Page
 * 
 * Allows clients to submit testimonials via a unique link
 * No authentication required - accessed via token
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getTestimonialRequestByToken } from '@/aws/dynamodb';
import { TestimonialSubmissionForm } from '@/components/testimonial-submission-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PageProps {
    params: Promise<{
        token: string;
    }>;
}

async function TestimonialSubmissionContent({ token }: { token: string }) {
    // Get the testimonial request by token
    const request = await getTestimonialRequestByToken(token);

    // Check if request exists
    if (!request) {
        notFound();
    }

    // Check if request has expired
    const now = new Date();
    const expiresAt = new Date(request.expiresAt);
    const isExpired = now > expiresAt;

    // Check if already submitted
    const isSubmitted = request.status === 'submitted';

    // Get agent profile to pre-populate form
    // We'll need to fetch this from the user profile
    const { getUserProfileKeys } = await import('@/aws/dynamodb/keys');
    const { getRepository } = await import('@/aws/dynamodb');
    const repository = getRepository();
    const profileKeys = getUserProfileKeys(request.userId);
    const profile = await repository.get<any>(profileKeys.PK, profileKeys.SK);

    const agentInfo = {
        name: profile?.name || 'Your Agent',
        agencyName: profile?.agencyName || '',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Share Your Experience</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            {agentInfo.name} would love to hear about your experience
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isExpired ? (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">⏰</div>
                                <h2 className="text-2xl font-semibold mb-2">Link Expired</h2>
                                <p className="text-muted-foreground mb-4">
                                    This testimonial request link has expired. Please contact {agentInfo.name} for a new link.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Email: {profile?.email || 'your agent'}
                                </p>
                            </div>
                        ) : isSubmitted ? (
                            <div className="text-center py-8">
                                <div className="text-6xl mb-4">✅</div>
                                <h2 className="text-2xl font-semibold mb-2">Already Submitted</h2>
                                <p className="text-muted-foreground">
                                    Thank you! Your testimonial has already been submitted.
                                </p>
                            </div>
                        ) : (
                            <TestimonialSubmissionForm
                                requestId={request.id}
                                userId={request.userId}
                                clientName={request.clientName}
                                agentInfo={agentInfo}
                            />
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>
                        This is a secure link for {request.clientName} to submit a testimonial for {agentInfo.name}
                        {agentInfo.agencyName && ` at ${agentInfo.agencyName}`}.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default async function TestimonialSubmissionPage({ params }: PageProps) {
    const { token } = await params;

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <TestimonialSubmissionContent token={token} />
        </Suspense>
    );
}
