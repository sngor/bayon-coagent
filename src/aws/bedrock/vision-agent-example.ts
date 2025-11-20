/**
 * Vision Agent Usage Examples
 * 
 * This file demonstrates how to use the Vision Agent for property image analysis.
 */

import { getVisionAgent } from './vision-agent';
import { getAgentProfileRepository } from '@/aws/dynamodb/agent-profile-repository';
import type { ImageFormat } from '@/ai/schemas/vision-analysis-schemas';

/**
 * Example 1: Analyze a property image with a specific question
 */
export async function analyzePropertyImage(
  userId: string,
  imageData: string,
  imageFormat: ImageFormat,
  question: string
) {
  // Get the agent profile
  const profileRepo = getAgentProfileRepository();
  const agentProfile = await profileRepo.getProfile(userId);

  if (!agentProfile) {
    throw new Error('Agent profile not found. Please create a profile first.');
  }

  // Get the vision agent
  const visionAgent = getVisionAgent();

  // Analyze the image
  const analysis = await visionAgent.analyzeWithProfile(
    imageData,
    imageFormat,
    question,
    agentProfile,
    undefined, // propertyType (optional)
    userId
  );

  return analysis;
}

/**
 * Example 2: Analyze a kitchen image for staging recommendations
 */
export async function analyzeKitchenForStaging(
  userId: string,
  kitchenImageBase64: string
) {
  const analysis = await analyzePropertyImage(
    userId,
    kitchenImageBase64,
    'jpeg',
    'What improvements would you recommend for staging this kitchen to appeal to buyers in my market?'
  );

  console.log('Visual Elements:', analysis.visualElements);
  console.log('Recommendations:', analysis.recommendations);
  console.log('Market Alignment:', analysis.marketAlignment);
  console.log('Overall Assessment:', analysis.overallAssessment);

  return analysis;
}

/**
 * Example 3: Analyze a living room for renovation advice
 */
export async function analyzeLivingRoomForRenovation(
  userId: string,
  livingRoomImageBase64: string
) {
  const analysis = await analyzePropertyImage(
    userId,
    livingRoomImageBase64,
    'png',
    'What cost-effective renovations would increase the value of this living room?'
  );

  // Filter high-priority, low-cost recommendations
  const quickWins = analysis.recommendations.filter(
    (rec) => rec.priority === 'high' && rec.estimatedCost === 'low'
  );

  console.log('Quick Win Recommendations:', quickWins);

  return { analysis, quickWins };
}

/**
 * Example 4: Analyze exterior for curb appeal
 */
export async function analyzeExteriorForCurbAppeal(
  userId: string,
  exteriorImageBase64: string,
  propertyType: string
) {
  const profileRepo = getAgentProfileRepository();
  const agentProfile = await profileRepo.getProfile(userId);

  if (!agentProfile) {
    throw new Error('Agent profile not found');
  }

  const visionAgent = getVisionAgent();

  const analysis = await visionAgent.analyzeWithProfile(
    exteriorImageBase64,
    'jpeg',
    'How can I improve the curb appeal of this property to attract more buyers?',
    agentProfile,
    propertyType, // e.g., 'single-family', 'condo'
    userId
  );

  // Group recommendations by cost
  const byEstimatedCost = {
    low: analysis.recommendations.filter((r) => r.estimatedCost === 'low'),
    medium: analysis.recommendations.filter((r) => r.estimatedCost === 'medium'),
    high: analysis.recommendations.filter((r) => r.estimatedCost === 'high'),
  };

  return { analysis, byEstimatedCost };
}

/**
 * Example 5: Compare before and after images (requires two separate calls)
 */
export async function compareBeforeAfter(
  userId: string,
  beforeImageBase64: string,
  afterImageBase64: string
) {
  const beforeAnalysis = await analyzePropertyImage(
    userId,
    beforeImageBase64,
    'jpeg',
    'What are the current strengths and weaknesses of this space?'
  );

  const afterAnalysis = await analyzePropertyImage(
    userId,
    afterImageBase64,
    'jpeg',
    'What improvements have been made to this space and what is their impact?'
  );

  return {
    before: beforeAnalysis,
    after: afterAnalysis,
    improvements: afterAnalysis.recommendations.filter(
      (rec) => rec.priority === 'high'
    ),
  };
}

/**
 * Example 6: Batch analyze multiple rooms
 */
export async function analyzeMultipleRooms(
  userId: string,
  rooms: Array<{
    name: string;
    imageBase64: string;
    imageFormat: ImageFormat;
  }>
) {
  const analyses = await Promise.all(
    rooms.map(async (room) => {
      const analysis = await analyzePropertyImage(
        userId,
        room.imageBase64,
        room.imageFormat,
        `What improvements would you recommend for this ${room.name}?`
      );

      return {
        roomName: room.name,
        analysis,
      };
    })
  );

  // Aggregate all recommendations
  const allRecommendations = analyses.flatMap((a) => 
    a.analysis.recommendations.map((rec) => ({
      room: a.roomName,
      ...rec,
    }))
  );

  // Sort by priority
  const sortedRecommendations = allRecommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return {
    analyses,
    allRecommendations: sortedRecommendations,
  };
}

/**
 * Helper function to convert a file to base64
 * (This would typically be done on the client side or in a file upload handler)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper function to validate image format
 */
export function validateImageFormat(format: string): format is ImageFormat {
  return ['jpeg', 'png', 'webp', 'gif'].includes(format.toLowerCase());
}
