/**
 * Campaign Generator Examples
 * 
 * Demonstrates how to use the CampaignGenerator to create
 * and manage email drip campaigns.
 */

import { CampaignGenerator } from './campaign-generator';
import type {
    CampaignGenerationRequest,
    CampaignScheduleOptions,
} from './campaign-generator';

/**
 * Example 1: Generate a nurture campaign
 */
async function example1_GenerateNurtureCampaign() {
    console.log('\n=== Example 1: Generate Nurture Campaign ===\n');

    const generator = new CampaignGenerator({
        defaultDelayDays: 3,
        autoSchedule: false,
    });

    const request: CampaignGenerationRequest = {
        userId: 'user-123',
        campaignName: 'New Lead Nurture Campaign',
        template: 'nurture',
        targetAudience: 'first-time-buyers',
    };

    const result = await generator.generateCampaign(request);

    console.log('Campaign created:', result.campaign.name);
    console.log('Number of emails:', result.campaign.emails.length);
    console.log('Estimated duration:', result.estimatedDuration, 'days');
    console.log('\nEmail sequence:');
    result.preview.forEach((subject, i) => {
        console.log(`  ${i + 1}. ${subject}`);
    });
    console.log('\nRecommendations:');
    result.recommendations.forEach(rec => console.log(`  - ${rec}`));
}

/**
 * Example 2: Generate listing promotion campaign with custom content
 */
async function example2_ListingPromotionCampaign() {
    console.log('\n=== Example 2: Listing Promotion Campaign ===\n');

    const generator = new CampaignGenerator();

    const request: CampaignGenerationRequest = {
        userId: 'user-123',
        campaignName: '123 Main St Listing Campaign',
        template: 'listing-promotion',
        contentIds: [
            'content-listing-desc',
            'content-neighborhood',
            'content-open-house',
        ],
        customization: {
            delayDays: [0, 2, 3, 5, 7],
            subjectLines: [
                '🏡 New Listing: Stunning 4BR Home in Downtown',
                'Take a closer look at 123 Main St',
                'Discover the neighborhood',
                'Open House This Weekend!',
                'Price Reduced - Don\'t Miss Out!',
            ],
            tone: 'friendly',
            includeImages: true,
        },
    };

    const result = await generator.generateCampaign(request);

    console.log('Campaign:', result.campaign.name);
    console.log('Status:', result.campaign.status);
    console.log('Duration:', result.estimatedDuration, 'days');
    console.log('\nEmail details:');
    result.campaign.emails.forEach(email => {
        console.log(`\n  Email ${email.sequence}:`);
        console.log(`    Subject: ${email.subject}`);
        console.log(`    Delay: ${email.delayDays} days`);
        console.log(`    Status: ${email.status}`);
    });
}

/**
 * Example 3: Schedule a campaign
 */
async function example3_ScheduleCampaign() {
    console.log('\n=== Example 3: Schedule Campaign ===\n');

    const generator = new CampaignGenerator();

    // First, generate a campaign
    const request: CampaignGenerationRequest = {
        userId: 'user-123',
        campaignName: 'Market Update Series',
        template: 'market-update',
    };

    const result = await generator.generateCampaign(request);
    console.log('Campaign created:', result.campaign.id);

    // Schedule it to start next Monday at 9 AM
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7));
    nextMonday.setHours(9, 0, 0, 0);

    const scheduleOptions: CampaignScheduleOptions = {
        startDate: nextMonday,
        sendTime: { hour: 9, minute: 0 },
        timezone: 'America/New_York',
    };

    const scheduled = await generator.scheduleCampaign(
        'user-123',
        result.campaign.id,
        scheduleOptions
    );

    console.log('Campaign scheduled!');
    console.log('Start date:', scheduled.startDate);
    console.log('Status:', scheduled.status);
    console.log('\nEmail schedule:');
    scheduled.emails.forEach(email => {
        console.log(`  ${email.sequence}. ${email.subject} - Day ${email.delayDays}`);
    });
}

/**
 * Example 4: List and manage campaigns
 */
async function example4_ManageCampaigns() {
    console.log('\n=== Example 4: Manage Campaigns ===\n');

    const generator = new CampaignGenerator();
    const userId = 'user-123';

    // List all campaigns
    const allCampaigns = await generator.listCampaigns(userId);
    console.log('Total campaigns:', allCampaigns.length);

    // List only draft campaigns
    const draftCampaigns = await generator.listCampaigns(userId, 'draft');
    console.log('Draft campaigns:', draftCampaigns.length);

    // List scheduled campaigns
    const scheduledCampaigns = await generator.listCampaigns(userId, 'scheduled');
    console.log('Scheduled campaigns:', scheduledCampaigns.length);

    if (allCampaigns.length > 0) {
        const campaign = allCampaigns[0];
        console.log('\nFirst campaign:');
        console.log('  Name:', campaign.name);
        console.log('  Status:', campaign.status);
        console.log('  Emails:', campaign.emails.length);
        console.log('  Created:', new Date(campaign.createdAt).toLocaleDateString());
    }
}

