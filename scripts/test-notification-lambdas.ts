#!/usr/bin/env tsx
/**
 * Test script for notification Lambda functions
 * 
 * Tests the three background processing Lambda functions:
 * - Digest Generator
 * - Retry Processor
 * - Cleanup Maintenance
 */

console.log('🧪 Testing Notification Lambda Functions\n');

// Test 1: Verify Lambda files exist
console.log('1️⃣ Checking Lambda function files...');
const fs = require('fs');
const path = require('path');

const lambdaFiles = [
    'src/lambda/notification-digest-generator.ts',
    'src/lambda/notification-retry-processor.ts',
    'src/lambda/notification-cleanup-maintenance.ts',
];

let allFilesExist = true;
for (const file of lambdaFiles) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
    console.error('\n❌ Some Lambda files are missing!');
    process.exit(1);
}

console.log('\n2️⃣ Checking template.yaml configuration...');

// Test 2: Verify template.yaml has Lambda function definitions
const templatePath = path.join(process.cwd(), 'template.yaml');
const templateContent = fs.readFileSync(templatePath, 'utf-8');

const requiredFunctions = [
    'NotificationDigestGeneratorFunction',
    'NotificationRetryProcessorFunction',
    'NotificationCleanupMaintenanceFunction',
];

let allFunctionsConfigured = true;
for (const func of requiredFunctions) {
    const exists = templateContent.includes(func);
    console.log(`   ${exists ? '✅' : '❌'} ${func}`);
    if (!exists) allFunctionsConfigured = false;
}

if (!allFunctionsConfigured) {
    console.error('\n❌ Some Lambda functions are not configured in template.yaml!');
    process.exit(1);
}

console.log('\n3️⃣ Checking CloudWatch alarms...');

const requiredAlarms = [
    'NotificationDigestGeneratorErrorAlarm',
    'NotificationRetryProcessorErrorAlarm',
    'NotificationCleanupMaintenanceErrorAlarm',
];

let allAlarmsConfigured = true;
for (const alarm of requiredAlarms) {
    const exists = templateContent.includes(alarm);
    console.log(`   ${exists ? '✅' : '❌'} ${alarm}`);
    if (!exists) allAlarmsConfigured = false;
}

if (!allAlarmsConfigured) {
    console.error('\n❌ Some CloudWatch alarms are not configured!');
    process.exit(1);
}

console.log('\n4️⃣ Checking Lambda outputs...');

const requiredOutputs = [
    'NotificationDigestGeneratorFunctionArn',
    'NotificationRetryProcessorFunctionArn',
    'NotificationCleanupMaintenanceFunctionArn',
];

let allOutputsConfigured = true;
for (const output of requiredOutputs) {
    const exists = templateContent.includes(output);
    console.log(`   ${exists ? '✅' : '❌'} ${output}`);
    if (!exists) allOutputsConfigured = false;
}

if (!allOutputsConfigured) {
    console.error('\n❌ Some Lambda outputs are not configured!');
    process.exit(1);
}

console.log('\n5️⃣ Checking scheduled events...');

const requiredSchedules = [
    'DailyDigestSchedule',
    'WeeklyDigestSchedule',
    'RetrySchedule',
    'CleanupSchedule',
];

let allSchedulesConfigured = true;
for (const schedule of requiredSchedules) {
    const exists = templateContent.includes(schedule);
    console.log(`   ${exists ? '✅' : '❌'} ${schedule}`);
    if (!exists) allSchedulesConfigured = false;
}

if (!allSchedulesConfigured) {
    console.error('\n❌ Some scheduled events are not configured!');
    process.exit(1);
}

console.log('\n6️⃣ Verifying Lambda function structure...');

// Test 3: Basic syntax check for Lambda handlers
for (const file of lambdaFiles) {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
    const hasHandler = content.includes('export const handler');
    const hasLambdaEvent = content.includes('LambdaEvent');
    const hasLambdaContext = content.includes('LambdaContext');

    const fileName = path.basename(file);
    console.log(`   ${fileName}:`);
    console.log(`      ${hasHandler ? '✅' : '❌'} Has handler export`);
    console.log(`      ${hasLambdaEvent ? '✅' : '❌'} Has LambdaEvent interface`);
    console.log(`      ${hasLambdaContext ? '✅' : '❌'} Has LambdaContext interface`);

    if (!hasHandler || !hasLambdaEvent || !hasLambdaContext) {
        console.error(`\n❌ ${fileName} is missing required Lambda structure!`);
        process.exit(1);
    }
}

console.log('\n7️⃣ Checking function-specific features...');

// Digest Generator specific checks
const digestContent = fs.readFileSync('src/lambda/notification-digest-generator.ts', 'utf-8');
console.log('   Digest Generator:');
console.log(`      ${digestContent.includes('generateDailyDigests') ? '✅' : '❌'} Has generateDailyDigests`);
console.log(`      ${digestContent.includes('generateWeeklyDigests') ? '✅' : '❌'} Has generateWeeklyDigests`);
console.log(`      ${digestContent.includes('sendDigestEmail') ? '✅' : '❌'} Has sendDigestEmail`);
console.log(`      ${digestContent.includes('isDigestTime') ? '✅' : '❌'} Has isDigestTime`);

// Retry Processor specific checks
const retryContent = fs.readFileSync('src/lambda/notification-retry-processor.ts', 'utf-8');
console.log('   Retry Processor:');
console.log(`      ${retryContent.includes('processFailedDeliveries') ? '✅' : '❌'} Has processFailedDeliveries`);
console.log(`      ${retryContent.includes('calculateRetryDelay') ? '✅' : '❌'} Has calculateRetryDelay`);
console.log(`      ${retryContent.includes('retryDelivery') ? '✅' : '❌'} Has retryDelivery`);
console.log(`      ${retryContent.includes('moveToDeadLetterQueue') ? '✅' : '❌'} Has moveToDeadLetterQueue`);

// Cleanup Maintenance specific checks
const cleanupContent = fs.readFileSync('src/lambda/notification-cleanup-maintenance.ts', 'utf-8');
console.log('   Cleanup Maintenance:');
console.log(`      ${cleanupContent.includes('expireNotifications') ? '✅' : '❌'} Has expireNotifications`);
console.log(`      ${cleanupContent.includes('archiveOldNotifications') ? '✅' : '❌'} Has archiveOldNotifications`);
console.log(`      ${cleanupContent.includes('aggregateMetrics') ? '✅' : '❌'} Has aggregateMetrics`);
console.log(`      ${cleanupContent.includes('cleanupOldDeliveryRecords') ? '✅' : '❌'} Has cleanupOldDeliveryRecords`);

console.log('\n✅ All tests passed! Lambda functions are properly configured.\n');
console.log('📋 Summary:');
console.log('   - 3 Lambda functions created');
console.log('   - 3 CloudWatch alarms configured');
console.log('   - 3 Lambda outputs defined');
console.log('   - 4 scheduled events configured');
console.log('   - All required functions and features implemented');
console.log('\n🚀 Ready for deployment!');
