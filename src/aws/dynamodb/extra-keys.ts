import { DynamoDBKey } from './types';

/**
 * Generates keys for Announcement
 * Pattern: PK: TEAM#<teamId>, SK: ANNOUNCEMENT#<timestamp>#<announcementId>
 * If teamId is 'GLOBAL', it's a system-wide announcement.
 */
export function getAnnouncementKeys(
    teamId: string,
    announcementId: string,
    timestamp: string
): DynamoDBKey {
    return {
        PK: `TEAM#${teamId}`,
        SK: `ANNOUNCEMENT#${timestamp}#${announcementId}`,
    };
}

// ==================== Client Dashboard Keys ====================

/**
 * Generates keys for ClientDashboard
 * Pattern: PK: USER#<userId>, SK: CLIENT_DASHBOARD#<dashboardId>
 */
export function getClientDashboardKeys(userId: string, dashboardId: string): DynamoDBKey {
    return {
        PK: `USER#${userId}`,
        SK: `CLIENT_DASHBOARD#${dashboardId}`,
    };
}

/**
 * Generates keys for SecuredLink
 * Pattern: PK: SECURE_LINK#<token>, SK: METADATA
 * GSI1: PK: USER#<userId>, SK: DASHBOARD#<dashboardId>
 */
export function getSecuredLinkKeys(
    token: string,
    userId?: string,
    dashboardId?: string
): DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } {
    const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
        PK: `SECURE_LINK#${token}`,
        SK: 'METADATA',
    };

    if (userId && dashboardId) {
        keys.GSI1PK = `USER#${userId}`;
        keys.GSI1SK = `DASHBOARD#${dashboardId}`;
    }

    return keys;
}

/**
 * Generates keys for DashboardAnalytics
 * Pattern: PK: DASHBOARD#<dashboardId>, SK: ANALYTICS
 */
export function getDashboardAnalyticsKeys(
    dashboardId: string,
    timestamp?: string | number
): DynamoDBKey {
    return {
        PK: `DASHBOARD#${dashboardId}`,
        SK: 'ANALYTICS',
    };
}

/**
 * Generates keys for CMAReport
 * Pattern: PK: USER#<userId>, SK: CMA_REPORT#<reportId>
 */
export function getCMAReportKeys(userId: string, reportId: string): DynamoDBKey {
    return {
        PK: `USER#${userId}`,
        SK: `CMA_REPORT#${reportId}`,
    };
}

/**
 * Generates keys for DashboardDocument
 * Pattern: PK: USER#<userId>, SK: DASHBOARD_DOC#<documentId>
 */
export function getDashboardDocumentKeys(
    userId: string,
    documentId: string
): DynamoDBKey {
    return {
        PK: `USER#${userId}`,
        SK: `DASHBOARD_DOC#${documentId}`,
    };
}

/**
 * Generates keys for DocumentDownloadLog
 * Pattern: PK: DOCUMENT#<documentId>, SK: DOWNLOAD#<timestamp>
 * GSI1: PK: DASHBOARD#<dashboardId>, SK: DOWNLOAD#<timestamp>
 */
export function getDocumentDownloadLogKeys(
    documentId: string,
    timestamp: string | number,
    dashboardId?: string
): DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } {
    const keys: DynamoDBKey & { GSI1PK?: string; GSI1SK?: string } = {
        PK: `DOCUMENT#${documentId}`,
        SK: `DOWNLOAD#${timestamp}`,
    };

    if (dashboardId) {
        keys.GSI1PK = `DASHBOARD#${dashboardId}`;
        keys.GSI1SK = `DOWNLOAD#${timestamp}`;
    }

    return keys;
}
