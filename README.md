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

**New to the project?** Start with the [Getting Started Guide](./docs/guides/getting-started.md)

### Essential Guides

- [🏁 Getting Started](./docs/guides/getting-started.md) - Complete setup guide
- [🏗️ Architecture](./docs/guides/architecture.md) - System design overview
- [🚀 Deployment](./docs/deployment/deployment.md) - Production deployment
- [🔧 Development](./docs/guides/development.md) - Development workflow

### Quick References

- [📋 Commands](./docs/quick-reference/commands.md) - All npm scripts
- [🎨 Components](./docs/quick-reference/components.md) - UI component library
- [⚙️ Configuration](./docs/quick-reference/configuration.md) - Environment setup
- [🐛 Troubleshooting](./docs/troubleshooting/common-issues.md) - Common problems

See [docs/README.md](./docs/README.md) for complete documentation index.

## 🎯 Product Overview

Bayon CoAgent is organized into intuitive hubs for streamlined workflows:

### 🎨 Studio - Content Creation Hub

Turn ideas into polished content in minutes:

- **Write**: AI content generation for blog posts, social media, market updates
- **Describe**: Persona-driven listing descriptions
- **Reimagine**: AI-powered image editing (virtual staging, day-to-dusk, enhancement)

### 🎯 Brand - Identity & Strategy Hub

Own your market position and outshine the competition:

- **Profile**: Build professional profile that gets you found and trusted
- **Audit**: NAP consistency checks and review imports
- **Competitors**: AI-powered competitor discovery and keyword ranking
- **Strategy**: Personalized marketing plans based on market position

### 🔍 Research - AI-Powered Research Hub

Get comprehensive research and insights:

- **Research Agent**: Ask any market question, get research-backed answers
- **Reports**: Access all saved research reports and analyses
- **Knowledge Base**: Centralized repository for research materials

### 📊 Market - Market Intelligence Hub

Track trends and opportunities:

- **Insights**: Market trend analysis and life event predictions
- **Opportunities**: Investment opportunity identification
- **Analytics**: Market data analysis and performance tracking

### 🧮 Tools - Deal Analysis Hub

Analyze deals and crunch numbers:

- **Calculator**: Mortgage calculator with amortization schedules
- **ROI**: Renovation ROI calculator for investment analysis
- **Valuation**: AI-powered property valuation tool

### 📁 Library - Content Management Hub

Everything you've created, ready when you need it:

- **Content**: All created content (blog posts, social media, descriptions)
- **Reports**: Saved research reports and market analyses
- **Media**: Images, videos, documents
- **Templates**: Saved templates and reusable content

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
│   │   │   ├── dashboard/     # Overview hub
│   │   │   ├── assistant/     # AI chat hub
│   │   │   ├── studio/        # Content creation hub
│   │   │   ├── brand/         # Brand identity hub
│   │   │   ├── research/      # Research hub
│   │   │   ├── market/        # Market intelligence hub
│   │   │   ├── tools/         # Deal analysis hub
│   │   │   ├── library/       # Content management hub
│   │   │   └── settings/      # Account settings
│   │   └── api/           # API routes
│   ├── aws/               # AWS service integrations
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and helpers
│   └── types/             # TypeScript type definitions
├── infrastructure/        # AWS CDK infrastructure as code
├── scripts/              # Build, deployment, and migration scripts
├── docs/                 # Project documentation
└── public/               # Static assets
```

## 🔧 Development

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Docker and Docker Compose (for local AWS services)
- AWS Account (for production deployment)

### Common Commands

#### Development

```bash
npm run dev                 # Start Next.js dev server (port 3000)
npm run build              # Build production bundle
npm run start              # Start production server
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking
```

#### LocalStack (Local AWS)

```bash
npm run localstack:start   # Start LocalStack in Docker
npm run localstack:stop    # Stop LocalStack
npm run localstack:init    # Initialize AWS resources
npm run verify:setup       # Verify local setup
```

#### Testing

```bash
npm test                   # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

#### Deployment

```bash
npm run sam:deploy:dev     # Deploy dev (SAM - recommended)
npm run sam:deploy:prod    # Deploy prod (SAM - recommended)
npm run deploy:amplify     # Deploy to AWS Amplify
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
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# External APIs
TAVILY_API_KEY=your-tavily-api-key
NEWS_API_KEY=your-news-api-key
BRIDGE_API_KEY=your-bridge-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```

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
