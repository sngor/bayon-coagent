# Guardrails and Safety Layer Implementation

## Overview

The Guardrails and Safety Layer has been successfully implemented to enforce safety constraints and validate all requests before AI processing. This implementation satisfies Requirements 1.1, 1.2, 1.3, and 1.4 from the Kiro AI Assistant specification.

## Implementation Status

### ✅ Task 2.1: GuardrailsService Class with Domain Validation

- **Status**: Complete
- **Location**: `src/aws/bedrock/guardrails.ts`
- **Features**:
  - Real estate domain classification using keyword matching
  - Pattern detection for real estate-related queries
  - Configuration support for allowed domains and blocked topics
  - Comprehensive keyword list covering all real estate topics

### ✅ Task 2.2: PII Detection and Sanitization

- **Status**: Complete
- **Location**: `src/aws/bedrock/guardrails.ts`
- **Features**:
  - Regex patterns for SSN detection (both formatted and unformatted)
  - Credit card number detection (with various separators)
  - Phone number detection (with context-aware sanitization)
  - Email address detection (with context-aware sanitization)
  - Automatic sanitization with clear redaction markers
  - Context-aware PII handling (lenient for business contacts)

### ✅ Task 2.3: Financial Guarantee and Legal Advice Detection

- **Status**: Complete
- **Location**: `src/aws/bedrock/guardrails.ts`
- **Features**:
  - Pattern matching for financial guarantee language
  - Detection of legal advice requests
  - Professional decline messages with appropriate referrals
  - Comprehensive pattern coverage for various phrasings

### ✅ Task 2.4: Unethical/Illegal Activity Detection

- **Status**: Complete
- **Location**: `src/aws/bedrock/guardrails.ts`
- **Features**:
  - Pattern matching for discriminatory language
  - Detection of fraudulent activities
  - Identification of unethical real estate practices
  - Decline logic without providing guidance

## Key Components

### GuardrailsService Class

The main service class provides the following methods:

```typescript
class GuardrailsService {
  // Main validation method
  validateRequest(prompt: string, config: GuardrailsConfig): GuardrailsResult;

  // Domain validation
  isRealEstateDomain(prompt: string): boolean;

  // Financial and legal checks
  requestsFinancialGuarantee(prompt: string): boolean;
  requestsLegalAdvice(prompt: string): boolean;

  // Ethical checks
  containsUnethicalContent(prompt: string): boolean;

  // PII handling
  detectPII(text: string): string[];
  detectAndSanitizePII(text: string): { sanitized: string; detected: string[] };
  sanitizePrompt(prompt: string): string;
}
```

### Configuration

```typescript
interface GuardrailsConfig {
  allowedDomains: string[];
  blockedTopics: string[];
  piiDetectionEnabled: boolean;
  maxPromptLength: number;
}
```

### Validation Result

```typescript
interface GuardrailsResult {
  allowed: boolean;
  reason?: string;
  sanitizedPrompt?: string;
  detectedPII?: string[];
}
```

## Testing

### Unit Tests

- **Location**: `src/aws/bedrock/__tests__/guardrails.test.ts`
- **Coverage**: 14 test cases covering all requirements
- **Status**: All tests passing ✅

Test categories:

1. Domain validation (Requirement 1.1)
2. Financial guarantee detection (Requirement 1.2)
3. Legal advice detection (Requirement 1.2)
4. PII detection and sanitization (Requirement 1.3)
5. Unethical activity detection (Requirement 1.4)
6. Prompt length validation
7. Helper method functionality

## Usage Examples

See `src/aws/bedrock/guardrails-example.ts` for comprehensive usage examples including:

- Validating user input before processing
- Pre-validation before expensive AI calls
- Sanitizing user input for logging
- Checking for PII before storage

## Pattern Coverage

### Real Estate Keywords (40+ terms)

- Property-related: property, house, home, listing, etc.
- Market-related: market, buyer, seller, agent, broker, etc.
- Transaction-related: closing, escrow, contract, etc.
- Marketing-related: staging, curb appeal, open house, etc.

### Financial Guarantee Patterns

- guarantee, promise return, ensure profit, certain gain, etc.

### Legal Advice Patterns

- legal advice, should sue, contract valid, lawsuit, etc.

### Unethical Patterns

- discriminate, redlining, steering, fraud, misrepresent, etc.

### PII Patterns

- SSN: `\d{3}-\d{2}-\d{4}` or `\d{9}`
- Credit Card: `\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}`
- Phone: `\d{3}[-.]?\d{3}[-.]?\d{4}`
- Email: Standard email regex pattern

## Technical Notes

### Regex Pattern Management

- Patterns use a generator function to avoid global flag state issues
- Fresh regex instances created for each operation
- Ensures consistent behavior across multiple invocations

### Context-Aware PII Detection

- Phone numbers and emails are only redacted when in personal context
- Business contact information is preserved for real estate use cases
- Reduces false positives while maintaining security

### Singleton Pattern

- Service uses singleton pattern for consistent state
- `getGuardrailsService()` provides global access
- `resetGuardrailsService()` available for testing

## Integration Points

The GuardrailsService should be integrated at the following points:

1. **Server Actions**: Validate all user input before processing
2. **AI Flows**: Pre-validate prompts before Bedrock calls
3. **Logging**: Sanitize prompts before logging to CloudWatch
4. **Storage**: Check for PII before storing conversation history

## Requirements Validation

- ✅ **Requirement 1.1**: Domain validation implemented with comprehensive keyword matching
- ✅ **Requirement 1.2**: Financial guarantee and legal advice detection implemented
- ✅ **Requirement 1.3**: PII detection and sanitization implemented with context awareness
- ✅ **Requirement 1.4**: Unethical/illegal activity detection implemented

## Next Steps

The guardrails implementation is complete and ready for integration with:

- Agent Profile Management (Task 3)
- Citation Service (Task 4)
- Response Enhancement Layer (Task 5)
- Worker Agents (Task 6)
- Workflow Orchestrator (Task 7)

All subsequent components should use the GuardrailsService to validate inputs before processing.
