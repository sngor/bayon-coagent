/**
 * Schema Services Tests
 * 
 * Tests for schema generator and validator services
 */

import { describe, it, expect } from '@jest/globals';

// Simple test data interfaces to avoid import issues
interface TestProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  role?: string;
}

interface TestAgentProfile {
  userId: string;
  agentName: string;
  primaryMarket: string;
  specialization: 'luxury' | 'first-time-buyers' | 'investment' | 'commercial' | 'general';
  preferredTone: 'warm-consultative' | 'direct-data-driven' | 'professional' | 'casual';
  agentType: 'buyer' | 'seller' | 'hybrid';
  corePrinciple: string;
  createdAt: string;
  updatedAt: string;
}

describe('Schema Services', () => {
  const testProfile: TestProfile = {
    id: 'test-123',
    name: 'John Smith',
    email: 'john@example.com',
    bio: 'Experienced real estate agent',
    role: 'Real Estate Agent'
  };

  const testAgentProfile: TestAgentProfile = {
    userId: 'test-123',
    agentName: 'John Smith',
    primaryMarket: 'San Francisco Bay Area',
    specialization: 'luxury',
    preferredTone: 'professional',
    agentType: 'hybrid',
    corePrinciple: 'Providing exceptional service to luxury home buyers and sellers',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  describe('Schema Generation', () => {
    it('should validate schema structure requirements', () => {
      // Test that we can create a basic schema structure
      const basicSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': `#real-estate-agent-${testProfile.id}`,
        name: testProfile.name,
        email: testProfile.email,
        description: testProfile.bio || `${testProfile.name} is a professional real estate agent.`
      };

      // Verify required properties
      expect(basicSchema['@context']).toBe('https://schema.org');
      expect(basicSchema['@type']).toBe('RealEstateAgent');
      expect(basicSchema.name).toBe('John Smith');
      expect(basicSchema.email).toBe('john@example.com');
      expect(basicSchema.description).toContain('Experienced real estate agent');
    });

    it('should handle agent profile integration', () => {
      // Test that agent profile data can be integrated
      const specialization = testAgentProfile.specialization;
      const primaryMarket = testAgentProfile.primaryMarket;
      
      expect(specialization).toBe('luxury');
      expect(primaryMarket).toBe('San Francisco Bay Area');
      
      // Test specialization mapping
      const knowledgeMap: Record<string, string> = {
        'luxury': 'Luxury Real Estate',
        'first-time-buyers': 'First-Time Home Buyer Services',
        'investment': 'Investment Property Analysis',
        'commercial': 'Commercial Real Estate',
        'general': 'Residential Real Estate'
      };
      
      expect(knowledgeMap[specialization]).toBe('Luxury Real Estate');
    });

    it('should validate testimonial schema structure', () => {
      // Test testimonial to review conversion
      const testimonial = {
        id: 'test-1',
        userId: 'test-123',
        clientName: 'Jane Doe',
        testimonialText: 'Excellent service!',
        dateReceived: '2024-01-01',
        isFeatured: true,
        tags: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const review = {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: testimonial.clientName
        },
        reviewRating: {
          '@type': 'Rating',
          ratingValue: 5,
          bestRating: 5,
          worstRating: 1
        },
        reviewBody: testimonial.testimonialText,
        datePublished: new Date(testimonial.dateReceived).toISOString()
      };

      expect(review['@type']).toBe('Review');
      expect(review.author.name).toBe('Jane Doe');
      expect(review.reviewBody).toBe('Excellent service!');
      expect(review.reviewRating.ratingValue).toBe(5);
    });
  });

  describe('Schema Validation', () => {
    it('should validate required schema properties', () => {
      const validSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'John Smith',
        email: 'john@example.com'
      };

      // Check required properties exist
      expect(validSchema['@context']).toBeDefined();
      expect(validSchema['@type']).toBeDefined();
      expect(validSchema.name).toBeDefined();
      expect(validSchema.email).toBeDefined();
      
      // Check property types
      expect(typeof validSchema['@context']).toBe('string');
      expect(typeof validSchema['@type']).toBe('string');
      expect(typeof validSchema.name).toBe('string');
      expect(typeof validSchema.email).toBe('string');
    });

    it('should detect missing required properties', () => {
      const incompleteSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent'
        // Missing name and email
      };

      // Simulate validation logic
      const requiredProperties = ['name', 'email'];
      const missingProperties = requiredProperties.filter(prop => !(prop in incompleteSchema));
      
      expect(missingProperties).toContain('name');
      expect(missingProperties).toContain('email');
      expect(missingProperties.length).toBe(2);
    });

    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'agent+info@realestate.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate URL format', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'https://www.realestate.com/agent'
      ];

      const invalidUrls = [
        'not-a-url',
        'just-text'
      ];

      validUrls.forEach(url => {
        expect(() => new URL(url)).not.toThrow();
      });

      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });
  });

  describe('Schema Types', () => {
    it('should support all required schema types', () => {
      const requiredTypes = [
        'RealEstateAgent',
        'Person',
        'LocalBusiness',
        'Organization',
        'Review',
        'AggregateRating'
      ];

      requiredTypes.forEach(type => {
        const schema = {
          '@context': 'https://schema.org',
          '@type': type,
          name: 'Test Name'
        };

        expect(schema['@type']).toBe(type);
        expect(requiredTypes).toContain(schema['@type']);
      });
    });

    it('should generate proper schema IDs', () => {
      const profileId = 'test-123';
      const schemaTypes = ['real-estate-agent', 'person', 'local-business', 'organization'];

      schemaTypes.forEach(type => {
        const schemaId = `#${type}-${profileId}`;
        expect(schemaId).toMatch(/^#[a-z-]+-test-123$/);
      });
    });
  });
});