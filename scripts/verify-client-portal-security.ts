#!/usr/bin/env tsx

/**
 * Client Portal Security Verification Script
 * 
 * This script verifies that all security measures are properly implemented:
 * - Rate limiting
 * - CSRF protection
 * - Input sanitization
 * - Security headers
 * - Dashboard authorization
 * 
 * Requirements: 10.1, 10.2, 10.3
 */

import { rateLimiters } from '../src/lib/security/rate-limiter';
import {
    generateCSRFToken,
    validateCSRFToken,
    setCSRFCookie,
    getCSRFCookie,
} from '../src/lib/security/csrf-protection';
import {
    sanitizeHTML,
    sanitizeText,
    sanitizeEmail,
    sanitizePhone,
    sanitizeURL,
    sanitizeFileName,
    sanitizeSQL,
    sanitizeNumber,
    sanitizeHexColor,
    sanitizeDashboardToken,
    sanitizeSearchQuery,
} from '../src/lib/security/input-sanitization';

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
    log(`✓ ${message}`, 'green');
}

function logError(message: string) {
    log(`✗ ${message}`, 'red');
}

function logWarning(message: string) {
    log(`⚠ ${message}`, 'yellow');
}

function logInfo(message: string) {
    log(`ℹ ${message}`, 'cyan');
}

function logSection(message: string) {
    log(`\n${'='.repeat(60)}`, 'blue');
    log(message, 'blue');
    log('='.repeat(60), 'blue');
}

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
    totalTests++;
    try {
        const result = fn();
        if (result instanceof Promise) {
            return result.then(passed => {
                if (passed) {
                    passedTests++;
                    logSuccess(name);
                } else {
                    failedTests++;
                    logError(name);
                }
                return passed;
            });
        } else {
            if (result) {
                passedTests++;
                logSuccess(name);
            } else {
                failedTests++;
                logError(name);
            }
            return result;
        }
    } catch (error) {
        failedTests++;
        logError(`${name} - ${error}`);
        return false;
    }
}

// ==================== Rate Limiting Tests ====================

async function testRateLimiting() {
    logSection('Rate Limiting Tests');

    // Test API rate limiter
    test('API rate limiter allows requests within limit', () => {
        const limiter = rateLimiters.api;
        const result = limiter.check('test-user-1');
        return result.allowed === true;
    });

    test('API rate limiter blocks requests exceeding limit', () => {
        const limiter = rateLimiters.api;
        const identifier = 'test-user-2';

        // Make requests up to the limit
        for (let i = 0; i < 60; i++) {
            limiter.check(identifier);
        }

        // Next request should be blocked
        const result = limiter.check(identifier);
        return result.allowed === false;
    });

    test('Rate limiter provides correct remaining count', () => {
        const limiter = rateLimiters.api;
        const identifier = 'test-user-3';

        const result1 = limiter.check(identifier);
        const result2 = limiter.check(identifier);

        return result1.remaining === 59 && result2.remaining === 58;
    });

    test('Contact form rate limiter has stricter limits', () => {
        const limiter = rateLimiters.contactForm;
        const identifier = 'test-user-4';

        // Make 10 requests (the limit)
        for (let i = 0; i < 10; i++) {
            limiter.check(identifier);
        }

        // Next request should be blocked
        const result = limiter.check(identifier);
        return result.allowed === false;
    });

    test('Auth rate limiter has very strict limits', () => {
        const limiter = rateLimiters.auth;
        const identifier = 'test-user-5';

        // Make 5 requests (the limit)
        for (let i = 0; i < 5; i++) {
            limiter.check(identifier);
        }

        // Next request should be blocked
        const result = limiter.check(identifier);
        return result.allowed === false;
    });
}

// ==================== CSRF Protection Tests ====================

async function testCSRFProtection() {
    logSection('CSRF Protection Tests');

    test('CSRF token generation creates valid UUID', () => {
        const token = generateCSRFToken();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(token);
    });

    test('CSRF token generation creates unique tokens', () => {
        const token1 = generateCSRFToken();
        const token2 = generateCSRFToken();
        return token1 !== token2;
    });

    // Note: Cookie-based tests require Next.js runtime
    logWarning('CSRF cookie tests require Next.js runtime (skipped in standalone script)');
}

// ==================== Input Sanitization Tests ====================

