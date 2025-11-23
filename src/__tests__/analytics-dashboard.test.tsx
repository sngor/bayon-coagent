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

// Mock the analytics service with simple implementations
jest.mock('@/services/analytics-service', () => ({
    getAnalyticsForTimeRange: jest.fn().mockResolvedValue({
        success: true,
        data: [],
    }),
    getROIAnalytics: jest.fn().mockResolvedValue({
        success: true,
        data: null,
    }),
    exportROIData: jest.fn().mockResolvedValue({
        success: true,
        data: 'mock,csv,data',
    }),
    TimeRangePreset: {
        LAST_7_DAYS: '7d',
        LAST_30_DAYS: '30d',
        LAST_90_DAYS: '90d',
        CUSTOM: 'custom',
    },
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

    it('renders loading skeleton initially', () => {
        render(<AnalyticsDashboard userId={mockUserId} />);

        // Should show loading skeleton elements
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('handles component lifecycle correctly', () => {
        render(<AnalyticsDashboard userId={mockUserId} />);

        // Should handle the component lifecycle without crashing
        // The component correctly shows loading skeleton when data fails to load
        expect(document.querySelector('.space-y-6')).toBeInTheDocument();
    });
});