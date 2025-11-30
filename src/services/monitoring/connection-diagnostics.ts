/**
 * Connection Diagnostics Service
 * Provides automated diagnostics and troubleshooting for social media connections
 * 
 * Requirements: 1.2, 8.1 (Task 9.2: Streamlined channel connection experience)
 */

import { getOAuthConnectionManager } from '@/integrations/oauth/connection-manager';
import { PLATFORM_API_ENDPOINTS } from '@/integrations/social/constants';
import type { Platform, OAuthConnection } from '@/integrations/social/types';

export interface DiagnosticResult {
    test: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    suggestion?: string;
}

export interface ConnectionDiagnostics {
    platform: Platform;
    overallStatus: 'healthy' | 'warning' | 'error';
    tests: DiagnosticResult[];
    recommendations: string[];
}

/**
 * Run comprehensive diagnostics on a social media connection
 */
export async function runConnectionDiagnostics(
    userId: string,
    platform: Platform
): Promise<ConnectionDiagnostics> {
    const tests: DiagnosticResult[] = [];
    const recommendations: string[] = [];

    try {
        const manager = getOAuthConnectionManager();
        const connection = await manager.getConnection(userId, platform);

        // Test 1: Connection exists
        if (!connection) {
            tests.push({
                test: 'Connection Exists',
                status: 'fail',
                message: 'No connection found for this platform',
                suggestion: 'Connect your account to enable publishing'
            });

            recommendations.push('Click "Connect" to set up your account');

            return {
                platform,
                overallStatus: 'error',
                tests,
                recommendations
            };
        }

        tests.push({
            test: 'Connection Exists',
            status: 'pass',
            message: 'Connection found'
        });

        // Test 2: Token expiration
        const now = Date.now();
        const timeUntilExpiry = connection.expiresAt - now;
        const hoursUntilExpiry = timeUntilExpiry / (1000 * 60 * 60);

        if (timeUntilExpiry <= 0) {
            tests.push({
                test: 'Token Validity',
                status: 'fail',
                message: 'Access token has expired',
                suggestion: 'Reconnect your account to refresh the token'
            });
            recommendations.push('Reconnect your account to restore access');
        } else if (hoursUntilExpiry < 24) {
            tests.push({
                test: 'Token Validity',
                status: 'warning',
                message: `Token expires in ${Math.round(hoursUntilExpiry)} hours`,
                suggestion: 'Consider reconnecting soon to avoid interruption'
            });
            recommendations.push('Your token expires soon - reconnect to avoid interruption');
        } else {
            tests.push({
                test: 'Token Validity',
                status: 'pass',
                message: `Token valid for ${Math.round(hoursUntilExpiry / 24)} days`
            });
        }

        // Test 3: API connectivity
        try {
            const apiTest = await testPlatformAPI(platform, connection.accessToken);
            if (apiTest.success) {
                tests.push({
                    test: 'API Connectivity',
                    status: 'pass',
                    message: 'Successfully connected to platform API'
                });
            } else {
                tests.push({
                    test: 'API Connectivity',
                    status: 'fail',
                    message: apiTest.error || 'Failed to connect to platform API',
                    suggestion: 'Check your internet connection and account status'
                });
                recommendations.push('API connection failed - try reconnecting your account');
            }
        } catch (error) {
            tests.push({
                test: 'API Connectivity',
                status: 'fail',
                message: 'Network error during API test',
                suggestion: 'Check your internet connection'
            });
        }

        // Test 4: Required permissions
        const permissionTest = await testRequiredPermissions(platform, connection);
        tests.push(permissionTest);

        if (permissionTest.status === 'fail') {
            recommendations.push('Missing required permissions - reconnect and grant all permissions');
        }

        // Test 5: Platform-specific tests
        const platformTests = await runPlatformSpecificTests(platform, connection);
        tests.push(...platformTests.tests);
        recommendations.push(...platformTests.recommendations);

        // Determine overall status
        const hasFailures = tests.some(t => t.status === 'fail');
        const hasWarnings = tests.some(t => t.status === 'warning');

        const overallStatus = hasFailures ? 'error' : hasWarnings ? 'warning' : 'healthy';

        return {
            platform,
            overallStatus,
            tests,
            recommendations
        };

    } catch (error) {
        tests.push({
            test: 'Diagnostic Error',
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error during diagnostics',
            suggestion: 'Try running diagnostics again'
        });

        return {
            platform,
            overallStatus: 'error',
            tests,
            recommendations: ['Diagnostic error occurred - try again or contact support']
        };
    }
}

/**
 * Test platform API connectivity
 */
async function testPlatformAPI(platform: Platform, accessToken: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        let testUrl: string;
        let headers: Record<string, string> = {};

        switch (platform) {
            case 'facebook':
                testUrl = `${PLATFORM_API_ENDPOINTS.facebook}/me?fields=id,name&access_token=${accessToken}`;
                break;
            case 'instagram':
                testUrl = `${PLATFORM_API_ENDPOINTS.instagram}/me?fields=id,username&access_token=${accessToken}`;
                break;
            case 'linkedin':
                testUrl = `${PLATFORM_API_ENDPOINTS.linkedin}/me`;
                headers['Authorization'] = `Bearer ${accessToken}`;
                break;
            case 'twitter':
                testUrl = `${PLATFORM_API_ENDPOINTS.twitter}/users/me`;
                headers['Authorization'] = `Bearer ${accessToken}`;
                break;
            default:
                return {
                    success: false,
                    error: `Unsupported platform for API test: ${platform}`
                };
        }

        const response = await fetch(testUrl, {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: `API call failed: ${response.status} ${errorText}`,
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'API test failed',
        };
    }
}

