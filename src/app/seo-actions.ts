'use server';

import { z } from 'zod';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { keywordRepository } from '@/aws/dynamodb/keyword-repository';
import { seoRepository } from '@/aws/dynamodb/seo-repository';
import { generateKeywordSuggestions } from '@/aws/bedrock/flows/generate-keyword-suggestions';
import { analyzeSEO } from '@/aws/bedrock/flows/analyze-seo';
import { generateMetaDescription } from '@/aws/bedrock/flows/generate-meta-description';
import { getKeywordSuggestionsForContent } from '@/lib/seo/keyword-suggestions';
import { getRepository } from '@/aws/dynamodb/repository';
import { getUserProfileKeys } from '@/aws/dynamodb/keys';
import type { SavedKeyword, Profile, SEOAnalysis } from '@/lib/types/common';

/**
 * Action result type
 */
type ActionResult<T = any> = {
    message: string;
    data?: T;
    errors: Record<string, string[]>;
};

/**
 * Maps errors to user-friendly messages
 */
const handleError = (error: any, defaultMessage: string): string => {
    const isDev = process.env.NODE_ENV === 'development';
    const originalErrorMessage = error instanceof Error ? error.message : String(error);
    const devSuffix = isDev ? ` (Error: ${originalErrorMessage})` : '';

    if (error instanceof Error) {
        const lowerCaseMessage = error.message.toLowerCase();

        // DynamoDB errors
        if (lowerCaseMessage.includes('dynamodb') || lowerCaseMessage.includes('provisioned throughput')) {
            return 'Database service is temporarily unavailable. Please try again.' + devSuffix;
        }

        // Bedrock errors
        if (lowerCaseMessage.includes('bedrock') || lowerCaseMessage.includes('model')) {
            return 'AI service is temporarily unavailable. Please try again.' + devSuffix;
        }

        // Network errors
        if (lowerCaseMessage.includes('network') || lowerCaseMessage.includes('econnrefused')) {
            return 'Network connection error. Please check your internet connection and try again.' + devSuffix;
        }

        // Return the original error message if it's user-friendly
        if (error.message && error.message.length < 200 && !error.message.includes('Error:')) {
            return error.message;
        }
    }

    console.error('SEO Action Error:', error);
    return defaultMessage + devSuffix;
};

/**
 * Validation schemas
 */
const generateKeywordSuggestionsSchema = z.object({
    location: z.string().optional(),
    agentSpecialties: z.array(z.string()).optional(),
});

const saveSavedKeywordSchema = z.object({
    keyword: z.string().min(1, 'Keyword is required'),
    searchVolume: z.number().min(0, 'Search volume must be non-negative'),
    competition: z.enum(['low', 'medium', 'high']),
    location: z.string().min(1, 'Location is required'),
});

const getKeywordSuggestionsForContentSchema = z.object({
    location: z.string().optional(),
    contentType: z.enum(['blog-post', 'market-update', 'neighborhood-guide', 'social-media']).optional(),
    existingKeywords: z.array(z.string()).optional(),
    limit: z.number().min(1).max(20).optional(),
});

const analyzeSEOSchema = z.object({
    content: z.string().min(100, 'Content must be at least 100 characters'),
    title: z.string().min(10, 'Title must be at least 10 characters'),
    metaDescription: z.string().optional(),
    targetKeywords: z.array(z.string()).optional(),
    contentId: z.string().optional(),
    contentType: z.enum(['blog-post', 'market-update', 'neighborhood-guide']).default('blog-post'),
});

const generateMetaDescriptionSchema = z.object({
    content: z.string().min(100, 'Content must be at least 100 characters'),
    primaryKeyword: z.string().min(1, 'Primary keyword is required'),
    agentName: z.string().optional(),
    location: z.string().optional(),
});

/**
 * Generates keyword suggestions using AI
 * @param input Location and optional specialties
 * @returns Generated keyword suggestions
 */
