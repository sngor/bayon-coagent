/**
 * Image Analysis Strand Tests
 * 
 * Unit tests for the ImageAnalysisStrand implementation
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ImageAnalysisStrand, getImageAnalysisStrand, resetImageAnalysisStrand } from '../../multi-modal/image-analysis-strand';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

// Mock the VisionAgent
jest.mock('@/aws/bedrock/vision-agent', () => ({
    getVisionAgent: jest.fn(() => ({
        analyze: jest.fn(async () => ({
            visualElements: {
                materials: ['hardwood', 'granite', 'stainless steel'],
                colors: ['white', 'gray', 'natural wood'],
                lighting: 'natural' as const,
                size: 'medium' as const,
                layout: 'Open concept kitchen with island',
                notableFeatures: ['Modern appliances', 'Large windows', 'Pendant lighting'],
            },
            recommendations: [
                {
                    action: 'Stage the island with fresh flowers or a fruit bowl',
                    rationale: 'Adds warmth and makes the space feel lived-in',
                    estimatedCost: 'low' as const,
                    priority: 'medium' as const,
                    expectedImpact: 'Improved visual appeal in photos',
                },
                {
                    action: 'Improve lighting by opening blinds fully',
                    rationale: 'Natural light enhances the space and improves photo quality',
                    estimatedCost: 'low' as const,
                    priority: 'high' as const,
                    expectedImpact: 'Better photo quality and brighter appearance',
                },
            ],
            marketAlignment: 'Modern kitchens with natural light are highly sought after in Austin, TX',
            overallAssessment: 'Well-maintained modern kitchen with good natural lighting',
            answer: 'This kitchen is in excellent condition with modern finishes',
        })),
    })),
}));

describe('ImageAnalysisStrand', () => {
    let strand: ImageAnalysisStrand;
    const mockAgentProfile: AgentProfile = {
        id: 'agent-test-123',
        userId: 'user-test-123',
        agentName: 'Test Agent',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury',
        preferredTone: 'warm-consultative',
        corePrinciple: 'Test principle',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    beforeEach(() => {
        resetImageAnalysisStrand();
        strand = new ImageAnalysisStrand('test-strand-123');
    });

    afterEach(() => {
        resetImageAnalysisStrand();
    });

    describe('Initialization', () => {
        it('should initialize with correct type', () => {
            expect(strand.type).toBe('image-analyzer');
        });

        it('should initialize with idle state', () => {
            expect(strand.state).toBe('idle');
        });

        it('should have appropriate capabilities', () => {
            expect(strand.capabilities.expertise).toContain('image-analysis');
            expect(strand.capabilities.expertise).toContain('quality-assessment');
            expect(strand.capabilities.expertise).toContain('content-identification');
            expect(strand.capabilities.taskTypes).toContain('image-quality-assessment');
            expect(strand.capabilities.taskTypes).toContain('comprehensive-analysis');
        });

        it('should have high quality and reliability scores', () => {
            expect(strand.capabilities.qualityScore).toBeGreaterThanOrEqual(0.9);
            expect(strand.capabilities.reliabilityScore).toBeGreaterThanOrEqual(0.9);
        });

        it('should support concurrent tasks', () => {
            expect(strand.capabilities.maxConcurrentTasks).toBeGreaterThan(0);
        });
    });

    describe('Comprehensive Analysis', () => {
        it('should perform comprehensive image analysis', async () => {
            const analysis = await strand.analyzeImage({
                imageData: 'base64-encoded-image-data',
                imageFormat: 'jpeg',
                analysisType: 'comprehensive',
                agentProfile: mockAgentProfile,
            }, 'user-test-123');

            // Verify quality metrics are present
            expect(analysis.quality).toBeDefined();
            expect(analysis.quality.overall).toBeGreaterThan(0);
            expect(analysis.quality.overall).toBeLessThanOrEqual(1);
            expect(analysis.quality.resolution).toBeDefined();
            expect(analysis.quality.lighting).toBeDefined();
            expect(analysis.quality.composition).toBeDefined();
            expect(analysis.quality.clarity).toBeDefined();

            // Verify content identification
            expect(analysis.content).toBeDefined();
            expect(analysis.content.roomType).toBeDefined();
            expect(analysis.content.materials).toBeInstanceOf(Array);
            expect(analysis.content.colors).toBeInstanceOf(Array);
            expect(analysis.content.features).toBeInstanceOf(Array);

            // Verify suggestions
            expect(analysis.suggestions).toBeInstanceOf(Array);
            expect(analysis.suggestions.length).toBeGreaterThan(0);

            const firstSuggestion = analysis.suggestions[0];
            expect(firstSuggestion.type).toBeDefined();
            expect(firstSuggestion.description).toBeDefined();
            expect(firstSuggestion.rationale).toBeDefined();
            expect(firstSuggestion.estimatedCost).toMatch(/^(low|medium|high)$/);
            expect(firstSuggestion.priority).toMatch(/^(high|medium|low)$/);

            // Verify overall assessment
            expect(analysis.overallAssessment).toBeDefined();
            expect(typeof analysis.overallAssessment).toBe('string');
        });

        it('should update metrics after successful analysis', async () => {
            const initialTasksCompleted = strand.metrics.tasksCompleted;

            await strand.analyzeImage({
                imageData: 'base64-encoded-image-data',
                imageFormat: 'jpeg',
                analysisType: 'comprehensive',
            }, 'user-test-123');

            expect(strand.metrics.tasksCompleted).toBe(initialTasksCompleted + 1);
            expect(strand.metrics.successRate).toBeGreaterThan(0);
            expect(strand.metrics.avgExecutionTime).toBeGreaterThan(0);
        });

        it('should include market alignment when agent profile is provided', async () => {
            const analysis = await strand.analyzeImage({
                imageData: 'base64-encoded-image-data',
                imageFormat: 'jpeg',
                analysisType: 'comprehensive',
                agentProfile: mockAgentProfile,
            }, 'user-test-123');

            expect(analysis.marketAlignment).toBeDefined();
            expect(typeof analysis.marketAlignment).toBe('string');
        });
    });

    describe('Quality Assessment', () => {
        it('should assess image quality', async () => {
            const quality = await strand.assessQuality(
                'base64-encoded-image-data',
                'jpeg',
                'user-test-123'
            );

            expect(quality.overall).toBeGreaterThan(0);
            expect(quality.overall).toBeLessThanOrEqual(1);
            expect(quality.resolution).toBeGreaterThan(0);
            expect(quality.lighting).toBeGreaterThan(0);
            expect(quality.composition).toBeGreaterThan(0);
            expect(quality.clarity).toBeGreaterThan(0);
        });

        it('should calculate overall quality as average of components', async () => {
            const quality = await strand.assessQuality(
                'base64-encoded-image-data',
                'jpeg',
                'user-test-123'
            );

            const calculatedAverage = (
                quality.resolution +
                quality.lighting +
                quality.composition +
                quality.clarity
            ) / 4;

            expect(quality.overall).toBeCloseTo(calculatedAverage, 2);
        });
    });

    describe('Content Identification', () => {
        it('should identify image content', async () => {
            const content = await strand.identifyContent(
                'base64-encoded-image-data',
                'jpeg',
                'Single Family Home',
                'user-test-123'
            );

            expect(content.roomType).toBeDefined();
            expect(typeof content.roomType).toBe('string');
            expect(content.materials).toBeInstanceOf(Array);
            expect(content.colors).toBeInstanceOf(Array);
            expect(content.features).toBeInstanceOf(Array);
            expect(content.style).toBeDefined();
            expect(content.condition).toBeDefined();
        });

        it('should identify materials from visual elements', async () => {
            const content = await strand.identifyContent(
                'base64-encoded-image-data',
                'jpeg',
                undefined,
                'user-test-123'
            );

            expect(content.materials).toContain('hardwood');
            expect(content.materials).toContain('granite');
            expect(content.materials).toContain('stainless steel');
        });

        it('should identify colors from visual elements', async () => {
            const content = await strand.identifyContent(
                'base64-encoded-image-data',
                'jpeg',
                undefined,
                'user-test-123'
            );

            expect(content.colors).toContain('white');
            expect(content.colors).toContain('gray');
            expect(content.colors).toContain('natural wood');
        });
    });

    describe('Improvement Suggestions', () => {
        it('should generate improvement suggestions', async () => {
            const suggestions = await strand.suggestImprovements(
                'base64-encoded-image-data',
                'jpeg',
                mockAgentProfile,
                'user-test-123'
            );

            expect(suggestions).toBeInstanceOf(Array);
            expect(suggestions.length).toBeGreaterThan(0);
        });

        it('should categorize suggestions by type', async () => {
            const suggestions = await strand.suggestImprovements(
                'base64-encoded-image-data',
                'jpeg',
                mockAgentProfile,
                'user-test-123'
            );

            const validTypes = ['staging', 'lighting', 'angle', 'editing', 'declutter', 'repair', 'enhancement'];
            suggestions.forEach(suggestion => {
                expect(validTypes).toContain(suggestion.type);
            });
        });

        it('should include cost estimates', async () => {
            const suggestions = await strand.suggestImprovements(
                'base64-encoded-image-data',
                'jpeg',
                mockAgentProfile,
                'user-test-123'
            );

            suggestions.forEach(suggestion => {
                expect(['low', 'medium', 'high']).toContain(suggestion.estimatedCost);
            });
        });

        it('should include priority levels', async () => {
            const suggestions = await strand.suggestImprovements(
                'base64-encoded-image-data',
                'jpeg',
                mockAgentProfile,
                'user-test-123'
            );

            suggestions.forEach(suggestion => {
                expect(['high', 'medium', 'low']).toContain(suggestion.priority);
            });
        });

        it('should include rationale and expected impact', async () => {
            const suggestions = await strand.suggestImprovements(
                'base64-encoded-image-data',
                'jpeg',
                mockAgentProfile,
                'user-test-123'
            );

            suggestions.forEach(suggestion => {
                expect(suggestion.rationale).toBeDefined();
                expect(typeof suggestion.rationale).toBe('string');
                expect(suggestion.expectedImpact).toBeDefined();
                expect(typeof suggestion.expectedImpact).toBe('string');
            });
        });
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = getImageAnalysisStrand();
            const instance2 = getImageAnalysisStrand();

            expect(instance1).toBe(instance2);
        });

        it('should reset singleton instance', () => {
            const instance1 = getImageAnalysisStrand();
            resetImageAnalysisStrand();
            const instance2 = getImageAnalysisStrand();

            expect(instance1).not.toBe(instance2);
        });
    });

    describe('State Management', () => {
        it('should update lastActiveAt timestamp', async () => {
            const initialTimestamp = strand.lastActiveAt;

            // Wait a bit to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));

            await strand.analyzeImage({
                imageData: 'base64-encoded-image-data',
                imageFormat: 'jpeg',
                analysisType: 'comprehensive',
            }, 'user-test-123');

            expect(strand.lastActiveAt).not.toBe(initialTimestamp);
        });
    });
});
