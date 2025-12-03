import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * GET /api/agentstrands/analytics/cost?dimension=xxx&timeframe=xxx
 * 
 * Retrieve cost analytics by dimension (strand, user, task-type)
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const dimension = searchParams.get('dimension') || 'user';
        const timeframe = searchParams.get('timeframe') || '30d';
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        // Validate dimension
        const validDimensions = ['strand', 'user', 'task-type'];
        if (!validDimensions.includes(dimension)) {
            return NextResponse.json(
                { error: `Invalid dimension. Must be one of: ${validDimensions.join(', ')}` },
                { status: 400 }
            );
        }

        const repository = getRepository();

        // Calculate time range
        const now = new Date();
        const timeRanges: Record<string, number> = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
        };

        const timeRange = timeRanges[timeframe] || timeRanges['30d'];
        const startTime = new Date(now.getTime() - timeRange).toISOString();

        // Query cost records for the user
        const result = await repository.query(
            `USER#${user.id}`,
            `COST#${startTime}`,
            { limit }
        );

        const costRecords = result.items || [];

        // Aggregate by dimension
        const costBreakdown: Record<string, any> = {};

        costRecords.forEach((record: any) => {
            let key: string;

            switch (dimension) {
                case 'strand':
                    key = record.strandId || 'unknown';
                    break;
                case 'task-type':
                    key = record.taskType || 'unknown';
                    break;
                case 'user':
                default:
                    key = record.userId || user.id;
                    break;
            }

            if (!costBreakdown[key]) {
                costBreakdown[key] = {
                    dimension: key,
                    totalCost: 0,
                    totalTokens: 0,
                    operationCount: 0,
                    operations: [],
                };
            }

            costBreakdown[key].totalCost += record.cost || 0;
            costBreakdown[key].totalTokens += record.tokenUsage || 0;
            costBreakdown[key].operationCount++;

            if (costBreakdown[key].operations.length < 10) {
                costBreakdown[key].operations.push({
                    timestamp: record.timestamp,
                    cost: record.cost,
                    tokens: record.tokenUsage,
                    operation: record.operation,
                });
            }
        });

        // Sort by total cost descending
        const sortedBreakdown = Object.values(costBreakdown).sort(
            (a: any, b: any) => b.totalCost - a.totalCost
        );

        // Calculate totals
        const totals = {
            totalCost: sortedBreakdown.reduce((sum: number, item: any) => sum + item.totalCost, 0),
            totalTokens: sortedBreakdown.reduce((sum: number, item: any) => sum + item.totalTokens, 0),
            totalOperations: sortedBreakdown.reduce((sum: number, item: any) => sum + item.operationCount, 0),
        };

        return NextResponse.json({
            dimension,
            timeframe,
            breakdown: sortedBreakdown,
            totals,
        });
    } catch (error) {
        console.error('Failed to retrieve cost analytics:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve cost analytics' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/agentstrands/analytics/cost
 * 
 * Record a cost operation
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { strandId, taskType, operation, tokenUsage, cost, metadata } = body;

        // Validate required fields
        if (!operation || tokenUsage === undefined || cost === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields: operation, tokenUsage, cost' },
                { status: 400 }
            );
        }

        const repository = getRepository();
        const timestamp = new Date().toISOString();
        const costId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Store cost record
        await repository.create(
            `USER#${user.id}`,
            `COST#${timestamp}`,
            'Analytics',
            {
                id: costId,
                userId: user.id,
                strandId: strandId || null,
                taskType: taskType || null,
                operation,
                tokenUsage,
                cost,
                timestamp,
                metadata: metadata || {},
            }
        );

        return NextResponse.json({
            success: true,
            costId,
            message: 'Cost recorded successfully',
        });
    } catch (error) {
        console.error('Failed to record cost:', error);
        return NextResponse.json(
            { error: 'Failed to record cost' },
            { status: 500 }
        );
    }
}
