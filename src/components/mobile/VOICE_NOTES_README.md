# Voice Notes System

Complete implementation of the Voice Notes system for mobile agents, including recording, transcription, property attachment, photo capture, and cloud sync.

## Overview

The Voice Notes system enables real estate agents to capture voice memos on-the-go with rich metadata including property attachments, photos, location data, and automatic transcription.

## Components

### 1. VoiceNotesRecorder (`voice-notes-recorder.tsx`)

Main recording component with full feature set.

**Features:**

- MediaRecorder API integration for audio capture
- Pause/resume recording support
- Real-time duration tracking
- Audio playback preview
- Property ID and address attachment
- Photo capture integration (multiple photos)
- Automatic location capture via Geolocation API
- Additional text notes field
- Touch-optimized UI (44px minimum touch targets)

**Props:**

```typescript
interface VoiceNotesRecorderProps {
  userId: string;
  propertyId?: string;
  propertyAddress?: string;
  onSave: (note: VoiceNoteData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}
```

**Usage:**

```tsx
<VoiceNotesRecorder
  userId={user.id}
  propertyId="prop-123"
  propertyAddress="123 Main St"
  onSave={handleSave}
  onCancel={handleCancel}
/>
```

### 2. VoiceNotesList (`voice-notes-list.tsx`)

Display and manage voice notes list.

**Features:**

- Audio playback controls
- Transcription display with confidence scores
- Property attachment information
- Photo thumbnails
- Location metadata
- Expandable details view
- Delete functionality
- Sync status indicators

**Props:**

```typescript
interface VoiceNotesListProps {
  notes: VoiceNote[];
  onDelete?: (noteId: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  propertyFilter?: string;
  className?: string;
}
```

### 3. VoiceNotesManager (`voice-notes-manager.tsx`)

Complete integration component that combines recording and list management.

**Features:**

- Integrated recorder and list view
- Property filtering
- Refresh functionality
- Sheet-based UI for mobile
- Toast notifications
- Loading states

**Props:**

```typescript
interface VoiceNotesManagerProps {
  userId: string;
  propertyId?: string;
  propertyAddress?: string;
  className?: string;
}
```

**Usage:**

```tsx
<VoiceNotesManager
  userId={user.id}
  propertyId="prop-123"
  propertyAddress="123 Main St"
/>
```

### 4. VoiceNotesDemo (`voice-notes-demo.tsx`)

Demonstration component showcasing all features with documentation.

## Services

### Voice Notes Service (`lib/mobile/voice-notes-service.ts`)

Backend service handling all voice note operations.

**Functions:**

#### `saveVoiceNote(options: SaveVoiceNoteOptions)`

Saves a voice note with all metadata. Handles both online and offline scenarios.

**Online Flow:**

1. Uploads audio to S3
2. Compresses and uploads photos to S3
3. Saves metadata to DynamoDB
4. Returns note ID and metadata

**Offline Flow:**

1. Converts audio/photos to base64
2. Queues operation for later sync
3. Returns note ID

#### `getVoiceNotes(userId: string, limit?: number)`

Retrieves voice notes for a user, sorted by most recent first.

#### `getVoiceNotesForProperty(userId: string, propertyId: string)`

Retrieves voice notes filtered by property ID.

#### `deleteVoiceNote(userId: string, noteId: string)`

Deletes a voice note from DynamoDB.

#### `updateVoiceNoteTranscription(userId: string, noteId: string, transcription: TranscriptionResult)`

Updates a voice note with transcription results.

**Helper Functions:**

- `compressImage(file: File, maxSizeMB?: number)`: Compresses images for mobile upload
- `uploadAudio(userId: string, noteId: string, audioBlob: Blob)`: Uploads audio to S3
- `uploadPhotos(userId: string, noteId: string, photos: File[])`: Uploads and compresses photos

## Server Actions

Located in `features/client-dashboards/actions/mobile-actions.ts`:

### `saveVoiceNoteAction(prevState, formData)`

Server action for saving voice notes.

**FormData Fields:**

- `audioFile`: Audio file blob
- `duration`: Recording duration in seconds
- `propertyId`: Optional property ID
- `propertyAddress`: Optional property address
- `notes`: Optional text notes
- `location`: Optional JSON-encoded location data
- `photo0`, `photo1`, etc.: Optional photo files

**Returns:**

```typescript
{
  message: string;
  success: boolean;
  data: {
    noteId?: string;
    transcription?: string;
    audioUrl?: string;
  } | null;
  errors: any;
}
```

### `getVoiceNotesAction(propertyId?: string)`

Retrieves voice notes, optionally filtered by property.

### `deleteVoiceNoteAction(noteId: string)`

Deletes a voice note.

## Data Model

### DynamoDB Schema

**Entity Type:** `VoiceNote`

**Keys:**

- `PK`: `USER#${userId}`
- `SK`: `VOICENOTE#${noteId}`

**Attributes:**

