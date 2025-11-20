/**
 * Bayon AI Assistant Schemas Tests
 * 
 * Validates that all schemas work correctly with valid and invalid data.
 */

import { describe, it, expect } from '@jest/globals';
import {
  AgentProfileSchema,
  CreateAgentProfileInputSchema,
  CitationSchema,
  WorkflowTaskSchema,
  WorkflowResultSchema,
  WorkerTaskInputSchema,
  WorkerTaskOutputSchema,
  GuardrailsResultSchema,
  ConversationMessageSchema,
  ParallelSearchInputSchema,
  VisionAnalysisInputSchema,
  DataAnalystInputSchema,
  ContentGeneratorInputSchema,
  MarketForecasterInputSchema
} from '../bayon-assistant-schemas';

describe('Bayon Assistant Schemas', () => {
  describe('AgentProfileSchema', () => {
    it('should validate a complete agent profile', () => {
      const validProfile = {
        userId: 'user123',
        agentName: 'Jane Smith',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury' as const,
        preferredTone: 'warm-consultative' as const,
        corePrinciple: 'Maximize client ROI with data-first strategies',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = AgentProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject invalid specialization', () => {
      const invalidProfile = {
        userId: 'user123',
        agentName: 'Jane Smith',
        primaryMarket: 'Austin, TX',
        specialization: 'invalid',
        preferredTone: 'warm-consultative',
        corePrinciple: 'Test principle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = AgentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });

    it('should reject short core principle', () => {
      const invalidProfile = {
        userId: 'user123',
        agentName: 'Jane Smith',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury',
        preferredTone: 'warm-consultative',
        corePrinciple: 'Short', // Less than 10 characters
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const result = AgentProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateAgentProfileInputSchema', () => {
    it('should validate profile creation input', () => {
      const validInput = {
        agentName: 'Jane Smith',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury' as const,
        preferredTone: 'warm-consultative' as const,
        corePrinciple: 'Maximize client ROI with data-first strategies'
      };

      const result = CreateAgentProfileInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('CitationSchema', () => {
    it('should validate a complete citation', () => {
      const validCitation = {
        id: 'cite123',
        url: 'https://example.com/report',
        title: 'Austin Q4 2024 Housing Report',
        sourceType: 'market-report' as const,
        accessedAt: new Date().toISOString(),
        validated: true
      };

      const result = CitationSchema.safeParse(validCitation);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalidCitation = {
        id: 'cite123',
        url: 'not-a-url',
        title: 'Test Report',
        sourceType: 'market-report',
        accessedAt: new Date().toISOString(),
        validated: true
      };

      const result = CitationSchema.safeParse(invalidCitation);
      expect(result.success).toBe(false);
    });
  });

  describe('WorkflowTaskSchema', () => {
    it('should validate a workflow task', () => {
      const validTask = {
        id: 'task123',
        type: 'data-analysis' as const,
        description: 'Analyze market data for Austin',
        dependencies: [],
        workerAgent: 'data-analyst-worker',
        input: { query: 'Austin market trends' },
        status: 'pending' as const
      };

      const result = WorkflowTaskSchema.safeParse(validTask);
      expect(result.success).toBe(true);
    });

    it('should default status to pending', () => {
      const taskWithoutStatus = {
        id: 'task123',
        type: 'data-analysis' as const,
        description: 'Analyze market data',
        dependencies: [],
        workerAgent: 'data-analyst-worker',
        input: {}
      };

      const result = WorkflowTaskSchema.safeParse(taskWithoutStatus);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('pending');
      }
    });
  });

  describe('WorkflowResultSchema', () => {
    it('should validate a successful result', () => {
      const validResult = {
        taskId: 'task123',
        output: { data: 'result' },
        status: 'success' as const,
        executionTime: 1500
      };

      const result = WorkflowResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should validate an error result', () => {
      const errorResult = {
        taskId: 'task123',
        output: null,
        status: 'error' as const,
        error: 'Worker failed to execute',
        executionTime: 500
      };

      const result = WorkflowResultSchema.safeParse(errorResult);
      expect(result.success).toBe(true);
    });
  });

  describe('WorkerTaskInputSchema', () => {
    it('should validate worker task input', () => {
      const validInput = {
        taskId: 'task123',
        taskType: 'data-analysis' as const,
        context: { query: 'test' },
        agentProfile: {
          userId: 'user123',
          agentName: 'Jane Smith',
          primaryMarket: 'Austin, TX',
          specialization: 'luxury' as const,
          preferredTone: 'warm-consultative' as const,
          corePrinciple: 'Test principle for validation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const result = WorkerTaskInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('WorkerTaskOutputSchema', () => {
    it('should validate successful worker output', () => {
      const validOutput = {
        taskId: 'task123',
        status: 'success' as const,
        result: { data: 'test' },
        metadata: {
          executionTime: 1000,
          tokensUsed: 500
        }
      };

      const result = WorkerTaskOutputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    it('should validate error worker output', () => {
      const errorOutput = {
        taskId: 'task123',
        status: 'error' as const,
        error: {
          type: 'ValidationError',
          message: 'Invalid input',
          details: { field: 'query' }
        }
      };

      const result = WorkerTaskOutputSchema.safeParse(errorOutput);
      expect(result.success).toBe(true);
    });
  });

  describe('GuardrailsResultSchema', () => {
    it('should validate allowed request', () => {
      const allowedResult = {
        allowed: true,
        violationType: 'none' as const
      };

      const result = GuardrailsResultSchema.safeParse(allowedResult);
      expect(result.success).toBe(true);
    });

    it('should validate blocked request', () => {
      const blockedResult = {
        allowed: false,
        reason: 'Query is outside real estate domain',
        violationType: 'out-of-domain' as const
      };

      const result = GuardrailsResultSchema.safeParse(blockedResult);
      expect(result.success).toBe(true);
    });
  });

  describe('ConversationMessageSchema', () => {
    it('should validate user message', () => {
      const userMessage = {
        role: 'user' as const,
        content: 'What are the market trends in Austin?',
        timestamp: new Date().toISOString()
      };

      const result = ConversationMessageSchema.safeParse(userMessage);
      expect(result.success).toBe(true);
    });

    it('should validate assistant message with citations', () => {
      const assistantMessage = {
        role: 'assistant' as const,
        content: 'Based on recent data...',
        timestamp: new Date().toISOString(),
        citations: ['cite123', 'cite456'],
        workflowTasks: ['task123']
      };

      const result = ConversationMessageSchema.safeParse(assistantMessage);
      expect(result.success).toBe(true);
    });
  });

  describe('ParallelSearchInputSchema', () => {
    it('should validate parallel search input', () => {
      const validInput = {
        query: 'Austin real estate market trends',
        platforms: ['chatgpt', 'gemini', 'claude'] as const
      };

      const result = ParallelSearchInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('VisionAnalysisInputSchema', () => {
    it('should validate vision analysis input', () => {
      const validInput = {
        imageData: 'base64encodeddata',
        imageFormat: 'jpeg' as const,
        question: 'What improvements would you recommend?',
        agentProfile: {
          userId: 'user123',
          agentName: 'Jane Smith',
          primaryMarket: 'Austin, TX',
          specialization: 'luxury' as const,
          preferredTone: 'warm-consultative' as const,
          corePrinciple: 'Test principle for validation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const result = VisionAnalysisInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('DataAnalystInputSchema', () => {
    it('should validate data analyst input', () => {
      const validInput = {
        query: 'Find properties in Austin',
        dataSource: 'mls' as const,
        filters: { priceRange: { min: 300000, max: 500000 } }
      };

      const result = DataAnalystInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('ContentGeneratorInputSchema', () => {
    it('should validate content generator input', () => {
      const validInput = {
        contentType: 'listing' as const,
        context: { property: 'test' },
        agentProfile: {
          userId: 'user123',
          agentName: 'Jane Smith',
          primaryMarket: 'Austin, TX',
          specialization: 'luxury' as const,
          preferredTone: 'warm-consultative' as const,
          corePrinciple: 'Test principle for validation',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      const result = ContentGeneratorInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });

  describe('MarketForecasterInputSchema', () => {
    it('should validate market forecaster input', () => {
      const validInput = {
        historicalData: [{ date: '2024-01', price: 400000 }],
        timeframe: '90-day' as const,
        market: 'Austin, TX'
      };

      const result = MarketForecasterInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });
});
