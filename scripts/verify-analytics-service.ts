#!/usr/bin/env tsx
/**
 * Analytics Service Verification Script
 * 
 * Verifies that the content analytics service is properly configured
 * and all required functionality is available.
 */

import {
    AnalyticsService,
    analyticsService,
    trackPublication,
    getContentAnalytics,
    getAnalyticsByType,
    getAnalyticsForTimeRange,
    getBenchmarkComparison,
    createABTest,
    getABTestResults,
    trackABTestMetrics,
    trackROIEvent,
    getROIAnalytics,
    exportROIData,
    syncExternalAnalytics,
    TimeRangePreset,
} from '../src/services/publishing/content-analytics-service';

import {
    ContentCategory,
    PublishChannelType
} from '../src/lib/content-workflow-types';

console.log('🔍 Verifying Content Analytics Service...\n');

// Verification checks
const checks = {
    classExport: false,
    instanceExport: false,
    trackPublicationExport: false,
    getContentAnalyticsExport: false,
    getAnalyticsByTypeExport: false,
    getAnalyticsForTimeRangeExport: false,
    getBenchmarkComparisonExport: false,
    createABTestExport: false,
    getABTestResultsExport: false,
    trackABTestMetricsExport: false,
    trackROIEventExport: false,
    getROIAnalyticsExport: false,
    exportROIDataExport: false,
    syncExternalAnalyticsExport: false,
    timeRangePresetExport: false,
    classInstantiation: false,
    instanceMethods: false,
};

try {
    // Check class export
    if (typeof AnalyticsService === 'function') {
        checks.classExport = true;
        console.log('✅ AnalyticsService class exported');
    } else {
        console.log('❌ AnalyticsService class not exported');
    }

    // Check instance export
    if (analyticsService && typeof analyticsService === 'object') {
        checks.instanceExport = true;
        console.log('✅ analyticsService instance exported');
    } else {
        console.log('❌ analyticsService instance not exported');
    }

    // Check function exports
    const functionChecks = [
        { name: 'trackPublication', fn: trackPublication, key: 'trackPublicationExport' },
        { name: 'getContentAnalytics', fn: getContentAnalytics, key: 'getContentAnalyticsExport' },
        { name: 'getAnalyticsByType', fn: getAnalyticsByType, key: 'getAnalyticsByTypeExport' },
        { name: 'getAnalyticsForTimeRange', fn: getAnalyticsForTimeRange, key: 'getAnalyticsForTimeRangeExport' },
        { name: 'getBenchmarkComparison', fn: getBenchmarkComparison, key: 'getBenchmarkComparisonExport' },
        { name: 'createABTest', fn: createABTest, key: 'createABTestExport' },
        { name: 'getABTestResults', fn: getABTestResults, key: 'getABTestResultsExport' },
        { name: 'trackABTestMetrics', fn: trackABTestMetrics, key: 'trackABTestMetricsExport' },
        { name: 'trackROIEvent', fn: trackROIEvent, key: 'trackROIEventExport' },
        { name: 'getROIAnalytics', fn: getROIAnalytics, key: 'getROIAnalyticsExport' },
        { name: 'exportROIData', fn: exportROIData, key: 'exportROIDataExport' },
        { name: 'syncExternalAnalytics', fn: syncExternalAnalytics, key: 'syncExternalAnalyticsExport' },
    ];

    functionChecks.forEach(({ name, fn, key }) => {
        if (typeof fn === 'function') {
            checks[key as keyof typeof checks] = true;
            console.log(`✅ ${name} function exported`);
        } else {
            console.log(`❌ ${name} function not exported`);
        }
    });

    // Check TimeRangePreset enum
    if (TimeRangePreset &&
        TimeRangePreset.LAST_7_DAYS === '7d' &&
        TimeRangePreset.LAST_30_DAYS === '30d' &&
        TimeRangePreset.LAST_90_DAYS === '90d' &&
        TimeRangePreset.CUSTOM === 'custom') {
        checks.timeRangePresetExport = true;
        console.log('✅ TimeRangePreset enum exported with correct values');
    } else {
        console.log('❌ TimeRangePreset enum not exported or has incorrect values');
    }

    // Check class instantiation
    try {
        const instance = new AnalyticsService();
        if (instance) {
            checks.classInstantiation = true;
            console.log('✅ AnalyticsService can be instantiated');
        }
    } catch (error) {
        console.log('❌ AnalyticsService cannot be instantiated:', error);
    }

    // Check instance methods
    if (analyticsService.trackPublication &&
        analyticsService.getContentAnalytics &&
        analyticsService.getAnalyticsByType) {
        checks.instanceMethods = true;
        console.log('✅ analyticsService instance has required methods');
    } else {
        console.log('❌ analyticsService instance missing required methods');
    }

    // Summary
    console.log('\n📊 Verification Summary:');
    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(v => v).length;
    const failedChecks = totalChecks - passedChecks;

    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   ✅ Passed: ${passedChecks}`);
    console.log(`   ❌ Failed: ${failedChecks}`);
    console.log(`   Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(1)}%`);

    if (failedChecks === 0) {
        console.log('\n🎉 All verification checks passed!');
        console.log('   The content analytics service is properly configured.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some verification checks failed.');
        console.log('   Please review the errors above.');
        process.exit(1);
    }

} catch (error) {
    console.error('\n❌ Verification failed with error:');
    console.error(error);
    process.exit(1);
}
