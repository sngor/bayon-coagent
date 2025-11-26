# Bayon CoAgent - Copilot Instructions

A Next.js SaaS platform for real estate agents with AI-powered content generation, market research, and business intelligence.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js (App Router) with Server Components by default
- **UI**: shadcn/ui + Tailwind CSS (single design system)
- **Auth**: AWS Cognito with JWT tokens
- **Database**: DynamoDB (single-table design with composite keys)
- **AI**: AWS Bedrock (Claude 3.5 Sonnet) via flows in `/src/aws/bedrock/flows/`
- **Storage**: S3 (user files, generated images)
- **Logging**: CloudWatch + X-Ray tracing
- **Search**: Tavily API integration
- **Hosting**: AWS Amplify

### Core Data Flow
1. **Client (Next.js)** → Server Actions (`src/app/actions.ts`)
2. **Server Actions** → AWS Services (Cognito, DynamoDB, Bedrock, S3, SES)
3. **Client State** → React hooks (`use-query`, `use-item`) via DynamoDB repository pattern

### DynamoDB Single-Table Design
**Key Patterns:**
```typescript
User Profile:       PK: USER#<userId>,    SK: PROFILE
Content/Library:    PK: USER#<userId>,    SK: CONTENT#<contentId>
Projects:          PK: USER#<userId>,    SK: PROJECT#<projectId>
Reports/Research:  PK: USER#<userId>,    SK: REPORT#<reportId>
Feedback:          PK: FEEDBACK,         SK: <feedbackId>#<userId>
```

All entities include: `PK`, `SK`, `EntityType`, `Data` (wrapped content), `CreatedAt`, `UpdatedAt`

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated routes (protected by layout)
│   │   ├── studio/         # Content creation (write, describe, reimagine)
│   │   ├── intelligence/   # Research & analysis tools
│   │   └── brand-center/   # Profile, audit, strategy
│   ├── api/                # API routes (OAuth callbacks, webhooks)
│   └── actions.ts          # 5500+ lines of server actions
├── aws/
│   ├── auth/               # Cognito client + useUser hook + server auth
│   ├── bedrock/            # AI flows (structured prompt-based, not agents)
│   ├── dynamodb/           # Repository pattern + React hooks
│   ├── s3/                 # File upload/download/presigned URLs
│   ├── logging/            # CloudWatch + X-Ray
│   └── config.ts           # Environment-aware AWS config
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── standard/           # Design system: StandardPageLayout, StandardCard, etc.
│   ├── project-selector.tsx # Reusable project picker (used in all forms)
│   └── [feature]/          # Feature components
├── lib/
│   ├── types.ts            # Global TypeScript interfaces
│   ├── alerts/             # Notification system
│   ├── sagas/              # Saga pattern for complex workflows
│   └── [utilities]/        # Helpers (retry-utility, performance-metrics, etc.)
└── ai/
    └── schemas/            # Zod validation schemas for AI inputs/outputs
```

## Critical Developer Workflows

### Running Locally
```bash
npm run dev                    # Start Next.js dev server
npm run localstack:start       # Start Docker containers (DynamoDB, Cognito, S3)
npm run localstack:init       # Initialize LocalStack with tables/users
```

### Testing
```bash
npm test                       # Run Jest with ESM support
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
```

### Building & Deployment
```bash
npm run build                  # Production build
npm run build:analyze         # Bundle analysis
npm run sam:deploy:dev        # Deploy Lambda/AWS backend (SAM)
npm run deploy:amplify        # Deploy to Amplify Hosting
```

### Key Scripts
- `npm run verify:setup` - Checks environment + AWS credentials
- `npm run verify:bedrock-models` - Confirms Claude availability
- `npm run migrate:all` - Firebase → DynamoDB migration pipeline
- `npm run lighthouse` - Performance testing

## Server Actions Pattern

All async operations use a consistent pattern from `src/app/actions.ts`:

```typescript
'use server';

export async function exampleAction(prevState: any, formData: FormData): Promise<{
  message: string;           // 'success', 'validation failed', or error message
  data: any | null;          // Response payload
  errors?: Record<string, string[]>;  // Zod validation errors
}> {
  // 1. Validate with Zod schema
  const validated = exampleSchema.safeParse({ ... });
  if (!validated.success) {
    return { message: 'Validation failed', errors: validated.error.flatten().fieldErrors, data: null };
  }

  // 2. Authenticate if needed
  const { getCurrentUserServer } = await import('@/aws/auth/server-auth');
  const user = await getCurrentUserServer();

  // 3. Perform business logic
  try {
    const result = await someAsyncOperation(validated.data);
    return { message: 'success', data: result, errors: {} };
  } catch (error) {
    const errorMessage = handleAWSError(error, 'Default error message');
    return { message: errorMessage, data: null, errors: {} };
  }
}
```

**Error Handling:** Use `handleAWSError()` for AWS service errors → user-friendly messages

## Component Patterns

### Client Components Pattern
```typescript
'use client';

import { useUser } from '@/aws/auth';        // Current authenticated user
import { useQuery } from '@/aws/dynamodb/hooks/use-query';  // Data fetching
import type { Project } from '@/lib/types';

