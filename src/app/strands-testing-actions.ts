'use server';

/**
 * Enhanced Integration Testing Actions using Strands-Inspired Framework
 * 
 * These actions provide comprehensive testing, validation, and integration
 * capabilities for all Strands-inspired AI services and workflows.
 */

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';
import {
    executeIntegrationTest,
    testAllServices,
    testServicePerformance,
    validateServiceOutput,
    TestDataGenerator,
    type TestConfiguration,
    type TestResult,
    TestTypeSchema,
    ServiceTypeSchema
} from '@/services/strands/integration-testing-service';

// Test execution schema
const testExecutionSchema = z.object({
    testType: TestTypeSchema,
    serviceType: ServiceTypeSchema,
    testName: z.string().min(1, 'Test name is required'),
    description: z.string().optional(),
    validateOutput: z.boolean().default(true),
    measurePerformance: z.boolean().default(true),
    saveResults: z.boolean().default(true),
    maxExecutionTime: z.number().default(300),
    minQualityScore: z.number().min(0).max(100).default(70),
});

// Service performance test schema
const performanceTestSchema = z.object({
    serviceType: ServiceTypeSchema,
    testInputs: z.record(z.any()),
    maxExecutionTime: z.number().default(60),
    minQualityScore: z.number().min(0).max(100).default(80),
});

// Service validation test schema
const validationTestSchema = z.object({
    serviceType: ServiceTypeSchema,
    testInputs: z.record(z.any()),
    expectedOutputs: z.record(z.any()).optional(),
    minQualityScore: z.number().min(0).max(100).default(90),
});

/**
 * Execute Complete Service Integration Test
 * Tests all Strands-inspired services for functionality and integration
 */
export async function executeCompleteIntegrationTestAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: TestResult | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute integration tests' },
            data: null,
        };
    }

    try {
        console.log('🧪 Starting complete service integration test...');

        const result = await testAllServices(user.id);

        if (result.success) {
            console.log('✅ Complete integration test completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Integration test failed');
        }

    } catch (error) {
        console.error('❌ Complete integration test failed:', error);
        return {
            message: `Integration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { testing: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Execute Service Performance Test
 * Tests individual service performance with specific inputs
 */
export async function executeServicePerformanceTestAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: TestResult | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute performance tests' },
            data: null,
        };
    }

    try {
        // Parse test inputs from form data
        const testInputsData = formData.get('testInputs');
        let testInputs: any = {};

        if (typeof testInputsData === 'string') {
            try {
                testInputs = JSON.parse(testInputsData);
            } catch (error) {
                return {
                    message: 'Invalid test inputs format',
                    errors: { testInputs: ['Test inputs must be valid JSON'] },
                    data: null,
                };
            }
        }

        // Validate input
        const validatedFields = performanceTestSchema.safeParse({
            serviceType: formData.get('serviceType'),
            testInputs,
            maxExecutionTime: parseInt(formData.get('maxExecutionTime') as string) || 60,
            minQualityScore: parseInt(formData.get('minQualityScore') as string) || 80,
        });

        if (!validatedFields.success) {
            const fieldErrors = validatedFields.error.flatten().fieldErrors;
            return {
                message: fieldErrors.serviceType?.[0] || 'Validation failed',
                errors: fieldErrors,
                data: null,
            };
        }

        console.log(`🚀 Starting performance test for ${validatedFields.data.serviceType}...`);

        // Add userId to test inputs
        testInputs.userId = user.id;

        const result = await testServicePerformance(
            validatedFields.data.serviceType,
            user.id,
            testInputs
        );

        if (result.success) {
            console.log('✅ Service performance test completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Performance test failed');
        }

    } catch (error) {
        console.error('❌ Service performance test failed:', error);
        return {
            message: `Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { testing: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Execute Service Validation Test
 * Validates service output quality and correctness
 */
export async function executeServiceValidationTestAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: TestResult | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute validation tests' },
            data: null,
        };
    }

    try {
        // Parse test inputs and expected outputs from form data
        const testInputsData = formData.get('testInputs');
        const expectedOutputsData = formData.get('expectedOutputs');

        let testInputs: any = {};
        let expectedOutputs: any = undefined;

        if (typeof testInputsData === 'string') {
            try {
                testInputs = JSON.parse(testInputsData);
            } catch (error) {
                return {
                    message: 'Invalid test inputs format',
                    errors: { testInputs: ['Test inputs must be valid JSON'] },
                    data: null,
                };
            }
        }

        if (typeof expectedOutputsData === 'string' && expectedOutputsData.trim()) {
            try {
                expectedOutputs = JSON.parse(expectedOutputsData);
            } catch (error) {
                return {
                    message: 'Invalid expected outputs format',
                    errors: { expectedOutputs: ['Expected outputs must be valid JSON'] },
                    data: null,
                };
            }
        }

        // Validate input
        const validatedFields = validationTestSchema.safeParse({
            serviceType: formData.get('serviceType'),
            testInputs,
            expectedOutputs,
            minQualityScore: parseInt(formData.get('minQualityScore') as string) || 90,
        });

        if (!validatedFields.success) {
            const fieldErrors = validatedFields.error.flatten().fieldErrors;
            return {
                message: fieldErrors.serviceType?.[0] || 'Validation failed',
                errors: fieldErrors,
                data: null,
            };
        }

        console.log(`🔍 Starting validation test for ${validatedFields.data.serviceType}...`);

        // Add userId to test inputs
        testInputs.userId = user.id;

        const result = await validateServiceOutput(
            validatedFields.data.serviceType,
            user.id,
            testInputs,
            validatedFields.data.expectedOutputs
        );

        if (result.success) {
            console.log('✅ Service validation test completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Validation test failed');
        }

    } catch (error) {
        console.error('❌ Service validation test failed:', error);
        return {
            message: `Validation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { testing: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Execute Custom Integration Test
 * Allows custom test configuration and execution
 */
export async function executeCustomIntegrationTestAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: TestResult | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute custom tests' },
            data: null,
        };
    }

    try {
        // Parse test inputs from form data
        const testInputsData = formData.get('testInputs');
        let testInputs: any = {};

        if (typeof testInputsData === 'string') {
            try {
                testInputs = JSON.parse(testInputsData);
            } catch (error) {
                return {
                    message: 'Invalid test inputs format',
                    errors: { testInputs: ['Test inputs must be valid JSON'] },
                    data: null,
                };
            }
        }

        // Validate input
        const validatedFields = testExecutionSchema.safeParse({
            testType: formData.get('testType'),
            serviceType: formData.get('serviceType'),
            testName: formData.get('testName'),
            description: formData.get('description') || undefined,
            validateOutput: formData.get('validateOutput') !== 'false',
            measurePerformance: formData.get('measurePerformance') !== 'false',
            saveResults: formData.get('saveResults') !== 'false',
            maxExecutionTime: parseInt(formData.get('maxExecutionTime') as string) || 300,
            minQualityScore: parseInt(formData.get('minQualityScore') as string) || 70,
        });

        if (!validatedFields.success) {
            const fieldErrors = validatedFields.error.flatten().fieldErrors;
            return {
                message: fieldErrors.testType?.[0] || fieldErrors.serviceType?.[0] || fieldErrors.testName?.[0] || 'Validation failed',
                errors: fieldErrors,
                data: null,
            };
        }

        console.log(`🧪 Starting custom test: ${validatedFields.data.testName}...`);

        // Add userId to test inputs
        testInputs.userId = user.id;

        // Build test configuration
        const testConfig: TestConfiguration = {
            testType: validatedFields.data.testType,
            serviceType: validatedFields.data.serviceType,
            userId: user.id,
            testName: validatedFields.data.testName,
            description: validatedFields.data.description,
            testInputs,
            validateOutput: validatedFields.data.validateOutput,
            measurePerformance: validatedFields.data.measurePerformance,
            saveResults: validatedFields.data.saveResults,
            maxExecutionTime: validatedFields.data.maxExecutionTime,
            minQualityScore: validatedFields.data.minQualityScore,
        };

        const result = await executeIntegrationTest(testConfig);

        if (result.success) {
            console.log('✅ Custom integration test completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Custom test failed');
        }

    } catch (error) {
        console.error('❌ Custom integration test failed:', error);
        return {
            message: `Custom test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { testing: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Generate Test Data Action
 * Generates realistic test data for different services
 */
export async function generateTestDataAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: any | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to generate test data' },
            data: null,
        };
    }

    const serviceType = formData.get('serviceType') as string;
    const testType = formData.get('testType') as string || 'basic';

    if (!serviceType) {
        return {
            message: 'Service type is required',
            errors: { serviceType: ['Service type is required'] },
            data: null,
        };
    }

    try {
        console.log(`📊 Generating test data for ${serviceType}...`);

        let testData: any = {};

        switch (serviceType) {
            case 'research-agent':
                testData = TestDataGenerator.generateResearchTestData();
                break;

            case 'content-studio':
                testData = TestDataGenerator.generateContentStudioTestData();
                break;

            case 'listing-description':
                testData = TestDataGenerator.generateListingTestData();
                break;

            case 'market-intelligence':
                testData = TestDataGenerator.generateMarketIntelligenceTestData();
                break;

            case 'agent-orchestration':
                testData = TestDataGenerator.generateWorkflowTestData();
                break;

            case 'all-services':
                testData = {
                    research: TestDataGenerator.generateResearchTestData(),
                    content: TestDataGenerator.generateContentStudioTestData(),
                    listing: TestDataGenerator.generateListingTestData(),
                    market: TestDataGenerator.generateMarketIntelligenceTestData(),
                    workflow: TestDataGenerator.generateWorkflowTestData(),
                };
                break;

            default:
                return {
                    message: `Unknown service type: ${serviceType}`,
                    errors: { serviceType: [`Unknown service type: ${serviceType}`] },
                    data: null,
                };
        }

        // Update userId in all test data
        const updateUserId = (obj: any) => {
            if (typeof obj === 'object' && obj !== null) {
                if (obj.userId !== undefined) {
                    obj.userId = user.id;
                }
                Object.values(obj).forEach(value => {
                    if (typeof value === 'object' && value !== null) {
                        updateUserId(value);
                    }
                });
            }
        };

        updateUserId(testData);

        console.log('✅ Test data generated successfully');

        return {
            message: 'success',
            data: {
                serviceType,
                testType,
                testData,
                userId: user.id,
                generatedAt: new Date().toISOString(),
            },
            errors: {},
        };

    } catch (error) {
        console.error('❌ Test data generation failed:', error);
        return {
            message: `Test data generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { generation: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Get Test Results Action
 * Retrieves test results for the current user
 */
export async function getTestResultsAction(): Promise<{
    message: string;
    data: any[] | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to view test results' },
            data: null,
        };
    }

    try {
        const { getRepository } = await import('@/aws/dynamodb/repository');
        const repository = getRepository();

        // Query for all test results for this user
        const result = await repository.query(`USER#${user.id}`, 'TEST#', {
            limit: 50,
            scanIndexForward: false, // Most recent first
        });

        const testResults = result.items.map((item: any) => ({
            id: item.id,
            testType: item.testType,
            serviceType: item.serviceType,
            testName: item.testName,
            description: item.description,
            status: item.status,
            executionTime: item.executionTime,
            qualityScore: item.qualityScore,
            createdAt: item.createdAt,
            performanceMetrics: item.performanceMetrics,
        }));

        return {
            message: 'success',
            data: testResults,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Failed to get test results:', error);
        return {
            message: `Failed to get test results: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { retrieval: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Get Test Result Details Action
 * Retrieves detailed information for a specific test result
 */
export async function getTestResultDetailsAction(
    testId: string
): Promise<{
    message: string;
    data: any | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to view test details' },
            data: null,
        };
    }

    if (!testId) {
        return {
            message: 'Test ID is required',
            errors: { testId: ['Test ID is required'] },
            data: null,
        };
    }

    try {
        const { getRepository } = await import('@/aws/dynamodb/repository');
        const repository = getRepository();

        // Get the specific test result
        const result = await repository.get(`USER#${user.id}`, `TEST#${testId}`);

        if (!result) {
            return {
                message: 'Test result not found',
                errors: { test: ['Test result not found'] },
                data: null,
            };
        }

        return {
            message: 'success',
            data: result,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Failed to get test result details:', error);
        return {
            message: `Failed to get test details: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { retrieval: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}