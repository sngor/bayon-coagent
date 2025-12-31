# Bayon CoAgent Architecture

## System Overview

Bayon CoAgent is a modern, cloud-native platform built on AWS with a hub-based architecture that provides AI-powered tools for real estate professionals.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Hub UI    │ │  Components │ │   Contexts  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Server Actions)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Content   │ │    Brand    │ │   Research  │          │
│  │   Actions   │ │   Actions   │ │   Actions   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     AWS Services                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Cognito    │ │  DynamoDB   │ │   Bedrock   │          │
│  │   (Auth)    │ │ (Database)  │ │    (AI)     │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │     S3      │ │ EventBridge │ │   Lambda    │          │
│  │ (Storage)   │ │  (Events)   │ │(Background) │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 15** with App Router (React 19)
- **TypeScript** with strict mode
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Framer Motion** for animations
- **Zod** for schema validation

### Backend & Infrastructure
- **AWS Cognito** - User authentication
- **Amazon DynamoDB** - NoSQL database
- **Amazon S3** - Object storage
- **AWS Bedrock** - AI services (Claude 3.5 Sonnet)
- **AWS Lambda** - Serverless functions
- **AWS EventBridge** - Event-driven architecture
- **AWS CloudWatch** - Monitoring and logging
- **AWS Amplify** - Hosting and deployment

### External Integrations
- **Tavily API** - Web search for research
- **NewsAPI.org** - Real estate news
- **Bridge API** - Zillow integration
- **Google OAuth** - Business Profile sync

## Hub-Based Architecture

### Navigation Structure

The application uses a hub-based architecture that organizes features into logical business domains:

```
Level 1: Main Navigation (Sidebar)
├─ Dashboard (Overview)
├─ Assistant (AI Chat)
├─ Brand (Identity & Strategy)
├─ Studio (Content Creation)
├─ Research (AI Research)
├─ Market (Intelligence)
├─ Tools (Calculations)
├─ Library (Content Management)
├─ Clients (Client Management)
├─ Open House (Event Management)
└─ Learning (Skill Development)

Level 2: Hub Tabs (Horizontal)
└─ Each hub contains 3-8 specialized sections

Level 3: Feature Content
└─ Individual features and tools within sections
```

### Hub Implementation

Each hub follows a consistent pattern:

```typescript
// Hub Layout Structure
<HubLayout
  title="Hub Name"
  description="Hub description"
  icon={HubIcon}
  tabs={hubTabs}
>
  {children}
</HubLayout>

// Hub Tabs Configuration
const hubTabs = [
  { id: 'section1', label: 'Section 1', href: '/hub/section1' },
  { id: 'section2', label: 'Section 2', href: '/hub/section2' },
  // ...
];
```

## Data Architecture

### DynamoDB Single-Table Design

All data is stored in a single DynamoDB table using composite keys:

```
Primary Key Structure:
PK: USER#{userId}          SK: PROFILE
PK: USER#{userId}          SK: CONTENT#{contentId}
PK: USER#{userId}          SK: REPORT#{reportId}
PK: USER#{userId}          SK: OAUTH#{provider}
PK: USER#{userId}          SK: SUBSCRIPTION
PK: USER#{userId}          SK: ANALYTICS#{date}

Global Secondary Indexes:
GSI1: ContentType-CreatedAt (for content queries)
GSI2: UserId-UpdatedAt (for recent activity)
```

### Data Access Patterns

```typescript
// Repository Pattern
const repository = {
  // User operations
  async getUserProfile(userId: string): Promise<UserProfile>
  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void>
  
  // Content operations
  async saveContent(userId: string, content: Content): Promise<string>
  async getUserContent(userId: string, type?: ContentType): Promise<Content[]>
  
  // Analytics operations
  async trackEvent(userId: string, event: AnalyticsEvent): Promise<void>
  async getAnalytics(userId: string, timeframe: string): Promise<Analytics>
};
```

## AI Integration Architecture

### Bedrock Integration

```typescript
// AI Flow Pattern
interface AIFlow<TInput, TOutput> {
  name: string;
  modelId: string;
  systemPrompt: string;
  inputSchema: ZodSchema<TInput>;
  outputSchema: ZodSchema<TOutput>;
  
  execute(input: TInput): Promise<TOutput>;
}

// Example Implementation
const blogPostFlow: AIFlow<BlogPostInput, BlogPostOutput> = {
  name: 'blog-post-generation',
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  systemPrompt: 'You are an expert real estate content writer...',
  inputSchema: blogPostInputSchema,
  outputSchema: blogPostOutputSchema,
  
  async execute(input) {
    // Bedrock invocation logic
  }
};
```

### AI Service Organization

```
src/aws/bedrock/
├── client.ts              # Bedrock client configuration
├── flow-base.ts          # Base flow interface
└── flows/                # Individual AI flows
    ├── blog-post.ts      # Blog post generation
    ├── social-media.ts   # Social media content
    ├── listing.ts        # Listing descriptions
    ├── research.ts       # Research queries
    └── market-analysis.ts # Market intelligence
```

## Event-Driven Architecture

### Event Flow

```
User Action → Server Action → Business Logic → Event Published → Background Processing
```

### Event Types

```typescript
// Content Events
interface ContentEvent {
  type: 'content.generated' | 'content.published' | 'content.updated';
  userId: string;
  contentId: string;
  contentType: ContentType;
  metadata: Record<string, any>;
}

// User Events
interface UserEvent {
  type: 'user.registered' | 'user.subscription.changed' | 'user.profile.updated';
  userId: string;
  timestamp: string;
  data: Record<string, any>;
}

// System Events
interface SystemEvent {
  type: 'system.error' | 'system.performance' | 'system.health';
  service: string;
  severity: 'low' | 'medium' | 'high';
  details: Record<string, any>;
}
```

