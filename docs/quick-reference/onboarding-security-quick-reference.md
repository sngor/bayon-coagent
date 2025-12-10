# Onboarding Security Quick Reference

## Overview

The onboarding system implements comprehensive security measures to protect user data and prevent unauthorized access. This document provides a quick reference for all security features implemented in the onboarding flow.

**Requirements Validated**: 11.1, 2.2

## Security Features

### 1. JWT Token Verification

**Location**: `src/middleware/onboarding-detection.ts`, `src/services/onboarding/onboarding-actions.ts`

**Implementation**:

- All onboarding routes verify JWT tokens from session cookies
- Tokens are validated against AWS Cognito
- Invalid or expired tokens result in authentication failure
- Token refresh is attempted automatically when possible

**Usage**:

```typescript
// Middleware automatically verifies JWT for all authenticated routes
const userId = await getUserIdFromSession(request);

// Server actions verify authentication
const { userId } = await verifyAuthentication();
```

### 2. Server-Side Role Validation

**Location**: `src/services/onboarding/onboarding-actions.ts`

**Implementation**:

- Admin role is verified server-side using Cognito user attributes
- Role checks cannot be bypassed by client-side manipulation
- Admin-only operations require explicit role validation

**Usage**:

```typescript
// Verify admin role for admin onboarding flows
const isAdmin = await verifyAdminRole(userId);
if (!isAdmin) {
  return { message: "Unauthorized", errors: { auth: ["Admin role required"] } };
}
```

**Protected Operations**:

- Admin onboarding flow initialization
- Resetting other users' onboarding state
- Accessing admin-specific onboarding steps

### 3. Input Sanitization

**Location**: `src/services/onboarding/onboarding-security.ts`

**Implementation**:

- All form inputs are sanitized before processing
- Removes potentially dangerous characters and patterns
- Validates data format and structure
- Detects injection attempts (SQL, XSS, path traversal)

**Sanitization Functions**:

```typescript
// Sanitize profile form data
const sanitized = sanitizeProfileFormData(formData);

// Sanitize metadata
const sanitizedMetadata = sanitizeMetadata(metadata);

// Validate for suspicious patterns
const { safe, issues } = validateFormSecurity(data);
```

**Protected Fields**:

- Name fields (firstName, lastName)
- Email addresses
- Phone numbers
- URLs (website)
- Location data (city, state, zipCode)
- Specialties array
- Metadata objects

### 4. Rate Limiting

**Location**: `src/services/onboarding/onboarding-actions.ts`

**Implementation**:

- Rate limiting applied to all state-changing operations
- Uses in-memory rate limiter with configurable limits
- Prevents abuse and DoS attacks
- Returns clear error messages with retry timing

**Configuration**:

```typescript
// Onboarding uses API rate limiter
// 60 requests per minute per user
const onboardingRateLimiter = rateLimiters.api;
```

**Protected Operations**:

- Initialize onboarding
- Complete step
- Skip step
- Update metadata
- Reset onboarding

**Error Response**:

```json
{
  "message": "Too many requests. Please try again after 3:45 PM.",
  "errors": { "rateLimit": ["Too many requests"] }
}
```

### 5. CSRF Protection

**Location**: `src/services/onboarding/onboarding-actions.ts`

**Implementation**:

- CSRF tokens validated for all state-changing operations
- Tokens stored in secure HTTP-only cookies
- Timing-safe comparison prevents timing attacks
- Optional for backward compatibility

**Usage**:

```typescript
// Server action with CSRF protection
export async function completeStepAction(
  stepId: string,
  csrfToken?: string
): Promise<ActionResponse<OnboardingState>> {
  if (csrfToken) {
    const isValidCSRF = await validateCSRFToken(csrfToken);
    if (!isValidCSRF) {
      return {
        message: "CSRF validation failed",
        errors: { csrf: ["Invalid token"] },
      };
    }
  }
  // ... rest of action
}
```

**Client-Side Usage**:

```typescript
// Get CSRF token for form submission
const csrfToken = await getCSRFToken();

// Include in form data
formData.append("csrf_token", csrfToken);
```

### 6. Security Headers

**Location**: `src/middleware/onboarding-detection.ts`

**Implementation**:

- Security headers added to all onboarding responses
- Prevents common web vulnerabilities
- Enforces secure content policies

**Headers Applied**:

