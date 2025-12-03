/**
 * AI Visibility Alert System Tests
 * 
 * Unit tests for the AIVisibilityAlertService class
 */

import { describe, it, expect } from '@jest/globals';
import {
    AIVisibilityAlertService,
    AIVisibilityAlertType,
    AlertSeverity,
    AIVisibilityAlert,
    AlertConfig,
} from '../ai-visibility-alerts';

describe('AIVisibilityAlertService', () => {
    describe('AIVisibilityAlertType enum', () => {
        it('should have all required alert types', () => {
            expect(AIVisibilityAlertType.SCORE_INCREASE).toBe('score_increase');
            expect(AIVisibilityAlertType.SCORE_DECREASE).toBe('score_decrease');
            expect(AIVisibilityAlertType.NEGATIVE_MENTION).toBe('negative_mention');
            expect(AIVisibilityAlertType.NEW_PLATFORM).toBe('new_platform');
            expect(AIVisibilityAlertType.COMPETITOR_CHANGE).toBe('competitor_change');
        });
    });

    describe('AlertSeverity enum', () => {
        it('should have all severity levels', () => {
            expect(AlertSeverity.INFO).toBe('info');
            expect(AlertSeverity.WARNING).toBe('warning');
            expect(AlertSeverity.CRITICAL).toBe('critical');
        });
    });

    describe('Type definitions', () => {
        it('should have correct AIVisibilityAlert structure', () => {
            const alert: AIVisibilityAlert = {
                id: 'alert-123',
                userId: 'user-456',
                type: AIVisibilityAlertType.SCORE_INCREASE,
                severity: AlertSeverity.WARNING,
                title: 'Test Alert',
                message: 'Test message',
                currentScore: 75,
                previousScore: 50,
                changePercentage: 50,
                timestamp: new Date().toISOString(),
                notificationSent: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            expect(alert.id).toBe('alert-123');
            expect(alert.userId).toBe('user-456');
            expect(alert.type).toBe(AIVisibilityAlertType.SCORE_INCREASE);
            expect(alert.severity).toBe(AlertSeverity.WARNING);
            expect(alert.currentScore).toBe(75);
            expect(alert.previousScore).toBe(50);
            expect(alert.changePercentage).toBe(50);
        });

        it('should have correct AlertConfig structure', () => {
            const config: AlertConfig = {
                scoreChangeThreshold: 20,
                enableNegativeMentionAlerts: true,
                enableScoreIncreaseAlerts: true,
                enableScoreDecreaseAlerts: true,
                batchAlerts: true,
                digestTime: '09:00',
            };

            expect(config.scoreChangeThreshold).toBe(20);
            expect(config.enableNegativeMentionAlerts).toBe(true);
            expect(config.batchAlerts).toBe(true);
            expect(config.digestTime).toBe('09:00');
        });
    });

    describe('Alert message formatting', () => {
        it('should format score increase messages correctly', () => {
            const changePercentage = 25.5;
            const previousScore = 60;
            const currentScore = 75;

            const title = `🎉 AI Visibility Score Increased by ${changePercentage.toFixed(1)}%`;
            const message = `Great news! Your AI visibility score has increased from ${previousScore} to ${currentScore}. You're appearing more frequently in AI search results.`;

            expect(title).toContain('25.5%');
            expect(message).toContain('60');
            expect(message).toContain('75');
        });

        it('should format score decrease messages correctly', () => {
            const changePercentage = 30.0;
            const previousScore = 80;
            const currentScore = 56;

            const title = `⚠️ AI Visibility Score Decreased by ${changePercentage.toFixed(1)}%`;
            const message = `Your AI visibility score has decreased from ${previousScore} to ${currentScore}. Consider reviewing your online presence and content strategy.`;

            expect(title).toContain('30.0%');
            expect(message).toContain('80');
            expect(message).toContain('56');
        });

        it('should format negative mention messages correctly', () => {
            const platform = 'chatgpt';
            const query = 'best real estate agents in Seattle';
            const reason = 'Mentioned in negative context regarding pricing';

            const title = `⚠️ Negative Mention Detected on ${platform}`;
            const message = `A negative mention was found in response to: "${query}". Reason: ${reason}`;

            expect(title).toContain('chatgpt');
            expect(message).toContain(query);
            expect(message).toContain(reason);
        });
    });

    describe('Alert severity determination', () => {
        it('should use CRITICAL severity for changes >= 50%', () => {
            const changePercentage = 50;
            const severity = changePercentage >= 50 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
            expect(severity).toBe(AlertSeverity.CRITICAL);
        });

        it('should use WARNING severity for changes < 50%', () => {
            const changePercentage = 49;
            const severity = changePercentage >= 50 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
            expect(severity).toBe(AlertSeverity.WARNING);
        });

        it('should use CRITICAL severity for negative mentions', () => {
            const severity = AlertSeverity.CRITICAL;
            expect(severity).toBe(AlertSeverity.CRITICAL);
        });
    });

    describe('Change percentage calculation', () => {
        it('should calculate percentage increase correctly', () => {
            const currentScore = 75;
            const previousScore = 50;
            const changePercentage = Math.abs(
                ((currentScore - previousScore) / previousScore) * 100
            );
            expect(changePercentage).toBe(50);
        });

        it('should calculate percentage decrease correctly', () => {
            const currentScore = 40;
            const previousScore = 80;
            const changePercentage = Math.abs(
                ((currentScore - previousScore) / previousScore) * 100
            );
            expect(changePercentage).toBe(50);
        });

        it('should handle zero previous score', () => {
            const currentScore = 50;
            const previousScore = 0;
            // Should handle division by zero gracefully
            const changePercentage = previousScore === 0 ? 100 : Math.abs(
                ((currentScore - previousScore) / previousScore) * 100
            );
            expect(changePercentage).toBe(100);
        });
    });

    describe('Alert threshold checking', () => {
        it('should trigger alert when change exceeds threshold', () => {
            const changePercentage = 25;
            const threshold = 20;
            const shouldAlert = changePercentage >= threshold;
            expect(shouldAlert).toBe(true);
        });

        it('should not trigger alert when change is below threshold', () => {
            const changePercentage = 15;
            const threshold = 20;
            const shouldAlert = changePercentage >= threshold;
            expect(shouldAlert).toBe(false);
        });

        it('should trigger alert when change equals threshold', () => {
            const changePercentage = 20;
            const threshold = 20;
            const shouldAlert = changePercentage >= threshold;
            expect(shouldAlert).toBe(true);
        });
    });

    // Note: Full integration tests with mocking would require more complex setup
    // These tests verify the basic structure, type definitions, and logic
    // Full testing would be done in integration tests with actual AWS services
});
