/**
 * Tests for neighborhood profile AI synthesis flow
 */

import { describe, it, expect } from '@jest/globals';
import {
    NeighborhoodProfileInputSchema,
    NeighborhoodProfileOutputSchema,
    type NeighborhoodProfileInput,
    type NeighborhoodProfileOutput,
} from '@/ai/schemas/neighborhood-profile-schemas';

describe('Neighborhood Profile Schemas', () => {
    it('should validate valid input data', () => {
        const validInput: NeighborhoodProfileInput = {
            location: 'Downtown Seattle, WA',
            marketData: {
                medianSalePrice: 750000,
                avgDaysOnMarket: 25,
                salesVolume: 150,
                inventoryLevel: 200,
                priceHistory: [
                    { month: '2024-01', medianPrice: 720000 },
                    { month: '2024-02', medianPrice: 730000 },
                    { month: '2024-03', medianPrice: 750000 },
                ]
            },
            demographics: {
                population: 25000,
                medianHouseholdIncome: 85000,
                ageDistribution: {
                    under18: 15,
                    age18to34: 35,
                    age35to54: 25,
                    age55to74: 20,
                    over75: 5
                },
                householdComposition: {
                    familyHouseholds: 65,
                    nonFamilyHouseholds: 35,
                    averageHouseholdSize: 2.4
                }
            },
            schools: [
                {
                    name: 'Lincoln Elementary',
                    type: 'public',
                    grades: 'K-5',
                    rating: 8,
                    distance: 0.5
                }
            ],
            amenities: {
                restaurants: [
                    { name: 'The Local Bistro', category: 'American', distance: 0.3 }
                ],
                shopping: [
                    { name: 'Main Street Market', category: 'Grocery', distance: 0.4 }
                ],
                parks: [
                    { name: 'Central Park', distance: 0.6 }
                ],
                healthcare: [
                    { name: 'Family Medical Center', type: 'Primary Care', distance: 0.5 }
                ],
                entertainment: [
                    { name: 'Regal Cinema', category: 'Movie Theater', distance: 0.7 }
                ]
            },
            walkabilityScore: 75,
            walkabilityDescription: 'Very Walkable',
            walkabilityFactors: {
                walkability: 75,
                transitScore: 65,
                bikeScore: 70
            }
        };

        const result = NeighborhoodProfileInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
    });

    it('should reject invalid input data', () => {
        const invalidInput = {
            location: 'Downtown Seattle, WA',
            marketData: {
                medianSalePrice: -100, // Invalid negative price
                avgDaysOnMarket: 25,
                salesVolume: 150,
                inventoryLevel: 200,
                priceHistory: []
            }
            // Missing required fields
        };

        const result = NeighborhoodProfileInputSchema.safeParse(invalidInput);
        expect(result.success).toBe(false);
    });

    it('should validate school rating range', () => {
        const inputWithInvalidSchoolRating = {
            location: 'Test Location',
            marketData: {
                medianSalePrice: 500000,
                avgDaysOnMarket: 30,
                salesVolume: 100,
                inventoryLevel: 150,
                priceHistory: []
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
                    name: 'Test School',
                    type: 'public' as const,
                    grades: 'K-5',
                    rating: 15, // Invalid rating > 10
                    distance: 0.5
                }
            ],
            amenities: {
                restaurants: [],
                shopping: [],
                parks: [],
                healthcare: [],
                entertainment: []
            },
            walkabilityScore: 50,
            walkabilityDescription: 'Somewhat Walkable',
            walkabilityFactors: {
                walkability: 50,
                transitScore: 40,
                bikeScore: 45
            }
        };

        const result = NeighborhoodProfileInputSchema.safeParse(inputWithInvalidSchoolRating);
        expect(result.success).toBe(false);
    });

    it('should validate walkability score range', () => {
        const inputWithInvalidWalkabilityScore = {
            location: 'Test Location',
            marketData: {
                medianSalePrice: 500000,
                avgDaysOnMarket: 30,
                salesVolume: 100,
                inventoryLevel: 150,
                priceHistory: []
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
            schools: [],
            amenities: {
                restaurants: [],
                shopping: [],
                parks: [],
                healthcare: [],
                entertainment: []
            },
            walkabilityScore: 150, // Invalid score > 100
            walkabilityDescription: 'Invalid',
            walkabilityFactors: {
                walkability: 150,
                transitScore: 40,
                bikeScore: 45
            }
        };

        const result = NeighborhoodProfileInputSchema.safeParse(inputWithInvalidWalkabilityScore);
        expect(result.success).toBe(false);
    });

    it('should validate valid output data', () => {
        const validOutput: NeighborhoodProfileOutput = {
            aiInsights: 'This is a comprehensive neighborhood analysis...',
            marketCommentary: 'The market shows strong fundamentals...',
            demographicInsights: 'The demographic profile indicates...',
            lifestyleFactors: 'Residents enjoy excellent walkability...',
            schoolAnalysis: 'Educational opportunities are abundant...',
            investmentPotential: 'This area shows strong investment potential...',
            keyHighlights: [
                'Excellent walkability score',
                'Strong school ratings',
                'Diverse dining options'
            ],
            targetBuyers: [
                'Young professionals',
                'Families with children',
                'Empty nesters'
            ],
            marketTrends: [
                'Increasing property values',
                'Low inventory levels',
                'Quick sales'
            ],
            recommendations: [
                'Act quickly in this competitive market',
                'Consider long-term investment potential'
            ],
            riskFactors: [
                'High competition among buyers'
            ],
            comparableAreas: [
                'Capitol Hill',
                'Fremont'
            ]
        };

        const result = NeighborhoodProfileOutputSchema.safeParse(validOutput);
        expect(result.success).toBe(true);
    });
});