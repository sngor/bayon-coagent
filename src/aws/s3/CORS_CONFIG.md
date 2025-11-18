# S3 CORS Configuration

This document describes the CORS (Cross-Origin Resource Sharing) configuration required for browser uploads to S3.

## CORS Configuration for S3 Bucket

The S3 bucket needs to be configured with CORS rules to allow browser-based uploads. This configuration should be applied to the S3 bucket either through the AWS Console, AWS CLI, or Infrastructure as Code (CDK/Terraform).

### CORS Rules (JSON Format)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag", "x-amz-request-id", "x-amz-id-2"],
    "MaxAgeSeconds": 3600
  }
]
```

### Configuration Explanation

- **AllowedHeaders**: `["*"]` - Allows all headers in requests
- **AllowedMethods**: Specifies which HTTP methods are allowed
  - `GET` - Download files
  - `PUT` - Upload files (used with presigned URLs)
  - `POST` - Upload files (multipart uploads)
  - `DELETE` - Delete files
  - `HEAD` - Check if file exists
- **AllowedOrigins**: List of domains that can access the bucket
  - Add your local development URL (e.g., `http://localhost:3000`)
  - Add your production domain (e.g., `https://yourdomain.com`)
  - Use `["*"]` for development only (not recommended for production)
- **ExposeHeaders**: Headers that browsers can access in responses
- **MaxAgeSeconds**: How long browsers can cache the CORS configuration

## Applying CORS Configuration

### Using AWS CLI

```bash
aws s3api put-bucket-cors \
  --bucket bayon-coagent-storage \
  --cors-configuration file://cors-config.json
```

### Using AWS CDK (TypeScript)

```typescript
import * as s3 from "aws-cdk-lib/aws-s3";

const bucket = new s3.Bucket(this, "StorageBucket", {
  bucketName: "bayon-coagent-storage",
  cors: [
    {
      allowedHeaders: ["*"],
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.DELETE,
        s3.HttpMethods.HEAD,
      ],
      allowedOrigins: ["http://localhost:3000", "https://yourdomain.com"],
      exposedHeaders: ["ETag", "x-amz-request-id", "x-amz-id-2"],
      maxAge: 3600,
    },
  ],
});
```

### Using LocalStack (Local Development)

For local development with LocalStack, CORS is typically more permissive:

```bash
awslocal s3api put-bucket-cors \
  --bucket bayon-coagent-storage \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3600
      }
    ]
  }'
```

## Browser Upload Flow

### Direct Upload Using Presigned URL

1. Client requests a presigned upload URL from the server:

   ```typescript
   const { url } = await fetch("/api/upload-url", {
     method: "POST",
     body: JSON.stringify({
       fileName: "profile.jpg",
       contentType: "image/jpeg",
     }),
   }).then((r) => r.json());
   ```

2. Server generates presigned URL:

   ```typescript
   import { getPresignedUploadUrl } from "@/aws/s3";

   const key = `users/${userId}/profile.jpg`;
   const url = await getPresignedUploadUrl(key, "image/jpeg", 3600);
   ```

3. Client uploads directly to S3:
   ```typescript
   await fetch(url, {
     method: "PUT",
     body: file,
     headers: {
       "Content-Type": "image/jpeg",
     },
   });
   ```

### Server-Side Upload

For smaller files or when you need to process the file first:

```typescript
import { uploadFile } from "@/aws/s3";

const buffer = await file.arrayBuffer();
const url = await uploadFile(
  `users/${userId}/document.pdf`,
  Buffer.from(buffer),
  "application/pdf",
  { uploadedBy: userId }
);
```

## Security Considerations

1. **Restrict Origins**: In production, only allow your actual domain(s)
2. **Use Presigned URLs**: For uploads, use presigned URLs with short expiration times
3. **Validate File Types**: Validate file types on the server before generating presigned URLs
4. **Set Size Limits**: Configure maximum file size limits
5. **Use Bucket Policies**: Implement bucket policies to restrict access
6. **Enable Versioning**: Enable S3 versioning for important files
7. **Scan Uploads**: Consider scanning uploaded files for malware

## Testing CORS Configuration

You can test CORS configuration using curl:

```bash
curl -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: PUT" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://bayon-coagent-storage.s3.us-east-1.amazonaws.com/test.txt
```

Expected response should include:

- `Access-Control-Allow-Origin: http://localhost:3000`
- `Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD`
- `Access-Control-Allow-Headers: *`

## Troubleshooting

### CORS Error in Browser

If you see CORS errors in the browser console:

1. Verify the CORS configuration is applied to the bucket
2. Check that your origin is in the `AllowedOrigins` list
3. Ensure the HTTP method is in the `AllowedMethods` list
4. Check that required headers are in `AllowedHeaders`
5. For LocalStack, ensure you're using `forcePathStyle: true` in the S3 client

### Presigned URL Not Working

1. Verify the URL hasn't expired
2. Check that the Content-Type header matches what was specified
3. Ensure the HTTP method matches (PUT for uploads)
4. Verify AWS credentials have permission to generate presigned URLs
