/**
 * AI Platform Query Service
 * 
 * Service for querying AI platforms (ChatGPT, Perplexity, Claude, Gemini) to monitor
 * agent visibility in AI search results. Supports query template substitution and
 * mention detection.
 */

/**
 * Query template for generating market-specific queries
 */
export interface QueryTemplate {
    id: string;
    template: string; // e.g., "best real estate agents in {city}"
    category: 'general' | 'expertise' | 'comparison';
}

/**
 * Configuration for an AI platform
 */
export interface AIPlatformConfig {
    name: 'chatgpt' | 'perplexity' | 'claude' | 'gemini';
    apiEndpoint: string;
    apiKey: string;
    rateLimit: number; // requests per day
}

/**
 * Agent data for query generation
 */
export interface AgentData {
    name: string;
    city: string;
    specialties: string[];
    neighborhood?: string;
}

/**
 * Mention detection result
 */
export interface MentionDetectionResult {
    found: boolean;
    snippets: string[];
    position: number; // Character position of first mention
}

/**
 * Default query templates for AI visibility monitoring
 */
export const DEFAULT_QUERY_TEMPLATES: QueryTemplate[] = [
    {
        id: 'general-best-agents',
        template: 'Who are the best real estate agents in {city}?',
        category: 'general',
    },
    {
        id: 'general-top-agents',
        template: 'Top real estate agents in {city}',
        category: 'general',
    },
    {
        id: 'expertise-luxury',
        template: 'Best luxury real estate agents in {city}',
        category: 'expertise',
    },
    {
        id: 'expertise-first-time',
        template: 'Real estate agents for first-time home buyers in {city}',
        category: 'expertise',
    },
    {
        id: 'comparison-vs-competitor',
        template: '{agentName} vs {competitorName} real estate agent',
        category: 'comparison',
    },
    {
        id: 'general-hire-agent',
        template: 'Who should I hire to sell my home in {neighborhood}?',
        category: 'general',
    },
    {
        id: 'expertise-investment',
        template: 'Best real estate agents for investment properties in {city}',
        category: 'expertise',
    },
];

/**
 * Error thrown when AI platform query operations fail
 */
export class AIPlatformQueryError extends Error {
    constructor(
        message: string,
        public readonly platform?: string,
        public readonly originalError?: unknown
    ) {
        super(message);
        this.name = 'AIPlatformQueryError';
    }
}

/**
 * AI Platform Query Service
 * Handles querying AI platforms and detecting agent mentions
 */
export class AIPlatformQueryService {
    private readonly DEFAULT_TIMEOUT_MS = 15000; // 15 seconds
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 2000; // 2 seconds base delay