```typescript
interface VoiceNoteMetadata {
  id: string;
  userId: string;
  audioUrl: string;
  audioS3Key: string;
  duration: number;
  transcription?: string;
  transcriptionConfidence?: number;
  propertyId?: string;
  propertyAddress?: string;
  photoUrls?: string[];
  photoS3Keys?: string[];
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  notes?: string;
  timestamp: number;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}
```

### S3 Storage Structure

**Audio Files:**

```
users/{userId}/voice-notes/{noteId}/audio-{timestamp}.{ext}
```

**Photo Files:**

```
users/{userId}/voice-notes/{noteId}/photo-{index}-{timestamp}.jpg
```

## Features Implementation

### ✅ 4.1 Voice Note Recorder Component

- MediaRecorder API integration
- Pause/resume support
- Real-time duration display
- Audio playback preview

### ✅ 4.2 Quick Note Button

- Integrated into VoiceNotesManager
- Sheet-based UI for mobile
- Touch-optimized controls

### ✅ 4.3 Audio Transcription

- AWS Transcribe integration via Bedrock flow
- Confidence scoring
- Real estate terminology support
- Property attachment to transcribed notes

### ✅ 4.4 Photo Capture Integration

- Multiple photo support
- Automatic compression (max 1920px width, 85% quality)
- JPEG conversion for consistency
- Thumbnail display in list view

### ✅ 4.5 Cloud Sync

- Automatic S3 upload for audio and photos
- DynamoDB metadata storage
- Offline queue support via offlineSyncManager
- Sync status indicators
- Cross-device accessibility

## Browser Requirements

- **MediaRecorder API**: Chrome 47+, Firefox 25+, Safari 14.1+, Edge 79+
- **Geolocation API**: All modern browsers
- **File API**: All modern browsers
- **Canvas API**: All modern browsers (for image compression)

## Permissions Required

1. **Microphone**: Required for audio recording
2. **Camera**: Optional, for photo capture
3. **Location**: Optional, for location metadata

## Usage Example

```tsx
"use client";

import { VoiceNotesManager } from "@/components/mobile";
import { getCurrentUser } from "@/aws/auth/cognito-client";

export default async function VoiceNotesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <VoiceNotesManager
        userId={user.id}
        propertyId="prop-123"
        propertyAddress="123 Main St, City, State"
      />
    </div>
  );
}
```

## Offline Support

The system fully supports offline operation:

1. **Recording**: Works offline (audio stored in memory)
2. **Photo Capture**: Works offline (photos stored in memory)
3. **Location**: Works offline (if previously granted)
4. **Saving**: Queued for sync when offline
5. **Sync**: Automatic when connection restored

Offline operations are queued using the `offlineSyncManager` and will be processed when connectivity is restored.

## Testing

### Manual Testing Checklist

- [ ] Record audio with microphone
- [ ] Pause and resume recording
- [ ] Stop recording and playback
- [ ] Attach property ID and address
- [ ] Capture multiple photos
- [ ] Add text notes
- [ ] Save with location data
- [ ] View saved notes in list
- [ ] Play audio from list
- [ ] Expand note details
- [ ] Delete note
- [ ] Filter by property
- [ ] Test offline recording
- [ ] Verify sync after reconnection

### Browser Testing

Test on:

- [ ] Chrome (desktop and mobile)
- [ ] Safari (iOS)
- [ ] Firefox (desktop and mobile)
- [ ] Edge

## Performance Considerations

1. **Audio Compression**: Uses WebM or MP4 format based on browser support
2. **Image Compression**: Reduces images to max 1920px width at 85% quality
3. **Lazy Loading**: Audio elements created on-demand
4. **Pagination**: List limited to 50 notes by default
5. **Presigned URLs**: 1-hour expiration for S3 access

## Security

1. **Authentication**: All operations require authenticated user
2. **Authorization**: Users can only access their own notes
3. **S3 Security**: Presigned URLs with expiration
4. **Data Encryption**: S3 encryption at rest
5. **Input Validation**: Zod schemas for all inputs

## Future Enhancements

- [ ] Real-time transcription during recording
- [ ] Voice note sharing
- [ ] Voice note search by transcription
- [ ] Voice note categories/tags
- [ ] Batch operations (delete multiple)
- [ ] Export voice notes
- [ ] Voice note analytics
- [ ] Integration with calendar/tasks

## Requirements Validation

This implementation satisfies all requirements from the design document:

- **Requirement 4.1**: ✅ Quick note button with voice recording
- **Requirement 4.2**: ✅ Voice recording and photo capture options
- **Requirement 4.3**: ✅ Transcription and property attachment
- **Requirement 4.4**: ✅ Photo compression and location metadata
- **Requirement 4.5**: ✅ Cloud sync across devices

## Related Files

- `src/components/mobile/voice-notes-recorder.tsx`
- `src/components/mobile/voice-notes-list.tsx`
- `src/components/mobile/voice-notes-manager.tsx`
- `src/components/mobile/voice-notes-demo.tsx`
- `src/lib/mobile/voice-notes-service.ts`
- `src/lib/mobile/device-apis.ts`
- `src/features/client-dashboards/actions/mobile-actions.ts`
- `src/aws/bedrock/flows/transcribe-audio.ts`
