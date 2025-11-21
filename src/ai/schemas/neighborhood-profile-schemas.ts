import { z } from 'zod';

/**
 * Schema for AI neighborhood profile synthesis
 */
export const NeighborhoodProfileInputSchema = z.object({
    location: z.string().describe('Location for the neighborhood profile'),
    marketData: z.object({
        medianSalePrice: z.number().describe('Median sale price in USD'),
        avgDaysOnMarket: z.number().describe('Average days on market'),
        salesVolume: z.number().describe('Number of sales in the period'),
        inventoryLevel: z.number().describe('Current inventory level'),
        priceHistory: z.array(z.object({
            month: z.string().describe('Month in YYYY-MM format'),
            medianPrice: z.number().describe('Median price for that month'),
        })).describe('12-month price history'),
    }).describe('Market data for the neighborhood'),
    demographics: z.object({
        population: z.number().describe('Total population'),
        medianHouseholdIncome: z.number().describe('Median household income in USD'),
        ageDistribution: z.object({
            under18: z.number().describe('Percentage under 18'),
            age18to34: z.number().describe('Percentage 18-34'),
            age35to54: z.number().describe('Percentage 35-54'),
            age55to74: z.number().describe('Percentage 55-74'),
            over75: z.number().describe('Percentage over 75'),
        }).describe('Age distribution percentages'),
        householdComposition: z.object({
            familyHouseholds: z.number().describe('Percentage of family households'),
            nonFamilyHouseholds: z.number().describe('Percentage of non-family households'),
            averageHouseholdSize: z.number().describe('Average household size'),
        }).describe('Household composition data'),
    }).describe('Demographic data for the neighborhood'),
    schools: z.array(z.object({
        name: z.string().describe('School name'),
        type: z.enum(['public', 'private']).describe('School type'),
        grades: z.string().describe('Grade levels served'),
        rating: z.number().min(1).max(10).describe('School rating from 1-10'),
        distance: z.number().describe('Distance in miles'),
    })).describe('Schools in the area'),
    amenities: z.object({
        restaurants: z.array(z.object({
            name: z.string().describe('Restaurant name'),
            category: z.string().describe('Restaurant category'),
            distance: z.number().describe('Distance in miles'),
        })).describe('Nearby restaurants'),
        shopping: z.array(z.object({
            name: z.string().describe('Shopping venue name'),
            category: z.string().describe('Shopping category'),
            distance: z.number().describe('Distance in miles'),
        })).describe('Nearby shopping'),
        parks: z.array(z.object({
            name: z.string().describe('Park name'),
            distance: z.number().describe('Distance in miles'),
        })).describe('Nearby parks'),
        healthcare: z.array(z.object({
            name: z.string().describe('Healthcare facility name'),
            type: z.string().describe('Healthcare facility type'),
            distance: z.number().describe('Distance in miles'),
        })).describe('Nearby healthcare facilities'),
        entertainment: z.array(z.object({
            name: z.string().describe('Entertainment venue name'),
            category: z.string().describe('Entertainment category'),
            distance: z.number().describe('Distance in miles'),
        })).describe('Nearby entertainment venues'),
    }).describe('Amenities and services in the area'),
    walkabilityScore: z.number().min(0).max(100).describe('Walkability score from 0-100'),
    walkabilityDescription: z.string().describe('Walkability description'),
    walkabilityFactors: z.object({
        walkability: z.number().describe('Walkability factor score'),
        transitScore: z.number().describe('Transit score'),
        bikeScore: z.number().describe('Bike score'),
    }).describe('Walkability factors'),
});

export const NeighborhoodProfileOutputSchema = z.object({
    aiInsights: z.string().describe('Comprehensive AI-generated narrative about the neighborhood, including market analysis, demographic insights, lifestyle factors, and investment potential'),
    marketCommentary: z.string().describe('Detailed analysis of market conditions, trends, and pricing dynamics'),
    demographicInsights: z.string().describe('Analysis of the demographic composition and what it means for the area'),
    lifestyleFactors: z.string().describe('Description of lifestyle amenities, walkability, and quality of life factors'),
    schoolAnalysis: z.string().describe('Analysis of educational opportunities and school quality'),
    investmentPotential: z.string().describe('Assessment of investment opportunities and market outlook'),
    keyHighlights: z.array(z.string()).describe('3-5 key highlights that make this neighborhood distinctive'),
    targetBuyers: z.array(z.string()).describe('Types of buyers who would be most interested in this area'),
    marketTrends: z.array(z.string()).describe('Current and emerging market trends affecting the area'),
    recommendations: z.array(z.string()).describe('Specific recommendations for buyers, sellers, or investors'),
    riskFactors: z.array(z.string()).optional().describe('Potential risks or concerns to be aware of'),
    comparableAreas: z.array(z.string()).optional().describe('Similar neighborhoods for comparison'),
});

export type NeighborhoodProfileInput = z.infer<typeof NeighborhoodProfileInputSchema>;
export type NeighborhoodProfileOutput = z.infer<typeof NeighborhoodProfileOutputSchema>;