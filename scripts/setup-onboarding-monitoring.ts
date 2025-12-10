#!/usr/bin/env tsx

/**
 * Setup Onboarding Monitoring Script
 * 
 * Initializes CloudWatch dashboard and alarms for onboarding metrics.
 * Run this script after deploying the onboarding feature to set up monitoring.
 * 
 * Usage:
 *   npm run setup:onboarding-monitoring
 *   or
 *   tsx scripts/setup-onboarding-monitoring.ts
 */

import { onboardingMonitoring } from '../src/services/onboarding/onboarding-monitoring-service';

async function setupMonitoring() {
    console.log('🚀 Setting up onboarding monitoring...\n');

    try {
        // Create CloudWatch dashboard
        console.log('📊 Creating CloudWatch dashboard...');
        await onboardingMonitoring.createDashboard();
        console.log('✅ Dashboard created successfully\n');

        // Create CloudWatch alarms
        console.log('🔔 Creating CloudWatch alarms...');
        await onboardingMonitoring.createAlarms();
        console.log('✅ Alarms created successfully\n');

        // Get alarm statuses
        console.log('📋 Checking alarm statuses...');
        const alarmStatuses = await onboardingMonitoring.getAlarmStatuses();

        if (alarmStatuses.length > 0) {
            console.log('\nAlarm Statuses:');
            alarmStatuses.forEach((alarm) => {
                const statusIcon = alarm.state === 'OK' ? '✅' : alarm.state === 'ALARM' ? '🚨' : '⚠️';
                console.log(`  ${statusIcon} ${alarm.alarmName}: ${alarm.state}`);
                console.log(`     Threshold: ${alarm.threshold}`);
                console.log(`     Reason: ${alarm.reason}\n`);
            });
        } else {
            console.log('  No alarms found (they may take a few moments to appear)\n');
        }

        console.log('✨ Onboarding monitoring setup complete!\n');
        console.log('📊 View your dashboard at:');
        console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#dashboards:name=OnboardingMetrics\n`);
        console.log('🔔 View your alarms at:');
        console.log(`   https://console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION || 'us-east-1'}#alarmsV2:\n`);

    } catch (error) {
        console.error('❌ Error setting up monitoring:', error);
        process.exit(1);
    }
}

// Run the setup
setupMonitoring();
