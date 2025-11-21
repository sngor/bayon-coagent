/**
 * Competitor Monitoring Lambda Function
 * 
 * Scheduled to run every 4 hours to monitor competitor listing activity.
 * Tracks new listings, price reductions, and withdrawals/expirations.
 */

import { Handler, ScheduledEvent } from 'aws-lambda';
import { createCompetitorMonitor } from '../lib/alerts/competitor-monitor';
import { getAlertDataAccess } from '../lib/alerts/data-access';
import { getRepository } from '../aws/dynamodb/repository';
import { Competitor, TargetArea, AlertSettings } from '../lib/alerts/types';

interface ProcessingResult {
    usersProcessed: number;
    competitorsMonitored: number;
    alertsGenerated: number;
    errors: string[];
}

/**
 * Lambda handler for competitor monitoring
 */
export const handler: Handler<ScheduledEvent, ProcessingResult> = async (event, context) => {
    console.log('Starting competitor monitoring processing', {
        time: event.time,
        requestId: context.awsRequestId,
    });

    const monitor = createCompetitorMonitor();
    const dataAccess = getAlertDataAccess();
    const repository = getRepository();

    const result: ProcessingResult = {
        usersProcessed: 0,
        competitorsMonitored: 0,
        alertsGenerated: 0,
        errors: [],
    };

    try {
        // Get all users with competitor alerts enabled
        const users = await getUsersWithCompetitorAlertsEnabled();

        for (const user of users) {
            try {
                console.log(`Processing competitor monitoring for user: ${user.userId}`);

                // Get user's alert settings
                const settings = await dataAccess.getAlertSettings(user.userId);

                if (!settings || !hasCompetitorAlertsEnabled(settings)) {
                    continue;
                }

                // Get user's tracked competitors
                const competitors = await getUserCompetitors(user.userId, settings.trackedCompetitors);

                if (competitors.length === 0) {
                    console.log(`No competitors configured for user: ${user.userId}`);
                    continue;
                }

                // Monitor listing events for all competitors
                const alerts = await monitor.trackListingEvents(competitors, settings.targetAreas);

                // Save generated alerts
                for (const alert of alerts) {
                    alert.userId = user.userId;
                    await dataAccess.saveAlert(user.userId, alert);
                    result.alertsGenerated++;
                }

                result.usersProcessed++;
                result.competitorsMonitored += competitors.length;

                console.log(`Generated ${alerts.length} competitor alerts for user: ${user.userId} (${competitors.length} competitors monitored)`);

            } catch (userError) {
                const errorMessage = `Error processing user ${user.userId}: ${userError instanceof Error ? userError.message : String(userError)}`;
                console.error(errorMessage);
                result.errors.push(errorMessage);
            }
        }

        console.log('Competitor monitoring completed', {
            usersProcessed: result.usersProcessed,
            competitorsMonitored: result.competitorsMonitored,
            alertsGenerated: result.alertsGenerated,
            errors: result.errors.length,
        });

        return result;

    } catch (error) {
        const errorMessage = `Fatal error in competitor monitoring: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMessage);
        result.errors.push(errorMessage);

        // Don't throw - return the result with errors for monitoring
        return result;
    }
};

/**
 * Gets all users who have competitor alerts enabled
 */
async function getUsersWithCompetitorAlertsEnabled(): Promise<Array<{ userId: string }>> {
    const repository = getRepository();

    try {
        // In a real implementation, this would query for users with competitor alerts enabled
        // Query pattern: Get all alert settings where any competitor alert type is enabled

        // Placeholder implementation - in production this would:
        // 1. Query DynamoDB for all SETTINGS#ALERTS records
        // 2. Filter for those with enabledAlertTypes containing competitor alert types
        // 3. Return the user IDs

        return [];

    } catch (error) {
        console.error('Error fetching users with competitor alerts enabled:', error);
        return [];
    }
}

/**
 * Checks if user has any competitor alert types enabled
 */
function hasCompetitorAlertsEnabled(settings: AlertSettings): boolean {
    const competitorAlertTypes = [
        'competitor-new-listing',
        'competitor-price-reduction',
        'competitor-withdrawal'
    ];

    return competitorAlertTypes.some(type =>
        settings.enabledAlertTypes.includes(type as any)
    );
}

/**
 * Gets competitor information for tracked competitor IDs
 */
async function getUserCompetitors(userId: string, trackedCompetitorIds: string[]): Promise<Competitor[]> {
    const repository = getRepository();
    const competitors: Competitor[] = [];

    try {
        // In a real implementation, this would fetch competitor details from storage
        // For now, return empty array as competitors would be stored separately

        // Placeholder implementation - in production this would:
        // 1. Query DynamoDB for competitor records by ID
        // 2. Return competitor details including name, MLS ID, etc.
        // 3. Filter for active competitors only

        for (const competitorId of trackedCompetitorIds) {
            // Mock competitor data - in production this would be fetched from storage
            const competitor: Competitor = {
                id: competitorId,
                name: `Competitor ${competitorId}`,
                mlsId: `MLS${competitorId}`,
                isActive: true,
                addedAt: new Date().toISOString(),
            };
            competitors.push(competitor);
        }

        return competitors;

    } catch (error) {
        console.error(`Error fetching competitors for user ${userId}:`, error);
        return [];
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