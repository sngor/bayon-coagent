/**
 * Scheduler Service
 * 
 * Manages recurring operations and workflows for the microservices architecture.
 * Supports the data processing and analytics microservices ecosystem.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Types for scheduler service
interface ScheduledJob {
    jobId: string;
    name: string;
    description?: string;
    schedule: CronSchedule | IntervalSchedule;
    action: JobAction;
    enabled: boolean;
    createdAt: string;
    lastRun?: string;
    nextRun?: string;
    runCount: number;
    failureCount: number;
    maxRetries: number;
    timeout: number; // milliseconds
    metadata?: Record<string, any>;
}

interface CronSchedule {
    type: 'cron';
    expression: string; // e.g., "0 0 * * *" for daily at midnight
    timezone?: string;
}

interface IntervalSchedule {
    type: 'interval';
    intervalMs: number;
    startTime?: string;
    endTime?: string;
}

interface JobAction {
    type: 'http' | 'lambda' | 'sqs' | 'sns';
    target: string;
    payload?: Record<string, any>;
    headers?: Record<string, string>;
    method?: string; // for HTTP actions
}

interface JobExecution {
    executionId: string;
    jobId: string;
    startedAt: string;
    completedAt?: string;
    status: 'running' | 'completed' | 'failed' | 'timeout';
    result?: any;
    error?: string;
    duration?: number;
    retryCount: number;
}

interface ScheduleRequest {
    job: Omit<ScheduledJob, 'jobId' | 'createdAt' | 'runCount' | 'failureCount' | 'lastRun' | 'nextRun'>;
}

interface JobStatusRequest {
    jobId: string;
}

// Job scheduler and executor
class JobScheduler {
    private jobs: Map<string, ScheduledJob> = new Map();
    private executions: Map<string, JobExecution> = new Map();
    private timers: Map<string, NodeJS.Timeout> = new Map();

    async scheduleJob(request: ScheduleRequest): Promise<ScheduledJob> {
        const jobId = this.generateJobId();
        const now = new Date().toISOString();

        const job: ScheduledJob = {
            ...request.job,
            jobId,
            createdAt: now,
            runCount: 0,
            failureCount: 0,
            nextRun: this.calculateNextRun(request.job.schedule, now),
        };

        this.jobs.set(jobId, job);

        if (job.enabled) {
            this.scheduleNextExecution(job);
        }

        return job;
    }

    async updateJob(jobId: string, updates: Partial<ScheduledJob>): Promise<ScheduledJob | null> {
        const job = this.jobs.get(jobId);
        if (!job) {
            return null;
        }

        const updatedJob = { ...job, ...updates };
        this.jobs.set(jobId, updatedJob);

        // Reschedule if schedule or enabled status changed
        if (updates.schedule || updates.enabled !== undefined) {
            this.cancelScheduledExecution(jobId);
            if (updatedJob.enabled) {
                updatedJob.nextRun = this.calculateNextRun(updatedJob.schedule, new Date().toISOString());
                this.scheduleNextExecution(updatedJob);
            }
        }

        return updatedJob;
    }

    async deleteJob(jobId: string): Promise<boolean> {
        const job = this.jobs.get(jobId);
        if (!job) {
            return false;
        }

        this.cancelScheduledExecution(jobId);
        this.jobs.delete(jobId);

        // Clean up executions for this job
        for (const [executionId, execution] of this.executions.entries()) {
            if (execution.jobId === jobId) {
                this.executions.delete(executionId);
            }
        }

        return true;
    }

    async getJob(jobId: string): Promise<ScheduledJob | null> {
        return this.jobs.get(jobId) || null;
    }

    async listJobs(): Promise<ScheduledJob[]> {
        return Array.from(this.jobs.values());
    }

    async getJobExecutions(jobId: string, limit: number = 10): Promise<JobExecution[]> {
        const executions = Array.from(this.executions.values())
            .filter(execution => execution.jobId === jobId)
            .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
            .slice(0, limit);

        return executions;
    }

    private scheduleNextExecution(job: ScheduledJob): void {
        if (!job.nextRun) {
            return;
        }

        const nextRunTime = Date.parse(job.nextRun);
        const now = Date.now();
        const delay = Math.max(0, nextRunTime - now);

        const timer = setTimeout(() => {
            this.executeJob(job);
        }, delay);

        this.timers.set(job.jobId, timer);
    }

    private cancelScheduledExecution(jobId: string): void {
        const timer = this.timers.get(jobId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(jobId);
        }
    }

    private async executeJob(job: ScheduledJob): Promise<void> {
        const executionId = this.generateExecutionId();
        const startedAt = new Date().toISOString();

        const execution: JobExecution = {
            executionId,
            jobId: job.jobId,
            startedAt,
            status: 'running',
            retryCount: 0,
        };

        this.executions.set(executionId, execution);

        try {
            // Execute the job action with timeout
            const result = await Promise.race([
                this.performJobAction(job.action),
                this.createTimeoutPromise(job.timeout),
            ]);

            // Update execution status
            execution.completedAt = new Date().toISOString();
            execution.status = 'completed';
            execution.result = result;
            execution.duration = Date.parse(execution.completedAt) - Date.parse(startedAt);

            // Update job statistics
            job.runCount++;
            job.lastRun = startedAt;

        } catch (error) {
            // Handle execution failure
            execution.completedAt = new Date().toISOString();
            execution.status = error.message === 'Job timeout' ? 'timeout' : 'failed';
            execution.error = error instanceof Error ? error.message : 'Unknown error';
            execution.duration = Date.parse(execution.completedAt) - Date.parse(startedAt);

            job.failureCount++;

            // Retry logic
            if (execution.retryCount < job.maxRetries) {
                execution.retryCount++;
                setTimeout(() => {
                    this.executeJob(job);
                }, 5000 * Math.pow(2, execution.retryCount)); // Exponential backoff
                return;
            }
        }

        // Schedule next execution
        if (job.enabled) {
            job.nextRun = this.calculateNextRun(job.schedule, new Date().toISOString());
            this.scheduleNextExecution(job);
        }

        // Update job in storage
        this.jobs.set(job.jobId, job);
    }

    private async performJobAction(action: JobAction): Promise<any> {
        switch (action.type) {
            case 'http':
                return this.performHttpAction(action);
            case 'lambda':
                return this.performLambdaAction(action);
            case 'sqs':
                return this.performSqsAction(action);
            case 'sns':
                return this.performSnsAction(action);
            default:
                throw new Error(`Unsupported action type: ${action.type}`);
        }
    }

    private async performHttpAction(action: JobAction): Promise<any> {
        // Simulate HTTP request
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // Simulate occasional failures (5% failure rate)
        if (Math.random() < 0.05) {
            throw new Error('HTTP request failed');
        }

        return {
            status: 200,
            response: 'HTTP action completed successfully',
            target: action.target,
            method: action.method || 'POST',
        };
    }

    private async performLambdaAction(action: JobAction): Promise<any> {
        // Simulate Lambda invocation
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

        // Simulate occasional failures (3% failure rate)
        if (Math.random() < 0.03) {
            throw new Error('Lambda invocation failed');
        }

        return {
            statusCode: 200,
            payload: action.payload,
            functionName: action.target,
        };
    }

    private async performSqsAction(action: JobAction): Promise<any> {
        // Simulate SQS message sending
        await new Promise(resolve => setTimeout(resolve, 25 + Math.random() * 50));

        return {
            messageId: this.generateMessageId(),
            queueUrl: action.target,
            messageBody: JSON.stringify(action.payload),
        };
    }

    private async performSnsAction(action: JobAction): Promise<any> {
        // Simulate SNS message publishing
        await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 60));

        return {
            messageId: this.generateMessageId(),
            topicArn: action.target,
            message: JSON.stringify(action.payload),
        };
    }

    private createTimeoutPromise(timeoutMs: number): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Job timeout')), timeoutMs);
        });
    }

    private calculateNextRun(schedule: CronSchedule | IntervalSchedule, fromTime: string): string {
        const from = new Date(fromTime);

        if (schedule.type === 'interval') {
            const nextRun = new Date(from.getTime() + schedule.intervalMs);

            // Check if within time bounds
            if (schedule.startTime && nextRun.toISOString() < schedule.startTime) {
                return schedule.startTime;
            }
            if (schedule.endTime && nextRun.toISOString() > schedule.endTime) {
                return schedule.endTime;
            }

            return nextRun.toISOString();
        }

        if (schedule.type === 'cron') {
            // Simplified cron parsing - in real implementation, use a proper cron library
            return this.calculateNextCronRun(schedule.expression, from);
        }

        return new Date(from.getTime() + 3600000).toISOString(); // Default to 1 hour
    }

    private calculateNextCronRun(cronExpression: string, from: Date): string {
        // Simplified cron calculation - in production, use a proper cron library like 'node-cron'
        const parts = cronExpression.split(' ');

        // Basic patterns
        if (cronExpression === '0 0 * * *') { // Daily at midnight
            const nextRun = new Date(from);
            nextRun.setDate(nextRun.getDate() + 1);
            nextRun.setHours(0, 0, 0, 0);
            return nextRun.toISOString();
        }

        if (cronExpression === '0 * * * *') { // Every hour
            const nextRun = new Date(from);
            nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0);
            return nextRun.toISOString();
        }

        if (cronExpression === '*/5 * * * *') { // Every 5 minutes
            const nextRun = new Date(from);
            nextRun.setMinutes(nextRun.getMinutes() + 5, 0, 0);
            return nextRun.toISOString();
        }

        // Default fallback
        return new Date(from.getTime() + 3600000).toISOString();
    }

    private generateJobId(): string {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateExecutionId(): string {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Global scheduler instance
const scheduler = new JobScheduler();

/**
 * Scheduler Service Lambda Handler
 * 
 * Manages recurring operations and workflows
 */
export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    const traceId = context.awsRequestId;
    const httpMethod = event.httpMethod;
    const path = event.path;

    try {
        // Route based on HTTP method and path
        if (httpMethod === 'POST' && path.endsWith('/schedule')) {
            return await handleScheduleJob(event, traceId);
        }

        if (httpMethod === 'GET' && path.includes('/jobs/')) {
            const jobId = path.split('/').pop();
            return await handleGetJob(jobId!, traceId);
        }

        if (httpMethod === 'PUT' && path.includes('/jobs/')) {
            const jobId = path.split('/').pop();
            return await handleUpdateJob(jobId!, event, traceId);
        }

        if (httpMethod === 'DELETE' && path.includes('/jobs/')) {
            const jobId = path.split('/').pop();
            return await handleDeleteJob(jobId!, traceId);
        }

        if (httpMethod === 'GET' && path.endsWith('/jobs')) {
            return await handleListJobs(traceId);
        }

        if (httpMethod === 'GET' && path.includes('/executions')) {
            const pathParts = path.split('/');
            const jobId = pathParts[pathParts.indexOf('jobs') + 1];
            return await handleGetExecutions(jobId, traceId);
        }

        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'NOT_FOUND',
                    message: 'Endpoint not found',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'scheduler-service',
                    retryable: false,
                },
            }),
        };

    } catch (error) {
        console.error('Scheduler service error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'INTERNAL_ERROR',
                    message: 'Failed to process scheduler request',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'scheduler-service',
                    retryable: true,
                },
            }),
        };
    }
};

