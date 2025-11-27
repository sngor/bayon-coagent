# Client Portal Security Implementation

This document describes the security measures implemented for the Client Portal feature to protect against common web vulnerabilities and ensure data security.

## Overview

The Client Portal implements multiple layers of security to protect both agent and client data:

1. **Rate Limiting** - Prevents scraping and abuse
2. **CSRF Protection** - Protects against Cross-Site Request Forgery attacks
3. **Input Sanitization** - Prevents injection attacks (XSS, SQL injection, etc.)
4. **Security Headers** - Implements industry-standard HTTP security headers
5. **TLS 1.3** - Ensures encrypted communication
6. **Authorization** - Token-based access control with expiration

## Security Measures

### 1. Rate Limiting

**Purpose**: Prevent scraping, brute force attacks, and API abuse.

**Implementation**:

- In-memory rate limiter with configurable windows and limits
- Different limits for different endpoints:
  - Authentication: 5 attempts per 15 minutes
  - API endpoints: 60 requests per minute
  - Dashboard access: 60 requests per minute
  - Contact forms: 10 submissions per hour
  - File uploads: 10 uploads per minute

**Location**:

- `src/lib/security/rate-limiter.ts` - Rate limiter implementation
- `src/middleware/validate-dashboard-link.ts` - Dashboard-specific rate limiting
- `src/middleware.ts` - Global middleware integration

**Usage**:

```typescript
import { rateLimiters, checkRateLimit } from "@/lib/security/rate-limiter";

// In API route or server action
const result = await checkRateLimit(request, rateLimiters.api, userId);
if (!result.allowed) {
  return createRateLimitResponse(result);
}
```

**Production Considerations**:

- For multi-instance deployments, use Redis or DynamoDB for distributed rate limiting
- Current implementation uses in-memory storage suitable for single-instance deployments

### 2. CSRF Protection

**Purpose**: Prevent Cross-Site Request Forgery attacks on state-changing operations.

**Implementation**:

- Cryptographically secure token generation using `crypto.randomUUID()`
- Token stored in HTTP-only cookie with `__Host-` prefix
- Token validation using timing-safe comparison
- Automatic token rotation

**Location**:

- `src/lib/security/csrf-protection.ts` - CSRF utilities
- `src/lib/security/secure-action.ts` - Server action wrapper with CSRF

**Usage**:

```typescript
// Server-side: Generate token
import { getCSRFToken } from "@/lib/security/csrf-protection";
const token = await getCSRFToken();

// Client-side: Include in form
<input type="hidden" name="csrf_token" value={token} />;

// Server-side: Validate token
import { validateCSRFToken } from "@/lib/security/csrf-protection";
const isValid = await validateCSRFToken(requestToken);
```

**Protected Operations**:

- All POST, PUT, DELETE, PATCH requests
- Contact form submissions
- Dashboard creation and updates
- Document uploads
- Link generation and revocation

### 3. Input Sanitization

**Purpose**: Prevent injection attacks (XSS, SQL injection, command injection, etc.).

**Implementation**:

- Comprehensive sanitization functions for different input types
- Automatic sanitization in server actions
- Zod schema validation for type safety

**Location**:

- `src/lib/security/input-sanitization.ts` - Sanitization utilities
- `src/lib/security/secure-action.ts` - Automatic sanitization wrapper

**Sanitization Functions**:

- `sanitizeHTML()` - Removes dangerous HTML tags and attributes
- `sanitizeText()` - Removes control characters and normalizes whitespace
- `sanitizeEmail()` - Validates and normalizes email addresses
- `sanitizePhone()` - Removes non-numeric characters
- `sanitizeURL()` - Validates URLs and blocks dangerous protocols
- `sanitizeFileName()` - Prevents path traversal attacks
- `sanitizeSQL()` - Additional protection for SQL inputs (use with parameterized queries)
- `sanitizeJSON()` - Validates and parses JSON safely
- `sanitizeNumber()` - Validates numeric inputs with bounds checking
- `sanitizeHexColor()` - Validates hex color codes
- `sanitizeDashboardToken()` - Validates dashboard access tokens
- `sanitizeSearchQuery()` - Sanitizes search inputs

**Usage**:

```typescript
import { sanitizeText, sanitizeEmail } from "@/lib/security/input-sanitization";

const safeName = sanitizeText(userInput.name);
const safeEmail = sanitizeEmail(userInput.email);
```

**Automatic Sanitization**:
All server actions wrapped with `secureAction()` automatically sanitize common fields:

- Text fields: name, message, notes, description
- Email fields: email, clientEmail, agentEmail
- Phone fields: phone, clientPhone, agentPhone
- URL fields: logoUrl, website

### 4. Security Headers

**Purpose**: Implement defense-in-depth security measures at the HTTP level.

**Implementation**: Configured in `next.config.ts` and applied via middleware.

