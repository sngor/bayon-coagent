/**
 * Mailchimp Integration Module
 * 
 * Exports all Mailchimp integration functionality.
 */

export * from './types';
export * from './oauth-manager';
export * from './client';

export { mailchimpOAuthManager } from './oauth-manager';
export { createMailchimpClient, MailchimpClient } from './client';
