# OAuth Callback Routes

OAuth 2.0 callback routes for social media platform authentication.

## Overview

This directory contains API routes that handle OAuth callbacks from Facebook, Instagram, and LinkedIn. These routes are called by the OAuth providers after the user authorizes the application.

## Routes

### Facebook Callback

**Path:** `/api/oauth/facebook/callback`

**File:** `facebook/callback/route.ts`

**Requirements:** 6.1, 6.4

Handles Facebook OAuth callback and retrieves user's Facebook Pages for posting.

**Query Parameters:**

- `code` - Authorization code from Facebook
- `state` - CSRF protection token
- `error` - Error code (if authorization failed)
- `error_description` - Error description

**Success Redirect:** `/settings?success=facebook_connected&platform=facebook&pages={count}`

**Error Redirect:** `/settings?error=facebook_oauth_failed&message={error}`

### Instagram Callback

**Path:** `/api/oauth/instagram/callback`

**File:** `instagram/callback/route.ts`

**Requirements:** 6.1, 6.5

Handles Instagram OAuth callback (via Facebook) and verifies Instagram Business Account.

**Query Parameters:**

- `code` - Authorization code from Instagram/Facebook
- `state` - CSRF protection token
- `error` - Error code (if authorization failed)
- `error_description` - Error description

**Success Redirect:** `/settings?success=instagram_connected&platform=instagram&business_account={true|false}`

**Error Redirect:** `/settings?error=instagram_oauth_failed&message={error}`

**Note:** If no business account is found, a warning parameter is added: `warning=no_business_account`

### LinkedIn Callback

**Path:** `/api/oauth/linkedin/callback`

**File:** `linkedin/callback/route.ts`

**Requirements:** 6.1

Handles LinkedIn OAuth callback.

**Query Parameters:**

- `code` - Authorization code from LinkedIn
- `state` - CSRF protection token
- `error` - Error code (if authorization failed)
- `error_description` - Error description

**Success Redirect:** `/settings?success=linkedin_connected&platform=linkedin&username={username}`

**Error Redirect:** `/settings?error=linkedin_oauth_failed&message={error}`

## OAuth Flow

1. **Initiation:**

   - User clicks "Connect" button in Settings
   - Server action `initiateOAuthConnectionAction` is called
   - Authorization URL is generated with state parameter
   - User is redirected to OAuth provider

2. **Authorization:**

   - User authorizes the application on the provider's site
   - Provider redirects back to callback route with code and state

3. **Callback:**

   - Callback route validates state parameter
   - Exchanges authorization code for access token
   - Retrieves user information from provider
   - Stores connection in DynamoDB
   - Redirects to Settings with success/error message

4. **Post-Connection:**
   - Settings page displays success toast
   - Connection status is updated
   - Platform-specific data is loaded (pages, business accounts)

## Error Handling

All callback routes handle the following error scenarios:

1. **OAuth Provider Errors:**

   - User denies authorization
   - Invalid client credentials
   - Scope not granted

2. **Validation Errors:**

   - Missing code or state parameter
   - Invalid or expired state
   - Platform mismatch

3. **API Errors:**
   - Token exchange failure
   - User info retrieval failure
   - Database storage failure

Errors are logged to console and user is redirected to Settings with error message.

## Security

### CSRF Protection

State parameter is used for CSRF protection:

- Generated as UUID on initiation
- Stored temporarily (10 minutes)
- Validated on callback
- Removed after use

### Token Storage

Access and refresh tokens are:

- Encrypted before storage (TODO: implement AWS KMS)
- Stored in DynamoDB with user isolation
- Automatically refreshed when expired

### HTTPS Only

All OAuth flows require HTTPS in production. The redirect URIs must match exactly with the OAuth provider configuration.

## Environment Variables

Required environment variables:

```env
# Facebook & Instagram
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# App URL (must match OAuth provider redirect URI configuration)
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

## OAuth Provider Configuration

### Facebook App Configuration

1. Create Facebook App at https://developers.facebook.com
2. Add Facebook Login product
3. Configure OAuth Redirect URIs:
   - `https://your-app-url.com/api/oauth/facebook/callback`
   - `https://your-app-url.com/api/oauth/instagram/callback`
4. Request permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
   - `instagram_basic`
   - `instagram_content_publish`

### LinkedIn App Configuration

1. Create LinkedIn App at https://www.linkedin.com/developers
2. Add Sign In with LinkedIn product
3. Configure OAuth Redirect URI:
   - `https://your-app-url.com/api/oauth/linkedin/callback`
4. Request permissions:
   - `w_member_social`
   - `r_basicprofile`

## Testing

### Local Development

For local testing, use ngrok or similar tool to expose localhost:

```bash
ngrok http 3000
```

Update `NEXT_PUBLIC_APP_URL` to ngrok URL and configure OAuth providers with ngrok callback URLs.

### Manual Testing

1. Navigate to Settings > Integrations
2. Click "Connect" for a platform
3. Authorize on provider's site
4. Verify redirect back to Settings
5. Check connection status and metadata

## Troubleshooting

### "Invalid or expired OAuth state"

- State parameter expired (>10 minutes)
- State parameter mismatch
- Solution: Retry connection

### "Platform mismatch in OAuth callback"

- State was generated for different platform
- Solution: Clear browser cache and retry

### "Token exchange failed"

- Invalid client credentials
- Redirect URI mismatch
- Solution: Verify environment variables and OAuth provider configuration

### "Failed to get user info"

- Invalid access token
- Insufficient permissions
- Solution: Check OAuth scopes and retry

## Related Files

- `/src/integrations/oauth/connection-manager.ts` - OAuth connection manager
- `/src/app/social-oauth-actions.ts` - Server actions for OAuth
- `/src/components/social-media-connections.tsx` - UI component
- `/src/integrations/social/types.ts` - TypeScript types
- `/src/integrations/social/constants.ts` - Platform constants

## Future Enhancements

- [ ] Implement AWS KMS encryption for tokens
- [ ] Add webhook support for token revocation
- [ ] Support for additional platforms (Twitter, TikTok)
- [ ] Automatic token refresh before expiration
- [ ] Connection health monitoring
- [ ] Audit logging for OAuth events
