# Architecture Overview

Comprehensive guide to the Bayon CoAgent platform architecture.

## 🏗️ System Architecture

Bayon CoAgent is built as a modern, scalable web application using AWS services and Next.js.

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   AWS Services  │
│   (Next.js)     │◄──►│   (API Routes)   │◄──►│   (Serverless)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
│                      │                      │
├─ React 19           ├─ Server Actions      ├─ Cognito (Auth)
├─ TypeScript         ├─ API Routes         ├─ DynamoDB (Data)
├─ Tailwind CSS       ├─ Middleware         ├─ S3 (Storage)
├─ shadcn/ui          └─ Edge Functions     ├─ Bedrock (AI)
├─ Framer Motion                           ├─ CloudWatch (Logs)
└─ Zod Validation                          └─ Amplify (Hosting)
```

## 🎯 Hub-Based Architecture

The application is organized around feature hubs for intuitive navigation and development.

### Hub Structure

```
Application Root
├── Dashboard (Overview)
├── Assistant (AI Chat)
├── Studio (Content Creation)
│   ├── Write (Blog posts, social media)
│   ├── Describe (Listing descriptions)
│   └── Reimagine (Image editing)
├── Brand (Identity & Strategy)
│   ├── Profile (Professional info)
│   ├── Audit (NAP consistency)
│   ├── Competitors (Market analysis)
│   └── Strategy (Marketing plans)
├── Research (AI Research)
│   ├── Research Agent (Q&A)
│   ├── Reports (Saved research)
│   └── Knowledge Base (Repository)
├── Market (Intelligence)
│   ├── Insights (Trends analysis)
│   ├── Opportunities (Investment)
│   └── Analytics (Performance)
├── Tools (Deal Analysis)
│   ├── Calculator (Mortgage)
│   ├── ROI (Renovation)
│   └── Valuation (Property)
├── Library (Content Management)
│   ├── Content (Created content)
│   ├── Reports (Research reports)
│   ├── Media (Files)
│   └── Templates (Reusable)
├── Learning (Skill Development)
│   ├── Lessons (Interactive)
│   ├── Role-Play (AI scenarios)
│   └── AI Plans (Personalized)
└── Settings (Configuration)
```

### Navigation Hierarchy

```
Level 1: Main Navigation (Sidebar)
├─ Level 2: Hub Tabs (Horizontal)
│  └─ Level 3: Section Content (Page)
│     └─ Level 4: Feature Details (Modal/Drawer)
```

## 🛠️ Technology Stack

### Frontend Framework

**Next.js 15 with App Router**

- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes for backend functionality
- Edge runtime for performance
- Automatic code splitting

**React 19**

- Server Components by default
- Client Components for interactivity
- Concurrent features
- Suspense boundaries
- Error boundaries

### UI & Styling

**Tailwind CSS**

- Utility-first CSS framework
- Custom design tokens
- Responsive design system
- Dark mode support
- JIT compilation

**shadcn/ui Components**

- Radix UI primitives
- Accessible components
- Customizable design system
- TypeScript support
- Copy-paste components

**Framer Motion**

- Declarative animations
- Layout animations
- Gesture handling
- Page transitions
- Performance optimized

### Type Safety & Validation

**TypeScript**

- Strict mode enabled
- Type-safe API calls
- Component prop validation
- IDE integration
- Build-time error checking

**Zod**

- Runtime type validation
- Schema-first approach
- Form validation
- API input/output validation
- Type inference

## ☁️ AWS Infrastructure

### Authentication & Authorization

**AWS Cognito**

- User pools for authentication
- JWT token management
- Multi-factor authentication
- Social login integration
- Session management

### Database

**Amazon DynamoDB**

- Single-table design pattern
- Partition key: `USER#<userId>`
- Sort key patterns for different entities
- Global secondary indexes
- Point-in-time recovery

#### Data Model

```
PK: USER#<userId>          SK: PROFILE
PK: USER#<userId>          SK: CONTENT#<id>
PK: USER#<userId>          SK: REPORT#<id>
PK: USER#<userId>          SK: AGENT#<id>
PK: USER#<userId>          SK: OAUTH#<provider>
PK: USER#<userId>          SK: PLAN#<id>
```

### Storage

**Amazon S3**