    /**
     * Query an AI platform with the given query
     * Implements retry logic with exponential backoff for transient failures
     * @param platform Platform configuration
     * @param query Query string
     * @returns AI response text
     */
    async queryPlatform(
        platform: AIPlatformConfig,
        query: string
    ): Promise<string> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                // Create timeout promise
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => {
                        reject(new Error(`Timeout after ${this.DEFAULT_TIMEOUT_MS}ms`));
                    }, this.DEFAULT_TIMEOUT_MS);
                });

                // Race between actual query and timeout
                const queryPromise = this.executePlatformQuery(platform, query);
                const response = await Promise.race([queryPromise, timeoutPromise]);

                return response;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error');

                console.error(
                    `[AIPlatformQueryService] Error querying ${platform.name} (attempt ${attempt}/${this.MAX_RETRIES}):`,
                    error
                );

                // Check if error is retryable
                const isRetryable = this.isRetryableError(error);

                if (!isRetryable || attempt === this.MAX_RETRIES) {
                    // Don't retry for non-retryable errors or if we've exhausted retries
                    break;
                }

                // Exponential backoff: 2s, 4s, 8s
                const delayMs = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(
                    `[AIPlatformQueryService] Retrying ${platform.name} after ${delayMs}ms...`
                );
                await this.delay(delayMs);
            }
        }

        throw new AIPlatformQueryError(
            `Failed to query ${platform.name} after ${this.MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`,
            platform.name,
            lastError
        );
    }

    /**
     * Determines if an error is retryable
     * @param error Error to check
     * @returns True if error is retryable
     */
    private isRetryableError(error: unknown): boolean {
        if (error instanceof AIPlatformQueryError) {
            const message = error.message.toLowerCase();

            // Retry on timeout, network errors, and 5xx server errors
            if (message.includes('timeout') ||
                message.includes('network') ||
                message.includes('econnreset') ||
                message.includes('enotfound') ||
                message.includes('500') ||
                message.includes('502') ||
                message.includes('503') ||
                message.includes('504')) {
                return true;
            }

            // Don't retry on authentication errors, rate limits, or 4xx client errors
            if (message.includes('401') ||
                message.includes('403') ||
                message.includes('429') ||
                message.includes('rate limit') ||
                message.includes('unauthorized') ||
                message.includes('forbidden')) {
                return false;
            }
        }

        // Default to retrying for unknown errors
        return true;
    }

    /**
     * Delay execution
     * @param ms Milliseconds to delay
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Execute platform-specific query
     * @param platform Platform configuration
     * @param query Query string
     * @returns AI response text
     */
    private async executePlatformQuery(
        platform: AIPlatformConfig,
        query: string
    ): Promise<string> {
        switch (platform.name) {
            case 'chatgpt':
                return this.queryChatGPT(platform, query);
            case 'perplexity':
                return this.queryPerplexity(platform, query);
            case 'claude':
                return this.queryClaude(platform, query);
            case 'gemini':
                return this.queryGemini(platform, query);
            default:
                throw new AIPlatformQueryError(
                    `Unsupported platform: ${platform.name}`,
                    platform.name
                );
        }
    }

    /**
     * Query ChatGPT (OpenAI API)
     * @param platform Platform configuration
     * @param query Query string
     * @returns Response text
     */
    private async queryChatGPT(
        platform: AIPlatformConfig,
        query: string
    ): Promise<string> {
        const endpoint = platform.apiEndpoint || 'https://api.openai.com/v1/chat/completions';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${platform.apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
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
            const errorText = await response.text();
            let errorMessage = `ChatGPT API error (${response.status}): ${response.statusText}`;

            // Handle specific error cases
            if (response.status === 429) {
                errorMessage = 'ChatGPT rate limit exceeded. Please try again later.';
            } else if (response.status === 401) {
                errorMessage = 'ChatGPT authentication failed. Please check your API key.';
            } else if (response.status === 503) {
                errorMessage = 'ChatGPT service is temporarily unavailable. Please try again later.';
            } else if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch {
                    // If parsing fails, use the raw error text
                    errorMessage += ` - ${errorText}`;
                }
            }

            throw new AIPlatformQueryError(errorMessage, 'chatgpt');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new AIPlatformQueryError(
                'ChatGPT returned an empty response',
                'chatgpt'
            );
        }

        return content;
    }

    /**
     * Query Perplexity API
     * @param platform Platform configuration
     * @param query Query string
     * @returns Response text
     */
    private async queryPerplexity(
        platform: AIPlatformConfig,
        query: string
    ): Promise<string> {
        const endpoint = platform.apiEndpoint || 'https://api.perplexity.ai/chat/completions';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${platform.apiKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
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
            const errorText = await response.text();
            let errorMessage = `Perplexity API error (${response.status}): ${response.statusText}`;

            // Handle specific error cases
            if (response.status === 429) {
                errorMessage = 'Perplexity rate limit exceeded. Please try again later.';
            } else if (response.status === 401) {
                errorMessage = 'Perplexity authentication failed. Please check your API key.';
            } else if (response.status === 503) {
                errorMessage = 'Perplexity service is temporarily unavailable. Please try again later.';
            } else if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch {
                    errorMessage += ` - ${errorText}`;
                }
            }

            throw new AIPlatformQueryError(errorMessage, 'perplexity');
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new AIPlatformQueryError(
                'Perplexity returned an empty response',
                'perplexity'
            );
        }

        return content;
    }

    /**
     * Query Claude (Anthropic API)
     * @param platform Platform configuration
     * @param query Query string
     * @returns Response text
     */
    private async queryClaude(
        platform: AIPlatformConfig,
        query: string
    ): Promise<string> {
        const endpoint = platform.apiEndpoint || 'https://api.anthropic.com/v1/messages';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': platform.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
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
            const errorText = await response.text();
            let errorMessage = `Claude API error (${response.status}): ${response.statusText}`;

            // Handle specific error cases
            if (response.status === 429) {
                errorMessage = 'Claude rate limit exceeded. Please try again later.';
            } else if (response.status === 401) {
                errorMessage = 'Claude authentication failed. Please check your API key.';
            } else if (response.status === 503) {
                errorMessage = 'Claude service is temporarily unavailable. Please try again later.';
            } else if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch {
                    errorMessage += ` - ${errorText}`;
                }
            }

            throw new AIPlatformQueryError(errorMessage, 'claude');
        }

        const data = await response.json();
        const content = data.content?.[0]?.text;

        if (!content) {
            throw new AIPlatformQueryError(
                'Claude returned an empty response',
                'claude'
            );
        }

        return content;
    }

    /**
     * Query Gemini (Google AI API)
     * @param platform Platform configuration
     * @param query Query string
     * @returns Response text
     */
    private async queryGemini(
        platform: AIPlatformConfig,
        query: string
    ): Promise<string> {
        const endpoint =
            platform.apiEndpoint ||
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

        const response = await fetch(`${endpoint}?key=${platform.apiKey}`, {
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
            const errorText = await response.text();
            let errorMessage = `Gemini API error (${response.status}): ${response.statusText}`;

            // Handle specific error cases
            if (response.status === 429) {
                errorMessage = 'Gemini rate limit exceeded. Please try again later.';
            } else if (response.status === 401 || response.status === 403) {
                errorMessage = 'Gemini authentication failed. Please check your API key.';
            } else if (response.status === 503) {
                errorMessage = 'Gemini service is temporarily unavailable. Please try again later.';
            } else if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch {
                    errorMessage += ` - ${errorText}`;
                }
            }

            throw new AIPlatformQueryError(errorMessage, 'gemini');
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new AIPlatformQueryError(
                'Gemini returned an empty response',
                'gemini'
            );
        }

        return content;
    }

    /**
     * Detect mentions of an agent in an AI response
     * @param response AI response text
     * @param agentName Agent name to search for
     * @returns Mention detection result
     */
    async detectMentions(
        response: string,
        agentName: string
    ): Promise<MentionDetectionResult> {
        const lowerResponse = response.toLowerCase();
        const lowerAgentName = agentName.toLowerCase();

        // Find first occurrence
        const position = lowerResponse.indexOf(lowerAgentName);
        const found = position !== -1;

        if (!found) {
            return {
                found: false,
                snippets: [],
                position: -1,
            };
        }

        // Extract snippets around each mention (100 chars before and after)
        const snippets: string[] = [];
        let searchStart = 0;

        while (true) {
            const mentionPos = lowerResponse.indexOf(lowerAgentName, searchStart);
            if (mentionPos === -1) break;

            const snippetStart = Math.max(0, mentionPos - 100);
            const snippetEnd = Math.min(response.length, mentionPos + agentName.length + 100);
            const snippet = response.substring(snippetStart, snippetEnd).trim();

            // Add ellipsis if snippet doesn't start/end at response boundaries
            const formattedSnippet =
                (snippetStart > 0 ? '...' : '') +
                snippet +
                (snippetEnd < response.length ? '...' : '');

            snippets.push(formattedSnippet);
            searchStart = mentionPos + agentName.length;
        }

        return {
            found,
            snippets,
            position,
        };
    }

    /**
     * Generate queries from templates with agent data substitution
     * Handles missing agent data with fallback values
     * @param templates Query templates
     * @param agentData Agent data for substitution
     * @returns Array of generated queries
     */
    generateQueries(
        templates: QueryTemplate[],
        agentData: AgentData
    ): string[] {
        // Provide fallback values for missing data
        const safeAgentData = {
            name: agentData.name || 'real estate agent',
            city: agentData.city || 'your area',
            neighborhood: agentData.neighborhood || agentData.city || 'your area',
            specialties: agentData.specialties && agentData.specialties.length > 0
                ? agentData.specialties
                : ['residential real estate'],
        };

        return templates.map((template) => {
            let query = template.template;

            // Replace placeholders with agent data (with fallbacks)
            query = query.replace(/{agentName}/g, safeAgentData.name);
            query = query.replace(/{city}/g, safeAgentData.city);
            query = query.replace(/{neighborhood}/g, safeAgentData.neighborhood);

            // Replace specialty placeholders if present
            if (query.includes('{specialty}')) {
                query = query.replace(/{specialty}/g, safeAgentData.specialties[0]);
            }

            // Replace competitor name placeholder if present (for comparison queries)
            // This will be handled by the caller if needed
            if (query.includes('{competitorName}')) {
                // Skip this template if competitor name is not provided
                return null;
            }

            return query;
        }).filter((query): query is string => query !== null);
    }
}

/**
 * Create an AI platform query service instance
 * @returns AIPlatformQueryService instance
 */
export function createAIPlatformQueryService(): AIPlatformQueryService {
    return new AIPlatformQueryService();
}
