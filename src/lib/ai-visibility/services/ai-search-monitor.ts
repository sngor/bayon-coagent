/**
 * AI Search Monitor Service
 * 
 * Service for monitoring AI platform mentions and tracking agent visibility
 * Requirements: 4.1, 4.2, 4.3
 */

import type { AIMention, AIMonitoringConfig, AIPlatform } from '../types';
import { analyzeAIMention } from '@/aws/bedrock/flows/analyze-ai-mention';
import { getRepository } from '@/aws/dynamodb/repository';
import { generateId } from '@/lib/utils';
import { 
  AIPlatformError, 
  RateLimitError, 
  ConfigurationError,
  DataPersistenceError,
  wrapError, 
  logError 
} from '../errors';
import { retryAIPlatformOperation, retryDatabaseOperation } from '../retry-manager';
import { fallbackManager } from '../fallback-manager';

/**
 * Query templates for different types of searches
 */
interface QueryTemplate {
  template: string;
  variables: string[];
  description: string;
}

/**
 * AI platform configuration for API access
 */
interface PlatformConfig {
  name: AIPlatform;
  apiEndpoint?: string;
  requiresAuth: boolean;
  rateLimitPerMinute: number;
  supportedQueryTypes: string[];
}

/**
 * Search query with location and agent context
 */
interface SearchQuery {
  query: string;
  location: string;
  agentName: string;
  platform: AIPlatform;
  queryType: 'recommendation' | 'expertise' | 'comparison' | 'local_search';
}

/**
 * Mention detection result
 */
interface MentionDetection {
  found: boolean;
  confidence: number;
  context: string;
  position: number;
  competitorsFound: string[];
}

/**
 * AI Search Monitor Service Implementation
 */
export class AISearchMonitorService {
  private repository = getRepository();
  
  /**
   * Platform configurations for AI services
   */
  private platformConfigs: Record<AIPlatform, PlatformConfig> = {
    'chatgpt': {
      name: 'chatgpt',
      requiresAuth: true,
      rateLimitPerMinute: 20,
      supportedQueryTypes: ['recommendation', 'expertise', 'comparison', 'local_search']
    },
    'claude': {
      name: 'claude',
      requiresAuth: true,
      rateLimitPerMinute: 15,
      supportedQueryTypes: ['recommendation', 'expertise', 'comparison', 'local_search']
    },
    'perplexity': {
      name: 'perplexity',
      requiresAuth: true,
      rateLimitPerMinute: 10,
      supportedQueryTypes: ['recommendation', 'expertise', 'comparison', 'local_search']
    },
    'gemini': {
      name: 'gemini',
      requiresAuth: true,
      rateLimitPerMinute: 25,
      supportedQueryTypes: ['recommendation', 'expertise', 'comparison', 'local_search']
    },
    'bing-chat': {
      name: 'bing-chat',
      requiresAuth: false,
      rateLimitPerMinute: 30,
      supportedQueryTypes: ['recommendation', 'expertise', 'comparison', 'local_search']
    }
  };

  /**
   * Query templates for location-based real estate searches
   */
  private queryTemplates: Record<string, QueryTemplate> = {
    recommendation: {
      template: "Who are the best real estate agents in {location}? I'm looking for someone to help me {action}.",
      variables: ['location', 'action'],
      description: 'General agent recommendation query'
    },
    expertise: {
      template: "I need a real estate agent in {location} who specializes in {specialty}. Who would you recommend?",
      variables: ['location', 'specialty'],
      description: 'Expertise-based recommendation query'
    },
    comparison: {
      template: "Compare the top real estate agents in {location}. Who has the best track record for {criteria}?",
      variables: ['location', 'criteria'],
      description: 'Comparative analysis query'
    },
    local_search: {
      template: "Find me a local real estate agent near {location} with experience in {market_type} properties.",
      variables: ['location', 'market_type'],
      description: 'Location-specific search query'
    },
    buyer_agent: {
      template: "I'm a first-time home buyer in {location}. Which real estate agent should I work with?",
      variables: ['location'],
      description: 'Buyer agent recommendation'
    },
    seller_agent: {
      template: "I want to sell my home in {location}. Who are the top listing agents in the area?",
      variables: ['location'],
      description: 'Seller agent recommendation'
    },
    luxury_specialist: {
      template: "Looking for a luxury real estate specialist in {location}. Who handles high-end properties?",
      variables: ['location'],
      description: 'Luxury market specialist query'
    },
    investment_advisor: {
      template: "I need a real estate agent in {location} who understands investment properties and rental markets.",
      variables: ['location'],
      description: 'Investment property specialist query'
    }
  };

