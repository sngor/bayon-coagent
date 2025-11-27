/**
 * Admin Audit Logger Utility
 * 
 * Provides centralized audit logging for all admin operations.
 * Logs are written to CloudWatch Logs for querying and analysis.
 * 
 * Requirements: 8.2, 8.3 - Admin audit logging
 */

import {
    CloudWatchLogsClient,
    CreateLogGroupCommand,
    CreateLogStreamCommand,
    PutLogEventsCommand,
    DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { getConfig } from '../../aws/config';

const config = getConfig();
const logsClient = new CloudWatchLogsClient({ region: config.region });

const LOG_GROUP_NAME = '/aws/bayon-coagent/admin-audit';
const LOG_STREAM_PREFIX = 'admin-operations';

interface AuditLogEntry {
    adminUserId: string;
    adminEmail?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    sourceIp?: string;
    success: boolean;
    error?: string;
    details?: Record<string, any>;
}

interface LogStreamInfo {
    name: string;
    sequenceToken?: string;
}

// Cache log stream info to avoid repeated API calls
let cachedLogStream: LogStreamInfo | null = null;

/**
 * Log an admin operation to CloudWatch Logs
 */
export async function logAdminOperation(entry: AuditLogEntry): Promise<void> {
    try {
        // Ensure log group and stream exist
        const logStream = await ensureLogStream();

        // Create log entry
        const logEntry = {
            timestamp: Date.now(),
            adminUserId: entry.adminUserId,
            adminEmail: entry.adminEmail,
            action: entry.action,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
            sourceIp: entry.sourceIp,
            success: entry.success,
            error: entry.error,
            details: entry.details,
        };

        // Put log event
        const command = new PutLogEventsCommand({
            logGroupName: LOG_GROUP_NAME,
            logStreamName: logStream.name,
            logEvents: [
                {
                    timestamp: logEntry.timestamp,
                    message: JSON.stringify(logEntry),
                },
            ],
            sequenceToken: logStream.sequenceToken,
        });

        const response = await logsClient.send(command);

        // Update cached sequence token
        if (cachedLogStream) {
            cachedLogStream.sequenceToken = response.nextSequenceToken;
        }

        console.log('Admin operation logged:', {
            action: entry.action,
            resourceType: entry.resourceType,
            success: entry.success,
        });
    } catch (error) {
        // Don't fail the operation if logging fails
        console.error('Failed to log admin operation:', error);
        console.error('Audit log entry:', entry);
    }
}

/**
 * Ensure log group and stream exist
 */
async function ensureLogStream(): Promise<LogStreamInfo> {
    // Return cached log stream if available
    if (cachedLogStream) {
        return cachedLogStream;
    }

    try {
        // Try to create log group (will fail if it already exists)
        await logsClient.send(
            new CreateLogGroupCommand({
                logGroupName: LOG_GROUP_NAME,
            })
        );
        console.log('Created log group:', LOG_GROUP_NAME);
    } catch (error: any) {
        // Ignore if log group already exists
        if (error.name !== 'ResourceAlreadyExistsException') {
            console.error('Failed to create log group:', error);
        }
    }

    // Generate log stream name with date
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logStreamName = `${LOG_STREAM_PREFIX}-${date}`;

    try {
        // Try to create log stream (will fail if it already exists)
        await logsClient.send(
            new CreateLogStreamCommand({
                logGroupName: LOG_GROUP_NAME,
                logStreamName,
            })
        );
        console.log('Created log stream:', logStreamName);

        // Cache the new log stream
        cachedLogStream = {
            name: logStreamName,
            sequenceToken: undefined,
        };

        return cachedLogStream;
    } catch (error: any) {
        // If log stream already exists, get its sequence token
        if (error.name === 'ResourceAlreadyExistsException') {
            const describeCommand = new DescribeLogStreamsCommand({
                logGroupName: LOG_GROUP_NAME,
                logStreamNamePrefix: logStreamName,
            });

            const response = await logsClient.send(describeCommand);
            const stream = response.logStreams?.[0];

            if (stream) {
                cachedLogStream = {
                    name: logStreamName,
                    sequenceToken: stream.uploadSequenceToken,
                };

                return cachedLogStream;
            }
        }

        throw error;
    }
}

/**
 * Clear cached log stream (useful for testing or when switching days)
 */
export function clearLogStreamCache(): void {
    cachedLogStream = null;
}
