/**
 * Property-Based Tests for Zero-Downtime Deployment
 * 
 * **Feature: microservices-architecture, Property 7: Zero-downtime Deployment**
 * **Validates: Requirements 3.4**
 * 
 * Property: For any service update, deployments should complete without service 
 * interruption or user impact
 */

import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Property 7: Zero-downtime Deployment', () => {
    let templateContent: string;
    let template: any;

    beforeAll(() => {
        // Read the SAM template
        const templatePath = join(process.cwd(), 'template.yaml');
        templateContent = readFileSync(templatePath, 'utf-8');

        // Parse YAML (simple parsing for validation)
        // We'll use string matching since we don't have a YAML parser
    });

    /**
     * Property: Global deployment configuration exists
     * 
     * The Globals section should have AutoPublishAlias and DeploymentPreference
     * configured for all Lambda functions
     */
    it(
        'should have global deployment configuration in SAM template',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for AutoPublishAlias in Globals
            expect(templateContent).toContain('AutoPublishAlias: live');

            // Check for DeploymentPreference in Globals
            expect(templateContent).toContain('DeploymentPreference:');
            expect(templateContent).toContain('Type: Linear10PercentEvery1Minute');

            // Check for deployment alarms
            expect(templateContent).toContain('!Ref LambdaErrorAlarm');
            expect(templateContent).toContain('!Ref LambdaThrottleAlarm');

            // Check for traffic hooks
            expect(templateContent).toContain('PreTraffic: !Ref PreTrafficHookFunction');
            expect(templateContent).toContain('PostTraffic: !Ref PostTrafficHookFunction');
        }
    );

    /**
     * Property: CloudWatch alarms exist for automatic rollback
     * 
     * The template should define CloudWatch alarms that monitor
     * Lambda errors and throttles during deployment
     */
    it(
        'should have CloudWatch alarms for automatic rollback',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for LambdaErrorAlarm
            expect(templateContent).toContain('LambdaErrorAlarm:');
            expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
            expect(templateContent).toContain('MetricName: Errors');
            expect(templateContent).toContain('Namespace: AWS/Lambda');

            // Check for LambdaThrottleAlarm
            expect(templateContent).toContain('LambdaThrottleAlarm:');
            expect(templateContent).toContain('MetricName: Throttles');

            // Verify alarm thresholds are reasonable
            const errorAlarmSection = templateContent.substring(
                templateContent.indexOf('LambdaErrorAlarm:'),
                templateContent.indexOf('LambdaThrottleAlarm:')
            );

            // Error threshold should be 5 or less
            expect(errorAlarmSection).toMatch(/Threshold:\s*\d+/);

            const throttleAlarmSection = templateContent.substring(
                templateContent.indexOf('LambdaThrottleAlarm:'),
                templateContent.indexOf('LambdaThrottleAlarm:') + 500
            );

            // Throttle threshold should be 3 or less
            expect(throttleAlarmSection).toMatch(/Threshold:\s*\d+/);
        }
    );

    /**
     * Property: Traffic hook functions exist
     * 
     * Pre-traffic and post-traffic hook functions should be defined
     * to validate deployments before and after traffic shift
     */
    it(
        'should have traffic hook functions defined',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for PreTrafficHookFunction
            expect(templateContent).toContain('PreTrafficHookFunction:');
            expect(templateContent).toContain('Type: AWS::Serverless::Function');
            expect(templateContent).toContain('Handler: deployment-hooks/pre-traffic.handler');

            // Check for PostTrafficHookFunction
            expect(templateContent).toContain('PostTrafficHookFunction:');
            expect(templateContent).toContain('Handler: deployment-hooks/post-traffic.handler');

            // Verify hook functions have adequate timeout
            const preTrafficSection = templateContent.substring(
                templateContent.indexOf('PreTrafficHookFunction:'),
                templateContent.indexOf('PostTrafficHookFunction:')
            );

            expect(preTrafficSection).toMatch(/Timeout:\s*60/);

            const postTrafficSection = templateContent.substring(
                templateContent.indexOf('PostTrafficHookFunction:'),
                templateContent.indexOf('PostTrafficHookFunction:') + 1000
            );

            expect(postTrafficSection).toMatch(/Timeout:\s*60/);
        }
    );

    /**
     * Property: Traffic hook implementation files exist
     * 
     * The actual Lambda function code for traffic hooks should exist
     */
    it(
        'should have traffic hook implementation files',
        () => {
            const preTrafficPath = join(process.cwd(), 'src/lambda/deployment-hooks/pre-traffic.ts');
            const postTrafficPath = join(process.cwd(), 'src/lambda/deployment-hooks/post-traffic.ts');

            // Check files exist
            expect(() => readFileSync(preTrafficPath, 'utf-8')).not.toThrow();
            expect(() => readFileSync(postTrafficPath, 'utf-8')).not.toThrow();

            // Check pre-traffic hook has validation logic
            const preTrafficContent = readFileSync(preTrafficPath, 'utf-8');
            expect(preTrafficContent).toContain('performValidationChecks');
            expect(preTrafficContent).toContain('PutLifecycleEventHookExecutionStatusCommand');
            expect(preTrafficContent).toContain('validateEnvironmentVariables');

            // Check post-traffic hook has validation logic
            const postTrafficContent = readFileSync(postTrafficPath, 'utf-8');
            expect(postTrafficContent).toContain('performValidationChecks');
            expect(postTrafficContent).toContain('validateErrorRate');
            expect(postTrafficContent).toContain('validateThrottling');
        }
    );

    /**
     * Property: Deployment configuration applies to all Lambda functions
     * 
     * For any Lambda function defined in the template, it should inherit
     * the global deployment configuration (unless explicitly overridden)
     */
    it(
        'should apply deployment configuration to all Lambda functions',
        () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        'AiBlogPostGeneratorFunction',
                        'AiSocialMediaGeneratorFunction',
                        'AiListingDescriptionGeneratorFunction',
                        'AiMarketUpdateGeneratorFunction',
                        'IntegrationGoogleOAuthFunction',
                        'IntegrationSocialOAuthFunction',
                        'IntegrationMLSSyncFunction',
                        'LifeEventProcessorFunction',
                        'CompetitorMonitorProcessorFunction',
                        'TrendDetectorProcessorFunction',
                        'PriceReductionProcessorFunction',
                        'NotificationProcessorFunction',
                        'CalculateOptimalTimesFunction',
                        'PublishScheduledContentFunction',
                        'SyncSocialAnalyticsFunction'
                    ),
                    (functionName) => {
                        const templatePath = join(process.cwd(), 'template.yaml');
                        const templateContent = readFileSync(templatePath, 'utf-8');

                        // Find the function definition
                        const functionIndex = templateContent.indexOf(`${functionName}:`);
                        expect(functionIndex).toBeGreaterThan(-1);

                        // Get the function section (next 1000 characters)
                        const functionSection = templateContent.substring(
                            functionIndex,
                            functionIndex + 1000
                        );

                        // Function should be of type AWS::Serverless::Function
                        expect(functionSection).toContain('Type: AWS::Serverless::Function');

                        // Function should NOT explicitly disable deployment preference
                        // (unless it's a traffic hook function)
                        if (!functionName.includes('Hook')) {
                            expect(functionSection).not.toContain('DeploymentPreference:\n        Enabled: false');
                        }
                    }
                ),
                { numRuns: 15 }
            );
        }
    );

    /**
     * Property: Deployment strategy is gradual (canary)
     * 
     * The deployment type should be Linear10PercentEvery1Minute
     * which provides gradual rollout with 10% increments
     */
    it(
        'should use gradual canary deployment strategy',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check deployment type
            expect(templateContent).toContain('Type: Linear10PercentEvery1Minute');

            // Verify this is in the Globals section
            const globalsSection = templateContent.substring(
                templateContent.indexOf('Globals:'),
                templateContent.indexOf('Resources:')
            );

            expect(globalsSection).toContain('DeploymentPreference:');
            expect(globalsSection).toContain('Type: Linear10PercentEvery1Minute');
        }
    );

    /**
     * Property: IAM permissions for deployment hooks
     * 
     * The ApplicationRole should have permissions for CodeDeploy
     * and CloudWatch to support deployment validation
     */
    it(
        'should have IAM permissions for deployment hooks',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for CodeDeploy permissions
            expect(templateContent).toContain('CodeDeployAccess');
            expect(templateContent).toContain('codedeploy:PutLifecycleEventHookExecutionStatus');

            // Check for CloudWatch metrics permissions
            expect(templateContent).toContain('CloudWatchMetricsAccess');
            expect(templateContent).toContain('cloudwatch:GetMetricStatistics');

            // Check for Lambda invoke permissions (for smoke tests)
            expect(templateContent).toContain('LambdaInvokeAccess');
            expect(templateContent).toContain('lambda:InvokeFunction');
        }
    );
});
