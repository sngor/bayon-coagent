/**
 * User Event Processor
 * 
 * Handles events related to user lifecycle, subscriptions, and usage
 */

import { EventBridgeEvent, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '@/aws/config';

interface UserRegisteredEvent {
    userId: string;
    email: string;
    registrationMethod: string;
    referralSource?: string;
    timestamp: string;
}

interface SubscriptionChangedEvent {
    userId: string;
    oldPlan: string;
    newPlan: string;
    changeReason: string;
    timestamp: string;
}

interface UsageUpdatedEvent {
    userId: string;
    usageType: string;
    usageData: any;
    timestamp: string;
}

interface ProfileUpdatedEvent {
    userId: string;
    profileData: any;
    changes: string[];
    timestamp: string;
}

const config = getConfig();
const eventBridge = new EventBridgeClient({ region: config.region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

export const handler = async (
    event: EventBridgeEvent<string, UserRegisteredEvent | SubscriptionChangedEvent | UsageUpdatedEvent | ProfileUpdatedEvent>,
    _context: Context
) => {
    console.log('Processing user event:', JSON.stringify(event, null, 2));

    try {
        switch (event['detail-type']) {
            case 'User Registered':
                await handleUserRegistered(event.detail as UserRegisteredEvent);
                break;

            case 'Subscription Changed':
                await handleSubscriptionChanged(event.detail as SubscriptionChangedEvent);
                break;

            case 'Usage Updated':
                await handleUsageUpdated(event.detail as UsageUpdatedEvent);
                break;

            case 'Profile Updated':
                await handleProfileUpdated(event.detail as ProfileUpdatedEvent);
                break;

            default:
                console.warn('Unknown user event type:', event['detail-type']);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User event processed successfully' })
        };

    } catch (error) {
        console.error('Error processing user event:', error);
        throw error;
    }
};

async function handleUserRegistered(detail: UserRegisteredEvent) {
    console.log('Handling user registered:', detail.userId);

    // 1. Initialize user onboarding
    await initializeUserOnboarding(detail);

    // 2. Set up default preferences
    await setupDefaultPreferences(detail);

    // 3. Track registration analytics
    await trackRegistrationAnalytics(detail);

    // 4. Send welcome notification
    await sendWelcomeNotification(detail);

    // 5. Trigger onboarding workflow
    await triggerOnboardingWorkflow(detail);

    // 6. Set up initial recommendations
    await setupInitialRecommendations(detail);
}

async function handleSubscriptionChanged(detail: SubscriptionChangedEvent) {
    console.log('Handling subscription changed for user:', detail.userId);

    // 1. Update user subscription data
    await updateUserSubscription(detail);

    // 2. Adjust feature access
    await adjustFeatureAccess(detail);

    // 3. Track subscription analytics
    await trackSubscriptionAnalytics(detail);

    // 4. Send subscription change notification
    await sendSubscriptionChangeNotification(detail);

    // 5. Update usage limits
    await updateUsageLimits(detail);

    // 6. Trigger plan-specific workflows
    await triggerPlanSpecificWorkflows(detail);
}

async function handleUsageUpdated(detail: UsageUpdatedEvent) {
    console.log('Handling usage updated for user:', detail.userId);

    // 1. Update usage metrics
    await updateUsageMetrics(detail);

    // 2. Check usage limits
    await checkUsageLimits(detail);

    // 3. Update user recommendations based on usage
    await updateUsageBasedRecommendations(detail);

    // 4. Trigger usage-based alerts if needed
    await triggerUsageAlerts(detail);
}

async function handleProfileUpdated(detail: ProfileUpdatedEvent) {
    console.log('Handling profile updated for user:', detail.userId);

    // 1. Update profile completion score
    await updateProfileCompletionScore(detail);

    // 2. Refresh personalization settings
    await refreshPersonalizationSettings(detail);

    // 3. Update content recommendations
    await updateContentRecommendations(detail);

    // 4. Trigger profile-based workflows
    await triggerProfileBasedWorkflows(detail);
}

async function initializeUserOnboarding(detail: UserRegisteredEvent) {
    const onboardingData = {
        PK: `USER#${detail.userId}`,
        SK: 'ONBOARDING',
        EntityType: 'Onboarding',
        UserId: detail.userId,
        Status: 'started',
        CurrentStep: 'welcome',
        Steps: {
            welcome: { completed: false, completedAt: null },
            profile: { completed: false, completedAt: null },
            preferences: { completed: false, completedAt: null },
            firstContent: { completed: false, completedAt: null },
            tutorial: { completed: false, completedAt: null }
        },
        RegistrationMethod: detail.registrationMethod,
        ReferralSource: detail.referralSource,
        StartedAt: detail.timestamp,
        CreatedAt: Date.now(),
        UpdatedAt: Date.now()
    };

    await dynamoClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: onboardingData
    }));

    console.log('User onboarding initialized for:', detail.userId);
}