### Event Processing

```typescript
// Event Publisher
class EventPublisher {
  async publish(event: Event): Promise<void> {
    await eventBridge.putEvents({
      Entries: [{
        Source: 'bayon.coagent',
        DetailType: event.type,
        Detail: JSON.stringify(event),
      }]
    }).promise();
  }
}

// Event Handlers (Lambda Functions)
export const contentEventHandler = async (event: EventBridgeEvent) => {
  const contentEvent = JSON.parse(event.detail) as ContentEvent;
  
  switch (contentEvent.type) {
    case 'content.generated':
      await updateAnalytics(contentEvent);
      await sendNotification(contentEvent);
      break;
    // Handle other event types
  }
};
```

## Security Architecture

### Authentication Flow

```
1. User Login → Cognito Authentication
2. JWT Token → Stored in HTTP-only cookies
3. Server Actions → Validate JWT on each request
4. AWS Services → Use validated user context
```

### Authorization Patterns

```typescript
// Role-Based Access Control
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

// Permission Checks
const requireAuth = (handler: ServerAction) => {
  return async (...args: any[]) => {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    
    return handler(...args);
  };
};

const requireRole = (role: UserRole) => (handler: ServerAction) => {
  return async (...args: any[]) => {
    const user = await getCurrentUser();
    if (!user || !user.roles.includes(role)) {
      throw new Error('Insufficient permissions');
    }
    
    return handler(...args);
  };
};
```

## Performance Architecture

### Caching Strategy

```
Level 1: Browser Cache (Static assets)
Level 2: CDN Cache (CloudFront)
Level 3: Application Cache (Redis/Memory)
Level 4: Database Cache (DynamoDB DAX)
```

### Optimization Techniques

```typescript
// React Optimizations
const OptimizedComponent = memo(({ data }: Props) => {
  const memoizedValue = useMemo(() => expensiveCalculation(data), [data]);
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  return <div>{/* Component content */}</div>;
});

// Virtual Scrolling for Large Lists
const VirtualizedList = ({ items }: { items: any[] }) => {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index]}
        </div>
      )}
    </FixedSizeList>
  );
};
```

## Monitoring & Observability

### Logging Strategy

```typescript
// Structured Logging
const logger = {
  info: (message: string, context: Record<string, any>) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      traceId: process.env._X_AMZN_TRACE_ID,
      ...context
    }));
  },
  
  error: (message: string, error: Error, context: Record<string, any>) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      traceId: process.env._X_AMZN_TRACE_ID,
      ...context
    }));
  }
};
```

### Metrics Collection

```typescript
// Custom Metrics
const metrics = {
  async trackContentGeneration(userId: string, contentType: string, duration: number) {
    await cloudWatch.putMetricData({
      Namespace: 'BayonCoAgent/Content',
      MetricData: [{
        MetricName: 'GenerationDuration',
        Value: duration,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'ContentType', Value: contentType },
          { Name: 'UserId', Value: userId }
        ]
      }]
    }).promise();
  }
};
```

## Deployment Architecture

### Environment Strategy

```
Development → Staging → Production

Each environment has:
- Separate AWS accounts/regions
- Environment-specific configuration
- Isolated data and resources
- Appropriate monitoring and alerting
```

### Infrastructure as Code

```yaml
# SAM Template Structure
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  # Cognito User Pool
  UserPool:
    Type: AWS::Cognito::UserPool
    
  # DynamoDB Table
  MainTable:
    Type: AWS::DynamoDB::Table
    
  # Lambda Functions
  ContentGenerationFunction:
    Type: AWS::Serverless::Function
    
  # EventBridge Rules
  ContentEventRule:
    Type: AWS::Events::Rule
```

## Scalability Considerations

### Horizontal Scaling

- **Serverless Functions** - Auto-scaling Lambda functions
- **Database** - DynamoDB on-demand scaling
- **CDN** - CloudFront global distribution
- **Event Processing** - EventBridge automatic scaling

### Performance Optimization

- **Code Splitting** - Dynamic imports for large components
- **Bundle Optimization** - Tree shaking and minification
- **Image Optimization** - Next.js automatic image optimization
- **Caching** - Multi-level caching strategy

## Future Architecture Considerations

### Microservices Evolution

```
Current: Monolithic Next.js app with serverless functions
Future: Domain-specific microservices

Potential Services:
- Content Generation Service
- Brand Intelligence Service
- Research Service
- Market Intelligence Service
- User Management Service
- Integration Service
```

### Real-time Features

```
Current: Request-response pattern
Future: Real-time updates

Technologies:
- WebSocket API Gateway
- Server-Sent Events
- Real-time notifications
- Live collaboration features
```

## Best Practices

### Development Patterns

1. **Server Components First** - Use Server Components by default
2. **Type Safety** - Strict TypeScript with Zod validation
3. **Error Boundaries** - Comprehensive error handling
4. **Performance Monitoring** - Track Core Web Vitals
5. **Security First** - Input validation and sanitization

### Code Organization

1. **Feature-Based Structure** - Organize by business domain
2. **Shared Components** - Reusable UI components
3. **Custom Hooks** - Encapsulate complex logic
4. **Server Actions** - Centralized API logic
5. **Type Definitions** - Shared TypeScript interfaces

This architecture provides a solid foundation for a scalable, maintainable, and performant real estate agent platform while maintaining flexibility for future enhancements and growth.