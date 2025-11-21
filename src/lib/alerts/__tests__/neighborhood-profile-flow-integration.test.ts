/**
 * Integration tests for neighborhood profile AI synthesis flow
 */

import { describe, it, expect } from '@jest/globals';
import type { NeighborhoodProfileInput } from '@/ai/schemas/neighborhood-profile-schemas';

describe('Neighborhood Profile Flow Integration', () => {
    it('should import the flow function without errors', async () => {
        // Test that the flow can be imported
        const { runNeighborhoodProfileSynthesis } = await import('@/aws/bedrock/flows/neighborhood-profile-flow');
        expect(typeof runNeighborhoodProfileSynthesis).toBe('function');
    });

    it('should have proper input/output types', async () => {
        const { runNeighborhoodProfileSynthesis } = await import('@/aws/bedrock/flows/neighborhood-profile-flow');

        // Create a minimal valid input for type checking
        const testInput: NeighborhoodProfileInput = {
            location: 'Test Location',
            marketData: {
                medianSalePrice: 500000,
                avgDaysOnMarket: 30,
                salesVolume: 100,
                inventoryLevel: 150,
                priceHistory: [
                    { month: '2024-01', medianPrice: 480000 },
                    { month: '2024-02', medianPrice: 490000 },
                    { month: '2024-03', medianPrice: 500000 },
                ]
            },
            demographics: {
                population: 20000,
                medianHouseholdIncome: 70000,
                ageDistribution: {
                    under18: 20,
                    age18to34: 30,
                    age35to54: 25,
                    age55to74: 20,
                    over75: 5
                },
                householdComposition: {
                    familyHouseholds: 70,
                    nonFamilyHouseholds: 30,
                    averageHouseholdSize: 2.5
                }
            },
            schools: [
                {
                    name: 'Test Elementary',
                    type: 'public',
                    grades: 'K-5',
                    rating: 7,
                    distance: 0.5
                }
            ],
            amenities: {
                restaurants: [
                    { name: 'Test Restaurant', category: 'American', distance: 0.3 }
                ],
                shopping: [
                    { name: 'Test Market', category: 'Grocery', distance: 0.4 }
                ],
                parks: [
                    { name: 'Test Park', distance: 0.6 }
                ],
                healthcare: [
                    { name: 'Test Clinic', type: 'Primary Care', distance: 0.5 }
                ],
                entertainment: [
                    { name: 'Test Theater', category: 'Movie Theater', distance: 0.7 }
                ]
            },
            walkabilityScore: 65,
            walkabilityDescription: 'Somewhat Walkable',
            walkabilityFactors: {
                walkability: 65,
                transitScore: 55,
                bikeScore: 60
            }
        };

        // This test just verifies the function signature and types are correct
        // We don't actually call the function since it would require AWS credentials
        expect(typeof runNeighborhoodProfileSynthesis).toBe('function');

        // Verify the function accepts the correct input type
        // This is a compile-time check - if types don't match, TypeScript will error
        const _typeCheck: (input: NeighborhoodProfileInput) => Promise<any> = runNeighborhoodProfileSynthesis;
        expect(_typeCheck).toBeDefined();
    });
});