/**
 * Audio Content Creator - Usage Examples
 * 
 * This file demonstrates how to use the AudioContentCreator strand
 * for generating voice-optimized audio scripts.
 */

import { getAudioContentCreator } from './audio-content-creator';
import type { AudioContentInput, AudioScript } from './audio-content-creator';

/**
 * Example 1: Generate a podcast episode script
 */
export async function generatePodcastExample() {
    const audioCreator = getAudioContentCreator();

    const input: AudioContentInput = {
        topic: 'First-Time Home Buyer Tips for 2024',
        duration: 1200, // 20 minutes
        format: 'podcast',
        style: 'conversational',
        targetAudience: 'First-time home buyers aged 25-35',
        keyPoints: [
            'Understanding your budget and getting pre-approved',
            'Working with a real estate agent',
            'What to look for during home tours',
            'Making competitive offers in today\'s market',
            'Navigating the closing process',
        ],
        tone: 'friendly',
        agentProfile: {
            agentName: 'Sarah Johnson',
            primaryMarket: 'Austin, Texas',
            specialization: 'first-time-buyers',
            preferredTone: 'friendly',
            corePrinciple: 'Making home ownership accessible and stress-free',
        } as any,
    };

    const script = await audioCreator.generateScript(input, 'user-123');

    console.log('Podcast Script Generated:');
    console.log('Title:', script.title);
    console.log('Duration:', script.estimatedDuration, 'seconds');
    console.log('Segments:', script.segments.length);
    console.log('\nOpening:', script.opening);
    console.log('\nPronunciation Guide:', script.pronunciationGuide);
    console.log('\nDelivery Tips:', script.deliveryTips);

    return script;
}

/**
 * Example 2: Generate a 30-second audio advertisement
 */
export async function generateAudioAdExample() {
    const audioCreator = getAudioContentCreator();

    const script = await audioCreator.generateAudioAd(
        'Open House This Weekend - Stunning 4BR Home in Westlake',
        30,
        {
            agentName: 'Mike Chen',
            primaryMarket: 'Westlake, Austin',
            specialization: 'luxury-homes',
            preferredTone: 'professional',
            corePrinciple: 'Exceptional service for discerning clients',
            contactInfo: {
                phone: '512-555-0123',
                email: 'mike@example.com',
            },
        } as any,
        'user-456'
    );

    console.log('Audio Ad Script:');
    console.log('Title:', script.title);
    console.log('Duration:', script.estimatedDuration, 'seconds');
    console.log('\nScript:', script.opening);
    console.log('\nPacing Notes:', script.segments[0]?.pacingNotes);

    return script;
}

/**
 * Example 3: Generate a voiceover for a property video
 */
export async function generateVoiceoverExample() {
    const audioCreator = getAudioContentCreator();

    const script = await audioCreator.generateVoiceoverScript(
        'Luxury Waterfront Estate - Virtual Tour Narration',
        180, // 3 minutes
        'storytelling',
        'user-789'
    );

    console.log('Voiceover Script:');
    console.log('Title:', script.title);
    console.log('Duration:', script.estimatedDuration, 'seconds');
    console.log('\nSegments:');
    script.segments.forEach((segment, i) => {
        console.log(`\n${i + 1}. ${segment.title} (${segment.duration}s)`);
        console.log('Content:', segment.content.substring(0, 100) + '...');
        console.log('Delivery Style:', segment.deliveryStyle);
        console.log('Pacing Notes:', segment.pacingNotes.length);
    });

    return script;
}

/**
 * Example 4: Optimize existing text for voice delivery
 */
export async function optimizeTextForVoiceExample() {
    const audioCreator = getAudioContentCreator();

    const existingText = `
        Welcome to 123 Oak Street, a beautifully renovated 3-bedroom, 2-bathroom home 
        in the heart of downtown. This property features hardwood floors throughout, 
        a gourmet kitchen with stainless steel appliances, and a spacious backyard 
        perfect for entertaining. The master suite includes a walk-in closet and 
        en-suite bathroom with dual vanities. Located just minutes from shopping, 
        dining, and entertainment, this home offers the perfect blend of comfort 
        and convenience.
    `;

    const script = await audioCreator.optimizeForVoice(
        existingText,
        'voiceover',
        'user-101'
    );

    console.log('Voice-Optimized Script:');
    console.log('Original length:', existingText.length, 'characters');
    console.log('Optimized duration:', script.estimatedDuration, 'seconds');
    console.log('\nPronunciation Guide:');
    script.pronunciationGuide.forEach(guide => {
        console.log(`- ${guide.word}: ${guide.pronunciation}`);
    });
    console.log('\nOverall Pacing Notes:');
    script.overallPacingNotes.forEach(note => console.log(`- ${note}`));

    return script;
}

