/**
 * Brand Intelligence Event Processor
 * 
 * Handles events related to brand intelligence and competitor analysis
 */

import { EventBridgeEvent, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '@/aws/config';

interface ProfileUpdatedEvent {
    userId: string;
    profileData: any;
    changes: string[];
    timestamp: string;
}

interface CompetitorDiscoveredEvent {
    userId: string;
    competitorId: string;
    competitorData: any;
    discoveryMethod: string;
    timestamp: string;
}

interface RankingChangedEvent {
    userId: string;
    keyword: string;
    oldRank: number;
    newRank: number;
    searchEngine: string;
    timestamp: string;
}

const config = getConfig();
const eventBridge = new EventBridgeClient({ region: config.region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

export const handler = async (
    event: EventBridgeEvent<string, ProfileUpdatedEvent | CompetitorDiscoveredEvent | RankingChangedEvent>,
    context: Context
) => {
    console.log('Processing brand intelligence event:', JSON.stringify(event, null, 2));

    try {
        switch (event['detail-type']) {
            case 'Profile Updated':
                await handleProfileUpdated(event.detail as ProfileUpdatedEvent);
                break;

            case 'Competitor Discovered':
                await handleCompetitorDiscovered(event.detail as CompetitorDiscoveredEvent);
                break;

            case 'Ranking Changed':
                await handleRankingChanged(event.detail as RankingChangedEvent);
                break;

            default:
                console.warn('Unknown brand intelligence event type:', event['detail-type']);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Brand intelligence event processed successfully' })
        };

    } catch (error) {
        console.error('Error processing brand intelligence event:', error);
        throw error;
    }
};

async function handleProfileUpdated(detail: ProfileUpdatedEvent) {
    console.log('Handling profile updated event for user:', detail.userId);

    // 1. Trigger brand audit if profile changes affect NAP consistency
    const napFields = ['businessName', 'address', 'phone', 'email'];
    const hasNapChanges = detail.changes.some(change => napFields.includes(change));

    if (hasNapChanges) {
        await triggerBrandAudit(detail.userId);
    }

    // 2. Update personalization settings for content generation
    await updateContentPersonalization(detail.userId, detail.profileData);

    // 3. Refresh competitor analysis if market area changed
    if (detail.changes.includes('marketArea') || detail.changes.includes('serviceAreas')) {
        await triggerCompetitorRefresh(detail.userId);
    }

    // 4. Send real-time notification
    await sendProfileUpdateNotification(detail);
}

async function handleCompetitorDiscovered(detail: CompetitorDiscoveredEvent) {
    console.log('Handling competitor discovered event:', detail.competitorId);

    // 1. Save competitor data
    await saveCompetitorData(detail);

    // 2. Trigger ranking comparison
    await triggerRankingComparison(detail.userId, detail.competitorId);

    // 3. Update competitive analysis
    await updateCompetitiveAnalysis(detail.userId, detail.competitorData);

    // 4. Send notification if significant competitor
    if (detail.competitorData.marketShare > 0.1) { // 10% market share
        await sendCompetitorAlert(detail);
    }
}

async function handleRankingChanged(detail: RankingChangedEvent) {
    console.log('Handling ranking changed event for keyword:', detail.keyword);

    // 1. Update ranking history
    await updateRankingHistory(detail);

    // 2. Calculate ranking trend
    const trend = await calculateRankingTrend(detail.userId, detail.keyword);

    // 3. Send alert if significant change
    const rankingChange = Math.abs(detail.newRank - detail.oldRank);
    if (rankingChange >= 5) { // Significant change threshold
        await sendRankingAlert(detail, trend);
    }

    // 4. Update SEO recommendations
    await updateSEORecommendations(detail.userId, detail.keyword, detail.newRank);
}

async function triggerBrandAudit(userId: string) {
    const auditEvent = {
        Source: 'bayon.coagent.brand',
        DetailType: 'Brand Audit Requested',
        Detail: JSON.stringify({
            userId,
            auditType: 'nap-consistency',
            triggeredBy: 'profile-update',
            timestamp: new Date().toISOString()
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [auditEvent]
    }));

    console.log('Brand audit triggered for user:', userId);
}

async function updateContentPersonalization(userId: string, profileData: any) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${userId}`,
            SK: 'PERSONALIZATION'
        },
        UpdateExpression: `
      SET 
        BusinessName = :businessName,
        MarketArea = :marketArea,
        Specialties = :specialties,
        TonePreference = :tone,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':businessName': profileData.businessName || '',
            ':marketArea': profileData.marketArea || '',
            ':specialties': profileData.specialties || [],
            ':tone': profileData.preferredTone || 'professional',
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
    console.log('Content personalization updated for user:', userId);
}

async function triggerCompetitorRefresh(userId: string) {
    const refreshEvent = {
        Source: 'bayon.coagent.brand',
        DetailType: 'Competitor Analysis Refresh Requested',
        Detail: JSON.stringify({
            userId,
            refreshType: 'market-area-change',
            timestamp: new Date().toISOString()
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [refreshEvent]
    }));

    console.log('Competitor refresh triggered for user:', userId);
}

async function sendProfileUpdateNotification(detail: ProfileUpdatedEvent) {
    const notificationEvent = {
        Source: 'bayon.coagent.brand',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'profile_updated',
            message: `Your profile has been updated successfully. ${detail.changes.length} changes made.`,
            data: {
                changes: detail.changes,
                timestamp: detail.timestamp
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [notificationEvent]
    }));
}

async function saveCompetitorData(detail: CompetitorDiscoveredEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `COMPETITOR#${detail.competitorId}`,
            GSI1PK: `COMPETITOR#${detail.competitorId}`,
            GSI1SK: `USER#${detail.userId}`,
            EntityType: 'Competitor',
            UserId: detail.userId,
            CompetitorId: detail.competitorId,
            CompetitorData: detail.competitorData,
            DiscoveryMethod: detail.discoveryMethod,
            DiscoveredAt: detail.timestamp,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now()
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Competitor data saved:', detail.competitorId);
}

async function triggerRankingComparison(userId: string, competitorId: string) {
    const comparisonEvent = {
        Source: 'bayon.coagent.brand',
        DetailType: 'Ranking Comparison Requested',
        Detail: JSON.stringify({
            userId,
            competitorId,
            timestamp: new Date().toISOString()
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [comparisonEvent]
    }));
}

async function updateCompetitiveAnalysis(userId: string, competitorData: any) {
    // Update competitive analysis metrics
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${userId}`,
            SK: `COMPETITIVE_ANALYSIS#${today}`
        },
        UpdateExpression: `
      ADD CompetitorsTracked :inc
      SET 
        LastUpdated = :now,
        MarketCompetitiveness = :competitiveness
    `,
        ExpressionAttributeValues: {
            ':inc': 1,
            ':now': Date.now(),
            ':competitiveness': competitorData.marketShare || 0
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function sendCompetitorAlert(detail: CompetitorDiscoveredEvent) {
    const alertEvent = {
        Source: 'bayon.coagent.brand',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'competitor_alert',
            message: `New significant competitor discovered: ${detail.competitorData.name}`,
            data: {
                competitorId: detail.competitorId,
                competitorName: detail.competitorData.name,
                marketShare: detail.competitorData.marketShare,
                discoveryMethod: detail.discoveryMethod
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [alertEvent]
    }));
}

async function updateRankingHistory(detail: RankingChangedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `RANKING#${detail.keyword}#${Date.now()}`,
            GSI1PK: `RANKING#${detail.keyword}`,
            GSI1SK: `DATE#${detail.timestamp}`,
            EntityType: 'RankingHistory',
            UserId: detail.userId,
            Keyword: detail.keyword,
            OldRank: detail.oldRank,
            NewRank: detail.newRank,
            SearchEngine: detail.searchEngine,
            Change: detail.newRank - detail.oldRank,
            Timestamp: detail.timestamp,
            CreatedAt: Date.now()
        }
    };

    await dynamoClient.send(new PutCommand(params));
}

