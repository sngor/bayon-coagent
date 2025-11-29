'use server';

/**
 * Agent Profile Management Server Actions
 * 
 * Server actions for managing agent profiles in the Kiro AI Assistant.
 * Handles CRUD operations with validation and authentication.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { z } from 'zod';
import { getCognitoClient } from '@/aws/auth/cognito-client';
import {
  getAgentProfileRepository,
  type AgentProfile,
  type CreateAgentProfileInput,
  type UpdateAgentProfileInput,
} from '@/aws/dynamodb/agent-profile-repository';

/**
 * Agent profile input schema for validation
 * Requirement 8.4: Validate required fields and formats
 */
const agentProfileSchema = z.object({
  agentName: z
    .string()
    .min(1, 'Agent name is required')
    .max(100, 'Agent name must be 100 characters or less')
    .trim(),
  primaryMarket: z
    .string()
    .min(1, 'Primary market is required')
    .max(200, 'Primary market must be 200 characters or less')
    .trim(),
  specialization: z.enum(
    ['luxury', 'first-time-buyers', 'investment', 'commercial', 'general'],
    {
      errorMap: () => ({
        message: 'Specialization must be one of: luxury, first-time-buyers, investment, commercial, general',
      }),
    }
  ),
  preferredTone: z.enum(
    ['warm-consultative', 'direct-data-driven', 'professional', 'casual'],
    {
      errorMap: () => ({
        message: 'Preferred tone must be one of: warm-consultative, direct-data-driven, professional, casual',
      }),
    }
  ),
  agentType: z.enum(
    ['buyer', 'seller', 'hybrid'],
    {
      errorMap: () => ({
        message: 'Agent type must be one of: buyer, seller, hybrid',
      }),
    }
  ),
  corePrinciple: z
    .string()
    .min(10, 'Core principle must be at least 10 characters')
    .max(500, 'Core principle must be 500 characters or less')
    .trim(),
});

/**
 * Partial agent profile schema for updates
 */
const updateAgentProfileSchema = agentProfileSchema.partial();

/**
 * Response type for profile operations
 */
export interface ProfileActionResponse {
  success: boolean;
  message?: string;
  data?: AgentProfile;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Gets the current authenticated user
 * @returns User object or null if not authenticated
 */
async function getCurrentUser() {
  try {
    const cognitoClient = getCognitoClient();
    const session = await cognitoClient.getSession();

    if (!session) {
      return null;
    }

    return await cognitoClient.getCurrentUser(session.accessToken);
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Creates a new agent profile
 * 
 * Requirements:
 * - 8.1: Store agent name, primary market, specialization, preferred tone, and core principle
 * - 8.4: Validate that all required fields are present
 * 
 * @param prevState Previous state (for form actions)
 * @param formData Form data containing profile fields
 * @returns Profile action response
 */
export async function createAgentProfile(
  prevState: any,
  formData: FormData
): Promise<ProfileActionResponse> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required. Please sign in to create a profile.',
      };
    }

    // Validate input (Requirement 8.4)
    const validatedFields = agentProfileSchema.safeParse({
      agentName: formData.get('agentName'),
      primaryMarket: formData.get('primaryMarket'),
      specialization: formData.get('specialization'),
      preferredTone: formData.get('preferredTone'),
      agentType: formData.get('agentType'),
      corePrinciple: formData.get('corePrinciple'),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Create profile (Requirement 8.1)
    const profileRepository = getAgentProfileRepository();
    const profile = await profileRepository.createProfile(
      user.id,
      validatedFields.data as CreateAgentProfileInput
    );

    return {
      success: true,
      message: 'Agent profile created successfully',
      data: profile,
    };
  } catch (error) {
    console.error('Create agent profile error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return {
          success: false,
          error: 'You already have an agent profile. Please update your existing profile instead.',
        };
      }

      if (error.message.includes('Validation failed')) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'An unexpected error occurred while creating the profile.',
    };
  }
}

