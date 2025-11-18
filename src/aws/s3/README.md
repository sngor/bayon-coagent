# AWS S3 Storage Module

This module provides a comprehensive interface for interacting with AWS S3 storage, including support for local development using LocalStack.

## Features

- ✅ File upload with automatic multipart support for large files (>5MB)
- ✅ File download
- ✅ Presigned URL generation for secure temporary access
- ✅ Presigned upload URLs for direct browser uploads
- ✅ File deletion
- ✅ File listing with optional metadata
- ✅ File existence checking
- ✅ File copying within S3
- ✅ LocalStack support for local development
- ✅ TypeScript support with full type safety

## Installation

The required dependencies are already installed:

```json
{
  "@aws-sdk/client-s3": "^3.933.0",
  "@aws-sdk/s3-request-presigner": "^3.933.0"
}
```

## Configuration

The S3 client uses the centralized AWS configuration from `src/aws/config.ts`. Configure via environment variables:

### Local Development (.env.local)

```env
USE_LOCAL_AWS=true
AWS_REGION=us-east-1
S3_BUCKET_NAME=bayon-coagent-storage
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### Production (.env.production)

```env
AWS_REGION=us-east-1
S3_BUCKET_NAME=bayon-coagent-storage-prod
# AWS credentials should come from IAM roles in production
```

## Usage

### Basic File Upload

```typescript
import { uploadFile } from "@/aws/s3";

// Upload a file
const buffer = Buffer.from("Hello, World!");
const url = await uploadFile("users/123/document.txt", buffer, "text/plain");

console.log("File uploaded to:", url);
```

### Upload with Metadata

```typescript
import { uploadFile } from "@/aws/s3";

const url = await uploadFile(
  "users/123/profile.jpg",
  imageBuffer,
  "image/jpeg",
  {
    uploadedBy: "user123",
    originalName: "profile-photo.jpg",
    uploadDate: new Date().toISOString(),
  }
);
```

### Large File Upload (Automatic Multipart)

Files larger than 5MB automatically use multipart upload:

```typescript
import { uploadFile } from "@/aws/s3";

// This will automatically use multipart upload
const largeFileBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
const url = await uploadFile(
  "users/123/large-video.mp4",
  largeFileBuffer,
  "video/mp4"
);
```

### Download File

```typescript
import { downloadFile } from "@/aws/s3";

const buffer = await downloadFile("users/123/document.pdf");

// Convert to base64 for display
const base64 = buffer.toString("base64");

// Or save to disk (Node.js)
import fs from "fs";
fs.writeFileSync("downloaded.pdf", buffer);
```

### Generate Presigned URL (Download)

```typescript
import { getPresignedUrl } from "@/aws/s3";

// Generate URL valid for 1 hour (default)
const url = await getPresignedUrl("users/123/document.pdf");

// Generate URL valid for 5 minutes
const shortUrl = await getPresignedUrl("users/123/document.pdf", 300);

// Share this URL with users for temporary access
console.log("Download link:", url);
```

### Generate Presigned Upload URL (Browser Upload)

```typescript
import { getPresignedUploadUrl } from "@/aws/s3";

// Server-side: Generate upload URL
const uploadUrl = await getPresignedUploadUrl(
  "users/123/profile.jpg",
  "image/jpeg",
  3600 // 1 hour
);

// Send to client
res.json({ uploadUrl });

// Client-side: Upload directly to S3
const response = await fetch(uploadUrl, {
  method: "PUT",
  body: file,
  headers: {
    "Content-Type": "image/jpeg",
  },
});
```

### Delete File

```typescript
import { deleteFile } from "@/aws/s3";

await deleteFile("users/123/old-document.pdf");
console.log("File deleted");
```

### List Files

```typescript
import { listFiles, listFilesDetailed } from "@/aws/s3";

// Simple list (just keys)
const keys = await listFiles("users/123/");
console.log("Files:", keys);
// Output: ['users/123/doc1.pdf', 'users/123/doc2.pdf']

// Detailed list (with metadata)
const files = await listFilesDetailed("users/123/", 100);
files.forEach((file) => {
  console.log(`${file.key} - ${file.size} bytes - ${file.lastModified}`);
});
```

### Check File Existence

```typescript
import { fileExists } from "@/aws/s3";

