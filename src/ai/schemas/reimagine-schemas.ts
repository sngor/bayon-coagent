import { z } from "zod";

// ============================================================================
// Edit Type Union
// ============================================================================

export const EditTypeSchema = z.enum([
  "virtual-staging",
  "day-to-dusk",
  "enhance",
  "item-removal",
  "virtual-renovation",
]);

export type EditType = z.infer<typeof EditTypeSchema>;

// ============================================================================
// Edit Parameters Schemas
// ============================================================================

export const VirtualStagingParamsSchema = z.object({
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
});

export type VirtualStagingParams = z.infer<typeof VirtualStagingParamsSchema>;

export const DayToDuskParamsSchema = z.object({
  intensity: z.enum(["subtle", "moderate", "dramatic"]),
  direction: z.literal("day-to-dusk").optional().default("day-to-dusk"),
});

export type DayToDuskParams = z.infer<typeof DayToDuskParamsSchema>;

export const EnhanceParamsSchema = z.object({
  autoAdjust: z.boolean(),
  brightness: z.number().min(-100).max(100).optional(),
  contrast: z.number().min(-100).max(100).optional(),
  saturation: z.number().min(-100).max(100).optional(),
});

export type EnhanceParams = z.infer<typeof EnhanceParamsSchema>;

export const ItemRemovalParamsSchema = z.object({
  maskData: z.string(), // Base64 encoded mask image
  objects: z.array(z.string()), // Description of objects to remove
});

export type ItemRemovalParams = z.infer<typeof ItemRemovalParamsSchema>;

export const VirtualRenovationParamsSchema = z.object({
  description: z.string().min(10).max(1000), // Natural language description
  style: z.string().optional(), // Optional style guidance
});

export type VirtualRenovationParams = z.infer<
  typeof VirtualRenovationParamsSchema
>;

// Union type for all edit parameters
export const EditParamsSchema = z.union([
  VirtualStagingParamsSchema,
  DayToDuskParamsSchema,
  EnhanceParamsSchema,
  ItemRemovalParamsSchema,
  VirtualRenovationParamsSchema,
]);

export type EditParams = z.infer<typeof EditParamsSchema>;

// ============================================================================
// Edit Suggestion Schema
// ============================================================================

export const EditSuggestionSchema = z.object({
  editType: EditTypeSchema,
  priority: z.enum(["high", "medium", "low"]),
  reason: z.string(),
  suggestedParams: z
    .union([
      VirtualStagingParamsSchema.partial(),
      DayToDuskParamsSchema.partial(),
      EnhanceParamsSchema.partial(),
      ItemRemovalParamsSchema.partial(),
      VirtualRenovationParamsSchema.partial(),
    ])
    .optional(),
  confidence: z.number().min(0).max(1),
});

export type EditSuggestion = z.infer<typeof EditSuggestionSchema>;

// ============================================================================
// Image Metadata Schema
// ============================================================================

export const ImageMetadataSchema = z.object({
  PK: z.string(), // USER#<userId>
  SK: z.string(), // IMAGE#<imageId>
  imageId: z.string(),
  userId: z.string(),
  originalKey: z.string(), // S3 key for original image
  fileName: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
  width: z.number(),
  height: z.number(),
  uploadedAt: z.string(), // ISO timestamp
  suggestions: z.array(EditSuggestionSchema).optional(),
});

export type ImageMetadata = z.infer<typeof ImageMetadataSchema>;

// ============================================================================
// Edit Record Schema
// ============================================================================

export const EditStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "preview",
]);

export type EditStatus = z.infer<typeof EditStatusSchema>;

export const EditRecordSchema = z.object({
  PK: z.string(), // USER#<userId>
  SK: z.string(), // EDIT#<editId>
  editId: z.string(),
  userId: z.string(),
  imageId: z.string(),
  editType: EditTypeSchema,
  params: EditParamsSchema,
  sourceKey: z.string(), // S3 key for source image
  resultKey: z.string(), // S3 key for result image
  status: EditStatusSchema,
  createdAt: z.string(), // ISO timestamp
  completedAt: z.string().optional(), // ISO timestamp
  error: z.string().optional(),
  modelId: z.string().optional(), // Bedrock model used
  processingTime: z.number().optional(), // milliseconds
  parentEditId: z.string().optional(), // For chained edits
});