async function handleScheduleJob(event: APIGatewayProxyEvent, traceId: string): Promise<APIGatewayProxyResult> {
    const requestBody: ScheduleRequest = JSON.parse(event.body || '{}');

    if (!requestBody.job) {
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'VALIDATION_ERROR',
                    message: 'job is required',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'scheduler-service',
                    retryable: false,
                },
            }),
        };
    }

    const job = await scheduler.scheduleJob(requestBody);

    return {
        statusCode: 201,
        headers: {
            'Content-Type': 'application/json',
            'X-Trace-ID': traceId,
        },
        body: JSON.stringify({
            message: 'Job scheduled successfully',
            data: job,
        }),
    };
}

async function handleGetJob(jobId: string, traceId: string): Promise<APIGatewayProxyResult> {
    const job = await scheduler.getJob(jobId);

    if (!job) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'NOT_FOUND',
                    message: 'Job not found',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'scheduler-service',
                    retryable: false,
                },
            }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Trace-ID': traceId,
        },
        body: JSON.stringify({
            message: 'Job retrieved successfully',
            data: job,
        }),
    };
}

async function handleUpdateJob(jobId: string, event: APIGatewayProxyEvent, traceId: string): Promise<APIGatewayProxyResult> {
    const updates = JSON.parse(event.body || '{}');
    const job = await scheduler.updateJob(jobId, updates);

    if (!job) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'NOT_FOUND',
                    message: 'Job not found',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'scheduler-service',
                    retryable: false,
                },
            }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Trace-ID': traceId,
        },
        body: JSON.stringify({
            message: 'Job updated successfully',
            data: job,
        }),
    };
}

