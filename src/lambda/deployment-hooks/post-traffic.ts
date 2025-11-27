/**
 * Post-Traffic Hook for Lambda Deployment Validation
 * 
 * This function runs after traffic has been shifted to a new Lambda version.
 * It performs validation checks to ensure the new version is functioning correctly.
 * 
 * If this function returns success, CodeDeploy completes the deployment.
 * If it returns failure, CodeDeploy rolls back to the previous version.
 */

import { CodeDeployClient, PutLifecycleEventHookExecutionStatusCommand } from '@aws-sdk/client-codedeploy';
import { CloudWatchClient, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const codedeploy = new CodeDeployClient({});
const cloudwatch = new CloudWatchClient({});
const lambda = new LambdaClient({});

interface PostTrafficEvent {
    DeploymentId: string;
    LifecycleEventHookExecutionId: string;
    CurrentVersion?: string;
    NewVersion?: string;
}

export const handler = async (event: PostTrafficEvent): Promise<void> => {
    console.log('Post-traffic hook invoked', JSON.stringify(event, null, 2));

    const { DeploymentId, LifecycleEventHookExecutionId } = event;

    try {
        // Perform post-deployment validation checks
        const validationResults = await performValidationChecks(event);

        if (validationResults.success) {
            console.log('Post-traffic validation passed', validationResults);

            // Signal success to CodeDeploy
            await codedeploy.send(new PutLifecycleEventHookExecutionStatusCommand({
                deploymentId: DeploymentId,
                lifecycleEventHookExecutionId: LifecycleEventHookExecutionId,
                status: 'Succeeded'
            }));
        } else {
            console.error('Post-traffic validation failed', validationResults);

            // Signal failure to CodeDeploy (triggers rollback)
            await codedeploy.send(new PutLifecycleEventHookExecutionStatusCommand({
                deploymentId: DeploymentId,
                lifecycleEventHookExecutionId: LifecycleEventHookExecutionId,
                status: 'Failed'
            }));
        }
    } catch (error) {
        console.error('Post-traffic hook error', error);

        // Signal failure on exception
        await codedeploy.send(new PutLifecycleEventHookExecutionStatusCommand({
            deploymentId: DeploymentId,
            lifecycleEventHookExecutionId: LifecycleEventHookExecutionId,
            status: 'Failed'
        }));

        throw error;
    }
};

/**
 * Perform validation checks after traffic shift
 */
async function performValidationChecks(event: PostTrafficEvent): Promise<{ success: boolean; checks: Record<string, boolean> }> {
    const checks: Record<string, boolean> = {};

    // Check 1: Verify error rate is acceptable
    checks.errorRate = await validateErrorRate();

    // Check 2: Verify no throttling is occurring
    checks.throttling = await validateThrottling();

    // Check 3: Perform smoke test
    checks.smokeTest = await performSmokeTest();

    // All checks must pass
    const success = Object.values(checks).every(check => check === true);

    return { success, checks };
}

/**
 * Validate that error rate is within acceptable limits
 */
async function validateErrorRate(): Promise<boolean> {
    try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes

        const response = await cloudwatch.send(new GetMetricStatisticsCommand({
            Namespace: 'AWS/Lambda',
            MetricName: 'Errors',
            StartTime: startTime,
            EndTime: endTime,
            Period: 300,
            Statistics: ['Sum']
        }));

        const errorCount = response.Datapoints?.[0]?.Sum || 0;
        const threshold = 5; // Max 5 errors in 5 minutes

        if (errorCount > threshold) {
            console.error(`Error rate too high: ${errorCount} errors (threshold: ${threshold})`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error rate validation failed', error);
        return false;
    }
}

/**
 * Validate that throttling is not occurring
 */
async function validateThrottling(): Promise<boolean> {
    try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // Last 5 minutes

        const response = await cloudwatch.send(new GetMetricStatisticsCommand({
            Namespace: 'AWS/Lambda',
            MetricName: 'Throttles',
            StartTime: startTime,
            EndTime: endTime,
            Period: 300,
            Statistics: ['Sum']
        }));

        const throttleCount = response.Datapoints?.[0]?.Sum || 0;
        const threshold = 3; // Max 3 throttles in 5 minutes

        if (throttleCount > threshold) {
            console.error(`Throttle rate too high: ${throttleCount} throttles (threshold: ${threshold})`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Throttle validation failed', error);
        return false;
    }
}

/**
 * Perform a smoke test to verify basic functionality
 */
async function performSmokeTest(): Promise<boolean> {
    try {
        // In a real implementation, you would invoke the deployed function
        // with a test payload and verify the response

        // For now, we'll just return true as a placeholder
        // You should implement actual smoke tests based on your function's behavior

        console.log('Smoke test passed (placeholder implementation)');
        return true;
    } catch (error) {
        console.error('Smoke test failed', error);
        return false;
    }
}
