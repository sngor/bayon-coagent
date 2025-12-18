/**
 * Subscription Usage API Route
 * 
 * Gets and updates usage statistics for a user's subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        const repository = getRepository();
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

        // Get current month's usage
        const usageData = await repository.getItem<any>(
            `USER#${userId}`,
            `USAGE#${currentMonth}`
        );

        const defaultUsage = {
            aiContentGeneration: 0,
            imageEnhancements: 0,
            researchReports: 0,
            marketingPlans: 0,
        };

        const usage = usageData?.Data ? {
            aiContentGeneration: usageData.Data.aiContentGeneration || 0,
            imageEnhancements: usageData.Data.imageEnhancements || 0,
            researchReports: usageData.Data.researchReports || 0,
            marketingPlans: usageData.Data.marketingPlans || 0,
        } : defaultUsage;

        return NextResponse.json({
            success: true,
            usage,
            month: currentMonth,
        });
    } catch (error) {
        console.error('Error getting usage:', error);
        return NextResponse.json(
            { error: 'Failed to get usage' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId, feature } = await request.json();

        if (!userId || !feature) {
            return NextResponse.json(
                { error: 'User ID and feature are required' },
                { status: 400 }
            );
        }

        const validFeatures = ['aiContentGeneration', 'imageEnhancements', 'researchReports', 'marketingPlans'];
        if (!validFeatures.includes(feature)) {
            return NextResponse.json(
                { error: 'Invalid feature' },
                { status: 400 }
            );
        }

        const repository = getRepository();
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const now = new Date();

        // Get current usage
        const usageData = await repository.getItem<any>(
            `USER#${userId}`,
            `USAGE#${currentMonth}`
        );

        const currentUsage = usageData?.Data || {
            aiContentGeneration: 0,
            imageEnhancements: 0,
            researchReports: 0,
            marketingPlans: 0,
        };

        // Increment the specific feature usage
        const updatedUsage = {
            ...currentUsage,
            [feature]: (currentUsage[feature] || 0) + 1,
            month: currentMonth,
            updatedAt: now.toISOString(),
        };

        // If this is the first usage record for this month, add createdAt
        if (!usageData?.Data) {
            updatedUsage.createdAt = now.toISOString();
        }

        // Save updated usage
        await repository.put({
            PK: `USER#${userId}`,
            SK: `USAGE#${currentMonth}`,
            EntityType: 'Analytics',
            Data: updatedUsage,
            CreatedAt: usageData?.CreatedAt || now.getTime(),
            UpdatedAt: now.getTime(),
        });

        return NextResponse.json({
            success: true,
            usage: {
                aiContentGeneration: updatedUsage.aiContentGeneration,
                imageEnhancements: updatedUsage.imageEnhancements,
                researchReports: updatedUsage.researchReports,
                marketingPlans: updatedUsage.marketingPlans,
            },
            month: currentMonth,
        });
    } catch (error) {
        console.error('Error updating usage:', error);
        return NextResponse.json(
            { error: 'Failed to update usage' },
            { status: 500 }
        );
    }
}