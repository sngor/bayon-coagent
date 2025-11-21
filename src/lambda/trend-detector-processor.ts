/**
 * Neighborhood Trend Detection Lambda Function
 * 
 * Scheduled to run daily to analyze neighborhood market trends.
 * Detects significant changes in prices, inventory, and days on market.
 */

import { Handler, ScheduledEvent } from 'aws-lambda';
import { getNeighborhoodTrendDetector } from '../lib/alerts/neighborhood-trend-detector';
import { getAlertDataAccess } from '../lib/alerts/data-access';
import { getRepository } from '../aws/dynamodb/repository';
import { TargetArea, AlertSettings } from '../lib/alerts/types';

interface ProcessingResult {
    usersProcessed: number;
    neighborhoodsAnalyzed: number;
    alertsGenerated: number;
    errors: string[];
}

/**
 * Lambda handler for neighborhood trend detection
 */
export const handler: Handler<ScheduledEvent, ProcessingResult> = async (event, context) => {
    console.log('Starting neighborhood trend detection processing', {
        time: event.time,
        requestId: context.awsRequestId,
    });

    const detector = getNeighborhoodTrendDetector();
    const dataAccess = getAlertDataAccess();
    const repository = getRepository();

    const result: ProcessingResult = {
        usersProcessed: 0,
        neighborhoodsAnalyzed: 0,
        alertsGenerated: 0,
        errors: [],
    };

    try {
        // Get all users with neighborhood trend alerts enabled
        const users = await getUsersWithTrendAlertsEnabled();

        for (const user of users) {
            try {
                console.log(`Processing trend detection for user: ${user.userId}`);

                // Get user's alert settings
                const settings = await dataAccess.getAlertSettings(user.userId);

                if (!settings || !settings.enabledAlertTypes.includes('neighborhood-trend')) {
                    continue;
                }

                // Extract neighborhoods from target areas
                const neighborhoods = extractNeighborhoodsFromTargetAreas(settings.targetAreas);

                if (neighborhoods.length === 0) {
                    console.log(`No neighborhoods configured for user: ${user.userId}`);
                    continue;
                }

                // Analyze trends for all neighborhoods
                const alerts = await detector.analyzeTrends(neighborhoods);

                // Save generated alerts
                for (const alert of alerts) {
                    alert.userId = user.userId;
                    await dataAccess.saveAlert(user.userId, alert);
                    result.alertsGenerated++;
                }

                result.usersProcessed++;
                result.neighborhoodsAnalyzed += neighborhoods.length;

                console.log(`Generated ${alerts.length} trend alerts for user: ${user.userId} (${neighborhoods.length} neighborhoods analyzed)`);

            } catch (userError) {
                const errorMessage = `Error processing user ${user.userId}: ${userError instanceof Error ? userError.message : String(userError)}`;
                console.error(errorMessage);
                result.errors.push(errorMessage);
            }
        }

        console.log('Neighborhood trend detection completed', {
            usersProcessed: result.usersProcessed,
            neighborhoodsAnalyzed: result.neighborhoodsAnalyzed,
            alertsGenerated: result.alertsGenerated,
            errors: result.errors.length,
        });

        return result;

    } catch (error) {
        const errorMessage = `Fatal error in trend detection: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        result.errors.push(errorMessage);

        // Don't throw - return the result with errors for monitoring
        return result;
    }
};

/**
 * Gets all users who have neighborhood trend alerts enabled
 */
async function getUsersWithTrendAlertsEnabled(): Promise<Array<{ userId: string }>> {
    const repository = getRepository();

    try {
        // In a real implementation, this would query for users with trend alerts enabled
        // Query pattern: Get all alert settings where neighborhood-trend is enabled

        // Placeholder implementation - in production this would:
        // 1. Query DynamoDB for all SETTINGS#ALERTS records
        // 2. Filter for those with enabledAlertTypes containing 'neighborhood-trend'
        // 3. Return the user IDs

        return [];

    } catch (error) {
        console.error('Error fetching users with trend alerts enabled:', error);
        return [];
    }
}

/**
 * Extracts neighborhood identifiers from target areas
 */
function extractNeighborhoodsFromTargetAreas(targetAreas: TargetArea[]): string[] {
    const neighborhoods: string[] = [];

    for (const area of targetAreas) {
        switch (area.type) {
            case 'zip':
                // Use ZIP code as neighborhood identifier
                neighborhoods.push(area.value as string);
                break;

            case 'city':
                // Use city name as neighborhood identifier
                neighborhoods.push(area.value as string);
                break;

            case 'polygon':
                // For custom polygons, use the label as identifier
                // In production, this might need to be resolved to actual neighborhood names
                neighborhoods.push(area.label);
                break;

            default:
                console.warn(`Unknown target area type: ${area.type}`);
        }
    }

    // Remove duplicates
    return [...new Set(neighborhoods)];
}

/**
 * Gets market data for neighborhoods
 * This would typically call external market data APIs
 */
async function getMarketDataForNeighborhoods(neighborhoods: string[]): Promise<void> {
    // In a real implementation, this would:
    // 1. Call market data APIs for each neighborhood
    // 2. Store the data for trend analysis
    // 3. Handle rate limiting and error recovery

    // For now, this is a placeholder that would be implemented
    // when integrating with actual market data providers

    console.log(`Would fetch market data for ${neighborhoods.length} neighborhoods`);
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