# Admin Platform Documentation

Welcome to the Bayon Coagent Admin Platform documentation. This comprehensive guide covers everything you need to know about using, integrating with, and extending the admin platform.

## Documentation Overview

### 📚 [Admin User Guide](./ADMIN_USER_GUIDE.md)

**For**: Admins and SuperAdmins using the platform

Complete guide to using all admin features including:

- Analytics dashboard and metrics
- User activity tracking and management
- Content moderation workflows
- Support ticket management
- System health monitoring
- Platform configuration and feature flags
- Billing management (SuperAdmin only)
- Bulk operations
- Audit logs (SuperAdmin only)
- Engagement reports
- API key management
- Announcements and user communication
- User feedback management
- Maintenance mode
- Troubleshooting guide
- Keyboard shortcuts

### 🔌 [API Documentation](./API_DOCUMENTATION.md)

**For**: Developers integrating with the admin platform

Complete API reference including:

- Authentication and authorization
- All server actions with examples
- Request/response schemas
- Error codes and handling
- Rate limiting
- Integration examples
- Best practices

### 🛠️ [Developer Documentation](./DEVELOPER_DOCUMENTATION.md)

**For**: Developers building and extending the platform

Technical implementation guide covering:

- Architecture overview
- Database schema and key patterns
- Service layer patterns
- Server actions implementation
- UI component patterns
- Authentication and authorization
- Error handling strategies
- Testing (unit, property-based, integration)
- Deployment procedures
- Extending features
- Performance optimization
- Security considerations

### 🧪 [Testing Documentation](./TESTING_SUMMARY.md)

**For**: QA Engineers and Developers testing the platform

Comprehensive testing guide including:

- [Testing Summary](./TESTING_SUMMARY.md) - Complete test coverage report
- [Testing Quick Start](./TESTING_QUICK_START.md) - Quick reference for running tests
- [Manual QA Checklist](../src/services/admin/__tests__/manual-qa-checklist.md) - 200+ test cases
- [Integration Tests](../src/services/admin/__tests__/integration.test.ts) - End-to-end workflows
- [Load Tests](../src/services/admin/__tests__/load-performance.test.ts) - Performance validation
- [Testing Guide](../src/services/admin/__tests__/README.md) - Detailed testing instructions

## Quick Start

### For Admins

1. Sign in to your Bayon Coagent account
2. Navigate to the Admin Hub in the main navigation
3. Explore the dashboard to see platform metrics
4. Read the [Admin User Guide](./ADMIN_USER_GUIDE.md) for detailed instructions

### For Developers

1. Review the [Architecture Overview](./DEVELOPER_DOCUMENTATION.md#architecture-overview)
2. Understand the [Database Schema](./DEVELOPER_DOCUMENTATION.md#database-schema)
3. Study the [Service Layer](./DEVELOPER_DOCUMENTATION.md#service-layer) patterns
4. Check the [API Documentation](./API_DOCUMENTATION.md) for integration
5. Run tests: `npm test`

## Key Features

### Analytics & Monitoring

- Real-time platform metrics
- User engagement tracking
- Feature usage statistics
- System health monitoring
- Error log aggregation

### User Management

- Activity tracking and categorization
- Detailed user timelines
- Bulk operations
- Data export capabilities

### Content & Support

- Content moderation queue
- Support ticket system
- User feedback management
- Announcement system

### Configuration & Control

- Feature flags with gradual rollout
- Platform settings management
- A/B testing framework
- Maintenance mode

### Security & Compliance

- Comprehensive audit logging
- Role-based access control
- API key management
- Billing management (SuperAdmin)

## Architecture Highlights

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js Server Actions, AWS Lambda
- **Database**: Amazon DynamoDB (single-table design)
- **Auth**: AWS Cognito with JWT tokens
- **Monitoring**: AWS CloudWatch, X-Ray

### Design Patterns

- **Layered Architecture**: UI → Server Actions → Services → Data
- **Single Table Design**: Efficient DynamoDB queries with GSIs
- **Server-First**: Business logic on server for security
- **Type Safety**: Full TypeScript with Zod validation
- **Property-Based Testing**: Correctness verification with fast-check

## Common Tasks

### Admin Tasks

**View Platform Analytics**

```
Navigate to /admin/analytics
Select date range
Review metrics and charts
```

**Moderate Content**

```
Navigate to /admin/content/moderation
Filter by status (pending)
Review content
Take action (approve/flag/hide)
```

**Manage Support Tickets**

```
Navigate to /admin/support
View open tickets
Respond to tickets
Update status
```

### Developer Tasks

**Add New Feature**

```typescript
1. Create service in src/services/admin/
2. Add server actions in src/features/admin/actions/
3. Create UI page in src/app/(app)/admin/
4. Add tests in src/services/admin/__tests__/
5. Update navigation
```

**Query Analytics Data**

```typescript
import { getPlatformAnalytics } from "@/features/admin/actions/admin-actions";

const result = await getPlatformAnalytics("2024-01-01", "2024-01-31");
if (result.success) {
  console.log(result.data);
}
```

**Create Audit Log**

```typescript
import { createAuditLog } from "@/services/admin/audit-log-service";

await createAuditLog({
  adminId: user.userId,
  actionType: "feature_flag_update",
  resourceType: "feature_flag",
  resourceId: "new-dashboard",
  beforeValue: { enabled: false },
  afterValue: { enabled: true },
});
```

## Testing

### Quick Start

```bash
# Start LocalStack
npm run localstack:start

# Initialize infrastructure
npm run localstack:init

# Run all admin tests
npm test -- src/services/admin/__tests__
```

### Test Suites

**Unit Tests** (Individual services):

```bash
npm test -- src/services/admin/__tests__/analytics-service.test.ts
npm test -- src/services/admin/__tests__/user-activity-service.test.ts
```

**Integration Tests** (End-to-end workflows):

```bash
npm test -- src/services/admin/__tests__/integration.test.ts
```

**Load Tests** (Performance validation):

```bash
npm test -- src/services/admin/__tests__/load-performance.test.ts
```

**Manual QA** (Comprehensive checklist):

```bash
cat src/services/admin/__tests__/manual-qa-checklist.md
```

### Test Coverage

- **200+ Manual QA Test Cases** covering all requirements
- **30+ Integration Tests** for critical workflows
- **25+ Performance Tests** with production-scale data
- **80%+ Code Coverage** across all services

See [Testing Documentation](./TESTING_SUMMARY.md) for complete details.

## Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### Deploy to AWS

```bash
npm run deploy:amplify
```

## Support

### For Admins

- Email: admin-support@bayoncoagent.com
- Slack: #admin-support
- In-app: Create support ticket

### For Developers

- Email: dev-support@bayoncoagent.com
- Slack: #dev-support
- Documentation: This repository

## Contributing

When contributing to the admin platform:

1. Follow the existing patterns and conventions
2. Write tests for new features
3. Update documentation
4. Create audit logs for admin actions
5. Ensure proper authorization checks
6. Follow security best practices

## Version History

- **v1.0** (2024-01-15): Initial release
  - Complete admin platform implementation
  - All core features operational
  - Comprehensive documentation

## License

Proprietary - Bayon Coagent Platform

---

_Last Updated: January 2024_  
_Documentation Version: 1.0_  
_Platform Version: 2.0_
