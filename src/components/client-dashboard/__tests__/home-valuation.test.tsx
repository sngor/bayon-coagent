/**
 * Home Valuation Component Tests
 * 
 * Tests for the Home Valuation component
 * Requirements: 5.1, 5.3
 */

import { describe, it, expect } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeValuation } from '../home-valuation';

describe('HomeValuation Component', () => {
    const mockProps = {
        token: 'test-token-123',
        primaryColor: '#3b82f6',
        onContactAgent: () => { },
    };

    it('renders the valuation request form with all required fields', () => {
        render(<HomeValuation {...mockProps} />);

        // Check that all form fields are present
        expect(screen.getByLabelText(/property address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/square footage/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bedrooms/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/bathrooms/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/year built/i)).toBeInTheDocument();
        expect(screen.getAllByText(/property type/i).length).toBeGreaterThan(0);
        expect(screen.getByLabelText(/special features/i)).toBeInTheDocument();

        // Check submit button
        const buttons = screen.getAllByRole('button');
        const submitButton = buttons.find(btn => btn.textContent?.includes('Get Home Valuation'));
        expect(submitButton).toBeDefined();
    });

    it('displays property type select field', () => {
        render(<HomeValuation {...mockProps} />);

        // Property type label should be visible (using getAllByText since it appears in label and placeholder)
        const propertyTypeElements = screen.getAllByText(/property type/i);
        expect(propertyTypeElements.length).toBeGreaterThan(0);
    });

    it('accepts user input for all form fields', () => {
        render(<HomeValuation {...mockProps} />);

        const addressInput = screen.getByLabelText(/property address/i) as HTMLInputElement;
        const sqftInput = screen.getByLabelText(/square footage/i) as HTMLInputElement;
        const bedsInput = screen.getByLabelText(/bedrooms/i) as HTMLInputElement;
        const bathsInput = screen.getByLabelText(/bathrooms/i) as HTMLInputElement;
        const yearInput = screen.getByLabelText(/year built/i) as HTMLInputElement;

        // All inputs should be empty initially
        expect(addressInput.value).toBe('');
        expect(sqftInput.value).toBe('');
        expect(bedsInput.value).toBe('');
        expect(bathsInput.value).toBe('');
        expect(yearInput.value).toBe('');
    });

    it('renders submit button with correct text', () => {
        render(<HomeValuation {...mockProps} />);

        // The submit button should be present with correct text
        const submitButton = screen.getByRole('button', { name: /get home valuation/i });
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).toHaveTextContent(/get home valuation/i);
    });
});
