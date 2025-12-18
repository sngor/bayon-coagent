/**
 * Trial Notifications Cron Job
 * 
 * Checks for users whose trials are expiring and sends notification emails.
 * Should be called daily via cron job or scheduled task.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';
import { emailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
    try {
        // Verify cron job authorization
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET_TOKEN;
        
        if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const repository = getRepository();
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
        const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));

        console.log('Starting trial notification check...');

        // Get all users with active trials
        // Note: In a real implementation, you'd want to use a GSI to efficiently query by trial status
        // For now, we'll scan for users with subscription data
        const scanResult = await repository.scan<any>({
            filterExpression: 'EntityType = :entityType AND #status = :status',
            expressionAttributeNames: {
                '#status': 'status'
            },
            expressionAttributeValues: {
                ':entityType': 'UserPreferences',
                ':status': 'trialing'
            }
        });

        let notificationsSent = 0;
        let errors = 0;

        for (const subscriptionItem of scanResult.items) {
            try {
                const subscription = subscriptionItem;
                
                if (!subscription.trialEndsAt) {
                    continue;
                }

                const trialEndDate = new Date(subscription.trialEndsAt);
                const userId = subscription.PK?.replace('USER#', '');
                
                if (!userId) {
                    continue;
                }

                // Get user profile for email and name
                const userProfile = await repository.get<any>(
                    `USER#${userId}`,
                    'PROFILE'
                );

                if (!userProfile?.email) {
                    console.warn(`No email found for user ${userId}`);
                    continue;
                }

                const daysUntilExpiry = Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

                // Send 3-day warning
                if (daysUntilExpiry === 3) {
                    await emailService.sendTrialExpiryWarning(userProfile.email, {
                        userName: userProfile.firstName || userProfile.name || 'there',
                        daysRemaining: 3,
                        trialEndDate: trialEndDate.toLocaleDateString(),
                        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription&upgrade=true`
                    });
                    
                    notificationsSent++;
                    console.log(`Sent 3-day warning to ${userProfile.email}`);
                }

                // Send 1-day warning
                else if (daysUntilExpiry === 1) {
                    await emailService.sendTrialExpiryWarning(userProfile.email, {
                        userName: userProfile.firstName || userProfile.name || 'there',
                        daysRemaining: 1,
                        trialEndDate: trialEndDate.toLocaleDateString(),
                        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription&upgrade=true`
                    });
                    
                    notificationsSent++;
                    console.log(`Sent 1-day warning to ${userProfile.email}`);
                }

                // Send trial expired notification
                else if (daysUntilExpiry <= 0 && daysUntilExpiry >= -1) {
                    // Check if we haven't already sent the expired notification
                    if (!subscription.expiredNotificationSent) {
                        await emailService.sendTrialExpiredNotification(userProfile.email, {
                            userName: userProfile.firstName || userProfile.name || 'there',
                            upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription&upgrade=true`,
                            freeTierLimits: {
                                aiContent: 10,
                                images: 5,
                                research: 3,
                                marketing: 1
                            }
                        });

                        // Mark as expired notification sent
                        await repository.put({
                            PK: `USER#${userId}`,
                            SK: 'SUBSCRIPTION',
                            EntityType: 'UserPreferences',
                            Data: {
                                ...subscription,
                                expiredNotificationSent: true,
                                status: 'expired',
                                plan: 'free'
                            },
                            CreatedAt: subscriptionItem.CreatedAt,
                            UpdatedAt: now.getTime(),
                        });
                        
                        notificationsSent++;
                        console.log(`Sent trial expired notification to ${userProfile.email}`);
                    }
                }

            } catch (error) {
                console.error('Error processing user notification:', error);
                errors++;
            }
        }

        console.log(`Trial notification check completed. Sent: ${notificationsSent}, Errors: ${errors}`);

        return NextResponse.json({
            success: true,
            message: `Processed trial notifications`,
            stats: {
                usersChecked: scanResult.items.length,
                notificationsSent,
                errors
            }
        });

    } catch (error) {
        console.error('Error in trial notifications cron job:', error);
        return NextResponse.json(
            { error: 'Failed to process trial notifications' },
            { status: 500 }
        );
    }
}

// Also support GET for manual testing
export async function GET(request: NextRequest) {
    // Check if this is a development environment or has proper auth
    const isDev = process.env.NODE_ENV === 'development';
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (!isDev && (!expectedToken || authHeader !== `Bearer ${expectedToken}`)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Forward to POST handler for testing
    return POST(request);
}