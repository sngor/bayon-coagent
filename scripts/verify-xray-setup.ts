#!/usr/bin/env tsx

/**
 * X-Ray Setup Verification Script
 * 
 * This script verifies that AWS X-Ray is properly configured and working
 * across the microservices architecture.
 */

import { tracer, OPERATION_NAMES } from '../src/aws/xray/tracer';
import { traceDatabaseOperation, traceBedrockOperation } from '../src/aws/xray/utils';
import { addBusinessMetrics, addServiceDependency } from '../src/aws/xray/service-map';
import { getConfig } from '../src/aws/config';

interface VerificationResult {
    component: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    details?: any;
}

class XRayVerifier {
    private results: VerificationResult[] = [];

    /**
     * Run all verification checks
     */
    async verify(): Promise<void> {
        console.log('🔍 Verifying AWS X-Ray Setup...\n');

        await this.checkConfiguration();
        await this.checkTracerInitialization();
        await this.checkBasicTracing();
        await this.checkDatabaseTracing();
        await this.checkServiceMapAnnotations();
        await this.checkBusinessMetrics();
        await this.checkErrorHandling();

        this.printResults();
    }

    /**
     * Check X-Ray configuration
     */
    private async checkConfiguration(): Promise<void> {
        try {
            const config = getConfig();

            // Check environment variables
            const xrayEnabled = process.env.XRAY_TRACING_ENABLED !== 'false';
            const serviceName = process.env.XRAY_SERVICE_NAME || 'bayon-coagent';
            const samplingRate = parseFloat(process.env.XRAY_SAMPLING_RATE || '1.0');

            this.addResult({
                component: 'Configuration',
                status: xrayEnabled ? 'pass' : 'warning',
                message: xrayEnabled ? 'X-Ray tracing is enabled' : 'X-Ray tracing is disabled',
                details: {
                    enabled: xrayEnabled,
                    serviceName,
                    samplingRate,
                    environment: config.environment,
                    region: config.region,
                }
            });

            // Check AWS credentials
            if (config.environment !== 'local') {
                const hasCredentials = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_PROFILE;
                this.addResult({
                    component: 'AWS Credentials',
                    status: hasCredentials ? 'pass' : 'fail',
                    message: hasCredentials ? 'AWS credentials configured' : 'AWS credentials missing',
                });
            }

        } catch (error) {
            this.addResult({
                component: 'Configuration',
                status: 'fail',
                message: `Configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Check tracer initialization
     */
    private async checkTracerInitialization(): Promise<void> {
        try {
            const isEnabled = tracer.isEnabled();

            this.addResult({
                component: 'Tracer Initialization',
                status: isEnabled ? 'pass' : 'warning',
                message: isEnabled ? 'Tracer initialized successfully' : 'Tracer is disabled',
            });

        } catch (error) {
            this.addResult({
                component: 'Tracer Initialization',
                status: 'fail',
                message: `Tracer initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Check basic tracing functionality
     */
    private async checkBasicTracing(): Promise<void> {
        try {
            // Start a test trace
            const context = tracer.startTrace('verification-test', {
                serviceName: 'verification-service',
                operationName: 'basic-trace-test',
                requestId: 'verify-123',
                metadata: {
                    test: true,
                    timestamp: new Date().toISOString(),
                },
            });

            if (context) {
                // Add annotations and metadata
                tracer.addAnnotation('test.type', 'verification');
                tracer.addAnnotation('test.success', true);
                tracer.addMetadata('test.details', {
                    component: 'basic-tracing',
                    duration: 100,
                });

                // Get current context
                const currentContext = tracer.getCurrentTraceContext();

                this.addResult({
                    component: 'Basic Tracing',
                    status: 'pass',
                    message: 'Basic tracing functionality works',
                    details: {
                        traceId: (context as any)?.traceId,
                        correlationId: (context as any)?.correlationId,
                        contextRetrieved: !!currentContext,
                    }
                });

                // Close the trace
                tracer.closeSegment();
            } else {
                this.addResult({
                    component: 'Basic Tracing',
                    status: 'warning',
                    message: 'Tracing is disabled or not available',
                });
            }

        } catch (error) {
            this.addResult({
                component: 'Basic Tracing',
                status: 'fail',
                message: `Basic tracing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Check database operation tracing
     */
    private async checkDatabaseTracing(): Promise<void> {
        try {
            const result = await traceDatabaseOperation(
                'test-operation',
                'test-table',
                async () => {
                    // Simulate database operation
                    await new Promise(resolve => setTimeout(resolve, 50));
                    return { id: 'test-123', data: 'test-data' };
                },
                {
                    userId: 'test-user',
                    requestId: 'test-request',
                    metadata: {
                        test: true,
                    },
                }
            );

            this.addResult({
                component: 'Database Tracing',
                status: 'pass',
                message: 'Database operation tracing works',
                details: {
                    result: result,
                    traced: true,
                }
            });

        } catch (error) {
            this.addResult({
                component: 'Database Tracing',
                status: 'fail',
                message: `Database tracing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Check service map annotations
     */
    private async checkServiceMapAnnotations(): Promise<void> {
        try {
            // Test service dependency annotation
            addServiceDependency(
                'verification-service',
                'test-service',
                'sync',
                'test-operation',
                true,
                100
            );

            this.addResult({
                component: 'Service Map Annotations',
                status: 'pass',
                message: 'Service map annotations work',
            });

        } catch (error) {
            this.addResult({
                component: 'Service Map Annotations',
                status: 'fail',
                message: `Service map annotations failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Check business metrics
     */
    private async checkBusinessMetrics(): Promise<void> {
        try {
            addBusinessMetrics({
                testMetric: 1,
                verificationRun: 1,
                timestamp: Date.now(),
            });

            this.addResult({
                component: 'Business Metrics',
                status: 'pass',
                message: 'Business metrics tracking works',
            });

        } catch (error) {
            this.addResult({
                component: 'Business Metrics',
                status: 'fail',
                message: `Business metrics failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Check error handling
     */
    private async checkErrorHandling(): Promise<void> {
        try {
            const context = tracer.startTrace('error-test');

            try {
                // Simulate an error
                throw new Error('Test error for X-Ray verification');
            } catch (error) {
                tracer.addError(error as Error);

                this.addResult({
                    component: 'Error Handling',
                    status: 'pass',
                    message: 'Error handling and tracing works',
                });
            }

            tracer.closeSegment();

        } catch (error) {
            this.addResult({
                component: 'Error Handling',
                status: 'fail',
                message: `Error handling test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }

    /**
     * Add a verification result
     */
    private addResult(result: VerificationResult): void {
        this.results.push(result);
    }

    /**
     * Print verification results
     */
    private printResults(): void {
        console.log('\n📊 Verification Results:\n');

        const passed = this.results.filter(r => r.status === 'pass').length;
        const warnings = this.results.filter(r => r.status === 'warning').length;
        const failed = this.results.filter(r => r.status === 'fail').length;

        this.results.forEach(result => {
            const icon = result.status === 'pass' ? '✅' :
                result.status === 'warning' ? '⚠️' : '❌';

            console.log(`${icon} ${result.component}: ${result.message}`);

            if (result.details) {
                console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
            }
        });

        console.log('\n📈 Summary:');
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ⚠️  Warnings: ${warnings}`);
        console.log(`   ❌ Failed: ${failed}`);

        if (failed > 0) {
            console.log('\n❌ X-Ray setup has issues that need to be addressed.');
            process.exit(1);
        } else if (warnings > 0) {
            console.log('\n⚠️  X-Ray setup is working but has some warnings.');
        } else {
            console.log('\n✅ X-Ray setup is working perfectly!');
        }

        // Print helpful links
        console.log('\n🔗 Helpful Links:');
        console.log('   AWS X-Ray Console: https://console.aws.amazon.com/xray/');
        console.log('   Service Map: https://console.aws.amazon.com/xray/home#/service-map');
        console.log('   Trace Analytics: https://console.aws.amazon.com/xray/home#/analytics');

        const config = getConfig();
        if (config.region) {
            console.log(`   Region-specific Console: https://${config.region}.console.aws.amazon.com/xray/`);
        }
    }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    const verifier = new XRayVerifier();
    await verifier.verify();
}

// Run verification if this script is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    });
}

export { XRayVerifier };