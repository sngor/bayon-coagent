'use server';

/**
 * Server Actions for Multi-Angle Room Staging
 * 
 * Handles multi-angle staging sessions where users can upload multiple
 * images of the same room and apply consistent furniture staging across
 * all angles.
 */

import { v4 as uuidv4 } from 'uuid';
import { getRepository } from '@/aws/dynamodb/repository';
import { getDocumentClient, getTableName } from '@/aws/dynamodb/client';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getPresignedUrl } from '@/aws/s3';
import {
    type FurnitureContext,
    type MultiAngleStagingParams,
    type CreateStagingSessionResponse,
    type AddAngleResponse,
} from '@/ai/schemas/multi-angle-staging-schemas';
import {
    type VirtualStagingParams,
} from '@/ai/schemas/reimagine-schemas';
import { processEditAction } from '@/features/intelligence/actions/reimagine-actions';
import { logError } from '@/aws/bedrock/reimagine-error-handler';

/**
 * Creates a new multi-angle staging session
 */
export async function createStagingSessionAction(
    userId: string,
    roomType: string,
    style: string
): Promise<CreateStagingSessionResponse> {
    try {
        console.log('[createStagingSession] Starting:', { userId, roomType, style });

        if (!userId) {
            console.error('[createStagingSession] Missing userId');
            return {
                success: false,
                error: 'User ID is required.',
            };
        }

        const sessionId = uuidv4();
        const timestamp = new Date().toISOString();

        console.log('[createStagingSession] Generated sessionId:', sessionId);

        const client = getDocumentClient();
        const tableName = getTableName();

        const sessionData = {
            PK: `USER#${userId}`,
            SK: `STAGING_SESSION#${sessionId}`,
            sessionId,
            userId,
            roomType,
            style,
            angles: [],
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        console.log('[createStagingSession] Creating session in DynamoDB:', sessionData);

        // Create session record in DynamoDB using document client directly
        await client.send(new PutCommand({
            TableName: tableName,
            Item: sessionData,
        }));

        console.log('[createStagingSession] Session created successfully');

        // Verify the session was created by reading it back
        const verifyResult = await client.send(new GetCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `STAGING_SESSION#${sessionId}`,
            },
        }));

        if (verifyResult.Item) {
            console.log('[createStagingSession] Session verified in DynamoDB:', verifyResult.Item);
        } else {
            console.error('[createStagingSession] WARNING: Session not found after creation!');
        }

        return {
            success: true,
            sessionId,
        };
    } catch (error) {
        console.error('[createStagingSession] Error:', error);
        logError(error, 'create-staging-session', { userId });
        return {
            success: false,
            error: 'Failed to create staging session.',
        };
    }
}

/**
 * Adds an angle to an existing staging session and processes it
 */
