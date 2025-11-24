# API Versioning Strategy

## Overview

The Bayon CoAgent microservices architecture implements a comprehensive API versioning strategy to ensure backward compatibility, smooth migrations, and clear communication about API changes. This document outlines the versioning approach, best practices, and migration guidelines.

## Versioning Approach

### Version Format

All API versions follow the format: `v{major}` (e.g., `v1`, `v2`, `v3`)

- **Major version**: Incremented for breaking changes
- Version numbers are integers starting from 1
- Semantic versioning (e.g., `1.0.0`) is tracked internally but not exposed in URLs

### Current Version

- **Current Version**: `v1` (1.0.0)
- **Release Date**: 2024-01-01
- **Status**: Active
- **Supported Until**: TBD

## Version Specification Methods

Clients can specify the API version using three methods (in order of priority):

### 1. Path-Based Versioning (Recommended)

Include the version in the URL path:

```
GET https://api.example.com/v1/users
POST https://api.example.com/v1/content
```

**Advantages:**

- Clear and explicit
- Easy to test in browsers
- Cacheable
- Works with all HTTP clients

### 2. Header-Based Versioning

Include the version in request headers:

```http
GET /users HTTP/1.1
Host: api.example.com
API-Version: v1
```

Or using the alternative header:

```http
GET /users HTTP/1.1
Host: api.example.com
X-API-Version: v1
```

**Advantages:**

- Cleaner URLs
- Easier to change versions without URL changes
- Good for programmatic access

### 3. Query Parameter Versioning

Include the version as a query parameter:

```
GET https://api.example.com/users?version=v1
GET https://api.example.com/users?api_version=v1
```

**Advantages:**

- Simple to implement
- Easy to test
- No header manipulation needed

### Default Behavior

If no version is specified, the API defaults to `v1`.

## Service Endpoints

All microservices use the `/v1` stage for API versioning:

### Main Platform Service

```
https://{api-id}.execute-api.{region}.amazonaws.com/v1
```

### AI Processing Service

```
https://{ai-api-id}.execute-api.{region}.amazonaws.com/v1
```

### Integration Service

```
https://{integration-api-id}.execute-api.{region}.amazonaws.com/v1
```

### Background Processing Service

```
https://{background-api-id}.execute-api.{region}.amazonaws.com/v1
```

### Admin Service

```
https://{admin-api-id}.execute-api.{region}.amazonaws.com/v1
```

## Version Response Headers

All API responses include version information in headers:

```http
HTTP/1.1 200 OK
API-Version: v1
X-API-Version: v1
X-API-Version-Number: 1.0.0
X-API-Release-Date: 2024-01-01
```

### Deprecated Version Headers

When using a deprecated version, additional headers are included:

```http
HTTP/1.1 200 OK
API-Version: v1
X-API-Version: v1
X-API-Deprecated: true
X-API-Deprecation-Date: 2025-01-01
X-API-Sunset: 2025-06-01
Warning: 299 - "API version v1 is deprecated. Support ends on 2025-06-01"
```

## Version Lifecycle

### 1. Active

- Fully supported
- Receives bug fixes and security updates
- Recommended for new integrations

### 2. Deprecated

- Still functional but not recommended
- Receives critical security updates only
- Deprecation warnings in responses
- Sunset date announced

### 3. Sunset

- No longer supported
- Returns 410 Gone status
- Clients must migrate to newer version

## Breaking Changes

Breaking changes require a new major version. Examples include:

- Removing endpoints or fields
- Changing response structure
- Modifying authentication requirements
- Changing error codes or formats
- Altering rate limits significantly
- Removing support for HTTP methods

## Non-Breaking Changes

Non-breaking changes can be made within the same version:

- Adding new endpoints
- Adding optional fields to requests
- Adding new fields to responses
- Adding new error codes
- Improving performance
- Bug fixes

## Migration Guidelines

### For API Consumers

1. **Always specify version explicitly**

   ```typescript
   // Good
   fetch("https://api.example.com/v1/users");

   // Better - with header
   fetch("https://api.example.com/v1/users", {
     headers: { "API-Version": "v1" },
   });
   ```

2. **Monitor deprecation headers**

   ```typescript
   const response = await fetch("https://api.example.com/v1/users");

   if (response.headers.get("X-API-Deprecated") === "true") {
     const sunset = response.headers.get("X-API-Sunset");
     console.warn(`API version deprecated. Migrate before ${sunset}`);
   }
   ```

3. **Test against new versions early**

   - Use staging environments
   - Run parallel tests
   - Validate response formats

4. **Plan migration timeline**
   - Review deprecation notices
   - Update code before sunset date
   - Test thoroughly in staging

### For API Providers

1. **Announce changes early**

   - Minimum 6 months notice for deprecation
   - Clear migration guides
   - Example code for new version

2. **Support multiple versions**

   - Maintain at least 2 versions simultaneously
   - Provide migration tools
   - Offer support during transition

