/**
 * AI Platform Query Service Tests
 * 
 * Unit tests for the AIPlatformQueryService class
 */

import {
    AIPlatformQueryService,
    AIPlatformConfig,
    QueryTemplate,
    AgentData,
    DEFAULT_QUERY_TEMPLATES,
} from '../ai-platform-query';

describe('AIPlatformQueryService', () => {
    let service: AIPlatformQueryService;

    beforeEach(() => {
        service = new AIPlatformQueryService();
    });

    describe('Constructor', () => {
        it('should create an instance', () => {
            expect(service).toBeInstanceOf(AIPlatformQueryService);
        });
    });

    describe('detectMentions', () => {
        it('should detect agent name in response', async () => {
            const response = 'Jane Smith is a top real estate agent in Seattle with excellent reviews.';
            const result = await service.detectMentions(response, 'Jane Smith');

            expect(result.found).toBe(true);
            expect(result.position).toBeGreaterThanOrEqual(0);
            expect(result.snippets.length).toBeGreaterThan(0);
        });

        it('should be case-insensitive', async () => {
            const response = 'JANE SMITH is highly recommended for luxury properties.';
            const result = await service.detectMentions(response, 'jane smith');

            expect(result.found).toBe(true);
        });

        it('should return false when agent not mentioned', async () => {
            const response = 'Other agents in the area include John Doe and Bob Johnson.';
            const result = await service.detectMentions(response, 'Jane Smith');

            expect(result.found).toBe(false);
            expect(result.snippets).toHaveLength(0);
            expect(result.position).toBe(-1);
        });

        it('should extract multiple snippets for multiple mentions', async () => {
            const response =
                'Jane Smith is a top agent. Many clients recommend Jane Smith for her expertise.';
            const result = await service.detectMentions(response, 'Jane Smith');

            expect(result.found).toBe(true);
            expect(result.snippets.length).toBe(2);
        });

        it('should include context around mentions', async () => {
            const response =
                'In the Seattle market, Jane Smith has been recognized as one of the leading luxury real estate agents.';
            const result = await service.detectMentions(response, 'Jane Smith');

            expect(result.found).toBe(true);
            expect(result.snippets[0]).toContain('Jane Smith');
            expect(result.snippets[0].length).toBeGreaterThan('Jane Smith'.length);
        });

        it('should add ellipsis for truncated snippets', async () => {
            const longPrefix = 'a'.repeat(150);
            const longSuffix = 'b'.repeat(150);
            const response = `${longPrefix}Jane Smith${longSuffix}`;
            const result = await service.detectMentions(response, 'Jane Smith');

            expect(result.found).toBe(true);
            expect(result.snippets[0]).toMatch(/^\.\.\./);
            expect(result.snippets[0]).toMatch(/\.\.\.$/);
        });
    });

    describe('generateQueries', () => {
        const agentData: AgentData = {
            name: 'Jane Smith',
            city: 'Seattle',
            specialties: ['luxury', 'waterfront'],
            neighborhood: 'Capitol Hill',
        };

        it('should substitute agent name in templates', () => {
            const templates: QueryTemplate[] = [
                {
                    id: 'test-1',
                    template: 'Is {agentName} a good real estate agent?',
                    category: 'general',
                },
            ];

            const queries = service.generateQueries(templates, agentData);

            expect(queries).toHaveLength(1);
            expect(queries[0]).toBe('Is Jane Smith a good real estate agent?');
        });

        it('should substitute city in templates', () => {
            const templates: QueryTemplate[] = [
                {
                    id: 'test-2',
                    template: 'Best real estate agents in {city}',
                    category: 'general',
                },
            ];

            const queries = service.generateQueries(templates, agentData);

            expect(queries[0]).toBe('Best real estate agents in Seattle');
        });

        it('should substitute neighborhood in templates', () => {
            const templates: QueryTemplate[] = [
                {
                    id: 'test-3',
                    template: 'Who should I hire to sell my home in {neighborhood}?',
                    category: 'general',
                },
            ];

            const queries = service.generateQueries(templates, agentData);

            expect(queries[0]).toBe('Who should I hire to sell my home in Capitol Hill?');
        });

        it('should use city as fallback for neighborhood', () => {
            const agentDataNoNeighborhood: AgentData = {
                name: 'Jane Smith',
                city: 'Seattle',
                specialties: ['luxury'],
            };

            const templates: QueryTemplate[] = [
                {
                    id: 'test-4',
                    template: 'Agents in {neighborhood}',
                    category: 'general',
                },
            ];

            const queries = service.generateQueries(templates, agentDataNoNeighborhood);

            expect(queries[0]).toBe('Agents in Seattle');
        });

        it('should substitute specialty in templates', () => {
            const templates: QueryTemplate[] = [
                {
                    id: 'test-5',
                    template: 'Best {specialty} real estate agents',
                    category: 'expertise',
                },
            ];

            const queries = service.generateQueries(templates, agentData);

            expect(queries[0]).toBe('Best luxury real estate agents');
        });

        it('should handle multiple placeholders in one template', () => {
            const templates: QueryTemplate[] = [
                {
                    id: 'test-6',
                    template: 'Is {agentName} the best agent in {city}?',
                    category: 'general',
                },
            ];

            const queries = service.generateQueries(templates, agentData);

            expect(queries[0]).toBe('Is Jane Smith the best agent in Seattle?');
        });

        it('should process multiple templates', () => {
            const templates: QueryTemplate[] = [
                {
                    id: 'test-7',
                    template: 'Best agents in {city}',
                    category: 'general',
                },
                {
                    id: 'test-8',
                    template: '{agentName} reviews',
                    category: 'general',
                },
            ];

            const queries = service.generateQueries(templates, agentData);

            expect(queries).toHaveLength(2);
            expect(queries[0]).toBe('Best agents in Seattle');
            expect(queries[1]).toBe('Jane Smith reviews');
        });
    });

    describe('DEFAULT_QUERY_TEMPLATES', () => {
        it('should have predefined templates', () => {
            expect(DEFAULT_QUERY_TEMPLATES).toBeDefined();
            expect(DEFAULT_QUERY_TEMPLATES.length).toBeGreaterThan(0);
        });

        it('should have valid template structure', () => {
            DEFAULT_QUERY_TEMPLATES.forEach((template) => {
                expect(template.id).toBeDefined();
                expect(template.template).toBeDefined();
                expect(template.category).toBeDefined();
                expect(['general', 'expertise', 'comparison']).toContain(template.category);
            });
        });

        it('should have unique template IDs', () => {
            const ids = DEFAULT_QUERY_TEMPLATES.map((t) => t.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should include general queries', () => {
            const generalTemplates = DEFAULT_QUERY_TEMPLATES.filter(
                (t) => t.category === 'general'
            );
            expect(generalTemplates.length).toBeGreaterThan(0);
        });

        it('should include expertise queries', () => {
            const expertiseTemplates = DEFAULT_QUERY_TEMPLATES.filter(
                (t) => t.category === 'expertise'
            );
            expect(expertiseTemplates.length).toBeGreaterThan(0);
        });

        it('should include comparison queries', () => {
            const comparisonTemplates = DEFAULT_QUERY_TEMPLATES.filter(
                (t) => t.category === 'comparison'
            );
            expect(comparisonTemplates.length).toBeGreaterThan(0);
        });
    });

    describe('Platform Configuration', () => {
        it('should accept valid platform config', () => {
            const config: AIPlatformConfig = {
                name: 'chatgpt',
                apiEndpoint: 'https://api.openai.com/v1/chat/completions',
                apiKey: 'test-key',
                rateLimit: 100,
            };

            expect(config.name).toBe('chatgpt');
            expect(config.apiKey).toBeDefined();
        });

        it('should support all platform types', () => {
            const platforms: AIPlatformConfig['name'][] = [
                'chatgpt',
                'perplexity',
                'claude',
                'gemini',
            ];

            platforms.forEach((platform) => {
                const config: AIPlatformConfig = {
                    name: platform,
                    apiEndpoint: 'https://example.com',
                    apiKey: 'test-key',
                    rateLimit: 100,
                };

                expect(config.name).toBe(platform);
            });
        });
    });
});
