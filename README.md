# Bayon CoAgent

[![CI](https://github.com/YOUR_ORG/bayon-coagent/workflows/CI/badge.svg)](https://github.com/YOUR_ORG/bayon-coagent/actions/workflows/ci.yml)
[![Security](https://github.com/YOUR_ORG/bayon-coagent/workflows/Security/badge.svg)](https://github.com/YOUR_ORG/bayon-coagent/actions/workflows/security.yml)

**AI-powered success platform for real estate agents** - Build online authority, track market position, and generate high-quality marketing content.

## 🚀 Quick Start

```bash
# Clone and install
git clone <repository-url>
cd bayon-coagent
npm install

# Set up local development
cp .env.example .env.local
npm run localstack:start
npm run localstack:init

# Start development server
npm run dev
```

Visit `http://localhost:3000` to get started.

## 📚 Documentation

**New to the project?** Start with the [Getting Started Guide](./docs/GETTING_STARTED.md)

### Essential Guides

- [🏁 Getting Started](./docs/GETTING_STARTED.md) - Complete setup and first steps
- [🏗️ Architecture](./docs/ARCHITECTURE.md) - System design and structure  
- [🔧 Development](./docs/DEVELOPMENT.md) - Development workflow and patterns
- [🚀 Deployment](./docs/DEPLOYMENT.md) - Production deployment process
- [🐛 Troubleshooting](./docs/TROUBLESHOOTING.md) - Common problems and solutions

### Quick References

- [📋 Commands](./docs/quick-reference/commands.md) - All npm scripts
- [🎨 Components](./docs/quick-reference/components.md) - UI component library
- [⚙️ Configuration](./docs/quick-reference/configuration.md) - Environment setup
- [🔑 API Reference](./docs/quick-reference/api.md) - Server actions and endpoints

See [docs/README.md](./docs/README.md) for complete documentation index.

## 🎯 Product Overview

Bayon CoAgent is organized into intuitive hubs for streamlined workflows:

### � Dashiboard - Overview Hub
Central command center with key metrics, recent activity, and quick access to all features.

### 🤖 Assistant - AI Chat Hub
Conversational AI assistant for real estate questions, guidance, and support.

### 🎯 Brand - Identity & Strategy Hub

Own your market position and outshine the competition:

- **Profile**: Build professional profile that gets you found and trusted
- **Audit**: NAP consistency checks and review imports
- **Competitors**: AI-powered competitor discovery and keyword ranking
- **Strategy**: Personalized marketing plans based on market position
- **Calendar**: Schedule and manage appointments
- **Integrations**: Connect Google Business Profile and other services
- **Testimonials**: Manage client testimonials and reviews

### 🎨 Studio - Content Creation Hub

Turn ideas into polished content in minutes:

- **Write**: AI content generation for blog posts, social media, market updates
- **Describe**: Persona-driven listing descriptions
- **Reimagine**: AI-powered image editing (virtual staging, day-to-dusk, enhancement)
- **Post Cards**: Design marketing postcards

### 🔍 Research - AI-Powered Research Hub

Get comprehensive research and insights on any market topic with AI-powered research capabilities and market intelligence:

- **Research Agent**: Multi-step research workflows with web search integration
- **Market Insights**: Market trend analysis and life event predictions to identify potential clients
- **News**: Real estate news aggregation with location-based filtering
- **Opportunities**: Investment opportunity identification and analysis
- **Analytics**: Market data analysis and performance tracking
- **Alerts**: Market alerts and notifications for changes
- **Knowledge Base**: Centralized knowledge management and storage

### 📊 Market - Market Intelligence Hub

Track market trends and opportunities with AI-powered insights:

- **Insights**: Advanced market trend analysis with life event predictions, alert creation, and actionable intelligence
- **News**: Stay updated with latest real estate news and market trends, filterable by location
- **Analytics**: Market data analysis and performance tracking
- **Opportunities**: Investment opportunity identification and life event predictions
- **Alerts**: Market alerts and notifications for price changes and new listings
- **Alerts**: Market alerts and notifications

### 🧮 Tools - Deal Analysis Hub

Analyze deals and crunch numbers like a pro:

- **Calculator**: Advanced mortgage calculator with payment breakdown, affordability analysis, and loan comparison
- **ROI**: Renovation ROI calculator for investment analysis
- **Valuation**: AI-powered property valuation tool
- **Document Scanner**: Scan and process real estate documents

### 📁 Library - Content Management Hub

Everything you've created, ready when you need it:

- **Content**: All created content (blog posts, social media, descriptions)
- **Reports**: Saved research reports and market analyses
- **Media**: Images, videos, documents
- **Templates**: Saved templates and reusable content

### 👥 Clients - Client Management Hub
Manage client relationships, dashboards, and communications.

### 🏠 Open House - Event Management Hub

Comprehensive open house event management system:

- **Event Planning**: Create and schedule events with detailed property information
- **Event Templates**: Pre-configured templates for different event types
- **Attendee Tracking**: Monitor registrations, attendance, and lead generation
- **Performance Analytics**: Track views, inquiries, conversions, and ROI
- **Marketing Materials**: Generate flyers, signage, and promotional content
- **Status Management**: Track events from planning to completion

### 🎓 Learning - Skill Development Hub

Master real estate skills with AI-powered training and practice:

- **Lessons**: Interactive learning modules with progress tracking
- **Tutorials**: Video-based learning content
- **Role-Play**: AI-powered practice scenarios
- **AI Lesson Plan**: Generate personalized learning plans
- **Best Practices**: Curated industry best practices
- **Certification**: Achievement tracking and certificates
- **Community**: Learning community and discussions
- **Courses**: Structured learning programs

## 💳 Subscription System

Bayon CoAgent operates on a freemium model with professional trials:

- **Free Tier**: Limited AI generations and basic features
- **7-Day Professional Trial**: Full access to all premium features
- **Automated Notifications**: Email reminders at 3-day and 1-day marks
- **Seamless Upgrades**: Stripe-powered subscription management with robust error handling
- **Usage Tracking**: Monthly limits and feature gates
- **Trial Management**: Automated expiry handling via Lambda functions
- **Defensive Architecture**: Error-safe plan validation and graceful fallbacks

## 🛠 Tech Stack

### Framework & UI

- **Next.js 15** with App Router (React 19)
- **TypeScript** with strict mode enabled
- **Tailwind CSS** for styling with custom design tokens
- **shadcn/ui** component library (Radix UI primitives)
- **Framer Motion** for animations and page transitions
- **Zod** for schema validation

### AWS Services

- **AWS Cognito**: User authentication with JWT tokens
- **Amazon DynamoDB**: NoSQL database with single-table design
- **Amazon S3**: Object storage for user files and assets
- **AWS Bedrock**: AI service using Claude 3.5 Sonnet
- **AWS Lambda**: Serverless functions for background processing
- **AWS SES**: Email service for notifications and communications
- **AWS EventBridge**: Event-driven architecture and scheduling
- **AWS CloudWatch**: Logging, monitoring, and alerting
- **AWS Amplify**: Continuous deployment and hosting

### External APIs

- **Tavily API**: Web search for AI flows
- **NewsAPI.org**: Real estate news feed
- **Bridge API**: Zillow review integration
- **Google OAuth**: Business Profile integration

## 🏗 Project Structure

```
/
├── src/                    # Application source code
│   ├── app/               # Next.js App Router
│   │   ├── (app)/         # Authenticated routes (hub structure)
│   │   │   ├── dashboard/         # Overview hub
│   │   │   ├── assistant/         # AI chat hub
│   │   │   ├── brand/             # Brand identity hub
│   │   │   ├── studio/            # Content creation hub
│   │   │   ├── research/          # Research hub (unified)
│   │   │   ├── research-agent/    # Legacy research agent
│   │   │   ├── knowledge-base/    # Legacy knowledge base
│   │   │   ├── market/            # Market intelligence hub
│   │   │   ├── tools/             # Deal analysis hub
│   │   │   ├── library/           # Content management hub
│   │   │   ├── client-dashboards/ # Client management hub
│   │   │   ├── open-house/        # Open house management
│   │   │   ├── learning/          # Learning & development hub
│   │   │   ├── admin/             # Admin panel
│   │   │   ├── super-admin/       # Super admin panel
│   │   │   ├── settings/          # Account settings
│   │   │   ├── support/           # Support center
│   │   │   ├── analytics/         # Analytics dashboard
│   │   │   ├── onboarding/        # User onboarding
│   │   │   ├── mobile/            # Mobile-specific routes
│   │   │   ├── client-gifts/      # Client gifting system
│   │   │   ├── content-engine/    # Legacy content engine
│   │   │   ├── reimagine/         # Legacy reimagine (now in studio)
│   │   │   └── unsubscribe/       # Email unsubscribe
│   │   └── api/           # API routes
│   ├── aws/               # AWS service integrations
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and helpers
│   ├── ai/                # AI schemas and configurations
│   └── contexts/          # React contexts
├── infrastructure/        # AWS CDK infrastructure as code
├── scripts/              # Build, deployment, and migration scripts
├── docs/                 # Project documentation
├── tests/                # Test files
├── monitoring/           # Monitoring configurations
├── agents/               # AI agent configurations
├── amplify/              # AWS Amplify configuration
├── config/               # Configuration files
└── public/               # Static assets
```

## 🎨 UI Standards

### Header Consistency

All page and card headers now follow standardized patterns for visual consistency:

```bash
# Check for header consistency issues
node scripts/fix-header-consistency.js

# View header styling guide
cat docs/ui-standards/header-styling-guide.md
```

**Standard Components:**
- `PageHeader` - For main page titles with icons and actions
- `CardHeaderStandard` - For consistent card headers
- `SectionHeader` - For section titles within pages

**Typography Hierarchy:**
- Page titles: `text-2xl md:text-3xl font-bold tracking-tight font-headline`
- Card titles: `text-xl font-semibold font-headline`
- Section titles: `text-lg md:text-xl font-semibold font-headline`
- Descriptions: `text-base text-muted-foreground`

## 🔧 Development

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Docker and Docker Compose (for local AWS services)
- AWS Account (for production deployment)

### Common Commands

#### Development

```bash
npm run dev                 # Start Next.js dev server with Turbopack
npm run build              # Build production bundle
npm run build:fast         # Fast build (skip env validation)
npm run build:analyze      # Build with bundle analysis
npm run start              # Start production server
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking
```

#### LocalStack (Local AWS)

```bash
npm run localstack:start   # Start LocalStack in Docker
npm run localstack:stop    # Stop LocalStack
npm run localstack:init    # Initialize AWS resources
npm run localstack:logs    # View LocalStack logs
npm run verify:setup       # Verify local setup
```

#### Testing & Quality

```bash
npm test                   # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
npm run lighthouse         # Run Lighthouse performance tests
npm run lighthouse:ci      # Run Lighthouse CI
npm run bundle:check       # Check bundle size
npm run bundle:track       # Track bundle size changes
```

#### Infrastructure & Deployment

```bash
# SAM Deployment (Recommended)
npm run sam:validate       # Validate SAM templates
npm run sam:deploy:dev     # Deploy dev environment
npm run sam:deploy:prod    # Deploy prod environment
npm run sam:destroy:dev    # Destroy dev environment
npm run sam:destroy:prod   # Destroy prod environment
npm run sam:outputs        # View stack outputs
npm run sam:update-env     # Update env from SAM outputs

# CDK Infrastructure
npm run infra:validate     # Validate infrastructure templates
npm run infra:deploy:dev   # Deploy dev infrastructure
npm run infra:deploy:prod  # Deploy prod infrastructure

# Amplify Deployment
npm run deploy:amplify     # Deploy to AWS Amplify
npm run deploy:test        # Test deployment

# API Testing
./scripts/test-api-endpoints.sh  # Test all API endpoints
```

#### Setup & Administration

```bash
# Service Setup
npm run admin:create       # Create super admin user
npm run setup:secrets      # Setup AWS Secrets Manager
npm run verify:secrets     # Verify secrets configuration
npm run clear-auth         # Clear auth session
```

#### Verification & Monitoring

```bash
# Service Verification
npm run verify:bedrock-models    # Verify Bedrock models
npm run verify:reimagine         # Verify Reimagine setup
npm run verify:xray             # Verify X-Ray tracing
npm run verify:sqs              # Verify SQS queues
npm run verify:eventbridge      # Verify EventBridge

# Configuration
npm run configure:reimagine-s3   # Configure S3 for Reimagine
npm run setup:reimagine-monitoring  # Setup Reimagine monitoring
npm run setup:onboarding-monitoring # Setup onboarding monitoring

# Security
npm run security:check      # Check for secrets in code
```

### Environment Configuration

Create `.env.local` for local development:

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
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# External APIs
TAVILY_API_KEY=your-tavily-api-key
NEWS_API_KEY=your-news-api-key
BRIDGE_API_KEY=your-bridge-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key  # Optional in development, required in production

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```

**Configuration Validation**: The application automatically validates AWS configuration on startup and displays helpful warnings in development mode for missing or invalid settings. See [AWS Configuration Validation](./docs/aws-configuration-validation.md) for details.

## 🚀 Deployment

### AWS Deployment (Recommended)

1. **Deploy Infrastructure**

   ```bash
   npm run sam:deploy:prod
   ```

2. **Configure Environment Variables**

   ```bash
   # Update .env.production with your AWS resources
   npm run sam:outputs  # Get stack outputs
   ```

3. **Deploy Application**
   ```bash
   npm run deploy:amplify
   ```

For detailed deployment instructions, see [Deployment Guide](./docs/deployment/deployment.md).

### Post-Deployment Testing

After deployment, test your API endpoints:

```bash
# Test all API endpoints
npm run test:api

# Or run directly
./scripts/test-api-endpoints.sh
```

See [API Testing Guide](./docs/deployment/api-testing.md) for comprehensive testing procedures.

## 🔍 Troubleshooting

### TypeScript Issues

```bash
# Analyze TypeScript errors with intelligent categorization
node scripts/analyze-typescript-errors.js

# Run standard type checking
npm run typecheck
```

### LocalStack Issues

```bash
# Check if Docker is running
docker ps

# Restart LocalStack
npm run localstack:stop
npm run localstack:start
npm run localstack:init
```

### AWS Connection Issues

```bash
# Verify LocalStack health
curl http://localhost:4566/_localstack/health

# Check environment variables
echo $USE_LOCAL_AWS  # Should be "true"
```

### Admin Access Issues

If you're having trouble with admin or super admin access:

```bash
# Create super admin user
npm run admin:create

# Test admin access using the diagnostic page
# Visit: http://localhost:3000/super-admin/test-page
```

The **Super Admin Test Page** (`/super-admin/test-page`) is a diagnostic tool that shows:
- User authentication status
- Admin role assignments
- Authorization loading states
- Access granted/denied status

Use this page to troubleshoot role assignment and authentication issues.

### AWS Credentials Error

If you see `"Cannot read properties of undefined (reading 'accessKeyId')"`:

This error occurs when AWS service clients try to access credentials that are `undefined`. This is expected behavior in production environments where AWS SDK should use the default credential chain.

**Quick Fix**: This has been resolved in the latest version. If you encounter this error:

1. Pull the latest code changes
2. Restart your development server
3. See `CREDENTIALS_ERROR_FIX.md` for technical details

For more help, see [Troubleshooting Guide](./docs/troubleshooting/common-issues.md).

## 🤝 Contributing

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

## 📄 License

This project is private and proprietary.