const exists = await fileExists("users/123/profile.jpg");
if (exists) {
  console.log("File exists");
} else {
  console.log("File not found");
}
```

### Copy File

```typescript
import { copyFile } from "@/aws/s3";

// Copy file within the same bucket
await copyFile("users/123/original.jpg", "users/123/backup/original.jpg");
```

## React Server Actions Example

```typescript
// app/actions.ts
"use server";

import { uploadFile, getPresignedUrl } from "@/aws/s3";

export async function uploadProfileImage(formData: FormData) {
  const file = formData.get("file") as File;
  const userId = formData.get("userId") as string;

  if (!file) {
    throw new Error("No file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = `users/${userId}/profile.jpg`;

  const url = await uploadFile(key, buffer, file.type);

  return { success: true, url };
}

export async function getDownloadLink(key: string) {
  const url = await getPresignedUrl(key, 3600);
  return { url };
}
```

## API Routes Example

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "@/aws/s3";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `uploads/${Date.now()}-${file.name}`;

    const url = await uploadFile(key, buffer, file.type);

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

## Error Handling

All functions throw errors that should be caught and handled:

```typescript
import { uploadFile } from "@/aws/s3";

try {
  const url = await uploadFile(key, buffer, contentType);
  console.log("Success:", url);
} catch (error) {
  if (error.name === "NoSuchBucket") {
    console.error("Bucket does not exist");
  } else if (error.name === "AccessDenied") {
    console.error("Permission denied");
  } else {
    console.error("Upload failed:", error);
  }
}
```

## Local Development with LocalStack

1. Start LocalStack:

   ```bash
   docker-compose up -d
   ```

2. Create the S3 bucket:

   ```bash
   awslocal s3 mb s3://bayon-coagent-storage
   ```

3. Configure CORS (see CORS_CONFIG.md):

   ```bash
   awslocal s3api put-bucket-cors \
     --bucket bayon-coagent-storage \
     --cors-configuration file://cors-config.json
   ```

4. Set environment variables:

   ```env
   USE_LOCAL_AWS=true
   ```

5. The S3 client will automatically use LocalStack endpoints

## File Organization Best Practices

Organize files using a hierarchical key structure:

```
users/{userId}/profile.jpg
users/{userId}/documents/{documentId}.pdf
users/{userId}/images/{imageId}.jpg
reports/{reportId}/data.json
reports/{reportId}/attachments/{filename}
temp/{sessionId}/{filename}
```

## Security Considerations

1. **Access Control**: Use IAM policies and bucket policies to restrict access
2. **Presigned URLs**: Use short expiration times (e.g., 1 hour)
3. **Validation**: Validate file types and sizes before upload
4. **Encryption**: Enable S3 encryption at rest
5. **CORS**: Restrict allowed origins in production
6. **Scanning**: Consider scanning uploaded files for malware
7. **Versioning**: Enable versioning for critical files

## Performance Optimization

1. **Multipart Upload**: Automatically used for files >5MB
2. **CloudFront**: Use CloudFront CDN for frequently accessed files
3. **Caching**: Cache presigned URLs when appropriate
4. **Compression**: Compress files before upload when possible
5. **Lazy Loading**: Load files on-demand rather than all at once

## Testing

```typescript
import { uploadFile, downloadFile, deleteFile } from "@/aws/s3";

describe("S3 Storage", () => {
  it("should upload and download file", async () => {
    const content = Buffer.from("test content");
    const key = "test/file.txt";

    // Upload
    await uploadFile(key, content, "text/plain");

    // Download
    const downloaded = await downloadFile(key);
    expect(downloaded.toString()).toBe("test content");

    // Cleanup
    await deleteFile(key);
  });
});
```

## Troubleshooting

### LocalStack Connection Issues

- Ensure LocalStack is running: `docker ps`
- Check endpoint configuration: `http://localhost:4566`
- Verify `forcePathStyle: true` is set for LocalStack

### Permission Errors

- Check IAM policies
- Verify bucket policies
- Ensure credentials are correct

### CORS Errors

- See CORS_CONFIG.md for configuration
- Verify allowed origins include your domain
- Check allowed methods include the method you're using

### Multipart Upload Failures

- Check file size is >5MB
- Verify network stability
- Check CloudWatch logs for errors

## Related Documentation

- [CORS Configuration](./CORS_CONFIG.md)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [LocalStack S3 Documentation](https://docs.localstack.cloud/user-guide/aws/s3/)
