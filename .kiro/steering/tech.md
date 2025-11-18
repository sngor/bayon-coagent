# Tech Stack

## Framework & UI

- **Next.js 15** with App Router (React 19)
- **TypeScript** with strict mode enabled
- **Tailwind CSS** for styling with custom design tokens
- **shadcn/ui** component library (Radix UI primitives)
- **Framer Motion** for animations and page transitions
- **Zod** for schema validation

## AWS Services

- **AWS Cognito**: User authentication with JWT tokens
- **Amazon DynamoDB**: NoSQL database with single-table design
- **Amazon S3**: Object storage for user files and assets
- **AWS Bedrock**: AI service using Claude 3.5 Sonnet (anthropic.claude-3-5-sonnet-20241022-v2:0)
- **AWS CloudWatch**: Logging, monitoring, and alerting
- **AWS Amplify**: Continuous deployment and hosting

## External APIs

- **Tavily API**: Web search for AI flows
- **NewsAPI.org**: Real estate news feed
- **Bridge API**: Zillow review integration
- **Google OAuth**: Business Profile integration

## Development Tools

- **LocalStack**: Local AWS service emulation (DynamoDB, S3, Cognito)
- **Docker & Docker Compose**: Container management for LocalStack
- **Jest**: Unit testing
- **tsx**: TypeScript execution for scripts

## Common Commands

### Development

```bash
npm run dev                 # Start Next.js dev server (port 3000)
npm run build              # Build production bundle
npm run start              # Start production server
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking
```

### LocalStack (Local AWS)

```bash
npm run localstack:start   # Start LocalStack in Docker
npm run localstack:stop    # Stop LocalStack
npm run localstack:init    # Initialize AWS resources
npm run verify:setup       # Verify local setup
```

### Testing

```bash
npm test                   # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

### Infrastructure

```bash
npm run infra:deploy:dev   # Deploy dev infrastructure (CDK)
npm run infra:deploy:prod  # Deploy prod infrastructure (CDK)
npm run sam:deploy:dev     # Deploy dev (SAM - recommended)
npm run sam:deploy:prod    # Deploy prod (SAM - recommended)
```

### Deployment

```bash
npm run deploy:amplify     # Deploy to AWS Amplify
npm run deploy:test <url>  # Test deployment
```

## Build System

- **Next.js** handles bundling, code splitting, and optimization
- **SWC** for fast compilation and minification
- **Turbopack** enabled for faster dev builds
- Production builds ignore TypeScript/ESLint errors (fix before deploying)
- Image optimization with AVIF/WebP support
- Package optimization for lucide-react, Radix UI, recharts, framer-motion

## Environment Configuration

- `.env.local` for local development (with LocalStack)
- `.env.production` for production deployment
- `USE_LOCAL_AWS=true` switches to LocalStack endpoints
- Never commit environment files to version control

## Code Style

- Use functional components with hooks
- Prefer Server Components by default; use `'use client'` only when needed
- Use TypeScript strict mode - no `any` types
- Follow Tailwind utility-first approach
- Use `cn()` utility for conditional classes
- Async/await over promises for readability
