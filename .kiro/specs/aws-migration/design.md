# Design Document: AWS Migration

## Overview

This design document outlines the technical approach for migrating the Bayon CoAgent application from Google Cloud Platform (Firebase/Gemini) to Amazon Web Services. The migration will be executed in a phased approach, replacing each Firebase service with its AWS equivalent while maintaining feature parity and ensuring the application works in both local development and remote production environments.

The migration strategy prioritizes:

- **Local-first development**: Developers can run and test the full stack locally using LocalStack and AWS service emulators
- **Minimal disruption**: Maintain existing application structure and user-facing features
- **Type safety**: Continue using TypeScript and Zod for schema validation
- **Incremental migration**: Services can be migrated independently

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Components (UI Layer)                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Server Actions / API Routes (BFF Layer)        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AWS Service Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Cognito    │  │   DynamoDB   │  │      S3      │      │
│  │ (Auth)       │  │  (Database)  │  │  (Storage)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Bedrock    │  │ API Gateway  │                        │
│  │    (AI)      │  │  (Optional)  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Local Development Architecture

For local development, we'll use LocalStack to emulate AWS services:

```
┌─────────────────────────────────────────────────────────────┐
│              Developer Machine (localhost)                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Next.js Dev Server (Port 3000)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              LocalStack (Port 4566)                     │ │
│  │  • DynamoDB Local                                       │ │
│  │  • S3 Local                                             │ │
│  │  • Cognito Local (or mock)                              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         AWS Bedrock (via real AWS credentials)          │ │
│  │         OR Mock AI Service for offline dev              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Remote Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Cloud                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  CloudFront CDN → S3 Static Assets                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js on Lambda@Edge / ECS / Amplify Hosting        │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Cognito    │  │   DynamoDB   │  │      S3      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Bedrock    │  │  CloudWatch  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Authentication Layer (Cognito Integration)

**Purpose**: Replace Firebase Authentication with AWS Cognito

**Key Components**:

- `src/aws/auth/cognito-client.ts` - Cognito client initialization and configuration
- `src/aws/auth/use-user.tsx` - React hook for accessing current user (replaces Firebase useUser)
- `src/aws/auth/auth-provider.tsx` - Context provider for authentication state

**Interface**:

```typescript
interface CognitoAuthClient {
  signUp(email: string, password: string): Promise<CognitoUser>;
  signIn(email: string, password: string): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<CognitoUser | null>;
  getSession(): Promise<AuthSession | null>;
}

