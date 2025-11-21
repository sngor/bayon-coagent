/**
 * Price Reduction Monitoring Lambda Function
 * 
 * Scheduled to run every 4 hours to monitor price reductions in target areas.
 * Detects any price reduction and generates alerts with property details.
 */

import { Handler, ScheduledEvent } from 'aws-lambda';
import { createPriceReductionMonitor } from '../lib/alerts/price-reduction-monitor';
import { getAlertDataAccess } from '../lib/alerts/data-access';
import { getRepository } from '../aws/dynamodb/repository';
import { TargetArea, AlertSettings } from '../lib/alerts/types';

interface ProcessingResult {
    usersProcessed: number;
    targetAreasMonitored: number;
    alertsGenerated: number;
    errors: string[];
}

/**
 * Lambda handler for price reduction monitoring
 */
export const handler: Handler<ScheduledEvent, ProcessingResult> = async (event, context) => {
    console.log('Starting price reduction monitoring processing', {
        time: event.time,
        requestId: context.awsRequestId,
    });

    const monitor = createPriceReductionMonitor();
    const dataAccess = getAlertDataAccess();
    const repository = getRepository();

    const result: ProcessingResult = {
        usersProcessed: 0,
        targetAreasMonitored: 0,
        alertsGenerated: 0,
        errors: [],
    };

    try {
        // Get all users with price reduction alerts enabled
        const users = await getUsersWithPriceReductionAlertsEnabled();

        for (const user of users) {
            try {
                console.log(`Processing price reduction monitoring for user: ${user.userId}`);

                // Get user's alert settings
                const settings = await dataAccess.getAlertSettings(user.userId);

                if (!settings || !settings.enabledAlertTypes.includes('price-reduction')) {
                    continue;
                }

                if (settings.targetAreas.length === 0) {
                    console.log(`No target areas configured for user: ${user.userId}`);
                    continue;
                }

                // Monitor price reductions in all target areas
                const alerts = await monitor.monitorPriceReductions(settings.targetAreas, settings);

                // Save generated alerts
                for (const alert of alerts) {
                    alert.userId = user.userId;
                    await dataAccess.saveAlert(user.userId, alert);
                    result.alertsGenerated++;
                }

                result.usersProcessed++;
                result.targetAreasMonitored += settings.targetAreas.length;

                console.log(`Generated ${alerts.length} price reduction alerts for user: ${user.userId} (${settings.targetAreas.length} areas monitored)`);

            } catch (userError) {
                const errorMessage = `Error processing user ${user.userId}: ${userError instanceof Error ? userError.message : String(userError)}`;
                console.error(errorMessage);
                result.errors.push(errorMessage);
            }
        }

        console.log('Price reduction monitoring completed', {
            usersProcessed: result.usersProcessed,
            targetAreasMonitored: result.targetAreasMonitored,
            alertsGenerated: result.alertsGenerated,
            errors: result.errors.length,
        });

        return result;

    } catch (error) {
        const errorMessage = `Fatal error in price reduction monitoring: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        result.errors.push(errorMessage);

        // Don't throw - return the result with errors for monitoring
        return result;
    }
};

/**
 * Gets all users who have price reduction alerts enabled
 */
async function getUsersWithPriceReductionAlertsEnabled(): Promise<Array<{ userId: string }>> {
    const repository = getRepository();

    try {
        // In a real implementation, this would query for users with price reduction alerts enabled
        // Query pattern: Get all alert settings where price-reduction is enabled

        // Placeholder implementation - in production this would:
        // 1. Query DynamoDB for all SETTINGS#ALERTS records
        // 2. Filter for those with enabledAlertTypes containing 'price-reduction'
        // 3. Return the user IDs

        return [];

    } catch (error) {
        console.error('Error fetching users with price reduction alerts enabled:', error);
        return [];
    }
}

/**
 * Validates price range filters
 */
function validatePriceRangeFilters(filters?: { min?: number; max?: number }): boolean {
    if (!filters) return true;

    if (filters.min && filters.min < 0) return false;
    if (filters.max && filters.max < 0) return false;
    if (filters.min && filters.max && filters.min > filters.max) return false;

    return true;
}

/**
 * Gets MLS data for target areas
 * This would typically call MLS APIs to get current listing data
 */
async function getMLSDataForTargetAreas(targetAreas: TargetArea[]): Promise<void> {
    // In a real implementation, this would:
    // 1. Call MLS APIs for each target area
    // 2. Fetch current listing data
    // 3. Store data for price comparison
    // 4. Handle rate limiting and error recovery

    // For now, this is a placeholder that would be implemented
    // when integrating with actual MLS data providers

    console.log(`Would fetch MLS data for ${targetAreas.length} target areas`);
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