export type EditRecord = z.infer<typeof EditRecordSchema>;

// ============================================================================
// Edit History Item Schema (for display)
// ============================================================================

export const EditHistoryItemSchema = z.object({
  editId: z.string(),
  imageId: z.string(),
  editType: EditTypeSchema,
  originalUrl: z.string(), // Presigned URL
  resultUrl: z.string(), // Presigned URL
  createdAt: z.string(),
  status: z.string(),
  parentEditId: z.string().optional(),
  name: z.string().optional(), // Custom name for the edit
});

export type EditHistoryItem = z.infer<typeof EditHistoryItemSchema>;

// ============================================================================
// Processing Status Schema (for UI)
// ============================================================================

export const ProcessingStatusSchema = z.enum([
  "idle",
  "uploading",
  "analyzing",
  "processing",
  "completed",
  "failed",
]);

export type ProcessingStatus = z.infer<typeof ProcessingStatusSchema>;

// ============================================================================
// Upload Response Schema
// ============================================================================

export const UploadResponseSchema = z.object({
  success: z.boolean(),
  imageId: z.string().optional(),
  suggestions: z.array(EditSuggestionSchema).optional(),
  error: z.string().optional(),
});

export type UploadResponse = z.infer<typeof UploadResponseSchema>;

// ============================================================================
// Process Edit Response Schema
// ============================================================================

export const ProcessEditResponseSchema = z.object({
  success: z.boolean(),
  editId: z.string().optional(),
  resultUrl: z.string().optional(),
  error: z.string().optional(),
});

export type ProcessEditResponse = z.infer<typeof ProcessEditResponseSchema>;

// ============================================================================
// Edit History Response Schema
// ============================================================================

export const EditHistoryResponseSchema = z.object({
  success: z.boolean(),
  edits: z.array(EditHistoryItemSchema).optional(),
  error: z.string().optional(),
});

export type EditHistoryResponse = z.infer<typeof EditHistoryResponseSchema>;

// ============================================================================
// Delete Edit Response Schema
// ============================================================================

export const DeleteEditResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type DeleteEditResponse = z.infer<typeof DeleteEditResponseSchema>;

// ============================================================================
// Accept Edit Response Schema
// ============================================================================

export const AcceptEditResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});

export type AcceptEditResponse = z.infer<typeof AcceptEditResponseSchema>;

// ============================================================================
// File Upload Validation
// ============================================================================

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const SUPPORTED_IMAGE_FORMATS = ["image/jpeg", "image/png", "image/webp"];

export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  size: z.number().max(MAX_FILE_SIZE, "File size must be under 10MB"),
  type: z.enum(["image/jpeg", "image/png", "image/webp"] as const, {
    errorMap: () => ({ message: "Only JPEG, PNG, and WebP formats are supported" }),
  }),
});

export type FileUpload = z.infer<typeof FileUploadSchema>;

// ============================================================================
// Helper Functions for Validation
// ============================================================================

/**
 * Validates file upload constraints
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size exceeds 10MB limit. Please compress your image or select a smaller file.",
    };
  }

  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    return {
      valid: false,
      error: "Unsupported file format. Please upload JPEG, PNG, or WebP images.",
    };
  }

  return { valid: true };
}

/**
 * Validates edit parameters based on edit type
 */
export function validateEditParams(
  editType: EditType,
  params: unknown
): { valid: boolean; error?: string; data?: EditParams } {
  try {
    let schema: z.ZodSchema;

    switch (editType) {
      case "virtual-staging":
        schema = VirtualStagingParamsSchema;
        break;
      case "day-to-dusk":
        schema = DayToDuskParamsSchema;
        break;
      case "enhance":
        schema = EnhanceParamsSchema;
        break;
      case "item-removal":
        schema = ItemRemovalParamsSchema;
        break;
      case "virtual-renovation":
        schema = VirtualRenovationParamsSchema;
        break;
      default:
        return { valid: false, error: "Invalid edit type" };
    }

    const result = schema.parse(params);
    return { valid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: error.errors.map((e) => e.message).join(", "),
      };
    }
    return { valid: false, error: "Invalid parameters" };
  }
}
