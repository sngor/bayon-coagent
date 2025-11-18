# Implementation Plan

## Status Summary

**Completed Infrastructure:**

- ✅ AWS SDK packages installed and configured
- ✅ AWS services implemented (Cognito, DynamoDB, S3, Bedrock, Logging, Search)
- ✅ AI flows migrated from Genkit to Bedrock
- ✅ Infrastructure as Code (CDK) created and deployable
- ✅ Migration scripts created
- ✅ Unit tests passing for all AWS services

**Critical Gap Identified:**

- ❌ Application components still import from `@/firebase` (directory doesn't exist)
- ❌ Actions file uses undefined Firebase functions (setDocumentNonBlocking, addDocumentNonBlocking, etc.)
- ❌ Components use undefined Firebase hooks (useFirestore, useCollection, useDoc, useStorage, etc.)

**Remaining Work:**

- Remove all Firebase imports from application components
- Update all components to use AWS hooks directly (useUser from @/aws/auth, useQuery/useItem from @/aws/dynamodb)
- Update server actions to use DynamoDB repository directly
- Complete integration testing
- Performance optimization

---

- [x] 1. Set up AWS infrastructure and local development environment

  - Install AWS SDK v3 packages (@aws-sdk/client-cognito-identity-provider, @aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb, @aws-sdk/client-s3, @aws-sdk/client-bedrock-runtime)
  - Install LocalStack for local AWS service emulation
  - Create docker-compose.yml for LocalStack services
  - Set up environment variable configuration files (.env.local, .env.production)
  - Create AWS configuration module (src/aws/config.ts) with environment detection
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.5_

- [ ]\* 1.1 Write property test for environment detection

  - **Property 18: Environment detection selects correct endpoints**
  - **Validates: Requirements 5.3**

- [ ]\* 1.2 Write property test for configuration switching

  - **Property 19: Environment changes update configuration**
  - **Validates: Requirements 5.5**

- [x] 2. Implement AWS Cognito authentication layer

  - Create Cognito client module (src/aws/auth/cognito-client.ts)
  - Implement authentication methods (signUp, signIn, signOut, getCurrentUser, getSession)
  - Create React context provider for authentication state (src/aws/auth/auth-provider.tsx)
  - Implement useUser hook for Cognito (src/aws/auth/use-user.tsx)
  - Add token refresh logic with automatic renewal
  - Implement JWT token verification for protected routes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]\* 2.1 Write property test for user registration

  - **Property 1: User registration creates accounts**
  - **Validates: Requirements 1.1**

- [ ]\* 2.2 Write property test for authentication

  - **Property 2: Valid credentials authenticate successfully**
  - **Validates: Requirements 1.2**

- [ ]\* 2.3 Write property test for logout

  - **Property 3: Logout clears session**
  - **Validates: Requirements 1.3**

- [ ]\* 2.4 Write property test for token verification

  - **Property 4: Token verification protects routes**
  - **Validates: Requirements 1.4**

- [ ]\* 2.5 Write property test for auth hook equivalence

  - **Property 24: Auth hooks provide equivalent functionality**
  - **Validates: Requirements 10.2**

- [x] 3. Design and implement DynamoDB data layer

  - Create DynamoDB client module (src/aws/dynamodb/client.ts)
  - Define single-table design schema with PK/SK patterns for all entities
  - Create DynamoDB repository with CRUD operations (src/aws/dynamodb/repository.ts)
  - Implement key generation functions for all entity types
  - Create type definitions for DynamoDB items
  - _Requirements: 2.2, 2.5, 2.6, 2.7, 8.1, 8.2, 8.3, 8.4_

- [ ]\* 3.1 Write property test for key schema mapping

  - **Property 8: Firestore paths map to valid DynamoDB keys**
  - **Validates: Requirements 2.7**

- [ ]\* 3.2 Write property test for user-scoped partition keys

  - **Property 9: User-scoped data uses userId in partition key**
  - **Validates: Requirements 8.2**

- [ ]\* 3.3 Write property test for entity table definitions

  - **Property 10: All entities have table definitions**
  - **Validates: Requirements 8.1**