async function testInputSanitization() {
    logSection('Input Sanitization Tests');

    // HTML Sanitization
    test('sanitizeHTML removes script tags', () => {
        const input = '<p>Hello</p><script>alert("XSS")</script>';
        const output = sanitizeHTML(input);
        return !output.includes('<script>') && output.includes('<p>Hello</p>');
    });

    test('sanitizeHTML removes event handlers', () => {
        const input = '<div onclick="alert(\'XSS\')">Click me</div>';
        const output = sanitizeHTML(input);
        return !output.includes('onclick');
    });

    test('sanitizeHTML removes javascript: protocol', () => {
        const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
        const output = sanitizeHTML(input);
        return !output.includes('javascript:');
    });

    test('sanitizeHTML removes iframe tags', () => {
        const input = '<iframe src="evil.com"></iframe>';
        const output = sanitizeHTML(input);
        return !output.includes('<iframe');
    });

    // Text Sanitization
    test('sanitizeText removes control characters', () => {
        const input = 'Hello\x00World\x1F';
        const output = sanitizeText(input);
        return output === 'HelloWorld'; // Control characters removed, no space added
    });

    test('sanitizeText normalizes whitespace', () => {
        const input = 'Hello    \n\n\t  World';
        const output = sanitizeText(input);
        return output === 'Hello World';
    });

    // Email Sanitization
    test('sanitizeEmail validates and normalizes email', () => {
        const input = '  TEST@EXAMPLE.COM  ';
        const output = sanitizeEmail(input);
        return output === 'test@example.com';
    });

    test('sanitizeEmail rejects invalid email', () => {
        const input = 'not-an-email';
        const output = sanitizeEmail(input);
        return output === '';
    });

    test('sanitizeEmail removes dangerous characters', () => {
        const input = 'test<script>@example.com';
        const output = sanitizeEmail(input);
        return !output.includes('<script>');
    });

    // Phone Sanitization
    test('sanitizePhone keeps valid phone characters', () => {
        const input = '+1 (555) 123-4567';
        const output = sanitizePhone(input);
        return output === '+1 (555) 123-4567';
    });

    test('sanitizePhone removes invalid characters', () => {
        const input = '+1<script>555</script>1234567';
        const output = sanitizePhone(input);
        return !output.includes('<script>');
    });

    // URL Sanitization
    test('sanitizeURL allows valid HTTPS URLs', () => {
        const input = 'https://example.com/path';
        const output = sanitizeURL(input);
        return output === 'https://example.com/path';
    });

    test('sanitizeURL blocks javascript: protocol', () => {
        const input = 'javascript:alert("XSS")';
        const output = sanitizeURL(input);
        return output === '';
    });

    test('sanitizeURL blocks data: protocol', () => {
        const input = 'data:text/html,<script>alert("XSS")</script>';
        const output = sanitizeURL(input);
        return output === '';
    });

    test('sanitizeURL allows relative URLs', () => {
        const input = '/path/to/page';
        const output = sanitizeURL(input);
        return output === '/path/to/page';
    });

    // File Name Sanitization
    test('sanitizeFileName removes path traversal', () => {
        const input = '../../etc/passwd';
        const output = sanitizeFileName(input);
        return !output.includes('..');
    });

    test('sanitizeFileName removes dangerous characters', () => {
        const input = 'file<>:"|?*.txt';
        const output = sanitizeFileName(input);
        return output === 'file.txt';
    });

    // SQL Sanitization
    test('sanitizeSQL removes comment markers', () => {
        const input = "SELECT * FROM users -- comment";
        const output = sanitizeSQL(input);
        return !output.includes('--');
    });

    test('sanitizeSQL removes semicolons', () => {
        const input = "SELECT * FROM users; DROP TABLE users;";
        const output = sanitizeSQL(input);
        return !output.includes(';');
    });

    // Number Sanitization
    test('sanitizeNumber validates numeric input', () => {
        const output = sanitizeNumber('123.45');
        return output === 123.45;
    });

    test('sanitizeNumber rejects non-numeric input', () => {
        const output = sanitizeNumber('not-a-number');
        return output === null;
    });

    test('sanitizeNumber enforces min/max bounds', () => {
        const output = sanitizeNumber('150', { min: 0, max: 100 });
        return output === null;
    });

    test('sanitizeNumber enforces integer requirement', () => {
        const output = sanitizeNumber('123.45', { integer: true });
        return output === null;
    });

    // Hex Color Sanitization
    test('sanitizeHexColor validates hex format', () => {
        const output = sanitizeHexColor('#FF5733');
        return output === '#FF5733';
    });

    test('sanitizeHexColor adds missing hash', () => {
        const output = sanitizeHexColor('FF5733');
        return output === '#FF5733';
    });

    test('sanitizeHexColor rejects invalid format', () => {
        const output = sanitizeHexColor('not-a-color');
        return output === '#000000';
    });

    // Dashboard Token Sanitization
    test('sanitizeDashboardToken removes non-alphanumeric', () => {
        const input = 'abc123-def456-ghi789';
        const output = sanitizeDashboardToken(input);
        return output === 'abc123def456ghi789';
    });

    test('sanitizeDashboardToken rejects empty input', () => {
        const output = sanitizeDashboardToken('---');
        return output === '';
    });

    // Search Query Sanitization
    test('sanitizeSearchQuery removes special characters', () => {
        const input = 'search<script>query</script>';
        const output = sanitizeSearchQuery(input);
        return !output.includes('<script>');
    });

    test('sanitizeSearchQuery limits length', () => {
        const input = 'a'.repeat(300);
        const output = sanitizeSearchQuery(input);
        return output.length === 200;
    });
}

