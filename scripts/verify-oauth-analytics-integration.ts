#!/usr/bin/env tsx
/**
 * OAuth Analytics Integration Verification Script
 * 
 * Verifies that OAuth integration has been properly extended with
 * analytics scopes and capabilities for content workflow features.
 * 
 * Usage: tsx scripts/verify-oauth-analytics-integration.ts
 */

import { OAUTH_SCOPES, ANALYTICS_API_ENDPOINTS, ANALYTICS_METRICS } from '../src/integrations/social/constants';
import type { Platform } from '../src/integrations/social/types';

interface VerificationResult {
    category: string;
    status: 'PASS' | 'FAIL';
    message: string;
    details?: string[];
}

const results: VerificationResult[] = [];

/**
 * Verify OAuth scopes include analytics permissions
 */
function verifyOAuthScopes(): void {
    console.log('\n🔍 Verifying OAuth Scopes...\n');

    const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];
    const requiredAnalyticsScopes: Record<Platform, string[]> = {
        facebook: ['pages_read_engagement', 'read_insights', 'business_management'],
        instagram: ['instagram_manage_insights', 'read_insights', 'business_management'],
        linkedin: ['r_analytics', 'r_organization_followers_statistics'],
        twitter: ['tweet.moderate.write', 'follows.read'],
    };

    for (const platform of platforms) {
        const scopes = OAUTH_SCOPES[platform];
        const required = requiredAnalyticsScopes[platform];
        const missing = required.filter(scope => !scopes.includes(scope));

        if (missing.length === 0) {
            results.push({
                category: 'OAuth Scopes',
                status: 'PASS',
                message: `${platform}: All analytics scopes present`,
                details: [`Total scopes: ${scopes.length}`, `Analytics scopes: ${required.length}`],
            });
        } else {
            results.push({
                category: 'OAuth Scopes',
                status: 'FAIL',
                message: `${platform}: Missing analytics scopes`,
                details: [`Missing: ${missing.join(', ')}`],
            });
        }
    }
}

/**
 * Verify analytics API endpoints are configured
 */
function verifyAnalyticsEndpoints(): void {
    console.log('\n🔍 Verifying Analytics API Endpoints...\n');

    const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];
    const expectedEndpoints: Record<Platform, string> = {
        facebook: 'https://graph.facebook.com/v18.0',
        instagram: 'https://graph.facebook.com/v18.0',
        linkedin: 'https://api.linkedin.com/v2',
        twitter: 'https://api.twitter.com/2',
    };

    for (const platform of platforms) {
        const endpoint = ANALYTICS_API_ENDPOINTS[platform];
        const expected = expectedEndpoints[platform];

        if (endpoint === expected) {
            results.push({
                category: 'Analytics Endpoints',
                status: 'PASS',
                message: `${platform}: Endpoint configured correctly`,
                details: [`Endpoint: ${endpoint}`],
            });
        } else {
            results.push({
                category: 'Analytics Endpoints',
                status: 'FAIL',
                message: `${platform}: Incorrect endpoint`,
                details: [`Expected: ${expected}`, `Got: ${endpoint}`],
            });
        }
    }
}

/**
 * Verify analytics metrics are defined
 */
function verifyAnalyticsMetrics(): void {
    console.log('\n🔍 Verifying Analytics Metrics...\n');

    const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];
    const minimumMetrics: Record<Platform, number> = {
        facebook: 10,
        instagram: 8,
        linkedin: 8,
        twitter: 8,
    };

    for (const platform of platforms) {
        const metrics = ANALYTICS_METRICS[platform];
        const minimum = minimumMetrics[platform];

        if (metrics && metrics.length >= minimum) {
            results.push({
                category: 'Analytics Metrics',
                status: 'PASS',
                message: `${platform}: Sufficient metrics defined`,
                details: [
                    `Metrics count: ${metrics.length}`,
                    `Sample metrics: ${metrics.slice(0, 3).join(', ')}...`,
                ],
            });
        } else {
            results.push({
                category: 'Analytics Metrics',
                status: 'FAIL',
                message: `${platform}: Insufficient metrics`,
                details: [
                    `Expected: ${minimum}+`,
                    `Got: ${metrics?.length || 0}`,
                ],
            });
        }
    }
}

/**
 * Verify OAuth connection manager methods exist
 */
async function verifyConnectionManagerMethods(): Promise<void> {
    console.log('\n🔍 Verifying Connection Manager Methods...\n');

    try {
        const { getOAuthConnectionManager } = await import('../src/integrations/oauth/connection-manager');
        const manager = getOAuthConnectionManager();

        const requiredMethods = [
            'validateAnalyticsAccess',
            'getConnectionForAnalytics',
            'getAnalyticsHealthStatus',
            'disconnectByUserAndPlatform',
        ];

        for (const method of requiredMethods) {
            if (typeof (manager as any)[method] === 'function') {
                results.push({
                    category: 'Connection Manager',
                    status: 'PASS',
                    message: `Method '${method}' exists`,
                });
            } else {
                results.push({
                    category: 'Connection Manager',
                    status: 'FAIL',
                    message: `Method '${method}' missing`,
                });
            }
        }
    } catch (error) {
        results.push({
            category: 'Connection Manager',
            status: 'FAIL',
            message: 'Failed to load connection manager',
            details: [error instanceof Error ? error.message : 'Unknown error'],
        });
    }
}

