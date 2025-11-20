# Design Document: Reimagine Image Toolkit

## Overview

The Reimagine Image Toolkit is an AI-powered image editing platform integrated into the Co-agent Marketer application. It provides real estate agents with professional-grade image transformation capabilities specifically tailored for property marketing. The toolkit leverages AWS Bedrock's foundation models for image generation, editing, and analysis, combined with S3 for storage and DynamoDB for metadata management.

The system follows a modular architecture where each editing operation (virtual staging, day-to-dusk, enhancement, item removal, renovation) is implemented as a separate Bedrock flow with specialized model selection. The design emphasizes user experience through AI-powered suggestions, real-time progress tracking, preview capabilities, and edit history management.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Upload UI    │  │ Edit UI      │  │ History UI   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server Actions Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Upload       │  │ Process Edit │  │ Get History  │      │
│  │ Action       │  │ Action       │  │ Action       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   S3 Client  │   │   Bedrock    │   │   DynamoDB   │
│              │   │   Flows      │   │  Repository  │
│ - Upload     │   │              │   │              │
│ - Download   │   │ - Staging    │   │ - Save Meta  │
│ - Presigned  │   │ - Day/Dusk   │   │ - Get Edits  │
│   URLs       │   │ - Enhance    │   │ - Delete     │
│              │   │ - Remove     │   │              │
│              │   │ - Renovate   │   │              │
│              │   │ - Analyze    │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
                    ┌──────────────┐
                    │  AWS Services│
                    │              │
                    │ - S3 Bucket  │
                    │ - Bedrock    │
                    │ - DynamoDB   │
                    └──────────────┘
```

### Data Flow

1. **Upload Flow**: User uploads image → Frontend validates → Server action receives file → S3 stores original → DynamoDB stores metadata → AI analyzes image → Suggestions returned
2. **Edit Flow**: User selects edit → Frontend sends request → Server action validates → Bedrock flow processes → S3 stores result → DynamoDB records edit → Result returned
3. **History Flow**: User requests history → Server action queries DynamoDB → Presigned URLs generated for images → History displayed

## Components and Interfaces

### Frontend Components

#### 1. ReimagineToolkitPage (`/src/app/(app)/reimagine/page.tsx`)

Main page component that orchestrates the toolkit interface.

```typescript
interface ReimagineToolkitPageProps {
  // Server component - no props needed
}
```

#### 2. ImageUploader (`/src/components/reimagine/image-uploader.tsx`)

Client component for image upload with drag-and-drop support.

```typescript
interface ImageUploaderProps {
  onUploadComplete: (imageId: string, suggestions: EditSuggestion[]) => void;
  onUploadError: (error: string) => void;
}
```

#### 3. EditOptionsPanel (`/src/components/reimagine/edit-options-panel.tsx`)

Displays available editing operations with AI suggestions.

```typescript
interface EditOptionsPanelProps {
  imageId: string;
  suggestions: EditSuggestion[];
  onEditSelect: (editType: EditType, params?: EditParams) => void;
}
```

#### 4. EditPreview (`/src/components/reimagine/edit-preview.tsx`)

Side-by-side comparison of original and edited images.

```typescript
interface EditPreviewProps {
  originalUrl: string;
  editedUrl: string;
  onAccept: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
}
```

#### 5. EditHistoryList (`/src/components/reimagine/edit-history-list.tsx`)

Displays user's edit history with thumbnails and metadata.

```typescript
interface EditHistoryListProps {
  userId: string;
}
```

#### 6. ProcessingProgress (`/src/components/reimagine/processing-progress.tsx`)

Real-time progress indicator for edit operations.

```typescript
interface ProcessingProgressProps {
  status: ProcessingStatus;
  progress: number;
  estimatedTime?: number;
}
```

### Backend Services

#### 1. Server Actions (`/src/app/reimagine-actions.ts`)

```typescript
// Upload image and get AI suggestions
export async function uploadImageAction(formData: FormData): Promise<{
  success: boolean;
  imageId?: string;
  suggestions?: EditSuggestion[];
  error?: string;
}>;

// Process an edit operation
export async function processEditAction(
  imageId: string,
  editType: EditType,
  params: EditParams
): Promise<{
  success: boolean;
  editId?: string;
  resultUrl?: string;
  error?: string;
}>;

