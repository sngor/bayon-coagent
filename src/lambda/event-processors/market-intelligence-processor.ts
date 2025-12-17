/**
 * Market Intelligence Event Processor
 * 
 * Handles events related to market trends, alerts, and opportunities
 */

import { EventBridgeEvent, Context } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getConfig } from '@/aws/config';

interface TrendDetectedEvent {
    userId?: string;
    trendType: string;
    trendData: any;
    confidence: number;
    affectedUsers?: string[];
    timestamp: string;
}

interface AlertTriggeredEvent {
    userId: string;
    alertType: string;
    alertData: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
}

interface OpportunityIdentifiedEvent {
    userId: string;
    opportunityId: string;
    opportunityType: string;
    opportunityData: any;
    confidence: number;
    timestamp: string;
}

interface PriceChangeDetectedEvent {
    userId?: string;
    propertyId: string;
    oldPrice: number;
    newPrice: number;
    changePercent: number;
    marketArea: string;
    timestamp: string;
}

const config = getConfig();
const eventBridge = new EventBridgeClient({ region: config.region });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: config.region }));

export const handler = async (
    event: EventBridgeEvent<string, TrendDetectedEvent | AlertTriggeredEvent | OpportunityIdentifiedEvent | PriceChangeDetectedEvent>,
    _context: Context
) => {
    console.log('Processing market intelligence event:', JSON.stringify(event, null, 2));

    try {
        switch (event['detail-type']) {
            case 'Trend Detected':
                await handleTrendDetected(event.detail as TrendDetectedEvent);
                break;

            case 'Alert Triggered':
                await handleAlertTriggered(event.detail as AlertTriggeredEvent);
                break;

            case 'Opportunity Identified':
                await handleOpportunityIdentified(event.detail as OpportunityIdentifiedEvent);
                break;

            case 'Price Change Detected':
                await handlePriceChangeDetected(event.detail as PriceChangeDetectedEvent);
                break;

            default:
                console.warn('Unknown market intelligence event type:', event['detail-type']);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Market intelligence event processed successfully' })
        };

    } catch (error) {
        console.error('Error processing market intelligence event:', error);
        throw error;
    }
};

async function handleTrendDetected(detail: TrendDetectedEvent) {
    console.log('Handling trend detected:', detail.trendType);

    // 1. Save trend data
    await saveTrendData(detail);

    // 2. Notify affected users
    if (detail.affectedUsers && detail.affectedUsers.length > 0) {
        await notifyAffectedUsers(detail);
    }

    // 3. Update market analytics
    await updateMarketAnalytics(detail);

    // 4. Trigger content suggestions based on trend
    await triggerTrendBasedContent(detail);

    // 5. Update user recommendations
    await updateUserRecommendations(detail);
}

async function handleAlertTriggered(detail: AlertTriggeredEvent) {
    console.log('Handling alert triggered for user:', detail.userId);

    // 1. Save alert to user's alerts
    await saveUserAlert(detail);

    // 2. Send real-time notification
    await sendAlertNotification(detail);

    // 3. Update alert analytics
    await updateAlertAnalytics(detail);

    // 4. Trigger follow-up actions based on severity
    await triggerFollowUpActions(detail);
}

async function handleOpportunityIdentified(detail: OpportunityIdentifiedEvent) {
    console.log('Handling opportunity identified:', detail.opportunityId);

    // 1. Save opportunity data
    await saveOpportunityData(detail);

    // 2. Calculate opportunity score
    const score = await calculateOpportunityScore(detail);

    // 3. Send notification if high-value opportunity
    if (score >= 0.7) {
        await sendOpportunityNotification(detail, score);
    }

    // 4. Update opportunity analytics
    await updateOpportunityAnalytics(detail);
}

async function handlePriceChangeDetected(detail: PriceChangeDetectedEvent) {
    console.log('Handling price change detected:', detail.propertyId);

    // 1. Save price change data
    await savePriceChangeData(detail);

    // 2. Update market trends
    await updateMarketTrends(detail);

    // 3. Notify users tracking this area
    await notifyAreaTrackers(detail);

    // 4. Update property valuations
    await updatePropertyValuations(detail);
}

