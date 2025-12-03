/**
 * CRM Connector Usage Examples
 * 
 * Demonstrates how to use the CRM connector for client data retrieval,
 * content personalization, and activity syncing.
 */

import { CRMConnector } from './crm-connector';
import type { ActivityRecord, ClientData } from './types';

/**
 * Example 1: Get client data from CRM
 */
async function example1_getClientData() {
    console.log('\n=== Example 1: Get Client Data ===\n');

    const connector = new CRMConnector({
        defaultProvider: 'hubspot',
        cacheTTL: 300, // 5 minutes
    });

    try {
        const clientData = await connector.getClientData(
            'contact-123', // CRM contact ID
            'user-456'     // User ID
        );

        console.log('Client Data:', {
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone,
            tags: clientData.tags,
            historyCount: clientData.history?.length || 0,
        });
    } catch (error) {
        console.error('Failed to get client data:', error);
    }
}

/**
 * Example 2: Personalize content with client data
 */
async function example2_personalizeContent() {
    console.log('\n=== Example 2: Personalize Content ===\n');

    const connector = new CRMConnector();

    // Sample client data
    const clientData: ClientData = {
        id: 'contact-123',
        name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '555-0123',
        preferences: {
            communicationStyle: 'formal',
            propertyTypes: ['single-family', 'condo'],
        },
        tags: ['first-time-buyer', 'pre-approved'],
        customFields: {
            budget: '500000',
            location: 'Downtown',
        } as Record<string, any>,
    };

    // Generic email template
    const template = `
Hi {{firstName}},

Thanks for your interest in properties in {{location}}!

Based on your budget of ${{budget}}, I've found some great options 
that match your criteria for {{propertyTypes}}.

Let me know if you'd like to schedule a viewing!

Best regards,
Your Real Estate Agent
    `.trim();

    try {
        const personalized = await connector.personalizeContent(template, {
            clientData,
            contentType: 'email',
            variables: {
                propertyTypes: clientData.preferences?.propertyTypes?.join(' and ') || 'homes',
            },
        });

        console.log('Original Template:');
        console.log(template);
        console.log('\nPersonalized Content:');
        console.log(personalized.content);
        console.log('\nVariables Used:');
        console.log(personalized.variables);
    } catch (error) {
        console.error('Failed to personalize content:', error);
    }
}

/**
 * Example 3: Sync activity to CRM
 */
async function example3_syncActivity() {
    console.log('\n=== Example 3: Sync Activity ===\n');

    const connector = new CRMConnector({
        autoSync: true,
        maxRetries: 3,
    });

    const activity: ActivityRecord = {
        userId: 'user-456',
        clientId: 'contact-123',
        type: 'email_sent',
        description: 'Sent property listing email',
        timestamp: new Date().toISOString(),
        metadata: {
            email: 'john.smith@example.com',
            subject: 'New Listings in Your Area',
            listingIds: ['listing-1', 'listing-2'],
        },
    };

    try {
        const success = await connector.syncActivity(activity);

        if (success) {
            console.log('✓ Activity synced to CRM successfully');
        } else {
            console.log('⚠ Activity stored locally for later sync');
        }
    } catch (error) {
        console.error('Failed to sync activity:', error);
    }
}

/**
 * Example 4: Batch sync multiple activities
 */
async function example4_batchSync() {
    console.log('\n=== Example 4: Batch Sync Activities ===\n');

    const connector = new CRMConnector();

    const activities: ActivityRecord[] = [
        {
            userId: 'user-456',
            clientId: 'contact-123',
            type: 'property_view',
            description: 'Viewed property listing',
            timestamp: new Date().toISOString(),
            metadata: {
                listingId: 'listing-1',
                duration: 120, // seconds
            },
        },
        {
            userId: 'user-456',
            clientId: 'contact-123',
            type: 'email_opened',
            description: 'Opened marketing email',
            timestamp: new Date().toISOString(),
            metadata: {
                campaignId: 'campaign-1',
                emailId: 'email-1',
            },
        },
        {
            userId: 'user-456',
            clientId: 'contact-123',
            type: 'call',
            description: 'Phone consultation',
            timestamp: new Date().toISOString(),
            metadata: {
                duration: 900, // 15 minutes
                outcome: 'scheduled_showing',
            },
        },
    ];

    try {
        const results = await connector.batchSyncActivities(activities);

        const successCount = results.filter(r => r).length;
        console.log(`✓ Synced ${successCount}/${activities.length} activities`);

        results.forEach((success, index) => {
            const status = success ? '✓' : '✗';
            console.log(`  ${status} ${activities[index].type}`);
        });
    } catch (error) {
        console.error('Failed to batch sync activities:', error);
    }
}

