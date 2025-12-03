/**
 * Unit tests for CompetitorAIComparison component
 * 
 * Tests verify:
 * - Component renders with no data (empty state)
 * - Component renders with user and competitor data
 * - Ranking is correct based on scores
 * - User position is highlighted
 * - Percentage differences are calculated correctly
 * - Sentiment distribution is displayed correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';
import { CompetitorAIComparison } from '@/components/competitor-ai-comparison';
import type { AIVisibilityScore } from '@/lib/types/common/common';

// Mock data
const createMockScore = (score: number, mentionCount: number): AIVisibilityScore => ({
    id: `score-${score}`,
    userId: `user-${score}`,
    score,
    breakdown: {
        mentionFrequency: 25,
        sentimentScore: 25,
        prominenceScore: 25,
        platformDiversity: 25,
    },
    mentionCount,
    sentimentDistribution: {
        positive: Math.floor(mentionCount * 0.6),
        neutral: Math.floor(mentionCount * 0.3),
        negative: Math.floor(mentionCount * 0.1),
    },
    platformBreakdown: {
        chatgpt: Math.floor(mentionCount * 0.4),
        perplexity: Math.floor(mentionCount * 0.3),
        claude: Math.floor(mentionCount * 0.2),
        gemini: Math.floor(mentionCount * 0.1),
    },
    trend: 'up',
    trendPercentage: 5.5,
    previousScore: score - 5,
    calculatedAt: new Date().toISOString(),
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
});

describe('CompetitorAIComparison', () => {
    describe('Empty State', () => {
        it('should render empty state when no data is provided', () => {
            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={null}
                    competitorScores={[]}
                />
            );

            expect(screen.getByText('No competitor data available')).toBeInTheDocument();
            expect(screen.getByText('Add competitors to see how your AI visibility compares')).toBeInTheDocument();
        });
    });

    describe('With Data', () => {
        it('should render user and competitor scores', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
                { userId: 'comp-2', name: 'Competitor 2', score: createMockScore(65, 15) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Check that all agents are displayed (names appear multiple times in ranking and sentiment sections)
            const youElements = screen.getAllByText('You');
            expect(youElements.length).toBeGreaterThan(0);
            const comp1Elements = screen.getAllByText('Competitor 1');
            expect(comp1Elements.length).toBeGreaterThan(0);
            const comp2Elements = screen.getAllByText('Competitor 2');
            expect(comp2Elements.length).toBeGreaterThan(0);

            // Check scores are displayed (scores appear multiple times in different sections)
            const score75Elements = screen.getAllByText('75');
            expect(score75Elements.length).toBeGreaterThan(0);
            const score85Elements = screen.getAllByText('85');
            expect(score85Elements.length).toBeGreaterThan(0);
            const score65Elements = screen.getAllByText('65');
            expect(score65Elements.length).toBeGreaterThan(0);
        });

        it('should display correct ranking order', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
                { userId: 'comp-2', name: 'Competitor 2', score: createMockScore(65, 15) },
                { userId: 'comp-3', name: 'Competitor 3', score: createMockScore(90, 30) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Check rank badges are present
            const rankBadges = screen.getAllByText(/#\d+/);
            expect(rankBadges.length).toBeGreaterThan(0);

            // User should be in 3rd place (90, 85, 75, 65)
            expect(screen.getByText('3rd Place')).toBeInTheDocument();
        });

        it('should highlight user position', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Check user position summary is displayed
            expect(screen.getByText('Your Position')).toBeInTheDocument();
            expect(screen.getByText('Your Score')).toBeInTheDocument();
        });

        it('should display mention counts', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Check mention counts are displayed
            expect(screen.getByText('20')).toBeInTheDocument();
            expect(screen.getByText('25')).toBeInTheDocument();
        });

        it('should display sentiment distribution', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Check sentiment labels are present
            const positiveLabels = screen.getAllByText('Positive');
            const neutralLabels = screen.getAllByText('Neutral');
            const negativeLabels = screen.getAllByText('Negative');

            expect(positiveLabels.length).toBeGreaterThan(0);
            expect(neutralLabels.length).toBeGreaterThan(0);
            expect(negativeLabels.length).toBeGreaterThan(0);
        });

        it('should show percentage difference for competitors', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
                { userId: 'comp-2', name: 'Competitor 2', score: createMockScore(65, 15) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Check that percentage differences are shown
            // Competitor 1: (85-75)/75 * 100 = 13.3% higher
            expect(screen.getByText(/13\.3% higher than you/)).toBeInTheDocument();

            // Competitor 2: (65-75)/75 * 100 = -13.3% lower
            expect(screen.getByText(/13\.3% lower than you/)).toBeInTheDocument();
        });

        it('should display sentiment comparison section', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Check sentiment comparison section exists
            expect(screen.getByText('Sentiment Comparison')).toBeInTheDocument();
            expect(screen.getByText('How sentiment distribution compares across agents')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle user with highest score', () => {
            const userScore = createMockScore(95, 30);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
                { userId: 'comp-2', name: 'Competitor 2', score: createMockScore(75, 20) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // User should be in 1st place
            expect(screen.getByText('1st Place')).toBeInTheDocument();
        });

        it('should handle user with lowest score', () => {
            const userScore = createMockScore(55, 10);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(85, 25) },
                { userId: 'comp-2', name: 'Competitor 2', score: createMockScore(75, 20) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // User should be in 3rd place (last)
            expect(screen.getByText('3rd Place')).toBeInTheDocument();
        });

        it('should handle zero mentions', () => {
            const userScore = createMockScore(50, 0);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(60, 0) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Should still render without errors (names appear multiple times)
            const youElements = screen.getAllByText('You');
            expect(youElements.length).toBeGreaterThan(0);
            const comp1Elements = screen.getAllByText('Competitor 1');
            expect(comp1Elements.length).toBeGreaterThan(0);
        });

        it('should handle equal scores', () => {
            const userScore = createMockScore(75, 20);
            const competitorScores = [
                { userId: 'comp-1', name: 'Competitor 1', score: createMockScore(75, 20) },
            ];

            render(
                <CompetitorAIComparison
                    userId="user-1"
                    userScore={userScore}
                    competitorScores={competitorScores}
                />
            );

            // Should show "Same score as you" for competitor
            expect(screen.getByText('Same score as you')).toBeInTheDocument();
        });
    });
});
