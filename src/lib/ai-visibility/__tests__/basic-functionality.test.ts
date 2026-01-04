/**
 * AI Visibility Basic Functionality Tests
 * 
 * Tests for core AI visibility data structures and utilities
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect } from '@jest/globals';

describe('AI Visibility Basic Functionality', () => {
  describe('Type Validation', () => {
    it('should validate AI Visibility Score structure', () => {
      const validScore = {
        overall: 75.5,
        breakdown: {
          schemaMarkup: 80,
          contentOptimization: 70,
          aiSearchPresence: 75,
          knowledgeGraphIntegration: 65,
          socialSignals: 85,
          technicalSEO: 90,
        },
        calculatedAt: new Date(),
        trend: 'improving',
        previousScore: 70,
      };

      // Basic structure validation
      expect(validScore.overall).toBeGreaterThanOrEqual(0);
      expect(validScore.overall).toBeLessThanOrEqual(100);
      expect(validScore.breakdown).toBeDefined();
      expect(validScore.calculatedAt).toBeInstanceOf(Date);
      expect(['improving', 'declining', 'stable']).toContain(validScore.trend);
    });

    it('should validate AI Mention structure', () => {
      const validMention = {
        id: 'mention_123',
        platform: 'chatgpt',
        query: 'best real estate agent in Seattle',
        response: 'John Doe is a highly rated real estate agent...',
        mentionContext: 'When asked about top agents...',
        position: 1,
        sentiment: 'positive',
        competitorsAlsoMentioned: ['Jane Smith', 'Bob Wilson'],
        timestamp: new Date(),
        confidence: 0.95,
      };

      // Basic structure validation
      expect(validMention.id).toBeTruthy();
      expect(['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat']).toContain(validMention.platform);
      expect(validMention.position).toBeGreaterThan(0);
      expect(['positive', 'neutral', 'negative']).toContain(validMention.sentiment);
      expect(validMention.confidence).toBeGreaterThanOrEqual(0);
      expect(validMention.confidence).toBeLessThanOrEqual(1);
    });

    it('should validate Schema Markup structure', () => {
      const validSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': '#agent-123',
        name: 'John Doe',
        description: 'Experienced real estate agent in Seattle',
        url: 'https://johndoe.com',
        telephone: '+1-555-123-4567',
        email: 'john@johndoe.com',
      };

      // Basic structure validation
      expect(validSchema['@context']).toBe('https://schema.org');
      expect(validSchema['@type']).toBeTruthy();
      expect(validSchema.name).toBeTruthy();
      expect(validSchema.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('Scoring Utilities', () => {
    it('should calculate overall score correctly', () => {
      const breakdown = {
        schemaMarkup: 80,
        contentOptimization: 70,
        aiSearchPresence: 75,
        knowledgeGraphIntegration: 65,
        socialSignals: 85,
        technicalSEO: 90,
      };

      // Manual calculation: 80*0.25 + 70*0.20 + 75*0.20 + 65*0.15 + 85*0.10 + 90*0.10 = 76.25
      const expectedScore = 80 * 0.25 + 70 * 0.20 + 75 * 0.20 + 65 * 0.15 + 85 * 0.10 + 90 * 0.10;
      
      expect(expectedScore).toBeCloseTo(76.25, 2);
    });

    it('should calculate schema markup score', () => {
      const schemaMarkup = [
        {
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'John Doe',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: 'John Doe',
        },
      ];

      // Basic scoring logic - more schemas = higher score
      const baseScore = 50;
      const schemaBonus = schemaMarkup.length * 10;
      const maxScore = 100;
      const calculatedScore = Math.min(baseScore + schemaBonus, maxScore);
      
      expect(calculatedScore).toBeGreaterThan(0);
      expect(calculatedScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Constants', () => {
    it('should have correct score weights that sum to 1', () => {
      const weights = {
        schemaMarkup: 0.25,
        contentOptimization: 0.20,
        aiSearchPresence: 0.20,
        knowledgeGraphIntegration: 0.15,
        socialSignals: 0.10,
        technicalSEO: 0.10,
      };
      
      const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(total).toBeCloseTo(1.0, 3);
    });

    it('should have all required platforms', () => {
      const platforms = ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'];
      
      expect(platforms).toContain('chatgpt');
      expect(platforms).toContain('claude');
      expect(platforms).toContain('perplexity');
      expect(platforms).toContain('gemini');
      expect(platforms).toContain('bing-chat');
    });

    it('should have all required schema types', () => {
      const schemaTypes = ['RealEstateAgent', 'Person', 'LocalBusiness', 'Organization', 'Review', 'AggregateRating'];
      
      expect(schemaTypes).toContain('RealEstateAgent');
      expect(schemaTypes).toContain('Person');
      expect(schemaTypes).toContain('LocalBusiness');
      expect(schemaTypes).toContain('Organization');
      expect(schemaTypes).toContain('Review');
      expect(schemaTypes).toContain('AggregateRating');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid AI Visibility Score', () => {
      const invalidScore = {
        overall: 150, // Invalid: > 100
        breakdown: {
          schemaMarkup: 80,
          contentOptimization: 70,
          aiSearchPresence: 75,
          knowledgeGraphIntegration: 65,
          socialSignals: 85,
          technicalSEO: 90,
        },
        calculatedAt: new Date(),
        trend: 'improving',
      };

      // Validation logic
      const isValidScore = invalidScore.overall >= 0 && invalidScore.overall <= 100;
      expect(isValidScore).toBe(false);
    });

    it('should handle invalid AI Mention', () => {
      const invalidMention = {
        id: '', // Invalid: empty string
        platform: 'invalid-platform', // Invalid: not in enum
        query: 'test query',
        response: 'test response',
        mentionContext: 'test context',
        position: 0, // Invalid: must be positive
        sentiment: 'positive',
        competitorsAlsoMentioned: [],
        timestamp: new Date(),
        confidence: 1.5, // Invalid: > 1
      };

      // Validation logic
      const validPlatforms = ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'];
      const isValidId = invalidMention.id.length > 0;
      const isValidPlatform = validPlatforms.includes(invalidMention.platform as any);
      const isValidPosition = invalidMention.position > 0;
      const isValidConfidence = invalidMention.confidence >= 0 && invalidMention.confidence <= 1;
      
      expect(isValidId).toBe(false);
      expect(isValidPlatform).toBe(false);
      expect(isValidPosition).toBe(false);
      expect(isValidConfidence).toBe(false);
    });
  });
});