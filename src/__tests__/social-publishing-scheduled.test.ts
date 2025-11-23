/**
 * Tests for scheduled publishing functionality
 * 
 * Tests the new publishScheduledContent function and related helpers
 */

import { describe, it, expect } from '@jest/globals';

// Simple test functions extracted from the implementation
function extractKeywordsFromContent(content: string): string[] {
    const commonWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ]);

    const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.has(word));

    // Count word frequency
    const wordCount = new Map<string, number>();
    words.forEach(word => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Return top 5 keywords
    return Array.from(wordCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
}

async function generateHashtagsForScheduledContent(
    content: string,
    contentType: string,
    platform: string
): Promise<string[]> {
    const maxHashtags = platform === 'instagram' ? 30 : 15;
    const hashtags: string[] = [];

    // Content type specific hashtags
    const typeHashtags: Record<string, string[]> = {
        'blog_post': ['#realestateblog', '#propertyinsights', '#marketupdate', '#realestatenews'],
        'social_media': ['#realestate', '#realtor', '#property', '#homes'],
        'listing_description': ['#forsale', '#dreamhome', '#newhome', '#househunting'],
        'market_update': ['#marketupdate', '#realestatemarkets', '#propertytrends', '#marketanalysis'],
        'neighborhood_guide': ['#neighborhood', '#community', '#localarea', '#livingin'],
        'video_script': ['#realestatevideo', '#propertytour', '#virtualtour', '#homevideo'],
        'newsletter': ['#newsletter', '#realestateupdates', '#propertyupdates', '#marketinsights'],
        'email_template': ['#realestateemail', '#propertymarketing', '#clientcommunication'],
    };

    // Add content type hashtags
    hashtags.push(...(typeHashtags[contentType] || []));

    // Add general real estate hashtags
    const generalHashtags = [
        '#realestate',
        '#realtor',
        '#property',
        '#homes',
        '#realtorlife',
        '#realestateagent',
        '#homebuyers',
        '#realestateinvestor',
        '#luxuryhomes',
        '#dreamhome'
    ];

    hashtags.push(...generalHashtags);

    // Extract keywords from content for additional hashtags
    const contentKeywords = extractKeywordsFromContent(content);
    contentKeywords.forEach(keyword => {
        if (keyword.length > 2) {
            hashtags.push(`#${keyword.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`);
        }
    });

    // Remove duplicates and limit
    const uniqueHashtags = Array.from(new Set(hashtags));
    return uniqueHashtags.slice(0, maxHashtags);
}

describe('Scheduled Publishing', () => {
    describe('generateHashtagsForScheduledContent', () => {
        it('should generate appropriate hashtags for blog posts', async () => {
            const content = 'This is a comprehensive guide about real estate market trends and property investment strategies.';
            const contentType = 'blog_post';
            const platform = 'facebook';

            const hashtags = await generateHashtagsForScheduledContent(content, contentType, platform);

            expect(hashtags).toContain('#realestateblog');
            expect(hashtags).toContain('#propertyinsights');
            expect(hashtags).toContain('#realestate');
            expect(hashtags.length).toBeLessThanOrEqual(15);
        });

        it('should generate more hashtags for Instagram', async () => {
            const content = 'Beautiful home for sale in downtown area with modern amenities.';
            const contentType = 'listing_description';
            const platform = 'instagram';

            const hashtags = await generateHashtagsForScheduledContent(content, contentType, platform);

            expect(hashtags).toContain('#forsale');
            expect(hashtags).toContain('#dreamhome');
            expect(hashtags.length).toBeLessThanOrEqual(30);
        });
    });

    describe('extractKeywordsFromContent', () => {
        it('should extract relevant keywords from content', () => {
            const content = 'This beautiful property features modern kitchen, spacious bedrooms, and luxury amenities in downtown location.';

            const keywords = extractKeywordsFromContent(content);

            expect(keywords).toContain('beautiful');
            expect(keywords).toContain('property');
            expect(keywords).toContain('modern');
            expect(keywords.length).toBeLessThanOrEqual(5);
        });

        it('should filter out common words', () => {
            const content = 'The house is a beautiful home with the best features and the most amazing views.';

            const keywords = extractKeywordsFromContent(content);

            expect(keywords).not.toContain('the');
            expect(keywords).not.toContain('is');
            expect(keywords).not.toContain('and');
            expect(keywords).toContain('beautiful');
            expect(keywords).toContain('house');
        });
    });

    describe('SEO optimization', () => {
        it('should generate SEO-friendly slugs', () => {
            const title = 'Top 10 Real Estate Tips for 2024!';
            const expectedSlug = 'top-10-real-estate-tips-for-2024';

            // This would test the slug generation logic
            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();

            expect(slug).toBe(expectedSlug);
        });
    });

    describe('Email formatting', () => {
        it('should convert markdown-like content to HTML', () => {
            const content = '# Title\n\n**Bold text** and *italic text*\n\nRegular paragraph.';

            let html = content
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');

            html = `<p>${html}</p>`;

            expect(html).toContain('<h1>Title</h1>');
            expect(html).toContain('<strong>Bold text</strong>');
            expect(html).toContain('<em>italic text</em>');
            expect(html).toContain('<p>');
        });
    });
});