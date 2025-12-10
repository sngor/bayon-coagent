/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { BillingMetricCard } from '../billing-metric-card';
import { DollarSign } from 'lucide-react';

describe('BillingMetricCard', () => {
    const defaultProps = {
        title: 'Total Revenue',
        value: '$125,000',
        subtitle: 'All-time revenue',
        icon: <DollarSign className="h-4 w-4" />,
    };

    it('renders basic metric card correctly', () => {
        render(<BillingMetricCard {...defaultProps} />);

        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
        expect(screen.getByText('$125,000')).toBeInTheDocument();
        expect(screen.getByText('All-time revenue')).toBeInTheDocument();
    });

    it('shows loading state correctly', () => {
        render(<BillingMetricCard {...defaultProps} loading={true} />);

        const loadingSkeleton = document.querySelector('.animate-pulse');
        expect(loadingSkeleton).toBeInTheDocument();
    });

    it('displays positive trend correctly', () => {
        const trend = { value: 12.5, isPositive: true };
        render(<BillingMetricCard {...defaultProps} trend={trend} />);

        expect(screen.getByText('+12.5%')).toBeInTheDocument();
        expect(screen.getByText('+12.5%')).toHaveClass('text-green-600');
    });

    it('displays negative trend correctly', () => {
        const trend = { value: -5.2, isPositive: false };
        render(<BillingMetricCard {...defaultProps} trend={trend} />);

        expect(screen.getByText('-5.2%')).toBeInTheDocument();
        expect(screen.getByText('-5.2%')).toHaveClass('text-red-600');
    });

    it('applies variant styles correctly', () => {
        const { rerender } = render(
            <BillingMetricCard {...defaultProps} variant="success" />
        );

        const card = document.querySelector('.border-green-200');
        expect(card).toBeInTheDocument();

        rerender(<BillingMetricCard {...defaultProps} variant="danger" />);

        const dangerCard = document.querySelector('.border-red-200');
        expect(dangerCard).toBeInTheDocument();
    });

    it('does not show trend when loading', () => {
        const trend = { value: 12.5, isPositive: true };
        render(<BillingMetricCard {...defaultProps} trend={trend} loading={true} />);

        expect(screen.queryByText('+12.5%')).not.toBeInTheDocument();
    });
});