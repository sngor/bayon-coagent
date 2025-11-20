/**
 * Parallel Search Agent
 * 
 * Executes queries across multiple AI platforms (ChatGPT, Gemini, Claude) for cross-validation.
 * Identifies consensus points, highlights discrepancies, and reports agent visibility.
 */

import {
  ParallelSearchInput,
  ParallelSearchOutput,
  PlatformResult,
  Platform,
} from '@/ai/schemas/parallel-search-schemas';
import { BedrockClient, getBedrockClient } from './client';
import { z } from 'zod';

/**
 * Configuration for external AI platform APIs
 */
export interface PlatformAPIConfig {
  chatgpt?: {
    apiKey: string;
    endpoint?: string;
    model?: string;
  };
  gemini?: {
    apiKey: string;
    endpoint?: string;
    model?: string;
  };
  claude?: {
    apiKey: string;
    endpoint?: string;
    model?: string;
  };
}

/**
 * Error thrown when parallel search operations fail
 */
export class ParallelSearchError extends Error {
  constructor(
    message: string,
    public readonly platform?: Platform,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'ParallelSearchError';
  }
}

/**
 * Parallel Search Agent
 * Coordinates cross-platform AI queries for validation and consensus building
 */
export class ParallelSearchAgent {
  private bedrockClient: BedrockClient;
  private config: PlatformAPIConfig;
  private readonly DEFAULT_TIMEOUT_MS = 15000; // 15 seconds as per design

  constructor(config: PlatformAPIConfig, bedrockClient?: BedrockClient) {
    this.config = config;
    this.bedrockClient = bedrockClient || getBedrockClient();
  }

  /**
   * Executes a parallel search across multiple platforms
   * @param input Search input with query and platforms
   * @returns Aggregated results with consensus and discrepancies
   */
  async search(input: ParallelSearchInput): Promise<ParallelSearchOutput> {
    // Execute searches in parallel across all requested platforms
    const searchPromises = input.platforms.map((platform) =>
      this.searchPlatform(platform, input.query, input.agentName, input.firmName)
    );

    // Wait for all searches to complete (with timeout handling built into each search)
    const results = await Promise.all(searchPromises);

    // Filter out failed searches (those with errors)
    const successfulResults = results.filter((r) => !r.error);

    // Analyze consensus and discrepancies
    const { consensus, discrepancies } = await this.analyzeConsensus(
      successfulResults
    );

    // Check for agent visibility
    const agentVisibility = this.detectAgentVisibility(
      results,
      input.agentName,
      input.firmName
    );

    // Generate summary
    const summary = await this.generateSummary(
      results,
      consensus,
      discrepancies,
      agentVisibility
    );

    return {
      results,
      consensus,
      discrepancies,
      summary,
      agentVisibility,
    };
  }