async function saveTrendData(detail: TrendDetectedEvent) {
    const trendId = `${detail.trendType}_${Date.now()}`;

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `TREND#${detail.trendType}`,
            SK: `DATE#${detail.timestamp}`,
            GSI1PK: `MARKET_TREND`,
            GSI1SK: `CONFIDENCE#${detail.confidence}`,
            EntityType: 'MarketTrend',
            TrendId: trendId,
            TrendType: detail.trendType,
            TrendData: detail.trendData,
            Confidence: detail.confidence,
            AffectedUsers: detail.affectedUsers || [],
            DetectedAt: detail.timestamp,
            CreatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Trend data saved:', trendId);
}

async function notifyAffectedUsers(detail: TrendDetectedEvent) {
    if (!detail.affectedUsers) return;

    const notifications = detail.affectedUsers.map(userId => ({
        Source: 'bayon.coagent.market',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId,
            type: 'trend_alert',
            message: `New ${detail.trendType} trend detected in your market area`,
            data: {
                trendType: detail.trendType,
                confidence: detail.confidence,
                trendData: detail.trendData
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    }));

    // Send in batches of 10
    const batches = [];
    for (let i = 0; i < notifications.length; i += 10) {
        batches.push(notifications.slice(i, i + 10));
    }

    for (const batch of batches) {
        await eventBridge.send(new PutEventsCommand({
            Entries: batch
        }));
    }

    console.log(`Notified ${detail.affectedUsers.length} users about trend`);
}

async function updateMarketAnalytics(detail: TrendDetectedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: 'MARKET_ANALYTICS',
            SK: `DATE#${today}`
        },
        UpdateExpression: `
      ADD TrendsDetected :inc
      SET 
        #trendType = if_not_exists(#trendType, :zero) + :inc,
        LastTrendAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#trendType': `${detail.trendType}Count`
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':zero': 0,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function triggerTrendBasedContent(detail: TrendDetectedEvent) {
    // Generate content suggestions based on detected trends
    const contentEvent = {
        Source: 'bayon.coagent.market',
        DetailType: 'Trend-Based Content Suggested',
        Detail: JSON.stringify({
            trendType: detail.trendType,
            trendData: detail.trendData,
            confidence: detail.confidence,
            suggestedContentTypes: ['blog-post', 'social-media', 'market-update'],
            affectedUsers: detail.affectedUsers
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [contentEvent]
    }));
}

async function updateUserRecommendations(detail: TrendDetectedEvent) {
    if (!detail.affectedUsers) return;

    // Update recommendations for affected users
    const updatePromises = detail.affectedUsers.map(async (userId) => {
        const params = {
            TableName: process.env.DYNAMODB_TABLE_NAME!,
            Key: {
                PK: `USER#${userId}`,
                SK: 'RECOMMENDATIONS'
            },
            UpdateExpression: `
        SET 
          TrendRecommendations = list_append(if_not_exists(TrendRecommendations, :empty), :trend),
          UpdatedAt = :now
      `,
            ExpressionAttributeValues: {
                ':trend': [{
                    trendType: detail.trendType,
                    confidence: detail.confidence,
                    detectedAt: detail.timestamp,
                    recommendation: `Consider creating content about ${detail.trendType} trends`
                }],
                ':empty': [],
                ':now': Date.now()
            }
        };

        return dynamoClient.send(new UpdateCommand(params));
    });

    await Promise.allSettled(updatePromises);
}

async function saveUserAlert(detail: AlertTriggeredEvent) {
    const alertId = `${detail.alertType}_${Date.now()}`;

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `ALERT#${alertId}`,
            GSI1PK: `ALERT#${detail.alertType}`,
            GSI1SK: `SEVERITY#${detail.severity}`,
            EntityType: 'Alert',
            UserId: detail.userId,
            AlertId: alertId,
            AlertType: detail.alertType,
            AlertData: detail.alertData,
            Severity: detail.severity,
            Status: 'active',
            TriggeredAt: detail.timestamp,
            CreatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Alert saved for user:', detail.userId);
}

