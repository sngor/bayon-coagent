# Commands Reference

## Development Commands

### Basic Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Testing
npm test
npm run test:watch
npm run test:coverage
```

### LocalStack (Local AWS)

```bash
# Start LocalStack services
npm run localstack:start

# Stop LocalStack services
npm run localstack:stop

# Initialize AWS resources
npm run localstack:init

# View LocalStack logs
npm run localstack:logs

# Verify local setup
npm run verify:setup
```

### Build & Analysis

```bash
# Production build
npm run build

# Fast build (skip validation)
npm run build:fast

# Build with bundle analysis
npm run build:analyze

# Check bundle size
npm run bundle:check

# Track bundle size changes
npm run bundle:track
```

### Testing & Quality

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Lighthouse performance tests
npm run lighthouse

# Lighthouse CI
npm run lighthouse:ci

# Security check
npm run security:check
```

## Infrastructure & Deployment

### SAM Deployment

```bash
# Validate SAM templates
npm run sam:validate

# Deploy to development
npm run sam:deploy:dev

# Deploy to production
npm run sam:deploy:prod

# Destroy development stack
npm run sam:destroy:dev

# Destroy production stack
npm run sam:destroy:prod

# View stack outputs
npm run sam:outputs

# Update environment from SAM outputs
npm run sam:update-env
```

### CDK Infrastructure (Alternative)

```bash
# Validate infrastructure
npm run infra:validate

# Deploy development infrastructure
npm run infra:deploy:dev

# Deploy production infrastructure
npm run infra:deploy:prod
```

### Amplify Deployment

```bash
# Deploy to AWS Amplify
npm run deploy:amplify

# Test deployment
npm run deploy:test
```

## Service Management

### Admin & Setup

```bash
# Create super admin user
npm run admin:create

# Setup AWS Secrets Manager
npm run setup:secrets

# Verify secrets configuration
npm run verify:secrets

# Clear authentication session
npm run clear-auth
```

### Service Verification

```bash
# Verify Bedrock models
npm run verify:bedrock-models

# Verify Reimagine setup
npm run verify:reimagine

# Verify X-Ray tracing
npm run verify:xray

# Verify SQS queues
npm run verify:sqs

# Verify EventBridge
npm run verify:eventbridge
```

### Configuration

```bash
# Configure Reimagine S3
npm run configure:reimagine-s3

# Setup Reimagine monitoring
npm run setup:reimagine-monitoring

# Setup onboarding monitoring
npm run setup:onboarding-monitoring
```

## API & Testing

### API Testing

```bash
# Test all API endpoints
./scripts/test-api-endpoints.sh

# Test specific endpoint
curl http://localhost:3000/api/health
```

### Database Operations

```bash
# Run database migrations (if any)
npm run db:migrate

# Seed test data
npm run db:seed

# Reset local database
npm run db:reset
```

## Monitoring & Debugging

### Logs & Monitoring

```bash
# View application logs
npm run logs

# View LocalStack logs
npm run localstack:logs

# Monitor performance
npm run monitor

# Check system health
npm run health:check
```

### Debugging

```bash
# Debug TypeScript errors
node scripts/analyze-typescript-errors.js

# Debug build issues
npm run build -- --debug

# Debug tests
npm run test -- --verbose

# Debug LocalStack
docker logs localstack_main
```

## Utility Scripts

### Code Quality

```bash
# Format code
npm run format

# Check code style
npm run style:check

# Fix code style
npm run style:fix

# Analyze dependencies
npm run deps:analyze

# Update dependencies
npm run deps:update
```

### Performance

```bash
# Performance profiling
npm run profile

# Memory usage analysis
npm run memory:analyze

# Bundle size analysis
npm run bundle:analyze

# Lighthouse audit
npm run audit:performance
```

### Security

```bash
# Security audit
npm audit

# Fix security issues
npm audit fix

# Check for secrets in code
npm run security:scan

# Validate security headers
npm run security:headers
```

## Environment-Specific Commands

### Development Environment

```bash
# Start full development environment
npm run dev:full

# Reset development environment
npm run dev:reset

# Clean development cache
npm run dev:clean
```

### Production Environment

```bash
# Production health check
npm run prod:health

# Production deployment verification
npm run prod:verify

# Production rollback
npm run prod:rollback
```

### Staging Environment

```bash
# Deploy to staging
npm run staging:deploy

# Test staging environment
npm run staging:test

# Promote staging to production
npm run staging:promote
```

## Docker Commands

### Container Management

```bash
# Build Docker image
docker build -t bayon-coagent .

# Run container
docker run -p 3000:3000 bayon-coagent

# View running containers
docker ps

# Stop all containers
docker stop $(docker ps -q)

# Clean up containers
docker system prune
```

### LocalStack Docker

```bash
# Start LocalStack container
docker-compose up localstack

# Stop LocalStack container
docker-compose down

# View LocalStack logs
docker-compose logs localstack

# Restart LocalStack
docker-compose restart localstack
```

## Git & Version Control

### Branch Management

```bash
# Create feature branch
git checkout -b feature/new-feature

# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/new-feature

# Delete feature branch
git branch -d feature/new-feature
```

### Release Management

```bash
# Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin --tags

# Create release branch
git checkout -b release/v1.0.0
```

## Troubleshooting Commands

### Common Issues

```bash
# Clear all caches
npm run clean:all

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset TypeScript cache
rm -rf .next/cache
npm run dev

# Fix permission issues
sudo chown -R $(whoami) node_modules
```

### LocalStack Issues

```bash
# Reset LocalStack
npm run localstack:stop
docker system prune -f
npm run localstack:start
npm run localstack:init
```

### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Rebuild from scratch
npm run clean
npm install
npm run build
```

## Custom Scripts

### Project-Specific

```bash
# Generate API documentation
npm run docs:api

# Update component library
npm run components:update

# Sync with design system
npm run design:sync

# Generate changelog
npm run changelog:generate
```

### Data Management

```bash
# Export user data
npm run data:export

# Import test data
npm run data:import

# Backup database
npm run db:backup

# Restore database
npm run db:restore
```

## Environment Variables

### Required for Development

```bash
# Check required environment variables
npm run env:check

# Generate environment template
npm run env:template

# Validate environment configuration
npm run env:validate
```

### AWS Configuration

```bash
# Configure AWS CLI
aws configure

# Check AWS credentials
aws sts get-caller-identity

# List AWS profiles
aws configure list-profiles
```

## Performance Monitoring

### Metrics Collection

```bash
# Collect performance metrics
npm run metrics:collect

# Generate performance report
npm run metrics:report

# Monitor real-time performance
npm run metrics:monitor
```

### Optimization

```bash
# Optimize images
npm run images:optimize

# Optimize bundle
npm run bundle:optimize

# Optimize database queries
npm run db:optimize
```

## Backup & Recovery

### Data Backup

```bash
# Backup all data
npm run backup:all

# Backup user data
npm run backup:users

# Backup configuration
npm run backup:config
```

### Recovery

```bash
# Restore from backup
npm run restore:backup

# Restore specific data
npm run restore:users

# Emergency recovery
npm run recovery:emergency
```

## Integration Testing

### End-to-End Testing

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in headless mode
npm run test:e2e:headless

# Run specific E2E test
npm run test:e2e -- --spec="login.spec.ts"
```

### API Integration Testing

```bash
# Test API integrations
npm run test:integration

# Test external APIs
npm run test:external

# Test webhook endpoints
npm run test:webhooks
```

This comprehensive command reference covers all available npm scripts and common operations for the Bayon CoAgent project. Use these commands for development, testing, deployment, and maintenance tasks.