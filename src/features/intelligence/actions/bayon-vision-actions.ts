'use server';

/**
 * Bayon AI Assistant Vision Server Actions
 * 
 * Server actions for the Bayon AI Assistant vision interface.
 * Handles vision analysis queries, image upload, and streaming responses.
 * 
 * Requirements: 6.1, 6.3
 */

import { z } from 'zod';
import { getCognitoClient } from '@/aws/auth/cognito-client';
import { getAgentProfileRepository } from '@/aws/dynamodb/agent-profile-repository';
import { getVisionAgent } from '@/aws/bedrock/vision-agent';
import { getRepository } from '@/aws/dynamodb/repository';
import { v4 as uuidv4 } from 'uuid';
import type { ImageFormat } from '@/ai/schemas/vision-analysis-schemas';

/**
 * Vision query input schema
 */
const visionQuerySchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  imageFormat: z.enum(['jpeg', 'png', 'webp', 'gif']),
  question: z.string().min(1, 'Question cannot be empty').max(1000, 'Question is too long'),
  propertyType: z.string().optional(),
  analysisId: z.string().optional(),
});

/**
 * Vision query response
 */
export interface VisionQueryResponse {
  success: boolean;
  message?: string;
  data?: {
    analysisId: string;
    visualElements: {
      materials: string[];
      colors: string[];
      lighting: 'natural' | 'artificial' | 'mixed';
      size: 'small' | 'medium' | 'large';
      layout: string;
      notableFeatures?: string[];
    };
    recommendations: Array<{
      action: string;
      rationale: string;
      estimatedCost: 'low' | 'medium' | 'high';
      priority: 'high' | 'medium' | 'low';
      expectedImpact?: string;
    }>;
    marketAlignment: string;
    overallAssessment: string;
    answer: string;
    executionTime: number;
  };
  error?: string;
}

/**
 * Handles a vision analysis query from the user
 * 
 * Requirements:
 * - 6.1: Create entry point for vision analysis
 * - 6.1: Add image upload and encoding
 * - 6.1: Integrate vision agent
 * 
 * @param formData Form data containing the image and question
 * @returns Vision query response
 */
export async function handleVisionQuery(
  prevState: any,
  formData: FormData
): Promise<VisionQueryResponse> {
  const startTime = Date.now();

  try {
    // Validate input
    const validatedFields = visionQuerySchema.safeParse({
      imageData: formData.get('imageData'),
      imageFormat: formData.get('imageFormat'),
      question: formData.get('question'),
      propertyType: formData.get('propertyType'),
      analysisId: formData.get('analysisId'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: validatedFields.error.errors[0]?.message || 'Invalid input',
      };
    }

    const { imageData, imageFormat, question, propertyType, analysisId } = validatedFields.data;

    // Get current user (authentication)
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required. Please sign in to use the vision assistant.',
      };
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);

    // Load agent profile for personalization
    const profileRepository = getAgentProfileRepository();
    const agentProfile = await profileRepository.getProfile(user.id);

    if (!agentProfile) {
      return {
        success: false,
        error: 'Agent profile not found. Please set up your profile first.',
      };
    }

    // Execute vision analysis
    const visionAgent = getVisionAgent();
    const analysisResult = await visionAgent.analyzeWithProfile(
      imageData,
      imageFormat as ImageFormat,
      question,
      agentProfile,
      propertyType,
      user.id
    );

    // Save vision analysis to DynamoDB
    const analysisIdToUse = analysisId || uuidv4();
    await saveVisionAnalysis(
      user.id,
      analysisIdToUse,
      imageData,
      imageFormat,
      question,
      propertyType,
      analysisResult
    );

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      message: 'Vision analysis completed successfully',
      data: {
        analysisId: analysisIdToUse,
        visualElements: analysisResult.visualElements,
        recommendations: analysisResult.recommendations,
        marketAlignment: analysisResult.marketAlignment,
        overallAssessment: analysisResult.overallAssessment,
        answer: analysisResult.answer,
        executionTime,
      },
    };
  } catch (error) {
    console.error('Vision query error:', error);
    
    return {
      success: false,
      error: error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while analyzing the image.',
    };
  }
}

