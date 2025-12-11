#!/usr/bin/env tsx

/**
 * Setup Script for Reimagine Monitoring Infrastructure
 * 
 * This script sets up CloudWatch monitoring for the Reimagine Image Toolkit:
 * - Creates CloudWatch dashboard
 * - Sets up alarms (optional)
 * - Verifies metric namespace
 * 
 * Usage:
 *   npm run setup:reimagine-monitoring
 *   tsx scripts/setup-reimagine-monitoring.ts
 */

import { createReimagineDashboard } from '../src/aws/logging/reimagine-dashboard';
import { reimagineAlarms } from '../src/aws/logging/reimagine-alarms';
import {
  CloudWatchClient,
  PutMetricAlarmCommand,
  ListDashboardsCommand,
  type Dimension,
} from '@aws-sdk/client-cloudwatch';
import { getConfig, getAWSCredentials } from '../src/aws/config';

// ============================================================================
// Configuration
// ============================================================================

const SETUP_DASHBOARD = true;
const SETUP_ALARMS = false; // Set to true to create alarms
const SNS_TOPIC_ARN = process.env.REIMAGINE_ALARM_SNS_TOPIC; // Optional SNS topic for alarm notifications

// ============================================================================
// Setup Functions
// ============================================================================

async function setupDashboard(): Promise<void> {
  console.log('📊 Setting up Reimagine CloudWatch Dashboard...');

  try {
    const config = getConfig();
    await createReimagineDashboard(config.region);
    console.log('✅ Dashboard created successfully: Reimagine-Image-Toolkit');
    console.log(`   View at: https://console.aws.amazon.com/cloudwatch/home?region=${config.region}#dashboards:name=Reimagine-Image-Toolkit`);
  } catch (error) {
    console.error('❌ Failed to create dashboard:', error);
    throw error;
  }
}

async function setupAlarms(): Promise<void> {
  console.log('🚨 Setting up Reimagine CloudWatch Alarms...');

  const config = getConfig();
  const credentials = getAWSCredentials();

  const client = new CloudWatchClient({
    region: config.region,
    credentials: credentials.accessKeyId && credentials.secretAccessKey
      ? {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      }
      : undefined,
  });

  let successCount = 0;
  let failureCount = 0;

  for (const alarm of reimagineAlarms) {
    try {
      const command = new PutMetricAlarmCommand({
        AlarmName: alarm.name,
        AlarmDescription: alarm.description,
        MetricName: alarm.metricName,
        Namespace: alarm.namespace,
        Statistic: alarm.statistic,
        Period: alarm.period,
        EvaluationPeriods: alarm.evaluationPeriods,
        Threshold: alarm.threshold,
        ComparisonOperator: alarm.comparisonOperator,
        TreatMissingData: alarm.treatMissingData,
        Dimensions: alarm.dimensions ? Object.entries(alarm.dimensions).map(([Name, Value]) => ({ Name, Value })) : [],
        ...(SNS_TOPIC_ARN ? { AlarmActions: [SNS_TOPIC_ARN] } : {}),
      });

      await client.send(command);
      console.log(`✅ Created alarm: ${alarm.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to create alarm ${alarm.name}:`, error);
      failureCount++;
    }
  }

  console.log(`\n📊 Alarm Setup Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failureCount}`);
  console.log(`   📝 Total: ${reimagineAlarms.length}`);

  if (SNS_TOPIC_ARN) {
    console.log(`   📧 Notifications: ${SNS_TOPIC_ARN}`);
  } else {
    console.log(`   ⚠️  No SNS topic configured - alarms will not send notifications`);
    console.log(`   💡 Set REIMAGINE_ALARM_SNS_TOPIC environment variable to enable notifications`);
  }
}

async function verifySetup(): Promise<void> {
  console.log('\n🔍 Verifying monitoring setup...');

  const config = getConfig();
  const credentials = getAWSCredentials();

  const client = new CloudWatchClient({
    region: config.region,
    credentials: credentials.accessKeyId && credentials.secretAccessKey
      ? {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      }
      : undefined,
  });

  try {
    // Check if dashboard exists
    const listCommand = new ListDashboardsCommand({
      DashboardNamePrefix: 'Reimagine',
    });

    const response = await client.send(listCommand);
    const dashboardExists = response.DashboardEntries?.some(
      (d) => d.DashboardName === 'Reimagine-Image-Toolkit'
    );

    if (dashboardExists) {
      console.log('✅ Dashboard verified: Reimagine-Image-Toolkit');
    } else {
      console.log('⚠️  Dashboard not found: Reimagine-Image-Toolkit');
    }
  } catch (error) {
    console.error('❌ Failed to verify setup:', error);
  }
}

async function printUsageInstructions(): Promise<void> {
  console.log('\n📚 Monitoring Usage Instructions:');
  console.log('\n1. View Dashboard:');
  console.log('   - Go to CloudWatch Console > Dashboards');
  console.log('   - Select "Reimagine-Image-Toolkit"');
  console.log('   - View real-time metrics and charts');

  console.log('\n2. Metrics Available:');
  console.log('   - Operation counts (upload, edit, download, analysis)');
  console.log('   - Processing times by edit type');
  console.log('   - Bedrock invocations by model');
  console.log('   - Error rates and counts');
  console.log('   - Storage usage and growth');
  console.log('   - Token usage by model');

  console.log('\n3. Alarms:');
  if (SETUP_ALARMS) {
    console.log('   - Alarms are configured and active');
    console.log('   - Check CloudWatch Console > Alarms for status');
  } else {
    console.log('   - Alarms not configured (set SETUP_ALARMS=true to enable)');
  }

  console.log('\n4. Querying Metrics Programmatically:');
  console.log('   ```typescript');
  console.log('   import { getMetricsClient } from "@/aws/logging";');
  console.log('   const client = getMetricsClient();');
  console.log('   await client.recordOperation({ ... });');
  console.log('   ```');

  console.log('\n5. Tracking Operations:');
  console.log('   ```typescript');
  console.log('   import { trackOperation } from "@/aws/logging";');
  console.log('   await trackOperation("upload", userId, async () => {');
  console.log('     // Your operation code');
  console.log('   });');
  console.log('   ```');
}

// ============================================================================
// Main Execution
// ============================================================================

async function main(): Promise<void> {
  console.log('🚀 Reimagine Monitoring Setup');
  console.log('================================\n');

  try {
    // Setup dashboard
    if (SETUP_DASHBOARD) {
      await setupDashboard();
    }

    // Setup alarms
    if (SETUP_ALARMS) {
      await setupAlarms();
    }

    // Verify setup
    await verifySetup();

    // Print usage instructions
    await printUsageInstructions();

    console.log('\n✅ Monitoring setup complete!');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as setupReimagineMonitoring };