- [x] 4. Implement DynamoDB data access operations

  - Implement get operation for single items
  - Implement query operation with filter support
  - Implement put operation for creating/updating items
  - Implement update operation for partial updates
  - Implement delete operation
  - Implement batch operations (batchGet, batchWrite)
  - Add error handling and retry logic
  - _Requirements: 2.1, 2.2, 2.3, 8.5_

- [ ]\* 4.1 Write property test for read-write round trip

  - **Property 5: Read-write round trip**
  - **Validates: Requirements 2.1, 2.2**

- [ ]\* 4.2 Write property test for query filtering

  - **Property 6: Query returns only matching items**
  - **Validates: Requirements 2.3**

- [ ]\* 4.3 Write property test for query pattern support

  - **Property 11: Query patterns are supported**
  - **Validates: Requirements 8.4, 8.5**

- [x] 5. Create React hooks for DynamoDB data access

  - Implement useQuery hook for querying collections (replaces useCollection)
  - Implement useItem hook for single items (replaces useDoc)
  - Add polling mechanism for real-time updates
  - Implement loading and error states
  - Add caching layer for performance
  - _Requirements: 2.1, 2.3, 2.4, 10.3_

- [ ]\* 5.1 Write property test for subscription updates

  - **Property 7: Subscriptions detect updates**
  - **Validates: Requirements 2.4**

- [ ]\* 5.2 Write property test for data hook equivalence

  - **Property 25: Data hooks provide equivalent functionality**
  - **Validates: Requirements 10.3**

- [x] 6. Implement AWS S3 storage layer

  - Create S3 client module (src/aws/s3/client.ts)
  - Implement file upload function with multipart support
  - Implement file download function
  - Implement presigned URL generation for secure access
  - Implement file deletion function
  - Implement list files function
  - Configure CORS for browser uploads
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 6.1 Write property test for file upload-download round trip

  - **Property 12: File upload-download round trip**
  - **Validates: Requirements 4.1, 4.2**

- [ ]\* 6.2 Write property test for presigned URLs

  - **Property 13: Presigned URLs provide access**
  - **Validates: Requirements 4.3**

- [x] 7. Implement AWS Bedrock AI client

  - Create Bedrock client module (src/aws/bedrock/client.ts)
  - Implement invoke method for synchronous AI calls
  - Implement invokeStream method for streaming responses
  - Add prompt construction utilities
  - Implement response parsing with Zod schema validation
  - Add error handling and retry logic for throttling
  - Configure Claude 3.5 Sonnet as primary model
  - _Requirements: 3.1, 3.2, 3.5, 9.3, 9.4, 9.5_

- [ ]\* 7.1 Write property test for AI flow invocation

  - **Property 14: AI flows invoke Bedrock successfully**
  - **Validates: Requirements 3.1**

- [ ]\* 7.2 Write property test for schema conformance

  - **Property 15: AI responses conform to output schemas**
  - **Validates: Requirements 3.2**

- [ ]\* 7.3 Write property test for streaming completeness

  - **Property 17: Streaming delivers complete responses**
  - **Validates: Requirements 9.4**

- [ ]\* 7.4 Write property test for Zod validation

  - **Property 23: Zod schemas validate correctly**
  - **Validates: Requirements 9.2**

- [x] 8. Migrate AI flows from Genkit to Bedrock

  - Create base flow interface and utilities (src/aws/bedrock/flow-base.ts)
  - Migrate generate-agent-bio flow
  - Migrate run-nap-audit flow
  - Migrate generate-blog-post flow
  - Migrate generate-market-update flow
  - Migrate generate-social-media-post flow
  - Migrate generate-video-script flow
  - Migrate generate-listing-faqs flow
  - Migrate generate-neighborhood-guides flow
  - Migrate generate-marketing-plan flow
  - Migrate run-research-agent flow
  - Migrate all remaining flows from src/ai/flows/
  - Keep existing Zod schemas from src/ai/schemas/
  - _Requirements: 3.1, 3.2, 3.6, 9.1, 9.2_

- [ ]\* 8.1 Write property test for Genkit-Bedrock feature parity

  - **Property 16: Bedrock flows maintain Genkit feature parity**
  - **Validates: Requirements 3.6**

