/**
 * Skip Confirmation Dialog Tests
 * 
 * Tests for the skip confirmation dialog component.
 * 
 * Requirements: 10.2, 10.3, 10.4, 10.5
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkipConfirmationDialog } from '../skip-confirmation-dialog';

// Mock use-mobile hook
jest.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => false,
}));

describe('SkipConfirmationDialog', () => {
    const mockOnConfirm = jest.fn();
    const mockOnOpenChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders when open is true', () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText('Skip Onboarding?')).toBeInTheDocument();
        expect(screen.getByText(/You're about to skip the onboarding process/)).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
        render(
            <SkipConfirmationDialog
                open={false}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.queryByText('Skip Onboarding?')).not.toBeInTheDocument();
    });

    it('lists consequences of skipping', () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText(/You'll miss important platform features and tips/)).toBeInTheDocument();
        expect(screen.getByText(/Your profile won't be set up for personalized content/)).toBeInTheDocument();
        expect(screen.getByText(/You'll need to explore features on your own/)).toBeInTheDocument();
    });

    it('shows reassurance about settings access', () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText(/you can always access individual setup steps from your settings later/)).toBeInTheDocument();
    });

    it('has Continue Setup button', () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        const continueButton = screen.getByText('Continue Setup');
        expect(continueButton).toBeInTheDocument();
    });

    it('has Skip to Dashboard button', () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        const skipButton = screen.getByText('Skip to Dashboard');
        expect(skipButton).toBeInTheDocument();
    });

    it('calls onOpenChange(false) when Continue Setup is clicked', () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        const continueButton = screen.getByText('Continue Setup');
        fireEvent.click(continueButton);

        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('calls onConfirm when Skip to Dashboard is clicked', async () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
            />
        );

        const skipButton = screen.getByText('Skip to Dashboard');
        fireEvent.click(skipButton);

        await waitFor(() => {
            expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        });
    });

    it('disables buttons when isLoading is true', () => {
        render(
            <SkipConfirmationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                onConfirm={mockOnConfirm}
                isLoading={true}
            />
        );

        const continueButton = screen.getByText('Continue Setup');
        const skipButton = screen.getByText('Skip to Dashboard');

        expect(continueButton).toBeDisabled();
        expect(skipButton).toBeDisabled();
    });
});
