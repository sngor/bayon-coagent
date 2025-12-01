import { DynamoDBKey } from './types';

/**
 * Generates keys for ClientDashboard
 * Pattern: PK: AGENT#<agentId>, SK: DASHBOARD#<dashboardId>
 */
export function getClientDashboardKeys(
    agentId: string,
    dashboardId: string
): DynamoDBKey {
    return {
        PK: `AGENT#${agentId}`,
        SK: `DASHBOARD#${dashboardId}`,
    };
}

/**
 * Generates keys for SecuredLink
 * Pattern: PK: LINK#<linkToken>, SK: METADATA
 * GSI1: PK: AGENT#<agentId>, SK: DASHBOARD#<dashboardId>
 */
export function getSecuredLinkKeys(
    linkToken: string,
    agentId?: string,
    dashboardId?: string
): DynamoDBKey & {
    GSI1PK?: string;
    GSI1SK?: string;
} {
    const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
        PK: `LINK#${linkToken}`,
        SK: 'METADATA',
    };

    // Add GSI1 keys for agent/dashboard lookups
    if (agentId) {
        keys.GSI1PK = `AGENT#${agentId}`;
    }
    if (dashboardId) {
        keys.GSI1SK = `DASHBOARD#${dashboardId}`;
    }

    return keys;
}

/**
 * Generates keys for DashboardAnalytics
 * Pattern: PK: DASHBOARD#<dashboardId>, SK: VIEW#<timestamp>
 */
export function getDashboardAnalyticsKeys(
    dashboardId: string,
    timestamp: string
): DynamoDBKey {
    return {
        PK: `DASHBOARD#${dashboardId}`,
        SK: `VIEW#${timestamp}`,
    };
}
