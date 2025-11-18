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
