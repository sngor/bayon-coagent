# Getting Started with Bayon CoAgent

Welcome to Bayon CoAgent! This guide will get you up and running quickly.

## Prerequisites

- **Node.js** (v18 or later)
- **npm** or **pnpm**
- **Docker & Docker Compose** (for local AWS services)
- **AWS Account** (for production deployment)

## Quick Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd bayon-coagent
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
# See Configuration section below for details
```

### 3. Start Local Services

```bash
# Start LocalStack (local AWS services)
npm run localstack:start

# Initialize AWS resources
npm run localstack:init

# Verify setup
npm run verify:setup
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Configuration

### Required Environment Variables

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

# External APIs
TAVILY_API_KEY=your-tavily-api-key
NEWS_API_KEY=your-news-api-key
BRIDGE_API_KEY=your-bridge-api-key

# Google OAuth (optional in development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### API Keys Setup

1. **Tavily API** (required for research features)
   - Sign up at [tavily.com](https://tavily.com)
   - Get API key from dashboard
   - Add to `TAVILY_API_KEY`

2. **NewsAPI** (required for market news)
   - Sign up at [newsapi.org](https://newsapi.org)
   - Get API key from dashboard
   - Add to `NEWS_API_KEY`

3. **Bridge API** (optional - for Zillow integration)
   - Contact Bridge API for access
   - Add to `BRIDGE_API_KEY`

## Development Workflow

### Daily Commands

```bash
# Start development
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test
```

### LocalStack Management

```bash
# Start LocalStack
npm run localstack:start

# Stop LocalStack
npm run localstack:stop

# View logs
npm run localstack:logs

# Reinitialize (if needed)
npm run localstack:init
```

## Project Structure

```
bayon-coagent/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/             # Authenticated routes (hubs)
│   │   └── api/               # API routes
│   ├── aws/                   # AWS service integrations
│   ├── components/            # React components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and helpers
│   └── contexts/              # React contexts
├── infrastructure/            # AWS CDK infrastructure
├── docs/                      # Documentation
├── scripts/                   # Build and deployment scripts
└── tests/                     # Test files
```

## Key Features Overview

### Hub-Based Architecture

The application is organized into intuitive hubs:

- **🏠 Dashboard** - Overview and metrics
- **🤖 Assistant** - AI chat assistant
- **🎯 Brand** - Brand identity and strategy
- **🎨 Studio** - Content creation
- **🔍 Research** - AI-powered research
- **📊 Market** - Market intelligence
- **🧮 Tools** - Deal analysis tools
- **📁 Library** - Content management
- **👥 Clients** - Client management
- **🏠 Open House** - Event management
- **🎓 Learning** - Skill development

### AI-Powered Features

- **Content Generation** - Blog posts, social media, listings
- **Market Intelligence** - Trend analysis and predictions
- **Research Agent** - Comprehensive market research
- **Image Processing** - Virtual staging and enhancement
- **Assistant Chat** - Context-aware AI assistance

## Common Tasks

### Creating Content

1. Navigate to **Studio** hub
2. Choose content type (Write, Describe, Reimagine)
3. Fill in the form with your requirements
4. Generate and review content
5. Save to Library or publish directly

### Market Research

1. Go to **Research** hub
2. Enter your research topic
3. Select research depth (Basic, Comprehensive, Expert)
4. Review generated report
5. Save to Library for future reference

### Client Management

1. Visit **Clients** hub
2. Create new client dashboard
3. Choose template and customize
4. Share QR code or link with client
5. Monitor engagement analytics

## Troubleshooting

### Common Issues

**LocalStack not starting:**
```bash
# Check Docker is running
docker ps

# Restart LocalStack
npm run localstack:stop
npm run localstack:start
```

**Environment variables not loading:**
```bash
# Verify .env.local exists and has correct values
cat .env.local

# Restart development server
npm run dev
```

**TypeScript errors:**
```bash
# Run type checking
npm run typecheck

# Check for missing dependencies
npm install
```

**AWS connection issues:**
```bash
# Verify LocalStack health
curl http://localhost:4566/_localstack/health

# Check environment variables
echo $USE_LOCAL_AWS  # Should be "true"
```

### Getting Help

1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review [Common Issues](./quick-reference/troubleshooting.md)
3. Consult [Architecture Guide](./ARCHITECTURE.md)
4. Create an issue with detailed information

## Next Steps

### For New Developers

1. **Explore the Hubs** - Navigate through each hub to understand features
2. **Read Architecture Guide** - Understand system design ([Architecture](./ARCHITECTURE.md))
3. **Review Development Guide** - Learn development patterns ([Development](./DEVELOPMENT.md))
4. **Check Component Library** - Familiarize with UI components ([Components](./quick-reference/components.md))

### For Feature Development

1. **Understand Hub Structure** - Each feature belongs to a specific hub
2. **Follow Patterns** - Use existing patterns for consistency
3. **Test Locally** - Always test with LocalStack before deploying
4. **Update Documentation** - Keep docs current with changes

### For Deployment

1. **Review Deployment Guide** - Understand deployment process ([Deployment](./DEPLOYMENT.md))
2. **Set up AWS Account** - Configure production environment
3. **Configure Secrets** - Set up production environment variables
4. **Test Thoroughly** - Validate all features before production

## Resources

- **[Architecture Overview](./ARCHITECTURE.md)** - System design and structure
- **[Development Guide](./DEVELOPMENT.md)** - Development workflow and patterns
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment process
- **[API Reference](./quick-reference/api.md)** - Server actions and endpoints
- **[Component Library](./quick-reference/components.md)** - UI component reference
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common problems and solutions

Welcome to the team! 🚀