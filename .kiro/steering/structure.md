# Project Structure

## Root Organization

```
/src                    # Application source code
/infrastructure         # AWS CDK infrastructure as code
/scripts               # Build, deployment, and migration scripts
/public                # Static assets
/docs                  # Project documentation
```

## Source Code Structure (`/src`)

### `/src/app` - Next.js App Router

- **`/src/app/(app)`**: Authenticated routes (dashboard, profile, tools)
  - Each feature has its own directory with `page.tsx`
  - Use Server Components by default
  - Client components marked with `'use client'`
- **`/src/app/api`**: API routes (OAuth callbacks, webhooks)
- **`/src/app/actions.ts`**: Server Actions for form submissions and data mutations
- **`/src/app/oauth-actions.ts`**: OAuth-specific server actions
- **`/src/app/layout.tsx`**: Root layout with providers
- **`/src/app/globals.css`**: Global styles and Tailwind directives

### `/src/aws` - AWS Service Integrations

All AWS service code is isolated here with clean abstractions:

- **`/src/aws/auth`**: Cognito authentication
  - `cognito-client.ts`: Sign-up, sign-in, session management
  - `use-user.tsx`: React hook for current user state
  - `auth-provider.tsx`: Auth context provider
- **`/src/aws/dynamodb`**: Database access layer
  - `repository.ts`: CRUD operations with single-table design
  - `client.ts`: DynamoDB client configuration
  - `keys.ts`: Key pattern generators (PK/SK)
  - `/hooks`: React hooks (`useQuery`, `useItem`)
- **`/src/aws/s3`**: File storage
  - `client.ts`: Upload, download, presigned URLs
- **`/src/aws/bedrock`**: AI flows
  - `client.ts`: Bedrock invocation with streaming
  - `flow-base.ts`: Base flow interface and utilities
  - `/flows`: Individual AI flows (one file per feature)
- **`/src/aws/logging`**: CloudWatch integration
- **`/src/aws/search`**: Tavily search API
- **`/src/aws/config.ts`**: Environment detection and AWS configuration

### `/src/components` - React Components

- **`/src/components/ui`**: shadcn/ui components (Radix UI wrappers)
  - Reusable, accessible UI primitives
  - Styled with Tailwind CSS
  - Do not modify these directly; extend or compose them
- **`/src/components`**: Application-specific components
  - Feature-specific forms and displays
  - Layout components
  - Shared business logic components

### `/src/hooks` - Custom React Hooks

- `use-mobile.tsx`, `use-tablet.tsx`: Responsive breakpoint hooks
- `use-toast.ts`: Toast notification hook
- `use-s3-upload.ts`: S3 file upload hook
- `use-profile-completion.ts`: Profile completion tracking
- `use-virtual-scroll.tsx`: Virtual scrolling for large lists

### `/src/lib` - Utilities

- `utils.ts`: General utility functions (cn, formatters)
- `types.ts`: Shared TypeScript types
- `mobile-optimization.ts`: Mobile-specific utilities
- `tablet-optimization.ts`: Tablet-specific utilities
- `interaction-optimization.ts`: Performance optimization utilities
- Data files for training content, placeholder images, etc.

### `/src/ai/schemas` - Zod Schemas

- Input/output validation schemas for AI flows
- One file per AI feature (e.g., `blog-post-schemas.ts`)
- Used by Bedrock flows for structured I/O

### `/src/contexts` - React Contexts

- `tooltip-context.tsx`: Contextual tooltip state management

## Infrastructure (`/infrastructure`)

AWS CDK TypeScript project for infrastructure as code:

- `/lib`: Stack definitions (Cognito, DynamoDB, S3, IAM, Monitoring)
- `/scripts`: Deployment and verification scripts
- `cdk.json`: CDK configuration

## Scripts (`/scripts`)

- `/migration`: Firebase to AWS migration scripts
- `init-localstack.sh`: Initialize LocalStack resources
- `deploy-amplify.sh`: Automated Amplify deployment
- `verify-setup.js`: Local development verification

## Key Patterns

### DynamoDB Single-Table Design

All entities use composite keys:

```
PK: USER#<userId>          SK: PROFILE
PK: USER#<userId>          SK: AGENT#<id>
PK: USER#<userId>          SK: CONTENT#<id>
PK: USER#<userId>          SK: REPORT#<id>
PK: USER#<userId>          SK: PLAN#<id>
PK: USER#<userId>          SK: OAUTH#<provider>
```

### Server Actions Pattern

1. Define action in `/src/app/actions.ts`
2. Validate input with Zod schema
3. Call AWS service or Bedrock flow
4. Return structured response with `{ message, data, errors }`

### AI Flow Pattern

1. Define schemas in `/src/ai/schemas`
2. Create flow in `/src/aws/bedrock/flows`
3. Export typed function
4. Call from server action

### Component Organization

- Server Components for data fetching and layout
- Client Components for interactivity (forms, animations)
- UI components from shadcn/ui for consistency
- Custom hooks for shared logic

### Responsive Design

- Mobile-first approach with Tailwind breakpoints
- `use-mobile()` and `use-tablet()` hooks for conditional rendering
- Responsive tables with card view on mobile
- Touch-optimized interactions

### Performance Optimization

- Virtual scrolling for large lists (>100 items)
- Dynamic imports for heavy components
- Optimistic UI updates
- Request deduplication and caching

## File Naming Conventions

- **Components**: `kebab-case.tsx` (e.g., `page-header.tsx`)
- **Hooks**: `use-*.tsx` (e.g., `use-mobile.tsx`)
- **Types**: `types.ts` or `*.types.ts`
- **Tests**: `*.test.ts` or `__tests__/*.tsx`
- **Server Actions**: `actions.ts` or `*-actions.ts`

## Import Aliases

Use `@/` for absolute imports from `/src`:

```typescript
import { getRepository } from "@/aws/dynamodb/repository";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```