async function handleDeleteJob(jobId: string, traceId: string): Promise<APIGatewayProxyResult> {
    const deleted = await scheduler.deleteJob(jobId);

    if (!deleted) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-ID': traceId,
            },
            body: JSON.stringify({
                error: {
                    errorId: traceId,
                    errorCode: 'NOT_FOUND',
                    message: 'Job not found',
                    timestamp: new Date().toISOString(),
                    traceId,
                    service: 'scheduler-service',
                    retryable: false,
                },
            }),
        };
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Trace-ID': traceId,
        },
        body: JSON.stringify({
            message: 'Job deleted successfully',
        }),
    };
}

async function handleListJobs(traceId: string): Promise<APIGatewayProxyResult> {
    const jobs = await scheduler.listJobs();

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Trace-ID': traceId,
        },
        body: JSON.stringify({
            message: 'Jobs retrieved successfully',
            data: {
                jobs,
                count: jobs.length,
            },
        }),
    };
}

async function handleGetExecutions(jobId: string, traceId: string): Promise<APIGatewayProxyResult> {
    const executions = await scheduler.getJobExecutions(jobId);

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Trace-ID': traceId,
        },
        body: JSON.stringify({
            message: 'Job executions retrieved successfully',
            data: {
                executions,
                count: executions.length,
            },
        }),
    };
}

// Export for testing
export { JobScheduler, ScheduledJob, JobExecution, ScheduleRequest };