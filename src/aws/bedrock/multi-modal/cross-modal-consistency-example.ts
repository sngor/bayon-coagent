/**
 * Cross-Modal Consistency Checker - Usage Examples
 * 
 * This file demonstrates how to use the CrossModalConsistencyChecker to validate
 * consistency across different media types for real estate content.
 */

import {
    getCrossModalConsistencyChecker,
    type ContentItem,
    type ConsistencyCheckInput,
} from './cross-modal-consistency-checker';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Example 1: Basic consistency check across text and video content
 */
export async function exampleBasicConsistencyCheck() {
    const checker = getCrossModalConsistencyChecker();

    // Define content items for the same property listing
    const contentItems: ContentItem[] = [
        {
            type: 'text',
            id: 'blog-post-001',
            content: `Discover Your Dream Home in Riverside Estates

This stunning 4-bedroom, 3-bathroom home offers the perfect blend of modern luxury and family-friendly living. Located in the prestigious Riverside Estates community, this property features an open-concept design, gourmet kitchen with granite countertops, and a spacious master suite with walk-in closet.

The backyard oasis includes a heated pool, outdoor kitchen, and mature landscaping—perfect for entertaining or relaxing with family. With top-rated schools nearby and easy access to shopping and dining, this home offers the lifestyle you've been dreaming of.

Don't miss this opportunity to own a piece of paradise. Schedule your private showing today!`,
            metadata: {
                title: 'Discover Your Dream Home in Riverside Estates',
                keywords: ['luxury home', 'family-friendly', 'riverside estates', 'pool', 'modern'],
                tone: 'professional and inviting',
            },
        },
        {
            type: 'video',
            id: 'video-tour-001',
            content: `[VIDEO SCRIPT]

HOOK (3 seconds):
"Looking for the perfect family home? Wait until you see this!"

INTRO (10 seconds):
"Welcome to 123 Riverside Drive, a stunning 4-bedroom home in the heart of Riverside Estates. I'm Sarah Johnson, and I'm excited to show you why this property is truly special."

MAIN TOUR (90 seconds):
"As we enter, you'll immediately notice the open-concept design that's perfect for modern family living. The gourmet kitchen features beautiful granite countertops and stainless steel appliances—ideal for the home chef.

The master suite is a true retreat with its spacious walk-in closet and spa-like bathroom. Three additional bedrooms provide plenty of space for family or guests.

But the real showstopper? This incredible backyard. The heated pool, outdoor kitchen, and mature landscaping create your own private oasis. Imagine summer evenings entertaining friends or quiet mornings with your coffee by the pool."

CLOSING (15 seconds):
"With top-rated schools, shopping, and dining nearby, this home offers everything you need. Ready to make it yours? Contact me today to schedule your private showing. I'm Sarah Johnson, and I can't wait to help you find your dream home."

CALL-TO-ACTION:
"Call or text me at 555-0123 or visit my website to schedule your tour today!"`,
            metadata: {
                title: 'Virtual Tour: 123 Riverside Drive',
                duration: 120,
                platform: 'youtube',
                keywords: ['property tour', 'riverside estates', 'family home'],
                tone: 'enthusiastic and professional',
            },
        },
        {
            type: 'audio',
            id: 'podcast-segment-001',
            content: `[PODCAST SCRIPT]

INTRO:
"Today on Real Estate Insights, we're featuring an exceptional property that perfectly embodies what buyers are looking for in today's market—a home that combines luxury with livability."

MAIN CONTENT:
"Let me tell you about 123 Riverside Drive in Riverside Estates. This 4-bedroom, 3-bathroom home is what I call a 'forever home'—the kind of place where families put down roots and create lasting memories.

What makes this property special? It's the thoughtful design. The open-concept layout means parents can cook dinner while helping kids with homework. The gourmet kitchen isn't just beautiful—it's functional, with granite countertops and plenty of storage.

But here's what really sets this home apart: the outdoor living space. We're talking about a heated pool, an outdoor kitchen, and landscaping that creates a true backyard retreat. In today's market, outdoor space is more valuable than ever, and this property delivers.

The location is equally impressive. Top-rated schools, convenient shopping, and easy commutes—all the boxes are checked."

CLOSING:
"If you're looking for a home that offers both luxury and practicality, this Riverside Estates property deserves your attention. It's the kind of home that doesn't stay on the market long."`,
            metadata: {
                title: 'Featured Property: Riverside Estates Gem',
                duration: 180,
                tone: 'conversational and authoritative',
            },
        },
    ];

    // Perform consistency check
    const result = await checker.validateConsistency({
        contentItems,
        topic: '123 Riverside Drive Property Listing',
        minimumThreshold: 0.8,
    });

    console.log('Consistency Check Results:');
    console.log(`Overall Score: ${result.overallScore}`);
    console.log(`Passed: ${result.passed}`);
    console.log(`\nCore Message: ${result.messageAlignment.coreMessage}`);
    console.log(`\nIssues Found: ${result.issues.length}`);

    if (result.issues.length > 0) {
        console.log('\nConsistency Issues:');
        result.issues.forEach((issue, i) => {
            console.log(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
            console.log(`   ${issue.description}`);
            console.log(`   Recommendation: ${issue.recommendation}`);
        });
    }

    console.log(`\nSummary: ${result.summary}`);

    return result;
}

/**
 * Example 2: Consistency check with brand guidelines
 */
export async function exampleBrandGuidelinesCheck() {
    const checker = getCrossModalConsistencyChecker();

    const agentProfile: AgentProfile = {
        id: 'agent-001',
        userId: 'user-001',
        agentName: 'Sarah Johnson',
        primaryMarket: 'Riverside County',
        specialization: 'luxury-residential',
        preferredTone: 'professional',
        corePrinciple: 'Providing personalized service and expert market knowledge',
        contactInfo: {
            phone: '555-0123',
            email: 'sarah@example.com',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const contentItems: ContentItem[] = [
        {
            type: 'text',
            id: 'social-post-001',
            content: 'Just listed! 🏡 Stunning luxury home in Riverside Estates. 4BR/3BA with pool and gourmet kitchen. DM for details! #LuxuryRealEstate #RiversideHomes',
            metadata: {
                platform: 'instagram',
                tone: 'casual and engaging',
            },
        },
        {
            type: 'text',
            id: 'email-campaign-001',
            content: `Dear Valued Client,

I am pleased to present an exceptional opportunity in Riverside Estates. This meticulously maintained 4-bedroom, 3-bathroom residence exemplifies luxury living at its finest.

The property features:
- Gourmet kitchen with premium appliances
- Resort-style pool and outdoor entertainment area
- Prime location near top-rated schools
- Impeccable attention to detail throughout

As your trusted real estate advisor, I invite you to schedule a private showing to experience this remarkable property firsthand.

Best regards,
Sarah Johnson
Luxury Real Estate Specialist`,
            metadata: {
                platform: 'email',
                tone: 'formal and professional',
            },
        },
    ];

    const result = await checker.validateConsistency({
        contentItems,
        topic: 'Riverside Estates Luxury Home',
        agentProfile,
        brandGuidelines: {
            tone: ['professional', 'trustworthy', 'knowledgeable'],
            values: ['integrity', 'expertise', 'personalized service'],
            keywords: ['luxury', 'exceptional', 'premium', 'exclusive'],
            avoidWords: ['cheap', 'deal', 'bargain'],
        },
        minimumThreshold: 0.75,
    });

    console.log('\nBrand Guidelines Consistency Check:');
    console.log(`Tone Consistency: ${result.brandingConsistency.toneConsistency}`);
    console.log(`Style Consistency: ${result.brandingConsistency.styleConsistency}`);
    console.log(`Values Alignment: ${result.brandingConsistency.valuesAlignment}`);

    return result;
}

/**
 * Example 3: Message alignment check
 */
export async function exampleMessageAlignmentCheck() {
    const checker = getCrossModalConsistencyChecker();

    const contentItems: ContentItem[] = [
        {
            type: 'text',
            id: 'listing-description',
            content: 'Affordable starter home perfect for first-time buyers. Needs some TLC but has great potential. Priced to sell quickly!',
        },
        {
            type: 'video',
            id: 'video-tour',
            content: 'Welcome to this luxurious estate featuring high-end finishes and premium amenities throughout. This is truly a once-in-a-lifetime opportunity for discerning buyers.',
        },
    ];

    const result = await checker.checkMessageAlignment(
        contentItems,
        'Property Listing - 456 Oak Street'
    );

    console.log('\nMessage Alignment Analysis:');
    console.log(`Core Message: ${result.coreMessage}`);
    console.log(`Consistency Score: ${result.consistencyScore}`);
    console.log(`Divergent Messages: ${result.divergentMessages.join(', ')}`);

    return result;
}

/**
 * Example 4: Core message validation
 */
export async function exampleCoreMessageValidation() {
    const checker = getCrossModalConsistencyChecker();

    const expectedMessage = 'This property offers exceptional value for families seeking a move-in ready home in a top-rated school district';

    const contentItems: ContentItem[] = [
        {
            type: 'text',
            id: 'blog-post',
            content: 'Perfect for families! This move-in ready home is located in the highly sought-after Lincoln School District. With 4 bedrooms and a spacious backyard, it offers incredible value for growing families.',
        },
        {
            type: 'video',
            id: 'video-script',
            content: 'If you have kids, you need to see this home. Located in the top-rated Lincoln School District, this property is completely move-in ready and offers amazing value for families.',
        },
        {
            type: 'audio',
            id: 'podcast-segment',
            content: 'Today we are featuring a family-friendly home in the Lincoln School District. This move-in ready property represents excellent value for buyers with children.',
        },
    ];

    const isPreserved = await checker.validateCoreMessage(
        contentItems,
        expectedMessage
    );

    console.log('\nCore Message Validation:');
    console.log(`Expected Message: "${expectedMessage}"`);
    console.log(`Core Message Preserved: ${isPreserved ? 'YES' : 'NO'}`);

    return isPreserved;
}

/**
 * Example 5: Compare two content items
 */
export async function exampleCompareContent() {
    const checker = getCrossModalConsistencyChecker();

    const textContent: ContentItem = {
        type: 'text',
        id: 'website-listing',
        content: 'Charming 3-bedroom cottage with original hardwood floors and vintage fixtures. Perfect for buyers who appreciate character and history. Some updates needed.',
        metadata: {
            tone: 'nostalgic and honest',
        },
    };

    const videoContent: ContentItem = {
        type: 'video',
        id: 'property-video',
        content: 'This completely renovated modern home features brand new everything! State-of-the-art kitchen, contemporary bathrooms, and sleek finishes throughout. Move-in ready!',
        metadata: {
            tone: 'excited and promotional',
        },
    };

    const issues = await checker.compareContent(
        textContent,
        videoContent,
        'Property at 789 Maple Avenue'
    );

    console.log('\nContent Comparison Results:');
    console.log(`Issues Found: ${issues.length}`);

    issues.forEach((issue, i) => {
        console.log(`\n${i + 1}. ${issue.type} (${issue.severity})`);
        console.log(`   ${issue.description}`);
        console.log(`   Recommendation: ${issue.recommendation}`);
    });

    return issues;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('=== Cross-Modal Consistency Checker Examples ===\n');

    try {
        console.log('Example 1: Basic Consistency Check');
        await exampleBasicConsistencyCheck();

        console.log('\n\n' + '='.repeat(50) + '\n');

        console.log('Example 2: Brand Guidelines Check');
        await exampleBrandGuidelinesCheck();

        console.log('\n\n' + '='.repeat(50) + '\n');

        console.log('Example 3: Message Alignment Check');
        await exampleMessageAlignmentCheck();

        console.log('\n\n' + '='.repeat(50) + '\n');

        console.log('Example 4: Core Message Validation');
        await exampleCoreMessageValidation();

        console.log('\n\n' + '='.repeat(50) + '\n');

        console.log('Example 5: Compare Content');
        await exampleCompareContent();

    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Uncomment to run examples
// runAllExamples();