```typescript
'X-Content-Type-Options': 'nosniff'        // Prevent MIME sniffing
'X-Frame-Options': 'DENY'                  // Prevent clickjacking
'X-XSS-Protection': '1; mode=block'        // Enable XSS filter
'Referrer-Policy': 'strict-origin-when-cross-origin'  // Control referrer info
```

## Security Validation

### Profile Form Validation

**Schema**: `profileFormSchema` in `src/services/onboarding/onboarding-security.ts`

**Validations**:

- **firstName/lastName**: 1-50 characters, letters/spaces/hyphens only
- **email**: Valid email format, max 100 characters
- **phone**: Valid phone format, 10-20 characters
- **brokerage**: Required, max 100 characters
- **location.city**: Required, letters/spaces/hyphens only
- **location.state**: 2 uppercase letters (US state code)
- **location.zipCode**: Valid US ZIP code format (12345 or 12345-6789)
- **specialties**: 1-10 items required
- **yearsExperience**: 0-100 integer
- **website**: Valid URL format

**Usage**:

```typescript
const result = validateAndSanitizeProfileForm(formData);

if (!result.success) {
  // Handle validation errors
  console.error("Validation errors:", result.errors);
  return;
}

// Use validated data
const validatedData = result.data;
```

### Suspicious Pattern Detection

**Function**: `detectSuspiciousPatterns` in `src/services/onboarding/onboarding-security.ts`

**Detects**:

- SQL injection attempts (OR/AND, UNION SELECT, DROP TABLE, etc.)
- XSS attacks (<script>, javascript:, onerror=, etc.)
- Path traversal (../, ..\)

**Usage**:

```typescript
const check = detectSuspiciousPatterns(userInput);

if (check.suspicious) {
  console.error("Security threat detected:", check.reason);
  // Reject input
}
```

## Server Actions

All onboarding server actions are located in `src/services/onboarding/onboarding-actions.ts`.

### Available Actions

1. **initializeOnboardingAction**

   - Initializes onboarding for a user
   - Validates flow type
   - Requires admin role for admin flows
   - Rate limited

2. **getOnboardingStateAction**

   - Retrieves current onboarding state
   - JWT verification required
   - No rate limiting (read-only)

3. **completeStepAction**

   - Marks a step as complete
   - Input sanitization
   - CSRF protection (optional)
   - Rate limited

4. **skipStepAction**

   - Marks a step as skipped
   - Input sanitization
   - CSRF protection (optional)
   - Rate limited

5. **completeOnboardingAction**

   - Marks entire flow as complete
   - CSRF protection (optional)
   - Rate limited

6. **updateMetadataAction**

   - Updates onboarding metadata
   - Recursive sanitization
   - CSRF protection (optional)
   - Rate limited

7. **needsOnboardingAction**

   - Checks if user needs onboarding
   - JWT verification required
   - No rate limiting (read-only)

8. **resetOnboardingAction**
   - Resets onboarding state
   - Admin-only for other users
   - CSRF protection (optional)
   - Rate limited

### Action Response Format

All actions return a consistent response format:

```typescript
interface ActionResponse<T = any> {
  message: string; // Success or error message
  data?: T; // Response data (if successful)
  errors: Record<string, string[]>; // Validation/error details
}
```

**Success Response**:

```json
{
  "message": "success",
  "data": {
    /* onboarding state */
  },
  "errors": {}
}
```

**Error Response**:

```json
{
  "message": "Validation failed",
  "errors": {
    "firstName": ["First name is required"],
    "email": ["Invalid email format"]
  }
}
```

## Best Practices

### 1. Always Verify Authentication

```typescript
// ✅ Good: Verify authentication in server actions
const { userId } = await verifyAuthentication();

// ❌ Bad: Trust client-provided user ID
const userId = formData.get("userId");
```

### 2. Sanitize All Inputs

```typescript
// ✅ Good: Sanitize before processing
const sanitizedData = sanitizeProfileFormData(formData);
const result = profileFormSchema.safeParse(sanitizedData);

// ❌ Bad: Use raw input directly
const result = profileFormSchema.safeParse(formData);
```

### 3. Validate on Server Side

