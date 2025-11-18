# Implementation Plan

- [ ] 1. Set up core infrastructure and shared components

  - Create API Gateway with REST API configuration
  - Set up EventBridge custom event bus for microservices
  - Create KMS key for OAuth token encryption
  - Set up ElastiCache Redis cluster for search caching
  - Configure CloudWatch log groups for all services
  - Set up AWS X-Ray tracing configuration
  - Create shared Lambda layer with common dependencies (AWS SDK, Zod, etc.)
  - _Requirements: 7.1, 7.2, 9.1, 9.2_

- [ ]\* 1.1 Write property test for API Gateway routing

  - **Property 19: API Gateway routing**
  - **Validates: Requirements 7.2**

- [ ]\* 1.2 Write property test for JWT validation

  - **Property 20: JWT validation at gateway**
  - **Validates: Requirements 7.3**

- [ ] 2. Implement OAuth Service
- [ ] 2.1 Create OAuth Service Lambda functions

  - Implement token exchange endpoint (POST /oauth/exchange)
  - Implement token retrieval endpoint (GET /oauth/tokens/{userId}/{provider})
  - Implement token refresh endpoint (POST /oauth/refresh)
  - Implement token deletion endpoint (DELETE /oauth/tokens/{userId}/{provider})
  - Add KMS encryption/decryption for tokens
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]\* 2.2 Write property test for token exchange

  - **Property 8: Token exchange for valid codes**
  - **Validates: Requirements 4.1**

- [ ]\* 2.3 Write property test for token encryption

  - **Property 9: Token encryption at rest**
  - **Validates: Requirements 4.2**

- [ ]\* 2.4 Write property test for automatic token refresh

  - **Property 10: Automatic token refresh**
  - **Validates: Requirements 4.3**

- [ ]\* 2.5 Write property test for consistent token state

  - **Property 11: Consistent token state**
  - **Validates: Requirements 4.5**

- [ ] 2.6 Deploy OAuth Service infrastructure

  - Create Lambda functions with CDK/SAM
  - Configure API Gateway routes for OAuth endpoints
  - Set up IAM roles with DynamoDB and KMS permissions
  - Configure environment variables
  - _Requirements: 7.1, 7.5_

- [ ]\* 2.7 Write integration tests for OAuth Service

  - Test token exchange flow end-to-end
  - Test token refresh with expired tokens
  - Test concurrent token access
  - Test error handling for invalid codes
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 2.8 Update Next.js to call OAuth Service

  - Refactor oauth-actions.ts to call OAuth Service API
  - Add feature flag for OAuth Service routing
  - Implement fallback to direct OAuth calls
  - Update error handling for service calls
  - _Requirements: 5.1, 5.3_

- [ ]\* 2.9 Write property test for OAuth orchestration

  - **Property 12: Service orchestration**
  - **Validates: Requirements 5.1**

- [ ] 3. Checkpoint - OAuth Service validation

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Search Service
- [ ] 4.1 Create Search Service Lambda functions

  - Implement web search endpoint (POST /search/web)
  - Implement news search endpoint (POST /search/news)
  - Add Redis caching layer with TTL
  - Implement cache key generation and invalidation
  - Add Tavily API client with error handling
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]\* 4.2 Write property test for Tavily API invocation

  - **Property 5: Tavily API invocation**
  - **Validates: Requirements 3.1**

- [ ]\* 4.3 Write property test for consistent result schema

  - **Property 6: Consistent result schema**
  - **Validates: Requirements 3.2**

- [ ]\* 4.4 Write property test for cache utilization

  - **Property 7: Cache utilization for repeated queries**
  - **Validates: Requirements 3.4**

- [ ] 4.5 Deploy Search Service infrastructure

  - Create Lambda functions with CDK/SAM
  - Configure API Gateway routes for Search endpoints
  - Set up IAM roles with ElastiCache permissions
  - Configure Redis connection and environment variables
  - _Requirements: 7.1, 7.5_

- [ ]\* 4.6 Write integration tests for Search Service

  - Test web search with caching
  - Test news search with location filtering
  - Test cache hit/miss behavior
  - Test graceful degradation when Tavily unavailable
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [ ] 4.7 Update AI flows to call Search Service

  - Refactor run-research-agent.ts to call Search Service
  - Refactor run-nap-audit.ts to call Search Service
  - Refactor get-real-estate-news.ts to call Search Service
  - Add feature flag for Search Service routing
  - Implement fallback to direct Tavily calls
  - _Requirements: 5.1, 5.3_

