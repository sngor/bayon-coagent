# API Key Service - Quick Reference

## Overview

The API Key Service provides secure API key management for third-party integrations with comprehensive security features including hashing, rate limiting, and audit logging.

## Quick Start

```typescript
import { apiKeyService } from '@/services/admin/api-key-service';
```

## Core Methods

### Generate API Key

```typescript
const { keyId, plainKey, apiKey } = await apiKeyService.generateAPIKey(
  "Integration Name",
  ["read:listings", "write:content"], // permissions
  adminUserId
);

// ⚠️ Store plainKey securely - it's only shown once!
```

### Validate API Key

```typescript
const apiKey = await apiKeyService.validateAPIKey(providedKey);
if (apiKey?.status === 'active') {
  // Key is valid - proceed with request
  console.log('Permissions:', apiKey.permissions);
}
```

### Get Usage Metrics

```typescript
const metrics = await apiKeyService.getAPIUsage(keyId);
console.log('Total requests:', metrics?.totalRequests);
console.log('Rate limit remaining:', metrics?.rateLimitStatus.remaining);
```

### Revoke API Key

```typescript
await apiKeyService.revokeAPIKey(keyId, adminUserId);
```

### List API Keys

```typescript
const { keys, lastKey } = await apiKeyService.getAllAPIKeys({
  status: 'active',
  limit: 50
});
```

## Security Features

- **🔐 Hash Storage**: Keys stored as SHA-256 hashes
- **⚡ Rate Limiting**: 1000 requests/hour default
- **📊 Usage Tracking**: Automatic request counting
- **📝 Audit Logging**: All operations logged
- **🔑 One-time Display**: Plain key shown only during generation

## Rate Limiting

Default limits:
- **1000 requests per hour** per API key
- Violations logged as `RateLimitAlert` entities
- Configurable per key based on permissions

## Permissions

Common permission patterns:
- `read:listings` - Read listing data
- `write:content` - Create/update content
- `admin:users` - User management
- `analytics:read` - Access analytics data

## Error Handling

```typescript
try {
  const apiKey = await apiKeyService.validateAPIKey(key);
  if (!apiKey) {
    throw new Error('Invalid API key');
  }
  if (apiKey.status === 'revoked') {
    throw new Error('API key has been revoked');
  }
} catch (error) {
  console.error('API key validation failed:', error.message);
}
```

## Data Patterns

### API Key Entity
```
PK: APIKEY#<keyId>
SK: METADATA
GSI1PK: APIKEYS#ACTIVE (or REVOKED)
GSI1SK: <createdAt>
```

### Usage Analytics
```
PK: APIKEY#<keyId>#USAGE
SK: EVENT#<timestamp>
```

### Rate Limit Alerts
```
PK: ALERT#<alertId>
SK: METADATA
GSI1PK: ALERTS#RATE_LIMIT
GSI1SK: <timestamp>
```

## Best Practices

1. **Store Keys Securely**: Never log or expose plain API keys
2. **Monitor Usage**: Regularly check usage metrics and alerts
3. **Rotate Keys**: Implement key rotation for long-lived integrations
4. **Least Privilege**: Grant minimal required permissions
5. **Audit Regularly**: Review API key usage and revoke unused keys

## Integration Example

```typescript
// Middleware for API key authentication
export async function authenticateAPIKey(req: Request) {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey) {
    throw new Error('API key required');
  }
  
  const keyData = await apiKeyService.validateAPIKey(apiKey);
  
  if (!keyData || keyData.status !== 'active') {
    throw new Error('Invalid or revoked API key');
  }
  
  // Check permissions for the requested operation
  const requiredPermission = getRequiredPermission(req.path, req.method);
  if (!keyData.permissions.includes(requiredPermission)) {
    throw new Error('Insufficient permissions');
  }
  
  return keyData;
}
```

## Related Documentation

- [Admin Platform Schema](../admin/README.md)
- [API Key Service Improvements](../admin/api-key-service-improvements.md)
- [Security Best Practices](../SECURITY.md)