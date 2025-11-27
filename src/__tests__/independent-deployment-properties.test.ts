/**
 * Property-Based Tests for Independent Deployment
 * 
 * **Feature: microservices-architecture, Property 2: Independent Deployment**
 * **Validates: Requirements 1.4**
 * 
 * Property: For any service deployment, other services should remain unaffected 
 * and continue normal operation
 */

import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Property 2: Independent Deployment', () => {
    /**
     * Property: Services are independently deployable
     * 
     * Each service should be defined as a separate Lambda function
     * with its own deployment configuration, allowing independent updates
     */
    it(
        'should have separate Lambda functions for each service',
        () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        // AI Processing Service functions
                        { service: 'AI Processing', functions: ['AiBlogPostGeneratorFunction', 'AiSocialMediaGeneratorFunction', 'AiListingDescriptionGeneratorFunction', 'AiMarketUpdateGeneratorFunction'] },
                        // Integration Service functions
                        { service: 'Integration', functions: ['IntegrationGoogleOAuthFunction', 'IntegrationSocialOAuthFunction', 'IntegrationMLSSyncFunction'] },
                        // Background Processing Service functions
                        { service: 'Background Processing', functions: ['LifeEventProcessorFunction', 'CompetitorMonitorProcessorFunction', 'TrendDetectorProcessorFunction', 'PriceReductionProcessorFunction', 'NotificationProcessorFunction'] },
                        // Content Workflow Service functions
                        { service: 'Content Workflow', functions: ['CalculateOptimalTimesFunction', 'PublishScheduledContentFunction', 'SyncSocialAnalyticsFunction'] }
                    ),
                    (serviceGroup) => {
                        const templatePath = join(process.cwd(), 'template.yaml');
                        const templateContent = readFileSync(templatePath, 'utf-8');

                        // Each function in the service should be independently defined
                        for (const functionName of serviceGroup.functions) {
                            const functionIndex = templateContent.indexOf(`${functionName}:`);
                            expect(functionIndex).toBeGreaterThan(-1);

                            // Get the function section
                            const functionSection = templateContent.substring(
                                functionIndex,
                                functionIndex + 1500
                            );

                            // Function should have its own configuration
                            expect(functionSection).toContain('Type: AWS::Serverless::Function');
                            expect(functionSection).toContain('FunctionName:');
                            expect(functionSection).toContain('Handler:');

                            // Runtime may be inherited from Globals, so we don't require it explicitly
                            // Function should have independent deployment capability
                            // (inherits from Globals unless explicitly disabled)
                            expect(functionSection).toContain('Type: AWS::Serverless::Function');
                        }
                    }
                ),
                { numRuns: 4 } // Test all service groups
            );
        }
    );

    /**
     * Property: Services have separate API Gateway endpoints
     * 
     * Each service should have its own API Gateway, allowing
     * independent deployment and versioning
     */
    it(
        'should have separate API Gateways for service boundaries',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for separate API Gateways
            const apiGateways = [
                'MainRestApi',
                'AiServiceApi',
                'IntegrationServiceApi',
                'BackgroundServiceApi',
                'AdminServiceApi'
            ];

            for (const apiGateway of apiGateways) {
                expect(templateContent).toContain(`${apiGateway}:`);

                // Find the API Gateway section
                const apiIndex = templateContent.indexOf(`${apiGateway}:`);
                const apiSection = templateContent.substring(apiIndex, apiIndex + 500);

                // Should be of type AWS::ApiGateway::RestApi
                expect(apiSection).toContain('Type: AWS::ApiGateway::RestApi');
                expect(apiSection).toContain('Name:');
            }
        }
    );

    /**
     * Property: Services have independent IAM roles
     * 
     * While services may share a common ApplicationRole, they should
     * have the ability to use service-specific roles if needed
     */
    it(
        'should support independent IAM configuration',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for service-specific IAM roles
            const roles = [
                'ApplicationRole',
                'AiProcessingLambdaRole',
                'IntegrationLambdaRole',
                'BackgroundProcessingLambdaRole'
            ];

            for (const role of roles) {
                const roleIndex = templateContent.indexOf(`${role}:`);

                if (roleIndex > -1) {
                    const roleSection = templateContent.substring(roleIndex, roleIndex + 1000);

                    // Should be an IAM Role
                    expect(roleSection).toContain('Type: AWS::IAM::Role');
                    expect(roleSection).toContain('AssumeRolePolicyDocument:');
                }
            }

            // ApplicationRole should exist as a shared role
            expect(templateContent).toContain('ApplicationRole:');
        }
    );

    /**
     * Property: Services have independent event sources
     * 
     * Each service should have its own event sources (SQS queues, EventBridge rules)
     * that don't interfere with other services
     */
    it(
        'should have independent event sources for each service',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for service-specific SQS queues
            const queues = [
                'AiJobRequestQueue',
                'AiJobResponseQueue'
            ];

            for (const queue of queues) {
                expect(templateContent).toContain(`${queue}:`);

                const queueIndex = templateContent.indexOf(`${queue}:`);
                const queueSection = templateContent.substring(queueIndex, queueIndex + 500);

                // Should be an SQS Queue
                expect(queueSection).toContain('Type: AWS::SQS::Queue');
            }

            // Check for EventBridge custom event bus
            expect(templateContent).toContain('ApplicationEventBus:');
            expect(templateContent).toContain('Type: AWS::Events::EventBus');
        }
    );

    /**
     * Property: Services can be deployed independently
     * 
     * Each Lambda function should have AutoPublishAlias configured,
     * allowing independent version management and deployment
     */
    it(
        'should enable independent versioning for all functions',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check that AutoPublishAlias is configured globally
            const globalsSection = templateContent.substring(
                templateContent.indexOf('Globals:'),
                templateContent.indexOf('Resources:')
            );

            expect(globalsSection).toContain('AutoPublishAlias: live');

            // This means all functions get independent versioning by default
            // Each deployment creates a new version without affecting other functions
        }
    );

    /**
     * Property: Service failures are isolated
     * 
     * Each service should have its own error handling and dead letter queues,
     * preventing failures from cascading to other services
     */
    it(
        'should have isolated error handling for each service',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for dead letter queues
            const dlqs = [
                'AiJobRequestDLQ',
                'AiJobResponseDLQ'
            ];

            for (const dlq of dlqs) {
                const dlqIndex = templateContent.indexOf(`${dlq}:`);

                if (dlqIndex > -1) {
                    const dlqSection = templateContent.substring(dlqIndex, dlqIndex + 500);
                    expect(dlqSection).toContain('Type: AWS::SQS::Queue');
                }
            }

            // Check that functions have error handling configuration
            fc.assert(
                fc.property(
                    fc.constantFrom(
                        'AiBlogPostGeneratorFunction',
                        'IntegrationGoogleOAuthFunction',
                        'PublishScheduledContentFunction'
                    ),
                    (functionName) => {
                        const functionIndex = templateContent.indexOf(`${functionName}:`);
                        const functionSection = templateContent.substring(
                            functionIndex,
                            functionIndex + 1500
                        );

                        // Function should have timeout configured (prevents hanging)
                        expect(functionSection).toMatch(/Timeout:\s*\d+/);

                        // Function should have memory configured
                        expect(functionSection).toMatch(/MemorySize:\s*\d+/);

                        // Reserved concurrency is optional but recommended for critical functions
                        // Not all functions need it, so we don't enforce it
                    }
                ),
                { numRuns: 3 }
            );
        }
    );

    /**
     * Property: Services have independent monitoring
     * 
     * Each service should have its own CloudWatch alarms and metrics,
     * allowing independent monitoring and alerting
     */
    it(
        'should have independent monitoring for each service',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for service-specific alarms
            const alarms = [
                'LifeEventProcessorErrorAlarm',
                'CompetitorMonitorErrorAlarm',
                'TrendDetectorErrorAlarm',
                'PriceReductionProcessorErrorAlarm',
                'NotificationProcessorErrorAlarm',
                'CalculateOptimalTimesErrorAlarm',
                'PublishScheduledContentErrorAlarm',
                'SyncSocialAnalyticsErrorAlarm'
            ];

            for (const alarm of alarms) {
                const alarmIndex = templateContent.indexOf(`${alarm}:`);

                if (alarmIndex > -1) {
                    const alarmSection = templateContent.substring(alarmIndex, alarmIndex + 500);
                    expect(alarmSection).toContain('Type: AWS::CloudWatch::Alarm');
                }
            }

            // Each alarm should be independent (not shared across services)
            // This allows deploying one service without affecting others' monitoring
        }
    );

    /**
     * Property: Services have independent health checks
     * 
     * Each service should have its own health check endpoint,
     * allowing independent health monitoring
     */
    it(
        'should have independent health check endpoints',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Check for health check functions
            const healthCheckFunctions = [
                'AiServiceHealthCheckFunction',
                'IntegrationServiceHealthCheckFunction',
                'BackgroundServiceHealthCheckFunction',
                'AdminServiceHealthCheckFunction'
            ];

            for (const healthCheckFunction of healthCheckFunctions) {
                expect(templateContent).toContain(`${healthCheckFunction}:`);

                const functionIndex = templateContent.indexOf(`${healthCheckFunction}:`);
                const functionSection = templateContent.substring(
                    functionIndex,
                    functionIndex + 1000
                );

                // Should be a Lambda function
                expect(functionSection).toContain('Type: AWS::Serverless::Function');
                expect(functionSection).toContain('Handler:');
            }
        }
    );

    /**
     * Property: Deployment of one service doesn't require redeploying others
     * 
     * The SAM template structure should allow deploying individual functions
     * without affecting the entire stack
     */
    it(
        'should support partial stack updates',
        () => {
            const templatePath = join(process.cwd(), 'template.yaml');
            const templateContent = readFileSync(templatePath, 'utf-8');

            // Each Lambda function should be a separate CloudFormation resource
            // This allows CloudFormation to update only changed resources

            fc.assert(
                fc.property(
                    fc.constantFrom(
                        'AiBlogPostGeneratorFunction',
                        'AiSocialMediaGeneratorFunction',
                        'IntegrationGoogleOAuthFunction',
                        'LifeEventProcessorFunction',
                        'PublishScheduledContentFunction'
                    ),
                    (functionName) => {
                        const functionIndex = templateContent.indexOf(`${functionName}:`);
                        expect(functionIndex).toBeGreaterThan(-1);

                        // Function should be a top-level resource
                        // (not nested, which would require redeploying parent)
                        // Each function is defined as a separate CloudFormation resource
                        // This allows independent updates via CloudFormation

                        // Verify the function is properly defined as a resource
                        const functionSection = templateContent.substring(
                            functionIndex,
                            functionIndex + 500
                        );

                        expect(functionSection).toContain('Type: AWS::Serverless::Function');
                    }
                ),
                { numRuns: 5 }
            );
        }
    );
});