**Headers Implemented**:

#### Strict-Transport-Security (HSTS)

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- Forces HTTPS for 1 year
- Includes all subdomains
- Eligible for browser preload lists

#### X-Frame-Options

```
X-Frame-Options: DENY
```

- Prevents clickjacking attacks
- Blocks embedding in iframes

#### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

- Prevents MIME type sniffing
- Forces browsers to respect declared content types

#### X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```

- Enables XSS protection in older browsers
- Blocks page rendering if XSS detected

#### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

- Controls referrer information sent with requests
- Balances privacy and functionality

#### Permissions-Policy

```
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

- Restricts browser features
- Disables camera, microphone, geolocation
- Opts out of FLoC/Topics API

#### Content-Security-Policy (CSP)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' data: https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.amazonaws.com https://api.stripe.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

**CSP Directives Explained**:

- `default-src 'self'` - Only load resources from same origin by default
- `script-src` - Allow scripts from self, Stripe, and inline scripts (for Next.js)
- `style-src` - Allow styles from self, Google Fonts, and inline styles
- `font-src` - Allow fonts from self, data URIs, and Google Fonts
- `img-src` - Allow images from self, data URIs, HTTPS, and blob URLs
- `connect-src` - Allow connections to self, AWS services, and Stripe
- `frame-src` - Allow iframes from self and Stripe
- `object-src 'none'` - Block plugins (Flash, Java, etc.)
- `base-uri 'self'` - Restrict base tag to same origin
- `form-action 'self'` - Forms can only submit to same origin
- `frame-ancestors 'none'` - Prevent embedding (same as X-Frame-Options)
- `upgrade-insecure-requests` - Automatically upgrade HTTP to HTTPS

**Production Hardening**:
For production, consider tightening CSP by:

1. Removing `'unsafe-inline'` and `'unsafe-eval'` from `script-src`
2. Using nonces or hashes for inline scripts
3. Implementing CSP reporting to monitor violations

### 5. TLS 1.3 Configuration

**Purpose**: Ensure encrypted communication between clients and servers.

**Implementation**:

- TLS 1.3 is configured at the infrastructure level (AWS ALB/CloudFront)
- HSTS header enforces HTTPS usage
- Certificate management via AWS Certificate Manager (ACM)

**AWS Configuration**:

#### Application Load Balancer (ALB)

```bash
# Security policy: ELBSecurityPolicy-TLS13-1-2-2021-06
aws elbv2 modify-listener \
  --listener-arn <listener-arn> \
  --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06
```

#### CloudFront Distribution

```json
{
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:...",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.3_2021"
  }
}
```

**Verification**:

```bash
# Test TLS version
openssl s_client -connect yourdomain.com:443 -tls1_3

# Check SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

**Certificate Requirements**:

- Use AWS Certificate Manager (ACM) for automatic renewal
- Enable Certificate Transparency logging
- Use 2048-bit or higher RSA keys (or 256-bit ECDSA)

### 6. Authorization and Access Control

**Purpose**: Ensure only authorized users can access dashboard data.

**Implementation**:

- Token-based access control for client dashboards
- Expiring links (7-90 days configurable)
- Link revocation capability
- Access logging and analytics

**Location**:

- `src/middleware/validate-dashboard-link.ts` - Authorization middleware
- `src/app/client-dashboard-actions.ts` - Dashboard management

**Features**:

- Cryptographically secure token generation
- Expiration checking
- Revocation support
- Access count tracking
- Last accessed timestamp
- Audit logging

**Token Format**:

- UUID v4 without hyphens (32 alphanumeric characters)
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Access Flow**:

1. Agent generates secured link with expiration
2. Client accesses dashboard via `/d/{token}`
3. Middleware validates token:
   - Checks token exists
   - Verifies not expired
   - Confirms not revoked
   - Validates dashboard exists
4. Rate limiting applied
5. Access logged for analytics
6. Dashboard data returned if valid

## Security Best Practices

### For Developers

1. **Always use server actions for state-changing operations**

   - Never expose sensitive operations to client-side code
   - Use `'use server'` directive

2. **Validate all inputs with Zod schemas**

   - Define strict schemas for all data types
   - Use `.safeParse()` for validation
   - Return clear error messages

3. **Sanitize user inputs**

   - Use appropriate sanitization functions
   - Sanitize before storage and display
   - Never trust client-side validation alone

4. **Use parameterized queries**

   - DynamoDB SDK handles this automatically
   - Never concatenate user input into queries

5. **Implement proper error handling**

   - Don't expose internal errors to users
   - Log errors server-side
   - Return generic error messages

6. **Use HTTPS everywhere**

   - Never transmit sensitive data over HTTP
   - Use HSTS to enforce HTTPS

7. **Keep dependencies updated**
   - Regularly update npm packages
   - Monitor security advisories
   - Use `npm audit` to check for vulnerabilities

