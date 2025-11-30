/**
 * A/B Test Results Visualization Component Tests
 * 
 * Unit tests for the comprehensive A/B test results visualization component
 */

import { describe, it, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ABTestResultsVisualization } from '@/components/ab-test-results-visualization';
import { ABTestResults, VariationResults } from '@/lib/content-workflow-types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
    AnimatePresence: ({ children }: any) => children,
}));

// Mock recharts
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
    ReferenceLine: () => <div data-testid="reference-line" />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Trophy: () => <div data-testid="trophy-icon" />,
    TrendingUp: () => <div data-testid="trending-up-icon" />,
    TrendingDown: () => <div data-testid="trending-down-icon" />,
    Users: () => <div data-testid="users-icon" />,
    Target: () => <div data-testid="target-icon" />,
    BarChart3: () => <div data-testid="bar-chart-3-icon" />,
    Info: () => <div data-testid="info-icon" />,
    ChevronDown: () => <div data-testid="chevron-down-icon" />,
    ChevronUp: () => <div data-testid="chevron-up-icon" />,
    Award: () => <div data-testid="award-icon" />,
    AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
    CheckCircle: () => <div data-testid="check-circle-icon" />,
    Eye: () => <div data-testid="eye-icon" />,
    MousePointer: () => <div data-testid="mouse-pointer-icon" />,
    Heart: () => <div data-testid="heart-icon" />,
    Share2: () => <div data-testid="share-2-icon" />,
    MessageCircle: () => <div data-testid="message-circle-icon" />,
    Calculator: () => <div data-testid="calculator-icon" />,
    Lightbulb: () => <div data-testid="lightbulb-icon" />,
    Download: () => <div data-testid="download-icon" />,
    RefreshCw: () => <div data-testid="refresh-cw-icon" />,
}));

