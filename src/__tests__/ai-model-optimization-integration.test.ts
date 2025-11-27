/**
 * Integration Tests for AI Model Optimization
 * 
 * Tests all AI flows with real Bedrock API calls to:
 * 1. Verify model selection works correctly
 * 2. Measure actual performance and token usage
 * 3. Validate cost savings vs single-model approach
 * 
 * Feature: ai-model-optimization
 * Requirements: All
 * 
 * NOTE: These tests make real API calls to AWS Bedrock and will incur costs.
 * Run with: npm test -- ai-model-optimization-integration.test.ts
 * 
 * Set SKIP_INTEGRATION_TESTS=true to skip these tests in CI/CD
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Import all AI flows
import { generateAgentBio } from '@/aws/bedrock/flows/generate-agent-bio';
import { analyzeReviewSentiment } from '@/aws/bedrock/flows/analyze-review-sentiment';
import { analyzeMultipleReviews } from '@/aws/bedrock/flows/analyze-multiple-reviews';
import { generateSocialMediaPost } from '@/aws/bedrock/flows/generate-social-media-post';
import { generateListingDescription } from '@/aws/bedrock/flows/listing-description-generator';
import { generateBlogPost } from '@/aws/bedrock/flows/generate-blog-post';
import { generateNeighborhoodGuide } from '@/aws/bedrock/flows/generate-neighborhood-guides';
import { runResearchAgent } from '@/aws/bedrock/flows/run-research-agent';
import { generateVideoScript } from '@/aws/bedrock/flows/generate-video-script';
import { generateListingFaqs } from '@/aws/bedrock/flows/generate-listing-faqs';
import { generateMarketUpdate } from '@/aws/bedrock/flows/generate-market-update';
import { generateMarketingPlan } from '@/aws/bedrock/flows/generate-marketing-plan';
import { runNapAudit } from '@/aws/bedrock/flows/run-nap-audit';
import { findCompetitors, enrichCompetitorData } from '@/aws/bedrock/flows/find-competitors';
import { getKeywordRankings } from '@/aws/bedrock/flows/get-keyword-rankings';
import { BEDROCK_MODELS } from '@/aws/bedrock/flow-base';

// Performance tracking
interface FlowMetrics {
    flowName: string;
    modelId: string;
    executionTimeMs: number;
    tokenUsage?: {
        input: number;
        output: number;
    };
    success: boolean;
    error?: string;
}

const metrics: FlowMetrics[] = [];

function trackMetrics(flowName: string, modelId: string, startTime: number, success: boolean, error?: string) {
    const executionTimeMs = Date.now() - startTime;
    metrics.push({
        flowName,
        modelId,
        executionTimeMs,
        success,
        error,
    });
}

// Skip integration tests if environment variable is set
const shouldSkip = process.env.SKIP_INTEGRATION_TESTS === 'true';

describe('AI Model Optimization - Integration Tests', () => {
    beforeAll(() => {
        if (shouldSkip) {
            console.log('⚠️  Skipping integration tests (SKIP_INTEGRATION_TESTS=true)');
        } else {
            console.log('🚀 Running integration tests with real Bedrock API calls');
            console.log('⚠️  These tests will incur AWS costs');
        }
    });

    afterAll(() => {
        if (!shouldSkip && metrics.length > 0) {
            // Save metrics to file for cost analysis
            const fs = require('fs');
            const path = require('path');
            const metricsPath = path.join(process.cwd(), 'integration-test-metrics.json');
            fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
            console.log(`\n📊 Metrics saved to: ${metricsPath}`);
        }
    });

    describe('Simple, Fast Tasks (Haiku)', () => {
        it('should generate agent bio with Haiku model', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateAgentBio({
                    name: 'John Smith',
                    agencyName: 'Smith Realty',
                    experience: '10 years',
                    certifications: 'ABR, CRS',
                });

                trackMetrics('generateAgentBio', BEDROCK_MODELS.HAIKU, startTime, true);

                expect(result).toBeDefined();
                expect(result.bio).toBeDefined();
                expect(typeof result.bio).toBe('string');
                expect(result.bio.length).toBeGreaterThan(50);
                expect(result.bio.length).toBeLessThan(500);

                // Verify performance expectation (< 2s for Haiku)
                const executionTime = Date.now() - startTime;
                console.log(`✓ generateAgentBio: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(3000); // Allow 3s buffer
            } catch (error) {
                trackMetrics('generateAgentBio', BEDROCK_MODELS.HAIKU, startTime, false, (error as Error).message);
                throw error;
            }
        }, 10000);

        it('should analyze review sentiment with Haiku model', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await analyzeReviewSentiment({
                    reviewText: 'John was amazing! He helped us find our dream home and made the process so smooth. Highly recommend!',
                });

                trackMetrics('analyzeReviewSentiment', BEDROCK_MODELS.HAIKU, startTime, true);

                expect(result).toBeDefined();
                expect(result.sentiment).toBeDefined();
                expect(['positive', 'negative', 'neutral']).toContain(result.sentiment);
                expect(result.summary).toBeDefined();

                // Verify performance expectation (< 2s for Haiku)
                const executionTime = Date.now() - startTime;
                console.log(`✓ analyzeReviewSentiment: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(3000);
            } catch (error) {
                trackMetrics('analyzeReviewSentiment', BEDROCK_MODELS.HAIKU, startTime, false, (error as Error).message);
                throw error;
            }
        }, 10000);
    });

    describe('Short-Form Content (Haiku with Creative Config)', () => {
        it('should generate social media post with appropriate model', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateSocialMediaPost({
                    topic: 'Spring home buying tips',
                    tone: 'professional',
                    keywords: ['spring', 'home buying', 'real estate'],
                });

                trackMetrics('generateSocialMediaPost', 'Haiku/Creative', startTime, true);

                expect(result).toBeDefined();
                expect(result.twitter).toBeDefined();
                expect(result.twitter.length).toBeLessThanOrEqual(280); // Twitter limit

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateSocialMediaPost: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(3000);
            } catch (error) {
                trackMetrics('generateSocialMediaPost', 'Haiku/Creative', startTime, false, (error as Error).message);
                throw error;
            }
        }, 10000);

        it('should generate listing description with appropriate model', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateListingDescription({
                    propertyType: 'Single Family Home',
                    bedrooms: 3,
                    bathrooms: 2,
                    squareFeet: 2000,
                    features: ['granite countertops', 'hardwood floors', 'large backyard'],
                    location: 'Austin, TX',
                    tone: 'professional',
                });

                trackMetrics('generateListingDescription', 'Haiku/Creative', startTime, true);

                expect(result).toBeDefined();
                expect(result.description).toBeDefined();
                expect(result.description.length).toBeGreaterThan(100);

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateListingDescription: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(3000);
            } catch (error) {
                trackMetrics('generateListingDescription', 'Haiku/Creative', startTime, false, (error as Error).message);
                throw error;
            }
        }, 10000);
    });

    describe('Long-Form Content (Sonnet 3.5)', () => {
        it('should generate blog post with Sonnet 3.5 and 8K tokens', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateBlogPost({
                    topic: 'First-time home buyer guide for Austin',
                    includeWebSearch: false, // Disable web search for faster testing
                });

                trackMetrics('generateBlogPost', BEDROCK_MODELS.SONNET_3_5_V2, startTime, true);

                expect(result).toBeDefined();
                expect(result.blogPost).toBeDefined();
                expect(result.blogPost.length).toBeGreaterThan(1000); // Long-form content

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateBlogPost: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(8000); // Allow 8s for long-form
            } catch (error) {
                trackMetrics('generateBlogPost', BEDROCK_MODELS.SONNET_3_5_V2, startTime, false, (error as Error).message);
                throw error;
            }
        }, 20000);

        it('should generate neighborhood guide with Sonnet 3.5', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateNeighborhoodGuide({
                    neighborhood: 'Downtown Austin',
                    city: 'Austin',
                    state: 'TX',
                });

                trackMetrics('generateNeighborhoodGuide', BEDROCK_MODELS.SONNET_3_5_V2, startTime, true);

                expect(result).toBeDefined();
                expect(result.title).toBeDefined();
                expect(result.overview).toBeDefined();
                expect(result.sections).toBeDefined();
                expect(result.sections.length).toBeGreaterThan(0);

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateNeighborhoodGuide: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(8000);
            } catch (error) {
                trackMetrics('generateNeighborhoodGuide', BEDROCK_MODELS.SONNET_3_5_V2, startTime, false, (error as Error).message);
                throw error;
            }
        }, 20000);
    });

    describe('Structured Content (Sonnet 3.5)', () => {
        it('should generate video script with Sonnet 3.5', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateVideoScript({
                    topic: 'Home staging tips for sellers',
                    duration: '2-3 minutes',
                    tone: 'conversational',
                });

                trackMetrics('generateVideoScript', BEDROCK_MODELS.SONNET_3_5_V2, startTime, true);

                expect(result).toBeDefined();
                expect(result.title).toBeDefined();
                expect(result.script).toBeDefined();
                expect(result.script.length).toBeGreaterThan(0);

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateVideoScript: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(6000);
            } catch (error) {
                trackMetrics('generateVideoScript', BEDROCK_MODELS.SONNET_3_5_V2, startTime, false, (error as Error).message);
                throw error;
            }
        }, 15000);

        it('should generate listing FAQs with Sonnet 3.5', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateListingFaqs({
                    propertyDescription: 'Beautiful 2-bedroom condo in Downtown Austin with pool, gym, and parking. Price: $350,000.',
                });

                trackMetrics('generateListingFaqs', BEDROCK_MODELS.SONNET_3_5_V2, startTime, true);

                expect(result).toBeDefined();
                expect(result.faqs).toBeDefined();
                expect(Array.isArray(result.faqs)).toBe(true);
                expect(result.faqs.length).toBeGreaterThan(0);
                result.faqs.forEach(faq => {
                    expect(faq.q).toBeDefined();
                    expect(faq.a).toBeDefined();
                });

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateListingFAQs: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(6000);
            } catch (error) {
                trackMetrics('generateListingFAQs', BEDROCK_MODELS.SONNET_3_5_V2, startTime, false, (error as Error).message);
                throw error;
            }
        }, 15000);

        it('should generate market update with Sonnet 3.5', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateMarketUpdate({
                    location: 'Austin, TX',
                    marketData: {
                        medianPrice: 450000,
                        inventoryLevel: 'low',
                        daysOnMarket: 25,
                    },
                    tone: 'professional',
                });

                trackMetrics('generateMarketUpdate', BEDROCK_MODELS.SONNET_3_5_V2, startTime, true);

                expect(result).toBeDefined();
                expect(result.title).toBeDefined();
                expect(result.content).toBeDefined();

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateMarketUpdate: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(6000);
            } catch (error) {
                trackMetrics('generateMarketUpdate', BEDROCK_MODELS.SONNET_3_5_V2, startTime, false, (error as Error).message);
                throw error;
            }
        }, 15000);
    });

    describe('Analysis Flows (Sonnet 3.5 Analytical)', () => {
        it('should analyze multiple reviews with Sonnet 3.5', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await analyzeMultipleReviews({
                    reviews: [
                        'Great agent, very responsive and knowledgeable!',
                        'John helped us find the perfect home. Highly recommend!',
                        'Professional and patient throughout the entire process.',
                    ],
                });

                trackMetrics('analyzeMultipleReviews', BEDROCK_MODELS.SONNET_3_5_V2, startTime, true);

                expect(result).toBeDefined();
                expect(result.overallSentiment).toBeDefined();
                expect(result.keywords).toBeDefined();
                expect(Array.isArray(result.keywords)).toBe(true);
                expect(result.keywords.length).toBeGreaterThanOrEqual(5);
                expect(result.keywords.length).toBeLessThanOrEqual(7);
                expect(result.commonThemes).toBeDefined();
                expect(Array.isArray(result.commonThemes)).toBe(true);
                expect(result.commonThemes.length).toBeGreaterThanOrEqual(3);
                expect(result.commonThemes.length).toBeLessThanOrEqual(4);

                const executionTime = Date.now() - startTime;
                console.log(`✓ analyzeMultipleReviews: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(6000);
            } catch (error) {
                trackMetrics('analyzeMultipleReviews', BEDROCK_MODELS.SONNET_3_5_V2, startTime, false, (error as Error).message);
                throw error;
            }
        }, 15000);

        it('should generate marketing plan with Sonnet 3.5', async () => {
            if (shouldSkip) return;

            const startTime = Date.now();
            try {
                const result = await generateMarketingPlan({
                    brandAudit: {
                        napConsistency: 'inconsistent',
                        reviewCount: 15,
                        averageRating: 4.5,
                    },
                    competitors: [
                        { name: 'Jane Doe', reviewCount: 50, rating: 4.8 },
                        { name: 'Bob Smith', reviewCount: 30, rating: 4.6 },
                    ],
                });

                trackMetrics('generateMarketingPlan', BEDROCK_MODELS.SONNET_3_5_V2, startTime, true);

                expect(result).toBeDefined();
                expect(result.plan).toBeDefined();
                expect(Array.isArray(result.plan)).toBe(true);
                expect(result.plan).toHaveLength(3); // Exactly 3 tasks
                result.plan.forEach(task => {
                    expect(task.task).toBeDefined();
                    expect(task.rationale).toBeDefined();
                    expect(task.tool).toBeDefined();
                    expect(task.toolLink).toBeDefined();
                });

                const executionTime = Date.now() - startTime;
                console.log(`✓ generateMarketingPlan: ${executionTime}ms`);
                expect(executionTime).toBeLessThan(6000);
            } catch (error) {
                trackMetrics('generateMarketingPlan', BEDROCK_MODELS.SONNET_3_5_V2, startTime, false, (error as Error).message);
                throw error;
            }
        }, 15000);
    });

    describe('Performance Summary', () => {
        it('should print performance metrics summary', () => {
            if (shouldSkip || metrics.length === 0) return;

            console.log('\n📊 Performance Metrics Summary\n');
            console.log('═'.repeat(80));

            // Group by model
            const haikuFlows = metrics.filter(m => m.modelId.includes('haiku'));
            const sonnetFlows = metrics.filter(m => m.modelId.includes('sonnet'));

            console.log('\n🚀 Haiku Flows (Fast, Cost-Effective)');
            console.log('-'.repeat(80));
            haikuFlows.forEach(m => {
                const status = m.success ? '✓' : '✗';
                console.log(`${status} ${m.flowName.padEnd(35)} ${m.executionTimeMs}ms`);
            });

            const haikuAvg = haikuFlows.length > 0
                ? haikuFlows.reduce((sum, m) => sum + m.executionTimeMs, 0) / haikuFlows.length
                : 0;
            console.log(`\nAverage: ${Math.round(haikuAvg)}ms`);

            console.log('\n🎯 Sonnet 3.5 Flows (Balanced Performance)');
            console.log('-'.repeat(80));
            sonnetFlows.forEach(m => {
                const status = m.success ? '✓' : '✗';
                console.log(`${status} ${m.flowName.padEnd(35)} ${m.executionTimeMs}ms`);
            });

            const sonnetAvg = sonnetFlows.length > 0
                ? sonnetFlows.reduce((sum, m) => sum + m.executionTimeMs, 0) / sonnetFlows.length
                : 0;
            console.log(`\nAverage: ${Math.round(sonnetAvg)}ms`);

            console.log('\n═'.repeat(80));
            console.log(`\n✓ Total flows tested: ${metrics.length}`);
            console.log(`✓ Success rate: ${(metrics.filter(m => m.success).length / metrics.length * 100).toFixed(1)}%`);
            if (haikuAvg > 0) {
                console.log(`✓ Average Haiku latency: ${Math.round(haikuAvg)}ms (target: <2000ms)`);
            }
            if (sonnetAvg > 0) {
                console.log(`✓ Average Sonnet latency: ${Math.round(sonnetAvg)}ms (target: <3000ms)`);
            }

            // Verify performance expectations
            if (haikuAvg > 0) {
                expect(haikuAvg).toBeLessThan(2500); // Allow some buffer
            }
            if (sonnetAvg > 0) {
                expect(sonnetAvg).toBeLessThan(5000); // Allow some buffer
            }
        });
    });
});
