import { render, screen, fireEvent, within } from '@testing-library/react';
import { AIMentionsList } from '../ai-mentions-list';
import type { AIMention } from '@/lib/types/common/common';

// Mock data
const mockMentions: AIMention[] = [
    {
        id: '1',
        userId: 'user-123',
        platform: 'chatgpt',
        query: 'Best real estate agents in Seattle',
        queryCategory: 'general',
        response: 'John Smith is a highly regarded real estate agent in Seattle with over 10 years of experience.',
        snippet: 'John Smith is a highly regarded real estate agent in Seattle...',
        sentiment: 'positive',
        sentimentReason: 'The mention is positive, highlighting experience and reputation.',
        topics: ['experience', 'reputation'],
        expertiseAreas: ['residential', 'luxury'],
        prominence: 'high',
        position: 0,
        timestamp: '2024-01-15T10:00:00Z',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: '2',
        userId: 'user-123',
        platform: 'perplexity',
        query: 'Top luxury agents in Seattle',
        queryCategory: 'expertise',
        response: 'For luxury properties, Jane Doe is an excellent choice with a proven track record.',
        snippet: 'Jane Doe is an excellent choice with a proven track record...',
        sentiment: 'positive',
        sentimentReason: 'Positive mention emphasizing expertise in luxury market.',
        topics: ['luxury', 'track record'],
        expertiseAreas: ['luxury', 'high-end'],
        prominence: 'medium',
        position: 20,
        timestamp: '2024-01-14T15:30:00Z',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
    {
        id: '3',
        userId: 'user-123',
        platform: 'claude',
        query: 'Real estate agents with bad reviews',
        queryCategory: 'general',
        response: 'Some clients have reported issues with Bob Johnson regarding communication.',
        snippet: 'Some clients have reported issues with Bob Johnson...',
        sentiment: 'negative',
        sentimentReason: 'Negative mention about communication issues.',
        topics: ['communication', 'reviews'],
        expertiseAreas: [],
        prominence: 'low',
        position: 50,
        timestamp: '2024-01-13T09:00:00Z',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    },
];

describe('AIMentionsList', () => {
    it('renders empty state when no mentions provided', () => {
        render(<AIMentionsList userId="user-123" mentions={[]} />);

        expect(screen.getByText('No mentions found yet')).toBeInTheDocument();
        expect(screen.getByText('Start monitoring to see how AI platforms mention you')).toBeInTheDocument();
    });

    it('displays correct number of mentions', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        expect(screen.getByText('3 mentions found')).toBeInTheDocument();
    });

    it('displays mention details correctly', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        // Check first mention - query is displayed with "Query: " prefix
        expect(screen.getByText(/Best real estate agents in Seattle/)).toBeInTheDocument();
        expect(screen.getByText('chatgpt')).toBeInTheDocument();
        // "positive" appears multiple times, so use getAllByText
        const positiveBadges = screen.getAllByText('positive');
        expect(positiveBadges.length).toBeGreaterThan(0);
    });

    it('expands and collapses mention details', async () => {
        const { container } = render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        // Initially, full response should not be visible
        expect(screen.queryByText('Full Response')).not.toBeInTheDocument();

        // Click to expand
        const expandButtons = screen.getAllByRole('button', { name: /show full response/i });
        fireEvent.click(expandButtons[0]);

        // Wait for collapsible content to appear
        await screen.findByText('Full Response');

        // Full response should now be visible
        expect(screen.getByText('Full Response')).toBeInTheDocument();
        // Check that the response text is present in the container (it may be highlighted/split)
        expect(container.textContent).toContain('highly regarded real estate agent');

        // Click to collapse
        const collapseButton = screen.getByRole('button', { name: /show less/i });
        fireEvent.click(collapseButton);

        // Full response should be hidden again (wait for animation)
        await new Promise(resolve => setTimeout(resolve, 100));
        expect(screen.queryByText('Full Response')).not.toBeInTheDocument();
    });

    it('filters mentions by platform', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        // Open filters
        const filterButton = screen.getByRole('button', { name: /filters/i });
        fireEvent.click(filterButton);

        // Select ChatGPT platform
        const platformSelect = screen.getByRole('combobox', { name: /platform/i });
        fireEvent.click(platformSelect);

        const chatgptOption = screen.getByRole('option', { name: /chatgpt/i });
        fireEvent.click(chatgptOption);

        // Should show only 1 mention
        expect(screen.getByText('1 mention found')).toBeInTheDocument();
    });

    it('filters mentions by date range', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        // Open filters
        const filterButton = screen.getByRole('button', { name: /filters/i });
        fireEvent.click(filterButton);

        // Set start date
        const startDateInput = screen.getByLabelText(/start date/i);
        fireEvent.change(startDateInput, { target: { value: '2024-01-14' } });

        // Should show only 2 mentions (from Jan 14 onwards)
        expect(screen.getByText('2 mentions found')).toBeInTheDocument();
    });

    it('clears filters correctly', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        // Open filters
        const filterButton = screen.getByRole('button', { name: /filters/i });
        fireEvent.click(filterButton);

        // Set a filter
        const startDateInput = screen.getByLabelText(/start date/i);
        fireEvent.change(startDateInput, { target: { value: '2024-01-14' } });

        // Clear filters
        const clearButton = screen.getByRole('button', { name: /clear filters/i });
        fireEvent.click(clearButton);

        // Should show all mentions again
        expect(screen.getByText('3 mentions found')).toBeInTheDocument();
    });

    it('displays sentiment badges with correct variants', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        const positiveBadges = screen.getAllByText('positive');
        const negativeBadges = screen.getAllByText('negative');

        expect(positiveBadges.length).toBeGreaterThan(0);
        expect(negativeBadges.length).toBeGreaterThan(0);
    });

    it('paginates mentions correctly', () => {
        // Create more than 10 mentions to test pagination
        const manyMentions: AIMention[] = Array.from({ length: 25 }, (_, i) => ({
            ...mockMentions[0],
            id: `mention-${i}`,
            query: `Query ${i}`,
            timestamp: new Date(2024, 0, i + 1).toISOString(),
        }));

        render(<AIMentionsList userId="user-123" mentions={manyMentions} />);

        // Should show pagination
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

        // Click next page
        const nextButton = screen.getByRole('button', { name: /next/i });
        fireEvent.click(nextButton);

        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    it('displays topics and expertise areas when expanded', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        // Expand first mention
        const expandButtons = screen.getAllByText('Show full response');
        fireEvent.click(expandButtons[0]);

        // Check topics
        expect(screen.getByText('Topics')).toBeInTheDocument();
        expect(screen.getByText('experience')).toBeInTheDocument();
        expect(screen.getByText('reputation')).toBeInTheDocument();

        // Check expertise areas
        expect(screen.getByText('Expertise Areas')).toBeInTheDocument();
        expect(screen.getByText('residential')).toBeInTheDocument();
        expect(screen.getByText('luxury')).toBeInTheDocument();
    });

    it('shows empty state when filters return no results', () => {
        render(<AIMentionsList userId="user-123" mentions={mockMentions} />);

        // Open filters
        const filterButton = screen.getByRole('button', { name: /filters/i });
        fireEvent.click(filterButton);

        // Set date range that excludes all mentions
        const startDateInput = screen.getByLabelText(/start date/i);
        fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });

        // Should show empty state
        expect(screen.getByText('No mentions match your filters')).toBeInTheDocument();
    });
});
