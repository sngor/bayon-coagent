/**
 * Twilio Integration Types
 * 
 * Type definitions for Twilio SMS API integration.
 */

import { z } from 'zod';

/**
 * Twilio Credentials
 */
export interface TwilioCredentials {
    accountSid: string;
    authToken: string;
    phoneNumber?: string;  // Default phone number for sending
}

/**
 * Twilio Connection Metadata
 */
export interface TwilioMetadata {
    accountSid: string;
    phoneNumbers: string[];  // Available Twilio phone numbers
    accountName?: string;
    accountType?: string;
}

/**
 * SMS Message
 */
export interface SMSMessage {
    to: string;                 // Recipient phone number (E.164 format)
    from?: string;              // Sender phone number (defaults to account phone)
    body: string;               // Message content (up to 1600 chars)
    media?: string[];           // MMS media URLs (optional)
    statusCallback?: string;    // Webhook URL for status updates
}

/**
 * SMS Delivery Status
 */
export type SMSStatus =
    | 'queued'          // Message queued for sending
    | 'sending'         // Currently being sent
    | 'sent'            // Successfully sent to carrier
    | 'delivered'       // Delivered to recipient
    | 'undelivered'     // Failed to deliver
    | 'failed'          // Failed to send
    | 'receiving'       // Receiving (for inbound)
    | 'received';       // Received (for inbound)

/**
 * SMS Message Record
 */
export interface SMSMessageRecord {
    sid: string;                // Twilio message SID
    accountSid: string;
    from: string;
    to: string;
    body: string;
    status: SMSStatus;
    direction: 'inbound' | 'outbound-api' | 'outbound-call' | 'outbound-reply';
    price?: string;
    priceUnit?: string;
    apiVersion: string;
    uri: string;
    dateCreated: string;
    dateUpdated: string;
    dateSent?: string;
    errorCode?: string;
    errorMessage?: string;
    numSegments: string;
    numMedia: string;
}

/**
 * Twilio Webhook Event
 */
export interface TwilioWebhookEvent {
    MessageSid: string;
    SmsSid: string;
    AccountSid: string;
    MessagingServiceSid?: string;
    From: string;
    To: string;
    Body: string;
    NumMedia: string;
    NumSegments: string;
    MessageStatus: SMSStatus;
    ErrorCode?: string;
    ErrorMessage?: string;
    ApiVersion: string;
}

/**
 * Twilio Phone Number
 */
export interface TwilioPhoneNumber {
    sid: string;
    accountSid: string;
    friendlyName: string;
    phoneNumber: string;
    lata?: string;
    locality?: string;
    rateCenter?: string;
    latitude?: string;
    longitude?: string;
    region?: string;
    postalCode?: string;
    isoCountry?: string;
    addressRequirements?: string;
    beta?: boolean;
    capabilities: {
        voice: boolean;
        sms: boolean;
        mms: boolean;
        fax: boolean;
    };
    dateCreated: string;
    dateUpdated: string;
    uri: string;
}

/**
 * Twilio API Response
 */
export interface TwilioAPIResponse<T> {
    data?: T;
    page?: number;
    page_size?: number;
    first_page_uri?: string;
    next_page_uri?: string;
    previous_page_uri?: string;
    uri?: string;
}

// Zod Schemas

export const TwilioCredentialsSchema = z.object({
    accountSid: z.string().startsWith('AC'),
    authToken: z.string(),
    phoneNumber: z.string().optional()
});

export const SMSMessageSchema = z.object({
    to: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format'),
    from: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 format').optional(),
    body: z.string().max(1600),
    media: z.array(z.string().url()).optional(),
    statusCallback: z.string().url().optional()
});

export const SMSStatusSchema = z.enum([
    'queued',
    'sending',
    'sent',
    'delivered',
    'undelivered',
    'failed',
    'receiving',
    'received'
]);

export const TwilioWebhookEventSchema = z.object({
    MessageSid: z.string(),
    SmsSid: z.string(),
    AccountSid: z.string(),
    From: z.string(),
    To: z.string(),
    Body: z.string(),
    NumMedia: z.string(),
    NumSegments: z.string(),
    MessageStatus: SMSStatusSchema
});
