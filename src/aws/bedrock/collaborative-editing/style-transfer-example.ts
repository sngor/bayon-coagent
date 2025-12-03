/**
 * Style Transfer Engine Usage Examples
 * 
 * Demonstrates how to use the style transfer engine for content adaptation
 */

import { createStyleTransferEngine } from './style-transfer';

/**
 * Example 1: Adapt tone from professional to casual
 */
async function exampleToneAdaptation() {
    const engine = createStyleTransferEngine();

    const professionalContent = `
        We are pleased to announce the availability of a premium residential property 
        located in the prestigious Westwood neighborhood. This exceptional home features 
        four bedrooms, three bathrooms, and approximately 2,500 square feet of living space. 
        The property includes modern amenities and has been meticulously maintained.
    `;

    const result = await engine.adaptTone(
        professionalContent,
        'casual',
        ['4 bedrooms', '3 bathrooms', '2,500 square feet', 'Westwood neighborhood']
    );

    console.log('Original:', result.originalContent);
    console.log('Adapted:', result.adaptedContent);
    console.log('Preservation Score:', result.metadata.preservationScore);
}

/**
 * Example 2: Convert blog post to social media
 */
async function exampleFormatAdaptation() {
    const engine = createStyleTransferEngine();

    const blogPost = `
        The real estate market in downtown Seattle continues to show strong momentum 
        as we enter Q4 2024. Home prices have increased by 8% year-over-year, driven 
        by limited inventory and sustained buyer demand. First-time homebuyers are 
        finding opportunities in emerging neighborhoods like Columbia City and Beacon Hill, 
        where prices remain more accessible. If you're considering buying or selling, 
        now is an excellent time to connect with a local expert who can guide you 
        through the process.
    `;

    const result = await engine.adaptFormat(
        blogPost,
        'social-media',
        ['8% increase', 'Q4 2024', 'Columbia City', 'Beacon Hill']
    );

    console.log('Blog Post:', result.originalContent);
    console.log('Social Media:', result.adaptedContent);
    console.log('Word Count Change:', result.metadata.originalWordCount, '->', result.metadata.adaptedWordCount);
}

/**
 * Example 3: Optimize content for Instagram
 */
async function examplePlatformAdaptation() {
    const engine = createStyleTransferEngine();

    const genericContent = `
        Just listed! Beautiful 3-bedroom home in the heart of Capitol Hill. 
        This charming property features hardwood floors, updated kitchen, 
        and a spacious backyard perfect for entertaining. Close to restaurants, 
        shops, and public transit. Schedule your showing today!
    `;

    const result = await engine.adaptPlatform(
        genericContent,
        'instagram',
        ['3-bedroom', 'Capitol Hill', 'hardwood floors', 'updated kitchen']
    );

    console.log('Generic:', result.originalContent);
    console.log('Instagram:', result.adaptedContent);
    console.log('Preserved Elements:', result.preservedElements.length);
}

/**
 * Example 4: Combined adaptation (tone + format + platform)
 */
async function exampleCombinedAdaptation() {
    const engine = createStyleTransferEngine();

    const originalContent = `
        Market Analysis Report: The luxury real estate segment in Bellevue has 
        demonstrated remarkable resilience throughout 2024. Properties priced above 
        $2 million have experienced a 12% appreciation, significantly outperforming 
        the broader market. This trend is attributed to strong tech sector employment 
        and limited supply of high-end inventory. Investment opportunities remain 
        particularly attractive in waterfront properties and new construction developments.
    `;

    const result = await engine.adaptContent({
        originalContent,
        targetTone: 'enthusiastic',
        targetFormat: 'social-media',
        targetPlatform: 'linkedin',
        preserveKeyPoints: [
            '12% appreciation',
            'luxury segment',
            'Bellevue',
            'waterfront properties',
        ],
        additionalInstructions: 'Include a call-to-action for real estate professionals',
    });

    console.log('Original:', result.originalContent);
    console.log('Adapted:', result.adaptedContent);
    console.log('Adaptation Type:', result.adaptationType);
    console.log('Confidence:', result.confidence);
}

/**
 * Example 5: Validate message preservation
 */
async function examplePreservationValidation() {
    const engine = createStyleTransferEngine();

    const original = `
        New listing alert! This stunning 4-bed, 3-bath home in Green Lake is now available. 
        Features include a chef's kitchen, spa-like master bath, and private backyard oasis. 
        Priced at $1.2M. Open house this Saturday 1-3pm. Contact me to schedule a private showing!
    `;

    const adapted = `
        🏡 Just hit the market! Gorgeous Green Lake home with 4 beds & 3 baths ✨
        
        Chef's kitchen? Check. Spa bathroom? Check. Private backyard paradise? Double check! 
        
        $1.2M | Open house Sat 1-3pm
        
        DM me for a private tour! 🔑
    `;

    const keyElements = [
        { type: 'key-point' as const, content: '4-bed, 3-bath', preserved: false, location: '' },
        { type: 'key-point' as const, content: 'Green Lake', preserved: false, location: '' },
        { type: 'fact' as const, content: '$1.2M', preserved: false, location: '' },
        { type: 'call-to-action' as const, content: 'Contact for showing', preserved: false, location: '' },
    ];

    const validation = await engine.validatePreservation(original, adapted, keyElements);

    console.log('Core Message Intact:', validation.coreMessageIntact);
    console.log('Preservation Score:', validation.preservationScore);
    console.log('Preserved Elements:', validation.preservedElements.filter((e) => e.preserved).length);
    console.log('Missing Elements:', validation.missingElements);
}

/**
 * Example 6: Store adaptation for future reference
 */
async function exampleStoreAdaptation() {
    const engine = createStyleTransferEngine();
    const userId = 'user_123';

    const content = 'Your original content here...';

    const result = await engine.adaptTone(content, 'professional');

    // Store the adaptation
    await engine.storeAdaptation(userId, result);

    console.log('Adaptation stored successfully');
}

// Export examples for testing
export {
    exampleToneAdaptation,
    exampleFormatAdaptation,
    examplePlatformAdaptation,
    exampleCombinedAdaptation,
    examplePreservationValidation,
    exampleStoreAdaptation,
};
