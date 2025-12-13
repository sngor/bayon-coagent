'use server';

/**
 * Enhanced Market Intelligence Actions using Strands-Inspired Analysis
 * 
 * These actions replace your existing market analysis actions with
 * intelligent market intelligence, trend analysis, and opportunity identification.
 */

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';
import {
    executeMarketIntelligence,
    generateMarketUpdate,
    analyzeTrends,
    identifyOpportunities,
    type MarketIntelligenceInput,
    type MarketIntelligenceOutput,
    MarketAnalysisTypeSchema,
    TimePeriodSchema,
    MarketSegmentSchema
} from '@/services/strands/market-intelligence-service';

// Enhanced market update schema
const enhancedMarketUpdateSchema = z.object({
    location: z.string().min(1, 'Location is required'),
    timePeriod: TimePeriodSchema.default('current'),
    marketSegment: MarketSegmentSchema.default('residential'),
    targetAudience: z.enum(['agents', 'buyers', 'sellers', 'investors']).default('agents'),
    includeWebResearch: z.boolean().default(true),
    includeHistoricalData: z.boolean().default(true),
    includePredictiveModeling: z.boolean().default(true),
});

// Trend analysis schema
const trendAnalysisSchema = z.object({
    location: z.string().min(1, 'Location is required'),
    timePeriod: TimePeriodSchema.default('yearly'),
    marketSegment: MarketSegmentSchema.default('residential'),
    includeWebResearch: z.boolean().default(true),
    includeCompetitiveAnalysis: z.boolean().default(false),
});

// Opportunity identification schema
const opportunityAnalysisSchema = z.object({
    location: z.string().min(1, 'Location is required'),
    targetAudience: z.enum(['agents', 'buyers', 'sellers', 'investors']).default('agents'),
    marketSegment: MarketSegmentSchema.default('residential'),
    priceRange: z.string().optional(),
    includeInvestmentMetrics: z.boolean().default(false),
});

// Universal market analysis schema
const universalMarketAnalysisSchema = z.object({
    analysisType: MarketAnalysisTypeSchema,
    location: z.string().min(1, 'Location is required'),
    timePeriod: TimePeriodSchema.default('current'),
    marketSegment: MarketSegmentSchema.default('residential'),
    targetAudience: z.enum(['agents', 'buyers', 'sellers', 'investors']).default('agents'),
    includeWebResearch: z.boolean().default(true),
    includeHistoricalData: z.boolean().default(true),
    includeCompetitiveAnalysis: z.boolean().default(false),
    includePredictiveModeling: z.boolean().default(true),
    includeInvestmentMetrics: z.boolean().default(false),
    priceRange: z.string().optional(),
    propertyType: z.string().optional(),
});

/**
 * Enhanced Market Update Action
 * Replaces: generateMarketUpdateAction
 */
export async function generateEnhancedMarketUpdateAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: MarketIntelligenceOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate market updates' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = enhancedMarketUpdateSchema.safeParse({
        location: formData.get('location'),
        timePeriod: formData.get('timePeriod') || 'current',
        marketSegment: formData.get('marketSegment') || 'residential',
        targetAudience: formData.get('targetAudience') || 'agents',
        includeWebResearch: formData.get('includeWebResearch') !== 'false',
        includeHistoricalData: formData.get('includeHistoricalData') !== 'false',
        includePredictiveModeling: formData.get('includePredictiveModeling') !== 'false',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.location?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('📊 Starting enhanced market update generation...');

        // Try enhanced market intelligence first
        try {
            const result = await generateMarketUpdate(
                validatedFields.data.location,
                user.id,
                {
                    timePeriod: validatedFields.data.timePeriod,
                    marketSegment: validatedFields.data.marketSegment,
                    targetAudience: validatedFields.data.targetAudience,
                    includeWebResearch: validatedFields.data.includeWebResearch,
                    includeHistoricalData: validatedFields.data.includeHistoricalData,
                    includePredictiveModeling: validatedFields.data.includePredictiveModeling,
                }
            );

            if (result.success) {
                console.log('✅ Enhanced market update generated successfully');
                return {
                    message: 'success',
                    data: result,
                    errors: {},
                };
            } else {
                throw new Error(result.error || 'Enhanced market update generation failed');
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced market update failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock market update generation');
        const { generateMarketUpdate: originalGenerateMarketUpdate } = await import('@/aws/bedrock/flows/generate-market-update');

        const bedrockResult = await originalGenerateMarketUpdate({
            location: validatedFields.data.location,
            timePeriod: validatedFields.data.timePeriod,
            audience: validatedFields.data.targetAudience,
        });

        // Transform to match MarketIntelligenceOutput format
        const transformedResult: MarketIntelligenceOutput = {
            success: true,
            analysis: bedrockResult.content,
            timestamp: new Date().toISOString(),
            userId: user.id,
            source: 'bedrock-fallback',
        };

        return {
            message: 'success',
            data: transformedResult,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Market update generation failed:', error);
        return {
            message: `Market update generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Enhanced Trend Analysis Action
 * New capability - analyzes market trends with confidence scoring
 */
export async function generateEnhancedTrendAnalysisAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: MarketIntelligenceOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate trend analysis' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = trendAnalysisSchema.safeParse({
        location: formData.get('location'),
        timePeriod: formData.get('timePeriod') || 'yearly',
        marketSegment: formData.get('marketSegment') || 'residential',
        includeWebResearch: formData.get('includeWebResearch') !== 'false',
        includeCompetitiveAnalysis: formData.get('includeCompetitiveAnalysis') === 'true',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.location?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('📈 Starting enhanced trend analysis...');

        const result = await analyzeTrends(
            validatedFields.data.location,
            user.id,
            validatedFields.data.timePeriod,
            {
                marketSegment: validatedFields.data.marketSegment,
                includeWebResearch: validatedFields.data.includeWebResearch,
                includeCompetitiveAnalysis: validatedFields.data.includeCompetitiveAnalysis,
            }
        );

        if (result.success) {
            console.log('✅ Enhanced trend analysis generated successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Trend analysis failed');
        }

    } catch (error) {
        console.error('❌ Trend analysis failed:', error);
        return {
            message: `Trend analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Enhanced Opportunity Identification Action
 * New capability - identifies market opportunities with priority scoring
 */
export async function generateEnhancedOpportunityAnalysisAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: MarketIntelligenceOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate opportunity analysis' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = opportunityAnalysisSchema.safeParse({
        location: formData.get('location'),
        targetAudience: formData.get('targetAudience') || 'agents',
        marketSegment: formData.get('marketSegment') || 'residential',
        priceRange: formData.get('priceRange') || undefined,
        includeInvestmentMetrics: formData.get('includeInvestmentMetrics') === 'true',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.location?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🎯 Starting enhanced opportunity analysis...');

        const result = await identifyOpportunities(
            validatedFields.data.location,
            user.id,
            validatedFields.data.targetAudience,
            {
                marketSegment: validatedFields.data.marketSegment,
                priceRange: validatedFields.data.priceRange,
                includeInvestmentMetrics: validatedFields.data.includeInvestmentMetrics,
            }
        );

        if (result.success) {
            console.log('✅ Enhanced opportunity analysis generated successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Opportunity analysis failed');
        }

    } catch (error) {
        console.error('❌ Opportunity analysis failed:', error);
        return {
            message: `Opportunity analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Enhanced Future Forecast Action
 * Replaces: generateFutureCastAction
 */
export async function generateEnhancedFutureForecastAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: MarketIntelligenceOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate future forecasts' },
            data: null,
        };
    }

    const location = formData.get('location') as string;
    const timePeriod = formData.get('timePeriod') as string || '3-year';
    const propertyType = formData.get('propertyType') as string || 'residential';

    if (!location) {
        return {
            message: 'Location is required',
            errors: { location: ['Location is required'] },
            data: null,
        };
    }

    try {
        console.log('🔮 Starting enhanced future forecast...');

        // Try enhanced market intelligence first
        try {
            const result = await executeMarketIntelligence({
                analysisType: 'future-forecast',
                location,
                userId: user.id,
                timePeriod: timePeriod as any,
                marketSegment: propertyType as any,
                includeWebResearch: true,
                includeHistoricalData: true,
                includePredictiveModeling: true,
                targetAudience: 'agents',
            });

            if (result.success) {
                console.log('✅ Enhanced future forecast generated successfully');
                return {
                    message: 'success',
                    data: result,
                    errors: {},
                };
            } else {
                throw new Error(result.error || 'Enhanced future forecast failed');
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced future forecast failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock future cast generation');
        const { generateFutureCast } = await import('@/aws/bedrock/flows/generate-future-cast');

        const bedrockResult = await generateFutureCast({
            location,
            timePeriod,
            propertyType,
        });

        // Transform to match MarketIntelligenceOutput format
        const transformedResult: MarketIntelligenceOutput = {
            success: true,
            analysis: bedrockResult.futureCast,
            timestamp: new Date().toISOString(),
            userId: user.id,
            source: 'bedrock-fallback',
        };

        return {
            message: 'success',
            data: transformedResult,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Future forecast generation failed:', error);
        return {
            message: `Future forecast generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Universal Market Analysis Action
 * Handles any market analysis type with unified interface
 */
export async function generateUniversalMarketAnalysisAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: MarketIntelligenceOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate market analysis' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = universalMarketAnalysisSchema.safeParse({
        analysisType: formData.get('analysisType'),
        location: formData.get('location'),
        timePeriod: formData.get('timePeriod') || 'current',
        marketSegment: formData.get('marketSegment') || 'residential',
        targetAudience: formData.get('targetAudience') || 'agents',
        includeWebResearch: formData.get('includeWebResearch') !== 'false',
        includeHistoricalData: formData.get('includeHistoricalData') !== 'false',
        includeCompetitiveAnalysis: formData.get('includeCompetitiveAnalysis') === 'true',
        includePredictiveModeling: formData.get('includePredictiveModeling') !== 'false',
        includeInvestmentMetrics: formData.get('includeInvestmentMetrics') === 'true',
        priceRange: formData.get('priceRange') || undefined,
        propertyType: formData.get('propertyType') || undefined,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.analysisType?.[0] || fieldErrors.location?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log(`📊 Starting universal market analysis: ${validatedFields.data.analysisType} for ${validatedFields.data.location}`);

        // Build input object
        const input: MarketIntelligenceInput = {
            analysisType: validatedFields.data.analysisType,
            location: validatedFields.data.location,
            userId: user.id,
            timePeriod: validatedFields.data.timePeriod,
            marketSegment: validatedFields.data.marketSegment,
            targetAudience: validatedFields.data.targetAudience,
            includeWebResearch: validatedFields.data.includeWebResearch,
            includeHistoricalData: validatedFields.data.includeHistoricalData,
            includeCompetitiveAnalysis: validatedFields.data.includeCompetitiveAnalysis,
            includePredictiveModeling: validatedFields.data.includePredictiveModeling,
            includeInvestmentMetrics: validatedFields.data.includeInvestmentMetrics,
            priceRange: validatedFields.data.priceRange,
            propertyType: validatedFields.data.propertyType,
        };

        const result = await executeMarketIntelligence(input);

        if (result.success) {
            console.log('✅ Universal market analysis generated successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Market analysis failed');
        }

    } catch (error) {
        console.error('❌ Universal market analysis failed:', error);
        return {
            message: `Market analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Batch Market Analysis Action
 * Generates multiple market analyses for different locations or segments
 */
export async function generateBatchMarketAnalysisAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: { analyses: MarketIntelligenceOutput[]; summary: any } | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate batch market analysis' },
            data: null,
        };
    }

    const analysisType = formData.get('analysisType') as string;
    const locationsData = formData.get('locations') as string;
    const targetAudience = formData.get('targetAudience') as string || 'agents';

    if (!analysisType || !locationsData) {
        return {
            message: 'Analysis type and locations are required',
            errors: { validation: 'Missing required fields' },
            data: null,
        };
    }

    try {
        const locations = JSON.parse(locationsData);
        console.log(`📊 Starting batch market analysis for ${locations.length} locations...`);

        const results = await Promise.all(
            locations.map(async (location: string) => {
                try {
                    return await executeMarketIntelligence({
                        analysisType: analysisType as any,
                        location,
                        userId: user.id,
                        targetAudience: targetAudience as any,
                        includeWebResearch: true,
                        includeHistoricalData: true,
                        includePredictiveModeling: true,
                        timePeriod: 'current',
                        marketSegment: 'residential',
                    });
                } catch (error) {
                    console.error(`Failed to analyze ${location}:`, error);
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: new Date().toISOString(),
                        userId: user.id,
                        source: 'batch-market-analysis',
                    } as MarketIntelligenceOutput;
                }
            })
        );

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ Batch market analysis completed: ${successful.length} successful, ${failed.length} failed`);

        return {
            message: 'success',
            data: {
                analyses: results,
                summary: {
                    total: results.length,
                    successful: successful.length,
                    failed: failed.length,
                    locations: locations,
                    analysisType,
                }
            },
            errors: {},
        };

    } catch (error) {
        console.error('❌ Batch market analysis failed:', error);
        return {
            message: `Batch market analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}