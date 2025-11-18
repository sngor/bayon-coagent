# Design Document

## Overview

This design document outlines the transformation of the Co-agent Marketer application from a monolithic Next.js architecture into a microservices-based architecture. The design follows a pragmatic approach, extracting services where clear benefits exist while maintaining the Next.js frontend as the primary orchestration layer.

### Current Architecture

The application currently runs as a Next.js monolith with:

- **Frontend**: React components with Server Components
- **Backend**: Next.js Server Actions calling AWS services directly
- **Data Layer**: Single DynamoDB table with single-table design
- **AI Processing**: AWS Bedrock flows executed in-process
- **Storage**: S3 for file uploads
- **Authentication**: AWS Cognito

### Target Architecture

The target architecture extracts three key microservices:

1. **AI Content Generation Service** - Handles all Bedrock AI workloads
2. **Search Service** - Manages web search via Tavily API
3. **OAuth Service** - Centralizes token management and refresh logic

The Next.js application remains as the primary user interface and orchestration layer, calling microservices through API Gateway.

## Architecture

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (BFF)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              React Components (UI Layer)                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Server Actions (Orchestration Layer)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS API Gateway                             │
│  • JWT Authentication (Cognito)                                  │
│  • Request Routing                                               │
│  • Rate Limiting                                                 │
│  • Request/Response Transformation                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│  AI Generation   │ │    Search    │ │    OAuth     │
│    Service       │ │   Service    │ │   Service    │
│  (Lambda)        │ │  (Lambda)    │ │  (Lambda)    │
└────────┬─────────┘ └──────┬───────┘ └──────┬───────┘
         │                  │                 │
         ▼                  ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   AWS Bedrock    │ │  Tavily API  │ │  DynamoDB    │
│  (Claude 3.5)    │ │              │ │  (Tokens)    │
└──────────────────┘ └──────────────┘ └──────────────┘
         │
         ▼
┌──────────────────┐
│   EventBridge    │
│  (Async Events)  │
└──────────────────┘
```

### Service Boundaries

#### AI Content Generation Service

**Responsibilities:**

- Execute all Bedrock AI flows (blog posts, social media, market updates, etc.)
- Validate input using Zod schemas
- Handle retry logic for throttling
- Publish completion events to EventBridge
- Return structured JSON responses

**Does NOT:**

- Store generated content (Next.js handles persistence)
- Manage user sessions
- Handle file uploads

#### Search Service

**Responsibilities:**

- Execute Tavily web searches
- Cache search results (Redis/ElastiCache)
- Abstract search provider implementation
- Rate limit external API calls
- Format results in consistent schema

**Does NOT:**

- Store search history
- Manage user preferences
- Execute AI processing

#### OAuth Service

**Responsibilities:**

- Exchange authorization codes for tokens
- Store encrypted tokens in DynamoDB
- Automatically refresh expired tokens
- Validate token state
- Provide token retrieval API

**Does NOT:**

- Handle OAuth authorization flow (Next.js redirects)
- Manage user profiles
- Execute business logic with tokens

### Communication Patterns

#### Synchronous (REST API)

Used for request-response patterns where immediate results are needed:

- Next.js → AI Service: Generate content
- Next.js → Search Service: Execute search
- Next.js → OAuth Service: Get/refresh tokens
- AI Service → Search Service: Fetch data for AI context

#### Asynchronous (EventBridge)

Used for fire-and-forget patterns and cross-service notifications:

- AI Service → EventBridge: Content generation completed
- OAuth Service → EventBridge: Token refreshed/revoked
- Search Service → EventBridge: Cache invalidation

### Data Flow Example: Generate Blog Post

```
1. User clicks "Generate Blog Post" in UI
2. Next.js Server Action validates input
3. Server Action calls API Gateway /ai/generate-blog-post
4. API Gateway validates JWT, routes to AI Service Lambda
5. AI Service Lambda:
   a. Validates input against Zod schema
   b. Calls Search Service for recent news (if needed)
   c. Invokes Bedrock with prompt
   d. Publishes "blog-post-generated" event to EventBridge
   e. Returns structured response
