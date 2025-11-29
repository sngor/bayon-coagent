/**
 * GA4 Measurement Protocol Client
 * 
 * Sends events to Google Analytics 4 using the Measurement Protocol.
 * Used for server-side event tracking.
 */

import { GA4Event, MeasurementPayload, GA4Config } from './types';
import { GA4_ENDPOINTS, GA4_CONFIG } from './constants';

/**
 * Measurement Protocol Client
 */
export class MeasurementClient {
    private config: GA4Config;
    private isDebugMode: boolean = process.env.NODE_ENV === 'development';

    constructor(config: GA4Config) {
        this.config = config;
    }

    /**
     * Send single event to GA4
     */
    async sendEvent(
        clientId: string,
        event: GA4Event,
        userId?: string
    ): Promise<{ success: boolean; error?: string; validationMessages?: any[] }> {
        return this.sendEvents(clientId, [event], userId);
    }

    /**
     * Send multiple events to GA4 (batch)
     */
    async sendEvents(
        clientId: string,
        events: GA4Event[],
        userId?: string,
        userProperties?: Record<string, any>
    ): Promise<{ success: boolean; error?: string; validationMessages?: any[] }> {
        try {
            // Validate batch size
            if (events.length > GA4_CONFIG.maxEventsPerRequest) {
                return {
                    success: false,
                    error: `Maximum ${GA4_CONFIG.maxEventsPerRequest} events per request`
                };
            }

            // Build payload
            const payload: MeasurementPayload = {
                client_id: clientId,
                user_id: userId,
                events
            };

            // Add user properties if provided
            if (userProperties) {
                payload.user_properties = {};
                for (const [key, value] of Object.entries(userProperties)) {
                    payload.user_properties[key] = { value };
                }
            }

            // Choose endpoint (debug or production)
            const endpoint = this.isDebugMode
                ? GA4_ENDPOINTS.measurementDebug
                : GA4_ENDPOINTS.measurement;

            // Build URL with query parameters
            const url = new URL(endpoint);
            url.searchParams.append('measurement_id', this.config.measurementId);
            url.searchParams.append('api_secret', this.config.apiSecret);

            // Send request
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(GA4_CONFIG.requestTimeout)
            });

            // Handle response
            if (!response.ok) {
                const errorText = await response.text();
                return {
                    success: false,
                    error: `GA4 request failed: ${response.status} ${errorText}`
                };
            }

            // In debug mode, return validation messages
            if (this.isDebugMode) {
                const debugResponse = await response.json();
                return {
                    success: true,
                    validationMessages: debugResponse.validationMessages || []
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to send GA4 events:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Event sending failed'
            };
        }
    }

    /**
     * Generate client ID (should be stored per user/device)
     */
    static generateClientId(): string {
        return `${Date.now()}.${Math.random().toString(36).substring(2, 15)}`;
    }

    /**
     * Set debug mode
     */
    setDebugMode(enabled: boolean): void {
        this.isDebugMode = enabled;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<GA4Config>): void {
        this.config = { ...this.config, ...config };
    }
}