describe('ABTestResultsVisualization', () => {
    const mockVariations: VariationResults[] = [
        {
            variationId: 'var-1',
            name: 'Variation A',
            metrics: {
                views: 1000,
                likes: 50,
                shares: 20,
                comments: 15,
                clicks: 100,
                saves: 10,
                engagementRate: 0.195,
                reach: 800,
                impressions: 1200,
            },
            sampleSize: 1000,
            conversionRate: 0.10,
            confidenceInterval: {
                lower: 0.08,
                upper: 0.12,
            },
            isWinner: true,
        },
        {
            variationId: 'var-2',
            name: 'Variation B',
            metrics: {
                views: 950,
                likes: 40,
                shares: 15,
                comments: 10,
                clicks: 80,
                saves: 8,
                engagementRate: 0.161,
                reach: 750,
                impressions: 1100,
            },
            sampleSize: 950,
            conversionRate: 0.084,
            confidenceInterval: {
                lower: 0.065,
                upper: 0.103,
            },
            isWinner: false,
        },
        {
            variationId: 'var-3',
            name: 'Variation C',
            metrics: {
                views: 900,
                likes: 35,
                shares: 12,
                comments: 8,
                clicks: 70,
                saves: 6,
                engagementRate: 0.146,
                reach: 700,
                impressions: 1000,
            },
            sampleSize: 900,
            conversionRate: 0.078,
            confidenceInterval: {
                lower: 0.058,
                upper: 0.098,
            },
            isWinner: false,
        },
    ];

    const mockTestResults: ABTestResults = {
        testId: 'test-123',
        variations: mockVariations,
        winner: 'var-1',
        confidence: 0.95,
        statisticalSignificance: true,
        pValue: 0.023,
        effectSize: 0.45,
        recommendedAction: 'Implement Variation A as it shows statistically significant improvement.',
        calculatedAt: new Date('2024-01-15T10:00:00Z'),
    };

    it('renders A/B test results with all variations', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Check header
        expect(screen.getByText('A/B Test Results')).toBeInTheDocument();
        expect(screen.getByText(/Test ID: test-123/)).toBeInTheDocument();

        // Check recommendation
        expect(screen.getByText(/Implement Variation A/)).toBeInTheDocument();

        // Check all variations are rendered
        expect(screen.getByText('Variation A')).toBeInTheDocument();
        expect(screen.getByText('Variation B')).toBeInTheDocument();
        expect(screen.getByText('Variation C')).toBeInTheDocument();
    });

    it('highlights the winning variation correctly', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Check winner badge is present
        expect(screen.getByText('Winner')).toBeInTheDocument();

        // Check winner has rank 1
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays statistical significance correctly', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Switch to statistics tab
        fireEvent.click(screen.getByText('Statistics'));

        // Check statistical significance status
        expect(screen.getByText('Statistically Significant')).toBeInTheDocument();
        expect(screen.getByText('95.0% confidence')).toBeInTheDocument();
    });

    it('shows confidence intervals for each variation', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Check confidence intervals are displayed
        expect(screen.getByText('8.0% - 12.0%')).toBeInTheDocument(); // Variation A
        expect(screen.getByText('6.5% - 10.3%')).toBeInTheDocument(); // Variation B
        expect(screen.getByText('5.8% - 9.8%')).toBeInTheDocument(); // Variation C
    });

    it('displays conversion rates correctly', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Check conversion rates
        expect(screen.getByText('10.00%')).toBeInTheDocument(); // Variation A
        expect(screen.getByText('8.40%')).toBeInTheDocument(); // Variation B
        expect(screen.getByText('7.80%')).toBeInTheDocument(); // Variation C
    });

    it('shows detailed metrics when expanded', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Find and click the first "Detailed Metrics" button
        const detailButtons = screen.getAllByText('Detailed Metrics');
        fireEvent.click(detailButtons[0]);

        // Check detailed metrics are shown
        expect(screen.getByText('1,000')).toBeInTheDocument(); // Views
        expect(screen.getByText('100')).toBeInTheDocument(); // Clicks
        expect(screen.getByText('50')).toBeInTheDocument(); // Likes
    });

    it('renders comparison chart in comparison tab', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Switch to comparison tab
        fireEvent.click(screen.getByText('Comparison'));

        // Check chart components are rendered
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('shows p-value and effect size in statistics tab', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Switch to statistics tab
        fireEvent.click(screen.getByText('Statistics'));

        // Check p-value and effect size
        expect(screen.getByText('0.023')).toBeInTheDocument();
        expect(screen.getByText('0.450')).toBeInTheDocument();
        expect(screen.getByText('Medium effect')).toBeInTheDocument();
    });

    it('handles non-significant results correctly', () => {
        const nonSignificantResults: ABTestResults = {
            ...mockTestResults,
            statisticalSignificance: false,
            confidence: 0.85,
            winner: undefined,
            recommendedAction: 'Continue collecting data - insufficient sample size for statistical significance',
        };

        render(<ABTestResultsVisualization testResults={nonSignificantResults} />);

        // Switch to statistics tab
        fireEvent.click(screen.getByText('Statistics'));

        // Check non-significant status
        expect(screen.getByText('Not Statistically Significant')).toBeInTheDocument();
        expect(screen.getByText('85.0% confidence')).toBeInTheDocument();
    });

    it('calls export handlers when export buttons are clicked', () => {
        const mockOnExport = jest.fn();
        render(
            <ABTestResultsVisualization
                testResults={mockTestResults}
                onExport={mockOnExport}
            />
        );

        // Click CSV export
        fireEvent.click(screen.getByText('Export CSV'));
        expect(mockOnExport).toHaveBeenCalledWith('csv');

        // Click PDF export
        fireEvent.click(screen.getByText('Export PDF'));
        expect(mockOnExport).toHaveBeenCalledWith('pdf');
    });

    it('calls refresh handler when refresh button is clicked', () => {
        const mockOnRefresh = jest.fn();
        render(
            <ABTestResultsVisualization
                testResults={mockTestResults}
                onRefresh={mockOnRefresh}
            />
        );

        // Click refresh button
        fireEvent.click(screen.getByText('Refresh'));
        expect(mockOnRefresh).toHaveBeenCalled();
    });

    it('provides proper accessibility features', () => {
        render(<ABTestResultsVisualization testResults={mockTestResults} />);

        // Check for proper headings
        expect(screen.getByRole('heading', { name: /A\/B Test Results/ })).toBeInTheDocument();

        // Check for tab navigation
        expect(screen.getByRole('tablist')).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Comparison' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Statistics' })).toBeInTheDocument();
    });
});