async function calculateRankingTrend(userId: string, keyword: string): Promise<'improving' | 'declining' | 'stable'> {
    // Get recent ranking history for trend analysis
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
            ':pk': `RANKING#${keyword}`
        },
        ScanIndexForward: false, // Most recent first
        Limit: 5
    };

    const result = await dynamoClient.send(new QueryCommand(params));

    if (!result.Items || result.Items.length < 2) {
        return 'stable';
    }

    const changes = result.Items.map(item => item.Change as number);
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;

    if (avgChange < -2) return 'improving'; // Lower rank numbers are better
    if (avgChange > 2) return 'declining';
    return 'stable';
}

async function sendRankingAlert(detail: RankingChangedEvent, trend: string) {
    const isImprovement = detail.newRank < detail.oldRank;
    const alertEvent = {
        Source: 'bayon.coagent.brand',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'ranking_alert',
            message: `Keyword "${detail.keyword}" ranking ${isImprovement ? 'improved' : 'declined'} from #${detail.oldRank} to #${detail.newRank}`,
            data: {
                keyword: detail.keyword,
                oldRank: detail.oldRank,
                newRank: detail.newRank,
                change: detail.newRank - detail.oldRank,
                trend,
                searchEngine: detail.searchEngine
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [alertEvent]
    }));
}

async function updateSEORecommendations(userId: string, keyword: string, newRank: number) {
    // Generate SEO recommendations based on ranking
    let recommendations = [];

    if (newRank > 10) {
        recommendations.push('Consider creating more content targeting this keyword');
        recommendations.push('Optimize existing content for better keyword relevance');
    }

    if (newRank > 20) {
        recommendations.push('Review competitor content for this keyword');
        recommendations.push('Consider local SEO optimization');
    }

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${userId}`,
            SK: `SEO_RECOMMENDATIONS#${keyword}`
        },
        UpdateExpression: `
      SET 
        Recommendations = :recommendations,
        CurrentRank = :rank,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':recommendations': recommendations,
            ':rank': newRank,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}