- [x] 9. Implement web search alternative for AI flows

  - Research and select web search API (Tavily, Serper, or Bedrock Agents)
  - Implement search client module
  - Integrate search into flows that previously used Google Search
  - Add search result formatting and citation extraction
  - _Requirements: 3.3, 3.4_

- [x] 10. Remove Firebase imports and update authentication in components

- [x] 10.1 Update authentication imports in pages

  - Update login page: remove `@/firebase` imports, use `@/aws/auth` (already partially done)
  - Update layout: remove `@/firebase` imports, use `@/aws/auth` (already partially done)
  - Update brand-audit page: remove duplicate useUser imports, use only `@/aws/auth`
  - Update integrations page: verify using `@/aws/auth` (already done)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.2_

- [x] 10.2 Update data access in dashboard and profile pages

  - Update dashboard page: replace `useFirestore`, `useDoc`, `useCollection` with `useQuery`, `useItem` from `@/aws/dynamodb/hooks`
  - Update profile page: replace Firebase hooks with DynamoDB hooks
  - Update settings page: replace Firebase Storage with S3 client from `@/aws/s3`
  - Remove `useMemoFirebase` calls, replace with React `useMemo`
  - _Requirements: 2.1, 2.3, 2.4, 10.3_

- [x] 10.3 Update data access in content and project pages

  - Update content-engine page: replace Firebase hooks with DynamoDB hooks
  - Update projects page: replace Firebase hooks with DynamoDB hooks
  - Update knowledge-base pages: replace Firebase hooks with DynamoDB hooks
  - Update research-agent pages: replace Firebase hooks with DynamoDB hooks
  - _Requirements: 2.1, 2.3, 2.4, 10.3_

- [x] 10.4 Update data access in analysis pages

  - Update brand-audit page: replace Firebase hooks with DynamoDB hooks
  - Update competitive-analysis page: replace Firebase hooks with DynamoDB hooks
  - Update marketing-plan page: replace Firebase hooks with DynamoDB hooks
  - Update training-hub page: replace Firebase hooks with DynamoDB hooks
  - _Requirements: 2.1, 2.3, 2.4, 10.3_

- [ ]\* 10.5 Write property test for data structure preservation

  - **Property 27: Saved content preserves structure**
  - **Validates: Requirements 11.3**

- [x] 11. Update server actions to use DynamoDB repository directly

  - Import DynamoDB repository from `@/aws/dynamodb`
  - Import key generation functions from `@/aws/dynamodb/keys`
  - Replace `setDocumentNonBlocking('users/${userId}/path', data)` with `repository.put({ PK: 'USER#${userId}', SK: 'PATH', Data: data })`
  - Replace `addDocumentNonBlocking('users/${userId}/collection', data)` with `repository.create({ PK: 'USER#${userId}', SK: 'COLLECTION#${id}', Data: data })`
  - Replace `updateDocumentNonBlocking('users/${userId}/path', updates)` with `repository.update('USER#${userId}', 'PATH', updates)`
  - Update all key patterns to match DynamoDB PK/SK design from design document
  - Verify all AWS error handling is in place
  - _Requirements: 2.1, 2.2, 10.1, 10.4_

- [ ]\* 11.1 Write property test for error mapping

  - **Property 26: AWS errors map to user-friendly messages**
  - **Validates: Requirements 10.4**

- [ ]\* 11.2 Write property test for error logging

  - **Property 28: Service failures are logged with context**
  - **Validates: Requirements 12.1**

- [ ]\* 11.3 Write property test for auth error messages

  - **Property 29: Auth failures provide clear messages**
  - **Validates: Requirements 12.4**

- [ ]\* 11.4 Write property test for AI error handling

  - **Property 30: AI failures allow retry**
  - **Validates: Requirements 12.5**

- [x] 12. Implement OAuth integration with DynamoDB

  - Update Google OAuth callback to store tokens in DynamoDB
  - Implement token retrieval from DynamoDB
  - Implement token refresh logic
  - Update OAuth flow in src/app/api/oauth/google/callback/page.tsx
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 12.1 Write property test for token exchange

  - **Property 20: Token exchange succeeds for valid codes**
  - **Validates: Requirements 7.2**

- [ ]\* 12.2 Write property test for token storage round trip

  - **Property 21: OAuth token storage round trip**
  - **Validates: Requirements 7.3**

