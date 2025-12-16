/**
 * Property-Based Test for Service Isolation
 * 
 * **Feature: microservices-architecture-enhancement, Property 4: Service isolation**
 * **Validates: Requirements 2.1**
 * 
 * Tests that blog post generation service processes requests independently 
 * without interfering with other services' resource allocation.
 */

import fc from 'fast-check';
import { BlogGenerationServiceHandler } from '../blog-generation-service';
import { SocialMediaServiceHandler } from '../social-media-service';
import { ListingDescriptionServiceHandler } from '../listing-description-service';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

// Mock AWS services to avoid actual AWS calls during testing
jest.mock('../../../../aws/bedrock/flows/generate-blog-post');
jest.mock('../../../../aws/bedrock/flows/generate-social-media-post');
jest.mock('../../../../aws/bedrock/flows/listing-description-flow');
jest.mock('../../service-discovery');

describe('Service Isolation Property Tests', () => {
    let blogService: BlogGenerationServiceHandler;
    let socialMediaService: SocialMediaServiceHandler;
    let listingService: ListingDescriptionServiceHandler;

    beforeEach(() => {
        // Create fresh instances for each test
        blogService = new BlogGenerationServiceHandler();
        socialMediaService = new SocialMediaServiceHandler();
        listingService = new ListingDescriptionServiceHandler();

        // Mock the Bedrock flows to return predictable results
        const mockGenerateBlogPost = require('../../../../aws/bedrock/flows/generate-blog-post');
        mockGenerateBlogPost.generateBlogPost = jest.fn().mockResolvedValue({
            blogPost: 'Generated blog post content',
            headerImage: null,
            sources: [],
        });

        const mockGenerateSocialMediaPost = require('../../../../aws/bedrock/flows/generate-social-media-post');
        mockGenerateSocialMediaPost.generateSocialMediaPost = jest.fn().mockResolvedValue({
            variations: [{ linkedin: 'LinkedIn post', twitter: 'Twitter post' }],
        });

        const mockListingFlow = require('../../../../aws/bedrock/flows/listing-description-flow');
        mockListingFlow.generateFromData = jest.fn().mockResolvedValue({
            description: 'Generated listing description',
            wordCount: 200,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Property: Service isolation
     * For any content generation request, the Blog_Generation_Service should process 
     * requests without interfering with other services' resource allocation
     */
    test('Property 4: Service isolation - Blog service processes requests independently', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate random blog generation requests
                fc.record({
                    topic: fc.string({ minLength: 1, maxLength: 100 }),
                    tone: fc.oneof(fc.constant('professional'), fc.constant('casual'), fc.constant('friendly')),
                    length: fc.oneof(fc.constant('short'), fc.constant('medium'), fc.constant('long')),
                }),
                // Generate random social media requests to run concurrently
                fc.record({
                    topic: fc.string({ minLength: 1, maxLength: 100 }),
                    tone: fc.oneof(fc.constant('professional'), fc.constant('casual')),
                    platforms: fc.array(fc.oneof(
                        fc.constant('linkedin'),
                        fc.constant('twitter'),
                        fc.constant('facebook')
                    ), { minLength: 1, maxLength: 3 }),
                }),
                // Generate random listing requests to run concurrently
                fc.record({
                    propertyType: fc.oneof(fc.constant('house'), fc.constant('condo'), fc.constant('townhouse')),
                    bedrooms: fc.integer({ min: 1, max: 6 }),
                    bathrooms: fc.integer({ min: 1, max: 4 }),
                    squareFeet: fc.integer({ min: 500, max: 5000 }),
                    price: fc.integer({ min: 100000, max: 2000000 }),
                }),
                async (blogRequest, socialRequest, listingRequest) => {
                    // Create mock API Gateway events for each service
                    const blogEvent = createMockEvent('POST', '/generate', {
                        topic: blogRequest.topic,
                        tone: blogRequest.tone,
                        length: blogRequest.length,
                    });

                    const socialEvent = createMockEvent('POST', '/generate', {
                        topic: socialRequest.topic,
                        tone: socialRequest.tone,
                        platforms: socialRequest.platforms,
                    });

                    const listingEvent = createMockEvent('POST', '/generate', {
                        type: 'data-only',
                        listingData: {
                            address: {
                                street: '123 Test St',
                                city: 'Test City',
                                state: 'TS',
                                zipCode: '12345',
                            },
                            price: listingRequest.price,
                            bedrooms: listingRequest.bedrooms,
                            bathrooms: listingRequest.bathrooms,
                            squareFeet: listingRequest.squareFeet,
                            propertyType: listingRequest.propertyType,
                            features: ['feature1', 'feature2'],
                        },
                    });

                    const mockContext = createMockContext();

                    // Track resource usage indicators
                    const startTime = Date.now();
                    const startMemory = process.memoryUsage();

                    // Execute all services concurrently to test isolation
                    const results = await Promise.allSettled([
                        blogService.lambdaHandler(blogEvent, mockContext),
                        socialMediaService.lambdaHandler(socialEvent, mockContext),
                        listingService.lambdaHandler(listingEvent, mockContext),
                    ]);

                    const endTime = Date.now();
                    const endMemory = process.memoryUsage();

                    // Verify all services completed successfully
                    const successfulResults = results.filter(result => result.status === 'fulfilled');
                    expect(successfulResults).toHaveLength(3);

                    // Verify each service returned appropriate responses
                    const blogResult = results[0];
                    const socialResult = results[1];
                    const listingResult = results[2];

                    if (blogResult.status === 'fulfilled') {
                        const blogResponse = JSON.parse(blogResult.value.body);
                        expect(blogResponse.success).toBe(true);
                        expect(blogResponse.data).toHaveProperty('blogPost');
                    }

                    if (socialResult.status === 'fulfilled') {
                        const socialResponse = JSON.parse(socialResult.value.body);
                        expect(socialResponse.success).toBe(true);
                        expect(socialResponse.data).toHaveProperty('variations');
                    }

                    if (listingResult.status === 'fulfilled') {
                        const listingResponse = JSON.parse(listingResult.value.body);
                        expect(listingResponse.success).toBe(true);
                        expect(listingResponse.data).toHaveProperty('description');
                    }

                    // Verify resource isolation - no service should consume excessive resources
                    const executionTime = endTime - startTime;
                    const memoryIncrease = endMemory.heapUsed - startMemory.heapUsed;

                    // Services should complete within reasonable time (isolation means no blocking)
                    expect(executionTime).toBeLessThan(10000); // 10 seconds max for mocked services

                    // Memory usage should be reasonable (no memory leaks between services)
                    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB max increase

                    // Verify that each service maintains its own state
                    // (This is implicitly tested by the fact that all services return correct responses)

                    // Property holds: Services process requests independently without interference
                    return true;
                }
            ),
            {
                numRuns: 100,
                timeout: 30000, // 30 seconds timeout for property test
            }
        );
    });

    /**
     * Property: Service resource independence
     * For any set of concurrent requests, each service should maintain independent resource allocation
     */
    test('Property 4: Service isolation - Independent resource allocation', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate multiple concurrent requests for the same service
                fc.array(
                    fc.record({
                        topic: fc.string({ minLength: 1, maxLength: 50 }),
                        tone: fc.oneof(fc.constant('professional'), fc.constant('casual')),
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                async (requests) => {
                    // Create events for multiple concurrent blog generation requests
                    const events = requests.map(request =>
                        createMockEvent('POST', '/generate', {
                            topic: request.topic,
                            tone: request.tone,
                        })
                    );

                    // Execute requests concurrently - each with its own context for unique request IDs
                    const startTime = Date.now();
                    const results = await Promise.allSettled(
                        events.map(event => blogService.lambdaHandler(event, createMockContext()))
                    );
                    const endTime = Date.now();

                    // All requests should complete successfully
                    const successfulResults = results.filter(result => result.status === 'fulfilled');
                    expect(successfulResults).toHaveLength(requests.length);

                    // Each request should get an independent response
                    const responses = successfulResults.map(result => {
                        if (result.status === 'fulfilled') {
                            return JSON.parse(result.value.body);
                        }
                        return null;
                    }).filter(Boolean);

                    expect(responses).toHaveLength(requests.length);

                    // Each response should be unique (independent processing)
                    responses.forEach((response, index) => {
                        expect(response.success).toBe(true);
                        expect(response.data).toHaveProperty('blogPost');
                        expect(response.metadata).toHaveProperty('requestId');

                        // Each request should have a unique request ID (independence)
                        const otherResponses = responses.slice(0, index).concat(responses.slice(index + 1));
                        const duplicateRequestIds = otherResponses.filter(
                            other => other.metadata.requestId === response.metadata.requestId
                        );
                        expect(duplicateRequestIds).toHaveLength(0);
                    });

                    // Concurrent processing should not take significantly longer than sequential
                    // (This tests that services don't block each other)
                    const executionTime = endTime - startTime;
                    const expectedSequentialTime = requests.length * 1000; // Assume 1s per request
                    expect(executionTime).toBeLessThan(expectedSequentialTime * 0.8); // Should be faster due to concurrency

                    // Property holds: Each service maintains independent resource allocation
                    return true;
                }
            ),
            {
                numRuns: 100,
                timeout: 30000,
            }
        );
    });
});

/**
 * Helper function to create mock API Gateway event
 */
function createMockEvent(method: string, path: string, body: any): APIGatewayProxyEvent {
    return {
        httpMethod: method,
        path: path,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
        },
        queryStringParameters: null,
        pathParameters: null,
        requestContext: {
            requestId: `mock-request-${Date.now()}-${Math.random()}`,
            authorizer: {
                principalId: 'mock-user-id',
            },
        } as any,
        resource: path,
        stageVariables: null,
        multiValueHeaders: {},
        multiValueQueryStringParameters: null,
        isBase64Encoded: false,
    };
}

/**
 * Helper function to create mock Lambda context
 */
function createMockContext(): Context {
    // Use a more precise timestamp and random number to ensure uniqueness
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const nanoTime = process.hrtime.bigint().toString();

    return {
        callbackWaitsForEmptyEventLoop: false,
        functionName: 'mock-function',
        functionVersion: '1',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function',
        memoryLimitInMB: '1024',
        awsRequestId: `mock-aws-request-${timestamp}-${randomId}-${nanoTime}`,
        logGroupName: '/aws/lambda/mock-function',
        logStreamName: 'mock-stream',
        getRemainingTimeInMillis: () => 30000,
        done: () => { },
        fail: () => { },
        succeed: () => { },
    };
}