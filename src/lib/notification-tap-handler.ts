/**
 * Notification Tap Handler for Mobile Enhancements
 * 
 * This module handles notification tap events, deep linking, and navigation
 * to relevant market data or reports when users tap on push notifications.
 */

import { useRouter } from 'next/navigation';

export interface NotificationData {
    type: 'price-change' | 'new-listing' | 'trend-shift';
    location: string;
    propertyId?: string;
    mlsNumber?: string;
    alertId?: string;
    timestamp?: number;
    [key: string]: any;
}

export interface NavigationTarget {
    path: string;
    params?: Record<string, string>;
    state?: Record<string, any>;
}

/**
 * Notification Tap Handler class
 */
export class NotificationTapHandler {
    private router: any;

    constructor(router?: any) {
        this.router = router;
    }

    /**
     * Handle notification tap event
     */
    async handleNotificationTap(notificationData: NotificationData): Promise<void> {
        try {
            console.log('Handling notification tap:', notificationData);

            // Determine navigation target based on notification type
            const target = this.getNavigationTarget(notificationData);

            if (!target) {
                console.warn('No navigation target found for notification:', notificationData);
                return;
            }

            // Mark notification as read if alertId is provided
            if (notificationData.alertId) {
                await this.markNotificationAsRead(notificationData.alertId);
            }

            // Navigate to the target
            await this.navigateToTarget(target);

            console.log('Navigation completed for notification tap');
        } catch (error) {
            console.error('Failed to handle notification tap:', error);
        }
    }

    /**
     * Get navigation target based on notification data
     */
    private getNavigationTarget(data: NotificationData): NavigationTarget | null {
        switch (data.type) {
            case 'price-change':
                return this.getPriceChangeTarget(data);

            case 'new-listing':
                return this.getNewListingTarget(data);

            case 'trend-shift':
                return this.getTrendShiftTarget(data);

            default:
                return this.getDefaultTarget(data);
        }
    }

    /**
     * Get navigation target for price change notifications
     */
    private getPriceChangeTarget(data: NotificationData): NavigationTarget {
        if (data.propertyId || data.mlsNumber) {
            // Navigate to specific property details
            return {
                path: '/market/insights',
                params: {
                    tab: 'opportunities',
                    propertyId: data.propertyId || data.mlsNumber,
                },
                state: {
                    notificationData: data,
                    highlightPriceChange: true,
                },
            };
        }

        // Navigate to market insights for the location
        return {
            path: '/market/insights',
            params: {
                tab: 'trends',
                location: encodeURIComponent(data.location),
            },
            state: {
                notificationData: data,
                filterType: 'price-changes',
            },
        };
    }

    /**
     * Get navigation target for new listing notifications
     */
    private getNewListingTarget(data: NotificationData): NavigationTarget {
        if (data.propertyId || data.mlsNumber) {
            // Navigate to specific property details
            return {
                path: '/market/insights',
                params: {
                    tab: 'opportunities',
                    propertyId: data.propertyId || data.mlsNumber,
                },
                state: {
                    notificationData: data,
                    highlightNewListing: true,
                },
            };
        }

        // Navigate to opportunities for the location
        return {
            path: '/market/insights',
            params: {
                tab: 'opportunities',
                location: encodeURIComponent(data.location),
            },
            state: {
                notificationData: data,
                filterType: 'new-listings',
            },
        };
    }

    /**
     * Get navigation target for trend shift notifications
     */
    private getTrendShiftTarget(data: NotificationData): NavigationTarget {
        return {
            path: '/market/insights',
            params: {
                tab: 'trends',
                location: encodeURIComponent(data.location),
            },
            state: {
                notificationData: data,
                trendType: data.trendType,
                trendDirection: data.trendDirection,
            },
        };
    }

    /**
     * Get default navigation target
     */
    private getDefaultTarget(data: NotificationData): NavigationTarget {
        return {
            path: '/market/insights',
            params: {
                location: encodeURIComponent(data.location),
            },
            state: {
                notificationData: data,
            },
        };
    }

