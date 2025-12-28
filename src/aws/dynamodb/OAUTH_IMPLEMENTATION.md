# OAuth Token Integration with DynamoDB

## Overview

This document describes the implementation of OAuth token storage and management using DynamoDB, replacing the previous Firebase Firestore implementation.

## Implementation Summary

### Files Created/Modified

#### New Files

1. **src/aws/dynamodb/oauth-tokens.ts** - Core OAuth token management module

   - `storeOAuthTokens()` - Store OAuth tokens in DynamoDB
   - `getOAuthTokens()` - Retrieve OAuth tokens from DynamoDB
   - `updateOAuthTokens()` - Update existing OAuth tokens
   - `deleteOAuthTokens()` - Delete OAuth tokens
   - `areTokensExpired()` - Check if tokens are expired
   - `refreshOAuthTokens()` - Refresh expired tokens using refresh token
   - `getValidOAuthTokens()` - Get valid tokens, refreshing if necessary

2. **src/app/oauth-actions.ts** - Server actions for OAuth token operations

   - `getOAuthTokensAction()` - Server action to get tokens
   - `getValidOAuthTokensAction()` - Server action to get valid tokens
   - `refreshOAuthTokensAction()` - Server action to refresh tokens

3. **src/aws/dynamodb/oauth-tokens.test.ts** - Unit tests for OAuth token functionality

#### Modified Files

1. **src/aws/dynamodb/index.ts** - Added exports for OAuth token functions
2. **src/aws/dynamodb/keys.ts** - Already had `getOAuthTokenKeys()` function
3. **src/components/google-oauth-callback.tsx** - Updated to use DynamoDB instead of Firestore
4. **src/app/(app)/integrations/page.tsx** - Updated to retrieve tokens from DynamoDB
5. **src/app/(app)/brand-audit/page.tsx** - Updated to retrieve tokens from DynamoDB

## Data Model

### DynamoDB Key Pattern

OAuth tokens are stored using the following key pattern:

```
PK: OAUTH#<userId>
SK: <provider> (e.g., GOOGLE_BUSINESS)
EntityType: OAuthToken
```

### Token Data Structure

```typescript
interface OAuthTokenData {
  agentProfileId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number; // Unix timestamp in milliseconds (calculated from expiresIn)
  provider?: string;
}
```

**Note**: The `expiryDate` is calculated by adding the `expiresIn` value (in seconds) from the OAuth response to the current timestamp, converted to milliseconds: `Date.now() + (expiresIn * 1000)`.

### Example DynamoDB Item

```json
{
  "PK": "OAUTH#user123",
  "SK": "GOOGLE_BUSINESS",
  "EntityType": "OAuthToken",
  "Data": {
    "agentProfileId": "user123",
    "accessToken": "ya29.a0AfH6SMB...",
    "refreshToken": "1//0gHZqN9...",
    "expiryDate": 1700000000000,
    "provider": "GOOGLE_BUSINESS"
  },
  "CreatedAt": 1699996400000,
  "UpdatedAt": 1699996400000
}
```

## OAuth Flow

### 1. Initial Authorization

1. User clicks "Connect" on integrations page
2. User is redirected to Google OAuth consent screen
3. User grants permissions
4. Google redirects back to callback URL with authorization code

### 2. Token Exchange

1. Callback page receives authorization code
2. `exchangeGoogleTokenAction` is called with the code
3. Code is exchanged for access and refresh tokens via Google's token endpoint
4. Token expiry is calculated: `Date.now() + (expiresIn * 1000)` (converting seconds to milliseconds)
5. Tokens are stored in DynamoDB using `storeOAuthTokens()`

### 3. Token Retrieval

When the application needs to use OAuth tokens:

```typescript
// Get tokens (may be expired)
const tokens = await getOAuthTokens(userId, "GOOGLE_BUSINESS");

// Get valid tokens (automatically refreshes if expired)
const validTokens = await getValidOAuthTokens(userId, "GOOGLE_BUSINESS");
```

### 4. Token Refresh

Tokens are automatically refreshed when:

- They are expired
- They will expire within 5 minutes (buffer time)

The refresh process:

1. Check if tokens are expired using `areTokensExpired()`
2. If expired, call `refreshOAuthTokens()`
3. Exchange refresh token for new access token
4. Update tokens in DynamoDB
5. Return new tokens

## Migration from Firestore

### Before (Firestore)

```typescript
// Store tokens
const gbpRef = doc(firestore, `googleBusinessProfiles/${userId}`);
await setDoc(gbpRef, tokenData, { merge: true });

// Retrieve tokens
const { data: gbpData } = useDoc(gbpRef);
```

### After (DynamoDB)

```typescript
// Store tokens
await storeOAuthTokens(userId, tokenData, "GOOGLE_BUSINESS");

// Retrieve tokens
const tokens = await getOAuthTokens(userId, "GOOGLE_BUSINESS");
```

## Usage Examples

### Storing Tokens After OAuth Callback

```typescript
const tokenData = {
  agentProfileId: user.id,
  accessToken: result.accessToken,
  refreshToken: result.refreshToken || '',
  expiryDate: Date.now() + (result.expiresIn * 1000), // Convert seconds to milliseconds
};

await storeOAuthTokens(user.id, tokenData, "GOOGLE_BUSINESS");
```

### Checking Connection Status

```typescript
const tokens = await getOAuthTokens(user.id, "GOOGLE_BUSINESS");
const isConnected = tokens && tokens.accessToken;
```

### Using Valid Tokens

```typescript
// Automatically refreshes if expired
const validTokens = await getValidOAuthTokens(user.id, "GOOGLE_BUSINESS");

if (validTokens) {
  // Use validTokens.accessToken for API calls
  const response = await fetch("https://api.google.com/...", {
    headers: {
      Authorization: `Bearer ${validTokens.accessToken}`,
    },
  });
}
```

## Error Handling

The OAuth token functions handle errors gracefully:

- **Token not found**: Returns `null`
- **Refresh failed**: Logs error and returns `null` (user needs to re-authenticate)
- **Network errors**: Throws error with descriptive message
- **Invalid refresh token**: Throws error (user needs to re-authenticate)

## Security Considerations

1. **Token Storage**: Tokens are stored in DynamoDB with user-scoped partition keys
2. **Access Control**: Only the authenticated user can access their own tokens
3. **Expiry Buffer**: 5-minute buffer ensures tokens are refreshed before expiration
4. **Automatic Refresh**: Reduces the chance of API calls with expired tokens
5. **Error Logging**: Failed refresh attempts are logged for monitoring

## Testing

Unit tests are provided in `oauth-tokens.test.ts` covering:

- Token storage with correct structure
- Token retrieval
- Token updates
- Token deletion
- Expiry checking logic
- Key pattern validation

## Requirements Validation

This implementation satisfies the following requirements from the design document:

- **Requirement 7.1**: OAuth flow initiation ✓
- **Requirement 7.2**: Token exchange for authorization code ✓
- **Requirement 7.3**: Token storage in DynamoDB ✓
- **Requirement 7.4**: Token refresh logic ✓
- **Requirement 7.5**: OAuth callback handling ✓

## Future Enhancements

1. **Multiple Providers**: Support for additional OAuth providers (Zillow, Realtor.com, etc.)
2. **Token Encryption**: Encrypt tokens at rest for additional security
3. **Audit Logging**: Log all token operations for compliance
4. **Token Revocation**: Implement token revocation endpoint
5. **Webhook Support**: Handle token revocation webhooks from providers