/**
 * Example 5: Generate a market update podcast segment
 */
export async function generateMarketUpdateExample() {
    const audioCreator = getAudioContentCreator();

    const input: AudioContentInput = {
        topic: 'Austin Real Estate Market Update - January 2024',
        duration: 600, // 10 minutes
        format: 'podcast',
        style: 'educational',
        targetAudience: 'Current and prospective Austin homeowners',
        keyPoints: [
            'Current median home prices and trends',
            'Inventory levels and days on market',
            'Interest rate impact on affordability',
            'Neighborhood spotlight: East Austin',
            'Predictions for Q1 2024',
        ],
        additionalContext: 'Include recent data and statistics, but make it accessible and engaging',
        tone: 'authoritative',
    };

    const script = await audioCreator.generateScript(input, 'user-202');

    console.log('Market Update Script:');
    console.log('Title:', script.title);
    console.log('Key Messages:', script.keyMessages);
    console.log('\nDelivery Tips:');
    script.deliveryTips.forEach(tip => console.log(`- ${tip}`));

    return script;
}

/**
 * Example 6: Generate a voice message for clients
 */
export async function generateVoiceMessageExample() {
    const audioCreator = getAudioContentCreator();

    const input: AudioContentInput = {
        topic: 'Thank You Message for New Clients',
        duration: 90, // 1.5 minutes
        format: 'voice-message',
        style: 'conversational',
        tone: 'warm',
        agentProfile: {
            agentName: 'Jennifer Martinez',
            primaryMarket: 'San Antonio, Texas',
            specialization: 'general',
            preferredTone: 'friendly',
            corePrinciple: 'Building lasting relationships through exceptional service',
        } as any,
    };

    const script = await audioCreator.generateScript(input, 'user-303');

    console.log('Voice Message Script:');
    console.log('Opening:', script.opening);
    console.log('Closing:', script.closing);
    console.log('\nPacing Notes:');
    script.segments[0]?.pacingNotes.forEach(note => {
        console.log(`- ${note.type} at "${note.location}": ${note.instruction}`);
    });

    return script;
}

/**
 * Example 7: Demonstrate pacing and pronunciation features
 */
export async function demonstratePacingFeaturesExample() {
    const audioCreator = getAudioContentCreator();

    const input: AudioContentInput = {
        topic: 'Understanding Mortgage Pre-Qualification vs Pre-Approval',
        duration: 300, // 5 minutes
        format: 'podcast',
        style: 'educational',
        keyPoints: [
            'Definition of pre-qualification',
            'Definition of pre-approval',
            'Key differences between the two',
            'Which one you need and when',
        ],
    };

    const script = await audioCreator.generateScript(input, 'user-404');

    console.log('Script with Detailed Pacing:');
    console.log('\nPronunciation Guide:');
    script.pronunciationGuide.forEach(guide => {
        console.log(`\nWord: ${guide.word}`);
        console.log(`Pronunciation: ${guide.pronunciation}`);
        if (guide.notes) console.log(`Notes: ${guide.notes}`);
    });

    console.log('\n\nSegment Pacing Details:');
    script.segments.forEach((segment, i) => {
        console.log(`\n--- Segment ${i + 1}: ${segment.title} ---`);
        console.log(`Delivery Style: ${segment.deliveryStyle}`);
        console.log(`Duration: ${segment.duration}s`);
        console.log('\nPacing Notes:');
        segment.pacingNotes.forEach(note => {
            const durationStr = note.duration ? ` (${note.duration}s)` : '';
            console.log(`  ${note.type}${durationStr} at "${note.location}"`);
            console.log(`  → ${note.instruction}`);
        });
    });

    return script;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('=== Audio Content Creator Examples ===\n');

    try {
        console.log('\n1. Podcast Episode:');
        await generatePodcastExample();

        console.log('\n\n2. Audio Advertisement:');
        await generateAudioAdExample();

        console.log('\n\n3. Property Voiceover:');
        await generateVoiceoverExample();

        console.log('\n\n4. Text Optimization:');
        await optimizeTextForVoiceExample();

        console.log('\n\n5. Market Update:');
        await generateMarketUpdateExample();

        console.log('\n\n6. Voice Message:');
        await generateVoiceMessageExample();

        console.log('\n\n7. Pacing Features:');
        await demonstratePacingFeaturesExample();

        console.log('\n\n=== All Examples Completed ===');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Uncomment to run examples
// runAllExamples();
