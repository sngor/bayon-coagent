/**
 * GA4 Data API Client
 * 
 * Fetches analytics reports from Google Analytics 4 using the Data API.
 * Requires Google Cloud Service Account for authentication.
 */

import { GA4ReportRequest, GA4ReportResponse } from './types';
import { GA4_ENDPOINTS } from './constants';

/**
 * Data API Client
 */
export class DataAPIClient {
    private propertyId: string;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor(propertyId: string) {
        this.propertyId = propertyId;
    }

    /**
     * Get access token using service account
     * @private
     */
    private async getAccessToken(): Promise<string> {
        // Check if we have a valid cached token
        if (this.accessToken && this.tokenExpiresAt > Date.now()) {
            return this.accessToken;
        }

        // TODO: Implement service account authentication
        // This requires @google-auth-library/auth package
        // For now, return environment variable or throw error
        const token = process.env.GA4_ACCESS_TOKEN;

        if (!token) {
            throw new Error('GA4 access token not configured. Set GA4_ACCESS_TOKEN or implement service account auth.');
        }

        this.accessToken = token;
        // Tokens typically expire in 1 hour
        this.tokenExpiresAt = Date.now() + (3600 * 1000);

        return token;
    }

    /**
     * Run a report request
     */
    async runReport(request: GA4ReportRequest): Promise<{
        success: boolean;
        data?: GA4ReportResponse;
        error?: string;
    }> {
        try {
            const accessToken = await this.getAccessToken();

            const response = await fetch(
                `${GA4_ENDPOINTS.dataAPI}/properties/${this.propertyId}:runReport`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(request)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `Report request failed: ${response.status} ${errorText}`
                };
            }

            const reportData = await response.json();

            return {
                success: true,
                data: reportData
            };
        } catch (error) {
            console.error('Failed to run GA4 report:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Report request failed'
            };
        }
    }

    /**
     * Get user metrics for a date range
     */
    async getUserMetrics(startDate: string, endDate: string): Promise<{
        success: boolean;
        data?: {
            activeUsers: number;
            newUsers: number;
            totalUsers: number;
        };
        error?: string;
    }> {
        const request: GA4ReportRequest = {
            dateRanges: [{ startDate, endDate }],
            dimensions: [],
            metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'totalUsers' }
            ]
        };

        const result = await this.runReport(request);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error
            };
        }

        const row = result.data.rows[0];
        if (!row) {
            return {
                success: false,
                error: 'No data returned'
            };
        }

        return {
            success: true,
            data: {
                activeUsers: parseInt(row.metricValues[0].value),
                newUsers: parseInt(row.metricValues[1].value),
                totalUsers: parseInt(row.metricValues[2].value)
            }
        };
    }

    /**
     * Get event counts by event name
     */
    async getEventCounts(startDate: string, endDate: string, limit: number = 10): Promise<{
        success: boolean;
        data?: Array<{ eventName: string; count: number }>;
        error?: string;
    }> {
        const request: GA4ReportRequest = {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'eventName' }],
            metrics: [{ name: 'eventCount' }],
            limit
        };

        const result = await this.runReport(request);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error
            };
        }

        const events = result.data.rows.map(row => ({
            eventName: row.dimensionValues[0].value,
            count: parseInt(row.metricValues[0].value)
        }));

        return {
            success: true,
            data: events
        };
    }

    /**
     * Get page views by page path
     */
    async getPageViews(startDate: string, endDate: string, limit: number = 10): Promise<{
        success: boolean;
        data?: Array<{ pagePath: string; views: number }>;
        error?: string;
    }> {
        const request: GA4ReportRequest = {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            limit
        };

        const result = await this.runReport(request);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error
            };
        }

        const pages = result.data.rows.map(row => ({
            pagePath: row.dimensionValues[0].value,
            views: parseInt(row.metricValues[0].value)
        }));

        return {
            success: true,
            data: pages
        };
    }

    /**
     * Get engagement metrics
     */
    async getEngagementMetrics(startDate: string, endDate: string): Promise<{
        success: boolean;
        data?: {
            engagementRate: number;
            averageEngagementTime: number;
            engagedSessions: number;
        };
        error?: string;
    }> {
        const request: GA4ReportRequest = {
            dateRanges: [{ startDate, endDate }],
            dimensions: [],
            metrics: [
                { name: 'engagementRate' },
                { name: 'averageSessionDuration' },
                { name: 'engagedSessions' }
            ]
        };

        const result = await this.runReport(request);

        if (!result.success || !result.data) {
            return {
                success: false,
                error: result.error
            };
        }

        const row = result.data.rows[0];
        if (!row) {
            return {
                success: false,
                error: 'No data returned'
            };
        }

        return {
            success: true,
            data: {
                engagementRate: parseFloat(row.metricValues[0].value),
                averageEngagementTime: parseFloat(row.metricValues[1].value),
                engagedSessions: parseInt(row.metricValues[2].value)
            }
        };
    }
}