/**
 * Saves a vision analysis to DynamoDB
 * @param userId User ID
 * @param analysisId Analysis ID
 * @param imageData Base64 encoded image data
 * @param imageFormat Image format
 * @param question User's question
 * @param propertyType Optional property type
 * @param analysisResult Vision analysis result
 */
async function saveVisionAnalysis(
  userId: string,
  analysisId: string,
  imageData: string,
  imageFormat: string,
  question: string,
  propertyType: string | undefined,
  analysisResult: any
): Promise<void> {
  const repository = getRepository();
  const now = new Date().toISOString();

  // Create vision analysis record
  await repository.create(
    `USER#${userId}`,
    `VISION#${analysisId}`,
    'VisionAnalysis',
    {
      analysisId,
      imageFormat,
      // Store a thumbnail or reference, not full image data
      imageReference: `vision/${userId}/${analysisId}`,
      question,
      propertyType,
      visualElements: analysisResult.visualElements,
      recommendations: analysisResult.recommendations,
      marketAlignment: analysisResult.marketAlignment,
      overallAssessment: analysisResult.overallAssessment,
      answer: analysisResult.answer,
      createdAt: now,
      updatedAt: now,
    }
  );
}

/**
 * Retrieves a vision analysis by ID
 * @param userId User ID
 * @param analysisId Analysis ID
 * @returns Vision analysis data or null
 */
export async function getVisionAnalysis(
  userId: string,
  analysisId: string
): Promise<{
  analysisId: string;
  imageFormat: string;
  imageReference: string;
  question: string;
  propertyType?: string;
  visualElements: any;
  recommendations: any[];
  marketAlignment: string;
  overallAssessment: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
} | null> {
  try {
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return null;
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);
    if (!user || user.id !== userId) {
      return null;
    }

    const repository = getRepository();
    const analysis = await repository.get(`USER#${userId}`, `VISION#${analysisId}`);

    if (!analysis) {
      return null;
    }

    return analysis as any;
  } catch (error) {
    console.error('Get vision analysis error:', error);
    return null;
  }
}

/**
 * Lists all vision analyses for a user
 * @param userId User ID
 * @returns Array of vision analysis summaries
 */
export async function listVisionAnalyses(
  userId: string
): Promise<Array<{
  analysisId: string;
  question: string;
  propertyType?: string;
  imageFormat: string;
  createdAt: string;
  updatedAt: string;
}>> {
  try {
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return [];
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);
    if (!user || user.id !== userId) {
      return [];
    }

    const repository = getRepository();
    const result = await repository.query(`USER#${userId}`, 'VISION#');

    return result.items
      .map((data: any) => ({
        analysisId: data?.analysisId || '',
        question: data?.question || '',
        propertyType: data?.propertyType,
        imageFormat: data?.imageFormat || '',
        createdAt: data?.createdAt || '',
        updatedAt: data?.updatedAt || '',
      }))
      .sort((a: any, b: any) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  } catch (error) {
    console.error('List vision analyses error:', error);
    return [];
  }
}

/**
 * Deletes a vision analysis
 * @param userId User ID
 * @param analysisId Analysis ID
 * @returns Success status
 */
export async function deleteVisionAnalysis(
  userId: string,
  analysisId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();
    
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = await cognitoClient.getCurrentUser(session.accessToken);
    if (!user || user.id !== userId) {
      return { success: false, error: 'Unauthorized' };
    }

    const repository = getRepository();
    await repository.delete(`USER#${userId}`, `VISION#${analysisId}`);

    return { success: true };
  } catch (error) {
    console.error('Delete vision analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete vision analysis',
    };
  }
}

/**
 * Streaming vision query handler
 * 
 * Requirement 6.3: Streaming support for real-time vision responses
 * 
 * @param imageData Base64 encoded image data
 * @param imageFormat Image format
 * @param question User's question
 * @param propertyType Optional property type
 * @param analysisId Optional analysis ID
 * @returns Readable stream of response chunks
 */
