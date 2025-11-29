'use server';

import { getGeminiTextModel } from '@/aws/google-ai/client';
import { getPropertySearchService } from '@/lib/client-dashboard/property-search';
import { ClientDashboard, DashboardAnalytics } from '@/app/client-dashboard-actions';
import { getCurrentUserServer } from '@/aws/auth/server-auth';

export type ClientNudge = {
    id: string;
    type: 'price_drop' | 'high_interest' | 'inactive' | 'general';
    title: string;
    message: string;
    reason: string;
};

export async function generateClientNudges(
    dashboard: ClientDashboard,
    analytics: DashboardAnalytics
): Promise<{ message: string; data: ClientNudge[] | null }> {
    const user = await getCurrentUserServer();
    if (!user) {
        return { message: 'Authentication required', data: null };
    }

    try {
        const model = getGeminiTextModel();
        const propertyService = getPropertySearchService();

        // Aggregate property views
        const propertyViewCounts: Record<string, number> = {};
        analytics.propertyViews.forEach(view => {
            propertyViewCounts[view.propertyId] = (propertyViewCounts[view.propertyId] || 0) + 1;
        });

        // Get high interest properties (viewed 3+ times)
        const highInterestPropertyIds = Object.entries(propertyViewCounts)
            .filter(([_, count]) => count >= 3)
            .map(([id]) => id);

        // Fetch real property details
        const propertyDetailsPromises = highInterestPropertyIds.map(async (id) => {
            try {
                const details = await propertyService.getPropertyDetails(dashboard.agentId, id);
                return details ? { ...details, viewCount: propertyViewCounts[id] } : null;
            } catch (error) {
                console.warn(`Failed to fetch details for property ${id}:`, error);
                return null;
            }
        });

        const properties = (await Promise.all(propertyDetailsPromises)).filter(p => p !== null);

        // Construct prompt with REAL data
        const prompt = `
            You are an expert real estate assistant. Your goal is to help the agent follow up with their client, ${dashboard.clientInfo.name}.
            
            Client Context:
            - Name: ${dashboard.clientInfo.name}
            - Interests: ${dashboard.clientInfo.propertyInterests || 'Not specified'}
            - Last Active: ${analytics.lastViewedAt ? new Date(analytics.lastViewedAt).toLocaleDateString() : 'Never'}
            
            Activity Data:
            - Total Dashboard Views: ${analytics.views}
            
            High Interest Properties (Real Data):
            ${properties.length > 0 ? JSON.stringify(properties.map(p => ({
            address: p.address,
            city: p.city,
            price: p.price,
            beds: p.bedrooms,
            baths: p.bathrooms,
            viewCount: p.viewCount,
            status: p.status
        }))) : 'None found'}
            
            Task:
            Generate 1-3 "Nudge" suggestions for the agent to send to the client.
            Each nudge should be personalized and actionable.
            
            Guidelines:
            1. If there are high interest properties, REFERENCE THEM SPECIFICALLY by address or price.
               - Example: "I saw you checked out 123 Main St a few times..."
               - If the status is 'sold', mention that it might be gone soon or is off market.
               - If the price seems good (you can judge based on general knowledge or just mention the price), highlight it.
            2. If no specific properties are high interest, suggest a re-engagement message based on their general interests.
            3. Keep messages professional but friendly (SMS/Email friendly).
            
            Return the response as a valid JSON array of objects with the following structure:
            [
                {
                    "type": "price_drop" | "high_interest" | "inactive" | "general",
                    "title": "Short title for the agent",
                    "message": "The actual text message to send to the client",
                    "reason": "Why this nudge is recommended"
                }
            ]
            Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up response if it contains markdown
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        const nudges: ClientNudge[] = JSON.parse(cleanJson).map((n: any) => ({
            ...n,
            id: crypto.randomUUID()
        }));

        return { message: 'success', data: nudges };

    } catch (error) {
        console.error('Error generating nudges:', error);
        return { message: 'Failed to generate nudges', data: null };
    }
}
