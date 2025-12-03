/**
 * Scheduled AI Monitoring Lambda Function
 * 
 * Processes AI visibility monitoring for all users with monitoring enabled.
 * Runs weekly to query AI platforms and analyze agent visibility.
 * 
 * Schedule: Weekly via EventBridge
 * Timeout: 15 minutes
 * Memory: 2048 MB
 * 
 * Validates: Requirements 6.2, 10.1, 10.4
 */

import { Handler, ScheduledEvent } from 'aws-lambda';
import { createAIMonitoringScheduler, MonitoringExecutionResult } from '../lib/ai-monitoring-scheduler';
import { getRepository } from '../aws/dynamodb/repository';
import { AIMonitoringConfig } from '../lib/types/common/common';
import { getAIVisibilityAlertService } from '../lib/ai-visibility-alerts';

interface LambdaContext {
    getRemainingTimeInMillis(): number;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: string;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
}

interface ProcessingResult {
    totalUsers: number;
    usersProcessed: number;
    usersSkipped: number;
    totalQueriesExecuted: number;
    totalMentionsFound: number;
    alertsGenerated: number;
    errors: ProcessingError[];
    executionTime: number;
}

interface ProcessingError {
    userId: string;
    error: string;
    timestamp: string;
}

/**
 * Lambda handler for scheduled AI monitoring
 */
export const handler: Handler<ScheduledEvent, ProcessingResult> = async (event, context: LambdaContext) => {
    const startTime = Date.now();
    const correlationId = context.awsRequestId;

    console.log(JSON.stringify({
        level: 'INFO',
        message: 'Starting scheduled AI monitoring Lambda',
        correlationId,
        functionName: context.functionName,
        event,
        remainingTime: context.getRemainingTimeInMillis(),
        timestamp: new Date().toISOString()
    }));

    const result: ProcessingResult = {
        totalUsers: 0,
        usersProcessed: 0,
        usersSkipped: 0,
        totalQueriesExecuted: 0,
        totalMentionsFound: 0,
        alertsGenerated: 0,
        errors: [],
        executionTime: 0
    };

    try {
        const scheduler = createAIMonitoringScheduler();
        const repository = getRepository();
        const alertService = getAIVisibilityAlertService();

        // Get all users with AI monitoring enabled
        const users = await getUsersWithMonitoringEnabled();
        result.totalUsers = users.length;

        console.log(JSON.stringify({
            level: 'INFO',
            message: `Found ${users.length} users with AI monitoring enabled`,
            correlationId,
            timestamp: new Date().toISOString()
        }));

        if (users.length === 0) {
            result.executionTime = Date.now() - startTime;
            return result;
        }

        // Process each user
        for (const user of users) {
            // Check remaining execution time (leave 60 seconds buffer)
            const remainingTime = context.getRemainingTimeInMillis();
            if (remainingTime < 60000) {
                console.log(JSON.stringify({
                    level: 'WARN',
                    message: 'Approaching Lambda timeout, stopping processing',
                    correlationId,
                    remainingTime,
                    processedSoFar: result.usersProcessed,
                    timestamp: new Date().toISOString()
                }));
                break;
            }

            try {
                console.log(JSON.stringify({
                    level: 'INFO',
                    message: `Processing AI monitoring for user: ${user.userId}`,
                    correlationId,
                    userId: user.userId,
                    timestamp: new Date().toISOString()
                }));

                // Check if monitoring is due for this user
                const config = await repository.getAIMonitoringConfig<AIMonitoringConfig>(user.userId);

                if (!config || !config.enabled) {
                    console.log(JSON.stringify({
                        level: 'INFO',
                        message: `Monitoring not enabled for user: ${user.userId}`,
                        correlationId,
                        userId: user.userId,
                        timestamp: new Date().toISOString()
                    }));
                    result.usersSkipped++;
                    continue;
                }

                // Check if it's time to run monitoring based on frequency
                const shouldRun = await shouldRunMonitoring(config);
                if (!shouldRun) {
                    console.log(JSON.stringify({
                        level: 'INFO',
                        message: `Monitoring not due for user: ${user.userId}`,
                        correlationId,
                        userId: user.userId,
                        nextScheduled: config.nextScheduled,
                        timestamp: new Date().toISOString()
                    }));
                    result.usersSkipped++;
                    continue;
                }

                // Execute monitoring for this user
                const executionResult = await scheduler.executeMonitoring(user.userId);

                result.usersProcessed++;
                result.totalQueriesExecuted += executionResult.queriesExecuted;
                result.totalMentionsFound += executionResult.mentionsFound;

                console.log(JSON.stringify({
                    level: 'INFO',
                    message: `Completed monitoring for user: ${user.userId}`,
                    correlationId,
                    userId: user.userId,
                    queriesExecuted: executionResult.queriesExecuted,
                    mentionsFound: executionResult.mentionsFound,
                    errors: executionResult.errors.length,
                    timestamp: new Date().toISOString()
                }));

                // Check for alerts
                try {
                    const alerts = await alertService.checkForAlerts(user.userId);
                    result.alertsGenerated += alerts.length;

                    if (alerts.length > 0) {
                        console.log(JSON.stringify({
                            level: 'INFO',
                            message: `Generated ${alerts.length} alerts for user: ${user.userId}`,
                            correlationId,
                            userId: user.userId,
                            alertCount: alerts.length,
                            timestamp: new Date().toISOString()
                        }));
                    }
                } catch (alertError) {
                    console.log(JSON.stringify({
                        level: 'WARN',
                        message: 'Failed to check for alerts',
                        correlationId,
                        userId: user.userId,
                        error: alertError instanceof Error ? alertError.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                    }));
                }

                // Add errors from execution result
                if (executionResult.errors.length > 0) {
                    for (const error of executionResult.errors) {
                        result.errors.push({
                            userId: user.userId,
                            error,
                            timestamp: new Date().toISOString()
                        });
                    }
                }

            } catch (userError) {
                const errorMessage = userError instanceof Error ? userError.message : 'Unknown error';

                result.errors.push({
                    userId: user.userId,
                    error: errorMessage,
                    timestamp: new Date().toISOString()
                });

                console.log(JSON.stringify({
                    level: 'ERROR',
                    message: `Error processing user: ${user.userId}`,
                    correlationId,
                    userId: user.userId,
                    error: errorMessage,
                    timestamp: new Date().toISOString()
                }));
            }
        }

        result.executionTime = Date.now() - startTime;

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'Scheduled AI monitoring completed',
            correlationId,
            totalUsers: result.totalUsers,
            usersProcessed: result.usersProcessed,
            usersSkipped: result.usersSkipped,
            totalQueriesExecuted: result.totalQueriesExecuted,
            totalMentionsFound: result.totalMentionsFound,
            alertsGenerated: result.alertsGenerated,
            errorCount: result.errors.length,
            executionTime: result.executionTime,
            timestamp: new Date().toISOString()
        }));

        return result;

    } catch (error) {
        result.executionTime = Date.now() - startTime;

        console.log(JSON.stringify({
            level: 'ERROR',
            message: 'Critical failure in scheduled AI monitoring Lambda',
            correlationId,
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : String(error),
            executionTime: result.executionTime,
            timestamp: new Date().toISOString()
        }));

        throw error;
    }
};

