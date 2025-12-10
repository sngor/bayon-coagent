# Onboarding Middleware Quick Reference

## Overview

The onboarding detection middleware automatically redirects users who need to complete onboarding to the appropriate step in the onboarding flow.

## How It Works

```
User Request → Middleware Chain → Onboarding Detection → Response
                                         ↓
                                   Check Session
                                         ↓
                                   Query DynamoDB
                                         ↓
                              ┌──────────┴──────────┐
                              ↓                     ↓
                    Needs Onboarding        Complete Onboarding
                              ↓                     ↓
                    Redirect to Step         Continue Request
```

## Routes That Skip Onboarding Check

The middleware automatically skips these routes to prevent redirect loops:

### Onboarding Routes

- `/onboarding/*` - All onboarding pages

### Public Routes

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/portal/login`
- `/portal/setup-password`
- `/portal/forgot-password`

### System Routes

- `/api/*` - All API routes
- `/_next/*` - Next.js internal routes
- `/favicon.ico`
- `/robots.txt`
- `/manifest.json`

## Redirect Logic

### New Users (No Onboarding State)

```
User → /dashboard → Middleware → /onboarding/welcome
```

### Incomplete Onboarding

```
User → /studio/write → Middleware → /onboarding/user/profile
                                     (next incomplete step)
```

### Complete Onboarding

```
User → /dashboard → Middleware → /dashboard
                                 (no redirect)
```

## Query Parameter Preservation

All query parameters are preserved during redirects:

```
Original: /dashboard?ref=email&campaign=welcome
Redirect: /onboarding/welcome?ref=email&campaign=welcome
```

This ensures:

- UTM tracking continues to work
- Referral codes are preserved
- Campaign identifiers are maintained

## Error Handling

The middleware prioritizes user access over strict enforcement:

| Error Type           | Behavior                               |
| -------------------- | -------------------------------------- |
| No session cookie    | Allow access (auth middleware handles) |
| Invalid JSON         | Allow access, log error                |
| Missing access token | Allow access                           |
| Cognito API failure  | Allow access, log error                |
| DynamoDB error       | Allow access, log error                |
| Missing state        | Redirect to welcome                    |

**Philosophy**: Temporary errors should never lock users out of the application.

## Session Cookie Format

The middleware expects a `bayon-session` cookie with this structure:

```json
{
  "accessToken": "eyJraWQiOiI...",
  "idToken": "eyJraWQiOiI...",
  "refreshToken": "eyJjdHkiOiI...",
  "expiresAt": 1234567890000
}
```

## Onboarding State Format

The middleware queries DynamoDB for this structure:

```typescript
{
  userId: string;
  flowType: 'user' | 'admin' | 'both';
  isComplete: boolean;
  completedSteps: string[];
  skippedSteps: string[];
  currentStep: number;
  // ... other fields
}
```

## Integration Points

### 1. Main Middleware (`src/middleware.ts`)

```typescript
const onboardingResponse = await onboardingDetectionMiddleware(request);
if (onboardingResponse) {
  return addSecurityHeaders(onboardingResponse);
}
```

### 2. Onboarding Service

The middleware uses the onboarding service indirectly through DynamoDB queries to avoid circular dependencies.

### 3. Auth System

The middleware relies on the `bayon-session` cookie set by the auth system.

## Testing

Run tests with:

```bash
npm test -- src/middleware/__tests__/onboarding-detection.test.ts
```

All 16 tests should pass:

- ✓ Authentication status checks
- ✓ Onboarding state verification
- ✓ Query parameter preservation
- ✓ Redirect loop prevention
- ✓ Error handling
- ✓ Session validation

## Debugging

Enable debug logging by checking the console for:

```
[ONBOARDING_MIDDLEWARE] Redirecting user {userId} to onboarding: {path}
[ONBOARDING_MIDDLEWARE] Error checking onboarding status: {error}
[ONBOARDING_MIDDLEWARE] Error extracting user ID: {error}
```

## Common Issues

### Issue: Redirect loop

**Cause**: Onboarding route not properly detected
**Solution**: Ensure route starts with `/onboarding`

### Issue: Users not redirected

**Cause**: Session cookie missing or invalid
**Solution**: Check auth system is setting `bayon-session` cookie

### Issue: Users redirected when they shouldn't be

**Cause**: Onboarding state not marked complete
**Solution**: Verify `isComplete` flag in DynamoDB

### Issue: Query parameters lost

**Cause**: Middleware not preserving params
**Solution**: Check `createRedirectWithParams` function

## Performance

- **Lightweight**: Route checks happen before any async operations
- **Single query**: Only one DynamoDB call per request
- **Early returns**: Skips expensive operations when possible
- **Edge compatible**: Uses only Edge Runtime APIs

## Security

- **Token validation**: Validates access token with Cognito
- **HttpOnly cookies**: Session cookie is httpOnly
- **No sensitive data**: No sensitive data in URLs
- **Error sanitization**: Errors logged but not exposed

## Next Steps

After implementing the middleware, you'll need:

1. Onboarding route pages (Tasks 5-13)
2. Role detection logic (Task 3)
3. Analytics tracking (Task 14)
4. Resume banner component (Task 13)
