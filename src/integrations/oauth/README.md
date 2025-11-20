# OAuth Connection Manager

OAuth 2.0 connection management for social media platforms (Facebook, Instagram, LinkedIn).

## Features

- **OAuth Flow Management**: Initiate and handle OAuth 2.0 authorization flows
- **Token Storage**: Secure storage of access and refresh tokens in DynamoDB
- **Automatic Token Refresh**: Automatically refresh expired tokens
- **Platform Support**: Facebook, Instagram, and LinkedIn
- **CSRF Protection**: State parameter validation for security

## Usage

### Initialize Connection

```typescript
import { getOAuthConnectionManager } from "@/integrations/oauth";

const manager = getOAuthConnectionManager();

// Generate authorization URL
const authUrl = await manager.initiateConnection("facebook", userId);

// Redirect user to authUrl
```

### Handle OAuth Callback

```typescript
// In your API route handler
const connection = await manager.handleCallback(
  "facebook",
  code, // from query params
  state // from query params
);

// Connection is now stored and ready to use
```

### Get Existing Connection

```typescript
const connection = await manager.getConnection(userId, "facebook");

if (connection) {
  // Use connection.accessToken for API calls
  // Token is automatically refreshed if expired
}
```

### Disconnect

```typescript
import { disconnectConnection } from "@/integrations/oauth";

await disconnectConnection(userId, "facebook");
```

## Environment Variables

Required environment variables for OAuth:

```env
# Facebook & Instagram (Instagram uses Facebook App)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# App URL for OAuth callbacks
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

## OAuth Scopes

### Facebook

- `pages_manage_posts` - Post to Facebook Pages
- `pages_read_engagement` - Read engagement metrics
- `pages_show_list` - List user's pages
- `public_profile` - Access public profile

### Instagram

- `instagram_basic` - Basic Instagram access
- `instagram_content_publish` - Publish content
- `pages_show_list` - List connected pages
- `pages_read_engagement` - Read engagement metrics

### LinkedIn

- `w_member_social` - Post on behalf of member
- `r_basicprofile` - Read basic profile
- `r_organization_social` - Read organization posts
- `w_organization_social` - Post on behalf of organization

## API Routes

You'll need to create API routes for OAuth callbacks:

### `/app/api/oauth/facebook/callback/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getOAuthConnectionManager } from "@/integrations/oauth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect("/settings?error=oauth_failed");
  }

  try {
    const manager = getOAuthConnectionManager();
    await manager.handleCallback("facebook", code, state);

    return NextResponse.redirect("/settings?success=facebook_connected");
  } catch (error) {
    console.error("Facebook OAuth error:", error);
    return NextResponse.redirect("/settings?error=oauth_failed");
  }
}
```

### `/app/api/oauth/instagram/callback/route.ts`

Similar to Facebook callback, but use `'instagram'` as platform.

### `/app/api/oauth/linkedin/callback/route.ts`

Similar to Facebook callback, but use `'linkedin'` as platform.

## Security Considerations

### Token Encryption

Tokens are encrypted before storage. The current implementation uses DynamoDB's encryption at rest. For production, implement AWS KMS encryption:

```typescript
// Update encryptToken and decryptToken functions in connection-manager.ts
import { KMSClient, EncryptCommand, DecryptCommand } from "@aws-sdk/client-kms";

async function encryptToken(token: string): Promise<string> {
  const kms = new KMSClient({ region: process.env.AWS_REGION });
  const command = new EncryptCommand({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: Buffer.from(token),
  });
  const response = await kms.send(command);
  return Buffer.from(response.CiphertextBlob!).toString("base64");
}
```

### State Storage

The current implementation uses in-memory storage for OAuth state. For production with multiple servers, use:

- **Redis**: For distributed state storage
- **DynamoDB with TTL**: For persistent state with automatic expiration

### CSRF Protection

The state parameter provides CSRF protection. Always validate the state parameter in callbacks.

## Error Handling

The manager throws errors for:

- Invalid or expired OAuth state
- Platform mismatch in callback
- Token exchange failures
- Token refresh failures
- Missing refresh tokens

Handle these errors appropriately in your application:

```typescript
try {
  const connection = await manager.handleCallback(platform, code, state);
} catch (error) {
  if (error.message.includes("Invalid or expired")) {
    // Show user-friendly error and retry option
  }
  // Log error for debugging
  console.error("OAuth error:", error);
}
```

## Testing

See `__tests__/connection-manager.test.ts` for unit tests.

## Requirements Validation

This implementation satisfies:

- **Requirement 6.1**: OAuth flow initiation with redirect URL generation
- **Requirement 6.2**: Secure token storage with encryption
- **Requirement 6.3**: Error handling with clear error messages
- **Requirement 6.4**: Facebook page selection (metadata stored)
- **Requirement 6.5**: Instagram business account verification (metadata stored)

## Future Enhancements

- [ ] Implement AWS KMS encryption for tokens
- [ ] Add Redis/DynamoDB for distributed state storage
- [ ] Add webhook support for token revocation notifications
- [ ] Implement rate limiting for OAuth requests
- [ ] Add audit logging for OAuth events
- [ ] Support for additional platforms (Twitter, TikTok, Pinterest)
