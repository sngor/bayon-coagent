/**
 * Website Recommendations List Component Tests
 * 
 * Tests for the RecommendationsList component that displays
 * prioritized recommendations from website analysis
 */

import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import { RecommendationsList } from '@/components/website-recommendations-list';
import type { Recommendation } from '@/ai/schemas/website-analysis-schemas';

// Mock toast
jest.mock('@/hooks/use-toast', () => ({
    toast: jest.fn(),
}));

describe('RecommendationsList Component', () => {
    const mockRecommendations: Recommendation[] = [
        {
            id: 'rec-1',
            priority: 'high',
            category: 'schema_markup',
            title: 'Add Schema.org Markup',
            description: 'Implement structured data to help AI understand your content',
            actionItems: [
                'Add Person schema for your profile',
                'Add LocalBusiness schema',
                'Validate schema with Google Rich Results Test'
            ],
            codeSnippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "John Doe"
}
</script>`,
            estimatedImpact: 15,
            effort: 'moderate',
        },
        {
            id: 'rec-2',
            priority: 'medium',
            category: 'meta_tags',
            title: 'Optimize Meta Description',
            description: 'Your meta description is too short',
            actionItems: [
                'Expand description to 120-160 characters',
                'Include relevant keywords'
            ],
            estimatedImpact: 8,
            effort: 'easy',
        },
        {
            id: 'rec-3',
            priority: 'low',
            category: 'nap_consistency',
            title: 'Update Phone Number Format',
            description: 'Use consistent phone number formatting',
            actionItems: [
                'Update all phone numbers to (XXX) XXX-XXXX format'
            ],
            estimatedImpact: 3,
            effort: 'easy',
        },
    ];

    it('renders recommendations list with correct count', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Check that summary shows correct total
        expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays priority counts correctly', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Check that priority sections exist
        expect(screen.getByText('High Priority', { selector: '.text-sm' })).toBeInTheDocument();
        expect(screen.getByText('Medium Priority', { selector: '.text-sm' })).toBeInTheDocument();
    });

    it('calculates total potential impact', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Total impact should be 15 + 8 + 3 = 26
        expect(screen.getByText('+26')).toBeInTheDocument();
    });

    it('sorts recommendations by priority', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Get all recommendation titles
        const highPriorityTitle = screen.getByText('Add Schema.org Markup');
        const mediumPriorityTitle = screen.getByText('Optimize Meta Description');
        const lowPriorityTitle = screen.getByText('Update Phone Number Format');

        // Verify they all exist
        expect(highPriorityTitle).toBeInTheDocument();
        expect(mediumPriorityTitle).toBeInTheDocument();
        expect(lowPriorityTitle).toBeInTheDocument();
    });

    it('displays priority badges correctly', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Priority text appears in both summary card and badges, so we expect at least 1 of each
        expect(screen.getAllByText('High Priority').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Medium Priority').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Low Priority').length).toBeGreaterThanOrEqual(1);
    });

    it('displays effort badges correctly', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        expect(screen.getByText('Moderate')).toBeInTheDocument();
        expect(screen.getAllByText('Easy')).toHaveLength(2);
    });

    it('displays action items as checkboxes', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Should have checkboxes for all action items (3 + 2 + 1 = 6)
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(6);
    });

    it('displays code snippets when available', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Check for code snippet
        expect(screen.getByText(/RealEstateAgent/)).toBeInTheDocument();
    });

    it('displays estimated impact for each recommendation', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        expect(screen.getByText('+15')).toBeInTheDocument();
        expect(screen.getByText('+8')).toBeInTheDocument();
        expect(screen.getByText('+3')).toBeInTheDocument();
    });

    it('shows empty state when no recommendations', () => {
        render(<RecommendationsList recommendations={[]} />);

        expect(screen.getByText('Excellent Work!')).toBeInTheDocument();
        expect(screen.getByText(/well-optimized/)).toBeInTheDocument();
    });

    it('displays implementation tips section', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        expect(screen.getByText('Implementation Tips')).toBeInTheDocument();
        expect(screen.getByText(/Start with high-priority items/)).toBeInTheDocument();
    });

    it('shows special tip for high priority recommendations', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        expect(screen.getByText('Why This Matters')).toBeInTheDocument();
    });

    it('displays all action items for each recommendation', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Check first recommendation's action items
        expect(screen.getByText('Add Person schema for your profile')).toBeInTheDocument();
        expect(screen.getByText('Add LocalBusiness schema')).toBeInTheDocument();
        expect(screen.getByText('Validate schema with Google Rich Results Test')).toBeInTheDocument();
    });

    it('renders category badges with correct formatting', () => {
        render(<RecommendationsList recommendations={mockRecommendations} />);

        // Categories should be formatted with spaces instead of underscores
        expect(screen.getByText('schema markup')).toBeInTheDocument();
        expect(screen.getByText('meta tags')).toBeInTheDocument();
        expect(screen.getByText('nap consistency')).toBeInTheDocument();
    });
});