interface AuthSession {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface CognitoUser {
  id: string;
  email: string;
  emailVerified: boolean;
  attributes: Record<string, string>;
}
```

**Migration Strategy**:

- Use `amazon-cognito-identity-js` or AWS Amplify Auth for Cognito integration
- Maintain similar hook API to minimize component changes
- Store JWT tokens in httpOnly cookies or secure localStorage
- Implement automatic token refresh

### 2. Database Layer (DynamoDB Integration)

**Purpose**: Replace Firestore with DynamoDB

**Key Components**:

- `src/aws/dynamodb/client.ts` - DynamoDB client initialization
- `src/aws/dynamodb/use-query.tsx` - React hook for querying data (replaces useCollection)
- `src/aws/dynamodb/use-item.tsx` - React hook for single item (replaces useDoc)
- `src/aws/dynamodb/repository.ts` - Data access layer with CRUD operations

**Table Design** (Single-Table Design Pattern):

```
Table: BayonCoAgent

Primary Key:
- PK (Partition Key): String
- SK (Sort Key): String

Global Secondary Indexes:
- GSI1: GSI1PK, GSI1SK (for alternate access patterns)

Attributes:
- EntityType: String
- Data: Map (JSON document)
- CreatedAt: Number (timestamp)
- UpdatedAt: Number (timestamp)
```

**Key Patterns**:

```
User Profile:
  PK: USER#<userId>
  SK: PROFILE
  EntityType: UserProfile

Agent Profile:
  PK: USER#<userId>
  SK: AGENT#main
  EntityType: RealEstateAgentProfile

Reviews:
  PK: REVIEW#<agentId>
  SK: REVIEW#<reviewId>
  EntityType: Review
  GSI1PK: REVIEW#<reviewId> (for direct lookup)

Brand Audit:
  PK: USER#<userId>
  SK: AUDIT#<auditId>
  EntityType: BrandAudit

Competitors:
  PK: USER#<userId>
  SK: COMPETITOR#<competitorId>
  EntityType: Competitor

Research Reports:
  PK: USER#<userId>
  SK: REPORT#<reportId>
  EntityType: ResearchReport

Saved Content:
  PK: USER#<userId>
  SK: CONTENT#<contentId>
  EntityType: SavedContent

Projects:
  PK: USER#<userId>
  SK: PROJECT#<projectId>
  EntityType: Project

Training Progress:
  PK: USER#<userId>
  SK: TRAINING#<moduleId>
  EntityType: TrainingProgress

Marketing Plans:
  PK: USER#<userId>
  SK: PLAN#<planId>
  EntityType: MarketingPlan

Review Analysis:
  PK: USER#<userId>
  SK: ANALYSIS#<analysisId>
  EntityType: ReviewAnalysis

OAuth Tokens:
  PK: OAUTH#<userId>
  SK: GOOGLE_BUSINESS
  EntityType: OAuthToken
```

**Interface**:

```typescript
interface DynamoDBRepository {
  get<T>(pk: string, sk: string): Promise<T | null>;
  query<T>(pk: string, skPrefix?: string): Promise<T[]>;
  put<T>(item: DynamoDBItem<T>): Promise<void>;
  update<T>(pk: string, sk: string, updates: Partial<T>): Promise<void>;
  delete(pk: string, sk: string): Promise<void>;
  batchGet<T>(keys: Array<{ pk: string; sk: string }>): Promise<T[]>;
}

interface DynamoDBItem<T> {
  PK: string;
  SK: string;
  EntityType: string;
  Data: T;
  CreatedAt: number;
  UpdatedAt: number;
}
```

**Migration Strategy**:

- Implement repository pattern for data access
- Use DynamoDB DocumentClient for simplified JSON operations
- Implement polling-based "subscriptions" for real-time updates (or use DynamoDB Streams + WebSockets)
- Create migration scripts to transform Firestore data to DynamoDB format

### 3. Storage Layer (S3 Integration)

**Purpose**: Replace Firebase Storage with S3

**Key Components**:

- `src/aws/s3/client.ts` - S3 client initialization
- `src/aws/s3/upload.ts` - File upload utilities
- `src/aws/s3/presigned-url.ts` - Generate presigned URLs for secure access

**Bucket Structure**:

```
Bucket: bayon-coagent-storage-{environment}

Paths:
- users/{userId}/profile.jpg
- users/{userId}/documents/*
```

**Interface**:

```typescript
interface S3StorageClient {
  uploadFile(
    key: string,
    file: Buffer | Blob,
    contentType: string
  ): Promise<string>;
  getFile(key: string): Promise<Buffer>;
  getPresignedUrl(key: string, expiresIn: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  listFiles(prefix: string): Promise<string[]>;
}
```

**Migration Strategy**:

- Use AWS SDK v3 `@aws-sdk/client-s3` for S3 operations
- Implement presigned URLs for direct browser uploads
- Use S3 bucket policies for access control
- Configure CORS for browser uploads

### 4. AI Layer (Bedrock Integration)

**Purpose**: Replace Google Gemini with AWS Bedrock

**Key Components**:

- `src/aws/bedrock/client.ts` - Bedrock client initialization
- `src/aws/bedrock/flows/` - AI flow implementations (replaces Genkit flows)
- `src/aws/bedrock/schemas/` - Input/output schemas (keep existing Zod schemas)

**Supported Models**:

- Primary: `anthropic.claude-3-5-sonnet-20241022-v2:0` (equivalent to Gemini 2.5 Flash)
- Alternative: `amazon.titan-text-premier-v1:0`
- Multimodal: `anthropic.claude-3-sonnet-20240229-v1:0`

**Interface**:

```typescript
interface BedrockClient {
  invoke<TInput, TOutput>(
    modelId: string,
    prompt: string,
    input: TInput,
    outputSchema: z.ZodSchema<TOutput>
  ): Promise<TOutput>;

  invokeStream<TInput>(
    modelId: string,
    prompt: string,
    input: TInput
  ): AsyncIterable<string>;
}

interface AIFlow<TInput, TOutput> {
  name: string;
  inputSchema: z.ZodSchema<TInput>;
  outputSchema: z.ZodSchema<TOutput>;
  execute(input: TInput): Promise<TOutput>;
}
```

**Migration Strategy**:

- Replace Genkit `ai.defineFlow()` with custom flow functions
- Use Bedrock's Converse API for structured outputs
- Implement web search using external API (Tavily, Serper) or Bedrock Agents
- Keep existing Zod schemas for input/output validation
- Implement retry logic and error handling

### 5. Configuration and Environment Management

**Purpose**: Manage environment-specific configuration

**Key Components**:

- `src/aws/config.ts` - Central configuration management
- `.env.local` - Local development environment variables
- `.env.production` - Production environment variables (or use AWS Parameter Store)

**Configuration Interface**:

```typescript
interface AWSConfig {
  region: string;
  environment: "local" | "development" | "production";

  cognito: {
    userPoolId: string;
    clientId: string;
    endpoint?: string; // For local development
  };

  dynamodb: {
    tableName: string;
    endpoint?: string; // For local development
  };

  s3: {
    bucketName: string;
    endpoint?: string; // For local development
  };

  bedrock: {
    modelId: string;
    region: string;
    endpoint?: string; // For local development
  };
}
```

**Environment Detection**:

```typescript
function getAWSConfig(): AWSConfig {
  const isLocal =
    process.env.NODE_ENV === "development" &&
    process.env.USE_LOCAL_AWS === "true";

  return {
    region: process.env.AWS_REGION || "us-east-1",
    environment: isLocal
      ? "local"
      : process.env.NODE_ENV === "production"
      ? "production"
      : "development",

    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID!,
      clientId: process.env.COGNITO_CLIENT_ID!,
      endpoint: isLocal ? "http://localhost:4566" : undefined,
    },

    dynamodb: {
      tableName: process.env.DYNAMODB_TABLE_NAME || "BayonCoAgent",
      endpoint: isLocal ? "http://localhost:4566" : undefined,
    },

    s3: {
      bucketName: process.env.S3_BUCKET_NAME || "bayon-coagent-storage",
      endpoint: isLocal ? "http://localhost:4566" : undefined,
    },

    bedrock: {
      modelId:
        process.env.BEDROCK_MODEL_ID ||
        "anthropic.claude-3-5-sonnet-20241022-v2:0",
      region: process.env.BEDROCK_REGION || "us-east-1",
    },
  };
}
```

## Data Models

The existing data models defined in `docs/backend.json` will be preserved. The main change is how they're stored:

**Firestore (Before)**:

- Hierarchical collections and documents
- Automatic document IDs
- Real-time listeners

**DynamoDB (After)**:

- Single table with composite keys
- Explicit PK/SK design
- Polling or Streams for updates

**Example Transformation**:

Firestore:

```
/users/{userId}/agentProfiles/main
```

DynamoDB:

```json
{
  "PK": "USER#user123",
  "SK": "AGENT#main",
  "EntityType": "RealEstateAgentProfile",
  "Data": {
    "id": "main",
    "name": "John Doe",
    "bio": "...",
    ...
  },
  "CreatedAt": 1700000000000,
  "UpdatedAt": 1700000000000
}
```

All entity schemas from `backend.json` remain valid and will be used for validation with Zod.

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Authentication Properties

**Property 1: User registration creates accounts**
_For any_ valid email and password combination, registering a new user should successfully create an account in Cognito with the provided credentials.
**Validates: Requirements 1.1**

**Property 2: Valid credentials authenticate successfully**
_For any_ registered user with valid credentials, attempting to sign in should successfully authenticate and establish a session with valid tokens.
**Validates: Requirements 1.2**

**Property 3: Logout clears session**
_For any_ authenticated user, logging out should terminate the Cognito session and clear all local authentication state.
**Validates: Requirements 1.3**

**Property 4: Token verification protects routes**
_For any_ protected route and JWT token, access should be granted if and only if the token is valid and not expired.
**Validates: Requirements 1.4**

### Database Properties

**Property 5: Read-write round trip**
_For any_ user profile data, writing it to DynamoDB and then reading it back should return data equivalent to what was written.
**Validates: Requirements 2.1, 2.2**

**Property 6: Query returns only matching items**
_For any_ query with filter conditions, all returned items should satisfy the filter conditions, and no matching items should be omitted.
**Validates: Requirements 2.3**

**Property 7: Subscriptions detect updates**
_For any_ data item being monitored, when the item is updated in DynamoDB, the subscription mechanism should detect the change within a reasonable time window.
**Validates: Requirements 2.4**

**Property 8: Firestore paths map to valid DynamoDB keys**
_For any_ Firestore collection path defined in backend.json, the migration should produce a valid DynamoDB PK/SK combination that preserves the hierarchical relationship.
**Validates: Requirements 2.7**

**Property 9: User-scoped data uses userId in partition key**
_For any_ entity that is user-scoped, the DynamoDB partition key should contain the userId.
**Validates: Requirements 8.2**

**Property 10: All entities have table definitions**
_For any_ entity defined in backend.json, there should exist a corresponding DynamoDB key pattern definition.
**Validates: Requirements 8.1**

**Property 11: Query patterns are supported**
_For any_ required query pattern (e.g., get all user's saved content, get user's competitors), the DynamoDB key design should support executing that query efficiently.
**Validates: Requirements 8.4, 8.5**

### Storage Properties

**Property 12: File upload-download round trip**
_For any_ file uploaded to S3, downloading it should return a file with identical content.
**Validates: Requirements 4.1, 4.2**

**Property 13: Presigned URLs provide access**
_For any_ private file in S3, a presigned URL should allow access to that file without additional authentication until the URL expires.
**Validates: Requirements 4.3**

### AI Properties

**Property 14: AI flows invoke Bedrock successfully**
_For any_ AI flow with valid input, invoking the flow should successfully call Bedrock and return a response.
**Validates: Requirements 3.1**

**Property 15: AI responses conform to output schemas**
_For any_ AI flow with a defined output schema, the response from Bedrock should validate successfully against that schema.
**Validates: Requirements 3.2**

**Property 16: Bedrock flows maintain Genkit feature parity**
_For any_ existing Genkit flow, the equivalent Bedrock implementation should accept the same inputs and produce outputs with the same structure.
**Validates: Requirements 3.6**

**Property 17: Streaming delivers complete responses**
_For any_ streaming AI request, the concatenation of all stream chunks should form a complete and valid response.
**Validates: Requirements 9.4**

### Configuration Properties

**Property 18: Environment detection selects correct endpoints**
_For any_ environment configuration (local vs remote), the AWS clients should be initialized with endpoints appropriate to that environment.
**Validates: Requirements 5.3**

**Property 19: Environment changes update configuration**
_For any_ change to environment variables, reinitializing the application should use the new configuration values.
**Validates: Requirements 5.5**

### OAuth Properties

**Property 20: Token exchange succeeds for valid codes**
_For any_ valid Google authorization code, exchanging it should return valid access and refresh tokens.
**Validates: Requirements 7.2**

**Property 21: OAuth token storage round trip**
_For any_ OAuth tokens stored in DynamoDB, retrieving them should return tokens equivalent to what was stored.
**Validates: Requirements 7.3**

**Property 22: Token refresh obtains new tokens**
_For any_ expired access token with a valid refresh token, the refresh operation should obtain a new valid access token.
**Validates: Requirements 7.4**

### Schema Validation Properties

**Property 23: Zod schemas validate correctly**
_For any_ input that conforms to a Zod schema, validation should succeed; for any input that violates the schema, validation should fail with descriptive errors.
**Validates: Requirements 9.2**

### Hook Replacement Properties

**Property 24: Auth hooks provide equivalent functionality**
_For any_ authentication operation (sign in, sign out, get current user), the Cognito-based hooks should provide the same interface and behavior as the Firebase auth hooks.
**Validates: Requirements 10.2**

**Property 25: Data hooks provide equivalent functionality**
_For any_ data operation (query, get item, subscribe), the DynamoDB-based hooks should provide the same interface and behavior as the Firestore hooks.
**Validates: Requirements 10.3**

**Property 26: AWS errors map to user-friendly messages**
_For any_ AWS service error, the error handling should produce a user-friendly message that doesn't expose internal implementation details.
**Validates: Requirements 10.4**

### Data Integrity Properties

**Property 27: Saved content preserves structure**
_For any_ content saved through the application, the data structure in DynamoDB should match the original entity schema defined in backend.json.
**Validates: Requirements 11.3**

### Error Handling Properties

**Property 28: Service failures are logged with context**
_For any_ AWS service call that fails, the error should be logged with sufficient context (service name, operation, parameters, error message) for debugging.
**Validates: Requirements 12.1**

**Property 29: Auth failures provide clear messages**
_For any_ authentication failure (invalid credentials, expired token, etc.), the user should receive a clear, actionable error message.
**Validates: Requirements 12.4**

**Property 30: AI failures allow retry**
_For any_ AI generation failure, the application should handle the error gracefully and allow the user to retry the operation.
**Validates: Requirements 12.5**

## Error Handling

### Error Categories

1. **Authentication Errors**

   - Invalid credentials
   - Expired tokens
   - Missing permissions
   - Network failures during auth

2. **Database Errors**

   - Item not found
   - Conditional check failures
   - Throughput exceeded
   - Network failures

3. **Storage Errors**

   - File not found
   - Upload failures
   - Presigned URL expiration
   - Insufficient permissions

4. **AI Errors**
   - Model throttling
   - Invalid input
   - Timeout
   - Content filtering

### Error Handling Strategy

**Retry Logic**:

- Implement exponential backoff for transient failures
- Maximum 3 retries for network errors
- No retry for validation errors

**User Feedback**:

- Map technical errors to user-friendly messages
- Provide actionable guidance (e.g., "Please try again" vs "Please check your credentials")
- Log detailed errors server-side while showing simplified messages client-side

**Logging**:

- Local: Console logs with full stack traces
- Remote: CloudWatch Logs with structured logging
- Include request IDs for tracing

**Graceful Degradation**:

- Cache data locally when possible
- Show stale data with indicators when real-time updates fail
- Provide offline mode for critical features

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality of individual components:

**Authentication Tests**:

- Test Cognito client initialization with various configurations
- Test token parsing and validation
- Test session management (create, refresh, destroy)

**Database Tests**:

- Test key generation for all entity types
- Test CRUD operations for each repository method
- Test query construction and filtering

**Storage Tests**:

- Test file upload with various file types
- Test presigned URL generation
- Test file deletion

**AI Tests**:

- Test prompt construction
- Test schema validation with Zod
- Test response parsing

**Configuration Tests**:

- Test environment detection logic
- Test endpoint selection based on environment
- Test credential loading

### Property-Based Testing

Property-based tests will verify universal properties across many inputs:

**Authentication PBT**:

- Generate random valid email/password combinations and verify registration succeeds
- Generate random invalid credentials and verify authentication fails appropriately
- Generate random tokens and verify validation logic

**Database PBT**:

- Generate random entity data and verify round-trip consistency (write then read)
- Generate random query filters and verify only matching items are returned
- Generate random Firestore paths and verify they map to valid DynamoDB keys

**Storage PBT**:

- Generate random files (various sizes, types) and verify upload-download round trip
- Generate random S3 keys and verify presigned URLs provide access

**AI PBT**:

- Generate random valid inputs for each flow and verify responses conform to output schemas
- Generate random invalid inputs and verify appropriate error handling

**Configuration PBT**:

- Generate random environment variable combinations and verify correct endpoint selection

**Schema Validation PBT**:

- Generate random data conforming to schemas and verify validation succeeds
- Generate random data violating schemas and verify validation fails

### Integration Testing

Integration tests will verify end-to-end workflows:

- Complete user registration and login flow
- Create, read, update, delete operations for each entity type
- File upload and retrieval workflow
- AI content generation workflow
- OAuth flow with Google Business Profile

### Migration Testing

Specific tests for the migration process:

- Verify all Firestore collections have DynamoDB equivalents
- Verify data migration scripts preserve data integrity
- Verify all Genkit flows have Bedrock equivalents
- Verify all Firebase auth operations have Cognito equivalents

### Testing Tools

- **Unit Testing**: Jest or Vitest
- **Property-Based Testing**: fast-check (JavaScript PBT library)
- **Integration Testing**: Playwright or Cypress for E2E
- **Local AWS Services**: LocalStack for local testing
- **Mocking**: AWS SDK mocks for unit tests

### Test Configuration

Property-based tests should run a minimum of 100 iterations to ensure adequate coverage of the input space. Each test should be tagged with a comment referencing the correctness property it validates:

```typescript
// Feature: aws-migration, Property 5: Read-write round trip
test("DynamoDB write-read preserves data", async () => {
  await fc.assert(
    fc.asyncProperty(userProfileArbitrary, async (profile) => {
      await repository.put(profile);
      const retrieved = await repository.get(profile.PK, profile.SK);
      expect(retrieved).toEqual(profile);
    }),
    { numRuns: 100 }
  );
});
```

## Migration Phases

### Phase 1: Setup and Configuration

- Install AWS SDK dependencies
- Set up LocalStack for local development
- Create AWS configuration module
- Set up environment variables

### Phase 2: Authentication Migration

- Implement Cognito client
- Create authentication hooks
- Replace Firebase auth in components
- Test authentication flows

### Phase 3: Database Migration

- Design DynamoDB table schema
- Implement DynamoDB repository
- Create data access hooks
- Migrate data from Firestore to DynamoDB
- Replace Firestore hooks in components

### Phase 4: Storage Migration

- Implement S3 client
- Create upload/download utilities
- Replace Firebase Storage references
- Migrate existing files to S3

### Phase 5: AI Migration

- Implement Bedrock client
- Migrate Genkit flows to Bedrock
- Test all AI features
- Implement web search alternative

### Phase 6: Deployment

- Create Infrastructure as Code (CDK/Terraform)
- Set up CI/CD pipeline
- Deploy to AWS
- Configure monitoring and logging

### Phase 7: Testing and Validation

- Run full test suite
- Perform user acceptance testing
- Monitor for issues
- Optimize performance

## Deployment Architecture

### Infrastructure as Code

Use AWS CDK (TypeScript) to define infrastructure:

```typescript
// Example CDK stack structure
class BayonCoAgentStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
    });

    // DynamoDB Table
    const table = new dynamodb.Table(this, "BayonCoAgentTable", {
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // S3 Bucket
    const bucket = new s3.Bucket(this, "StorageBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      cors: [
        /* CORS rules */
      ],
    });

    // Next.js hosting (Amplify or custom)
    // API Gateway + Lambda (if needed)
    // CloudFront distribution
  }
}
```

### Hosting Options

**Option 1: AWS Amplify Hosting**

- Simplest deployment for Next.js
- Automatic CI/CD from Git
- Built-in SSL and CDN
- Serverless architecture

**Option 2: Lambda@Edge + CloudFront**

- More control over caching
- Better for SSR performance
- Requires more configuration

**Option 3: ECS Fargate**

- Full container control
- Better for complex workloads
- More expensive

**Recommendation**: Start with AWS Amplify Hosting for simplicity, migrate to Lambda@Edge if performance optimization is needed.

### Environment Variables

**Local Development** (`.env.local`):

```
NODE_ENV=development
USE_LOCAL_AWS=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

