/**
 * Twilio Credentials Manager
 * 
 * Manages Twilio API credentials (Account SID and Auth Token).
 * Handles validation and secure storage.
 */

import { IntegrationService } from '../integration-manager';
import { IntegrationProvider, IntegrationType, IntegrationConnection, IntegrationResult, IntegrationCredentials } from '../types';
import { integrationRepository } from '../integration-repository';
import { TwilioCredentials, TwilioMetadata, TwilioPhoneNumber } from './types';

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

/**
 * Twilio Credentials Manager
 */
export class TwilioCredentialsManager implements IntegrationService {
    provider: IntegrationProvider = 'twilio';
    type: IntegrationType = 'sms';

    /**
     * Connect to Twilio (configure credentials)
     */
    async connect(
        userId: string,
        config?: Record<string, any>
    ): Promise<IntegrationResult<string>> {
        try {
            if (!config || !config.accountSid || !config.authToken) {
                return {
                    success: false,
                    error: 'Account SID and Auth Token are required'
                };
            }

            const credentials: TwilioCredentials = {
                accountSid: config.accountSid,
                authToken: config.authToken,
                phoneNumber: config.phoneNumber
            };

            // Validate credentials by making a test API call
            const validationResult = await this.validateCredentials(credentials);

            if (!validationResult.success) {
                return {
                    success: false,
                    error: validationResult.error || 'Invalid credentials'
                };
            }

            // Get phone numbers for this account
            const phoneNumbers = await this.getPhoneNumbers(credentials);

            // Create connection metadata
            const metadata: TwilioMetadata = {
                accountSid: credentials.accountSid,
                phoneNumbers: phoneNumbers.map(pn => pn.phoneNumber),
                accountName: validationResult.data?.friendlyName
            };

            // Create integration connection
            const connection: IntegrationConnection = {
                id: `twilio#${Date.now()}`,
                userId,
                provider: 'twilio',
                type: 'sms',
                status: 'active',
                credentials: {
                    provider: 'twilio',
                    authMethod: 'api_key',
                    apiKey: credentials.accountSid,
                    apiSecret: credentials.authToken,
                    metadata: {
                        phoneNumber: credentials.phoneNumber || phoneNumbers[0]?.phoneNumber
                    }
                },
                metadata,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            // Save to database
            await integrationRepository.create(connection);

            return {
                success: true,
                data: 'Twilio connected successfully'
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to connect Twilio'
            };
        }
    }

    /**
     * Disconnect Twilio
     */
    async disconnect(userId: string): Promise<IntegrationResult<void>> {
        return {
            success: true
        };
    }

    /**
     * Validate Twilio connection
     */
    async validate(connection: IntegrationConnection): Promise<IntegrationResult<boolean>> {
        try {
            const credentials: TwilioCredentials = {
                accountSid: connection.credentials.apiKey!,
                authToken: connection.credentials.apiSecret!
            };

            const result = await this.validateCredentials(credentials);
            return {
                success: result.success,
                data: result.success,
                error: result.error
            };
        } catch (error) {
            return {
                success: false,
                data: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Validate Twilio credentials
     */
    private async validateCredentials(
        credentials: TwilioCredentials
    ): Promise<IntegrationResult<any>> {
        try {
            // Make a request to get account info
            const response = await fetch(
                `${TWILIO_API_BASE}/Accounts/${credentials.accountSid}.json`,
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(
                            `${credentials.accountSid}:${credentials.authToken}`
                        ).toString('base64')}`
                    }
                }
            );

            if (!response.ok) {
                const error = await response.json();
                return {
                    success: false,
                    error: error.message || 'Invalid credentials'
                };
            }

            const data = await response.json();
            return {
                success: true,
                data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Get available phone numbers for account
     */
    private async getPhoneNumbers(
        credentials: TwilioCredentials
    ): Promise<TwilioPhoneNumber[]> {
        try {
            const response = await fetch(
                `${TWILIO_API_BASE}/Accounts/${credentials.accountSid}/IncomingPhoneNumbers.json`,
                {
                    headers: {
                        'Authorization': `Basic ${Buffer.from(
                            `${credentials.accountSid}:${credentials.authToken}`
                        ).toString('base64')}`
                    }
                }
            );

            if (!response.ok) {
                console.error('Failed to fetch phone numbers');
                return [];
            }

            const data = await response.json();
            return data.incoming_phone_numbers || [];
        } catch (error) {
            console.error('Error fetching phone numbers:', error);
            return [];
        }
    }
}

// Export singleton instance
export const twilioCredentialsManager = new TwilioCredentialsManager();
