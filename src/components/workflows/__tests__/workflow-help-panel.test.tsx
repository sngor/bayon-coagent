/**
 * Workflow Help Panel Tests
 * 
 * Unit tests for the WorkflowHelpPanel component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { WorkflowHelpPanel } from '../workflow-help-panel';
import { WorkflowStepDefinition } from '@/types/workflows';

describe('WorkflowHelpPanel', () => {
    // Basic step without extended fields
    const basicStep: WorkflowStepDefinition = {
        id: 'test-step',
        title: 'Test Step',
        description: 'Test description',
        hubRoute: '/test',
        estimatedMinutes: 10,
        isOptional: false,
        helpText: 'This is help text for the test step',
        tips: ['Tip 1', 'Tip 2', 'Tip 3'],
        completionCriteria: 'Test completed',
    };

    // Step with all extended fields
    const fullStep: WorkflowStepDefinition & {
        warnings?: string[];
        aiPromptTips?: string[];
        documentationLinks?: Array<{ title: string; url: string }>;
    } = {
        ...basicStep,
        warnings: ['Warning 1', 'Warning 2'],
        aiPromptTips: ['AI Tip 1', 'AI Tip 2'],
        documentationLinks: [
            { title: 'Doc 1', url: '/docs/1' },
            { title: 'Doc 2', url: '/docs/2' },
        ],
    };

    describe('Basic Rendering', () => {
        it('renders the help panel with header', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            expect(screen.getByText('Step Guide')).toBeInTheDocument();
        });

        it('renders help text section', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            expect(screen.getByText('About this step')).toBeInTheDocument();
            expect(screen.getByText(basicStep.helpText)).toBeInTheDocument();
        });

        it('renders tips section', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            expect(screen.getByText('Tips for success')).toBeInTheDocument();
            basicStep.tips.forEach(tip => {
                expect(screen.getByText(tip)).toBeInTheDocument();
            });
        });

        it('renders default "Need more help?" button when no doc links', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            expect(screen.getByText(/Need more help\? Visit Support/i)).toBeInTheDocument();
        });
    });

    describe('Collapsible Behavior', () => {
        it('starts open when defaultOpen is true', () => {
            render(<WorkflowHelpPanel step={basicStep} defaultOpen={true} />);
            expect(screen.getByText(basicStep.helpText)).toBeInTheDocument();
        });

        it('starts collapsed when defaultOpen is false', () => {
            render(<WorkflowHelpPanel step={basicStep} defaultOpen={false} />);
            // Content should not be in the document when collapsed
            const helpText = screen.queryByText(basicStep.helpText);
            // With Radix Collapsible, content may still be in DOM but hidden
            // Check that the trigger has the correct aria-expanded state
            const trigger = screen.getByRole('button', { name: /Expand step guide/i });
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
        });

        it('toggles open/closed when header is clicked', () => {
            render(<WorkflowHelpPanel step={basicStep} defaultOpen={true} />);

            const trigger = screen.getByRole('button', { name: /Collapse step guide/i });

            // Initially open - check aria-expanded
            expect(trigger).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByText(basicStep.helpText)).toBeInTheDocument();

            // Click to close
            fireEvent.click(trigger);

            // Should be closed - check aria-expanded changed
            expect(trigger).toHaveAttribute('aria-expanded', 'false');
        });
    });

    describe('Extended Features', () => {
        it('displays AI Step badge when aiPromptTips are present', () => {
            render(<WorkflowHelpPanel step={fullStep} />);
            expect(screen.getByText('AI Step')).toBeInTheDocument();
        });

        it('does not display AI Step badge when no aiPromptTips', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            expect(screen.queryByText('AI Step')).not.toBeInTheDocument();
        });

        it('renders warnings section when warnings are present', () => {
            render(<WorkflowHelpPanel step={fullStep} />);
            expect(screen.getByText('Common mistakes to avoid')).toBeInTheDocument();
            fullStep.warnings!.forEach(warning => {
                expect(screen.getByText(warning)).toBeInTheDocument();
            });
        });

        it('does not render warnings section when no warnings', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            expect(screen.queryByText('Common mistakes to avoid')).not.toBeInTheDocument();
        });

        it('renders AI prompt tips section when present', () => {
            render(<WorkflowHelpPanel step={fullStep} />);
            expect(screen.getByText('AI prompt tips')).toBeInTheDocument();
            fullStep.aiPromptTips!.forEach(tip => {
                expect(screen.getByText(tip)).toBeInTheDocument();
            });
        });

        it('does not render AI prompt tips section when not present', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            expect(screen.queryByText('AI prompt tips')).not.toBeInTheDocument();
        });

        it('renders documentation links when present', () => {
            render(<WorkflowHelpPanel step={fullStep} />);
            expect(screen.getByText('Need more help?')).toBeInTheDocument();
            fullStep.documentationLinks!.forEach(link => {
                expect(screen.getByText(link.title)).toBeInTheDocument();
            });
        });

        it('documentation links have correct href attributes', () => {
            render(<WorkflowHelpPanel step={fullStep} />);
            fullStep.documentationLinks!.forEach(link => {
                const linkElement = screen.getByText(link.title).closest('a');
                expect(linkElement).toHaveAttribute('href', link.url);
                expect(linkElement).toHaveAttribute('target', '_blank');
                expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
            });
        });
    });

    describe('Empty Tips', () => {
        it('does not render tips section when tips array is empty', () => {
            const stepWithoutTips: WorkflowStepDefinition = {
                ...basicStep,
                tips: [],
            };
            render(<WorkflowHelpPanel step={stepWithoutTips} />);
            expect(screen.queryByText('Tips for success')).not.toBeInTheDocument();
        });
    });

    describe('Custom ClassName', () => {
        it('applies custom className to the component', () => {
            const { container } = render(
                <WorkflowHelpPanel step={basicStep} className="custom-class" />
            );
            const panel = container.querySelector('.workflow-help-panel');
            expect(panel).toHaveClass('custom-class');
        });
    });

    describe('Accessibility', () => {
        it('has proper button role for collapsible trigger', () => {
            render(<WorkflowHelpPanel step={basicStep} />);
            const trigger = screen.getByRole('button', { name: /Step Guide/i });
            expect(trigger).toBeInTheDocument();
        });

        it('external links have proper rel attribute for security', () => {
            render(<WorkflowHelpPanel step={fullStep} />);
            const links = screen.getAllByRole('link');
            links.forEach(link => {
                expect(link).toHaveAttribute('rel', 'noopener noreferrer');
            });
        });
    });
});
