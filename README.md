# Co-agent Marketer

[![CI](https://github.com/YOUR_ORG/bayon-coagent/workflows/CI/badge.svg)](https://github.com/YOUR_ORG/bayon-coagent/actions/workflows/ci.yml)
[![Security](https://github.com/YOUR_ORG/bayon-coagent/workflows/Security/badge.svg)](https://github.com/YOUR_ORG/bayon-coagent/actions/workflows/security.yml)
[![codecov](https://codecov.io/gh/YOUR_ORG/bayon-coagent/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/bayon-coagent)
[![Known Vulnerabilities](https://snyk.io/test/github/YOUR_ORG/bayon-coagent/badge.svg)](https://snyk.io/test/github/YOUR_ORG/bayon-coagent)

[![Deploy Dev](https://github.com/YOUR_ORG/bayon-coagent/workflows/Deploy%20Dev/badge.svg)](https://github.com/YOUR_ORG/bayon-coagent/actions/workflows/deploy-dev.yml)
[![Deploy Staging](https://github.com/YOUR_ORG/bayon-coagent/workflows/Deploy%20Staging/badge.svg)](https://github.com/YOUR_ORG/bayon-coagent/actions/workflows/deploy-staging.yml)
[![Deploy Production](https://github.com/YOUR_ORG/bayon-coagent/workflows/Deploy%20Production/badge.svg)](https://github.com/YOUR_ORG/bayon-coagent/actions/workflows/deploy-production.yml)

Co-agent Marketer is an integrated success platform for real estate agents, built with Next.js and AWS. It provides a suite of tools to help agents build their online authority, track their market position, and generate high-quality marketing content.

## 📚 Documentation

**New to the project?** Start with [Getting Started Guide](./docs/guides/getting-started.md)

Complete documentation is in the [docs/](./docs/) folder:

- [Getting Started](./docs/guides/getting-started.md) - Setup and first steps
- [Architecture](./docs/guides/architecture.md) - System design
- [Component Reference](./docs/component-reference.md) - All components
- [Quick Reference](./docs/quick-reference.md) - Common patterns
- [Best Practices](./docs/best-practices.md) - Development guidelines

See [docs/README.md](./docs/README.md) for complete documentation index.

## Features

The application is organized into intuitive hubs for better workflow and discoverability:

### 🎨 Studio - Content Creation Hub

All your content creation tools in one place:

- **Write:** Generate blog posts, social media content, market updates, video scripts, and neighborhood guides
- **Describe:** Create persona-driven listing descriptions that resonate with target buyers
- **Reimagine:** AI-powered image editing with virtual staging, day-to-dusk conversion, enhancement, item removal, and virtual renovation

### 🧠 Intelligence - Research & Analysis Hub

AI-powered research and market insights:

- **Research:** Autonomous deep-dive research with comprehensive reports and citations
- **Saved Reports:** Centralized repository for all research (formerly Knowledge Base)
- **Competitors:** Discover local competitors and track Google keyword rankings
- **Market Insights:** Investment opportunity identification and life event predictions

### 🎯 Brand Center - Brand Identity Hub

Build and manage your brand:

- **Profile:** Unified professional information with SEO-friendly schema markup
- **Audit:** NAP consistency checks and review imports from Zillow
- **Strategy:** AI-generated 3-step marketing plans based on your brand audit and competitor analysis

### 📁 Projects

Organize and manage your work across all features with a personal content library

### 🎓 Training

Educational content on local SEO, social media, and content marketing

### Additional Features

- **Integrations:** Google Business Profile sync for reviews and business information
- **Real Estate News Feed:** Latest real estate news headlines on your dashboard
- **Dark Mode:** Full dark mode support throughout the application

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI:** [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** [AWS Cognito](https://aws.amazon.com/cognito/)
- **Database:** [Amazon DynamoDB](https://aws.amazon.com/dynamodb/)
- **Storage:** [Amazon S3](https://aws.amazon.com/s3/)
- **AI:** [AWS Bedrock](https://aws.amazon.com/bedrock/) (Claude 3.5 Sonnet)
- **Search:** [Tavily API](https://tavily.com/) for web search
- **News:** [NewsAPI.org](https://newsapi.org/)
- **Deployment:** [AWS Amplify Hosting](https://aws.amazon.com/amplify/)

### AWS Architecture

The application is built on AWS services for scalability, reliability, and performance:

- **AWS Cognito** - User authentication and authorization with JWT tokens
- **Amazon DynamoDB** - NoSQL database with single-table design for optimal performance
- **Amazon S3** - Object storage for user files and assets
- **AWS Bedrock** - Managed AI service with Claude 3.5 Sonnet for content generation
- **AWS CloudWatch** - Logging, monitoring, and alerting
- **AWS Amplify** - Continuous deployment and hosting

**Documentation:**

- [AWS Local Development](./docs/aws-local-development.md) - Local development with LocalStack
- [Architecture Overview](./docs/guides/architecture.md) - System architecture and design
- [Deployment Guide](./docs/deployment/deployment.md) - Production deployment options
- [Migration Guide](./docs/guides/migration.md) - Migrating from Firebase to AWS

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Docker and Docker Compose (for local AWS services)
- AWS Account (for production deployment)

### Local Development Setup

#### 1. Set Up Environment Variables

Create a `.env.local` file in the root of the project:

```bash
# Environment
NODE_ENV=development
USE_LOCAL_AWS=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# AWS Services (LocalStack)
COGNITO_USER_POOL_ID=<from-localstack-init>
COGNITO_CLIENT_ID=<from-localstack-init>
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local

# Bedrock Configuration (uses real AWS)
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Google OAuth credentials for Google Business Profile integration
GOOGLE_CLIENT_ID="<your-google-client-id>"
GOOGLE_CLIENT_SECRET="<your-google-client-secret>"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/oauth/google/callback"

# External APIs
BRIDGE_API_KEY="<your-bridge-api-key>"
NEWS_API_KEY="<your-news-api-key>"
TAVILY_API_KEY="<your-tavily-api-key>"
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Start LocalStack (Local AWS Services)

```bash
# Start LocalStack in Docker
npm run localstack:start

# Initialize AWS resources (DynamoDB, S3, Cognito)
npm run localstack:init
```

**Important:** Copy the Cognito User Pool ID and Client ID from the init output and update your `.env.local` file.

#### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Verify Setup

Check that everything is configured correctly:

```bash
npm run verify:setup
```

This will verify:

- Docker is running
- LocalStack is accessible
- Environment variables are set
- AWS resources are created

### Stopping LocalStack

```bash
npm run localstack:stop
```

To completely reset LocalStack data:

```bash
npm run localstack:stop
rm -rf localstack-data
```

For more details, see [AWS Local Development Guide](./docs/aws-local-development.md).

## NPM Scripts Reference

### Development

```bash
npm run dev                 # Start Next.js development server (port 3000)
npm run build              # Build production bundle
npm run start              # Start production server
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking
```

### LocalStack (Local AWS Services)

```bash
npm run localstack:start   # Start LocalStack in Docker
npm run localstack:stop    # Stop LocalStack
npm run localstack:init    # Initialize AWS resources (DynamoDB, S3, Cognito)
npm run localstack:logs    # View LocalStack logs
npm run verify:setup       # Verify local development setup
```

### Data Migration (Firebase → AWS)

```bash
npm run migrate:export     # Export data from Firestore
npm run migrate:transform  # Transform data to DynamoDB format
npm run migrate:import     # Import data to DynamoDB
npm run migrate:storage    # Migrate files from Firebase Storage to S3
npm run migrate:validate   # Validate migration completeness
npm run migrate:rollback   # Rollback migration (delete AWS data)
npm run migrate:all        # Run complete migration pipeline
```

### Infrastructure (AWS CDK)

```bash
npm run infra:install      # Install infrastructure dependencies
npm run infra:build        # Build CDK project
npm run infra:deploy:dev   # Deploy to development environment
npm run infra:deploy:prod  # Deploy to production environment
npm run infra:destroy:dev  # Destroy development infrastructure
npm run infra:destroy:prod # Destroy production infrastructure
npm run infra:synth        # Synthesize CloudFormation templates
npm run infra:diff         # Show infrastructure changes
```

### Deployment

```bash
npm run deploy:amplify     # Deploy to AWS Amplify Hosting
npm run deploy:test <url>  # Test deployment at specified URL
```

## Deployment

### AWS Deployment (Recommended)

The application can be deployed to AWS using several options:

#### Option 1: AWS Amplify Hosting (Easiest)

```bash
# Automated setup
npm run deploy:amplify

# Or manually via AWS Console
# See DEPLOYMENT_QUICK_START.md for details
```

#### Option 2: Vercel with AWS Backend

```bash
npm install -g vercel
vercel --prod
```

#### Option 3: CloudFront + Lambda (Advanced)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Prerequisites for Deployment

1. **Deploy Infrastructure First**

   ```bash
   npm run infra:install
   npm run infra:deploy:prod
   ```

2. **Configure Environment Variables**

   ```bash
   cd infrastructure
   ./scripts/update-env.sh production
   ```

3. **Test Deployment**
   ```bash
   npm run deploy:test <your-deployment-url>
   ```

For complete deployment instructions, see:

- [Deployment Quick Start](./DEPLOYMENT_QUICK_START.md) - Quick commands
- [Deployment Guide](./DEPLOYMENT.md) - Comprehensive guide
- [Infrastructure Guide](./infrastructure/DEPLOYMENT_GUIDE.md) - Infrastructure setup

## Troubleshooting

### LocalStack Issues

**Problem**: LocalStack won't start

```bash
# Check if Docker is running
docker ps

# Check if port 4566 is available
lsof -i :4566

# Restart Docker Desktop
# Then try again
npm run localstack:start
```

**Problem**: Can't connect to LocalStack services

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

### AWS Connection Issues

**Problem**: "Missing credentials" error

```bash
# For local development, ensure .env.local has:
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# For production, configure AWS CLI:
aws configure
```

**Problem**: "Table not found" in DynamoDB

```bash
# Re-initialize LocalStack resources
npm run localstack:init

# Or create table manually (see AWS_SETUP.md)
```

### Build Issues

**Problem**: TypeScript errors

```bash
# Run type checking
npm run typecheck

# Check for missing dependencies
npm install
```

**Problem**: Build fails

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Application Issues

**Problem**: Authentication not working

- Verify Cognito User Pool ID and Client ID in `.env.local`
- Check that LocalStack is running
- Try creating a test user manually

**Problem**: Data not loading

- Verify DynamoDB table exists: `npm run localstack:init`
- Check browser console for errors
- Verify environment variables are set correctly

For more help, see:

- [AWS Local Development](./docs/aws-local-development.md)
- [Getting Started Guide](./docs/guides/getting-started.md)
- [Migration Guide](./docs/guides/migration.md)

## Environment Variables

### Local Development (`.env.local`)

```bash
# Environment
NODE_ENV=development
USE_LOCAL_AWS=true

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# AWS Services (LocalStack)
COGNITO_USER_POOL_ID=<from-localstack-init>
COGNITO_CLIENT_ID=<from-localstack-init>
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local

# Bedrock (uses real AWS)
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# External APIs
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
TAVILY_API_KEY=your-tavily-api-key
```

### Production (`.env.production`)

```bash
# Environment
NODE_ENV=production

# AWS Configuration
AWS_REGION=us-east-1

# AWS Services (Production)
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=BayonCoAgent-prod
S3_BUCKET_NAME=bayon-coagent-storage-prod

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/oauth/google/callback

# External APIs
BRIDGE_API_KEY=your-bridge-api-key
NEWS_API_KEY=your-news-api-key
TAVILY_API_KEY=your-tavily-api-key
```

**Note**: Never commit `.env.local` or `.env.production` to version control. Use AWS Secrets Manager or Parameter Store for production secrets.

## CI/CD Pipeline

The project uses GitHub Actions for continuous integration and deployment across multiple environments.

### Workflows

- **CI**: Code quality checks, tests, and build verification on every push/PR
- **Security**: Dependency scanning, secrets detection, and SAST analysis
- **Deploy Dev**: Automatic deployment to development on merge to `develop`
- **Deploy Staging**: Approval-gated deployment to staging on `rc-*` tags
- **Deploy Production**: Multi-approval deployment to production on `v*` tags
- **Performance**: Lighthouse audits for performance monitoring
- **Preview**: Temporary preview environments for pull requests

### Deployment Process

**Development** (Automatic):

```bash
git checkout develop
git merge feature/your-feature
git push origin develop
# Automatically deploys to development environment
```

**Staging** (Requires 1 approval):

```bash
git tag -a rc-1.2.0 -m "Release candidate 1.2.0"
git push origin rc-1.2.0
# Requires DevOps approval, then deploys to staging
```

**Production** (Requires 2 approvals):

```bash
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0
# Requires 2 approvals, then deploys to production
```

### Documentation

- [Pipeline Architecture](./docs/cicd/pipeline-architecture.md) - Complete CI/CD architecture
- [Deployment Runbook](./docs/cicd/deployment-runbook.md) - Step-by-step deployment procedures
- [Rollback Runbook](./docs/cicd/rollback-runbook.md) - Emergency rollback procedures
- [GitHub Setup Guide](./docs/cicd/github-setup-guide.md) - Initial GitHub configuration

### Workflow Files

All workflow files are in `.github/workflows/`:

- [`ci.yml`](.github/workflows/ci.yml) - Quality checks and tests
- [`security.yml`](.github/workflows/security.yml) - Security scanning
- [`deploy-dev.yml`](.github/workflows/deploy-dev.yml) - Development deployment
- [`deploy-staging.yml`](.github/workflows/deploy-staging.yml) - Staging deployment
- [`deploy-production.yml`](.github/workflows/deploy-production.yml) - Production deployment
- [`performance.yml`](.github/workflows/performance.yml) - Performance testing
- [`rollback.yml`](.github/workflows/rollback.yml) - Emergency rollback

## 📖 Complete Documentation

See [docs/README.md](./docs/README.md) for complete documentation index.

### Quick Links

**Setup & Development:**

- [Getting Started](./docs/guides/getting-started.md) - Complete setup guide
- [AWS Local Development](./docs/aws-local-development.md) - LocalStack setup
- [Environment Variables](./docs/guides/environment-variables.md) - Configuration

**Development:**

- [Architecture](./docs/guides/architecture.md) - System architecture
- [Component Reference](./docs/component-reference.md) - All components
- [Best Practices](./docs/best-practices.md) - Development guidelines
- [Quick Reference](./docs/quick-reference.md) - Common patterns

**Deployment:**

- [Deployment Guide](./docs/deployment/deployment.md) - Complete instructions
- [SAM Deployment](./docs/deployment/sam-deployment.md) - SAM guide
- [Deployment Checklist](./docs/deployment/checklist.md) - Pre-deployment checks

## Contributing

This project uses:

- **TypeScript** for type safety
- **Zod** for schema validation
- **AWS SDK v3** for AWS service integration
- **shadcn/ui** for UI components
- **Tailwind CSS** for styling

When contributing:

1. Follow the existing code style
2. Add types for all functions
3. Use Zod schemas for data validation
4. Test locally with LocalStack before deploying
5. Update documentation for new features

## License

This project is private and proprietary.
