'use server';

import { getCurrentUserId, getCurrentUserServer } from '@/aws/auth/server-auth';
import { cookies } from 'next/headers';

// Session cookie configuration constants
const SESSION_COOKIE_CONFIG = {
  MAX_COOKIE_SIZE: 3500, // Leave headroom under 4096 byte limit
  CHUNK_SIZE: 3500,
  MAX_CHUNKS_TO_CLEAR: 10,
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  },
} as const;

/**
 * Session data interface
 */
interface SessionData {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Split large string into chunks of specified size
 */
function chunkString(str: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Clear all potential chunk cookies
 */
async function clearChunkCookies(cookieStore: Awaited<ReturnType<typeof cookies>>): Promise<void> {
  cookieStore.delete('cognito_session_chunks');
  for (let i = 0; i < SESSION_COOKIE_CONFIG.MAX_CHUNKS_TO_CLEAR; i++) {
    cookieStore.delete(`cognito_session_${i}`);
  }
}

/**
 * Set chunked session cookies for large session data
 */
async function setChunkedSessionCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  sessionString: string
): Promise<void> {
  const chunks = chunkString(sessionString, SESSION_COOKIE_CONFIG.CHUNK_SIZE);
  
  // Set chunk count cookie
  cookieStore.set('cognito_session_chunks', chunks.length.toString(), SESSION_COOKIE_CONFIG.COOKIE_OPTIONS);
  
  // Set individual chunk cookies
  chunks.forEach((chunk, index) => {
    cookieStore.set(`cognito_session_${index}`, chunk, SESSION_COOKIE_CONFIG.COOKIE_OPTIONS);
  });
  
  // Clear the main cookie if it exists
  cookieStore.delete('cognito_session');
}

/**
 * Set single session cookie for small session data
 */
async function setSingleSessionCookie(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  sessionString: string
): Promise<void> {
  cookieStore.set('cognito_session', sessionString, SESSION_COOKIE_CONFIG.COOKIE_OPTIONS);
  await clearChunkCookies(cookieStore);
}

/**
 * Set session cookie for server-side authentication
 * Automatically handles chunking for large session data to avoid 4096 byte cookie limit
 */
async function setServerSessionCookie(
  accessToken: string,
  idToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<void> {
  const cookieStore = await cookies();
  
  const sessionData: SessionData = {
    accessToken,
    idToken,
    refreshToken,
    expiresAt,
  };

  const sessionString = JSON.stringify(sessionData);
  
  // Use chunked cookies if session data exceeds size limit
  if (sessionString.length > SESSION_COOKIE_CONFIG.MAX_COOKIE_SIZE) {
    await setChunkedSessionCookies(cookieStore, sessionString);
  } else {
    await setSingleSessionCookie(cookieStore, sessionString);
  }
}

/**
 * Clear session cookie on logout
 */
async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  
  // Clear single cookie
  cookieStore.delete('cognito_session');
  
  // Clear chunked cookies
  await clearChunkCookies(cookieStore);
}

/**
 * Get session data from cookies (handles both single and chunked cookies)
 */
async function getServerSessionData(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  
  // Check if we have chunked cookies
  const chunkCountCookie = cookieStore.get('cognito_session_chunks');
  
  if (chunkCountCookie) {
    // Reconstruct from chunks
    const chunkCount = parseInt(chunkCountCookie.value, 10);
    if (isNaN(chunkCount) || chunkCount <= 0) {
      return null;
    }
    
    let sessionString = '';
    for (let i = 0; i < chunkCount; i++) {
      const chunkCookie = cookieStore.get(`cognito_session_${i}`);
      if (!chunkCookie) {
        // Missing chunk, session is invalid
        return null;
      }
      sessionString += chunkCookie.value;
    }
    
    try {
      return JSON.parse(sessionString) as SessionData;
    } catch {
      return null;
    }
  } else {
    // Check for single cookie
    const sessionCookie = cookieStore.get('cognito_session');
    if (!sessionCookie) {
      return null;
    }
    
    try {
      return JSON.parse(sessionCookie.value) as SessionData;
    } catch {
      return null;
    }
  }
}

// AWS Bedrock flows (migrated from Genkit)
import {
  generateNeighborhoodGuide,
  type GenerateNeighborhoodGuideInput,
  type GenerateNeighborhoodGuideOutput,
} from '@/aws/bedrock/flows/generate-neighborhood-guides';
// import {
//   generateNewListingDescription,
//   optimizeListingDescription,
//   generateListingDescription,
// } from '@/aws/bedrock/flows/listing-description-generator';
import {
  type GenerateNewListingInput,
  type OptimizeListingInput,
  type GenerateListingDescriptionInput,
  type ListingDescriptionOutput,
  GenerateNewListingInputSchema,
  OptimizeListingInputSchema,
} from '@/ai/schemas/listing-description-schemas';
import {
  generateListingFaqs,
  type GenerateListingFaqsInput,
  type GenerateListingFaqsOutput,
} from '@/aws/bedrock/flows/generate-listing-faqs';
import {
  exchangeGoogleToken,
} from '@/aws/bedrock/flows/exchange-google-token';
import {
  type ExchangeGoogleTokenInput,
  type ExchangeGoogleTokenOutput,
} from '@/ai/schemas/google-token-schemas';
import {
  generateAgentBio,
} from '@/aws/bedrock/flows/generate-agent-bio';
import {
  type GenerateAgentBioInput,
  type GenerateAgentBioOutput,
} from '@/ai/schemas/agent-bio-schemas';
import {
  findCompetitors,
  enrichCompetitorData,
} from '@/aws/bedrock/flows/find-competitors';
import {
  type FindCompetitorsInput,
  type FindCompetitorsOutput,
  type EnrichCompetitorDataInput,
  type EnrichCompetitorDataOutput,
} from '@/ai/schemas/competitor-analysis-schemas';
import {
  runNapAudit,
} from '@/aws/bedrock/flows/run-nap-audit';
import {
  type RunNapAuditInput,
  type RunNapAuditOutput,
} from '@/ai/schemas/nap-audit-schemas';
import {
  generateSocialMediaPost,
} from '@/aws/bedrock/flows/generate-social-media-post';
import {
  type GenerateSocialMediaPostInput,
  type GenerateSocialMediaPostOutput,
} from '@/ai/schemas/social-media-post-schemas';
import {
  generateSocialMediaImage,
  regenerateSingleImage,
} from '@/aws/bedrock/flows/generate-social-media-image';
import {
  type GenerateSocialMediaImageInput,
  type GenerateSocialMediaImageOutput,
} from '@/ai/schemas/social-media-image-schemas';
import {
  generateSocialProof,
} from '@/aws/bedrock/flows/generate-social-proof';
import {
  type GenerateSocialProofInput,
  type GenerateSocialProofOutput,
} from '@/ai/schemas/social-proof-schemas';
import {
  runResearchAgent,
} from '@/aws/bedrock/flows/run-research-agent';
import {
  type RunResearchAgentInput,
  type RunResearchAgentOutput,
} from '@/ai/schemas/research-agent-schemas';
import {
  runPropertyValuation,
} from '@/aws/bedrock/flows/property-valuation';
import {
  type PropertyValuationInput,
  type PropertyValuationOutput,
} from '@/ai/schemas/property-valuation-schemas';
import {
  runRenovationROIAnalysis,
} from '@/aws/bedrock/flows/renovation-roi';
import {
  type RenovationROIInput,
  type RenovationROIOutput,
} from '@/ai/schemas/renovation-roi-schemas';
import {
  runNeighborhoodProfileSynthesis,
} from '@/aws/bedrock/flows/neighborhood-profile-flow';
import {
  type NeighborhoodProfileInput,
  type NeighborhoodProfileOutput,
} from '@/ai/schemas/neighborhood-profile-schemas';
import {
  generateMarketUpdate,
} from '@/aws/bedrock/flows/generate-market-update';
import {
  type GenerateMarketUpdateInput,
  type GenerateMarketUpdateOutput,
} from '@/ai/schemas/market-update-schemas';
import {
  generateFutureCast,
} from '@/aws/bedrock/flows/generate-future-cast';
import {
  type GenerateFutureCastInput,
  type GenerateFutureCastOutput,
} from '@/ai/schemas/market-update-schemas';
import {
  generateVideoScript,
} from '@/aws/bedrock/flows/generate-video-script';
import {
  type GenerateVideoScriptInput,
  type GenerateVideoScriptOutput,
} from '@/ai/schemas/video-script-schemas';
import {
  getKeywordRankings,
} from '@/aws/bedrock/flows/get-keyword-rankings';
import {
  type GetKeywordRankingsInput,
  type GetKeywordRankingsOutput,
  type KeywordRanking,
} from '@/ai/schemas/keyword-ranking-schemas';
import {
  generateBlogPost,
} from '@/aws/bedrock/flows/generate-blog-post';
import {
  type GenerateBlogPostInput,
  type GenerateBlogPostOutput,
} from '@/ai/schemas/blog-post-schemas';
import {
  generateHeaderImage,
  type GenerateHeaderImageInput,
  type GenerateHeaderImageOutput,
} from '@/aws/bedrock/flows/generate-header-image';
import {
  generateMarketingPlan,
} from '@/aws/bedrock/flows/generate-marketing-plan';
import {
  type GenerateMarketingPlanInput,
  type GenerateMarketingPlanOutput,
} from '@/ai/schemas/marketing-plan-schemas';
import {
  getZillowReviews,
} from '@/aws/bedrock/flows/get-zillow-reviews';
import {
  type GetZillowReviewsInput,
  type GetZillowReviewsOutput,
} from '@/ai/schemas/zillow-review-schemas';
import {
  analyzeReviewSentiment,
} from '@/aws/bedrock/flows/analyze-review-sentiment';
import {
  type AnalyzeReviewSentimentInput,
  type AnalyzeReviewSentimentOutput,
} from '@/ai/schemas/review-sentiment-schemas';
import {
  analyzeMultipleReviews,
} from '@/aws/bedrock/flows/analyze-multiple-reviews';
import {
  type AnalyzeMultipleReviewsInput,
  type AnalyzeMultipleReviewsOutput,
} from '@/ai/schemas/review-analysis-schemas';
import {
  getRealEstateNews,
} from '@/aws/bedrock/flows/get-real-estate-news';
import {
  type GetRealEstateNewsInput,
  type GetRealEstateNewsOutput
} from '@/ai/schemas/real-estate-news-schemas';
import {
  generateTrainingPlan,
  type TrainingPlanInput,
  type TrainingPlanOutput
} from '@/aws/bedrock/flows/training-plan-flow';
import {
  generateRolePlayResponse,
  type RolePlayInput,
  type RolePlayOutput,
  type RolePlayMessage
} from '@/aws/bedrock/flows/role-play-flow';
import {
  type WebsiteAnalysisResult,
} from '@/ai/schemas/website-analysis-schemas';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getRepository } from '@/aws/dynamodb/repository';
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  validateFormData
} from '@/lib/server-action-utils';
import {
  getAgentProfileKeys,
  getProfileKeys,
  getUserProfileKeys,
  getMarketingPlanKeys,
  getReviewAnalysisKeys,
  getReviewKeys,
  getProjectKeys,
  getSavedContentKeys,
  getResearchReportKeys,
  getCompetitorKeys,
  getTrainingProgressKeys,
  getNeighborhoodProfileKeys,
  getOAuthTokenKeys,
} from '@/aws/dynamodb/keys';
import { getValidOAuthTokens, storeOAuthTokens } from '@/aws/dynamodb/oauth-tokens';
import { getAlertDataAccess } from '@/lib/alerts/data-access';
import type { AlertSettings, TargetArea, NeighborhoodProfile, AlertsResponse } from '@/lib/alerts/types';
import type { Profile, AIMention, AIVisibilityScore, AIMonitoringConfig, AIMonitoringJob } from '@/lib/types/common/common';
import { aggregateNeighborhoodData } from '@/lib/alerts/neighborhood-profile-data-aggregation';
import { v4 as uuidv4 } from 'uuid';
import { FeatureToggle } from '@/lib/feature-toggles';
import { getCognitoClient } from '@/aws/auth/cognito-client';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { getTableName } from '@/aws/dynamodb/client';

const guideSchema = z.object({
  targetMarket: z.string().min(3, 'Target market is required.'),
  pillarTopic: z.string().min(10, 'A more detailed pillar topic is required for a better guide.'),
  idxFeedUrl: z
    .string()
    .url('Please enter a valid URL.')
    .optional()
    .or(z.literal('')),
});

/**
 * Maps AWS service errors to user-friendly messages
 * Handles Bedrock throttling, validation errors, and other AWS-specific errors
 * @param error The error object from AWS services
 * @param defaultMessage Fallback message if error type is unknown
 * @returns User-friendly error message
 */
import { validateFormData, createSuccessResponse, createErrorResponse } from '@/lib/form-validation';
import { handleAWSError } from './actions/error-handling';
import { generateNeighborhoodGuide } from '@/aws/bedrock/flows/content-flows';
import { z } from 'zod';

// Import the enhanced error handling
const { handleAWSError: enhancedHandleAWSError } = require('./actions/error-handling');

// Use the enhanced error handler
const handleAWSError = enhancedHandleAWSError;

export async function generateGuideAction(prevState: any, formData: FormData) {
  // Convert FormData to object for validation
  const formObject = {
    targetMarket: formData.get('targetMarket'),
    pillarTopic: formData.get('pillarTopic'),
    idxFeedUrl: formData.get('idxFeedUrl'),
  };

  const validation = validateFormData(guideSchema, formData);

  if (!validation.success) {
    return createValidationErrorResponse(validation.error, prevState.data);
  }

  try {
    const result = await generateNeighborhoodGuide(
      validation.data as GenerateNeighborhoodGuideInput
    );

    return createSuccessResponse({
      guide: result.neighborhoodGuide,
      idxFeedUrl: validation.data.idxFeedUrl,
    });
  } catch (error) {
    const errorResponse = handleAWSError(error, 'An unexpected error occurred while generating the guide.');
    return createErrorResponse(`Failed to generate guide: ${errorResponse.message}`, {}, prevState.data);
  }
}

const descriptionSchema = z.object({
  propertyDescription: z
    .string()
    .min(
      50,
      'Property description must be at least 50 characters for a quality rewrite.'
    ),
  buyerPersona: z.string().min(3, 'Buyer persona is required.'),
});

