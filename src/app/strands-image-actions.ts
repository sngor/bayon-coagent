'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import {
    executeImageAnalysis,
    analyzePropertyImage,
    generateVirtualStaging,
    enhancePropertyImage,
    convertDayToDusk,
    type ImageAnalysisInput,
    type ImageAnalysisOutput,
    ImageAnalysisInputSchema
} from '@/services/strands/image-analysis-service';

// Enhanced image analysis action schemas
const PropertyImageAnalysisSchema = z.object({
    imageUrl: z.string().url('Valid image URL is required').optional(),
    imageBase64: z.string().optional(),
    imageDescription: z.string().min(1, 'Image description is required'),
    propertyType: z.string().optional(),
    roomType: z.string().optional(),
    location: z.string().optional(),
    priceRange: z.string().optional(),
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'renters']).default('buyers'),
    includeMarketingRecommendations: z.boolean().default(true),
    includeEnhancementSuggestions: z.boolean().default(true),
});

const VirtualStagingSchema = z.object({
    imageUrl: z.string().url('Valid image URL is required').optional(),
    imageBase64: z.string().optional(),
    imageDescription: z.string().min(1, 'Image description is required'),
    roomType: z.string().optional(),
    stagingStyle: z.enum(['modern-contemporary', 'traditional-classic', 'luxury-upscale', 'minimalist-clean', 'cozy-family', 'professional-office']).default('modern-contemporary'),
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'renters']).default('buyers'),
    generateVariations: z.number().min(1).max(3).default(2),
});

const ImageEnhancementSchema = z.object({
    imageUrl: z.string().url('Valid image URL is required').optional(),
    imageBase64: z.string().optional(),
    imageDescription: z.string().min(1, 'Image description is required'),
    enhancementType: z.enum(['brightness-contrast', 'color-correction', 'sharpening', 'noise-reduction', 'hdr-effect', 'professional-grade']).default('professional-grade'),
    generateVariations: z.number().min(1).max(3).default(1),
});

const DayToDuskSchema = z.object({
    imageUrl: z.string().url('Valid image URL is required').optional(),
    imageBase64: z.string().optional(),
    imageDescription: z.string().min(1, 'Image description is required'),
    propertyType: z.string().optional(),
    location: z.string().optional(),
});

/**
 * Enhanced Property Image Analysis Action
 */
