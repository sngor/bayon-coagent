# Quick Capture Interface

A comprehensive mobile-optimized interface for capturing content using camera, voice, or text input. Designed for real estate agents to quickly capture property details while on-the-go.

## Features

### 🎯 Three Capture Modes

1. **Camera Mode**

   - Live camera preview with front/back camera switching
   - Photo capture with preview
   - Retake functionality
   - Automatic image optimization

2. **Voice Mode**

   - Audio recording with real-time waveform visualization
   - Pause/resume functionality
   - Recording timer
   - Audio level visualization
   - Automatic transcription ready

3. **Text Mode**
   - Mobile-optimized text input
   - Character and word count
   - Auto-focus for quick entry
   - Keyboard-friendly interface

### 📱 Mobile-First Design

- **Bottom Sheet UI**: Slides up from bottom for one-handed use
- **Touch-Friendly Controls**: All buttons meet 44px minimum touch target size
- **Visual Feedback**: Mode switching with animations and visual indicators
- **Responsive Layout**: Adapts to different screen sizes
- **Gesture Support**: Swipe to close bottom sheet

### 🌍 Location Integration

- Optional geolocation capture
- Automatic location tagging for captured content
- Privacy-conscious (requires user permission)

## Usage

### Basic Implementation

```tsx
import {
  QuickCaptureInterface,
  type CaptureData,
} from "@/components/mobile/quick-capture-interface";

function MyComponent() {
  const [open, setOpen] = useState(false);

  const handleCapture = async (data: CaptureData) => {
    console.log("Captured:", data);
    // Process the captured data
    // - Upload to S3
    // - Generate AI description
    // - Save to DynamoDB
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Quick Capture</Button>

      <QuickCaptureInterface
        open={open}
        onOpenChange={setOpen}
        onCapture={handleCapture}
        defaultMode="camera"
        enableLocation={true}
      />
    </>
  );
}
```

### Props

| Prop             | Type                                   | Default    | Description                       |
| ---------------- | -------------------------------------- | ---------- | --------------------------------- |
| `open`           | `boolean`                              | -          | Controls sheet visibility         |
| `onOpenChange`   | `(open: boolean) => void`              | -          | Callback when sheet opens/closes  |
| `onCapture`      | `(data: CaptureData) => Promise<void>` | -          | Callback when content is captured |
| `defaultMode`    | `'camera' \| 'voice' \| 'text'`        | `'camera'` | Initial capture mode              |
| `enableLocation` | `boolean`                              | `true`     | Enable location capture           |
| `className`      | `string`                               | -          | Additional CSS classes            |

### CaptureData Interface

```typescript
interface CaptureData {
  type: "photo" | "voice" | "text";
  content: string | File | Blob;
  location?: GeolocationCoordinates;
  timestamp: number;
  metadata?: Record<string, any>;
}
```

## Integration with Backend

### Photo Capture Flow

1. User captures photo
2. Photo is converted to File object
3. `onCapture` callback receives data
4. Upload to S3 using existing upload action
5. Trigger AI vision analysis (Bedrock)
6. Save metadata to DynamoDB

```typescript
const handleCapture = async (data: CaptureData) => {
  if (data.type === "photo") {
    const formData = new FormData();
    formData.append("file", data.content as File);

    const result = await uploadPhotoAction(null, formData);
    // Process result...
  }
};
```

### Voice Capture Flow

1. User records audio
2. Audio is captured as Blob
3. `onCapture` callback receives data
4. Upload to S3
5. Trigger AWS Transcribe for transcription
6. Generate content from transcript
7. Save to DynamoDB

```typescript
const handleCapture = async (data: CaptureData) => {
  if (data.type === "voice") {
    const audioFile = new File(
      [data.content as Blob],
      `voice-${Date.now()}.webm`,
      { type: "audio/webm" }
    );

    // Upload and transcribe...
  }
};
```

### Text Capture Flow

1. User types text
2. `onCapture` callback receives text
3. Generate content using AI
4. Save to DynamoDB

```typescript
const handleCapture = async (data: CaptureData) => {
  if (data.type === "text") {
    const text = data.content as string;
    // Generate content from text...
  }
};
```

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and descriptions
- **Touch Targets**: All interactive elements ≥44px
- **Focus Management**: Automatic focus on mode switch
- **Error Messages**: Clear, actionable error messages

## Browser Compatibility

### Camera Mode

- Requires `navigator.mediaDevices.getUserMedia`
- Supported: Chrome, Safari, Firefox, Edge (modern versions)
- iOS Safari: Requires HTTPS or localhost

### Voice Mode

- Requires `MediaRecorder` API
- Requires `AudioContext` for visualization
- Supported: Chrome, Safari, Firefox, Edge (modern versions)

### Text Mode

- Universal support (standard HTML textarea)

## Performance Considerations

### Camera

- Video stream is stopped after capture to conserve battery
- Canvas is hidden to reduce memory usage
- Image compression (JPEG, 90% quality)

### Voice

- Audio chunks collected every 1 second
- Waveform visualization uses requestAnimationFrame
- Audio context cleaned up on unmount
- Recording automatically stops on component unmount

### Text

- No special performance considerations
- Standard React controlled input

## Mobile Optimization

### Touch-Friendly

- All buttons: 44px minimum height/width
- Large capture button: 64px (camera mode)
- Adequate spacing between controls
- No hover-dependent interactions

### Keyboard Optimization

- Text mode uses `text-base` to prevent iOS zoom
- Auto-focus on text input
- Proper input types for mobile keyboards

### Visual Feedback

- Mode switching animations
- Recording pulse animation
- Waveform visualization
- Loading states with spinners

## Testing

See the demo component for interactive testing:

```tsx
import { QuickCaptureInterfaceDemo } from "@/components/mobile/quick-capture-interface-demo";

// Use in a page or component
<QuickCaptureInterfaceDemo />;
```

## Requirements Validation

This component satisfies the following requirements from the mobile-agent-features spec:

- ✅ **1.1**: Display camera, voice, and text input options
- ✅ **1.2**: Capture photos with AI vision analysis integration
- ✅ **1.3**: Voice input with transcription support
- ✅ **1.4**: Submit captured content for processing
- ✅ **1.5**: Include location context when available

## Future Enhancements

- [ ] Multiple photo capture (burst mode)
- [ ] Photo filters and editing
- [ ] Voice note playback before submit
- [ ] Rich text editing for text mode
- [ ] Offline queue integration
- [ ] Photo gallery selection
- [ ] Video recording support

## Related Components

- `QuickCapture` - Original camera-only component
- `VoiceMemo` - Original voice recording component
- `Sheet` - Base bottom sheet component from shadcn/ui
- `OfflineSyncManager` - For offline queue integration

## Dependencies

- `@radix-ui/react-dialog` - Sheet/dialog primitives
- `lucide-react` - Icons
- `framer-motion` - Animations (via shadcn/ui)
- Native Web APIs:
  - `MediaDevices.getUserMedia()` - Camera/microphone access
  - `MediaRecorder` - Audio recording
  - `AudioContext` - Audio visualization
  - `Geolocation` - Location services
