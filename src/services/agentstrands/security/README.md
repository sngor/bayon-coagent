## AgentStrands Security Module

Comprehensive security implementation for the AgentStrands enhancement system.

## Overview

This module provides enterprise-grade security features for all AgentStrands operations:

- **Input Validation**: Schema-based validation using Zod with size limits and type safety
- **Rate Limiting**: Sliding window rate limiting per user and operation type
- **Encryption**: AES-256-GCM encryption for sensitive data with AWS KMS integration
- **Audit Logging**: Comprehensive security event logging to CloudWatch
- **PII Detection**: Automatic detection and masking of personally identifiable information
- **Security Middleware**: Unified middleware for enforcing security policies

## Features

### 1. Input Validation (`input-validator.ts`)

Validates all inputs to prevent injection attacks and malformed data:

```typescript
import {
  validateTaskInput,
  sanitizeContent,
} from "@/services/agentstrands/security";

// Validate task input
const validated = validateTaskInput(userInput);

// Sanitize content
const safe = sanitizeContent(userContent);
```

**Features:**

- Zod schema validation
- XSS prevention
- Size limit enforcement
- Content sanitization
- Type guards

### 2. Rate Limiting (`rate-limiter.ts`)

Prevents abuse with configurable rate limits:

```typescript
import {
  enforceRateLimit,
  checkTaskExecutionLimit,
} from "@/services/agentstrands/security";

// Check rate limit
const result = await checkTaskExecutionLimit(userId, strandId);

// Enforce rate limit (throws on exceeded)
await enforceRateLimit(userId, "taskExecution", strandId);
```

**Rate Limits:**

- Task Execution: 100 requests/minute
- Feedback Submission: 50 requests/minute
- Memory Operations: 200 requests/minute
- Opportunity Detection: 20 requests/5 minutes
- Strand Creation: 10 requests/hour

### 3. Encryption (`encryption.ts`)

Encrypts sensitive data at rest and in transit:

```typescript
import {
  encrypt,
  decrypt,
  encryptFields,
} from "@/services/agentstrands/security";

// Encrypt data
const encrypted = encrypt(sensitiveData);

// Decrypt data
const decrypted = decrypt(encrypted);

// Field-level encryption
const obj = encryptFields(data, ["password", "apiKey"]);
```

**Features:**

- AES-256-GCM encryption
- PBKDF2 key derivation
- Secure token generation
- PII detection and masking
- Constant-time comparison

### 4. Audit Logging (`audit-logger.ts`)

Logs all security-relevant events:

```typescript
import { auditLogger } from "@/services/agentstrands/security";

// Log authentication
await auditLogger.logAuthSuccess(userId);

// Log rate limit exceeded
await auditLogger.logRateLimitExceeded(userId, "taskExecution");

// Log suspicious activity
await auditLogger.logSuspiciousActivity(userId, "Multiple failed attempts");
```

**Event Types:**

- Authentication events
- Data access events
- Security violations
- Compliance events
- System events

### 5. Security Middleware (`middleware.ts`)

Unified middleware for all operations:

```typescript
import { securityMiddleware } from "@/services/agentstrands/security";

const result = await securityMiddleware(
  {
    userId,
    strandId,
    operationType: "taskExecution",
  },
  taskData,
  TaskInputSchema,
  async () => {
    // Your operation here
    return await executeTask(taskData);
  }
);

if (!result.success) {
  // Handle validation or rate limit errors
  console.error(result.errors);
}
```

**Middleware Features:**

- Automatic validation
- Rate limit enforcement
- PII detection
- Audit logging
- Error handling

## Configuration

### Environment Variables

```bash
# Required: Encryption key (min 32 characters)
AGENTSTRANDS_ENCRYPTION_KEY=your-secure-key-here

# Optional: AWS configuration
AWS_REGION=us-east-1
```

### Rate Limit Configuration

Edit `RATE_LIMIT_CONFIGS` in `rate-limiter.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  taskExecution: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    keyPrefix: "task_exec",
  },
  // ... other configs
};
```

## Usage Examples

### Complete Operation with Security

```typescript
import {
  securityMiddleware,
  validateTaskInput,
  auditLogger,
  sanitizeForStorage,
} from "@/services/agentstrands/security";

async function executeStrandTask(
  userId: string,
  strandId: string,
  taskData: unknown
) {
  const result = await securityMiddleware(
    {
      userId,
      strandId,
      operationType: "taskExecution",
    },
    taskData,
    TaskInputSchema,
    async () => {
      // Validate input
      const validated = validateTaskInput(taskData);

      // Sanitize for storage
      const sanitized = sanitizeForStorage(validated);

      // Execute task
      const result = await strand.execute(sanitized);

      // Log success
      await auditLogger.logStrandOperation(
        userId,
        strandId,
        "execute",
        "success"
      );

      return result;
    }
  );

  if (!result.success) {
    if (result.rateLimitExceeded) {
      throw new Error(`Rate limit exceeded. Retry in ${result.retryAfter}s`);
    }
    throw new Error(`Validation failed: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}
