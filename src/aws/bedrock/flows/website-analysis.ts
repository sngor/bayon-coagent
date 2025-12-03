'use server';

/**
 * @fileOverview Bedrock flow for website analysis and AI Engine Optimization (AEO) auditing.
 * 
 * This flow analyzes real estate agent websites for AI optimization, including:
 * - Website crawling and HTML extraction
 * - Schema markup detection and validation
 * - Meta tags analysis (title, description, OG, Twitter)
 * - NAP consistency checking
 * - AI-powered recommendations generation
 * 
 * Requirements: 1.2, 2.1, 3.1, 4.1, 5.1, 6.1
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
    websiteAnalysisInputSchema,
    websiteAnalysisResultSchema,
    type WebsiteAnalysisInput,
    type WebsiteAnalysisResult,
    type SchemaData,
    type MetaTagData,
    type NAPData,
} from '@/ai/schemas/website-analysis-schemas';
import { crawlWebsite, type CrawledData } from '@/lib/website-crawler';
import { z } from 'zod';
import { websiteAnalysisMetrics, categorizeError } from '@/aws/logging/website-analysis-metrics';
import { createLogger, generateCorrelationId } from '@/aws/logging/logger';

// ==================== Internal Schemas ====================

/**
 * Schema for AI analysis input (extracted data)
 */
const aiAnalysisInputSchema = z.object({
    url: z.string(),
    schemaData: z.any(),
    metaTagData: z.any(),
    napData: z.any(),
    profileData: z.object({
        name: z.string(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
    }),
});

// ==================== Crawling Functions ====================
// Note: Crawling functions have been moved to @/lib/website-crawler
// This keeps the flow focused on orchestration and AI analysis

// ==================== Extraction Functions ====================

/**
 * Extract schema.org markup from HTML
 * Handles malformed HTML and invalid JSON gracefully
 */
function extractSchemaMarkup(html: string): SchemaData {
    const schemas: any[] = [];
    const types: string[] = [];

    if (!html || typeof html !== 'string') {
        console.warn('[extractSchemaMarkup] Invalid HTML input');
        return { found: false, types: [], schemas: [] };
    }

    try {
        // Extract JSON-LD scripts
        const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;

        while ((match = jsonLdRegex.exec(html)) !== null) {
            try {
                const jsonContent = match[1].trim();
                // Clean up common JSON issues
                const cleanedJson = jsonContent
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
                    .replace(/,\s*}/g, '}') // Remove trailing commas
                    .replace(/,\s*]/g, ']');

                const schema = JSON.parse(cleanedJson);
                schemas.push(schema);

                // Extract @type
                if (schema['@type']) {
                    const type = Array.isArray(schema['@type']) ? schema['@type'][0] : schema['@type'];
                    if (type && !types.includes(type)) {
                        types.push(type);
                    }
                }
            } catch (error) {
                console.warn('[extractSchemaMarkup] Failed to parse JSON-LD:', error);
                // Continue with other schemas
            }
        }

        // Extract microdata (basic detection)
        const microdataRegex = /itemscope[^>]*itemtype=["']([^"']+)["']/gi;
        while ((match = microdataRegex.exec(html)) !== null) {
            try {
                const itemType = match[1];
                const typeName = itemType.split('/').pop() || itemType;
                if (typeName && !types.includes(typeName)) {
                    types.push(typeName);
                }
            } catch (error) {
                console.warn('[extractSchemaMarkup] Failed to parse microdata:', error);
            }
        }
    } catch (error) {
        console.error('[extractSchemaMarkup] Unexpected error:', error);
        // Return empty result rather than throwing
    }

    return {
        found: schemas.length > 0 || types.length > 0,
        types,
        schemas,
    };
}

/**
 * Extract meta tags from HTML
 * Handles malformed HTML gracefully
 */
