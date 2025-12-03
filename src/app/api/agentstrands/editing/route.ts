import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * POST /api/agentstrands/editing/session
 * 
 * Start a new editing session
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
        const { contentId, initialContent, metadata } = body;

        // Validate required fields
        if (!contentId || !initialContent) {
            return NextResponse.json(
                { error: 'Missing required fields: contentId, initialContent' },
                { status: 400 }
            );
        }

        const repository = getRepository();
        const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();

        // Create initial version
        const initialVersion = {
            versionNumber: 1,
            content: initialContent,
            timestamp,
            changes: 'Initial version',
        };

        const editingSession = {
            sessionId,
            contentId,
            userId: user.id,
            versions: [initialVersion],
            currentVersion: 1,
            startedAt: timestamp,
            lastActivityAt: timestamp,
            status: 'active',
            metadata: metadata || {},
        };

        // Store editing session
        await repository.create(
            `USER#${user.id}`,
            `EDITING#${sessionId}`,
            'EditingSession',
            editingSession
        );

        return NextResponse.json({
            success: true,
            session: editingSession,
        });
    } catch (error) {
        console.error('Failed to start editing session:', error);
        return NextResponse.json(
            { error: 'Failed to start editing session' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/agentstrands/editing/session?sessionId=xxx
 * 
 * Retrieve an editing session
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
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing required parameter: sessionId' },
                { status: 400 }
            );
        }

        const repository = getRepository();

        const result = await repository.get(
            `USER#${user.id}`,
            `EDITING#${sessionId}`
        );

        if (!result) {
            return NextResponse.json(
                { error: 'Editing session not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            session: result,
        });
    } catch (error) {
        console.error('Failed to retrieve editing session:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve editing session' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/agentstrands/editing/session
 * 
 * Update an editing session (add version, change status)
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
        const { sessionId, action, content, changes, status } = body;

        if (!sessionId || !action) {
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, action' },
                { status: 400 }
            );
        }

        const repository = getRepository();

        // Get existing session
        const existing = await repository.get(
            `USER#${user.id}`,
            `EDITING#${sessionId}`
        );

        if (!existing) {
            return NextResponse.json(
                { error: 'Editing session not found' },
                { status: 404 }
            );
        }

        const session = existing as any;
        const timestamp = new Date().toISOString();

        if (action === 'add-version') {
            if (!content) {
                return NextResponse.json(
                    { error: 'Content is required for add-version action' },
                    { status: 400 }
                );
            }

            // Add new version
            const newVersion = {
                versionNumber: session.versions.length + 1,
                content,
                timestamp,
                changes: changes || 'User edit',
            };

            session.versions.push(newVersion);
            session.currentVersion = newVersion.versionNumber;
            session.lastActivityAt = timestamp;

            await repository.update(
                `USER#${user.id}`,
                `EDITING#${sessionId}`,
                {
                    versions: session.versions,
                    currentVersion: session.currentVersion,
                    lastActivityAt: session.lastActivityAt,
                }
            );

            return NextResponse.json({
                success: true,
                version: newVersion,
            });
        } else if (action === 'rollback') {
            const targetVersion = body.targetVersion;

            if (!targetVersion || targetVersion < 1 || targetVersion > session.versions.length) {
                return NextResponse.json(
                    { error: 'Invalid target version' },
                    { status: 400 }
                );
            }

            session.currentVersion = targetVersion;
            session.lastActivityAt = timestamp;

            await repository.update(
                `USER#${user.id}`,
                `EDITING#${sessionId}`,
                {
                    currentVersion: session.currentVersion,
                    lastActivityAt: session.lastActivityAt,
                }
            );

            return NextResponse.json({
                success: true,
                currentVersion: targetVersion,
                content: session.versions[targetVersion - 1].content,
            });
        } else if (action === 'update-status') {
            if (!status) {
                return NextResponse.json(
                    { error: 'Status is required for update-status action' },
                    { status: 400 }
                );
            }

            const validStatuses = ['active', 'completed', 'abandoned'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json(
                    { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                    { status: 400 }
                );
            }

            await repository.update(
                `USER#${user.id}`,
                `EDITING#${sessionId}`,
                {
                    status,
                    lastActivityAt: timestamp,
                }
            );

            return NextResponse.json({
                success: true,
                status,
            });
        } else {
            return NextResponse.json(
                { error: 'Invalid action. Must be: add-version, rollback, or update-status' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Failed to update editing session:', error);
        return NextResponse.json(
            { error: 'Failed to update editing session' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/agentstrands/editing/session?sessionId=xxx
 * 
 * Delete an editing session
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = await getCurrentUserServer();
        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json(
                { error: 'Missing required parameter: sessionId' },
                { status: 400 }
            );
        }

        const repository = getRepository();

        await repository.delete(
            `USER#${user.id}`,
            `EDITING#${sessionId}`
        );

        return NextResponse.json({
            success: true,
            message: 'Editing session deleted successfully',
        });
    } catch (error) {
        console.error('Failed to delete editing session:', error);
        return NextResponse.json(
            { error: 'Failed to delete editing session' },
            { status: 500 }
        );
    }
}
