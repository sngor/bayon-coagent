#!/usr/bin/env tsx
/**
 * EventBridge Setup Verification Script
 * 
 * This script verifies that the EventBridge custom event bus, event archive,
 * dead letter queue, and event schemas are properly configured.
 * 
 * Usage:
 *   tsx scripts/verify-eventbridge-setup.ts [environment]
 * 
 * Example:
 *   tsx scripts/verify-eventbridge-setup.ts development
 */

import {
    EventBridgeClient,
    DescribeEventBusCommand,
    ListRulesCommand,
    DescribeArchiveCommand,
} from '@aws-sdk/client-eventbridge';
import {
    SchemasClient,
    ListSchemasCommand,
    DescribeSchemaCommand,
} from '@aws-sdk/client-schemas';
import { SQSClient, GetQueueAttributesCommand, GetQueueUrlCommand } from '@aws-sdk/client-sqs';

const environment = process.argv[2] || 'development';
const region = process.env.AWS_REGION || 'us-east-1';

const eventBridgeClient = new EventBridgeClient({ region });
const schemasClient = new SchemasClient({ region });
const sqsClient = new SQSClient({ region });

interface VerificationResult {
    component: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
    details?: any;
}

const results: VerificationResult[] = [];

/**
 * Verify the custom event bus exists and is configured correctly
 */
async function verifyEventBus(): Promise<void> {
    const eventBusName = `bayon-coagent-events-${environment}`;

    try {
        const command = new DescribeEventBusCommand({
            Name: eventBusName,
        });

        const response = await eventBridgeClient.send(command);

        if (response.Name === eventBusName) {
            results.push({
                component: 'Event Bus',
                status: 'PASS',
                message: `Custom event bus '${eventBusName}' exists`,
                details: {
                    arn: response.Arn,
                    name: response.Name,
                },
            });
        } else {
            results.push({
                component: 'Event Bus',
                status: 'FAIL',
                message: `Event bus name mismatch: expected '${eventBusName}', got '${response.Name}'`,
            });
        }
    } catch (error: any) {
        results.push({
            component: 'Event Bus',
            status: 'FAIL',
            message: `Failed to describe event bus: ${error.message}`,
        });
    }
}

/**
 * Verify EventBridge rules are configured
 */
async function verifyEventBridgeRules(): Promise<void> {
    const eventBusName = `bayon-coagent-events-${environment}`;

    try {
        const command = new ListRulesCommand({
            EventBusName: eventBusName,
        });

        const response = await eventBridgeClient.send(command);
        const rules = response.Rules || [];

        const expectedRules = [
            'life-event-processor',
            'competitor-monitor',
            'trend-detector',
            'price-reduction-monitor',
            'notification-processor',
            'content-publishing',
            'analytics-sync',
        ];

        const foundRules = rules.map(rule => rule.Name || '');
        const missingRules = expectedRules.filter(
            expected => !foundRules.some(found => found.includes(expected))
        );

        if (missingRules.length === 0) {
            results.push({
                component: 'EventBridge Rules',
                status: 'PASS',
                message: `All ${rules.length} expected rules are configured`,
                details: {
                    rules: foundRules,
                },
            });
        } else {
            results.push({
                component: 'EventBridge Rules',
                status: 'WARN',
                message: `Some rules may be missing: ${missingRules.join(', ')}`,
                details: {
                    found: foundRules,
                    missing: missingRules,
                },
            });
        }
    } catch (error: any) {
        results.push({
            component: 'EventBridge Rules',
            status: 'FAIL',
            message: `Failed to list rules: ${error.message}`,
        });
    }
}

/**
 * Verify the event archive exists and is configured correctly
 */
async function verifyEventArchive(): Promise<void> {
    const archiveName = `bayon-coagent-event-archive-${environment}`;

    try {
        const command = new DescribeArchiveCommand({
            ArchiveName: archiveName,
        });

        const response = await eventBridgeClient.send(command);

        if (response.ArchiveName === archiveName) {
            const retentionDays = response.RetentionDays || 0;
            const expectedRetention = environment === 'production' ? 90 : 30;

            if (retentionDays === expectedRetention) {
                results.push({
                    component: 'Event Archive',
                    status: 'PASS',
                    message: `Event archive '${archiveName}' exists with correct retention (${retentionDays} days)`,
                    details: {
                        arn: response.ArchiveArn,
                        state: response.State,
                        retentionDays: response.RetentionDays,
                    },
                });
            } else {
                results.push({
                    component: 'Event Archive',
                    status: 'WARN',
                    message: `Event archive retention mismatch: expected ${expectedRetention} days, got ${retentionDays} days`,
                    details: {
                        arn: response.ArchiveArn,
                        state: response.State,
                        retentionDays: response.RetentionDays,
                    },
                });
            }
        } else {
            results.push({
                component: 'Event Archive',
                status: 'FAIL',
                message: `Archive name mismatch: expected '${archiveName}', got '${response.ArchiveName}'`,
            });
        }
    } catch (error: any) {
        results.push({
            component: 'Event Archive',
            status: 'FAIL',
            message: `Failed to describe event archive: ${error.message}`,
        });
    }
}

/**
 * Verify the dead letter queue exists
 */
