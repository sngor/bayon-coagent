/**
 * Tests for WorkflowDetailModal Component
 * 
 * Validates the display and functionality of the workflow detail modal.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkflowDetailModal, IntegrationStatus } from '../workflow-detail-modal';
import { WorkflowPreset, WorkflowCategory } from '@/types/workflows';

// Mock workflow preset for testing
const mockPreset: WorkflowPreset = {
    id: 'test-workflow',
    title: 'Test Workflow',
    description: 'A test workflow for unit testing',
    category: WorkflowCategory.BRAND_BUILDING,
    tags: ['test', 'example'],
    estimatedMinutes: 30,
    isRecommended: true,
    icon: 'Rocket',
    steps: [
        {
            id: 'step-1',
            title: 'First Step',
            description: 'Complete the first step',
            hubRoute: '/test/step1',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'This is the first step',
            tips: ['Tip 1', 'Tip 2'],
            completionCriteria: 'Step 1 completed',
            contextOutputs: ['data1'],
        },
        {
            id: 'step-2',
            title: 'Second Step',
            description: 'Complete the second step',
            hubRoute: '/test/step2',
            estimatedMinutes: 15,
            isOptional: true,
            helpText: 'This is the second step',
            tips: ['Tip 3'],
            completionCriteria: 'Step 2 completed',
            contextInputs: ['data1'],
            contextOutputs: ['data2'],
        },
        {
            id: 'step-3',
            title: 'Third Step',
            description: 'Complete the third step',
            hubRoute: '/test/step3',
            estimatedMinutes: 5,
            isOptional: false,
            helpText: 'This is the third step',
            tips: ['Tip 4', 'Tip 5'],
            completionCriteria: 'Step 3 completed',
            contextInputs: ['data1', 'data2'],
        },
    ],
    outcomes: [
        'Outcome 1',
        'Outcome 2',
        'Outcome 3',
    ],
    prerequisites: [
        'Prerequisite 1',
        'Prerequisite 2',
    ],
    requiredIntegrations: [
        'google-business-profile',
        'facebook',
    ],
};

const mockIntegrationStatuses: IntegrationStatus[] = [
    {
        id: 'google-business-profile',
        name: 'Google Business Profile',
        isConnected: true,
    },
    {
        id: 'facebook',
        name: 'Facebook',
        isConnected: false,
    },
];

describe('WorkflowDetailModal', () => {
    const mockOnOpenChange = jest.fn();
    const mockOnStartWorkflow = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render nothing when preset is null', () => {
        const { container } = render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={null}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('should display workflow title and description', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('Test Workflow')).toBeInTheDocument();
        expect(screen.getByText('A test workflow for unit testing')).toBeInTheDocument();
    });

    it('should display estimated total time (Requirement 8.1)', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('30 minutes')).toBeInTheDocument();
    });

    it('should display all workflow steps with individual times (Requirement 8.2)', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        // Check step titles
        expect(screen.getByText('First Step')).toBeInTheDocument();
        expect(screen.getByText('Second Step')).toBeInTheDocument();
        expect(screen.getByText('Third Step')).toBeInTheDocument();

        // Check step times
        expect(screen.getByText('10 min')).toBeInTheDocument();
        expect(screen.getByText('15 min')).toBeInTheDocument();
        expect(screen.getByText('5 min')).toBeInTheDocument();
    });

    it('should display expected outcomes (Requirement 13.3)', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('Outcome 1')).toBeInTheDocument();
        expect(screen.getByText('Outcome 2')).toBeInTheDocument();
        expect(screen.getByText('Outcome 3')).toBeInTheDocument();
    });

    it('should display prerequisites (Requirement 13.4)', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('Prerequisite 1')).toBeInTheDocument();
        expect(screen.getByText('Prerequisite 2')).toBeInTheDocument();
    });

    it('should display required integrations with connection status (Requirement 13.5)', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
                integrationStatuses={mockIntegrationStatuses}
            />
        );

        expect(screen.getByText('Google Business Profile')).toBeInTheDocument();
        expect(screen.getByText('Facebook')).toBeInTheDocument();
        expect(screen.getByText('Connected')).toBeInTheDocument();
        expect(screen.getByText('Not Connected')).toBeInTheDocument();
    });

    it('should display recommended badge when workflow is recommended', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('Recommended')).toBeInTheDocument();
    });

    it('should display optional badge for optional steps', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        // Second step is optional
        const optionalBadges = screen.getAllByText('Optional');
        expect(optionalBadges).toHaveLength(1);
    });

    it('should call onStartWorkflow when Start Workflow button is clicked', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        const startButton = screen.getByRole('button', { name: /start test workflow workflow/i });
        fireEvent.click(startButton);

        expect(mockOnStartWorkflow).toHaveBeenCalledWith('test-workflow');
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when Cancel button is clicked', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should display warning when not all integrations are connected', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
                integrationStatuses={mockIntegrationStatuses}
            />
        );

        expect(screen.getByText(/some integrations are not connected/i)).toBeInTheDocument();
    });

    it('should not display warning when all integrations are connected', () => {
        const allConnected: IntegrationStatus[] = [
            {
                id: 'google-business-profile',
                name: 'Google Business Profile',
                isConnected: true,
            },
            {
                id: 'facebook',
                name: 'Facebook',
                isConnected: true,
            },
        ];

        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
                integrationStatuses={allConnected}
            />
        );

        expect(screen.queryByText(/some integrations are not connected/i)).not.toBeInTheDocument();
    });

    it('should display step numbers correctly', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display category badge', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('Brand Building')).toBeInTheDocument();
    });

    it('should display step count badge', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.getByText('3 steps')).toBeInTheDocument();
    });

    it('should not display prerequisites section when there are none', () => {
        const presetWithoutPrerequisites: WorkflowPreset = {
            ...mockPreset,
            prerequisites: undefined,
        };

        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={presetWithoutPrerequisites}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.queryByText('Prerequisites')).not.toBeInTheDocument();
    });

    it('should not display integrations section when there are none', () => {
        const presetWithoutIntegrations: WorkflowPreset = {
            ...mockPreset,
            requiredIntegrations: undefined,
        };

        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={presetWithoutIntegrations}
                onStartWorkflow={mockOnStartWorkflow}
            />
        );

        expect(screen.queryByText('Required Integrations')).not.toBeInTheDocument();
    });

    it('should handle missing integration status gracefully', () => {
        render(
            <WorkflowDetailModal
                open={true}
                onOpenChange={mockOnOpenChange}
                preset={mockPreset}
                onStartWorkflow={mockOnStartWorkflow}
                integrationStatuses={[]} // No statuses provided
            />
        );

        // Should still display integration names (using IDs as fallback)
        expect(screen.getByText('google-business-profile')).toBeInTheDocument();
        expect(screen.getByText('facebook')).toBeInTheDocument();
    });
});