- [ ] 5. Checkpoint - Search Service validation

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement AI Content Generation Service
- [ ] 6.1 Create AI Service Lambda functions for agent operations

  - Implement generate-agent-bio endpoint
  - Implement find-competitors endpoint
  - Implement enrich-competitor-data endpoint
  - Add Zod schema validation for all inputs/outputs
  - _Requirements: 2.1, 2.2_

- [ ]\* 6.2 Write property test for Bedrock invocation

  - **Property 1: Bedrock invocation for valid requests**
  - **Validates: Requirements 2.1**

- [ ]\* 6.3 Write property test for schema-conformant responses

  - **Property 2: Schema-conformant responses**
  - **Validates: Requirements 2.2**

- [ ] 6.4 Create AI Service Lambda functions for content generation

  - Implement generate-blog-post endpoint
  - Implement generate-social-media-post endpoint
  - Implement generate-video-script endpoint
  - Implement generate-market-update endpoint
  - Implement generate-neighborhood-guide endpoint
  - _Requirements: 2.1, 2.2_

- [ ] 6.5 Create AI Service Lambda functions for analysis

  - Implement run-research-agent endpoint
  - Implement run-nap-audit endpoint
  - Implement analyze-review-sentiment endpoint
  - Implement analyze-multiple-reviews endpoint
  - Implement generate-marketing-plan endpoint
  - _Requirements: 2.1, 2.2_

- [ ] 6.6 Add retry logic and error handling to AI Service

  - Implement exponential backoff for throttling errors
  - Add circuit breaker for Bedrock calls
  - Implement graceful error responses
  - Add request timeout handling
  - _Requirements: 2.3_

- [ ]\* 6.7 Write property test for concurrent request handling

  - **Property 3: Concurrent request handling**
  - **Validates: Requirements 2.4**

- [ ] 6.8 Add EventBridge event publication

  - Implement event publisher utility
  - Add completion events for all AI operations
  - Include metadata (duration, tokens used, content type)
  - _Requirements: 2.5, 6.5_

- [ ]\* 6.9 Write property test for event publication

  - **Property 4: Event publication on completion**
  - **Validates: Requirements 2.5**

- [ ]\* 6.10 Write property test for asynchronous event publication

  - **Property 18: Asynchronous event publication**
  - **Validates: Requirements 6.5**

- [ ] 6.11 Deploy AI Service infrastructure

  - Create Lambda functions with CDK/SAM (1024MB memory, 300s timeout)
  - Configure API Gateway routes for all AI endpoints
  - Set up IAM roles with Bedrock and EventBridge permissions
  - Configure reserved concurrency (10) to prevent runaway costs
  - Set up environment variables (model ID, region, etc.)
  - _Requirements: 7.1, 7.5_

- [ ]\* 6.12 Write integration tests for AI Service

  - Test all content generation endpoints
  - Test retry logic with simulated throttling
  - Test event publication to EventBridge
  - Test Search Service integration
  - Test error handling and fallbacks
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 7. Update Next.js server actions to call AI Service
- [ ] 7.1 Refactor server actions for agent operations

  - Update generateBioAction to call AI Service
  - Update findCompetitorsAction to call AI Service
  - Update enrichCompetitorAction to call AI Service
  - Add feature flag for AI Service routing
  - Implement fallback to direct Bedrock calls
  - _Requirements: 5.1, 5.3_

- [ ] 7.2 Refactor server actions for content generation

  - Update generateBlogPostAction to call AI Service
  - Update generateSocialPostAction to call AI Service
  - Update generateVideoScriptAction to call AI Service
  - Update generateMarketUpdateAction to call AI Service
  - Update generateGuideAction to call AI Service
  - _Requirements: 5.1, 5.3_

- [ ] 7.3 Refactor server actions for analysis operations

  - Update runResearchAgentAction to call AI Service
  - Update runNapAuditAction to call AI Service
  - Update analyzeReviewSentimentAction to call AI Service
  - Update analyzeMultipleReviewsAction to call AI Service
  - Update generateMarketingPlanAction to call AI Service
  - _Requirements: 5.1, 5.3_

- [ ]\* 7.4 Write property test for error handling with fallbacks

  - **Property 13: Error handling with fallbacks**
  - **Validates: Requirements 5.3**

- [ ]\* 7.5 Write property test for data aggregation

  - **Property 14: Data aggregation**
  - **Validates: Requirements 5.4**