    /**
     * Navigate to the specified target
     */
    private async navigateToTarget(target: NavigationTarget): Promise<void> {
        try {
            // Build the URL with query parameters
            let url = target.path;

            if (target.params && Object.keys(target.params).length > 0) {
                const searchParams = new URLSearchParams(target.params);
                url += `?${searchParams.toString()}`;
            }

            // Store state in sessionStorage if provided
            if (target.state) {
                sessionStorage.setItem('notificationState', JSON.stringify(target.state));
            }

            // Navigate using router if available
            if (this.router) {
                await this.router.push(url);
            } else {
                // Fallback to window.location
                window.location.href = url;
            }
        } catch (error) {
            console.error('Failed to navigate to target:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    private async markNotificationAsRead(alertId: string): Promise<void> {
        try {
            // This would typically call a server action to mark the alert as read
            // For now, we'll just log it
            console.log('Marking notification as read:', alertId);

            // TODO: Implement server action call when alert management is available
            // await markAlertAsReadAction(alertId);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    /**
     * Handle deep link from notification
     */
    static handleDeepLink(url: string): NotificationData | null {
        try {
            const urlObj = new URL(url);
            const searchParams = urlObj.searchParams;

            // Extract notification data from URL parameters
            const notificationData: NotificationData = {
                type: searchParams.get('type') as any || 'trend-shift',
                location: decodeURIComponent(searchParams.get('location') || ''),
                propertyId: searchParams.get('propertyId') || undefined,
                mlsNumber: searchParams.get('mlsNumber') || undefined,
                alertId: searchParams.get('alertId') || undefined,
                timestamp: searchParams.get('timestamp') ? parseInt(searchParams.get('timestamp')!) : undefined,
            };

            // Add any additional parameters
            for (const [key, value] of searchParams.entries()) {
                if (!['type', 'location', 'propertyId', 'mlsNumber', 'alertId', 'timestamp'].includes(key)) {
                    notificationData[key] = value;
                }
            }

            return notificationData;
        } catch (error) {
            console.error('Failed to parse deep link:', error);
            return null;
        }
    }

    /**
     * Generate deep link URL for notification
     */
    static generateDeepLink(notificationData: NotificationData, baseUrl: string = ''): string {
        try {
            const params = new URLSearchParams();

            // Add required parameters
            params.set('type', notificationData.type);
            params.set('location', notificationData.location);

            // Add optional parameters
            if (notificationData.propertyId) {
                params.set('propertyId', notificationData.propertyId);
            }
            if (notificationData.mlsNumber) {
                params.set('mlsNumber', notificationData.mlsNumber);
            }
            if (notificationData.alertId) {
                params.set('alertId', notificationData.alertId);
            }
            if (notificationData.timestamp) {
                params.set('timestamp', notificationData.timestamp.toString());
            }

            // Add any additional data
            Object.entries(notificationData).forEach(([key, value]) => {
                if (!['type', 'location', 'propertyId', 'mlsNumber', 'alertId', 'timestamp'].includes(key) && value !== undefined) {
                    params.set(key, value.toString());
                }
            });

            return `${baseUrl}/market/insights?${params.toString()}`;
        } catch (error) {
            console.error('Failed to generate deep link:', error);
            return `${baseUrl}/market/insights`;
        }
    }
}

/**
 * React hook for handling notification taps
 */
export function useNotificationTapHandler() {
    const router = useRouter();
    const handler = new NotificationTapHandler(router);

    const handleNotificationTap = async (notificationData: NotificationData) => {
        await handler.handleNotificationTap(notificationData);
    };

    const getNotificationState = (): any => {
        try {
            const stateJson = sessionStorage.getItem('notificationState');
            if (stateJson) {
                const state = JSON.parse(stateJson);
                // Clear the state after reading
                sessionStorage.removeItem('notificationState');
                return state;
            }
        } catch (error) {
            console.error('Failed to get notification state:', error);
        }
        return null;
    };

    return {
        handleNotificationTap,
        getNotificationState,
    };
}

/**
 * Initialize notification tap handling for the app
 */
export function initializeNotificationTapHandling(): void {
    // Handle notification clicks when app is in background
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'notification-click') {
                const notificationData = event.data.notificationData;
                if (notificationData) {
                    const handler = new NotificationTapHandler();
                    handler.handleNotificationTap(notificationData);
                }
            }
        });
    }

    // Handle deep links when app is opened from notification
    if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('type') && urlParams.has('location')) {
            const notificationData = NotificationTapHandler.handleDeepLink(window.location.href);
            if (notificationData) {
                const handler = new NotificationTapHandler();
                handler.handleNotificationTap(notificationData);
            }
        }
    }
}

/**
 * Create notification tap handler instance
 */
export function createNotificationTapHandler(router?: any): NotificationTapHandler {
    return new NotificationTapHandler(router);
}