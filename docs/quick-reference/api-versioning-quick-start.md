# API Versioning Quick Start Guide

## TL;DR

All API endpoints now use `/v1` prefix. Include version in path or headers. Check response headers for deprecation warnings.

## Quick Examples

### Making Requests

```typescript
// Path-based (recommended)
fetch("https://api.example.com/v1/users");

// Header-based
fetch("https://api.example.com/users", {
  headers: { "API-Version": "v1" },
});

// Query parameter
fetch("https://api.example.com/users?version=v1");
```

### Creating Versioned Lambda Handler

```typescript
import { createVersionedHandler } from "@/aws/api-gateway/versioning-middleware";
import { createApiGatewayResponse } from "@/aws/api-gateway/config";

export const handler = createVersionedHandler({
  v1: async (event, version) => {
    const data = { message: "Hello from v1" };
    return createApiGatewayResponse(200, data, {}, version);
  },
});
```

### Checking Response Version

```typescript
const response = await fetch("https://api.example.com/v1/users");

// Check version
const version = response.headers.get("API-Version"); // "v1"

// Check if deprecated
const deprecated = response.headers.get("X-API-Deprecated"); // "true" or null

// Get sunset date
const sunset = response.headers.get("X-API-Sunset"); // "2025-06-01"
```

## Response Headers

Every response includes:

- `API-Version`: Current version (e.g., "v1")
- `X-API-Version-Number`: Semantic version (e.g., "1.0.0")
- `X-API-Release-Date`: Release date

Deprecated versions also include:

- `X-API-Deprecated`: "true"
- `X-API-Sunset`: End of support date
- `Warning`: Deprecation message

## Current Versions

| Version | Status | Released   | Sunset |
| ------- | ------ | ---------- | ------ |
| v1      | Active | 2024-01-01 | -      |

## Service Endpoints

All services use `/v1`:

```
Main:        https://{api-id}.execute-api.{region}.amazonaws.com/v1
AI:          https://{ai-api-id}.execute-api.{region}.amazonaws.com/v1
Integration: https://{int-api-id}.execute-api.{region}.amazonaws.com/v1
Background:  https://{bg-api-id}.execute-api.{region}.amazonaws.com/v1
Admin:       https://{admin-api-id}.execute-api.{region}.amazonaws.com/v1
```

## Common Patterns

### Version-Specific Logic

```typescript
import { getApiVersion, isVersionCompatible } from "@/aws/api-gateway/config";

const version = getApiVersion(event);

if (isVersionCompatible(version, "v2")) {
  // Use v2+ features
} else {
  // Use v1 features
}
```

### Handling Deprecated Versions

```typescript
export const handler = createVersionedHandler(
  {
    v1: handleV1,
    v2: handleV2,
  },
  {
    allowDeprecated: true,
    onDeprecatedVersion: (version, message) => {
      console.warn(`Deprecated: ${message}`);
      // Send metrics, notifications, etc.
    },
  }
);
```

### Custom Error for Unsupported Version

```typescript
export const handler = createVersionedHandler(
  {
    v1: handleV1,
  },
  {
    onUnsupportedVersion: (version) => {
      return createApiGatewayResponse(400, {
        message: `Version ${version} not supported`,
        supportedVersions: ["v1"],
        migrationGuide: "https://docs.example.com/migration",
      });
    },
  }
);
```

## Testing

```bash
# Test with curl
curl https://api.example.com/v1/users

# Test with header
curl -H "API-Version: v1" https://api.example.com/users

# Check headers
curl -I https://api.example.com/v1/users
```

## Migration Checklist

When migrating to versioned APIs:

- [ ] Update base URLs to include `/v1`
- [ ] Add version headers to requests
- [ ] Check response headers for deprecation warnings
- [ ] Update Lambda handlers to use versioning middleware
- [ ] Test all endpoints with new URLs
- [ ] Update documentation
- [ ] Monitor version usage in logs

## Need More Info?

See full documentation: [API Versioning Strategy](../api-versioning-strategy.md)

## Common Issues

### Issue: 404 Not Found

**Solution**: Make sure URL includes `/v1` prefix

### Issue: CORS Error

**Solution**: Version headers are now allowed. Update CORS config if using custom setup.

### Issue: Version Not Detected

**Solution**: Check priority order: Path > Header > Query. Use path-based for best results.

## Support

- Full docs: `docs/api-versioning-strategy.md`
- Example: `src/lambda/example-versioned-handler.ts`
- Middleware: `src/aws/api-gateway/versioning-middleware.ts`
- Config: `src/aws/api-gateway/config.ts`
