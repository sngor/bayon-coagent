# Quick Capture Interface - Testing Guide

## Manual Testing Checklist

### Setup

1. **Enable HTTPS or use localhost**

   - Camera and microphone require secure context (HTTPS or localhost)
   - For local testing: `npm run dev` (runs on localhost:3000)

2. **Grant Permissions**
   - Allow camera access when prompted
   - Allow microphone access when prompted
   - Allow location access when prompted (optional)

### Camera Mode Testing

#### ✅ Basic Functionality

- [ ] Click "Open Quick Capture" button
- [ ] Bottom sheet slides up from bottom
- [ ] Camera mode is selected by default
- [ ] "Start Camera" button is visible
- [ ] Click "Start Camera"
- [ ] Camera preview appears
- [ ] Video stream is live and updating

#### ✅ Camera Controls

- [ ] Capture button (large white circle) is visible at bottom
- [ ] Rotate button is visible (left side)
- [ ] Click rotate button - camera switches between front/back
- [ ] Click capture button - photo is captured
- [ ] Camera stream stops after capture
- [ ] Captured photo preview is displayed

#### ✅ Photo Review

- [ ] "Retake" button is visible
- [ ] "Submit" button is visible
- [ ] Click "Retake" - returns to camera view
- [ ] Capture another photo
- [ ] Click "Submit" - triggers onCapture callback
- [ ] Bottom sheet closes after submission

#### ✅ Error Handling

- [ ] Deny camera permission - error message displays
- [ ] Error message is clear and actionable
- [ ] "Try Again" button appears
- [ ] Click "Try Again" - re-requests permission

### Voice Mode Testing

#### ✅ Basic Functionality

- [ ] Open Quick Capture
- [ ] Click "Voice" mode button
- [ ] Voice mode activates with visual feedback
- [ ] "Start Recording" button is visible
- [ ] Click "Start Recording"
- [ ] Recording indicator appears (pulsing red circle)
- [ ] Timer starts counting (0:00, 0:01, 0:02...)

#### ✅ Waveform Visualization

- [ ] Waveform bars are visible
- [ ] Bars animate in response to audio input
- [ ] Speak into microphone - bars increase in height
- [ ] Stop speaking - bars decrease in height
- [ ] Visual feedback is smooth and responsive

#### ✅ Recording Controls

- [ ] Pause button is visible during recording
- [ ] Click pause - recording pauses
- [ ] Timer stops
- [ ] "Recording paused" message displays
- [ ] Click pause again (now play icon) - recording resumes
- [ ] Timer continues from where it stopped
- [ ] Stop button (square) is visible
- [ ] Click stop - recording ends

#### ✅ Recording Review

- [ ] Recording complete screen displays
- [ ] Green checkmark icon shows
- [ ] Duration is displayed correctly
- [ ] "Discard" button is visible
- [ ] "Submit" button is visible
- [ ] Click "Discard" - returns to initial state
- [ ] Record again and click "Submit"
- [ ] Triggers onCapture callback with audio blob
- [ ] Bottom sheet closes

#### ✅ Error Handling

- [ ] Deny microphone permission - error message displays
- [ ] Error is clear and actionable
- [ ] "Try Again" button works

### Text Mode Testing

#### ✅ Basic Functionality

- [ ] Open Quick Capture
- [ ] Click "Text" mode button
- [ ] Text mode activates
- [ ] Textarea is visible and focused
- [ ] Keyboard appears automatically (mobile)
- [ ] Placeholder text is visible

#### ✅ Text Input

- [ ] Type text into textarea
- [ ] Character count updates in real-time
- [ ] Word count updates in real-time
- [ ] Counts are accurate
- [ ] Submit button is disabled when empty
- [ ] Submit button enables when text is entered

#### ✅ Submission

- [ ] Type some text
- [ ] Click "Submit" button
- [ ] Triggers onCapture callback with text
- [ ] Bottom sheet closes
- [ ] Text is trimmed (no leading/trailing whitespace)

#### ✅ Mobile Keyboard Optimization

- [ ] On mobile: textarea uses text-base font size
- [ ] iOS: no zoom when focusing textarea
- [ ] Android: keyboard appears smoothly
- [ ] Textarea is scrollable for long text

### Mode Switching Testing

#### ✅ Visual Feedback

- [ ] Active mode button has different styling
- [ ] Active mode button is slightly larger (scale-105)
- [ ] Active mode button has shadow
- [ ] Icon animates when mode becomes active
- [ ] Transition is smooth

#### ✅ State Management

- [ ] Switch from Camera to Voice - camera stops
- [ ] Switch from Voice to Text - recording stops (if active)
- [ ] Switch from Text to Camera - text is cleared
- [ ] Mode state persists while sheet is open
- [ ] Mode resets to default when sheet closes

### Location Testing

