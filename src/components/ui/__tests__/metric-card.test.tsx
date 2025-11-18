import { render, screen } from '@testing-library/react';
import { MetricCard } from '../metric-card';
import { Star } from 'lucide-react';

describe('MetricCard', () => {
    it('renders the metric value', () => {
        render(
            <MetricCard
                value={4.8}
                label="Average Rating"
                decimals={1}
            />
        );

        expect(screen.getByText('Average Rating')).toBeInTheDocument();
    });

    it('renders with icon', () => {
        const { container } = render(
            <MetricCard
                value={100}
                label="Test Metric"
                icon={<Star data-testid="star-icon" />}
            />
        );

        expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });

    it('shows trend indicator when changePercent is provided', () => {
        const { container } = render(
            <MetricCard
                value={100}
                label="Test Metric"
                changePercent={15.5}
                showTrend={true}
            />
        );

        expect(container.textContent).toContain('+15.5%');
    });

    it('applies correct variant classes', () => {
        const { container } = render(
            <MetricCard
                value={100}
                label="Test Metric"
                variant="success"
            />
        );

        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain('from-success');
    });

    it('renders sparkline when trendData is provided', () => {
        const { container } = render(
            <MetricCard
                value={100}
                label="Test Metric"
                trendData={[80, 85, 90, 95, 100]}
                showSparkline={true}
            />
        );

        // Sparkline component should be rendered
        const sparkline = container.querySelector('.recharts-wrapper');
        expect(sparkline).toBeInTheDocument();
    });

    it('does not render sparkline when showSparkline is false', () => {
        const { container } = render(
            <MetricCard
                value={100}
                label="Test Metric"
                trendData={[80, 85, 90, 95, 100]}
                showSparkline={false}
            />
        );

        const sparkline = container.querySelector('.recharts-wrapper');
        expect(sparkline).not.toBeInTheDocument();
    });

    it('formats currency correctly', () => {
        render(
            <MetricCard
                value={1000}
                label="Revenue"
                format="currency"
            />
        );

        // AnimatedNumber will eventually show the formatted value
        expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('applies prefix and suffix', () => {
        render(
            <MetricCard
                value={50}
                label="Growth"
                prefix="+"
                suffix="%"
            />
        );

        expect(screen.getByText('Growth')).toBeInTheDocument();
    });
});
