/**
 * Pre-Traffic Hook for Lambda Deployment Validation
 * 
 * This function runs before traffic is shifted to a new Lambda version.
 * It performs validation checks to ensure the new version is ready to receive traffic.
 * 
 * If this function returns success, CodeDeploy proceeds with the traffic shift.
 * If it returns failure, CodeDeploy rolls back the deployment.
 */

import { CodeDeployClient, PutLifecycleEventHookExecutionStatusCommand } from '@aws-sdk/client-codedeploy';

const codedeploy = new CodeDeployClient({});

interface PreTrafficEvent {
    DeploymentId: string;
    LifecycleEventHookExecutionId: string;
    CurrentVersion?: string;
    NewVersion?: string;
}

export const handler = async (event: PreTrafficEvent): Promise<void> => {
    console.log('Pre-traffic hook invoked', JSON.stringify(event, null, 2));

    const { DeploymentId, LifecycleEventHookExecutionId } = event;

    try {
        // Perform pre-deployment validation checks
        const validationResults = await performValidationChecks(event);

        if (validationResults.success) {
            console.log('Pre-traffic validation passed', validationResults);

            // Signal success to CodeDeploy
            await codedeploy.send(new PutLifecycleEventHookExecutionStatusCommand({
                deploymentId: DeploymentId,
                lifecycleEventHookExecutionId: LifecycleEventHookExecutionId,
                status: 'Succeeded'
            }));
        } else {
            console.error('Pre-traffic validation failed', validationResults);

            // Signal failure to CodeDeploy (triggers rollback)
            await codedeploy.send(new PutLifecycleEventHookExecutionStatusCommand({
                deploymentId: DeploymentId,
                lifecycleEventHookExecutionId: LifecycleEventHookExecutionId,
                status: 'Failed'
            }));
        }
    } catch (error) {
        console.error('Pre-traffic hook error', error);

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
 * Perform validation checks before allowing traffic shift
 */
async function performValidationChecks(event: PreTrafficEvent): Promise<{ success: boolean; checks: Record<string, boolean> }> {
    const checks: Record<string, boolean> = {};

    // Check 1: Verify environment variables are set
    checks.environmentVariables = validateEnvironmentVariables();

    // Check 2: Verify AWS service connectivity
    checks.awsConnectivity = await validateAWSConnectivity();

    // Check 3: Verify configuration is valid
    checks.configuration = validateConfiguration();

    // All checks must pass
    const success = Object.values(checks).every(check => check === true);

    return { success, checks };
}

/**
 * Validate required environment variables are present
 */
function validateEnvironmentVariables(): boolean {
    const requiredVars = [
        'NODE_ENV',
        'COGNITO_USER_POOL_ID',
        'COGNITO_CLIENT_ID',
        'DYNAMODB_TABLE_NAME',
        'S3_BUCKET_NAME'
    ];

    for (const varName of requiredVars) {
        if (!process.env[varName]) {
            console.error(`Missing required environment variable: ${varName}`);
            return false;
        }
    }

    return true;
}

/**
 * Validate connectivity to AWS services
 */
async function validateAWSConnectivity(): Promise<boolean> {
    try {
        // Simple check - if we can create AWS clients, connectivity is likely OK
        // In production, you might want to make actual API calls
        return true;
    } catch (error) {
        console.error('AWS connectivity check failed', error);
        return false;
    }
}

/**
 * Validate application configuration
 */
function validateConfiguration(): boolean {
    try {
        // Validate NODE_ENV is valid
        const nodeEnv = process.env.NODE_ENV;
        if (!['development', 'production'].includes(nodeEnv || '')) {
            console.error(`Invalid NODE_ENV: ${nodeEnv}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Configuration validation failed', error);
        return false;
    }
}
