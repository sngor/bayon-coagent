/**
 * Basic smoke tests for standard components
 * These tests verify that components render without errors
 */

import { render, screen } from '@testing-library/react';
import { FileText } from 'lucide-react';
import {
    StandardFormField,
    StandardLoadingState,
    StandardErrorDisplay,
    StandardEmptyState,
} from '../index';

describe('StandardFormField', () => {
    it('renders with label and input', () => {
        render(
            <StandardFormField label="Email" id="email">
                <input type="email" id="email" />
            </StandardFormField>
        );
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
        render(
            <StandardFormField label="Email" id="email" error="Invalid email">
                <input type="email" id="email" />
            </StandardFormField>
        );
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('displays help text when provided', () => {
        render(
            <StandardFormField label="Email" id="email" helpText="Enter your email address">
                <input type="email" id="email" />
            </StandardFormField>
        );
        expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
        render(
            <StandardFormField label="Email" id="email" required>
                <input type="email" id="email" />
            </StandardFormField>
        );
        expect(screen.getByText('*')).toBeInTheDocument();
    });
});

describe('StandardLoadingState', () => {
    it('renders spinner variant', () => {
        render(<StandardLoadingState variant="spinner" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with text', () => {
        render(<StandardLoadingState variant="spinner" text="Loading content..." />);
        expect(screen.getByText('Loading content...')).toBeInTheDocument();
    });

    it('renders skeleton variant', () => {
        render(<StandardLoadingState variant="skeleton" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders pulse variant', () => {
        render(<StandardLoadingState variant="pulse" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders shimmer variant', () => {
        render(<StandardLoadingState variant="shimmer" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});

describe('StandardErrorDisplay', () => {
    it('renders error variant', () => {
        render(
            <StandardErrorDisplay
                title="Error"
                message="Something went wrong"
                variant="error"
            />
        );
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders warning variant', () => {
        render(
            <StandardErrorDisplay
                title="Warning"
                message="Please be careful"
                variant="warning"
            />
        );
        expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('renders info variant', () => {
        render(
            <StandardErrorDisplay
                title="Information"
                message="Here is some info"
                variant="info"
            />
        );
        expect(screen.getByText('Information')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
        const handleClick = () => { };
        render(
            <StandardErrorDisplay
                title="Error"
                message="Something went wrong"
                action={{ label: 'Retry', onClick: handleClick }}
            />
        );
        expect(screen.getByText('Retry')).toBeInTheDocument();
    });
});

describe('StandardEmptyState', () => {
    it('renders with icon, title, and description', () => {
        render(
            <StandardEmptyState
                icon={FileText}
                title="No Content"
                description="Create your first item"
            />
        );
        expect(screen.getByText('No Content')).toBeInTheDocument();
        expect(screen.getByText('Create your first item')).toBeInTheDocument();
    });

    it('renders action button when provided', () => {
        const handleClick = () => { };
        render(
            <StandardEmptyState
                icon={FileText}
                title="No Content"
                description="Create your first item"
                action={{ label: 'Create', onClick: handleClick }}
            />
        );
        expect(screen.getByText('Create')).toBeInTheDocument();
    });
});
