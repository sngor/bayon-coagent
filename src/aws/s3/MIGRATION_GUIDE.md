# S3 Storage Migration Guide

This document describes the migration from Firebase Storage to AWS S3 for file storage in the Bayon CoAgent application.

## Overview

Firebase Storage has been replaced with AWS S3 for all file storage operations. This includes:

- Profile images
- Document uploads
- Any other file storage needs

## What Changed

### 1. Storage Backend

- **Before**: Firebase Storage (`firebasestorage.googleapis.com`)
- **After**: AWS S3 (with LocalStack for local development)

### 2. Image URLs

- **Before**: `https://firebasestorage.googleapis.com/...`
- **After**:
  - Production: `https://{bucket}.s3.{region}.amazonaws.com/...`
  - Local: `http://localhost:4566/{bucket}/...`

### 3. Next.js Image Configuration

The `next.config.ts` has been updated to allow S3 URLs:

```typescript
{
  protocol: 'https',
  hostname: '*.s3.*.amazonaws.com',
  port: '',
  pathname: '/**',
}
```

## New Components and Hooks

### 1. `useS3Upload` Hook

A React hook for uploading files to S3 with progress tracking:

```typescript
import { useS3Upload } from "@/hooks/use-s3-upload";

const { upload, isUploading, error, uploadedUrl, progress } = useS3Upload({
  maxSizeMB: 5,
  allowedTypes: ["image/jpeg", "image/png"],
  onSuccess: (url) => console.log("Uploaded:", url),
  onError: (err) => console.error("Error:", err),
});

// Upload a file
await upload(file, userId, "profile-image");
```

### 2. `S3FileUpload` Component

A reusable file upload component:

```tsx
import { S3FileUpload } from "@/components/s3-file-upload";

<S3FileUpload
  userId={user.uid}
  fileType="document"
  accept="image/*"
  maxSizeMB={10}
  onUploadComplete={(url) => console.log("Uploaded:", url)}
  showPreview
/>;
```

### 3. `ProfileImageUpload` Component

A specialized component for profile images with avatar preview:

```tsx
import { ProfileImageUpload } from "@/components/profile-image-upload";

<ProfileImageUpload
  userId={user.uid}
  currentImageUrl={profile.photoURL}
  userName={profile.name}
  onImageUpdate={(url) => updateProfile({ photoURL: url })}
  size="lg"
/>;
```

## Server Actions

### 1. `uploadFileToS3Action`

Uploads a file to S3 and returns the URL:

```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("userId", userId);
formData.append("fileType", "profile-image");

const result = await uploadFileToS3Action(formData);
if (result.success) {
  console.log("URL:", result.url);
}
```

### 2. `getPresignedUrlAction`

Generates a presigned URL for secure file access:

```typescript
const result = await getPresignedUrlAction(key, 3600); // 1 hour expiry
if (result.success) {
  console.log("Presigned URL:", result.url);
}
```

### 3. `deleteFileFromS3Action`

Deletes a file from S3:

```typescript
const result = await deleteFileFromS3Action(key);
if (result.success) {
  console.log("File deleted");
}
```

## S3 Client Functions

The S3 client (`src/aws/s3/client.ts`) provides low-level functions:

- `uploadFile(key, file, contentType, metadata)` - Upload a file
- `downloadFile(key)` - Download a file as Buffer
- `getPresignedUrl(key, expiresIn)` - Get presigned URL for download
- `getPresignedUploadUrl(key, contentType, expiresIn)` - Get presigned URL for upload
- `deleteFile(key)` - Delete a file
- `listFiles(prefix, maxKeys)` - List files with prefix
- `fileExists(key)` - Check if file exists
- `copyFile(sourceKey, destinationKey)` - Copy a file

## File Key Structure

Files are organized in S3 with the following structure:

```
users/{userId}/{fileType}/{timestamp}-{filename}
```

Examples:

- `users/user123/profile-image/1234567890-avatar.jpg`
- `users/user123/document/1234567890-contract.pdf`

## Local Development

For local development, files are stored in LocalStack S3:

1. Start LocalStack:

   ```bash
   npm run localstack:start
   ```

2. Initialize LocalStack (creates S3 bucket):

   ```bash
   npm run localstack:init
   ```

3. Files will be accessible at:
   ```
   http://localhost:4566/{bucket-name}/{key}
   ```

## Environment Variables

Required environment variables:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# S3 Configuration
S3_BUCKET_NAME=bayon-coagent-storage

# Local Development
USE_LOCAL_AWS=true  # Set to true for local development
```

## Migration Checklist

- [x] S3 client implementation
- [x] Server actions for file upload/download/delete
- [x] React hooks for S3 uploads
- [x] Reusable upload components
- [x] Profile image upload integration
- [x] Next.js image configuration updated
- [x] Firebase Storage references removed from next.config.ts
- [ ] Migrate existing files from Firebase Storage to S3 (if any)
- [ ] Update any hardcoded Firebase Storage URLs in database

## Testing

### Test File Upload

1. Go to the Profile page
2. Click on the profile image or "Change Photo" button
3. Select an image file
4. Verify the upload completes successfully
5. Verify the image displays correctly

### Test Local Development

1. Ensure LocalStack is running
2. Upload a file
3. Check LocalStack logs: `npm run localstack:logs`
4. Verify file appears in LocalStack S3

### Test Production

1. Deploy to AWS
2. Upload a file
3. Verify file is stored in S3 bucket
4. Verify presigned URLs work correctly

## Troubleshooting

### Upload Fails

- Check AWS credentials are configured
- Verify S3 bucket exists
- Check bucket permissions
- Review CloudWatch logs for errors

### Images Don't Display

- Verify Next.js image configuration includes S3 domains
- Check CORS configuration on S3 bucket
- Verify presigned URLs are not expired

### LocalStack Issues

- Ensure LocalStack is running: `docker ps`
- Check LocalStack logs: `npm run localstack:logs`
- Restart LocalStack: `npm run localstack:stop && npm run localstack:start`

## Security Considerations

1. **File Size Limits**: Maximum 10MB per file (configurable)
2. **File Type Validation**: Only allowed file types can be uploaded
3. **User Isolation**: Files are stored under user-specific paths
4. **Presigned URLs**: Temporary URLs expire after specified time
5. **CORS**: Configured to allow uploads from application domain only

## Future Enhancements

- [ ] Add image resizing/optimization before upload
- [ ] Implement CDN (CloudFront) for faster file delivery
- [ ] Add file versioning
- [ ] Implement file encryption at rest
- [ ] Add virus scanning for uploaded files
- [ ] Implement file upload progress for large files
- [ ] Add batch file operations
