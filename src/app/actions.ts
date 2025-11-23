'use server';

// AWS Bedrock flows (migrated from Genkit)
import {
  generateNeighborhoodGuide,
  type GenerateNeighborhoodGuideInput,
  type GenerateNeighborhoodGuideOutput,
} from '@/aws/bedrock/flows/generate-neighborhood-guides';
import {
  generateListingDescription,
  type GenerateListingDescriptionInput,
  type GenerateListingDescriptionOutput,
} from '@/aws/bedrock/flows/listing-description-generator';
import {
  generateListingFaqs,
  type GenerateListingFaqsInput,
  type GenerateListingFaqsOutput,
} from '@/aws/bedrock/flows/generate-listing-faqs';
import {
  exchangeGoogleToken,
  type ExchangeGoogleTokenInput,
  type ExchangeGoogleTokenOutput,
} from '@/aws/bedrock/flows/exchange-google-token';
import {
  generateAgentBio,
  type GenerateAgentBioInput,
  type GenerateAgentBioOutput,
} from '@/aws/bedrock/flows/generate-agent-bio';
import {
  findCompetitors,
  type FindCompetitorsInput,
  type FindCompetitorsOutput,
  enrichCompetitorData,
  type EnrichCompetitorDataInput,
  type EnrichCompetitorDataOutput,
} from '@/aws/bedrock/flows/find-competitors';
import {
  runNapAudit,
  type RunNapAuditInput,
  type RunNapAuditOutput,
} from '@/aws/bedrock/flows/run-nap-audit';
import {
  generateSocialMediaPost,
  type GenerateSocialMediaPostInput,
  type GenerateSocialMediaPostOutput,
} from '@/aws/bedrock/flows/generate-social-media-post';
import {
  runResearchAgent,
  type RunResearchAgentInput,
  type RunResearchAgentOutput,
} from '@/aws/bedrock/flows/run-research-agent';
import {
  runPropertyValuation,
  type PropertyValuationInput,
  type PropertyValuationOutput,
} from '@/aws/bedrock/flows/property-valuation';
import {
  runRenovationROIAnalysis,
  type RenovationROIInput,
  type RenovationROIOutput,
} from '@/aws/bedrock/flows/renovation-roi';
import {
  runNeighborhoodProfileSynthesis,
  type NeighborhoodProfileInput,
  type NeighborhoodProfileOutput,
} from '@/aws/bedrock/flows/neighborhood-profile-flow';
import {
  generateMarketUpdate,
  type GenerateMarketUpdateInput,
  type GenerateMarketUpdateOutput,
} from '@/aws/bedrock/flows/generate-market-update';
import {
  generateVideoScript,
  type GenerateVideoScriptInput,
  type GenerateVideoScriptOutput,
} from '@/aws/bedrock/flows/generate-video-script';
import {
  getKeywordRankings,
  type GetKeywordRankingsInput,
  type GetKeywordRankingsOutput,
} from '@/aws/bedrock/flows/get-keyword-rankings';
import {
  generateBlogPost,
  type GenerateBlogPostInput,
  type GenerateBlogPostOutput,
} from '@/aws/bedrock/flows/generate-blog-post';
import {
  generateHeaderImage,
  type GenerateHeaderImageInput,
  type GenerateHeaderImageOutput,
} from '@/aws/bedrock/flows/generate-header-image';
import {
  generateMarketingPlan,
  type GenerateMarketingPlanInput,
  type GenerateMarketingPlanOutput,
} from '@/aws/bedrock/flows/generate-marketing-plan';
import {
  getZillowReviews,
  type GetZillowReviewsInput,
  type GetZillowReviewsOutput,
} from '@/aws/bedrock/flows/get-zillow-reviews';
import {
  analyzeReviewSentiment,
  type AnalyzeReviewSentimentInput,
  type AnalyzeReviewSentimentOutput,
} from '@/aws/bedrock/flows/analyze-review-sentiment';
import {
  analyzeMultipleReviews,
  type AnalyzeMultipleReviewsInput,
  type AnalyzeMultipleReviewsOutput,
} from '@/aws/bedrock/flows/analyze-multiple-reviews';
import {
  getRealEstateNews,
  type GetRealEstateNewsInput,
  type GetRealEstateNewsOutput
} from '@/aws/bedrock/flows/get-real-estate-news';
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
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getRepository } from '@/aws/dynamodb/repository';
import {
  getAgentProfileKeys,
  getProfileKeys,
  getUserProfileKeys,
  getMarketingPlanKeys,
  getReviewAnalysisKeys,
  getProjectKeys,
  getSavedContentKeys,
  getResearchReportKeys,
  getCompetitorKeys,
  getTrainingProgressKeys,
  getNeighborhoodProfileKeys,
} from '@/aws/dynamodb/keys';
import { getAlertDataAccess } from '@/lib/alerts/data-access';
import type { AlertSettings, TargetArea, NeighborhoodProfile, AlertsResponse } from '@/lib/alerts/types';
import type { Profile } from '@/lib/types';
import { validateTargetArea } from '@/lib/alerts/validation';
import { aggregateNeighborhoodData } from '@/lib/alerts/neighborhood-profile-data-aggregation';
import { v4 as uuidv4 } from 'uuid';

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
const handleAWSError = (error: any, defaultMessage: string): string => {
  if (error instanceof Error) {
    const lowerCaseMessage = error.message.toLowerCase();

    // Bedrock-specific errors
    if (lowerCaseMessage.includes('throttl') || lowerCaseMessage.includes('rate')) {
      return 'The AI service is currently busy. Please try again in a moment.';
    }
    if (lowerCaseMessage.includes('filtered') || lowerCaseMessage.includes('content policy')) {
      return 'The AI was unable to process this request due to safety filters. Please try a different topic.';
    }
    if (lowerCaseMessage.includes('validation') || lowerCaseMessage.includes('invalid')) {
      return 'The request contains invalid data. Please check your input and try again.';
    }
    if (lowerCaseMessage.includes('timeout') || lowerCaseMessage.includes('timed out')) {
      return 'The request took too long to process. Please try again.';
    }
    if (lowerCaseMessage.includes('empty')) {
      return 'The AI returned an empty response. Please try refining your topic.';
    }
    if (lowerCaseMessage.includes('real estate')) {
      return 'The topic provided is not related to real estate. Please provide a real estate topic.';
    }

    // DynamoDB errors
    if (lowerCaseMessage.includes('dynamodb') || lowerCaseMessage.includes('provisioned throughput')) {
      return 'Database service is temporarily unavailable. Please try again.';
    }

    // S3 errors
    if (lowerCaseMessage.includes('s3') || lowerCaseMessage.includes('bucket')) {
      return 'File storage service is temporarily unavailable. Please try again.';
    }

    // Cognito errors
    if (lowerCaseMessage.includes('cognito') || lowerCaseMessage.includes('authentication')) {
      return 'Authentication service error. Please try signing in again.';
    }

    // Network errors
    if (lowerCaseMessage.includes('network') || lowerCaseMessage.includes('econnrefused')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }

    // Return the original error message if it's user-friendly
    if (error.message && error.message.length < 200 && !error.message.includes('Error:')) {
      return error.message;
    }
  }

  // Log the full error for debugging
  console.error('AWS Service Error:', error);

  return defaultMessage;
}