// Get edit history
export async function getEditHistoryAction(
  userId: string,
  limit?: number
): Promise<{
  success: boolean;
  edits?: EditHistoryItem[];
  error?: string;
}>;

// Delete an edit
export async function deleteEditAction(editId: string): Promise<{
  success: boolean;
  error?: string;
}>;

// Accept edit preview
export async function acceptEditAction(editId: string): Promise<{
  success: boolean;
  error?: string;
}>;
```

#### 2. Bedrock Flows (`/src/aws/bedrock/flows/`)

Each editing operation is implemented as a separate flow:

- `reimagine-analyze.ts` - Image analysis for suggestions
- `reimagine-staging.ts` - Virtual staging
- `reimagine-day-to-dusk.ts` - Day-to-dusk conversion
- `reimagine-enhance.ts` - Image enhancement
- `reimagine-remove.ts` - Item removal
- `reimagine-renovate.ts` - Virtual renovation

#### 3. DynamoDB Repository (`/src/aws/dynamodb/repository.ts`)

Extended with Reimagine-specific operations:

```typescript
// Save image metadata
async function saveImageMetadata(
  userId: string,
  imageId: string,
  metadata: ImageMetadata
): Promise<void>;

// Save edit record
async function saveEditRecord(
  userId: string,
  editId: string,
  record: EditRecord
): Promise<void>;

// Get edit history
async function getEditHistory(
  userId: string,
  limit?: number
): Promise<EditHistoryItem[]>;

// Delete edit
async function deleteEdit(userId: string, editId: string): Promise<void>;
```

## Data Models

### ImageMetadata

```typescript
interface ImageMetadata {
  PK: string; // USER#<userId>
  SK: string; // IMAGE#<imageId>
  imageId: string;
  userId: string;
  originalKey: string; // S3 key for original image
  fileName: string;
  fileSize: number;
  contentType: string;
  width: number;
  height: number;
  uploadedAt: string; // ISO timestamp
  suggestions?: EditSuggestion[];
}
```

### EditRecord

```typescript
interface EditRecord {
  PK: string; // USER#<userId>
  SK: string; // EDIT#<editId>
  editId: string;
  userId: string;
  imageId: string;
  editType: EditType;
  params: EditParams;
  sourceKey: string; // S3 key for source image
  resultKey: string; // S3 key for result image
  status: "pending" | "processing" | "completed" | "failed" | "preview";
  createdAt: string; // ISO timestamp
  completedAt?: string; // ISO timestamp
  error?: string;
  modelId?: string; // Bedrock model used
  processingTime?: number; // milliseconds
}
```

### EditType

```typescript
type EditType =
  | "virtual-staging"
  | "day-to-dusk"
  | "enhance"
  | "item-removal"
  | "virtual-renovation";
```

### EditParams

```typescript
interface VirtualStagingParams {
  roomType:
    | "living-room"
    | "bedroom"
    | "kitchen"
    | "dining-room"
    | "office"
    | "bathroom";
  style:
    | "modern"
    | "traditional"
    | "minimalist"
    | "luxury"
    | "rustic"
    | "contemporary";
}

interface DayToDuskParams {
  intensity: "subtle" | "moderate" | "dramatic";
}

interface EnhanceParams {
  autoAdjust: boolean;
  brightness?: number; // -100 to 100
  contrast?: number; // -100 to 100
  saturation?: number; // -100 to 100
}

interface ItemRemovalParams {
  maskData: string; // Base64 encoded mask image
  objects: string[]; // Description of objects to remove
}

interface VirtualRenovationParams {
  description: string; // Natural language description of renovations
  style?: string; // Optional style guidance
}

type EditParams =
  | VirtualStagingParams
  | DayToDuskParams
  | EnhanceParams
  | ItemRemovalParams
  | VirtualRenovationParams;
