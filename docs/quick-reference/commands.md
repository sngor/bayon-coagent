# NPM Scripts Reference

Complete reference for all available npm scripts in the Bayon CoAgent project.

## 🚀 Development

### Core Development Commands

```bash
npm run dev                 # Start Next.js development server (port 3000)
npm run build              # Build production bundle
npm run build:fast         # Fast build (skips env validation)
npm run build:analyze      # Build with bundle analysis
npm run start              # Start production server
npm run lint               # Run ESLint
npm run typecheck          # Run TypeScript type checking
```

### Analysis & Optimization

```bash
npm run analyze            # Analyze bundle size
npm run bundle:check       # Check bundle size limits
npm run bundle:track       # Track bundle size changes
npm run lighthouse         # Run Lighthouse performance test
npm run lighthouse:prod    # Run Lighthouse on production URL
npm run lighthouse:ci      # Run Lighthouse CI
node scripts/analyze-typescript-errors.js  # Analyze and categorize TypeScript errors
```

## 🐳 LocalStack (Local AWS)

### Container Management

```bash
npm run localstack:start   # Start LocalStack in Docker
npm run localstack:stop    # Stop LocalStack
npm run localstack:logs    # View LocalStack logs
```

### AWS Resource Management

```bash
npm run localstack:init    # Initialize AWS resources (DynamoDB, S3, Cognito)
npm run verify:setup       # Verify local development setup
```

**Important**: After running `localstack:init`, copy the Cognito User Pool ID and Client ID to your `.env.local` file.

## 🧪 Testing

### Test Execution

```bash
npm test                   # Run Jest tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

### Verification Scripts

```bash
npm run verify:setup       # Verify local development setup
npm run verify:bedrock-models  # Verify Bedrock model access
npm run verify:reimagine    # Verify image processing setup
npm run verify:xray        # Verify X-Ray tracing setup
npm run verify:sqs         # Verify SQS queues
npm run verify:secrets     # Verify AWS Secrets Manager
npm run verify:eventbridge # Verify EventBridge setup
```

## 🚀 Deployment

### SAM (Serverless Application Model)

```bash
npm run sam:validate       # Validate SAM template
npm run sam:deploy:dev     # Deploy to development environment
npm run sam:deploy:prod    # Deploy to production environment
npm run sam:destroy:dev    # Destroy development infrastructure
npm run sam:destroy:prod   # Destroy production infrastructure
npm run sam:outputs        # Show CloudFormation stack outputs
npm run sam:update-env     # Update environment from SAM outputs
```

### Amplify Deployment

```bash
npm run deploy:amplify     # Deploy to AWS Amplify Hosting
npm run deploy:test <url>  # Test deployment at specified URL
```

## 🔄 Data Migration

### Firebase to AWS Migration

```bash
npm run migrate:export     # Export data from Firestore
npm run migrate:transform  # Transform data to DynamoDB format
npm run migrate:import     # Import data to DynamoDB
npm run migrate:storage    # Migrate files from Firebase Storage to S3
npm run migrate:validate   # Validate migration completeness
npm run migrate:rollback   # Rollback migration (delete AWS data)
npm run migrate:all        # Run complete migration pipeline
```

## 🔧 Configuration & Setup

### AWS Services Configuration

```bash
npm run setup:secrets      # Setup AWS Secrets Manager
npm run setup:reimagine-monitoring  # Setup image processing monitoring
npm run setup:onboarding-monitoring # Setup onboarding monitoring
```

### S3 Configuration

```bash
npm run reimagine:configure-s3     # Configure S3 lifecycle policies
npm run configure:reimagine-s3     # Configure S3 for image processing
```

## 👤 User Management

### Admin Operations

```bash
npm run admin:create       # Create super admin user
npm run clear-auth         # Clear authentication session
```

## 🔍 Monitoring & Debugging

### Queue Management

```bash
npm run verify:sqs         # Verify SQS queues
npm run verify:sqs:send    # Test SQS message sending
```

### EventBridge

```bash
npm run verify:eventbridge      # Verify EventBridge setup (dev)
npm run verify:eventbridge:prod # Verify EventBridge setup (prod)
```

## 🛡️ Security

### Security Checks

```bash
npm run security:check     # Check for exposed secrets
npm run prepare           # Setup Husky git hooks
```

### Service Worker

```bash
npm run clear:sw          # Clear service worker cache
```

## 📊 Performance Testing

### Lighthouse Testing

```bash
npm run lighthouse                    # Test local development
npm run lighthouse:prod              # Test production URL
npm run lighthouse:ci                # Run CI pipeline
npm run lighthouse:ci:collect        # Collect performance data
npm run lighthouse:ci:assert         # Assert performance thresholds
npm run lighthouse:ci:upload         # Upload results
```

## 🔧 Utility Scripts

### Development Utilities

```bash
npm run clear:sw           # Clear service worker
npm run clear-auth         # Clear authentication session
node scripts/analyze-typescript-errors.js  # Analyze TypeScript errors with categorization
node scripts/fix-typescript-errors.js      # Auto-fix common TypeScript errors
node scripts/fix-console-logging.js        # Replace console.log with proper logging
```

## Environment-Specific Commands

### Development Environment

```bash
# Start development session
npm run localstack:start
npm run localstack:init
npm run dev

