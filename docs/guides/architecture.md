# Co-agent Marketer Architecture

This document provides a high-level overview of the Co-agent Marketer project architecture, covering the directory structure, core concepts, data flow, and AWS integration.

## System Architecture

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
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Bedrock    │  │  CloudWatch  │  │    Tavily    │      │
│  │    (AI)      │  │  (Logging)   │  │   (Search)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Local Development Architecture

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
│  │  • Cognito Local                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         AWS Bedrock (via real AWS credentials)          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS Cloud                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  CloudFront CDN → S3 Static Assets                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ▼                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js on AWS Amplify Hosting                        │ │
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

## Project Structure

The project is organized into several key directories:

- **/src/app/**: The heart of the Next.js application, using the App Router.

  - **/src/app/(app)/**: Contains all the main authenticated routes and pages of the application (e.g., Dashboard, Profile, Content Engine).
  - **/src/app/api/**: Handles API routes, such as the OAuth callback for Google Business Profile.
  - **/src/app/globals.css**: The global stylesheet, including Tailwind CSS directives and theme variables.
  - **/src/app/layout.tsx**: The root layout for the entire application.

- **/src/aws/**: AWS service integrations and utilities.

  - **/src/aws/auth/**: AWS Cognito authentication client and hooks (e.g., `cognito-client.ts`, `use-user.tsx`).
  - **/src/aws/dynamodb/**: DynamoDB client, repository pattern, and React hooks (e.g., `use-query.tsx`, `use-item.tsx`).
  - **/src/aws/s3/**: S3 client for file storage operations.
  - **/src/aws/bedrock/**: AWS Bedrock AI client and flow implementations.
  - **/src/aws/logging/**: CloudWatch logging utilities.
  - **/src/aws/search/**: Tavily search API integration.
  - **/src/aws/config.ts**: Central configuration module with environment detection.

- **/src/ai/**: Legacy AI functionality (being phased out in favor of `/src/aws/bedrock/`).

  - **/src/ai/schemas/**: Zod schemas for AI input/output validation (still used with Bedrock).

- **/src/components/**: Contains all reusable React components.

  - **/src/components/ui/**: Holds the `shadcn/ui` components, which are the building blocks of the user interface.
  - **/src/components/**: Contains custom, application-specific components (e.g., `PageHeader`, `Logo`, `CompetitorForm`).

- **/src/firebase/**: Legacy Firebase integration (maintained for backward compatibility during transition).

- **/infrastructure/**: AWS CDK infrastructure as code.

  - **/infrastructure/lib/**: CDK stack definitions for Cognito, DynamoDB, S3, IAM, and monitoring.
  - **/infrastructure/scripts/**: Deployment and verification scripts.

- **/scripts/migration/**: Data migration scripts from Firebase to AWS.

- **/docs/**: Contains project documentation and backend configuration.
  - **/docs/backend.json**: A crucial blueprint that defines the data entities and database structure for the entire application.

## Core Concepts

### UI: Next.js, shadcn/ui, and Tailwind CSS

The user interface is built with **Next.js** using the modern App Router. We use **Server Components** by default to improve performance. The visual styling is handled by **Tailwind CSS**, and the component library is **shadcn/ui**, which provides beautifully designed and accessible UI primitives that are highly customizable.

### Authentication: AWS Cognito

User authentication is handled by **AWS Cognito**, providing secure user management with JWT tokens.

- **Cognito Client**: The `src/aws/auth/cognito-client.ts` module provides methods for sign-up, sign-in, sign-out, and session management.
- **useUser Hook**: The `useUser` hook from `src/aws/auth/use-user.tsx` provides easy access to the current user's state throughout the app.
- **Token Management**: JWT tokens are automatically refreshed and validated for protected routes.
- **Local Development**: Uses LocalStack for local Cognito emulation.

### Database: Amazon DynamoDB

**DynamoDB** is our NoSQL database, using a single-table design pattern for optimal performance.

- **Single-Table Design**: All entities are stored in one table with composite keys (PK/SK) for efficient queries.
- **Repository Pattern**: The `src/aws/dynamodb/repository.ts` provides a clean abstraction for CRUD operations.
- **React Hooks**: Custom hooks `useQuery` and `useItem` (replacing `useCollection` and `useDoc`) provide reactive data access.
- **Real-time Updates**: Polling mechanism simulates real-time updates (can be upgraded to DynamoDB Streams).
- **Data Structure**: The structure is defined in `docs/backend.json` and mapped to DynamoDB key patterns.

**Key Patterns:**

```
User Profile:     PK: USER#<userId>,  SK: PROFILE
Agent Profile:    PK: USER#<userId>,  SK: AGENT#<id>
Saved Content:    PK: USER#<userId>,  SK: CONTENT#<id>
Research Reports: PK: USER#<userId>,  SK: REPORT#<id>
```

### Storage: Amazon S3

**S3** handles all file storage needs.