```

### EditSuggestion

```typescript
interface EditSuggestion {
  editType: EditType;
  priority: "high" | "medium" | "low";
  reason: string;
  suggestedParams?: Partial<EditParams>;
  confidence: number; // 0-1
}
```

### EditHistoryItem

```typescript
interface EditHistoryItem {
  editId: string;
  imageId: string;
  editType: EditType;
  originalUrl: string; // Presigned URL
  resultUrl: string; // Presigned URL
  createdAt: string;
  status: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After reviewing all testable properties from the prework, several redundancies and consolidation opportunities were identified:

**Redundancies Identified:**

- Properties about "invoking Bedrock" for each edit type (2.2, 3.2, 4.2, 5.2, 6.2) can be consolidated into a single property about all edit operations invoking the appropriate model
- Properties about "displaying results" (2.3, 3.3, 4.3, 5.3, 6.3, 12.1) can be consolidated into a single property about all completed operations displaying results
- Properties 10.1-10.5 about model selection can be consolidated into a single property about correct model routing
- Properties about progress indicators (8.1, 8.2, 8.3, 8.4) can be consolidated into a single comprehensive property about progress tracking
- Properties about edit history display (7.2, 7.4) overlap and can be combined
- Properties about suggestion generation (13.4-13.8) can be consolidated into a single property about contextual suggestions

**Consolidated Properties:**

- Single property for "Edit operations invoke appropriate Bedrock models" (covers 2.2, 3.2, 4.2, 5.2, 6.2, 10.1-10.5)
- Single property for "Completed operations display results" (covers 2.3, 3.3, 4.3, 5.3, 6.3, 12.1)
- Single property for "Progress tracking throughout operation lifecycle" (covers 8.1-8.4)
- Single property for "Contextual AI suggestions based on image analysis" (covers 13.4-13.8)

This reflection reduces the total number of properties from 50+ to approximately 30 unique, non-redundant properties that provide comprehensive validation coverage.

### Correctness Properties

Property 1: Valid upload persistence
_For any_ valid image file under 10MB in a supported format (JPEG, PNG, WebP), uploading should result in the file being stored in S3 and metadata being recorded in DynamoDB with user identifier and timestamp
**Validates: Requirements 1.2, 1.5**

Property 2: Edit operations invoke appropriate models
_For any_ edit operation (virtual staging, day-to-dusk, enhancement, item removal, or renovation), the system should invoke AWS Bedrock with the model specifically optimized for that operation type
**Validates: Requirements 2.2, 3.2, 4.2, 5.2, 6.2, 10.1, 10.2, 10.3, 10.4, 10.5**

Property 3: Completed operations display results
_For any_ successfully completed edit operation, the system should display the result image alongside the original for comparison
**Validates: Requirements 2.3, 3.3, 4.3, 5.3, 6.3, 12.1**

Property 4: Error handling with user notification
_For any_ failed edit operation, the system should notify the user with a descriptive error message and suggested next steps
**Validates: Requirements 2.4, 8.4**

Property 5: Resolution and aspect ratio preservation
_For any_ image transformation operation, the output image should preserve the original image's resolution and aspect ratio
**Validates: Requirements 3.5**

Property 6: Multiple object removal in single operation
_For any_ item removal request with multiple marked objects, all objects should be processed in a single Bedrock invocation rather than separate calls
**Validates: Requirements 5.4**

Property 7: Edit completion triggers storage and history
_For any_ completed edit operation, the processed image should be saved to S3 and an edit record should be added to DynamoDB with all required metadata
**Validates: Requirements 7.1**

Property 8: History displays all edits with metadata
_For any_ user's edit history request, all processed images should be displayed with timestamps, operation types, and links to source images
**Validates: Requirements 7.2, 7.4**

Property 9: Download provides high-quality image
_For any_ download request, the system should provide the processed image in its original quality without compression artifacts
**Validates: Requirements 7.3**

Property 10: Delete removes from both S3 and DynamoDB
_For any_ edit deletion, both the processed image in S3 and the metadata record in DynamoDB should be removed
**Validates: Requirements 7.5**

Property 11: Progress tracking throughout lifecycle
_For any_ edit operation, the system should display progress indicators during submission, processing, and completion phases with appropriate status updates
**Validates: Requirements 8.1, 8.2, 8.3, 8.5**

Property 12: Chained edits use previous results
_For any_ second edit applied to a processed image, the system should use the previous edit's result as the source image for the new operation
**Validates: Requirements 9.2**

Property 13: Edit sequence preservation in history
_For any_ chain of multiple edits, the system should maintain and display the complete sequence in the edit history
**Validates: Requirements 9.3, 9.4**

Property 14: Original image accessibility
_For any_ image that has been edited, the system should maintain access to the unedited original image
**Validates: Requirements 9.5**

Property 15: Authenticated access enforcement
_For any_ unauthenticated access attempt to the toolkit, the system should redirect to the login page before allowing any operations
**Validates: Requirements 11.4**

Property 16: History loads on toolkit access
_For any_ authenticated user accessing the toolkit, the system should load and display their previous edit history
**Validates: Requirements 11.5**

Property 17: Preview provides action options
_For any_ edit preview, the system should provide options to accept, regenerate with parameter adjustments, or cancel the edit
**Validates: Requirements 12.2, 12.4**

Property 18: Accept saves to history
_For any_ preview acceptance, the system should save the processed image and add the edit to the user's history
**Validates: Requirements 12.3**

Property 19: Cancel discards without saving
_For any_ preview cancellation, the system should discard the processed image without saving to S3 or adding to history
**Validates: Requirements 12.5**

Property 20: Upload triggers AI analysis
_For any_ successful image upload, the system should invoke AWS Bedrock with a vision model to analyze the image and generate edit suggestions
**Validates: Requirements 13.1, 13.2**

Property 21: Analysis provides recommendations with explanations
_For any_ completed image analysis, the system should display recommended edits with explanations for why each edit would benefit the image
**Validates: Requirements 13.3**

Property 22: Contextual suggestions based on image content
_For any_ analyzed image, the system should generate contextually appropriate suggestions: virtual staging for empty rooms, day-to-dusk for daytime exteriors, enhancement for quality issues, item removal for distracting objects, and renovation for dated features
**Validates: Requirements 13.4, 13.5, 13.6, 13.7, 13.8**

Property 23: Suggestion click pre-populates form
_For any_ suggested edit that a user clicks, the system should pre-populate the edit form with the recommended parameters from the suggestion
**Validates: Requirements 13.9**

Property 24: Dismissed suggestions allow re-analysis
_For any_ dismissed suggestion, the system should remove it from the current session while maintaining the ability to re-analyze the image and generate new suggestions
**Validates: Requirements 13.10**

## Error Handling

### Upload Errors

1. **File Size Exceeded**: When file > 10MB, return error with message "File size exceeds 10MB limit. Please compress your image or select a smaller file."
2. **Unsupported Format**: When format not in [JPEG, PNG, WebP], return error with message "Unsupported file format. Please upload JPEG, PNG, or WebP images."
3. **S3 Upload Failure**: Retry up to 3 times with exponential backoff. If all retries fail, return error with message "Failed to upload image. Please try again."
4. **Metadata Save Failure**: If DynamoDB write fails, delete the S3 object and return error to maintain consistency

### Edit Processing Errors

1. **Bedrock Throttling**: Implement exponential backoff retry (already in BedrockClient). Max 3 retries.
2. **Model Timeout**: Set 60-second timeout for edit operations. If exceeded, return error with message "Processing is taking longer than expected. Please try again or try a different image."
3. **Invalid Parameters**: Validate all edit parameters before invoking Bedrock. Return specific validation errors.
4. **Model Failure**: If Bedrock returns error, parse error code and provide user-friendly message with suggestions
5. **S3 Result Save Failure**: Retry save operation. If fails, mark edit as failed in DynamoDB with error details

### History and Download Errors

1. **Presigned URL Generation Failure**: Retry up to 2 times. If fails, return error with message "Unable to load image. Please refresh and try again."
2. **Missing Image**: If S3 object not found, mark edit as corrupted in DynamoDB and hide from history
3. **DynamoDB Query Failure**: Retry query with exponential backoff. Return empty history if all retries fail

### Analysis Errors

1. **Vision Model Failure**: If analysis fails, allow upload to proceed without suggestions. Log error for monitoring.
2. **Invalid Image Content**: If vision model cannot process image, return generic suggestions (enhance, staging)

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and integration points:

1. **Upload Validation Tests**

