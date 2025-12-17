# Phase 2: Service Decomposition & Event-Driven Architecture

## Overview

Transform the current 4-service architecture into 8 domain-aligned microservices that match your product hubs and business domains.

## Current State → Target State

### Current Services (4)

- AI Service (handles all AI operations)
- Integration Service (handles all external integrations)
- Background Service (handles all background processing)
- Admin Service (handles admin operations)

### Target Services (8)

#### 1. **Studio Service** 🎨

**Domain**: Content Creation Hub
**Responsibilities**:

- Blog post generation
- Social media content creation
- Listing descriptions
- Market updates
- Video scripts
- Neighborhood guides

**API Endpoints**:

```
POST /studio/content/generate
GET  /studio/content/{id}
PUT  /studio/content/{id}
DELETE /studio/content/{id}
POST /studio/content/{id}/publish
```

**Events Published**:

- `studio.content.generated`
- `studio.content.published`
- `studio.content.updated`

#### 2. **Reimagine Service** 🖼️

**Domain**: AI Image Processing
**Responsibilities**:

- Virtual staging
- Day-to-dusk conversion
- Image enhancement
- Item removal
- Renovation visualization

**API Endpoints**:

```
POST /reimagine/process
GET  /reimagine/jobs/{id}
POST /reimagine/jobs/{id}/download
```

**Events Published**:

- `reimagine.job.started`
- `reimagine.job.completed`
- `reimagine.job.failed`

#### 3. **Brand Intelligence Service** 🎯

**Domain**: Brand Identity & Strategy Hub
**Responsibilities**:

- Profile management
- NAP consistency audits
- Competitor analysis
- Keyword ranking tracking
- Marketing strategy generation

**API Endpoints**:

```
GET  /brand/profile
PUT  /brand/profile
POST /brand/audit
GET  /brand/competitors
POST /brand/competitors/analyze
GET  /brand/strategy
POST /brand/strategy/generate
```

**Events Published**:

- `brand.profile.updated`
- `brand.audit.completed`
- `brand.competitor.discovered`
- `brand.ranking.changed`

#### 4. **Research Service** 🔍

**Domain**: AI-Powered Research Hub
**Responsibilities**:

- Research agent queries
- Market research
- Report generation
- Knowledge base management

**API Endpoints**:

```
POST /research/query
GET  /research/reports
GET  /research/reports/{id}
POST /research/knowledge/add
GET  /research/knowledge/search
```

**Events Published**:

- `research.query.completed`
- `research.report.generated`
- `research.knowledge.updated`

#### 5. **Market Intelligence Service** 📊

**Domain**: Market Intelligence Hub
**Responsibilities**:

- Life event predictions
- Market trend analysis
- News aggregation
- Price alerts
- Investment opportunities

**API Endpoints**:

```
GET  /market/trends
GET  /market/news
POST /market/alerts
GET  /market/opportunities
GET  /market/analytics
```

**Events Published**:

- `market.trend.detected`
- `market.alert.triggered`
- `market.opportunity.identified`

#### 6. **Tools Service** 🧮

**Domain**: Deal Analysis & Calculation Hub
**Responsibilities**:

- Mortgage calculations
- ROI analysis
- Property valuation
- Financial modeling

**API Endpoints**:

```
POST /tools/mortgage/calculate
POST /tools/roi/analyze
POST /tools/valuation/estimate
GET  /tools/calculations/{id}
```

**Events Published**:

- `tools.calculation.completed`
- `tools.analysis.generated`

#### 7. **User & Subscription Service** 👤

**Domain**: User Management & Billing
**Responsibilities**:

- User authentication
- Profile management
- Subscription handling
- Usage tracking
- Billing integration

**API Endpoints**:

```
POST /users/register
POST /users/login
GET  /users/profile
PUT  /users/profile
GET  /users/subscription
PUT  /users/subscription
GET  /users/usage
```

**Events Published**:

- `user.registered`
- `user.subscription.changed`
- `user.usage.updated`

#### 8. **Integration Service** 🔗

**Domain**: External Integrations (Refined)
**Responsibilities**:

- OAuth providers (Google, Facebook, LinkedIn)
- MLS data synchronization
- Social media publishing
- Third-party API management

**API Endpoints**:

```
POST /integrations/oauth/{provider}/authorize
GET  /integrations/oauth/{provider}/callback
POST /integrations/mls/sync
POST /integrations/social/publish
```

**Events Published**:

- `integration.oauth.connected`
- `integration.mls.synced`
- `integration.social.published`

## Implementation Strategy

### Week 1-2: Foundation Setup

1. **Event Bus Enhancement**

   - Expand EventBridge rules for new service domains
   - Create event schemas for each service
   - Set up cross-service communication patterns

2. **Service Discovery**
   - Implement service registry
   - Create API Gateway routing
   - Set up health checks

### Week 3-4: Extract Studio & Reimagine Services

1. **Studio Service Extraction**

   - Move content generation logic from AI Service
   - Create dedicated Lambda functions for each content type
   - Implement content workflow management

2. **Reimagine Service Extraction**
   - Separate image processing from main AI service
   - Implement job queue for long-running image operations
   - Add progress tracking and notifications

### Week 5-6: Extract Brand Intelligence & Research Services

1. **Brand Intelligence Service**

   - Extract competitor analysis logic
   - Implement ranking tracking system
   - Create strategy generation workflows

2. **Research Service**
   - Move research agent functionality
   - Implement knowledge base management
   - Create report generation system

## Event-Driven Communication Patterns

### 1. **Content Creation Workflow**

```
User Request → Studio Service → Content Generated Event → Library Service (save) → Analytics Service (track)
```

### 2. **Brand Monitoring Workflow**

```
Scheduler → Brand Intelligence Service → Competitor Data Event → Notification Service → User Alert
```

### 3. **Research Workflow**

```
User Query → Research Service → External APIs → Research Completed Event → Library Service → User Notification
```

### 4. **Integration Workflow**

```
OAuth Success → Integration Service → Profile Updated Event → Brand Service → Audit Trigger Event
```

## Benefits of This Approach

### 🎯 **Business Alignment**

- Services map directly to your product hubs
- Teams can own specific business domains
- Easier to add new features within each hub

### ⚡ **Performance**

- Independent scaling per service
- Optimized resource allocation
- Reduced blast radius for issues

### 🔧 **Development**

- Parallel development across teams
- Independent deployment cycles
- Technology diversity where needed

### 💰 **Cost Optimization**

- Pay only for what you use per service
- Right-size resources per workload
- Better cost attribution

## Next Steps

1. **Choose First Service to Extract**: I recommend starting with **Studio Service** as it's:

   - Well-defined domain boundary
   - High user interaction
   - Clear input/output patterns
   - Good ROI for optimization

2. **Set Up Event Infrastructure**: Enhance your existing EventBridge setup

3. **Create Service Templates**: Standardize how new services are created

Would you like me to start implementing the **Studio Service extraction** as the first step?
