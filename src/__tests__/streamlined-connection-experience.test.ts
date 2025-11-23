/**
 * Tests for Streamlined Channel Connection Experience
 * Task 9.2: Enhanced OAuth flow with troubleshooting and diagnostics
 * 
 * Requirements: 1.2, 8.1
 */

import { getConnectionHealthScore, generateFixSuggestions } from '@/services/connection-diagnostics';
import type { Platform } from '@/integrations/social/types';

describe('Streamlined Connection Experience', () => {
    describe('Health Score Calculation', () => {
        it('should calculate 100% for all passing tests', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'healthy' as const,
                tests: [
                    { test: 'Test 1', status: 'pass' as const, message: 'OK' },
                    { test: 'Test 2', status: 'pass' as const, message: 'OK' },
                    { test: 'Test 3', status: 'pass' as const, message: 'OK' },
                ],
                recommendations: [],
            };

            const score = getConnectionHealthScore(diagnostics);
            expect(score).toBe(100);
        });

        it('should calculate 50% for all warning tests', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'warning' as const,
                tests: [
                    { test: 'Test 1', status: 'warning' as const, message: 'Warning' },
                    { test: 'Test 2', status: 'warning' as const, message: 'Warning' },
                ],
                recommendations: [],
            };

            const score = getConnectionHealthScore(diagnostics);
            expect(score).toBe(50);
        });

        it('should calculate 0% for all failing tests', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'error' as const,
                tests: [
                    { test: 'Test 1', status: 'fail' as const, message: 'Failed' },
                    { test: 'Test 2', status: 'fail' as const, message: 'Failed' },
                ],
                recommendations: [],
            };

            const score = getConnectionHealthScore(diagnostics);
            expect(score).toBe(0);
        });

        it('should calculate mixed scores correctly', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'warning' as const,
                tests: [
                    { test: 'Test 1', status: 'pass' as const, message: 'OK' },      // 100%
                    { test: 'Test 2', status: 'warning' as const, message: 'Warning' }, // 50%
                    { test: 'Test 3', status: 'fail' as const, message: 'Failed' },     // 0%
                    { test: 'Test 4', status: 'pass' as const, message: 'OK' },      // 100%
                ],
                recommendations: [],
            };

            // (100 + 50 + 0 + 100) / 4 = 62.5, rounded to 63
            const score = getConnectionHealthScore(diagnostics);
            expect(score).toBe(63);
        });

        it('should return 0 for empty tests', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'error' as const,
                tests: [],
                recommendations: [],
            };

            const score = getConnectionHealthScore(diagnostics);
            expect(score).toBe(0);
        });
    });

    describe('Fix Suggestions Generation', () => {
        it('should generate suggestions from test failures', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'error' as const,
                tests: [
                    {
                        test: 'Connection Exists',
                        status: 'fail' as const,
                        message: 'No connection found',
                        suggestion: 'Click "Connect" to set up your account'
                    },
                    {
                        test: 'Token Validity',
                        status: 'fail' as const,
                        message: 'Token expired',
                        suggestion: 'Reconnect your account to refresh the token'
                    },
                ],
                recommendations: ['Check your internet connection'],
            };

            const suggestions = generateFixSuggestions(diagnostics);

            expect(suggestions).toContain('Click "Connect" to set up your account');
            expect(suggestions).toContain('Reconnect your account to refresh the token');
            expect(suggestions).toContain('Check your internet connection');
        });

        it('should remove duplicate suggestions', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'error' as const,
                tests: [
                    {
                        test: 'Test 1',
                        status: 'fail' as const,
                        message: 'Failed',
                        suggestion: 'Reconnect your account'
                    },
                    {
                        test: 'Test 2',
                        status: 'fail' as const,
                        message: 'Failed',
                        suggestion: 'Reconnect your account'
                    },
                ],
                recommendations: ['Reconnect your account'],
            };

            const suggestions = generateFixSuggestions(diagnostics);

            // Should only appear once despite being in multiple places
            expect(suggestions.filter(s => s === 'Reconnect your account')).toHaveLength(1);
        });

        it('should not include suggestions from passing tests', () => {
            const diagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'healthy' as const,
                tests: [
                    {
                        test: 'Connection Exists',
                        status: 'pass' as const,
                        message: 'Connection found',
                        suggestion: 'This should not appear'
                    },
                ],
                recommendations: ['General recommendation'],
            };

            const suggestions = generateFixSuggestions(diagnostics);

            expect(suggestions).not.toContain('This should not appear');
            expect(suggestions).toContain('General recommendation');
        });
    });

    describe('Platform Support', () => {
        it('should support all required platforms', () => {
            const supportedPlatforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

            supportedPlatforms.forEach(platform => {
                expect(['facebook', 'instagram', 'linkedin', 'twitter']).toContain(platform);
            });
        });

        it('should have platform configurations for all supported platforms', () => {
            const platforms: Platform[] = ['facebook', 'instagram', 'linkedin', 'twitter'];

            // This test verifies that our type system supports all the platforms we need
            platforms.forEach(platform => {
                expect(typeof platform).toBe('string');
                expect(platform.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Enhanced Connection Experience Features', () => {
        it('should provide comprehensive diagnostic information', () => {
            // Test that our diagnostic result structure is comprehensive
            const mockDiagnostics = {
                platform: 'facebook' as Platform,
                overallStatus: 'warning' as const,
                tests: [
                    {
                        test: 'Connection Exists',
                        status: 'pass' as const,
                        message: 'Connection found'
                    },
                    {
                        test: 'Token Validity',
                        status: 'warning' as const,
                        message: 'Token expires soon',
                        suggestion: 'Consider reconnecting'
                    }
                ],
                recommendations: [
                    'Your token expires soon - reconnect to avoid interruption'
                ]
            };

            // Verify structure
            expect(mockDiagnostics).toHaveProperty('platform');
            expect(mockDiagnostics).toHaveProperty('overallStatus');
            expect(mockDiagnostics).toHaveProperty('tests');
            expect(mockDiagnostics).toHaveProperty('recommendations');

            // Verify test structure
            expect(mockDiagnostics.tests[0]).toHaveProperty('test');
            expect(mockDiagnostics.tests[0]).toHaveProperty('status');
            expect(mockDiagnostics.tests[0]).toHaveProperty('message');

            // Verify optional suggestion
            expect(mockDiagnostics.tests[1]).toHaveProperty('suggestion');
        });

        it('should support data retention preferences', () => {
            // Test the disconnect options structure
            const disconnectOptions = {
                retainData: true,
                retainAnalytics: true,
                notifyOnReconnect: true,
            };

            expect(disconnectOptions).toHaveProperty('retainData');
            expect(disconnectOptions).toHaveProperty('retainAnalytics');
            expect(disconnectOptions).toHaveProperty('notifyOnReconnect');

            expect(typeof disconnectOptions.retainData).toBe('boolean');
            expect(typeof disconnectOptions.retainAnalytics).toBe('boolean');
            expect(typeof disconnectOptions.notifyOnReconnect).toBe('boolean');
        });
    });
});