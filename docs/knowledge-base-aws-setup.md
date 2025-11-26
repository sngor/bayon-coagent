# AWS Infrastructure Setup for Knowledge Base

## S3 Bucket Configuration

### Bucket Name
`bayon-knowledge-base`

### Bucket Settings

```json
{
  "Bucket": "bayon-knowledge-base",
  "ACL": "private",
  "PublicAccessBlockConfiguration": {
    "BlockPublicAcls": true,
    "IgnorePublicAcls": true,
    "BlockPublicPolicy": true,
    "RestrictPublicBuckets": true
  },
  "VersioningConfiguration": {
    "Status": "Enabled"
  },
  "LifecycleConfiguration": {
    "Rules": [
      {
        "Id": "DeleteSoftDeletedDocuments",
        "Status": "Enabled",
        "Filter": {
          "Tag": {
            "Key": "deleted",
            "Value": "true"
          }
        },
        "Expiration": {
          "Days": 30
        }
      }
    ]
  },
  "CorsConfiguration": {
    "CorsRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": [
          "http://localhost:3000",
          "https://your-production-domain.com"
        ],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
      }
    ]
  },
  "ServerSideEncryptionConfiguration": {
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }
}
```

### Folder Structure

```
bayon-knowledge-base/
├── {userId}/
│   ├── {documentId}/
│   │   ├── original.{ext}      # Original uploaded file
│   │   └── extracted.txt       # Extracted text content
```

---

## DynamoDB Table Configuration

### Table Name
`KnowledgeBaseDocuments`

### Table Schema

```json
{
  "TableName": "KnowledgeBaseDocuments",
  "KeySchema": [
    {
      "AttributeName": "userId",
      "KeyType": "HASH"
    },
    {
      "AttributeName": "documentId",
      "KeyType": "RANGE"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "userId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "documentId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "status",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "StatusIndex",
      "KeySchema": [
        {
          "AttributeName": "userId",
          "KeyType": "HASH"
        },
        {
          "AttributeName": "status",
          "KeyType": "RANGE"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      },
      "ProvisionedThroughput": {
        "ReadCapacityUnits": 5,
        "WriteCapacityUnits": 5
      }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST",
  "StreamSpecification": {
    "StreamEnabled": true,
    "StreamViewType": "NEW_AND_OLD_IMAGES"
  },
  "Tags": [
    {
      "Key": "Application",
      "Value": "Bayon"
    },
    {
      "Key": "Feature",
      "Value": "KnowledgeBase"
    }
  ]
}
```

### Item Structure

```typescript
{
  userId: string;           // Partition key
  documentId: string;       // Sort key
  fileName: string;         // Original filename
  fileType: string;         // pdf, docx, txt, md
  fileSize: number;         // Bytes
  s3Key: string;           // S3 object key
  uploadDate: string;       // ISO timestamp
  status: string;          // pending, processing, indexed, failed, deleted
  title?: string;          // User-editable title
  tags?: string[];         // User-defined tags
  extractedText?: string;  // Full extracted text (for search)
  chunkCount?: number;     // Number of chunks created
  embeddingModel?: string; // Model used for embeddings
  lastAccessed?: string;   // ISO timestamp
  accessCount?: number;    // How many times AI used it
  errorMessage?: string;   // If status is failed
  deletedAt?: string;      // Soft delete timestamp
}
```

---

## IAM Permissions

### Required Permissions for Application

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::bayon-knowledge-base",
        "arn:aws:s3:::bayon-knowledge-base/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/KnowledgeBaseDocuments",
        "arn:aws:dynamodb:*:*:table/KnowledgeBaseDocuments/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:*:*:function:processKnowledgeBaseDocument"
      ]
    }
  ]
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Knowledge Base
KNOWLEDGE_BASE_BUCKET=bayon-knowledge-base
KNOWLEDGE_BASE_TABLE=KnowledgeBaseDocuments

# OpenAI (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Vector Database (choose one)
# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=bayon-knowledge-base

