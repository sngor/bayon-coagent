"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfileKeys = getUserProfileKeys;
exports.getProfileKeys = getProfileKeys;
exports.getAgentProfileKeys = getAgentProfileKeys;
exports.getReviewKeys = getReviewKeys;
exports.getBrandAuditKeys = getBrandAuditKeys;
exports.getCompetitorKeys = getCompetitorKeys;
exports.getResearchReportKeys = getResearchReportKeys;
exports.getProjectKeys = getProjectKeys;
exports.getSavedContentKeys = getSavedContentKeys;
exports.getTrainingProgressKeys = getTrainingProgressKeys;
exports.getMarketingPlanKeys = getMarketingPlanKeys;
exports.getReviewAnalysisKeys = getReviewAnalysisKeys;
exports.getOAuthTokenKeys = getOAuthTokenKeys;
exports.getUserItemPrefix = getUserItemPrefix;
exports.extractUserIdFromPK = extractUserIdFromPK;
exports.extractEntityIdFromSK = extractEntityIdFromSK;
exports.getImageMetadataKeys = getImageMetadataKeys;
exports.getEditRecordKeys = getEditRecordKeys;
exports.getAgentProfileKeysV2 = getAgentProfileKeysV2;
exports.getCitationKeys = getCitationKeys;
exports.getConversationKeys = getConversationKeys;
exports.getWorkflowExecutionKeys = getWorkflowExecutionKeys;
exports.getLoginSessionKeys = getLoginSessionKeys;
exports.getListingKeys = getListingKeys;
exports.getMLSConnectionKeys = getMLSConnectionKeys;
exports.getSocialConnectionKeys = getSocialConnectionKeys;
exports.getSocialPostKeys = getSocialPostKeys;
exports.getPerformanceMetricsKeys = getPerformanceMetricsKeys;
exports.getAlertKeys = getAlertKeys;
exports.getAlertSettingsKeys = getAlertSettingsKeys;
exports.getNeighborhoodProfileKeys = getNeighborhoodProfileKeys;
exports.getLifeEventKeys = getLifeEventKeys;
exports.getProspectKeys = getProspectKeys;
exports.getTrackedCompetitorKeys = getTrackedCompetitorKeys;
exports.getListingEventKeys = getListingEventKeys;
exports.getTrendIndicatorsKeys = getTrendIndicatorsKeys;
exports.getTargetAreaKeys = getTargetAreaKeys;
exports.getPriceHistoryKeys = getPriceHistoryKeys;
exports.getListingSnapshotKeys = getListingSnapshotKeys;
function getUserProfileKeys(userId) {
    return {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
    };
}
function getProfileKeys(userId) {
    return getUserProfileKeys(userId);
}
function getAgentProfileKeys(userId, agentProfileId) {
    return {
        PK: `USER#${userId}`,
        SK: `AGENT#${agentProfileId}`,
    };
}
function getReviewKeys(agentId, reviewId) {
    return {
        PK: `REVIEW#${agentId}`,
        SK: `REVIEW#${reviewId}`,
        GSI1PK: `REVIEW#${reviewId}`,
    };
}
function getBrandAuditKeys(userId, auditId) {
    return {
        PK: `USER#${userId}`,
        SK: `AUDIT#${auditId}`,
    };
}
function getCompetitorKeys(userId, competitorId) {
    return {
        PK: `USER#${userId}`,
        SK: `COMPETITOR#${competitorId}`,
    };
}
function getResearchReportKeys(userId, reportId) {
    return {
        PK: `USER#${userId}`,
        SK: `REPORT#${reportId}`,
    };
}
function getProjectKeys(userId, projectId) {
    return {
        PK: `USER#${userId}`,
        SK: `PROJECT#${projectId}`,
    };
}
function getSavedContentKeys(userId, contentId) {
    return {
        PK: `USER#${userId}`,
        SK: `CONTENT#${contentId}`,
    };
}
function getTrainingProgressKeys(userId, moduleId) {
    return {
        PK: `USER#${userId}`,
        SK: `TRAINING#${moduleId}`,
    };
}
function getMarketingPlanKeys(userId, planId) {
    return {
        PK: `USER#${userId}`,
        SK: `PLAN#${planId}`,
    };
}
function getReviewAnalysisKeys(userId, analysisId) {
    return {
        PK: `USER#${userId}`,
        SK: `ANALYSIS#${analysisId}`,
    };
}
function getOAuthTokenKeys(userId, provider = 'GOOGLE_BUSINESS') {
    return {
        PK: `OAUTH#${userId}`,
        SK: provider,
    };
}
function getUserItemPrefix(userId, itemType) {
    const pk = `USER#${userId}`;
    if (itemType) {
        return itemType;
    }
    return pk;
}
function extractUserIdFromPK(pk) {
    const match = pk.match(/^USER#(.+)$/);
    return match ? match[1] : null;
}
function extractEntityIdFromSK(sk) {
    const match = sk.match(/^[A-Z]+#(.+)$/);
    return match ? match[1] : null;
}
function getImageMetadataKeys(userId, imageId) {
    return {
        PK: `USER#${userId}`,
        SK: `IMAGE#${imageId}`,
    };
}
function getEditRecordKeys(userId, editId) {
    return {
        PK: `USER#${userId}`,
        SK: `EDIT#${editId}`,
    };
}
function getAgentProfileKeysV2(userId) {
    return {
        PK: `USER#${userId}`,
        SK: 'PROFILE#AGENT',
    };
}
function getCitationKeys(userId, citationId) {
    return {
        PK: `USER#${userId}`,
        SK: `CITATION#${citationId}`,
    };
}
function getConversationKeys(userId, conversationId) {
    return {
        PK: `USER#${userId}`,
        SK: `CONVERSATION#${conversationId}`,
    };
}
function getWorkflowExecutionKeys(userId, workflowId) {
    return {
        PK: `USER#${userId}`,
        SK: `WORKFLOW#${workflowId}`,
    };
}
function getLoginSessionKeys(userId, sessionId) {
    return {
        PK: `USER#${userId}`,
        SK: `SESSION#${sessionId}`,
    };
}
function getListingKeys(userId, listingId, mlsProvider, mlsNumber, status) {
    const keys = {
        PK: `USER#${userId}`,
        SK: `LISTING#${listingId}`,
    };
    if (mlsProvider && mlsNumber) {
        keys.GSI1PK = `MLS#${mlsProvider}#${mlsNumber}`;
    }
    if (status) {
        keys.GSI1SK = `STATUS#${status}`;
    }
    return keys;
}
function getMLSConnectionKeys(userId, connectionId) {
    return {
        PK: `USER#${userId}`,
        SK: `MLS_CONNECTION#${connectionId}`,
    };
}
function getSocialConnectionKeys(userId, platform) {
    return {
        PK: `USER#${userId}`,
        SK: `SOCIAL#${platform.toUpperCase()}`,
    };
}
function getSocialPostKeys(userId, postId, listingId) {
    const keys = {
        PK: `USER#${userId}`,
        SK: `POST#${postId}`,
    };
    if (listingId) {
        keys.GSI1PK = `LISTING#${listingId}`;
        keys.GSI1SK = `POST#${postId}`;
    }
    return keys;
}
function getPerformanceMetricsKeys(userId, listingId, date) {
    return {
        PK: `USER#${userId}`,
        SK: `METRICS#${listingId}#${date}`,
    };
}
function getAlertKeys(userId, alertId, timestamp, alertType) {
    const keys = {
        PK: `USER#${userId}`,
        SK: `ALERT#${timestamp}#${alertId}`,
    };
    if (alertType) {
        keys.GSI1PK = `ALERT#${userId}#${alertType}`;
        keys.GSI1SK = timestamp;
    }
    return keys;
}
function getAlertSettingsKeys(userId) {
    return {
        PK: `USER#${userId}`,
        SK: 'SETTINGS#ALERTS',
    };
}
function getNeighborhoodProfileKeys(userId, profileId) {
    return {
        PK: `USER#${userId}`,
        SK: `NEIGHBORHOOD#${profileId}`,
    };
}
function getLifeEventKeys(userId, eventId) {
    return {
        PK: `USER#${userId}`,
        SK: `LIFE_EVENT#${eventId}`,
    };
}
function getProspectKeys(userId, prospectId) {
    return {
        PK: `USER#${userId}`,
        SK: `PROSPECT#${prospectId}`,
    };
}
function getTrackedCompetitorKeys(userId, competitorId) {
    return {
        PK: `USER#${userId}`,
        SK: `TRACKED_COMPETITOR#${competitorId}`,
    };
}
function getListingEventKeys(userId, eventId) {
    return {
        PK: `USER#${userId}`,
        SK: `LISTING_EVENT#${eventId}`,
    };
}
function getTrendIndicatorsKeys(userId, neighborhood, period) {
    return {
        PK: `USER#${userId}`,
        SK: `TREND#${neighborhood}#${period}`,
    };
}
function getTargetAreaKeys(userId, areaId) {
    return {
        PK: `USER#${userId}`,
        SK: `TARGET_AREA#${areaId}`,
    };
}
function getPriceHistoryKeys(userId, mlsNumber) {
    return {
        PK: `USER#${userId}`,
        SK: `PRICE_HISTORY#${mlsNumber}`,
    };
}
function getListingSnapshotKeys(userId, mlsNumber) {
    return {
        PK: `USER#${userId}`,
        SK: `LISTING_SNAPSHOT#${mlsNumber}`,
    };
}