- **S3 Client**: The `src/aws/s3/client.ts` module provides upload, download, and presigned URL generation.
- **Presigned URLs**: Secure, temporary URLs for direct browser uploads and downloads.
- **CORS Configuration**: Configured for browser-based uploads.
- **Local Development**: Uses LocalStack S3 emulation.

### AI: AWS Bedrock

All AI features are implemented using **AWS Bedrock** with Claude 3.5 Sonnet.

- **Bedrock Client**: The `src/aws/bedrock/client.ts` module handles AI model invocations.
- **AI Flows**: Individual flows in `/src/aws/bedrock/flows/` orchestrate AI calls (e.g., `generate-agent-bio.ts`, `run-nap-audit.ts`).
- **Structured I/O**: We use **Zod** schemas (from `/src/ai/schemas/`) to define strict input and output schemas. This ensures reliable, structured JSON responses from the AI models.
- **Streaming Support**: Supports streaming responses for better user experience.
- **Calling Flows**: From the Next.js frontend, we call these flows via **Server Actions** defined in `src/app/actions.ts`.

### Web Search: Tavily API

**Tavily** provides web search capabilities for AI flows that need current information.

- **Search Client**: The `src/aws/search/client.ts` module integrates with Tavily API.
- **Used By**: Research agent, market updates, and other flows requiring web data.

### Configuration: Environment Detection

The `src/aws/config.ts` module automatically detects the environment and configures service endpoints:

- **Local Development**: When `USE_LOCAL_AWS=true`, connects to LocalStack at `http://localhost:4566`.
- **Production**: Connects to real AWS services in the configured region.
- **Centralized**: All AWS service configurations are managed in one place.

### Key Features Data Flow

- **AI Marketing Plan**: The `MarketingPlanPage` component allows a user to generate a plan. It calls the `generateMarketingPlanAction` server action, which invokes the Bedrock AI flow. This flow analyzes the user's latest `BrandAudit` and `Competitor` data from DynamoDB and sends it to Claude 3.5 Sonnet to create a 3-step plan. The resulting plan is saved back to DynamoDB with key pattern `PK: USER#<userId>, SK: PLAN#<planId>`.
- **Brand Audit & Zillow Integration**: In the `BrandAuditPage`, the "Run Audit" button triggers the `runNapAuditAction`, which calls the Bedrock flow to check NAP consistency across the web using Tavily search. The "Fetch Reviews" button calls the `getZillowReviewsAction`, which uses the agent's Zillow email to fetch reviews via the Bridge API. Fetched reviews are saved to DynamoDB.
- **Saved Content & Knowledge Base**: Throughout the app (e.g., in the Co-Marketing Studio), "Save" buttons allow users to store generated content. This content is saved to DynamoDB with appropriate key patterns (`CONTENT#<id>` or `REPORT#<id>`). The `SavedContentPage` and `KnowledgeBasePage` then query this data using the DynamoDB hooks, acting as personal libraries for the user.

## AWS Services Integration

### Local Development with LocalStack

LocalStack provides local emulation of AWS services for development:

- **DynamoDB Local**: Full DynamoDB API compatibility
- **S3 Local**: S3-compatible object storage
- **Cognito Local**: Basic Cognito user pool functionality
- **Endpoint**: All services accessible at `http://localhost:4566`

See [AWS Local Development Guide](./docs/aws-local-development.md) for setup instructions.

### Production AWS Services

In production, the application connects to real AWS services:

- **AWS Cognito**: User Pool for authentication
- **Amazon DynamoDB**: Single table with GSI for alternate access patterns
- **Amazon S3**: Bucket with CORS and lifecycle policies
- **AWS Bedrock**: Claude 3.5 Sonnet model access
- **AWS CloudWatch**: Centralized logging and monitoring

See [AWS Setup Guide](./AWS_SETUP.md) for production setup instructions.

## Infrastructure as Code

The infrastructure is defined using AWS CDK (TypeScript) in the `/infrastructure` directory:

- **Cognito Stack**: User pool and client configuration
- **DynamoDB Stack**: Table with GSI definitions
- **S3 Stack**: Bucket with policies and CORS
- **IAM Stack**: Roles and policies for service access
- **Monitoring Stack**: CloudWatch dashboards and alarms

Deploy infrastructure:

```bash
cd infrastructure
npm run deploy:prod
```

See [Infrastructure Guide](./infrastructure/DEPLOYMENT_GUIDE.md) for details.

## Data Migration

For migrating existing data from Firebase to AWS:

1. **Export from Firestore**: Extract all collections and documents
2. **Transform Data**: Convert to DynamoDB single-table format
3. **Import to DynamoDB**: Batch write items with proper keys
4. **Migrate Storage**: Copy files from Firebase Storage to S3
5. **Validate**: Verify data integrity and completeness

See [Migration Guide](./MIGRATION_GUIDE.md) for step-by-step instructions.