export async function generateKeywordSuggestionsAction(
    input: z.infer<typeof generateKeywordSuggestionsSchema>
): Promise<ActionResult<{ keywords: Array<{ keyword: string; searchVolume: number; competition: string; rationale: string }> }>> {
    try {
        // Validate input
        const validatedInput = generateKeywordSuggestionsSchema.parse(input);

        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to generate keyword suggestions'] },
            };
        }

        // Get user profile for location if not provided
        let location = validatedInput.location;
        if (!location) {
            const repository = getRepository();
            const keys = getUserProfileKeys(user.id);
            const profile = await repository.get<Profile>(keys.PK, keys.SK);

            if (profile?.address) {
                // Extract city and state from address
                const addressParts = profile.address.split(',');
                if (addressParts.length >= 2) {
                    location = `${addressParts[addressParts.length - 2].trim()}, ${addressParts[addressParts.length - 1].trim()}`;
                }
            }

            if (!location) {
                return {
                    message: 'Location required',
                    errors: { location: ['Please provide a location or complete your profile with an address'] },
                };
            }
        }

        // Generate keyword suggestions using Bedrock
        const result = await generateKeywordSuggestions({
            location,
            agentSpecialties: validatedInput.agentSpecialties,
        });

        return {
            message: 'Keyword suggestions generated successfully',
            data: result,
            errors: {},
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string[]> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(err.message);
            });

            return {
                message: 'Validation failed',
                errors: fieldErrors,
            };
        }

        return {
            message: handleError(error, 'Failed to generate keyword suggestions'),
            errors: { general: [handleError(error, 'Failed to generate keyword suggestions')] },
        };
    }
}

/**
 * Saves a keyword to the user's saved keywords list
 * @param input Keyword data
 * @returns Saved keyword
 */
export async function saveSavedKeywordAction(
    input: z.infer<typeof saveSavedKeywordSchema>
): Promise<ActionResult<SavedKeyword>> {
    try {
        // Validate input
        const validatedInput = saveSavedKeywordSchema.parse(input);

        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to save keywords'] },
            };
        }

        // Check if keyword already exists
        const exists = await keywordRepository.keywordExists(user.id, validatedInput.keyword);
        if (exists) {
            return {
                message: 'Keyword already exists',
                errors: { keyword: ['This keyword is already in your saved list'] },
            };
        }

        // Create saved keyword
        const savedKeyword = await keywordRepository.createSavedKeyword(user.id, {
            keyword: validatedInput.keyword,
            searchVolume: validatedInput.searchVolume,
            competition: validatedInput.competition,
            location: validatedInput.location,
            addedAt: new Date().toISOString(),
        });

        return {
            message: 'Keyword saved successfully',
            data: savedKeyword,
            errors: {},
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string[]> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(err.message);
            });

            return {
                message: 'Validation failed',
                errors: fieldErrors,
            };
        }

        return {
            message: handleError(error, 'Failed to save keyword'),
            errors: { general: [handleError(error, 'Failed to save keyword')] },
        };
    }
}

/**
 * Gets all saved keywords for the current user
 * @returns Array of saved keywords
 */
export async function getSavedKeywordsAction(): Promise<ActionResult<SavedKeyword[]>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to view saved keywords'] },
            };
        }

        // Query saved keywords
        const keywords = await keywordRepository.querySavedKeywords(user.id);

        return {
            message: 'Saved keywords retrieved successfully',
            data: keywords,
            errors: {},
        };
    } catch (error: any) {
        return {
            message: handleError(error, 'Failed to retrieve saved keywords'),
            errors: { general: [handleError(error, 'Failed to retrieve saved keywords')] },
        };
    }
}

/**
 * Deletes a saved keyword
 * @param keywordId Keyword ID to delete
 * @returns Success message
 */
export async function deleteSavedKeywordAction(
    keywordId: string
): Promise<ActionResult<void>> {
    try {
        if (!keywordId) {
            return {
                message: 'Keyword ID is required',
                errors: { keywordId: ['Keyword ID is required'] },
            };
        }

        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to delete keywords'] },
            };
        }

        // Delete keyword
        await keywordRepository.deleteSavedKeyword(user.id, keywordId);

        return {
            message: 'Keyword deleted successfully',
            errors: {},
        };
    } catch (error: any) {
        return {
            message: handleError(error, 'Failed to delete keyword'),
            errors: { general: [handleError(error, 'Failed to delete keyword')] },
        };
    }
}

/**
 * Gets keyword suggestions for content creation
 * @param input Content context options
 * @returns Keyword suggestions
 */
export async function getKeywordSuggestionsForContentAction(
    input: z.infer<typeof getKeywordSuggestionsForContentSchema>
): Promise<ActionResult<SavedKeyword[]>> {
    try {
        // Validate input
        const validatedInput = getKeywordSuggestionsForContentSchema.parse(input);

        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to get keyword suggestions'] },
            };
        }

        // Get keyword suggestions
        const result = await getKeywordSuggestionsForContent(user.id, {
            location: validatedInput.location,
            contentType: validatedInput.contentType,
            existingKeywords: validatedInput.existingKeywords,
            limit: validatedInput.limit,
        });

        return {
            message: 'Keyword suggestions retrieved successfully',
            data: result.suggestions,
            errors: {},
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string[]> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(err.message);
            });

            return {
                message: 'Validation failed',
                errors: fieldErrors,
            };
        }

        return {
            message: handleError(error, 'Failed to get keyword suggestions'),
            errors: { general: [handleError(error, 'Failed to get keyword suggestions')] },
        };
    }
}