function extractMetaTags(html: string): MetaTagData {
    if (!html || typeof html !== 'string') {
        console.warn('[extractMetaTags] Invalid HTML input');
        return {
            title: { content: '', length: 0 },
            description: { content: undefined, length: 0 },
            openGraph: {},
            twitterCard: {},
        };
    }

    try {
        // Extract title - handle HTML entities
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        let titleContent = titleMatch ? titleMatch[1].trim() : '';
        // Decode common HTML entities
        titleContent = titleContent
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');

        // Extract meta description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
        let descContent = descMatch ? descMatch[1].trim() : '';
        // Decode HTML entities in description
        descContent = descContent
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ');

        // Extract Open Graph tags
        const openGraph: Record<string, string> = {};
        try {
            const ogRegex = /<meta[^>]*property=["']og:([^"']*)["'][^>]*content=["']([^"']*)["']/gi;
            let ogMatch;
            while ((ogMatch = ogRegex.exec(html)) !== null) {
                if (ogMatch[1] && ogMatch[2]) {
                    openGraph[ogMatch[1]] = ogMatch[2];
                }
            }
        } catch (error) {
            console.warn('[extractMetaTags] Failed to extract Open Graph tags:', error);
        }

        // Extract Twitter Card tags
        const twitterCard: Record<string, string> = {};
        try {
            const twitterRegex = /<meta[^>]*name=["']twitter:([^"']*)["'][^>]*content=["']([^"']*)["']/gi;
            let twitterMatch;
            while ((twitterMatch = twitterRegex.exec(html)) !== null) {
                if (twitterMatch[1] && twitterMatch[2]) {
                    twitterCard[twitterMatch[1]] = twitterMatch[2];
                }
            }
        } catch (error) {
            console.warn('[extractMetaTags] Failed to extract Twitter Card tags:', error);
        }

        return {
            title: {
                content: titleContent || '',
                length: titleContent.length,
            },
            description: {
                content: descContent || undefined,
                length: descContent.length,
            },
            openGraph,
            twitterCard,
        };
    } catch (error) {
        console.error('[extractMetaTags] Unexpected error:', error);
        return {
            title: { content: '', length: 0 },
            description: { content: undefined, length: 0 },
            openGraph: {},
            twitterCard: {},
        };
    }
}

/**
 * Extract NAP (Name, Address, Phone) data from HTML
 * Handles malformed HTML and edge cases gracefully
 */
function extractNAPData(html: string): NAPData {
    if (!html || typeof html !== 'string') {
        console.warn('[extractNAPData] Invalid HTML input');
        return { phones: [], emails: [], addresses: [], names: undefined };
    }

    try {
        // Remove HTML tags for text extraction, handle malformed HTML
        let text = '';
        try {
            text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ') // Remove scripts
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ') // Remove styles
                .replace(/<[^>]*>/g, ' ') // Remove all tags
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
        } catch (error) {
            console.warn('[extractNAPData] Failed to clean HTML:', error);
            text = html; // Use raw HTML as fallback
        }

        // Extract phone numbers (US format with various separators)
        const phones: string[] = [];
        try {
            const phonePattern = /\b(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;
            let phoneMatch;
            while ((phoneMatch = phonePattern.exec(text)) !== null) {
                const phone = phoneMatch[0].trim();
                if (phone && !phones.includes(phone)) {
                    phones.push(phone);
                }
            }
        } catch (error) {
            console.warn('[extractNAPData] Failed to extract phones:', error);
        }

        // Extract email addresses
        const emails: string[] = [];
        try {
            const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
            let emailMatch;
            while ((emailMatch = emailPattern.exec(text)) !== null) {
                const email = emailMatch[0].toLowerCase();
                if (email && !emails.includes(email)) {
                    emails.push(email);
                }
            }
        } catch (error) {
            console.warn('[extractNAPData] Failed to extract emails:', error);
        }

        // Extract addresses (basic pattern - street number + street name)
        const addresses: string[] = [];
        try {
            const addressPattern = /\b\d+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way)\b/gi;
            let addressMatch;
            while ((addressMatch = addressPattern.exec(text)) !== null) {
                const address = addressMatch[0].trim();
                if (address && !addresses.includes(address)) {
                    addresses.push(address);
                }
            }
        } catch (error) {
            console.warn('[extractNAPData] Failed to extract addresses:', error);
        }

        // Extract potential business names (from schema or title)
        const names: string[] = [];
        try {
            const schemaData = extractSchemaMarkup(html);
            for (const schema of schemaData.schemas) {
                if (schema && schema.name && typeof schema.name === 'string') {
                    const name = schema.name.trim();
                    if (name && !names.includes(name)) {
                        names.push(name);
                    }
                }
            }
        } catch (error) {
            console.warn('[extractNAPData] Failed to extract names from schema:', error);
        }

        return {
            phones,
            emails,
            addresses,
            names: names.length > 0 ? names : undefined,
        };
    } catch (error) {
        console.error('[extractNAPData] Unexpected error:', error);
        return { phones: [], emails: [], addresses: [], names: undefined };
    }
}

