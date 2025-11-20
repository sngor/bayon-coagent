/**
 * Parallel Search Agent Tests
 * 
 * Unit tests for the ParallelSearchAgent class
 */

import { ParallelSearchAgent, PlatformAPIConfig } from '../parallel-search-agent';
import { ParallelSearchInput } from '@/ai/schemas/parallel-search-schemas';

describe('ParallelSearchAgent', () => {
  const mockConfig: PlatformAPIConfig = {
    chatgpt: {
      apiKey: 'test-key',
    },
    gemini: {
      apiKey: 'test-key',
    },
    claude: {
      apiKey: 'test-key',
    },
  };

  describe('Constructor', () => {
    it('should create an instance with valid config', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      expect(agent).toBeInstanceOf(ParallelSearchAgent);
    });
  });

  describe('Source Extraction', () => {
    it('should extract URLs from response text', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'Check out https://example.com and https://test.com for more info';
      
      // Access private method through any cast for testing
      const sources = (agent as any).extractSources(response);
      
      expect(sources).toContain('https://example.com');
      expect(sources).toContain('https://test.com');
      expect(sources).toHaveLength(2);
    });

    it('should deduplicate URLs', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'Visit https://example.com and also https://example.com again';
      
      const sources = (agent as any).extractSources(response);
      
      expect(sources).toHaveLength(1);
      expect(sources[0]).toBe('https://example.com');
    });

    it('should handle responses with no URLs', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'This is a response with no URLs';
      
      const sources = (agent as any).extractSources(response);
      
      expect(sources).toHaveLength(0);
    });
  });

  describe('Agent Mention Detection', () => {
    it('should detect agent name mentions', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'Jane Smith is a top agent in the area';
      
      const mentioned = (agent as any).checkMention(response, 'Jane Smith', undefined);
      
      expect(mentioned).toBe(true);
    });

    it('should detect firm name mentions', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'Smith Luxury Realty has excellent reviews';
      
      const mentioned = (agent as any).checkMention(response, undefined, 'Smith Luxury Realty');
      
      expect(mentioned).toBe(true);
    });

    it('should be case-insensitive', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'JANE SMITH is highly recommended';
      
      const mentioned = (agent as any).checkMention(response, 'jane smith', undefined);
      
      expect(mentioned).toBe(true);
    });

    it('should return false when not mentioned', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'Other agents in the area include...';
      
      const mentioned = (agent as any).checkMention(response, 'Jane Smith', undefined);
      
      expect(mentioned).toBe(false);
    });

    it('should return false when no agent/firm provided', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'Jane Smith is a top agent';
      
      const mentioned = (agent as any).checkMention(response, undefined, undefined);
      
      expect(mentioned).toBe(false);
    });
  });

  describe('Ranking Detection', () => {
    it('should detect ranking in numbered list', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = `
        Top agents:
        1. John Doe
        2. Jane Smith
        3. Bob Johnson
      `;
      
      const ranking = (agent as any).detectRanking(response, 'Jane Smith', undefined);
      
      expect(ranking).toBe(2);
    });

    it('should handle different numbering formats', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = `
        1) First Agent
        2) Jane Smith
        3) Third Agent
      `;
      
      const ranking = (agent as any).detectRanking(response, 'Jane Smith', undefined);
      
      expect(ranking).toBe(2);
    });

    it('should return undefined when not in numbered list', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = 'Jane Smith is a great agent but not in a numbered list';
      
      const ranking = (agent as any).detectRanking(response, 'Jane Smith', undefined);
      
      expect(ranking).toBeUndefined();
    });

    it('should detect firm name in rankings', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const response = `
        1. ABC Realty
        2. Smith Luxury Realty
        3. XYZ Properties
      `;
      
      const ranking = (agent as any).detectRanking(response, undefined, 'Smith Luxury Realty');
      
      expect(ranking).toBe(2);
    });
  });

  describe('Agent Visibility Detection', () => {
    it('should aggregate visibility across platforms', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const results = [
        {
          platform: 'chatgpt' as const,
          response: 'Jane Smith is ranked #1',
          sources: [],
          agentMentioned: true,
          agentRanking: 1,
        },
        {
          platform: 'gemini' as const,
          response: 'Other agents include...',
          sources: [],
          agentMentioned: false,
        },
        {
          platform: 'claude' as const,
          response: 'Jane Smith is ranked #3',
          sources: [],
          agentMentioned: true,
          agentRanking: 3,
        },
      ];
      
      const visibility = (agent as any).detectAgentVisibility(
        results,
        'Jane Smith',
        undefined
      );
      
      expect(visibility.mentioned).toBe(true);
      expect(visibility.platforms).toEqual(['chatgpt', 'claude']);
      expect(visibility.rankings).toEqual({
        chatgpt: 1,
        claude: 3,
      });
    });

    it('should handle no mentions', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const results = [
        {
          platform: 'chatgpt' as const,
          response: 'Other agents...',
          sources: [],
          agentMentioned: false,
        },
      ];
      
      const visibility = (agent as any).detectAgentVisibility(
        results,
        'Jane Smith',
        undefined
      );
      
      expect(visibility.mentioned).toBe(false);
      expect(visibility.platforms).toEqual([]);
      expect(visibility.rankings).toEqual({});
    });
  });

  describe('Simple Consensus Analysis', () => {
    it('should identify common words across responses', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const results = [
        {
          platform: 'chatgpt' as const,
          response: 'The market is showing strong growth in luxury properties',
          sources: [],
          agentMentioned: false,
        },
        {
          platform: 'gemini' as const,
          response: 'Luxury properties are experiencing strong demand',
          sources: [],
          agentMentioned: false,
        },
      ];
      
      const analysis = (agent as any).simpleConsensusAnalysis(results);
      
      expect(analysis.consensus).toBeDefined();
      expect(analysis.discrepancies).toBeDefined();
    });

    it('should handle single result', () => {
      const agent = new ParallelSearchAgent(mockConfig);
      const results = [
        {
          platform: 'chatgpt' as const,
          response: 'Market analysis...',
          sources: [],
          agentMentioned: false,
        },
      ];
      
      const analysis = (agent as any).simpleConsensusAnalysis(results);
      
      expect(analysis.consensus).toBeDefined();
      expect(analysis.discrepancies).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API keys', async () => {
      const emptyConfig: PlatformAPIConfig = {};
      const agent = new ParallelSearchAgent(emptyConfig);
      
      // This should not throw, but return error in result
      const result = (agent as any).searchPlatform('chatgpt', 'test query');
      
      await expect(result).resolves.toHaveProperty('error');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid input', () => {
      const input: ParallelSearchInput = {
        query: 'What are the market trends?',
        platforms: ['chatgpt', 'gemini'],
      };
      
      expect(input.query).toBeDefined();
      expect(input.platforms.length).toBeGreaterThan(0);
    });

    it('should accept optional agent information', () => {
      const input: ParallelSearchInput = {
        query: 'Who are the top agents?',
        platforms: ['chatgpt'],
        agentName: 'Jane Smith',
        firmName: 'Smith Realty',
      };
      
      expect(input.agentName).toBe('Jane Smith');
      expect(input.firmName).toBe('Smith Realty');
    });
  });
});
