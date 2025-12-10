/**
 * Onboarding Components Tests
 * 
 * Tests for onboarding layout and container components.
 * Requirements: 9.1, 9.2, 10.1
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingContainer } from '../onboarding-container';
import { OnboardingProgress } from '../onboarding-progress';
import { OnboardingNavigation } from '../onboarding-navigation';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock Logo component
jest.mock('@/components/logo', () => ({
    Logo: () => <div>Logo</div>,
}));

// Mock responsive hooks
jest.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => false,
}));

jest.mock('@/hooks/use-tablet', () => ({
    useTablet: () => ({ isTablet: false }),
}));

describe('OnboardingProgress', () => {
    it('renders progress bar with correct percentage', () => {
        render(<OnboardingProgress currentStep={2} totalSteps={5} />);

        // Progress should be 40% (2/5 * 100)
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
        expect(progressBar).toHaveAttribute('aria-label', 'Onboarding progress: Step 2 of 5, 40% complete');
    });

    it('renders step indicators', () => {
        render(<OnboardingProgress currentStep={2} totalSteps={5} />);

        // Should have 5 step indicators
        const step1 = screen.getByLabelText('Step 1 (completed)');
        const step2 = screen.getByLabelText('Step 2 (current)');
        const step3 = screen.getByLabelText('Step 3 (upcoming)');

        expect(step1).toBeInTheDocument();
        expect(step2).toBeInTheDocument();
        expect(step3).toBeInTheDocument();
    });

    it('calculates progress correctly for different steps', () => {
        const { rerender } = render(<OnboardingProgress currentStep={1} totalSteps={4} />);
        let progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label', 'Onboarding progress: Step 1 of 4, 25% complete');

        rerender(<OnboardingProgress currentStep={4} totalSteps={4} />);
        progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label', 'Onboarding progress: Step 4 of 4, 100% complete');
    });
});

describe('OnboardingNavigation', () => {
    it('renders next button with custom label', () => {
        const onNext = jest.fn();
        render(<OnboardingNavigation onNext={onNext} nextLabel="Get Started" />);

        const nextButton = screen.getByRole('button', { name: /get started/i });
        expect(nextButton).toBeInTheDocument();
    });

    it('renders skip button when allowSkip is true', () => {
        const onSkip = jest.fn();
        render(<OnboardingNavigation onSkip={onSkip} allowSkip={true} />);

        const skipButton = screen.getByRole('button', { name: /skip/i });
        expect(skipButton).toBeInTheDocument();
    });

    it('does not render skip button when allowSkip is false', () => {
        const onSkip = jest.fn();
        render(<OnboardingNavigation onSkip={onSkip} allowSkip={false} />);

        const skipButton = screen.queryByRole('button', { name: /skip/i });
        expect(skipButton).not.toBeInTheDocument();
    });

    it('renders back button when showBack is true', () => {
        const onBack = jest.fn();
        render(<OnboardingNavigation onBack={onBack} showBack={true} />);

        const backButton = screen.getByRole('button', { name: /back/i });
        expect(backButton).toBeInTheDocument();
    });

    it('calls onNext when next button is clicked', () => {
        const onNext = jest.fn();
        render(<OnboardingNavigation onNext={onNext} />);

        const nextButton = screen.getByRole('button', { name: /continue/i });
        fireEvent.click(nextButton);

        expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('calls onSkip when skip button is clicked', () => {
        const onSkip = jest.fn();
        render(<OnboardingNavigation onSkip={onSkip} allowSkip={true} />);

        const skipButton = screen.getByRole('button', { name: /skip/i });
        fireEvent.click(skipButton);

        expect(onSkip).toHaveBeenCalledTimes(1);
    });

    it('calls onBack when back button is clicked', () => {
        const onBack = jest.fn();
        render(<OnboardingNavigation onBack={onBack} showBack={true} />);

        const backButton = screen.getByRole('button', { name: /back/i });
        fireEvent.click(backButton);

        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('disables buttons when isLoading is true', () => {
        const onNext = jest.fn();
        const onSkip = jest.fn();
        render(
            <OnboardingNavigation
                onNext={onNext}
                onSkip={onSkip}
                allowSkip={true}
                isLoading={true}
            />
        );

        const nextButton = screen.getByRole('button', { name: /continue/i });
        const skipButton = screen.getByRole('button', { name: /skip/i });

        expect(nextButton).toBeDisabled();
        expect(skipButton).toBeDisabled();
    });
});

describe('OnboardingContainer', () => {
    it('renders with title and description', () => {
        render(
            <OnboardingContainer
                currentStep={1}
                totalSteps={5}
                stepId="welcome"
                title="Welcome"
                description="Get started with onboarding"
            >
                <div>Content</div>
            </OnboardingContainer>
        );

        expect(screen.getByText('Welcome')).toBeInTheDocument();
        expect(screen.getByText('Get started with onboarding')).toBeInTheDocument();
    });

    it('renders children content', () => {
        render(
            <OnboardingContainer
                currentStep={1}
                totalSteps={5}
                stepId="welcome"
                title="Welcome"
                description="Description"
            >
                <div data-testid="child-content">Test Content</div>
            </OnboardingContainer>
        );

        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('displays step counter', () => {
        render(
            <OnboardingContainer
                currentStep={2}
                totalSteps={5}
                stepId="profile"
                title="Profile"
                description="Set up your profile"
            >
                <div>Content</div>
            </OnboardingContainer>
        );

        expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    });

    it('renders progress bar when showProgress is true', () => {
        render(
            <OnboardingContainer
                currentStep={2}
                totalSteps={5}
                stepId="profile"
                title="Profile"
                description="Description"
                showProgress={true}
            >
                <div>Content</div>
            </OnboardingContainer>
        );

        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toBeInTheDocument();
    });

    it('does not render progress bar when showProgress is false', () => {
        render(
            <OnboardingContainer
                currentStep={2}
                totalSteps={5}
                stepId="profile"
                title="Profile"
                description="Description"
                showProgress={false}
            >
                <div>Content</div>
            </OnboardingContainer>
        );

        const progressBar = screen.queryByRole('progressbar');
        expect(progressBar).not.toBeInTheDocument();
    });

    it('passes navigation props to OnboardingNavigation', () => {
        const onNext = jest.fn();
        const onSkip = jest.fn();

        render(
            <OnboardingContainer
                currentStep={1}
                totalSteps={5}
                stepId="welcome"
                title="Welcome"
                description="Description"
                onNext={onNext}
                onSkip={onSkip}
                nextLabel="Start"
                skipLabel="Skip for now"
            >
                <div>Content</div>
            </OnboardingContainer>
        );

        const nextButton = screen.getByRole('button', { name: /start/i });
        const skipButton = screen.getByRole('button', { name: /skip for now/i });

        expect(nextButton).toBeInTheDocument();
        expect(skipButton).toBeInTheDocument();
    });
});
