# MLS Social Integration Security Module

Comprehensive security implementation for MLS and social media integrations, covering encryption, rate limiting, input validation, audit logging, and HTTPS enforcement.

## Features

### 1. Token Encryption (AWS KMS)

Encrypts sensitive tokens (MLS and OAuth) using AWS Key Management Service for secure storage.

**Requirements:** 1.2, 6.2

```typescript
import {
  encryptMLSToken,
  decryptMLSToken,
} from "@/integrations/mls-social/security";

// Encrypt MLS token before storage
const encryptedToken = await encryptMLSToken(accessToken, userId);

// Decrypt MLS token for use
const decryptedToken = await decryptMLSToken(encryptedToken, userId);
```

**Features:**

- Uses AWS KMS for encryption key management
- Encryption context for additional security (userId, tokenType, platform)
- Automatic fallback in local development
- Separate functions for MLS and OAuth tokens

### 2. Rate Limiting

Implements sliding window rate limiting to prevent abuse and ensure fair usage.

**Requirements:** Security considerations

```typescript
import {
  checkMLSSocialRateLimit,
  withRateLimit,
} from "@/integrations/mls-social/security";

// Check rate limit manually
const result = await checkMLSSocialRateLimit(userId, "mlsImport");
if (!result.allowed) {
  throw new Error(
    `Rate limit exceeded. Retry after ${result.retryAfter} seconds`
  );
}

// Or use middleware wrapper
const protectedAction = withRateLimit("socialPublish", async (userId, data) => {
  // Your action logic here
});
```

**Rate Limits:**

- MLS Import: 5 per hour
- MLS Sync: 20 per hour
- MLS Auth: 10 per hour
- Social Publish: 30 per hour
- Social Auth: 10 per hour
- Image Optimize: 100 per hour
- API Request: 100 per minute

### 3. Input Validation

Comprehensive input validation and sanitization using Zod schemas.

**Requirements:** Security considerations

```typescript
import {
  validateInput,
  MLSCredentialsValidator,
  PostContentValidator,
} from "@/integrations/mls-social/security";

// Validate MLS credentials
const result = validateInput(MLSCredentialsValidator, userInput);
if (!result.success) {
  return { error: "Invalid input", errors: result.errors };
}

// Use validated data
const credentials = result.data;
```

**Available Validators:**

- `MLSCredentialsValidator` - MLS authentication credentials
- `PostContentValidator` - Social media post content
- `OAuthCallbackValidator` - OAuth callback parameters
- `ImageOptimizationValidator` - Image optimization parameters
- `ListingIdValidator`, `UserIdValidator`, `ConnectionIdValidator` - ID validation
- `PlatformValidator` - Social media platform validation
- `FileUploadValidator` - File upload parameters
- `PaginationValidator` - Pagination parameters
- `DateRangeValidator` - Date range parameters

**Security Functions:**

- `sanitizeString()` - Remove dangerous characters
- `sanitizeHTML()` - Remove HTML tags and XSS vectors
- `validateHTTPSUrl()` - Ensure URL uses HTTPS
- `ensureHTTPSOnly()` - Validate multiple URLs use HTTPS
- `validateNoSQLInjection()` - Check for SQL injection patterns
- `validateNoNoSQLInjection()` - Check for NoSQL injection patterns

### 4. Audit Logging

Logs security-sensitive operations to CloudWatch for compliance and monitoring.

**Requirements:** Security considerations

```typescript
import {
  logMLSAuthSuccess,
  logOAuthTokenAccess,
  logRateLimitExceeded,
} from "@/integrations/mls-social/security";

// Log successful MLS authentication
await logMLSAuthSuccess(userId, provider, connectionId, ipAddress);

// Log OAuth token access
await logOAuthTokenAccess(userId, platform, connectionId, "read", ipAddress);

// Log rate limit exceeded
await logRateLimitExceeded(userId, "mlsImport", ipAddress);
```

**Audit Event Types:**

- MLS: Authentication, connection management, token access, imports, syncs
- OAuth: Authentication, connection management, token access
- Social: Post creation, post failures, post deletion
- Security: Rate limits, invalid input, unauthorized access, encryption failures

