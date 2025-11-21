/**
 * Life Event Analysis Lambda Function
 * 
 * Scheduled to run daily to analyze life events and generate high-intent lead alerts.
 * This function processes public records data to identify prospects with high buying/selling intent.
 */

import { Handler, ScheduledEvent } from 'aws-lambda';
import { createLifeEventAnalyzer } from '../lib/alerts/life-event-analyzer';
import { getAlertDataAccess } from '../lib/alerts/data-access';
import { getRepository } from '../aws/dynamodb/repository';
import { TargetArea, AlertSettings } from '../lib/alerts/types';
import {
    withErrorHandling,
    withRetry,
    alertErrorHandler,
    createUserFriendlyMessage,
    AlertProcessingError
} from '../lib/alerts/error-handling';
import { createLogger } from '../aws/logging/logger';

interface ProcessingResult {
    usersProcessed: number;
    alertsGenerated: number;
    errors: string[];
}

/**
 * Lambda handler for life event analysis
 */
export const handler: Handler<ScheduledEvent, ProcessingResult> = async (event, context) => {
    const logger = createLogger({
        service: 'life-event-processor',
        correlationId: context.awsRequestId,
        lambdaRequestId: context.awsRequestId,
    });

    logger.info('Starting life event analysis processing', {
        time: event.time,
        requestId: context.awsRequestId,
        remainingTimeMs: context.getRemainingTimeInMillis(),
    });

    const result: ProcessingResult = {
        usersProcessed: 0,
        alertsGenerated: 0,
        errors: [],
    };

    try {
        const analyzer = createLifeEventAnalyzer();
        const dataAccess = getAlertDataAccess();

        // Get all users with life event alerts enabled with retry logic
        const users = await withRetry(
            () => getUsersWithLifeEventAlertsEnabled(),
            { maxAttempts: 3, baseDelayMs: 2000 },
            { operation: 'get-users-with-alerts-enabled' }
        );

        logger.info('Retrieved users for processing', {
            usersCount: users.length,
        });

        for (const user of users) {
            // Check remaining execution time
            if (context.getRemainingTimeInMillis() < 30000) { // 30 seconds buffer
                logger.warn('Approaching Lambda timeout, stopping processing', {
                    remainingTimeMs: context.getRemainingTimeInMillis(),
                    usersProcessed: result.usersProcessed,
                });
                break;
            }

            try {
                logger.debug('Processing life events for user', {
                    userId: user.userId,
                });

                // Get user's alert settings with retry
                const settings = await withRetry(
                    () => dataAccess.getAlertSettings(user.userId),
                    { maxAttempts: 2, baseDelayMs: 1000 },
                    { operation: 'get-alert-settings' }
                );

                if (!settings || !settings.enabledAlertTypes.includes('life-event-lead')) {
                    logger.debug('User does not have life event alerts enabled', {
                        userId: user.userId,
                    });
                    continue;
                }

                if (!settings.targetAreas || settings.targetAreas.length === 0) {
                    logger.debug('User has no target areas configured', {
                        userId: user.userId,
                    });
                    continue;
                }

                // Analyze life events in user's target areas
                const alerts = await analyzer.analyzeEvents(settings.targetAreas);

                // Save generated alerts with individual error handling
                let savedAlerts = 0;
                for (const alert of alerts) {
                    try {
                        alert.userId = user.userId;
                        await withRetry(
                            () => dataAccess.saveAlert(user.userId, alert),
                            { maxAttempts: 2, baseDelayMs: 500 },
                            { operation: 'save-alert' }
                        );
                        savedAlerts++;
                        result.alertsGenerated++;
                    } catch (saveError) {
                        logger.error('Failed to save individual alert', saveError as Error, {
                            userId: user.userId,
                            alertId: alert.id,
                            alertType: alert.type,
                        });
                        result.errors.push(`Failed to save alert ${alert.id} for user ${user.userId}: ${(saveError as Error).message}`);
                    }
                }

                result.usersProcessed++;

                logger.info('Successfully processed user', {
                    userId: user.userId,
                    alertsGenerated: alerts.length,
                    alertsSaved: savedAlerts,
                    targetAreasCount: settings.targetAreas.length,
                });

            } catch (userError) {
                const errorResult = alertErrorHandler.handleError(userError as Error, {
                    operation: 'process-user-life-events',
                    userId: user.userId,
                    alertType: 'life-event-lead',
                });

                logger.error(`Error processing user ${user.userId}`, userError as Error, {
                    userId: user.userId,
                    shouldRetry: errorResult.shouldRetry,
                    userMessage: errorResult.userMessage,
                });

                result.errors.push(`User ${user.userId}: ${errorResult.userMessage}`);
            }
        }

        logger.info('Life event analysis completed', {
            usersProcessed: result.usersProcessed,
            alertsGenerated: result.alertsGenerated,
            errorsCount: result.errors.length,
            totalUsers: users.length,
            executionTimeMs: context.getRemainingTimeInMillis(),
        });

        return result;

    } catch (error) {
        const errorResult = alertErrorHandler.handleError(error as Error, {
            operation: 'life-event-analysis-lambda',
        });

        logger.error('Fatal error in life event processing', error as Error, {
            shouldRetry: errorResult.shouldRetry,
            userMessage: errorResult.userMessage,
        });

        result.errors.push(`Fatal error: ${errorResult.userMessage}`);

        // Don't throw - return the result with errors for monitoring
        return result;
    }
};

/**
 * Gets all users who have life event alerts enabled
 * This would typically query the DynamoDB table for users with alert settings
 */
async function getUsersWithLifeEventAlertsEnabled(): Promise<Array<{ userId: string }>> {
    const logger = createLogger({ service: 'life-event-processor' });
    const repository = getRepository();

    try {
        logger.debug('Fetching users with life event alerts enabled');

        // In a real implementation, this would query for users with life event alerts enabled
        // For now, we'll use a placeholder that would be replaced with actual user queries

        // Query pattern: Get all alert settings where life-event-lead is enabled
        // This would use a GSI on the DynamoDB table to efficiently find users

        // Placeholder implementation - in production this would:
        // 1. Query DynamoDB for all SETTINGS#ALERTS records using GSI
        // 2. Filter for those with enabledAlertTypes containing 'life-event-lead'
        // 3. Return the user IDs
        // 4. Handle pagination for large user bases
        // 5. Implement proper error handling and retries

        const users: Array<{ userId: string }> = [];

        logger.debug('Successfully fetched users', {
            usersCount: users.length,
        });

        return users;

    } catch (error) {
        logger.error('Error fetching users with life event alerts enabled', error as Error);
        throw new AlertProcessingError(
            'Failed to fetch users with life event alerts enabled',
            'life-event-lead',
            undefined,
            error as Error
        );
    }
}

/**
 * Health check function for monitoring
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
    };
};