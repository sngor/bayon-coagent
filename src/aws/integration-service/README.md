# Integration Service Client

This module provides a client for interacting with the Integration Service Lambda functions via API Gateway.

## Overview

The Integration Service handles:

- OAuth flows for Google Business Profile
- OAuth flows for social media platforms (Facebook, Instagram, LinkedIn, Twitter)
- MLS data synchronization

## Features

- **AWS IAM Authentication**: Requests are signed with AWS Signature V4
- **Automatic Fallback**: Falls back to direct implementation if service is unavailable
- **Circuit Breaker Protection**: External API calls are protected with circuit breakers
- **Secure Credential Management**: OAuth credentials stored in AWS Secrets Manager

## Usage

### OAuth Integration

#### Google Business Profile

```typescript
import { oauthClient } from "@/aws/integration-service/client";

// Initiate OAuth flow
const { authUrl, state } = await oauthClient.initiateGoogleOAuth(userId);

// Redirect user to authUrl
window.location.href = authUrl;
```

#### Social Media Platforms

```typescript
import { oauthClient } from "@/aws/integration-service/client";

// Initiate Facebook OAuth
const { authUrl, state } = await oauthClient.initiateSocialOAuth(
  "facebook",
  userId
);

// Initiate Instagram OAuth
const { authUrl, state } = await oauthClient.initiateSocialOAuth(
  "instagram",
  userId
);

// Initiate LinkedIn OAuth
const { authUrl, state } = await oauthClient.initiateSocialOAuth(
  "linkedin",
  userId
);

// Initiate Twitter OAuth
const { authUrl, state } = await oauthClient.initiateSocialOAuth(
  "twitter",
  userId
);
```

### MLS Integration

#### Sync MLS Data

```typescript
import { mlsClient } from "@/aws/integration-service/client";

// Trigger full sync
const result = await mlsClient.syncMLSData(userId, "mlsgrid", agentId, "full");

console.log(`Sync ID: ${result.syncId}`);
console.log(`Total listings: ${result.totalListings}`);
console.log(`Synced: ${result.syncedListings}`);
console.log(`Failed: ${result.failedListings}`);
```

#### Check Sync Status

```typescript
import { mlsClient } from "@/aws/integration-service/client";

const status = await mlsClient.getSyncStatus(userId, syncId);

console.log(`Status: ${status.status}`);
console.log(`Progress: ${status.syncedListings}/${status.totalListings}`);
```

### Fallback Wrapper

The fallback wrapper automatically falls back to direct implementation if the Integration Service is unavailable:

```typescript
import { initiateOAuthWithFallback } from "@/aws/integration-service/fallback-wrapper";

// Automatically tries Integration Service first, falls back to direct implementation
const { authUrl, state } = await initiateOAuthWithFallback("facebook", userId);
```

### Health Check

```typescript
import { checkIntegrationServiceHealth } from "@/aws/integration-service/fallback-wrapper";

const isHealthy = await checkIntegrationServiceHealth();

if (!isHealthy) {
  console.warn("Integration Service is unavailable, using fallback");
}
```

## Server Actions

The Integration Service is integrated into existing server actions with automatic fallback:

### Social OAuth Actions

```typescript
import { initiateOAuthConnectionAction } from "@/app/social-oauth-actions";

// Automatically uses Integration Service with fallback
const result = await initiateOAuthConnectionAction(userId, "facebook");

if (result.success) {
  window.location.href = result.data.authUrl;
}
```

### MLS Actions

```typescript
import { importMLSListings } from "@/app/mls-actions";

// Uses direct implementation (Integration Service integration pending)
const result = await importMLSListings(connectionId);
```

## Environment Variables

```bash
# Integration Service API URL
INTEGRATION_SERVICE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/v1
NEXT_PUBLIC_INTEGRATION_SERVICE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/v1

# AWS Region
AWS_REGION=us-east-1
```

## API Endpoints

### OAuth Endpoints

- `GET /oauth/google/authorize?userId={userId}` - Initiate Google OAuth
- `GET /oauth/google/callback?code={code}&state={state}` - Google OAuth callback
- `GET /oauth/{platform}/authorize?userId={userId}` - Initiate social OAuth
- `GET /oauth/{platform}/callback?code={code}&state={state}` - Social OAuth callback

### MLS Endpoints

- `POST /mls/sync` - Trigger MLS data sync
- `GET /mls/status/{syncId}?userId={userId}` - Get sync status

## Error Handling

All client methods throw errors that should be caught and handled:

```typescript
try {
  const result = await oauthClient.initiateGoogleOAuth(userId);
  // Handle success
} catch (error) {
  console.error("OAuth initiation failed:", error);
  // Handle error - show user-friendly message
}
```

## Circuit Breaker Protection

External API calls in the Integration Service are protected with circuit breakers:

- **Google OAuth**: 3 failures, 30s recovery
- **Social OAuth**: 3 failures, 30s recovery
- **MLS APIs**: 5 failures, 60s recovery

When a circuit is open, requests fail fast without calling the external service.

## Security

- **IAM Authentication**: All requests to the Integration Service API are signed with AWS Signature V4
- **Secrets Manager**: OAuth credentials are stored securely in AWS Secrets Manager
- **Automatic Rotation**: Secrets are automatically rotated every 90 days
- **CSRF Protection**: OAuth state parameters include timestamps and nonces

## Monitoring

Integration Service metrics are available in CloudWatch:

- Lambda invocations and errors
- API Gateway requests and latency
- Circuit breaker state changes
- OAuth success/failure rates
- MLS sync statistics

## Troubleshooting

### Integration Service Unavailable

If the Integration Service is unavailable, the fallback wrapper will automatically use the direct implementation. Check CloudWatch Logs for errors.

### OAuth Callback Failures

- Verify redirect URIs match in OAuth provider console and Secrets Manager
- Check that state parameter is valid and not expired (10 minute timeout)
- Ensure OAuth credentials in Secrets Manager are correct

### MLS Sync Failures

- Verify MLS API credentials in Secrets Manager
- Check MLS API rate limits
- Review CloudWatch Logs for specific error messages

## Related Documentation

- [Circuit Breaker Pattern](../../lib/circuit-breaker.md)
- [AWS Secrets Manager Integration](../secrets-manager/README.md)
- [OAuth Integration Guide](../../../docs/social-media-oauth-setup.md)
- [Microservices Architecture Design](../../../.kiro/specs/microservices-architecture/design.md)
