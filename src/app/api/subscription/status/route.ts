/**
 * Subscription Status API Route
 * 
 * Gets the current subscription status and trial information for a user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const repository = getRepository();

        // Get user subscription data
        const subscriptionData = await repository.getItem<any>(
            `USER#${userId}`,
            'SUBSCRIPTION'
        );

        // Get user profile to check creation date for trial calculation
        const profileData = await repository.getItem<any>(
            `USER#${userId}`,
            'PROFILE'
        );

        const now = new Date();
        let subscriptionStatus = {
            isActive: false,
            plan: 'free' as const,
            status: null as string | null,
            trialEndsAt: null as Date | null,
            isInTrial: false,
            trialDaysRemaining: 0,
            currentPeriodEnd: null as Date | null,
            cancelAtPeriodEnd: false,
            customerId: null as string | null,
            subscriptionId: null as string | null,
        };

        if (subscriptionData?.Data) {
            // User has subscription data
            const sub = subscriptionData.Data;
            subscriptionStatus = {
                isActive: sub.status === 'active' || sub.status === 'trialing',
                plan: sub.plan || 'free',
                status: sub.status,
                trialEndsAt: sub.trialEndsAt ? new Date(sub.trialEndsAt) : null,
                isInTrial: sub.status === 'trialing' && sub.trialEndsAt && new Date(sub.trialEndsAt) > now,
                trialDaysRemaining: sub.trialEndsAt ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0,
                currentPeriodEnd: sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd || false,
                customerId: sub.customerId || null,
                subscriptionId: sub.subscriptionId || null,
            };
        } else if (profileData?.Data?.createdAt) {
            // New user - check if still in trial period
            const userCreatedAt = new Date(profileData.Data.createdAt);
            const trialEndsAt = new Date(userCreatedAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days
            const isInTrial = now < trialEndsAt;
            const trialDaysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

            if (isInTrial) {
                subscriptionStatus = {
                    isActive: true,
                    plan: 'professional',
                    status: 'trialing',
                    trialEndsAt,
                    isInTrial: true,
                    trialDaysRemaining,
                    currentPeriodEnd: trialEndsAt,
                    cancelAtPeriodEnd: false,
                    customerId: null,
                    subscriptionId: null,
                };

                // Save trial status to database
                await repository.put({
                    PK: `USER#${userId}`,
                    SK: 'SUBSCRIPTION',
                    EntityType: 'UserPreferences',
                    Data: {
                        plan: 'professional',
                        status: 'trialing',
                        trialEndsAt: trialEndsAt.toISOString(),
                    },
                    CreatedAt: now.getTime(),
                    UpdatedAt: now.getTime(),
                });
            }
        }

        return NextResponse.json({
            success: true,
            subscription: subscriptionStatus,
        });
    } catch (error) {
        console.error('Error getting subscription status:', error);
        return NextResponse.json(
            { error: 'Failed to get subscription status' },
            { status: 500 }
        );
    }
}