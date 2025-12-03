'use server';

import { defineFlow, definePrompt, BEDROCK_MODELS } from '../flow-base';
import {
    AnalyzePerformanceMetricsInputSchema,
    AnalyzePerformanceMetricsOutputSchema,
} from '@/ai/schemas/performance-metrics-schemas';

import type {
    AnalyzePerformanceMetricsInput,
    AnalyzePerformanceMetricsOutput,
} from '@/ai/schemas/performance-metrics-schemas';

const prompt = definePrompt({
    name: 'analyzePerformanceMetricsPrompt',
    inputSchema: AnalyzePerformanceMetricsInputSchema,
    outputSchema: AnalyzePerformanceMetricsOutputSchema,
    options: {
        modelId: BEDROCK_MODELS.HAIKU,
        temperature: 0.5,
        maxTokens: 1024,
    },
    prompt: `You are a real estate performance analyst. Analyze the following listing metrics and provide insights.

Metrics:
Period: {{{metrics.period}}}
Views: {{{metrics.totalViews}}}
Shares: {{{metrics.totalShares}}}
Inquiries: {{{metrics.totalInquiries}}}
Conversion Rate: {{{metrics.conversionRate}}}%

Listing Details:
Address: {{{listingDetails.address}}}
Price: {{{listingDetails.price}}}

Provide a brief analysis of the performance and 3 specific recommendations to improve it.
Also determine the overall sentiment (positive, neutral, negative).

Return ONLY valid JSON:
{
  "analysis": "Your analysis here...",
  "recommendations": ["Rec 1", "Rec 2", "Rec 3"],
  "sentiment": "positive" | "neutral" | "negative"
}`,
});

const analyzePerformanceMetricsFlow = defineFlow(
    {
        name: 'analyzePerformanceMetricsFlow',
        inputSchema: AnalyzePerformanceMetricsInputSchema,
        outputSchema: AnalyzePerformanceMetricsOutputSchema,
    },
    async (input) => {
        const output = await prompt(input);
        if (!output) {
            throw new Error("Failed to generate analysis.");
        }
        return output;
    }
);

export async function analyzePerformanceMetrics(
    input: AnalyzePerformanceMetricsInput
): Promise<AnalyzePerformanceMetricsOutput> {
    return analyzePerformanceMetricsFlow.execute(input);
}