/**
 * Gets low-competition keywords
 * @param limit Maximum number of results
 * @returns Low-competition keywords
 */
export async function getLowCompetitionKeywordsAction(
    limit: number = 10
): Promise<ActionResult<SavedKeyword[]>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to view keywords'] },
            };
        }

        // Get low-competition keywords
        const keywords = await keywordRepository.getLowCompetitionKeywords(user.id, limit);

        return {
            message: 'Low-competition keywords retrieved successfully',
            data: keywords,
            errors: {},
        };
    } catch (error: any) {
        return {
            message: handleError(error, 'Failed to retrieve low-competition keywords'),
            errors: { general: [handleError(error, 'Failed to retrieve low-competition keywords')] },
        };
    }
}

/**
 * Gets high-volume keywords
 * @param limit Maximum number of results
 * @returns High-volume keywords
 */
export async function getHighVolumeKeywordsAction(
    limit: number = 10
): Promise<ActionResult<SavedKeyword[]>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to view keywords'] },
            };
        }

        // Get high-volume keywords
        const keywords = await keywordRepository.getHighVolumeKeywords(user.id, limit);

        return {
            message: 'High-volume keywords retrieved successfully',
            data: keywords,
            errors: {},
        };
    } catch (error: any) {
        return {
            message: handleError(error, 'Failed to retrieve high-volume keywords'),
            errors: { general: [handleError(error, 'Failed to retrieve high-volume keywords')] },
        };
    }
}

/**
 * Analyzes content for SEO and generates recommendations
 * @param input Content analysis parameters
 * @returns SEO analysis with score and recommendations
 */
export async function analyzeSEOAction(
    input: z.infer<typeof analyzeSEOSchema>
): Promise<ActionResult<SEOAnalysis>> {
    try {
        // Validate input
        const validatedInput = analyzeSEOSchema.parse(input);

        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to analyze SEO'] },
            };
        }

        // Run SEO analysis
        const result = await analyzeSEO({
            content: validatedInput.content,
            title: validatedInput.title,
            metaDescription: validatedInput.metaDescription,
            targetKeywords: validatedInput.targetKeywords,
        });

        // Create SEO analysis entity
        const analysisId = `seo-${Date.now()}`;
        const seoAnalysis: SEOAnalysis = {
            id: analysisId,
            userId: user.id,
            contentId: validatedInput.contentId || '',
            contentType: validatedInput.contentType,
            score: result.score,
            recommendations: result.recommendations,
            analyzedAt: new Date().toISOString(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Save to DynamoDB if contentId is provided
        if (validatedInput.contentId) {
            await seoRepository.createSEOAnalysis(user.id, seoAnalysis);
        }

        return {
            message: 'SEO analysis completed successfully',
            data: seoAnalysis,
            errors: {},
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string[]> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(err.message);
            });

            return {
                message: 'Validation failed',
                errors: fieldErrors,
            };
        }

        return {
            message: handleError(error, 'Failed to analyze SEO'),
            errors: { general: [handleError(error, 'Failed to analyze SEO')] },
        };
    }
}

/**
 * Generates a meta description for content
 * @param input Content and keyword parameters
 * @returns Generated meta description
 */
export async function generateMetaDescriptionAction(
    input: z.infer<typeof generateMetaDescriptionSchema>
): Promise<ActionResult<{ metaDescription: string; characterCount: number }>> {
    try {
        // Validate input
        const validatedInput = generateMetaDescriptionSchema.parse(input);

        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to generate meta descriptions'] },
            };
        }

        // Get user profile for agent name and location if not provided
        let agentName = validatedInput.agentName;
        let location = validatedInput.location;

        if (!agentName || !location) {
            const repository = getRepository();
            const keys = getUserProfileKeys(user.id);
            const profile = await repository.get<Profile>(keys.PK, keys.SK);

            if (!agentName && profile?.name) {
                agentName = profile.name;
            }

            if (!location && profile?.address) {
                // Extract city and state from address
                const addressParts = profile.address.split(',');
                if (addressParts.length >= 2) {
                    location = `${addressParts[addressParts.length - 2].trim()}, ${addressParts[addressParts.length - 1].trim()}`;
                }
            }
        }

        if (!agentName || !location) {
            return {
                message: 'Profile information required',
                errors: { profile: ['Please complete your profile with name and location'] },
            };
        }

        // Generate meta description
        const result = await generateMetaDescription({
            content: validatedInput.content,
            primaryKeyword: validatedInput.primaryKeyword,
            agentName,
            location,
        });

        return {
            message: 'Meta description generated successfully',
            data: result,
            errors: {},
        };
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            const fieldErrors: Record<string, string[]> = {};
            error.errors.forEach((err) => {
                const path = err.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(err.message);
            });

            return {
                message: 'Validation failed',
                errors: fieldErrors,
            };
        }

        return {
            message: handleError(error, 'Failed to generate meta description'),
            errors: { general: [handleError(error, 'Failed to generate meta description')] },
        };
    }
}