  /**
   * Starts monitoring AI platforms for mentions
   */
  async startMonitoring(userId: string, config: AIMonitoringConfig): Promise<void> {
    try {
      // Validate configuration
      this.validateMonitoringConfig(config);

      // Store monitoring configuration with retry
      await retryDatabaseOperation(async () => {
        await this.repository.putItem({
          PK: `USER#${userId}`,
          SK: 'AI_MONITORING_CONFIG',
          ...config,
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }, 'putItem');

      console.log(`[AISearchMonitor] Started monitoring for user ${userId} on platforms:`, config.platforms);
    } catch (error) {
      const wrappedError = error instanceof ConfigurationError 
        ? error 
        : new DataPersistenceError(
            'Failed to start AI monitoring',
            'startMonitoring',
            'AIMonitoringConfig',
            true,
            error
          );
      
      logError(wrappedError, { userId, platformCount: config.platforms?.length });
      throw wrappedError;
    }
  }

  /**
   * Stops monitoring for a user
   */
  async stopMonitoring(userId: string): Promise<void> {
    try {
      // Update monitoring configuration status
      const config = await this.repository.getItem({
        PK: `USER#${userId}`,
        SK: 'AI_MONITORING_CONFIG'
      });

      if (config) {
        await this.repository.putItem({
          ...config,
          status: 'inactive',
          updatedAt: new Date().toISOString()
        });
      }

      console.log(`[AISearchMonitor] Stopped monitoring for user ${userId}`);
    } catch (error) {
      console.error('[AISearchMonitor] Error stopping monitoring:', error);
      throw new Error('Failed to stop AI monitoring');
    }
  }

  /**
   * Performs a one-time search across AI platforms
   */
  async searchPlatforms(
    platforms: AIPlatform[],
    queries: string[],
    userId: string
  ): Promise<AIMention[]> {
    return fallbackManager.executeWithFallback(
      async () => {
        const mentions: AIMention[] = [];

        try {
          // Validate inputs
          if (!platforms || platforms.length === 0) {
            throw new ConfigurationError(
              'No platforms specified for monitoring',
              'searchPlatforms',
              ['platforms']
            );
          }

          if (!queries || queries.length === 0) {
            throw new ConfigurationError(
              'No queries specified for monitoring',
              'searchPlatforms',
              ['queries']
            );
          }

          // Get user profile for agent name
          const profile = await retryDatabaseOperation(async () => {
            return this.repository.getItem({
              PK: `USER#${userId}`,
              SK: 'PROFILE'
            });
          }, 'getItem');

          if (!profile?.name) {
            throw new ConfigurationError(
              'User profile not found or missing name',
              'searchPlatforms',
              ['profile.name']
            );
          }

          const agentName = profile.name;

          // Process each platform with rate limiting and error handling
          for (const platform of platforms) {
            console.log(`[AISearchMonitor] Searching ${platform} for ${queries.length} queries`);
            
            for (const query of queries) {
              try {
                // Query AI platform with retry and rate limiting
                const response = await retryAIPlatformOperation(
                  () => this.queryAIPlatform(platform, query, agentName),
                  platform
                );
                
                if (response) {
                  // Detect mentions in the response
                  const detection = await this.detectMentions(response, agentName);
                  
                  if (detection.found) {
                    // Analyze the mention with error handling
                    let analysis;
                    try {
                      analysis = await analyzeAIMention({
                        agentName,
                        aiResponse: response,
                        query,
                        platform: platform === 'bing-chat' ? 'gemini' : platform
                      });
                    } catch (analysisError) {
                      logError(
                        wrapError(analysisError, 'Failed to analyze AI mention'),
                        { platform, query, agentName }
                      );
                      // Use default analysis
                      analysis = {
                        sentiment: 'neutral' as const,
                        confidence: 0.5,
                        competitorsAlsoMentioned: detection.competitorsFound
                      };
                    }

                    // Create mention record
                    const mention: AIMention = {
                      id: generateId(),
                      platform,
                      query,
                      response,
                      mentionContext: detection.context,
                      position: detection.position,
                      sentiment: analysis.sentiment,
                      competitorsAlsoMentioned: detection.competitorsFound,
                      timestamp: new Date(),
                      confidence: detection.confidence
                    };

                    mentions.push(mention);

                    // Store mention in database with retry
                    try {
                      await retryDatabaseOperation(async () => {
                        await this.repository.putItem({
                          PK: `USER#${userId}`,
                          SK: `AI_MENTION#${mention.id}`,
                          ...mention,
                          timestamp: mention.timestamp.toISOString()
                        });
                      }, 'putItem');
                    } catch (dbError) {
                      logError(
                        new DataPersistenceError(
                          'Failed to store AI mention',
                          'putItem',
                          'AIMention',
                          true,
                          dbError
                        ),
                        { mentionId: mention.id, platform, userId }
                      );
                      // Continue processing other mentions
                    }
                  }
                }
              } catch (error) {
                // Handle platform-specific errors
                if (error instanceof RateLimitError) {
                  logError(error, { platform, query, userId });
                  // Wait for rate limit to reset before continuing
                  await new Promise(resolve => setTimeout(resolve, error.retryAfter || 60000));
                } else {
                  logError(
                    new AIPlatformError(
                      `Error querying ${platform}`,
                      platform,
                      error.message,
                      true,
                      error
                    ),
                    { query, userId }
                  );
                }
                // Continue with other queries/platforms
              }
            }
          }

          console.log(`[AISearchMonitor] Found ${mentions.length} mentions across ${platforms.length} platforms`);
          return mentions;
        } catch (error) {
          const wrappedError = wrapError(error, 'Failed to search AI platforms');
          logError(wrappedError, { userId, platformCount: platforms.length, queryCount: queries.length });
          throw wrappedError;
        }
      },
      'aiPlatformMonitoring',
      undefined,
      userId
    );
  }

  /**
   * Gets recent mentions for a user
   */
  async getRecentMentions(
    userId: string,
    timeWindowHours: number = 24,
    platforms?: AIPlatform[]
  ): Promise<AIMention[]> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
      
      // Query mentions from database
      const items = await this.repository.queryItems({
        PK: `USER#${userId}`,
        SK: { beginsWith: 'AI_MENTION#' }
      });

      const mentions = items
        .map(item => ({
          ...item,
          timestamp: new Date(item.timestamp)
        } as AIMention))
        .filter(mention => {
          const isRecent = mention.timestamp >= cutoffTime;
          const matchesPlatform = !platforms || platforms.includes(mention.platform);
          return isRecent && matchesPlatform;
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return mentions;
    } catch (error) {
      console.error('[AISearchMonitor] Error getting recent mentions:', error);
      throw new Error('Failed to get recent mentions');
    }
  }

  /**
   * Analyzes mention sentiment and context
   */
  async analyzeMention(mention: Omit<AIMention, 'sentiment' | 'confidence'>): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    competitorsAlsoMentioned: string[];
  }> {
    try {
      // Get agent name from the mention context or query
      const agentName = this.extractAgentName(mention.mentionContext);
      
      const analysis = await analyzeAIMention({
        agentName,
        aiResponse: mention.response,
        query: mention.query,
        platform: mention.platform === 'bing-chat' ? 'gemini' : mention.platform
      });

      return {
        sentiment: analysis.sentiment,
        confidence: 0.85, // Default confidence score
        competitorsAlsoMentioned: mention.competitorsAlsoMentioned
      };
    } catch (error) {
      console.error('[AISearchMonitor] Error analyzing mention:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        competitorsAlsoMentioned: []
      };
    }
  }

  /**
   * Updates monitoring configuration
   */
  async updateMonitoringConfig(userId: string, config: Partial<AIMonitoringConfig>): Promise<void> {
    try {
      const existingConfig = await this.repository.getItem({
        PK: `USER#${userId}`,
        SK: 'AI_MONITORING_CONFIG'
      });

      if (!existingConfig) {
        throw new Error('No existing monitoring configuration found');
      }

      const updatedConfig = {
        ...existingConfig,
        ...config,
        updatedAt: new Date().toISOString()
      };

      await this.repository.putItem(updatedConfig);
      
      console.log(`[AISearchMonitor] Updated monitoring config for user ${userId}`);
    } catch (error) {
      console.error('[AISearchMonitor] Error updating monitoring config:', error);
      throw new Error('Failed to update monitoring configuration');
    }
  }

  /**
   * Generates location-based queries for an agent
   */
  generateLocationQueries(agentName: string, locations: string[]): SearchQuery[] {
    const queries: SearchQuery[] = [];
    
    for (const location of locations) {
      // Generate queries from templates
      Object.entries(this.queryTemplates).forEach(([type, template]) => {
        const query = this.fillQueryTemplate(template, {
          location,
          action: 'buy a home',
          specialty: 'luxury homes',
          criteria: 'sales volume',
          market_type: 'residential'
        });

        // Create queries for each platform
        Object.keys(this.platformConfigs).forEach(platform => {
          queries.push({
            query,
            location,
            agentName,
            platform: platform as AIPlatform,
            queryType: type as any
          });
        });
      });
    }

    return queries;
  }

  /**
   * Validates monitoring configuration
   */
  private validateMonitoringConfig(config: AIMonitoringConfig): void {
    const missingFields: string[] = [];

    if (!config.platforms || config.platforms.length === 0) {
      missingFields.push('platforms');
    }

    if (!config.queries || config.queries.length === 0) {
      missingFields.push('queries');
    }

    if (!config.locations || config.locations.length === 0) {
      missingFields.push('locations');
    }

    if (typeof config.frequency !== 'number' || config.frequency <= 0) {
      missingFields.push('frequency');
    }

    // Validate platform configurations
    if (config.platforms) {
      for (const platform of config.platforms) {
        if (!this.platformConfigs[platform]) {
          throw new ConfigurationError(
            `Unsupported platform: ${platform}`,
            'aiMonitoring',
            [`platforms.${platform}`]
          );
        }
      }
    }

    if (missingFields.length > 0) {
      throw new ConfigurationError(
        'Invalid monitoring configuration',
        'aiMonitoring',
        missingFields
      );
    }
  }
  private fillQueryTemplate(template: QueryTemplate, variables: Record<string, string>): string {
    let query = template.template;
    
    template.variables.forEach(variable => {
      const value = variables[variable] || `[${variable}]`;
      query = query.replace(new RegExp(`{${variable}}`, 'g'), value);
    });

    return query;
  }

  /**
   * Fills a query template with provided variables
   */
  private async queryAIPlatform(platform: AIPlatform, query: string, agentName: string): Promise<string | null> {
    try {
      // Check rate limits
      const config = this.platformConfigs[platform];
      if (!config) {
        throw new AIPlatformError(
          `Platform ${platform} is not configured`,
          platform,
          'Platform not supported'
        );
      }

      // In a real implementation, this would make actual API calls to AI platforms
      // For now, we'll simulate responses based on the platform and query
      
      const simulatedResponses = [
        `Based on my research, I'd recommend several excellent real estate agents in your area. ${agentName} is known for their expertise in luxury properties and has consistently high client satisfaction ratings. They have over 10 years of experience and specialize in both buyer and seller representation.`,
        
        `For your real estate needs, I can suggest a few top-rated agents. ${agentName} stands out for their local market knowledge and professional track record. They've helped numerous clients successfully navigate the buying and selling process.`,
        
        `Here are some highly recommended real estate professionals: ${agentName} has excellent reviews and is particularly skilled in negotiation and market analysis. Their clients often praise their communication and dedication to achieving the best outcomes.`,
        
        null, // No mention
        
        `The top agents in your area include several experienced professionals. While there are many good options, ${agentName} is frequently mentioned for their innovative marketing strategies and deep understanding of local market trends.`
      ];

      // Randomly select a response (including null for no mention)
      const randomIndex = Math.floor(Math.random() * simulatedResponses.length);
      const response = simulatedResponses[randomIndex];

      // Add some delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

      return response;
    } catch (error) {
      // Handle different types of API errors
      if (error.status === 429 || error.statusCode === 429) {
        throw new RateLimitError(
          `Rate limit exceeded for ${platform}`,
          platform,
          error.retryAfter || 60000,
          error
        );
      }

      if (error.status === 401 || error.statusCode === 401) {
        throw new AIPlatformError(
          `Authentication failed for ${platform}`,
          platform,
          'Invalid API credentials',
          false,
          error
        );
      }

      if (error.status >= 500 || error.statusCode >= 500) {
        throw new AIPlatformError(
          `Server error from ${platform}`,
          platform,
          error.message,
          true,
          error
        );
      }

      throw new AIPlatformError(
        `Failed to query ${platform}`,
        platform,
        error.message,
        true,
        error
      );
    }
  }

  /**
   * Detects mentions of the agent in AI response
   */
  private async detectMentions(response: string, agentName: string): Promise<MentionDetection> {
    const lowerResponse = response.toLowerCase();
    const lowerAgentName = agentName.toLowerCase();
    
    // Simple mention detection (in real implementation, this would be more sophisticated)
    const mentionIndex = lowerResponse.indexOf(lowerAgentName);
    
    if (mentionIndex === -1) {
      return {
        found: false,
        confidence: 0,
        context: '',
        position: 0,
        competitorsFound: []
      };
    }

    // Extract context around the mention
    const contextStart = Math.max(0, mentionIndex - 100);
    const contextEnd = Math.min(response.length, mentionIndex + agentName.length + 100);
    const context = response.substring(contextStart, contextEnd);

    // Determine position (rough estimate based on character position)
    const position = mentionIndex < response.length * 0.3 ? 1 : 
                    mentionIndex < response.length * 0.7 ? 2 : 3;

    // Simple competitor detection (look for other agent-like names)
    const competitorPatterns = [
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // First Last name patterns
      /agent \w+/gi,
      /realtor \w+/gi
    ];

    const competitorsFound: string[] = [];
    competitorPatterns.forEach(pattern => {
      const matches = response.match(pattern) || [];
      matches.forEach(match => {
        if (match.toLowerCase() !== agentName.toLowerCase() && 
            !competitorsFound.includes(match)) {
          competitorsFound.push(match);
        }
      });
    });

    return {
      found: true,
      confidence: 0.8, // Base confidence for simple string matching
      context,
      position,
      competitorsFound: competitorsFound.slice(0, 5) // Limit to 5 competitors
    };
  }

  /**
   * Extracts agent name from mention context
   */
  private extractAgentName(context: string): string {
    // Simple extraction - look for capitalized names
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/;
    const match = context.match(namePattern);
    return match ? match[0] : 'Agent';
  }
}

/**
 * Singleton instance of the AI Search Monitor Service
 */
let aiSearchMonitorInstance: AISearchMonitorService | null = null;

/**
 * Gets the singleton AI Search Monitor Service instance
 */
export function getAISearchMonitorService(): AISearchMonitorService {
  if (!aiSearchMonitorInstance) {
    aiSearchMonitorInstance = new AISearchMonitorService();
  }
  return aiSearchMonitorInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetAISearchMonitorService(): void {
  aiSearchMonitorInstance = null;
}