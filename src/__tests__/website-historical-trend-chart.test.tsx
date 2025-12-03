/**
 * Tests for WebsiteHistoricalTrendChart component
 * 
 * Validates Requirements: 7.3, 7.4
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, it, expect } from '@jest/globals';
import { WebsiteHistoricalTrendChart } from '@/components/website-historical-trend-chart';
import type { WebsiteAnalysisResult } from '@/ai/schemas/website-analysis-schemas';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
}));

describe('WebsiteHistoricalTrendChart', () => {
    const createMockAnalysis = (score: number, daysAgo: number): WebsiteAnalysisResult => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        return {
            id: `analysis-${daysAgo}`,
            userId: 'user-123',
            websiteUrl: 'https://example.com',
            analyzedAt: date.toISOString(),
            overallScore: score,
            scoreBreakdown: {
                schemaMarkup: score * 0.3,
                metaTags: score * 0.25,
                structuredData: score * 0.25,
                napConsistency: score * 0.2,
            },
            schemaMarkup: {
                found: true,
                types: ['Person'],
                properties: {},
                issues: [],
                recommendations: [],
            },
            metaTags: {
                title: {
                    content: 'Test',
                    length: 4,
                    isOptimal: true,
                    issues: [],
                },
                description: {
                    content: 'Test description',
                    length: 16,
                    isOptimal: true,
                    issues: [],
                },
                openGraph: {
                    found: true,
                    properties: {},
                    issues: [],
                },
                twitterCard: {
                    found: true,
                    properties: {},
                    issues: [],
                },
            },
            napConsistency: {
                name: {
                    found: 'Test',
                    matches: true,
                    confidence: 1,
                },
                address: {
                    found: '123 Test St',
                    matches: true,
                    confidence: 1,
                },
                phone: {
                    found: '555-1234',
                    matches: true,
                    confidence: 1,
                },
                overallConsistency: 100,
            },
            recommendations: [],
            summary: 'Test summary',
        };
    };

    it('should display empty state when no history', () => {
        render(<WebsiteHistoricalTrendChart history={[]} />);

        expect(screen.getByText('Score History')).toBeInTheDocument();
        expect(screen.getByText('No history yet. Run multiple analyses to see your progress.')).toBeInTheDocument();
    });

    it('should display single analysis state', () => {
        const history = [createMockAnalysis(75, 0)];

        render(<WebsiteHistoricalTrendChart history={history} />);

        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('Run another analysis to see your trend')).toBeInTheDocument();
    });

    it('should display improving trend', () => {
        const history = [
            createMockAnalysis(80, 0),  // Latest
            createMockAnalysis(75, 1),
            createMockAnalysis(70, 2),
        ];

        render(<WebsiteHistoricalTrendChart history={history} />);

        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('Improving Trend')).toBeInTheDocument();
        expect(screen.getByText(/\+10/)).toBeInTheDocument(); // Score change
    });

    it('should display declining trend', () => {
        const history = [
            createMockAnalysis(60, 0),  // Latest
            createMockAnalysis(70, 1),
            createMockAnalysis(80, 2),
        ];

        render(<WebsiteHistoricalTrendChart history={history} />);

        expect(screen.getByText('60')).toBeInTheDocument();
        expect(screen.getByText('Declining Trend')).toBeInTheDocument();
        expect(screen.getByText(/-20/)).toBeInTheDocument(); // Score change
    });

    it('should display stable trend', () => {
        const history = [
            createMockAnalysis(75, 0),  // Latest
            createMockAnalysis(74, 1),
            createMockAnalysis(76, 2),
        ];

        render(<WebsiteHistoricalTrendChart history={history} />);

        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('Stable Trend')).toBeInTheDocument();
    });

    it('should limit display to last 5 analyses', () => {
        const history = [
            createMockAnalysis(90, 0),
            createMockAnalysis(85, 1),
            createMockAnalysis(80, 2),
            createMockAnalysis(75, 3),
            createMockAnalysis(70, 4),
            createMockAnalysis(65, 5),
            createMockAnalysis(60, 6),
        ];

        render(<WebsiteHistoricalTrendChart history={history} />);

        expect(screen.getByText('Showing last 5 analyses')).toBeInTheDocument();
    });

});
