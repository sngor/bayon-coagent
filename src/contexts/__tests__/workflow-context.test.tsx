/**
 * Workflow Context Tests
 * 
 * Unit tests for the WorkflowContext provider and hooks.
 * 
 * Note: These tests focus on the context state management logic.
 * Database operations are tested separately in integration tests.
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowProvider, useWorkflow } from '../workflow-context';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowStatus,
    WorkflowCategory,
} from '@/types/workflows';
import { waitFor } from '@/__tests__/utils';

// Test data
const mockPreset: WorkflowPreset = {
    id: 'test-workflow',
    title: 'Test Workflow',
    description: 'A test workflow',
    category: WorkflowCategory.BRAND_BUILDING,
    tags: ['test'],
    estimatedMinutes: 30,
    isRecommended: false,
    icon: 'TestIcon',
    outcomes: ['Test outcome'],
    steps: [
        {
            id: 'step-1',
            title: 'Step 1',
            description: 'First step',
            hubRoute: '/test/step1',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Help for step 1',
            tips: ['Tip 1'],
            completionCriteria: 'Complete step 1',
            contextOutputs: ['data1'],
        },
        {
            id: 'step-2',
            title: 'Step 2',
            description: 'Second step',
            hubRoute: '/test/step2',
            estimatedMinutes: 10,
            isOptional: true,
            helpText: 'Help for step 2',
            tips: ['Tip 2'],
            completionCriteria: 'Complete step 2',
            contextInputs: ['data1'],
            contextOutputs: ['data2'],
        },
        {
            id: 'step-3',
            title: 'Step 3',
            description: 'Third step',
            hubRoute: '/test/step3',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Help for step 3',
            tips: ['Tip 3'],
            completionCriteria: 'Complete step 3',
            contextInputs: ['data1', 'data2'],
        },
    ],
};

const mockInstance: WorkflowInstance = {
    id: 'instance-1',
    userId: 'user-1',
    presetId: 'test-workflow',
    status: WorkflowStatus.ACTIVE,
    currentStepId: 'step-1',
    completedSteps: [],
    skippedSteps: [],
    contextData: {},
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
};

describe('WorkflowContext', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    describe('useWorkflow hook', () => {
        it('throws error when used outside provider', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            expect(() => {
                renderHook(() => useWorkflow());
            }).toThrow('useWorkflow must be used within a WorkflowProvider');

            consoleSpy.mockRestore();
        });

        it('returns context value when used inside provider', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            expect(result.current).toBeDefined();
            expect(result.current.instance).toBeNull();
            expect(result.current.preset).toBeNull();
            expect(result.current.isLoaded).toBe(false);
        });
    });

    describe('loadWorkflow', () => {
        it('loads workflow instance and preset', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            expect(result.current.instance).toEqual(mockInstance);
            expect(result.current.preset).toEqual(mockPreset);
            expect(result.current.isLoaded).toBe(true);
            expect(result.current.currentStep).toEqual(mockPreset.steps[0]);
            expect(result.current.progress).toBe(0);
        });

        it('saves to local storage when loading', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            if (typeof window !== 'undefined' && window.localStorage) {
                const stored = window.localStorage.getItem('workflow-backup');
                expect(stored).toBeTruthy();

                if (stored) {
                    const backup = JSON.parse(stored);
                    expect(backup.instance).toEqual(mockInstance);
                }
            }
        });
    });

    describe('completeStep', () => {
        it('completes current step and advances to next', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider autoSaveDelay={100000}>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            // Complete step (will fail to save to DB but state should update)
            try {
                await act(async () => {
                    await result.current.completeStep({ data1: 'test data' });
                });
            } catch (error) {
                // Expected to fail since we don't have a real database
            }

            // Check that local state was updated
            expect(result.current.instance?.completedSteps).toContain('step-1');
            expect(result.current.instance?.currentStepId).toBe('step-2');
            expect(result.current.currentStep?.id).toBe('step-2');
            expect(result.current.progress).toBeGreaterThan(0);
        });

        it('updates context data when completing step', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider autoSaveDelay={100000}>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            const contextData = { data1: 'test value' };

            try {
                await act(async () => {
                    await result.current.completeStep(contextData);
                });
            } catch (error) {
                // Expected to fail since we don't have a real database
            }

            expect(result.current.instance?.contextData).toEqual(contextData);
        });
    });

    describe('skipStep', () => {
        it('skips optional step and advances to next', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider autoSaveDelay={100}>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            // Start at step 2 (optional)
            const instanceAtStep2 = {
                ...mockInstance,
                currentStepId: 'step-2',
                completedSteps: ['step-1'],
            };

            act(() => {
                result.current.loadWorkflow(instanceAtStep2, mockPreset);
            });

            await act(async () => {
                await result.current.skipStep();
            });

            expect(result.current.instance?.skippedSteps).toContain('step-2');
            expect(result.current.instance?.currentStepId).toBe('step-3');
        });

        it('throws error when trying to skip required step', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider autoSaveDelay={100}>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            await expect(async () => {
                await act(async () => {
                    await result.current.skipStep();
                });
            }).rejects.toThrow('Cannot skip required step');
        });
    });

    describe('navigateToStep', () => {
        it('navigates to completed step', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider autoSaveDelay={100}>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            // Start at step 2 with step 1 completed
            const instanceAtStep2 = {
                ...mockInstance,
                currentStepId: 'step-2',
                completedSteps: ['step-1'],
            };

            act(() => {
                result.current.loadWorkflow(instanceAtStep2, mockPreset);
            });

            await act(async () => {
                await result.current.navigateToStep('step-1');
            });

            expect(result.current.instance?.currentStepId).toBe('step-1');
            expect(result.current.currentStep?.id).toBe('step-1');
        });

        it('throws error when navigating to incomplete future step', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider autoSaveDelay={100}>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            await expect(async () => {
                await act(async () => {
                    await result.current.navigateToStep('step-3');
                });
            }).rejects.toThrow('Cannot navigate to step');
        });
    });

    describe('progress calculation', () => {
        it('calculates progress correctly', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            const instanceWithProgress = {
                ...mockInstance,
                completedSteps: ['step-1'],
                currentStepId: 'step-2',
            };

            act(() => {
                result.current.loadWorkflow(instanceWithProgress, mockPreset);
            });

            // 1 completed out of 3 steps = 33%
            expect(result.current.progress).toBe(33);
        });

        it('includes skipped steps in progress', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            const instanceWithProgress = {
                ...mockInstance,
                completedSteps: ['step-1'],
                skippedSteps: ['step-2'],
                currentStepId: 'step-3',
            };

            act(() => {
                result.current.loadWorkflow(instanceWithProgress, mockPreset);
            });

            // 1 completed + 1 skipped out of 3 steps = 67%
            expect(result.current.progress).toBe(67);
        });
    });

    describe('remaining time calculation', () => {
        it('calculates remaining time correctly', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            const instanceWithProgress = {
                ...mockInstance,
                completedSteps: ['step-1'],
                currentStepId: 'step-2',
            };

            act(() => {
                result.current.loadWorkflow(instanceWithProgress, mockPreset);
            });

            // Step 2 (10 min) + Step 3 (10 min) = 20 min
            expect(result.current.remainingTime).toBe(20);
        });
    });

    describe('clearWorkflow', () => {
        it('clears workflow state', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            expect(result.current.isLoaded).toBe(true);

            act(() => {
                result.current.clearWorkflow();
            });

            expect(result.current.instance).toBeNull();
            expect(result.current.preset).toBeNull();
            expect(result.current.isLoaded).toBe(false);
        });

        it('clears local storage', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            expect(window.localStorage.getItem('workflow-backup')).toBeTruthy();

            act(() => {
                result.current.clearWorkflow();
            });

            expect(window.localStorage.getItem('workflow-backup')).toBeNull();
        });
    });

    describe('auto-save', () => {
        it.skip('schedules auto-save after state change', async () => {
            // Skipping this test as it requires server action mocking
            // which is tested in integration tests
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider autoSaveDelay={100}>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            await act(async () => {
                await result.current.completeStep();
            });

            // Wait for auto-save delay
            await waitFor(
                () => {
                    expect(result.current.isSaving).toBe(false);
                },
                { timeout: 200 }
            );
        });
    });

    describe('local storage backup', () => {
        it('saves to local storage on state change', async () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider>{children}</WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            await act(async () => {
                await result.current.completeStep();
            });

            const stored = window.localStorage.getItem('workflow-backup');
            expect(stored).toBeTruthy();

            const backup = JSON.parse(stored!);
            expect(backup.instance.completedSteps).toContain('step-1');
        });

        it('can be disabled', () => {
            const wrapper = ({ children }: { children: React.ReactNode }) => (
                <WorkflowProvider enableLocalStorage={false}>
                    {children}
                </WorkflowProvider>
            );

            const { result } = renderHook(() => useWorkflow(), { wrapper });

            act(() => {
                result.current.loadWorkflow(mockInstance, mockPreset);
            });

            const stored = window.localStorage.getItem('workflow-backup');
            expect(stored).toBeNull();
        });
    });
});