- [ ]\* 12.3 Write property test for token refresh

  - **Property 22: Token refresh obtains new tokens**
  - **Validates: Requirements 7.4**

- [x] 13. Implement logging and monitoring

  - Create logging utility module (src/aws/logging/logger.ts)
  - Implement console logging for local development
  - Implement CloudWatch Logs integration for production
  - Add structured logging with correlation IDs
  - Add error tracking and alerting
  - Create CloudWatch dashboard configuration
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 14. Create data migration scripts

  - Create script to export data from Firestore
  - Create script to transform Firestore data to DynamoDB format
  - Create script to import data into DynamoDB
  - Create script to migrate files from Firebase Storage to S3
  - Add data validation and integrity checks
  - Create rollback scripts
  - _Requirements: 2.7, 8.1, 8.2, 8.3_

- [x] 15. Update package.json and remove Firebase dependencies

  - Remove firebase, @firebase/app, @firebase/auth, @firebase/firestore packages
  - Remove genkit, @genkit-ai/google-genai, @genkit-ai/next packages
  - Remove firebase-admin package
  - Update dev scripts to remove genkit:dev and genkit:watch
  - Add AWS SDK packages to dependencies
  - Update build scripts if needed
  - _Requirements: 10.1_

- [x] 16. Create Infrastructure as Code with AWS CDK

  - Initialize AWS CDK project
  - Define Cognito User Pool stack
  - Define DynamoDB table stack with GSI
  - Define S3 bucket stack with CORS and policies
  - Define IAM roles and policies
  - Define CloudWatch alarms and dashboards
  - Create deployment scripts
  - _Requirements: 6.5_

- [x] 17. Set up AWS Amplify Hosting or alternative deployment

  - Configure Amplify Hosting for Next.js
  - Set up environment variables in Amplify
  - Configure build settings
  - Set up custom domain and SSL
  - Configure CloudFront distribution
  - Test deployment pipeline
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 18. Update documentation

  - Update README.md with AWS setup instructions
  - Update ARCHITECTURE.md with AWS architecture
  - Create AWS_SETUP.md with detailed AWS configuration guide
  - Update environment variable documentation
  - Create migration guide for existing users
  - Document local development setup with LocalStack
  - _Requirements: 5.1, 5.2_

- [ ] 19. Integration testing and verification

- [ ] 19.1 Test authentication flows end-to-end

  - Test user registration with Cognito
  - Test user login and session management
  - Test logout and session clearing
  - Test protected route access
  - _Requirements: 11.1, 1.1, 1.2, 1.3, 1.4_

- [ ] 19.2 Test data operations end-to-end

  - Test creating, reading, updating, deleting all entity types
  - Test query operations with filters
  - Test data structure preservation
  - Test real-time updates via polling
  - _Requirements: 11.3, 2.1, 2.2, 2.3, 2.4_

- [ ] 19.3 Test AI content generation end-to-end

  - Test all AI flows with real Bedrock calls
  - Test error handling and retry logic
  - Test streaming responses
  - Verify output quality matches requirements
  - _Requirements: 11.2, 3.1, 3.2, 12.5_

- [ ] 19.4 Test file operations end-to-end

  - Test file upload to S3
  - Test file download from S3
  - Test presigned URL generation
  - Test file deletion
  - _Requirements: 11.4, 4.1, 4.2, 4.3_

- [ ] 19.5 Test OAuth integration end-to-end

  - Test Google OAuth flow initiation
  - Test token exchange and storage
  - Test token retrieval
  - Test token refresh
  - _Requirements: 11.5, 7.1, 7.2, 7.3, 7.4_

- [ ] 20. Performance optimization and monitoring

  - Implement caching layer for frequently accessed data
  - Optimize DynamoDB queries and indexes
  - Implement CloudFront caching for static assets
  - Set up CloudWatch alarms for critical metrics
  - Implement cost monitoring and alerts
  - Optimize Bedrock API usage
  - _Requirements: 12.1_

- [ ] 21. Final checkpoint - Production readiness verification
  - Ensure all integration tests pass
  - Verify all components work with AWS services
  - Verify error handling and logging
  - Verify performance meets requirements
  - Ask the user if questions arise