export async function addAngleToSessionAction(
    userId: string,
    sessionId: string,
    imageId: string,
    angleDescription?: string
): Promise<AddAngleResponse> {
    try {
        console.log('[addAngleToSession] Starting:', { userId, sessionId, imageId, angleDescription });

        if (!userId || !sessionId || !imageId) {
            console.error('[addAngleToSession] Missing parameters');
            return {
                success: false,
                error: 'Missing required parameters.',
            };
        }

        const client = getDocumentClient();
        const tableName = getTableName();
        const repository = getRepository();

        // Get session using document client directly
        console.log('[addAngleToSession] Fetching session...');
        const sessionResult = await client.send(new GetCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `STAGING_SESSION#${sessionId}`,
            },
        }));

        const session = sessionResult.Item;

        if (!session) {
            console.error('[addAngleToSession] Session not found');
            return {
                success: false,
                error: 'Staging session not found.',
            };
        }

        console.log('[addAngleToSession] Session found:', session);

        const angleId = uuidv4();
        const order = session.angles.length;

        console.log('[addAngleToSession] Angle order:', order);

        // Get image metadata for original URL
        console.log('[addAngleToSession] Fetching image metadata...');
        const imageMetadata = await repository.getImageMetadata(userId, imageId);
        if (!imageMetadata) {
            console.error('[addAngleToSession] Image metadata not found');
            return {
                success: false,
                error: 'Image not found.',
            };
        }

        console.log('[addAngleToSession] Image metadata found:', imageMetadata);

        const originalUrl = await getPresignedUrl(imageMetadata.originalKey, 3600);
        console.log('[addAngleToSession] Original URL generated');

        // Prepare staging parameters
        let stagingParams: VirtualStagingParams;
        let furnitureContext: FurnitureContext | undefined;

        if (order === 0) {
            // First angle - use basic parameters
            console.log('[addAngleToSession] First angle - using basic params');
            stagingParams = {
                roomType: session.roomType as any,
                style: session.style as any,
            };
        } else {
            // Subsequent angles - use furniture context from first angle
            if (!session.furnitureContext) {
                return {
                    success: false,
                    error: 'First angle must be staged before adding more angles.',
                };
            }

            // Build detailed custom prompt with furniture context
            const furnitureList = session.furnitureContext.furnitureItems
                .map((item: string, i: number) => `   ${i + 1}. ${item}`)
                .join('\n');

            const colorList = session.furnitureContext.colorPalette
                .map((color: string, i: number) => `   ${i + 1}. ${color}`)
                .join('\n');

            const contextPrompt = `MULTI-ANGLE STAGING - Angle #${order + 1}

IMPORTANT: This is a DIFFERENT CAMERA ANGLE of the same room. Stage THIS NEW ANGLE using the same furniture style and items, but adapted to THIS room's layout and perspective.

REFERENCE FURNITURE & STYLE (from first angle):
${session.furnitureContext.description}

FURNITURE ITEMS TO USE (same style and colors):
${furnitureList}

COLOR PALETTE TO MATCH:
${colorList}

CURRENT ANGLE: ${angleDescription || 'Different perspective of the same room'}

INSTRUCTIONS:

1. ANALYZE THIS NEW IMAGE:
   - Look at THIS room's actual layout, walls, windows, and architecture
   - Identify where furniture would naturally be placed in THIS space
   - Respect THIS room's dimensions and features

2. FURNITURE CONSISTENCY:
   - Use the same TYPE of furniture from the list (e.g., if list has "gray sectional sofa", add a gray sectional)
   - Match the COLORS and MATERIALS exactly (same gray tone, same materials)
   - Keep the same STYLE and AESTHETIC (modern, traditional, etc.)
   - Use similar furniture pieces but adapt placement to THIS room

3. SPATIAL ADAPTATION:
   - Place furniture logically for THIS room's layout
   - Adjust positioning based on THIS angle's perspective
   - Respect THIS room's architectural features (windows, doors, walls)
   - Make it look natural for THIS specific space

4. WHAT TO MATCH:
   ✓ Furniture types and styles
   ✓ Colors and materials
   ✓ Overall design aesthetic
   ✓ Quality and realism level

5. WHAT NOT TO COPY:
   ✗ DO NOT copy the exact furniture positions from the first angle
   ✗ DO NOT replicate the first image's room structure
   ✗ DO NOT ignore THIS room's actual layout
   ✗ DO NOT force furniture into unnatural positions

GOAL: Stage THIS room naturally with furniture that matches the style, colors, and aesthetic of the first angle, but positioned appropriately for THIS room's layout and camera angle.`;

            stagingParams = {
                roomType: session.roomType as any,
                style: session.style as any,
                customPrompt: contextPrompt,
            };
        }

        // Process the staging
        console.log('[addAngleToSession] Starting staging with params:', stagingParams);
        const editResult = await processEditAction(
            userId,
            imageId,
            'virtual-staging',
            stagingParams
        );

        console.log('[addAngleToSession] Staging result:', editResult);

        if (!editResult.success || !editResult.editId) {
            console.error('[addAngleToSession] Staging failed:', editResult.error);
            return {
                success: false,
                error: editResult.error || 'Failed to stage image.',
            };
        }

        // If this is the first angle, extract furniture context
        if (order === 0) {
            console.log('[addAngleToSession] Extracting furniture context...');
            furnitureContext = await extractFurnitureContext(
                userId,
                editResult.editId!,
                session.roomType,
                session.style
            );

            console.log('[addAngleToSession] Furniture context extracted:', furnitureContext);

            // Update session with furniture context
            session.furnitureContext = furnitureContext;
        }

        // Add angle to session
        console.log('[addAngleToSession] Adding angle to session...');
        session.angles.push({
            angleId,
            imageId,
            editId: editResult.editId,
            originalUrl,
            stagedUrl: editResult.resultUrl,
            angleDescription,
            order,
        });

        session.updatedAt = new Date().toISOString();

        // Update session in DynamoDB using document client directly
        console.log('[addAngleToSession] Updating session in DynamoDB...');
        await client.send(new PutCommand({
            TableName: tableName,
            Item: session,
        }));

        console.log('[addAngleToSession] Success! Angle added:', angleId);

        return {
            success: true,
            angleId,
            furnitureContext: order === 0 ? furnitureContext : undefined,
        };
    } catch (error) {
        console.error('[addAngleToSession] Error:', error);
        logError(error, 'add-angle-to-session', { userId, sessionId, imageId });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add angle to session.',
        };
    }
}