async function verifyDeadLetterQueue(): Promise<void> {
    const queueName = `bayon-coagent-eventbridge-dlq-${environment}`;

    try {
        // Get queue URL
        const getUrlCommand = new GetQueueUrlCommand({
            QueueName: queueName,
        });

        const urlResponse = await sqsClient.send(getUrlCommand);
        const queueUrl = urlResponse.QueueUrl;

        if (!queueUrl) {
            results.push({
                component: 'Dead Letter Queue',
                status: 'FAIL',
                message: `Queue '${queueName}' not found`,
            });
            return;
        }

        // Get queue attributes
        const getAttrsCommand = new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['All'],
        });

        const attrsResponse = await sqsClient.send(getAttrsCommand);
        const attributes = attrsResponse.Attributes || {};

        const retentionPeriod = parseInt(attributes.MessageRetentionPeriod || '0', 10);
        const expectedRetention = 1209600; // 14 days

        if (retentionPeriod === expectedRetention) {
            results.push({
                component: 'Dead Letter Queue',
                status: 'PASS',
                message: `DLQ '${queueName}' exists with correct retention (14 days)`,
                details: {
                    queueUrl,
                    retentionPeriod: `${retentionPeriod / 86400} days`,
                    messagesAvailable: attributes.ApproximateNumberOfMessages || '0',
                },
            });
        } else {
            results.push({
                component: 'Dead Letter Queue',
                status: 'WARN',
                message: `DLQ retention mismatch: expected ${expectedRetention}s, got ${retentionPeriod}s`,
                details: {
                    queueUrl,
                    retentionPeriod: `${retentionPeriod / 86400} days`,
                },
            });
        }
    } catch (error: any) {
        results.push({
            component: 'Dead Letter Queue',
            status: 'FAIL',
            message: `Failed to verify DLQ: ${error.message}`,
        });
    }
}

/**
 * Verify event schemas are registered
 */
async function verifyEventSchemas(): Promise<void> {
    const registryName = `bayon-coagent-schemas-${environment}`;

    try {
        const command = new ListSchemasCommand({
            RegistryName: registryName,
        });

        const response = await schemasClient.send(command);
        const schemas = response.Schemas || [];

        const expectedSchemas = [
            'bayon.coagent.user.created',
            'bayon.coagent.content.published',
            'bayon.coagent.ai.job.completed',
            'bayon.coagent.integration.sync.completed',
        ];

        const foundSchemas = schemas.map(schema => schema.SchemaName || '');
        const missingSchemas = expectedSchemas.filter(
            expected => !foundSchemas.includes(expected)
        );

        if (missingSchemas.length === 0) {
            results.push({
                component: 'Event Schemas',
                status: 'PASS',
                message: `All ${expectedSchemas.length} expected schemas are registered`,
                details: {
                    schemas: foundSchemas,
                },
            });

            // Verify each schema in detail
            for (const schemaName of expectedSchemas) {
                await verifySchemaDetail(registryName, schemaName);
            }
        } else {
            results.push({
                component: 'Event Schemas',
                status: 'WARN',
                message: `Some schemas may be missing: ${missingSchemas.join(', ')}`,
                details: {
                    found: foundSchemas,
                    missing: missingSchemas,
                },
            });
        }
    } catch (error: any) {
        results.push({
            component: 'Event Schemas',
            status: 'FAIL',
            message: `Failed to list schemas: ${error.message}`,
        });
    }
}

/**
 * Verify a specific schema's details
 */
async function verifySchemaDetail(registryName: string, schemaName: string): Promise<void> {
    try {
        const command = new DescribeSchemaCommand({
            RegistryName: registryName,
            SchemaName: schemaName,
        });

        const response = await schemasClient.send(command);

        if (response.Type === 'OpenApi3') {
            results.push({
                component: `Schema: ${schemaName}`,
                status: 'PASS',
                message: `Schema is properly configured as OpenApi3`,
                details: {
                    version: response.SchemaVersion,
                    lastModified: response.LastModified,
                },
            });
        } else {
            results.push({
                component: `Schema: ${schemaName}`,
                status: 'WARN',
                message: `Schema type is '${response.Type}', expected 'OpenApi3'`,
            });
        }
    } catch (error: any) {
        results.push({
            component: `Schema: ${schemaName}`,
            status: 'FAIL',
            message: `Failed to describe schema: ${error.message}`,
        });
    }
}

/**
 * Print verification results
 */
function printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log(`EventBridge Setup Verification - Environment: ${environment}`);
    console.log('='.repeat(80) + '\n');

    const passCount = results.filter(r => r.status === 'PASS').length;
    const warnCount = results.filter(r => r.status === 'WARN').length;
    const failCount = results.filter(r => r.status === 'FAIL').length;

    for (const result of results) {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌';
        console.log(`${icon} [${result.status}] ${result.component}`);
        console.log(`   ${result.message}`);

        if (result.details) {
            console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
        }

        console.log('');
    }

    console.log('='.repeat(80));
    console.log(`Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
    console.log('='.repeat(80) + '\n');

    if (failCount > 0) {
        console.error('❌ Verification failed. Please check the errors above.');
        process.exit(1);
    } else if (warnCount > 0) {
        console.warn('⚠️  Verification completed with warnings.');
        process.exit(0);
    } else {
        console.log('✅ All verifications passed!');
        process.exit(0);
    }
}

/**
 * Main verification function
 */
async function main(): Promise<void> {
    console.log(`\nVerifying EventBridge setup for environment: ${environment}\n`);

    try {
        await verifyEventBus();
        await verifyEventBridgeRules();
        await verifyEventArchive();
        await verifyDeadLetterQueue();
        await verifyEventSchemas();

        printResults();
    } catch (error: any) {
        console.error('❌ Verification failed with error:', error.message);
        process.exit(1);
    }
}

// Run the verification
main();
