# Client Portal Authentication

This document describes the authentication infrastructure for the Client Portal feature.

## Overview

The Client Portal uses a separate authentication system from the main agent authentication. This separation ensures:

- Clear security boundaries between agents and clients
- Different session management policies
- Invitation-based account creation workflow
- Simplified client experience

## Architecture

### Separate Cognito User Pools

The system supports two separate Cognito user pools:

1. **Agent User Pool**: For real estate agents (existing)
2. **Client User Pool**: For client portal users (new)

This separation is configured via environment variables:

```bash
# Agent Cognito (existing)
COGNITO_USER_POOL_ID=us-west-2_xxxxx
COGNITO_CLIENT_ID=xxxxx

# Client Cognito (new - optional, falls back to agent pool if not set)
CLIENT_COGNITO_USER_POOL_ID=us-west-2_yyyyy
CLIENT_COGNITO_CLIENT_ID=yyyyy
```

### Key Components

#### 1. ClientAuthClient (`src/aws/auth/client-auth.ts`)

Main authentication client for client portal operations:

- `createClientAccount()`: Create a new client account in Cognito
- `setClientPassword()`: Set client password with complexity validation
- `signIn()`: Authenticate client and create 24-hour session
- `signOut()`: Sign out client and clear session
- `getCurrentUser()`: Get current authenticated client info
- `refreshSession()`: Refresh expired session
- `getSession()`: Get current session with auto-refresh
- `deactivateClient()`: Disable client account
- `reactivateClient()`: Re-enable client account

#### 2. Password Validation

Password complexity requirements (Requirement 2.2):

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Function: `validatePasswordComplexity(password: string)`

#### 3. Invitation System

Invitation tokens for secure account setup:

- **Token Generation**: `generateInvitationToken()` - Creates URL-safe random token
- **Invitation Creation**: `createClientInvitation()` - Creates invitation with 7-day expiration
- **Token Validation**: `isInvitationValid()` - Checks if invitation is not expired

#### 4. Session Management

Client sessions have specific characteristics:

- **Duration**: 24 hours (Requirement 2.3)
- **Storage**: localStorage with key `client_portal_session`
- **Auto-refresh**: Sessions are automatically refreshed when expired
- **Expiration Handling**: Expired sessions redirect to login with destination URL preserved (Requirement 2.4)

## Authentication Flow

### 1. Client Account Creation (Agent-Initiated)

```typescript
import { getClientAuthClient } from "@/aws/auth/client-auth";

const clientAuth = getClientAuthClient();

// Agent creates client account
await clientAuth.createClientAccount(
  "client@example.com",
  "agent-123",
  "client-456"
);

// Generate invitation
const invitation = createClientInvitation(
  "client-456",
  "client@example.com",
  "agent-123"
);

// Send invitation email with token
// Email contains link: https://app.com/portal/setup?token={invitation.token}
```

### 2. Client Password Setup (First-Time)

```typescript
import {
  getClientAuthClient,
  validatePasswordComplexity,
} from "@/aws/auth/client-auth";

const clientAuth = getClientAuthClient();

// Validate password
const validation = validatePasswordComplexity(password);
if (!validation.valid) {
  // Show errors: validation.errors
  return;
}

// Set password
await clientAuth.setClientPassword("client@example.com", password);

// Client can now sign in
```

### 3. Client Sign In

```typescript
import { getClientAuthClient } from "@/aws/auth/client-auth";

const clientAuth = getClientAuthClient();

// Sign in
const session = await clientAuth.signIn("client@example.com", password);

// Session contains:
// - accessToken: For API calls
// - idToken: User identity
// - refreshToken: For session refresh
// - expiresAt: Timestamp (24 hours from now)
// - clientId: Client's ID
// - agentId: Associated agent's ID
```

### 4. Session Management

```typescript
import { getClientAuthClient } from "@/aws/auth/client-auth";

const clientAuth = getClientAuthClient();

// Get current session (auto-refreshes if needed)
const session = await clientAuth.getSession();

if (!session) {
  // Not authenticated, redirect to login
  router.push("/portal/login");
  return;
}

// Use session for authenticated requests
const user = await clientAuth.getCurrentUser(session.accessToken);
```

### 5. Client Sign Out

```typescript
import { getClientAuthClient } from "@/aws/auth/client-auth";

const clientAuth = getClientAuthClient();

const session = await clientAuth.getSession();
if (session) {
  await clientAuth.signOut(session.accessToken);
}

// Redirect to login
router.push("/portal/login");
```

## Data Models

### ClientUser

```typescript
interface ClientUser {
  id: string; // Cognito username
  email: string; // Client email
  emailVerified: boolean; // Email verification status
  agentId: string; // Associated agent ID
  attributes: Record<string, string>; // Additional attributes
}
```

### ClientAuthSession