/**
 * Example 5: Personalize social media post
 */
async function example5_personalizeSocialPost() {
    console.log('\n=== Example 5: Personalize Social Media Post ===\n');

    const connector = new CRMConnector();

    const clientData: ClientData = {
        id: 'contact-789',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        preferences: {
            communicationStyle: 'casual',
        },
        customFields: {
            favoriteNeighborhood: 'Riverside',
        },
    };

    const postTemplate = `
🏡 Hey {{firstName}}! 

Just listed: Beautiful home in {{favoriteNeighborhood}}! 

This one has everything on your wishlist. Want to see it this weekend?

DM me for details! 📱
    `.trim();

    try {
        const personalized = await connector.personalizeContent(postTemplate, {
            clientData,
            contentType: 'social-media',
        });

        console.log('Personalized Post:');
        console.log(personalized.content);
    } catch (error) {
        console.error('Failed to personalize post:', error);
    }
}

/**
 * Example 6: Cache management
 */
async function example6_cacheManagement() {
    console.log('\n=== Example 6: Cache Management ===\n');

    const connector = new CRMConnector({
        cacheTTL: 60, // 1 minute for demo
    });

    // First call - fetches from CRM
    console.log('First call (from CRM)...');
    await connector.getClientData('contact-123', 'user-456');

    // Second call - uses cache
    console.log('Second call (from cache)...');
    await connector.getClientData('contact-123', 'user-456');

    // Check cache stats
    const stats = connector.getCacheStats();
    console.log('\nCache Stats:', stats);

    // Clear cache
    connector.clearCache();
    console.log('Cache cleared');

    // Third call - fetches from CRM again
    console.log('Third call (from CRM after clear)...');
    await connector.getClientData('contact-123', 'user-456');
}

/**
 * Example 7: Multi-variable personalization
 */
async function example7_complexPersonalization() {
    console.log('\n=== Example 7: Complex Personalization ===\n');

    const connector = new CRMConnector();

    const clientData: ClientData = {
        id: 'contact-999',
        name: 'Michael Chen',
        email: 'michael.chen@example.com',
        phone: '555-9876',
        customFields: {
            budget: '750000',
            bedrooms: '3',
            bathrooms: '2',
            location: 'Westside',
            moveInDate: '2024-06-01',
        } as Record<string, any>,
    };

    const emailTemplate = `
Dear {{firstName}},

I hope this email finds you well!

I wanted to reach out because I've found several properties that match 
your search criteria:

• Location: {{location}}
• Budget: ${{budget}}
• Bedrooms: {{bedrooms}}
• Bathrooms: {{bathrooms}}
• Move-in Date: {{moveInDate}}

I've attached details of 5 properties that I think you'll love. Each one 
offers great value and is located in your preferred {{location}} area.

Would you be available for a showing this week? I can arrange viewings 
at your convenience.

Looking forward to hearing from you!

Best regards,
Your Real Estate Agent
{{phone}}
    `.trim();

    try {
        const personalized = await connector.personalizeContent(emailTemplate, {
            clientData,
            contentType: 'email',
        });

        console.log('Personalized Email:');
        console.log(personalized.content);
    } catch (error) {
        console.error('Failed to personalize email:', error);
    }
}

/**
 * Run all examples
 */
async function runAllExamples() {
    console.log('='.repeat(60));
    console.log('CRM Connector Examples');
    console.log('='.repeat(60));

    await example1_getClientData();
    await example2_personalizeContent();
    await example3_syncActivity();
    await example4_batchSync();
    await example5_personalizeSocialPost();
    await example6_cacheManagement();
    await example7_complexPersonalization();

    console.log('\n' + '='.repeat(60));
    console.log('All examples completed!');
    console.log('='.repeat(60));
}

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples().catch(console.error);
}

export {
    example1_getClientData,
    example2_personalizeContent,
    example3_syncActivity,
    example4_batchSync,
    example5_personalizeSocialPost,
    example6_cacheManagement,
    example7_complexPersonalization,
};
