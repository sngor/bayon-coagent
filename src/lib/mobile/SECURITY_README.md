# Mobile Security and Privacy Features

This document describes the security and privacy features implemented for mobile agent functionality.

## Overview

The mobile security module provides comprehensive protection for sensitive user data including:

- **Location Data Encryption**: AES-256-GCM encryption for location coordinates
- **Voice Recording Deletion**: Secure deletion of audio files with optional auto-delete
- **EXIF Data Stripping**: Removal of metadata from photos before sharing
- **Secure Token Storage**: Encrypted storage of authentication tokens in IndexedDB
- **Rate Limiting**: Protection against API abuse and excessive usage

## Features

### 1. Location Data Encryption

Location data is encrypted using the Web Crypto API with AES-256-GCM encryption before storage.

#### Usage

```typescript
import {
  encryptLocationData,
  decryptLocationData,
} from "@/lib/mobile/security";

// Encrypt location before storing
const location = { latitude: 37.7749, longitude: -122.4194, accuracy: 10 };
const encrypted = await encryptLocationData(location);

// Store encrypted location in database
await repository.putItem({
  PK: `USER#${userId}`,
  SK: `CHECKIN#${Date.now()}`,
  encryptedLocation: encrypted,
  // ... other fields
});

// Decrypt when retrieving
const decrypted = await decryptLocationData(encrypted);
console.log(decrypted); // { latitude: 37.7749, longitude: -122.4194, accuracy: 10 }
```

#### Security Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Storage**: Encryption keys stored in IndexedDB
- **Key Generation**: Automatic key generation on first use
- **IV**: Random 12-byte initialization vector per encryption
- **Format**: Base64-encoded (IV + encrypted data)

### 2. Voice Recording Deletion

Provides secure deletion of voice recordings from both S3 and DynamoDB.

#### Usage

```typescript
import {
  deleteVoiceRecording,
  deleteAllVoiceRecordings,
} from "@/lib/mobile/security";

// Delete a single voice recording
const result = await deleteVoiceRecording(userId, voiceNoteId);
if (result.success) {
  console.log("Voice recording deleted");
}

// Delete all voice recordings for a user
const bulkResult = await deleteAllVoiceRecordings(userId);
console.log(`Deleted ${bulkResult.deletedCount} recordings`);
```

#### Features

- Deletes audio files from S3
- Removes database records from DynamoDB
- Supports bulk deletion
- Optional auto-delete after transcription
- Preserves transcription text while deleting audio

### 3. EXIF Data Stripping

Removes metadata from photos including GPS coordinates, camera information, and timestamps.

#### Usage

```typescript
import { stripExifData, stripExifDataBatch } from "@/lib/mobile/security";

// Strip EXIF from a single photo
const originalFile = new File([blob], "photo.jpg", { type: "image/jpeg" });
const strippedFile = await stripExifData(originalFile);

// Strip EXIF from multiple photos
const photos = [file1, file2, file3];
const strippedPhotos = await stripExifDataBatch(photos);
```

#### What Gets Removed

- GPS coordinates (latitude, longitude)
- Camera make and model
- Capture timestamp
- Software information
- Copyright information
- All other EXIF metadata

#### Implementation

Uses HTML5 Canvas to redraw images, which naturally strips all metadata while preserving image quality (95% JPEG quality).

### 4. Secure Token Storage

Encrypted storage for authentication tokens and sensitive credentials.

#### Usage

```typescript
import {
  storeSecureToken,
  getSecureToken,
  deleteSecureToken,
} from "@/lib/mobile/security";

// Store a token securely
await storeSecureToken("oauth_google_access", accessToken);

// Retrieve a token
const token = await getSecureToken("oauth_google_access");

// Delete a token
await deleteSecureToken("oauth_google_access");
```

#### Security Details

- **Storage**: IndexedDB (more secure than localStorage)
- **Encryption**: AES-256-GCM encryption
- **Key Management**: Automatic key generation and storage
- **Isolation**: Tokens isolated per origin

#### Common Use Cases

- OAuth access tokens
- OAuth refresh tokens
- API keys
- Session tokens
- Temporary credentials

### 5. Rate Limiting

Client-side rate limiting to prevent API abuse and excessive usage.

#### Pre-configured Limiters

```typescript
import { rateLimiters, withRateLimit } from "@/lib/mobile/security";

// Available limiters:
// - vision: 10 requests per minute
// - transcription: 20 requests per minute
// - share: 30 requests per minute
// - location: 60 requests per minute
// - general: 100 requests per minute
```

#### Usage

```typescript
// Apply rate limiting to an API call
const result = await withRateLimit(
  userId, // Rate limit key
  rateLimiters.vision, // Limiter to use
  async () => {
    // Your API call here
    return await analyzePhoto(photoUrl);
  }
);

// Check current usage
const usage = rateLimiters.vision.getUsage(userId);
if (usage) {
  console.log(`Used: ${usage.count}, Remaining: ${usage.remaining}`);
}

// Reset rate limit for a key
rateLimiters.vision.reset(userId);
```

#### Custom Rate Limiter

```typescript
import { RateLimiter } from "@/lib/mobile/security";

const customLimiter = new RateLimiter({
  maxRequests: 50,
  windowMs: 60000, // 1 minute
});

const result = await customLimiter.checkLimit(userId);
if (!result.allowed) {
  console.log(`Rate limited. Retry after ${result.retryAfter} seconds`);
}
```

## React Integration

### Using the Hook

```typescript
import { useMobileSecurity } from "@/hooks/use-mobile-security";