# OR OpenSearch
OPENSEARCH_ENDPOINT=your_opensearch_endpoint
OPENSEARCH_USERNAME=your_username
OPENSEARCH_PASSWORD=your_password
```

---

## Setup Commands

### 1. Create S3 Bucket

```bash
aws s3api create-bucket \
  --bucket bayon-knowledge-base \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket bayon-knowledge-base \
  --versioning-configuration Status=Enabled

# Block public access
aws s3api put-public-access-block \
  --bucket bayon-knowledge-base \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket bayon-knowledge-base \
  --server-side-encryption-configuration \
    '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'
```

### 2. Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name KnowledgeBaseDocuments \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=documentId,AttributeType=S \
    AttributeName=status,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=documentId,KeyType=RANGE \
  --global-secondary-indexes \
    "[{
      \"IndexName\": \"StatusIndex\",
      \"KeySchema\": [{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"status\",\"KeyType\":\"RANGE\"}],
      \"Projection\":{\"ProjectionType\":\"ALL\"},
      \"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}
    }]" \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region us-west-2
```

### 3. Set Up CORS for S3

Create `cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["http://localhost:3000"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS:
```bash
aws s3api put-bucket-cors \
  --bucket bayon-knowledge-base \
  --cors-configuration file://cors.json
```

---

## Verification

### Test S3 Upload

```bash
# Create test file
echo "Test document" > test.txt

# Upload
aws s3 cp test.txt s3://bayon-knowledge-base/test-user/test-doc/original.txt

# Verify
aws s3 ls s3://bayon-knowledge-base/test-user/test-doc/

# Clean up
aws s3 rm s3://bayon-knowledge-base/test-user/test-doc/original.txt
```

### Test DynamoDB

```bash
# Put item
aws dynamodb put-item \
  --table-name KnowledgeBaseDocuments \
  --item '{
    "userId": {"S": "test-user"},
    "documentId": {"S": "test-doc-123"},
    "fileName": {"S": "test.pdf"},
    "status": {"S": "pending"}
  }'

# Query items
aws dynamodb query \
  --table-name KnowledgeBaseDocuments \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId":{"S":"test-user"}}'

# Clean up
aws dynamodb delete-item \
  --table-name KnowledgeBaseDocuments \
  --key '{"userId":{"S":"test-user"},"documentId":{"S":"test-doc-123"}}'
```

---

## Cost Estimation

### S3
- Storage: $0.023 per GB/month
- PUT requests: $0.005 per 1,000 requests
- GET requests: $0.0004 per 1,000 requests

**Example**: 100 users, 10 documents each (5MB avg)
- Storage: 5GB × $0.023 = $0.12/month
- Uploads: 1,000 × $0.005 = $0.005
- Downloads: 10,000 × $0.0004 = $0.004
- **Total**: ~$0.13/month

### DynamoDB
- Pay-per-request pricing
- $1.25 per million write requests
- $0.25 per million read requests

**Example**: 1,000 writes, 10,000 reads/month
- Writes: 0.001M × $1.25 = $0.00125
- Reads: 0.01M × $0.25 = $0.0025
- **Total**: ~$0.004/month

### Total Estimated Cost
**~$0.15/month** for 100 users with moderate usage

---

## Security Considerations

1. **Encryption**:
   - S3: AES-256 encryption at rest
   - DynamoDB: Encryption at rest enabled
   - In-transit: HTTPS only

2. **Access Control**:
   - S3: Private bucket, no public access
   - DynamoDB: IAM-based access only
   - Signed URLs: 1-hour expiration

3. **Data Privacy**:
   - User isolation: Documents scoped by userId
   - Soft delete: 30-day retention before permanent deletion
   - No cross-user access

4. **Validation**:
   - File type whitelist
   - Size limits enforced
   - Virus scanning (optional, via S3 antivirus Lambda)

---

## Next Steps

1. ✅ Create S3 bucket
2. ✅ Create DynamoDB table
3. ✅ Set up IAM permissions
4. ✅ Configure environment variables
5. [ ] Create processing Lambda function
6. [ ] Set up vector database
7. [ ] Test upload flow end-to-end