export async function analyzePropertyImageAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ImageAnalysisOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to analyze property images' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            imageUrl: formData.get('imageUrl')?.toString() || undefined,
            imageBase64: formData.get('imageBase64')?.toString() || undefined,
            imageDescription: formData.get('imageDescription')?.toString() || '',
            propertyType: formData.get('propertyType')?.toString() || undefined,
            roomType: formData.get('roomType')?.toString() || undefined,
            location: formData.get('location')?.toString() || undefined,
            priceRange: formData.get('priceRange')?.toString() || undefined,
            targetAudience: formData.get('targetAudience')?.toString() || 'buyers',
            includeMarketingRecommendations: formData.get('includeMarketingRecommendations') === 'true',
            includeEnhancementSuggestions: formData.get('includeEnhancementSuggestions') === 'true',
        };

        const validatedFields = PropertyImageAnalysisSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        // Ensure we have either imageUrl or imageBase64
        if (!validatedFields.data.imageUrl && !validatedFields.data.imageBase64) {
            return {
                message: 'Image URL or base64 data is required',
                errors: { image: 'Please provide an image URL or upload an image' },
                data: null,
            };
        }

        console.log('🖼️ Starting enhanced property image analysis with Strands capabilities...');

        const result = await analyzePropertyImage(
            validatedFields.data.imageUrl || 'data:image/jpeg;base64,' + validatedFields.data.imageBase64,
            user.id,
            {
                imageDescription: validatedFields.data.imageDescription,
                propertyType: validatedFields.data.propertyType,
                roomType: validatedFields.data.roomType,
                location: validatedFields.data.location,
                priceRange: validatedFields.data.priceRange,
                targetAudience: validatedFields.data.targetAudience as any,
                includeMarketingRecommendations: validatedFields.data.includeMarketingRecommendations,
                includeEnhancementSuggestions: validatedFields.data.includeEnhancementSuggestions,
            }
        );

        if (result.success && result.analysis) {
            console.log('✅ Property image analysis completed successfully');

            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Property image analysis failed');
        }

    } catch (error) {
        console.error('❌ Property image analysis failed:', error);
        return {
            message: `Property image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Enhanced Virtual Staging Action
 */
export async function generateVirtualStagingAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ImageAnalysisOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to generate virtual staging' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            imageUrl: formData.get('imageUrl')?.toString() || undefined,
            imageBase64: formData.get('imageBase64')?.toString() || undefined,
            imageDescription: formData.get('imageDescription')?.toString() || '',
            roomType: formData.get('roomType')?.toString() || undefined,
            stagingStyle: formData.get('stagingStyle')?.toString() || 'modern-contemporary',
            targetAudience: formData.get('targetAudience')?.toString() || 'buyers',
            generateVariations: formData.get('generateVariations') ? parseInt(formData.get('generateVariations')!.toString()) : 2,
        };

        const validatedFields = VirtualStagingSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        // Ensure we have either imageUrl or imageBase64
        if (!validatedFields.data.imageUrl && !validatedFields.data.imageBase64) {
            return {
                message: 'Image URL or base64 data is required',
                errors: { image: 'Please provide an image URL or upload an image' },
                data: null,
            };
        }

        console.log('🖼️ Starting enhanced virtual staging with Strands capabilities...');

        // Try enhanced virtual staging service first
        try {
            const enhancedResult = await generateVirtualStaging(
                validatedFields.data.imageUrl || 'data:image/jpeg;base64,' + validatedFields.data.imageBase64,
                user.id,
                validatedFields.data.stagingStyle,
                {
                    imageDescription: validatedFields.data.imageDescription,
                    roomType: validatedFields.data.roomType,
                    targetAudience: validatedFields.data.targetAudience as any,
                    generateVariations: validatedFields.data.generateVariations,
                }
            );

            if (enhancedResult.success && enhancedResult.analysis) {
                console.log('✅ Enhanced virtual staging completed successfully');

                return {
                    message: 'success',
                    data: enhancedResult,
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced virtual staging failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock virtual staging');
        const { generateVirtualStaging: bedrockVirtualStaging } = await import('@/aws/bedrock/flows/generate-virtual-staging');

        const result = await bedrockVirtualStaging({
            imageUrl: validatedFields.data.imageUrl || '',
            roomType: validatedFields.data.roomType || 'living-room',
            style: validatedFields.data.stagingStyle,
        });

        return {
            message: 'success',
            data: {
                success: true,
                analysis: `# Virtual Staging Results\n\n${result.description || 'Virtual staging completed successfully'}`,
                processedImages: result.stagedImages?.map(img => ({
                    type: 'virtual-staging',
                    url: img.url,
                    description: img.description || 'Virtually staged image',
                })) || [],
                source: 'bedrock-agent',
                timestamp: new Date().toISOString(),
                userId: user.id,
            } as ImageAnalysisOutput,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Virtual staging failed:', error);
        return {
            message: `Virtual staging failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Enhanced Image Enhancement Action
 */
export async function enhancePropertyImageAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ImageAnalysisOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to enhance property images' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            imageUrl: formData.get('imageUrl')?.toString() || undefined,
            imageBase64: formData.get('imageBase64')?.toString() || undefined,
            imageDescription: formData.get('imageDescription')?.toString() || '',
            enhancementType: formData.get('enhancementType')?.toString() || 'professional-grade',
            generateVariations: formData.get('generateVariations') ? parseInt(formData.get('generateVariations')!.toString()) : 1,
        };

        const validatedFields = ImageEnhancementSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        // Ensure we have either imageUrl or imageBase64
        if (!validatedFields.data.imageUrl && !validatedFields.data.imageBase64) {
            return {
                message: 'Image URL or base64 data is required',
                errors: { image: 'Please provide an image URL or upload an image' },
                data: null,
            };
        }

        console.log('🖼️ Starting enhanced image enhancement with Strands capabilities...');

        const result = await enhancePropertyImage(
            validatedFields.data.imageUrl || 'data:image/jpeg;base64,' + validatedFields.data.imageBase64,
            user.id,
            validatedFields.data.enhancementType,
            {
                imageDescription: validatedFields.data.imageDescription,
                generateVariations: validatedFields.data.generateVariations,
            }
        );

        if (result.success && result.analysis) {
            console.log('✅ Image enhancement completed successfully');

            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Image enhancement failed');
        }

    } catch (error) {
        console.error('❌ Image enhancement failed:', error);
        return {
            message: `Image enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Enhanced Day-to-Dusk Conversion Action
 */
export async function convertDayToDuskAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ImageAnalysisOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to convert day-to-dusk images' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            imageUrl: formData.get('imageUrl')?.toString() || undefined,
            imageBase64: formData.get('imageBase64')?.toString() || undefined,
            imageDescription: formData.get('imageDescription')?.toString() || '',
            propertyType: formData.get('propertyType')?.toString() || undefined,
            location: formData.get('location')?.toString() || undefined,
        };

        const validatedFields = DayToDuskSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                message: 'Invalid input data',
                errors: validatedFields.error.flatten().fieldErrors,
                data: null,
            };
        }

        // Ensure we have either imageUrl or imageBase64
        if (!validatedFields.data.imageUrl && !validatedFields.data.imageBase64) {
            return {
                message: 'Image URL or base64 data is required',
                errors: { image: 'Please provide an image URL or upload an image' },
                data: null,
            };
        }

        console.log('🖼️ Starting enhanced day-to-dusk conversion with Strands capabilities...');

        // Try enhanced day-to-dusk service first
        try {
            const enhancedResult = await convertDayToDusk(
                validatedFields.data.imageUrl || 'data:image/jpeg;base64,' + validatedFields.data.imageBase64,
                user.id,
                {
                    imageDescription: validatedFields.data.imageDescription,
                    propertyType: validatedFields.data.propertyType,
                    location: validatedFields.data.location,
                }
            );

            if (enhancedResult.success && enhancedResult.analysis) {
                console.log('✅ Enhanced day-to-dusk conversion completed successfully');

                return {
                    message: 'success',
                    data: enhancedResult,
                    errors: {},
                };
            }
        } catch (enhancedError) {
            console.warn('⚠️ Enhanced day-to-dusk conversion failed, using fallback:', enhancedError);
        }

        // Fallback to original Bedrock implementation
        console.log('🔄 Using standard Bedrock day-to-dusk conversion');
        const { convertDayToDusk: bedrockDayToDusk } = await import('@/aws/bedrock/flows/day-to-dusk-conversion');

        const result = await bedrockDayToDusk({
            imageUrl: validatedFields.data.imageUrl || '',
            propertyType: validatedFields.data.propertyType || 'residential',
        });

        return {
            message: 'success',
            data: {
                success: true,
                analysis: `# Day-to-Dusk Conversion Results\n\n${result.description || 'Day-to-dusk conversion completed successfully'}`,
                processedImages: result.convertedImages?.map(img => ({
                    type: 'day-to-dusk',
                    url: img.url,
                    description: img.description || 'Day-to-dusk converted image',
                })) || [],
                source: 'bedrock-agent',
                timestamp: new Date().toISOString(),
                userId: user.id,
            } as ImageAnalysisOutput,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Day-to-dusk conversion failed:', error);
        return {
            message: `Day-to-dusk conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Generic Image Analysis Execution Action
 */
export async function executeImageAnalysisAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: ImageAnalysisOutput | null;
    errors: any;
}> {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return {
                message: 'Authentication required',
                errors: { auth: 'Please sign in to execute image analysis' },
                data: null,
            };
        }

        // Extract and validate form data
        const rawData = {
            analysisType: formData.get('analysisType')?.toString() || 'property-analysis',
            imageUrl: formData.get('imageUrl')?.toString() || undefined,
            imageBase64: formData.get('imageBase64')?.toString() || undefined,
            imageDescription: formData.get('imageDescription')?.toString() || '',
            propertyType: formData.get('propertyType')?.toString() || undefined,
            roomType: formData.get('roomType')?.toString() || undefined,
            location: formData.get('location')?.toString() || undefined,
            priceRange: formData.get('priceRange')?.toString() || undefined,
            targetAudience: formData.get('targetAudience')?.toString() || 'buyers',
            enhancementType: formData.get('enhancementType')?.toString() || undefined,
            stagingStyle: formData.get('stagingStyle')?.toString() || undefined,
            generateVariations: formData.get('generateVariations') ? parseInt(formData.get('generateVariations')!.toString()) : 1,
            includePropertyAnalysis: formData.get('includePropertyAnalysis') === 'true',
            includeMarketingRecommendations: formData.get('includeMarketingRecommendations') === 'true',
            includeEnhancementSuggestions: formData.get('includeEnhancementSuggestions') === 'true',
            includeStagingRecommendations: formData.get('includeStagingRecommendations') === 'true',
            saveResults: formData.get('saveResults') === 'true',
        };

        const validatedFields = ImageAnalysisInputSchema.safeParse({
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

        // Ensure we have either imageUrl or imageBase64
        if (!validatedFields.data.imageUrl && !validatedFields.data.imageBase64) {
            return {
                message: 'Image URL or base64 data is required',
                errors: { image: 'Please provide an image URL or upload an image' },
                data: null,
            };
        }

        console.log(`🖼️ Starting image analysis execution: ${validatedFields.data.analysisType}`);

        const result = await executeImageAnalysis(validatedFields.data);

        if (result.success && result.analysis) {
            console.log('✅ Image analysis execution completed successfully');

            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Image analysis execution failed');
        }

    } catch (error) {
        console.error('❌ Image analysis execution failed:', error);
        return {
            message: `Image analysis execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: {},
            data: null,
        };
    }
}

/**
 * Convenience action for quick property image analysis
 */
export async function quickPropertyAnalysisAction(
    imageUrl: string,
    imageDescription: string,
    roomType?: string
): Promise<ImageAnalysisOutput> {
    const user = await getCurrentUserServer();
    if (!user) {
        throw new Error('Authentication required');
    }

    return await analyzePropertyImage(imageUrl, user.id, {
        imageDescription,
        roomType,
        includePropertyAnalysis: true,
        includeMarketingRecommendations: true,
        includeEnhancementSuggestions: true,
    });
}

/**
 * Convenience action for quick virtual staging
 */
export async function quickVirtualStagingAction(
    imageUrl: string,
    imageDescription: string,
    stagingStyle: string = 'modern-contemporary'
): Promise<ImageAnalysisOutput> {
    const user = await getCurrentUserServer();
    if (!user) {
        throw new Error('Authentication required');
    }

    return await generateVirtualStaging(imageUrl, user.id, stagingStyle, {
        imageDescription,
        generateVariations: 2,
    });
}