/**
 * Test required permissions for the platform
 */
async function testRequiredPermissions(
    platform: Platform,
    connection: OAuthConnection
): Promise<DiagnosticResult> {
    // Check if connection has the required scopes
    const requiredScopes = getRequiredScopes(platform);
    const grantedScopes = connection.scope || [];

    const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope));

    if (missingScopes.length === 0) {
        return {
            test: 'Required Permissions',
            status: 'pass',
            message: 'All required permissions granted'
        };
    } else {
        return {
            test: 'Required Permissions',
            status: 'fail',
            message: `Missing permissions: ${missingScopes.join(', ')}`,
            suggestion: 'Reconnect and grant all requested permissions'
        };
    }
}

/**
 * Get required scopes for a platform
 */
function getRequiredScopes(platform: Platform): string[] {
    switch (platform) {
        case 'facebook':
            return ['pages_manage_posts', 'pages_read_engagement'];
        case 'instagram':
            return ['instagram_basic', 'instagram_content_publish'];
        case 'linkedin':
            return ['w_member_social', 'r_basicprofile'];
        case 'twitter':
            return ['tweet.write', 'users.read'];
        default:
            return [];
    }
}

/**
 * Run platform-specific diagnostic tests
 */
async function runPlatformSpecificTests(
    platform: Platform,
    connection: OAuthConnection
): Promise<{
    tests: DiagnosticResult[];
    recommendations: string[];
}> {
    const tests: DiagnosticResult[] = [];
    const recommendations: string[] = [];

    switch (platform) {
        case 'facebook':
            // Test Facebook Pages availability
            const pages = connection.metadata?.pages || [];
            if (pages.length === 0) {
                tests.push({
                    test: 'Facebook Pages',
                    status: 'fail',
                    message: 'No Facebook Pages found',
                    suggestion: 'Make sure you are an admin of at least one Facebook Page'
                });
                recommendations.push('You need to be an admin of a Facebook Page to publish posts');
            } else {
                tests.push({
                    test: 'Facebook Pages',
                    status: 'pass',
                    message: `${pages.length} Facebook Page(s) available`
                });
            }
            break;

        case 'instagram':
            // Test Instagram Business Account
            const businessAccounts = connection.metadata?.businessAccounts || [];
            if (businessAccounts.length === 0) {
                tests.push({
                    test: 'Instagram Business Account',
                    status: 'fail',
                    message: 'No Instagram Business Account found',
                    suggestion: 'Convert your Instagram to a Business Account and connect it to a Facebook Page'
                });
                recommendations.push('Instagram posting requires a Business Account connected to a Facebook Page');
            } else {
                tests.push({
                    test: 'Instagram Business Account',
                    status: 'pass',
                    message: 'Instagram Business Account verified'
                });
            }
            break;

        case 'linkedin':
            // Test LinkedIn profile completeness
            if (connection.platformUsername) {
                tests.push({
                    test: 'LinkedIn Profile',
                    status: 'pass',
                    message: 'LinkedIn profile accessible'
                });
            } else {
                tests.push({
                    test: 'LinkedIn Profile',
                    status: 'warning',
                    message: 'LinkedIn profile information incomplete',
                    suggestion: 'Ensure your LinkedIn profile is complete and public'
                });
            }
            break;

        case 'twitter':
            // Test Twitter account status
            const publicMetrics = connection.metadata?.publicMetrics;
            if (publicMetrics) {
                tests.push({
                    test: 'Twitter Account Status',
                    status: 'pass',
                    message: 'Twitter account active and accessible'
                });
            } else {
                tests.push({
                    test: 'Twitter Account Status',
                    status: 'warning',
                    message: 'Unable to verify account metrics',
                    suggestion: 'Check that your Twitter account is active and not suspended'
                });
            }
            break;
    }

    return { tests, recommendations };
}

/**
 * Get connection health score (0-100)
 */
export function getConnectionHealthScore(diagnostics: ConnectionDiagnostics): number {
    const totalTests = diagnostics.tests.length;
    if (totalTests === 0) return 0;

    const passedTests = diagnostics.tests.filter(t => t.status === 'pass').length;
    const warningTests = diagnostics.tests.filter(t => t.status === 'warning').length;

    // Pass = 100%, Warning = 50%, Fail = 0%
    const score = ((passedTests * 100) + (warningTests * 50)) / totalTests;
    return Math.round(score);
}

/**
 * Generate automated fix suggestions
 */
export function generateFixSuggestions(diagnostics: ConnectionDiagnostics): string[] {
    const suggestions: string[] = [];

    // Add test-specific suggestions
    diagnostics.tests.forEach(test => {
        if (test.suggestion && test.status !== 'pass') {
            suggestions.push(test.suggestion);
        }
    });

    // Add general recommendations
    suggestions.push(...diagnostics.recommendations);

    // Remove duplicates
    return [...new Set(suggestions)];
}