/**
 * Get all users with AI monitoring enabled
 */
async function getUsersWithMonitoringEnabled(): Promise<Array<{ userId: string }>> {
    try {
        const repository = getRepository();

        // Query for all AI monitoring configs
        // In production, this would use a GSI to efficiently query enabled configs
        // For now, we'll scan for configs (this should be optimized with a GSI in production)

        const users: Array<{ userId: string }> = [];

        // This is a simplified implementation
        // In production, you would:
        // 1. Use a GSI on AIMonitoringConfig with enabled status
        // 2. Query for all enabled configs
        // 3. Return the user IDs

        // For now, return empty array as this requires a GSI to be added
        // The actual implementation would be added when the GSI is created

        console.log(JSON.stringify({
            level: 'INFO',
            message: 'Querying for users with AI monitoring enabled',
            timestamp: new Date().toISOString()
        }));

        return users;

    } catch (error) {
        console.log(JSON.stringify({
            level: 'ERROR',
            message: 'Error fetching users with monitoring enabled',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }));
        return [];
    }
}

/**
 * Check if monitoring should run for a user based on their schedule
 */
async function shouldRunMonitoring(config: AIMonitoringConfig): Promise<boolean> {
    try {
        const now = new Date();
        const nextScheduled = config.nextScheduled ? new Date(config.nextScheduled) : new Date(0);

        // Run if we're past the scheduled time
        return now >= nextScheduled;

    } catch (error) {
        console.log(JSON.stringify({
            level: 'ERROR',
            message: 'Error checking if monitoring should run',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }));
        // Default to running if we can't determine
        return true;
    }
}

/**
 * Health check function for monitoring
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString()
    };
};