async function setupDefaultPreferences(detail: UserRegisteredEvent) {
    const defaultPreferences = {
        PK: `USER#${detail.userId}`,
        SK: 'PREFERENCES',
        EntityType: 'UserPreferences',
        UserId: detail.userId,
        Notifications: {
            email: true,
            push: true,
            realtime: true,
            marketing: false
        },
        ContentGeneration: {
            tone: 'professional',
            length: 'medium',
            includeImages: true,
            autoSave: true
        },
        Research: {
            autoSaveReports: true,
            shareReports: false,
            defaultSources: ['web', 'news', 'academic']
        },
        Market: {
            alertThreshold: 'medium',
            trackingAreas: [],
            autoAlerts: true
        },
        CreatedAt: Date.now(),
        UpdatedAt: Date.now()
    };

    await dynamoClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: defaultPreferences
    }));

    console.log('Default preferences set for user:', detail.userId);
}

async function trackRegistrationAnalytics(detail: UserRegisteredEvent) {
    const today = new Date().toISOString().split('T')[0];

    // Global registration analytics
    const globalParams = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: 'GLOBAL_ANALYTICS',
            SK: `REGISTRATIONS#${today}`
        },
        UpdateExpression: `
      ADD 
        TotalRegistrations :inc,
        #method = if_not_exists(#method, :zero) + :inc
      SET 
        LastRegistrationAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#method': `${detail.registrationMethod}Count`
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':zero': 0,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(globalParams));

    // Referral source tracking
    if (detail.referralSource) {
        const referralParams = {
            TableName: process.env.DYNAMODB_TABLE_NAME!,
            Key: {
                PK: 'REFERRAL_ANALYTICS',
                SK: `SOURCE#${detail.referralSource}`
            },
            UpdateExpression: `
        ADD Registrations :inc
        SET 
          LastRegistrationAt = :now,
          UpdatedAt = :now
      `,
            ExpressionAttributeValues: {
                ':inc': 1,
                ':now': Date.now()
            }
        };

        await dynamoClient.send(new UpdateCommand(referralParams));
    }

    console.log('Registration analytics tracked for:', detail.userId);
}

async function sendWelcomeNotification(detail: UserRegisteredEvent) {
    const welcomeEvent = {
        Source: 'bayon.coagent.user',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'welcome',
            message: 'Welcome to Bayon CoAgent! Let\'s get you started.',
            data: {
                registrationMethod: detail.registrationMethod,
                nextStep: 'complete-profile'
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [welcomeEvent]
    }));
}

async function triggerOnboardingWorkflow(detail: UserRegisteredEvent) {
    const onboardingEvent = {
        Source: 'bayon.coagent.user',
        DetailType: 'Onboarding Workflow Started',
        Detail: JSON.stringify({
            userId: detail.userId,
            registrationMethod: detail.registrationMethod,
            referralSource: detail.referralSource,
            timestamp: detail.timestamp
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [onboardingEvent]
    }));
}

async function setupInitialRecommendations(detail: UserRegisteredEvent) {
    const initialRecommendations = {
        PK: `USER#${detail.userId}`,
        SK: 'RECOMMENDATIONS',
        EntityType: 'UserRecommendations',
        UserId: detail.userId,
        ContentRecommendations: [
            {
                type: 'blog-post',
                topic: 'Introduction to your local market',
                priority: 'high',
                reason: 'new-user-content'
            },
            {
                type: 'social-media',
                topic: 'Welcome post for new agent',
                priority: 'medium',
                reason: 'social-presence'
            }
        ],
        FeatureRecommendations: [
            {
                feature: 'profile-completion',
                priority: 'high',
                reason: 'onboarding'
            },
            {
                feature: 'brand-audit',
                priority: 'medium',
                reason: 'brand-establishment'
            }
        ],
        CreatedAt: Date.now(),
        UpdatedAt: Date.now()
    };

    await dynamoClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: initialRecommendations
    }));
}

