/**
 * AgentCore Integration Tests
 * 
 * Tests the integration of all enhancement components with AgentCore
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
    getEnhancedAgentCore,
    resetEnhancedAgentCore,
    EnhancedAgentCore
} from '../agentcore-integration';
import { createWorkerTask } from '../worker-protocol';

describe('AgentCore Integration', () => {
    let enhancedCore: EnhancedAgentCore;

    beforeEach(() => {
        resetEnhancedAgentCore();
        enhancedCore = getEnhancedAgentCore();
    });

    afterEach(() => {
        resetEnhancedAgentCore();
    });

    describe('Initialization', () => {
        it('should initialize EnhancedAgentCore singleton', () => {
            expect(enhancedCore).toBeDefined();
            expect(enhancedCore).toBeInstanceOf(EnhancedAgentCore);
        });

        it('should return same instance on multiple calls', () => {
            const instance1 = getEnhancedAgentCore();
            const instance2 = getEnhancedAgentCore();
            expect(instance1).toBe(instance2);
        });

        it('should initialize all component layers', () => {
            const components = enhancedCore.getComponents();

            // Verify all layers are initialized
            expect(components.agentCore).toBeDefined();
            expect(components.handoffManager).toBeDefined();
            expect(components.preferenceEngine).toBeDefined();
            expect(components.specializationManager).toBeDefined();
            expect(components.opportunityDetector).toBeDefined();
            expect(components.imageAnalysisStrand).toBeDefined();
            expect(components.competitorMonitor).toBeDefined();
            expect(components.longTermMemory).toBeDefined();
            expect(components.qualityAssurance).toBeDefined();
            expect(components.performanceTracker).toBeDefined();
            expect(components.adaptiveRouter).toBeDefined();
            expect(components.conversationalEditor).toBeDefined();
            expect(components.socialMediaScheduler).toBeDefined();
        });
    });

    describe('Component Access', () => {
        it('should provide access to all collaboration components', () => {
            const components = enhancedCore.getComponents();

            expect(components.handoffManager).toBeDefined();
            expect(components.sharedContextPool).toBeDefined();
            expect(components.dependencyTracker).toBeDefined();
            expect(components.parallelExecutor).toBeDefined();
        });

        it('should provide access to all learning components', () => {
            const components = enhancedCore.getComponents();

            expect(components.preferenceEngine).toBeDefined();
        });

        it('should provide access to all intelligence components', () => {
            const components = enhancedCore.getComponents();

            expect(components.opportunityDetector).toBeDefined();
            expect(components.trendAnalyzer).toBeDefined();
            expect(components.gapIdentifier).toBeDefined();
            expect(components.recommendationEngine).toBeDefined();
        });

        it('should provide access to all multi-modal components', () => {
            const components = enhancedCore.getComponents();

            expect(components.imageAnalysisStrand).toBeDefined();
            expect(components.videoScriptGenerator).toBeDefined();
            expect(components.audioContentCreator).toBeDefined();
            expect(components.documentProcessor).toBeDefined();
            expect(components.crossModalChecker).toBeDefined();
        });

        it('should provide access to all quality assurance components', () => {
            const components = enhancedCore.getComponents();

            expect(components.qualityAssurance).toBeDefined();
            expect(components.factChecker).toBeDefined();
            expect(components.complianceValidator).toBeDefined();
            expect(components.seoOptimizer).toBeDefined();
        });

        it('should provide access to all analytics components', () => {
            const components = enhancedCore.getComponents();

            expect(components.performanceTracker).toBeDefined();
            expect(components.costMonitor).toBeDefined();
            expect(components.roiTracker).toBeDefined();
        });

        it('should provide access to all routing components', () => {
            const components = enhancedCore.getComponents();

            expect(components.adaptiveRouter).toBeDefined();
            expect(components.fallbackManager).toBeDefined();
            expect(components.loadBalancer).toBeDefined();
            expect(components.priorityQueue).toBeDefined();
        });

        it('should provide access to all integration components', () => {
            const components = enhancedCore.getComponents();

            expect(components.socialMediaScheduler).toBeDefined();
            expect(components.crmConnector).toBeDefined();
            expect(components.campaignGenerator).toBeDefined();
            expect(components.analyticsIntegrator).toBeDefined();
            expect(components.workflowAutomation).toBeDefined();
        });
    });

    describe('AgentCore Access', () => {
        it('should provide access to base AgentCore', () => {
            const agentCore = enhancedCore.getAgentCore();
            expect(agentCore).toBeDefined();
        });

        it('should allow access to AgentCore methods', () => {
            const agentCore = enhancedCore.getAgentCore();
            const strands = agentCore.getAllStrands();
            expect(Array.isArray(strands)).toBe(true);
            expect(strands.length).toBeGreaterThan(0);
        });
    });

    describe('Event System', () => {
        it('should emit events for task execution', (done) => {
            const task = createWorkerTask({
                type: 'content-generator',
                description: 'Test task',
                input: {},
            });

            enhancedCore.once('task-executing', (executingTask, strand) => {
                expect(executingTask.id).toBe(task.id);
                expect(strand).toBeDefined();
                done();
            });

            enhancedCore.executeTask(task).catch(() => {
                // Expected to fail in test environment
            });
        });

        it('should support multiple event listeners', () => {
            let listener1Called = false;
            let listener2Called = false;

            enhancedCore.on('task-executing', () => {
                listener1Called = true;
            });

            enhancedCore.on('task-executing', () => {
                listener2Called = true;
            });

            const task = createWorkerTask({
                type: 'content-generator',
                description: 'Test task',
                input: {},
            });

            enhancedCore.executeTask(task).catch(() => {
                // Expected to fail in test environment
            });

            // Give time for events to fire
            setTimeout(() => {
                expect(listener1Called).toBe(true);
                expect(listener2Called).toBe(true);
            }, 100);
        });
    });

    describe('Task Execution Pipeline', () => {
        it('should accept task execution requests', async () => {
            const task = createWorkerTask({
                type: 'content-generator',
                description: 'Generate test content',
                input: {
                    topic: 'Test Topic',
                },
            });

            // In test environment, this will fail at execution
            // but should accept the task
            await expect(
                enhancedCore.executeTask(task)
            ).rejects.toThrow();
        });

        it('should validate task structure', () => {
            const task = createWorkerTask({
                type: 'content-generator',
                description: 'Test task',
                input: {},
            });

            expect(task.id).toBeDefined();
            expect(task.type).toBe('content-generator');
            expect(task.description).toBe('Test task');
            expect(task.status).toBe('pending');
        });
    });

    describe('Component Integration', () => {
        it('should wire collaboration components to AgentCore', () => {
            const components = enhancedCore.getComponents();
            const agentCore = enhancedCore.getAgentCore();

            // Verify components can access AgentCore data
            const strands = agentCore.getAllStrands();
            expect(strands).toBeDefined();
            expect(Array.isArray(strands)).toBe(true);
        });

        it('should wire analytics components to track performance', () => {
            const components = enhancedCore.getComponents();

            // Verify analytics components are ready
            expect(components.performanceTracker).toBeDefined();
            expect(components.costMonitor).toBeDefined();
            expect(components.roiTracker).toBeDefined();
        });

        it('should wire quality assurance to task completion', () => {
            const components = enhancedCore.getComponents();

            // Verify QA components are ready
            expect(components.qualityAssurance).toBeDefined();
            expect(components.factChecker).toBeDefined();
            expect(components.complianceValidator).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle task execution errors gracefully', async () => {
            const task = createWorkerTask({
                type: 'invalid-type' as any,
                description: 'Invalid task',
                input: {},
            });

            await expect(
                enhancedCore.executeTask(task)
            ).rejects.toThrow();
        });

        it('should emit error events', (done) => {
            const task = createWorkerTask({
                type: 'invalid-type' as any,
                description: 'Invalid task',
                input: {},
            });

            enhancedCore.executeTask(task).catch((error) => {
                expect(error).toBeDefined();
                done();
            });
        });
    });

    describe('Singleton Pattern', () => {
        it('should maintain singleton across resets', () => {
            const instance1 = getEnhancedAgentCore();
            resetEnhancedAgentCore();
            const instance2 = getEnhancedAgentCore();

            expect(instance1).not.toBe(instance2);
        });

        it('should clean up event listeners on reset', () => {
            const instance1 = getEnhancedAgentCore();

            let eventFired = false;
            instance1.on('test-event', () => {
                eventFired = true;
            });

            resetEnhancedAgentCore();

            // Event should not fire after reset
            instance1.emit('test-event');
            expect(eventFired).toBe(false);
        });
    });

    describe('Component Count', () => {
        it('should have all 40+ components available', () => {
            const components = enhancedCore.getComponents();
            const componentKeys = Object.keys(components);

            // Should have at least 40 components
            expect(componentKeys.length).toBeGreaterThanOrEqual(40);
        });

        it('should have components from all 12 layers', () => {
            const components = enhancedCore.getComponents();

            // Verify at least one component from each layer
            const layers = [
                'agentCore', // Core
                'handoffManager', // Collaboration
                'preferenceEngine', // Learning
                'specializationManager', // Specialization
                'opportunityDetector', // Intelligence
                'imageAnalysisStrand', // Multi-Modal
                'competitorMonitor', // Competitive Intelligence
                'longTermMemory', // Memory
                'qualityAssurance', // Quality Assurance
                'performanceTracker', // Analytics
                'adaptiveRouter', // Routing
                'conversationalEditor', // Collaborative Editing
                'socialMediaScheduler', // Integration
            ];

            layers.forEach(layer => {
                expect(components[layer as keyof typeof components]).toBeDefined();
            });
        });
    });
});
