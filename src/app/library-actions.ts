'use server';

import { z } from 'zod';
import { getRepository } from '@/aws/dynamodb/repository';
import { getCurrentUser } from '@/aws/auth/cognito-client';
// Remove unused import

// Schema for saving content to library
const SaveContentSchema = z.object({
    type: z.enum(['blog-post', 'social-media', 'video-script', 'market-update', 'neighborhood-guide', 'website-content', 'listing-description', 'post-card', 'open-house-flyer', 'email-invite']),
    content: z.string().min(1, 'Content cannot be empty'),
    name: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    projectId: z.string().optional(),
});

export type SaveContentInput = z.infer<typeof SaveContentSchema>;

export interface SavedContentItem {
    id: string;
    name: string;
    type: SaveContentInput['type'];
    content: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
    projectId?: string;
    metadata?: Record<string, any>;
}

export interface SaveContentResult {
    success: boolean;
    data?: {
        id: string;
        name: string;
        type: string;
    };
    error?: string;
}

/**
 * Save generated content to the user's library
 */
export async function saveContentToLibraryAction(input: SaveContentInput): Promise<SaveContentResult> {
    try {
        // Validate input
        const validatedInput = SaveContentSchema.parse(input);

        // Get current user
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        const repository = getRepository();

        // Generate a name if not provided
        const contentName = validatedInput.name || generateContentName(validatedInput.type, validatedInput.content);

        // Create the content item
        const contentItem = {
            id: `content_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            userId: user.id,
            type: validatedInput.type,
            name: contentName,
            content: validatedInput.content,
            metadata: validatedInput.metadata || {},
            projectId: validatedInput.projectId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Save to DynamoDB
        await repository.put({
            PK: `USER#${user.id}`,
            SK: `CONTENT#${contentItem.id}`,
            EntityType: 'SavedContent',
            Data: contentItem,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
            GSI1PK: `USER#${user.id}`,
            GSI1SK: `CONTENT#${contentItem.createdAt}`,
        });

        return {
            success: true,
            data: {
                id: contentItem.id,
                name: contentItem.name,
                type: contentItem.type,
            }
        };
    } catch (error) {
        console.error('Error saving content to library:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
            };
        }

        return {
            success: false,
            error: 'Failed to save content to library'
        };
    }
}

/**
 * Generate a descriptive name for content based on type and content
 */
function generateContentName(type: string, content: string): string {
    const typeNames = {
        'blog-post': 'Blog Post',
        'social-media': 'Social Media Post',
        'video-script': 'Video Script',
        'market-update': 'Market Update',
        'neighborhood-guide': 'Neighborhood Guide',
        'website-content': 'Website Content',
        'listing-description': 'Listing Description',
        'post-card': 'Post Card',
        'open-house-flyer': 'Open House Flyer',
        'email-invite': 'Email Invitation',
    };

    const typeName = typeNames[type as keyof typeof typeNames] || 'Content';

    // Extract first few words from content for the name
    const words = content.trim().split(/\s+/).slice(0, 6);
    const preview = words.join(' ');
    const truncated = preview.length > 50 ? preview.substring(0, 47) + '...' : preview;

    const timestamp = new Date().toLocaleDateString();

    return `${typeName} - ${truncated} (${timestamp})`;
}

/**
 * Get user's projects for organizing content
 */
export async function getUserProjectsAction() {
    try {
        const user = await getCurrentUser();
        if (!user?.id) {
            return {
                success: false,
                error: 'Authentication required',
                data: []
            };
        }

        const repository = getRepository();

        const result = await repository.queryItems(
            `USER#${user.id}`,
            'PROJECT#'
        );

        const projects = result.items?.map((item: any) => ({
            id: item.Data.id,
            name: item.Data.name,
            createdAt: item.Data.createdAt,
        })) || [];

        return {
            success: true,
            data: projects
        };
    } catch (error) {
        console.error('Error fetching user projects:', error);
        return {
            success: false,
            error: 'Failed to fetch projects',
            data: []
        };
    }
}