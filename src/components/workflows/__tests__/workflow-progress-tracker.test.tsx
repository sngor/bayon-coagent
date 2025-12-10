/**
 * Workflow Progress Tracker Tests
 * 
 * Unit tests for the WorkflowProgressTracker component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowProgressTracker } from '../workflow-progress-tracker';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowStatus,
    WorkflowCategory,
} from '@/types/workflows';

// Sample workflow preset
const samplePreset: WorkflowPreset = {
    id: 'test-workflow',
    title: 'Test Workflow',
    description: 'A test workflow',
    category: WorkflowCategory.BRAND_BUILDING,
    tags: ['test'],
    estimatedMinutes: 30,
    isRecommended: true,
    icon: 'Rocket',
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
            tips: ['Tip 1', 'Tip 2'],
            completionCriteria: 'Complete step 1',
        },
        {
            id: 'step-2',
            title: 'Step 2',
            description: 'Second step',
            hubRoute: '/test/step2',
            estimatedMinutes: 10,
            isOptional: true,
            helpText: 'Help for step 2',
            tips: ['Tip 3'],
            completionCriteria: 'Complete step 2',
        },
        {
            id: 'step-3',
            title: 'Step 3',
            description: 'Third step',
            hubRoute: '/test/step3',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Help for step 3',
            tips: [],
            completionCriteria: 'Complete step 3',
        },
    ],
};

// Sample workflow instance
const createInstance = (overrides?: Partial<WorkflowInstance>): WorkflowInstance => ({
    id: 'test-instance',
    userId: 'test-user',
    presetId: 'test-workflow',
    status: WorkflowStatus.ACTIVE,
    currentStepId: 'step-1',
    completedSteps: [],
    skippedSteps: [],
    contextData: {},
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    ...overrides,
});

describe('WorkflowProgressTracker', () => {
    const mockOnNavigateToStep = jest.fn();
    const mockOnSkipStep = jest.fn();
    const mockOnCompleteStep = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders workflow title and step count', () => {
        const instance = createInstance();

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    });

    it('displays all steps', () => {
        const instance = createInstance();

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        expect(screen.getByText('Step 1')).toBeInTheDocument();
        expect(screen.getByText('Step 2')).toBeInTheDocument();
        expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('displays optional badge for optional steps', () => {
        const instance = createInstance();

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        // Step 2 is optional
        const optionalBadges = screen.getAllByText('Optional');
        expect(optionalBadges.length).toBeGreaterThan(0);
    });

    it('displays remaining time', () => {
        const instance = createInstance();

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        // All steps remaining: 10 + 10 + 10 = 30 minutes
        expect(screen.getByText('30m remaining')).toBeInTheDocument();
    });

    it('displays help text for current step', () => {
        const instance = createInstance();

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        expect(screen.getByText('Help for step 1')).toBeInTheDocument();
    });

    it('displays tips for current step', () => {
        const instance = createInstance();

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        expect(screen.getByText('Tip 1')).toBeInTheDocument();
        expect(screen.getByText('Tip 2')).toBeInTheDocument();
    });

    it('shows skip button for optional current step', () => {
        const instance = createInstance({ currentStepId: 'step-2' });

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-2"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        const skipButton = screen.getByText('Skip this step');
        expect(skipButton).toBeInTheDocument();
    });

    it('does not show skip button for required current step', () => {
        const instance = createInstance({ currentStepId: 'step-1' });

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        expect(screen.queryByText('Skip this step')).not.toBeInTheDocument();
    });

    it('calls onSkipStep when skip button is clicked', () => {
        const instance = createInstance({ currentStepId: 'step-2' });

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-2"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        const skipButton = screen.getByText('Skip this step');
        fireEvent.click(skipButton);

        expect(mockOnSkipStep).toHaveBeenCalledTimes(1);
    });

    it('allows navigation to completed steps', () => {
        const instance = createInstance({
            currentStepId: 'step-2',
            completedSteps: ['step-1'],
        });

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-2"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        const step1 = screen.getByText('Step 1').closest('.step-item');
        expect(step1).toHaveClass('cursor-pointer');
    });

    it('calculates remaining time correctly with completed steps', () => {
        const instance = createInstance({
            currentStepId: 'step-2',
            completedSteps: ['step-1'],
        });

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-2"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
            />
        );

        // Step 1 completed, remaining: 10 + 10 = 20 minutes
        expect(screen.getByText('20m remaining')).toBeInTheDocument();
    });

    it('hides help text when showHelp is false', () => {
        const instance = createInstance();

        render(
            <WorkflowProgressTracker
                instance={instance}
                preset={samplePreset}
                currentStepId="step-1"
                onNavigateToStep={mockOnNavigateToStep}
                onSkipStep={mockOnSkipStep}
                onCompleteStep={mockOnCompleteStep}
                showHelp={false}
            />
        );

        expect(screen.queryByText('Help for step 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Tip 1')).not.toBeInTheDocument();
    });
});