// ==================== AI Analysis Prompt ====================

const websiteAnalysisPrompt = definePrompt({
    name: 'websiteAnalysisPrompt',
    inputSchema: aiAnalysisInputSchema,
    outputSchema: websiteAnalysisResultSchema,
    options: MODEL_CONFIGS.ANALYTICAL,
    prompt: `You are an expert in AI Engine Optimization (AEO) and technical SEO for real estate professionals.

**Website Being Analyzed:** {{{url}}}

**Extracted Data:**

Schema Markup:
{{{json schemaData}}}

Meta Tags:
{{{json metaTagData}}}

NAP Data Found:
{{{json napData}}}

Agent Profile Data:
{{{json profileData}}}

**Your Task:**

Analyze this website for AI optimization and provide a comprehensive analysis with the following structure:

1. **Overall Score (0-100)** with breakdown:
   - schemaMarkup (0-30): Quality and completeness of schema.org markup
   - metaTags (0-25): Quality of title, description, OG, Twitter tags
   - structuredData (0-25): Overall structured data quality
   - napConsistency (0-20): NAP consistency across site and with profile

2. **Schema Markup Analysis:**
   - What schema types are present?
   - What key properties are included?
   - What's missing or invalid?
   - Specific recommendations with code examples

3. **Meta Tags Analysis:**
   - Evaluate title tag (length, quality, keywords)
   - Evaluate meta description (length, quality, call-to-action)
   - Check Open Graph tags
   - Check Twitter Card tags
   - Flag issues and provide recommendations

4. **NAP Consistency:**
   - Compare NAP data found on website with profile data
   - Identify any inconsistencies
   - Calculate consistency score
   - Provide recommendations for fixes

5. **Prioritized Recommendations:**
   Each recommendation must include:
   - id: unique identifier (use format "rec-1", "rec-2", etc.)
   - priority: high, medium, or low
   - category: schema_markup, meta_tags, structured_data, nap_consistency, or technical_seo
   - title: short, actionable title
   - description: detailed explanation
   - actionItems: 2-4 specific steps (array of strings)
   - codeSnippet: example code (for schema recommendations, optional for others)
   - estimatedImpact: score improvement (0-30)
   - effort: easy, moderate, or difficult

6. **Summary:**
   Brief overall assessment and key takeaways (2-3 sentences)

**Scoring Guidelines:**
- Schema Markup (0-30):
  - 25-30: Complete schema with Person/RealEstateAgent, LocalBusiness, proper properties
  - 15-24: Basic schema present but missing key types or properties
  - 5-14: Minimal or invalid schema
  - 0-4: No schema markup

- Meta Tags (0-25):
  - 20-25: All tags present, optimal lengths, well-crafted
  - 15-19: Most tags present, some length issues
  - 10-14: Basic tags only, multiple issues
  - 0-9: Missing critical tags

- Structured Data (0-25):
  - 20-25: Rich structured data, multiple formats, validated
  - 15-19: Good structured data with minor issues
  - 10-14: Basic structured data
  - 0-9: Little to no structured data

- NAP Consistency (0-20):
  - 18-20: Perfect consistency across site and with profile
  - 14-17: Minor inconsistencies (formatting)
  - 10-13: Some inconsistencies
  - 0-9: Major inconsistencies or missing data

**Important:**
- Generate a unique ID for the analysis (use format "analysis-{timestamp}")
- Use the provided userId in the response
- Set analyzedAt to the current ISO timestamp
- Ensure all scores are within their valid ranges
- Provide at least 3-5 actionable recommendations
- Prioritize recommendations by impact on AI discoverability`,
});

