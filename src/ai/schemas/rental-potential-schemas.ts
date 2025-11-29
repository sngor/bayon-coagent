import { z } from 'zod';

export const RentalPotentialInputSchema = z.object({
    propertyDescription: z.string().describe('Detailed description of the property including address, beds, baths, etc.'),
});

export type RentalPotentialInput = z.infer<typeof RentalPotentialInputSchema>;

export const RentalPotentialOutputSchema = z.object({
    longTermRental: z.object({
        estimatedMonthlyRent: z.number(),
        rentRange: z.object({
            low: z.number(),
            high: z.number(),
        }),
        confidenceLevel: z.enum(['high', 'medium', 'low']),
        demandLevel: z.enum(['high', 'medium', 'low']),
    }),
    shortTermRental: z.object({
        estimatedDailyRate: z.number(),
        estimatedOccupancyRate: z.number(),
        estimatedMonthlyRevenue: z.number(),
        revenueRange: z.object({
            low: z.number(),
            high: z.number(),
        }),
        seasonality: z.string(),
        confidenceLevel: z.enum(['high', 'medium', 'low']),
    }),
    comparableRentals: z.array(z.object({
        address: z.string(),
        price: z.number(),
        type: z.enum(['long-term', 'short-term']),
        beds: z.number().optional(),
        baths: z.number().optional(),
        distance: z.string().optional(),
    })),
    marketAnalysis: z.object({
        rentalMarketCondition: z.string(),
        averageDaysOnMarket: z.number().optional(),
        vacancyRate: z.number().optional(),
        trends: z.array(z.string()),
    }),
    disclaimer: z.string(),
});

export type RentalPotentialOutput = z.infer<typeof RentalPotentialOutputSchema>;