```

### Encrypting Sensitive Fields

```typescript
import { encryptFields, decryptFields } from "@/services/agentstrands/security";

// Before storing
const userData = {
  id: "123",
  name: "John Doe",
  apiKey: "secret-key",
  preferences: { theme: "dark" },
};

const encrypted = encryptFields(userData, ["apiKey", "preferences"]);
await saveToDatabase(encrypted);

// After retrieving
const retrieved = await getFromDatabase(userId);
const decrypted = decryptFields(retrieved, ["apiKey", "preferences"]);
```

### PII Detection and Masking

```typescript
import { detectPII, maskPII } from "@/services/agentstrands/security";

const content = "Contact me at john@example.com or 555-123-4567";

// Detect PII
const detection = detectPII(content);
// { hasPII: true, types: ['email', 'phone'] }

// Mask PII
const masked = maskPII(content);
// 'Contact me at [EMAIL] or [PHONE]'
```

## Security Best Practices

### 1. Always Validate Input

```typescript
// ❌ Bad
async function createStrand(config: any) {
  return await strand.create(config);
}

// ✅ Good
async function createStrand(config: unknown) {
  const validated = validateStrandConfig(config);
  return await strand.create(validated);
}
```

### 2. Use Middleware for Operations

```typescript
// ❌ Bad
async function executeTask(userId: string, task: any) {
  return await strand.execute(task);
}

// ✅ Good
async function executeTask(userId: string, task: unknown) {
  return await securityMiddleware(
    { userId, operationType: "taskExecution" },
    task,
    TaskInputSchema,
    async () => strand.execute(task)
  );
}
```

### 3. Encrypt Sensitive Data

```typescript
// ❌ Bad
await db.put({
  userId,
  apiKey: userApiKey,
});

// ✅ Good
const encrypted = encryptFields({ userId, apiKey: userApiKey }, ["apiKey"]);
await db.put(encrypted);
```

### 4. Log Security Events

```typescript
// ❌ Bad
try {
  await authenticateUser(credentials);
} catch (error) {
  console.error("Auth failed");
}

// ✅ Good
try {
  await authenticateUser(credentials);
  await auditLogger.logAuthSuccess(userId);
} catch (error) {
  await auditLogger.logAuthFailure(userId, error.message);
}
```

### 5. Sanitize Before Storage

```typescript
// ❌ Bad
await db.put({
  content: userInput,
});

// ✅ Good
await db.put({
  content: sanitizeContent(userInput),
});
```

## Testing

### Unit Tests

```typescript
import {
  validateTaskInput,
  encrypt,
  decrypt,
} from "@/services/agentstrands/security";

describe("Input Validation", () => {
  it("should validate valid task input", () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      strandId: "123e4567-e89b-12d3-a456-426614174001",
      type: "analysis",
      description: "Test task",
      input: {},
      dependencies: [],
      priority: "normal",
      createdAt: new Date().toISOString(),
    };

    expect(() => validateTaskInput(input)).not.toThrow();
  });
});

describe("Encryption", () => {
  it("should encrypt and decrypt data", () => {
    const data = "sensitive information";
    const encrypted = encrypt(data);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(data);
  });
});
```

## Compliance

This security module helps meet compliance requirements:

- **GDPR**: PII detection and masking, data encryption, audit logging
- **CCPA**: Data access logging, encryption at rest
- **SOC 2**: Comprehensive audit trails, access controls, encryption
- **Fair Housing Act**: Content validation, compliance checking

## Performance Considerations

- **Rate Limiting**: In-memory with automatic cleanup (minimal overhead)
- **Encryption**: Uses native crypto module (fast)
- **Validation**: Zod schemas are compiled once (efficient)
- **Audit Logging**: Buffered writes to CloudWatch (batched)

## Troubleshooting

### Encryption Key Not Set

```
Error: AGENTSTRANDS_ENCRYPTION_KEY environment variable is not set
```

**Solution**: Set the environment variable:

```bash
export AGENTSTRANDS_ENCRYPTION_KEY="your-secure-32-char-key-here"
```

### Rate Limit Exceeded

```
Error: Rate limit exceeded for taskExecution. Try again in 45 seconds.
```

**Solution**: Wait for the specified time or increase rate limits in configuration.

### Validation Failed

```
Error: Validation failed: [{"field":"description","message":"Description too long"}]
```

**Solution**: Fix the input data to match the schema requirements.

## Monitoring

Monitor security metrics in CloudWatch:

- Rate limit violations
- Validation failures
- PII detections
- Authentication failures
- Suspicious activity

## Support

For security issues or questions:

1. Check this documentation
2. Review audit logs in CloudWatch
3. Contact the security team

## License

Internal use only - Bayon Coagent Platform
