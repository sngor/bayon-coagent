/**
 * Video Script Generator - Example Usage
 * 
 * This file demonstrates how to use the VideoScriptGenerator strand
 * for creating optimized video scripts for real estate content.
 */

import { getVideoScriptGenerator } from './video-script-generator';
import type { VideoScriptInput, VideoPlatform, VideoStyle } from './video-script-generator';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Example 1: Generate a YouTube property tour script
 */
export async function generatePropertyTourScript(userId?: string) {
    const generator = getVideoScriptGenerator();

    const input: VideoScriptInput = {
        topic: 'Luxury waterfront property tour in Miami Beach',
        duration: 600, // 10 minutes
        style: 'property-tour',
        platform: 'youtube',
        targetAudience: 'High-net-worth buyers looking for luxury waterfront properties',
        keyPoints: [
            'Panoramic ocean views from every room',
            'Private beach access',
            'Smart home technology throughout',
            'Chef\'s kitchen with premium appliances',
            'Infinity pool and outdoor entertainment area',
        ],
        agentProfile: {
            agentName: 'Sarah Johnson',
            primaryMarket: 'Miami Beach Luxury Real Estate',
            specialization: 'luxury',
            preferredTone: 'professional',
            corePrinciple: 'Delivering exceptional luxury experiences',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const script = await generator.generateScript(input, userId);

    console.log('Generated Property Tour Script:');
    console.log('Title:', script.title);
    console.log('Hook:', script.hook);
    console.log('Sections:', script.sections.length);
    console.log('Total Duration:', script.estimatedDuration, 'seconds');
    console.log('CTA:', script.callToAction);

    return script;
}

/**
 * Example 2: Generate a TikTok quick tip
 */
export async function generateTikTokTip(userId?: string) {
    const generator = getVideoScriptGenerator();

    const input: VideoScriptInput = {
        topic: '3 things first-time homebuyers always forget',
        duration: 45, // 45 seconds
        style: 'tips-and-tricks',
        platform: 'tiktok',
        targetAudience: 'First-time homebuyers, millennials',
        agentProfile: {
            agentName: 'Mike Chen',
            primaryMarket: 'Austin, TX',
            specialization: 'first-time-buyers',
            preferredTone: 'warm-consultative',
            corePrinciple: 'Making homeownership accessible',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const script = await generator.generateScript(input, userId);

    console.log('Generated TikTok Script:');
    console.log('Title:', script.title);
    console.log('Hook:', script.hook);
    console.log('Hashtags:', script.hashtags?.join(', '));

    return script;
}

/**
 * Example 3: Generate an Instagram Reel market update
 */
export async function generateInstagramMarketUpdate(userId?: string) {
    const generator = getVideoScriptGenerator();

    const input: VideoScriptInput = {
        topic: 'Q4 2024 housing market trends and what they mean for buyers',
        duration: 60, // 60 seconds
        style: 'market-update',
        platform: 'instagram',
        targetAudience: 'Potential homebuyers and sellers',
        keyPoints: [
            'Interest rates stabilizing',
            'Inventory increasing in key markets',
            'Best time to buy in 18 months',
        ],
        agentProfile: {
            agentName: 'Jennifer Martinez',
            primaryMarket: 'Phoenix Metro Area',
            specialization: 'general',
            preferredTone: 'professional',
            corePrinciple: 'Data-driven market insights',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const script = await generator.generateScript(input, userId);

    console.log('Generated Instagram Market Update:');
    console.log('Title:', script.title);
    console.log('Duration:', script.estimatedDuration, 'seconds');
    console.log('Platform Notes:', script.platformNotes);

    return script;
}

/**
 * Example 4: Generate a Facebook educational video
 */
export async function generateFacebookEducationalVideo(userId?: string) {
    const generator = getVideoScriptGenerator();

    const input: VideoScriptInput = {
        topic: 'Understanding home inspection reports: What to look for',
        duration: 180, // 3 minutes
        style: 'educational',
        platform: 'facebook',
        targetAudience: 'Homebuyers in the inspection phase',
        keyPoints: [
            'Major vs. minor issues',
            'Red flags that should concern you',
            'How to negotiate repairs',
            'When to walk away',
        ],
        agentProfile: {
            agentName: 'David Thompson',
            primaryMarket: 'Seattle Area',
            specialization: 'general',
            preferredTone: 'professional',
            corePrinciple: 'Empowering informed decisions',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const script = await generator.generateScript(input, userId);

    console.log('Generated Facebook Educational Video:');
    console.log('Title:', script.title);
    console.log('Sections:', script.sections.map(s => s.title).join(', '));
    console.log('Description:', script.description);

    return script;
}

/**
 * Example 5: Generate just an engagement hook
 */
export async function generateEngagementHook(userId?: string) {
    const generator = getVideoScriptGenerator();

    const hook = await generator.generateHook(
        'Why now is the best time to sell your home in 10 years',
        3, // 3 seconds
        'market-update',
        userId
    );

    console.log('Generated Hook:', hook);

    return hook;
}

/**
 * Example 6: Generate a call-to-action
 */
export async function generateCTA(userId?: string) {
    const generator = getVideoScriptGenerator();

    const agentProfile = {
        agentName: 'Lisa Anderson',
        primaryMarket: 'Denver Metro',
        specialization: 'general',
        preferredTone: 'warm-consultative',
        corePrinciple: 'Client-first service',
        contactInfo: {
            phone: '(303) 555-0123',
            email: 'lisa@example.com',
        },
    } as Partial<AgentProfile> as AgentProfile;

    const cta = await generator.generateCallToAction(
        'schedule a free home valuation consultation',
        agentProfile,
        userId
    );

    console.log('Generated CTA:', cta);

    return cta;
}

/**
 * Example 7: Optimize existing script for different platform
 */
export async function optimizeScriptForPlatform(userId?: string) {
    const generator = getVideoScriptGenerator();

    // First, generate a YouTube script
    const youtubeInput: VideoScriptInput = {
        topic: 'Top 5 neighborhoods for families in Portland',
        duration: 480, // 8 minutes
        style: 'educational',
        platform: 'youtube',
        agentProfile: {
            agentName: 'Tom Wilson',
            primaryMarket: 'Portland, OR',
            specialization: 'general',
            preferredTone: 'warm-consultative',
            corePrinciple: 'Helping families find their perfect home',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const youtubeScript = await generator.generateScript(youtubeInput, userId);

    console.log('Original YouTube Script Duration:', youtubeScript.estimatedDuration, 'seconds');

    // Now optimize it for Instagram
    const instagramScript = await generator.optimizeForPlatform(
        youtubeScript,
        'instagram',
        userId
    );

    console.log('Optimized Instagram Script Duration:', instagramScript.estimatedDuration, 'seconds');
    console.log('Platform Notes:', instagramScript.platformNotes);

    return { youtubeScript, instagramScript };
}

/**
 * Example 8: Generate a testimonial video script
 */
export async function generateTestimonialScript(userId?: string) {
    const generator = getVideoScriptGenerator();

    const input: VideoScriptInput = {
        topic: 'Client success story: From renting to homeownership',
        duration: 120, // 2 minutes
        style: 'testimonial',
        platform: 'facebook',
        targetAudience: 'Renters considering buying their first home',
        additionalContext: 'Feature the Johnson family who bought their first home after 5 years of renting',
        keyPoints: [
            'Overcame credit challenges',
            'Found the perfect starter home',
            'Now building equity instead of paying rent',
        ],
        agentProfile: {
            agentName: 'Rachel Green',
            primaryMarket: 'Nashville, TN',
            specialization: 'first-time-buyers',
            preferredTone: 'warm-consultative',
            corePrinciple: 'Making homeownership dreams come true',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const script = await generator.generateScript(input, userId);

    console.log('Generated Testimonial Script:');
    console.log('Title:', script.title);
    console.log('Hook:', script.hook);
    console.log('CTA:', script.callToAction);

    return script;
}

/**
 * Example 9: Generate a behind-the-scenes video
 */
export async function generateBehindTheScenesScript(userId?: string) {
    const generator = getVideoScriptGenerator();

    const input: VideoScriptInput = {
        topic: 'A day in the life of a real estate agent',
        duration: 90, // 90 seconds
        style: 'behind-the-scenes',
        platform: 'instagram',
        targetAudience: 'Potential clients and aspiring agents',
        agentProfile: {
            agentName: 'Chris Martinez',
            primaryMarket: 'San Diego, CA',
            specialization: 'general',
            preferredTone: 'warm-consultative',
            corePrinciple: 'Transparency and authenticity',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const script = await generator.generateScript(input, userId);

    console.log('Generated Behind-the-Scenes Script:');
    console.log('Title:', script.title);
    console.log('Sections:', script.sections.length);
    console.log('Visual Suggestions:', script.sections[0].visualSuggestions);

    return script;
}

/**
 * Example 10: Generate a LinkedIn professional insights video
 */
export async function generateLinkedInInsights(userId?: string) {
    const generator = getVideoScriptGenerator();

    const input: VideoScriptInput = {
        topic: 'How AI is transforming real estate marketing in 2024',
        duration: 150, // 2.5 minutes
        style: 'educational',
        platform: 'linkedin',
        targetAudience: 'Real estate professionals and industry leaders',
        keyPoints: [
            'AI-powered property descriptions',
            'Predictive analytics for pricing',
            'Automated marketing campaigns',
            'Virtual staging and tours',
        ],
        agentProfile: {
            agentName: 'Dr. Amanda Foster',
            primaryMarket: 'National',
            specialization: 'luxury',
            preferredTone: 'professional',
            corePrinciple: 'Innovation and excellence',
        } as Partial<AgentProfile> as AgentProfile,
    };

    const script = await generator.generateScript(input, userId);

    console.log('Generated LinkedIn Insights Video:');
    console.log('Title:', script.title);
    console.log('Keywords:', script.keywords.join(', '));
    console.log('Description:', script.description);

    return script;
}
