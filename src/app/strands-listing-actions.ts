'use server';

/**
 * Enhanced Listing Description Actions using Strands-Inspired Intelligence
 * 
 * These actions replace your existing listing description generation with
 * persona-aware, market-intelligent listing descriptions.
 */

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';
import {
    generateIntelligentListingDescription,
    generateSimpleListingDescription,
    type ListingDescriptionInput,
    type ListingDescriptionOutput,
    BuyerPersonaSchema,
    WritingStyleSchema,
    PropertyTypeSchema
} from '@/services/strands/listing-description-service';

// Enhanced listing description schema
const enhancedListingSchema = z.object({
    // Property details
    propertyType: PropertyTypeSchema,
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    squareFeet: z.string().optional(),
    lotSize: z.string().optional(),
    yearBuilt: z.string().optional(),
    price: z.string().optional(),

    // Location and features
    location: z.string().min(1, 'Location is required'),
    keyFeatures: z.string().min(1, 'Key features are required'),

    // Targeting and style
    buyerPersona: BuyerPersonaSchema,
    writingStyle: WritingStyleSchema.default('professional'),

    // Enhancement options
    includeMarketAnalysis: z.boolean().default(true),
    includeNeighborhoodInsights: z.boolean().default(true),
    includeSEOOptimization: z.boolean().default(true),
    includeCompetitiveAnalysis: z.boolean().default(false),
});

// Simple listing schema for quick generation
const simpleListingSchema = z.object({
    propertyType: PropertyTypeSchema,
    location: z.string().min(1, 'Location is required'),
    keyFeatures: z.string().min(1, 'Key features are required'),
    buyerPersona: BuyerPersonaSchema,
    bedrooms: z.string().optional(),
    bathrooms: z.string().optional(),
    price: z.string().optional(),
});

/**
 * Enhanced Listing Description Action
 * Replaces: generateNewListingDescriptionAction, optimizeListingDescriptionAction
 */
export async function generateEnhancedListingDescriptionAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ListingDescriptionOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate listing descriptions' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = enhancedListingSchema.safeParse({
        propertyType: formData.get('propertyType'),
        bedrooms: formData.get('bedrooms') || undefined,
        bathrooms: formData.get('bathrooms') || undefined,
        squareFeet: formData.get('squareFeet') || undefined,
        lotSize: formData.get('lotSize') || undefined,
        yearBuilt: formData.get('yearBuilt') || undefined,
        price: formData.get('price') || undefined,
        location: formData.get('location'),
        keyFeatures: formData.get('keyFeatures'),
        buyerPersona: formData.get('buyerPersona'),
        writingStyle: formData.get('writingStyle') || 'professional',
        includeMarketAnalysis: formData.get('includeMarketAnalysis') !== 'false',
        includeNeighborhoodInsights: formData.get('includeNeighborhoodInsights') !== 'false',
        includeSEOOptimization: formData.get('includeSEOOptimization') !== 'false',
        includeCompetitiveAnalysis: formData.get('includeCompetitiveAnalysis') === 'true',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.location?.[0] || fieldErrors.keyFeatures?.[0] || fieldErrors.buyerPersona?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🏠 Starting enhanced listing description generation...');

        // Try enhanced listing service first
        try {
            const input: ListingDescriptionInput = {
                ...validatedFields.data,
                userId: user.id,
            };

            const result = await generateIntelligentListingDescription(input);

            if (result.success) {
                console.log('✅ Enhanced listing description generated successfully');
                return {
                    message: 'success',
                    data: result,
                    errors: {},
                };
            } else {
                throw new Error(result.error || 'Enhanced listing generation failed');
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced listing generation failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock listing generation');
        const { generateNewListingDescription } = await import('@/aws/bedrock/flows/listing-description-generator');

        const bedrockResult = await generateNewListingDescription({
            propertyType: validatedFields.data.propertyType,
            bedrooms: validatedFields.data.bedrooms || '',
            bathrooms: validatedFields.data.bathrooms || '',
            squareFeet: validatedFields.data.squareFeet || '',
            location: validatedFields.data.location,
            keyFeatures: validatedFields.data.keyFeatures,
            buyerPersona: validatedFields.data.buyerPersona,
            writingStyle: validatedFields.data.writingStyle,
        });

        // Transform to match ListingDescriptionOutput format
        const transformedResult: ListingDescriptionOutput = {
            success: true,
            description: bedrockResult.description,
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
        console.error('❌ Listing description generation failed:', error);
        return {
            message: `Listing description generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Simple Listing Description Action
 * For quick listing generation with minimal inputs
 */
export async function generateSimpleListingDescriptionAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ListingDescriptionOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate listing descriptions' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = simpleListingSchema.safeParse({
        propertyType: formData.get('propertyType'),
        location: formData.get('location'),
        keyFeatures: formData.get('keyFeatures'),
        buyerPersona: formData.get('buyerPersona'),
        bedrooms: formData.get('bedrooms') || undefined,
        bathrooms: formData.get('bathrooms') || undefined,
        price: formData.get('price') || undefined,
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.location?.[0] || fieldErrors.keyFeatures?.[0] || fieldErrors.buyerPersona?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🏠 Starting simple listing description generation...');

        const result = await generateSimpleListingDescription(
            validatedFields.data.propertyType,
            validatedFields.data.location,
            validatedFields.data.keyFeatures,
            validatedFields.data.buyerPersona,
            user.id,
            {
                bedrooms: validatedFields.data.bedrooms,
                bathrooms: validatedFields.data.bathrooms,
                price: validatedFields.data.price,
                writingStyle: 'professional',
                includeMarketAnalysis: true,
                includeNeighborhoodInsights: true,
                includeSEOOptimization: true,
            }
        );

        if (result.success) {
            console.log('✅ Simple listing description generated successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Simple listing generation failed');
        }

    } catch (error) {
        console.error('❌ Simple listing description generation failed:', error);
        return {
            message: `Listing description generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Listing Optimization Action
 * Optimizes existing listing descriptions for different buyer personas
 */
export async function optimizeListingDescriptionAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ListingDescriptionOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to optimize listing descriptions' },
            data: null,
        };
    }

    const originalDescription = formData.get('originalDescription') as string;
    const newBuyerPersona = formData.get('buyerPersona') as string;
    const location = formData.get('location') as string;
    const propertyType = formData.get('propertyType') as string;

    if (!originalDescription || !newBuyerPersona || !location || !propertyType) {
        return {
            message: 'Original description, buyer persona, location, and property type are required',
            errors: { validation: 'Missing required fields' },
            data: null,
        };
    }

    try {
        console.log('🏠 Starting listing description optimization...');

        // Extract key features from original description (simple approach)
        const keyFeatures = this.extractKeyFeatures(originalDescription);

        const result = await generateSimpleListingDescription(
            propertyType,
            location,
            keyFeatures,
            newBuyerPersona,
            user.id,
            {
                writingStyle: 'professional',
                includeMarketAnalysis: true,
                includeNeighborhoodInsights: true,
                includeSEOOptimization: true,
            }
        );

        if (result.success) {
            console.log('✅ Listing description optimized successfully');
            return {
                message: 'success',
                data: {
                    ...result,
                    source: 'listing-optimization-agent',
                },
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Listing optimization failed');
        }

    } catch (error) {
        console.error('❌ Listing description optimization failed:', error);
        return {
            message: `Listing optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { optimization: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Bulk Listing Generation Action
 * Generates multiple listing descriptions for different personas
 */
export async function generateBulkListingDescriptionsAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: { listings: ListingDescriptionOutput[]; summary: any } | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate listing descriptions' },
            data: null,
        };
    }

    const propertyType = formData.get('propertyType') as string;
    const location = formData.get('location') as string;
    const keyFeatures = formData.get('keyFeatures') as string;
    const personasData = formData.get('personas') as string;

    if (!propertyType || !location || !keyFeatures || !personasData) {
        return {
            message: 'Property type, location, key features, and personas are required',
            errors: { validation: 'Missing required fields' },
            data: null,
        };
    }

    try {
        const personas = JSON.parse(personasData);
        console.log(`🏠 Starting bulk listing generation for ${personas.length} personas...`);

        const results = await Promise.all(
            personas.map(async (persona: string) => {
                try {
                    return await generateSimpleListingDescription(
                        propertyType,
                        location,
                        keyFeatures,
                        persona,
                        user.id,
                        {
                            writingStyle: 'professional',
                            includeMarketAnalysis: true,
                            includeNeighborhoodInsights: true,
                            includeSEOOptimization: true,
                        }
                    );
                } catch (error) {
                    console.error(`Failed to generate listing for persona ${persona}:`, error);
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        timestamp: new Date().toISOString(),
                        userId: user.id,
                        source: 'bulk-listing-agent',
                    } as ListingDescriptionOutput;
                }
            })
        );

        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ Bulk listing generation completed: ${successful.length} successful, ${failed.length} failed`);

        return {
            message: 'success',
            data: {
                listings: results,
                summary: {
                    total: results.length,
                    successful: successful.length,
                    failed: failed.length,
                    personas: personas,
                }
            },
            errors: {},
        };

    } catch (error) {
        console.error('❌ Bulk listing generation failed:', error);
        return {
            message: `Bulk listing generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Helper function to extract key features from existing description
 */
function extractKeyFeatures(description: string): string {
    // Simple extraction - look for common real estate features
    const features = [];
    const text = description.toLowerCase();

    if (text.includes('updated kitchen') || text.includes('modern kitchen')) {
        features.push('updated kitchen');
    }
    if (text.includes('hardwood floors') || text.includes('hardwood')) {
        features.push('hardwood floors');
    }
    if (text.includes('garage')) {
        features.push('garage');
    }
    if (text.includes('yard') || text.includes('outdoor space')) {
        features.push('private yard');
    }
    if (text.includes('fireplace')) {
        features.push('fireplace');
    }
    if (text.includes('master suite') || text.includes('primary suite')) {
        features.push('master suite');
    }

    return features.length > 0 ? features.join(', ') : 'well-maintained property with desirable features';
}