'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import {
    executeBrandStrategy,
    generateMarketingPlan,
    analyzeBrandPositioning,
    analyzeCompetitiveLandscape,
    type BrandStrategyInput,
    type BrandStrategyOutput,
    BrandStrategyInputSchema
} from '@/services/strands/brand-strategy-service';

// Enhanced brand strategy action schemas
const EnhancedMarketingPlanSchema = z.object({
    agentName: z.string().min(1, 'Agent name is required'),
    location: z.string().min(1, 'Location is required'),
    specialization: z.string().optional(),
    yearsExperience: z.number().min(0).max(50).optional(),
    uniqueValueProposition: z.string().optional(),
    marketFocus: z.enum(['luxury-homes', 'first-time-buyers', 'investment-properties', 'commercial-real-estate', 'new-construction', 'relocation-services']).optional(),
    brandPersonality: z.enum(['professional-expert', 'friendly-advisor', 'luxury-specialist', 'tech-savvy-innovator', 'community-focused', 'results-driven']).default('professional-expert'),
    targetClientTypes: z.array(z.string()).default(['buyers', 'sellers']),
    priceRange: z.string().optional(),
    includeCompetitorAnalysis: z.boolean().default(true),
    includeContentStrategy: z.boolean().default(true),
    includeSWOTAnalysis: z.boolean().default(true),
});

const BrandPositioningSchema = z.object({
    agentName: z.string().min(1, 'Agent name is required'),
    location: z.string().min(1, 'Location is required'),
    specialization: z.string().optional(),
    yearsExperience: z.number().min(0).max(50).optional(),
    uniqueValueProposition: z.string().optional(),
    marketFocus: z.enum(['luxury-homes', 'first-time-buyers', 'investment-properties', 'commercial-real-estate', 'new-construction', 'relocation-services']).optional(),
    brandPersonality: z.enum(['professional-expert', 'friendly-advisor', 'luxury-specialist', 'tech-savvy-innovator', 'community-focused', 'results-driven']).default('professional-expert'),
    knownCompetitors: z.array(z.string()).optional(),
    competitiveAdvantages: z.array(z.string()).optional(),
});

const CompetitiveAnalysisSchema = z.object({
    agentName: z.string().min(1, 'Agent name is required'),
    location: z.string().min(1, 'Location is required'),
    specialization: z.string().optional(),
    marketFocus: z.enum(['luxury-homes', 'first-time-buyers', 'investment-properties', 'commercial-real-estate', 'new-construction', 'relocation-services']).optional(),
    knownCompetitors: z.array(z.string()).optional(),
});

/**
 * Enhanced Marketing Plan Generation Action
 */
export async function generateEnhancedMarketingPlanAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: BrandStrategyOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to generate marketing plans' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            agentName: formData.get('agentName')?.toString() || '',
            location: formData.get('location')?.toString() || '',
            specialization: formData.get('specialization')?.toString() || undefined,
            yearsExperience: formData.get('yearsExperience') ? parseInt(formData.get('yearsExperience')!.toString()) : undefined,
            uniqueValueProposition: formData.get('uniqueValueProposition')?.toString() || undefined,
            marketFocus: formData.get('marketFocus')?.toString() || undefined,
            brandPersonality: formData.get('brandPersonality')?.toString() || 'professional-expert',
            targetClientTypes: formData.get('targetClientTypes')?.toString().split(',').filter(Boolean) || ['buyers', 'sellers'],
            priceRange: formData.get('priceRange')?.toString() || undefined,
            includeCompetitorAnalysis: formData.get('includeCompetitorAnalysis') === 'true',
            includeContentStrategy: formData.get('includeContentStrategy') === 'true',
            includeSWOTAnalysis: formData.get('includeSWOTAnalysis') === 'true',
        };

        const validatedFields = EnhancedMarketingPlanSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        console.log('🎯 Starting enhanced marketing plan generation with Strands capabilities...');

        // Try enhanced brand strategy service first
        try {
            const enhancedResult = await generateMarketingPlan(
                validatedFields.data.agentName,
                validatedFields.data.location,
                user.id,
                {
                    specialization: validatedFields.data.specialization,
                    yearsExperience: validatedFields.data.yearsExperience,
                    uniqueValueProposition: validatedFields.data.uniqueValueProposition,
                    marketFocus: validatedFields.data.marketFocus as any,
                    brandPersonality: validatedFields.data.brandPersonality as any,
                    targetClientTypes: validatedFields.data.targetClientTypes,
                    priceRange: validatedFields.data.priceRange,
                    includeCompetitorAnalysis: validatedFields.data.includeCompetitorAnalysis,
                    includeContentStrategy: validatedFields.data.includeContentStrategy,
                    includeSWOTAnalysis: validatedFields.data.includeSWOTAnalysis,
                }
            );

            if (enhancedResult.success && enhancedResult.strategy) {
                console.log('✅ Enhanced marketing plan generation completed successfully');

                return {
                    message: 'success',
                    data: enhancedResult,
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced marketing plan generation failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock marketing plan generation');
        const { generateMarketingPlan: bedrockGenerateMarketingPlan } = await import('@/aws/bedrock/flows/generate-marketing-plan');

        const result = await bedrockGenerateMarketingPlan({
            agentName: validatedFields.data.agentName,
            location: validatedFields.data.location,
            specialization: validatedFields.data.specialization || '',
            yearsExperience: validatedFields.data.yearsExperience || 0,
        });

        return {
            message: 'success',
            data: {
                success: true,
                strategy: result.plan,
                source: 'bedrock-agent',
                timestamp: new Date().toISOString(),
                userId: user.id,
            } as BrandStrategyOutput,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Marketing plan generation failed:', error);
        return {
            message: `Marketing plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Enhanced Brand Positioning Analysis Action
 */
export async function analyzeBrandPositioningAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: BrandStrategyOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to analyze brand positioning' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            agentName: formData.get('agentName')?.toString() || '',
            location: formData.get('location')?.toString() || '',
            specialization: formData.get('specialization')?.toString() || undefined,
            yearsExperience: formData.get('yearsExperience') ? parseInt(formData.get('yearsExperience')!.toString()) : undefined,
            uniqueValueProposition: formData.get('uniqueValueProposition')?.toString() || undefined,
            marketFocus: formData.get('marketFocus')?.toString() || undefined,
            brandPersonality: formData.get('brandPersonality')?.toString() || 'professional-expert',
            knownCompetitors: formData.get('knownCompetitors')?.toString().split(',').filter(Boolean) || [],
            competitiveAdvantages: formData.get('competitiveAdvantages')?.toString().split(',').filter(Boolean) || [],
        };

        const validatedFields = BrandPositioningSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        console.log('🎯 Starting enhanced brand positioning analysis...');

        const result = await analyzeBrandPositioning(
            validatedFields.data.agentName,
            validatedFields.data.location,
            user.id,
            {
                specialization: validatedFields.data.specialization,
                yearsExperience: validatedFields.data.yearsExperience,
                uniqueValueProposition: validatedFields.data.uniqueValueProposition,
                marketFocus: validatedFields.data.marketFocus as any,
                brandPersonality: validatedFields.data.brandPersonality as any,
                knownCompetitors: validatedFields.data.knownCompetitors,
                competitiveAdvantages: validatedFields.data.competitiveAdvantages,
            }
        );

        if (result.success && result.strategy) {
            console.log('✅ Brand positioning analysis completed successfully');

            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Brand positioning analysis failed');
        }

    } catch (error) {
        console.error('❌ Brand positioning analysis failed:', error);
        return {
            message: `Brand positioning analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Enhanced Competitive Analysis Action
 */
export async function analyzeCompetitiveLandscapeAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: BrandStrategyOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to analyze competitive landscape' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            agentName: formData.get('agentName')?.toString() || '',
            location: formData.get('location')?.toString() || '',
            specialization: formData.get('specialization')?.toString() || undefined,
            marketFocus: formData.get('marketFocus')?.toString() || undefined,
            knownCompetitors: formData.get('knownCompetitors')?.toString().split(',').filter(Boolean) || [],
        };

        const validatedFields = CompetitiveAnalysisSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        console.log('🎯 Starting enhanced competitive landscape analysis...');

        // Try enhanced competitive analysis first
        try {
            const enhancedResult = await analyzeCompetitiveLandscape(
                validatedFields.data.agentName,
                validatedFields.data.location,
                user.id,
                validatedFields.data.specialization
            );

            if (enhancedResult.success && enhancedResult.strategy) {
                console.log('✅ Enhanced competitive analysis completed successfully');

                return {
                    message: 'success',
                    data: enhancedResult,
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced competitive analysis failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock competitor analysis');
        const { findCompetitors } = await import('@/aws/bedrock/flows/find-competitors');

        const result = await findCompetitors({
            location: validatedFields.data.location,
            specialization: validatedFields.data.specialization || 'real estate',
        });

        return {
            message: 'success',
            data: {
                success: true,
                strategy: `# Competitive Analysis: ${validatedFields.data.location}\n\n${result.analysis}`,
                competitiveAnalysis: {
                    directCompetitors: result.competitors?.map(comp => ({
                        name: comp.name,
                        strengths: comp.strengths || [],
                        weaknesses: comp.weaknesses || [],
                        marketShare: comp.marketShare,
                    })) || [],
                    marketGaps: result.marketGaps || [],
                    competitiveAdvantages: result.opportunities || [],
                },
                source: 'bedrock-agent',
                timestamp: new Date().toISOString(),
                userId: user.id,
            } as BrandStrategyOutput,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Competitive analysis failed:', error);
        return {
            message: `Competitive analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Generic Brand Strategy Execution Action
 */
export async function executeBrandStrategyAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: BrandStrategyOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to execute brand strategy' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            strategyType: formData.get('strategyType')?.toString() || 'marketing-plan',
            agentName: formData.get('agentName')?.toString() || '',
            location: formData.get('location')?.toString() || '',
            specialization: formData.get('specialization')?.toString() || undefined,
            yearsExperience: formData.get('yearsExperience') ? parseInt(formData.get('yearsExperience')!.toString()) : undefined,
            uniqueValueProposition: formData.get('uniqueValueProposition')?.toString() || undefined,
            marketFocus: formData.get('marketFocus')?.toString() || undefined,
            brandPersonality: formData.get('brandPersonality')?.toString() || 'professional-expert',
            targetClientTypes: formData.get('targetClientTypes')?.toString().split(',').filter(Boolean) || ['buyers', 'sellers'],
            priceRange: formData.get('priceRange')?.toString() || undefined,
            geographicFocus: formData.get('geographicFocus')?.toString() || undefined,
            knownCompetitors: formData.get('knownCompetitors')?.toString().split(',').filter(Boolean) || [],
            competitiveAdvantages: formData.get('competitiveAdvantages')?.toString().split(',').filter(Boolean) || [],
            includeCompetitorAnalysis: formData.get('includeCompetitorAnalysis') === 'true',
            includeMarketResearch: formData.get('includeMarketResearch') === 'true',
            includeContentStrategy: formData.get('includeContentStrategy') === 'true',
            includeSWOTAnalysis: formData.get('includeSWOTAnalysis') === 'true',
            includeActionPlan: formData.get('includeActionPlan') === 'true',
        };

        const validatedFields = BrandStrategyInputSchema.safeParse({
            ...rawData,
            userId: user.id,
        });

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        console.log(`🎯 Starting brand strategy execution: ${validatedFields.data.strategyType}`);

        const result = await executeBrandStrategy(validatedFields.data);

        if (result.success && result.strategy) {
            console.log('✅ Brand strategy execution completed successfully');

            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Brand strategy execution failed');
        }

    } catch (error) {
        console.error('❌ Brand strategy execution failed:', error);
        return {
            message: `Brand strategy execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Convenience action for quick marketing plan generation
 */
export async function quickMarketingPlanAction(
    agentName: string,
    location: string,
    specialization?: string
): Promise<BrandStrategyOutput> {
    const user = await getCurrentUserServer();
    if (!user) {
        throw new Error('Authentication required');
    }

    return await generateMarketingPlan(agentName, location, user.id, {
        specialization,
        includeCompetitorAnalysis: true,
        includeContentStrategy: true,
        includeSWOTAnalysis: true,
        includeActionPlan: true,
    });
}

/**
 * Convenience action for quick competitive analysis
 */
export async function quickCompetitiveAnalysisAction(
    agentName: string,
    location: string,
    specialization?: string
): Promise<BrandStrategyOutput> {
    const user = await getCurrentUserServer();
    if (!user) {
        throw new Error('Authentication required');
    }

    return await analyzeCompetitiveLandscape(agentName, location, user.id, specialization);
}