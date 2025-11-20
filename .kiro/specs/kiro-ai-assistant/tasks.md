# Implementation Plan

- [ ] 1. Set up core infrastructure and schemas

  - Create Zod schemas for all data models (AgentProfile, Citation, WorkflowTask, etc.)
  - Set up DynamoDB key patterns for agent profiles, citations, and conversation logs
  - Create TypeScript interfaces for all system components
  - _Requirements: 8.1, 9.1, 9.2, 9.3, 10.1_

- [ ] 2. Implement Guardrails and Safety Layer

  - [ ] 2.1 Create GuardrailsService class with domain validation

    - Implement real estate domain classification logic
    - Add keyword matching and pattern detection for domain validation
    - Create configuration for allowed domains and blocked topics
    - _Requirements: 1.1_

  - [ ] 2.2 Implement PII detection and sanitization

    - Add regex patterns for SSN, credit cards, phone numbers, addresses
    - Create sanitization logic to mask or remove detected PII
    - Implement PII detection scanning for all user inputs
    - _Requirements: 1.3_

  - [ ] 2.3 Add financial guarantee and legal advice detection

    - Create pattern matching for guarantee language
    - Add detection for legal advice requests
    - Implement appropriate decline messages with professional referrals
    - _Requirements: 1.2_

  - [ ] 2.4 Implement unethical/illegal activity detection

    - Add pattern matching for unethical queries
    - Create decline logic without providing guidance
    - _Requirements: 1.4_

  - [ ]\* 2.5 Write property test for guardrails
    - **Property 1: Out-of-domain query rejection**
    - **Property 2: Financial guarantee and legal advice rejection**
    - **Property 3: PII non-collection**
    - **Property 4: Unethical query rejection**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 3. Implement Agent Profile Management

  - [x] 3.1 Create AgentProfileRepository class

    - Implement createProfile, getProfile, updateProfile, deleteProfile methods
    - Add DynamoDB integration using existing repository pattern
    - Create validation logic for required fields
    - _Requirements: 8.1, 8.4_

  - [x] 3.2 Add profile retrieval optimization

    - Implement caching layer for frequently accessed profiles
    - Add performance monitoring for retrieval times
    - _Requirements: 8.5_

  - [ ]\* 3.3 Write property tests for profile management
    - **Property 31: Profile creation completeness**
    - **Property 32: Profile update round-trip**
    - **Property 33: Profile validation**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 4. Implement Citation Service

  - [x] 4.1 Create CitationService class

    - Implement addCitation, validateURL, formatCitations methods
    - Add URL validation with HTTP HEAD requests
    - Create citation formatting logic with hyperlinks
    - _Requirements: 10.1, 10.2, 10.5_

  - [x] 4.2 Add citation tracking and storage

    - Implement DynamoDB storage for citation records
    - Add citation extraction from AI responses
    - Create citation numbering/labeling logic
    - _Requirements: 10.4_

  - [x] 4.3 Implement fallback for unvalidated URLs

    - Add timeout handling for URL validation
    - Create notation for unverified citations
    - _Requirements: 10.3_

  - [ ]\* 4.4 Write property tests for citations
    - **Property 7: Citation presence**
    - **Property 38: Citation hyperlink formatting**
    - **Property 39: URL validation**
    - **Property 40: Unvalidated URL notation**
    - **Property 41: Citation labeling**
    - **Property 42: Source type inclusion**
    - **Validates: Requirements 2.2, 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 5. Implement Response Enhancement Layer

  - [x] 5.1 Create qualifying language injection for predictions

    - Add pattern detection for prediction/forecast statements
    - Implement automatic insertion of qualifying language
    - Create disclaimer templates
    - _Requirements: 1.5_

  - [x] 5.2 Implement factual grounding verification

    - Add source tracking for all factual statements
    - Create logic to verify facts are grounded in provided data
    - Implement unsourced fact disclaimer injection
    - _Requirements: 2.1, 2.3_

  - [x] 5.3 Add multiple fact citation enforcement

    - Implement fact extraction from responses
    - Create logic to ensure each fact has a citation
    - _Requirements: 2.4_

  - [ ]\* 5.4 Write property tests for response enhancement
    - **Property 5: Qualifying language in predictions**
    - **Property 6: Factual grounding**
    - **Property 8: Unsourced fact disclaimer**
    - **Property 9: Multiple fact citation**
    - **Validates: Requirements 1.5, 2.1, 2.3, 2.4**

