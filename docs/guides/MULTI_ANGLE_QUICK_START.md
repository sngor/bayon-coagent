# Multi-Angle Room Staging - Quick Start Guide

## What You Built

A feature that lets users upload multiple photos of the same room from different angles and get consistent furniture staging across all views. The AI learns from the first angle and automatically matches the furniture in subsequent angles.

## How to Use

### 1. Access the Feature

- Go to **Studio → Reimagine**
- Click the **Multi-Angle** tab

### 2. Start a Session

- Select **Room Type** (Living Room, Bedroom, etc.)
- Select **Furniture Style** (Modern, Traditional, etc.)
- Click **Start Multi-Angle Staging**

### 3. Upload First Angle

- Drag & drop or click to upload your first room image
- Wait for AI to stage it (~30-45 seconds)
- AI extracts furniture details automatically

### 4. Add More Angles

- Click **Add Angle**
- Optionally describe the angle (e.g., "corner view")
- Upload the next image
- AI matches furniture from first angle (~20-30 seconds)
- Repeat for all angles

### 5. Review Results

- View all angles in the gallery
- Click **Compare** to see before/after
- Download or save staged images

## Example Workflow

```
User: "I have 3 photos of my living room"

Step 1: Create session
  - Room Type: Living Room
  - Style: Modern

Step 2: Upload angle 1 (wide shot from entrance)
  - AI stages with modern furniture
  - Extracts: gray sectional, glass table, plants

Step 3: Upload angle 2 (corner perspective)
  - Description: "corner view"
  - AI adds same furniture, adjusted for angle

Step 4: Upload angle 3 (opposite wall)
  - Description: "view from window"
  - AI maintains furniture consistency

Result: 3 professionally staged images with matching furniture
```

## Key Benefits

✅ **Consistency** - Same furniture across all angles  
✅ **Time Saving** - No need to specify furniture for each angle  
✅ **Professional** - Realistic staging that adapts to perspective  
✅ **Easy** - Simple step-by-step workflow

## Tips for Best Results

1. **Use Same Room** - All images should be of the same physical space
2. **Different Angles** - Take photos from different corners/viewpoints
3. **Good Lighting** - Well-lit images work best
4. **Empty Rooms** - Works best with unfurnished spaces
5. **Describe Angles** - Optional descriptions help AI understand perspective

## Technical Details

### What Happens Behind the Scenes

**First Angle:**

1. Upload image to S3
2. AI stages with selected style
3. AI analyzes result and extracts:
   - Furniture items (e.g., "gray L-shaped sectional")
   - Colors (e.g., "charcoal gray", "warm beige")
   - Description (e.g., "Modern living room with...")
4. Stores context in session

**Subsequent Angles:**

1. Upload image to S3
2. AI receives custom prompt with furniture context
3. AI stages with matching furniture
4. Adjusts placement for new perspective
5. Adds to session gallery

### Data Storage

- **Sessions**: Stored in DynamoDB
- **Images**: Stored in S3
- **Context**: Stored with session
- **Presigned URLs**: Generated on-demand

## Troubleshooting

### Issue: First angle staging fails

**Solution:** Check image format (JPEG, PNG, WebP), try different image

### Issue: Subsequent angles don't match

**Solution:** Verify furniture context was extracted, check angle description

### Issue: Upload takes too long

**Solution:** Compress images, check internet connection

### Issue: Session not found

**Solution:** Create new session, check if session was deleted

## API Reference

### Create Session

```typescript
const result = await createStagingSessionAction(
  userId,
  "living-room",
  "modern"
);
// Returns: { success: true, sessionId: "uuid" }
```

### Add Angle

```typescript
const result = await addAngleToSessionAction(
  userId,
  sessionId,
  imageId,
  "corner perspective"
);
// Returns: { success: true, angleId: "uuid", furnitureContext?: {...} }
```

### Get Session

```typescript
const result = await getStagingSessionAction(userId, sessionId);
// Returns: { success: true, session: {...} }
```

### List Sessions

```typescript
const result = await listStagingSessionsAction(userId);
// Returns: { success: true, sessions: [...] }
```

### Delete Session

```typescript
const result = await deleteStagingSessionAction(userId, sessionId);
// Returns: { success: true }
```

## File Structure

```
src/
├── ai/schemas/
│   └── multi-angle-staging-schemas.ts    # Data models
├── app/
│   ├── (app)/studio/reimagine/
│   │   └── page.tsx                      # Main page (updated)
│   └── multi-angle-staging-actions.ts    # Server actions
├── aws/google-ai/flows/
│   └── gemini-furniture-context.ts       # AI context extraction
└── components/reimagine/
    ├── multi-angle-staging-interface.tsx # Main UI
    ├── multi-angle-guide.tsx             # Visual guide
    └── image-uploader.tsx                # Updated with simpleMode
```

## Testing Checklist

- [ ] Create session with different room types
- [ ] Upload first angle and verify staging
- [ ] Check furniture context extraction
- [ ] Add second angle and verify consistency
- [ ] Add third angle with description
- [ ] View before/after comparison
- [ ] Delete session
- [ ] Test error scenarios

## Next Steps

1. **Test in Development**

   ```bash
   npm run dev
   # Navigate to Studio → Reimagine → Multi-Angle
   ```

2. **Upload Test Images**

   - Use 2-3 images of the same room
   - Different angles/perspectives
   - Good lighting, empty room

3. **Verify Functionality**

   - Session creation works
   - First angle stages correctly
   - Context extraction succeeds
   - Subsequent angles match furniture
   - Gallery displays properly

4. **Check Logs**
   - CloudWatch for errors
   - Browser console for client errors
   - Network tab for API calls

## Support

**Common Questions:**

Q: How many angles can I add?  
A: No hard limit, but 3-5 angles is typical

Q: Can I edit the furniture context?  
A: Not yet, but planned for future release

Q: Can I reuse furniture from one room in another?  
A: Not yet, but furniture library is planned

Q: What if I upload the wrong angle?  
A: Delete the session and start over

Q: Can I download all angles at once?  
A: Not yet, download individually for now

---

**Status:** ✅ Ready to Test  
**Version:** 1.0.0  
**Last Updated:** 2024-11-24