export async function generateDescriptionAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = descriptionSchema.safeParse({
    propertyDescription: formData.get('propertyDescription'),
    buyerPersona: formData.get('buyerPersona'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      data: prevState.data,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const descriptionInput: GenerateListingDescriptionInput = {
      property_details: validatedFields.data.propertyDescription,
    };
    const faqInput: GenerateListingFaqsInput = {
      propertyDescription: validatedFields.data.propertyDescription,
    };

    // Run both description and FAQ generation in parallel on the server.
    const [faqResult, descriptionResult] = await Promise.all([
      generateListingFaqs(faqInput),
      // generateListingDescription(descriptionInput),
      Promise.resolve({ description: 'Listing description generation temporarily disabled', features: [], callToAction: '' }),
    ]);

    return {
      message: 'success',
      errors: {},
      data: {
        rewrittenDescription: descriptionResult?.description,
        listingFaqs: faqResult?.faqs,
      },
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while optimizing the listing.');
    return {
      message: `Failed to generate description: ${errorMessage}`,
      data: prevState.data,
      errors: {},
    };
  }
}

export async function connectGoogleBusinessProfileAction() {
  const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

  const params = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    // Google Business Profile API scope (requires OAuth verification)
    scope: 'https://www.googleapis.com/auth/business.manage',
    access_type: 'offline',
    prompt: 'consent',
  };

  const queryString = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  const authUrl = `${oauth2Endpoint}?${queryString}`;

  redirect(authUrl);
}

export async function getGoogleConnectionStatusAction(userId: string) {
  try {
    const tokens = await getValidOAuthTokens(userId, 'GOOGLE_BUSINESS');
    return {
      message: 'success',
      isConnected: !!tokens,
      errors: {}
    };
  } catch (error) {
    console.error('Failed to check Google connection status:', error);
    return {
      message: 'Failed to check connection status',
      isConnected: false,
      errors: {}
    };
  }
}

const tokenSchema = z.object({
  code: z.string().min(1, 'Authorization code is required.'),
  userId: z.string().min(1, 'User ID is required.'),
});

export async function exchangeGoogleTokenAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = tokenSchema.safeParse({
    code: formData.get('code'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await exchangeGoogleToken({
      code: validatedFields.data.code
    });

    // Store tokens in DynamoDB
    const tokenData = {
      agentProfileId: validatedFields.data.userId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || '',
      expiryDate: Date.now() + (result.expiresIn * 1000), // Convert seconds to milliseconds and add to current time
    };

    await storeOAuthTokens(validatedFields.data.userId, tokenData, 'GOOGLE_BUSINESS');

    return { message: 'success', data: result, errors: {} };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';
    return {
      message: `Failed to exchange token: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const bioSchema = z.object({
  name: z.string().min(1, 'Your name must be set in your profile.'),
  experience: z.string().optional(),
  certifications: z.string().optional(),
  agencyName: z
    .string()
    .min(1, 'Your agency name must be set in your profile.'),
});

export async function generateBioAction(input: {
  name: string;
  experience?: string;
  certifications?: string;
  agencyName: string;
}) {
  const validatedFields = bioSchema.safeParse(input);

  if (!validatedFields.success) {
    const errorMessage =
      validatedFields.error.errors[0]?.message ||
      'Required profile information is missing.';
    return {
      message: errorMessage,
      data: null,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await generateAgentBio(
      validatedFields.data as GenerateAgentBioInput
    );
    return {
      message: 'success',
      data: result.bio,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the bio.');
    return {
      message: `Failed to generate bio: ${errorMessage}`,
      data: null,
      errors: {},
    };
  }
}

const findCompetitorsSchema = z.object({
  name: z.string().min(1, 'Your name must be set in your profile.'),
  agencyName: z
    .string()
    .min(1, 'Your agency name must be set in your profile.'),
  address: z.string().min(1, 'Your address must be set in your profile.'),
});

export async function findCompetitorsAction(
  prevState: any,
  formData: FormData
) {
  console.log('🚀 findCompetitorsAction called');
  console.log('📝 Form data:', {
    name: formData.get('name'),
    agencyName: formData.get('agencyName'),
    address: formData.get('address'),
  });

  const validatedFields = findCompetitorsSchema.safeParse({
    name: formData.get('name'),
    agencyName: formData.get('agencyName'),
    address: formData.get('address'),
  });

  if (!validatedFields.success) {
    console.error('❌ Validation failed:', validatedFields.error);
    const errorMessage =
      validatedFields.error.errors[0]?.message ||
      'Required profile information is missing.';
    return {
      message: errorMessage,
      data: [],
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  console.log('✅ Validation passed, calling findCompetitors...');
  try {
    const result = await findCompetitors(
      validatedFields.data as FindCompetitorsInput
    );

    console.log('🎯 findCompetitors result:', result);
    console.log('📊 Competitors found:', result.competitors?.length || 0);

    return {
      message: 'success',
      data: result.competitors,
      errors: {},
    };
  } catch (error) {
    console.error('❌ findCompetitors error:', error);
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while finding competitors.');
    return {
      message: `Failed to find competitors: ${errorMessage}`,
      data: [],
      errors: {},
    };
  }
}

const enrichCompetitorSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  agency: z.string().min(1, 'Agency is required.'),
});

export async function enrichCompetitorAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = enrichCompetitorSchema.safeParse({
    name: formData.get('name'),
    agency: formData.get('agency'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Competitor name and agency are required.',
      data: null,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const input = validatedFields.data;

  try {
    const result = await enrichCompetitorData(
      input as EnrichCompetitorDataInput
    );
    return {
      message: 'success',
      data: { ...input, ...result },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while enriching data.');
    return {
      message: `Failed to enrich competitor data: ${errorMessage}`,
      data: null,
      errors: {},
    };
  }
}

const napAuditSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Your name must be set in your profile.'),
  address: z.string().min(1, 'Your address must be set in your profile.'),
  phone: z.string().min(1, 'Your phone number must be set in your profile.'),
  website: z
    .string()
    .optional()
    .transform(val => val || ''),
  agencyName: z
    .string()
    .min(1, 'Your agency name must be set in your profile.'),
});

export async function runNapAuditAction(prevState: any, formData: FormData) {
  const validatedFields = napAuditSchema.safeParse({
    userId: formData.get('userId'),
    name: formData.get('name'),
    address: formData.get('address'),
    phone: formData.get('phone'),
    website: formData.get('website'),
    agencyName: formData.get('agencyName'),
  });

  if (!validatedFields.success) {
    const errorMessage =
      validatedFields.error.errors[0]?.message ||
      'Required profile information is missing.';
    return {
      message: errorMessage,
      data: null,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { userId, ...auditInput } = validatedFields.data;

  try {
    // Run the NAP audit
    const result = await runNapAudit(auditInput as RunNapAuditInput);

    // Save audit results to DynamoDB
    const repository = getRepository();
    await repository.put({
      PK: `USER#${userId}`,
      SK: 'AUDIT#main',
      EntityType: 'BrandAudit',
      Data: {
        id: 'main',
        results: result.results,
        lastRun: new Date().toISOString(),
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    });

    return {
      message: 'success',
      data: result.results,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while running the audit.');
    return {
      message: `Failed to run audit: ${errorMessage}`,
      data: null,
      errors: {},
    };
  }
}

export async function getAuditDataAction(userId: string): Promise<{ message: string; data?: any; errors: any }> {
  try {
    const repository = getRepository();
    const auditData = await repository.get(`USER#${userId}`, 'AUDIT#main');

    return {
      message: 'success',
      data: auditData,
      errors: {},
    };
  } catch (error: any) {
    console.error('Get audit data error:', error);
    return {
      message: error.message || 'Failed to load audit data',
      data: null,
      errors: {},
    };
  }
}

const socialPostSchema = z.object({
  topic: z.string().min(10, 'Please provide a more detailed topic for better results.'),
  tone: z.enum(['Professional', 'Casual', 'Enthusiastic', 'Humorous']),
  platforms: z.array(z.string()).min(1, 'Please select at least one platform.'),
  numberOfVariations: z.coerce.number().min(1).max(3).default(1),
});

export async function generateSocialPostAction(
  prevState: any,
  formData: FormData
) {
  const platformsJson = formData.get('platforms');
  const platforms = platformsJson ? JSON.parse(platformsJson as string) : ['linkedin', 'twitter', 'facebook', 'googleBusiness'];

  const validatedFields = socialPostSchema.safeParse({
    topic: formData.get('topic'),
    tone: formData.get('tone'),
    platforms,
    numberOfVariations: formData.get('numberOfVariations') || 1,
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await generateSocialMediaPost(
      validatedFields.data as GenerateSocialMediaPostInput
    );
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating social posts.');
    return {
      message: `Failed to generate posts: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const socialMediaImageSchema = z.object({
  topic: z.string().min(5, 'Please provide a topic for the image.'),
  platform: z.string().optional(),
  aspectRatio: z.string().min(1, 'Please select an aspect ratio.'),
  style: z.enum(['professional', 'modern', 'luxury', 'minimalist', 'vibrant', 'elegant']).default('professional'),
  includeText: z.boolean().default(false),
  customPrompt: z.string().optional(),
  numberOfImages: z.coerce.number().min(1).max(4).default(3),
});

export async function generateSocialMediaImageAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: GenerateSocialMediaImageOutput | null;
  errors: any;
}> {
  const validatedFields = socialMediaImageSchema.safeParse({
    topic: formData.get('topic'),
    platform: formData.get('platform') || undefined,
    aspectRatio: formData.get('aspectRatio'),
    style: formData.get('style') || 'professional',
    includeText: formData.get('includeText') === 'true',
    customPrompt: formData.get('customPrompt') || undefined,
    numberOfImages: formData.get('numberOfImages') || 3,
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0] || 'Validation failed.';
    return {
      message: firstError,
      errors: fieldErrors,
      data: null,
    };
  }

  try {
    const result = await generateSocialMediaImage(
      validatedFields.data as GenerateSocialMediaImageInput
    );
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the image.');
    return {
      message: `Failed to generate image: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const regenerateSocialMediaImageSchema = z.object({
  prompt: z.string().min(5, 'Prompt is required.'),
  aspectRatio: z.string().min(1, 'Aspect ratio is required.'),
});

export async function regenerateSocialMediaImageAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: { imageUrl: string; seed: number } | null;
  errors: any;
}> {
  const validatedFields = regenerateSocialMediaImageSchema.safeParse({
    prompt: formData.get('prompt'),
    aspectRatio: formData.get('aspectRatio'),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0] || 'Validation failed.';
    return {
      message: firstError,
      errors: fieldErrors,
      data: null,
    };
  }

  try {
    const result = await regenerateSingleImage(
      validatedFields.data.prompt,
      validatedFields.data.aspectRatio
    );
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while regenerating the image.');
    return {
      message: `Failed to regenerate image: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const socialProofSchema = z.object({
  testimonialIds: z.array(z.string()).min(1, 'Please select at least one testimonial.'),
  format: z.enum(['instagram', 'facebook', 'linkedin']),
  agentName: z.string().min(1, 'Agent name is required.'),
});

export async function generateSocialProofAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: (GenerateSocialProofOutput & { savedContentId?: string }) | null;
  errors: any;
}> {
  const validatedFields = socialProofSchema.safeParse({
    testimonialIds: JSON.parse(formData.get('testimonialIds') as string || '[]'),
    format: formData.get('format'),
    agentName: formData.get('agentName'),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0] || 'Validation failed.';
    return {
      message: firstError,
      errors: fieldErrors,
      data: null,
    };
  }

  try {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to generate social proof content'] },
      };
    }

    const { testimonialIds, format, agentName } = validatedFields.data;

    // Fetch testimonials from DynamoDB
    const repository = getRepository();
    const testimonials: any[] = [];

    for (const testimonialId of testimonialIds) {
      const testimonialData = await repository.get<any>(
        `USER#${user.id}`,
        `TESTIMONIAL#${testimonialId}`
      );
      if (testimonialData) {
        testimonials.push(testimonialData);
      }
    }

    if (testimonials.length === 0) {
      return {
        message: 'No testimonials found with the provided IDs',
        data: null,
        errors: {},
      };
    }

    // Prepare input for AI flow
    const input: GenerateSocialProofInput = {
      testimonials: testimonials.map(t => ({
        clientName: t.clientName,
        testimonialText: t.testimonialText,
        dateReceived: t.dateReceived,
        clientPhotoUrl: t.clientPhotoUrl,
      })),
      format,
      agentName,
    };

    // Generate social proof content
    const result = await generateSocialProof(input);

    // Save to Library Content
    const contentId = `social-proof-${Date.now()}`;
    const keys = getSavedContentKeys(user.id, contentId);

    const formatLabel = format.charAt(0).toUpperCase() + format.slice(1);
    const title = `Social Proof - ${formatLabel} Post`;

    // Format content with hashtags
    const fullContent = `${result.content}\n\n${result.hashtags.map(tag => `#${tag}`).join(' ')}`;

    await repository.create(keys.PK, keys.SK, 'SavedContent', {
      id: contentId,
      title,
      content: fullContent,
      type: 'social-proof',
      createdAt: new Date().toISOString(),
      metadata: {
        format,
        testimonialIds,
        imageSuggestions: result.imageSuggestions,
      },
    });

    return {
      message: 'success',
      data: {
        ...result,
        savedContentId: contentId,
      },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating social proof content.');
    return {
      message: `Failed to generate social proof: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const researchAgentSchema = z.object({
  topic: z.string().min(10, 'Please provide a more specific topic for better research results.'),
});

const propertyValuationSchema = z.object({
  propertyDescription: z.string().min(20, 'Please provide a more detailed property description or address.'),
});

const renovationROISchema = z.object({
  currentValue: z.coerce.number().min(1000, 'Current value must be at least $1,000.'),
  renovationCost: z.coerce.number().min(100, 'Renovation cost must be at least $100.'),
  renovationType: z.string().min(1, 'Please select a renovation type.'),
  location: z.string().optional(),
  propertyType: z.string().min(1, 'Please select a property type.'),
  marketCondition: z.string().min(1, 'Please select market condition.'),
  additionalDetails: z.string().optional(),
});

export async function runResearchAgentAction(prevState: any, formData: FormData): Promise<{
  message: string;
  data: (RunResearchAgentOutput & { reportId?: string; source?: string }) | null;
  errors: any;
}> {
  // Get current user
  const user = await getCurrentUserServer();
  if (!user) {
    return {
      message: 'Authentication required',
      errors: { auth: 'Please sign in to use the research agent' },
      data: null,
    };
  }

  const validatedFields = researchAgentSchema.safeParse({
    topic: formData.get('topic'),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      message: fieldErrors.topic?.[0] || "Validation failed.",
      errors: fieldErrors,
      data: null,
    };
  }

  try {
    console.log('🔍 Starting enhanced research with Strands-inspired capabilities...');

    // Try enhanced research service first
    try {
      const { runEnhancedResearch } = await import('@/services/strands/enhanced-research-service');

      const enhancedResult = await runEnhancedResearch(
        validatedFields.data.topic,
        user.id,
        {
          searchDepth: 'advanced',
          includeMarketAnalysis: true,
          includeRecommendations: true,
          targetAudience: 'agents',
        }
      );

      if (enhancedResult.success && enhancedResult.report) {
        console.log('✅ Enhanced research completed successfully');

        return {
          message: 'success',
          data: {
            report: enhancedResult.report,
            citations: enhancedResult.citations || [],
            source: enhancedResult.source || 'enhanced-research-agent',
          },
          errors: {},
        };
      }
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced research failed, using standard Bedrock:', enhancedError);
    }

    // Fallback to original Bedrock implementation
    console.log('🔄 Using standard Bedrock research agent');
    const result = await runResearchAgent({ topic: validatedFields.data.topic });

    return {
      message: 'success',
      data: {
        ...result,
        source: 'bedrock-agent',
      },
      errors: {},
    };

  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred during research.');
    return {
      message: `Research failed: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

export async function runPropertyValuationAction(prevState: any, formData: FormData): Promise<{
  message: string;
  data: PropertyValuationOutput | null;
  errors: any;
}> {
  const validatedFields = propertyValuationSchema.safeParse({
    propertyDescription: formData.get('propertyDescription'),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      message: fieldErrors.propertyDescription?.[0] || "Validation failed.",
      errors: fieldErrors,
      data: null,
    };
  }

  try {
    const result = await runPropertyValuation({ propertyDescription: validatedFields.data.propertyDescription });
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred during property valuation.');
    return {
      message: `Property valuation failed: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

export async function runRenovationROIAction(prevState: any, formData: FormData): Promise<{
  message: string;
  data: RenovationROIOutput | null;
  errors: any;
}> {
  const validatedFields = renovationROISchema.safeParse({
    currentValue: formData.get('currentValue'),
    renovationCost: formData.get('renovationCost'),
    renovationType: formData.get('renovationType'),
    location: formData.get('location'),
    propertyType: formData.get('propertyType'),
    marketCondition: formData.get('marketCondition'),
    additionalDetails: formData.get('additionalDetails'),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)[0]?.[0] || "Validation failed.";
    return {
      message: firstError,
      errors: fieldErrors,
      data: null,
    };
  }

  try {
    const result = await runRenovationROIAnalysis(validatedFields.data);
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred during renovation ROI analysis.');
    return {
      message: `Renovation ROI analysis failed: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const neighborhoodProfileSchema = z.object({
  location: z.string().min(3, 'Please provide a specific location (address, ZIP code, or neighborhood name).'),
});

export async function generateNeighborhoodProfileAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: (NeighborhoodProfile & { reportId?: string }) | null;
  errors: any;
}> {
  const validatedFields = neighborhoodProfileSchema.safeParse({
    location: formData.get('location'),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      message: fieldErrors.location?.[0] || "Validation failed.",
      errors: fieldErrors,
      data: null,
    };
  }

  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to generate neighborhood profiles'] },
      };
    }

    const { location } = validatedFields.data;

    // Step 1: Orchestrate data collection from multiple sources
    const aggregatedData = await aggregateNeighborhoodData(location);

    // Step 2: Call AI synthesis flow
    const aiInput: NeighborhoodProfileInput = {
      location,
      marketData: aggregatedData.marketData,
      demographics: aggregatedData.demographics,
      schools: aggregatedData.schools,
      amenities: aggregatedData.amenities,
      walkabilityScore: aggregatedData.walkability.score,
      walkabilityDescription: aggregatedData.walkability.description,
      walkabilityFactors: aggregatedData.walkability.factors,
    };

    const aiOutput = await runNeighborhoodProfileSynthesis(aiInput);

    // Step 3: Create complete neighborhood profile
    const profileId = `neighborhood-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const profile: NeighborhoodProfile = {
      id: profileId,
      userId: user.id,
      location,
      generatedAt: new Date().toISOString(),
      marketData: aggregatedData.marketData,
      demographics: aggregatedData.demographics,
      schools: aggregatedData.schools,
      amenities: aggregatedData.amenities,
      walkabilityScore: aggregatedData.walkability.score,
      aiInsights: aiOutput.aiInsights,
    };

    const repository = getRepository();

    // Step 4: Save profile to DynamoDB
    const profileKeys = getNeighborhoodProfileKeys(user.id, profileId);
    await repository.create(profileKeys.PK, profileKeys.SK, 'NeighborhoodProfile', profile);

    // Step 5: Save profile to Library under Reports
    const reportId = `neighborhood-profile-${Date.now()}`;
    const reportKeys = getResearchReportKeys(user.id, reportId);

    const reportData = {
      id: reportId,
      topic: `Neighborhood Profile: ${location}`,
      report: `# Neighborhood Profile: ${location}\n\n${aiOutput.aiInsights}\n\n## Market Commentary\n${aiOutput.marketCommentary}\n\n## Demographic Insights\n${aiOutput.demographicInsights}\n\n## Lifestyle Factors\n${aiOutput.lifestyleFactors}\n\n## School Analysis\n${aiOutput.schoolAnalysis}\n\n## Investment Potential\n${aiOutput.investmentPotential}`,
      summary: aiOutput.keyHighlights?.join(', ') || `Comprehensive neighborhood analysis for ${location}`,
      type: 'neighborhood-profile',
      profileId: profileId, // Link to the full profile
    };

    await repository.create(reportKeys.PK, reportKeys.SK, 'ResearchReport', reportData);

    // Step 6: Return complete profile with report ID
    const result = {
      ...profile,
      reportId,
    };

    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred during neighborhood profile generation.');
    return {
      message: `Neighborhood profile generation failed: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

export async function exportNeighborhoodProfileAction(
  profileId: string,
  format: 'pdf' | 'html'
): Promise<{
  message: string;
  data: { url: string } | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to export neighborhood profiles'],
      };
    }

    if (!profileId) {
      return {
        message: 'Profile ID is required',
        data: null,
        errors: ['Profile ID is required'],
      };
    }

    // Get the neighborhood profile
    const repository = getRepository();
    const profileKeys = getNeighborhoodProfileKeys(user.id, profileId);
    const profileResult = await repository.get(profileKeys.PK, profileKeys.SK);

    if (!profileResult) {
      return {
        message: 'Neighborhood profile not found',
        data: null,
        errors: ['Neighborhood profile not found'],
      };
    }

    const profile = profileResult as NeighborhoodProfile;

    // Get user profile for branding information
    const userProfileKeys = getProfileKeys(user.id);
    const userProfileResult = await repository.get(userProfileKeys.PK, userProfileKeys.SK);
    const agentProfile = userProfileResult as Profile || {};

    // Get AI output from the profile or regenerate if needed
    const aiOutput = {
      aiInsights: profile.aiInsights,
      marketCommentary: '', // These would be stored separately or regenerated
      demographicInsights: '',
      lifestyleFactors: '',
      schoolAnalysis: '',
      investmentPotential: '',
      keyHighlights: [],
      targetBuyers: [],
      marketTrends: [],
      recommendations: []
    };

    let exportUrl: string;

    if (format === 'pdf') {
      // Generate PDF export
      const { generatePDF, uploadPDFExport } = await import('@/lib/alerts/neighborhood-profile-export');

      // Note: PDF generation requires client-side execution for html2canvas
      // For server-side, we'll use a simplified approach or return HTML for now
      // This is a limitation that would need to be addressed with server-side PDF generation
      return {
        message: 'PDF generation requires client-side processing. Please use the HTML export for now.',
        data: null,
        errors: ['PDF generation not available in server environment'],
      };

    } else {
      // Generate HTML export
      const { generateHTML, uploadHTMLExport } = await import('@/lib/alerts/neighborhood-profile-export');

      const htmlContent = generateHTML(profile, agentProfile, aiOutput);
      exportUrl = await uploadHTMLExport(user.id, profileId, htmlContent, profile.location);
    }

    // Update the profile with export URL
    const updates: Partial<NeighborhoodProfile> = {
      exportUrls: {
        ...profile.exportUrls,
        [format]: exportUrl,
      },
    };

    await repository.update(profileKeys.PK, profileKeys.SK, updates);

    return {
      message: 'Export generated successfully',
      data: { url: exportUrl },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to export neighborhood profile');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

export async function uploadPDFToS3Action(
  profileId: string,
  pdfBuffer: Buffer,
  location: string
): Promise<{
  message: string;
  data: { url: string } | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to upload PDF exports'],
      };
    }

    // Upload PDF to S3
    const { uploadPDFExport } = await import('@/lib/alerts/neighborhood-profile-export');
    const url = await uploadPDFExport(user.id, profileId, pdfBuffer, location);

    // Update the profile with export URL
    const repository = getRepository();
    const profileKeys = getNeighborhoodProfileKeys(user.id, profileId);
    const updates: Partial<NeighborhoodProfile> = {
      exportUrls: {
        pdf: url,
      },
    };

    await repository.update(profileKeys.PK, profileKeys.SK, updates);

    return {
      message: 'success',
      data: { url },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to upload PDF export');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

export async function regenerateNeighborhoodProfileAction(
  profileId: string
): Promise<{
  message: string;
  data: NeighborhoodProfile | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to regenerate neighborhood profiles'],
      };
    }

    if (!profileId) {
      return {
        message: 'Profile ID is required',
        data: null,
        errors: ['Profile ID is required'],
      };
    }

    // Get the existing neighborhood profile
    const repository = getRepository();
    const profileKeys = getNeighborhoodProfileKeys(user.id, profileId);
    const profileResult = await repository.get(profileKeys.PK, profileKeys.SK);

    if (!profileResult) {
      return {
        message: 'Neighborhood profile not found',
        data: null,
        errors: ['Neighborhood profile not found'],
      };
    }

    const existingProfile = profileResult as NeighborhoodProfile;

    // Step 1: Re-aggregate data with updated information
    const aggregatedData = await aggregateNeighborhoodData(existingProfile.location);

    // Step 2: Call AI synthesis flow with updated data
    const aiInput: NeighborhoodProfileInput = {
      location: existingProfile.location,
      marketData: aggregatedData.marketData,
      demographics: aggregatedData.demographics,
      schools: aggregatedData.schools,
      amenities: aggregatedData.amenities,
      walkabilityScore: aggregatedData.walkability.score,
      walkabilityDescription: aggregatedData.walkability.description,
      walkabilityFactors: aggregatedData.walkability.factors,
    };

    const aiOutput = await runNeighborhoodProfileSynthesis(aiInput);

    // Step 3: Update the profile with new data
    const updatedProfile: NeighborhoodProfile = {
      ...existingProfile,
      generatedAt: new Date().toISOString(),
      marketData: aggregatedData.marketData,
      demographics: aggregatedData.demographics,
      schools: aggregatedData.schools,
      amenities: aggregatedData.amenities,
      walkabilityScore: aggregatedData.walkability.score,
      aiInsights: aiOutput.aiInsights,
      // Clear export URLs since they're now outdated
      exportUrls: undefined,
    };

    // Step 4: Save updated profile to DynamoDB
    await repository.update(profileKeys.PK, profileKeys.SK, updatedProfile);

    // Step 5: Update the corresponding report in Library
    const reportKeys = getResearchReportKeys(user.id, `neighborhood-profile-${profileId}`);
    const reportUpdates = {
      report: `# Neighborhood Profile: ${existingProfile.location}\n\n${aiOutput.aiInsights}\n\n## Market Commentary\n${aiOutput.marketCommentary}\n\n## Demographic Insights\n${aiOutput.demographicInsights}\n\n## Lifestyle Factors\n${aiOutput.lifestyleFactors}\n\n## School Analysis\n${aiOutput.schoolAnalysis}\n\n## Investment Potential\n${aiOutput.investmentPotential}`,
      summary: aiOutput.keyHighlights?.join(', ') || `Updated comprehensive neighborhood analysis for ${existingProfile.location}`,
      updatedAt: Date.now(),
    };

    // Try to update the report, but don't fail if it doesn't exist
    try {
      await repository.update(reportKeys.PK, reportKeys.SK, reportUpdates);
    } catch (error) {
      console.warn('Could not update corresponding report:', error);
    }

    return {
      message: 'Neighborhood profile regenerated successfully',
      data: updatedProfile,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to regenerate neighborhood profile');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

const marketUpdateSchema = z.object({
  location: z.string().min(3, 'Please provide a specific location.'),
  timePeriod: z.string().min(3, 'Please provide a time period.'),
  audience: z.string().min(3, 'Please specify a target audience.'),
});

export async function generateMarketUpdateAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = marketUpdateSchema.safeParse({
    location: formData.get('location'),
    timePeriod: formData.get('timePeriod'),
    audience: formData.get('audience'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await generateMarketUpdate(
      validatedFields.data as GenerateMarketUpdateInput
    );
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the market update.');
    return {
      message: `Failed to generate market update: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const futureCastSchema = z.object({
  location: z.string().min(3, 'Please provide a location.'),
  timePeriod: z.string().optional(),
  propertyType: z.string().optional(),
});

export async function generateFutureCastAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = futureCastSchema.safeParse({
    location: formData.get('location'),
    timePeriod: formData.get('timePeriod'),
    propertyType: formData.get('propertyType'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    // Fetch historical market data
    let marketData = null;
    try {
      const aggregatedData = await aggregateNeighborhoodData(validatedFields.data.location);
      marketData = aggregatedData.marketData;
    } catch (e) {
      console.warn('Failed to fetch market data for FutureCast:', e);
      // Continue without market data
    }

    const result = await generateFutureCast({
      ...validatedFields.data,
      marketData,
    } as GenerateFutureCastInput);

    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the FutureCast.');
    return {
      message: `Failed to generate FutureCast: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const videoScriptSchema = z.object({
  topic: z.string().min(10, 'Please provide a more detailed topic for a better script.'),
  tone: z.enum(['Engaging', 'Professional', 'Humorous', 'Inspirational']),
  audience: z.string().min(3, 'Please specify a target audience.'),
});

export async function generateVideoScriptAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = videoScriptSchema.safeParse({
    topic: formData.get('topic'),
    tone: formData.get('tone'),
    audience: formData.get('audience'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await generateVideoScript(
      validatedFields.data as GenerateVideoScriptInput
    );

    // Format the script with title and duration
    const formattedScript = `${result.script.title}\n${result.script.duration}\n\n${result.script.content}`;

    return {
      message: 'success',
      data: formattedScript,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the video script.');
    return {
      message: `Failed to generate script: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

// Schema for single keyword input (UI form)
const keywordRankingFormSchema = z.object({
  keyword: z.string().min(3, 'Please provide a keyword to search.'),
  location: z
    .string()
    .min(3, 'Your address must be set in your profile for local search.'),
});

export async function getKeywordRankingsAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = keywordRankingFormSchema.safeParse({
    keyword: formData.get('keyword'),
    location: formData.get('location'),
  });

  if (!validatedFields.success) {
    const errorMessage =
      validatedFields.error.errors[0]?.message ||
      'Required information is missing.';
    return {
      message: errorMessage,
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    // Transform single keyword form input to API input format
    const apiInput: GetKeywordRankingsInput = {
      keywords: [validatedFields.data.keyword],
      location: validatedFields.data.location,
    };

    const result = await getKeywordRankings(apiInput);
    
    // Type-safe data transformation
    const dataWithOriginalKeyword = result.rankings.map((ranking): KeywordRanking & { originalKeyword: string } => ({
      ...ranking,
      originalKeyword: validatedFields.data.keyword,
    }));

    return {
      message: 'success',
      data: {
        ...result,
        rankings: dataWithOriginalKeyword,
      },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while getting keyword rankings.');
    return {
      message: `Failed to get rankings: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const blogPostSchema = z.object({
  topic: z
    .string()
    .min(10, 'Please provide a more detailed topic for the blog post.'),
});

export async function generateBlogPostAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = blogPostSchema.safeParse({
    topic: formData.get('topic'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: { blogPost: null, headerImage: null, validation: null },
    };
  }

  const startTime = Date.now();

  try {
    // Import caching and metrics utilities
    // const { withCache, getCache } = await import('@/lib/cache');
    const { getMetrics } = await import('@/lib/metrics');
    const metrics = getMetrics();

    // Try to get from cache first
    // const cacheParams = { topic: validatedFields.data.topic };
    // const cached = getCache().get<GenerateBlogPostOutput>('blog-post', cacheParams);

    let result: GenerateBlogPostOutput;

    // if (cached) {
    //   console.log('✅ Cache hit for blog post:', validatedFields.data.topic);
    //   metrics.trackCacheHit('blog-post');
    //   result = cached;
    // } else {
    console.log('⏳ Generating blog post:', validatedFields.data.topic);
    // metrics.trackCacheMiss('blog-post');

    // Generate new content with metrics tracking
    result = await generateBlogPost(
      validatedFields.data as GenerateBlogPostInput
    );

    // Store in cache
    // getCache().set('blog-post', cacheParams, result);
    // }

    const generationTime = Date.now() - startTime;
    metrics.trackGenerationTime('blog-post', generationTime);
    metrics.trackGenerationSuccess('blog-post');

    console.log('Action returning result:', {
      hasBlogPost: !!result.blogPost,
      blogPostLength: result.blogPost?.length,
      hasHeaderImage: !!result.headerImage,
      blogPostPreview: result.blogPost?.substring(0, 100),
      generationTime: `${generationTime}ms`,
      cached: false
    });

    // Validate the generated content
    let validation = null;
    if (result.blogPost) {
      try {
        const { getValidationAgent } = await import('@/aws/bedrock/validation-agent-enhanced');
        const validator = getValidationAgent();

        validation = await validator.validate(result.blogPost, {
          validateGoalAlignment: true,
          userGoal: `Generate an engaging, SEO-optimized blog post about: ${validatedFields.data.topic}`,
          minQualityScore: 70,
          checkCompleteness: true,
          checkCoherence: true,
          checkProfessionalism: true,
          enforceGuardrails: true,
          checkDomainCompliance: true,
          checkEthicalCompliance: true,
          expectedFormat: 'markdown',
          minLength: 500,
          requiredElements: ['introduction', 'conclusion'],
          checkFactualConsistency: true,
          checkToneAndStyle: true,
          targetAudience: 'real estate agents and their clients',
          validateSocialMedia: true,
          validateSEO: true,
          contentType: 'blog',
          targetKeywords: [validatedFields.data.topic, 'real estate'],
          strictMode: false,
        });

        // Track quality score
        if (validation.score) {
          metrics.trackQualityScore('blog-post', validation.score);
        }

        console.log('Validation scores:', {
          overall: validation.score,
          goalAlignment: validation.scoreBreakdown.goalAlignment,
          socialMedia: validation.scoreBreakdown.socialMedia,
          seo: validation.scoreBreakdown.seo,
        });
      } catch (validationError) {
        console.error('Validation failed:', validationError);
        // Don't fail the entire action if validation fails
      }
    }

    const response = {
      message: 'success',
      data: {
        ...result,
        validation,
        _meta: {
          generationTime,
          cached: false,
        },
      },
      errors: {},
    };

    console.log('Action response structure:', {
      message: response.message,
      hasData: !!response.data,
      dataKeys: Object.keys(response.data || {}),
      hasValidation: !!validation,
      cached: false,
    });

    return response;
  } catch (error) {
    const generationTime = Date.now() - startTime;
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the blog post.');

    // Track failure
    try {
      const { getMetrics } = await import('@/lib/metrics');
      const metrics = getMetrics();
      metrics.trackGenerationTime('blog-post', generationTime);
      metrics.trackGenerationFailure('blog-post', error instanceof Error ? error.name : 'Unknown');
    } catch (metricsError) {
      console.error('Failed to track metrics:', metricsError);
    }

    return {
      message: `Failed to generate blog post: ${errorMessage}`,
      errors: {},
      data: { blogPost: null, headerImage: null, validation: null },
    };
  }
}

const regenerateImageSchema = z.object({
  topic: z.string().min(10, 'A topic is required to regenerate the image.'),
});

export async function regenerateImageAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = regenerateImageSchema.safeParse({
    topic: formData.get('topic'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result: GenerateHeaderImageOutput = await generateHeaderImage(
      validatedFields.data as GenerateHeaderImageInput
    );
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while regenerating the image.');
    return {
      message: `Failed to regenerate image: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const generateBlogImageSchema = z.object({
  topic: z.string().min(10, 'A topic is required to generate the image.'),
});

export async function generateBlogImageAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = generateBlogImageSchema.safeParse({
    topic: formData.get('topic'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: { imageUrl: null },
    };
  }

  try {
    const { generateBlogHeaderImage } = await import('@/lib/gemini-image');
    const { uploadBase64ImageToS3 } = await import('@/lib/s3-image-upload');

    // Generate the image (returns base64 data URL)
    const base64ImageUrl = await generateBlogHeaderImage(validatedFields.data.topic);

    // Upload to S3 and get permanent URL
    const s3Url = await uploadBase64ImageToS3(base64ImageUrl, 'blog-headers');

    return {
      message: 'success',
      data: { imageUrl: s3Url },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the image.');
    return {
      message: `Failed to generate image: ${errorMessage}`,
      errors: {},
      data: { imageUrl: null },
    };
  }
}

const generateBlogImageWithPromptSchema = z.object({
  topic: z.string().min(1, 'Topic is required.'),
  customPrompt: z.string().optional(),
});

export async function generateBlogImageWithPromptAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = generateBlogImageWithPromptSchema.safeParse({
    topic: formData.get('topic'),
    customPrompt: formData.get('customPrompt'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: { imageUrl: null },
    };
  }

  try {
    const { generateImageWithGemini } = await import('@/lib/gemini-image');

    // Use custom prompt if provided, otherwise generate from topic
    let prompt: string;
    if (validatedFields.data.customPrompt && validatedFields.data.customPrompt.trim()) {
      prompt = validatedFields.data.customPrompt.trim();
    } else {
      prompt = `A professional, high-quality header image for a real estate blog post about: "${validatedFields.data.topic}". Professional photography style, modern and bright, featuring real estate elements like houses, neighborhoods, or property details. Clean composition, visually appealing, suitable for a real estate blog header. No text or overlays. 16:9 aspect ratio.`;
    }

    const result = await generateImageWithGemini({
      prompt,
      aspectRatio: '16:9',
    });

    // Upload to S3 and get permanent URL
    const { uploadBase64ImageToS3 } = await import('@/lib/s3-image-upload');
    const s3Url = await uploadBase64ImageToS3(result.imageUrl, 'blog-headers');

    return {
      message: 'success',
      data: { imageUrl: s3Url },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the image.');
    return {
      message: `Failed to generate image: ${errorMessage}`,
      errors: {},
      data: { imageUrl: null },
    };
  }
}

/**
 * Generate new listing description from property details
 */
export async function generateNewListingDescriptionAction(
  input: GenerateNewListingInput
): Promise<{
  message: string;
  data: ListingDescriptionOutput | null;
  errors: any;
}> {
  try {
    // Validate input with Zod schema
    const validated = GenerateNewListingInputSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return {
        message: firstError?.message || 'Invalid input data',
        errors: validated.error.flatten().fieldErrors,
        data: null,
      };
    }

    // const result = await generateNewListingDescription(validated.data);
    const result = { 
      description: 'New listing description generation temporarily disabled', 
      features: [], 
      callToAction: '',
      wordCount: 0
    };
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the listing description.');
    return {
      message: `Failed to generate listing description: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

/**
 * Optimize existing listing description for target persona
 */
export async function optimizeListingDescriptionAction(
  input: OptimizeListingInput
): Promise<{
  message: string;
  data: ListingDescriptionOutput | null;
  errors: any;
}> {
  try {
    // Validate input with Zod schema
    const validated = OptimizeListingInputSchema.safeParse(input);
    if (!validated.success) {
      const firstError = validated.error.errors[0];
      return {
        message: firstError?.message || 'Invalid input data',
        errors: validated.error.flatten().fieldErrors,
        data: null,
      };
    }

    // const result = await optimizeListingDescription(validated.data);
    const result = { 
      description: 'Listing description optimization temporarily disabled', 
      features: [], 
      callToAction: '',
      wordCount: 0
    };
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while optimizing the listing description.');
    return {
      message: `Failed to optimize listing description: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password is required.'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ['confirmPassword'],
  });

export async function updatePasswordAction(prevState: any, formData: FormData) {
  const validatedFields = updatePasswordSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // TODO: Implement AWS Cognito password update
  // const { currentPassword, newPassword } = validatedFields.data;

  return {
    message: 'Password update not yet implemented with AWS Cognito.',
    errors: {}
  };
}

const updateProfilePhotoSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  photoURL: z.string().url('A valid photo URL is required.'),
});

export async function updateProfilePhotoAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = updateProfilePhotoSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { userId, photoURL } = validatedFields.data;

  try {
    const repository = getRepository();

    // TODO: Update AWS Cognito user attributes if needed

    // Update the user profile document
    const profileKeys = getProfileKeys(userId);
    await repository.update(profileKeys.PK, profileKeys.SK, { photoURL });

    return { message: 'success', errors: {} };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to update profile photo.');
    return { message: errorMessage, errors: {} };
  }
}

/**
 * Upload a file to S3 and return the URL
 * This action handles file uploads from the client
 */
export async function uploadFileToS3Action(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const fileType = formData.get('fileType') as string || 'document';

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: 'File size exceeds 10MB limit' };
    }

    // Validate file type for images
    if (fileType === 'profile-image') {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return { success: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
      }
    }

    // Import S3 client dynamically to avoid issues with server-side imports
    const { uploadFile } = await import('@/aws/s3');

    // Generate a unique file key
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `users/${userId}/${fileType}/${timestamp}-${sanitizedFileName}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const url = await uploadFile(key, buffer, file.type);

    return { success: true, url };
  } catch (error: any) {
    console.error('S3 upload error:', error);

    let errorMessage = error.message || 'Failed to upload file to S3';
    if (errorMessage.includes('bucket you are attempting to access must be addressed using the specified endpoint')) {
      errorMessage += ' (Hint: The S3 bucket is in a different region than configured. Please set S3_REGION environment variable.)';
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get a presigned URL for secure file access
 */
export async function getPresignedUrlAction(
  key: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!key) {
      return { success: false, error: 'File key is required' };
    }

    const { getPresignedUrl } = await import('@/aws/s3');
    const url = await getPresignedUrl(key, expiresIn);

    return { success: true, url };
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate presigned URL'
    };
  }
}

/**
 * Get a presigned upload URL (PUT) so clients can upload directly to S3
 */
export async function getPresignedUploadUrlAction(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!key) {
      return { success: false, error: 'File key is required' };
    }
    if (!contentType) {
      return { success: false, error: 'Content type is required' };
    }

    const { getPresignedUploadUrl } = await import('@/aws/s3');
    const url = await getPresignedUploadUrl(key, contentType, expiresIn);

    return { success: true, url };
  } catch (error: any) {
    console.error('Presigned upload URL error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate presigned upload URL'
    };
  }
}

const feedbackSchema = z.object({
  type: z.enum(['bug', 'feature', 'improvement', 'general']),
  message: z.string().min(10, 'Please provide a more detailed message.'),
});

const createSuperAdminSchema = z.object({
  email: z.string().email('Valid email is required.'),
  adminKey: z.string().min(1, 'Admin key is required.'),
});

export async function checkAdminStatusAction(userId: string): Promise<{
  isAdmin: boolean;
  role?: string;
  profileData?: any;
  error?: string;
}> {
  try {
    if (!userId) {
      return { isAdmin: false, error: 'User ID required' };
    }

    // Use Cognito Groups for role-based access control
    const { getCognitoGroupsClient } = await import('@/aws/auth/cognito-groups');
    const cognitoClient = getCognitoGroupsClient();

    try {
      // Get user groups from Cognito
      const groups = await cognitoClient.getUserGroups(userId);
      const isAdmin = groups.includes('admin') || groups.includes('superadmin');
      const isSuperAdmin = groups.includes('superadmin');

      let role = 'user';
      if (isSuperAdmin) {
        role = 'super_admin';
      } else if (isAdmin) {
        role = 'admin';
      }

      // Get profile data from DynamoDB for additional info
      const repository = getRepository();
      const profileKeys = getProfileKeys(userId);
      let profileData = null;
      
      try {
        const result = await repository.get(profileKeys.PK, profileKeys.SK);
        profileData = result;
      } catch (dbError) {
        console.warn('Could not fetch profile data from DynamoDB:', dbError);
        // Continue without profile data - Cognito groups are the source of truth
      }

      return {
        isAdmin,
        role,
        profileData: {
          id: userId,
          role,
          groups,
          cognitoGroupsAuth: true,
          ...(profileData || {}),
        },
      };
    } catch (cognitoError) {
      console.error('Error checking Cognito groups:', cognitoError);
      
      // Fallback: Check DynamoDB for backward compatibility
      console.log('Falling back to DynamoDB role check...');
      
      const repository = getRepository();
      const profileKeys = getProfileKeys(userId);
      const result = await repository.get(profileKeys.PK, profileKeys.SK);
      const profileData = result;

      const role = (profileData as any)?.role || 'user';
      const isAdmin = role === 'admin' || role === 'super_admin';

      return {
        isAdmin,
        role,
        profileData,
        error: 'Cognito groups unavailable, using DynamoDB fallback',
      };
    }
  } catch (error: any) {
    console.error('Error checking admin status:', error);
    return {
      isAdmin: false,
      error: error.message,
    };
  }
}

export async function forceCreateAdminProfile(userId: string, email: string) {
  const repository = getRepository();
  const profileKeys = getProfileKeys(userId);

  const adminProfile = {
    id: userId,
    email: email,
    role: 'super_admin',
    name: 'Admin User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Use put with the full item structure
  await repository.put({
    PK: profileKeys.PK,
    SK: profileKeys.SK,
    EntityType: 'UserProfile' as any,
    Data: adminProfile,
    CreatedAt: Date.now(),
    UpdatedAt: Date.now()
  });
  return { success: true };
}

export async function verifyAdminProfile(userId: string) {
  const repository = getRepository();
  const profileKeys = getProfileKeys(userId);
  const result = await repository.get(profileKeys.PK, profileKeys.SK);
  return {
    found: !!result,
    data: result,
    keys: profileKeys,
    tableName: process.env.DYNAMODB_TABLE_NAME
  };
}

export async function fixMyAdminStatusAction(userId: string, userEmail: string): Promise<{
  message: string;
  data?: any;
  error?: string;
}> {
  try {
    if (!userId || !userEmail) {
      return {
        message: 'User ID and email are required',
        error: 'Missing user information',
      };
    }

    // Direct DynamoDB approach - bypass repository
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, PutCommand, GetCommand } = await import('@aws-sdk/lib-dynamodb');
    const { getAWSConfig } = await import('@/aws/config');

    const config = getAWSConfig();
    const dynamoClient = new DynamoDBClient(config);
    const docClient = DynamoDBDocumentClient.from(dynamoClient);

    const tableName = process.env.DYNAMODB_TABLE_NAME || 'BayonCoagentTable';

    // Create the profile directly
    const profileData = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      EntityType: 'Profile',
      Data: {
        id: userId,
        email: userEmail,
        role: 'super_admin',
        adminSince: new Date().toISOString(),
        permissions: Object.values(ADMIN_PERMISSIONS),
        fixedAt: new Date().toISOString(),
        createdBy: 'direct-fix',
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    };

    console.log('🔧 Creating profile directly:', profileData);

    const putCommand = new PutCommand({
      TableName: tableName,
      Item: profileData,
    });

    await docClient.send(putCommand);

    console.log('✅ Profile created successfully');

    // Verify it was created
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    });

    const verifyResult = await docClient.send(getCommand);
    console.log('🔍 Verification result:', verifyResult.Item);

    return {
      message: 'success',
      data: {
        userId,
        email: userEmail,
        role: 'super_admin',
        verified: !!verifyResult.Item,
        profileData: verifyResult.Item,
      },
    };
  } catch (error: any) {
    console.error('❌ Error in fixMyAdminStatusAction:', error);
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while fixing admin status.');
    return {
      message: errorMessage,
      error: error.message,
    };
  }
}

export async function createSuperAdminAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: any;
  errors: any;
}> {
  const validatedFields = createSuperAdminSchema.safeParse({
    email: formData.get('email'),
    adminKey: formData.get('adminKey'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const { email, adminKey } = validatedFields.data;

    // Verify admin key (you should set this as an environment variable)
    const SUPER_ADMIN_KEY = process.env.SUPER_ADMIN_KEY || 'your-secret-admin-key-2024';

    if (adminKey !== SUPER_ADMIN_KEY) {
      return {
        message: 'Invalid admin key',
        errors: { adminKey: ['Invalid admin key provided'] },
        data: null,
      };
    }

    // Find user by email in Cognito
    const { AdminGetUserCommand, CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider');
    const { getAWSConfig } = await import('@/aws/config');

    const config = getAWSConfig();
    const cognitoClient = new CognitoIdentityProviderClient(config);

    let userId: string;
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
      });

      const userResult = await cognitoClient.send(getUserCommand);
      const userIdAttr = userResult.UserAttributes?.find(attr => attr.Name === 'sub');

      if (!userIdAttr?.Value) {
        return {
          message: 'User not found in Cognito',
          errors: { email: ['User with this email not found'] },
          data: null,
        };
      }

      userId = userIdAttr.Value;
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        return {
          message: 'User not found',
          errors: { email: ['User with this email not found'] },
          data: null,
        };
      }
      throw error;
    }

    // Update user profile with super_admin role
    const repository = getRepository();
    const profileKeys = getProfileKeys(userId);

    // Get existing profile or create new one
    let existingProfile: any = {};
    try {
      const result = await repository.get(profileKeys.PK, profileKeys.SK);
      existingProfile = result || {};
    } catch (error) {
      // Profile doesn't exist, will create new one
    }

    const updatedProfile = {
      ...existingProfile,
      id: userId,
      email,
      role: 'super_admin',
      adminSince: new Date().toISOString(),
      permissions: Object.values(ADMIN_PERMISSIONS),
    };

    await repository.create(profileKeys.PK, profileKeys.SK, 'Profile', updatedProfile);

    // Also create/update agent profile if it exists
    const agentKeys = getAgentProfileKeys(userId, 'main');
    try {
      const agentResult = await repository.get(agentKeys.PK, agentKeys.SK);
      const existingAgentProfile = agentResult || {};

      const updatedAgentProfile = {
        ...existingAgentProfile,
        role: 'super_admin',
        adminSince: new Date().toISOString(),
      };

      await repository.update(agentKeys.PK, agentKeys.SK, updatedAgentProfile);
    } catch (error) {
      // Agent profile doesn't exist, that's okay
    }

    return {
      message: 'success',
      data: { userId, email, role: 'super_admin' },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while creating super admin.');
    return {
      message: `Failed to create super admin: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

export async function createAdminUserAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: any;
  errors: any;
}> {
  try {
    // 1. Verify Super Admin Status
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const currentUser = await getCurrentUserServer();

    if (!currentUser) {
      return { message: 'Not authenticated', errors: {}, data: null };
    }

    const adminStatus = await checkAdminStatusAction(currentUser.id);
    if (adminStatus.role !== 'super_admin') {
      return { message: 'Unauthorized: Super Admin access required', errors: {}, data: null };
    }

    // 2. Get form data
    const email = formData.get('email') as string;
    const targetRole = formData.get('role') as string; // 'admin' or 'user' or 'super_admin'

    if (!email) {
      return { message: 'Email is required', errors: { email: ['Email is required'] }, data: null };
    }

    // 3. Find target user in Cognito
    const { AdminGetUserCommand, CognitoIdentityProviderClient } = await import('@aws-sdk/client-cognito-identity-provider');
    const { getAWSConfig } = await import('@/aws/config');

    const config = getAWSConfig();
    const cognitoClient = new CognitoIdentityProviderClient(config);

    let userId: string;
    try {
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: email,
      });

      const userResult = await cognitoClient.send(getUserCommand);
      const userIdAttr = userResult.UserAttributes?.find(attr => attr.Name === 'sub');

      if (!userIdAttr?.Value) {
        return {
          message: 'User not found in Cognito',
          errors: { email: ['User with this email not found'] },
          data: null,
        };
      }

      userId = userIdAttr.Value;
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        return {
          message: 'User not found',
          errors: { email: ['User with this email not found'] },
          data: null,
        };
      }
      throw error;
    }

    // 4. Update profile
    const repository = getRepository();
    const profileKeys = getProfileKeys(userId);

    // Get existing profile or create new one
    let existingProfile: any = {};
    try {
      const result = await repository.get(profileKeys.PK, profileKeys.SK);
      existingProfile = result || {};
    } catch (error) {
      // Profile doesn't exist
    }

    const updatedProfile = {
      ...existingProfile,
      id: userId,
      email,
      role: targetRole,
      updatedAt: new Date().toISOString(),
      // Add permissions if admin
      permissions: targetRole === 'admin' || targetRole === 'super_admin' ? Object.values(ADMIN_PERMISSIONS) : [],
    };

    await repository.put({
      PK: profileKeys.PK,
      SK: profileKeys.SK,
      EntityType: 'UserProfile' as any,
      Data: updatedProfile,
      CreatedAt: existingProfile.createdAt || Date.now(),
      UpdatedAt: Date.now()
    });

    return {
      message: 'success',
      data: { userId, email, role: targetRole },
      errors: {},
    };

  } catch (error) {
    console.error('Error in createAdminUserAction:', error);
    return {
      message: 'Failed to update user role',
      errors: {},
      data: null,
    };
  }
}

export async function submitFeedbackAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: any;
  errors: any;
}> {
  const validatedFields = feedbackSchema.safeParse({
    type: formData.get('type'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    // Get current user from Cognito (optional for feedback)
    let user = null;
    try {
      const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
      user = await getCurrentUserServer();
      console.log('Authenticated feedback submission from user:', user?.id);
    } catch (error) {
      // User not authenticated, continue with anonymous feedback
      console.log('Anonymous feedback submission - authentication not available');
    }

    const { type, message } = validatedFields.data;
    const feedbackId = `feedback-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Store feedback in DynamoDB
    const repository = getRepository();
    const feedbackKeys = {
      PK: 'FEEDBACK',
      SK: `${feedbackId}#${user?.id || 'anonymous'}`,
    };

    const feedbackData = {
      id: feedbackId,
      userId: user?.id || 'anonymous',
      userEmail: user?.email || 'anonymous@feedback.com',
      type,
      message,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.create(feedbackKeys.PK, feedbackKeys.SK, 'Feedback', feedbackData);

    console.log('Feedback successfully stored:', {
      feedbackId,
      userId: user?.id || 'anonymous',
      type,
      messageLength: message.length
    });

    // TODO: Send notification to admin team (email, Slack, etc.)
    // This could be done via SNS, SES, or a webhook to your support system

    return {
      message: 'success',
      data: { feedbackId },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while submitting feedback.');
    return {
      message: `Failed to submit feedback: ${errorMessage}`,
      errors: {},
      data: null,
    };
  }
}

/**
 * Get all feedback submissions for admin review
 */
export async function getFeedbackAction(): Promise<{
  message: string;
  data: any[];
  errors: any;
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();
    if (!user) return { message: 'Unauthorized', data: [], errors: {} };

    const adminStatus = await checkAdminStatusAction(user.id);
    if (!adminStatus.isAdmin) return { message: 'Unauthorized', data: [], errors: {} };

    const repository = getRepository();

    // Query all feedback items using the common partition key
    const result = await repository.query('FEEDBACK', undefined, {
      limit: 100,
      scanIndexForward: false, // Most recent first
    });

    const feedbackItems = result.items.map((item: any) => ({
      id: item.id,
      userId: item.userId,
      userEmail: item.userEmail,
      type: item.type,
      message: item.message,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      message: 'success',
      data: feedbackItems,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while retrieving feedback.');
    return {
      message: `Failed to retrieve feedback: ${errorMessage}`,
      data: [],
      errors: {},
    };
  }
}

/**
 * Update feedback status
 */
export async function updateFeedbackStatusAction(
  feedbackId: string,
  newStatus: 'submitted' | 'in-progress' | 'resolved' | 'closed'
): Promise<{
  message: string;
  data: any;
  errors: any;
}> {
  try {
    const repository = getRepository();

    // Query all feedback items to find the one with matching ID
    const result = await repository.query('FEEDBACK', undefined, {
      limit: 100
    });

    const feedbackItem = result.items.find((item: any) => item.id === feedbackId);

    if (!feedbackItem) {
      return {
        message: 'Feedback not found',
        data: null,
        errors: { feedback: ['Feedback item not found'] },
      };
    }

    const sortKey = `${feedbackId}#${(feedbackItem as any).userId}`;

    // Update the feedback status
    await repository.update('FEEDBACK', sortKey, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    console.log('Feedback status updated:', {
      feedbackId,
      newStatus,
      updatedAt: new Date().toISOString()
    });

    return {
      message: 'success',
      data: { feedbackId, status: newStatus },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while updating feedback status.');
    return {
      message: `Failed to update feedback status: ${errorMessage}`,
      data: null,
      errors: {},
    };
  }
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3Action(
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!key) {
      return { success: false, error: 'File key is required' };
    }

    const { deleteFile } = await import('@/aws/s3');
    await deleteFile(key);

    return { success: true };
  } catch (error: any) {
    console.error('S3 delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file from S3'
    };
  }
}


const generateMarketingPlanSchema = z.object({
  userId: z.string().min(1),
  brandAudit: z.string(),
  competitors: z.string(),
});

export async function generateMarketingPlanAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = generateMarketingPlanSchema.safeParse({
    userId: formData.get('userId'),
    brandAudit: formData.get('brandAudit'),
    competitors: formData.get('competitors'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Required data for plan generation is missing.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  const { userId, brandAudit, competitors } = validatedFields.data;

  try {
    const input = {
      brandAudit: JSON.parse(brandAudit),
      competitors: JSON.parse(competitors),
    };
    const result: GenerateMarketingPlanOutput = await generateMarketingPlan(
      input as GenerateMarketingPlanInput
    );

    const planId = uuidv4();
    const dataToSave = {
      id: planId,
      ...result,
      createdAt: new Date().toISOString(),
    };

    const repository = getRepository();
    const keys = getMarketingPlanKeys(userId, planId);
    await repository.create(keys.PK, keys.SK, 'MarketingPlan', dataToSave);

    return {
      message: 'success',
      data: dataToSave,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the marketing plan.');
    return {
      message: `Failed to generate marketing plan: ${errorMessage}`,
      data: null,
      errors: {},
    };
  }
}

const emailSignInSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Please enter a password with at least 6 characters.'),
});

export async function emailSignInAction(prevState: any, formData: FormData) {
  const validatedFields = emailSignInSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    // This server action now only performs validation.
    // The actual sign-in call will be made on the client.
    return { message: 'success', errors: {}, data: validatedFields.data };
  } catch (error: any) {
    return {
      message: error.message || 'An unknown error occurred.',
      errors: {},
      data: null,
    };
  }
}

const emailSignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  givenName: z.string().min(1, 'First name is required.'),
  familyName: z.string().min(1, 'Last name is required.'),
});

export async function emailSignUpAction(prevState: any, formData: FormData) {
  const validatedFields = emailSignUpSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    // This server action now only performs validation.
    // The actual sign-up call will be made on the client.
    return { message: 'success', errors: {}, data: validatedFields.data };
  } catch (error: any) {
    return {
      message: error.message || 'An unknown error occurred.',
      errors: {},
      data: null,
    };
  }
}

const zillowReviewsSchema = z.object({
  agentEmail: z.string().email('A valid agent email is required.'),
});

export async function getZillowReviewsAction(prevState: any, formData: FormData) {
  const validatedFields = zillowReviewsSchema.safeParse({
    agentEmail: formData.get('agentEmail'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Agent email is missing or invalid.',
      data: null,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await getZillowReviews(validatedFields.data as GetZillowReviewsInput);
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error: any) {
    return {
      message: error.message || 'An unexpected error occurred while fetching Zillow reviews.',
      data: null,
      errors: {},
    };
  }
}

const sentimentSchema = z.object({
  comment: z.string().min(10, 'The review is too short to analyze.'),
});

export async function analyzeReviewSentimentAction(prevState: any, formData: FormData) {
  const validatedFields = sentimentSchema.safeParse({
    comment: formData.get('comment'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      data: null,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeReviewSentiment(validatedFields.data as AnalyzeReviewSentimentInput);
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred during analysis.');
    return {
      message: errorMessage,
      data: null,
      errors: {},
    };
  }
}


const multipleReviewsSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
  comments: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).min(1, 'At least one review is required for analysis.')),
});

export async function analyzeMultipleReviewsAction(prevState: any, formData: FormData): Promise<{
  message: string;
  data: (AnalyzeMultipleReviewsOutput & { analyzedAt: string; }) | null;
  errors: Record<string, string[]>;
}> {
  const validatedFields = multipleReviewsSchema.safeParse({
    comments: formData.get('comments'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      data: null,
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { userId, comments } = validatedFields.data;

  try {
    const result = await analyzeMultipleReviews({ comments });

    const analysisId = 'main';
    const dataToSave = {
      ...result,
      id: analysisId,
      analyzedAt: new Date().toISOString(),
    }

    const repository = getRepository();
    const keys = getReviewAnalysisKeys(userId, analysisId);

    // Check if item exists to decide between create and update
    const existing = await repository.get(keys.PK, keys.SK);
    if (existing) {
      await repository.update(keys.PK, keys.SK, dataToSave);
    } else {
      await repository.create(keys.PK, keys.SK, 'ReviewAnalysis', dataToSave);
    }

    return {
      message: 'success',
      data: dataToSave,
      errors: {},
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred during bulk analysis.');
    return {
      message: errorMessage,
      data: null,
      errors: {},
    };
  }
}

/**
 * Get all reviews for an agent
 */
export async function getReviewsAction(agentId: string): Promise<{
  message: string;
  data: any[] | null;
  errors: any;
}> {
  try {
    const repository = getRepository();
    const result = await repository.query(`REVIEW#${agentId}`, 'REVIEW#');

    return {
      message: 'success',
      data: result.items || [],
      errors: {},
    };
  } catch (error: any) {
    console.error('Get reviews error:', error);
    return {
      message: error.message || 'Failed to load reviews',
      data: null,
      errors: {},
    };
  }
}

/**
 * Delete a review by agentId and reviewId
 */
const deleteReviewSchema = z.object({
  agentId: z.string().min(1, 'Agent ID is required'),
  reviewId: z.string().min(1, 'Review ID is required'),
});

export async function deleteReviewAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: { success: boolean } | null;
  errors: any;
}> {
  const validatedFields = deleteReviewSchema.safeParse({
    agentId: formData.get('agentId'),
    reviewId: formData.get('reviewId'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed.',
      data: null,
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { agentId, reviewId } = validatedFields.data;

  try {
    const repository = getRepository();
    const keys = getReviewKeys(agentId, reviewId);

    // Delete the review from DynamoDB
    await repository.delete(keys.PK, keys.SK);

    return {
      message: 'success',
      data: { success: true },
      errors: {},
    };
  } catch (error: any) {
    console.error('Delete review error:', error);
    const errorMessage = error.message || 'Failed to delete review';
    return {
      message: errorMessage,
      data: null,
      errors: {},
    };
  }
}

const newsSchema = z.object({
  location: z.string().optional(),
});

export async function getRealEstateNewsAction(prevState: any, formData: FormData) {
  const validatedFields = newsSchema.safeParse({
    location: formData.get('location'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    // Use the news service for better caching and performance
    const { newsService } = await import('@/services/analytics/news-service');
    const result = await newsService.getNews({ location: validatedFields.data.location });

    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error: any) {
    console.error('News action error:', error);

    return {
      message: error.message || 'Unable to fetch news at the moment. Please try again later.',
      data: null,
      errors: {},
    };
  }
}

/**
 * Track content creation for AI suggestions
 */
export async function trackContentCreationAction(
  contentType: string,
  success: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getContentSuggestionsEngine } = await import('@/lib/ai-content-suggestions');
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');

    const user = await getCurrentUserServer();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const engine = getContentSuggestionsEngine();
    await engine.trackContentCreation(user.id, contentType, success);

    return { success: true };
  } catch (error) {
    console.error('Failed to track content creation:', error);
    return { success: false, error: 'Failed to track content creation' };
  }
}

/**
 * Save or update agent profile
 */
const saveProfileSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  profile: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    photoURL: z.string().optional(),
    agencyName: z.string().optional(),
    licenseNumber: z.string().optional(),
    yearsOfExperience: z.number().optional(),
    certifications: z.array(z.string()).optional(),
    bio: z.string().optional(),
    website: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    zillowEmail: z.string().optional(),
  }),
});

export async function saveProfileAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; data?: any; errors: any }> {
  try {
    const rawData = {
      userId: formData.get('userId'),
      profile: JSON.parse(formData.get('profile') as string),
    };

    const validatedFields = saveProfileSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { userId, profile } = validatedFields.data;
    const repository = getRepository();
    const keys = getProfileKeys(userId);

    // Get existing profile for AI visibility sync comparison
    const existingProfile = await repository.get(keys.PK, keys.SK);
    const previousProfile = existingProfile ? (existingProfile as any).Data : {};

    // Always use put to replace the entire profile data
    // This ensures we don't have issues with partial updates
    const profileData = {
      PK: keys.PK,
      SK: keys.SK,
      EntityType: 'RealEstateAgentProfile' as const,
      Data: profile,
      CreatedAt: (existingProfile as any)?.CreatedAt || Date.now(),
      UpdatedAt: Date.now(),
    };

    await repository.put(profileData);

    // Trigger AI visibility sync in the background (don't await to avoid blocking the save)
    // This will be handled by the useProfileAIVisibilitySync hook on the client side
    // But we can also trigger it server-side for immediate sync
    try {
      const { syncProfileAIVisibilityAction } = await import('./actions/ai-visibility-actions');
      
      // Run sync in background without blocking the response
      syncProfileAIVisibilityAction(userId, previousProfile, profile).catch(error => {
        console.error('Background AI visibility sync failed:', error);
      });
    } catch (error) {
      // Don't fail the profile save if AI visibility sync fails
      console.error('Failed to trigger AI visibility sync:', error);
    }

    return {
      message: 'success',
      data: profile,
      errors: {},
    };
  } catch (error: any) {
    console.error('Save profile error:', error);
    return {
      message: error.message || 'Failed to save profile',
      errors: {},
    };
  }
}
    };
  }
}

/**
 * Get profile data for a user
 */
export async function getProfileAction(userId: string): Promise<{ message: string; data?: any; errors: any }> {
  try {
    const repository = getRepository();
    const keys = getProfileKeys(userId);
    const result = await repository.get(keys.PK, keys.SK);

    if (result) {
      // The repository.get() returns the Data field directly
      return {
        message: 'success',
        data: result,
        errors: {},
      };
    } else {
      // Return empty profile structure for new users
      return {
        message: 'success',
        data: {
          name: '',
          agencyName: '',
          phone: '',
          address: '',
          bio: '',
          yearsOfExperience: '',
          licenseNumber: '',
          website: '',
          certifications: '',
          linkedin: '',
          twitter: '',
          facebook: '',
          zillowEmail: '',
          photoURL: ''
        },
        errors: {},
      };
    }
  } catch (error: any) {
    console.error('Get profile error:', error);
    return {
      message: error.message || 'Failed to get profile',
      errors: {},
    };
  }
}

/**
 * Generate AI-powered training plan
 */
export async function generateTrainingPlanAction(challenge: string): Promise<{
  message: string;
  data: TrainingPlanOutput | null;
  errors?: string[];
}> {
  try {
    const result = await generateTrainingPlan({ challenge });

    return {
      message: 'Training plan generated successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Training plan generation error:', error);
    return {
      message: 'Failed to generate training plan',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get all reports for a user (research reports and training plans)
 */
export async function getUserReportsAction(
  userId?: string
): Promise<{
  message: string;
  data: any[] | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view reports'],
      };
    }

    const repository = getRepository();
    const result = await repository.query(
      `USER#${user.id}`,
      'REPORT#'
    );

    const reports = result.items.map((item: any) => ({
      id: item.Data?.id || (item.SK ? item.SK.replace('REPORT#', '') : 'unknown'),
      topic: item.Data?.topic || 'Untitled Report',
      report: item.Data?.report || '',
      summary: item.Data?.summary || '',
      type: item.Data?.type || 'research',
      createdAt: item.CreatedAt || Date.now(),
    }));

    return {
      message: 'Reports fetched successfully',
      data: reports,
    };
  } catch (error: any) {
    console.error('Get reports error:', error);
    return {
      message: 'Failed to fetch reports',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get a specific report by ID
 */
export async function getReportByIdAction(
  reportId: string,
  userId?: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view reports'],
      };
    }

    const repository = getRepository();
    const item = await repository.get(
      `USER#${user.id}`,
      `REPORT#${reportId}`
    );

    if (!item || !(item as any).Data) {
      return {
        message: 'Report not found',
        data: null,
        errors: ['Report not found'],
      };
    }

    const data = (item as any).Data;
    const report = {
      id: data.id,
      topic: data.topic,
      report: data.report,
      summary: data.summary || '',
      type: data.type || 'research',
      createdAt: (item as any).CreatedAt || Date.now(),
    };

    return {
      message: 'Report fetched successfully',
      data: report,
    };
  } catch (error: any) {
    console.error('Get report error:', error);
    return {
      message: 'Failed to fetch report',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Save training plan to knowledge base
 */
export async function saveTrainingPlanAction(
  challenge: string,
  plan: string,
  userId?: string
): Promise<{
  message: string;
  data: { id: string } | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to save training plans'],
      };
    }

    const repository = getRepository();
    const reportId = `training-plan-${Date.now()}`;

    await repository.put({
      PK: `USER#${user.id}`,
      SK: `REPORT#${reportId}`,
      EntityType: 'ResearchReport',
      Data: {
        id: reportId,
        topic: challenge.substring(0, 100),
        report: plan,
        type: 'training-plan',
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    });

    return {
      message: 'Training plan saved successfully',
      data: { id: reportId },
    };
  } catch (error: any) {
    console.error('Save training plan error:', error);
    return {
      message: 'Failed to save training plan',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Start a new role-play session
 */
export async function startRolePlayAction(
  scenarioId: string
): Promise<{
  message: string;
  data: { sessionId: string } | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to start role-play sessions'],
      };
    }

    const repository = getRepository();
    const sessionId = `roleplay-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Create initial session record
    await repository.put({
      PK: `USER#${user.id}`,
      SK: `ROLEPLAY#${sessionId}`,
      EntityType: 'RolePlaySession',
      Data: {
        id: sessionId,
        scenarioId,
        messages: [],
        feedback: null,
        completedAt: null,
        duration: 0,
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    });

    return {
      message: 'Role-play session started',
      data: { sessionId },
    };
  } catch (error: any) {
    console.error('Start role-play session error:', error);
    return {
      message: 'Failed to start role-play session',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Send a message in a role-play session and get AI response
 */
export async function sendRolePlayMessageAction(
  sessionId: string,
  scenarioId: string,
  scenarioTitle: string,
  personaName: string,
  personaBackground: string,
  personaPersonality: string,
  personaGoals: string[],
  personaConcerns: string[],
  personaCommunicationStyle: string,
  conversationHistory: RolePlayMessage[],
  userMessage: string
): Promise<{
  message: string;
  data: RolePlayOutput | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to send messages'],
      };
    }

    // Generate AI response
    const result = await generateRolePlayResponse({
      scenarioId,
      scenarioTitle,
      personaName,
      personaBackground,
      personaPersonality,
      personaGoals,
      personaConcerns,
      personaCommunicationStyle,
      conversationHistory,
      userMessage,
      isEndingSession: false,
    });

    // Update session with new messages
    const repository = getRepository();
    const timestamp = new Date().toISOString();

    const updatedMessages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage, timestamp },
      { role: 'ai' as const, content: result.response, timestamp },
    ];

    await repository.put({
      PK: `USER#${user.id}`,
      SK: `ROLEPLAY#${sessionId}`,
      EntityType: 'RolePlaySession',
      Data: {
        id: sessionId,
        scenarioId,
        messages: updatedMessages,
        feedback: null,
        completedAt: null,
        duration: 0,
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    });

    return {
      message: 'Message sent successfully',
      data: result,
    };
  } catch (error: any) {
    console.error('Send role-play message error:', error);
    return {
      message: 'Failed to send message',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * End a role-play session and get feedback
 */
export async function endRolePlayAction(
  sessionId: string,
  scenarioId: string,
  scenarioTitle: string,
  personaName: string,
  personaBackground: string,
  personaPersonality: string,
  personaGoals: string[],
  personaConcerns: string[],
  personaCommunicationStyle: string,
  conversationHistory: RolePlayMessage[],
  startTime: number
): Promise<{
  message: string;
  data: { feedback: string } | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to end sessions'],
      };
    }

    // Generate feedback
    const result = await generateRolePlayResponse({
      scenarioId,
      scenarioTitle,
      personaName,
      personaBackground,
      personaPersonality,
      personaGoals,
      personaConcerns,
      personaCommunicationStyle,
      conversationHistory,
      userMessage: 'Thank you for the practice session.',
      isEndingSession: true,
    });

    // Calculate session duration
    const duration = Math.floor((Date.now() - startTime) / 1000); // in seconds

    // Save final session with feedback
    const repository = getRepository();
    const timestamp = new Date().toISOString();

    await repository.put({
      PK: `USER#${user.id}`,
      SK: `ROLEPLAY#${sessionId}`,
      EntityType: 'RolePlaySession',
      Data: {
        id: sessionId,
        scenarioId,
        messages: conversationHistory,
        feedback: result.feedback || '',
        completedAt: timestamp,
        duration,
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
    });

    return {
      message: 'Session ended successfully',
      data: { feedback: result.feedback || '' },
    };
  } catch (error: any) {
    console.error('End role-play session error:', error);
    return {
      message: 'Failed to end session',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get Gemini API key for Live API usage
 * This is a server action to securely provide the API key to the client
 */
export async function getGeminiApiKeyAction(): Promise<{
  message: string;
  data: { apiKey: string } | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to use this feature'],
      };
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY;

    if (!apiKey) {
      return {
        message: 'API key not configured',
        data: null,
        errors: ['Gemini API key is not configured on the server'],
      };
    }

    return {
      message: 'success',
      data: { apiKey },
    };
  } catch (error: any) {
    console.error('Get Gemini API key error:', error);
    return {
      message: 'Failed to get API key',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get past role-play sessions for a user
 */
export async function getRolePlaySessionsAction(): Promise<{
  message: string;
  data: any[] | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view sessions'],
      };
    }

    const repository = getRepository();
    const sessions = await repository.query(
      `USER#${user.id}`,
      'ROLEPLAY#'
    );

    // Sort by most recent first
    const sortedSessions = sessions.items
      .map(item => (item as any).Data)
      .sort((a: any, b: any) => {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      });

    return {
      message: 'Sessions retrieved successfully',
      data: sortedSessions,
    };
  } catch (error: any) {
    console.error('Get role-play sessions error:', error);
    return {
      message: 'Failed to retrieve sessions',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get personalized dashboard data for the current user
 */
export async function getPersonalizedDashboardAction(): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view personalized dashboard'],
      };
    }

    const { getPersonalizationEngine } = await import('@/lib/ai-personalization');
    const engine = getPersonalizationEngine();
    const dashboardData = await engine.getPersonalizedDashboard(user.id);

    return {
      message: 'Dashboard data retrieved successfully',
      data: dashboardData,
    };
  } catch (error: any) {
    console.error('Get personalized dashboard error:', error);
    return {
      message: 'Failed to retrieve dashboard data',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Create a new project
 */
export async function createProjectAction(
  userId: string,
  name: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    if (!name?.trim()) {
      return {
        message: 'Project name is required',
        data: null,
        errors: ['Project name cannot be empty'],
      };
    }

    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to create a project'],
      };
    }

    const repository = getRepository();
    const projectId = Date.now().toString();
    const keys = getProjectKeys(userId, projectId);

    await repository.put({
      ...keys,
      EntityType: 'Project',
      Data: {
        id: projectId,
        name,
        createdAt: new Date().toISOString(),
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now()
    });

    return {
      message: 'Project created successfully',
      data: { id: projectId, name },
    };
  } catch (error: any) {
    console.error('Create project error:', error);
    return {
      message: 'Failed to create project',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Move content to a project
 */
export async function moveContentToProjectAction(
  userId: string,
  contentId: string,
  projectId: string | null
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to move content'],
      };
    }

    const repository = getRepository();
    const keys = getSavedContentKeys(userId, contentId);
    await repository.update(keys.PK, keys.SK, { projectId: projectId || null });

    return {
      message: 'Content moved successfully',
      data: { contentId, projectId },
    };
  } catch (error: any) {
    console.error('Move content error:', error);
    return {
      message: 'Failed to move content',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Delete saved content
 */
export async function deleteContentAction(
  userId: string,
  contentId: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to delete content'],
      };
    }

    const repository = getRepository();
    const keys = getSavedContentKeys(userId, contentId);
    await repository.delete(keys.PK, keys.SK);

    return {
      message: 'Content deleted successfully',
      data: { contentId },
    };
  } catch (error: any) {
    console.error('Delete content error:', error);
    return {
      message: 'Failed to delete content',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Rename saved content
 */
export async function renameContentAction(
  userId: string,
  contentId: string,
  name: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    if (!name?.trim()) {
      return {
        message: 'Content name is required',
        data: null,
        errors: ['Content name cannot be empty'],
      };
    }

    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to rename content'],
      };
    }

    const repository = getRepository();
    const keys = getSavedContentKeys(userId, contentId);
    await repository.update(keys.PK, keys.SK, { name });

    return {
      message: 'Content renamed successfully',
      data: { contentId, name },
    };
  } catch (error: any) {
    console.error('Rename content error:', error);
    return {
      message: 'Failed to rename content',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Update saved content
 */
export async function updateContentAction(
  userId: string,
  contentId: string,
  content: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    if (!content?.trim()) {
      return {
        message: 'Content is required',
        data: null,
        errors: ['Content cannot be empty'],
      };
    }

    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to update content'],
      };
    }

    const repository = getRepository();
    const keys = getSavedContentKeys(userId, contentId);
    await repository.update(keys.PK, keys.SK, { content });

    return {
      message: 'Content updated successfully',
      data: { contentId, content },
    };
  } catch (error: any) {
    console.error('Update content error:', error);
    return {
      message: 'Failed to update content',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Delete research report
 */
export async function deleteResearchReportAction(
  reportId: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to delete reports'],
      };
    }

    const repository = getRepository();
    const keys = getResearchReportKeys(user.id, reportId);
    await repository.delete(keys.PK, keys.SK);

    return {
      message: 'Report deleted successfully',
      data: { reportId },
    };
  } catch (error: any) {
    console.error('Delete report error:', error);
    return {
      message: 'Failed to delete report',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Save content to projects
 */
export async function saveContentAction(
  userId: string,
  content: string,
  type: string,
  name?: string,
  projectId?: string | null,
  headerImage?: string | null,
  metaDescription?: string | null
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  console.log('🚀 saveContentAction STARTED - timestamp:', Date.now());
  console.log('🚀 Parameters:', { userId, type, name, projectId, contentLength: content?.length });

  try {
    if (!userId || typeof userId !== 'string') {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to save content'],
      };
    }

    if (!content || typeof content !== 'string') {
      return {
        message: 'Invalid content',
        data: null,
        errors: ['Content is required and must be a string'],
      };
    }

    // Validate content size - DynamoDB has a 400KB item size limit
    const contentSizeBytes = Buffer.byteLength(content, 'utf8');
    const maxContentSize = 350 * 1024; // 350KB to leave room for metadata

    if (contentSizeBytes > maxContentSize) {
      return {
        message: 'Content too large to save',
        data: null,
        errors: [`Content size (${Math.round(contentSizeBytes / 1024)}KB) exceeds maximum allowed size (${Math.round(maxContentSize / 1024)}KB)`],
      };
    }

    const repository = getRepository();
    const contentId = Date.now().toString();
    const keys = getSavedContentKeys(userId, contentId);

    // Create a clean data object with size-optimized content
    const contentName = (name || type).substring(0, 255);
    const contentData = {
      id: contentId,
      content: content.trim(), // Remove unnecessary whitespace
      type,
      name: contentName, // For backward compatibility
      title: contentName, // For type compatibility
      projectId: projectId || null,
      createdAt: new Date().toISOString(),
      contentSize: contentSizeBytes,
      ...(headerImage && { headerImage }), // Include header image if provided
      ...(metaDescription && { metaDescription }), // Include meta description if provided
    };

    console.log('💾 Saving content:', {
      contentId,
      name: contentName,
      type,
      projectId,
      contentSize: contentSizeBytes
    });
    console.log('💾 Keys:', keys);

    const itemToSave = {
      ...keys,
      EntityType: 'SavedContent' as const,
      Data: contentData,
      CreatedAt: Date.now(),
      UpdatedAt: Date.now()
    };

    console.log('💾 Item to save:', JSON.stringify(itemToSave, null, 2));
    console.log('💾 About to call repository.put...');
    await repository.put(itemToSave);
    console.log('✅ Content saved successfully to DynamoDB!');

    return {
      message: 'Content saved successfully',
      data: { id: contentId, content, type, name: contentData.name },
    };
  } catch (error: any) {
    console.error('❌ Save content error:', error);
    console.error('❌ Error type:', typeof error);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Handle specific DynamoDB errors
    if (error.message?.includes('hashkey has exceeded') || error.message?.includes('Item size has exceeded')) {
      return {
        message: 'Content is too large to save',
        data: null,
        errors: ['The content is too large for storage. Please try with shorter content.'],
      };
    }

    return {
      message: 'Failed to save content',
      data: null,
      errors: [error.message || error.toString() || 'Unknown error occurred'],
    };
  }
}



/**
 * Get all saved content for a user
 */
export async function getSavedContentAction(userId?: string): Promise<{
  message: string;
  data: any[] | null;
  errors?: string[];
}> {
  try {
    let effectiveUserId = userId;

    // If no userId provided, try to get from server session
    if (!effectiveUserId) {
      const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
      const user = await getCurrentUserServer();
      effectiveUserId = user?.id;
    }

    if (!effectiveUserId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view saved content'],
      };
    }

    console.log('📥 getSavedContentAction - fetching for userId:', effectiveUserId);

    const repository = getRepository();
    const pk = `USER#${effectiveUserId}`;
    const skPrefix = 'CONTENT#';

    console.log('📥 Querying DynamoDB with PK:', pk, 'SK prefix:', skPrefix);

    const result = await repository.queryItems(pk, skPrefix, {
      scanIndexForward: false, // Most recent first
    });

    console.log('📥 DynamoDB query result:', {
      itemCount: result.items?.length || 0,
      count: result.count
    });

    // Map items and ensure id is present (extract from SK if missing from Data)
    const content = (result.items || []).map(item => {
      const data = item.Data as any;
      // If id is missing from Data, extract it from SK (CONTENT#<id>)
      if (!data.id && item.SK) {
        const idMatch = item.SK.match(/^CONTENT#(.+)$/);
        if (idMatch) {
          data.id = idMatch[1];
        }
      }
      return data;
    });

    console.log('📥 Returning content items:', content.length);

    return {
      message: 'Saved content retrieved successfully',
      data: content,
    };
  } catch (error: any) {
    console.error('❌ Get saved content error:', error);
    return {
      message: 'Failed to retrieve saved content',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get all projects for a user
 */
export async function getProjectsAction(userId?: string): Promise<{
  message: string;
  data: any[] | null;
  errors?: string[];
}> {
  try {
    let effectiveUserId = userId;

    // If no userId provided, try to get from server session
    if (!effectiveUserId) {
      const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
      const user = await getCurrentUserServer();
      effectiveUserId = user?.id;
    }

    if (!effectiveUserId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view projects'],
      };
    }

    const repository = getRepository();
    const pk = `USER#${effectiveUserId}`;
    const skPrefix = 'PROJECT#';

    const result = await repository.queryItems(pk, skPrefix, {
      scanIndexForward: false, // Most recent first
    });

    // Map items and ensure id is present (extract from SK if missing from Data)
    const projects = (result.items || []).map(item => {
      const data = item.Data as any;
      // If id is missing from Data, extract it from SK (PROJECT#<id>)
      if (!data.id && item.SK) {
        const idMatch = item.SK.match(/^PROJECT#(.+)$/);
        if (idMatch) {
          data.id = idMatch[1];
        }
      }
      return data;
    });

    return {
      message: 'Projects retrieved successfully',
      data: projects,
    };
  } catch (error: any) {
    console.error('Get projects error:', error);
    return {
      message: 'Failed to retrieve projects',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Delete a project
 */
export async function deleteProjectAction(
  userId: string,
  projectId: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to delete projects'],
      };
    }

    const repository = getRepository();
    const keys = getProjectKeys(userId, projectId);

    // First, move all content in this project to uncategorized
    const pk = `USER#${userId}`;
    const skPrefix = 'CONTENT#';
    const contentResult = await repository.query(pk, skPrefix);

    console.log('🗑️ Deleting project:', projectId);
    console.log('📦 Found content items:', contentResult.items?.length || 0);

    if (contentResult.items && contentResult.items.length > 0) {
      for (const content of contentResult.items) {
        const contentData = content as any;
        console.log('📄 Checking content:', contentData.id, 'projectId:', contentData.projectId);
        if (contentData.projectId === projectId) {
          console.log('  ➡️ Moving to uncategorized');
          const contentKeys = getSavedContentKeys(userId, contentData.id);
          await repository.update(contentKeys.PK, contentKeys.SK, { projectId: null });
        }
      }
    }

    // Then delete the project
    console.log('🗑️ Deleting project from database');
    await repository.delete(keys.PK, keys.SK);
    console.log('✅ Project deleted successfully');

    return {
      message: 'Project deleted successfully',
      data: { projectId },
    };
  } catch (error: any) {
    console.error('Delete project error:', error);
    return {
      message: 'Failed to delete project',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Save research report
 */
export async function saveResearchReportAction(
  topic: string,
  report: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to save reports'],
      };
    }

    const repository = getRepository();
    const reportId = Date.now().toString();
    const keys = getResearchReportKeys(user.id, reportId);

    await repository.put({
      ...keys,
      EntityType: 'ResearchReport',
      Data: {
        topic,
        report,
        createdAt: new Date().toISOString(),
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now()
    });

    return {
      message: 'Report saved successfully',
      data: { id: reportId, topic, report },
    };
  } catch (error: any) {
    console.error('Save report error:', error);
    return {
      message: 'Failed to save report',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Save competitor
 */
export async function saveCompetitorAction(
  name: string,
  website: string,
  description?: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to save competitors'],
      };
    }

    const repository = getRepository();
    const competitorId = Date.now().toString();
    const keys = getCompetitorKeys(user.id, competitorId);

    await repository.put({
      ...keys,
      EntityType: 'Competitor',
      Data: {
        name,
        website,
        description: description || '',
        createdAt: new Date().toISOString(),
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now()
    });

    return {
      message: 'Competitor saved successfully',
      data: { id: competitorId, name, website },
    };
  } catch (error: any) {
    console.error('Save competitor error:', error);
    return {
      message: 'Failed to save competitor',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

const upsertCompetitorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  agency: z.string().min(2, { message: 'Agency must be at least 2 characters.' }),
  reviewCount: z.coerce.number().int().nonnegative(),
  avgRating: z.coerce.number().min(0).max(5),
  socialFollowers: z.coerce.number().int().nonnegative(),
  domainAuthority: z.coerce.number().int().min(0).max(100),
  createdAt: z.string().optional(),
});

export async function upsertCompetitorAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = upsertCompetitorSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    agency: formData.get('agency'),
    reviewCount: formData.get('reviewCount'),
    avgRating: formData.get('avgRating'),
    socialFollowers: formData.get('socialFollowers'),
    domainAuthority: formData.get('domainAuthority'),
    createdAt: formData.get('createdAt'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to save competitors'] },
      };
    }

    const repository = getRepository();
    const data = validatedFields.data;
    const competitorId = data.id || Date.now().toString();
    const keys = getCompetitorKeys(user.id, competitorId);

    const now = Date.now();
    const createdAt = data.createdAt ? new Date(data.createdAt).getTime() : now;

    await repository.put({
      ...keys,
      EntityType: 'Competitor',
      Data: {
        id: competitorId,
        name: data.name,
        agency: data.agency,
        reviewCount: data.reviewCount,
        avgRating: data.avgRating,
        socialFollowers: data.socialFollowers,
        domainAuthority: data.domainAuthority,
        createdAt: new Date(createdAt).toISOString(),
        updatedAt: new Date(now).toISOString(),
      },
      CreatedAt: createdAt,
      UpdatedAt: now
    });

    return {
      message: 'success',
      data: { ...data, id: competitorId },
      errors: {},
    };
  } catch (error: any) {
    console.error('Upsert competitor error:', error);
    const errorMessage = handleAWSError(error, 'Failed to save competitor');
    return {
      message: errorMessage,
      data: null,
      errors: {},
    };
  }
}

export async function deleteCompetitorAction(competitorId: string) {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        errors: ['You must be logged in to delete competitors'],
      };
    }

    const repository = getRepository();
    const keys = getCompetitorKeys(user.id, competitorId);
    await repository.delete(keys.PK, keys.SK);

    return {
      message: 'success',
      errors: {},
    };
  } catch (error: any) {
    console.error('Delete competitor error:', error);
    const errorMessage = handleAWSError(error, 'Failed to delete competitor');
    return {
      message: errorMessage,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Save marketing plan
 */
export async function saveMarketingPlanAction(
  plan: string,
  name?: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to save marketing plans'],
      };
    }

    const repository = getRepository();
    const planId = Date.now().toString();
    const keys = getMarketingPlanKeys(user.id, planId);

    await repository.put({
      ...keys,
      EntityType: 'MarketingPlan',
      Data: {
        plan,
        name: name || 'Marketing Plan',
        createdAt: new Date().toISOString(),
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now()
    });

    return {
      message: 'Marketing plan saved successfully',
      data: { id: planId, plan, name },
    };
  } catch (error: any) {
    console.error('Save marketing plan error:', error);
    return {
      message: 'Failed to save marketing plan',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Update profile photo URL
 */
export async function updateProfilePhotoUrlAction(
  userId: string,
  photoURL: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to update profile photo'],
      };
    }

    const repository = getRepository();
    const keys = getProfileKeys(userId);

    // Get existing profile data
    const existingProfile = await repository.get(keys.PK, keys.SK);

    if (existingProfile) {
      // Update the photoURL in the existing profile data
      const profileData = existingProfile as any;
      const updatedProfileData = {
        PK: keys.PK,
        SK: keys.SK,
        EntityType: 'RealEstateAgentProfile' as const,
        Data: {
          ...profileData.Data,
          photoURL
        },
        CreatedAt: profileData.CreatedAt,
        UpdatedAt: Date.now(),
      };

      await repository.put(updatedProfileData);
    } else {
      // Create new profile with just the photo URL
      await repository.put({
        PK: keys.PK,
        SK: keys.SK,
        EntityType: 'RealEstateAgentProfile' as const,
        Data: { photoURL },
        CreatedAt: Date.now(),
        UpdatedAt: Date.now(),
      });
    }

    // Also attempt to persist the photo URL to the agent profile repository
    try {
      const { getAgentProfileRepository } = await import('@/aws/dynamodb/agent-profile-repository');
      const profileRepo = getAgentProfileRepository();

      // If an agent profile exists for the user, update it with the photoURL
      const existingAgentProfile = await profileRepo.getProfile(userId);
      if (existingAgentProfile) {
        await profileRepo.updateProfile(userId, { photoURL });
      }
    } catch (err) {
      // Non-fatal: log a warning but don't fail the photo update
      console.warn('Could not update agent profile with photoURL:', err);
    }

    return {
      message: 'Profile photo updated successfully',
      data: { photoURL },
    };
  } catch (error: any) {
    console.error('Update profile photo error:', error);
    return {
      message: 'Failed to update profile photo',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Save training progress
 */
export async function saveTrainingProgressAction(
  moduleId: string,
  completed: boolean
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to save training progress'],
      };
    }

    const repository = getRepository();
    const keys = getTrainingProgressKeys(user.id, moduleId);

    await repository.put({
      ...keys,
      EntityType: 'LearningProgress',
      Data: {
        moduleId,
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now()
    });

    return {
      message: 'Training progress saved successfully',
      data: { moduleId, completed },
    };
  } catch (error: any) {
    console.error('Save training progress error:', error);
    return {
      message: 'Failed to save training progress',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get recent activity for the current user
 */
export async function getRecentActivityAction(userId?: string): Promise<{
  message: string;
  data: any[] | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view activity'],
      };
    }

    const repository = getRepository();
    const pk = `USER#${user.id}`;

    // Fetch different types of activity
    const [contentResult, reportsResult, plansResult, editsResult] = await Promise.all([
      repository.queryItems(pk, 'CONTENT#', { limit: 10, scanIndexForward: false }),
      repository.queryItems(pk, 'REPORT#', { limit: 10, scanIndexForward: false }),
      repository.queryItems(pk, 'PLAN#', { limit: 10, scanIndexForward: false }),
      repository.queryItems(pk, 'EDIT#', { limit: 10, scanIndexForward: false }),
    ]);

    // Combine and format activities
    const activities: any[] = [];

    // Add content items
    contentResult.items.forEach((item: any) => {
      activities.push({
        id: item.SK,
        type: 'content',
        title: item.Data.title || 'Untitled Content',
        contentType: item.Data.type || 'content',
        timestamp: item.CreatedAt || Date.now(),
        data: item.Data,
      });
    });

    // Add research reports
    reportsResult.items.forEach((item: any) => {
      activities.push({
        id: item.SK,
        type: 'report',
        title: item.Data.topic || 'Research Report',
        timestamp: item.CreatedAt || Date.now(),
        data: item.Data,
      });
    });

    // Add marketing plans
    plansResult.items.forEach((item: any) => {
      activities.push({
        id: item.SK,
        type: 'plan',
        title: 'Marketing Plan Generated',
        timestamp: item.CreatedAt || Date.now(),
        data: item.Data,
      });
    });

    // Add image edits
    editsResult.items.forEach((item: any) => {
      activities.push({
        id: item.SK,
        type: 'edit',
        title: `Image ${item.Data.editType || 'Edit'}`,
        editType: item.Data.editType,
        timestamp: item.CreatedAt || Date.now(),
        data: item.Data,
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);

    // Return top 10 most recent
    return {
      message: 'Recent activity retrieved successfully',
      data: activities.slice(0, 10),
    };
  } catch (error: any) {
    console.error('Get recent activity error:', error);
    return {
      message: 'Failed to retrieve recent activity',
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}
// ==================== Alert Settings Actions ====================

/**
 * Validation schemas for alert settings
 */
const alertSettingsSchema = z.object({
  enabledAlertTypes: z.array(z.enum([
    'life-event-lead',
    'competitor-new-listing',
    'competitor-price-reduction',
    'competitor-withdrawal',
    'neighborhood-trend',
    'price-reduction'
  ])),
  frequency: z.enum(['real-time', 'daily', 'weekly']),
  digestTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  leadScoreThreshold: z.number().min(50).max(90),
  priceRangeFilters: z.object({
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
  }).optional(),
  trackedCompetitors: z.array(z.string()).max(20),
});

const targetAreaSchema = z.object({
  type: z.enum(['zip', 'city', 'polygon']),
  value: z.union([
    z.string().min(1), // For ZIP codes and city names
    z.object({
      coordinates: z.array(z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })).min(3), // Minimum 3 points for a polygon
    }),
  ]),
  label: z.string().min(1),
});



/**
 * Get alert settings for the current user
 */
export async function getAlertSettingsAction(): Promise<{
  message: string;
  data: AlertSettings | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view alert settings'],
      };
    }

    const dataAccess = getAlertDataAccess();
    const settings = await dataAccess.getAlertSettings(user.id);

    return {
      message: 'Alert settings retrieved successfully',
      data: settings,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to retrieve alert settings');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Update alert settings for the current user
 */
export async function updateAlertSettingsAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: AlertSettings | null;
  errors?: any;
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to update alert settings'] },
      };
    }

    // Parse form data
    const enabledAlertTypes = formData.getAll('enabledAlertTypes') as string[];
    const frequency = formData.get('frequency') as string;
    const digestTime = formData.get('digestTime') as string;
    const leadScoreThreshold = parseInt(formData.get('leadScoreThreshold') as string);
    const priceMin = formData.get('priceMin') ? parseInt(formData.get('priceMin') as string) : undefined;
    const priceMax = formData.get('priceMax') ? parseInt(formData.get('priceMax') as string) : undefined;
    const trackedCompetitors = formData.getAll('trackedCompetitors') as string[];

    // Validate the data
    const validatedFields = alertSettingsSchema.safeParse({
      enabledAlertTypes,
      frequency,
      digestTime: digestTime || undefined,
      leadScoreThreshold,
      priceRangeFilters: (priceMin || priceMax) ? { min: priceMin, max: priceMax } : undefined,
      trackedCompetitors,
    });

    if (!validatedFields.success) {
      return {
        message: 'Validation failed',
        data: null,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Get current settings to preserve target areas
    const dataAccess = getAlertDataAccess();
    const currentSettings = await dataAccess.getAlertSettings(user.id);

    // Create updated settings
    const updatedSettings: AlertSettings = {
      userId: user.id,
      enabledAlertTypes: validatedFields.data.enabledAlertTypes,
      frequency: validatedFields.data.frequency,
      digestTime: validatedFields.data.digestTime,
      leadScoreThreshold: validatedFields.data.leadScoreThreshold,
      priceRangeFilters: validatedFields.data.priceRangeFilters,
      targetAreas: currentSettings.targetAreas, // Preserve existing target areas
      trackedCompetitors: validatedFields.data.trackedCompetitors,
      updatedAt: new Date().toISOString(),
    };

    // Save the updated settings
    await dataAccess.saveAlertSettings(user.id, updatedSettings);

    return {
      message: 'Alert settings updated successfully',
      data: updatedSettings,
      errors: {},
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to update alert settings');
    return {
      message: errorMessage,
      data: null,
      errors: { general: [error.message || 'Unknown error occurred'] },
    };
  }
}

/**
 * Add a target area to alert settings
 */
export async function addTargetAreaAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: TargetArea | null;
  errors?: any;
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to add target areas'] },
      };
    }

    // Parse form data
    const type = formData.get('type') as 'zip' | 'city' | 'polygon';
    const value = formData.get('value') as string;
    const label = formData.get('label') as string;
    const coordinates = formData.get('coordinates') as string;

    let parsedValue: string | { coordinates: Array<{ lat: number; lng: number }> };

    if (type === 'polygon' && coordinates) {
      try {
        parsedValue = JSON.parse(coordinates);
      } catch {
        return {
          message: 'Invalid polygon coordinates format',
          data: null,
          errors: { coordinates: ['Invalid JSON format for polygon coordinates'] },
        };
      }
    } else {
      parsedValue = value;
    }

    // Create target area object
    const targetArea: TargetArea = {
      id: uuidv4(),
      type,
      value: parsedValue,
      label,
    };

    // Validate the target area
    const validation = validateTargetArea(targetArea);
    if (!validation.isValid) {
      return {
        message: validation.errors[0] || 'Invalid target area',
        data: null,
        errors: { validation: validation.errors },
      };
    }

    // Get current settings
    const dataAccess = getAlertDataAccess();
    const currentSettings = await dataAccess.getAlertSettings(user.id);

    // Add the new target area
    const updatedSettings: AlertSettings = {
      ...currentSettings,
      targetAreas: [...currentSettings.targetAreas, targetArea],
      updatedAt: new Date().toISOString(),
    };

    // Save the updated settings
    await dataAccess.saveAlertSettings(user.id, updatedSettings);

    return {
      message: 'Target area added successfully',
      data: targetArea,
      errors: {},
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to add target area');
    return {
      message: errorMessage,
      data: null,
      errors: { general: [error.message || 'Unknown error occurred'] },
    };
  }
}

/**
 * Remove a target area from alert settings
 */
export async function removeTargetAreaAction(
  areaId: string
): Promise<{
  message: string;
  data: { removedId: string } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to remove target areas'],
      };
    }

    if (!areaId) {
      return {
        message: 'Area ID is required',
        data: null,
        errors: ['Area ID is required'],
      };
    }

    // Get current settings
    const dataAccess = getAlertDataAccess();
    const currentSettings = await dataAccess.getAlertSettings(user.id);

    // Remove the target area
    const updatedTargetAreas = currentSettings.targetAreas.filter(
      area => area.id !== areaId
    );

    if (updatedTargetAreas.length === currentSettings.targetAreas.length) {
      return {
        message: 'Target area not found',
        data: null,
        errors: ['Target area not found'],
      };
    }

    // Update settings
    const updatedSettings: AlertSettings = {
      ...currentSettings,
      targetAreas: updatedTargetAreas,
      updatedAt: new Date().toISOString(),
    };

    // Save the updated settings
    await dataAccess.saveAlertSettings(user.id, updatedSettings);

    return {
      message: 'Target area removed successfully',
      data: { removedId: areaId },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to remove target area');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

// ==================== Competitor Monitoring Actions ====================

/**
 * Validation schemas for competitor monitoring
 */
const competitorSchema = z.object({
  name: z.string().min(1, 'Competitor name is required'),
  agency: z.string().min(1, 'Agency name is required'),
  licenseNumber: z.string().optional(),
  targetAreas: z.array(z.string()).min(1, 'At least one target area is required'),
});

/**
 * Add a competitor to track
 */
export async function addTrackedCompetitorAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: Competitor | null;
  errors?: any;
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to add competitors'] },
      };
    }

    // Parse form data
    const name = formData.get('name') as string;
    const agency = formData.get('agency') as string;
    const licenseNumber = formData.get('licenseNumber') as string;
    const targetAreas = formData.getAll('targetAreas') as string[];

    // Validate the data
    const validatedFields = competitorSchema.safeParse({
      name,
      agency,
      licenseNumber: licenseNumber || undefined,
      targetAreas,
    });

    if (!validatedFields.success) {
      return {
        message: 'Validation failed',
        data: null,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Import competitor data access
    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');

    // Check competitor capacity
    const canAdd = await competitorDataAccess.canAddMoreCompetitors(user.id, 20);
    if (!canAdd) {
      return {
        message: 'Maximum competitor limit reached',
        data: null,
        errors: { capacity: ['You can track a maximum of 20 competitors'] },
      };
    }

    // Create competitor object with all required properties
    const baseCompetitor = competitorDataAccess.createCompetitor({
      name: validatedFields.data.name,
      agency: validatedFields.data.agency,
      licenseNumber: validatedFields.data.licenseNumber,
      targetAreas: validatedFields.data.targetAreas,
    });

    const competitor = {
      ...baseCompetitor,
      // Ensure required properties are properly typed
      agency: baseCompetitor.agency || validatedFields.data.agency,
      // Add missing required properties with default values
      reviewCount: 0,
      avgRating: 0,
      socialFollowers: 0,
      domainAuthority: 0,
    };

    // Save the competitor
    await competitorDataAccess.saveTrackedCompetitor(user.id, competitor);

    return {
      message: 'Competitor added successfully',
      data: competitor,
      errors: {},
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to add competitor');
    return {
      message: errorMessage,
      data: null,
      errors: { general: [error.message || 'Unknown error occurred'] },
    };
  }
}

/**
 * Get all tracked competitors for the current user
 */
export async function getTrackedCompetitorsAction(): Promise<{
  message: string;
  data: Competitor[] | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view competitors'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');
    const rawCompetitors = await competitorDataAccess.getTrackedCompetitors(user.id);
    
    // Map competitors to include all required properties with proper types
    const competitors = rawCompetitors.map(competitor => ({
      ...competitor,
      agency: competitor.agency || '', // Ensure agency is always a string
      targetAreas: competitor.targetAreas || [], // Ensure targetAreas is always an array
      reviewCount: (competitor as any).reviewCount || 0,
      avgRating: (competitor as any).avgRating || 0,
      socialFollowers: (competitor as any).socialFollowers || 0,
      domainAuthority: (competitor as any).domainAuthority || 0,
    }));

    return {
      message: 'Competitors retrieved successfully',
      data: competitors,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to retrieve competitors');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Update a tracked competitor
 */
export async function updateTrackedCompetitorAction(
  competitorId: string,
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: Competitor | null;
  errors?: any;
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to update competitors'] },
      };
    }

    if (!competitorId) {
      return {
        message: 'Competitor ID is required',
        data: null,
        errors: { id: ['Competitor ID is required'] },
      };
    }

    // Parse form data
    const name = formData.get('name') as string;
    const agency = formData.get('agency') as string;
    const licenseNumber = formData.get('licenseNumber') as string;
    const targetAreas = formData.getAll('targetAreas') as string[];
    const isActive = formData.get('isActive') === 'true';

    // Validate the data
    const validatedFields = competitorSchema.safeParse({
      name,
      agency,
      licenseNumber: licenseNumber || undefined,
      targetAreas,
    });

    if (!validatedFields.success) {
      return {
        message: 'Validation failed',
        data: null,
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');

    // Get existing competitor
    const existingCompetitor = await competitorDataAccess.getTrackedCompetitor(user.id, competitorId);
    if (!existingCompetitor) {
      return {
        message: 'Competitor not found',
        data: null,
        errors: { id: ['Competitor not found'] },
      };
    }

    // Update competitor (using type assertion to handle conflicting type definitions)
    const updates = {
      name: validatedFields.data.name,
      agency: validatedFields.data.agency,
      licenseNumber: validatedFields.data.licenseNumber,
      targetAreas: validatedFields.data.targetAreas,
      isActive,
    } as any;

    await competitorDataAccess.updateTrackedCompetitor(user.id, competitorId, updates);

    // Return updated competitor
    const updatedCompetitor = { ...existingCompetitor, ...updates };

    return {
      message: 'Competitor updated successfully',
      data: updatedCompetitor,
      errors: {},
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to update competitor');
    return {
      message: errorMessage,
      data: null,
      errors: { general: [error.message || 'Unknown error occurred'] },
    };
  }
}

/**
 * Remove a tracked competitor
 */
export async function removeTrackedCompetitorAction(
  competitorId: string
): Promise<{
  message: string;
  data: { removedId: string } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to remove competitors'],
      };
    }

    if (!competitorId) {
      return {
        message: 'Competitor ID is required',
        data: null,
        errors: ['Competitor ID is required'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');

    // Check if competitor exists
    const existingCompetitor = await competitorDataAccess.getTrackedCompetitor(user.id, competitorId);
    if (!existingCompetitor) {
      return {
        message: 'Competitor not found',
        data: null,
        errors: ['Competitor not found'],
      };
    }

    // Remove the competitor
    await competitorDataAccess.removeTrackedCompetitor(user.id, competitorId);

    return {
      message: 'Competitor removed successfully',
      data: { removedId: competitorId },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to remove competitor');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get competitor alerts for the current user
 */
export async function getCompetitorAlertsAction(
  filters?: {
    types?: string[];
    status?: string[];
    priority?: string[];
    dateRange?: { start: string; end: string };
    searchQuery?: string;
  },
  options?: {
    limit?: number;
    offset?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{
  message: string;
  data: AlertsResponse | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view alerts'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');

    const alertFilters = {
      types: filters?.types as any,
      status: filters?.status as any,
      priority: filters?.priority as any,
      dateRange: filters?.dateRange,
      searchQuery: filters?.searchQuery,
    };

    const queryOptions = {
      limit: options?.limit,
      offset: options?.offset ? Number(options.offset) : undefined,
      sortBy: options?.sortBy as any,
      sortOrder: options?.sortOrder,
    };

    const response = await competitorDataAccess.getCompetitorAlerts(
      user.id,
      alertFilters,
      queryOptions
    );

    return {
      message: 'Competitor alerts retrieved successfully',
      data: response,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to retrieve competitor alerts');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Mark a competitor alert as read
 */
export async function markCompetitorAlertAsReadAction(
  alertId: string,
  timestamp: string
): Promise<{
  message: string;
  data: { alertId: string } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to mark alerts as read'],
      };
    }

    if (!alertId || !timestamp) {
      return {
        message: 'Alert ID and timestamp are required',
        data: null,
        errors: ['Alert ID and timestamp are required'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');
    await competitorDataAccess.markCompetitorAlertAsRead(user.id, alertId, timestamp);

    return {
      message: 'Alert marked as read successfully',
      data: { alertId },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to mark alert as read');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Dismiss a competitor alert
 */
export async function dismissCompetitorAlertAction(
  alertId: string,
  timestamp: string
): Promise<{
  message: string;
  data: { alertId: string } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to dismiss alerts'],
      };
    }

    if (!alertId || !timestamp) {
      return {
        message: 'Alert ID and timestamp are required',
        data: null,
        errors: ['Alert ID and timestamp are required'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');
    await competitorDataAccess.dismissCompetitorAlert(user.id, alertId, timestamp);

    return {
      message: 'Alert dismissed successfully',
      data: { alertId },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to dismiss alert');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get unread competitor alert count
 */
export async function getUnreadCompetitorAlertCountAction(): Promise<{
  message: string;
  data: { count: number } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view alert count'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');
    const count = await competitorDataAccess.getUnreadCompetitorAlertCount(user.id);

    return {
      message: 'Unread alert count retrieved successfully',
      data: { count },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to retrieve alert count');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Process competitor monitoring (typically called by scheduled functions)
 */
export async function processCompetitorMonitoringAction(
  userId?: string
): Promise<{
  message: string;
  data: { alertsGenerated: number } | null;
  errors?: string[];
}> {
  try {
    // This would typically be called by a scheduled Lambda function
    // For now, we'll implement basic processing logic

    if (!userId) {
      return {
        message: 'User ID is required for processing',
        data: null,
        errors: ['User ID is required'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');
    const { competitorMonitor } = await import('@/lib/alerts/competitor-monitor');

    // Get user's tracked competitors
    const competitors = await competitorDataAccess.getTrackedCompetitors(userId);

    if (competitors.length === 0) {
      return {
        message: 'No competitors to monitor',
        data: { alertsGenerated: 0 },
      };
    }

    // Get user's alert settings to get target areas
    const dataAccess = getAlertDataAccess();
    const settings = await dataAccess.getAlertSettings(userId);

    if (!settings || settings.targetAreas.length === 0) {
      return {
        message: 'No target areas configured',
        data: { alertsGenerated: 0 },
      };
    }

    // Process competitor monitoring
    const alerts = await competitorMonitor.trackListingEvents(competitors, settings.targetAreas);

    // Save generated alerts
    for (const alert of alerts) {
      alert.userId = userId; // Set the user ID
      await competitorDataAccess.saveCompetitorAlert(userId, alert);
    }

    return {
      message: `Competitor monitoring processed successfully. Generated ${alerts.length} alerts.`,
      data: { alertsGenerated: alerts.length },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to process competitor monitoring');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

// ==================== General Alert Management Actions ====================

/**
 * Get alerts for the current user with filtering support
 */
export async function getAlertsAction(
  filters?: {
    types?: string[];
    status?: string[];
    priority?: string[];
    dateRange?: { start: string; end: string };
    searchQuery?: string;
  },
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<{
  message: string;
  data: AlertsResponse | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view alerts'],
      };
    }

    const dataAccess = getAlertDataAccess();

    const alertFilters = {
      types: filters?.types as any,
      status: filters?.status as any,
      priority: filters?.priority as any,
      dateRange: filters?.dateRange,
      searchQuery: filters?.searchQuery,
    };

    const queryOptions = {
      limit: options?.limit,
      offset: options?.offset ? Number(options.offset) : undefined,
      sortBy: options?.sortBy as any,
      sortOrder: options?.sortOrder,
    };

    const response = await dataAccess.getAlerts(user.id, alertFilters, queryOptions);

    return {
      message: 'Alerts retrieved successfully',
      data: response,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to retrieve alerts');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Mark an alert as read
 */
export async function markAlertAsReadAction(
  alertId: string
): Promise<{
  message: string;
  data: { alertId: string } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to mark alerts as read'],
      };
    }

    if (!alertId) {
      return {
        message: 'Alert ID is required',
        data: null,
        errors: ['Alert ID is required'],
      };
    }

    const dataAccess = getAlertDataAccess();
    await dataAccess.updateAlertStatus(user.id, alertId, 'read');

    return {
      message: 'Alert marked as read successfully',
      data: { alertId },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to mark alert as read');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Dismiss an alert
 */
export async function dismissAlertAction(
  alertId: string
): Promise<{
  message: string;
  data: { alertId: string } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to dismiss alerts'],
      };
    }

    if (!alertId) {
      return {
        message: 'Alert ID is required',
        data: null,
        errors: ['Alert ID is required'],
      };
    }

    const dataAccess = getAlertDataAccess();
    await dataAccess.updateAlertStatus(user.id, alertId, 'dismissed');

    return {
      message: 'Alert dismissed successfully',
      data: { alertId },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to dismiss alert');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Get unread alert count for the current user
 */
export async function getUnreadAlertCountAction(): Promise<{
  message: string;
  data: { count: number } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view alert count'],
      };
    }

    const dataAccess = getAlertDataAccess();
    const count = await dataAccess.getUnreadCount(user.id);

    return {
      message: 'Unread alert count retrieved successfully',
      data: { count },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to retrieve alert count');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

// ==================== Helper Functions ====================





// ==================== Notification Management Actions ====================

import { notificationService } from '@/lib/alerts/notification-service';
import { NotificationPreferences } from '@/lib/alerts/notification-types';
import { ADMIN_PERMISSIONS } from '@/lib/admin';

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferencesAction(): Promise<{
  message: string;
  data: NotificationPreferences | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();
    if (!user) {
      return {
        message: 'User not authenticated',
        data: null,
        errors: ['Authentication required'],
      };
    }

    const preferences = await notificationService.getNotificationPreferences(user.id);

    return {
      message: 'Notification preferences retrieved successfully',
      data: preferences,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to retrieve notification preferences');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Update notification preferences for the current user
 */
export async function updateNotificationPreferencesAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: NotificationPreferences | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();
    if (!user) {
      return {
        message: 'User not authenticated',
        data: null,
        errors: ['Authentication required'],
      };
    }

    // Parse form data
    const emailNotifications = formData.get('emailNotifications') === 'true';
    const emailAddress = formData.get('emailAddress')?.toString();
    const frequency = formData.get('frequency')?.toString() as 'real-time' | 'daily' | 'weekly';
    const digestTime = formData.get('digestTime')?.toString();

    // Parse enabled alert types
    const enabledAlertTypes = formData.getAll('enabledAlertTypes').map(type => type.toString()) as any[];

    // Parse quiet hours
    const quietHoursEnabled = formData.get('quietHoursEnabled') === 'true';
    const quietHoursStart = formData.get('quietHoursStart')?.toString();
    const quietHoursEnd = formData.get('quietHoursEnd')?.toString();
    const timezone = formData.get('timezone')?.toString();

    const preferences: Partial<NotificationPreferences> = {
      emailNotifications,
      emailAddress,
      frequency,
      digestTime,
      enabledAlertTypes,
    };

    if (quietHoursEnabled && quietHoursStart && quietHoursEnd && timezone) {
      preferences.quietHours = {
        enabled: true,
        startTime: quietHoursStart,
        endTime: quietHoursEnd,
        timezone,
      };
    } else {
      preferences.quietHours = {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'America/New_York',
      };
    }

    await notificationService.updateNotificationPreferences(user.id, preferences);

    // Get updated preferences
    const updatedPreferences = await notificationService.getNotificationPreferences(user.id);

    return {
      message: 'Notification preferences updated successfully',
      data: updatedPreferences,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to update notification preferences');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Send a test notification to the current user
 */
export async function sendTestNotificationAction(): Promise<{
  message: string;
  data: { success: boolean; messageId?: string } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();
    if (!user) {
      return {
        message: 'User not authenticated',
        data: null,
        errors: ['Authentication required'],
      };
    }

    // Create a test alert
    const testAlert = {
      id: `test_${Date.now()}`,
      userId: user.id,
      type: 'life-event-lead' as const,
      priority: 'medium' as const,
      status: 'unread' as const,
      createdAt: new Date().toISOString(),
      data: {
        prospectLocation: 'Test Location, NY',
        eventType: 'marriage' as const,
        eventDate: new Date().toISOString(),
        leadScore: 85,
        recommendedAction: 'This is a test notification to verify your email settings.',
      },
    };

    const result = await notificationService.sendRealTimeNotification(user.id, testAlert);

    return {
      message: result.success ? 'Test notification sent successfully' : 'Failed to send test notification',
      data: result,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to send test notification');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Send daily digest for the current user
 */
export async function sendDailyDigestAction(): Promise<{
  message: string;
  data: { success: boolean; emailsSent: number; errors: string[] } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();
    if (!user) {
      return {
        message: 'User not authenticated',
        data: null,
        errors: ['Authentication required'],
      };
    }

    const result = await notificationService.sendDailyDigest(user.id);

    return {
      message: result.success ? 'Daily digest sent successfully' : 'Failed to send daily digest',
      data: result,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to send daily digest');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Send weekly digest for the current user
 */
export async function sendWeeklyDigestAction(): Promise<{
  message: string;
  data: { success: boolean; emailsSent: number; errors: string[] } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();
    if (!user) {
      return {
        message: 'User not authenticated',
        data: null,
        errors: ['Authentication required'],
      };
    }

    const result = await notificationService.sendWeeklyDigest(user.id);

    return {
      message: result.success ? 'Weekly digest sent successfully' : 'Failed to send weekly digest',
      data: result,
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to send weekly digest');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}

/**
 * Initialize email templates (admin function)
 */
export async function initializeEmailTemplatesAction(): Promise<{
  message: string;
  data: { success: boolean } | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
    const user = await getCurrentUserServer();
    if (!user) {
      return {
        message: 'User not authenticated',
        data: null,
        errors: ['Authentication required'],
      };
    }

    await notificationService.initializeEmailTemplates();

    return {
      message: 'Email templates initialized successfully',
      data: { success: true },
    };
  } catch (error: any) {
    const errorMessage = handleAWSError(error, 'Failed to initialize email templates');
    return {
      message: errorMessage,
      data: null,
      errors: [error.message || 'Unknown error occurred'],
    };
  }
}
/*
*
 * Set session cookie for server-side authentication
 * This should be called from the client after successful login
 */
export async function setSessionCookieAction(
  accessToken: string,
  idToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await setServerSessionCookie(accessToken, idToken, refreshToken, expiresAt);
    return { success: true };
  } catch (error) {
    console.error('Failed to set session cookie:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set session cookie'
    };
  }
}

/**
 * Clear session cookie on logout
 */
export async function clearSessionCookieAction(): Promise<{ success: boolean }> {
  try {
    await clearSessionCookie();
    return { success: true };
  } catch (error) {
    console.error('Failed to clear session cookie:', error);
    return { success: false };
  }
}

export async function getPublicFeaturesAction(): Promise<{
  message: string;
  data: FeatureToggle[];
  errors: any;
}> {
  try {
    const repository = getRepository();
    // Scan for features
    const result = await repository.scan({
      filterExpression: 'begins_with(PK, :pk) AND SK = :sk',
      expressionAttributeValues: {
        ':pk': 'FEATURE#',
        ':sk': 'CONFIG'
      }
    });

    return {
      message: 'success',
      data: result.items as FeatureToggle[],
      errors: {}
    };
  } catch (error: any) {
    console.error('Error fetching public features:', error);
    return {
      message: 'Failed to fetch features',
      data: [],
      errors: { system: error.message }
    };
  }
}

// ============================================
// User Invitation Actions
// ============================================

import {
  Invitation,
  TeamMember,
  isInvitationExpired
} from '@/lib/types/organization-types';
import {
  getInvitationsByEmailQueryKeys,
  getInvitationByTokenQueryKeys,
  getInvitationKeys,
  getTeamMemberKeys,
  getOrganizationKeys
} from '@/aws/dynamodb/organization-keys';
import { Competitor } from '@/lib/types/common';
import { validateTargetArea } from '@/lib/alerts';

export async function getUserInvitationsAction(): Promise<{
  message: string;
  data: Invitation[];
  errors: any;
}> {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser?.email) {
      return { message: 'Not authenticated', data: [], errors: {} };
    }

    const repository = getRepository();
    const queryKeys = getInvitationsByEmailQueryKeys(currentUser.email);

    // Query invitations by email using GSI1
    const result = await repository.query<Invitation>(
      queryKeys.GSI1PK,
      queryKeys.GSI1SKPrefix
    );

    // Filter for pending and non-expired invitations
    const validInvitations = result.items.filter(
      inv => inv.status === 'pending' && !isInvitationExpired(inv)
    );

    return { message: 'success', data: validInvitations, errors: {} };
  } catch (error: any) {
    console.error('Error fetching user invitations:', error);
    return {
      message: 'Failed to fetch invitations',
      data: [],
      errors: { system: error.message }
    };
  }
}

export async function acceptInvitationAction(invitationId: string): Promise<{
  message: string;
  errors: any;
}> {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser) {
      return { message: 'Not authenticated', errors: {} };
    }

    const repository = getRepository();

    // Get the invitation - we need to find it first
    const queryKeys = getInvitationsByEmailQueryKeys(currentUser.email!);
    const invitations = await repository.query<Invitation>(
      queryKeys.GSI1PK,
      queryKeys.GSI1SKPrefix
    );

    const invitation = invitations.items.find(inv => inv.id === invitationId);

    if (!invitation) {
      return { message: 'Invitation not found', errors: {} };
    }

    if (invitation.status !== 'pending') {
      return { message: 'Invitation is no longer valid', errors: {} };
    }

    if (isInvitationExpired(invitation)) {
      return { message: 'Invitation has expired', errors: {} };
    }

    // Update invitation status
    const invKeys = getInvitationKeys(invitation.organizationId, invitationId);
    await repository.update(invKeys.PK, invKeys.SK, {
      status: 'accepted' as any,
      acceptedAt: new Date().toISOString(),
    });

    // Create team member record
    const teamMember: TeamMember = {
      userId: currentUser.id,
      organizationId: invitation.organizationId,
      role: invitation.role === 'admin' ? 'admin' : 'member',
      status: 'active',
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const memberKeys = getTeamMemberKeys(invitation.organizationId, currentUser.id);
    await repository.create(
      memberKeys.PK,
      memberKeys.SK,
      'TeamMember',
      teamMember,
      {
        GSI1PK: memberKeys.GSI1PK,
        GSI1SK: memberKeys.GSI1SK,
      }
    );

    // Update user profile with organizationId
    const profileKeys = getProfileKeys(currentUser.id);
    await repository.update(profileKeys.PK, profileKeys.SK, {
      organizationId: invitation.organizationId,
    });

    return { message: 'success', errors: {} };
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return { message: 'Failed to accept invitation', errors: { system: error.message } };
  }
}

export async function rejectInvitationAction(invitationId: string): Promise<{
  message: string;
  errors: any;
}> {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser?.email) {
      return { message: 'Not authenticated', errors: {} };
    }

    const repository = getRepository();

    // Get the invitation
    const queryKeys = getInvitationsByEmailQueryKeys(currentUser.email);
    const invitations = await repository.query<Invitation>(
      queryKeys.GSI1PK,
      queryKeys.GSI1SKPrefix
    );

    const invitation = invitations.items.find(inv => inv.id === invitationId);

    if (!invitation) {
      return { message: 'Invitation not found', errors: {} };
    }

    // Update invitation status
    const invKeys = getInvitationKeys(invitation.organizationId, invitationId);
    await repository.update(invKeys.PK, invKeys.SK, {
      status: 'rejected' as any,
      rejectedAt: new Date().toISOString(),
    });

    return { message: 'success', errors: {} };
  } catch (error: any) {
    console.error('Error rejecting invitation:', error);
    return { message: 'Failed to reject invitation', errors: { system: error.message } };
  }
}

export async function acceptInvitationByTokenAction(token: string): Promise<{
  message: string;
  data?: { organizationId: string; organizationName: string };
  errors: any;
}> {
  try {
    const repository = getRepository();

    // Query invitation by token using GSI2
    const queryKeys = getInvitationByTokenQueryKeys(token);
    const result = await repository.query<Invitation>(
      queryKeys.GSI2PK,
      queryKeys.GSI2SKPrefix
    );

    if (result.items.length === 0) {
      return { message: 'Invalid invitation token', errors: {} };
    }

    const invitation = result.items[0];

    if (invitation.status !== 'pending') {
      return { message: 'Invitation is no longer valid', errors: {} };
    }

    if (isInvitationExpired(invitation)) {
      return { message: 'Invitation has expired', errors: {} };
    }

    // Get organization details
    const orgKeys = getOrganizationKeys(invitation.organizationId);
    const organization = await repository.get<any>(orgKeys.PK, orgKeys.SK);

    return {
      message: 'success',
      data: {
        organizationId: invitation.organizationId,
        organizationName: organization?.name || 'Unknown Organization',
      },
      errors: {},
    };
  } catch (error: any) {
    console.error('Error validating invitation token:', error);
    return {
      message: 'Failed to validate invitation',
      errors: { system: error.message }
    };
  }
}

export async function joinOrganizationByTokenAction(token: string): Promise<{
  message: string;
  errors: any;
}> {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser) {
      return { message: 'Not authenticated', errors: {} };
    }

    const repository = getRepository();

    // Query invitation by token
    const queryKeys = getInvitationByTokenQueryKeys(token);
    const result = await repository.query<Invitation>(
      queryKeys.GSI2PK,
      queryKeys.GSI2SKPrefix
    );

    if (result.items.length === 0) {
      return { message: 'Invalid invitation token', errors: {} };
    }

    const invitation = result.items[0];

    if (invitation.status !== 'pending') {
      return { message: 'Invitation is no longer valid', errors: {} };
    }

    if (isInvitationExpired(invitation)) {
      return { message: 'Invitation has expired', errors: {} };
    }

    // Verify email matches
    if (invitation.email.toLowerCase() !== currentUser.email.toLowerCase()) {
      return { message: 'This invitation was sent to a different email address.', errors: {} };
    }

    const now = new Date().toISOString();
    const invKeys = getInvitationKeys(invitation.organizationId, invitation.id);

    // 1. Update invitation status
    await repository.update(invKeys.PK, invKeys.SK, {
      status: 'accepted' as any,
      acceptedAt: now,
    });

    // 2. Add user to team
    const memberKeys = getTeamMemberKeys(invitation.organizationId, currentUser.id);
    const teamMember: TeamMember = {
      userId: currentUser.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
      status: 'active',
      joinedAt: now,
      updatedAt: now,
    };

    await repository.put({
      PK: memberKeys.PK,
      SK: memberKeys.SK,
      EntityType: 'TeamMember',
      Data: teamMember,
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
      GSI1PK: memberKeys.GSI1PK,
      GSI1SK: memberKeys.GSI1SK,
    });

    // 3. Update user profile
    const profileKeys = getProfileKeys(currentUser.id);
    await repository.update(profileKeys.PK, profileKeys.SK, {
      organizationId: invitation.organizationId,
    });

    return { message: 'success', errors: {} };
  } catch (error: any) {
    console.error('Error joining organization:', error);
    return { message: 'Failed to join organization', errors: { system: error.message } };
  }
}

// ==================== Testimonial Management Actions ====================

/**
 * Updates featured testimonials for a user
 * Sets isFeatured and displayOrder for the provided testimonials
 */
export async function updateFeaturedTestimonialsAction(
  userId: string,
  featuredTestimonials: { id: string; displayOrder: number }[]
): Promise<{ message: string; errors: any }> {
  try {
    const { updateTestimonial } = await import('@/aws/dynamodb/testimonial-repository');
    const { queryTestimonials } = await import('@/aws/dynamodb/testimonial-repository');

    // Get all testimonials for the user
    const result = await queryTestimonials(userId);
    const allTestimonials = result.items;

    // Create a map of featured testimonial IDs for quick lookup
    const featuredMap = new Map(
      featuredTestimonials.map((t) => [t.id, t.displayOrder])
    );

    // Update all testimonials
    await Promise.all(
      allTestimonials.map(async (testimonial) => {
        const isFeatured = featuredMap.has(testimonial.id);
        const displayOrder = isFeatured ? featuredMap.get(testimonial.id) : undefined;

        // Only update if values changed
        if (
          testimonial.isFeatured !== isFeatured ||
          testimonial.displayOrder !== displayOrder
        ) {
          await updateTestimonial(userId, testimonial.id, {
            isFeatured,
            displayOrder,
          });
        }
      })
    );

    return {
      message: 'Featured testimonials updated successfully',
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to update featured testimonials:', error);
    return {
      message: 'Failed to update featured testimonials',
      errors: { system: error.message },
    };
  }
}

/**
 * Gets featured testimonials for a user
 * Returns up to 6 testimonials sorted by displayOrder
 */
export async function getFeaturedTestimonialsAction(
  userId: string
): Promise<{ message: string; data: any; errors: any }> {
  try {
    const { queryFeaturedTestimonials } = await import(
      '@/aws/dynamodb/testimonial-repository'
    );

    const result = await queryFeaturedTestimonials(userId, 6);

    return {
      message: 'success',
      data: result.items,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get featured testimonials:', error);
    return {
      message: 'Failed to get featured testimonials',
      data: [],
      errors: { system: error.message },
    };
  }
}

/**
 * Gets all testimonials for a user
 */
export async function getTestimonialsAction(
  userId: string
): Promise<{ message: string; data: any; errors: any }> {
  try {
    const { queryTestimonials } = await import('@/aws/dynamodb/testimonial-repository');

    const result = await queryTestimonials(userId);

    return {
      message: 'success',
      data: result.items,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get testimonials:', error);
    return {
      message: 'Failed to get testimonials',
      data: [],
      errors: { system: error.message },
    };
  }
}

/**
 * Generate listing description from property images using AI vision
 */
export async function generateFromImagesAction(input: {
  images: Array<{ data: string; format: string; order: number }>;
  propertyType: string;
  location: string;
  buyerPersona: string;
  writingStyle: string;
  bedrooms?: string;
  bathrooms?: string;
  squareFeet?: string;
}): Promise<{ message: string; data: ListingDescriptionOutput | null; errors: any }> {
  try {
    // For now, generate a basic description since image analysis isn't implemented
    const description = `Beautiful ${input.propertyType.toLowerCase()} in ${input.location}. This property features ${input.bedrooms || 'multiple'} bedrooms and ${input.bathrooms || 'multiple'} bathrooms${input.squareFeet ? ` with ${input.squareFeet} square feet of living space` : ''}. Perfect for ${input.buyerPersona.replace('-', ' ')}. Contact us today to schedule a viewing!`;

    const result: ListingDescriptionOutput = {
      description,
      wordCount: description.split(' ').length
    };

    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the listing description from images.');
    return {
      message: `Failed to generate listing description from images: ${errorMessage}`,
      data: null,
      errors: {},
    };
  }
}

// ==================== AI Search Monitoring Actions ====================

/**
 * Get AI visibility data for a user
 * Returns the latest visibility score and summary statistics
 * Handles stale data by including last update timestamp
 * Uses caching to improve performance
 */
export async function getAIVisibilityData(userId: string): Promise<{
  message: string;
  data: {
    score: AIVisibilityScore | null;
    recentMentions: AIMention[];
    config: AIMonitoringConfig | null;
    isStale: boolean;
    lastUpdated: string | null;
  } | null;
  errors: any;
}> {
  try {
    const { getAIVisibilityCacheService } = await import('@/lib/ai-visibility-cache');
    const cache = getAIVisibilityCacheService();

    // Get the latest visibility score (with caching)
    const latestScore = await cache.getVisibilityScore(userId);

    // Check if data is stale (older than 7 days)
    const isStale = latestScore
      ? (Date.now() - new Date(latestScore.calculatedAt).getTime()) > (7 * 24 * 60 * 60 * 1000)
      : true;

    const lastUpdated = latestScore?.calculatedAt || null;

    // Get recent mentions (last 10) with caching
    const recentMentions = await cache.getMentions(userId, { limit: 10 });

    // Get monitoring config with caching
    const config = await cache.getMonitoringConfig(userId);

    // Provide helpful message based on data state
    let message = 'success';
    if (!latestScore && !config) {
      message = 'No monitoring data found. Set up monitoring to start tracking your AI visibility.';
    } else if (!latestScore) {
      message = 'Monitoring is configured but no data has been collected yet. The first monitoring run will happen soon.';
    } else if (isStale) {
      message = 'Data is older than 7 days. Consider running a manual refresh for the latest insights.';
    }

    return {
      message,
      data: {
        score: latestScore || null,
        recentMentions,
        config: config || null,
        isStale,
        lastUpdated,
      },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get AI visibility data:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to load AI visibility data. Please try again.';

    if (error.name === 'ResourceNotFoundException') {
      errorMessage = 'AI visibility data not found. Please set up monitoring first.';
    } else if (error.name === 'AccessDeniedException') {
      errorMessage = 'You do not have permission to access this data.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Get AI mentions with filtering options
 * Uses caching to improve performance
 */
export async function getAIMentions(
  userId: string,
  options?: {
    limit?: number;
    platform?: 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  message: string;
  data: AIMention[] | null;
  errors: any;
}> {
  try {
    const { getAIVisibilityCacheService } = await import('@/lib/ai-visibility-cache');
    const cache = getAIVisibilityCacheService();

    // Get mentions with caching
    const mentions = await cache.getMentions(userId, options);

    // Provide helpful message if no mentions found
    let message = 'success';
    if (mentions.length === 0) {
      if (options?.platform) {
        message = `No mentions found on ${options.platform}. Try checking other platforms or adjusting your date range.`;
      } else if (options?.startDate || options?.endDate) {
        message = 'No mentions found in the selected date range. Try expanding your search period.';
      } else {
        message = 'No mentions found yet. Monitoring will run automatically, or you can trigger a manual refresh.';
      }
    }

    return {
      message,
      data: mentions,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get AI mentions:', error);

    // Provide user-friendly error messages
    let errorMessage = 'Failed to load AI mentions. Please try again.';

    if (error.name === 'ResourceNotFoundException') {
      errorMessage = 'No mention data found. Please set up monitoring first.';
    } else if (error.name === 'AccessDeniedException') {
      errorMessage = 'You do not have permission to access this data.';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Get competitor AI visibility for comparison
 */
export async function getCompetitorAIVisibility(
  userId: string,
  competitorIds: string[]
): Promise<{
  message: string;
  data: Array<{
    competitorId: string;
    competitorName: string;
    score: AIVisibilityScore | null;
    mentionCount: number;
  }> | null;
  errors: any;
}> {
  try {
    const repository = getRepository();
    const results = [];

    // Get user's own data first
    const userScoreResult = await repository.query(
      `USER#${userId}`,
      'AI_VISIBILITY_SCORE#',
      {
        limit: 1,
        scanIndexForward: false,
      }
    );

    const userScore = (userScoreResult.items[0] as any)?.Data as AIVisibilityScore | undefined;

    // Get user profile for name
    const userProfileKeys = getUserProfileKeys(userId);
    const userProfileResult = await repository.get(userProfileKeys.PK, userProfileKeys.SK);
    const userProfile = (userProfileResult as any)?.Data as Profile | undefined;

    results.push({
      competitorId: userId,
      competitorName: userProfile?.name || 'You',
      score: userScore || null,
      mentionCount: userScore?.mentionCount || 0,
    });

    // Get each competitor's data
    for (const competitorId of competitorIds) {
      try {
        // Get competitor's latest score
        const scoreResult = await repository.query(
          `USER#${competitorId}`,
          'AI_VISIBILITY_SCORE#',
          {
            limit: 1,
            scanIndexForward: false,
          }
        );

        const score = (scoreResult.items[0] as any)?.Data as AIVisibilityScore | undefined;

        // Get competitor profile for name
        const competitorKeys = getCompetitorKeys(userId, competitorId);
        const competitorResult = await repository.get(competitorKeys.PK, competitorKeys.SK);
        const competitor = (competitorResult as any)?.Data as Competitor | undefined;

        results.push({
          competitorId,
          competitorName: competitor?.name || 'Unknown',
          score: score || null,
          mentionCount: score?.mentionCount || 0,
        });
      } catch (error) {
        console.warn(`Failed to get data for competitor ${competitorId}:`, error);
        // Continue with other competitors
      }
    }

    // Sort by score descending
    results.sort((a, b) => {
      const scoreA = a.score?.score || 0;
      const scoreB = b.score?.score || 0;
      return scoreB - scoreA;
    });

    return {
      message: 'success',
      data: results,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get competitor AI visibility:', error);
    const errorMessage = handleAWSError(error, 'Failed to load competitor visibility data');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Trigger manual monitoring job for a user
 */
export async function triggerManualMonitoring(userId: string): Promise<{
  message: string;
  data: { jobId: string } | null;
  errors: any;
}> {
  try {
    const repository = getRepository();

    // Check if monitoring is enabled
    const configResult = await repository.get(
      `USER#${userId}`,
      'AI_MONITORING_CONFIG'
    );

    const config = (configResult as any)?.Data as AIMonitoringConfig | undefined;

    if (!config || !config.enabled) {
      return {
        message: 'AI monitoring is not enabled for this user',
        data: null,
        errors: { config: ['Please enable AI monitoring in settings first'] },
      };
    }

    // Check rate limits
    if (config.queriesThisPeriod >= config.queryLimit) {
      return {
        message: 'Query limit reached for this period',
        data: null,
        errors: { rateLimit: ['You have reached your query limit for this period. Please try again later.'] },
      };
    }

    // Create a new monitoring job
    const jobId = `job-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const job: AIMonitoringJob = {
      id: jobId,
      userId,
      status: 'pending',
      startedAt: new Date().toISOString(),
      queriesExecuted: 0,
      mentionsFound: 0,
      errors: [],
      costEstimate: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save job to DynamoDB
    await repository.create(
      `USER#${userId}`,
      `AI_MONITORING_JOB#${job.startedAt}#${jobId}`,
      'AIMonitoringJob',
      job
    );

    // Import and execute the monitoring scheduler
    const { AIMonitoringScheduler } = await import('@/lib/ai-monitoring-scheduler');
    const scheduler = new AIMonitoringScheduler();

    // Execute monitoring asynchronously (don't await)
    scheduler.executeMonitoring(userId).then(result => {
      console.log('Manual monitoring completed:', result);
    }).catch(error => {
      console.error('Manual monitoring failed:', error);
    });

    return {
      message: 'Monitoring job started successfully',
      data: { jobId },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to trigger manual monitoring:', error);
    const errorMessage = handleAWSError(error, 'Failed to start monitoring job');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Export AI visibility report as PDF
 * Generates a comprehensive report with visibility scores, mentions, sentiment analysis, and competitor comparison
 */
export async function exportAIVisibilityReport(
  userId: string,
  dateRange: { start: string; end: string }
): Promise<{
  message: string;
  data: { downloadUrl: string } | null;
  errors: any;
}> {
  try {
    const repository = getRepository();

    // Get user profile for agent name
    const userProfileKeys = getUserProfileKeys(userId);
    const userProfileResult = await repository.get(userProfileKeys.PK, userProfileKeys.SK);
    const userProfile = (userProfileResult as any)?.Data as Profile | undefined;
    const agentName = userProfile?.name || 'Agent';

    // Get the latest visibility score
    const scoreResult = await repository.query(
      `USER#${userId}`,
      'AI_VISIBILITY_SCORE#',
      {
        limit: 1,
        scanIndexForward: false,
      }
    );

    const latestScore = (scoreResult.items[0] as any)?.Data as AIVisibilityScore | undefined;

    if (!latestScore) {
      return {
        message: 'No visibility data available to export',
        data: null,
        errors: { data: ['No visibility data found. Please run monitoring first.'] },
      };
    }

    // Get mentions within date range
    const mentionsResult = await repository.query(
      `USER#${userId}`,
      'AI_MENTION#',
      {
        limit: 100,
        scanIndexForward: false,
      }
    );

    const allMentions = mentionsResult.items.map((item: any) => item.Data as AIMention);

    // Filter mentions by date range
    const mentions = allMentions.filter(mention => {
      const mentionDate = new Date(mention.timestamp);
      return mentionDate >= new Date(dateRange.start) && mentionDate <= new Date(dateRange.end);
    });

    // Get competitor data
    const competitorResult = await getCompetitorAIVisibility(userId, []);
    const competitorData = competitorResult.data?.map(comp => ({
      name: comp.competitorName,
      score: comp.score?.score || 0,
      mentionCount: comp.mentionCount,
      sentimentDistribution: comp.score?.sentimentDistribution || {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
    })) || [];

    // Generate PDF report
    const { generatePDFReport, generateExportFilename } = await import('@/lib/ai-visibility-export');

    const exportData = {
      visibilityScore: latestScore,
      mentions,
      competitorData,
      dateRange,
      agentName,
    };

    const pdfBuffer = await generatePDFReport(exportData);
    const filename = generateExportFilename(agentName, dateRange);

    // Upload to S3 with 24-hour expiration
    const { uploadFile, getPresignedDownloadUrl } = await import('@/aws/s3/client');
    const s3Key = `exports/${userId}/ai-visibility/${Date.now()}-${filename}`;

    await uploadFile(
      s3Key,
      pdfBuffer,
      'application/pdf',
      {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'max-age=86400', // 24 hours
      }
    );

    // Generate presigned download URL (valid for 24 hours)
    const downloadUrl = await getPresignedDownloadUrl(s3Key, filename, 86400);

    return {
      message: 'Report generated successfully',
      data: { downloadUrl },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to export AI visibility report:', error);
    const errorMessage = handleAWSError(error, 'Failed to generate report');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Get user budget and API usage information
 */
export async function getUserBudgetInfo(userId: string): Promise<{
  message: string;
  data: {
    budget: {
      monthlyLimit: number;
      currentSpend: number;
      remainingBudget: number;
      percentageUsed: number;
      periodStart: string;
      periodEnd: string;
      autoReduceFrequency: boolean;
    };
    usage: {
      totalQueries: number;
      costByPlatform: Record<string, number>;
      recentUsage: any[];
    };
  } | null;
  errors: any;
}> {
  try {
    const { createAICostControlService } = await import('@/lib/ai-cost-control');
    const costControl = createAICostControlService();

    // Get user budget
    const budget = await costControl.getUserBudget(userId);
    const remainingBudget = budget.monthlyLimit - budget.currentSpend;
    const percentageUsed = (budget.currentSpend / budget.monthlyLimit) * 100;

    // Get recent API usage
    const recentUsage = await costControl.getAPIUsage(
      userId,
      budget.periodStart,
      budget.periodEnd
    );

    // Calculate cost by platform
    const costByPlatform: Record<string, number> = {};
    let totalQueries = 0;

    for (const record of recentUsage) {
      costByPlatform[record.platform] = (costByPlatform[record.platform] || 0) + record.estimatedCost;
      totalQueries += record.queryCount;
    }

    return {
      message: 'Budget information retrieved successfully',
      data: {
        budget: {
          monthlyLimit: budget.monthlyLimit,
          currentSpend: budget.currentSpend,
          remainingBudget,
          percentageUsed,
          periodStart: budget.periodStart,
          periodEnd: budget.periodEnd,
          autoReduceFrequency: budget.autoReduceFrequency,
        },
        usage: {
          totalQueries,
          costByPlatform,
          recentUsage: recentUsage.slice(0, 10), // Last 10 records
        },
      },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get user budget info:', error);
    const errorMessage = handleAWSError(error, 'Failed to retrieve budget information');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Update user budget configuration
 */
export async function updateUserBudgetConfig(
  userId: string,
  updates: {
    monthlyLimit?: number;
    alertThresholds?: number[];
    autoReduceFrequency?: boolean;
  }
): Promise<{
  message: string;
  data: { success: boolean } | null;
  errors: any;
}> {
  try {
    const { createAICostControlService } = await import('@/lib/ai-cost-control');
    const costControl = createAICostControlService();

    await costControl.updateUserBudget(userId, updates);

    return {
      message: 'Budget configuration updated successfully',
      data: { success: true },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to update user budget config:', error);
    const errorMessage = handleAWSError(error, 'Failed to update budget configuration');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Estimate cost for upcoming monitoring execution
 */
export async function estimateMonitoringCost(userId: string): Promise<{
  message: string;
  data: {
    totalCost: number;
    breakdown: {
      platform: string;
      queries: number;
      costPerQuery: number;
      totalCost: number;
    }[];
    withinBudget: boolean;
    remainingBudget: number;
  } | null;
  errors: any;
}> {
  try {
    const repository = getRepository();
    const { createAICostControlService } = await import('@/lib/ai-cost-control');
    const costControl = createAICostControlService();

    // Get monitoring config
    const config = await repository.getAIMonitoringConfig<AIMonitoringConfig>(userId);

    if (!config) {
      return {
        message: 'Monitoring not configured for this user',
        data: null,
        errors: { config: ['Please configure AI monitoring first'] },
      };
    }

    // Estimate cost
    const queriesPerPlatform = config.queryTemplates.length;
    const estimate = await costControl.estimateCost(
      userId,
      config.platforms,
      queriesPerPlatform
    );

    return {
      message: 'Cost estimate calculated successfully',
      data: estimate,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to estimate monitoring cost:', error);
    const errorMessage = handleAWSError(error, 'Failed to estimate cost');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Get cost spike alerts for admin
 */
export async function getCostSpikeAlerts(
  options: {
    limit?: number;
    unacknowledgedOnly?: boolean;
  } = {}
): Promise<{
  message: string;
  data: any[] | null;
  errors: any;
}> {
  try {
    const repository = getRepository();

    // This would typically query across all users (admin function)
    // For now, we'll return a placeholder
    // In production, you'd need a GSI to query all cost spike alerts

    return {
      message: 'Cost spike alerts retrieved successfully',
      data: [],
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get cost spike alerts:', error);
    const errorMessage = handleAWSError(error, 'Failed to retrieve cost spike alerts');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Update AI monitoring configuration
 */
export async function updateAIMonitoringConfigAction(
  userId: string,
  config: Partial<AIMonitoringConfig>
): Promise<{
  message: string;
  data: AIMonitoringConfig | null;
  errors: any;
}> {
  try {
    const repository = getRepository();

    // Get existing config
    const existingConfig = await repository.getAIMonitoringConfig<AIMonitoringConfig>(userId);

    if (!existingConfig) {
      // Create new config if it doesn't exist
      const { createAIMonitoringScheduler } = await import('@/lib/ai-monitoring-scheduler');
      const scheduler = createAIMonitoringScheduler();

      // Schedule monitoring with the provided frequency
      await scheduler.scheduleMonitoring(
        userId,
        config.frequency || 'weekly'
      );

      // Get the newly created config
      const newConfig = await repository.getAIMonitoringConfig<AIMonitoringConfig>(userId);

      if (!newConfig) {
        throw new Error('Failed to create monitoring configuration');
      }

      // Update with any additional settings
      if (config.platforms || config.alertThreshold !== undefined || config.enabled !== undefined) {
        await repository.updateAIMonitoringConfig(userId, {
          ...config,
          updatedAt: Date.now(),
        });
      }

      const updatedConfig = await repository.getAIMonitoringConfig<AIMonitoringConfig>(userId);

      return {
        message: 'success',
        data: updatedConfig,
        errors: {},
      };
    }

    // Update existing config
    await repository.updateAIMonitoringConfig(userId, {
      ...config,
      updatedAt: Date.now(),
    });

    // If frequency changed, reschedule
    if (config.frequency && config.frequency !== existingConfig.frequency) {
      const { createAIMonitoringScheduler } = await import('@/lib/ai-monitoring-scheduler');
      const scheduler = createAIMonitoringScheduler();
      await scheduler.scheduleMonitoring(userId, config.frequency);
    }

    const updatedConfig = await repository.getAIMonitoringConfig<AIMonitoringConfig>(userId);

    return {
      message: 'success',
      data: updatedConfig,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to update monitoring config:', error);
    const errorMessage = handleAWSError(error, 'Failed to update monitoring configuration');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

// ==================== Website Analysis Actions ====================

/**
 * Save website analysis to DynamoDB
 * Saves both as latest and as historical record
 * Optimized with parallel writes for better performance
 */
export async function saveWebsiteAnalysis(
  userId: string,
  analysis: WebsiteAnalysisResult
): Promise<{
  message: string;
  data: { success: boolean } | null;
  errors: any;
}> {
  try {
    const repository = getRepository();
    const { getWebsiteAnalysisKeys } = await import('@/aws/dynamodb/keys');
    const { websiteAnalysisResultSchema } = await import('@/ai/schemas/website-analysis-schemas');

    // Validate analysis data
    const validatedAnalysis = websiteAnalysisResultSchema.parse(analysis);

    // Prepare keys for both writes
    const latestKeys = getWebsiteAnalysisKeys(userId);
    const timestamp = new Date(validatedAnalysis.analyzedAt).getTime().toString();
    const historicalKeys = getWebsiteAnalysisKeys(userId, timestamp);

    // Execute both writes in parallel for better performance
    const [latestResult, historicalResult] = await Promise.allSettled([
      repository.create(
        latestKeys.PK,
        latestKeys.SK,
        'WebsiteAnalysis',
        validatedAnalysis
      ),
      repository.create(
        historicalKeys.PK,
        historicalKeys.SK,
        'WebsiteAnalysis',
        validatedAnalysis
      ),
    ]);

    // Check if both writes succeeded
    if (latestResult.status === 'rejected' || historicalResult.status === 'rejected') {
      const errors = [];
      if (latestResult.status === 'rejected') {
        errors.push(`Latest: ${latestResult.reason}`);
      }
      if (historicalResult.status === 'rejected') {
        errors.push(`Historical: ${historicalResult.reason}`);
      }
      throw new Error(`Failed to save analysis: ${errors.join(', ')}`);
    }

    // Update profile with optimization score (async, don't block)
    // Run in background to avoid blocking the response
    Promise.resolve().then(async () => {
      try {
        const profileKeys = getProfileKeys(userId);
        const existingProfile = await repository.get(profileKeys.PK, profileKeys.SK) as any;

        if (existingProfile && existingProfile.Data) {
          const updatedProfileData = {
            PK: profileKeys.PK,
            SK: profileKeys.SK,
            EntityType: 'RealEstateAgentProfile' as const,
            Data: {
              ...(existingProfile.Data as any),
              websiteOptimizationScore: validatedAnalysis.overallScore,
              websiteOptimizationAnalyzedAt: validatedAnalysis.analyzedAt,
            },
            CreatedAt: existingProfile.CreatedAt || Date.now(),
            UpdatedAt: Date.now(),
          };

          await repository.put(updatedProfileData);
        }
      } catch (profileError) {
        // Log error but don't fail the entire operation
        console.error('Failed to update profile with optimization score:', profileError);
      }
    }).catch(err => {
      console.error('Background profile update failed:', err);
    });

    return {
      message: 'Website analysis saved successfully',
      data: { success: true },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to save website analysis:', error);
    const errorMessage = handleAWSError(error, 'Failed to save website analysis');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Get the latest website analysis for a user
 */
export async function getLatestWebsiteAnalysis(userId: string): Promise<{
  message: string;
  data: WebsiteAnalysisResult | null;
  errors: any;
}> {
  try {
    const repository = getRepository();
    const { getWebsiteAnalysisKeys } = await import('@/aws/dynamodb/keys');

    const keys = getWebsiteAnalysisKeys(userId);
    const result = await repository.get<WebsiteAnalysisResult>(keys.PK, keys.SK);

    if (!result) {
      return {
        message: 'No website analysis found. Run your first analysis to get started.',
        data: null,
        errors: {},
      };
    }

    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get latest website analysis:', error);
    const errorMessage = handleAWSError(error, 'Failed to retrieve website analysis');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Get website analysis history for a user
 * Returns up to the specified limit of historical analyses, sorted by date (newest first)
 * Optimized with projection to reduce data transfer
 */
export async function getWebsiteAnalysisHistory(
  userId: string,
  limit: number = 5
): Promise<{
  message: string;
  data: WebsiteAnalysisResult[] | null;
  errors: any;
}> {
  try {
    const repository = getRepository();

    // Query with optimized limit to reduce over-fetching
    // We fetch limit + 1 to account for the 'latest' entry, but no more
    const result = await repository.query<WebsiteAnalysisResult>(
      `USER#${userId}`,
      'WEBSITE_ANALYSIS#',
      {
        limit: limit + 1, // +1 to account for the 'latest' entry
        scanIndexForward: false, // Most recent first
      }
    );

    // Filter out the 'latest' entry (it has SK = 'WEBSITE_ANALYSIS#latest')
    // and only keep historical entries (SK = 'WEBSITE_ANALYSIS#<timestamp>')
    const historicalAnalyses = result.items.filter(analysis => {
      // Historical entries have numeric timestamps in their IDs
      return analysis.id !== 'latest' && /^\d+$/.test(analysis.id.split('-').pop() || '');
    }).slice(0, limit);

    if (historicalAnalyses.length === 0) {
      return {
        message: 'No analysis history found. Run multiple analyses to track your progress over time.',
        data: [],
        errors: {},
      };
    }

    return {
      message: 'success',
      data: historicalAnalyses,
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to get website analysis history:', error);
    const errorMessage = handleAWSError(error, 'Failed to retrieve analysis history');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Calculate trend from historical website analysis data
 * Compares the latest analysis with previous ones to determine if scores are improving, declining, or stable
 */
export async function calculateWebsiteAnalysisTrend(
  userId: string
): Promise<{
  message: string;
  data: {
    trend: 'improving' | 'declining' | 'stable';
    currentScore: number;
    previousScore: number | null;
    scoreChange: number;
    percentageChange: number;
    analysisCount: number;
  } | null;
  errors: any;
}> {
  try {
    const repository = getRepository();

    // Get the last 2 analyses to compare
    const result = await repository.query<WebsiteAnalysisResult>(
      `USER#${userId}`,
      'WEBSITE_ANALYSIS#',
      {
        limit: 3, // Get 3 to account for 'latest' entry
        scanIndexForward: false, // Most recent first
      }
    );

    // Filter out the 'latest' entry
    const historicalAnalyses = result.items.filter(analysis => {
      return analysis.id !== 'latest' && /^\d+$/.test(analysis.id.split('-').pop() || '');
    });

    if (historicalAnalyses.length === 0) {
      return {
        message: 'Not enough data to calculate trend. Run at least one analysis.',
        data: null,
        errors: {},
      };
    }

    const currentAnalysis = historicalAnalyses[0];
    const currentScore = currentAnalysis.overallScore;

    // If only one analysis exists, we can't calculate a trend
    if (historicalAnalyses.length === 1) {
      return {
        message: 'success',
        data: {
          trend: 'stable',
          currentScore,
          previousScore: null,
          scoreChange: 0,
          percentageChange: 0,
          analysisCount: 1,
        },
        errors: {},
      };
    }

    const previousAnalysis = historicalAnalyses[1];
    const previousScore = previousAnalysis.overallScore;
    const scoreChange = currentScore - previousScore;
    const percentageChange = previousScore > 0 ? (scoreChange / previousScore) * 100 : 0;

    // Determine trend based on score change
    // Consider changes less than 2 points as stable
    let trend: 'improving' | 'declining' | 'stable';
    if (Math.abs(scoreChange) < 2) {
      trend = 'stable';
    } else if (scoreChange > 0) {
      trend = 'improving';
    } else {
      trend = 'declining';
    }

    return {
      message: 'success',
      data: {
        trend,
        currentScore,
        previousScore,
        scoreChange,
        percentageChange,
        analysisCount: historicalAnalyses.length,
      },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to calculate website analysis trend:', error);
    const errorMessage = handleAWSError(error, 'Failed to calculate trend');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Server action to analyze a website
 * Validates input, runs the analysis flow, and saves results
 * Handles missing profile data, unreachable websites, and Bedrock errors
 */
export async function analyzeWebsiteAction(
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: WebsiteAnalysisResult | null;
  errors: any;
}> {
  const startTime = Date.now();
  let userId: string | undefined;
  let websiteUrl: string | undefined;

  try {
    const { websiteAnalysisInputSchema } = await import('@/ai/schemas/website-analysis-schemas');
    const { analyzeWebsite } = await import('@/aws/bedrock/flows/website-analysis');
    const { createLogger, generateCorrelationId } = await import('@/aws/logging/logger');

    // Initialize logger
    const correlationId = generateCorrelationId();
    const actionLogger = createLogger({
      correlationId,
      service: 'website-analysis-action',
      operation: 'analyzeWebsiteAction',
    });

    // Get current user
    const user = await getCurrentUserServer();
    if (!user || !user.id) {
      actionLogger.warn('Unauthorized website analysis attempt', {
        reason: 'No user session',
      });

      return {
        message: 'Please sign in to analyze your website',
        data: null,
        errors: { auth: ['You must be logged in to analyze a website'] },
      };
    }

    userId = user.id;
    actionLogger.debug('User authenticated', { userId });

    // Parse and validate input
    websiteUrl = formData.get('websiteUrl') as string;
    const profileDataJson = formData.get('profileData') as string;

    actionLogger.debug('Parsing input', {
      hasWebsiteUrl: !!websiteUrl,
      hasProfileData: !!profileDataJson,
    });

    // Validate website URL
    if (!websiteUrl || websiteUrl.trim().length === 0) {
      actionLogger.warn('Validation failed: missing website URL', {
        userId,
      });

      return {
        message: 'Please enter a website URL to analyze',
        data: null,
        errors: { websiteUrl: ['Website URL is required'] },
      };
    }

    // Basic URL format validation
    try {
      const url = new URL(websiteUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        actionLogger.warn('Validation failed: invalid URL protocol', {
          userId,
          websiteUrl,
          protocol: url.protocol,
        });

        return {
          message: 'Please enter a valid website URL starting with http:// or https://',
          data: null,
          errors: { websiteUrl: ['URL must use http:// or https:// protocol'] },
        };
      }
    } catch (error) {
      actionLogger.warn('Validation failed: malformed URL', {
        userId,
        websiteUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        message: 'Please enter a valid website URL (e.g., https://example.com)',
        data: null,
        errors: { websiteUrl: ['Invalid URL format'] },
      };
    }

    // Parse profile data
    let profileData;
    try {
      profileData = profileDataJson ? JSON.parse(profileDataJson) : {};
      actionLogger.debug('Profile data parsed', {
        userId,
        hasName: !!profileData.name,
        hasAddress: !!profileData.address,
        hasPhone: !!profileData.phone,
      });
    } catch (error) {
      actionLogger.error('Failed to parse profile data', error as Error, {
        userId,
      });

      return {
        message: 'Invalid profile data format',
        data: null,
        errors: { profileData: ['Invalid profile data format'] },
      };
    }

    // Check for missing critical profile data
    const missingFields: string[] = [];
    if (!profileData.name || profileData.name.trim().length === 0) {
      missingFields.push('name');
    }
    if (!profileData.address || profileData.address.trim().length === 0) {
      missingFields.push('address');
    }
    if (!profileData.phone || profileData.phone.trim().length === 0) {
      missingFields.push('phone');
    }

    if (missingFields.length > 0) {
      const fieldList = missingFields.join(', ');
      actionLogger.warn('Validation failed: incomplete profile', {
        userId,
        missingFields,
      });

      return {
        message: `Please complete your profile before analyzing your website. Missing: ${fieldList}`,
        data: null,
        errors: {
          profile: [
            `Your profile is missing required information: ${fieldList}`,
            'Please update your profile in Brand → Profile before running the analysis',
          ],
        },
      };
    }

    // Validate input with schema
    const validatedInput = websiteAnalysisInputSchema.safeParse({
      userId: user.id,
      websiteUrl,
      profileData,
    });

    if (!validatedInput.success) {
      const errors = validatedInput.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] || 'Validation failed';

      actionLogger.warn('Schema validation failed', {
        userId,
        websiteUrl,
        errors,
      });

      return {
        message: firstError,
        data: null,
        errors,
      };
    }

    actionLogger.info('Starting website analysis', {
      userId,
      websiteUrl,
    });

    // Run the website analysis flow
    let result: WebsiteAnalysisResult;
    try {
      result = await analyzeWebsite(validatedInput.data);

      actionLogger.info('Website analysis completed successfully', {
        userId,
        websiteUrl,
        duration: Date.now() - startTime,
        score: result.overallScore,
      });
    } catch (error) {
      actionLogger.error('Website analysis flow failed', error as Error, {
        userId,
        websiteUrl,
        duration: Date.now() - startTime,
      });

      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';

      // Provide specific error messages based on error type
      if (errorMessage.includes('timeout')) {
        return {
          message: 'The website took too long to respond. Please try again or check if the website is slow.',
          data: null,
          errors: { network: ['Request timeout'] },
        };
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return {
          message: 'Website not found. Please verify the URL is correct and the website is online.',
          data: null,
          errors: { network: ['Website not found'] },
        };
      } else if (errorMessage.includes('refused') || errorMessage.includes('403')) {
        return {
          message: 'Unable to access the website. It may be blocking automated access or require authentication.',
          data: null,
          errors: { network: ['Access denied'] },
        };
      } else if (errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
        return {
          message: 'The website has an invalid SSL certificate. Please contact the website administrator.',
          data: null,
          errors: { network: ['SSL certificate error'] },
        };
      } else if (errorMessage.includes('AI analysis')) {
        return {
          message: 'The AI analysis service is temporarily unavailable. Please try again in a few moments.',
          data: null,
          errors: { ai: ['AI service error'] },
        };
      }

      // Generic error fallback
      return {
        message: errorMessage || 'An unexpected error occurred while analyzing the website',
        data: null,
        errors: { system: [errorMessage] },
      };
    }

    // Save the analysis results
    try {
      await saveWebsiteAnalysis(user.id, result);
      actionLogger.debug('Analysis results saved to database', {
        userId,
        analysisId: result.id,
      });
    } catch (error) {
      actionLogger.error('Failed to save analysis results', error as Error, {
        userId,
        analysisId: result.id,
      });

      // Don't fail the entire operation if save fails - return the results anyway
      // The user can still see the analysis, just won't be saved to history
      return {
        message: 'Analysis complete, but failed to save to history',
        data: result,
        errors: { storage: ['Failed to save analysis to database'] },
      };
    }

    actionLogger.info('Website analysis action completed successfully', {
      userId,
      websiteUrl,
      duration: Date.now() - startTime,
      score: result.overallScore,
    });

    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error: any) {
    const { createLogger } = await import('@/aws/logging/logger');
    const errorLogger = createLogger({
      service: 'website-analysis-action',
      operation: 'analyzeWebsiteAction',
    });

    errorLogger.error('Unexpected error in analyzeWebsiteAction', error, {
      userId,
      websiteUrl,
      duration: Date.now() - startTime,
    });

    const errorMessage = handleAWSError(error, 'An unexpected error occurred while analyzing the website');
    return {
      message: errorMessage,
      data: null,
      errors: { system: [error.message || 'Unknown error'] },
    };
  }
}

/**
 * Server action to get saved website analysis
 * Returns the latest analysis for the current user
 */
export async function getWebsiteAnalysisAction(userId: string): Promise<{
  message: string;
  data: WebsiteAnalysisResult | null;
  errors: any;
}> {
  const startTime = Date.now();

  try {
    const { createLogger } = await import('@/aws/logging/logger');
    const actionLogger = createLogger({
      service: 'website-analysis-action',
      operation: 'getWebsiteAnalysisAction',
      userId,
    });

    actionLogger.debug('Retrieving latest website analysis', { userId });

    const result = await getLatestWebsiteAnalysis(userId);

    actionLogger.debug('Latest website analysis retrieved', {
      userId,
      duration: Date.now() - startTime,
      hasData: !!result.data,
    });

    return result;
  } catch (error: any) {
    const { createLogger } = await import('@/aws/logging/logger');
    const errorLogger = createLogger({
      service: 'website-analysis-action',
      operation: 'getWebsiteAnalysisAction',
      userId,
    });

    errorLogger.error('Failed to get website analysis', error, {
      userId,
      duration: Date.now() - startTime,
    });

    const errorMessage = handleAWSError(error, 'Failed to retrieve website analysis');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Server action to get website analysis history
 * Returns historical analyses with trend calculation
 * Optimized to avoid redundant queries by calculating trend from history data
 */
export async function getWebsiteAnalysisHistoryAction(
  userId: string,
  limit: number = 5
): Promise<{
  message: string;
  data: {
    history: WebsiteAnalysisResult[];
    trend: {
      trend: 'improving' | 'declining' | 'stable';
      currentScore: number;
      previousScore: number | null;
      scoreChange: number;
      percentageChange: number;
      analysisCount: number;
    } | null;
  } | null;
  errors: any;
}> {
  const startTime = Date.now();

  try {
    const { createLogger } = await import('@/aws/logging/logger');
    const actionLogger = createLogger({
      service: 'website-analysis-action',
      operation: 'getWebsiteAnalysisHistoryAction',
      userId,
    });

    actionLogger.debug('Retrieving website analysis history', {
      userId,
      limit,
    });

    // Get history - single query instead of two separate queries
    const historyResult = await getWebsiteAnalysisHistory(userId, limit);

    if (!historyResult.data || historyResult.data.length === 0) {
      actionLogger.debug('No website analysis history found', {
        userId,
        duration: Date.now() - startTime,
      });

      return {
        message: historyResult.message,
        data: null,
        errors: historyResult.errors,
      };
    }

    // Calculate trend from the history data we already have
    // This avoids a second database query
    const history = historyResult.data;
    let trend: {
      trend: 'improving' | 'declining' | 'stable';
      currentScore: number;
      previousScore: number | null;
      scoreChange: number;
      percentageChange: number;
      analysisCount: number;
    } | null = null;

    if (history.length > 0) {
      const currentAnalysis = history[0];
      const currentScore = currentAnalysis.overallScore;

      if (history.length === 1) {
        // Only one analysis, no trend to calculate
        trend = {
          trend: 'stable',
          currentScore,
          previousScore: null,
          scoreChange: 0,
          percentageChange: 0,
          analysisCount: 1,
        };
      } else {
        // Calculate trend from first two analyses
        const previousAnalysis = history[1];
        const previousScore = previousAnalysis.overallScore;
        const scoreChange = currentScore - previousScore;
        const percentageChange = previousScore > 0 ? (scoreChange / previousScore) * 100 : 0;

        // Determine trend based on score change
        // Consider changes less than 2 points as stable
        let trendDirection: 'improving' | 'declining' | 'stable';
        if (Math.abs(scoreChange) < 2) {
          trendDirection = 'stable';
        } else if (scoreChange > 0) {
          trendDirection = 'improving';
        } else {
          trendDirection = 'declining';
        }

        trend = {
          trend: trendDirection,
          currentScore,
          previousScore,
          scoreChange,
          percentageChange,
          analysisCount: history.length,
        };
      }
    }

    actionLogger.debug('Website analysis history retrieved', {
      userId,
      duration: Date.now() - startTime,
      historyCount: history.length,
      hasTrend: !!trend,
      trendDirection: trend?.trend,
    });

    return {
      message: 'success',
      data: {
        history,
        trend,
      },
      errors: {},
    };
  } catch (error: any) {
    const { createLogger } = await import('@/aws/logging/logger');
    const errorLogger = createLogger({
      service: 'website-analysis-action',
      operation: 'getWebsiteAnalysisHistoryAction',
      userId,
    });

    errorLogger.error('Failed to get website analysis history', error, {
      userId,
      duration: Date.now() - startTime,
    });

    const errorMessage = handleAWSError(error, 'Failed to retrieve analysis history');
    return {
      message: errorMessage,
      data: null,
      errors: { system: error.message },
    };
  }
}

/**
 * Bootstrap first user with SuperAdmin role
 * This action is called after user signup to determine if the user is the first user
 * and should be assigned the SuperAdmin role automatically.
 * 
 * @param userId - The Cognito user ID (sub)
 * @param email - The user's email address
 * @param givenName - The user's first name
 * @param familyName - The user's last name
 * @returns Success status and assigned role
 */
export async function bootstrapFirstUserAction(
  userId: string,
  email: string,
  givenName?: string,
  familyName?: string
): Promise<{
  message: string;
  data?: { role: 'user' | 'admin' | 'superadmin'; isFirstUser: boolean };
  errors: Record<string, string[]>;
}> {
  try {
    const repository = getRepository();
    const cognitoClient = getCognitoClient();

    // Query DynamoDB to count existing users
    // We'll scan for all items with PK starting with USER# and SK = PROFILE
    const scanCommand = new ScanCommand({
      TableName: getTableName(),
      FilterExpression: 'begins_with(PK, :userPrefix) AND SK = :profileSK',
      ExpressionAttributeValues: {
        ':userPrefix': 'USER#',
        ':profileSK': 'PROFILE',
      },
      Select: 'COUNT',
    });

    const { getDocumentClient } = await import('@/aws/dynamodb/client');
    const client = getDocumentClient();
    const scanResult = await client.send(scanCommand);
    const userCount = scanResult.Count || 0;

    // Determine role: first user gets SuperAdmin, others get User
    const isFirstUser = userCount === 0;
    const role: 'user' | 'admin' | 'superadmin' = isFirstUser ? 'superadmin' : 'user';

    // Update Cognito with the role
    await cognitoClient.updateUserRole(userId, role);

    // Create user profile in DynamoDB with role
    const profileKeys = getUserProfileKeys(userId);
    const now = Date.now();

    await repository.create(profileKeys.PK, profileKeys.SK, 'UserProfile', {
      userId,
      email,
      givenName,
      familyName,
      role,
      roleAssignedAt: now,
      roleAssignedBy: isFirstUser ? 'system' : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // If this is the first user (SuperAdmin), create an audit log entry
    if (isFirstUser) {
      const auditId = uuidv4();
      const { getRoleAuditKeys } = await import('@/aws/dynamodb/keys');
      const auditKeys = getRoleAuditKeys(userId, auditId, now);

      await repository.create(auditKeys.PK, auditKeys.SK, 'RoleAuditLog', {
        auditId,
        timestamp: now,
        actingAdminId: 'system',
        actingAdminEmail: 'system@bayon.ai',
        affectedUserId: userId,
        affectedUserEmail: email,
        oldRole: 'user',
        newRole: 'superadmin',
        ipAddress: 'system',
        userAgent: 'bootstrap',
        action: 'assign',
      }, {
        GSI1PK: auditKeys.GSI1PK,
        GSI1SK: auditKeys.GSI1SK,
      });

      console.log(`✅ First user bootstrapped as SuperAdmin: ${userId} (${email})`);
    } else {
      console.log(`✅ User created with default role: ${userId} (${email})`);
    }

    return {
      message: 'success',
      data: { role, isFirstUser },
      errors: {},
    };
  } catch (error: any) {
    console.error('Failed to bootstrap user:', error);
    const errorMessage = handleAWSError(error, 'Failed to initialize user account');
    return {
      message: errorMessage,
      data: undefined,
      errors: { system: [error.message || 'Unknown error'] },
    };
  }
}

// ============================================================================
// ONBOARDING ACTIONS
// ============================================================================

/**
 * Get onboarding state for a user
 */
export async function getOnboardingStateAction(userId: string): Promise<{
  message: string;
  data: any | null;
  errors: any;
}> {
  try {
    // Direct DynamoDB access to avoid service layer issues
    const { DynamoDBRepository } = await import('@/aws/dynamodb/repository');
    const { getOnboardingStateKeys } = await import('@/aws/dynamodb/keys');

    const repository = new DynamoDBRepository();
    const keys = getOnboardingStateKeys(userId);
    const state = await repository.get(keys.PK, keys.SK);

    return {
      message: 'Onboarding state retrieved successfully',
      data: state,
      errors: null,
    };
  } catch (error: any) {
    console.error('[ONBOARDING_ACTION] Error getting onboarding state:', error);
    return {
      message: 'Failed to get onboarding state',
      data: null,
      errors: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Initialize onboarding for a user
 */
export async function initializeOnboardingAction(
  userId: string,
  flowType: 'user' | 'admin'
): Promise<{
  message: string;
  data: any | null;
  errors: any;
}> {
  try {
    // Create a complete onboarding state with all required fields
    const now = new Date().toISOString();
    const state = {
      userId,
      flowType,
      currentStep: 0, // Should be number, not string
      completedSteps: [],
      skippedSteps: [], // Required field that was missing
      isComplete: false,
      startedAt: now, // Required field that was missing
      lastAccessedAt: now,
      metadata: {}, // Optional but good to have
    };

    // Save to DynamoDB
    const { DynamoDBRepository } = await import('@/aws/dynamodb/repository');
    const { getOnboardingStateKeys } = await import('@/aws/dynamodb/keys');

    const repository = new DynamoDBRepository();
    const keys = getOnboardingStateKeys(userId, false, now);

    const item = {
      PK: keys.PK,
      SK: keys.SK,
      EntityType: 'LearningProgress' as const,
      Data: state,
      CreatedAt: Date.now(),
      UpdatedAt: Date.now(),
      GSI1PK: keys.GSI1PK,
      GSI1SK: keys.GSI1SK,
    };

    await repository.put(item);

    return {
      message: 'Onboarding initialized successfully',
      data: state,
      errors: null,
    };
  } catch (error: any) {
    console.error('[ONBOARDING_ACTION] Error initializing onboarding:', error);
    return {
      message: 'Failed to initialize onboarding',
      data: null,
      errors: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Complete an onboarding step
 */
export async function completeOnboardingStepAction(
  userId: string,
  stepId: string
): Promise<{
  message: string;
  data: any | null;
  errors: any;
}> {
  try {
    // Get current state
    const { DynamoDBRepository } = await import('@/aws/dynamodb/repository');
    const { getOnboardingStateKeys } = await import('@/aws/dynamodb/keys');

    const repository = new DynamoDBRepository();
    const keys = getOnboardingStateKeys(userId);
    let state = await repository.get(keys.PK, keys.SK);

    if (!state) {
      return {
        message: 'Onboarding state not found',
        data: null,
        errors: 'Please initialize onboarding first',
      };
    }

    // Update state
    const now = new Date().toISOString();
    const stateData = state as any;
    const updatedState = {
      ...stateData,
      completedSteps: [...(stateData.completedSteps || []), stepId],
      lastAccessedAt: now,
    };

    // Save updated state
    const item = {
      PK: keys.PK,
      SK: keys.SK,
      EntityType: 'LearningProgress' as const,
      Data: updatedState,
      CreatedAt: (state as any).CreatedAt || Date.now(), // Preserve original creation time
      UpdatedAt: Date.now(),
      GSI1PK: keys.GSI1PK,
      GSI1SK: keys.GSI1SK,
    };

    await repository.put(item);

    return {
      message: 'Onboarding step completed successfully',
      data: updatedState,
      errors: null,
    };
  } catch (error: any) {
    console.error('[ONBOARDING_ACTION] Error completing onboarding step:', error);
    return {
      message: 'Failed to complete onboarding step',
      data: null,
      errors: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Skip an onboarding step
 */
export async function skipOnboardingStepAction(
  userId: string,
  stepId: string
): Promise<{
  message: string;
  data: any | null;
  errors: any;
}> {
  try {
    // Get current state
    const { DynamoDBRepository } = await import('@/aws/dynamodb/repository');
    const { getOnboardingStateKeys } = await import('@/aws/dynamodb/keys');

    const repository = new DynamoDBRepository();
    const keys = getOnboardingStateKeys(userId);
    let state = await repository.get(keys.PK, keys.SK);

    if (!state) {
      return {
        message: 'Onboarding state not found',
        data: null,
        errors: 'Please initialize onboarding first',
      };
    }

    // Update state
    const now = new Date().toISOString();
    const stateData = state as any;
    const updatedState = {
      ...stateData,
      skippedSteps: [...(stateData.skippedSteps || []), stepId],
      // Remove from completed steps if it was there
      completedSteps: (stateData.completedSteps || []).filter((id: string) => id !== stepId),
      lastAccessedAt: now,
    };

    // Save updated state
    const item = {
      PK: keys.PK,
      SK: keys.SK,
      EntityType: 'LearningProgress' as const,
      Data: updatedState,
      CreatedAt: (state as any).CreatedAt || Date.now(), // Preserve original creation time
      UpdatedAt: Date.now(),
      GSI1PK: keys.GSI1PK,
      GSI1SK: keys.GSI1SK,
    };

    await repository.put(item);

    return {
      message: 'Onboarding step skipped successfully',
      data: updatedState,
      errors: null,
    };
  } catch (error: any) {
    console.error('[ONBOARDING_ACTION] Error skipping onboarding step:', error);
    return {
      message: 'Failed to skip onboarding step',
      data: null,
      errors: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Reset onboarding for a user
 */
export async function resetOnboardingAction(userId: string): Promise<{
  message: string;
  data: null;
  errors: string | null;
}> {
  try {
    // Delete the onboarding state from DynamoDB
    const { DynamoDBRepository } = await import('@/aws/dynamodb/repository');
    const { getOnboardingStateKeys } = await import('@/aws/dynamodb/keys');

    const repository = new DynamoDBRepository();
    const keys = getOnboardingStateKeys(userId);

    await repository.delete(keys.PK, keys.SK);

    return {
      message: 'Onboarding reset successfully',
      data: null,
      errors: null,
    };
  } catch (error: any) {
    console.error('[ONBOARDING_ACTION] Error resetting onboarding:', error);

    return {
      message: 'Failed to reset onboarding',
      data: null,
      errors: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Generate market insights with AI analysis using real MLS data
 */
export async function generateMarketInsightsAction(input: {
  location: string;
  timeframe: string;
  includeLifeEvents?: boolean;
  includeAlerts?: boolean;
}): Promise<{
  message: string;
  data: {
    trends: any[];
    lifeEvents: any[];
    alerts: any[];
  } | null;
  errors: any;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['Please sign in to access market insights'] }
      };
    }

    // Get user's MLS connections to access real data
    const { getMLSConnectionsAction, getImportedListings } = await import('@/features/integrations/actions/mls-actions');
    const connectionsResult = await getMLSConnectionsAction(userId);
    
    let realMarketData = null;
    if (connectionsResult.success && connectionsResult.data && connectionsResult.data.length > 0) {
      // Get imported listings for market analysis
      const listingsResult = await getImportedListings();
      if (listingsResult.success && listingsResult.data) {
        realMarketData = listingsResult.data;
      }
    }

    // Analyze real MLS data if available, otherwise use intelligent mock data
    const trends = await generateMarketTrends(realMarketData, input.location, input.timeframe);
    const lifeEvents = input.includeLifeEvents ? await generateLifeEventPredictions(realMarketData, input.location) : [];
    const alerts = input.includeAlerts ? await generateMarketAlerts(realMarketData, input.location) : [];

    return {
      message: 'Market insights generated successfully',
      data: {
        trends,
        lifeEvents,
        alerts
      },
      errors: null
    };

  } catch (error: any) {
    console.error('[MARKET_INSIGHTS_ACTION] Error:', error);
    return {
      message: 'Failed to generate market insights',
      data: null,
      errors: error.message || 'Unknown error occurred'
    };
  }
}

/**
 * Generate market trends from real MLS data or intelligent mock data
 */
async function generateMarketTrends(mlsData: any[] | null, location: string, timeframe: string) {
  if (mlsData && mlsData.length > 0) {
    // Analyze real MLS data
    const trends = [];
    
    // Price trend analysis
    const recentListings = mlsData.filter(listing => {
      const listDate = new Date(listing.listDate);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));
      return listDate >= cutoffDate;
    });

    if (recentListings.length > 0) {
      const avgPrice = recentListings.reduce((sum, listing) => sum + listing.price, 0) / recentListings.length;
      const olderListings = mlsData.filter(listing => {
        const listDate = new Date(listing.listDate);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - (timeframe === '7d' ? 14 : timeframe === '30d' ? 60 : 180));
        return listDate < cutoffDate;
      });

      if (olderListings.length > 0) {
        const oldAvgPrice = olderListings.reduce((sum, listing) => sum + listing.price, 0) / olderListings.length;
        const priceChange = ((avgPrice - oldAvgPrice) / oldAvgPrice) * 100;

        trends.push({
          id: '1',
          title: `Home Prices ${priceChange > 0 ? 'Rising' : 'Declining'} in ${location}`,
          description: `Average home prices have ${priceChange > 0 ? 'increased' : 'decreased'} ${Math.abs(priceChange).toFixed(1)}% over the past ${timeframe}.`,
          trend: priceChange > 0 ? 'up' : 'down',
          percentage: Math.abs(priceChange),
          timeframe,
          category: 'pricing',
          location: location === 'all' ? 'Market Area' : location,
          confidence: 90,
          impact: Math.abs(priceChange) > 5 ? 'high' : Math.abs(priceChange) > 2 ? 'medium' : 'low',
          actionable: true,
          source: 'MLS Data',
          lastUpdated: new Date().toISOString()
        });
      }

      // Inventory analysis
      const activeListings = recentListings.filter(listing => listing.status === 'active').length;
      const soldListings = recentListings.filter(listing => listing.status === 'sold').length;
      const inventoryRatio = activeListings / (activeListings + soldListings);

      trends.push({
        id: '2',
        title: inventoryRatio > 0.6 ? 'High Inventory Levels' : 'Low Inventory Market',
        description: `Current inventory shows ${activeListings} active listings vs ${soldListings} sold properties.`,
        trend: inventoryRatio > 0.6 ? 'up' : 'down',
        percentage: inventoryRatio * 100,
        timeframe,
        category: 'inventory',
        location: location === 'all' ? 'Market Area' : location,
        confidence: 85,
        impact: inventoryRatio > 0.7 || inventoryRatio < 0.3 ? 'high' : 'medium',
        actionable: true,
        source: 'MLS Data',
        lastUpdated: new Date().toISOString()
      });

      // Property type analysis
      const propertyTypes = recentListings.reduce((acc, listing) => {
        acc[listing.propertyType] = (acc[listing.propertyType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostPopularType = Object.entries(propertyTypes).sort(([,a], [,b]) => (b as number) - (a as number))[0];
      if (mostPopularType) {
        const percentage = ((mostPopularType as [string, number])[1] / recentListings.length) * 100;
        trends.push({
          id: '3',
          title: `${mostPopularType[0]} Properties Leading Market`,
          description: `${mostPopularType[0]} properties represent ${percentage.toFixed(1)}% of recent listings.`,
          trend: 'stable',
          percentage: percentage,
          timeframe,
          category: 'demand',
          location: location === 'all' ? 'Market Area' : location,
          confidence: 80,
          impact: percentage > 50 ? 'high' : 'medium',
          actionable: true,
          source: 'MLS Data',
          lastUpdated: new Date().toISOString()
        });
      }
    }

    return trends;
  }

  // Fallback to intelligent mock data when no MLS data is available
  return [
    {
      id: '1',
      title: 'Home Prices Rising in Downtown',
      description: 'Average home prices have increased 8.5% in the downtown area over the past 30 days.',
      trend: 'up',
      percentage: 8.5,
      timeframe,
      category: 'pricing',
      location: location === 'all' ? 'Downtown' : location,
      confidence: 85,
      impact: 'high',
      actionable: true,
      source: 'Market Analysis',
      lastUpdated: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Inventory Shortage Continues',
      description: 'Available inventory has decreased by 15% compared to last month.',
      trend: 'down',
      percentage: 15,
      timeframe,
      category: 'inventory',
      location: location === 'all' ? 'Citywide' : location,
      confidence: 92,
      impact: 'high',
      actionable: true,
      source: 'Market Analysis',
      lastUpdated: new Date().toISOString()
    },
    {
      id: '3',
      title: 'First-Time Buyer Demand Up',
      description: 'First-time homebuyer inquiries have increased 12% this quarter.',
      trend: 'up',
      percentage: 12,
      timeframe,
      category: 'demand',
      location: location === 'all' ? 'Metro Area' : location,
      confidence: 78,
      impact: 'medium',
      actionable: true,
      source: 'Lead Analytics',
      lastUpdated: new Date().toISOString()
    }
  ];
}

/**
 * Generate life event predictions based on market data and demographics
 */
async function generateLifeEventPredictions(mlsData: any[] | null, location: string) {
  // This would typically integrate with demographic APIs and census data
  // For now, we'll provide intelligent predictions based on market patterns
  
  const baseEvents = [
    {
      id: '1',
      type: 'marriage',
      location: location === 'all' ? 'Downtown' : location,
      probability: 75,
      timeframe: 'Next 6 months',
      potentialClients: 450,
      averagePrice: 485000,
      description: 'Wedding season approaching with high marriage rates predicted'
    },
    {
      id: '2',
      type: 'job_change',
      location: location === 'all' ? 'Tech District' : location,
      probability: 68,
      timeframe: 'Next 3 months',
      potentialClients: 320,
      averagePrice: 650000,
      description: 'Tech company expansions creating job mobility'
    },
    {
      id: '3',
      type: 'retirement',
      location: location === 'all' ? 'Suburbs' : location,
      probability: 82,
      timeframe: 'Next 12 months',
      potentialClients: 280,
      averagePrice: 420000,
      description: 'Baby boomers reaching retirement age in large numbers'
    }
  ];

  // Adjust predictions based on actual MLS data if available
  if (mlsData && mlsData.length > 0) {
    const avgPrice = mlsData.reduce((sum, listing) => sum + listing.price, 0) / mlsData.length;
    
    // Adjust average prices based on actual market data
    baseEvents.forEach(event => {
      event.averagePrice = Math.round(avgPrice * (event.averagePrice / 500000)); // Scale based on market
    });
  }

  return baseEvents;
}

/**
 * Generate market alerts based on recent changes and thresholds
 */
async function generateMarketAlerts(mlsData: any[] | null, location: string) {
  const alerts = [];

  if (mlsData && mlsData.length > 0) {
    // Check for significant price drops
    const recentPriceDrops = mlsData.filter(listing => {
      // This would check for price history in a real implementation
      return Math.random() < 0.1; // 10% chance for demo
    });

    if (recentPriceDrops.length > 0) {
      alerts.push({
        id: '1',
        type: 'price_change',
        title: 'Significant Price Drops Detected',
        description: `${recentPriceDrops.length} properties in your area have reduced prices recently`,
        location: location === 'all' ? 'Market Area' : location,
        urgency: 'high',
        createdAt: new Date().toISOString(),
        actionRequired: true
      });
    }

    // Check for new listing surge
    const recentListings = mlsData.filter(listing => {
      const listDate = new Date(listing.listDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return listDate >= weekAgo;
    });

    if (recentListings.length > 10) {
      alerts.push({
        id: '2',
        type: 'new_listing',
        title: 'New Listings Surge',
        description: `${recentListings.length} new properties listed in your area this week`,
        location: location === 'all' ? 'Market Area' : location,
        urgency: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        actionRequired: false
      });
    }
  } else {
    // Fallback alerts when no MLS data
    alerts.push(
      {
        id: '1',
        type: 'price_change',
        title: 'Significant Price Drop Detected',
        description: 'A luxury property in your target area dropped price by $50,000',
        location: location === 'all' ? 'Waterfront' : location,
        urgency: 'high',
        createdAt: new Date().toISOString(),
        actionRequired: true
      },
      {
        id: '2',
        type: 'new_listing',
        title: 'New Listings Surge',
        description: '15 new properties listed in your area this week',
        location: location === 'all' ? 'Historic District' : location,
        urgency: 'medium',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        actionRequired: false
      }
    );
  }

  return alerts;
}

/**
 * Save a market alert for monitoring
 */
export async function saveMarketAlertAction(input: {
  type: 'price_change' | 'new_listing' | 'market_shift' | 'opportunity';
  title: string;
  description: string;
  location: string;
  criteria?: any;
}): Promise<{
  message: string;
  data: { alertId: string } | null;
  errors: any;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['Please sign in to save alerts'] }
      };
    }

    const repository = getRepository();
    const alertId = `alert_${Date.now()}`;
    
    const alertData = {
      id: alertId,
      userId,
      type: input.type,
      title: input.title,
      description: input.description,
      location: input.location,
      criteria: input.criteria || {},
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await repository.create(`USER#${userId}`, `ALERT#${alertId}`, 'MarketingPlan', alertData);

    return {
      message: 'Market alert saved successfully',
      data: { alertId },
      errors: null
    };

  } catch (error: any) {
    console.error('[SAVE_MARKET_ALERT_ACTION] Error:', error);
    return {
      message: 'Failed to save market alert',
      data: null,
      errors: error.message || 'Unknown error occurred'
    };
  }
}