export function MyComponent() {
  const { user, isLoading } = useUser();
  const { data: projects, loading } = useQuery(...);
  
  // Prefer useMemo for expensive computations
  const organized = useMemo(() => groupData(projects), [projects]);
  
  return <div>...</div>;
}
```

### Design System
Use `StandardPageLayout`, `StandardCard`, `StandardSkeleton`, `StandardEmptyState` from `src/components/standard/` for consistency. These wrap shadcn/ui with project-specific styling.

### Project Selector Pattern
In forms that save content, include:
```tsx
import { ProjectSelector } from '@/components/project-selector';

// In form:
<ProjectSelector value={projectId} onChange={setProjectId} label="Save to Project" />
```

## AI Integration (AWS Bedrock Flows)

All AI operations are in `/src/aws/bedrock/flows/` as **structured flows**, not agents:

```typescript
// Example: src/aws/bedrock/flows/generate-blog-post.ts
export async function generateBlogPost(input: GenerateBlogPostInput): Promise<GenerateBlogPostOutput> {
  // Uses Claude 3.5 Sonnet via Bedrock
  // Input validated with Zod schemas from src/ai/schemas/
  // Returns structured output (title, content, tags)
}
```

**Key flows:** listing descriptions, blog posts, social media, research, competitor analysis, neighborhood profiles, ROI calculations.

Import schemas from `src/ai/schemas/` for validation. Always validate inputs before calling AI.

## DynamoDB & Repository Pattern

**Query Data:**
```typescript
const repository = getRepository();
const result = await repository.query(
  'USER#userId',
  'CONTENT#',  // SK prefix (optional)
  { limit: 50, scanIndexForward: false }  // Descending order
);
```

**Save Data:**
```typescript
await repository.create(pk, sk, 'EntityType', { ...data });  // New item
await repository.update(pk, sk, { field: newValue });         // Partial update
await repository.put({ PK, SK, EntityType, Data, ... });      // Full replace
```

**React Hooks:**
```typescript
const { data, loading, error } = useQuery(pk, skPrefix, options);
const { item, loading } = useItem(pk, sk);
```

## Common Conventions

### Naming
- Server actions: `*Action` suffix (e.g., `generateBlogPostAction`)
- Database keys: `get*Keys()` helpers (e.g., `getProjectKeys()`)
- Component hooks: `use*` prefix
- Utils: Descriptive names in `src/lib/`

### Validation
- Always use Zod schemas from `src/ai/schemas/` for AI inputs
- Validate FormData before processing
- Return validation errors in standard response format

### Error Handling
- Use `handleAWSError()` for AWS service exceptions
- Log to CloudWatch via `src/aws/logging/`
- Return user-friendly error messages in `message` field
- Never leak internal error details to client

### Performance
- Use `useMemo` for expensive groupings/calculations in components
- Query with `scanIndexForward: false` for descending order (most recent first)
- Import dynamically with `await import()` to reduce bundle size
- Use X-Ray for tracing complex flows

## Testing Approach

Tests are ESM with Jest + ts-jest:
```bash
npm test -- --testPathPattern=myfeature
```

**Test patterns:**
- Visual regression tests: verify component structure/styling
- Unit tests: utilities, formatters, business logic
- Integration tests: server actions with mocked AWS services

Mock setup in `src/__tests__/mocks/setup.ts`.

## Environment Configuration

`.env.local` must include:
```
NEXT_PUBLIC_COGNITO_CLIENT_ID=...
COGNITO_USER_POOL_ID=...
DYNAMODB_TABLE_NAME=...
AWS_REGION=us-east-1
```

Use `src/aws/config.ts` to detect environment (dev, local, prod) and route to LocalStack or real AWS services.

## Local Development with LocalStack

LocalStack emulates AWS services locally:
```bash
docker-compose up -d          # Start containers
npm run localstack:init       # Create tables, users, roles
npm run dev                   # Start Next.js (connects to LocalStack)
```

DynamoDB local: `http://localhost:8000`, S3: `http://localhost:4566`, Cognito: LocalStack endpoint.

## Key Files to Reference

| File | Purpose |
|------|---------|
| `src/app/actions.ts` | All server action logic (~5500 lines) |
| `src/aws/config.ts` | AWS service initialization |
| `src/aws/dynamodb/repository.ts` | DynamoDB CRUD abstraction |
| `src/lib/types.ts` | Global TypeScript definitions |
| `docs/backend.json` | Data schema documentation |
| `docs/guides/architecture.md` | Full architecture details |
| `.github/workflows/` | CI/CD pipeline |

## Adding New Features

1. **Design data model** - Define DynamoDB keys (PK/SK pattern)
2. **Create Zod schema** - Input validation in `src/ai/schemas/`
3. **Write server action** - In `src/app/actions.ts` following pattern
4. **Build UI component** - Use StandardPageLayout + ProjectSelector if applicable
5. **Add tests** - Jest tests in `src/__tests__/`
6. **Update docs** - Reference in `docs/guides/`

## Important Notes

- **Server Components by Default**: Pages/layouts are server components unless marked `'use client'`
- **No Agents**: AI flows are deterministic, schema-driven (not tool-using agents)
- **Single Table**: All data in one DynamoDB table with composite keys
- **Auth on Every Action**: Check `getCurrentUserServer()` in server actions
- **Gradual AWS Migration**: Legacy Firebase code still present; migrate gradually to AWS services
- **Rate Limiting**: Use `src/lib/rate-limiter.ts` for API-heavy operations
- **Image Generation**: Use Gemini (Google) or Bedrock Vision, upload to S3, serve via presigned URLs