COGNITO_USER_POOL_ID=local-pool
COGNITO_CLIENT_ID=local-client
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
```

**Production** (AWS Parameter Store or Secrets Manager):

```
NODE_ENV=production
AWS_REGION=us-east-1

COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-prod
S3_BUCKET_NAME=bayon-coagent-prod
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback

BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
```

## Performance Considerations

### DynamoDB Optimization

- Use single-table design to minimize queries
- Implement caching layer (Redis or in-memory) for frequently accessed data
- Use DynamoDB Streams for real-time updates instead of polling
- Consider DynamoDB Global Tables for multi-region deployment

### Bedrock Optimization

- Implement response caching for identical prompts
- Use streaming for long responses to improve perceived performance
- Consider batch processing for bulk operations
- Monitor token usage and costs

### S3 Optimization

- Use CloudFront CDN for static assets
- Implement multipart upload for large files
- Use S3 Transfer Acceleration for global users
- Set appropriate cache headers

### Next.js Optimization

- Use static generation where possible
- Implement incremental static regeneration
- Optimize bundle size
- Use React Server Components

## Security Considerations

### Authentication

- Use httpOnly cookies for token storage
- Implement CSRF protection
- Enable MFA in Cognito
- Use secure password policies

### Database

- Implement row-level security with IAM policies
- Encrypt data at rest (enabled by default)
- Use VPC endpoints for private access
- Audit access with CloudTrail

### Storage

- Use presigned URLs with short expiration
- Implement bucket policies for access control
- Enable versioning for critical files
- Use S3 Object Lock for compliance

### AI

- Implement content filtering
- Rate limit AI requests per user
- Monitor for abuse
- Sanitize user inputs

### General

- Use AWS WAF for DDoS protection
- Enable CloudTrail for audit logging
- Use Secrets Manager for sensitive credentials
- Implement least privilege IAM policies

## Monitoring and Observability

### Metrics to Track

- Authentication success/failure rates
- Database query latency
- AI request latency and token usage
- S3 upload/download success rates
- Error rates by service
- User activity patterns

### Logging Strategy

- Structured JSON logs
- Include correlation IDs for request tracing
- Log levels: DEBUG (local), INFO (prod), ERROR (always)
- Retain logs for 30 days minimum

### Alerting

- Set up CloudWatch alarms for:
  - High error rates
  - Slow response times
  - DynamoDB throttling
  - Bedrock quota limits
  - S3 upload failures

### Dashboards

- Create CloudWatch dashboards for:
  - System health overview
  - User activity metrics
  - Cost tracking
  - Performance metrics

## Cost Optimization

### DynamoDB

- Use on-demand billing initially
- Switch to provisioned capacity if usage is predictable
- Implement TTL for temporary data
- Use DynamoDB Accelerator (DAX) only if needed

### Bedrock

- Monitor token usage closely
- Implement caching to reduce API calls
- Use cheaper models for simple tasks
- Set up budget alerts

### S3

- Use S3 Intelligent-Tiering for automatic cost optimization
- Implement lifecycle policies to move old data to Glacier
- Delete unused files regularly
- Use S3 Select for efficient queries

### Compute

- Use Lambda for variable workloads
- Consider Reserved Instances for predictable workloads
- Implement auto-scaling
- Monitor and optimize cold starts

## Rollback Strategy

### Preparation

- Keep Firebase services running during migration
- Implement feature flags for gradual rollout
- Maintain data sync between Firebase and AWS during transition

### Rollback Triggers

- Critical bugs affecting core functionality
- Performance degradation > 50%
- Data integrity issues
- Cost overruns > 200% of estimates

### Rollback Process

1. Disable AWS services via feature flags
2. Re-enable Firebase services
3. Verify data consistency
4. Investigate and fix issues
5. Plan re-migration

## Success Criteria

The migration will be considered successful when:

1. All existing features work with AWS services
2. Authentication success rate > 99%
3. Database query latency < 100ms (p95)
4. AI generation success rate > 95%
5. Zero data loss during migration
6. Local development environment works smoothly
7. Production deployment is stable for 7 days
8. All tests pass (unit, property-based, integration)
9. Cost is within 20% of Firebase costs
10. User satisfaction maintained or improved
