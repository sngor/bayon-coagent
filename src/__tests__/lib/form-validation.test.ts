/**
 * Form Validation Tests
 * 
 * Comprehensive tests for form validation utilities including
 * FormData conversion, CSRF protection, and validation schemas.
 */

import {
  formDataToObject,
  generateCSRFToken,
  validateCSRFToken,
  sanitizeString,
  sanitizeObject,
  CommonSchemas,
  createValidationErrorResponse,
  createSuccessResponse,
  createErrorResponse,
  validateFormData,
} from '@/lib/form-validation';
import { z } from 'zod';

// Test schema for validation
const TestSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(0, 'Age must be positive'),
  tags: z.array(z.string()).optional(),
});

describe('Form Validation', () => {
  describe('formDataToObject', () => {
    it('should convert simple FormData to object', () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');
      formData.append('age', '30');

      const schema = z.object({
        name: z.string(),
        email: z.string(),
        age: z.string().transform(val => parseInt(val, 10)),
      });

      const result = formDataToObject(formData, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.age).toBe(30);
      }
    });

    it('should handle multiple values for same key', () => {
      const formData = new FormData();
      formData.append('tags', 'tag1');
      formData.append('tags', 'tag2');
      formData.append('tags', 'tag3');

      const schema = z.object({
        tags: z.array(z.string()),
      });

      const result = formDataToObject(formData, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['tag1', 'tag2', 'tag3']);
      }
    });

    it('should handle file uploads', () => {
      const formData = new FormData();
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);
      formData.append('name', 'Test');

      const schema = z.object({
        file: z.instanceof(File),
        name: z.string(),
      });

      const result = formDataToObject(formData, schema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBeInstanceOf(File);
        expect(result.data.file.name).toBe('test.txt');
        expect(result.data.name).toBe('Test');
      }
    });

    it('should validate file size limits', () => {
      const formData = new FormData();
      const largeContent = 'a'.repeat(2000);
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      formData.append('file', file);

      const schema = z.object({
        file: z.instanceof(File),
      });

      const result = formDataToObject(formData, schema, {
        maxFileSize: 1000, // 1KB limit
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
    });

    it('should validate file types', () => {
      const formData = new FormData();
      const file = new File(['content'], 'test.exe', { type: 'application/x-executable' });
      formData.append('file', file);

      const schema = z.object({
        file: z.instanceof(File),
      });

      const result = formDataToObject(formData, schema, {
        allowedFileTypes: ['image/jpeg', 'image/png', 'text/plain'],
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_TYPE');
    });

    it('should handle CSRF validation', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('_csrf', 'valid-token');
      formData.append('_expectedCSRF', 'valid-token');

      const schema = z.object({
        name: z.string(),
      });

      const result = formDataToObject(formData, schema, {
        requireCSRF: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        // CSRF tokens should be removed from data
        expect('_csrf' in result.data).toBe(false);
        expect('_expectedCSRF' in result.data).toBe(false);
      }
    });

    it('should reject invalid CSRF tokens', () => {
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('_csrf', 'invalid-token');
      formData.append('_expectedCSRF', 'valid-token');

      const schema = z.object({
        name: z.string(),
      });

      const result = formDataToObject(formData, schema, {
        requireCSRF: true,
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CSRF_INVALID');
    });

    it('should sanitize input when requested', () => {
      const formData = new FormData();
      formData.append('name', '  John<script>alert(1)</script>  ');
      formData.append('bio', 'Hello<>World');

      const schema = z.object({
        name: z.string(),
        bio: z.string(),
      });

      const result = formDataToObject(formData, schema, {
        sanitizeInput: true,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John');
        expect(result.data.bio).toBe('HelloWorld');
      }
    });

    it('should return validation errors', () => {
      const formData = new FormData();
      formData.append('name', '');
      formData.append('email', 'invalid-email');
      formData.append('age', '-5');

      const result = formDataToObject(formData, TestSchema);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
      expect(result.error?.details).toBeDefined();
      expect(result.error?.details?.name).toContain('Name is required');
      expect(result.error?.details?.email).toContain('Invalid email');
    });
  });

  describe('CSRF Protection', () => {
    it('should generate valid CSRF tokens', () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should validate matching CSRF tokens', () => {
      const token = 'test-token-123';
      expect(validateCSRFToken(token, token)).toBe(true);
    });

    it('should reject mismatched CSRF tokens', () => {
      expect(validateCSRFToken('token1', 'token2')).toBe(false);
    });

    it('should reject empty CSRF tokens', () => {
      expect(validateCSRFToken('', 'token')).toBe(false);
      expect(validateCSRFToken('token', '')).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    describe('sanitizeString', () => {
      it('should remove HTML tags', () => {
        const input = 'Hello<script>alert(1)</script>World';
        const result = sanitizeString(input);
        expect(result).toBe('HelloWorld');
      });

      it('should remove javascript protocols', () => {
        const input = 'javascript:alert(1)';
        const result = sanitizeString(input);
        expect(result).toBe('');
      });

      it('should remove event handlers', () => {
        const input = 'onclick=alert(1)';
        const result = sanitizeString(input);
        expect(result).toBe('');
      });

      it('should trim whitespace', () => {
        const input = '  hello world  ';
        const result = sanitizeString(input);
        expect(result).toBe('hello world');
      });
    });

    describe('sanitizeObject', () => {
      it('should sanitize string values', () => {
        const input = {
          name: '  John<script>  ',
          bio: 'Hello<>World',
          age: 30,
        };

        const result = sanitizeObject(input);
        expect(result.name).toBe('John');
        expect(result.bio).toBe('HelloWorld');
        expect(result.age).toBe(30);
      });

      it('should sanitize array values', () => {
        const input = {
          tags: ['  tag1<script>  ', 'tag2<>'],
          numbers: [1, 2, 3],
        };

        const result = sanitizeObject(input);
        expect(result.tags).toEqual(['tag1', 'tag2']);
        expect(result.numbers).toEqual([1, 2, 3]);
      });
    });
  });

  describe('Common Schemas', () => {
    describe('email schema', () => {
      it('should validate correct emails', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.org',
        ];

        validEmails.forEach(email => {
          expect(() => CommonSchemas.email.parse(email)).not.toThrow();
        });
      });

      it('should reject invalid emails', () => {
        const invalidEmails = [
          'invalid-email',
          'test@',
          '@example.com',
          'test..test@example.com',
        ];

        invalidEmails.forEach(email => {
          expect(() => CommonSchemas.email.parse(email)).toThrow();
        });
      });
    });

    describe('password schema', () => {
      it('should validate strong passwords', () => {
        const strongPasswords = [
          'MyStr0ng!Password',
          'C0mplex#Pass123',
          'Secure$Password2024',
        ];

        strongPasswords.forEach(password => {
          expect(() => CommonSchemas.password.parse(password)).not.toThrow();
        });
      });

      it('should reject weak passwords', () => {
        const weakPasswords = [
          'password',
          '123456',
          'short',
          'NoNumbers!',
          'nonumbers123',
          'NoSpecialChars123',
        ];

        weakPasswords.forEach(password => {
          expect(() => CommonSchemas.password.parse(password)).toThrow();
        });
      });
    });

    describe('phone schema', () => {
      it('should validate phone numbers', () => {
        const validPhones = [
          '+1 (555) 123-4567',
          '555-123-4567',
          '15551234567',
          '+44 20 7946 0958',
        ];

        validPhones.forEach(phone => {
          expect(() => CommonSchemas.phone.parse(phone)).not.toThrow();
        });
      });

      it('should reject invalid phone numbers', () => {
        const invalidPhones = [
          '123',
          'abc-def-ghij',
          '555-123',
        ];

        invalidPhones.forEach(phone => {
          expect(() => CommonSchemas.phone.parse(phone)).toThrow();
        });
      });
    });

    describe('url schema', () => {
      it('should validate URLs', () => {
        const validUrls = [
          'https://example.com',
          'http://localhost:3000',
          'https://subdomain.example.com/path?query=value',
        ];

        validUrls.forEach(url => {
          expect(() => CommonSchemas.url.parse(url)).not.toThrow();
        });
      });

      it('should reject invalid URLs', () => {
        const invalidUrls = [
          'not-a-url',
          'ftp://example.com',
          'javascript:alert(1)',
        ];

        invalidUrls.forEach(url => {
          expect(() => CommonSchemas.url.parse(url)).toThrow();
        });
      });
    });
  });

  describe('Response Helpers', () => {
    describe('createValidationErrorResponse', () => {
      it('should create validation error response', () => {
        const error = {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { name: ['Name is required'] },
        };

        const response = createValidationErrorResponse(error, { previousData: 'test' });

        expect(response.success).toBe(false);
        expect(response.message).toBe('Validation failed');
        expect(response.errors).toEqual({ name: ['Name is required'] });
        expect(response.data).toEqual({ previousData: 'test' });
      });
    });

    describe('createSuccessResponse', () => {
      it('should create success response', () => {
        const data = { id: 1, name: 'Test' };
        const response = createSuccessResponse(data, 'Operation successful');

        expect(response.success).toBe(true);
        expect(response.message).toBe('Operation successful');
        expect(response.data).toEqual(data);
        expect(response.errors).toEqual({});
      });

      it('should use default message', () => {
        const response = createSuccessResponse({ test: true });
        expect(response.message).toBe('Operation completed successfully');
      });
    });

    describe('createErrorResponse', () => {
      it('should create error response', () => {
        const errors = { field1: ['Error 1'], field2: ['Error 2'] };
        const response = createErrorResponse('Something went wrong', errors, { prev: 'data' });

        expect(response.success).toBe(false);
        expect(response.message).toBe('Something went wrong');
        expect(response.errors).toEqual(errors);
        expect(response.data).toEqual({ prev: 'data' });
      });
    });
  });

  describe('validateFormData', () => {
    it('should validate form data with default options', () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('email', 'john@example.com');
      formData.append('age', '30');
      formData.append('_csrf', 'token123');
      formData.append('_expectedCSRF', 'token123');

      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
        age: z.string().transform(val => parseInt(val, 10)),
      });

      const result = validateFormData(schema, formData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
        expect(result.data.age).toBe(30);
      }
    });

    it('should return validation errors', () => {
      const formData = new FormData();
      formData.append('name', '');
      formData.append('email', 'invalid');
      formData.append('_csrf', 'token123');
      formData.append('_expectedCSRF', 'token123');

      const result = validateFormData(TestSchema, formData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });
});