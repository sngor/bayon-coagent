# Multi-Angle Room Staging Feature

## Overview

The Multi-Angle Room Staging feature allows users to upload multiple images of the same room from different angles and apply consistent furniture staging across all angles. This ensures that the furniture, style, and color palette remain consistent regardless of the viewing perspective.

## Key Features

### 1. **Consistent Furniture Across Angles**

- Upload the first angle and let AI stage it with your chosen style
- AI extracts furniture context (items, colors, style) from the first staged image
- Subsequent angles automatically match the furniture from the first angle
- Furniture placement adjusts intelligently based on perspective

### 2. **Furniture Context Extraction**

- AI analyzes the first staged image to extract:
  - Specific furniture items (e.g., "gray L-shaped sectional sofa")
  - Color palette (e.g., "charcoal gray", "warm beige", "brass accents")
  - Style elements and decorative items
  - Natural language description of the staging

### 3. **Session-Based Workflow**

- Create a staging session with room type and style
- Add multiple angles to the same session
- Track all angles in a unified gallery view
- Compare before/after for each angle

### 4. **Intelligent Angle Adaptation**

- Optional angle descriptions help AI understand perspective
- AI adjusts furniture placement for different viewpoints
- Maintains consistency while respecting spatial constraints

## User Flow

### Step 1: Create Session

1. Navigate to Studio → Reimagine → Multi-Angle tab
2. Select room type (Living Room, Bedroom, Kitchen, etc.)
3. Select furniture style (Modern, Traditional, Minimalist, etc.)
4. Click "Start Multi-Angle Staging"

### Step 2: Upload First Angle

1. Upload the first room image
2. AI stages it with your selected style
3. AI extracts furniture context for consistency
4. View the staged result

### Step 3: Add More Angles

1. Click "Add Angle"
2. Optionally describe the angle (e.g., "view from entrance")
3. Upload the next room image
4. AI automatically matches furniture from first angle
5. Repeat for all angles

### Step 4: Review & Compare

1. View all angles in gallery
2. Click "Compare" to see before/after
3. Download or save staged images

## Technical Architecture

### Data Models

#### Multi-Angle Staging Session

```typescript
{
  PK: "USER#<userId>",
  SK: "STAGING_SESSION#<sessionId>",
  sessionId: string,
  userId: string,
  roomType: string,
  style: string,
  furnitureContext: FurnitureContext,
  angles: AngleData[],
  createdAt: string,
  updatedAt: string
}
```

#### Furniture Context

```typescript
{
  roomType: string,
  style: string,
  furnitureItems: string[], // ["gray sectional sofa", "glass coffee table"]
  colorPalette: string[], // ["charcoal gray", "warm beige"]
  description: string // Natural language description
}
```

#### Angle Data

```typescript
{
  angleId: string,
  imageId: string,
  editId: string,
  originalUrl: string,
  stagedUrl: string,
  angleDescription: string,
  order: number
}
```

### API Actions

#### `createStagingSessionAction`

Creates a new multi-angle staging session.

**Parameters:**

- `userId`: User ID
- `roomType`: Type of room
- `style`: Furniture style

**Returns:**

- `sessionId`: Unique session identifier

#### `addAngleToSessionAction`

Adds an angle to an existing session and processes it.

**Parameters:**

- `userId`: User ID
- `sessionId`: Session ID
- `imageId`: Uploaded image ID
- `angleDescription`: Optional angle description

**Returns:**

- `angleId`: Unique angle identifier
- `furnitureContext`: Extracted context (first angle only)

#### `getStagingSessionAction`

Retrieves a staging session with all angles.

**Parameters:**

- `userId`: User ID
- `sessionId`: Session ID

**Returns:**

- `session`: Complete session data with all angles

#### `listStagingSessionsAction`

Lists all staging sessions for a user.

**Parameters:**

- `userId`: User ID

**Returns:**

- `sessions`: Array of session summaries

#### `deleteStagingSessionAction`

Deletes a staging session.

**Parameters:**

- `userId`: User ID
- `sessionId`: Session ID

### AI Flows

#### Furniture Context Extraction

**File:** `src/aws/google-ai/flows/gemini-furniture-context.ts`

Uses Gemini 2.0 Flash to analyze a staged image and extract:

- Specific furniture items with details
- Color palette and materials
- Comprehensive staging description

**Prompt Strategy:**

- Analyzes the staged result image
- Extracts specific furniture characteristics
- Identifies color schemes and materials
- Generates natural language description

#### Context-Aware Staging

**File:** `src/app/multi-angle-staging-actions.ts`

For subsequent angles:

1. Retrieves furniture context from first angle
2. Builds custom prompt with context:
   - Furniture items to include
   - Color palette to match
   - Angle-specific adjustments
3. Calls virtual staging with enhanced prompt
4. AI adapts furniture placement for new perspective

### UI Components

#### `MultiAngleStagingInterface`