# Verify everything is working
npm run verify:setup
```

### Production Environment

```bash
# Deploy infrastructure
npm run sam:deploy:prod

# Deploy application
npm run deploy:amplify

# Test deployment
npm run deploy:test https://your-domain.com
```

## Command Combinations

### Full Local Setup

```bash
# Complete local development setup
npm install
npm run localstack:start
npm run localstack:init
npm run verify:setup
npm run dev
```

### Pre-Deployment Checks

```bash
# Run all checks before deploying
npm run lint
npm run typecheck
npm test
npm run build
npm run security:check
```

### Performance Analysis

```bash
# Analyze application performance
npm run build:analyze
npm run bundle:check
npm run lighthouse
```

## Script Categories

### 🏗️ Build & Development

- `dev`, `build`, `start`, `lint`, `typecheck`

### 🐳 LocalStack & AWS

- `localstack:*`, `sam:*`, `verify:*`

### 🧪 Testing & Quality

- `test`, `test:*`, `lighthouse`, `security:check`

### 🚀 Deployment

- `deploy:*`, `sam:deploy:*`

### 🔄 Migration

- `migrate:*`

### ⚙️ Configuration

- `setup:*`, `configure:*`, `admin:*`

## Tips

### Parallel Execution

Some commands can be run in parallel for faster development:

```bash
# Terminal 1: Start LocalStack
npm run localstack:start

# Terminal 2: Start dev server (after LocalStack is ready)
npm run dev

# Terminal 3: Run tests in watch mode
npm run test:watch
```

### Environment Variables

Many commands respect environment variables:

```bash
# Use different port for dev server
PORT=3001 npm run dev

# Skip environment validation for faster builds
SKIP_ENV_VALIDATION=true npm run build

# Enable bundle analysis
ANALYZE=true npm run build
```

### Debugging

Add debugging to any command:

```bash
# Debug Next.js
DEBUG=* npm run dev

# Verbose npm output
npm run build --verbose

# Node.js debugging
NODE_OPTIONS="--inspect" npm run dev
```

## Common Workflows

### Daily Development

```bash
npm run localstack:start
npm run dev
# Make changes, test, commit
npm run localstack:stop  # Optional
```

### Feature Development

```bash
npm run typecheck        # Check types
npm run lint            # Check code style
npm test               # Run tests
npm run build          # Test build
```

### Deployment Preparation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run security:check
npm run sam:deploy:dev  # Test in dev first
```

### Troubleshooting

```bash
npm run verify:setup    # Check local setup
npm run localstack:logs # Check LocalStack logs
npm run clear:sw       # Clear service worker
npm run clear-auth     # Clear auth session
node scripts/analyze-typescript-errors.js  # Analyze TypeScript errors
```