- [ ]\* 7.6 Write property test for authentication enforcement

  - **Property 15: Authentication enforcement**
  - **Validates: Requirements 5.5**

- [ ] 8. Checkpoint - AI Service validation

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement API contract validation and observability
- [ ] 9.1 Add request validation to all services

  - Implement Zod schema validation middleware
  - Add validation error responses with details
  - Test with invalid payloads
  - _Requirements: 6.2_

- [ ]\* 9.2 Write property test for request validation

  - **Property 16: Request validation**
  - **Validates: Requirements 6.2**

- [ ] 9.3 Add HTTP status code handling

  - Implement consistent status code mapping
  - Add error response formatting
  - Test all error scenarios
  - _Requirements: 6.3_

- [ ]\* 9.4 Write property test for HTTP status code correctness

  - **Property 17: HTTP status code correctness**
  - **Validates: Requirements 6.3**

- [ ] 9.5 Implement structured logging

  - Add correlation ID generation and propagation
  - Implement structured log formatting
  - Add CloudWatch log emission
  - Include request/response metadata
  - _Requirements: 9.1_

- [ ]\* 9.6 Write property test for structured logging

  - **Property 23: Structured logging with correlation IDs**
  - **Validates: Requirements 9.1**

- [ ] 9.7 Implement distributed tracing

  - Add X-Ray SDK to all Lambda functions
  - Implement trace context propagation
  - Add custom segments for external calls
  - Test trace visualization in X-Ray console
  - _Requirements: 9.2, 9.5_

- [ ]\* 9.8 Write property test for trace context propagation

  - **Property 24: Trace context propagation**
  - **Validates: Requirements 9.2**

- [ ]\* 9.9 Write property test for service call tracing

  - **Property 26: Service call tracing**
  - **Validates: Requirements 9.5**

- [ ] 9.10 Implement metrics emission

  - Add CloudWatch metrics for request count, errors, latency
  - Implement custom metrics for business events
  - Add metric dimensions (service, endpoint, status)
  - _Requirements: 9.3_

- [ ]\* 9.11 Write property test for error metrics emission

  - **Property 25: Error metrics emission**
  - **Validates: Requirements 9.3**

- [ ] 10. Implement data ownership and isolation
- [ ] 10.1 Add data ownership enforcement

  - Implement middleware to check service ownership
  - Add write access validation
  - Test cross-service write attempts
  - _Requirements: 8.1_

- [ ]\* 10.2 Write property test for data ownership enforcement

  - **Property 21: Data ownership enforcement**
  - **Validates: Requirements 8.1**

- [ ] 10.3 Implement event-driven data sharing

  - Add event publishers for data changes
  - Implement event consumers in dependent services
  - Test eventual consistency scenarios
  - _Requirements: 8.4_

- [ ]\* 10.4 Write property test for event-driven data sharing

  - **Property 22: Event-driven data sharing**
  - **Validates: Requirements 8.4**

- [ ] 11. Set up monitoring and alerting
- [ ] 11.1 Create CloudWatch dashboards

  - Create dashboard for AI Service metrics
  - Create dashboard for Search Service metrics
  - Create dashboard for OAuth Service metrics
  - Create dashboard for API Gateway metrics
  - Add widgets for latency, errors, throughput
  - _Requirements: 9.4_

- [ ] 11.2 Configure CloudWatch alarms

  - Set up error rate alarms (> 5% for 5 minutes)
  - Set up latency alarms (p99 > 5 seconds)
  - Set up Lambda throttling alarms
  - Set up DynamoDB throttling alarms
  - Configure SNS topics for alarm notifications
  - _Requirements: 9.3_

- [ ] 11.3 Create runbooks for common issues

  - Document OAuth Service troubleshooting
  - Document Search Service troubleshooting
  - Document AI Service troubleshooting
  - Document rollback procedures
  - _Requirements: 12.3_

- [ ] 12. Update LocalStack configuration for local development
- [ ] 12.1 Update docker-compose for microservices

  - Add LocalStack Lambda configuration
  - Add LocalStack API Gateway configuration
  - Add LocalStack EventBridge configuration
  - Add Redis container for search caching
  - _Requirements: 10.1, 10.2_

- [ ] 12.2 Create local deployment scripts

  - Script to deploy Lambda functions to LocalStack
  - Script to configure API Gateway routes
  - Script to seed test data
  - Script to run all services locally
  - _Requirements: 10.2_