// ==================== Main Flow ====================

/**
 * Retry helper for Bedrock API calls
 * Implements exponential backoff for throttling errors
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            const errorMessage = lastError.message.toLowerCase();

            // Only retry on throttling or temporary errors
            const shouldRetry =
                errorMessage.includes('throttl') ||
                errorMessage.includes('rate limit') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('temporarily unavailable') ||
                errorMessage.includes('503') ||
                errorMessage.includes('502');

            if (!shouldRetry || attempt === maxRetries - 1) {
                throw lastError;
            }

            // Exponential backoff with jitter
            const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 1000;
            console.log(`[retryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Retry failed');
}

const websiteAnalysisFlow = defineFlow(
    {
        name: 'websiteAnalysisFlow',
        inputSchema: websiteAnalysisInputSchema,
        outputSchema: websiteAnalysisResultSchema,
    },
    async (input) => {
        // Initialize logging and metrics
        const correlationId = generateCorrelationId();
        const flowLogger = createLogger({
            correlationId,
            service: 'website-analysis',
            userId: input.userId,
            websiteUrl: input.websiteUrl,
        });

        const startTime = Date.now();
        let crawledData: any = null;
        let schemaData: any = null;
        let metaTagData: any = null;
        let napData: any = null;

        try {
            // Track analysis start
            await websiteAnalysisMetrics.trackAnalysisStarted(
                input.userId,
                input.websiteUrl,
                { correlationId }
            );

            flowLogger.info('Starting website analysis', {
                operation: 'analyzeWebsite',
            });

            // Step 1: Crawl website (with detailed error handling and timing)
            const crawlStartTime = Date.now();
            try {
                flowLogger.debug('Starting website crawl', {
                    operation: 'crawlWebsite',
                });

                crawledData = await crawlWebsite(input.websiteUrl);
                const crawlDuration = Date.now() - crawlStartTime;

                flowLogger.info('Website crawl completed', {
                    operation: 'crawlWebsite',
                    duration: crawlDuration,
                    pagesCrawled: crawledData.crawledUrls.length,
                });

                // Track crawl metrics
                await websiteAnalysisMetrics.trackCrawlDuration(
                    input.userId,
                    crawlDuration,
                    crawledData.crawledUrls.length,
                    { correlationId }
                );
            } catch (error) {
                const crawlDuration = Date.now() - crawlStartTime;
                flowLogger.error('Website crawl failed', error as Error, {
                    operation: 'crawlWebsite',
                    duration: crawlDuration,
                });

                // Re-throw crawl errors with user-friendly message
                throw new Error(
                    error instanceof Error
                        ? error.message
                        : 'Unable to access the website. Please verify the URL and try again.'
                );
            }

            // Step 2: Extract data from all pages (with error handling and timing)
            const extractionStartTime = Date.now();
            try {
                flowLogger.debug('Starting data extraction', {
                    operation: 'extractData',
                });

                const allHtml = [crawledData.homepage, ...crawledData.additionalPages].join('\n');

                schemaData = extractSchemaMarkup(allHtml);
                metaTagData = extractMetaTags(crawledData.homepage); // Use homepage for meta tags
                napData = extractNAPData(allHtml);

                const extractionDuration = Date.now() - extractionStartTime;

                flowLogger.info('Data extraction completed', {
                    operation: 'extractData',
                    duration: extractionDuration,
                    schemaTypesFound: schemaData.types.length,
                    phonesFound: napData.phones.length,
                    emailsFound: napData.emails.length,
                    addressesFound: napData.addresses.length,
                });

                // Track extraction metrics
                await websiteAnalysisMetrics.trackExtractionDuration(
                    input.userId,
                    extractionDuration,
                    schemaData.types.length,
                    { correlationId }
                );
            } catch (error) {
                const extractionDuration = Date.now() - extractionStartTime;
                flowLogger.warn('Data extraction failed, using partial data', {
                    operation: 'extractData',
                    duration: extractionDuration,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });

                // Continue with partial data if extraction fails
                schemaData = schemaData || { found: false, types: [], schemas: [] };
                metaTagData = metaTagData || {
                    title: { content: '', length: 0 },
                    description: { content: undefined, length: 0 },
                    openGraph: {},
                    twitterCard: {},
                };
                napData = napData || { phones: [], emails: [], addresses: [], names: undefined };
            }

            // Step 3: AI analysis with retry logic and timing
            const aiStartTime = Date.now();
            let analysis: WebsiteAnalysisResult;

            try {
                flowLogger.debug('Starting AI analysis', {
                    operation: 'aiAnalysis',
                });

                analysis = await retryWithBackoff(
                    async () => {
                        return await websiteAnalysisPrompt({
                            url: input.websiteUrl,
                            schemaData,
                            metaTagData,
                            napData,
                            profileData: input.profileData,
                        });
                    },
                    3, // Max 3 retries
                    1000 // Start with 1 second delay
                );

                const aiDuration = Date.now() - aiStartTime;

                flowLogger.info('AI analysis completed', {
                    operation: 'aiAnalysis',
                    duration: aiDuration,
                    score: analysis.overallScore,
                    recommendationsCount: analysis.recommendations?.length || 0,
                });

                // Track AI analysis metrics
                await websiteAnalysisMetrics.trackAIAnalysisDuration(
                    input.userId,
                    aiDuration,
                    { correlationId }
                );
            } catch (error) {
                const aiDuration = Date.now() - aiStartTime;
                flowLogger.error('AI analysis failed after retries', error as Error, {
                    operation: 'aiAnalysis',
                    duration: aiDuration,
                    retries: 3,
                });

                // Provide a more specific error message
                const errorMessage = error instanceof Error ? error.message : 'AI analysis failed';
                throw new Error(
                    `Unable to complete AI analysis: ${errorMessage}. Please try again in a few moments.`
                );
            }

            // Step 4: Validate and enhance response
            if (!analysis.id) {
                analysis.id = `analysis-${Date.now()}`;
            }

            if (!analysis.userId) {
                analysis.userId = input.userId;
            }

            if (!analysis.analyzedAt) {
                analysis.analyzedAt = new Date().toISOString();
            }

            if (!analysis.websiteUrl) {
                analysis.websiteUrl = input.websiteUrl;
            }

            // Ensure recommendations have unique IDs
            if (analysis.recommendations && Array.isArray(analysis.recommendations)) {
                analysis.recommendations = analysis.recommendations.map((rec, index) => ({
                    ...rec,
                    id: rec.id || `rec-${index + 1}`,
                }));
            } else {
                analysis.recommendations = [];
            }

            // Calculate total duration
            const totalDuration = Date.now() - startTime;

            flowLogger.info('Website analysis completed successfully', {
                operation: 'analyzeWebsite',
                duration: totalDuration,
                score: analysis.overallScore,
                pagesCrawled: crawledData.crawledUrls.length,
                schemaTypesFound: schemaData.types.length,
                recommendationsCount: analysis.recommendations.length,
            });

            // Track successful completion
            await websiteAnalysisMetrics.trackAnalysisCompleted(
                input.userId,
                input.websiteUrl,
                totalDuration,
                analysis.overallScore,
                crawledData.crawledUrls.length,
                schemaData.types.length,
                { correlationId }
            );

            return analysis;
        } catch (error) {
            // Calculate duration even on failure
            const totalDuration = Date.now() - startTime;

            // Categorize and track the error
            const errorType = categorizeError(error as Error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

            flowLogger.error('Website analysis failed', error as Error, {
                operation: 'analyzeWebsite',
                duration: totalDuration,
                errorType,
            });

            // Track failure metrics
            await websiteAnalysisMetrics.trackAnalysisFailed(
                input.userId,
                input.websiteUrl,
                errorType,
                error as Error,
                totalDuration,
                { correlationId }
            );

            // Determine error type and provide appropriate fallback
            const isCrawlError = errorMessage.includes('fetch') ||
                errorMessage.includes('timeout') ||
                errorMessage.includes('not found') ||
                errorMessage.includes('refused') ||
                errorMessage.includes('certificate');

            // Provide fallback response with helpful error information
            const fallbackAnalysis: WebsiteAnalysisResult = {
                id: `analysis-${Date.now()}`,
                userId: input.userId,
                websiteUrl: input.websiteUrl,
                analyzedAt: new Date().toISOString(),
                overallScore: 0,
                scoreBreakdown: {
                    schemaMarkup: 0,
                    metaTags: 0,
                    structuredData: 0,
                    napConsistency: 0,
                },
                schemaMarkup: {
                    found: false,
                    types: [],
                    properties: {},
                    issues: ['Unable to analyze schema markup due to processing error'],
                    recommendations: ['Please try again or contact support if the issue persists'],
                },
                metaTags: {
                    title: {
                        content: undefined,
                        length: 0,
                        isOptimal: false,
                        issues: ['Unable to analyze title tag'],
                    },
                    description: {
                        content: undefined,
                        length: 0,
                        isOptimal: false,
                        issues: ['Unable to analyze meta description'],
                    },
                    openGraph: {
                        found: false,
                        properties: {},
                        issues: ['Unable to analyze Open Graph tags'],
                    },
                    twitterCard: {
                        found: false,
                        properties: {},
                        issues: ['Unable to analyze Twitter Card tags'],
                    },
                },
                napConsistency: {
                    name: {
                        found: undefined,
                        matches: false,
                        confidence: 0,
                    },
                    address: {
                        found: undefined,
                        matches: false,
                        confidence: 0,
                    },
                    phone: {
                        found: undefined,
                        matches: false,
                        confidence: 0,
                    },
                    overallConsistency: 0,
                },
                recommendations: [
                    {
                        id: 'rec-error',
                        priority: 'high',
                        category: 'technical_seo',
                        title: isCrawlError ? 'Website Access Error' : 'Analysis Error',
                        description: errorMessage,
                        actionItems: isCrawlError
                            ? [
                                'Verify that the website URL is correct and includes http:// or https://',
                                'Check that the website is online and accessible in a browser',
                                'Ensure the website is not blocking automated crawlers',
                                'If the website uses a firewall or security service, it may be blocking our analysis',
                            ]
                            : [
                                'Try running the analysis again',
                                'If the error persists, contact support',
                                'Verify that your website URL is correct',
                            ],
                        estimatedImpact: 0,
                        effort: 'easy',
                    },
                ],
                summary: isCrawlError
                    ? 'Unable to access the website. Please verify the URL and ensure the website is publicly accessible.'
                    : 'Unable to complete website analysis due to an error. Please try again.',
            };

            // Re-throw the error so it can be handled by the action
            throw error;
        }
    }
);

/**
 * Analyzes a website for AI Engine Optimization (AEO)
 * 
 * This function crawls the website, extracts technical SEO elements,
 * and provides AI-powered recommendations for improving visibility
 * in AI search engines.
 * 
 * @param input - Website URL, user ID, and profile data
 * @returns Comprehensive analysis with scores, findings, and recommendations
 */
export async function analyzeWebsite(
    input: WebsiteAnalysisInput
): Promise<WebsiteAnalysisResult> {
    return websiteAnalysisFlow.execute(input);
}
