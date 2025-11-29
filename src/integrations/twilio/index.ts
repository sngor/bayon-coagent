/**
 * Twilio Integration Module
 * 
 * Exports all Twilio SMS integration functionality.
 */

export * from './types';
export * from './credentials-manager';
export * from './client';
export * from './webhook-handler';

export { twilioCredentialsManager } from './credentials-manager';
export { createTwilioClient, TwilioClient } from './client';
export {
    validateTwilioSignature,
    parseTwilioWebhook,
    handleStatusCallback,
    createTwiMLResponse
} from './webhook-handler';