async function updateUserSubscription(detail: SubscriptionChangedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: 'SUBSCRIPTION'
        },
        UpdateExpression: `
      SET 
        CurrentPlan = :newPlan,
        PreviousPlan = :oldPlan,
        ChangeReason = :reason,
        ChangedAt = :timestamp,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':newPlan': detail.newPlan,
            ':oldPlan': detail.oldPlan,
            ':reason': detail.changeReason,
            ':timestamp': detail.timestamp,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function adjustFeatureAccess(detail: SubscriptionChangedEvent) {
    // Define feature access by plan
    const planFeatures: Record<string, any> = {
        'free': {
            contentGeneration: { limit: 5, period: 'month' },
            research: { limit: 3, period: 'month' },
            aiImageEditing: { enabled: false },
            advancedAnalytics: { enabled: false }
        },
        'pro': {
            contentGeneration: { limit: 50, period: 'month' },
            research: { limit: 20, period: 'month' },
            aiImageEditing: { enabled: true, limit: 10, period: 'month' },
            advancedAnalytics: { enabled: true }
        },
        'enterprise': {
            contentGeneration: { limit: -1 }, // unlimited
            research: { limit: -1 },
            aiImageEditing: { enabled: true, limit: -1 },
            advancedAnalytics: { enabled: true },
            customBranding: { enabled: true }
        }
    };

    const features = planFeatures[detail.newPlan] || planFeatures['free'];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: 'FEATURE_ACCESS'
        },
        UpdateExpression: `
      SET 
        Features = :features,
        Plan = :plan,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':features': features,
            ':plan': detail.newPlan,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function trackSubscriptionAnalytics(detail: SubscriptionChangedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: 'SUBSCRIPTION_ANALYTICS',
            SK: `CHANGES#${today}`
        },
        UpdateExpression: `
      ADD 
        TotalChanges :inc,
        #newPlan = if_not_exists(#newPlan, :zero) + :inc,
        #oldPlan = if_not_exists(#oldPlan, :zero) - :inc
      SET 
        LastChangeAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#newPlan': `${detail.newPlan}Count`,
            '#oldPlan': `${detail.oldPlan}Count`
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':zero': 0,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function sendSubscriptionChangeNotification(detail: SubscriptionChangedEvent) {
    const isUpgrade = getPlanTier(detail.newPlan) > getPlanTier(detail.oldPlan);

    const notificationEvent = {
        Source: 'bayon.coagent.user',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'subscription_changed',
            message: `Your subscription has been ${isUpgrade ? 'upgraded' : 'changed'} to ${detail.newPlan}`,
            data: {
                oldPlan: detail.oldPlan,
                newPlan: detail.newPlan,
                changeReason: detail.changeReason,
                isUpgrade
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [notificationEvent]
    }));
}

async function updateUsageLimits(detail: SubscriptionChangedEvent) {
    const today = new Date().toISOString().split('T')[0];

    // Reset usage counters for the new plan
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `USAGE#${today}`
        },
        UpdateExpression: `
      SET 
        Plan = :plan,
        ResetAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':plan': detail.newPlan,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function triggerPlanSpecificWorkflows(detail: SubscriptionChangedEvent) {
    const workflows = [];

    // Trigger onboarding for new premium features
    if (detail.newPlan === 'pro' && detail.oldPlan === 'free') {
        workflows.push({
            Source: 'bayon.coagent.user',
            DetailType: 'Pro Features Onboarding Started',
            Detail: JSON.stringify({
                userId: detail.userId,
                features: ['ai-image-editing', 'advanced-analytics']
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        });
    }

    if (detail.newPlan === 'enterprise') {
        workflows.push({
            Source: 'bayon.coagent.user',
            DetailType: 'Enterprise Setup Started',
            Detail: JSON.stringify({
                userId: detail.userId,
                features: ['custom-branding', 'team-management']
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        });
    }

    if (workflows.length > 0) {
        await eventBridge.send(new PutEventsCommand({
            Entries: workflows
        }));
    }
}

async function updateUsageMetrics(detail: UsageUpdatedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `USAGE#${today}`
        },
        UpdateExpression: `
      ADD #usageType :inc
      SET 
        LastUsageAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#usageType': detail.usageType
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function checkUsageLimits(detail: UsageUpdatedEvent) {
    // Get user's current plan and usage
    const userFeatures = await getUserFeatureAccess(detail.userId);
    const currentUsage = await getCurrentUsage(detail.userId);

    if (userFeatures && currentUsage) {
        const limit = userFeatures.Features?.[detail.usageType]?.limit;
        const current = currentUsage[detail.usageType] || 0;

        // Check if approaching limit (80%)
        if (limit > 0 && current >= limit * 0.8) {
            await sendUsageLimitWarning(detail.userId, detail.usageType, current, limit);
        }

        // Check if limit exceeded
        if (limit > 0 && current >= limit) {
            await sendUsageLimitExceeded(detail.userId, detail.usageType, current, limit);
        }
    }
}

async function updateUsageBasedRecommendations(detail: UsageUpdatedEvent) {
    // Update recommendations based on usage patterns
    const recommendations = [];

    if (detail.usageType === 'contentGeneration') {
        recommendations.push({
            type: 'feature',
            feature: 'content-templates',
            reason: 'frequent-content-generation',
            priority: 'medium'
        });
    }

    if (detail.usageType === 'research') {
        recommendations.push({
            type: 'feature',
            feature: 'knowledge-base',
            reason: 'frequent-research',
            priority: 'high'
        });
    }

    if (recommendations.length > 0) {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME!,
            Key: {
                PK: `USER#${detail.userId}`,
                SK: 'RECOMMENDATIONS'
            },
            UpdateExpression: `
        SET 
          UsageRecommendations = list_append(if_not_exists(UsageRecommendations, :empty), :recs),
          UpdatedAt = :now
      `,
            ExpressionAttributeValues: {
                ':recs': recommendations,
                ':empty': [],
                ':now': Date.now()
            }
        };

        await dynamoClient.send(new UpdateCommand(params));
    }
}

