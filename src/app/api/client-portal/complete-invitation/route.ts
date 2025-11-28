import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * Complete Client Invitation API Route
 * 
 * Marks an invitation as accepted after the client sets their password.
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

        // Update invitation status to accepted
        const invitationPK = `AGENT#${invitation.agentId}`;
        const invitationSK = `INVITATION#${token}`;

        await repository.update(
            invitationPK,
            invitationSK,
            {
                status: 'accepted',
                acceptedAt: Date.now(),
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Invitation completed successfully',
        });
    } catch (error) {
        console.error('Failed to complete invitation:', error);
        return NextResponse.json(
            { error: 'Failed to complete invitation' },
            { status: 500 }
        );
    }
}