- [x] 6. Implement Worker Agents

  - [x] 6.1 Create Data Analyst Worker Agent

    - Implement Bedrock flow for data analysis tasks
    - Add integration with Tavily search API
    - Create structured output schema for data results
    - _Requirements: 4.2_

  - [x] 6.2 Create Content Generator Worker Agent

    - Implement Bedrock flow for content generation
    - Add agent profile integration for personalization
    - Create output schema for generated content
    - _Requirements: 4.2_

  - [x] 6.3 Create Market Forecaster Worker Agent

    - Implement Bedrock flow for market forecasting
    - Add qualifying language injection
    - Create forecast output schema with confidence levels
    - _Requirements: 4.2_

  - [x] 6.4 Implement standardized worker communication protocol

    - Create WorkerTask and WorkerResult interfaces
    - Add structured error responses
    - Implement status tracking
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]\* 6.5 Write property tests for worker agents
    - **Property 34: Task structure completeness**
    - **Property 35: Worker response structure**
    - **Property 36: Error response structure**
    - **Validates: Requirements 9.1, 9.2, 9.3**

- [x] 7. Implement Workflow Orchestrator

  - [x] 7.1 Create WorkflowOrchestrator class

    - Implement request decomposition using Claude
    - Add task dependency analysis
    - Create execution plan generation (sequential/parallel)
    - _Requirements: 4.1_

  - [x] 7.2 Implement worker agent assignment logic

    - Add task type classification
    - Create worker selection based on task type
    - Implement task distribution
    - _Requirements: 4.2_

  - [x] 7.3 Add result synthesis

    - Implement result aggregation from multiple workers
    - Create synthesis prompt for Claude
    - Add agent profile integration for personalized synthesis
    - _Requirements: 4.3_

  - [x] 7.4 Implement error handling and graceful degradation

    - Add worker failure detection
    - Create partial result synthesis
    - Implement user notification for limitations
    - _Requirements: 4.5_

  - [x] 7.5 Add guardrails and citation preservation in synthesis

    - Verify synthesized responses maintain safety constraints
    - Ensure citations are preserved through synthesis
    - _Requirements: 4.4_

  - [ ]\* 7.6 Write property tests for orchestration
    - **Property 15: Task decomposition bounds**
    - **Property 16: Appropriate agent assignment**
    - **Property 17: Result synthesis completeness**
    - **Property 18: Synthesis safety preservation**
    - **Property 19: Graceful worker failure handling**
    - **Property 37: Response validation before synthesis**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 9.4**

- [x] 8. Implement Parallel Search Agent

  - [x] 8.1 Create ParallelSearchAgent class

    - Implement parallel execution across ChatGPT, Gemini, Claude
    - Add external API client integrations
    - Create timeout and error handling for each platform
    - _Requirements: 5.1_

  - [x] 8.2 Implement consensus and discrepancy analysis

    - Add result comparison logic
    - Create consensus point identification
    - Implement discrepancy highlighting
    - _Requirements: 5.2, 5.3_

  - [x] 8.3 Add agent visibility detection

    - Implement agent name/firm search in results
    - Create ranking detection logic
    - Add visibility reporting
    - _Requirements: 5.5_

  - [x] 8.4 Create parallel search summary generation

    - Implement source attribution formatting
    - Add platform availability reporting
    - _Requirements: 5.4_

  - [ ]\* 8.5 Write property tests for parallel search
    - **Property 20: Parallel platform querying**
    - **Property 21: Consensus identification**
    - **Property 22: Discrepancy highlighting**
    - **Property 23: Source attribution in parallel search**
    - **Property 24: Agent visibility reporting**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

