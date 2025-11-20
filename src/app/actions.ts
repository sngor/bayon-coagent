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
  getUserProfileKeys,
  getMarketingPlanKeys,
  getReviewAnalysisKeys,
  getProjectKeys,
  getSavedContentKeys,
  getResearchReportKeys,
  getCompetitorKeys,
  getTrainingProgressKeys,
} from '@/aws/dynamodb/keys';
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

    // Update the agent-specific profile document
    const agentKeys = getAgentProfileKeys(userId, 'main');
    await repository.update(agentKeys.PK, agentKeys.SK, { photoURL });

    // Also update the root user profile document
    const userKeys = getUserProfileKeys(userId);
    await repository.update(userKeys.PK, userKeys.SK, { photoURL });

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
    const result = await getRealEstateNews({ location: validatedFields.data.location });
    return {
      message: 'success',
      data: result,
      errors: {},
    };
  } catch (error: any) {
    return {
      message: error.message || 'An unexpected error occurred while fetching news.',
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
    email: z.string().optional(),
    phone: z.string().optional(),
    photoURL: z.string().optional(),
    brokerageName: z.string().optional(),
    licenseNumber: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    serviceAreas: z.array(z.string()).optional(),
    yearsOfExperience: z.number().optional(),
    certifications: z.array(z.string()).optional(),
    bio: z.string().optional(),
    websiteURL: z.string().optional(),
    facebookURL: z.string().optional(),
    instagramURL: z.string().optional(),
    linkedinURL: z.string().optional(),
    twitterURL: z.string().optional(),
    youtubeURL: z.string().optional(),
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
    const keys = getAgentProfileKeys(userId, 'main');

    // Check if profile exists
    const existingProfile = await repository.get(keys.PK, keys.SK);

    if (existingProfile) {
      await repository.update(keys.PK, keys.SK, profile);
    } else {
      await repository.put({
        ...keys,
        EntityType: 'RealEstateAgentProfile',
        Data: profile,
        CreatedAt: Date.now(),
        UpdatedAt: Date.now(),
      });
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
 * Save training plan to knowledge base
 */
export async function saveTrainingPlanAction(
  challenge: string,
  plan: string
): Promise<{
  message: string;
  data: { id: string } | null;
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
    const sessions = await repository.query({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.id}`,
        ':sk': 'ROLEPLAY#',
      },
    });

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
    const keys = getAgentProfileKeys(userId, 'main');
    await repository.update(keys.PK, keys.SK, { photoURL });

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