/**
 * Validates schema markup for a specific page type
 * @param pageType Type of page to validate
 * @param schemaData Optional schema data to validate (if not provided, will fetch from page)
 * @returns Validation result with errors and suggestions
 */
export async function validateSchemaMarkupAction(
    pageType: 'profile' | 'blog-post' | 'testimonials',
    schemaData?: any
): Promise<ActionResult<{ isValid: boolean; errors: string[]; suggestions: string[] }>> {
    try {
        // Get current user
        const user = await getCurrentUserServer();
        if (!user || !user.id) {
            return {
                message: 'Authentication required',
                errors: { auth: ['You must be logged in to validate schema markup'] },
            };
        }

        // Import validation functions
        const { validateSchema, formatValidationErrors, generateFixSuggestions } = await import('@/lib/schema/validator');
        const { generateRealEstateAgentSchema, generateArticleSchema, generateReviewSchema } = await import('@/lib/schema/generators');

        let schema: any;
        let validationErrors: string[] = [];
        let suggestions: string[] = [];

        // If schema data is provided, validate it directly
        if (schemaData) {
            const validation = validateSchema(schemaData);
            validationErrors = formatValidationErrors(validation);
            suggestions = generateFixSuggestions(validation);

            return {
                message: validation.isValid ? 'Schema markup is valid' : 'Schema markup has validation errors',
                data: {
                    isValid: validation.isValid,
                    errors: validationErrors,
                    suggestions,
                },
                errors: {},
            };
        }

        // Otherwise, generate schema based on page type and validate
        const repository = getRepository();
        const keys = getUserProfileKeys(user.id);
        const profile = await repository.get<Profile>(keys.PK, keys.SK);

        if (!profile) {
            return {
                message: 'Profile not found',
                errors: { profile: ['Please complete your profile first'] },
            };
        }

        switch (pageType) {
            case 'profile': {
                // Generate and validate RealEstateAgent schema
                schema = generateRealEstateAgentSchema(profile);
                const validation = validateSchema(schema);
                validationErrors = formatValidationErrors(validation);
                suggestions = generateFixSuggestions(validation);

                return {
                    message: validation.isValid ? 'Profile schema markup is valid' : 'Profile schema markup has validation errors',
                    data: {
                        isValid: validation.isValid,
                        errors: validationErrors,
                        suggestions,
                    },
                    errors: {},
                };
            }

            case 'blog-post': {
                // For blog posts, we need a specific blog post to validate
                // This is a generic validation that checks if the profile has required fields
                return {
                    message: 'Blog post validation requires specific content',
                    data: {
                        isValid: true,
                        errors: [],
                        suggestions: ['Provide specific blog post content to validate Article schema'],
                    },
                    errors: {},
                };
            }

            case 'testimonials': {
                // Check if user has testimonials
                const testimonialsResult = await repository.query<any>(`USER#${user.id}`, 'TESTIMONIAL#');

                if (!testimonialsResult || testimonialsResult.count === 0) {
                    return {
                        message: 'No testimonials found',
                        data: {
                            isValid: true,
                            errors: [],
                            suggestions: ['Add testimonials to enable Review schema markup'],
                        },
                        errors: {},
                    };
                }

                // Validate first testimonial as example
                const testimonial = testimonialsResult.items[0] as any;
                schema = generateReviewSchema(testimonial, profile.name);
                const validation = validateSchema(schema);
                validationErrors = formatValidationErrors(validation);
                suggestions = generateFixSuggestions(validation);

                return {
                    message: validation.isValid ? 'Testimonial schema markup is valid' : 'Testimonial schema markup has validation errors',
                    data: {
                        isValid: validation.isValid,
                        errors: validationErrors,
                        suggestions,
                    },
                    errors: {},
                };
            }

            default:
                return {
                    message: 'Invalid page type',
                    errors: { pageType: ['Page type must be profile, blog-post, or testimonials'] },
                };
        }
    } catch (error: any) {
        return {
            message: handleError(error, 'Failed to validate schema markup'),
            errors: { general: [handleError(error, 'Failed to validate schema markup')] },
        };
    }
}
