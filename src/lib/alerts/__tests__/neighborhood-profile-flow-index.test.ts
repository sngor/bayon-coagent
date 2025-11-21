/**
 * Test that the neighborhood profile flow can be imported from the flows index
 */

import { describe, it, expect } from '@jest/globals';

describe('Neighborhood Profile Flow Index Export', () => {
    it('should export the flow from the flows index', async () => {
        const { runNeighborhoodProfileSynthesis } = await import('@/aws/bedrock/flows');
        expect(typeof runNeighborhoodProfileSynthesis).toBe('function');
    });

    it('should export the types from the flows index', async () => {
        const flows = await import('@/aws/bedrock/flows');
        expect(flows).toHaveProperty('runNeighborhoodProfileSynthesis');

        // Verify the function is properly typed
        const { runNeighborhoodProfileSynthesis } = flows;
        expect(typeof runNeighborhoodProfileSynthesis).toBe('function');
    });
});