  /**
   * Searches a single platform with timeout and error handling
   * @param platform Platform to search
   * @param query Search query
   * @param agentName Optional agent name for visibility detection
   * @param firmName Optional firm name for visibility detection
   * @returns Platform result
   */
  private async searchPlatform(
    platform: Platform,
    query: string,
    agentName?: string,
    firmName?: string
  ): Promise<PlatformResult> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout after ${this.DEFAULT_TIMEOUT_MS}ms`));
        }, this.DEFAULT_TIMEOUT_MS);
      });

      // Race between the actual search and timeout
      const searchPromise = this.executePlatformSearch(platform, query);
      const response = await Promise.race([searchPromise, timeoutPromise]);

      // Extract sources from response (simplified - would need platform-specific parsing)
      const sources = this.extractSources(response);

      // Check for agent/firm mentions
      const agentMentioned = this.checkMention(
        response,
        agentName,
        firmName
      );
      const agentRanking = agentMentioned
        ? this.detectRanking(response, agentName, firmName)
        : undefined;

      return {
        platform,
        response,
        sources,
        agentMentioned,
        agentRanking,
      };
    } catch (error) {
      console.error(`[ParallelSearchAgent] Error searching ${platform}:`, error);
      return {
        platform,
        response: '',
        sources: [],
        agentMentioned: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Executes the actual platform-specific search
   * @param platform Platform to search
   * @param query Search query
   * @returns Response text
   */
  private async executePlatformSearch(
    platform: Platform,
    query: string
  ): Promise<string> {
    switch (platform) {
      case 'chatgpt':
        return this.searchChatGPT(query);
      case 'gemini':
        return this.searchGemini(query);
      case 'claude':
        return this.searchClaude(query);
      default:
        throw new ParallelSearchError(
          `Unsupported platform: ${platform}`,
          platform
        );
    }
  }

  /**
   * Searches ChatGPT platform
   * @param query Search query
   * @returns Response text
   */
  private async searchChatGPT(query: string): Promise<string> {
    if (!this.config.chatgpt?.apiKey) {
      throw new ParallelSearchError(
        'ChatGPT API key not configured',
        'chatgpt'
      );
    }

    const endpoint =
      this.config.chatgpt.endpoint ||
      'https://api.openai.com/v1/chat/completions';
    const model = this.config.chatgpt.model || 'gpt-4-turbo-preview';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.chatgpt.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new ParallelSearchError(
        `ChatGPT API error: ${response.statusText}`,
        'chatgpt'
      );
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Searches Gemini platform
   * @param query Search query
   * @returns Response text
   */
  private async searchGemini(query: string): Promise<string> {
    if (!this.config.gemini?.apiKey) {
      throw new ParallelSearchError('Gemini API key not configured', 'gemini');
    }

    const endpoint =
      this.config.gemini.endpoint ||
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    const model = this.config.gemini.model || 'gemini-pro';

    const response = await fetch(`${endpoint}?key=${this.config.gemini.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: query,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      throw new ParallelSearchError(
        `Gemini API error: ${response.statusText}`,
        'gemini'
      );
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Searches Claude platform (via Anthropic API)
   * @param query Search query
   * @returns Response text
   */
  private async searchClaude(query: string): Promise<string> {
    if (!this.config.claude?.apiKey) {
      throw new ParallelSearchError('Claude API key not configured', 'claude');
    }

    const endpoint =
      this.config.claude.endpoint || 'https://api.anthropic.com/v1/messages';
    const model = this.config.claude.model || 'claude-3-5-sonnet-20241022';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.claude.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new ParallelSearchError(
        `Claude API error: ${response.statusText}`,
        'claude'
      );
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  }

  /**
   * Extracts source URLs from response text
   * @param response Response text
   * @returns Array of source URLs
   */
  private extractSources(response: string): string[] {
    // Extract URLs using regex
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
    const urls = response.match(urlRegex) || [];
    
    // Deduplicate and return
    return Array.from(new Set(urls));
  }

  /**
   * Checks if agent or firm is mentioned in response
   * @param response Response text
   * @param agentName Optional agent name
   * @param firmName Optional firm name
   * @returns True if mentioned
   */
  private checkMention(
    response: string,
    agentName?: string,
    firmName?: string
  ): boolean {
    if (!agentName && !firmName) {
      return false;
    }

    const lowerResponse = response.toLowerCase();

    if (agentName && lowerResponse.includes(agentName.toLowerCase())) {
      return true;
    }

    if (firmName && lowerResponse.includes(firmName.toLowerCase())) {
      return true;
    }

    return false;
  }

  /**
   * Detects ranking position of agent/firm in response
   * @param response Response text
   * @param agentName Optional agent name
   * @param firmName Optional firm name
   * @returns Ranking position (1-based) or undefined
   */
  private detectRanking(
    response: string,
    agentName?: string,
    firmName?: string
  ): number | undefined {
    // Simple heuristic: look for numbered lists and find position
    const lines = response.split('\n');
    let ranking = 1;

    for (const line of lines) {
      // Check if line starts with a number
      const numberMatch = line.match(/^\s*(\d+)[\.\)]/);
      if (numberMatch) {
        const currentRanking = parseInt(numberMatch[1], 10);
        
        // Check if this line mentions the agent or firm
        if (
          (agentName && line.toLowerCase().includes(agentName.toLowerCase())) ||
          (firmName && line.toLowerCase().includes(firmName.toLowerCase()))
        ) {
          return currentRanking;
        }
        
        ranking = currentRanking + 1;
      }
    }

    return undefined;
  }

  /**
   * Analyzes results to find consensus and discrepancies
   * @param results Successful platform results
   * @returns Consensus points and discrepancies
   */
  private async analyzeConsensus(
    results: PlatformResult[]
  ): Promise<{ consensus: string[]; discrepancies: string[] }> {
    if (results.length === 0) {
      return { consensus: [], discrepancies: [] };
    }

    if (results.length === 1) {
      return {
        consensus: ['Only one platform available for comparison'],
        discrepancies: [],
      };
    }

    // Use Bedrock to analyze consensus and discrepancies
    const analysisPrompt = this.buildConsensusAnalysisPrompt(results);

    const analysisSchema = z.object({
      consensus: z.array(z.string()),
      discrepancies: z.array(z.string()),
    });

    try {
      const analysis = await this.bedrockClient.invoke(
        analysisPrompt,
        analysisSchema,
        {
          temperature: 0.3, // Lower temperature for more consistent analysis
          maxTokens: 2000,
        }
      );

      return analysis;
    } catch (error) {
      console.error('[ParallelSearchAgent] Error analyzing consensus:', error);
      // Fallback to simple analysis
      return this.simpleConsensusAnalysis(results);
    }
  }