/**
 * Updates an existing agent profile
 * 
 * Requirements:
 * - 8.2: Persist changes and apply them to subsequent interactions
 * - 8.4: Validate field formats
 * 
 * @param prevState Previous state (for form actions)
 * @param formData Form data containing profile fields to update
 * @returns Profile action response
 */
export async function updateAgentProfile(
  prevState: any,
  formData: FormData
): Promise<ProfileActionResponse> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required. Please sign in to update your profile.',
      };
    }

    // Build update object from form data
    const updates: Record<string, any> = {};
    const fields = ['agentName', 'primaryMarket', 'specialization', 'preferredTone', 'agentType', 'corePrinciple'];

    for (const field of fields) {
      const value = formData.get(field);
      if (value !== null && value !== undefined && value !== '') {
        updates[field] = value;
      }
    }

    // If no fields to update, return early
    if (Object.keys(updates).length === 0) {
      return {
        success: false,
        error: 'No fields provided for update',
      };
    }

    // Validate input (Requirement 8.4)
    const validatedFields = updateAgentProfileSchema.safeParse(updates);

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // Update profile (Requirement 8.2)
    const profileRepository = getAgentProfileRepository();
    await profileRepository.updateProfile(
      user.id,
      validatedFields.data as UpdateAgentProfileInput
    );

    // Fetch updated profile to return
    const updatedProfile = await profileRepository.getProfile(user.id);

    return {
      success: true,
      message: 'Agent profile updated successfully',
      data: updatedProfile || undefined,
    };
  } catch (error) {
    console.error('Update agent profile error:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return {
          success: false,
          error: 'Agent profile not found. Please create a profile first.',
        };
      }

      if (error.message.includes('Validation failed')) {
        return {
          success: false,
          error: error.message,
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'An unexpected error occurred while updating the profile.',
    };
  }
}

/**
 * Gets the current user's agent profile
 * 
 * Requirements:
 * - 8.3: Return all stored profile fields accurately
 * - 8.5: Retrieve data within 500 milliseconds
 * 
 * @returns Profile action response
 */
export async function getAgentProfile(): Promise<ProfileActionResponse> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required. Please sign in to view your profile.',
      };
    }

    // Get profile (Requirements 8.3, 8.5)
    const profileRepository = getAgentProfileRepository();
    const profile = await profileRepository.getProfile(user.id);

    if (!profile) {
      return {
        success: false,
        error: 'Agent profile not found. Please create a profile first.',
      };
    }

    return {
      success: true,
      message: 'Agent profile retrieved successfully',
      data: profile,
    };
  } catch (error) {
    console.error('Get agent profile error:', error);

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'An unexpected error occurred while retrieving the profile.',
    };
  }
}

/**
 * Deletes the current user's agent profile
 * 
 * Requirement 8.1: Support profile deletion
 * 
 * @returns Profile action response
 */
export async function deleteAgentProfile(): Promise<ProfileActionResponse> {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'Authentication required. Please sign in to delete your profile.',
      };
    }

    // Delete profile
    const profileRepository = getAgentProfileRepository();
    await profileRepository.deleteProfile(user.id);

    return {
      success: true,
      message: 'Agent profile deleted successfully',
    };
  } catch (error) {
    console.error('Delete agent profile error:', error);

    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : 'An unexpected error occurred while deleting the profile.',
    };
  }
}

/**
 * Gets the current user's agent profile by user ID
 * This is a convenience function for use in other server actions
 * 
 * @param userId User ID
 * @returns Agent profile or null
 */
export async function getAgentProfileByUserId(
  userId: string
): Promise<AgentProfile | null> {
  try {
    const profileRepository = getAgentProfileRepository();
    return await profileRepository.getProfile(userId);
  } catch (error) {
    console.error('Get agent profile by user ID error:', error);
    return null;
  }
}

/**
 * Checks if the current user has an agent profile
 * 
 * @returns Boolean indicating if profile exists
 */
export async function hasAgentProfile(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }

    const profileRepository = getAgentProfileRepository();
    const profile = await profileRepository.getProfile(user.id);

    return profile !== null;
  } catch (error) {
    console.error('Has agent profile error:', error);
    return false;
  }
}
