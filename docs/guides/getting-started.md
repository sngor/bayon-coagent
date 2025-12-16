# Getting Started Guide

Complete setup guide for the Bayon CoAgent platform.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)
- **AWS Account** (for production deployment) - [Sign up here](https://aws.amazon.com/)

## Quick Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd bayon-coagent

# Install dependencies
npm install
```

### 2. Environment Configuration

Create your local environment file:

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```bash
# Environment
NODE_ENV=development
USE_LOCAL_AWS=true

# AWS Configuration (LocalStack)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# External APIs (get your own keys)
TAVILY_API_KEY=your-tavily-api-key
NEWS_API_KEY=your-news-api-key
BRIDGE_API_KEY=your-bridge-api-key

# Google OAuth (optional for local development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
```

### 3. Start Local AWS Services

```bash
# Start LocalStack (local AWS services)
npm run localstack:start

# Initialize AWS resources (DynamoDB, S3, Cognito)
npm run localstack:init
```

**Important**: Copy the Cognito User Pool ID and Client ID from the init output and update your `.env.local` file:

```bash
# Update these values in .env.local
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Start Development Server

```bash
# Start the Next.js development server
npm run dev
```

Visit `http://localhost:3000` to see the application running.

### 5. Verify Setup

```bash
# Run the setup verification script
npm run verify:setup
```

This will check:

- ✅ Docker is running
- ✅ LocalStack is accessible
- ✅ Environment variables are set
- ✅ AWS resources are created

## Detailed Setup

### Docker Desktop Setup

1. **Install Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Start Docker Desktop** and ensure it's running
3. **Verify installation**:
   ```bash
   docker --version
   docker-compose --version
   ```

### LocalStack Configuration

LocalStack provides local AWS services for development:

```bash
# Start LocalStack services
npm run localstack:start

# View LocalStack logs
npm run localstack:logs

# Stop LocalStack
npm run localstack:stop
```

**LocalStack Services**:

- **DynamoDB**: Local database
- **S3**: Local file storage
- **Cognito**: Local authentication
- **Bedrock**: Uses real AWS (requires AWS credentials)

### Environment Variables Explained

#### Required for Local Development

```bash
# Environment
NODE_ENV=development          # Development mode
USE_LOCAL_AWS=true           # Use LocalStack instead of real AWS

# AWS Configuration
AWS_REGION=us-east-1         # AWS region
AWS_ACCESS_KEY_ID=test       # LocalStack dummy credentials
AWS_SECRET_ACCESS_KEY=test   # LocalStack dummy credentials

# LocalStack Services
COGNITO_USER_POOL_ID=<from-init>    # From localstack:init output
COGNITO_CLIENT_ID=<from-init>       # From localstack:init output
DYNAMODB_TABLE_NAME=BayonCoAgent-local
S3_BUCKET_NAME=bayon-coagent-local
```

#### External API Keys

Get your API keys from these services:

1. **Tavily API** (AI web search):

   - Sign up at [tavily.com](https://tavily.com/)
   - Get your API key from the dashboard
   - Add to `TAVILY_API_KEY`

2. **NewsAPI** (real estate news):

   - Sign up at [newsapi.org](https://newsapi.org/)
   - Get your API key
   - Add to `NEWS_API_KEY`

3. **Bridge API** (Zillow integration):
   - Contact Bridge API for access
   - Add to `BRIDGE_API_KEY`

#### Optional for Local Development

```bash
# Google OAuth (for Business Profile integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback

# Bedrock (uses real AWS - optional for local development)
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1
```

## First Steps

### 1. Create Your First User

1. Visit `http://localhost:3000`
2. Click "Sign Up" to create an account
3. Use any email (LocalStack doesn't send real emails)
4. Complete the onboarding flow

### 2. Explore the Platform

Navigate through the main hubs:

- **🎨 Studio**: Create content (blog posts, social media, descriptions)
- **🎯 Brand**: Build your brand profile and strategy
- **🔍 Research**: Use the AI research agent
- **📊 Market**: Analyze market trends and opportunities
- **🧮 Tools**: Use calculators and analysis tools
- **📁 Library**: View your saved content and reports

### 3. Test Key Features

#### Content Generation

1. Go to **Studio → Write**
2. Select "Blog Post"
3. Enter a topic like "Seattle Real Estate Market"
4. Generate content

#### Research Agent

1. Go to **Research → Research Agent**
2. Ask a question like "What are the current trends in Seattle real estate?"
3. View the AI-generated research report

#### Brand Profile

1. Go to **Brand → Profile**
2. Fill out your professional information
3. Save and view your profile

## Development Workflow

### Daily Development

```bash
# Start your development session
npm run localstack:start    # Start local AWS services
npm run dev                 # Start Next.js dev server

# During development
npm run lint               # Check code quality
npm run typecheck          # Check TypeScript types
npm test                   # Run tests

# End of session
npm run localstack:stop    # Stop LocalStack (optional)
```

### Making Changes

1. **Edit files** in `src/` directory
2. **Hot reload** automatically updates the browser
3. **Check types** with `npm run typecheck`
4. **Test changes** with `npm test`
5. **Commit changes** with descriptive messages

### Project Structure

```
src/
├── app/                   # Next.js App Router
│   ├── (app)/            # Authenticated routes
│   │   ├── dashboard/    # Dashboard hub
│   │   ├── studio/       # Content creation hub
│   │   ├── brand/        # Brand identity hub
│   │   └── ...           # Other hubs
│   └── api/              # API routes
├── aws/                  # AWS service integrations
├── components/           # React components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and helpers
└── types/                # TypeScript type definitions
```

## Troubleshooting

### Common Issues

#### Docker Not Running

```bash
# Error: Cannot connect to the Docker daemon
# Solution: Start Docker Desktop
```

#### LocalStack Connection Failed

```bash
# Check if LocalStack is running
curl http://localhost:4566/_localstack/health

# Restart LocalStack if needed
npm run localstack:stop
npm run localstack:start
npm run localstack:init
```

#### Port Already in Use

```bash
# Error: Port 3000 is already in use
# Solution: Kill the process or use a different port
lsof -ti:3000 | xargs kill -9
# Or start on different port
npm run dev -- -p 3001
```

#### Environment Variables Not Loading

```bash
# Check if .env.local exists
ls -la .env.local

# Verify environment variables are set
echo $USE_LOCAL_AWS  # Should output "true"

# Restart dev server after changing .env.local
```

#### Cognito Authentication Issues

```bash
# Re-initialize LocalStack resources
npm run localstack:init

# Copy the new Cognito IDs to .env.local
# Restart dev server
```

### Getting Help

1. **Check the logs**:

   ```bash
   npm run localstack:logs    # LocalStack logs
   # Check browser console for frontend errors
   ```

2. **Verify setup**:

   ```bash
   npm run verify:setup       # Run setup verification
   ```

3. **Reset LocalStack**:

   ```bash
   npm run localstack:stop
   rm -rf localstack-data     # Clear LocalStack data
   npm run localstack:start
   npm run localstack:init
   ```

4. **Check documentation**:
   - [Troubleshooting Guide](../troubleshooting/common-issues.md)
   - [LocalStack Issues](../troubleshooting/localstack.md)
   - [Architecture Guide](./architecture.md)

## Next Steps

### Learn the Platform

- [Architecture Overview](./architecture.md) - Understand the system design
- [Component Library](../component-library.md) - Explore UI components
- [Best Practices](../best-practices.md) - Development guidelines

### Advanced Setup

- [Production Deployment](../deployment/deployment.md) - Deploy to AWS
- [CI/CD Pipeline](../cicd/README.md) - Automated deployment
- [Performance Optimization](./performance.md) - Optimize the application

### Feature Development

- [Hub Integration](./hub-integration.md) - Add new features to hubs
- [AI Integration](../features/ai-content.md) - Work with AI features
- [Database Operations](../quick-reference/database.md) - DynamoDB patterns

## Support

Need help? Here's how to get support:

1. **Documentation**: Check the [docs](../README.md) first
2. **Common Issues**: Review [troubleshooting](../troubleshooting/common-issues.md)
3. **Create Issue**: If you find a bug or need a feature
4. **Ask Questions**: Reach out to the development team

Welcome to Bayon CoAgent development! 🚀
