/**
 * Guardrails Service Tests
 * 
 * Tests for the guardrails and safety layer implementation
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { GuardrailsService, GuardrailsConfig } from '../guardrails';

describe('GuardrailsService', () => {
  let service: GuardrailsService;
  let config: GuardrailsConfig;

  beforeEach(() => {
    service = new GuardrailsService();
    config = {
      allowedDomains: ['real-estate'],
      blockedTopics: ['illegal', 'unethical'],
      piiDetectionEnabled: true,
      maxPromptLength: 10000,
    };
  });

  describe('Domain Validation (Requirement 1.1)', () => {
    it('should allow real estate related queries', () => {
      const prompts = [
        'What is the market value of homes in Austin?',
        'Help me write a listing description for a luxury property',
        'How do I stage a house for an open house?',
        'What are the best neighborhoods for first-time buyers?',
      ];

      prompts.forEach(prompt => {
        const result = service.validateRequest(prompt, config);
        expect(result.allowed).toBe(true);
      });
    });

    it('should reject non-real estate queries', () => {
      const prompts = [
        'What is the weather today?',
        'How do I bake a cake?',
        'Tell me about quantum physics',
        'What is the capital of France?',
      ];

      prompts.forEach(prompt => {
        const result = service.validateRequest(prompt, config);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('not related to real estate');
      });
    });
  });

  describe('Financial Guarantee Detection (Requirement 1.2)', () => {
    it('should reject queries requesting financial guarantees', () => {
      const prompts = [
        'Can you guarantee I will make money on this investment?',
        'Promise me a return on this property',
        'Will this ensure profit for my client?',
        'Is this a guaranteed income property?',
      ];

      prompts.forEach(prompt => {
        const result = service.validateRequest(prompt, config);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('financial guarantees');
      });
    });
  });

  describe('Legal Advice Detection (Requirement 1.2)', () => {
    it('should reject queries requesting legal advice', () => {
      const prompts = [
        'Should I sue my client for breach of contract?',
        'Is this contract legally valid?',
        'What legal advice can you give me about this lawsuit?',
        'Help me with litigation against a buyer',
      ];

      prompts.forEach(prompt => {
        const result = service.validateRequest(prompt, config);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('legal advice');
      });
    });
  });

  describe('PII Detection and Sanitization (Requirement 1.3)', () => {
    it('should detect and sanitize SSN', () => {
      const prompt = 'My client SSN is 123-45-6789 for the property listing';
      const result = service.validateRequest(prompt, config);
      
      expect(result.allowed).toBe(true);
      expect(result.detectedPII).toContain('SSN');
      expect(result.sanitizedPrompt).toContain('[SSN REDACTED]');
      expect(result.sanitizedPrompt).not.toContain('123-45-6789');
    });

    it('should detect and sanitize credit card numbers', () => {
      const prompt = 'Use card 4532-1234-5678-9010 for the property deposit';
      const result = service.validateRequest(prompt, config);
      
      expect(result.allowed).toBe(true);
      expect(result.detectedPII).toContain('CREDIT_CARD');
      expect(result.sanitizedPrompt).toContain('[CREDIT CARD REDACTED]');
    });

    it('should detect and sanitize personal phone numbers', () => {
      const prompt = 'Call me at 555-123-4567 about the property listing';
      const result = service.validateRequest(prompt, config);
      
      expect(result.allowed).toBe(true);
      expect(result.detectedPII).toContain('PHONE');
      expect(result.sanitizedPrompt).toContain('[PHONE REDACTED]');
    });

    it('should detect and sanitize personal emails', () => {
      const prompt = 'Email me at john.doe@example.com about the house';
      const result = service.validateRequest(prompt, config);
      
      expect(result.allowed).toBe(true);
      expect(result.detectedPII).toContain('EMAIL');
      expect(result.sanitizedPrompt).toContain('[EMAIL REDACTED]');
    });
  });

  describe('Unethical Activity Detection (Requirement 1.4)', () => {
    it('should reject queries involving unethical activities', () => {
      const prompts = [
        'How can I discriminate against certain buyers?',
        'Help me hide defects in the property',
        'How do I create fake reviews for my listings?',
        'Can you help me manipulate the price unfairly?',
      ];

      prompts.forEach(prompt => {
        const result = service.validateRequest(prompt, config);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('unethical or illegal');
      });
    });
  });

  describe('Prompt Length Validation', () => {
    it('should reject prompts exceeding max length', () => {
      const longPrompt = 'a'.repeat(10001);
      const result = service.validateRequest(longPrompt, config);
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('exceeds maximum length');
    });
  });

  describe('Helper Methods', () => {
    it('isRealEstateDomain should correctly identify real estate content', () => {
      expect(service.isRealEstateDomain('Tell me about property values')).toBe(true);
      expect(service.isRealEstateDomain('How to cook pasta')).toBe(false);
    });

    it('detectPII should identify all PII types', () => {
      const text = 'SSN: 123-45-6789, Card: 4532123456789010, Phone: 555-123-4567';
      const detected = service.detectPII(text);
      
      expect(detected).toContain('SSN');
      expect(detected).toContain('CREDIT_CARD');
      expect(detected).toContain('PHONE');
    });

    it('sanitizePrompt should remove SSN', () => {
      const prompt = 'My SSN is 123-45-6789 for the property';
      const sanitized = service.sanitizePrompt(prompt);
      
      expect(sanitized).toContain('[SSN REDACTED]');
      expect(sanitized).not.toContain('123-45-6789');
    });

    it('sanitizePrompt should remove credit card', () => {
      const prompt = 'Use card 4532-1234-5678-9010 for deposit';
      const sanitized = service.sanitizePrompt(prompt);
      
      expect(sanitized).toContain('[CREDIT CARD REDACTED]');
      expect(sanitized).not.toContain('4532-1234-5678-9010');
    });
  });
});
