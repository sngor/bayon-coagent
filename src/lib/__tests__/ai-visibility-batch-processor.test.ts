/**
 * Tests for AI Visibility Batch Processor
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AIVisibilityBatchProcessor, createBatchProcessor } from '../ai-visibility-batch-processor';
import { AIMonitoringScheduler } from '../ai-monitoring-scheduler';

// Mock the scheduler
jest.mock('@/lib/ai-monitoring-scheduler');

describe('AIVisibilityBatchProcessor', () => {
    let processor: AIVisibilityBatchProcessor;
    let mockScheduler: jest.Mocked<AIMonitoringScheduler>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockScheduler = {
            executeMonitoring: jest.fn(),
        } as any;

        processor = new AIVisibilityBatchProcessor(mockScheduler);
    });

    describe('processBatch', () => {
        it('should process all users successfully', async () => {
            const userIds = ['user-1', 'user-2', 'user-3'];

            mockScheduler.executeMonitoring.mockResolvedValue({
                queriesExecuted: 10,
                mentionsFound: 5,
                errors: [],
            });

            const result = await processor.processBatch(userIds, {
                maxConcurrency: 2,
                batchDelay: 100,
            });

            expect(result.totalProcessed).toBe(3);
            expect(result.successful).toBe(3);
            expect(result.failed).toBe(0);
            expect(result.results.length).toBe(3);
            expect(result.results.every(r => r.success)).toBe(true);
            expect(mockScheduler.executeMonitoring).toHaveBeenCalledTimes(3);
        });

        it('should handle failures and continue processing', async () => {
            const userIds = ['user-1', 'user-2', 'user-3'];

            mockScheduler.executeMonitoring
                .mockResolvedValueOnce({
                    queriesExecuted: 10,
                    mentionsFound: 5,
                    errors: [],
                })
                .mockRejectedValueOnce(new Error('Rate limit exceeded'))
                .mockResolvedValueOnce({
                    queriesExecuted: 8,
                    mentionsFound: 3,
                    errors: [],
                });

            const result = await processor.processBatch(userIds, {
                continueOnError: true,
            });

            expect(result.totalProcessed).toBe(3);
            expect(result.successful).toBe(2);
            expect(result.failed).toBe(1);
            expect(result.results.find(r => r.userId === 'user-2')?.success).toBe(false);
            expect(result.results.find(r => r.userId === 'user-2')?.error).toBe('Rate limit exceeded');
        });

        it('should stop on first error when continueOnError is false', async () => {
            const userIds = ['user-1', 'user-2', 'user-3'];

            mockScheduler.executeMonitoring
                .mockResolvedValueOnce({
                    queriesExecuted: 10,
                    mentionsFound: 5,
                    errors: [],
                })
                .mockRejectedValueOnce(new Error('Critical error'));

            await expect(
                processor.processBatch(userIds, {
                    continueOnError: false,
                })
            ).rejects.toThrow('Critical error');
        });

        it('should respect concurrency limits', async () => {
            const userIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
            let concurrentCalls = 0;
            let maxConcurrentCalls = 0;

            mockScheduler.executeMonitoring.mockImplementation(async () => {
                concurrentCalls++;
                maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);

                // Simulate async work
                await new Promise(resolve => setTimeout(resolve, 50));

                concurrentCalls--;

                return {
                    queriesExecuted: 10,
                    mentionsFound: 5,
                    errors: [],
                };
            });

            await processor.processBatch(userIds, {
                maxConcurrency: 2,
                batchDelay: 0,
            });

            // Max concurrent calls should not exceed the limit
            expect(maxConcurrentCalls).toBeLessThanOrEqual(2);
        });

        it('should call progress callback', async () => {
            const userIds = ['user-1', 'user-2', 'user-3'];
            const progressCallback = jest.fn();

            mockScheduler.executeMonitoring.mockResolvedValue({
                queriesExecuted: 10,
                mentionsFound: 5,
                errors: [],
            });

            await processor.processBatch(userIds, {
                onProgress: progressCallback,
            });

            expect(progressCallback).toHaveBeenCalledTimes(3);
            expect(progressCallback).toHaveBeenCalledWith(1, 3, 'user-1');
            expect(progressCallback).toHaveBeenCalledWith(2, 3, 'user-2');
            expect(progressCallback).toHaveBeenCalledWith(3, 3, 'user-3');
        });

        it('should include execution time in result', async () => {
            const userIds = ['user-1'];

            mockScheduler.executeMonitoring.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 100));
                return {
                    queriesExecuted: 10,
                    mentionsFound: 5,
                    errors: [],
                };
            });

            const result = await processor.processBatch(userIds);

            expect(result.executionTime).toBeGreaterThanOrEqual(100);
        });
    });

    describe('processBatchWithPriority', () => {
        it('should process high priority users first', async () => {
            const userIds = [
                { userId: 'user-1', priority: 'low' as const },
                { userId: 'user-2', priority: 'high' as const },
                { userId: 'user-3', priority: 'normal' as const },
            ];

            const processedOrder: string[] = [];

            mockScheduler.executeMonitoring.mockImplementation(async (userId) => {
                processedOrder.push(userId);
                return {
                    queriesExecuted: 10,
                    mentionsFound: 5,
                    errors: [],
                };
            });

            await processor.processBatchWithPriority(userIds, {
                maxConcurrency: 1, // Process one at a time to verify order
            });

            // High priority should be processed first
            expect(processedOrder[0]).toBe('user-2');
            expect(processedOrder[1]).toBe('user-3');
            expect(processedOrder[2]).toBe('user-1');
        });
    });

    describe('getRecommendedBatchSize', () => {
        it('should return a positive number', () => {
            const batchSize = processor.getRecommendedBatchSize();
            expect(batchSize).toBeGreaterThan(0);
        });
    });

    describe('estimateBatchTime', () => {
        it('should estimate batch processing time', () => {
            const userCount = 10;
            const avgTimePerUser = 30000; // 30 seconds
            const concurrency = 5;

            const estimatedTime = processor.estimateBatchTime(
                userCount,
                avgTimePerUser,
                concurrency
            );

            // With 10 users, 5 concurrency, and 30s per user:
            // 2 batches * 30s + 1s delay = ~61s
            expect(estimatedTime).toBeGreaterThan(60000);
            expect(estimatedTime).toBeLessThan(65000);
        });

        it('should handle single batch correctly', () => {
            const userCount = 3;
            const avgTimePerUser = 10000;
            const concurrency = 5;

            const estimatedTime = processor.estimateBatchTime(
                userCount,
                avgTimePerUser,
                concurrency
            );

            // Single batch, no delay
            expect(estimatedTime).toBe(10000);
        });
    });
});

describe('createBatchProcessor', () => {
    it('should create a new batch processor instance', () => {
        const processor = createBatchProcessor();
        expect(processor).toBeInstanceOf(AIVisibilityBatchProcessor);
    });
});
