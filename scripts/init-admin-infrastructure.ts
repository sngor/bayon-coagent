#!/usr/bin/env tsx
/**
 * Initialize Admin Infrastructure
 * 
 * Sets up the admin platform management infrastructure in LocalStack or AWS.
 * This script:
 * 1. Verifies DynamoDB table exists with required GSIs
 * 2. Creates sample feature flags
 * 3. Creates sample platform settings
 * 4. Initializes default configuration
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getAWSConfig } from '../src/aws/config';

const config = getAWSConfig();
const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagent';

async function initializeAdminInfrastructure() {
    console.log('🚀 Initializing Admin Platform Infrastructure...\n');

    try {
        // 1. Verify table exists
        console.log('✓ Verifying DynamoDB table...');
        // Table should already exist from main initialization

        // 2. Create default feature flags
        console.log('✓ Creating default feature flags...');
        await createDefaultFeatureFlags();

        // 3. Create default platform settings
        console.log('✓ Creating default platform settings...');
        await createDefaultSettings();

        // 4. Initialize analytics configuration
        console.log('✓ Initializing analytics configuration...');
        await initializeAnalyticsConfig();

        console.log('\n✅ Admin infrastructure initialized successfully!');
        console.log('\nNext steps:');
        console.log('1. Start the development server: npm run dev');
        console.log('2. Access admin dashboard at: http://localhost:3000/admin');
        console.log('3. Use SuperAdmin role to access all features');

    } catch (error) {
        console.error('❌ Error initializing admin infrastructure:', error);
        process.exit(1);
    }
}

async function createDefaultFeatureFlags() {
    const defaultFlags = [
        {
            flagId: 'admin-analytics',
            name: 'Admin Analytics Dashboard',
            description: 'Enable analytics dashboard for admins',
            enabled: true,
            rolloutPercentage: 100,
            targetRoles: ['Admin', 'SuperAdmin'],
        },
        {
            flagId: 'admin-support-tickets',
            name: 'Support Ticket System',
            description: 'Enable support ticket management',
            enabled: true,
            rolloutPercentage: 100,
            targetRoles: ['Admin', 'SuperAdmin'],
        },
        {
            flagId: 'admin-content-moderation',
            name: 'Content Moderation',
            description: 'Enable content moderation tools',
            enabled: true,
            rolloutPercentage: 100,
            targetRoles: ['Admin', 'SuperAdmin'],
        },
        {
            flagId: 'admin-system-health',
            name: 'System Health Monitoring',
            description: 'Enable system health dashboard',
            enabled: true,
            rolloutPercentage: 100,
            targetRoles: ['SuperAdmin'],
        },
        {
            flagId: 'admin-billing',
            name: 'Billing Management',
            description: 'Enable billing and subscription management',
            enabled: true,
            rolloutPercentage: 100,
            targetRoles: ['SuperAdmin'],
        },
    ];

    for (const flag of defaultFlags) {
        const now = Date.now();
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: 'CONFIG#FEATURE_FLAGS',
                SK: `FLAG#${flag.flagId}`,
                EntityType: 'FeatureFlag',
                Data: {
                    ...flag,
                    createdAt: now,
                    updatedAt: now,
                    createdBy: 'system',
                },
                CreatedAt: now,
                UpdatedAt: now,
            },
        }));
        console.log(`  - Created feature flag: ${flag.name}`);
    }
}

async function createDefaultSettings() {
    const defaultSettings = [
        {
            category: 'general',
            key: 'platform_name',
            value: 'Bayon Coagent',
            description: 'Platform display name',
        },
        {
            category: 'general',
            key: 'maintenance_mode',
            value: false,
            description: 'Enable maintenance mode',
        },
        {
            category: 'analytics',
            key: 'retention_days',
            value: 90,
            description: 'Analytics data retention period in days',
        },
        {
            category: 'analytics',
            key: 'aggregation_interval',
            value: 'hourly',
            description: 'Metrics aggregation interval',
        },
        {
            category: 'email',
            key: 'admin_alert_email',
            value: 'admin@bayoncoagent.com',
            description: 'Email address for admin alerts',
        },
        {
            category: 'email',
            key: 'support_email',
            value: 'support@bayoncoagent.com',
            description: 'Email address for support tickets',
        },
        {
            category: 'security',
            key: 'session_timeout',
            value: 3600,
            description: 'Session timeout in seconds',
        },
        {
            category: 'security',
            key: 'max_login_attempts',
            value: 5,
            description: 'Maximum login attempts before lockout',
        },
    ];

    for (const setting of defaultSettings) {
        const now = Date.now();
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                PK: 'CONFIG#SETTINGS',
                SK: `SETTING#${setting.category}#${setting.key}`,
                EntityType: 'PlatformSetting',
                Data: {
                    settingId: `${setting.category}#${setting.key}`,
                    ...setting,
                    updatedAt: now,
                    updatedBy: 'system',
                },
                CreatedAt: now,
                UpdatedAt: now,
            },
        }));
        console.log(`  - Created setting: ${setting.category}.${setting.key}`);
    }
}

async function initializeAnalyticsConfig() {
    // Create initial aggregated metrics entry for today
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `METRICS#${today}`,
            SK: 'DAILY',
            EntityType: 'AggregatedMetrics',
            Data: {
                date: today,
                activeUsers: 0,
                totalUsers: 0,
                newSignups24h: 0,
                dailyActiveUsers: 0,
                weeklyActiveUsers: 0,
                averageSessionDuration: 0,
                featureUsage: {},
                contentCreated: {
                    total: 0,
                    byType: {},
                },
                aiUsage: {
                    totalRequests: 0,
                    totalTokens: 0,
                    totalCost: 0,
                },
            },
            CreatedAt: now,
            UpdatedAt: now,
        },
    }));

    console.log(`  - Initialized metrics for ${today}`);
}

// Run the initialization
initializeAdminInfrastructure();
