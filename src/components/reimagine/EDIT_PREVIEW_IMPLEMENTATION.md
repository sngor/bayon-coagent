# Edit Preview Component Implementation

## Overview

The `EditPreview` component provides a comprehensive before/after comparison interface for reviewing AI-edited images in the Reimagine Image Toolkit. It implements all requirements from the design specification including side-by-side comparison, interactive slider, and action buttons.

## Features

### 1. Side-by-Side Comparison (Requirement 12.1)

- **Interactive Slider**: Drag the vertical slider to reveal before/after portions of the image
- **Touch Support**: Full mobile and tablet support with touch gestures
- **Smooth Transitions**: Fluid animations for a polished user experience
- **Visual Indicators**: "Before" and "After" labels on the images

### 2. Before/After Slider (Requirement 12.1)

The component implements a sophisticated comparison slider:

- **Drag Interaction**: Click and drag anywhere on the image to adjust the slider
- **Slider Control**: Use the slider control below the image for precise adjustment
- **Visual Handle**: Clear visual indicator showing the split point
- **Responsive**: Works on all screen sizes with appropriate touch targets

### 3. Action Buttons (Requirement 12.2, 12.4)

Three primary actions are provided:

- **Accept**: Saves the edit to history and marks it as completed
- **Regenerate**: Allows parameter adjustment and reprocessing
- **Cancel**: Discards the edit without saving

### 4. Desktop Enhancement

On larger screens (lg breakpoint and above), the component shows:

- Side-by-side static comparison below the interactive slider
- Full-size views of both original and edited images
- Better for detailed inspection

### 5. Fullscreen Mode

- Toggle fullscreen for detailed inspection
- Maintains all functionality in fullscreen mode
- Easy exit with button or ESC key

## Component API

```typescript
interface EditPreviewProps {
  originalUrl: string; // Presigned URL for original image
  editedUrl: string; // Presigned URL for edited image
  editType?: string; // Type of edit (for display)
  onAccept: () => void; // Called when user accepts the edit
  onRegenerate: () => void; // Called when user wants to regenerate
  onCancel: () => void; // Called when user cancels the edit
  isLoading?: boolean; // Disable buttons during operations
  className?: string; // Additional CSS classes
}
```

## Usage Example

```typescript
import { EditPreview } from "@/components/reimagine/edit-preview";

function ReimagineToolkit() {
  const [previewData, setPreviewData] = useState<{
    editId: string;
    originalUrl: string;
    editedUrl: string;
    editType: EditType;
  } | null>(null);

  const handleAccept = async () => {
    if (!previewData) return;

    // Save edit to history (Requirement 12.3)
    const result = await acceptEditAction(previewData.editId);

    if (result.success) {
      toast.success("Edit saved to history");
      setPreviewData(null);
      // Refresh edit history
      refreshHistory();
    }
  };

  const handleRegenerate = () => {
    if (!previewData) return;

    // Show edit form with current parameters (Requirement 12.4)
    setShowEditForm(true);
    setEditFormParams(currentParams);
    setPreviewData(null);
  };

  const handleCancel = async () => {
    if (!previewData) return;

    // Discard without saving (Requirement 12.5)
    await deleteEditAction(previewData.editId);
    setPreviewData(null);
  };

  return (
    <div>
      {previewData && (
        <EditPreview
          originalUrl={previewData.originalUrl}
          editedUrl={previewData.editedUrl}
          editType={previewData.editType}
          onAccept={handleAccept}
          onRegenerate={handleRegenerate}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
```

## Integration with Server Actions

### 1. After Processing an Edit

```typescript
// Process edit and show preview
const result = await processEditAction(imageId, editType, params);

if (result.success && result.editId && result.resultUrl) {
  // Get presigned URL for original
  const originalUrl = await getPresignedUrl(imageId);

  // Show preview
  setPreviewData({
    editId: result.editId,
    originalUrl,
    editedUrl: result.resultUrl,
    editType,
  });
}
```

### 2. Accept Action

```typescript
const handleAccept = async () => {
  // Change status from 'preview' to 'completed'
  const result = await acceptEditAction(editId);

  if (result.success) {
    // Edit is now in history
    // Refresh history list
  }
};
```

### 3. Regenerate Action

```typescript
const handleRegenerate = () => {
  // Show edit form with current parameters
  // User can adjust and resubmit
  // Original preview is discarded
  setShowEditForm(true);
  setEditParams(currentParams);
};
```

### 4. Cancel Action

```typescript
const handleCancel = async () => {
  // Delete preview edit from S3 and DynamoDB
  await deleteEditAction(editId);

  // Clear preview state
  setPreviewData(null);
};
```

## Responsive Design

### Mobile (< 640px)

- Full-width layout
- Stacked action buttons
- Touch-optimized slider
- Single comparison view

### Tablet (640px - 1024px)

- Optimized touch targets
- Horizontal button layout
- Single comparison view

### Desktop (> 1024px)

- Side-by-side static comparison
- Horizontal button layout
- Fullscreen option
- Enhanced visual space

## Accessibility

- **Keyboard Navigation**: All buttons are keyboard accessible
- **Screen Readers**: Proper ARIA labels and alt text
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Focus Indicators**: Clear focus states for all interactive elements

## Performance Considerations

1. **Image Loading**: Uses native img tags for optimal browser caching
2. **Smooth Animations**: Hardware-accelerated CSS transforms
3. **Efficient Updates**: React state updates only when necessary
4. **Memory Management**: Proper cleanup of event listeners

## Technical Implementation

### Slider Mechanism

The slider uses CSS `clip-path` for efficient rendering:

```typescript
<div style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
  <img src={originalUrl} alt="Original" />
</div>
```

This approach:

- Performs well on all devices
- Doesn't require canvas manipulation
- Maintains image quality
- Supports any image size

### Drag Interaction

Supports both mouse and touch events:

```typescript
const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging) return;
  const rect = container.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = (x / rect.width) * 100;
  setSliderPosition(Math.max(0, Math.min(100, percentage)));
};
```

## Requirements Validation

✅ **Requirement 12.1**: Display original and edited images side-by-side

- Implemented with interactive slider and static side-by-side view

✅ **Requirement 12.2**: Provide options to accept, regenerate, or cancel

- All three action buttons implemented with proper handlers

✅ **Requirement 12.4**: Allow parameter adjustments for regeneration

- Regenerate button triggers parameter form display

## Future Enhancements

1. **Zoom Controls**: Add zoom in/out for detailed inspection
2. **Download Button**: Quick download of edited image
3. **Comparison Metrics**: Show difference metrics (brightness, contrast, etc.)
4. **Multiple Previews**: Compare multiple edit variations
5. **Annotation Tools**: Mark areas of interest or concern
6. **History Integration**: Quick access to previous edits

## Testing Recommendations

### Unit Tests

- Test slider position updates
- Test button click handlers
- Test responsive layout changes
- Test fullscreen toggle

### Integration Tests

- Test with actual image URLs
- Test accept/regenerate/cancel flow
- Test with different edit types
- Test error handling

### Visual Tests

- Test on various screen sizes
- Test with different image aspect ratios
- Test with very large/small images
- Test animation smoothness

## Related Components

- `ProcessingProgress`: Shows progress before preview
- `EditOptionsPanel`: Selects edit type before processing
- `EditHistoryList`: Shows accepted edits
- `ImageUploader`: Provides original image

## Files

- `src/components/reimagine/edit-preview.tsx` - Main component
- `src/components/reimagine/edit-preview-example.tsx` - Usage examples
- `src/components/reimagine/EDIT_PREVIEW_IMPLEMENTATION.md` - This documentation