   - Test file size validation (9MB passes, 11MB fails)
   - Test format validation (JPEG/PNG/WebP pass, GIF fails)
   - Test S3 key generation format
   - Test metadata structure

2. **Edit Parameter Validation Tests**

   - Test virtual staging parameter validation
   - Test day-to-dusk intensity values
   - Test enhancement range limits (-100 to 100)
   - Test item removal mask format

3. **S3 Integration Tests**

   - Test upload with mock S3 client
   - Test presigned URL generation
   - Test file deletion

4. **DynamoDB Integration Tests**

   - Test metadata save/retrieve
   - Test edit history query
   - Test edit deletion

5. **Server Action Tests**
   - Test uploadImageAction with valid/invalid inputs
   - Test processEditAction with each edit type
   - Test getEditHistoryAction pagination
   - Test deleteEditAction authorization

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using fast-check library. Each test will run a minimum of 100 iterations.

1. **Property Test: Valid upload persistence** (Property 1)

   - Generate random valid images (< 10MB, supported formats)
   - Upload each image
   - Verify S3 contains file and DynamoDB contains metadata
   - **Feature: reimagine-image-toolkit, Property 1: Valid upload persistence**

2. **Property Test: Edit operations invoke appropriate models** (Property 2)

   - Generate random edit requests for each type
   - Mock Bedrock client to track invocations
   - Verify correct model ID used for each edit type
   - **Feature: reimagine-image-toolkit, Property 2: Edit operations invoke appropriate models**

3. **Property Test: Resolution preservation** (Property 5)