**Severity Levels:**

- INFO: Normal operations
- WARNING: Suspicious activity, rate limits
- ERROR: Failed operations, invalid input
- CRITICAL: Security breaches, unauthorized access

### 5. HTTPS Enforcement

Ensures all external API communications use HTTPS only.

**Requirements:** Security considerations

```typescript
import {
  validateHTTPSUrl,
  ensureHTTPSOnly,
} from "@/integrations/mls-social/security";

// Validate single URL
if (!validateHTTPSUrl(apiUrl)) {
  throw new Error("API URL must use HTTPS");
}

// Validate multiple URLs
const { valid, invalidUrls } = ensureHTTPSOnly([url1, url2, url3]);
if (!valid) {
  throw new Error(`Non-HTTPS URLs detected: ${invalidUrls.join(", ")}`);
}
```

## Usage Examples

### Secure MLS Authentication

```typescript
import {
  validateInput,
  MLSCredentialsValidator,
  encryptMLSToken,
  logMLSAuthSuccess,
  logMLSAuthFailure,
  checkMLSSocialRateLimit,
} from "@/integrations/mls-social/security";

async function authenticateMLS(
  userId: string,
  credentials: unknown,
  ipAddress?: string
) {
  // 1. Check rate limit
  const rateLimit = await checkMLSSocialRateLimit(userId, "mlsAuth");
  if (!rateLimit.allowed) {
    await logRateLimitExceeded(userId, "mlsAuth", ipAddress);
    throw new Error("Rate limit exceeded");
  }

  // 2. Validate input
  const validation = validateInput(MLSCredentialsValidator, credentials);
  if (!validation.success) {
    await logInvalidInput(userId, "mlsAuth", validation.errors, ipAddress);
    throw new Error("Invalid credentials");
  }

  try {
    // 3. Authenticate with MLS
    const connection = await mlsConnector.authenticate(validation.data);

    // 4. Encrypt tokens
    connection.accessToken = await encryptMLSToken(
      connection.accessToken,
      userId
    );
    connection.refreshToken = await encryptMLSToken(
      connection.refreshToken,
      userId
    );

    // 5. Log success
    await logMLSAuthSuccess(
      userId,
      validation.data.provider,
      connection.id,
      ipAddress
    );

    return connection;
  } catch (error) {
    // 6. Log failure
    await logMLSAuthFailure(
      userId,
      validation.data.provider,
      error.message,
      ipAddress
    );
    throw error;
  }
}
```

### Secure Social Media Publishing

```typescript
import {
  validateInput,
  PostContentValidator,
  checkMLSSocialRateLimit,
  logSocialPostCreated,
  logSocialPostFailed,
  ensureHTTPSOnly,
} from "@/integrations/mls-social/security";

async function publishToSocial(
  userId: string,
  postData: unknown,
  ipAddress?: string
) {
  // 1. Check rate limit
  const rateLimit = await checkMLSSocialRateLimit(userId, "socialPublish");
  if (!rateLimit.allowed) {
    await logRateLimitExceeded(userId, "socialPublish", ipAddress);
    throw new Error("Rate limit exceeded");
  }

  // 2. Validate input
  const validation = validateInput(PostContentValidator, postData);
  if (!validation.success) {
    await logInvalidInput(
      userId,
      "socialPublish",
      validation.errors,
      ipAddress
    );
    throw new Error("Invalid post data");
  }

  // 3. Ensure HTTPS for images
  const httpsCheck = ensureHTTPSOnly(validation.data.imageUrls);
  if (!httpsCheck.valid) {
    throw new Error("All image URLs must use HTTPS");
  }

  // 4. Publish to platforms
  for (const platform of validation.data.platforms) {
    try {
      const result = await publisher.publish(platform, validation.data);
      await logSocialPostCreated(
        userId,
        platform,
        result.postId,
        validation.data.listingId,
        ipAddress
      );
    } catch (error) {
      await logSocialPostFailed(
        userId,
        platform,
        validation.data.listingId,
        error.message,
        ipAddress
      );
    }
  }
}
```