```typescript
// ✅ Good: Server-side validation
export async function initializeOnboardingAction(flowType: OnboardingFlowType) {
  const isAdmin = await verifyAdminRole(userId);
  if (flowType === "admin" && !isAdmin) {
    return {
      message: "Unauthorized",
      errors: { auth: ["Admin role required"] },
    };
  }
}

// ❌ Bad: Client-side only validation
if (flowType === "admin" && !userIsAdmin) {
  // Client can bypass this
}
```

### 4. Use CSRF Protection

```typescript
// ✅ Good: Include CSRF token
const csrfToken = await getCSRFToken();
await completeStepAction(stepId, csrfToken);

// ⚠️ Acceptable: Optional for backward compatibility
await completeStepAction(stepId);
```

### 5. Handle Rate Limiting

```typescript
// ✅ Good: Handle rate limit errors gracefully
const result = await completeStepAction(stepId);

if (result.message.includes("Rate limit")) {
  toast.error("Too many requests. Please wait a moment and try again.");
  return;
}

// ❌ Bad: Ignore rate limit errors
await completeStepAction(stepId);
```

## Testing Security

### Manual Testing

1. **JWT Verification**:

   - Clear session cookie and try to access onboarding
   - Use expired token and verify rejection
   - Modify token and verify rejection

2. **Role Validation**:

   - Try to initialize admin flow without admin role
   - Try to reset another user's onboarding without admin role

3. **Input Sanitization**:

   - Submit form with `<script>alert('xss')</script>` in name field
   - Submit form with `'; DROP TABLE users; --` in text field
   - Submit form with `../../../etc/passwd` in text field

4. **Rate Limiting**:

   - Make 61 requests in 1 minute
   - Verify 61st request is rejected
   - Wait 1 minute and verify requests work again

5. **CSRF Protection**:
   - Submit form without CSRF token
   - Submit form with invalid CSRF token
   - Submit form with expired CSRF token

### Automated Testing

```typescript
// Example test for input sanitization
describe("Profile Form Security", () => {
  it("should sanitize XSS attempts", () => {
    const maliciousData = {
      firstName: '<script>alert("xss")</script>',
      lastName: "Test",
      email: "test@example.com",
      // ... other fields
    };

    const result = validateAndSanitizeProfileForm(maliciousData);

    expect(result.success).toBe(true);
    expect(result.data.firstName).not.toContain("<script>");
  });

  it("should detect SQL injection attempts", () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const check = detectSuspiciousPatterns(maliciousInput);

    expect(check.suspicious).toBe(true);
    expect(check.reason).toContain("SQL injection");
  });
});
```

## Security Checklist

- [x] JWT token verification on all routes
- [x] Server-side role validation for admin operations
- [x] Input sanitization for all form fields
- [x] Rate limiting for state updates
- [x] CSRF protection for form submissions
- [x] Security headers on all responses
- [x] Suspicious pattern detection
- [x] Validation error messages
- [x] Secure session cookie handling
- [x] Protection against XSS attacks
- [x] Protection against SQL injection
- [x] Protection against path traversal
- [x] Protection against clickjacking
- [x] Protection against MIME sniffing

## Troubleshooting

### "Authentication required" Error

**Cause**: JWT token is missing, invalid, or expired

**Solution**:

1. Check if user is signed in
2. Verify session cookie exists
3. Try signing out and back in
4. Check token expiration

### "CSRF validation failed" Error

**Cause**: CSRF token is missing, invalid, or expired

**Solution**:

1. Ensure CSRF token is included in request
2. Verify token is not expired (24 hour limit)
3. Check cookie settings (httpOnly, secure, sameSite)
4. Try refreshing the page to get new token

### "Rate limit exceeded" Error

**Cause**: Too many requests in short time period

**Solution**:

1. Wait for the time specified in error message
2. Reduce frequency of requests
3. Implement client-side debouncing
4. Check for infinite loops in code

### "Unauthorized" Error

**Cause**: User lacks required role for operation

**Solution**:

1. Verify user has admin role in Cognito
2. Check role attribute in user profile
3. Ensure role validation is working correctly
4. Contact administrator if role should be granted

## Related Documentation

- [Onboarding Error Handling Quick Reference](./onboarding-error-handling-quick-reference.md)
- [CSRF Protection](../../src/lib/security/csrf-protection.ts)
- [Rate Limiter](../../src/lib/security/rate-limiter.ts)
- [Input Sanitization](../../src/lib/security/input-sanitization.ts)
- [Server Authentication](../../src/aws/auth/server-auth.ts)
