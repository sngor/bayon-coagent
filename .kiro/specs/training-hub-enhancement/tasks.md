# Implementation Plan

- [x] 1. Integrate AI Training Plan component into Training Hub

  - AITrainingPlan component is implemented and integrated
  - Component is accessible via /training/ai-plan page with dedicated tab
  - Complete flow from UI input to AI generation to display is working
  - Training plan flow, server actions, and save/download functionality are implemented
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 1.1 Write property test for AI training plan generation

  - **Property 2: AI training plan generation for valid inputs**
  - **Validates: Requirements 2.1**

- [ ]\* 1.2 Write property test for AI training plan structure

  - **Property 3: AI training plan structure validation**
  - **Validates: Requirements 2.2**

- [ ]\* 1.3 Write property test for AI training plan HTML formatting

  - **Property 4: AI training plan HTML formatting**
  - **Validates: Requirements 2.3**

- [ ]\* 1.4 Write property test for input validation

  - **Property 5: Input validation for invalid challenges**
  - **Validates: Requirements 2.4**

- [ ]\* 1.5 Write property test for training plan replacement

  - **Property 8: Training plan UI state replacement**
  - **Validates: Requirements 4.5**

- [x] 2. Training content completeness

  - All training modules are present (6 marketing + 2 closing modules visible)
  - client-communication and closing-techniques modules have complete content
  - All modules have quizzes with multiple questions
  - All technique-based modules include source citations
  - Internal feature links are present in content
  - _Requirements: 1.1, 1.3, 5.1, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 2.1 Write property test for module content sources

  - **Property 9: Module content includes sources**
  - **Validates: Requirements 5.1**

- [ ]\* 2.2 Write property test for quiz presence

  - **Property 10: Quiz presence for all modules**
  - **Validates: Requirements 6.1**

- [ ]\* 2.3 Write property test for feature links

  - **Property 13: Feature links in training content**
  - **Validates: Requirements 7.1, 7.2**

- [x] 3. Progress tracking and module navigation

  - Progress calculation logic is implemented with useMemo
  - Completion status persists to DynamoDB using TrainingProgress entity
  - Automatic next-module navigation is implemented in handleQuizComplete
  - Progress loading on page refresh works via useQuery hook
  - 100% completion displays correctly with congratulations message
  - _Requirements: 1.2, 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ]\* 3.1 Write property test for progress persistence

  - **Property 1: Module completion state persistence**
  - **Validates: Requirements 1.2, 3.2, 3.3**

- [ ]\* 3.2 Write property test for next module navigation

  - **Property 6: Next module navigation after completion**
  - **Validates: Requirements 3.4**

- [x] 4. Quiz functionality

  - Quiz validation logic is implemented in Quiz component
  - Immediate feedback is provided for correct/incorrect answers
  - All correct answers mark module as complete via onComplete callback
  - Retry functionality for incorrect answers is implemented
  - Completed modules show completion indicator (green badge)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]\* 4.1 Write property test for quiz validation

  - **Property 11: Quiz validation and feedback**
  - **Validates: Requirements 6.2**

- [ ]\* 4.2 Write property test for quiz state management

  - **Property 12: Quiz completion state management**
  - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 5. Error handling and loading states

  - AI generation error handling is implemented in AITrainingPlan
  - Loading indicators during AI generation are implemented
  - Error handling for progress save failures is implemented
  - Graceful degradation for progress load failures (empty Set)
  - Toast notifications for errors and success states
  - _Requirements: 2.5, 4.3_

- [ ]\* 5.1 Write unit tests for error scenarios

  - Test AI generation failure handling
  - Test progress save failure handling
  - Test progress load failure handling
  - Test network error scenarios
  - _Requirements: 2.5_

- [ ] 6. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. UI/UX verification and responsive design

  - Training Hub layout is responsive with mobile and tablet support
  - AI Training Plan component is usable on all screen sizes
  - Accordion expansion works properly on different devices
  - Progress bar animations are smooth
  - All interactive elements have proper hover/focus states
  - _Requirements: All_

- [ ]\* 7.1 Write integration tests for end-to-end flows

  - Test complete quiz flow from start to completion
  - Test AI training plan generation flow
  - Test progress persistence across page refreshes
  - Test feature link navigation
  - _Requirements: All_

- [x] 8. Performance verification

  - Memoization is working correctly for progress calculations
  - Only active module content is rendered via accordion
  - Quiz component rendering is optimized
  - AI generation latency is acceptable (3-8 seconds)
  - DynamoDB query performance is optimized
  - _Requirements: All_

- [ ] 9. Implement AI Role-Play feature

  - Create role-play-flow.ts Bedrock flow with conversation context handling
  - Implement AIRolePlay component with scenario selection and chat interface
  - Create server actions for role-play (startRolePlayAction, sendRolePlayMessageAction, endRolePlayAction)
  - Define role-play scenarios for buyers, sellers, and objection handling
  - Implement session persistence to DynamoDB
  - Add role-play access point in Training Hub (new tab or page)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.1 Define role-play scenarios

  - Create scenario definitions with persona descriptions
  - Include buyer scenarios (first-time, investor, luxury, relocating)
  - Include seller scenarios (overpriced, urgent, emotional, FSBO)
  - Include objection handling scenarios (commission, multiple offers, inspection, cold feet)
  - Store scenarios in training-data.ts or separate file
  - _Requirements: 8.1_

- [ ] 9.2 Create role-play Bedrock flow

  - Implement role-play-flow.ts with persona-based system prompts
  - Handle conversation history context
  - Generate constructive feedback on session completion
  - Configure for natural conversation (temperature 0.8)
  - Use Claude 3.5 Sonnet model
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 9.3 Implement role-play server actions

  - Create startRolePlayAction to initialize session
  - Create sendRolePlayMessageAction to handle user messages
  - Create endRolePlayAction to generate feedback and save session
  - Implement DynamoDB persistence for RolePlaySession entity
  - Add error handling and validation
  - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 9.4 Build AIRolePlay component

  - Create chat interface with message history display
  - Implement scenario selection dropdown
  - Add user input field with send button
  - Show AI typing indicator during response generation
  - Display feedback panel when session ends
  - Add "End Session" button to trigger feedback
  - Style with consistent design system
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 9.5 Integrate role-play into Training Hub

  - Add "Practice" tab to training hub layout
  - Create /training/practice page with AIRolePlay component
  - Link scenarios to relevant training modules
  - Display past role-play sessions for review
  - Add navigation and breadcrumbs
  - _Requirements: 8.1, 8.5_

- [ ]\* 9.6 Write property test for context maintenance

  - **Property 14: Role-play context maintenance**
  - **Validates: Requirements 8.3**

- [ ]\* 9.7 Write property test for feedback generation

  - **Property 15: Role-play feedback generation**
  - **Validates: Requirements 8.4**

- [ ]\* 9.8 Write property test for session persistence

  - **Property 16: Role-play session persistence**
  - **Validates: Requirements 8.5**

- [ ] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