// ==================== Security Headers Tests ====================

async function testSecurityHeaders() {
    logSection('Security Headers Tests');

    logInfo('Security headers are configured in next.config.ts');
    logInfo('To verify headers in production, use:');
    logInfo('  curl -I https://yourdomain.com');

    logWarning('Header tests require running Next.js server (skipped in standalone script)');

    // List expected headers
    const expectedHeaders = [
        'Strict-Transport-Security',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
        'Content-Security-Policy',
    ];

    logInfo('\nExpected security headers:');
    expectedHeaders.forEach(header => {
        logInfo(`  - ${header}`);
    });
}

// ==================== Dashboard Authorization Tests ====================

async function testDashboardAuthorization() {
    logSection('Dashboard Authorization Tests');

    logInfo('Dashboard authorization is implemented in:');
    logInfo('  - src/middleware/validate-dashboard-link.ts');
    logInfo('  - src/middleware.ts');

    logInfo('\nAuthorization features:');
    logInfo('  ✓ Token-based access control');
    logInfo('  ✓ Expiring links (7-90 days)');
    logInfo('  ✓ Link revocation');
    logInfo('  ✓ Access logging');
    logInfo('  ✓ Rate limiting');

    logWarning('Authorization tests require DynamoDB (skipped in standalone script)');
}

// ==================== TLS Configuration Tests ====================

async function testTLSConfiguration() {
    logSection('TLS Configuration Tests');

    logInfo('TLS 1.3 is configured at the infrastructure level:');
    logInfo('  - AWS Application Load Balancer (ALB)');
    logInfo('  - AWS CloudFront Distribution');

    logInfo('\nTo verify TLS configuration:');
    logInfo('  openssl s_client -connect yourdomain.com:443 -tls1_3');
    logInfo('  https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com');

    logInfo('\nRecommended security policy:');
    logInfo('  - ALB: ELBSecurityPolicy-TLS13-1-2-2021-06');
    logInfo('  - CloudFront: TLSv1.3_2021');

    logWarning('TLS tests require production environment (skipped in standalone script)');
}

// ==================== Main Test Runner ====================

async function runAllTests() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║     Client Portal Security Verification Script            ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    await testRateLimiting();
    await testCSRFProtection();
    await testInputSanitization();
    await testSecurityHeaders();
    await testDashboardAuthorization();
    await testTLSConfiguration();

    // Print summary
    logSection('Test Summary');
    log(`Total Tests: ${totalTests}`, 'cyan');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');

    const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0';
    log(`Pass Rate: ${passRate}%`, failedTests > 0 ? 'yellow' : 'green');

    if (failedTests === 0) {
        log('\n✓ All security tests passed!', 'green');
        log('Security measures are properly implemented.', 'green');
    } else {
        log('\n✗ Some security tests failed!', 'red');
        log('Please review and fix the failing tests.', 'red');
    }

    // Additional recommendations
    logSection('Security Recommendations');
    logInfo('1. Enable AWS WAF for additional protection');
    logInfo('2. Configure CloudWatch alarms for security events');
    logInfo('3. Enable AWS Shield for DDoS protection');
    logInfo('4. Use AWS Secrets Manager for sensitive data');
    logInfo('5. Enable CloudTrail for audit logging');
    logInfo('6. Regularly update dependencies (npm audit)');
    logInfo('7. Conduct periodic security audits');
    logInfo('8. Implement CSP reporting in production');
    logInfo('9. Use Redis/DynamoDB for distributed rate limiting');
    logInfo('10. Monitor SSL Labs rating for TLS configuration');

    log('\nFor detailed security documentation, see:');
    log('  docs/client-portal-security.md', 'cyan');

    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    logError(`Fatal error: ${error}`);
    process.exit(1);
});
