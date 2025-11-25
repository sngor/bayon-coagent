import { z } from "zod";
import { VirtualStagingParamsSchema } from "./reimagine-schemas";

// ============================================================================
// Multi-Angle Staging Schemas
// ============================================================================

/**
 * Schema for furniture context extracted from a staged image
 * This context is used to maintain consistency across multiple angles
 */
export const FurnitureContextSchema = z.object({
    roomType: z.enum([
        "living-room",
        "bedroom",
        "kitchen",
        "dining-room",
        "office",
        "bathroom",
    ]),
    style: z.enum([
        "modern",
        "traditional",
        "minimalist",
        "luxury",
        "rustic",
        "contemporary",
    ]),
    furnitureItems: z.array(z.string()), // List of furniture items present
    colorPalette: z.array(z.string()), // Dominant colors
    description: z.string(), // Natural language description of the staging
});

export type FurnitureContext = z.infer<typeof FurnitureContextSchema>;

/**
 * Schema for multi-angle staging parameters
 */
export const MultiAngleStagingParamsSchema = z.object({
    roomType: z.enum([
        "living-room",
        "bedroom",
        "kitchen",
        "dining-room",
        "office",
        "bathroom",
    ]),
    style: z.enum([
        "modern",
        "traditional",
        "minimalist",
        "luxury",
        "rustic",
        "contemporary",
    ]),
    customPrompt: z.string().optional(),
    furnitureContext: FurnitureContextSchema.optional(), // Context from previous angle
    angleDescription: z.string().optional(), // Description of the current angle
});

export type MultiAngleStagingParams = z.infer<typeof MultiAngleStagingParamsSchema>;

/**
 * Schema for multi-angle staging session
 * Tracks all images in a multi-angle staging project
 */
export const MultiAngleStagingSessionSchema = z.object({
    PK: z.string(), // USER#<userId>
    SK: z.string(), // STAGING_SESSION#<sessionId>
    sessionId: z.string(),
    userId: z.string(),
    roomType: z.string(),
    style: z.string(),
    furnitureContext: FurnitureContextSchema.optional(),
    angles: z.array(z.object({
        angleId: z.string(),
        imageId: z.string(),
        editId: z.string().optional(), // Edit ID after staging
        originalUrl: z.string(),
        stagedUrl: z.string().optional(),
        angleDescription: z.string().optional(),
        order: z.number(), // Order in which angles were added
    })),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type MultiAngleStagingSession = z.infer<typeof MultiAngleStagingSessionSchema>;

/**
 * Response schema for creating a staging session
 */
export const CreateStagingSessionResponseSchema = z.object({
    success: z.boolean(),
    sessionId: z.string().optional(),
    error: z.string().optional(),
});

export type CreateStagingSessionResponse = z.infer<typeof CreateStagingSessionResponseSchema>;

/**
 * Response schema for adding an angle to a session
 */
export const AddAngleResponseSchema = z.object({
    success: z.boolean(),
    angleId: z.string().optional(),
    furnitureContext: FurnitureContextSchema.optional(), // Returned after first angle is staged
    error: z.string().optional(),
});

export type AddAngleResponse = z.infer<typeof AddAngleResponseSchema>;