6. API Gateway returns response to Next.js
7. Server Action saves content to DynamoDB
8. Server Action returns result to UI
9. UI displays generated blog post
```

## Components and Interfaces

### AI Content Generation Service

#### API Endpoints

**POST /ai/generate-agent-bio**

```typescript
Request:
{
  name: string;
  experience?: string;
  certifications?: string;
  agencyName: string;
}

Response:
{
  bio: string;
}
```

**POST /ai/generate-blog-post**

```typescript
Request:
{
  topic: string;
}

Response:
{
  blogPost: {
    title: string;
    content: string;
    metaDescription: string;
    tags: string[];
  };
  headerImage: {
    url: string;
    alt: string;
  };
}
```

**POST /ai/generate-social-media-post**

```typescript
Request: {
  topic: string;
  tone: "Professional" | "Casual" | "Enthusiastic" | "Humorous";
}

Response: {
  facebook: string;
  instagram: string;
  twitter: string;
  linkedin: string;
}
```

**POST /ai/generate-marketing-plan**

```typescript
Request:
{
  brandAudit: BrandAuditData;
  competitors: CompetitorData[];
}

Response:
{
  plan: {
    steps: Array<{
      title: string;
      description: string;
      tactics: string[];
    }>;
    timeline: string;
    budget: string;
  };
}
```

**POST /ai/run-research-agent**

```typescript
Request:
{
  topic: string;
}

Response:
{
  summary: string;
  keyFindings: string[];
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}
```

**POST /ai/analyze-reviews**

```typescript
Request:
{
  comments: string[];
}

Response:
{
  overallSentiment: 'positive' | 'neutral' | 'negative';
  themes: Array<{
    theme: string;
    frequency: number;
    sentiment: string;
  }>;
  recommendations: string[];
}
```

#### Lambda Configuration

- **Runtime**: Node.js 20.x
- **Memory**: 1024 MB (adjustable based on load)
- **Timeout**: 300 seconds (5 minutes for long AI operations)
- **Concurrency**: Reserved concurrency of 10 (prevent runaway costs)
- **Environment Variables**:
  - `BEDROCK_MODEL_ID`
  - `BEDROCK_REGION`
  - `SEARCH_SERVICE_URL`
  - `EVENTBRIDGE_BUS_NAME`

### Search Service

#### API Endpoints

**POST /search/web**

```typescript
Request:
{
  query: string;
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
}

Response:
{
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
  }>;
  totalResults: number;
}
```

**POST /search/news**

```typescript
Request:
{
  query: string;
  location?: string;
  days?: number;
}

Response:
{
  articles: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
    publishedDate: string;
  }>;
}
```

#### Lambda Configuration

- **Runtime**: Node.js 20.x
- **Memory**: 512 MB
- **Timeout**: 30 seconds
- **Caching**: ElastiCache Redis for 1-hour TTL
- **Environment Variables**:
  - `TAVILY_API_KEY`
  - `REDIS_ENDPOINT`
  - `CACHE_TTL_SECONDS`

### OAuth Service

#### API Endpoints

**POST /oauth/exchange**

```typescript
Request: {
  code: string;
  provider: "GOOGLE_BUSINESS" | "FACEBOOK" | "ZILLOW";
  userId: string;
}

Response: {
  success: boolean;
  expiresAt: number;
}
```

**GET /oauth/tokens/{userId}/{provider}**

```typescript
Response: {
  accessToken: string;
  expiresAt: number;
  isValid: boolean;
}
```

**POST /oauth/refresh**

```typescript
Request: {
  userId: string;
  provider: string;
}

Response: {
  accessToken: string;
  expiresAt: number;
}
```

**DELETE /oauth/tokens/{userId}/{provider}**

```typescript
Response: {
  success: boolean;
}
```

#### Lambda Configuration

- **Runtime**: Node.js 20.x
- **Memory**: 256 MB
- **Timeout**: 10 seconds
- **Environment Variables**:
  - `DYNAMODB_TABLE_NAME`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `ENCRYPTION_KEY_ARN` (KMS key for token encryption)

### Next.js Server Actions (Orchestration Layer)

Server actions remain in Next.js but are refactored to call microservices:

```typescript
// Before (Monolith)
export async function generateBlogPostAction(prevState: any, formData: FormData) {
  const result = await generateBlogPost(input); // Direct Bedrock call
  await repository.create(...); // Save to DB
  return result;
}