/**
 * Verify content workflow OAuth actions exist
 */
async function verifyContentWorkflowActions(): Promise<void> {
    console.log('\n🔍 Verifying Content Workflow OAuth Actions...\n');

    try {
        const actions = await import('../src/app/content-workflow-oauth-actions');

        const requiredActions = [
            'initiateContentWorkflowConnection',
            'validateAnalyticsAccess',
            'getConnectionStatus',
            'getAllConnectionStatuses',
            'refreshConnectionToken',
            'getAnalyticsHealthStatus',
            'disconnectContentWorkflowConnection',
        ];

        for (const action of requiredActions) {
            if (typeof (actions as any)[action] === 'function') {
                results.push({
                    category: 'OAuth Actions',
                    status: 'PASS',
                    message: `Action '${action}' exists`,
                });
            } else {
                results.push({
                    category: 'OAuth Actions',
                    status: 'FAIL',
                    message: `Action '${action}' missing`,
                });
            }
        }
    } catch (error) {
        results.push({
            category: 'OAuth Actions',
            status: 'FAIL',
            message: 'Failed to load content workflow actions',
            details: [error instanceof Error ? error.message : 'Unknown error'],
        });
    }
}

/**
 * Verify OAuth callback routes include analytics validation
 */
async function verifyCallbackRoutes(): Promise<void> {
    console.log('\n🔍 Verifying OAuth Callback Routes...\n');

    const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

    for (const platform of platforms) {
        try {
            const routePath = `../src/app/api/oauth/${platform}/callback/route`;
            const route = await import(routePath);

            if (typeof route.GET === 'function') {
                // Check if the route file contains analytics validation
                const fs = await import('fs');
                const path = await import('path');
                const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'oauth', platform, 'callback', 'route.ts');
                const content = fs.readFileSync(filePath, 'utf-8');

                const hasAnalyticsValidation = content.includes('validateAnalyticsAccess');
                const hasAnalyticsParams = content.includes('analytics');

                if (hasAnalyticsValidation && hasAnalyticsParams) {
                    results.push({
                        category: 'Callback Routes',
                        status: 'PASS',
                        message: `${platform}: Includes analytics validation`,
                    });
                } else {
                    results.push({
                        category: 'Callback Routes',
                        status: 'FAIL',
                        message: `${platform}: Missing analytics validation`,
                        details: [
                            `Has validation: ${hasAnalyticsValidation}`,
                            `Has params: ${hasAnalyticsParams}`,
                        ],
                    });
                }
            } else {
                results.push({
                    category: 'Callback Routes',
                    status: 'FAIL',
                    message: `${platform}: GET handler missing`,
                });
            }
        } catch (error) {
            results.push({
                category: 'Callback Routes',
                status: 'FAIL',
                message: `${platform}: Failed to load route`,
                details: [error instanceof Error ? error.message : 'Unknown error'],
            });
        }
    }
}

/**
 * Print verification results
 */
function printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION RESULTS');
    console.log('='.repeat(80) + '\n');

    const categories = [...new Set(results.map(r => r.category))];

    for (const category of categories) {
        const categoryResults = results.filter(r => r.category === category);
        const passed = categoryResults.filter(r => r.status === 'PASS').length;
        const failed = categoryResults.filter(r => r.status === 'FAIL').length;

        console.log(`\n📁 ${category}`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log('   ' + '-'.repeat(76));

        for (const result of categoryResults) {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`   ${icon} ${result.message}`);
            if (result.details) {
                result.details.forEach(detail => {
                    console.log(`      • ${detail}`);
                });
            }
        }
    }

    const totalPassed = results.filter(r => r.status === 'PASS').length;
    const totalFailed = results.filter(r => r.status === 'FAIL').length;
    const totalTests = results.length;
    const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📊 Pass Rate: ${passRate}%\n`);

    if (totalFailed === 0) {
        console.log('🎉 All verifications passed! OAuth integration is ready for content workflow features.\n');
    } else {
        console.log('⚠️  Some verifications failed. Please review the results above.\n');
    }
}

/**
 * Main verification function
 */
async function main(): Promise<void> {
    console.log('🚀 Starting OAuth Analytics Integration Verification...');
    console.log('='.repeat(80));

    try {
        // Run all verifications
        verifyOAuthScopes();
        verifyAnalyticsEndpoints();
        verifyAnalyticsMetrics();
        await verifyConnectionManagerMethods();
        await verifyContentWorkflowActions();
        await verifyCallbackRoutes();

        // Print results
        printResults();

        // Exit with appropriate code
        const hasFailed = results.some(r => r.status === 'FAIL');
        process.exit(hasFailed ? 1 : 0);
    } catch (error) {
        console.error('\n❌ Verification failed with error:', error);
        process.exit(1);
    }
}

// Run verification
main();