async function sendAlertNotification(detail: AlertTriggeredEvent) {
    const notificationEvent = {
        Source: 'bayon.coagent.market',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'market_alert',
            message: `${detail.severity.toUpperCase()} Alert: ${detail.alertType}`,
            data: {
                alertType: detail.alertType,
                severity: detail.severity,
                alertData: detail.alertData,
                timestamp: detail.timestamp
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [notificationEvent]
    }));
}

async function updateAlertAnalytics(detail: AlertTriggeredEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `ANALYTICS#${today}`
        },
        UpdateExpression: `
      ADD AlertsTriggered :inc
      SET 
        #alertType = if_not_exists(#alertType, :zero) + :inc,
        #severity = if_not_exists(#severity, :zero) + :inc,
        LastAlertAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#alertType': `${detail.alertType}Count`,
            '#severity': `${detail.severity}AlertCount`
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':zero': 0,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function triggerFollowUpActions(detail: AlertTriggeredEvent) {
    // Trigger different actions based on alert severity
    const actions = [];

    if (detail.severity === 'critical') {
        actions.push({
            Source: 'bayon.coagent.market',
            DetailType: 'Immediate Action Required',
            Detail: JSON.stringify({
                userId: detail.userId,
                alertType: detail.alertType,
                action: 'immediate_review',
                priority: 'high'
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        });
    }

    if (detail.severity === 'high' || detail.severity === 'critical') {
        actions.push({
            Source: 'bayon.coagent.market',
            DetailType: 'Content Generation Suggested',
            Detail: JSON.stringify({
                userId: detail.userId,
                contentType: 'market-update',
                topic: `Market Alert: ${detail.alertType}`,
                urgency: detail.severity
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        });
    }

    if (actions.length > 0) {
        await eventBridge.send(new PutEventsCommand({
            Entries: actions
        }));
    }
}

async function saveOpportunityData(detail: OpportunityIdentifiedEvent) {
    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `USER#${detail.userId}`,
            SK: `OPPORTUNITY#${detail.opportunityId}`,
            GSI1PK: `OPPORTUNITY#${detail.opportunityType}`,
            GSI1SK: `CONFIDENCE#${detail.confidence}`,
            EntityType: 'Opportunity',
            UserId: detail.userId,
            OpportunityId: detail.opportunityId,
            OpportunityType: detail.opportunityType,
            OpportunityData: detail.opportunityData,
            Confidence: detail.confidence,
            Status: 'identified',
            IdentifiedAt: detail.timestamp,
            CreatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60) // 60 days retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Opportunity saved:', detail.opportunityId);
}

async function calculateOpportunityScore(detail: OpportunityIdentifiedEvent): Promise<number> {
    // Simple scoring algorithm - can be enhanced with ML
    let score = detail.confidence;

    // Boost score based on opportunity type
    const typeBoosts: Record<string, number> = {
        'high-value-listing': 0.2,
        'market-expansion': 0.15,
        'competitor-weakness': 0.1,
        'seasonal-trend': 0.05
    };

    score += typeBoosts[detail.opportunityType] || 0;

    // Cap at 1.0
    return Math.min(score, 1.0);
}

async function sendOpportunityNotification(detail: OpportunityIdentifiedEvent, score: number) {
    const notificationEvent = {
        Source: 'bayon.coagent.market',
        DetailType: 'Real-time Notification',
        Detail: JSON.stringify({
            userId: detail.userId,
            type: 'opportunity_alert',
            message: `High-value opportunity identified: ${detail.opportunityType}`,
            data: {
                opportunityId: detail.opportunityId,
                opportunityType: detail.opportunityType,
                confidence: detail.confidence,
                score,
                opportunityData: detail.opportunityData
            }
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [notificationEvent]
    }));
}

