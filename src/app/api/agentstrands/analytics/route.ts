import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * GET /api/agentstrands/analytics/performance?strandId=xxx&timeframe=xxx
 * 
 * Retrieve performance analytics for strands
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
        const strandId = searchParams.get('strandId');
        const timeframe = searchParams.get('timeframe') || '7d';
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        const repository = getRepository();

        // Calculate time range based on timeframe
        const now = new Date();
        const timeRanges: Record<string, number> = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
        };

        const timeRange = timeRanges[timeframe] || timeRanges['7d'];
        const startTime = new Date(now.getTime() - timeRange).toISOString();

        let performanceRecords: any[] = [];

        if (strandId) {
            // Query specific strand performance
            const result = await repository.query(
                `STRAND#${strandId}`,
                `PERF#${startTime}`,
                { limit }
            );
            performanceRecords = result.items || [];
        } else {
            // Query all strands for user (aggregate from feedback)
            const feedbackResult = await repository.query(
                `USER#${user.id}`,
                'FEEDBACK#',
                { limit }
            );

            const feedbackRecords = feedbackResult.items || [];

            // Aggregate by strand
            const strandMetrics: Record<string, any> = {};

            feedbackRecords.forEach((record: any) => {
                if (record.timestamp < startTime) return;

                const sid = record.strandId;
                if (!strandMetrics[sid]) {
                    strandMetrics[sid] = {
                        strandId: sid,
                        totalTasks: 0,
                        totalRatings: 0,
                        sumRatings: 0,
                        avgRating: 0,
                        edits: 0,
                        engagements: 0,
                    };
                }

                strandMetrics[sid].totalTasks++;

                if (record.feedbackType === 'rating' && record.rating) {
                    strandMetrics[sid].totalRatings++;
                    strandMetrics[sid].sumRatings += record.rating;
                }
                if (record.feedbackType === 'edit') {
                    strandMetrics[sid].edits++;
                }
                if (record.feedbackType === 'engagement') {
                    strandMetrics[sid].engagements++;
                }
            });

            // Calculate averages
            Object.values(strandMetrics).forEach((metrics: any) => {
                if (metrics.totalRatings > 0) {
                    metrics.avgRating = metrics.sumRatings / metrics.totalRatings;
                }
            });

            performanceRecords = Object.values(strandMetrics);
        }

        return NextResponse.json({
            analytics: performanceRecords,
            timeframe,
            count: performanceRecords.length,
        });
    } catch (error) {
        console.error('Failed to retrieve analytics:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve analytics' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/agentstrands/analytics/performance
 * 
 * Record performance metrics for a strand
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
        const { strandId, metrics } = body;

        // Validate required fields
        if (!strandId || !metrics) {
            return NextResponse.json(
                { error: 'Missing required fields: strandId, metrics' },
                { status: 400 }
            );
        }

        // Validate metrics structure
        const requiredMetrics = ['executionTime', 'tokenUsage', 'cost', 'successRate', 'userSatisfaction', 'qualityScore'];
        const missingMetrics = requiredMetrics.filter(m => metrics[m] === undefined);

        if (missingMetrics.length > 0) {
            return NextResponse.json(
                { error: `Missing required metrics: ${missingMetrics.join(', ')}` },
                { status: 400 }
            );
        }

        const repository = getRepository();
        const timestamp = new Date().toISOString();

        // Store performance metrics
        await repository.create(
            `STRAND#${strandId}`,
            `PERF#${timestamp}`,
            'PerformanceMetrics',
            {
                strandId,
                userId: user.id,
                metrics,
                timestamp,
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Performance metrics recorded successfully',
        });
    } catch (error) {
        console.error('Failed to record performance metrics:', error);
        return NextResponse.json(
            { error: 'Failed to record performance metrics' },
            { status: 500 }
        );
    }
}