export async function handleVisionQueryStream(
  imageData: string,
  imageFormat: string,
  question: string,
  propertyType?: string,
  analysisId?: string
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Validate input
        const validatedFields = visionQuerySchema.safeParse({
          imageData,
          imageFormat,
          question,
          propertyType,
          analysisId,
        });

        if (!validatedFields.success) {
          const errorMessage = JSON.stringify({
            type: 'error',
            error: validatedFields.error.errors[0]?.message || 'Invalid input',
          }) + '\n';
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
          return;
        }

        // Get current user
        const cognitoClient = getCognitoClient();
        const session = await cognitoClient.getSession();
        
        if (!session) {
          const errorMessage = JSON.stringify({
            type: 'error',
            error: 'Authentication required. Please sign in to use the vision assistant.',
          }) + '\n';
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
          return;
        }

        const user = await cognitoClient.getCurrentUser(session.accessToken);

        // Send progress: Loading profile
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Loading your agent profile...',
          step: 1,
          totalSteps: 4,
        }) + '\n'));

        // Load agent profile
        const profileRepository = getAgentProfileRepository();
        const agentProfile = await profileRepository.getProfile(user.id);

        if (!agentProfile) {
          const errorMessage = JSON.stringify({
            type: 'error',
            error: 'Agent profile not found. Please set up your profile first.',
          }) + '\n';
          controller.enqueue(encoder.encode(errorMessage));
          controller.close();
          return;
        }

        // Send progress: Analyzing image
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Analyzing property image...',
          step: 2,
          totalSteps: 4,
        }) + '\n'));

        // Execute vision analysis
        const visionAgent = getVisionAgent();
        const analysisResult = await visionAgent.analyzeWithProfile(
          imageData,
          imageFormat as ImageFormat,
          question,
          agentProfile,
          propertyType,
          user.id
        );

        // Send progress: Processing recommendations
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Generating recommendations...',
          step: 3,
          totalSteps: 4,
        }) + '\n'));

        // Stream visual elements
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'visual_elements',
          data: analysisResult.visualElements,
        }) + '\n'));

        // Stream recommendations one by one for progressive delivery
        for (const recommendation of analysisResult.recommendations) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'recommendation',
            data: recommendation,
          }) + '\n'));
          
          // Small delay for progressive feel
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Stream market alignment
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'market_alignment',
          data: analysisResult.marketAlignment,
        }) + '\n'));

        // Stream overall assessment
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'overall_assessment',
          data: analysisResult.overallAssessment,
        }) + '\n'));

        // Stream answer
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'answer',
          data: analysisResult.answer,
        }) + '\n'));

        // Send progress: Finalizing
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'progress',
          message: 'Finalizing analysis...',
          step: 4,
          totalSteps: 4,
        }) + '\n'));

        // Save vision analysis
        const analysisIdToUse = analysisId || uuidv4();
        await saveVisionAnalysis(
          user.id,
          analysisIdToUse,
          imageData,
          imageFormat,
          question,
          propertyType,
          analysisResult
        );

        // Send completion
        controller.enqueue(encoder.encode(JSON.stringify({
          type: 'complete',
          data: {
            analysisId: analysisIdToUse,
          },
        }) + '\n'));

        controller.close();
      } catch (error) {
        console.error('Streaming vision query error:', error);
        
        const errorMessage = JSON.stringify({
          type: 'error',
          error: error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred while analyzing the image.',
        }) + '\n';
        controller.enqueue(encoder.encode(errorMessage));
        controller.close();
      }
    },
  });
}

/**
 * Server action wrapper for streaming vision query
 * This is the actual server action that can be called from the client
 */
export async function streamVisionQuery(
  imageData: string,
  imageFormat: string,
  question: string,
  propertyType?: string,
  analysisId?: string
): Promise<Response> {
  try {
    const stream = await handleVisionQueryStream(
      imageData,
      imageFormat,
      question,
      propertyType,
      analysisId
    );
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream vision query error:', error);
    
    return new Response(
      JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Failed to start stream',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