3. **Document all changes**
   - Changelog for each version
   - Breaking vs non-breaking changes
   - Migration examples

## Version Detection in Code

### Client-Side (TypeScript)

```typescript
import { getApiVersion, validateApiVersion } from "@/aws/api-gateway/config";

// Get version from request
const version = getApiVersion(event);

// Validate version
const validation = validateApiVersion(version);

if (!validation.valid) {
  return createApiGatewayResponse(400, {
    message: validation.message,
  });
}

if (validation.deprecated) {
  console.warn(validation.message);
}
```

### Lambda Handler Example

```typescript
import {
  ApiGatewayRequest,
  createApiGatewayResponse,
  getApiVersion,
  validateApiVersion,
} from "@/aws/api-gateway/config";

export const handler = async (event: ApiGatewayRequest) => {
  // Extract and validate version
  const version = getApiVersion(event);
  const validation = validateApiVersion(version);

  if (!validation.valid) {
    return createApiGatewayResponse(
      400,
      { message: validation.message },
      {},
      version
    );
  }

  // Handle request based on version
  switch (version) {
    case "v1":
      return handleV1Request(event);
    case "v2":
      return handleV2Request(event);
    default:
      return createApiGatewayResponse(
        400,
        { message: "Unsupported API version" },
        {},
        version
      );
  }
};
```

## Testing API Versions

### Using cURL

```bash
# Path-based versioning
curl https://api.example.com/v1/users

# Header-based versioning
curl -H "API-Version: v1" https://api.example.com/users

# Query parameter versioning
curl https://api.example.com/users?version=v1
```

### Using Postman

1. Set the base URL with version: `https://api.example.com/v1`
2. Or add header: `API-Version: v1`
3. Check response headers for version information

### Automated Testing

```typescript
describe("API Versioning", () => {
  it("should accept path-based version", async () => {
    const response = await fetch("https://api.example.com/v1/users");
    expect(response.headers.get("API-Version")).toBe("v1");
  });

  it("should accept header-based version", async () => {
    const response = await fetch("https://api.example.com/users", {
      headers: { "API-Version": "v1" },
    });
    expect(response.headers.get("API-Version")).toBe("v1");
  });

  it("should reject unsupported version", async () => {
    const response = await fetch("https://api.example.com/v99/users");
    expect(response.status).toBe(400);
  });
});
```

## Version Compatibility Matrix

| Version | Status  | Released   | Deprecated | Sunset | Features                           |
| ------- | ------- | ---------- | ---------- | ------ | ---------------------------------- |
| v1      | Active  | 2024-01-01 | -          | -      | Initial microservices architecture |
| v2      | Planned | TBD        | -          | -      | Enhanced features (future)         |

## Best Practices

### For Clients

1. **Always specify version explicitly** - Don't rely on defaults
2. **Monitor deprecation warnings** - Plan migrations early
3. **Use semantic versioning** - Track internal version numbers
4. **Test thoroughly** - Validate against new versions before migration
5. **Handle errors gracefully** - Check for version-related errors

### For Services

1. **Maintain backward compatibility** - Within major versions
2. **Document all changes** - Clear changelog and migration guides
3. **Provide deprecation warnings** - Minimum 6 months notice
4. **Support multiple versions** - At least 2 concurrent versions
5. **Version all responses** - Include version headers

## Error Handling

### Unsupported Version

```json
{
  "error": {
    "code": "UNSUPPORTED_VERSION",
    "message": "Unsupported API version: v99. Supported versions: v1",
    "traceId": "trace-123456"
  }
}
```

### Deprecated Version

```json
{
  "success": true,
  "data": { ... },
  "traceId": "trace-123456"
}
```

Response headers:

```
X-API-Deprecated: true
X-API-Sunset: 2025-06-01
Warning: 299 - "API version v1 is deprecated. Support ends on 2025-06-01"
```

## Future Considerations

### Planned Features for v2

- Enhanced authentication mechanisms
- Improved rate limiting
- GraphQL support
- WebSocket connections
- Batch operations

### Migration Timeline

When v2 is released:

- v1 will be marked as deprecated
- 6-month migration period
- v1 sunset after migration period
- Comprehensive migration guide provided

## Resources

- [API Gateway Configuration](../src/aws/api-gateway/config.ts)
- [Infrastructure Setup](../infrastructure/lib/api-gateway-stack.ts)
- [SAM Template](../template.yaml)
- [Client Implementation](../src/aws/api-gateway/client.ts)

## Support

For questions about API versioning:

- Review this documentation
- Check the changelog
- Contact the platform team
- Review migration guides

## Changelog

### v1.0.0 (2024-01-01)

- Initial release
- Microservices architecture
- AI Processing Service
- Integration Service
- Background Processing Service
- Admin Service
- Distributed tracing
- Health checks
- Error handling framework
