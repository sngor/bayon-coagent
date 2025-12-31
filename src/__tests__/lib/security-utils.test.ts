/**
 * Security Utilities Tests
 * 
 * Comprehensive tests for security utilities including input sanitization,
 * CSRF protection, rate limiting, and password validation.
 */

import {
  sanitizeHtml,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeUrl,
  generateCSRFToken,
  validateCSRFToken,
  validatePasswordStrength,
  generateSecurePassword,
  SecuritySchemas,
  AuditLogger,
} from '@/lib/security-utils';

describe('Security Utils', () => {
  describe('Input Sanitization', () => {
    describe('sanitizeHtml', () => {
      it('should remove script tags', () => {
        const input = '<p>Hello</p><script>alert("xss")</script>';
        const result = sanitizeHtml(input);
        expect(result).toBe('<p>Hello</p>');
        expect(result).not.toContain('script');
      });

      it('should remove iframe tags', () => {
        const input = '<div>Content</div><iframe src="evil.com"></iframe>';
        const result = sanitizeHtml(input);
        expect(result).toBe('<div>Content</div>');
        expect(result).not.toContain('iframe');
      });

      it('should remove javascript protocols', () => {
        const input = '<a href="javascript:alert(1)">Click</a>';
        const result = sanitizeHtml(input);
        expect(result).not.toContain('javascript:');
      });

      it('should remove event handlers', () => {
        const input = '<div onclick="alert(1)">Click me</div>';
        const result = sanitizeHtml(input);
        expect(result).not.toContain('onclick');
      });

      it('should preserve safe HTML', () => {
        const input = '<p><strong>Bold text</strong> and <em>italic</em></p>';
        const result = sanitizeHtml(input);
        expect(result).toContain('<p>');
        expect(result).toContain('<strong>');
        expect(result).toContain('<em>');
      });
    });

    describe('sanitizeInput', () => {
      it('should trim whitespace', () => {
        const input = '  hello world  ';
        const result = sanitizeInput(input);
        expect(result).toBe('hello world');
      });

      it('should remove control characters', () => {
        const input = 'hello\x00\x1F\x7Fworld';
        const result = sanitizeInput(input);
        expect(result).toBe('helloworld');
      });

      it('should remove HTML brackets', () => {
        const input = 'hello<>world';
        const result = sanitizeInput(input);
        expect(result).toBe('helloworld');
      });

      it('should limit length', () => {
        const input = 'a'.repeat(20000);
        const result = sanitizeInput(input);
        expect(result.length).toBe(10000);
      });
    });

    describe('sanitizeEmail', () => {
      it('should normalize valid emails', () => {
        const input = '  TEST@EXAMPLE.COM  ';
        const result = sanitizeEmail(input);
        expect(result).toBe('test@example.com');
      });

      it('should throw for invalid emails', () => {
        expect(() => sanitizeEmail('invalid-email')).toThrow('Invalid email format');
        expect(() => sanitizeEmail('test@')).toThrow('Invalid email format');
        expect(() => sanitizeEmail('@example.com')).toThrow('Invalid email format');
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
        ];

        validEmails.forEach(email => {
          expect(() => sanitizeEmail(email)).not.toThrow();
        });
      });
    });

    describe('sanitizePhoneNumber', () => {
      it('should preserve valid phone formats', () => {
        const validPhones = [
          '+1 (555) 123-4567',
          '555-123-4567',
          '15551234567',
          '+44 20 7946 0958',
        ];

        validPhones.forEach(phone => {
          expect(() => sanitizePhoneNumber(phone)).not.toThrow();
        });
      });

      it('should throw for invalid phone numbers', () => {
        expect(() => sanitizePhoneNumber('123')).toThrow('Invalid phone number format');
        expect(() => sanitizePhoneNumber('abc-def-ghij')).toThrow('Invalid phone number format');
      });

      it('should remove invalid characters', () => {
        const input = '+1 (555) 123-4567 ext. 123';
        const result = sanitizePhoneNumber(input);
        expect(result).not.toContain('ext');
        expect(result).not.toContain('.');
      });
    });

    describe('sanitizeUrl', () => {
      it('should accept valid URLs', () => {
        const validUrls = [
          'https://example.com',
          'http://localhost:3000',
          'https://subdomain.example.com/path?query=value',
        ];

        validUrls.forEach(url => {
          expect(() => sanitizeUrl(url)).not.toThrow();
        });
      });

      it('should throw for invalid protocols', () => {
        expect(() => sanitizeUrl('javascript:alert(1)')).toThrow('Invalid URL protocol');
        expect(() => sanitizeUrl('ftp://example.com')).toThrow('Invalid URL protocol');
      });

      it('should throw for malformed URLs', () => {
        expect(() => sanitizeUrl('not-a-url')).toThrow('Invalid URL format');
        expect(() => sanitizeUrl('http://')).toThrow('Invalid URL format');
      });
    });
  });

  describe('CSRF Protection', () => {
    describe('generateCSRFToken', () => {
      it('should generate a token', () => {
        const token = generateCSRFToken();
        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('should generate unique tokens', () => {
        const token1 = generateCSRFToken();
        const token2 = generateCSRFToken();
        expect(token1).not.toBe(token2);
      });

      it('should generate hex tokens', () => {
        const token = generateCSRFToken();
        expect(token).toMatch(/^[a-f0-9]+$/);
      });
    });

    describe('validateCSRFToken', () => {
      it('should validate matching tokens', () => {
        const token = 'abc123';
        expect(validateCSRFToken(token, token)).toBe(true);
      });

      it('should reject non-matching tokens', () => {
        expect(validateCSRFToken('abc123', 'def456')).toBe(false);
      });

      it('should reject empty tokens', () => {
        expect(validateCSRFToken('', 'abc123')).toBe(false);
        expect(validateCSRFToken('abc123', '')).toBe(false);
        expect(validateCSRFToken('', '')).toBe(false);
      });

      it('should reject tokens of different lengths', () => {
        expect(validateCSRFToken('abc', 'abcdef')).toBe(false);
      });
    });
  });

  describe('Password Security', () => {
    describe('validatePasswordStrength', () => {
      it('should accept strong passwords', () => {
        const strongPasswords = [
          'MyStr0ng!Password',
          'C0mplex#Pass123',
          'Secure$Password2024',
        ];

        strongPasswords.forEach(password => {
          const result = validatePasswordStrength(password);
          expect(result.isValid).toBe(true);
          expect(result.score).toBeGreaterThanOrEqual(4);
          expect(result.feedback).toHaveLength(0);
        });
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'password',
          '123456',
          'abc',
          'PASSWORD',
          '12345678',
        ];

        weakPasswords.forEach(password => {
          const result = validatePasswordStrength(password);
          expect(result.isValid).toBe(false);
          expect(result.feedback.length).toBeGreaterThan(0);
        });
      });

      it('should provide specific feedback', () => {
        const result = validatePasswordStrength('abc');
        expect(result.feedback).toContain('Password must be at least 8 characters long');
        expect(result.feedback).toContain('Password must contain uppercase letters');
        expect(result.feedback).toContain('Password must contain numbers');
        expect(result.feedback).toContain('Password must contain special characters');
      });

      it('should reject common passwords', () => {
        const result = validatePasswordStrength('password');
        expect(result.isValid).toBe(false);
        expect(result.feedback).toContain('Password is too common');
      });

      it('should penalize repeating characters', () => {
        const result = validatePasswordStrength('Aaaa1111!!!!');
        expect(result.score).toBeLessThan(6);
        expect(result.feedback).toContain('Avoid repeating characters');
      });
    });

    describe('generateSecurePassword', () => {
      it('should generate password of specified length', () => {
        const password = generateSecurePassword(16);
        expect(password.length).toBe(16);
      });

      it('should generate password with default length', () => {
        const password = generateSecurePassword();
        expect(password.length).toBe(16);
      });

      it('should include all character types', () => {
        const password = generateSecurePassword(20);
        expect(password).toMatch(/[a-z]/); // lowercase
        expect(password).toMatch(/[A-Z]/); // uppercase
        expect(password).toMatch(/[0-9]/); // numbers
        expect(password).toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/); // symbols
      });

      it('should generate unique passwords', () => {
        const password1 = generateSecurePassword();
        const password2 = generateSecurePassword();
        expect(password1).not.toBe(password2);
      });

      it('should pass strength validation', () => {
        const password = generateSecurePassword();
        const validation = validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
      });
    });
  });

  describe('Security Schemas', () => {
    describe('email schema', () => {
      it('should validate and transform emails', () => {
        const result = SecuritySchemas.email.parse('  TEST@EXAMPLE.COM  ');
        expect(result).toBe('test@example.com');
      });

      it('should reject invalid emails', () => {
        expect(() => SecuritySchemas.email.parse('invalid')).toThrow();
      });

      it('should reject overly long emails', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        expect(() => SecuritySchemas.email.parse(longEmail)).toThrow();
      });
    });

    describe('password schema', () => {
      it('should accept strong passwords', () => {
        const result = SecuritySchemas.password.parse('MyStr0ng!Password');
        expect(result).toBe('MyStr0ng!Password');
      });

      it('should reject weak passwords', () => {
        expect(() => SecuritySchemas.password.parse('weak')).toThrow();
        expect(() => SecuritySchemas.password.parse('password')).toThrow();
      });
    });

    describe('safeString schema', () => {
      it('should sanitize input', () => {
        const result = SecuritySchemas.safeString.parse('  hello<>world  ');
        expect(result).toBe('helloworld');
      });

      it('should reject overly long strings', () => {
        const longString = 'a'.repeat(20000);
        expect(() => SecuritySchemas.safeString.parse(longString)).toThrow();
      });
    });

    describe('htmlContent schema', () => {
      it('should sanitize HTML', () => {
        const result = SecuritySchemas.htmlContent.parse('<p>Hello</p><script>alert(1)</script>');
        expect(result).toBe('<p>Hello</p>');
      });
    });
  });

  describe('AuditLogger', () => {
    let logger: AuditLogger;

    beforeEach(() => {
      logger = new AuditLogger();
    });

    afterEach(() => {
      logger.clearLogs();
    });

    it('should log audit entries', () => {
      logger.log({
        userId: 'user123',
        action: 'login',
        resource: 'auth',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      const logs = logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('user123');
      expect(logs[0].action).toBe('login');
      expect(logs[0].success).toBe(true);
      expect(logs[0].timestamp).toBeDefined();
    });

    it('should filter logs by user ID', () => {
      logger.log({
        userId: 'user1',
        action: 'login',
        resource: 'auth',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      logger.log({
        userId: 'user2',
        action: 'logout',
        resource: 'auth',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      const user1Logs = logger.getLogs('user1');
      expect(user1Logs).toHaveLength(1);
      expect(user1Logs[0].userId).toBe('user1');
    });

    it('should clear all logs', () => {
      logger.log({
        action: 'test',
        resource: 'test',
        ip: '127.0.0.1',
        userAgent: 'test-agent',
        success: true,
      });

      expect(logger.getLogs()).toHaveLength(1);
      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });
  });
});