   - Generate random images with various resolutions
   - Apply random edit operations
   - Verify output resolution matches input
   - **Feature: reimagine-image-toolkit, Property 5: Resolution and aspect ratio preservation**

4. **Property Test: Edit completion triggers storage** (Property 7)

   - Generate random completed edits
   - Verify S3 contains result image
   - Verify DynamoDB contains edit record
   - **Feature: reimagine-image-toolkit, Property 7: Edit completion triggers storage and history**

5. **Property Test: Delete removes from both stores** (Property 10)

   - Generate random edits and save them
   - Delete each edit
   - Verify S3 object removed
   - Verify DynamoDB record removed
   - **Feature: reimagine-image-toolkit, Property 10: Delete removes from both S3 and DynamoDB**

6. **Property Test: Chained edits use previous results** (Property 12)

   - Generate random edit chains (2-5 edits)
   - Track source image for each edit
   - Verify each edit uses previous result as source
   - **Feature: reimagine-image-toolkit, Property 12: Chained edits use previous results**

7. **Property Test: Preview cancellation discards** (Property 19)

   - Generate random edit previews
   - Cancel each preview
   - Verify S3 does not contain result
   - Verify DynamoDB does not contain edit record
   - **Feature: reimagine-image-toolkit, Property 19: Cancel discards without saving**

8. **Property Test: Upload triggers analysis** (Property 20)
   - Generate random valid images
   - Upload each image
   - Verify Bedrock vision model invoked
   - Verify suggestions generated
   - **Feature: reimagine-image-toolkit, Property 20: Upload triggers AI analysis**

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Complete Edit Workflow**

   - Upload image → Receive suggestions → Select edit → Process → Preview → Accept → Verify in history

2. **Multi-Edit Chain Workflow**

   - Upload → Edit 1 → Accept → Edit 2 on result → Accept → Verify chain in history

3. **Error Recovery Workflow**

