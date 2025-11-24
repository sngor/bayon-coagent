# Cognito Session Quick Start

## Overview

JWT tokens from Cognito work seamlessly across all API Gateway services. Users authenticate once and access all services without re-authentication.

## Quick Reference

### Client-Side Authentication

```typescript
import { useAuth } from "@/aws/auth/auth-provider";

// Get user and session
const { user, session, signIn, signOut } = useAuth();

// Make authenticated API call
const response = await fetch(`${serviceUrl}/endpoint`, {
  headers: {
    Authorization: `Bearer ${session.accessToken}`,
  },
});
```

### Server-Side (Lambda)

```typescript
// User context from authorizer
export async function handler(event: APIGatewayProxyEvent) {
  const userId = event.requestContext.authorizer?.userId;
  const email = event.requestContext.authorizer?.email;
  // Use user info...
}
```

### Service Endpoints

```typescript
import { getServiceEndpoints } from "@/aws/api-gateway/config";

const endpoints = getServiceEndpoints();
// endpoints.ai - AI Processing Service
// endpoints.integration - Integration Service
// endpoints.background - Background Service
// endpoints.admin - Admin Service
```

## Token Lifecycle

1. **Sign In** → Get JWT tokens (access, ID, refresh)
2. **Store** → Client stores in localStorage
3. **Use** → Include in Authorization header
4. **Refresh** → Auto-refresh before expiration (5 min buffer)
5. **Validate** → Lambda authorizer validates on each request

## Testing

```bash
# Unit tests
npm test -- cognito-authorizer.test.ts

# Integration tests
export TEST_USER_EMAIL="test@example.com"
export TEST_USER_PASSWORD="TestPassword123!"
tsx scripts/test-cognito-session-across-services.ts
```

## Troubleshooting

| Issue                | Solution                                    |
| -------------------- | ------------------------------------------- |
| Invalid token        | Check expiration, verify User Pool ID       |
| Authorization denied | Check CloudWatch logs, verify permissions   |
| High latency         | Check cache TTL (300s), monitor Cognito API |
| Refresh fails        | Check refresh token validity (30 days)      |

## Key Files

- `src/lambda/cognito-authorizer.ts` - Authorizer implementation
- `src/aws/auth/cognito-client.ts` - Cognito client
- `template.yaml` - Authorizer configuration
- `src/__tests__/cognito-authorizer.test.ts` - Tests

## Configuration

```bash
# Required environment variables
COGNITO_USER_POOL_ID=us-east-1_xxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AI_SERVICE_API_ID=xxxxxxxxxx
INTEGRATION_SERVICE_API_ID=xxxxxxxxxx
BACKGROUND_SERVICE_API_ID=xxxxxxxxxx
ADMIN_SERVICE_API_ID=xxxxxxxxxx
```

## Monitoring

```bash
# View authorizer logs
aws logs tail /aws/lambda/bayon-coagent-cognito-authorizer-development --follow

# Check metrics
- Invocations
- Errors
- Duration
- Throttles
```

## Security

- ✅ Tokens validated on every request
- ✅ Signature verification prevents tampering
- ✅ Expiration checks prevent reuse
- ✅ Results cached for 5 minutes
- ✅ User context propagated to Lambda functions

## Benefits

- **SSO** - Authenticate once, access all services
- **Performance** - 5-minute cache reduces latency
- **Security** - Strong JWT validation
- **Maintainability** - Centralized authentication logic

## Next Steps

See full documentation:

- `.kiro/specs/microservices-architecture/COGNITO_SESSION_IMPLEMENTATION_GUIDE.md`
- `.kiro/specs/microservices-architecture/TASK_9.3_COGNITO_SESSION_SUMMARY.md`
