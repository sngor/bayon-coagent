/**
 * AI Context Analysis Component - Usage Example
 * 
 * This component displays topic and service type analysis for AI mentions.
 * It shows:
 * - Top 5 topics associated with the agent
 * - Mention count for each topic
 * - Example quotes for each topic
 * - Service type categorization (Buyer Agent, Seller Agent, Luxury, etc.)
 * 
 * Requirements validated: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { AIContextAnalysis } from './ai-context-analysis';
import type { AIMention } from '@/lib/types/common/common';

// Example usage in a page component
export function AIVisibilityPage() {
    // Fetch mentions from your data source
    const mentions: AIMention[] = []; // Replace with actual data
    const userId = 'user-123'; // Replace with actual user ID

    return (
        <div className="container mx-auto py-8">
            <AIContextAnalysis
                userId={userId}
                mentions={mentions}
            />
        </div>
    );
}

/**
 * Component Features:
 * 
 * 1. Top Topics Section
 *    - Displays up to 5 most frequently mentioned topics
 *    - Shows mention count and percentage for each topic
 *    - Lists associated service types for each topic
 *    - Provides up to 3 example quotes per topic
 * 
 * 2. Service Type Categorization
 *    - Automatically categorizes mentions by service type keywords
 *    - Supported categories:
 *      - Buyer Agent
 *      - Seller Agent
 *      - Luxury
 *      - Investment
 *      - Commercial
 *      - Relocation
 *      - First-Time Buyer
 *      - Downsizing
 *    - Shows mention count and percentage per service type
 *    - Displays related topics for each service type
 * 
 * 3. Analysis Summary
 *    - Total unique topics
 *    - Total service categories
 *    - Top topic highlight
 * 
 * 4. Empty State
 *    - Displays helpful message when no mentions are available
 *    - Encourages users to start monitoring
 */

/**
 * Data Flow:
 * 
 * 1. Component receives array of AIMention objects
 * 2. Aggregates topics across all mentions
 * 3. Counts occurrences and collects examples
 * 4. Categorizes by service type using keyword matching
 * 5. Sorts by frequency and displays top 5
 * 6. Renders with responsive layout and interactive elements
 */

/**
 * Integration Example with Server Actions:
 */
export async function AIVisibilityPageWithData({ userId }: { userId: string }) {
    // In a real implementation, you would fetch data using server actions
    // const { data: mentions } = await getAIMentions(userId);

    const mentions: AIMention[] = []; // Replace with actual server action call

    return (
        <AIContextAnalysis
            userId={userId}
            mentions={mentions}
        />
    );
}
