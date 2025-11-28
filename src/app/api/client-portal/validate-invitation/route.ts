import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Validate Client Invitation API Route
 * 
 * Validates an invitation token and returns the associated email.
 * This is used during the password setup flow.
 * 
 * Requirements: 2.1
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            );
        }

        const repository = getRepository();

        // Query for invitation by token
        // We need to scan since we don't have the agentId
        // In production, you'd want a GSI for token lookups
        const results = await repository.scan<{
            token: string;
            email: string;
            agentId: string;
            clientId: string;
            expiresAt: number;
            status: string;
        }>({
            filterExpression: '#token = :token AND #entityType = :entityType',
            expressionAttributeNames: {
                '#token': 'token',
                '#entityType': 'EntityType',
            },
            expressionAttributeValues: {
                ':token': token,
                ':entityType': 'ClientInvitation',
            },
        });

        if (!results.items || results.items.length === 0) {
            return NextResponse.json(
                { error: 'Invalid invitation token' },
                { status: 404 }
            );
        }

        const invitation = results.items[0];

        // Check if invitation has expired
        if (invitation.expiresAt < Date.now()) {
            return NextResponse.json(
                { error: 'Invitation has expired' },
                { status: 400 }
            );
        }

        // Check if invitation has already been used
        if (invitation.status === 'accepted') {
            return NextResponse.json(
                { error: 'Invitation has already been used' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            email: invitation.email,
            clientId: invitation.clientId,
            agentId: invitation.agentId,
        });
    } catch (error) {
        console.error('Failed to validate invitation:', error);
        return NextResponse.json(
            { error: 'Failed to validate invitation' },
            { status: 500 }
        );
    }
}
