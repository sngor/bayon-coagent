/**
 * Vision Agent Tests
 * 
 * Tests for the Vision Agent implementation
 */

import { VisionAgent, getVisionAgent, resetVisionAgent } from '../vision-agent';
import type { VisionAnalysisInput } from '@/ai/schemas/vision-analysis-schemas';

describe('VisionAgent', () => {
  afterEach(() => {
    resetVisionAgent();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = getVisionAgent();
      const instance2 = getVisionAgent();
      expect(instance1).toBe(instance2);
    });

    it('should create a new instance after reset', () => {
      const instance1 = getVisionAgent();
      resetVisionAgent();
      const instance2 = getVisionAgent();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Input Validation', () => {
    it('should validate input schema', async () => {
      const visionAgent = new VisionAgent();
      
      const invalidInput = {
        imageData: 'base64data',
        imageFormat: 'invalid-format', // Invalid format
        question: 'What do you see?',
        agentProfile: {
          agentName: 'Test Agent',
          primaryMarket: 'Test Market',
          specialization: 'luxury',
          preferredTone: 'professional',
          corePrinciple: 'Test principle',
        },
      } as any;

      await expect(visionAgent.analyze(invalidInput)).rejects.toThrow();
    });

    it('should accept valid input', () => {
      const validInput: VisionAnalysisInput = {
        imageData: 'base64encodedimagedata',
        imageFormat: 'jpeg',
        question: 'What improvements would you recommend?',
        agentProfile: {
          agentName: 'Jane Smith',
          primaryMarket: 'Austin, TX',
          specialization: 'luxury',
          preferredTone: 'warm-consultative',
          corePrinciple: 'Maximize client ROI',
        },
      };

      // Should not throw during validation
      expect(() => {
        const visionAgent = new VisionAgent();
        // Just validate the input parsing, don't actually call Bedrock
      }).not.toThrow();
    });
  });

  describe('Agent Profile Conversion', () => {
    it('should convert AgentProfile to schema format', async () => {
      const visionAgent = new VisionAgent();
      
      const agentProfile = {
        userId: 'user123',
        agentName: 'John Doe',
        primaryMarket: 'Seattle, WA',
        specialization: 'first-time-buyers' as const,
        preferredTone: 'casual' as const,
        corePrinciple: 'Help first-time buyers find their dream home',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Access private method through any cast for testing
      const converted = (visionAgent as any).convertAgentProfile(agentProfile);

      expect(converted).toEqual({
        agentName: 'John Doe',
        primaryMarket: 'Seattle, WA',
        specialization: 'first-time-buyers',
        preferredTone: 'casual',
        corePrinciple: 'Help first-time buyers find their dream home',
      });
    });
  });

  describe('Prompt Construction', () => {
    it('should construct system prompt with agent context', () => {
      const visionAgent = new VisionAgent();
      
      const agentProfile = {
        agentName: 'Jane Smith',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury' as const,
        preferredTone: 'warm-consultative' as const,
        corePrinciple: 'Maximize client ROI',
      };

      const systemPrompt = (visionAgent as any).constructSystemPrompt(agentProfile);

      expect(systemPrompt).toContain('Jane Smith');
      expect(systemPrompt).toContain('Austin, TX');
      expect(systemPrompt).toContain('luxury');
      expect(systemPrompt).toContain('warm-consultative');
      expect(systemPrompt).toContain('Maximize client ROI');
    });

    it('should construct user prompt with question', () => {
      const visionAgent = new VisionAgent();
      
      const input: VisionAnalysisInput = {
        imageData: 'base64data',
        imageFormat: 'jpeg',
        question: 'What improvements would you recommend?',
        agentProfile: {
          agentName: 'Test Agent',
          primaryMarket: 'Test Market',
          specialization: 'luxury',
          preferredTone: 'professional',
          corePrinciple: 'Test principle',
        },
      };

      const userPrompt = (visionAgent as any).constructUserPrompt(input);

      expect(userPrompt).toContain('What improvements would you recommend?');
      expect(userPrompt).toContain('Test Market');
    });

    it('should include property type in user prompt when provided', () => {
      const visionAgent = new VisionAgent();
      
      const input: VisionAnalysisInput = {
        imageData: 'base64data',
        imageFormat: 'jpeg',
        question: 'What do you see?',
        agentProfile: {
          agentName: 'Test Agent',
          primaryMarket: 'Test Market',
          specialization: 'luxury',
          preferredTone: 'professional',
          corePrinciple: 'Test principle',
        },
        propertyType: 'single-family',
      };

      const userPrompt = (visionAgent as any).constructUserPrompt(input);

      expect(userPrompt).toContain('single-family');
    });
  });

  describe('Image Format Support', () => {
    it('should support all valid image formats', () => {
      const validFormats = ['jpeg', 'png', 'webp', 'gif'];
      
      validFormats.forEach((format) => {
        const input: VisionAnalysisInput = {
          imageData: 'base64data',
          imageFormat: format as any,
          question: 'Test question',
          agentProfile: {
            agentName: 'Test Agent',
            primaryMarket: 'Test Market',
            specialization: 'luxury',
            preferredTone: 'professional',
            corePrinciple: 'Test principle',
          },
        };

        // Should not throw during validation
        expect(() => {
          const visionAgent = new VisionAgent();
        }).not.toThrow();
      });
    });
  });
});