## Environment Variables

```bash
# AWS KMS
TOKEN_ENCRYPTION_KEY_ID=alias/bayon-token-encryption

# CloudWatch Logs
AUDIT_LOG_GROUP=/bayon/mls-social/audit

# AWS Configuration
AWS_REGION=us-east-1

# Local Development
USE_LOCAL_AWS=true
LOCALSTACK_ENDPOINT=http://localhost:4566
```

## Setup

### 1. Create KMS Key

```bash
# Create KMS key for token encryption
aws kms create-key \
  --description "Bayon token encryption key" \
  --key-usage ENCRYPT_DECRYPT

# Create alias
aws kms create-alias \
  --alias-name alias/bayon-token-encryption \
  --target-key-id <key-id>
```

### 2. Create CloudWatch Log Group

```bash
# Create log group for audit logs
aws logs create-log-group \
  --log-group-name /bayon/mls-social/audit

# Set retention policy (optional)
aws logs put-retention-policy \
  --log-group-name /bayon/mls-social/audit \
  --retention-in-days 90
```

### 3. Update IAM Permissions

Add these permissions to your Lambda/EC2 role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
      "Resource": "arn:aws:kms:*:*:key/*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:*:log-group:/bayon/mls-social/audit:*"
    }
  ]
}
```

## Testing

```typescript
// Test encryption
const encrypted = await encryptMLSToken("test-token", "user-123");
const decrypted = await decryptMLSToken(encrypted, "user-123");
console.assert(decrypted === "test-token");

// Test rate limiting
const result1 = await checkMLSSocialRateLimit("user-123", "mlsImport");
console.assert(result1.allowed === true);

// Test input validation
const validation = validateInput(MLSCredentialsValidator, {
  provider: "flexmls",
  username: "test@example.com",
  password: "password123",
});
console.assert(validation.success === true);
```

## Best Practices

1. **Always encrypt tokens before storage**

   - Use `encryptMLSToken()` or `encryptOAuthToken()`
   - Never store plain text tokens in DynamoDB

2. **Check rate limits before expensive operations**

   - Use `checkMLSSocialRateLimit()` at the start of server actions
   - Return user-friendly error messages with retry times

3. **Validate all user inputs**

   - Use appropriate Zod validators
   - Sanitize strings before storage or display

4. **Log security-sensitive operations**

   - Authentication attempts (success and failure)
   - Token access and refresh
   - Connection creation and deletion
   - Rate limit violations

5. **Enforce HTTPS for external APIs**

   - Validate all external URLs use HTTPS
   - Reject non-HTTPS URLs in production

6. **Monitor audit logs**
   - Set up CloudWatch alarms for suspicious patterns
   - Review logs regularly for security incidents
   - Investigate repeated authentication failures

## Compliance

This security module helps meet compliance requirements for:

- **SOC 2**: Audit logging, encryption at rest, access controls
- **GDPR**: Data encryption, audit trails, secure token handling
- **PCI DSS**: Encryption, access logging, input validation
- **HIPAA**: Audit logging, encryption, access controls (if applicable)

## Troubleshooting

### KMS Encryption Errors

```
Error: Failed to encrypt token: AccessDeniedException
```

**Solution:** Ensure IAM role has `kms:Encrypt` permission for the KMS key.

### CloudWatch Logging Errors

```
Error: Failed to log audit event: ResourceNotFoundException
```

**Solution:** Create the log group `/bayon/mls-social/audit` in CloudWatch.

### Rate Limit Not Working

```
Rate limits not being enforced
```

**Solution:** Check DynamoDB permissions and ensure rate limit records are being created.

## Security Considerations

1. **KMS Key Rotation**: Enable automatic key rotation for the encryption key
2. **Audit Log Retention**: Set appropriate retention policies (90-365 days)
3. **Rate Limit Tuning**: Adjust limits based on usage patterns and abuse detection
4. **Input Validation**: Keep validators updated with new attack patterns
5. **HTTPS Enforcement**: Never allow HTTP in production environments