**File:** `src/components/reimagine/multi-angle-staging-interface.tsx`

Main interface component that handles:

- Session creation form
- Image upload workflow
- Angle gallery display
- Before/after comparison modal

**Key Features:**

- Step-by-step guided workflow
- Real-time furniture context display
- Responsive grid layout for angles
- Loading states and error handling

#### `ImageUploader` (Simple Mode)

**File:** `src/components/reimagine/image-uploader.tsx`

Enhanced with `simpleMode` prop:

- When `true`: Upload only, no edit type selection
- Immediately returns `imageId` after upload
- Used in multi-angle workflow for streamlined UX

### Database Schema

Uses existing DynamoDB single-table design:

**Partition Key (PK):** `USER#<userId>`
**Sort Key (SK):** `STAGING_SESSION#<sessionId>`

**Access Patterns:**

1. Get session by ID: `PK = USER#<userId>` AND `SK = STAGING_SESSION#<sessionId>`
2. List user sessions: `PK = USER#<userId>` AND `SK begins_with STAGING_SESSION#`

## Integration Points

### Existing Systems

1. **Image Upload**: Uses existing `/api/reimagine/upload` endpoint
2. **Virtual Staging**: Leverages `processEditAction` for staging
3. **S3 Storage**: Uses existing S3 infrastructure for images
4. **DynamoDB**: Extends single-table design with new entity type

### New Dependencies

1. **Gemini 2.0 Flash**: For furniture context extraction
2. **Multi-angle schemas**: New Zod schemas for validation
3. **Session management**: New server actions for sessions

## Usage Example

```typescript
// 1. Create session
const session = await createStagingSessionAction(
  userId,
  "living-room",
  "modern"
);

// 2. Add first angle
const angle1 = await addAngleToSessionAction(
  userId,
  session.sessionId,
  imageId1,
  "wide angle from entrance"
);

// angle1.furnitureContext contains extracted furniture details

// 3. Add second angle (automatically matches furniture)
const angle2 = await addAngleToSessionAction(
  userId,
  session.sessionId,
  imageId2,
  "corner perspective"
);

// 4. Get complete session
const fullSession = await getStagingSessionAction(userId, session.sessionId);

// fullSession.angles contains all staged angles
```

## Benefits

### For Users

- **Consistency**: Same furniture across all angles
- **Time Savings**: No need to manually specify furniture for each angle
- **Professional Results**: Cohesive staging that looks realistic
- **Easy Workflow**: Simple step-by-step process

### For Real Estate Agents

- **Complete Property Showcase**: Stage entire rooms from multiple perspectives
- **Client Confidence**: Consistent staging builds trust
- **Marketing Ready**: Professional images for listings
- **Competitive Edge**: Advanced AI-powered staging

## Future Enhancements

1. **Furniture Library**: Save and reuse furniture contexts across sessions
2. **Batch Upload**: Upload all angles at once
3. **3D Room Reconstruction**: Generate 3D model from multiple angles
4. **Style Transfer**: Apply furniture from one room to another
5. **Collaborative Sessions**: Share sessions with team members
6. **Export Options**: Generate PDF reports with all angles

## Performance Considerations

- **First Angle**: ~30-45 seconds (staging + context extraction)
- **Subsequent Angles**: ~20-30 seconds (staging with context)
- **Session Storage**: Minimal DynamoDB usage (single item per session)
- **Image Storage**: Uses existing S3 infrastructure

## Error Handling

- Graceful fallback if context extraction fails
- Retry logic for AI operations
- Clear error messages for users
- Session recovery on failure

## Testing

### Manual Testing Checklist

- [ ] Create session with different room types
- [ ] Upload first angle and verify staging
- [ ] Check furniture context extraction
- [ ] Add second angle and verify consistency
- [ ] Add third angle with angle description
- [ ] Compare before/after for all angles
- [ ] Delete session
- [ ] Test with different styles
- [ ] Test error scenarios (upload failure, AI timeout)

### Edge Cases

- First angle staging fails
- Context extraction fails (uses fallback)
- User uploads wrong room type
- Network interruption during upload
- Session limit reached

## Documentation

- User guide: In-app tooltips and help text
- API documentation: JSDoc comments in code
- Architecture: This document
- Video tutorial: Coming soon

## Deployment

### Prerequisites

- Google AI API key configured
- Existing Reimagine infrastructure deployed
- DynamoDB table with proper permissions

### Deployment Steps

1. Deploy new schemas and actions
2. Deploy UI components
3. Test in staging environment
4. Deploy to production
5. Monitor error rates and performance

### Rollback Plan

- Feature is isolated in separate tab
- Can be disabled by hiding tab
- No impact on existing single-edit workflow
- Session data can be cleaned up if needed

## Support

For issues or questions:

- Check error logs in CloudWatch
- Review session data in DynamoDB
- Test with sample images
- Contact development team

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-24  
**Status:** Ready for Testing