function MyComponent() {
  const {
    isProcessing,
    error,
    encryptLocation,
    stripPhotoExif,
    storeToken,
    withRateLimitProtection,
  } = useMobileSecurity();

  const handlePhotoUpload = async (file: File) => {
    // Strip EXIF before upload
    const stripped = await stripPhotoExif(file);
    if (stripped) {
      // Upload the stripped file
      await uploadPhoto(stripped);
    }
  };

  const handleLocationSave = async (location: LocationData) => {
    // Encrypt before saving
    const encrypted = await encryptLocation(location);
    if (encrypted) {
      await saveLocation(encrypted);
    }
  };

  return (
    <div>
      {error && <Alert>{error}</Alert>}
      {isProcessing && <Spinner />}
      {/* Your UI */}
    </div>
  );
}
```

### Privacy Settings Component

```typescript
import { PrivacySettings } from "@/components/mobile/privacy-settings";

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <PrivacySettings />
    </div>
  );
}
```

## Complete Integration Examples

### Example 1: Secure Photo Capture and Share

```typescript
async function captureAndSharePhoto(userId: string, propertyId: string) {
  // 1. Capture photo
  const file = await capturePhoto();

  // 2. Strip EXIF data
  const strippedFile = await stripExifData(file);

  // 3. Apply rate limiting
  const result = await withRateLimit(userId, rateLimiters.share, async () => {
    // 4. Upload to S3
    const url = await uploadPhoto(strippedFile);

    // 5. Create share record
    return await createShare(propertyId, url);
  });

  return result;
}
```

### Example 2: Voice Note with Privacy

```typescript
async function recordVoiceNote(
  userId: string,
  propertyId: string,
  autoDelete: boolean
) {
  // 1. Record audio
  const audioBlob = await recordAudio();

  // 2. Apply rate limiting
  const result = await withRateLimit(
    userId,
    rateLimiters.transcription,
    async () => {
      // 3. Upload audio
      const audioUrl = await uploadAudio(audioBlob);

      // 4. Transcribe
      const transcription = await transcribeAudio(audioUrl);

      // 5. Save voice note
      const voiceNoteId = await saveVoiceNote({
        userId,
        propertyId,
        audioUrl,
        transcription,
      });

      // 6. Auto-delete if enabled
      if (autoDelete) {
        await deleteVoiceRecording(userId, voiceNoteId);
      }

      return { voiceNoteId, transcription };
    }
  );

  return result;
}
```

### Example 3: Location Check-in with Encryption

```typescript
async function checkInAtProperty(
  userId: string,
  propertyId: string,
  location: LocationData
) {
  // 1. Encrypt location
  const encryptedLocation = await encryptLocationData(location);

  // 2. Apply rate limiting
  const result = await withRateLimit(
    userId,
    rateLimiters.location,
    async () => {
      // 3. Save check-in
      return await saveCheckIn({
        userId,
        propertyId,
        encryptedLocation,
        timestamp: Date.now(),
      });
    }
  );

  return result;
}
```

## Privacy Best Practices

### 1. Always Encrypt Location Data

```typescript
// ✅ Good: Encrypt before storing
const encrypted = await encryptLocationData(location);
await saveToDatabase({ encryptedLocation: encrypted });

// ❌ Bad: Store plain location
await saveToDatabase({ location }); // Exposes user location
```

### 2. Strip EXIF Before Sharing

```typescript
// ✅ Good: Strip EXIF before sharing
const stripped = await stripExifData(photo);
await sharePhoto(stripped);

// ❌ Bad: Share original photo
await sharePhoto(photo); // Exposes GPS coordinates
```

### 3. Use Secure Token Storage

```typescript
// ✅ Good: Use encrypted storage
await storeSecureToken("oauth_token", token);

// ❌ Bad: Use localStorage
localStorage.setItem("oauth_token", token); // Not encrypted
```

### 4. Apply Rate Limiting

```typescript
// ✅ Good: Apply rate limiting
await withRateLimit(userId, rateLimiters.vision, () => analyzePhoto(url));

// ❌ Bad: No rate limiting
await analyzePhoto(url); // Can be abused
```

### 5. Provide User Control

```typescript
// ✅ Good: Let users control their data
<PrivacySettings />

// ✅ Good: Offer auto-delete option
<Switch
  label="Auto-delete recordings after transcription"
  checked={autoDelete}
  onChange={setAutoDelete}
/>
```

## Security Considerations

### Encryption Key Management

- Keys are generated automatically on first use
- Keys are stored in IndexedDB (not accessible to other origins)
- Keys persist across sessions
- Users can clear keys via privacy settings

### Token Security

- Tokens are encrypted before storage
- Tokens are isolated per origin
- Tokens can be deleted individually or in bulk
- Token storage is more secure than localStorage

### Rate Limiting

- Client-side rate limiting is a first line of defense
- Server-side rate limiting should also be implemented
- Rate limits are per-user to prevent abuse
- Rate limits reset automatically after the time window

### Data Deletion

- Voice recordings are deleted from both S3 and DynamoDB
- EXIF stripping is irreversible (creates new file)
- Location encryption keys can be cleared
- All security data can be cleared via privacy settings

## API Reference

See the inline documentation in `src/lib/mobile/security.ts` for detailed API documentation.

## Testing

Security features should be tested with:

1. Unit tests for encryption/decryption
2. Integration tests for complete flows
3. Manual testing on real devices
4. Privacy audits for data handling

## Compliance

These security features help comply with:

- GDPR (data encryption, user control)
- CCPA (data deletion, user privacy)
- Mobile app store requirements
- Industry best practices

## Support

For questions or issues with security features, please contact the development team.