- User-generated content
- Image processing pipeline
- Static asset hosting
- Lifecycle policies
- Presigned URLs for uploads

### AI Services

**AWS Bedrock**

- Claude 3.5 Sonnet model
- Streaming responses
- Content generation
- Image analysis
- Safety guardrails

**Agent Orchestration System**

- Multi-agent workflow execution
- Dependency-based step coordination
- Intelligent retry mechanisms
- Workflow persistence and tracking
- Error categorization and handling

### Monitoring & Logging

**AWS CloudWatch**

- Application logs
- Performance metrics
- Error tracking
- Custom dashboards
- Alerting

### Hosting & Deployment

**AWS Amplify**

- Continuous deployment
- Branch-based environments
- Custom domains
- SSL certificates
- Global CDN

## 📁 Project Structure

### Source Code Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   │   ├── dashboard/     # Dashboard hub
│   │   ├── studio/        # Content creation hub
│   │   ├── brand/         # Brand identity hub
│   │   ├── research/      # Research hub
│   │   ├── market/        # Market intelligence hub
│   │   ├── tools/         # Deal analysis hub
│   │   ├── library/       # Content management hub
│   │   ├── learning/      # Skill development hub
│   │   └── settings/      # Configuration hub
│   ├── (auth)/            # Authentication pages
│   ├── (legal)/           # Legal pages
│   ├── api/               # API routes
│   ├── actions.ts         # Server actions
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── aws/                   # AWS service integrations
│   ├── auth/              # Cognito authentication
│   ├── dynamodb/          # Database operations
│   ├── s3/                # File storage
│   ├── bedrock/           # AI services
│   └── config.ts          # AWS configuration
├── components/            # React components
│   ├── ui/                # shadcn/ui components
│   ├── hub/               # Hub-specific components
│   └── [feature]/         # Feature components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
├── services/              # Business logic and orchestration
│   └── strands/           # AI agent services and orchestration
└── types/                 # TypeScript definitions
```

### Infrastructure Code

```
infrastructure/
├── lib/                   # CDK stack definitions
├── scripts/               # Deployment scripts
└── cdk.json              # CDK configuration
```

## 🤖 Agent Orchestration System

### Multi-Agent Workflow Architecture

The Agent Orchestration System coordinates multiple AI agents to execute complex, multi-step workflows automatically.

#### Workflow Types

**Content Campaign Workflow**

```
Research Agent → Content Studio → Market Intelligence
     ↓              ↓                    ↓
Market Research → Blog Content →    Market Update
                → Social Media
```

**Listing Optimization Workflow**

```
Market Intelligence → Competitive Analysis → Listing Description
        ↓                      ↓                    ↓
Market Analysis →    Competitive Research →   Optimized Description
```

**Brand Building Workflow**

```
Research Agent → Market Intelligence → Content Studio
      ↓               ↓                    ↓
Competitive → Market Positioning → Content Strategy
Research
```

**Investment Analysis Workflow**

```
Research Agent → Market Intelligence → Opportunity Analysis
      ↓               ↓                       ↓
Market Research → Trend Analysis →    Investment Report
```

#### Orchestration Features

**Dependency Management**

- Steps execute based on dependency completion
- Parallel execution for independent steps
- Intelligent waiting for prerequisite results

**Error Handling & Retry Logic**

- Agent-specific retry configurations
- Exponential backoff with jitter
- Error categorization (timeout, network, validation, agent failure)
- Graceful degradation for non-critical failures

**Progress Tracking**

- Real-time workflow status updates
- Step-by-step completion monitoring
- Duration tracking and performance metrics
- Workflow persistence in DynamoDB

**Result Synthesis**

- Combines outputs from multiple agents
- Structured result formatting
- Summary generation with key insights
- Workflow completion notifications

#### Implementation Pattern

```typescript
// Define workflow input
const workflowInput: WorkflowOrchestrationInput = {
  workflowType: "content-campaign",
  userId: "user123",
  name: "Seattle Market Campaign",
  parameters: {
    topic: "Seattle Real Estate Trends",
    targetAudience: "buyers",
    platforms: ["linkedin", "facebook"],
  },
};

// Execute workflow
const result = await executeAgentWorkflow(workflowInput);

