# S3 Storage - Quick Start Guide

## What Was Implemented

The AWS S3 storage layer is now fully implemented and ready to use. This replaces Firebase Storage with AWS S3.

## Files Created

```
src/aws/s3/
├── client.ts                    # Core S3 client with all operations
├── index.ts                     # Module exports
├── client.test.ts              # Comprehensive test suite
├── README.md                    # Full usage documentation
├── CORS_CONFIG.md              # CORS configuration guide
├── IMPLEMENTATION_SUMMARY.md   # Detailed implementation notes
├── verify-implementation.ts    # Verification script
└── QUICK_START.md             # This file
```

## Quick Usage Examples

### 1. Upload a File

```typescript
import { uploadFile } from "@/aws/s3";

const buffer = Buffer.from("Hello, World!");
const url = await uploadFile("users/123/document.txt", buffer, "text/plain");
```

### 2. Download a File

```typescript
import { downloadFile } from "@/aws/s3";

const buffer = await downloadFile("users/123/document.txt");
const content = buffer.toString();
```

### 3. Generate Presigned URL

```typescript
import { getPresignedUrl } from "@/aws/s3";

// URL valid for 1 hour
const url = await getPresignedUrl("users/123/document.pdf");
```

### 4. Delete a File

```typescript
import { deleteFile } from "@/aws/s3";

await deleteFile("users/123/old-file.txt");
```

### 5. List Files

```typescript
import { listFiles } from "@/aws/s3";

const files = await listFiles("users/123/");
console.log(files); // ['users/123/file1.txt', 'users/123/file2.txt']
```

## Environment Setup

### Local Development

Add to `.env.local`:

```env
USE_LOCAL_AWS=true
AWS_REGION=us-east-1
S3_BUCKET_NAME=bayon-coagent-storage
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

### Production

Add to `.env.production`:

```env
AWS_REGION=us-east-1
S3_BUCKET_NAME=bayon-coagent-storage-prod
# AWS credentials from IAM roles
```

## LocalStack Setup (Local Development)

1. Start LocalStack:

   ```bash
   npm run localstack:start
   ```

2. Create bucket:

   ```bash
   awslocal s3 mb s3://bayon-coagent-storage
   ```

3. Configure CORS (optional for browser uploads):
   ```bash
   awslocal s3api put-bucket-cors \
     --bucket bayon-coagent-storage \
     --cors-configuration '{
       "CORSRules": [{
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
         "AllowedOrigins": ["*"],
         "MaxAgeSeconds": 3600
       }]
     }'
   ```

## Features

✅ **File Upload**

- Automatic multipart upload for files > 5MB
- Support for Buffer and Blob
- Optional metadata

✅ **File Download**

- Stream to buffer conversion
- Binary and text support

✅ **Presigned URLs**

- Download URLs
- Upload URLs (for direct browser uploads)
- Configurable expiration

✅ **File Management**

- Delete files
- List files with prefix
- Check file existence
- Copy files

✅ **Developer Experience**

- Full TypeScript support
- LocalStack support
- Comprehensive error handling
- Detailed documentation

## Testing

Run verification:

```bash
npx tsx src/aws/s3/verify-implementation.ts
```

Run tests (when test runner is configured):

```bash
npm test src/aws/s3/client.test.ts
```

## Next Steps

1. ✅ S3 client implemented
2. ⏭️ Configure CORS on production S3 bucket
3. ⏭️ Integrate with application components (Task 12)
4. ⏭️ Migrate existing files from Firebase Storage (Task 16)

## Need Help?

- **Usage Examples**: See `README.md`
- **CORS Setup**: See `CORS_CONFIG.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`
- **Test Examples**: See `client.test.ts`

## Requirements Met

✅ **Requirement 4.1**: File upload with multipart support  
✅ **Requirement 4.2**: File download  
✅ **Requirement 4.3**: Presigned URL generation  
✅ **Requirement 4.4**: File deletion  
✅ **Requirement 4.5**: File listing

All requirements from the design document have been successfully implemented!