#### ✅ Location Capture

- [ ] Open Quick Capture with enableLocation={true}
- [ ] Location permission is requested
- [ ] Grant permission
- [ ] Capture content in any mode
- [ ] Verify location is included in capture data
- [ ] Check latitude and longitude are present
- [ ] Coordinates are reasonable values

#### ✅ Location Disabled

- [ ] Open Quick Capture with enableLocation={false}
- [ ] No location permission request
- [ ] Capture content
- [ ] Verify location is undefined in capture data

### Touch-Friendly Testing

#### ✅ Touch Targets

- [ ] All buttons are at least 44px × 44px
- [ ] Mode buttons are easy to tap
- [ ] Camera capture button is large (64px)
- [ ] Adequate spacing between buttons
- [ ] No accidental taps on adjacent buttons

#### ✅ One-Handed Use

- [ ] Bottom sheet is reachable with thumb
- [ ] Controls are positioned for thumb access
- [ ] Sheet can be dismissed by swiping down
- [ ] Close button (X) is easily reachable

### Responsive Testing

#### ✅ Different Screen Sizes

- [ ] Test on iPhone SE (small screen)
- [ ] Test on iPhone 14 Pro (medium screen)
- [ ] Test on iPhone 14 Pro Max (large screen)
- [ ] Test on iPad (tablet)
- [ ] Test on Android phone
- [ ] Bottom sheet height adapts (85vh max)
- [ ] Content is not cut off
- [ ] Scrolling works when needed

#### ✅ Orientation

- [ ] Test in portrait mode
- [ ] Test in landscape mode
- [ ] Camera preview adapts to orientation
- [ ] Controls remain accessible
- [ ] No horizontal scrolling

### Performance Testing

#### ✅ Camera Performance

- [ ] Camera starts within 2 seconds
- [ ] Video preview is smooth (no lag)
- [ ] Photo capture is instant
- [ ] Camera stops immediately after capture
- [ ] No memory leaks (test multiple captures)

#### ✅ Voice Performance

- [ ] Recording starts immediately
- [ ] Waveform animation is smooth (60fps)
- [ ] No audio glitches or stuttering
- [ ] Recording stops cleanly
- [ ] Audio context is cleaned up

#### ✅ Battery Impact

- [ ] Camera stops when not in use
- [ ] Microphone stops when not recording
- [ ] No background processing when closed
- [ ] Animations use requestAnimationFrame

### Accessibility Testing

#### ✅ Screen Reader

- [ ] All buttons have accessible labels
- [ ] Mode buttons announce current state
- [ ] Error messages are announced
- [ ] Success states are announced

#### ✅ Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus indicators are visible
- [ ] Enter/Space activates buttons
- [ ] Escape closes bottom sheet

### Integration Testing

#### ✅ Data Flow

- [ ] Capture photo - verify File object in callback
- [ ] Capture voice - verify Blob object in callback
- [ ] Capture text - verify string in callback
- [ ] Verify timestamp is present
- [ ] Verify metadata is present
- [ ] Verify location when enabled

#### ✅ Error Recovery

- [ ] Handle camera access denied gracefully
- [ ] Handle microphone access denied gracefully
- [ ] Handle location access denied gracefully
- [ ] Handle network errors (if applicable)
- [ ] Handle component unmount during capture

## Browser Compatibility

### ✅ Chrome/Edge (Desktop & Mobile)

- [ ] All features work
- [ ] Camera: ✅
- [ ] Microphone: ✅
- [ ] Waveform: ✅

### ✅ Safari (Desktop & Mobile)

- [ ] All features work
- [ ] Camera: ✅
- [ ] Microphone: ✅
- [ ] Waveform: ✅
- [ ] Note: Requires HTTPS or localhost

### ✅ Firefox (Desktop & Mobile)

- [ ] All features work
- [ ] Camera: ✅
- [ ] Microphone: ✅
- [ ] Waveform: ✅

## Known Issues

### iOS Safari

- Camera and microphone require HTTPS (not just localhost)
- First camera access may require page reload
- Waveform visualization may have slight delay

### Android Chrome

- Camera permission dialog may appear twice
- Microphone may require explicit permission in settings

### Desktop Browsers

- Camera selection may show multiple devices
- Microphone selection may show multiple devices
- Use device settings to set default camera/microphone

## Automated Testing

For automated testing, see:

- `src/components/mobile/__tests__/quick-capture-interface.test.tsx`

Note: Camera and microphone APIs require mocking in test environment.

## Demo Page

To test the component interactively:

```tsx
import { QuickCaptureInterfaceDemo } from "@/components/mobile/quick-capture-interface-demo";

// In your page
<QuickCaptureInterfaceDemo />;
```

## Reporting Issues

When reporting issues, please include:

1. Device/browser information
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots/videos if possible
5. Console errors (if any)