  /**
   * Builds prompt for consensus analysis
   * @param results Platform results
   * @returns Analysis prompt
   */
  private buildConsensusAnalysisPrompt(results: PlatformResult[]): string {
    const platformResponses = results
      .map(
        (r, i) =>
          `Platform ${i + 1} (${r.platform}):\n${r.response}\n`
      )
      .join('\n---\n\n');

    return `Analyze the following responses from different AI platforms and identify:
1. Consensus points: Key facts or insights that appear consistently across platforms
2. Discrepancies: Significant differences or contradictions between platforms

${platformResponses}

Provide your analysis in JSON format with two arrays:
- "consensus": Array of consensus points (strings)
- "discrepancies": Array of discrepancies (strings)

Focus on substantive differences, not minor wording variations.`;
  }

  /**
   * Simple fallback consensus analysis without AI
   * @param results Platform results
   * @returns Consensus and discrepancies
   */
  private simpleConsensusAnalysis(
    results: PlatformResult[]
  ): { consensus: string[]; discrepancies: string[] } {
    // Simple keyword-based analysis
    const allWords = results.flatMap((r) =>
      r.response
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 5)
    );

    const wordCounts = new Map<string, number>();
    allWords.forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });

    // Words appearing in multiple responses might indicate consensus
    const consensusWords = Array.from(wordCounts.entries())
      .filter(([_, count]) => count >= Math.min(2, results.length))
      .map(([word]) => word)
      .slice(0, 5);

    return {
      consensus:
        consensusWords.length > 0
          ? [`Common themes: ${consensusWords.join(', ')}`]
          : ['Unable to determine consensus automatically'],
      discrepancies: ['Manual review recommended for detailed comparison'],
    };
  }

  /**
   * Detects agent visibility across platforms
   * @param results All platform results
   * @param agentName Optional agent name
   * @param firmName Optional firm name
   * @returns Agent visibility information
   */
  private detectAgentVisibility(
    results: PlatformResult[],
    agentName?: string,
    firmName?: string
  ): ParallelSearchOutput['agentVisibility'] {
    const mentionedPlatforms: Platform[] = [];
    const rankings: Record<string, number> = {};

    results.forEach((result) => {
      if (result.agentMentioned) {
        mentionedPlatforms.push(result.platform);
        if (result.agentRanking !== undefined) {
          rankings[result.platform] = result.agentRanking;
        }
      }
    });

    return {
      mentioned: mentionedPlatforms.length > 0,
      platforms: mentionedPlatforms,
      rankings,
    };
  }

  /**
   * Generates a summary of the parallel search results
   * @param results All platform results
   * @param consensus Consensus points
   * @param discrepancies Discrepancies
   * @param agentVisibility Agent visibility information
   * @returns Summary text
   */
  private async generateSummary(
    results: PlatformResult[],
    consensus: string[],
    discrepancies: string[],
    agentVisibility: ParallelSearchOutput['agentVisibility']
  ): Promise<string> {
    const successfulPlatforms = results
      .filter((r) => !r.error)
      .map((r) => r.platform);
    const failedPlatforms = results
      .filter((r) => r.error)
      .map((r) => r.platform);

    let summary = `Cross-validated with ${successfulPlatforms.join(', ')}`;

    if (failedPlatforms.length > 0) {
      summary += `. ${failedPlatforms.join(', ')} ${
        failedPlatforms.length === 1 ? 'was' : 'were'
      } temporarily unavailable`;
    }

    summary += '.';

    if (consensus.length > 0) {
      summary += `\n\nConsensus: ${consensus.join('; ')}`;
    }

    if (discrepancies.length > 0) {
      summary += `\n\nDiscrepancies: ${discrepancies.join('; ')}`;
    }

    if (agentVisibility.mentioned) {
      summary += `\n\nAgent Visibility: Mentioned on ${agentVisibility.platforms.join(
        ', '
      )}`;
      if (Object.keys(agentVisibility.rankings).length > 0) {
        const rankingText = Object.entries(agentVisibility.rankings)
          .map(([platform, rank]) => `${platform} (#${rank})`)
          .join(', ');
        summary += ` - Rankings: ${rankingText}`;
      }
    }

    return summary;
  }
}

/**
 * Creates a parallel search agent instance
 * @param config Platform API configuration
 * @returns ParallelSearchAgent instance
 */
export function createParallelSearchAgent(
  config: PlatformAPIConfig
): ParallelSearchAgent {
  return new ParallelSearchAgent(config);
}
