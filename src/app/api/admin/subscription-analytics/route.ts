/**
 * Subscription Analytics API
 * 
 * Provides analytics data for subscription management and conversion tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';

export async function GET(request: NextRequest) {
    try {
        // TODO: Add admin authentication check
        // const user = await getCurrentUser();
        // if (!user?.isAdmin) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const repository = getRepository();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        // Get all subscription records
        const subscriptions = await repository.scan<any>({
            filterExpression: 'EntityType = :entityType',
            expressionAttributeValues: {
                ':entityType': 'UserPreferences'
            }
        });

        // Calculate analytics
        const analytics = {
            totalUsers: 0,
            activeTrials: 0,
            expiredTrials: 0,
            activeSubscriptions: 0,
            cancelledSubscriptions: 0,
            trialConversionRate: 0,
            monthlyRecurringRevenue: 0,
            averageRevenuePerUser: 0,
            churnRate: 0,
            recentSignups: 0,
            trialsByDay: [] as Array<{ date: string; count: number }>,
            conversionsByDay: [] as Array<{ date: string; count: number }>,
            planDistribution: {
                free: 0,
                starter: 0,
                professional: 0,
                omnia: 0
            }
        };

        let totalTrialUsers = 0;
        let convertedUsers = 0;
        let totalRevenue = 0;
        let recentCancellations = 0;

        for (const item of subscriptions.items) {
            const subscription = item;
            analytics.totalUsers++;

            // Count by plan
            const plan = subscription.plan || 'free';
            if (plan in analytics.planDistribution) {
                analytics.planDistribution[plan as keyof typeof analytics.planDistribution]++;
            }

            // Count by status
            switch (subscription.status) {
                case 'trialing':
                    analytics.activeTrials++;
                    totalTrialUsers++;
                    
                    // Check if trial started in last 30 days
                    if (subscription.CreatedAt && subscription.CreatedAt > thirtyDaysAgo.getTime()) {
                        analytics.recentSignups++;
                    }
                    break;

                case 'active':
                    analytics.activeSubscriptions++;
                    convertedUsers++;
                    
                    // Calculate MRR (assuming monthly billing)
                    if (subscription.plan === 'starter') {
                        totalRevenue += 49;
                    } else if (subscription.plan === 'professional') {
                        totalRevenue += 99;
                    } else if (subscription.plan === 'omnia') {
                        totalRevenue += 199;
                    }
                    break;

                case 'canceled':
                case 'cancelled':
                    analytics.cancelledSubscriptions++;
                    
                    // Check if cancelled in last 30 days
                    if (subscription.cancelledAt) {
                        const cancelDate = new Date(subscription.cancelledAt);
                        if (cancelDate > thirtyDaysAgo) {
                            recentCancellations++;
                        }
                    }
                    break;

                case 'expired':
                    analytics.expiredTrials++;
                    totalTrialUsers++;
                    break;
            }
        }

        // Calculate rates
        analytics.trialConversionRate = totalTrialUsers > 0 
            ? Math.round((convertedUsers / totalTrialUsers) * 100) 
            : 0;

        analytics.monthlyRecurringRevenue = totalRevenue;
        analytics.averageRevenuePerUser = analytics.activeSubscriptions > 0 
            ? Math.round(totalRevenue / analytics.activeSubscriptions) 
            : 0;

        analytics.churnRate = analytics.activeSubscriptions > 0 
            ? Math.round((recentCancellations / analytics.activeSubscriptions) * 100) 
            : 0;

        // Generate daily data for charts (last 30 days)
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            
            // Count trials started on this day
            const trialsOnDay = subscriptions.items.filter(item => {
                if (!item.CreatedAt) return false;
                const createdDate = new Date(item.CreatedAt).toISOString().split('T')[0];
                return createdDate === dateStr && item.status === 'trialing';
            }).length;

            analytics.trialsByDay.push({
                date: dateStr,
                count: trialsOnDay
            });

            // Count conversions on this day (subscriptions created)
            const conversionsOnDay = subscriptions.items.filter(item => {
                if (!item.CreatedAt) return false;
                const createdDate = new Date(item.CreatedAt).toISOString().split('T')[0];
                return createdDate === dateStr && item.status === 'active';
            }).length;

            analytics.conversionsByDay.push({
                date: dateStr,
                count: conversionsOnDay
            });
        }

        return NextResponse.json({
            success: true,
            analytics,
            lastUpdated: now.toISOString()
        });

    } catch (error) {
        console.error('Error fetching subscription analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}