// Result includes:
// - success: boolean
// - workflowId: string
// - steps: WorkflowStep[]
// - results: combined agent outputs
// - summary: workflow completion summary
```

## 🔄 Data Flow

### Authentication Flow

```
1. User visits protected route
2. Middleware checks for valid JWT token
3. If no token, redirect to sign-in
4. Cognito handles authentication
5. JWT token stored in httpOnly cookie
6. Subsequent requests include token
7. Server actions validate token
```

### Content Generation Flow

```
1. User submits content request (form)
2. Server action validates input (Zod)
3. Server action calls Bedrock API
4. Bedrock streams response
5. Response saved to DynamoDB
6. Client receives streamed content
7. UI updates optimistically
```

### Data Persistence Flow

```
1. User action triggers server action
2. Server action validates input
3. DynamoDB operation executed
4. Response returned to client
5. Client updates UI state
6. Cache invalidated if needed
```

## 🔧 Development Patterns

### Server Components vs Client Components

**Server Components (Default)**

- Data fetching
- Static content
- SEO-friendly
- No JavaScript bundle
- Direct database access

**Client Components (`'use client'`)**

- Interactive features
- Event handlers
- Browser APIs
- State management
- Real-time updates

### Server Actions Pattern

```typescript
// Server Action
export async function createContent(formData: FormData) {
  // 1. Validate input with Zod
  const input = contentSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  // 2. Get user from session
  const user = await getCurrentUser();

  // 3. Call AWS service
  const result = await generateContent(input);

  // 4. Save to database
  await saveContent(user.id, result);

  // 5. Return structured response
  return { success: true, data: result };
}
```

### Component Composition

```typescript
// Hub Layout Pattern
export function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hub-container">
      <HubHeader />
      <HubTabs />
      <main className="hub-content">{children}</main>
    </div>
  );
}
```

## 🚀 Performance Architecture

### Optimization Strategies

**Code Splitting**

- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading for non-critical features

**Caching**

- Next.js automatic caching
- DynamoDB query caching
- S3 CloudFront distribution
- Browser caching headers

**Image Optimization**

- Next.js Image component
- Automatic format conversion (WebP/AVIF)
- Responsive image sizing
- Lazy loading

**Bundle Optimization**

- Tree shaking
- Package optimization
- Dynamic imports
- Bundle analysis

### Monitoring & Analytics

**Performance Metrics**

- Core Web Vitals
- Lighthouse scores
- Real User Monitoring (RUM)
- Custom performance markers

**Error Tracking**

- CloudWatch error logs
- Client-side error boundaries
- Unhandled promise rejections
- Network error monitoring

## 🔐 Security Architecture

### Authentication Security

- JWT tokens with short expiration
- Refresh token rotation
- httpOnly cookies
- CSRF protection
- Rate limiting

### Data Security

- Encryption at rest (DynamoDB, S3)
- Encryption in transit (HTTPS/TLS)
- IAM least privilege access
- VPC security groups
- AWS WAF protection

### Input Validation

- Zod schema validation
- SQL injection prevention
- XSS protection
- File upload validation
- Rate limiting

## 🌐 Scalability Architecture

### Horizontal Scaling

- Serverless functions (auto-scaling)
- DynamoDB on-demand scaling
- S3 unlimited storage
- CloudFront global distribution
- Amplify auto-scaling

### Performance Scaling

- Edge computing with CloudFront
- Regional data replication
- Lazy loading strategies
- Progressive enhancement
- Optimistic UI updates

## 🔄 Development Workflow

### Local Development

```
1. LocalStack for AWS services
2. Docker containers for isolation
3. Hot reload for fast iteration
4. TypeScript for type safety
5. ESLint for code quality
```

### CI/CD Pipeline

```
1. GitHub Actions for automation
2. Automated testing
3. Security scanning
4. Performance testing
5. Multi-environment deployment
```

### Deployment Strategy

```
Development → Staging → Production
     ↓           ↓          ↓
  LocalStack   AWS Dev   AWS Prod
```

## 📊 Monitoring Architecture

### Application Monitoring

- CloudWatch application logs
- Custom metrics and dashboards
- Error rate monitoring
- Performance tracking
- User behavior analytics

### Infrastructure Monitoring

- AWS service health
- Resource utilization
- Cost monitoring
- Security events
- Compliance tracking

This architecture provides a scalable, maintainable, and performant foundation for the Bayon CoAgent platform while ensuring security and reliability.
