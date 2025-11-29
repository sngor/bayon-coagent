/**
 * GA4 Event Definitions
 * 
 * Pre-configured event builders for common real estate CRM actions
 */

import { GA4Event, GA4EventParams } from './types';
import { GA4_CUSTOM_EVENTS, GA4_STANDARD_EVENTS } from './constants';

/**
 * Event Builder Class
 */
export class GA4EventBuilder {
    /**
     * Create custom event
     */
    static createEvent(name: string, params: GA4EventParams): GA4Event {
        return {
            name: name as any,
            params
        };
    }

    /**
     * Page view event
     */
    static pageView(pageLocation: string, pageTitle: string, additionalParams?: GA4EventParams): GA4Event {
        return {
            name: 'page_view',
            params: {
                page_location: pageLocation,
                page_title: pageTitle,
                ...additionalParams
            }
        };
    }

    /**
     * User signup event
     */
    static signUp(method: string, userId?: string): GA4Event {
        return {
            name: 'sign_up',
            params: {
                method,
                user_id: userId
            }
        };
    }

    /**
     * User login event
     */
    static login(method: string, userId?: string): GA4Event {
        return {
            name: 'login',
            params: {
                method,
                user_id: userId
            }
        };
    }

    /**
     * Client created event
     */
    static clientCreated(clientId: string, clientType: string, userId: string): GA4Event {
        return {
            name: 'client_created',
            params: {
                content_id: clientId,
                content_type: 'client',
                user_id: userId,
                client_type: clientType
            }
        };
    }

    /**
     * Property listed event
     */
    static propertyListed(propertyId: string, propertyType: string, price: number, userId: string): GA4Event {
        return {
            name: 'property_listed',
            params: {
                item_id: propertyId,
                property_type: propertyType,
                value: price,
                currency: 'USD',
                user_id: userId
            }
        };
    }

    /**
     * Lead captured event
     */
    static leadCaptured(leadSource: string, leadId: string, userId: string): GA4Event {
        return {
            name: 'lead_captured',
            params: {
                lead_source: leadSource,
                content_id: leadId,
                user_id: userId
            }
        };
    }

    /**
     * Content generated event (AI-generated content)
     */
    static contentGenerated(
        contentType: string,
        contentId: string,
        platform?: string,
        userId?: string
    ): GA4Event {
        return {
            name: 'content_generated',
            params: {
                content_type: contentType,
                content_id: contentId,
                platform,
                user_id: userId
            }
        };
    }

    /**
     * Social post published event
     */
    static socialPostPublished(
        platform: string,
        postId: string,
        contentType: string,
        userId: string
    ): GA4Event {
        return {
            name: 'social_post_published',
            params: {
                platform,
                content_id: postId,
                content_type: contentType,
                user_id: userId
            }
        };
    }

    /**
     * Integration connected event
     */
    static integrationConnected(integrationName: string, userId: string): GA4Event {
        return {
            name: 'integration_connected',
            params: {
                integration_name: integrationName,
                user_id: userId
            }
        };
    }

    /**
     * Zap triggered event
     */
    static zapTriggered(zapName: string, triggerType: string, userId: string): GA4Event {
        return {
            name: 'zap_triggered',
            params: {
                zap_name: zapName,
                trigger_type: triggerType,
                user_id: userId,
                integration_name: 'zapier'
            }
        };
    }

    /**
     * Design exported event (Canva)
     */
    static designExported(designId: string, format: string, userId: string): GA4Event {
        return {
            name: 'design_exported',
            params: {
                design_id: designId,
                export_format: format,
                user_id: userId,
                integration_name: 'canva'
            }
        };
    }

    /**
     * Deal closed event
     */
    static dealClosed(dealValue: number, propertyType: string, userId: string): GA4Event {
        return {
            name: 'deal_closed',
            params: {
                value: dealValue,
                currency: 'USD',
                property_type: propertyType,
                user_id: userId
            }
        };
    }

    /**
     * Search event
     */
    static search(searchTerm: string, searchCategory?: string, userId?: string): GA4Event {
        return {
            name: 'search',
            params: {
                search_term: searchTerm,
                search_category: searchCategory,
                user_id: userId
            }
        };
    }

    /**
     * Generate lead event (standard GA4)
     */
    static generateLead(value?: number, currency: string = 'USD', leadSource?: string): GA4Event {
        return {
            name: 'generate_lead',
            params: {
                value,
                currency,
                lead_source: leadSource
            }
        };
    }

    /**
     * Feedback submitted event
     */
    static feedbackSubmitted(feedbackCategory: string, userId: string): GA4Event {
        return {
            name: 'feedback_submitted',
            params: {
                feedback_category: feedbackCategory,
                user_id: userId
            }
        };
    }

    /**
     * Open house scheduled event
     */
    static openHouseScheduled(propertyId: string, date: Date, userId: string): GA4Event {
        return {
            name: 'openhouse_scheduled',
            params: {
                property_id: propertyId,
                event_date: date.toISOString(),
                user_id: userId
            }
        };
    }
}