   - Upload → Edit with invalid params → Receive error → Correct params → Successful edit

4. **History Management Workflow**
   - Create multiple edits → View history → Download image → Delete edit → Verify removal

## Model Selection Strategy

### Virtual Staging

**Primary Model**: Amazon Titan Image Generator G1 (`amazon.titan-image-generator-v1`)

- Optimized for generating realistic furniture and decor
- Supports style conditioning for different aesthetics
- Good at maintaining architectural consistency

**Fallback Model**: Stability AI SDXL (`stability.stable-diffusion-xl-v1`)

- Alternative if Titan unavailable
- Excellent furniture generation capabilities

### Day-to-Dusk

**Primary Model**: Stability AI SDXL with ControlNet (`stability.stable-diffusion-xl-v1`)

- Excellent at lighting transformations
- Preserves structural details while changing atmosphere
- Supports fine-grained control over lighting intensity

### Image Enhancement

**Primary Model**: Amazon Titan Image Generator G1 (`amazon.titan-image-generator-v1`)

- Built-in image conditioning capabilities
- Automatic quality improvements
- Preserves original content while enhancing

### Item Removal (Inpainting)

**Primary Model**: Stability AI SDXL Inpainting (`stability.stable-diffusion-xl-v1`)

- Specialized inpainting capabilities
- Excellent at context-aware fill
- Handles complex backgrounds well

### Virtual Renovation

**Primary Model**: Amazon Titan Image Generator G1 (`amazon.titan-image-generator-v1`)

- Strong architectural understanding
- Good at style transfer
- Maintains structural integrity

**Fallback Model**: Anthropic Claude 3.5 Sonnet with image analysis + SDXL generation

- Use Claude to analyze and plan renovation
- Generate with SDXL based on Claude's guidance

### Image Analysis (Suggestions)

**Primary Model**: Anthropic Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`)

- Excellent vision capabilities
- Can identify room types, lighting conditions, quality issues
- Provides detailed reasoning for suggestions

## Performance Considerations

### Image Processing

- **Async Processing**: All edit operations run asynchronously with progress tracking
- **Timeout Limits**: 60-second timeout per operation to prevent hanging
- **Retry Strategy**: Exponential backoff with max 3 retries for transient failures

### Storage Optimization

- **S3 Lifecycle**: Configure lifecycle rules to archive old edits after 90 days
- **Presigned URLs**: 1-hour expiration for security and cache management
- **Image Compression**: Store results in WebP format when possible for smaller file sizes

### Database Optimization

- **DynamoDB Indexes**: GSI on userId for efficient history queries
- **Pagination**: Limit history queries to 50 items per page
- **TTL**: Optional TTL on preview edits (not accepted) to auto-cleanup after 24 hours

### Frontend Optimization

- **Lazy Loading**: Load edit history images on scroll
- **Image Optimization**: Use Next.js Image component with automatic optimization
- **Optimistic Updates**: Show immediate feedback while operations process
- **Caching**: Cache suggestions for 5 minutes to avoid re-analysis

## Security Considerations

### Authentication and Authorization

- All operations require authenticated user
- User can only access their own images and edits
- S3 keys include userId to prevent unauthorized access

### Input Validation

- File size limits enforced (10MB max)
- File type validation (JPEG, PNG, WebP only)
- Parameter validation for all edit operations
- Sanitize user-provided descriptions for renovation

### Data Privacy

- Images stored with user-specific S3 keys
- Presigned URLs expire after 1 hour
- No sharing of images between users
- Option to permanently delete all user data

### Rate Limiting

- Implement rate limiting on upload (10 per hour)
- Rate limiting on edit operations (20 per hour)
- Prevent abuse of expensive Bedrock operations

## Deployment Considerations

### Environment Variables

```
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=coagent-marketer-images
AWS_BEDROCK_REGION=us-east-1
```

### AWS Resource Requirements

- **S3 Bucket**: With CORS configured for direct uploads
- **DynamoDB Table**: Existing table with GSI on userId
- **Bedrock Access**: Model access enabled for Titan and SDXL
- **IAM Permissions**: S3 read/write, DynamoDB read/write, Bedrock invoke

### Monitoring

- CloudWatch metrics for Bedrock invocations
- S3 storage metrics
- DynamoDB read/write capacity
- Error rate tracking for each edit type
- Average processing time per operation

## Future Enhancements

1. **Batch Processing**: Allow users to apply same edit to multiple images
2. **Templates**: Save edit configurations as reusable templates
3. **Comparison View**: Side-by-side comparison of multiple edit variations
4. **Export Options**: Export with watermarks, different resolutions
5. **Collaboration**: Share edits with team members
6. **Advanced Staging**: Room-specific furniture catalogs
7. **Style Transfer**: Apply style from one image to another
8. **HDR Enhancement**: Specialized HDR processing for real estate
9. **360° Support**: Support for 360-degree property photos
10. **Video Support**: Extend to video enhancement and virtual tours
