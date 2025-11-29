/**
 * Twilio SMS Client
 * 
 * Client for sending SMS messages via Twilio API.
 * Supports message sending, status checking, and webhook handling.
 */

import { IntegrationConnection } from '../types';
import {
    SMSMessage,
    SMSMessageRecord,
    SMSStatus,
    TwilioMetadata,
    TwilioPhoneNumber
} from './types';

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

/**
 * Twilio SMS Client
 */
export class TwilioClient {
    private connection: IntegrationConnection;
    private accountSid: string;
    private authToken: string;
    private defaultFrom?: string;

    constructor(connection: IntegrationConnection) {
        this.connection = connection;
        this.accountSid = connection.credentials.apiKey!;
        this.authToken = connection.credentials.apiSecret!;
        this.defaultFrom = connection.credentials.metadata?.phoneNumber;
    }

    /**
     * Make authenticated request to Twilio API
     */
    private async makeRequest<T>(
        endpoint: string,
        method: string = 'GET',
        body?: URLSearchParams
    ): Promise<T> {
        const url = `${TWILIO_API_BASE}${endpoint}`;

        const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

        const options: RequestInit = {
            method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        };

        if (body && method === 'POST') {
            options.body = body.toString();
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Twilio API error (${error.code || response.status}): ${error.message || response.statusText}`);
        }

        return await response.json();
    }

    // ==================== SMS Operations ====================

    /**
     * Send an SMS message
     */
    async sendSMS(message: SMSMessage): Promise<SMSMessageRecord> {
        // Use default from number if not specified
        const from = message.from || this.defaultFrom;

        if (!from) {
            throw new Error('No sender phone number specified');
        }

        const params = new URLSearchParams({
            To: message.to,
            From: from,
            Body: message.body
        });

        // Add media URLs if provided (for MMS)
        if (message.media && message.media.length > 0) {
            message.media.forEach((url, index) => {
                params.append('MediaUrl', url);
            });
        }

        // Add status callback if provided
        if (message.statusCallback) {
            params.append('StatusCallback', message.statusCallback);
        }

        return await this.makeRequest<SMSMessageRecord>(
            `/Accounts/${this.accountSid}/Messages.json`,
            'POST',
            params
        );
    }

    /**
     * Get message status
     */
    async getMessageStatus(messageSid: string): Promise<SMSMessageRecord> {
        return await this.makeRequest<SMSMessageRecord>(
            `/Accounts/${this.accountSid}/Messages/${messageSid}.json`
        );
    }

    /**
     * List sent messages
     */
    async listMessages(options?: {
        to?: string;
        from?: string;
        dateSent?: Date;
        pageSize?: number;
    }): Promise<{ messages: SMSMessageRecord[]; nextPageUri?: string }> {
        const params = new URLSearchParams();

        if (options?.to) params.append('To', options.to);
        if (options?.from) params.append('From', options.from);
        if (options?.dateSent) {
            params.append('DateSent', options.dateSent.toISOString().split('T')[0]);
        }
        if (options?.pageSize) params.append('PageSize', options.pageSize.toString());

        const query = params.toString() ? `?${params.toString()}` : '';
        const response = await this.makeRequest<any>(
            `/Accounts/${this.accountSid}/Messages.json${query}`
        );

        return {
            messages: response.messages || [],
            nextPageUri: response.next_page_uri
        };
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageSid: string): Promise<void> {
        await this.makeRequest<void>(
            `/Accounts/${this.accountSid}/Messages/${messageSid}.json`,
            'DELETE'
        );
    }

    // ==================== Phone Number Operations ====================

    /**
     * List available phone numbers
     */
    async listPhoneNumbers(): Promise<TwilioPhoneNumber[]> {
        const response = await this.makeRequest<any>(
            `/Accounts/${this.accountSid}/IncomingPhoneNumbers.json`
        );

        return response.incoming_phone_numbers || [];
    }

    /**
     * Get phone number details
     */
    async getPhoneNumber(phoneNumberSid: string): Promise<TwilioPhoneNumber> {
        return await this.makeRequest<TwilioPhoneNumber>(
            `/Accounts/${this.accountSid}/IncomingPhoneNumbers/${phoneNumberSid}.json`
        );
    }

    // ==================== Account Operations ====================

    /**
     * Get account information
     */
    async getAccountInfo(): Promise<any> {
        return await this.makeRequest<any>(
            `/Accounts/${this.accountSid}.json`
        );
    }

    /**
     * Get account usage (for billing/monitoring)
     */
    async getUsage(category: 'sms' | 'mms' | 'calls' = 'sms'): Promise<any> {
        return await this.makeRequest<any>(
            `/Accounts/${this.accountSid}/Usage/Records.json?Category=${category}`
        );
    }
}

/**
 * Create Twilio client from connection
 */
export function createTwilioClient(connection: IntegrationConnection): TwilioClient {
    return new TwilioClient(connection);
}
