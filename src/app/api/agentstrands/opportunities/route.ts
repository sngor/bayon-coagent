import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * GET /api/agentstrands/opportunities?status=xxx&type=xxx&limit=xxx
 * 
 * Retrieve opportunities for the current user
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
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const repository = getRepository();

        // Query opportunities for the user
        const result = await repository.query(
            `USER#${user.id}`,
            'OPPORTUNITY#',
            { limit }
        );

        let opportunities = result.items || [];

        // Apply filters
        if (status) {
            opportunities = opportunities.filter((opp: any) => opp.status === status);
        }
        if (type) {
            opportunities = opportunities.filter((opp: any) => opp.opportunity?.type === type);
        }

        // Filter out expired opportunities
        const now = new Date().toISOString();
        opportunities = opportunities.filter((opp: any) => {
            if (!opp.expiresAt) return true;
            return opp.expiresAt > now;
        });

        // Sort by potential impact (descending)
        opportunities.sort((a: any, b: any) => {
            const impactA = a.opportunity?.potentialImpact || 0;
            const impactB = b.opportunity?.potentialImpact || 0;
            return impactB - impactA;
        });

        return NextResponse.json({
            opportunities,
            count: opportunities.length,
        });
    } catch (error) {
        console.error('Failed to retrieve opportunities:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve opportunities' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/agentstrands/opportunities
 * 
 * Create a new opportunity record
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
        const { opportunity, suggestions, expiresAt } = body;

        // Validate required fields
        if (!opportunity || !opportunity.type || !opportunity.title) {
            return NextResponse.json(
                { error: 'Missing required opportunity fields: type, title' },
                { status: 400 }
            );
        }

        // Validate opportunity type
        const validTypes = ['trend', 'gap', 'timing', 'competitive'];
        if (!validTypes.includes(opportunity.type)) {
            return NextResponse.json(
                { error: `Invalid opportunity type. Must be one of: ${validTypes.join(', ')}` },
                { status: 400 }
            );
        }

        const repository = getRepository();
        const opportunityId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        const opportunityRecord = {
            id: opportunityId,
            userId: user.id,
            opportunity: {
                id: opportunityId,
                ...opportunity,
            },
            status: 'new',
            suggestions: suggestions || [],
            createdAt: timestamp,
            expiresAt: expiresAt || null,
        };

        // Store opportunity in DynamoDB
        await repository.create(
            `USER#${user.id}`,
            `OPPORTUNITY#${opportunityId}`,
            'UserPreferences',
            opportunityRecord
        );

        return NextResponse.json({
            success: true,
            opportunityId,
            opportunity: opportunityRecord,
        });
    } catch (error) {
        console.error('Failed to create opportunity:', error);
        return NextResponse.json(
            { error: 'Failed to create opportunity' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/agentstrands/opportunities
 * 
 * Update opportunity status or outcome
 */
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { opportunityId, status, outcome } = body;

        if (!opportunityId) {
            return NextResponse.json(
                { error: 'Missing required field: opportunityId' },
                { status: 400 }
            );
        }

        // Validate status if provided
        if (status) {
            const validStatuses = ['new', 'viewed', 'acted-on', 'dismissed'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                    { status: 400 }
                );
            }
        }

        const repository = getRepository();

        // Get existing opportunity
        const existing = await repository.get(
            `USER#${user.id}`,
            `OPPORTUNITY#${opportunityId}`
        );

        if (!existing) {
            return NextResponse.json(
                { error: 'Opportunity not found' },
                { status: 404 }
            );
        }

        // Update fields
        const updates: any = {};
        if (status) updates.status = status;
        if (outcome) updates.outcome = outcome;

        await repository.update(
            `USER#${user.id}`,
            `OPPORTUNITY#${opportunityId}`,
            updates
        );

        return NextResponse.json({
            success: true,
            message: 'Opportunity updated successfully',
        });
    } catch (error) {
        console.error('Failed to update opportunity:', error);
        return NextResponse.json(
            { error: 'Failed to update opportunity' },
            { status: 500 }
        );
    }
}