async function updateOpportunityAnalytics(detail: OpportunityIdentifiedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `USER#${detail.userId}`,
            SK: `ANALYTICS#${today}`
        },
        UpdateExpression: `
      ADD OpportunitiesIdentified :inc
      SET 
        #opportunityType = if_not_exists(#opportunityType, :zero) + :inc,
        LastOpportunityAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeNames: {
            '#opportunityType': `${detail.opportunityType}Count`
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':zero': 0,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function savePriceChangeData(detail: PriceChangeDetectedEvent) {
    const changeId = `${detail.propertyId}_${Date.now()}`;

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Item: {
            PK: `PROPERTY#${detail.propertyId}`,
            SK: `PRICE_CHANGE#${detail.timestamp}`,
            GSI1PK: `MARKET#${detail.marketArea}`,
            GSI1SK: `CHANGE#${Math.abs(detail.changePercent)}`,
            EntityType: 'PriceChange',
            ChangeId: changeId,
            PropertyId: detail.propertyId,
            OldPrice: detail.oldPrice,
            NewPrice: detail.newPrice,
            ChangePercent: detail.changePercent,
            ChangeAmount: detail.newPrice - detail.oldPrice,
            MarketArea: detail.marketArea,
            DetectedAt: detail.timestamp,
            CreatedAt: Date.now(),
            TTL: Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60) // 180 days retention
        }
    };

    await dynamoClient.send(new PutCommand(params));
    console.log('Price change saved:', changeId);
}

async function updateMarketTrends(detail: PriceChangeDetectedEvent) {
    const today = new Date().toISOString().split('T')[0];

    const params = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        Key: {
            PK: `MARKET#${detail.marketArea}`,
            SK: `TRENDS#${today}`
        },
        UpdateExpression: `
      ADD 
        PriceChanges :inc,
        TotalPriceChange :change
      SET 
        LastPriceChangeAt = :now,
        UpdatedAt = :now
    `,
        ExpressionAttributeValues: {
            ':inc': 1,
            ':change': detail.changePercent,
            ':now': Date.now()
        }
    };

    await dynamoClient.send(new UpdateCommand(params));
}

async function notifyAreaTrackers(detail: PriceChangeDetectedEvent) {
    // Find users tracking this market area
    const trackersQuery = {
        TableName: process.env.DYNAMODB_TABLE_NAME!,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
            ':pk': `TRACKING#${detail.marketArea}`
        }
    };

    const result = await dynamoClient.send(new QueryCommand(trackersQuery));

    if (result.Items && result.Items.length > 0) {
        const notifications = result.Items.map(item => ({
            Source: 'bayon.coagent.market',
            DetailType: 'Real-time Notification',
            Detail: JSON.stringify({
                userId: item.UserId,
                type: 'price_change_alert',
                message: `Price change detected in ${detail.marketArea}: ${detail.changePercent > 0 ? '+' : ''}${detail.changePercent.toFixed(1)}%`,
                data: {
                    propertyId: detail.propertyId,
                    oldPrice: detail.oldPrice,
                    newPrice: detail.newPrice,
                    changePercent: detail.changePercent,
                    marketArea: detail.marketArea
                }
            }),
            EventBusName: process.env.EVENT_BUS_NAME!
        }));

        await eventBridge.send(new PutEventsCommand({
            Entries: notifications.slice(0, 10) // Limit to 10 per batch
        }));
    }
}

async function updatePropertyValuations(detail: PriceChangeDetectedEvent) {
    // Update property valuation models based on price changes
    const valuationEvent = {
        Source: 'bayon.coagent.market',
        DetailType: 'Valuation Model Update Requested',
        Detail: JSON.stringify({
            propertyId: detail.propertyId,
            priceChange: {
                oldPrice: detail.oldPrice,
                newPrice: detail.newPrice,
                changePercent: detail.changePercent
            },
            marketArea: detail.marketArea,
            timestamp: detail.timestamp
        }),
        EventBusName: process.env.EVENT_BUS_NAME!
    };

    await eventBridge.send(new PutEventsCommand({
        Entries: [valuationEvent]
    }));
}