/**
 * Market Alert Monitoring System for Mobile Enhancements
 * 
 * This module provides monitoring for market events and triggers push notifications
 * for significant events like price changes, new listings, and trend shifts.
 */

import { DynamoDBRepository } from '../aws/dynamodb/repository';
import { sendMarketAlert } from '../aws/sns/client';
import { createPushNotificationManager, MarketAlert } from './push-notification-manager';
import { getAlertKeys, getTargetAreaKeys } from '../aws/dynamodb/keys';

export interface MarketEvent {
    id: string;
    type: 'price-change' | 'new-listing' | 'trend-shift';
    location: string;
    data: {
        propertyId?: string;
        mlsNumber?: string;
        address?: string;
        oldPrice?: number;
        newPrice?: number;
        priceChange?: number;
        priceChangePercent?: number;
        listingDate?: string;
        trendType?: 'inventory' | 'price' | 'dom' | 'activity';
        trendDirection?: 'up' | 'down';
        trendMagnitude?: 'small' | 'moderate' | 'significant';
        description?: string;
    };
    timestamp: number;
    severity: 'low' | 'medium' | 'high';
}

export interface TargetArea {
    id: string;
    userId: string;
    name: string;
    location: string;
    bounds?: {
        north: number;
        south: number;
        east: number;
        west: number;
    };
    zipCodes?: string[];
    neighborhoods?: string[];
    priceRange?: {
        min: number;
        max: number;
    };
    propertyTypes?: string[];
    alertThresholds: {
        priceChangePercent: number;
        inventoryChangePercent: number;
        domChangePercent: number;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AlertRule {
    id: string;
    userId: string;
    targetAreaId: string;
    eventType: 'price-change' | 'new-listing' | 'trend-shift';
    conditions: {
        minPriceChange?: number;
        maxPriceChange?: number;
        propertyTypes?: string[];
        priceRange?: { min: number; max: number };
        trendMagnitude?: ('small' | 'moderate' | 'significant')[];
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Market Alert Monitor class
 */
export class MarketAlertMonitor {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    /**
     * Process a market event and trigger alerts if necessary
     */
    async processMarketEvent(event: MarketEvent): Promise<void> {
        try {
            console.log(`Processing market event: ${event.type} in ${event.location}`);

            // Get all users with target areas that match this event
            const affectedUsers = await this.getAffectedUsers(event);

            for (const userId of affectedUsers) {
                await this.processEventForUser(userId, event);
            }

            console.log(`Market event processed for ${affectedUsers.length} users`);
        } catch (error) {
            console.error('Failed to process market event:', error);
            throw error;
        }
    }

    /**
     * Process a market event for a specific user
     */
    private async processEventForUser(userId: string, event: MarketEvent): Promise<void> {
        try {
            const pushManager = createPushNotificationManager(userId);

            // Check if user should receive this type of notification
            const alertType = this.mapEventTypeToAlertType(event.type);
            const shouldSend = await pushManager.shouldSendNotification(alertType);

            if (!shouldSend) {
                console.log(`Skipping notification for user ${userId}: preferences disabled`);
                return;
            }

            // Get user's push tokens
            const pushTokens = await pushManager.getPushTokens();

            if (pushTokens.length === 0) {
                console.log(`No push tokens found for user ${userId}`);
                return;
            }

            // Create alert message
            const alertMessage = this.createAlertMessage(event);

            // Send push notifications to all user's devices
            for (const token of pushTokens) {
                try {
                    await sendMarketAlert(token.endpointArn, event.type, {
                        location: event.location,
                        message: alertMessage,
                        data: event.data,
                    });

                    // Update token last used
                    await pushManager.updateTokenLastUsed(token.deviceId);
                } catch (error) {
                    console.error(`Failed to send alert to device ${token.deviceId}:`, error);
                }
            }

            // Store alert in user's history
            await this.storeAlert(userId, event, alertMessage);

            console.log(`Alert sent to user ${userId} for event ${event.id}`);
        } catch (error) {
            console.error(`Failed to process event for user ${userId}:`, error);
        }
    }

    /**
     * Get users affected by a market event
     */
    private async getAffectedUsers(event: MarketEvent): Promise<string[]> {
        // This is a simplified implementation
        // In a real system, you would query target areas and match against the event location

        try {
            // For now, we'll simulate finding affected users
            // In practice, this would involve:
            // 1. Query all target areas
            // 2. Check if event location matches any target area
            // 3. Return list of user IDs with matching target areas

            // Placeholder implementation - return empty array for now
            // TODO: Implement proper target area matching when target area management is available
            return [];
        } catch (error) {
            console.error('Failed to get affected users:', error);
            return [];
        }
    }

    /**
     * Map event type to notification preference key
     */
    private mapEventTypeToAlertType(eventType: string): 'priceChanges' | 'newListings' | 'trendShifts' {
        switch (eventType) {
            case 'price-change':
                return 'priceChanges';
            case 'new-listing':
                return 'newListings';
            case 'trend-shift':
                return 'trendShifts';
            default:
                return 'trendShifts';
        }
    }

    /**
     * Create alert message based on event data
     */
    private createAlertMessage(event: MarketEvent): string {
        switch (event.type) {
            case 'price-change':
                if (event.data.priceChangePercent) {
                    const direction = event.data.priceChangePercent > 0 ? 'increased' : 'decreased';
                    const percent = Math.abs(event.data.priceChangePercent);
                    return `Property price ${direction} by ${percent.toFixed(1)}%`;
                }
                return 'Property price changed';

            case 'new-listing':
                if (event.data.address) {
                    return `New listing: ${event.data.address}`;
                }
                return 'New property listed in your area';

            case 'trend-shift':
                if (event.data.trendType && event.data.trendDirection) {
                    const trendName = this.getTrendDisplayName(event.data.trendType);
                    return `${trendName} trending ${event.data.trendDirection}`;
                }
                return 'Market trend shift detected';

            default:
                return 'Market alert';
        }
    }

    /**
     * Get display name for trend type
     */
    private getTrendDisplayName(trendType: string): string {
        switch (trendType) {
            case 'inventory':
                return 'Inventory levels';
            case 'price':
                return 'Median prices';
            case 'dom':
                return 'Days on market';
            case 'activity':
                return 'Market activity';
            default:
                return 'Market trends';
        }
    }

    /**
     * Store alert in user's history
     */
    private async storeAlert(userId: string, event: MarketEvent, message: string): Promise<void> {
        try {
            const alertId = `alert_${event.id}_${Date.now()}`;
            const timestamp = Date.now().toString();

            const alertData = {
                alertId,
                eventId: event.id,
                type: event.type,
                location: event.location,
                message,
                eventData: event.data,
                severity: event.severity,
                createdAt: new Date().toISOString(),
                read: false,
            };

            const keys = getAlertKeys(userId, alertId, timestamp, event.type);
            await this.repository.create(
                keys.PK,
                keys.SK,
                'Alert',
                alertData,
                {
                    GSI1PK: keys.GSI1PK,
                    GSI1SK: keys.GSI1SK,
                }
            );
        } catch (error) {
            console.error('Failed to store alert:', error);
        }
    }

    /**
     * Monitor price changes for a specific property
     */
    async monitorPriceChange(
        propertyId: string,
        mlsNumber: string,
        oldPrice: number,
        newPrice: number,
        location: string,
        address?: string
    ): Promise<void> {
        const priceChange = newPrice - oldPrice;
        const priceChangePercent = (priceChange / oldPrice) * 100;

        // Only trigger alerts for significant price changes (>= 5%)
        if (Math.abs(priceChangePercent) < 5) {
            return;
        }

        const event: MarketEvent = {
            id: `price_change_${propertyId}_${Date.now()}`,
            type: 'price-change',
            location,
            data: {
                propertyId,
                mlsNumber,
                address,
                oldPrice,
                newPrice,
                priceChange,
                priceChangePercent,
                description: `Price ${priceChange > 0 ? 'increased' : 'decreased'} by $${Math.abs(priceChange).toLocaleString()}`,
            },
            timestamp: Date.now(),
            severity: Math.abs(priceChangePercent) >= 15 ? 'high' : Math.abs(priceChangePercent) >= 10 ? 'medium' : 'low',
        };

        await this.processMarketEvent(event);
    }

    /**
     * Monitor new listing
     */
    async monitorNewListing(
        propertyId: string,
        mlsNumber: string,
        address: string,
        price: number,
        location: string,
        propertyType?: string
    ): Promise<void> {
        const event: MarketEvent = {
            id: `new_listing_${propertyId}_${Date.now()}`,
            type: 'new-listing',
            location,
            data: {
                propertyId,
                mlsNumber,
                address,
                newPrice: price,
                listingDate: new Date().toISOString(),
                description: `New ${propertyType || 'property'} listed at $${price.toLocaleString()}`,
            },
            timestamp: Date.now(),
            severity: 'medium',
        };

        await this.processMarketEvent(event);
    }

    /**
     * Monitor trend shift
     */
    async monitorTrendShift(
        location: string,
        trendType: 'inventory' | 'price' | 'dom' | 'activity',
        trendDirection: 'up' | 'down',
        magnitude: 'small' | 'moderate' | 'significant',
        description?: string
    ): Promise<void> {
        const event: MarketEvent = {
            id: `trend_shift_${location}_${trendType}_${Date.now()}`,
            type: 'trend-shift',
            location,
            data: {
                trendType,
                trendDirection,
                trendMagnitude: magnitude,
                description: description || `${trendType} trending ${trendDirection}`,
            },
            timestamp: Date.now(),
            severity: magnitude === 'significant' ? 'high' : magnitude === 'moderate' ? 'medium' : 'low',
        };

        await this.processMarketEvent(event);
    }

    /**
     * Create a target area for a user
     */
    async createTargetArea(userId: string, targetArea: Omit<TargetArea, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
        try {
            const areaId = `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date().toISOString();

            const areaData: TargetArea = {
                ...targetArea,
                id: areaId,
                userId,
                createdAt: now,
                updatedAt: now,
            };

            const keys = getTargetAreaKeys(userId, areaId);
            await this.repository.create(
                keys.PK,
                keys.SK,
                'TargetArea',
                areaData
            );

            return areaId;
        } catch (error) {
            console.error('Failed to create target area:', error);
            throw error;
        }
    }

    /**
     * Get target areas for a user
     */
    async getTargetAreas(userId: string): Promise<TargetArea[]> {
        try {
            const pk = `USER#${userId}`;
            const skPrefix = 'TARGET_AREA#';

            const result = await this.repository.query<TargetArea>(pk, skPrefix);
            return result.items;
        } catch (error) {
            console.error('Failed to get target areas:', error);
            return [];
        }
    }

    /**
     * Update a target area
     */
    async updateTargetArea(userId: string, areaId: string, updates: Partial<TargetArea>): Promise<void> {
        try {
            const keys = getTargetAreaKeys(userId, areaId);
            await this.repository.update(keys.PK, keys.SK, {
                ...updates,
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Failed to update target area:', error);
            throw error;
        }
    }

    /**
     * Delete a target area
     */
    async deleteTargetArea(userId: string, areaId: string): Promise<void> {
        try {
            const keys = getTargetAreaKeys(userId, areaId);
            await this.repository.delete(keys.PK, keys.SK);
        } catch (error) {
            console.error('Failed to delete target area:', error);
            throw error;
        }
    }

    /**
     * Get alerts for a user
     */
    async getUserAlerts(userId: string, limit: number = 50): Promise<any[]> {
        try {
            const pk = `USER#${userId}`;
            const skPrefix = 'ALERT#';

            const result = await this.repository.query(pk, skPrefix, {
                limit,
                scanIndexForward: false, // Most recent first
            });

            return result.items;
        } catch (error) {
            console.error('Failed to get user alerts:', error);
            return [];
        }
    }

    /**
     * Mark alert as read
     */
    async markAlertAsRead(userId: string, alertId: string, timestamp: string): Promise<void> {
        try {
            const keys = getAlertKeys(userId, alertId, timestamp);
            await this.repository.update(keys.PK, keys.SK, { read: true });
        } catch (error) {
            console.error('Failed to mark alert as read:', error);
            throw error;
        }
    }

    /**
     * Get unread alert count for a user
     */
    async getUnreadAlertCount(userId: string): Promise<number> {
        try {
            const pk = `USER#${userId}`;
            const skPrefix = 'ALERT#';

            const result = await this.repository.query(pk, skPrefix, {
                filterExpression: '#read = :read',
                expressionAttributeNames: { '#read': 'read' },
                expressionAttributeValues: { ':read': false },
            });

            return result.count;
        } catch (error) {
            console.error('Failed to get unread alert count:', error);
            return 0;
        }
    }
}

/**
 * Create a market alert monitor instance
 */
export function createMarketAlertMonitor(): MarketAlertMonitor {
    return new MarketAlertMonitor();
}

/**
 * Global market alert monitor instance
 */
export const marketAlertMonitor = createMarketAlertMonitor();