/**
 * Extracts furniture context from a staged image
 * This uses AI to analyze the staged result and extract details
 */
async function extractFurnitureContext(
    userId: string,
    editId: string,
    roomType: string,
    style: string
): Promise<FurnitureContext> {
    try {
        const repository = getRepository();
        const { getEditRecordKeys } = await import('@/aws/dynamodb/keys');

        const keys = getEditRecordKeys(userId, editId);
        const editRecord = await repository.get<any>(keys.PK, keys.SK);

        if (!editRecord) {
            throw new Error('Edit record not found');
        }

        // Download the staged image
        const { downloadFile } = await import('@/aws/s3');
        const stagedImageBuffer = await downloadFile(editRecord.resultKey);
        const base64Image = stagedImageBuffer.toString('base64');

        // Use AI to analyze the staged image and extract furniture context
        const { extractFurnitureContext: extractContext } = await import(
            '@/aws/google-ai/flows/gemini-furniture-context'
        );

        const context = await extractContext({
            imageData: base64Image,
            imageFormat: 'jpeg',
            roomType,
            style,
        });

        return context;
    } catch (error) {
        console.error('Error extracting furniture context:', error);

        // Return fallback context
        return {
            roomType: roomType as any,
            style: style as any,
            furnitureItems: ['sofa', 'coffee table', 'rug', 'lighting'],
            colorPalette: ['neutral', 'warm tones'],
            description: `${style} ${roomType} with coordinated furniture and decor`,
        };
    }
}

/**
 * Gets a staging session with all angles
 */
export async function getStagingSessionAction(
    userId: string,
    sessionId: string
): Promise<{
    success: boolean;
    session?: any;
    error?: string;
}> {
    try {
        if (!userId || !sessionId) {
            return {
                success: false,
                error: 'Missing required parameters.',
            };
        }

        const client = getDocumentClient();
        const tableName = getTableName();

        const result = await client.send(new GetCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `STAGING_SESSION#${sessionId}`,
            },
        }));

        const session = result.Item;

        if (!session) {
            return {
                success: false,
                error: 'Staging session not found.',
            };
        }

        // Refresh presigned URLs for all angles
        for (const angle of session.angles) {
            if (angle.stagedUrl) {
                // URLs are already presigned, just return them
                // In production, you might want to regenerate if expired
            }
        }

        return {
            success: true,
            session,
        };
    } catch (error) {
        logError(error, 'get-staging-session', { userId, sessionId });
        return {
            success: false,
            error: 'Failed to get staging session.',
        };
    }
}

/**
 * Lists all staging sessions for a user
 */
export async function listStagingSessionsAction(
    userId: string
): Promise<{
    success: boolean;
    sessions?: any[];
    error?: string;
}> {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'User ID is required.',
            };
        }

        const client = getDocumentClient();
        const tableName = getTableName();

        const result = await client.send(new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
            ExpressionAttributeValues: {
                ':pk': `USER#${userId}`,
                ':skPrefix': 'STAGING_SESSION#',
            },
        }));

        return {
            success: true,
            sessions: result.Items || [],
        };
    } catch (error) {
        logError(error, 'list-staging-sessions', { userId });
        return {
            success: false,
            error: 'Failed to list staging sessions.',
        };
    }
}

/**
 * Deletes a staging session
 */
export async function deleteStagingSessionAction(
    userId: string,
    sessionId: string
): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        if (!userId || !sessionId) {
            return {
                success: false,
                error: 'Missing required parameters.',
            };
        }

        const client = getDocumentClient();
        const tableName = getTableName();

        await client.send(new DeleteCommand({
            TableName: tableName,
            Key: {
                PK: `USER#${userId}`,
                SK: `STAGING_SESSION#${sessionId}`,
            },
        }));

        return {
            success: true,
        };
    } catch (error) {
        logError(error, 'delete-staging-session', { userId, sessionId });
        return {
            success: false,
            error: 'Failed to delete staging session.',
        };
    }
}
