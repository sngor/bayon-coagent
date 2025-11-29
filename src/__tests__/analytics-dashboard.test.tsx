/**
 * Analytics Dashboard Component Tests
 * 
 * Basic tests for the analytics dashboard component functionality.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, it, expect } from '@jest/globals';

// Mock Recharts components to avoid rendering issues in tests
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    Bar: () => <div data-testid="bar" />,
    Pie: () => <div data-testid="pie" />,
    Area: () => <div data-testid="area" />,
    Cell: () => <div data-testid="cell" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
}));

// Mock Next.js cache to avoid server-side import issues
jest.mock('next/cache', () => ({}));

// Mock the analytics server actions with simple implementations
jest.mock('@/features/content-engine/actions/content-workflow-actions', () => ({
    getAnalyticsAction: jest.fn().mockImplementation(async () => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 0));
        return {
            success: true,
            data: [],
        };
    }),
    getROIAnalyticsAction: jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return {
            success: true,
            data: null,
        };
    }),
    exportROIDataAction: jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return {
            success: true,
            data: 'mock,csv,data',
        };
    }),
    getABTestResultsAction: jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        return {
            success: true,
            data: [],
        };
    }),
}));

// Import the component
import { AnalyticsDashboard } from '@/components/analytics-dashboard';

describe('AnalyticsDashboard', () => {
    const mockUserId = 'test-user-123';

    it('renders the analytics dashboard component without errors', () => {
        const { container } = render(<AnalyticsDashboard userId={mockUserId} />);

        // Should render without throwing errors
        expect(container).toBeInTheDocument();

        // Should have the main container with space-y-6 class
        expect(container.querySelector('.space-y-6')).toBeInTheDocument();
    });

    it('renders dashboard header correctly', () => {
        render(<AnalyticsDashboard userId={mockUserId} />);

        // Should show the dashboard title
        expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Track your content performance and ROI across all channels')).toBeInTheDocument();
    });

    it('renders time range selector', () => {
        render(<AnalyticsDashboard userId={mockUserId} />);

        // Should have time range selector
        expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
});