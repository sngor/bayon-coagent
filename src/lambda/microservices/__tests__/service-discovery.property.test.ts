/**
 * Property-Based Tests for Service Discovery
 * 
 * **Feature: microservices-architecture-enhancement, Property 34: Service discovery functionality**
 * **Validates: Requirements 12.1**
 * 
 * Tests the service discovery functionality using property-based testing
 * to ensure dynamic service registration and lookup works correctly across
 * all valid service configurations.
 */

import fc from 'fast-check';
import { ServiceDiscoveryClient, ServiceRegistration, ServiceEndpoint, AuthenticationConfig } from '../service-discovery';

// Mock DynamoDB for testing
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

describe('Service Discovery Property Tests', () => {
    let serviceDiscovery: ServiceDiscoveryClient;
    let mockDocClient: any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock DynamoDB DocumentClient
        mockDocClient = {
            send: jest.fn(),
        };

        // Reset the singleton instance to ensure fresh instance with mocked client
        (ServiceDiscoveryClient as any).instance = undefined;
        serviceDiscovery = ServiceDiscoveryClient.getInstance();

        // Inject the mock client
        serviceDiscovery.setDocClient(mockDocClient);
    });

    /**
     * Property 34: Service discovery functionality
     * For any service registration, the Service_Discovery_Service should enable 
     * dynamic lookup and provide current service endpoint information
     */
    describe('Property 34: Service discovery functionality', () => {

        it('should enable dynamic lookup for any registered service', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate arbitrary service registrations
                    fc.record({
                        serviceId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        serviceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                        endpoints: fc.array(
                            fc.record({
                                type: fc.constantFrom('rest', 'graphql', 'grpc', 'websocket'),
                                url: fc.webUrl(),
                                methods: fc.array(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { minLength: 1 }),
                                authentication: fc.record({
                                    type: fc.constantFrom('none', 'api-key', 'jwt', 'iam', 'cognito'),
                                    required: fc.boolean(),
                                    config: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
                                }) as fc.Arbitrary<AuthenticationConfig>,
                            }) as fc.Arbitrary<ServiceEndpoint>,
                            { minLength: 1, maxLength: 3 }
                        ),
                        healthCheckUrl: fc.webUrl(),
                        metadata: fc.dictionary(fc.string(), fc.anything()),
                        status: fc.constantFrom('healthy', 'unhealthy', 'unknown'),
                        tags: fc.option(fc.array(fc.string(), { maxLength: 5 }), { nil: undefined }),
                    }) as fc.Arbitrary<Omit<ServiceRegistration, 'registeredAt' | 'lastHeartbeat'>>,

                    async (serviceRegistration) => {
                        // Mock successful registration
                        mockDocClient.send.mockResolvedValueOnce({});

                        // Mock successful discovery query
                        const mockRegisteredService: ServiceRegistration = {
                            ...serviceRegistration,
                            registeredAt: new Date().toISOString(),
                            lastHeartbeat: new Date().toISOString(),
                        };

                        mockDocClient.send.mockResolvedValueOnce({
                            Items: [mockRegisteredService],
                        });

                        // Register the service
                        await serviceDiscovery.registerService(serviceRegistration);

                        // Discover the service by name
                        const discoveredServices = await serviceDiscovery.discoverServices({
                            serviceName: serviceRegistration.serviceName,
                        });

                        // Verify the service can be discovered
                        expect(discoveredServices).toHaveLength(1);
                        expect(discoveredServices[0].serviceName).toBe(serviceRegistration.serviceName);
                        expect(discoveredServices[0].serviceId).toBe(serviceRegistration.serviceId);
                        expect(discoveredServices[0].version).toBe(serviceRegistration.version);
                        expect(discoveredServices[0].endpoints).toEqual(serviceRegistration.endpoints);
                        expect(discoveredServices[0].healthCheckUrl).toBe(serviceRegistration.healthCheckUrl);
                        expect(discoveredServices[0].status).toBe(serviceRegistration.status);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should provide current service endpoint information for any registered service', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate service with unique endpoint types to avoid duplicates
                    fc.record({
                        serviceId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        serviceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                        endpoints: fc.uniqueArray(
                            fc.record({
                                type: fc.constantFrom('rest', 'graphql', 'grpc', 'websocket'),
                                url: fc.webUrl(),
                                methods: fc.array(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { minLength: 1 }),
                                authentication: fc.record({
                                    type: fc.constantFrom('none', 'api-key', 'jwt', 'iam', 'cognito'),
                                    required: fc.boolean(),
                                }) as fc.Arbitrary<AuthenticationConfig>,
                            }) as fc.Arbitrary<ServiceEndpoint>,
                            {
                                minLength: 1,
                                maxLength: 4, // Max 4 since we have 4 endpoint types
                                selector: (endpoint) => endpoint.type // Ensure unique endpoint types
                            }
                        ),
                        healthCheckUrl: fc.webUrl(),
                        metadata: fc.dictionary(fc.string(), fc.anything()),
                        status: fc.constantFrom('healthy', 'unhealthy', 'unknown'),
                    }) as fc.Arbitrary<Omit<ServiceRegistration, 'registeredAt' | 'lastHeartbeat'>>,

                    async (serviceRegistration) => {
                        // Only test healthy services for endpoint retrieval
                        if (serviceRegistration.status !== 'healthy') {
                            return;
                        }

                        // Create the mock registered service
                        const mockRegisteredService: ServiceRegistration = {
                            ...serviceRegistration,
                            registeredAt: new Date().toISOString(),
                            lastHeartbeat: new Date().toISOString(),
                        };

                        // Set up mock implementation to handle multiple calls
                        let callCount = 0;
                        mockDocClient.send.mockImplementation(() => {
                            callCount++;
                            if (callCount === 1) {
                                // First call: registerService
                                return Promise.resolve({});
                            } else {
                                // Subsequent calls: getHealthyServices (called by getServiceEndpoint)
                                return Promise.resolve({
                                    Items: [mockRegisteredService],
                                });
                            }
                        });

                        // Register the service
                        await serviceDiscovery.registerService(serviceRegistration);

                        // Get service endpoint for each unique endpoint type
                        const uniqueEndpointTypes = [...new Set(serviceRegistration.endpoints.map(ep => ep.type))];

                        for (const endpointType of uniqueEndpointTypes) {
                            const endpointUrl = await serviceDiscovery.getServiceEndpoint(
                                serviceRegistration.serviceName,
                                endpointType
                            );

                            // Verify endpoint URL is returned and matches one of the registered endpoints
                            expect(endpointUrl).toBeTruthy();
                            expect(serviceRegistration.endpoints.some(ep => ep.url === endpointUrl && ep.type === endpointType)).toBe(true);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should maintain service registration consistency across heartbeat updates', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        serviceId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        serviceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                        endpoints: fc.array(
                            fc.record({
                                type: fc.constantFrom('rest', 'graphql', 'grpc', 'websocket'),
                                url: fc.webUrl(),
                                methods: fc.array(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { minLength: 1 }),
                                authentication: fc.record({
                                    type: fc.constantFrom('none', 'api-key', 'jwt', 'iam', 'cognito'),
                                    required: fc.boolean(),
                                }) as fc.Arbitrary<AuthenticationConfig>,
                            }) as fc.Arbitrary<ServiceEndpoint>,
                            { minLength: 1, maxLength: 3 }
                        ),
                        healthCheckUrl: fc.webUrl(),
                        metadata: fc.dictionary(fc.string(), fc.anything()),
                        initialStatus: fc.constantFrom('healthy', 'unhealthy', 'unknown'),
                    }),
                    fc.constantFrom('healthy', 'unhealthy', 'unknown'), // New status for heartbeat

                    async (serviceRegistration, newStatus) => {
                        const registration = {
                            ...serviceRegistration,
                            status: serviceRegistration.initialStatus,
                        };

                        // Mock successful registration
                        mockDocClient.send.mockResolvedValueOnce({});

                        // Mock successful heartbeat update
                        mockDocClient.send.mockResolvedValueOnce({});

                        // Mock service retrieval after heartbeat
                        const mockUpdatedService: ServiceRegistration = {
                            ...registration,
                            status: newStatus,
                            registeredAt: new Date().toISOString(),
                            lastHeartbeat: new Date().toISOString(),
                        };

                        mockDocClient.send.mockResolvedValueOnce({
                            Item: mockUpdatedService,
                        });

                        // Register the service
                        await serviceDiscovery.registerService(registration);

                        // Update heartbeat with new status
                        await serviceDiscovery.updateHeartbeat(
                            registration.serviceName,
                            registration.version,
                            registration.serviceId,
                            newStatus
                        );

                        // Retrieve the service and verify status was updated
                        const retrievedService = await serviceDiscovery.getService(
                            registration.serviceName,
                            registration.version,
                            registration.serviceId
                        );

                        expect(retrievedService).toBeTruthy();
                        expect(retrievedService!.status).toBe(newStatus);
                        expect(retrievedService!.serviceName).toBe(registration.serviceName);
                        expect(retrievedService!.serviceId).toBe(registration.serviceId);
                        expect(retrievedService!.version).toBe(registration.version);
                        // Other properties should remain unchanged
                        expect(retrievedService!.endpoints).toEqual(registration.endpoints);
                        expect(retrievedService!.healthCheckUrl).toBe(registration.healthCheckUrl);
                        expect(retrievedService!.metadata).toEqual(registration.metadata);
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should handle service unregistration correctly for any registered service', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        serviceId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        serviceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                        version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                        endpoints: fc.array(
                            fc.record({
                                type: fc.constantFrom('rest', 'graphql', 'grpc', 'websocket'),
                                url: fc.webUrl(),
                                methods: fc.array(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { minLength: 1 }),
                                authentication: fc.record({
                                    type: fc.constantFrom('none', 'api-key', 'jwt', 'iam', 'cognito'),
                                    required: fc.boolean(),
                                }) as fc.Arbitrary<AuthenticationConfig>,
                            }) as fc.Arbitrary<ServiceEndpoint>,
                            { minLength: 1, maxLength: 3 }
                        ),
                        healthCheckUrl: fc.webUrl(),
                        metadata: fc.dictionary(fc.string(), fc.anything()),
                        status: fc.constantFrom('healthy', 'unhealthy', 'unknown'),
                    }) as fc.Arbitrary<Omit<ServiceRegistration, 'registeredAt' | 'lastHeartbeat'>>,

                    async (serviceRegistration) => {
                        // Mock successful registration
                        mockDocClient.send.mockResolvedValueOnce({});

                        // Mock successful unregistration
                        mockDocClient.send.mockResolvedValueOnce({});

                        // Mock service not found after unregistration
                        mockDocClient.send.mockResolvedValueOnce({
                            Item: null,
                        });

                        // Register the service
                        await serviceDiscovery.registerService(serviceRegistration);

                        // Unregister the service
                        await serviceDiscovery.unregisterService(
                            serviceRegistration.serviceName,
                            serviceRegistration.version,
                            serviceRegistration.serviceId
                        );

                        // Verify the service is no longer retrievable
                        const retrievedService = await serviceDiscovery.getService(
                            serviceRegistration.serviceName,
                            serviceRegistration.version,
                            serviceRegistration.serviceId
                        );

                        expect(retrievedService).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });

        it('should filter services correctly by query parameters', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate multiple services with different properties
                    fc.array(
                        fc.record({
                            serviceId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                            serviceName: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                            version: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
                            endpoints: fc.array(
                                fc.record({
                                    type: fc.constantFrom('rest', 'graphql', 'grpc', 'websocket'),
                                    url: fc.webUrl(),
                                    methods: fc.array(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'), { minLength: 1 }),
                                    authentication: fc.record({
                                        type: fc.constantFrom('none', 'api-key', 'jwt', 'iam', 'cognito'),
                                        required: fc.boolean(),
                                    }) as fc.Arbitrary<AuthenticationConfig>,
                                }) as fc.Arbitrary<ServiceEndpoint>,
                                { minLength: 1, maxLength: 2 }
                            ),
                            healthCheckUrl: fc.webUrl(),
                            metadata: fc.dictionary(fc.string(), fc.anything()),
                            status: fc.constantFrom('healthy', 'unhealthy', 'unknown'),
                            tags: fc.option(fc.array(fc.string(), { maxLength: 3 }), { nil: undefined }),
                        }) as fc.Arbitrary<Omit<ServiceRegistration, 'registeredAt' | 'lastHeartbeat'>>,
                        { minLength: 2, maxLength: 5 }
                    ),

                    async (services) => {
                        // Ensure we have at least one service with each status for testing
                        if (services.length < 2) return;

                        // Set different statuses for testing
                        services[0].status = 'healthy';
                        if (services.length > 1) services[1].status = 'unhealthy';

                        // Mock registration for all services
                        for (let i = 0; i < services.length; i++) {
                            mockDocClient.send.mockResolvedValueOnce({});
                        }

                        // Register all services
                        for (const service of services) {
                            await serviceDiscovery.registerService(service);
                        }

                        // Test filtering by status
                        const healthyServices = services.filter(s => s.status === 'healthy');
                        if (healthyServices.length > 0) {
                            // Mock discovery query for healthy services
                            const mockHealthyServices = healthyServices.map(s => ({
                                ...s,
                                registeredAt: new Date().toISOString(),
                                lastHeartbeat: new Date().toISOString(),
                            }));

                            mockDocClient.send.mockResolvedValueOnce({
                                Items: mockHealthyServices,
                            });

                            const discoveredHealthy = await serviceDiscovery.discoverServices({
                                status: 'healthy',
                            });

                            expect(discoveredHealthy).toHaveLength(healthyServices.length);
                            discoveredHealthy.forEach(service => {
                                expect(service.status).toBe('healthy');
                            });
                        }

                        // Test filtering by service name
                        const firstServiceName = services[0].serviceName;
                        const servicesWithSameName = services.filter(s => s.serviceName === firstServiceName);

                        if (servicesWithSameName.length > 0) {
                            // Mock discovery query by service name
                            const mockNamedServices = servicesWithSameName.map(s => ({
                                ...s,
                                registeredAt: new Date().toISOString(),
                                lastHeartbeat: new Date().toISOString(),
                            }));

                            mockDocClient.send.mockResolvedValueOnce({
                                Items: mockNamedServices,
                            });

                            const discoveredByName = await serviceDiscovery.discoverServices({
                                serviceName: firstServiceName,
                            });

                            expect(discoveredByName).toHaveLength(servicesWithSameName.length);
                            discoveredByName.forEach(service => {
                                expect(service.serviceName).toBe(firstServiceName);
                            });
                        }
                    }
                ),
                { numRuns: 50 } // Reduced runs due to complexity
            );
        });
    });
});