- [ ]\* 12.3 Write integration tests for local environment

  - Test all services against LocalStack
  - Test service-to-service communication
  - Test event delivery through EventBridge
  - Test API Gateway routing
  - _Requirements: 10.1, 10.5_

- [ ] 13. Implement feature flags and migration strategy
- [ ] 13.1 Add feature flag system

  - Implement feature flag configuration (environment variables or config service)
  - Add feature flag evaluation in server actions
  - Implement gradual rollout logic (percentage-based)
  - Add feature flag override for testing
  - _Requirements: 11.2, 11.3_

- [ ] 13.2 Implement traffic routing logic

  - Add routing logic in server actions based on feature flags
  - Implement fallback to monolith on service errors
  - Add metrics for feature flag usage
  - Test flag toggling without deployment
  - _Requirements: 11.2, 11.3_

- [ ] 14. Create deployment pipelines
- [ ] 14.1 Create CI/CD pipeline for OAuth Service

  - Set up build and test stages
  - Add deployment stage with CDK/SAM
  - Configure staging and production environments
  - Add smoke tests post-deployment
  - _Requirements: 7.5, 12.5_

- [ ] 14.2 Create CI/CD pipeline for Search Service

  - Set up build and test stages
  - Add deployment stage with CDK/SAM
  - Configure staging and production environments
  - Add smoke tests post-deployment
  - _Requirements: 7.5, 12.5_

- [ ] 14.3 Create CI/CD pipeline for AI Service

  - Set up build and test stages
  - Add deployment stage with CDK/SAM
  - Configure staging and production environments
  - Add smoke tests post-deployment
  - _Requirements: 7.5, 12.5_

- [ ] 15. Final checkpoint - End-to-end validation

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Documentation and knowledge transfer
- [ ] 16.1 Create architecture documentation

  - Document service boundaries and responsibilities
  - Document API contracts with OpenAPI specs
  - Document event schemas
  - Document data ownership model
  - _Requirements: 6.1, 12.3_

- [ ] 16.2 Create operational documentation

  - Document deployment procedures
  - Document rollback procedures
  - Document monitoring and alerting
  - Document troubleshooting guides
  - _Requirements: 11.5, 12.3_

- [ ] 16.3 Create developer onboarding guide

  - Document local development setup
  - Document how to add new endpoints
  - Document testing strategies
  - Document debugging techniques
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 17. Production migration execution
- [ ] 17.1 Phase 1: Deploy OAuth Service to production

  - Deploy infrastructure with feature flag disabled
  - Run smoke tests in production
  - Enable feature flag for 10% of traffic
  - Monitor for 48 hours
  - Gradually increase to 100%
  - _Requirements: 11.2, 11.3_

- [ ] 17.2 Phase 2: Deploy Search Service to production

  - Deploy infrastructure with feature flag disabled
  - Run smoke tests in production
  - Enable feature flag for 10% of traffic
  - Monitor for 48 hours
  - Gradually increase to 100%
  - _Requirements: 11.2, 11.3_

- [ ] 17.3 Phase 3: Deploy AI Service to production

  - Deploy infrastructure with feature flag disabled
  - Run smoke tests in production
  - Enable feature flag for 5% of traffic
  - Monitor for 72 hours
  - Gradually increase to 100%
  - _Requirements: 11.2, 11.3_

- [ ] 17.4 Phase 4: Remove old code from monolith

  - Remove direct Bedrock calls from Next.js
  - Remove direct Tavily calls from Next.js
  - Remove direct OAuth logic from Next.js
  - Clean up unused dependencies
  - _Requirements: 11.4_

- [ ] 18. Post-migration optimization
- [ ] 18.1 Optimize Lambda configurations

  - Analyze CloudWatch metrics for memory usage
  - Adjust Lambda memory settings for cost optimization
  - Tune timeout values based on actual usage
  - Optimize cold start performance
  - _Requirements: 7.1_

- [ ] 18.2 Optimize caching strategies

  - Analyze cache hit rates
  - Tune cache TTL values
  - Implement cache warming for common queries
  - Add cache invalidation strategies
  - _Requirements: 3.4, 8.5_

- [ ] 18.3 Optimize DynamoDB access patterns

  - Analyze query patterns and hot keys
  - Add GSI if needed for new access patterns
  - Optimize partition key distribution
  - Implement read replicas if needed
  - _Requirements: 8.3, 8.5_

- [ ] 19. Final validation and sign-off
  - Ensure all tests pass, ask the user if questions arise.
