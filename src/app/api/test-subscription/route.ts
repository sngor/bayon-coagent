/**
 * Test Subscription API
 * 
 * Test endpoint to verify subscription system functionality.
 * Only available in development environment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription-service';

export async function GET(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'Not available in production' },
            { status: 404 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const action = searchParams.get('action') || 'status';

        if (!userId) {
            return NextResponse.json(
                { error: 'userId parameter is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'status': {
                const status = await subscriptionService.getSubscriptionStatus(userId);
                return NextResponse.json({
                    success: true,
                    action: 'getSubscriptionStatus',
                    result: status
                });
            }

            case 'usage': {
                const usage = await subscriptionService.getUsage(userId);
                return NextResponse.json({
                    success: true,
                    action: 'getUsage',
                    result: usage
                });
            }

            case 'can-use': {
                const feature = searchParams.get('feature') as any;
                if (!feature) {
                    return NextResponse.json(
                        { error: 'feature parameter is required for can-use action' },
                        { status: 400 }
                    );
                }
                
                const canUse = await subscriptionService.canUseFeature(userId, feature);
                return NextResponse.json({
                    success: true,
                    action: 'canUseFeature',
                    feature,
                    result: canUse
                });
            }

            case 'increment': {
                const feature = searchParams.get('feature') as any;
                if (!feature) {
                    return NextResponse.json(
                        { error: 'feature parameter is required for increment action' },
                        { status: 400 }
                    );
                }
                
                const success = await subscriptionService.incrementUsage(userId, feature);
                const newUsage = await subscriptionService.getUsage(userId);
                
                return NextResponse.json({
                    success: true,
                    action: 'incrementUsage',
                    feature,
                    result: {
                        incrementSuccess: success,
                        newUsage
                    }
                });
            }

            case 'stats': {
                const stats = await subscriptionService.getUsageStats(userId, 3);
                return NextResponse.json({
                    success: true,
                    action: 'getUsageStats',
                    result: stats
                });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}. Available: status, usage, can-use, increment, stats` },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Error in test subscription endpoint:', error);
        return NextResponse.json(
            { 
                error: 'Test failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'Not available in production' },
            { status: 404 }
        );
    }

    try {
        const { userId, action, ...params } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'userId is required' },
                { status: 400 }
            );
        }

        switch (action) {
            case 'create-trial': {
                // Simulate creating a trial for a user
                const now = new Date();
                const trialEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
                
                // This would normally be done during user registration
                // Here we're just testing the subscription service
                const status = await subscriptionService.getSubscriptionStatus(userId);
                
                return NextResponse.json({
                    success: true,
                    action: 'create-trial',
                    result: {
                        message: 'Trial status checked/created',
                        status
                    }
                });
            }

            case 'expire-trial': {
                // Simulate trial expiration
                await subscriptionService.handleTrialExpiration(userId);
                const newStatus = await subscriptionService.getSubscriptionStatus(userId);
                
                return NextResponse.json({
                    success: true,
                    action: 'expire-trial',
                    result: {
                        message: 'Trial expired',
                        newStatus
                    }
                });
            }

            default:
                return NextResponse.json(
                    { error: `Unknown action: ${action}. Available: create-trial, expire-trial` },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Error in test subscription POST endpoint:', error);
        return NextResponse.json(
            { 
                error: 'Test failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}