### For Deployment

1. **Enable AWS WAF**

   - Protect against common web exploits
   - Configure rate limiting rules
   - Block malicious IP addresses

2. **Configure CloudWatch Alarms**

   - Monitor error rates
   - Alert on unusual traffic patterns
   - Track failed authentication attempts

3. **Enable AWS Shield**

   - DDoS protection
   - Automatic mitigation

4. **Use AWS Secrets Manager**

   - Store API keys and secrets securely
   - Rotate secrets regularly
   - Never commit secrets to version control

5. **Implement backup and recovery**

   - Regular DynamoDB backups
   - Point-in-time recovery enabled
   - S3 versioning for documents

6. **Monitor and audit**
   - Enable CloudTrail logging
   - Review access logs regularly
   - Set up security alerts

## Testing Security

### Manual Testing

1. **Test CSRF Protection**

   ```bash
   # Try to submit form without CSRF token
   curl -X POST https://yourdomain.com/api/dashboard \
     -d "name=Test" \
     # Should fail with 403
   ```

2. **Test Rate Limiting**

   ```bash
   # Send multiple requests rapidly
   for i in {1..100}; do
     curl https://yourdomain.com/d/token
   done
   # Should return 429 after limit
   ```

3. **Test Input Sanitization**

   - Try XSS payloads: `<script>alert('XSS')</script>`
   - Try SQL injection: `'; DROP TABLE users; --`
   - Try path traversal: `../../etc/passwd`
   - All should be sanitized or rejected

4. **Test Security Headers**

   ```bash
   curl -I https://yourdomain.com
   # Check for security headers in response
   ```

5. **Test TLS Configuration**

   ```bash
   # Test TLS 1.3
   openssl s_client -connect yourdomain.com:443 -tls1_3

   # Test TLS 1.2 (should work)
   openssl s_client -connect yourdomain.com:443 -tls1_2

   # Test TLS 1.1 (should fail)
   openssl s_client -connect yourdomain.com:443 -tls1_1
   ```

### Automated Testing

Run the security verification script:

```bash
npm run verify:security
# or
tsx scripts/verify-client-portal-security.ts
```

This script tests:

- Rate limiting functionality
- CSRF token generation and validation
- Input sanitization for various attack vectors
- Security header presence
- Dashboard link authorization

## Compliance

### OWASP Top 10 Coverage

1. **A01:2021 – Broken Access Control** ✅

   - Token-based authorization
   - Expiring links
   - Access logging

2. **A02:2021 – Cryptographic Failures** ✅

   - TLS 1.3 encryption
   - Secure token generation
   - HTTP-only cookies

3. **A03:2021 – Injection** ✅

   - Input sanitization
   - Parameterized queries
   - CSP headers

4. **A04:2021 – Insecure Design** ✅

   - Security by design
   - Defense in depth
   - Principle of least privilege

5. **A05:2021 – Security Misconfiguration** ✅

   - Security headers
   - Secure defaults
   - Error handling

6. **A06:2021 – Vulnerable Components** ✅

   - Regular updates
   - Dependency scanning
   - Security advisories

7. **A07:2021 – Authentication Failures** ✅

   - Rate limiting
   - Secure session management
   - Token expiration

8. **A08:2021 – Software and Data Integrity** ✅

   - Input validation
   - Data sanitization
   - Audit logging

9. **A09:2021 – Logging and Monitoring** ✅

   - Access logging
   - Error logging
   - Analytics tracking

10. **A10:2021 – Server-Side Request Forgery** ✅
    - URL validation
    - Protocol restrictions
    - Input sanitization

## Incident Response

### Security Incident Procedure

1. **Detection**

   - Monitor CloudWatch alarms
   - Review access logs
   - Check error rates

2. **Assessment**

   - Determine scope of incident
   - Identify affected systems
   - Assess data exposure

3. **Containment**

   - Revoke compromised tokens
   - Block malicious IPs
   - Disable affected features

4. **Eradication**

   - Patch vulnerabilities
   - Update dependencies
   - Rotate secrets

5. **Recovery**

   - Restore from backups if needed
   - Re-enable features
   - Monitor for recurrence

6. **Lessons Learned**
   - Document incident
   - Update procedures
   - Improve monitoring

### Emergency Contacts

- **Security Team**: security@yourdomain.com
- **AWS Support**: AWS Support Console
- **On-Call Engineer**: PagerDuty

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HSTS Preload](https://hstspreload.org/)

## Changelog

### 2024-01-XX - Initial Implementation

- Implemented rate limiting for dashboard access
- Added CSRF protection for contact forms
- Implemented comprehensive input sanitization
- Enhanced security headers (CSP, HSTS, X-Frame-Options)
- Documented TLS 1.3 configuration
- Created security verification script