- [x] 9. Implement Vision Agent

  - [x] 9.1 Create VisionAgent with Claude vision capabilities

    - Implement Bedrock multimodal API integration
    - Add image encoding and format handling
    - Create visual element extraction logic
    - _Requirements: 6.1, 6.2_

  - [x] 9.2 Implement recommendation generation

    - Add actionable recommendation logic
    - Create cost estimation categorization
    - Implement priority assignment
    - _Requirements: 6.3_

  - [x] 9.3 Add market trend integration

    - Integrate agent profile context
    - Create market alignment analysis
    - Add trend-based recommendation rationale
    - _Requirements: 6.4_

  - [ ]\* 9.4 Write property tests for vision analysis
    - **Property 25: Visual element identification**
    - **Property 26: Actionable recommendation generation**
    - **Property 27: Market-grounded recommendations**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [x] 10. Implement Personalization Layer

  - [x] 10.1 Create profile injection for all AI flows

    - Add agent profile loading in all worker agents
    - Implement profile context in system prompts
    - Create profile-aware prompt templates
    - _Requirements: 3.1_

  - [x] 10.2 Implement market prioritization for property suggestions

    - Add primary market filtering logic
    - Create market-based result ranking
    - _Requirements: 3.2_

  - [x] 10.3 Add specialization and core principle integration

    - Implement specialization-aware content generation
    - Add core principle injection in responses
    - _Requirements: 3.3_

  - [x] 10.4 Implement tone matching

    - Create tone detection and application logic
    - Add tone validation in responses
    - _Requirements: 3.4_

  - [x] 10.5 Add profile update propagation

    - Implement cache invalidation on profile updates
    - Ensure new preferences apply immediately
    - _Requirements: 3.5_

  - [ ]\* 10.6 Write property tests for personalization
    - **Property 10: Agent profile incorporation**
    - **Property 11: Primary market prioritization**
    - **Property 12: Listing personalization**
    - **Property 13: Tone matching**
    - **Property 14: Profile update application**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 11. Implement Efficiency Optimizer

  - [x] 11.1 Create EfficiencyOptimizer class

    - Implement filler word removal logic
    - Add greeting detection and removal
    - Create unnecessary phrase filtering
    - _Requirements: 7.1_

  - [x] 11.2 Add structured formatting

    - Implement bullet point conversion for lists
    - Create table generation for structured data
    - Add automatic formatting detection
    - _Requirements: 7.2_

  - [x] 11.3 Implement answer prioritization

    - Add response restructuring to prioritize answers
    - Create reasoning section separation
    - _Requirements: 7.4_

  - [ ]\* 11.4 Write property tests for efficiency
    - **Property 28: Filler-free responses**
    - **Property 29: Structured formatting**
    - **Property 30: Answer prioritization**
    - **Validates: Requirements 7.1, 7.2, 7.4**

- [x] 12. Create Server Actions for Chat Interface

  - [x] 12.1 Implement handleChatQuery server action

    - Create main entry point for chat queries
    - Add user authentication and profile loading
    - Integrate guardrails validation
    - Wire up orchestrator or direct worker execution
    - _Requirements: 1.1, 3.1, 4.1_

  - [x] 12.2 Add streaming support for real-time responses

    - Implement streaming server action
    - Add chunk-by-chunk response delivery
    - Create progress indicators
    - _Requirements: 7.4_

  - [x] 12.3 Implement conversation logging
    - Add DynamoDB storage for conversation history
    - Create conversation retrieval endpoints
    - _Requirements: 2.1_

- [x] 13. Create Server Actions for Vision Interface

  - [x] 13.1 Implement handleVisionQuery server action

    - Create entry point for vision analysis
    - Add image upload and encoding
    - Integrate vision agent
    - _Requirements: 6.1_

  - [x] 13.2 Add real-time vision streaming
    - Implement streaming vision responses
    - Create progressive recommendation delivery
    - _Requirements: 6.3_