async function triggerUsageAlerts(detail: UsageUpdatedEvent) {
    // Implementation for usage-based alerts
    console.log('Usage alerts triggered for:', detail.userId, detail.usageType);
}

async function updateProfileCompletionScore(detail: ProfileUpdatedEvent) {
    // Calculate profile completion score
    const requiredFields = ['businessName', 'email', 'phone', 'address', 'specialties', 'bio'];
    const completedFields = requiredFields.filter(field =>
        detail.profileData[field] && detail.profileData[field].toString().trim() !== ''
    );

    const completionScore = (completedFields.length / requiredFields.length) * 100;

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: 'PROFILE'
        },
        UpdateExpression: `
      SET 
        CompletionScore = :score,
        CompletedFields = :completed,
        LastUpdated = :timestamp,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':score': completionScore,
            ':completed': completedFields,
            ':timestamp': detail.timestamp,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function refreshPersonalizationSettings(detail: ProfileUpdatedEvent) {
    // Update personalization based on profile changes
    const personalizationEvent = {
        Source: 'bayon.coagent.user',
        DetailType: 'Personalization Refresh Requested',
        Detail: JSON.stringify({
            userId: detail.userId,
            profileChanges: detail.changes,
            profileData: detail.profileData
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [personalizationEvent]
    }));
}

async function updateContentRecommendations(detail: ProfileUpdatedEvent) {
    // Update content recommendations based on profile
    if (detail.changes.includes('specialties') || detail.changes.includes('marketArea')) {
        const contentEvent = {
            Source: 'bayon.coagent.user',
            DetailType: 'Content Recommendations Update Requested',
            Detail: JSON.stringify({
                userId: detail.userId,
                specialties: detail.profileData.specialties,
                marketArea: detail.profileData.marketArea,
                changes: detail.changes
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        };

        await eventBridge.send(new PutEventsCommand({
            Entries: [contentEvent]
        }));
    }
}

async function triggerProfileBasedWorkflows(detail: ProfileUpdatedEvent) {
    const workflows = [];

    // Trigger brand audit if NAP fields changed
    const napFields = ['businessName', 'address', 'phone', 'email'];
    if (detail.changes.some(change => napFields.includes(change))) {
        workflows.push({
            Source: 'bayon.coagent.user',
            DetailType: 'Brand Audit Requested',
            Detail: JSON.stringify({
                userId: detail.userId,
                reason: 'nap-update',
                changes: detail.changes.filter(change => napFields.includes(change))
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        });
    }

    if (workflows.length > 0) {
        await eventBridge.send(new PutEventsCommand({
            Entries: workflows
        }));
    }
}

// Helper functions
function getPlanTier(plan: string): number {
    const tiers: Record<string, number> = {
        'free': 1,
        'pro': 2,
        'enterprise': 3
    };
    return tiers[plan] || 0;
}

async function getUserFeatureAccess(userId: string): Promise<any> {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${userId}`,
            SK: 'FEATURE_ACCESS'
        }
    };

    const result = await dynamoClient.send(new GetCommand(params));
    return result.Item || null;
}

async function getCurrentUsage(userId: string): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${userId}`,
            SK: `USAGE#${today}`
        }
    };

    const result = await dynamoClient.send(new GetCommand(params));
    return result.Item || null;
}

async function sendUsageLimitWarning(userId: string, usageType: string, current: number, limit: number) {
    const warningEvent = {
        Source: 'bayon.coagent.user',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId,
            type: 'usage_warning',
            message: `You're approaching your ${usageType} limit (${current}/${limit})`,
            data: {
                usageType,
                current,
                limit,
                percentage: Math.round((current / limit) * 100)
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [warningEvent]
    }));
}

async function sendUsageLimitExceeded(userId: string, usageType: string, current: number, limit: number) {
    const exceededEvent = {
        Source: 'bayon.coagent.user',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId,
            type: 'usage_limit_exceeded',
            message: `You've reached your ${usageType} limit. Consider upgrading your plan.`,
            data: {
                usageType,
                current,
                limit,
                upgradeRecommended: true
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [exceededEvent]
    }));
}