// After (Microservices)
export async function generateBlogPostAction(prevState: any, formData: FormData) {
  // Call AI Service via API Gateway
  const result = await fetch(`${AI_SERVICE_URL}/ai/generate-blog-post`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getIdToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  // Save to DB (Next.js still owns data persistence)
  await repository.create(...);

  return result;
}
```

## Data Models

### DynamoDB Single-Table Design (Unchanged)

The existing single-table design remains, with each service accessing only its domain:

| Service        | Owned Entities                                                                                  | Access Pattern        |
| -------------- | ----------------------------------------------------------------------------------------------- | --------------------- |
| Next.js        | UserProfile, AgentProfile, SavedContent, ResearchReport, Project, MarketingPlan, ReviewAnalysis | Full CRUD             |
| OAuth Service  | OAuthToken                                                                                      | Full CRUD             |
| AI Service     | None (stateless)                                                                                | Read-only for context |
| Search Service | None (uses cache)                                                                               | None                  |

### OAuth Token Encryption

Tokens stored in DynamoDB are encrypted at rest using AWS KMS:

```typescript
interface EncryptedOAuthToken {
  PK: string; // OAUTH#<userId>
  SK: string; // <provider>
  EntityType: "OAuthToken";
  Data: {
    agentProfileId: string;
    accessToken: string; // Encrypted with KMS
    refreshToken: string; // Encrypted with KMS
    expiryDate: number;
    provider: string;
  };
  CreatedAt: number;
  UpdatedAt: number;
}
```

### Event Schemas

**AI Content Generated Event**

```typescript
{
  eventType: "ai.content.generated";
  timestamp: number;
  userId: string;
  contentType: "blog-post" |
    "social-media" |
    "marketing-plan" |
    "research-report";
  metadata: {
    topic: string;
    duration: number;
    tokensUsed: number;
  }
}
```

**OAuth Token Refreshed Event**

```typescript
{
  eventType: "oauth.token.refreshed";
  timestamp: number;
  userId: string;
  provider: string;
  expiresAt: number;
}
```

**Search Cache Invalidation Event**

```typescript
{
  eventType: "search.cache.invalidate";
  timestamp: number;
  pattern: string; // Cache key pattern to invalidate
}
```

##

Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### AI Content Generation Service Properties

**Property 1: Bedrock invocation for valid requests**
_For any_ valid AI generation request, the service should invoke AWS Bedrock with the correct model ID and parameters
**Validates: Requirements 2.1**

**Property 2: Schema-conformant responses**
_For any_ AI generation request, the service should return a response that validates against the defined Zod output schema
**Validates: Requirements 2.2**

**Property 3: Concurrent request handling**
_For any_ set of concurrent AI generation requests, the service should process all requests without exceeding the configured rate limit
**Validates: Requirements 2.4**

**Property 4: Event publication on completion**
_For any_ completed AI generation request, the service should publish exactly one completion event to EventBridge
**Validates: Requirements 2.5**

### Search Service Properties

**Property 5: Tavily API invocation**
_For any_ search query, the service should invoke the Tavily API with the query and configured parameters
**Validates: Requirements 3.1**

**Property 6: Consistent result schema**
_For any_ search results returned, regardless of provider, the results should conform to the defined result schema
**Validates: Requirements 3.2**

**Property 7: Cache utilization for repeated queries**
_For any_ search query executed multiple times within the cache TTL, subsequent requests should return cached results without calling the external API
**Validates: Requirements 3.4**

### OAuth Service Properties

**Property 8: Token exchange for valid codes**
_For any_ valid authorization code, the service should successfully exchange it for access and refresh tokens
**Validates: Requirements 4.1**

**Property 9: Token encryption at rest**
_For any_ OAuth token stored in DynamoDB, the access token and refresh token fields should be encrypted using KMS
**Validates: Requirements 4.2**

**Property 10: Automatic token refresh**
_For any_ expired OAuth token with a valid refresh token, calling the get tokens endpoint should automatically refresh and return a new valid token
**Validates: Requirements 4.3**

**Property 11: Consistent token state**
_For any_ user and provider, concurrent requests for OAuth tokens should return the same token state (no race conditions)
**Validates: Requirements 4.5**

### Orchestration Layer Properties

**Property 12: Service orchestration**
_For any_ user action that requires microservice calls, the Next.js server action should successfully orchestrate calls to all required services
**Validates: Requirements 5.1**

**Property 13: Error handling with fallbacks**
_For any_ microservice call that fails, the server action should either implement fallback logic or return a user-friendly error message
**Validates: Requirements 5.3**

**Property 14: Data aggregation**
_For any_ server action that calls multiple services, the response should be a unified data structure combining all service responses
**Validates: Requirements 5.4**

**Property 15: Authentication enforcement**
_For any_ server action that requires authentication, requests without valid user sessions should be rejected before calling microservices
**Validates: Requirements 5.5**

### API Contract Properties

**Property 16: Request validation**
_For any_ microservice endpoint, requests with invalid payloads should be rejected with appropriate validation error messages
**Validates: Requirements 6.2**

**Property 17: HTTP status code correctness**
_For any_ microservice response, the HTTP status code should correctly reflect the outcome (2xx for success, 4xx for client errors, 5xx for server errors)
**Validates: Requirements 6.3**

**Property 18: Asynchronous event publication**
_For any_ operation that requires asynchronous communication, the service should publish an event to EventBridge rather than making a direct synchronous call
**Validates: Requirements 6.5**

### Infrastructure Properties

**Property 19: API Gateway routing**
_For any_ request to API Gateway, the request should be routed to the correct Lambda function based on the path and HTTP method
**Validates: Requirements 7.2**

**Property 20: JWT validation at gateway**
_For any_ request to API Gateway, requests with invalid or missing JWT tokens should be rejected before reaching Lambda functions
**Validates: Requirements 7.3**

**Property 21: Data ownership enforcement**
_For any_ microservice, write operations should only succeed for data entities owned by that service
**Validates: Requirements 8.1**

**Property 22: Event-driven data sharing**
_For any_ data change that affects multiple services, the owning service should publish an event rather than directly updating other services' data
**Validates: Requirements 8.4**

### Observability Properties

**Property 23: Structured logging with correlation IDs**
_For any_ microservice request, the service should emit structured logs to CloudWatch that include a correlation ID
**Validates: Requirements 9.1**

**Property 24: Trace context propagation**
_For any_ request that spans multiple services, the trace context should be propagated through all service calls for end-to-end tracing
**Validates: Requirements 9.2**

**Property 25: Error metrics emission**
_For any_ error encountered by a microservice, the service should emit a metric to CloudWatch with error type and service name
**Validates: Requirements 9.3**

**Property 26: Service call tracing**
_For any_ service-to-service call, the call should be recorded in AWS X-Ray distributed tracing
**Validates: Requirements 9.5**

## Error Handling

### Error Categories

#### Client Errors (4xx)

- **400 Bad Request**: Invalid input, schema validation failures
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Resource does not exist
- **429 Too Many Requests**: Rate limit exceeded

#### Server Errors (5xx)

- **500 Internal Server Error**: Unexpected service errors
- **502 Bad Gateway**: Downstream service unavailable
- **503 Service Unavailable**: Service temporarily unavailable (circuit breaker open)
- **504 Gateway Timeout**: Request timeout

### Retry Strategy

**Exponential Backoff Configuration:**

```typescript
{
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ThrottlingException',
    'ServiceUnavailable',
    'RequestTimeout',
  ]
}
```

**Non-Retryable Errors:**

- Validation errors (400)
- Authentication errors (401, 403)
- Not found errors (404)
- Client errors (4xx except 429)

### Circuit Breaker Pattern

Each microservice implements circuit breaker for external dependencies:

**States:**

- **Closed**: Normal operation, requests flow through
- **Open**: Too many failures, requests fail fast
- **Half-Open**: Testing if service recovered

**Configuration:**

```typescript
{
  failureThreshold: 5,      // Open after 5 failures
  successThreshold: 2,      // Close after 2 successes in half-open
  timeout: 60000,           // Try half-open after 60 seconds
  monitoringPeriod: 10000   // Track failures over 10 seconds
}
```

### Graceful Degradation

**AI Service Unavailable:**

- Return cached content if available
- Show user-friendly message: "AI service temporarily unavailable"
- Allow manual content creation

**Search Service Unavailable:**

- Skip search-dependent features
- Use stale cached results if available
- Continue with other operations

**OAuth Service Unavailable:**

- Use cached tokens if not expired
- Disable OAuth-dependent features temporarily
- Show reconnection prompt to user

## Testing Strategy

### Unit Testing

**AI Content Generation Service:**

- Test Zod schema validation for all input/output types
- Test Bedrock client invocation with mocked responses
- Test retry logic with simulated throttling
- Test event publication to EventBridge
- Test error handling for various failure scenarios

**Search Service:**

- Test Tavily API client with mocked responses
- Test cache hit/miss logic
- Test result schema transformation
- Test rate limiting logic
- Test provider abstraction layer

**OAuth Service:**

- Test token exchange flow with mocked OAuth provider
- Test token encryption/decryption
- Test token refresh logic
- Test token expiration detection
- Test concurrent token access

**Next.js Server Actions:**

- Test orchestration logic with mocked service calls
- Test error handling and fallback logic
- Test data aggregation from multiple services
- Test authentication validation
- Test parallel request execution

### Property-Based Testing

Property-based tests will be implemented using **fast-check** for JavaScript/TypeScript. Each correctness property will have a corresponding property-based test that generates random inputs and verifies the property holds.

**Configuration:**

- Minimum 100 iterations per property test
- Shrinking enabled to find minimal failing cases
- Seed-based reproducibility for debugging

**Example Property Test:**

```typescript
// Property 2: Schema-conformant responses
import fc from "fast-check";

