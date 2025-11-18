# Getting Started with Bayon CoAgent

This guide will help you get the Bayon CoAgent application up and running on your local machine and deployed to AWS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Understanding the Architecture](#understanding-the-architecture)
4. [Deploying to AWS](#deploying-to-aws)
5. [Next Steps](#next-steps)

## Prerequisites

### Required Software

- **Node.js** 18+ and npm
- **Docker Desktop** (for LocalStack)
- **AWS CLI** (for deployment)
- **Git** (for version control)

### AWS Account

You'll need an AWS account for production deployment. For local development, LocalStack provides free AWS service emulation.

### API Keys

You'll need API keys for:

- **Google OAuth** (for Google Business Profile integration)
- **Bridge API** (for Zillow reviews)
- **NewsAPI** (for real estate news)
- **Tavily** (for web search)

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd bayon-coagent

# Install dependencies
npm install
```

### Step 2: Configure Environment

Create `.env.local` file:

```bash
# Environment
NODE_ENV=development
USE_LOCAL_AWS=true

# AWS Configuration (LocalStack)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# AWS Services (will be set after LocalStack init)
COGNITO_USER_POOL_ID=<from-localstack-init>
COGNITO_CLIENT_ID=<from-localstack-init>
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local

# Bedrock (uses real AWS - optional for local dev)
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:9002/api/oauth/google/callback

# External APIs
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
TAVILY_API_KEY=your-tavily-api-key
```

### Step 3: Start LocalStack

```bash
# Start LocalStack in Docker
npm run localstack:start

# Initialize AWS resources (DynamoDB, S3, Cognito)
npm run localstack:init
```

**Important:** Copy the Cognito User Pool ID and Client ID from the init output and update your `.env.local` file.

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:9002`.

### Step 5: Verify Setup

```bash
npm run verify:setup
```

This checks:

- Docker is running
- LocalStack is accessible
- Environment variables are set
- AWS resources are created

## Understanding the Architecture

### High-Level Overview

```
┌─────────────────────────────────────────┐
│         Next.js Application             │
│  ┌────────────────────────────────────┐ │
│  │     React Components (UI)          │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Server Actions / API Routes       │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          AWS Services                    │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │ Cognito  │  │ DynamoDB │  │   S3   ││
│  └──────────┘  └──────────┘  └────────┘│
│  ┌──────────┐  ┌──────────┐            │
│  │ Bedrock  │  │CloudWatch│            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
```

### Key Components

1. **Authentication** - AWS Cognito

   - User registration and login
   - JWT token management
   - Session handling

2. **Database** - Amazon DynamoDB

   - Single-table design
   - User-scoped data access
   - Real-time updates via polling

3. **Storage** - Amazon S3

   - File uploads and downloads
   - Presigned URLs for security
   - CORS configured for browser uploads

4. **AI** - AWS Bedrock

   - Claude 3.5 Sonnet model
   - Content generation flows
   - Structured input/output with Zod

5. **Search** - Tavily API
   - Web search for AI flows
   - Real estate news aggregation

For more details, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Deploying to AWS

### Overview

There are two main steps:

1. Deploy infrastructure (AWS resources)
2. Deploy application (Next.js app)

### Step 1: Deploy Infrastructure

You have two options: **SAM (recommended)** or **CDK**.

#### Option A: AWS SAM (Recommended)

SAM is simpler and faster for this project.

```bash
# Install SAM CLI
brew install aws-sam-cli  # macOS
# or follow: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

# Configure AWS credentials
aws configure

# Deploy infrastructure
npm run sam:deploy:dev

# Update environment variables
npm run sam:update-env
cp .env.development .env.local
```

See [SAM_DEPLOYMENT_GUIDE.md](SAM_DEPLOYMENT_GUIDE.md) for detailed instructions.

#### Option B: AWS CDK

CDK provides more control but is more complex.

```bash
# Install CDK CLI
npm install -g aws-cdk

# Deploy infrastructure
npm run infra:deploy:dev

# Update environment variables
cd infrastructure
./scripts/update-env.sh development
cp .env.development ../.env.local
```

See [infrastructure/DEPLOYMENT_GUIDE.md](infrastructure/DEPLOYMENT_GUIDE.md) for detailed instructions.

### Step 2: Deploy Application

#### Option A: AWS Amplify (Recommended)

Amplify provides the easiest deployment with built-in CI/CD.

```bash
# Automated setup
npm run deploy:amplify
```

Or manually via AWS Console:

1. Go to AWS Amplify Console
2. Connect your Git repository
3. Configure build settings (uses `amplify.yml`)
4. Add environment variables
5. Deploy

See [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md) for detailed instructions.

#### Option B: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option C: Other Options

- CloudFront + Lambda
- ECS Fargate
- Self-hosted

See [DEPLOYMENT.md](DEPLOYMENT.md) for all deployment options.

### Step 3: Test Deployment

```bash
npm run deploy:test https://your-deployment-url.com
```

This runs automated tests to verify:

- Basic connectivity
- SSL certificate
- Security headers
- API routes
- Performance

## Next Steps

### For Developers

1. **Explore the codebase**

   - Review [ARCHITECTURE.md](ARCHITECTURE.md)
   - Check [CODE_REVIEW.md](CODE_REVIEW.md)
   - Read AWS service docs in `src/aws/*/README.md`

2. **Start developing**

   - Create new features
   - Add tests
   - Follow code quality guidelines

3. **Learn AWS services**
   - Cognito authentication
   - DynamoDB queries
   - S3 file operations
   - Bedrock AI flows

### For DevOps

1. **Set up monitoring**

   - CloudWatch dashboards
   - Alarms and notifications
   - Log aggregation

2. **Configure CI/CD**

   - Automated testing
   - Deployment pipelines
   - Environment management

3. **Optimize infrastructure**
   - Cost optimization
   - Performance tuning
   - Security hardening

### For Everyone

1. **Read the documentation**

   - [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) - Complete documentation index
   - [README.md](README.md) - Project overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

2. **Join the team**
   - Understand the project goals
   - Learn the tech stack
   - Contribute to the codebase

## Common Tasks

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

### Stopping LocalStack

```bash
npm run localstack:stop
```

To completely reset LocalStack data:

```bash
npm run localstack:stop
rm -rf localstack-data
```

## Troubleshooting

### LocalStack Won't Start

```bash
# Check if Docker is running
docker ps

# Check if port 4566 is available
lsof -i :4566

# Restart Docker Desktop and try again
npm run localstack:start
```

### Can't Connect to LocalStack

```bash
# Verify LocalStack is running
curl http://localhost:4566/_localstack/health

# Check environment variables
echo $USE_LOCAL_AWS  # Should be "true"

# Restart LocalStack
npm run localstack:stop
npm run localstack:start
npm run localstack:init
```

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Authentication Not Working

- Verify Cognito User Pool ID and Client ID in `.env.local`
- Check that LocalStack is running
- Try creating a test user manually

For more troubleshooting, see [README.md](README.md#troubleshooting).

## Learning Resources

### AWS Services

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

### Next.js

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)

### Tools

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)

## Support

For help:

1. Check the [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
2. Review troubleshooting sections
3. Check AWS service documentation
4. Contact the development team

## Quick Reference

### Environment Variables

```bash
# Local Development
USE_LOCAL_AWS=true
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Production
NODE_ENV=production
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=<from-infrastructure>
COGNITO_CLIENT_ID=<from-infrastructure>
DYNAMODB_TABLE_NAME=<from-infrastructure>
S3_BUCKET_NAME=<from-infrastructure>
```

### NPM Scripts

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# LocalStack
npm run localstack:start   # Start LocalStack
npm run localstack:stop    # Stop LocalStack
npm run localstack:init    # Initialize resources

# Infrastructure (SAM)
npm run sam:deploy:dev     # Deploy to dev
npm run sam:deploy:prod    # Deploy to prod

# Infrastructure (CDK)
npm run infra:deploy:dev   # Deploy to dev
npm run infra:deploy:prod  # Deploy to prod

# Deployment
npm run deploy:amplify     # Deploy to Amplify
npm run deploy:test <url>  # Test deployment

# Testing
npm test                   # Run tests
npm run typecheck          # Type checking
npm run lint               # Linting
```

### Ports

- **9002** - Next.js development server
- **4566** - LocalStack (all AWS services)

### File Structure

```
.
├── src/
│   ├── app/              # Next.js app router
│   ├── aws/              # AWS service integrations
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilities
├── infrastructure/       # CDK infrastructure
├── scripts/              # Deployment scripts
├── docs/                 # Documentation
└── public/               # Static assets
```

---

**Ready to start?** Follow the [Local Development Setup](#local-development-setup) above!

For more information, see the [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md).
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