- [x] 14. Create Server Actions for Profile Management

  - [x] 14.1 Implement profile CRUD server actions

    - Create createAgentProfile action
    - Add updateAgentProfile action
    - Implement getAgentProfile action
    - Add deleteAgentProfile action
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 14.2 Add profile validation in server actions
    - Implement required field validation
    - Add format validation for fields
    - _Requirements: 8.4_

- [x] 15. Build Chat UI Components

  - [x] 15.1 Create ChatInterface component

    - Build message list with virtual scrolling
    - Add input field with submit handling
    - Implement loading states
    - _Requirements: 7.1_

  - [x] 15.2 Add citation display in messages

    - Create citation tooltip or inline display
    - Implement citation numbering
    - Add source type badges
    - _Requirements: 10.1, 10.4_

  - [x] 15.3 Implement parallel search results display
    - Create platform comparison view
    - Add consensus/discrepancy highlighting
    - Implement agent visibility indicator
    - _Requirements: 5.4, 5.5_

- [x] 16. Build Vision UI Components

  - [x] 16.1 Create VisionInterface component

    - Build image upload with preview
    - Add camera capture for mobile
    - Implement question input field
    - _Requirements: 6.1_

  - [x] 16.2 Add visual analysis results display
    - Create visual elements card
    - Implement recommendations list with priorities
    - Add market alignment section
    - _Requirements: 6.2, 6.3, 6.4_

- [x] 17. Build Profile Management UI

  - [x] 17.1 Create AgentProfileForm component

    - Build form with all profile fields
    - Add validation and error display
    - Implement save/update handling
    - _Requirements: 8.1_

  - [x] 17.2 Add profile preview
    - Create profile display card
    - Implement edit mode toggle
    - _Requirements: 8.3_

- [x] 18. Implement Error Handling and Logging

  - [x] 18.1 Add CloudWatch logging integration

    - Implement structured logging for all components
    - Add error logging with context
    - Create performance metric logging
    - _Requirements: 1.1, 4.5_

  - [x] 18.2 Create error boundary components

    - Add React error boundaries for UI
    - Implement fallback UI for errors
    - _Requirements: 4.5_

  - [x] 18.3 Add retry logic for transient failures
    - Implement exponential backoff for Bedrock
    - Add retry for DynamoDB operations
    - Create retry for external API calls
    - _Requirements: 4.5, 5.1_

- [ ] 19. Add Monitoring and Alerting

  - [ ] 19.1 Create CloudWatch dashboards

    - Build dashboard for guardrails metrics
    - Add workflow execution metrics
    - Create citation validation metrics
    - _Requirements: 1.1, 4.1, 10.2_

  - [ ] 19.2 Implement CloudWatch alarms
    - Add alarm for high guardrails violation rate
    - Create alarm for worker failure rate
    - Implement alarm for slow profile retrieval
    - _Requirements: 1.1, 4.5, 8.5_

- [ ] 20. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Create Documentation

  - [ ] 21.1 Write API documentation

    - Document all server actions with examples
    - Add schema documentation
    - Create integration guide
    - _Requirements: All_

  - [ ] 21.2 Create user guide

    - Write guide for chat interface
    - Add guide for vision analysis
    - Create profile setup guide
    - _Requirements: All_

  - [ ] 21.3 Add developer documentation
    - Document architecture and components
    - Create contribution guide
    - Add testing guide
    - _Requirements: All_

- [ ] 22. Final Integration Testing

  - [ ] 22.1 Test complete chat flow end-to-end

    - Verify guardrails, personalization, citations work together
    - Test complex workflows with multiple workers
    - Validate error handling
    - _Requirements: All_

  - [ ] 22.2 Test vision analysis flow end-to-end

    - Verify image upload and analysis
    - Test recommendation generation
    - Validate market integration
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 22.3 Test parallel search flow end-to-end
    - Verify cross-platform querying
    - Test consensus/discrepancy detection
    - Validate agent visibility reporting
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 23. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
