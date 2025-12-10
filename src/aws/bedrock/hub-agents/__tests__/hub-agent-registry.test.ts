/**
 * Hub Agent Registry Tests
 * 
 * Tests for the improved hub agent registry with caching,
 * scoring strategies, and performance optimizations.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { HubAgentRegistry, type HubAgentConfig, type AgentRecommendationContext } from '../hub-agent-registry';
import { WeightedScoringStrategy, PerformanceScoringStrategy, QualityScoringStrategy } from '../agent-scoring';

describe('HubAgentRegistry', () => {
    beforeEach(() => {
        // Reset to default scoring strategy
        HubAgentRegistry.setScoringStrategy(new WeightedScoringStrategy());
    });

    describe('Basic Agent Operations', () => {
        it('should get agent by type', () => {
            const agent = HubAgentRegistry.getAgent('studio-creative');
            expect(agent).toBeDefined();
            expect(agent?.hub).toBe('studio');
            expect(agent?.name).toContain('Maya');
        });

        it('should get agent by hub name', () => {
            const agent = HubAgentRegistry.getAgentByHub('brand');
            expect(agent).toBeDefined();
            expect(agent?.hub).toBe('brand');
            expect(agent?.name).toContain('Alex');
        });

        it('should return undefined for non-existent hub', () => {
            const agent = HubAgentRegistry.getAgentByHub('non-existent');
            expect(agent).toBeUndefined();
        });

        it('should get all agents', () => {
            const agents = HubAgentRegistry.getAllAgents();
            expect(agents.size).toBe(7); // All hub agents
            expect(agents.has('studio-creative')).toBe(true);
            expect(agents.has('assistant-general')).toBe(true);
        });
    });

    describe('Expertise-based Lookups', () => {
        it('should find agents by expertise', () => {
            const contentAgents = HubAgentRegistry.getAgentsByExpertise('content-creation');
            expect(contentAgents.length).toBeGreaterThan(0);
            expect(contentAgents[0].expertise).toContain('content-creation');
        });

        it('should find agents by task type', () => {
            const analysisAgents = HubAgentRegistry.getAgentsByTaskType('analyze-data');
            expect(analysisAgents.length).toBeGreaterThan(0);
            expect(analysisAgents[0].capabilities.taskTypes).toContain('analyze-data');
        });

        it('should return empty array for non-existent expertise', () => {
            const agents = HubAgentRegistry.getAgentsByExpertise('non-existent-skill');
            expect(agents).toEqual([]);
        });
    });

    describe('Agent Recommendations', () => {
        it('should recommend agent based on hub context', () => {
            const context: AgentRecommendationContext = {
                taskType: 'generate-content',
                hubContext: 'studio'
            };

            const agent = HubAgentRegistry.getRecommendedAgent(context);
            expect(agent).toBeDefined();
            expect(agent?.hub).toBe('studio');
        });

        it('should recommend agent based on expertise', () => {
            const context: AgentRecommendationContext = {
                taskType: 'analyze-market',
                expertiseRequired: ['market-research', 'data-analysis']
            };

            const agent = HubAgentRegistry.getRecommendedAgent(context);
            expect(agent).toBeDefined();
            expect(agent?.expertise.some(exp =>
                ['market-research', 'data-analysis'].includes(exp)
            )).toBe(true);
        });

        it('should fallback to general assistant when no matches', () => {
            const context: AgentRecommendationContext = {
                taskType: 'unknown-task',
                expertiseRequired: ['unknown-expertise']
            };

            const agent = HubAgentRegistry.getRecommendedAgent(context);
            expect(agent).toBeDefined();
            expect(agent?.id).toBe('assistant-general-agent');
        });

        it('should support legacy function signature', () => {
            const agent = HubAgentRegistry.getRecommendedAgent(
                'generate-content',
                'studio',
                ['content-creation']
            );
            expect(agent).toBeDefined();
            expect(agent?.hub).toBe('studio');
        });

        it('should return multiple recommendations with scores', () => {
            const context: AgentRecommendationContext = {
                taskType: 'general-query',
                expertiseRequired: ['content-creation']
            };

            const recommendations = HubAgentRegistry.getAgentRecommendations(context, 3);
            expect(recommendations.length).toBeLessThanOrEqual(3);
            expect(recommendations[0].score).toBeGreaterThanOrEqual(recommendations[1]?.score || 0);

            // Verify structure
            recommendations.forEach(rec => {
                expect(rec.agent).toBeDefined();
                expect(typeof rec.score).toBe('number');
            });
        });
    });

    describe('Scoring Strategies', () => {
        it('should use performance strategy when prioritizePerformance is true', () => {
            const context: AgentRecommendationContext = {
                taskType: 'generate-content',
                prioritizePerformance: true
            };

            const agent = HubAgentRegistry.getRecommendedAgent(context);
            expect(agent).toBeDefined();
            // Performance strategy should favor agents with higher speed scores
        });

        it('should use quality strategy when prioritizeQuality is true', () => {
            const context: AgentRecommendationContext = {
                taskType: 'research-query',
                prioritizeQuality: true
            };

            const agent = HubAgentRegistry.getRecommendedAgent(context);
            expect(agent).toBeDefined();
            // Quality strategy should favor agents with higher quality scores
        });

        it('should allow setting custom scoring strategy', () => {
            const customStrategy = new QualityScoringStrategy();
            HubAgentRegistry.setScoringStrategy(customStrategy);

            const context: AgentRecommendationContext = {
                taskType: 'analyze-data'
            };

            const agent = HubAgentRegistry.getRecommendedAgent(context);
            expect(agent).toBeDefined();
        });
    });

    describe('Agent Management', () => {
        const testAgentConfig: HubAgentConfig = {
            id: 'test-agent',
            name: 'Test Agent',
            hub: 'test',
            personality: 'Test personality',
            expertise: ['testing'],
            systemPrompt: 'Test prompt',
            capabilities: {
                expertise: ['testing'],
                taskTypes: ['test-task'],
                qualityScore: 0.8,
                speedScore: 0.9,
                reliabilityScore: 0.85,
                maxConcurrentTasks: 2,
                preferredModel: 'test-model'
            },
            proactiveFeatures: ['test-feature']
        };

        it('should register new agent', () => {
            HubAgentRegistry.registerAgent('studio-creative' as any, testAgentConfig);
            const agent = HubAgentRegistry.getAgent('studio-creative' as any);
            expect(agent?.id).toBe('test-agent');
        });

        it('should update existing agent', () => {
            const updated = HubAgentRegistry.updateAgent('studio-creative', {
                name: 'Updated Maya'
            });
            expect(updated).toBe(true);

            const agent = HubAgentRegistry.getAgent('studio-creative');
            expect(agent?.name).toBe('Updated Maya');
        });

        it('should not update non-existent agent', () => {
            const updated = HubAgentRegistry.updateAgent('non-existent' as any, {
                name: 'Test'
            });
            expect(updated).toBe(false);
        });

        it('should validate agent configuration', () => {
            const validConfig = { ...testAgentConfig };
            const validation = HubAgentRegistry.validateAgentConfig(validConfig);
            expect(validation.valid).toBe(true);
            expect(validation.errors).toEqual([]);
        });

        it('should detect invalid agent configuration', () => {
            const invalidConfig = {
                ...testAgentConfig,
                id: '', // Invalid: empty ID
                capabilities: {
                    ...testAgentConfig.capabilities,
                    qualityScore: 1.5 // Invalid: out of range
                }
            };

            const validation = HubAgentRegistry.validateAgentConfig(invalidConfig);
            expect(validation.valid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors.some(err => err.includes('Agent ID'))).toBe(true);
            expect(validation.errors.some(err => err.includes('Quality score'))).toBe(true);
        });
    });

    describe('Statistics and Analytics', () => {
        it('should provide agent statistics', () => {
            const stats = HubAgentRegistry.getAgentStats();

            expect(stats.totalAgents).toBe(7);
            expect(stats.agentsByHub).toBeDefined();
            expect(stats.agentsByHub['studio']).toBe(1);
            expect(stats.agentsByHub['brand']).toBe(1);
            expect(stats.averageQualityScore).toBeGreaterThan(0);
            expect(stats.averageSpeedScore).toBeGreaterThan(0);
            expect(stats.totalExpertiseAreas).toBeGreaterThan(0);
        });

        it('should calculate correct averages', () => {
            const stats = HubAgentRegistry.getAgentStats();

            expect(stats.averageQualityScore).toBeLessThanOrEqual(1);
            expect(stats.averageSpeedScore).toBeLessThanOrEqual(1);
            expect(stats.averageQualityScore).toBeGreaterThan(0);
            expect(stats.averageSpeedScore).toBeGreaterThan(0);
        });
    });

    describe('Performance and Caching', () => {
        it('should cache recommendation results', () => {
            const context: AgentRecommendationContext = {
                taskType: 'generate-content',
                hubContext: 'studio'
            };

            // First call
            const start1 = performance.now();
            const agent1 = HubAgentRegistry.getRecommendedAgent(context);
            const time1 = performance.now() - start1;

            // Second call (should be cached)
            const start2 = performance.now();
            const agent2 = HubAgentRegistry.getRecommendedAgent(context);
            const time2 = performance.now() - start2;

            expect(agent1).toBe(agent2); // Same reference due to caching
            expect(time2).toBeLessThan(time1); // Cached call should be faster
        });

        it('should handle high-frequency lookups efficiently', () => {
            const contexts = [
                { taskType: 'generate-content', hubContext: 'studio' },
                { taskType: 'analyze-data', hubContext: 'research' },
                { taskType: 'calculate-roi', hubContext: 'tools' },
                { taskType: 'organize-content', hubContext: 'library' }
            ];

            const start = performance.now();

            // Perform many lookups
            for (let i = 0; i < 100; i++) {
                const context = contexts[i % contexts.length];
                HubAgentRegistry.getRecommendedAgent(context);
            }

            const totalTime = performance.now() - start;
            expect(totalTime).toBeLessThan(100); // Should complete in under 100ms
        });
    });
});