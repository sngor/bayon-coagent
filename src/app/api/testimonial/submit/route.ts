/**
 * Testimonial Submission API Route
 * 
 * Handles public testimonial submissions from clients
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getTestimonialRequest,
    updateTestimonialRequestStatus
} from '@/aws/dynamodb';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, userId, testimonialText } = body;

        // Validate input
        if (!requestId || !userId || !testimonialText) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get the testimonial request
        const testimonialRequest = await getTestimonialRequest(userId, requestId);

        if (!testimonialRequest) {
            return NextResponse.json(
                { error: 'Testimonial request not found' },
                { status: 404 }
            );
        }

        // Check if already submitted
        if (testimonialRequest.status === 'submitted') {
            return NextResponse.json(
                { error: 'Testimonial already submitted' },
                { status: 400 }
            );
        }

        // Check if expired
        const now = new Date();
        const expiresAt = new Date(testimonialRequest.expiresAt);
        if (now > expiresAt) {
            return NextResponse.json(
                { error: 'Testimonial request has expired' },
                { status: 400 }
            );
        }

        // Create the testimonial
        const testimonialId = randomBytes(16).toString('hex');
        const { createTestimonial: createTestimonialFn } = await import('@/aws/dynamodb/testimonial-repository');

        const testimonial = await createTestimonialFn(userId, testimonialId, {
            clientName: testimonialRequest.clientName,
            testimonialText: testimonialText.trim(),
            dateReceived: now.toISOString(),
            isFeatured: false,
            tags: [],
            requestId: requestId,
        });

        // Update request status to submitted
        await updateTestimonialRequestStatus(userId, requestId, 'submitted', {
            submittedAt: now.toISOString(),
        });

        // Send notification to agent (async, don't wait)
        try {
            const { sendEmail } = await import('@/aws/ses/client');
            const { getRepository } = await import('@/aws/dynamodb');
            const { getUserProfileKeys } = await import('@/aws/dynamodb/keys');

            const repo = getRepository();
            const profileKeys = getUserProfileKeys(userId);
            const profile = await repo.get<any>(profileKeys.PK, profileKeys.SK);

            if (profile?.email) {
                const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com';
                const htmlBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">New Testimonial Received!</h2>
                        <p>Great news! ${testimonialRequest.clientName} has submitted a testimonial.</p>
                        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="font-style: italic; color: #374151;">"${testimonialText.trim()}"</p>
                            <p style="text-align: right; color: #6b7280; margin-top: 10px;">- ${testimonialRequest.clientName}</p>
                        </div>
                        <p>You can view and manage this testimonial in your Brand hub.</p>
                        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                            This is an automated notification from Bayon Coagent.
                        </p>
                    </div>
                `;

                // Send notification email to agent (don't await to avoid blocking)
                sendEmail(
                    profile.email,
                    `New Testimonial Received from ${testimonialRequest.clientName}`,
                    htmlBody,
                    fromEmail,
                    true
                ).catch(err => {
                    console.error('Failed to send notification email:', err);
                    // Don't fail the request if email fails
                });
            }
        } catch (err) {
            console.error('Error sending notification:', err);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({
            success: true,
            testimonialId: testimonial.id,
        });
    } catch (error: any) {
        console.error('Error submitting testimonial:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit testimonial' },
            { status: 500 }
        );
    }
}
