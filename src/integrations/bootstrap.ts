/**
 * Integration Service Bootstrap
 * 
 * Registers all integration services with the integration manager.
 * This file should be imported early in the application lifecycle.
 */

import { integrationManager } from './integration-manager';
import { mailchimpOAuthManager } from './mailchimp';
import { twilioCredentialsManager } from './twilio';
import { zapierManager } from './zapier';
import { ga4Manager } from './analytics/ga4';

/**
 * Register all integration services
 */
export function registerIntegrationServices(): void {
    // Register Mailchimp
    integrationManager.registerService(mailchimpOAuthManager);

    // Register Twilio
    integrationManager.registerService(twilioCredentialsManager);

    // Register Zapier
    integrationManager.registerService(zapierManager);

    // Register Google Analytics 4
    integrationManager.registerService(ga4Manager);

    console.log('Integration services registered:', integrationManager.listAvailableProviders());
}

// Auto-register on import (can be called manually if needed)
registerIntegrationServices();
