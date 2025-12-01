/**
 * SEO Scoring Tests
 * 
 * Tests for the SEO scoring algorithm and recommendation generator.
 */

import {
    calculateSEOScore,
    evaluateTitleLength,
    evaluateHeadingStructure,
    evaluateKeywordDensity,
    evaluateReadability,
    evaluateContentLength,
    countWords,
    countHeadings,
    calculateKeywordDensity,
    calculateFleschReadingEase,
} from '@/lib/seo/scoring';

import {
    generateSEORecommendations,
} from '@/lib/seo/recommendations';

describe('SEO Scoring', () => {
    describe('countWords', () => {
        it('should count words correctly', () => {
            expect(countWords('Hello world')).toBe(2);
            expect(countWords('This is a test')).toBe(4);
            expect(countWords('')).toBe(0);
            expect(countWords('   ')).toBe(0);
        });

        it('should handle HTML tags', () => {
            expect(countWords('<p>Hello world</p>')).toBe(2);
            expect(countWords('<h1>Title</h1><p>Content here</p>')).toBe(3);
        });
    });

    describe('countHeadings', () => {
        it('should count headings correctly', () => {
            const content = '<h1>Title</h1><h2>Section 1</h2><h2>Section 2</h2><h3>Subsection</h3>';
            const counts = countHeadings(content);
            expect(counts.h1).toBe(1);
            expect(counts.h2).toBe(2);
            expect(counts.h3).toBe(1);
        });

        it('should return zero for content without headings', () => {
            const counts = countHeadings('<p>Just a paragraph</p>');
            expect(counts.h1).toBe(0);
            expect(counts.h2).toBe(0);
            expect(counts.h3).toBe(0);
        });
    });

    describe('calculateKeywordDensity', () => {
        it('should calculate keyword density correctly', () => {
            const content = 'real estate market in Seattle. The real estate market is growing.';
            const keywords = ['real estate'];
            const density = calculateKeywordDensity(content, keywords);
            // 2 occurrences of "real estate" in 11 words = ~18.18%
            expect(density).toBeCloseTo(18.18, 1);
        });

        it('should return 0 for no keywords', () => {
            const content = 'Some content here';
            const density = calculateKeywordDensity(content, []);
            expect(density).toBe(0);
        });

        it('should handle multiple keywords', () => {
            const content = 'Seattle real estate market trends';
            const keywords = ['Seattle', 'real estate'];
            const density = calculateKeywordDensity(content, keywords);
            expect(density).toBeGreaterThan(0);
        });
    });

    describe('evaluateTitleLength', () => {
        it('should give perfect score for optimal length (50-60 chars)', () => {
            const title = 'Seattle Real Estate Market Trends for 2024 Analysis';
            expect(evaluateTitleLength(title)).toBe(100);
        });

        it('should penalize very short titles', () => {
            const title = 'Short';
            expect(evaluateTitleLength(title)).toBeLessThan(50);
        });

        it('should penalize very long titles', () => {
            const title = 'This is a very long title that exceeds the recommended character limit for SEO optimization';
            expect(evaluateTitleLength(title)).toBeLessThan(50);
        });
    });

    describe('evaluateHeadingStructure', () => {
        it('should give high score for good heading structure', () => {
            const content = '<h1>Main Title</h1><h2>Section 1</h2><h2>Section 2</h2><h3>Detail</h3>';
            expect(evaluateHeadingStructure(content)).toBeGreaterThanOrEqual(80);
        });

        it('should penalize missing H1', () => {
            const content = '<h2>Section 1</h2><h2>Section 2</h2>';
            expect(evaluateHeadingStructure(content)).toBeLessThan(60);
        });

        it('should penalize multiple H1s', () => {
            const content = '<h1>Title 1</h1><h1>Title 2</h1>';
            expect(evaluateHeadingStructure(content)).toBeLessThan(80);
        });
    });

    describe('evaluateContentLength', () => {
        it('should give perfect score for 1500+ words', () => {
            const content = 'word '.repeat(1500);
            expect(evaluateContentLength(content)).toBe(100);
        });

        it('should penalize short content', () => {
            const content = 'word '.repeat(200);
            expect(evaluateContentLength(content)).toBeLessThan(50);
        });
    });

    describe('calculateSEOScore', () => {
        it('should calculate composite score', () => {
            const content = `
        <h1>Seattle Real Estate Market Analysis 2024</h1>
        <h2>Market Overview</h2>
        <p>${'The Seattle real estate market continues to show strong growth. '.repeat(50)}</p>
        <h2>Key Trends</h2>
        <p>${'Real estate prices in Seattle have increased steadily. '.repeat(50)}</p>
        <h2>Future Outlook</h2>
        <p>${'The market outlook for Seattle real estate remains positive. '.repeat(50)}</p>
      `;
            const title = 'Seattle Real Estate Market Analysis and Trends 2024';
            const keywords = ['Seattle', 'real estate'];

            const result = calculateSEOScore(content, title, keywords);

            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
            expect(result.factors).toBeDefined();
            expect(result.details).toBeDefined();
        });
    });

    describe('generateSEORecommendations', () => {
        it('should generate recommendations for poor content', () => {
            const content = '<p>Short content</p>';
            const title = 'Short';

            const result = generateSEORecommendations(content, title);

            expect(result.score).toBeLessThan(50);
            expect(result.recommendations.length).toBeGreaterThan(0);
            expect(result.recommendations.some(r => r.priority === 'high')).toBe(true);
        });

        it('should identify strengths in good content', () => {
            const content = `
        <h1>Comprehensive Seattle Real Estate Market Guide</h1>
        <h2>Market Overview</h2>
        <p>${'The Seattle real estate market offers diverse opportunities. '.repeat(100)}</p>
        <h2>Neighborhood Analysis</h2>
        <p>${'Different neighborhoods in Seattle have unique characteristics. '.repeat(100)}</p>
        <h2>Investment Strategies</h2>
        <p>${'Smart real estate investment requires careful planning. '.repeat(100)}</p>
      `;
            const title = 'Seattle Real Estate Market Guide: Complete Analysis';
            const keywords = ['Seattle', 'real estate'];

            const result = generateSEORecommendations(content, title, undefined, keywords);

            expect(result.strengths.length).toBeGreaterThan(0);
        });

        it('should recommend meta description when missing', () => {
            const content = '<h1>Title</h1><p>' + 'content '.repeat(500) + '</p>';
            const title = 'Good Title Length for SEO Optimization and Rankings';

            const result = generateSEORecommendations(content, title, '');

            expect(result.recommendations.some(r => r.category === 'meta')).toBe(true);
        });
    });
});