```typescript
interface ClientAuthSession {
  accessToken: string; // Access token for API calls
  idToken: string; // ID token with user claims
  refreshToken: string; // Refresh token for session renewal
  expiresAt: number; // Expiration timestamp (24 hours)
  clientId: string; // Client ID
  agentId: string; // Associated agent ID
}
```

### ClientInvitation

```typescript
interface ClientInvitation {
  token: string; // Secure random token
  clientId: string; // Client ID
  email: string; // Client email
  agentId: string; // Agent who created invitation
  expiresAt: number; // Expiration timestamp (7 days)
  createdAt: number; // Creation timestamp
}
```

## Security Considerations

### Password Security

- Passwords are validated for complexity before being set
- Passwords are never stored in plain text
- Cognito handles password hashing and storage

### Token Security

- Invitation tokens are cryptographically random (32 bytes)
- Tokens are URL-safe base64 encoded
- Tokens expire after 7 days
- Tokens should be single-use (validated in DynamoDB)

### Session Security

- Sessions expire after 24 hours
- Sessions are stored in localStorage (client-side only)
- Access tokens are validated on every API call
- Refresh tokens are used to extend sessions

### Account Security

- Email verification is automatic (agent-created accounts)
- Deactivated accounts cannot sign in
- Failed login attempts are rate-limited by Cognito

## Error Handling

The `ClientAuthClient` provides user-friendly error messages:

- **Session Expired**: "Your session has expired. Please sign in again."
- **Invalid Credentials**: "Incorrect email or password. Please try again."
- **Account Not Found**: "No account found with this email."
- **Password Complexity**: "Password must be at least 8 characters with uppercase, lowercase, and numbers."
- **Too Many Attempts**: "Too many attempts. Please wait a few minutes and try again."

## Testing

### Unit Tests

Test password validation:

```typescript
import { validatePasswordComplexity } from "@/aws/auth/client-auth";

test("validates password complexity", () => {
  expect(validatePasswordComplexity("short").valid).toBe(false);
  expect(validatePasswordComplexity("nouppercase1").valid).toBe(false);
  expect(validatePasswordComplexity("NOLOWERCASE1").valid).toBe(false);
  expect(validatePasswordComplexity("NoNumbers").valid).toBe(false);
  expect(validatePasswordComplexity("ValidPass123").valid).toBe(true);
});
```

Test invitation expiration:

```typescript
import {
  createClientInvitation,
  isInvitationValid,
} from "@/aws/auth/client-auth";

test("invitation expires after 7 days", () => {
  const invitation = createClientInvitation(
    "client-1",
    "test@example.com",
    "agent-1"
  );

  // Should be valid immediately
  expect(isInvitationValid(invitation)).toBe(true);

  // Should expire after 7 days
  const sevenDaysLater = invitation.expiresAt + 1;
  jest.spyOn(Date, "now").mockReturnValue(sevenDaysLater);
  expect(isInvitationValid(invitation)).toBe(false);
});
```

### Property-Based Tests

Test session expiration (Property 8):

```typescript
import * as fc from "fast-check";
import { getClientAuthClient } from "@/aws/auth/client-auth";

test("Property 8: Client sessions expire after 24 hours", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.emailAddress(),
      fc.string({ minLength: 8 }),
      async (email, password) => {
        const client = getClientAuthClient();
        const session = await client.signIn(email, password);

        const twentyFourHours = 24 * 60 * 60 * 1000;
        const expectedExpiration = Date.now() + twentyFourHours;

        // Allow 1 second tolerance for execution time
        expect(Math.abs(session.expiresAt - expectedExpiration)).toBeLessThan(
          1000
        );
      }
    )
  );
});
```

## Environment Setup

### Development

For local development, the client authentication can use the same Cognito pool as agents:

```bash
# .env.local
COGNITO_USER_POOL_ID=us-west-2_xxxxx
COGNITO_CLIENT_ID=xxxxx

# Client auth will fall back to these if CLIENT_* vars not set
```

### Production

For production, create a separate Cognito user pool for clients:

```bash
# .env.production
# Agent Cognito
COGNITO_USER_POOL_ID=us-west-2_xxxxx
COGNITO_CLIENT_ID=xxxxx

# Client Cognito (separate pool)
CLIENT_COGNITO_USER_POOL_ID=us-west-2_yyyyy
CLIENT_COGNITO_CLIENT_ID=yyyyy
```

## Next Steps

1. **Create Client User Pool**: Set up separate Cognito user pool for clients in AWS
2. **Configure Custom Attributes**: Add `custom:agentId` and `custom:clientId` attributes
3. **Set Up Email Templates**: Customize Cognito email templates for client invitations
4. **Implement Password Reset**: Add password reset flow for clients
5. **Add MFA Support**: Optional multi-factor authentication for enhanced security

## Related Documentation

- [Client Portal Design](../.kiro/specs/client-portal/design.md)
- [Client Portal Requirements](../.kiro/specs/client-portal/requirements.md)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