/**
 * Example 5: Update campaign status
 */
async function example5_UpdateCampaignStatus() {
    console.log('\n=== Example 5: Update Campaign Status ===\n');

    const generator = new CampaignGenerator();

    // Generate a campaign
    const request: CampaignGenerationRequest = {
        userId: 'user-123',
        campaignName: 'Test Campaign',
        template: 'onboarding',
    };

    const result = await generator.generateCampaign(request);
    console.log('Campaign created:', result.campaign.id);
    console.log('Initial status:', result.campaign.status);

    // Activate the campaign
    const activated = await generator.updateCampaignStatus(
        'user-123',
        result.campaign.id,
        'active'
    );
    console.log('Updated status:', activated.status);

    // Later, mark as completed
    const completed = await generator.updateCampaignStatus(
        'user-123',
        result.campaign.id,
        'completed'
    );
    console.log('Final status:', completed.status);
    console.log('Completed at:', completed.completedAt);
}

/**
 * Example 6: Custom campaign with specific customization
 */
async function example6_CustomCampaign() {
    console.log('\n=== Example 6: Custom Campaign ===\n');

    const generator = new CampaignGenerator({
        defaultDelayDays: 2,
        maxCampaignLength: 8,
    });

    const request: CampaignGenerationRequest = {
        userId: 'user-123',
        campaignName: 'Luxury Property Showcase',
        template: 'custom',
        customization: {
            delayDays: [0, 1, 3, 5, 7],
            subjectLines: [
                'Exclusive: Luxury Estate Preview',
                'Virtual Tour: Experience Luxury Living',
                'The Neighborhood: Where Elegance Meets Convenience',
                'Investment Opportunity: Luxury Real Estate',
                'Final Invitation: Private Showing',
            ],
            callsToAction: [
                'Schedule Your Private Tour',
                'Watch the Virtual Tour',
                'Explore the Area',
                'Review Investment Details',
                'Book Your Showing',
            ],
            tone: 'professional',
            includeImages: true,
        },
    };

    const result = await generator.generateCampaign(request);

    console.log('Custom campaign created!');
    console.log('Name:', result.campaign.name);
    console.log('Emails:', result.campaign.emails.length);
    console.log('Duration:', result.estimatedDuration, 'days');
    console.log('\nSequence:');
    result.campaign.emails.forEach(email => {
        console.log(`  Day ${email.delayDays}: ${email.subject}`);
    });
}

/**
 * Example 7: Seasonal campaign
 */
async function example7_SeasonalCampaign() {
    console.log('\n=== Example 7: Seasonal Campaign ===\n');

    const generator = new CampaignGenerator();

    const request: CampaignGenerationRequest = {
        userId: 'user-123',
        campaignName: 'Spring Market Update 2024',
        template: 'seasonal',
        customization: {
            tone: 'friendly',
        },
    };

    const result = await generator.generateCampaign(request);

    console.log('Seasonal campaign:', result.campaign.name);
    console.log('Perfect for:', 'Spring market updates');
    console.log('\nEmail sequence:');
    result.preview.forEach((subject, i) => {
        const email = result.campaign.emails[i];
        console.log(`  ${i + 1}. ${subject} (Day ${email.delayDays})`);
    });
    console.log('\nRecommendations:');
    result.recommendations.forEach(rec => console.log(`  - ${rec}`));
}

/**
 * Example 8: Delete a campaign
 */
async function example8_DeleteCampaign() {
    console.log('\n=== Example 8: Delete Campaign ===\n');

    const generator = new CampaignGenerator();

    // Create a test campaign
    const request: CampaignGenerationRequest = {
        userId: 'user-123',
        campaignName: 'Test Campaign to Delete',
        template: 'nurture',
    };

    const result = await generator.generateCampaign(request);
    console.log('Campaign created:', result.campaign.id);

    // Delete it
    await generator.deleteCampaign('user-123', result.campaign.id);
    console.log('Campaign deleted successfully');

    // Verify it's gone
    const retrieved = await generator.getCampaign('user-123', result.campaign.id);
    console.log('Campaign exists after deletion:', retrieved !== null);
}

/**
 * Run all examples
 */
async function runAllExamples() {
    try {
        await example1_GenerateNurtureCampaign();
        await example2_ListingPromotionCampaign();
        await example3_ScheduleCampaign();
        await example4_ManageCampaigns();
        await example5_UpdateCampaignStatus();
        await example6_CustomCampaign();
        await example7_SeasonalCampaign();
        await example8_DeleteCampaign();

        console.log('\n=== All Examples Completed ===\n');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Export examples
export {
    example1_GenerateNurtureCampaign,
    example2_ListingPromotionCampaign,
    example3_ScheduleCampaign,
    example4_ManageCampaigns,
    example5_UpdateCampaignStatus,
    example6_CustomCampaign,
    example7_SeasonalCampaign,
    example8_DeleteCampaign,
    runAllExamples,
};

// Run if executed directly
if (require.main === module) {
    runAllExamples();
}