export async function generateGuideAction(prevState: any, formData: FormData) {
  const validatedFields = guideSchema.safeParse({
    targetMarket: formData.get('targetMarket'),
    pillarTopic: formData.get('pillarTopic'),
    idxFeedUrl: formData.get('idxFeedUrl'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: prevState.data,
    };
  }

  try {
    const result = await generateNeighborhoodGuide(
      validatedFields.data as GenerateNeighborhoodGuideInput
    );
    return {
      message: 'success',
      data: {
        guide: result.neighborhoodGuide,
        idxFeedUrl: validatedFields.data.idxFeedUrl,
      },
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the guide.');
    return {
      message: `Failed to generate guide: ${errorMessage}`,
      errors: {},
      data: prevState.data,
    };
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
      propertyDetails: validatedFields.data.propertyDescription,
    };
    const faqInput: GenerateListingFaqsInput = {
      propertyDescription: validatedFields.data.propertyDescription,
    };

    // Run both description and FAQ generation in parallel on the server.
    const [faqResult, descriptionResult] = await Promise.all([
      generateListingFaqs(faqInput),
      generateListingDescription(descriptionInput),
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

const tokenSchema = z.object({
  code: z.string().min(1, 'Authorization code is required.'),
});

export async function exchangeGoogleTokenAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = tokenSchema.safeParse({
    code: formData.get('code'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      data: null,
    };
  }

  try {
    const result = await exchangeGoogleToken(
      validatedFields.data as ExchangeGoogleTokenInput
    );
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

export async function generateBioAction(prevState: any, formData: FormData) {
  const validatedFields = bioSchema.safeParse({
    name: formData.get('name'),
    experience: formData.get('experience'),
    certifications: formData.get('certifications'),
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
  const validatedFields = findCompetitorsSchema.safeParse({
    name: formData.get('name'),
    agencyName: formData.get('agencyName'),
    address: formData.get('address'),
  });

  if (!validatedFields.success) {
    const errorMessage =
      validatedFields.error.errors[0]?.message ||
      'Required profile information is missing.';
    return {
      message: errorMessage,
      data: [],
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await findCompetitors(
      validatedFields.data as FindCompetitorsInput
    );

    return {
      message: 'success',
      data: result.competitors,
      errors: {},
    };
  } catch (error) {
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
  name: z.string().min(1, 'Your name must be set in your profile.'),
  address: z.string().min(1, 'Your address must be set in your profile.'),
  phone: z.string().min(1, 'Your phone number must be set in your profile.'),
  website: z
    .string()
    .url('A valid website URL is required.')
    .optional()
    .or(z.literal('')),
  agencyName: z
    .string()
    .min(1, 'Your agency name must be set in your profile.'),
});

export async function runNapAuditAction(prevState: any, formData: FormData) {
  const validatedFields = napAuditSchema.safeParse({
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

  const auditInput = validatedFields.data;

  try {
    const result = await runNapAudit(auditInput as RunNapAuditInput);

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

const socialPostSchema = z.object({
  topic: z.string().min(10, 'Please provide a more detailed topic for better results.'),
  tone: z.enum(['Professional', 'Casual', 'Enthusiastic', 'Humorous']),
});

export async function generateSocialPostAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = socialPostSchema.safeParse({
    topic: formData.get('topic'),
    tone: formData.get('tone'),
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
  data: (RunResearchAgentOutput & { reportId?: string }) | null;
  errors: any;
}> {
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
    const result = await runResearchAgent({ topic: validatedFields.data.topic });
    return {
      message: 'success',
      data: result,
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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

    if (!profileResult || !profileResult.Data) {
      return {
        message: 'Neighborhood profile not found',
        data: null,
        errors: ['Neighborhood profile not found'],
      };
    }

    const profile = profileResult.Data as NeighborhoodProfile;

    // Get user profile for branding information
    const userProfileKeys = getProfileKeys(user.id);
    const userProfileResult = await repository.get(userProfileKeys.PK, userProfileKeys.SK);
    const agentProfile = userProfileResult?.Data as Profile || {};

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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

    if (!profileResult || !profileResult.Data) {
      return {
        message: 'Neighborhood profile not found',
        data: null,
        errors: ['Neighborhood profile not found'],
      };
    }

    const existingProfile = profileResult.Data as NeighborhoodProfile;

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
      data: result.marketUpdate,
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
    return {
      message: 'success',
      data: result.script,
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

const keywordRankingSchema = z.object({
  keyword: z.string().min(3, 'Please provide a keyword to search.'),
  location: z
    .string()
    .min(3, 'Your address must be set in your profile for local search.'),
});

export async function getKeywordRankingsAction(
  prevState: any,
  formData: FormData
) {
  const validatedFields = keywordRankingSchema.safeParse({
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
    const result = await getKeywordRankings(
      validatedFields.data as GetKeywordRankingsInput
    );
    // Add the original keyword to the result data for display purposes
    const dataWithKeyword = result.rankings.map((r: any) => ({
      ...r,
      keyword: validatedFields.data.keyword,
    }));

    return {
      message: 'success',
      data: dataWithKeyword,
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
      data: { blogPost: null, headerImage: null },
    };
  }

  try {
    const result: GenerateBlogPostOutput = await generateBlogPost(
      validatedFields.data as GenerateBlogPostInput
    );
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'An unexpected error occurred while generating the blog post.');
    return {
      message: `Failed to generate blog post: ${errorMessage}`,
      errors: {},
      data: { blogPost: null, headerImage: null },
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
    return {
      success: false,
      error: error.message || 'Failed to upload file to S3'
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

    // TEMPORARY OVERRIDE: Grant admin access to your specific user ID
    if (userId === '24589458-5041-7041-a202-29ac2fd374b5') {
      return {
        isAdmin: true,
        role: 'super_admin',
        profileData: {
          id: userId,
          role: 'super_admin',
          email: 'ngorlong@gmail.com',
          adminSince: new Date().toISOString(),
          override: true,
        },
      };
    }

    const repository = getRepository();
    const profileKeys = getProfileKeys(userId);
    const result = await repository.get(profileKeys.PK, profileKeys.SK);
    const profileData = (result as any)?.Data;

    const role = profileData?.role || 'user';
    const isAdmin = role === 'admin' || role === 'super_admin';

    return {
      isAdmin,
      role,
      profileData,
    };
  } catch (error: any) {
    console.error('Error checking admin status:', error);
    return {
      isAdmin: false,
      error: error.message,
    };
  }
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
      existingProfile = (result as any)?.Data || {};
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
      const existingAgentProfile = (agentResult as any)?.Data || {};

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
    // Get current user from Cognito
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return {
        message: 'Authentication required',
        data: null,
        errors: { auth: ['You must be logged in to submit feedback'] },
      };
    }

    const { type, message } = validatedFields.data;
    const feedbackId = `feedback-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // Store feedback in DynamoDB
    const repository = getRepository();
    const feedbackKeys = {
      PK: `FEEDBACK#${feedbackId}`,
      SK: `USER#${user.id}`,
    };

    const feedbackData = {
      id: feedbackId,
      userId: user.id,
      userEmail: user.email,
      type,
      message,
      status: 'submitted',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repository.create(feedbackKeys.PK, feedbackKeys.SK, 'Feedback', feedbackData);

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
    const { newsService } = await import('@/services/news-service');
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');

    const user = await getCurrentUser();
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

    // Check if profile exists to preserve CreatedAt
    const existingProfile = await repository.get(keys.PK, keys.SK);

    // Always use put to replace the entire profile data
    // This ensures we don't have issues with partial updates
    const profileData = {
      PK: keys.PK,
      SK: keys.SK,
      EntityType: 'RealEstateAgentProfile' as const,
      Data: profile,
      CreatedAt: existingProfile?.CreatedAt || Date.now(),
      UpdatedAt: Date.now(),
    };

    await repository.put(profileData);

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser(userId);

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser(userId);

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser(userId);

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
 * Get past role-play sessions for a user
 */
export async function getRolePlaySessionsAction(): Promise<{
  message: string;
  data: any[] | null;
  errors?: string[];
}> {
  try {
    // Get current user from Cognito
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
      .map(item => item.Data)
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
  prevState: any,
  formData: FormData
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const name = formData.get('name') as string;

    if (!name?.trim()) {
      return {
        message: 'Project name is required',
        data: null,
        errors: ['Project name cannot be empty'],
      };
    }

    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to create a project'],
      };
    }

    const repository = getRepository();
    const projectId = Date.now().toString();
    const keys = getProjectKeys(user.id, projectId);

    await repository.put({
      ...keys,
      EntityType: 'Project',
      Data: {
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
  contentId: string,
  projectId: string | null
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to move content'],
      };
    }

    const repository = getRepository();
    const keys = getSavedContentKeys(user.id, contentId);
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
  contentId: string
): Promise<{
  message: string;
  data: any | null;
  errors?: string[];
}> {
  try {
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to delete content'],
      };
    }

    const repository = getRepository();
    const keys = getSavedContentKeys(user.id, contentId);
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

    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to rename content'],
      };
    }

    const repository = getRepository();
    const keys = getSavedContentKeys(user.id, contentId);
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
  projectId?: string | null
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
        errors: ['You must be logged in to save content'],
      };
    }

    const repository = getRepository();
    const contentId = Date.now().toString();
    const keys = getSavedContentKeys(userId, contentId);

    await repository.put({
      ...keys,
      EntityType: 'SavedContent',
      Data: {
        content,
        type,
        name: name || type,
        projectId: projectId || null,
        createdAt: new Date().toISOString(),
      },
      CreatedAt: Date.now(),
      UpdatedAt: Date.now()
    });

    return {
      message: 'Content saved successfully',
      data: { id: contentId, content, type, name },
    };
  } catch (error: any) {
    console.error('Save content error:', error);
    return {
      message: 'Failed to save content',
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
      const updatedProfileData = {
        PK: keys.PK,
        SK: keys.SK,
        EntityType: 'RealEstateAgentProfile' as const,
        Data: {
          ...existingProfile.Data,
          photoURL
        },
        CreatedAt: existingProfile.CreatedAt,
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
      EntityType: 'TrainingProgress',
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser(userId);

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
    contentResult.items.forEach((item) => {
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
    reportsResult.items.forEach((item) => {
      activities.push({
        id: item.SK,
        type: 'report',
        title: item.Data.topic || 'Research Report',
        timestamp: item.CreatedAt || Date.now(),
        data: item.Data,
      });
    });

    // Add marketing plans
    plansResult.items.forEach((item) => {
      activities.push({
        id: item.SK,
        type: 'plan',
        title: 'Marketing Plan Generated',
        timestamp: item.CreatedAt || Date.now(),
        data: item.Data,
      });
    });

    // Add image edits
    editsResult.items.forEach((item) => {
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    if (!validation.valid) {
      return {
        message: validation.error || 'Invalid target area',
        data: null,
        errors: { validation: [validation.error || 'Invalid target area'] },
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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

    // Create competitor object
    const competitor = competitorDataAccess.createCompetitor({
      name: validatedFields.data.name,
      agency: validatedFields.data.agency,
      licenseNumber: validatedFields.data.licenseNumber,
      targetAreas: validatedFields.data.targetAreas,
    });

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

    if (!user) {
      return {
        message: 'Authentication required',
        data: null,
        errors: ['You must be logged in to view competitors'],
      };
    }

    const { competitorDataAccess } = await import('@/lib/alerts/competitor-data-access');
    const competitors = await competitorDataAccess.getTrackedCompetitors(user.id);

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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

    // Update competitor
    const updates: Partial<Competitor> = {
      name: validatedFields.data.name,
      agency: validatedFields.data.agency,
      licenseNumber: validatedFields.data.licenseNumber,
      targetAreas: validatedFields.data.targetAreas,
      isActive,
    };

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
      offset: options?.offset,
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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
    const { getCurrentUser } = await import('@/aws/auth/cognito-client');
    const user = await getCurrentUser();

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
      offset: options?.offset,
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