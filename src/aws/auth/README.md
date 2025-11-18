# AWS Cognito Authentication

This module provides authentication functionality using AWS Cognito for the Bayon CoAgent application.

## Features

- User registration (sign up)
- User authentication (sign in)
- Session management with automatic token refresh
- JWT token verification for protected routes
- React hooks for easy integration

## Setup

### 1. Environment Variables

Configure the following environment variables:

```env
# AWS Configuration
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id

# For local development
USE_LOCAL_AWS=true
```

### 2. Cognito User Pool Configuration

Your Cognito User Pool must be configured with:

- **Auth flows**: Enable `USER_PASSWORD_AUTH` and `REFRESH_TOKEN_AUTH`
- **App client**: Create an app client without client secret (for public clients)
- **Attributes**: Email as required attribute

## Usage

### Wrap Your App with AuthProvider

```tsx
import { AuthProvider } from "@/aws/auth";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Use Authentication in Components

```tsx
"use client";

import { useUser, useAuthMethods } from "@/aws/auth";

export function LoginForm() {
  const { user, isUserLoading, userError } = useUser();
  const { signIn, signUp, signOut } = useAuthMethods();

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signIn(email, password);
      console.log("Signed in successfully!");
    } catch (error) {
      console.error("Sign in failed:", error);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      await signUp(email, password);
      console.log("Signed up successfully!");
    } catch (error) {
      console.error("Sign up failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log("Signed out successfully!");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}!</p>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => handleSignIn("user@example.com", "password")}>
        Sign In
      </button>
      <button onClick={() => handleSignUp("user@example.com", "password")}>
        Sign Up
      </button>
    </div>
  );
}
```

### Access Session Tokens

```tsx
import { useSession } from "@/aws/auth";

export function ProtectedComponent() {
  const session = useSession();

  const callProtectedAPI = async () => {
    if (!session) {
      console.error("No session available");
      return;
    }

    const response = await fetch("/api/protected", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const data = await response.json();
    return data;
  };

  return <button onClick={callProtectedAPI}>Call API</button>;
}
```

### Protect API Routes

```tsx
// app/api/protected/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/aws/auth";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const decodedToken = verifyAuthToken(authHeader);

  if (!decodedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Token is valid, proceed with request
  const userId = decodedToken.sub;

  return NextResponse.json({
    message: "Protected data",
    userId,
  });
}
```

### Protect Pages with Middleware

```tsx
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthToken } from "@/aws/auth";

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const decodedToken = verifyAuthToken(authHeader);

  if (!decodedToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
```

## API Reference

### CognitoAuthClient

The main client for interacting with AWS Cognito.

#### Methods

- `signUp(email: string, password: string): Promise<SignUpResult>`
- `signIn(email: string, password: string): Promise<AuthSession>`
- `signOut(accessToken: string): Promise<void>`
- `getCurrentUser(accessToken: string): Promise<CognitoUser>`
- `refreshSession(refreshToken: string): Promise<AuthSession>`
- `getSession(): Promise<AuthSession | null>`

### Hooks

#### useUser()

Returns the current user state.

```tsx
const { user, isUserLoading, userError } = useUser();
```

#### useAuthMethods()

Returns authentication methods.

```tsx
const { signIn, signUp, signOut, refreshSession } = useAuthMethods();
```

#### useSession()

Returns the current session with tokens.

```tsx
const session = useSession();
// session.accessToken, session.idToken, session.refreshToken
```

### Token Verification

#### verifyAuthToken(authHeader: string | null): DecodedToken | null

Verifies a JWT token from an Authorization header.

```tsx
const decodedToken = verifyAuthToken(request.headers.get("authorization"));
if (decodedToken) {
  const userId = decodedToken.sub;
}
```

## Local Development

For local development with LocalStack:

1. Start LocalStack:

   ```bash
   npm run localstack:start
   ```

2. Initialize Cognito resources:

   ```bash
   npm run localstack:init
   ```

3. Set environment variables:
   ```env
   USE_LOCAL_AWS=true
   COGNITO_USER_POOL_ID=local-pool
   COGNITO_CLIENT_ID=local-client
   ```

## Error Handling

The authentication client maps Cognito errors to user-friendly messages:

- `UserNotFoundException` → "User not found. Please check your credentials."
- `NotAuthorizedException` → "Invalid credentials. Please try again."
- `UserNotConfirmedException` → "Please verify your email before signing in."
- `UsernameExistsException` → "An account with this email already exists."
- `InvalidPasswordException` → "Password does not meet requirements."
- `TooManyRequestsException` → "Too many attempts. Please try again later."

## Security Considerations

1. **Token Storage**: Tokens are stored in localStorage. For production, consider using httpOnly cookies for better security.

2. **Token Refresh**: Tokens are automatically refreshed 5 minutes before expiration.

3. **HTTPS**: Always use HTTPS in production to protect tokens in transit.

4. **Password Requirements**: Configure strong password policies in Cognito User Pool settings.

5. **MFA**: Consider enabling Multi-Factor Authentication for additional security.

## Migration from Firebase Auth

The `useUser` hook maintains compatibility with the Firebase auth interface:

```tsx
// Firebase
const { user, isUserLoading, userError } = useUser();

// Cognito (same interface!)
const { user, isUserLoading, userError } = useUser();
```

The main differences:

- User object structure is different (CognitoUser vs Firebase User)
- Authentication methods are accessed via `useAuthMethods()` instead of Firebase auth methods
- Session tokens are accessed via `useSession()` instead of `user.getIdToken()`

## Troubleshooting

### "Invalid token format" error

Make sure you're sending the token in the Authorization header:

```
Authorization: Bearer <token>
```

### "Token expired" error

The token refresh should happen automatically. If you see this error, the refresh token might be invalid. Sign in again.

### LocalStack connection issues

Make sure LocalStack is running:

```bash
npm run localstack:start
npm run localstack:logs
```

### Cognito configuration errors

Verify your User Pool settings:

- Auth flows must include USER_PASSWORD_AUTH
- App client must not require client secret
- Email must be a required attribute
