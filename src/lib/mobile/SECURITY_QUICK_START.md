# Mobile Security Quick Start Guide

Get started with mobile security features in 5 minutes.

## Installation

No installation needed! All security features are built-in.

## Quick Examples

### 1. Strip EXIF from Photos (2 lines)

```typescript
import { stripExifData } from "@/lib/mobile/security";

const strippedPhoto = await stripExifData(originalPhoto);
```

### 2. Encrypt Location Data (2 lines)

```typescript
import { encryptLocationData } from "@/lib/mobile/security";

const encrypted = await encryptLocationData({
  latitude: 37.7749,
  longitude: -122.4194,
});
```

### 3. Rate Limit API Calls (3 lines)

```typescript
import { rateLimiters, withRateLimit } from "@/lib/mobile/security";

const result = await withRateLimit(userId, rateLimiters.vision, () =>
  analyzePhoto(url)
);
```

### 4. Store Tokens Securely (2 lines)

```typescript
import { storeSecureToken } from "@/lib/mobile/security";

await storeSecureToken("oauth_google", accessToken);
```

### 5. Delete Voice Recordings (2 lines)

```typescript
import { deleteVoiceRecording } from "@/lib/mobile/security";

await deleteVoiceRecording(userId, voiceNoteId);
```

## Using the React Hook

```typescript
import { useMobileSecurity } from "@/hooks/use-mobile-security";

function MyComponent() {
  const { stripPhotoExif, encryptLocation, isProcessing, error } =
    useMobileSecurity();

  const handleUpload = async (file: File) => {
    const stripped = await stripPhotoExif(file);
    if (stripped) {
      // Upload the stripped file
    }
  };

  return (
    <div>
      {error && <Alert>{error}</Alert>}
      {isProcessing && <Spinner />}
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
    </div>
  );
}
```

## Adding Privacy Settings UI

```typescript
import { PrivacySettings } from "@/components/mobile/privacy-settings";

function SettingsPage() {
  return (
    <div className="container">
      <h1>Settings</h1>
      <PrivacySettings />
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Secure Photo Upload

```typescript
async function securePhotoUpload(file: File, userId: string) {
  // 1. Strip EXIF
  const stripped = await stripExifData(file);

  // 2. Apply rate limiting
  return withRateLimit(userId, rateLimiters.share, async () => {
    // 3. Upload
    return await uploadToS3(stripped);
  });
}
```

### Pattern 2: Encrypted Location Storage

```typescript
async function saveLocationSecurely(location: LocationData, userId: string) {
  // 1. Encrypt
  const encrypted = await encryptLocationData(location);

  // 2. Save to database
  await repository.putItem({
    PK: `USER#${userId}`,
    SK: `LOCATION#${Date.now()}`,
    encryptedLocation: encrypted,
  });
}
```

### Pattern 3: Voice Note with Auto-Delete

```typescript
async function recordWithPrivacy(
  audioBlob: Blob,
  userId: string,
  autoDelete: boolean
) {
  // 1. Upload audio
  const audioUrl = await uploadAudio(audioBlob);

  // 2. Transcribe
  const transcription = await transcribe(audioUrl);

  // 3. Save
  const noteId = await saveVoiceNote({ audioUrl, transcription });

  // 4. Auto-delete if enabled
  if (autoDelete) {
    await deleteVoiceRecording(userId, noteId);
  }
}
```

## Pre-configured Rate Limiters

```typescript
import { rateLimiters } from "@/lib/mobile/security";

// Vision API: 10 requests/minute
rateLimiters.vision;

// Transcription: 20 requests/minute
rateLimiters.transcription;

// Share: 30 requests/minute
rateLimiters.share;

// Location: 60 requests/minute
rateLimiters.location;

// General: 100 requests/minute
rateLimiters.general;
```

## Error Handling

```typescript
try {
  const result = await withRateLimit(userId, rateLimiters.vision, () => {
    return analyzePhoto(url);
  });
} catch (error) {
  if (error.message.includes("Rate limit exceeded")) {
    // Show user-friendly message
    toast.error("Too many requests. Please wait a moment.");
  }
}
```

## Best Practices

### ✅ DO

```typescript
// Strip EXIF before sharing
const stripped = await stripExifData(photo);
await sharePhoto(stripped);

// Encrypt location before storing
const encrypted = await encryptLocationData(location);
await saveToDatabase({ encryptedLocation: encrypted });

// Use rate limiting for API calls
await withRateLimit(userId, rateLimiters.vision, () => analyzePhoto(url));

// Store tokens securely
await storeSecureToken("oauth_token", token);
```

### ❌ DON'T

```typescript
// Don't share photos with EXIF
await sharePhoto(originalPhoto); // Exposes GPS coordinates

// Don't store plain location
await saveToDatabase({ location }); // Not encrypted

// Don't skip rate limiting
await analyzePhoto(url); // Can be abused

// Don't use localStorage for tokens
localStorage.setItem("token", token); // Not encrypted
```

## Testing Your Implementation

### Test EXIF Stripping

```typescript
// Before
console.log(originalPhoto.size); // e.g., 2.5MB with EXIF

// After
const stripped = await stripExifData(originalPhoto);
console.log(stripped.size); // e.g., 2.3MB without EXIF
```

### Test Encryption

```typescript
const location = { latitude: 37.7749, longitude: -122.4194 };
const encrypted = await encryptLocationData(location);
console.log(encrypted); // Base64 string

const decrypted = await decryptLocationData(encrypted);
console.log(decrypted); // { latitude: 37.7749, longitude: -122.4194 }
```

### Test Rate Limiting

```typescript
// Make multiple rapid requests
for (let i = 0; i < 15; i++) {
  try {
    await withRateLimit(userId, rateLimiters.vision, () => analyzePhoto(url));
    console.log(`Request ${i + 1}: Success`);
  } catch (error) {
    console.log(`Request ${i + 1}: Rate limited`);
  }
}
```

## Troubleshooting

### Issue: "Failed to encrypt location"

**Solution:** Ensure Web Crypto API is available (HTTPS required in production)

### Issue: "Rate limit exceeded"

**Solution:** Wait for the time window to reset or increase the limit

### Issue: "Failed to strip EXIF"

**Solution:** Ensure the file is a valid image format (JPEG, PNG)

### Issue: "Token not found"

**Solution:** Check that the token was stored with the correct name

## Next Steps

1. Read the full documentation: `SECURITY_README.md`
2. Check integration examples: `security-integration-examples.ts`
3. Review the privacy settings UI: `privacy-settings.tsx`
4. Implement security in your features

## Support

For questions or issues:

1. Check the full documentation
2. Review the integration examples
3. Contact the development team

## Resources

- Full Documentation: `src/lib/mobile/SECURITY_README.md`
- Integration Examples: `src/lib/mobile/security-integration-examples.ts`
- React Hook: `src/hooks/use-mobile-security.ts`
- Privacy UI: `src/components/mobile/privacy-settings.tsx`
- API Reference: Inline documentation in `src/lib/mobile/security.ts`
