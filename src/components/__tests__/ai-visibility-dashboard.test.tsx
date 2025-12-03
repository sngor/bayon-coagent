import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest, describe, it, expect } from '@jest/globals';
import { AIVisibilityDashboard } from '../ai-visibility-dashboard';
import type { AIVisibilityScore, AIMention } from '@/lib/types/common/common';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: () => <div data-testid="pie" />,
    Cell: () => <div data-testid="cell" />,
    Tooltip: () => <div data-testid="tooltip" />,
    Legend: () => <div data-testid="legend" />,
}));

describe('AIVisibilityDashboard', () => {
    const mockScore: AIVisibilityScore = {
        id: 'score-1',
        userId: 'user-1',
        score: 75,
        breakdown: {
            mentionFrequency: 20,
            sentimentScore: 18,
            prominenceScore: 22,
            platformDiversity: 15,
        },
        mentionCount: 25,
        sentimentDistribution: {
            positive: 15,
            neutral: 8,
            negative: 2,
        },
        platformBreakdown: {
            chatgpt: 10,
            perplexity: 8,
            claude: 5,
            gemini: 2,
        },
        trend: 'up',
        trendPercentage: 12.5,
        previousScore: 67,
        calculatedAt: '2024-01-15T10:00:00Z',
        periodStart: '2024-01-01T00:00:00Z',
        periodEnd: '2024-01-31T23:59:59Z',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    const mockMentions: AIMention[] = [
        {
            id: 'mention-1',
            userId: 'user-1',
            platform: 'chatgpt',
            query: 'best real estate agents in Seattle',
            queryCategory: 'general',
            response: 'Full response text...',
            snippet: 'John Doe is a highly recommended agent in Seattle',
            sentiment: 'positive',
            sentimentReason: 'Positive recommendation',
            topics: ['expertise', 'local knowledge'],
            expertiseAreas: ['buyer agent', 'luxury'],
            prominence: 'high',
            position: 100,
            timestamp: '2024-01-15T10:00:00Z',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
        {
            id: 'mention-2',
            userId: 'user-1',
            platform: 'perplexity',
            query: 'top agents for first-time buyers',
            queryCategory: 'expertise',
            response: 'Full response text...',
            snippet: 'John Doe specializes in helping first-time buyers',
            sentiment: 'neutral',
            sentimentReason: 'Factual statement',
            topics: ['first-time buyers'],
            expertiseAreas: ['buyer agent'],
            prominence: 'medium',
            position: 200,
            timestamp: '2024-01-14T10:00:00Z',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    ];

    it('renders empty state when no score is provided', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={null}
                recentMentions={[]}
            />
        );

        expect(screen.getByText('No visibility data available yet')).toBeInTheDocument();
        expect(screen.getByText('Start monitoring to see how often you appear in AI search results')).toBeInTheDocument();
    });

    it('renders visibility score correctly', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
            />
        );

        expect(screen.getByText('75')).toBeInTheDocument();
        expect(screen.getByText('out of 100')).toBeInTheDocument();
        expect(screen.getByText('+12.5%')).toBeInTheDocument();
    });

    it('displays score breakdown correctly', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
            />
        );

        expect(screen.getByText('Mention Frequency')).toBeInTheDocument();
        expect(screen.getByText('Sentiment Score')).toBeInTheDocument();
        expect(screen.getByText('Prominence Score')).toBeInTheDocument();
        expect(screen.getByText('Platform Diversity')).toBeInTheDocument();

        // Check that the breakdown values are displayed
        expect(screen.getByText('20')).toBeInTheDocument(); // Mention Frequency
        expect(screen.getByText('18')).toBeInTheDocument(); // Sentiment Score
        expect(screen.getByText('22')).toBeInTheDocument(); // Prominence Score
    });

    it('displays platform breakdown', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
            />
        );

        expect(screen.getByText('ChatGPT')).toBeInTheDocument();
        expect(screen.getByText('Perplexity')).toBeInTheDocument();
        expect(screen.getByText('Claude')).toBeInTheDocument();
        expect(screen.getByText('Gemini')).toBeInTheDocument();
    });

    it('displays sentiment distribution', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
            />
        );

        // Check sentiment counts
        const positiveElements = screen.getAllByText('15');
        const neutralElements = screen.getAllByText('8');
        const negativeElements = screen.getAllByText('2');

        expect(positiveElements.length).toBeGreaterThan(0);
        expect(neutralElements.length).toBeGreaterThan(0);
        expect(negativeElements.length).toBeGreaterThan(0);
    });

    it('displays recent mentions', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
            />
        );

        expect(screen.getByText('2 mentions in the last 30 days')).toBeInTheDocument();
        expect(screen.getByText('John Doe is a highly recommended agent in Seattle')).toBeInTheDocument();
        expect(screen.getByText('John Doe specializes in helping first-time buyers')).toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', async () => {
        const mockRefresh = jest.fn().mockResolvedValue(undefined);

        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
                onRefresh={mockRefresh}
            />
        );

        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);

        await waitFor(() => {
            expect(mockRefresh).toHaveBeenCalledTimes(1);
        });
    });

    it('calls onExport when export button is clicked', async () => {
        const mockExport = jest.fn().mockResolvedValue(undefined);

        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
                onExport={mockExport}
            />
        );

        const exportButton = screen.getByRole('button', { name: /export/i });
        fireEvent.click(exportButton);

        await waitFor(() => {
            expect(mockExport).toHaveBeenCalledTimes(1);
        });
    });

    it('shows correct trend icon for upward trend', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
            />
        );

        // Check that the trend percentage is displayed correctly
        expect(screen.getByText('+12.5%')).toBeInTheDocument();
        expect(screen.getByText('vs previous period')).toBeInTheDocument();
    });

    it('shows correct trend icon for downward trend', () => {
        const downwardScore = { ...mockScore, trend: 'down' as const, trendPercentage: -8.5 };

        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={downwardScore}
                recentMentions={mockMentions}
            />
        );

        expect(screen.getByText('-8.5%')).toBeInTheDocument();
    });

    it('shows correct trend icon for stable trend', () => {
        const stableScore = { ...mockScore, trend: 'stable' as const, trendPercentage: 0 };

        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={stableScore}
                recentMentions={mockMentions}
            />
        );

        expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('disables refresh button while refreshing', async () => {
        const mockRefresh = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
                onRefresh={mockRefresh}
            />
        );

        const refreshButton = screen.getByRole('button', { name: /refresh/i });
        fireEvent.click(refreshButton);

        expect(refreshButton).toBeDisabled();

        await waitFor(() => {
            expect(refreshButton).not.toBeDisabled();
        });
    });

    it('disables export button while exporting', async () => {
        const mockExport = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
                onExport={mockExport}
            />
        );

        const exportButton = screen.getByRole('button', { name: /export/i });
        fireEvent.click(exportButton);

        expect(exportButton).toBeDisabled();

        await waitFor(() => {
            expect(exportButton).not.toBeDisabled();
        });
    });

    it('renders without refresh and export buttons when callbacks not provided', () => {
        render(
            <AIVisibilityDashboard
                userId="user-1"
                score={mockScore}
                recentMentions={mockMentions}
            />
        );

        expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });
});
