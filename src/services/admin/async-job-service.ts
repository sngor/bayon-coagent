/**
 * Async Job Service for Admin Platform
 * 
 * Handles long-running operations asynchronously:
 * - Large data exports
 * - Bulk operations
 * - Report generation
 * 
 * Features:
 * - Job queuing and status tracking
 * - Progress updates
 * - Email notifications on completion
 * - Operation cancellation support
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { v4 as uuidv4 } from 'uuid';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { getConfig } from '@/aws/config';

export interface AsyncJob {
    jobId: string;
    userId: string;
    userEmail: string;
    jobType: 'export' | 'bulk_operation' | 'report_generation';
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    totalItems?: number;
    processedItems?: number;
    result?: {
        downloadUrl?: string;
        summary?: Record<string, any>;
        errors?: string[];
    };
    error?: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    cancelledAt?: number;
    metadata: Record<string, any>;
}

export interface JobProgress {
    jobId: string;
    progress: number;
    status: string;
    message?: string;
    processedItems?: number;
    totalItems?: number;
}

export class AsyncJobService {
    private repository: DynamoDBRepository;
    private sesClient: SESClient;
    private config: ReturnType<typeof getConfig>;

    constructor() {
        this.repository = new DynamoDBRepository();
        this.config = getConfig();

        const clientConfig = {
            region: this.config.region,
            ...(this.config.environment === 'local' && {
                endpoint: 'http://localhost:4566',
                credentials: {
                    accessKeyId: 'test',
                    secretAccessKey: 'test',
                },
            }),
        };

        this.sesClient = new SESClient(clientConfig);
    }

    /**
     * Creates a new async job
     */
    async createJob(
        userId: string,
        userEmail: string,
        jobType: AsyncJob['jobType'],
        metadata: Record<string, any>
    ): Promise<AsyncJob> {
        const jobId = uuidv4();
        const now = Date.now();

        const job: AsyncJob = {
            jobId,
            userId,
            userEmail,
            jobType,
            status: 'queued',
            progress: 0,
            createdAt: now,
            metadata,
        };

        // Store job in DynamoDB
        await this.repository.create(
            `JOB#${jobId}`,
            'METADATA',
            'AsyncJob',
            job
        );

        // Also create a user index entry for easy lookup
        await this.repository.create(
            `USER#${userId}`,
            `JOB#${jobId}`,
            'UserJob',
            {
                jobId,
                jobType,
                status: 'queued',
                createdAt: now,
            }
        );

        return job;
    }

    /**
     * Gets a job by ID
     */
    async getJob(jobId: string): Promise<AsyncJob | null> {
        try {
            const job = await this.repository.get<AsyncJob>(
                `JOB#${jobId}`,
                'METADATA'
            );
            return job;
        } catch (error) {
            console.error('Failed to get job:', error);
            return null;
        }
    }

    /**
     * Gets all jobs for a user
     */
    async getUserJobs(
        userId: string,
        options?: {
            status?: AsyncJob['status'];
            jobType?: AsyncJob['jobType'];
            limit?: number;
        }
    ): Promise<AsyncJob[]> {
        const result = await this.repository.query<{ jobId: string }>(
            `USER#${userId}`,
            'JOB#'
        );

        // Fetch full job details
        const jobs = await Promise.all(
            result.items.map((item) => this.getJob(item.jobId))
        );

        // Filter out nulls and apply filters
        let filteredJobs = jobs.filter((job): job is AsyncJob => job !== null);

        if (options?.status) {
            filteredJobs = filteredJobs.filter((job) => job.status === options.status);
        }

        if (options?.jobType) {
            filteredJobs = filteredJobs.filter((job) => job.jobType === options.jobType);
        }

        // Sort by creation date (newest first)
        filteredJobs.sort((a, b) => b.createdAt - a.createdAt);

        // Apply limit
        if (options?.limit) {
            filteredJobs = filteredJobs.slice(0, options.limit);
        }

        return filteredJobs;
    }

    /**
     * Updates job status
     */
    async updateJobStatus(
        jobId: string,
        status: AsyncJob['status'],
        updates?: Partial<AsyncJob>
    ): Promise<void> {
        const now = Date.now();
        const updateData: Record<string, any> = {
            status,
            ...updates,
        };

        if (status === 'processing' && !updates?.startedAt) {
            updateData.startedAt = now;
        }

        if (status === 'completed' || status === 'failed') {
            updateData.completedAt = now;
            updateData.progress = 100;
        }

        if (status === 'cancelled') {
            updateData.cancelledAt = now;
        }

        await this.repository.update(`JOB#${jobId}`, 'METADATA', updateData);

        // Update user index
        const job = await this.getJob(jobId);
        if (job) {
            await this.repository.update(`USER#${job.userId}`, `JOB#${jobId}`, {
                status,
            });
        }
    }

    /**
     * Updates job progress
     */
    async updateJobProgress(
        jobId: string,
        progress: number,
        processedItems?: number,
        totalItems?: number
    ): Promise<void> {
        const updateData: Record<string, any> = {
            progress: Math.min(100, Math.max(0, progress)),
        };

        if (processedItems !== undefined) {
            updateData.processedItems = processedItems;
        }

        if (totalItems !== undefined) {
            updateData.totalItems = totalItems;
        }

        await this.repository.update(`JOB#${jobId}`, 'METADATA', updateData);
    }

    /**
     * Marks job as completed with result
     */
    async completeJob(
        jobId: string,
        result: AsyncJob['result']
    ): Promise<void> {
        await this.updateJobStatus(jobId, 'completed', { result });

        // Send completion email
        const job = await this.getJob(jobId);
        if (job) {
            await this.sendCompletionEmail(job);
        }
    }

    /**
     * Marks job as failed with error
     */
    async failJob(jobId: string, error: string): Promise<void> {
        await this.updateJobStatus(jobId, 'failed', { error });

        // Send failure email
        const job = await this.getJob(jobId);
        if (job) {
            await this.sendFailureEmail(job);
        }
    }

    /**
     * Cancels a job
     */
    async cancelJob(jobId: string): Promise<void> {
        const job = await this.getJob(jobId);

        if (!job) {
            throw new Error('Job not found');
        }

        if (job.status === 'completed' || job.status === 'failed') {
            throw new Error('Cannot cancel completed or failed job');
        }

        await this.updateJobStatus(jobId, 'cancelled');
    }

    /**
     * Gets job progress
     */
    async getJobProgress(jobId: string): Promise<JobProgress | null> {
        const job = await this.getJob(jobId);

        if (!job) {
            return null;
        }

        return {
            jobId: job.jobId,
            progress: job.progress,
            status: job.status,
            processedItems: job.processedItems,
            totalItems: job.totalItems,
        };
    }

    /**
     * Sends completion email to user
     */
    private async sendCompletionEmail(job: AsyncJob): Promise<void> {
        if (this.config.environment === 'local') {
            console.log('Would send completion email:', {
                to: job.userEmail,
                jobId: job.jobId,
                jobType: job.jobType,
            });
            return;
        }

        const jobTypeLabel = this.getJobTypeLabel(job.jobType);
        const downloadLink = job.result?.downloadUrl
            ? `<p><a href="${job.result.downloadUrl}">Download your ${jobTypeLabel.toLowerCase()}</a></p>`
            : '';

        const summary = job.result?.summary
            ? `<p>Summary: ${JSON.stringify(job.result.summary, null, 2)}</p>`
            : '';

        const command = new SendEmailCommand({
            Source: process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com',
            Destination: {
                ToAddresses: [job.userEmail],
            },
            Message: {
                Subject: {
                    Data: `${jobTypeLabel} Complete`,
                },
                Body: {
                    Html: {
                        Data: `
              <h2>${jobTypeLabel} Complete</h2>
              <p>Your ${jobTypeLabel.toLowerCase()} has been completed successfully.</p>
              ${downloadLink}
              ${summary}
              <p>Job ID: ${job.jobId}</p>
            `,
                    },
                },
            },
        });

        try {
            await this.sesClient.send(command);
        } catch (error) {
            console.error('Failed to send completion email:', error);
        }
    }

    /**
     * Sends failure email to user
     */
    private async sendFailureEmail(job: AsyncJob): Promise<void> {
        if (this.config.environment === 'local') {
            console.log('Would send failure email:', {
                to: job.userEmail,
                jobId: job.jobId,
                error: job.error,
            });
            return;
        }

        const jobTypeLabel = this.getJobTypeLabel(job.jobType);

        const command = new SendEmailCommand({
            Source: process.env.SES_FROM_EMAIL || 'noreply@bayoncoagent.com',
            Destination: {
                ToAddresses: [job.userEmail],
            },
            Message: {
                Subject: {
                    Data: `${jobTypeLabel} Failed`,
                },
                Body: {
                    Html: {
                        Data: `
              <h2>${jobTypeLabel} Failed</h2>
              <p>Unfortunately, your ${jobTypeLabel.toLowerCase()} failed to complete.</p>
              <p>Error: ${job.error || 'Unknown error'}</p>
              <p>Job ID: ${job.jobId}</p>
              <p>Please contact support if this issue persists.</p>
            `,
                    },
                },
            },
        });

        try {
            await this.sesClient.send(command);
        } catch (error) {
            console.error('Failed to send failure email:', error);
        }
    }

    /**
     * Gets human-readable job type label
     */
    private getJobTypeLabel(jobType: AsyncJob['jobType']): string {
        switch (jobType) {
            case 'export':
                return 'Data Export';
            case 'bulk_operation':
                return 'Bulk Operation';
            case 'report_generation':
                return 'Report Generation';
            default:
                return 'Job';
        }
    }

    /**
     * Cleans up old completed jobs (older than 30 days)
     */
    async cleanupOldJobs(): Promise<number> {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        let deletedCount = 0;

        // This would typically be run as a background job
        // For now, we'll just mark it as a placeholder
        console.log('Cleanup old jobs older than:', new Date(thirtyDaysAgo));

        return deletedCount;
    }
}

// Export singleton instance
export const asyncJobService = new AsyncJobService();