test("Property 2: All AI responses conform to schema", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        topic: fc.string({ minLength: 10 }),
        tone: fc.constantFrom(
          "Professional",
          "Casual",
          "Enthusiastic",
          "Humorous"
        ),
      }),
      async (input) => {
        const response = await aiService.generateSocialMediaPost(input);

        // Verify response matches schema
        const result = SocialMediaPostSchema.safeParse(response);
        expect(result.success).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Tags:**
Each property-based test will include a comment tag referencing the design document:

```typescript
/**
 * Feature: microservices-architecture, Property 2: Schema-conformant responses
 */
```

### Integration Testing

**Service-to-Service Integration:**

- Test AI Service calling Search Service
- Test Next.js calling all microservices
- Test event flow through EventBridge
- Test API Gateway routing and authentication
- Test distributed tracing across services

**End-to-End Scenarios:**

- User generates blog post (Next.js → AI Service → Search Service)
- User connects Google Business Profile (Next.js → OAuth Service)
- User runs research agent (Next.js → AI Service → Search Service → EventBridge)
- Token refresh flow (Next.js → OAuth Service → Google OAuth)

**LocalStack Integration:**

- Test all services against LocalStack emulation
- Verify Lambda function execution
- Verify API Gateway routing
- Verify EventBridge event delivery
- Verify DynamoDB operations

### Load Testing

**AI Service:**

- Test concurrent request handling (10, 50, 100 concurrent requests)
- Test rate limiting behavior
- Test Lambda cold start impact
- Test Bedrock throttling handling

**Search Service:**

- Test cache effectiveness under load
- Test concurrent query handling
- Test cache invalidation performance

**OAuth Service:**

- Test concurrent token refresh
- Test token storage performance
- Test encryption/decryption overhead

### Monitoring and Alerting

**CloudWatch Metrics:**

- Request count per service
- Error rate per service
- Latency (p50, p95, p99) per endpoint
- Lambda concurrent executions
- DynamoDB read/write capacity
- Cache hit/miss ratio

**CloudWatch Alarms:**

- Error rate > 5% for 5 minutes
- Latency p99 > 5 seconds for 5 minutes
- Lambda throttling > 10 per minute
- DynamoDB throttling > 5 per minute

**X-Ray Tracing:**

- End-to-end request tracing
- Service map visualization
- Bottleneck identification
- Error trace analysis

## Deployment Strategy

### Phase 1: Infrastructure Setup (Week 1-2)

**Tasks:**

1. Create API Gateway with JWT authorizer
2. Set up EventBridge event bus
3. Create Lambda execution roles with least privilege
4. Set up CloudWatch log groups and dashboards
5. Configure X-Ray tracing
6. Set up ElastiCache Redis for search caching
7. Create KMS key for OAuth token encryption

**Validation:**

- Infrastructure deployed via CDK
- All services can communicate
- Logging and tracing working
- LocalStack configuration updated

### Phase 2: OAuth Service Migration (Week 3-4)

**Tasks:**

1. Extract OAuth token management code
2. Create OAuth Service Lambda functions
3. Implement API endpoints
4. Add token encryption with KMS
5. Update Next.js to call OAuth Service
6. Deploy with feature flag (disabled)
7. Run integration tests
8. Enable feature flag for 10% of traffic
9. Monitor for 48 hours
10. Gradually increase to 100%

**Rollback Plan:**

- Disable feature flag
- Traffic routes back to monolith
- No data migration needed (same DynamoDB table)

### Phase 3: Search Service Migration (Week 5-6)

**Tasks:**

1. Extract search code
2. Create Search Service Lambda functions
3. Implement caching with Redis
4. Implement API endpoints
5. Update AI Service to call Search Service
6. Update Next.js to call Search Service
7. Deploy with feature flag (disabled)
8. Run integration tests
9. Enable feature flag for 10% of traffic
10. Monitor for 48 hours
11. Gradually increase to 100%

**Rollback Plan:**

- Disable feature flag
- Services call Tavily directly
- Clear Redis cache

### Phase 4: AI Service Migration (Week 7-10)

**Tasks:**

1. Extract all Bedrock flows
2. Create AI Service Lambda functions
3. Implement all AI endpoints
4. Add EventBridge event publication
5. Update Next.js server actions
6. Deploy with feature flag (disabled)
7. Run comprehensive integration tests
8. Enable feature flag for 5% of traffic
9. Monitor for 72 hours
10. Gradually increase to 100%

**Rollback Plan:**

- Disable feature flag
- Next.js calls Bedrock directly
- No data loss (Next.js still owns persistence)

### Phase 5: Optimization and Cleanup (Week 11-12)

**Tasks:**

1. Remove old code from monolith
2. Optimize Lambda memory/timeout settings
3. Tune cache TTLs
4. Optimize DynamoDB indexes
5. Set up production alarms
6. Document runbooks
7. Train team on new architecture

## Migration Considerations

### Data Migration

**No data migration required** - All services continue using the same DynamoDB table with single-table design. Only access patterns change.

### Backward Compatibility

During migration, both old and new implementations run simultaneously:

- Feature flags control routing
- Same data models used
- Same API contracts maintained
- Gradual traffic shifting

### Cost Implications

**Expected Cost Changes:**

- **API Gateway**: ~$3.50 per million requests
- **Lambda**: Pay per invocation (likely cheaper than always-on Next.js)
- **ElastiCache**: ~$15/month for cache.t3.micro
- **EventBridge**: ~$1 per million events
- **X-Ray**: ~$5 per million traces

**Cost Optimization:**

- Use Lambda reserved concurrency to prevent runaway costs
- Implement aggressive caching
- Use API Gateway caching for frequently accessed endpoints
- Monitor and optimize Lambda memory settings

### Team Structure

**Recommended Team Ownership:**

- **AI Service**: AI/ML team (2-3 developers)
- **Search Service**: Backend team (1-2 developers)
- **OAuth Service**: Security/Auth team (1-2 developers)
- **Next.js Frontend**: Frontend team (3-4 developers)
- **Platform/DevOps**: Infrastructure team (2-3 developers)

### Success Metrics

**Technical Metrics:**

- Service availability > 99.9%
- API latency p95 < 2 seconds
- Error rate < 1%
- Deployment frequency increased by 50%
- Mean time to recovery < 15 minutes

**Business Metrics:**

- No user-facing incidents during migration
- Feature velocity maintained or improved
- Team satisfaction with new architecture
- Reduced time to deploy AI model updates

## Conclusion

This microservices architecture provides a pragmatic path forward for the Co-agent Marketer application. By extracting three well-defined services (AI, Search, OAuth), we achieve:

1. **Independent Scalability**: AI workloads can scale independently from the web application
2. **Faster Deployment**: Teams can deploy services independently
3. **Better Fault Isolation**: Service failures don't cascade
4. **Technology Flexibility**: Services can use different runtimes/languages if needed
5. **Cost Optimization**: Pay only for actual usage with Lambda

The phased migration approach minimizes risk while delivering incremental value. The Next.js frontend remains as the orchestration layer, maintaining simplicity for UI development while gaining the benefits of microservices for backend processing.
