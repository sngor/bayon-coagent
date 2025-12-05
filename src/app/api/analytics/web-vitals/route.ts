/**
 * Web Vitals Analytics API
 * 
 * This endpoint receives Core Web Vitals metrics from the client
 * and stores them for analysis and monitoring.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logInfo, logError } from '@/aws/logging/logger';

export const runtime = 'edge';

interface WebVitalPayload {
    metric: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    navigationType: string;
    url: string;
    userAgent: string;
    timestamp: number;
}

export async function POST(request: NextRequest) {
    try {
        const payload: WebVitalPayload = await request.json();

        // Validate payload
        if (!payload.metric || typeof payload.value !== 'number') {
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 }
            );
        }

        // Log the metric
        logInfo('Web Vital Metric', {
            metric: payload.metric,
            value: payload.value,
            rating: payload.rating,
            url: payload.url,
            navigationType: payload.navigationType,
        });

        // In production, you would:
        // 1. Store metrics in CloudWatch or a time-series database
        // 2. Aggregate metrics for dashboards
        // 3. Set up alerts for poor performance
        // 4. Track trends over time

        // For now, we'll just acknowledge receipt
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        logError('Failed to process web vitals', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
