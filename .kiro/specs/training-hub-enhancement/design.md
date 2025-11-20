# Design Document

## Overview

The Training Hub Enhancement transforms the existing training platform into a comprehensive learning and coaching system for real estate agents. This enhancement integrates AI-powered personalized training plans, expands deal-closing content, and provides a seamless learning experience with progress tracking and interactive quizzes.

The design focuses on three main areas:

1. **Content Expansion**: Adding comprehensive deal-closing and client communication modules
2. **AI Integration**: Implementing personalized training plan generation using AWS Bedrock
3. **User Experience**: Enhancing progress tracking, quiz functionality, and feature integration

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Training Hub Page                        │
│  ┌────────────────┐  ┌──────────────────────────────────┐  │
│  │ Progress Card  │  │   AI Training Plan Component     │  │
│  └────────────────┘  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Training Modules Accordion                    │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Module Content + Quiz Component               │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─────────────────┬──────────────────┐
                            ▼                 ▼                  ▼
                    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                    │ Server Action│  │  DynamoDB    │  │   Bedrock    │
                    │  (actions.ts)│  │  Repository  │  │Training Flow │
                    └──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

1. **Training Progress Loading**:

   - Page loads → useQuery hook fetches progress from DynamoDB
   - Progress data determines which modules show completion checkmarks
   - Completion percentage calculated from progress data

2. **Quiz Completion**:

   - User completes quiz → handleQuizComplete called
   - Server action persists to DynamoDB with TrainingProgress entity
   - UI updates to show completion and opens next module

3. **AI Training Plan Generation**:
   - User enters challenge → clicks generate button
   - Server action validates input and calls Bedrock flow
   - Streaming response formatted as HTML and displayed

## Components and Interfaces

### Page Component: `training-hub/page.tsx`

**Responsibilities:**

- Render training hub layout with progress tracking
- Manage accordion state for module navigation
- Handle quiz completion and progress updates
- Integrate AI Training Plan component

**Key State:**

- `openAccordion`: Currently expanded module ID
- `completedModules`: Set of completed module IDs
- `completionPercentage`: Overall progress percentage

**Hooks:**

- `useUser()`: Get current authenticated user
- `useQuery<TrainingProgress>()`: Load training progress from DynamoDB

### Component: `AITrainingPlan`

**Location:** `src/components/ai-training-plan.tsx`

**Props:** None (self-contained)

**State:**

- `challenge`: User's input challenge description
- `plan`: Generated training plan HTML
- `isGenerating`: Loading state during generation

**Methods:**

- `handleGenerate()`: Validates input and calls server action

### Component: `Quiz`

**Location:** `src/components/quiz.tsx`

**Props:**

```typescript
interface QuizProps {
  moduleId: string;
  questions: QuizQuestion[];
  onComplete: () => void;
  isCompleted: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}
```

**Responsibilities:**

- Display multiple-choice questions
- Validate user answers
- Provide immediate feedback
- Trigger completion callback when all correct

### Server Action: `generateTrainingPlan`

**Location:** `src/app/actions.ts`

**Signature:**

```typescript
async function generateTrainingPlan(
  challenge: string
): Promise<ActionResponse<{ plan: string }>>;
```

**Flow:**

1. Validate challenge input (min 10 characters)
2. Call `trainingPlanFlow.generateTrainingPlan()`
3. Return formatted HTML plan or errors

### Bedrock Flow: `training-plan-flow.ts`

**Location:** `src/aws/bedrock/flows/training-plan-flow.ts`

**Input Schema:**

```typescript
{
  challenge: string (min 10 chars)
}
```

**Output Schema:**

```typescript
{
  plan: string (HTML formatted)
}
```

**System Prompt:**

- Expert real estate coach persona
- Analyzes specific challenges
- Creates 3-5 action areas with 2-4 steps each
- Includes timelines and progress tracking tips
- Formats as structured HTML

**Configuration:**

- Model: Claude 3.5 Sonnet
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 2000

## Data Models

### TrainingProgress Entity

**DynamoDB Schema:**

```typescript
{
  PK: "USER#<userId>",
  SK: "TRAINING#<moduleId>",
  EntityType: "TrainingProgress",
  Data: {
    id: string,           // Module ID
    completed: boolean,   // Completion status
    completedAt: string   // ISO timestamp
  },
  CreatedAt: number,
  UpdatedAt: number
}
```

**Access Patterns:**

- Query all progress for user: `PK = USER#<userId>, SK begins_with TRAINING#`
- Get specific module progress: `PK = USER#<userId>, SK = TRAINING#<moduleId>`

### TrainingModule Type

**Location:** `src/lib/training-data.ts`

```typescript
interface TrainingModule {
  id: string;
  title: string;
  content: string; // HTML content
  quiz: QuizQuestion[];
}
```

**Modules:**

1. `local-seo`: Mastering Local SEO
2. `social-media`: Social Media Brand Building
3. `content-marketing`: High-Impact Content Marketing
4. `reviews`: Building Authority with Reviews
5. `ai-workflow`: Supercharging Workflow with AI
6. `competitive-analysis`: Competitive Analysis Insights
7. `client-communication`: Effective Client Communication
8. `closing-techniques`: Mastering the Close

##

Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

Before defining properties, I've reviewed the prework analysis to eliminate redundancy:

**Redundancies Identified:**

- Properties 3.2 and 3.3 both test persistence round-trips and can be combined into a single comprehensive property
- Properties 6.3, 6.4, and 6.5 all test quiz state management and can be consolidated
- Properties 7.1 and 7.2 test link functionality and can be combined

**Consolidated Properties:**
After reflection, the following properties provide unique validation value without redundancy.

### Property 1: Module completion state persistence

_For any_ training module and user, when a module is marked as completed and the data is persisted to DynamoDB, querying the user's training progress should return the completion status for that module.

**Validates: Requirements 1.2, 3.2, 3.3**

### Property 2: AI training plan generation for valid inputs

_For any_ challenge description with at least 10 characters, the system should successfully generate a training plan without errors.

**Validates: Requirements 2.1**

### Property 3: AI training plan structure validation

_For any_ generated training plan, the output should contain 3-5 distinct action areas (identifiable by h3 headings) and each action area should contain 2-4 specific steps (list items).

**Validates: Requirements 2.2**

### Property 4: AI training plan HTML formatting

_For any_ generated training plan, the output should be valid HTML containing h3 tags for headings, ul or ol tags for lists, and structured content.

**Validates: Requirements 2.3**

### Property 5: Input validation for invalid challenges

_For any_ challenge description that is empty or shorter than 10 characters, the system should reject the input and prevent the AI generation from being invoked.

**Validates: Requirements 2.4**

### Property 6: Next module navigation after completion

_For any_ training module that is not the last module in the list, when that module is completed, the system should automatically set the next module as the open/active module.

**Validates: Requirements 3.4**

### Property 7: Bedrock flow invocation on valid submission

_For any_ valid challenge description submitted through the UI, the system should invoke the Bedrock training plan flow exactly once.

**Validates: Requirements 4.2**

### Property 8: Training plan UI state replacement

_For any_ sequence of training plan generations, the displayed plan should always be the most recently generated plan, replacing any previous plans.

**Validates: Requirements 4.5**

### Property 9: Module content includes sources

_For any_ training module that contains techniques or strategies, the module content should include source attributions (identifiable by text patterns like "Source:" or book/author citations).

**Validates: Requirements 5.1**

### Property 10: Quiz presence for all modules

_For any_ training module in the system, that module should have an associated quiz with at least one question.

**Validates: Requirements 6.1**

### Property 11: Quiz validation and feedback

_For any_ set of quiz answers submitted, the system should validate each answer against the correct answer and provide feedback indicating which answers are correct or incorrect.

**Validates: Requirements 6.2**

### Property 12: Quiz completion state management

_For any_ quiz, the following should hold:

- When all answers are correct, the module should be marked complete
- When any answer is incorrect, retry should be available
- When a module is already completed, the completion indicator should be visible

**Validates: Requirements 6.3, 6.4, 6.5**

### Property 13: Feature links in training content

_For any_ training module content that references a platform feature (Brand Audit, Content Engine, Research Agent, etc.), the content should contain a clickable link (anchor tag with href) to that feature's page.

**Validates: Requirements 7.1, 7.2**

## Error Handling

### Client-Side Errors

**Input Validation:**

- Empty challenge description: Display toast notification "Please describe your challenge or growth area"
- Challenge too short (<10 chars): Display validation message before submission
- Network errors during generation: Display error toast with retry option

**State Management:**

- Failed progress save: Log error to console, allow user to continue (non-blocking)
- Failed progress load: Display empty progress state, allow user to proceed
- Quiz completion failure: Show error toast, allow retry

### Server-Side Errors

**Server Action Errors:**

```typescript
{
  message: string,
  errors: string[],
  data: null
}
```

**Bedrock Flow Errors:**

- Model invocation failure: Return error with message "Failed to generate training plan"
- Timeout: Return error with message "Generation timed out, please try again"
- Invalid response: Return error with message "Received invalid response from AI"

**DynamoDB Errors:**

- Write failure: Log error, return graceful failure message
- Read failure: Return empty array, allow page to render
- Connection timeout: Retry with exponential backoff (handled by repository layer)

### Error Recovery

**Retry Strategies:**

- AI generation: User-initiated retry via button
- Progress save: Automatic retry on next completion
- Progress load: Automatic retry on page refresh

**Graceful Degradation:**

- If progress can't be loaded, show all modules as incomplete
- If AI generation fails, preserve user's input for easy retry
- If quiz completion save fails, still show visual feedback to user

## Testing Strategy

### Unit Testing

**Components:**

- `AITrainingPlan`: Test input validation, loading states, error display
- `Quiz`: Test answer validation, completion logic, retry functionality
- `training-hub/page.tsx`: Test progress calculation, module navigation, accordion state

**Utilities:**

- Progress calculation functions
- Module navigation logic
- Completion status helpers

**Server Actions:**

- `generateTrainingPlan`: Test input validation, error handling, response formatting
- Quiz completion action: Test DynamoDB persistence, error scenarios

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) for property-based tests. Each property-based test should run a minimum of 100 iterations.

**Property Tests:**

Each property-based test MUST be tagged with a comment explicitly referencing the correctness property from this design document using the format: `**Feature: training-hub-enhancement, Property {number}: {property_text}**`

1. **Property 1 Test**: Generate random module IDs and user IDs, mark as complete, persist to DynamoDB, query back, verify completion status matches
2. **Property 2 Test**: Generate random challenge descriptions (≥10 chars), invoke AI generation, verify no errors returned
3. **Property 3 Test**: Generate random challenges, parse AI output HTML, count h3 tags (should be 3-5) and list items per section (should be 2-4)
4. **Property 4 Test**: Generate random challenges, validate AI output is valid HTML with required tags (h3, ul/ol)
5. **Property 5 Test**: Generate random invalid inputs (empty, <10 chars), verify validation prevents submission
6. **Property 6 Test**: Generate random module indices (not last), complete module, verify next module becomes active
7. **Property 7 Test**: Generate random valid challenges, verify Bedrock flow is called exactly once per submission
8. **Property 8 Test**: Generate sequence of random challenges, verify only the last generated plan is displayed
9. **Property 9 Test**: For each module with techniques, parse content and verify presence of "Source:" or citation patterns
10. **Property 10 Test**: For each module, verify quiz array exists and has length > 0
11. **Property 11 Test**: Generate random answer sets, verify validation returns correct/incorrect feedback for each
12. **Property 12 Test**: Generate random quiz scenarios (all correct, some incorrect, already completed), verify state management
13. **Property 13 Test**: Parse module content, find feature references, verify corresponding anchor tags exist with correct hrefs

### Integration Testing

**End-to-End Flows:**

1. User loads Training Hub → sees progress → completes quiz → progress updates
2. User enters challenge → generates plan → plan displays → generates another → new plan replaces old
3. User completes all modules → sees 100% progress
4. User clicks feature link in content → navigates to correct page

**DynamoDB Integration:**

- Test progress persistence and retrieval
- Test concurrent updates from multiple sessions
- Test query performance with many completed modules

**Bedrock Integration:**

- Test training plan generation with various challenge types
- Test error handling for model failures
- Test response parsing and HTML formatting

### Manual Testing

**UI/UX Verification:**

- Progress bar updates smoothly
- Accordion navigation feels natural
- AI generation loading states are clear
- Error messages are helpful and actionable
- Links in content work correctly
- Quiz feedback is immediate and clear

**Content Verification:**

- All 8 modules display correctly
- Sources are properly formatted
- Links point to correct pages
- HTML rendering is clean and readable

**Responsive Testing:**

- Training Hub works on mobile devices
- AI Training Plan component is usable on tablets
- Accordion expands properly on all screen sizes

## Performance Considerations

### Client-Side Performance

**Optimization Strategies:**

- Memoize progress calculations with `useMemo`
- Memoize DynamoDB keys to prevent unnecessary re-renders
- Use accordion to render only active module content
- Lazy load Quiz component only when module is expanded

**Bundle Size:**

- Training data is ~15KB (acceptable for initial load)
- AI Training Plan component is code-split
- Quiz component is lightweight (<5KB)

### Server-Side Performance

**AI Generation:**

- Expected latency: 3-8 seconds for training plan
- Max tokens: 2000 (balances quality and speed)
- No caching (each plan is personalized)

**DynamoDB Operations:**

- Progress query: <100ms (single query with SK prefix)
- Progress write: <50ms (single put operation)
- Batch operations not needed (small dataset per user)

### Monitoring

**Key Metrics:**

- AI generation success rate
- AI generation latency (p50, p95, p99)
- Progress save success rate
- Page load time
- Quiz completion rate

**Alerts:**

- AI generation failure rate >5%
- AI generation latency p95 >10s
- DynamoDB write errors >1%

## Security Considerations

### Authentication

- All Training Hub pages require authentication
- User ID from Cognito JWT used for progress tracking
- No cross-user data access possible

### Input Validation

- Challenge description: Max length 2000 characters
- XSS prevention: AI-generated HTML is sanitized (dangerouslySetInnerHTML used with caution)
- SQL injection: N/A (using DynamoDB with parameterized queries)

### Data Privacy

- Training progress is user-specific (PK includes user ID)
- AI challenges are not persisted (ephemeral)
- No PII collected in training data

## Deployment Considerations

### Environment Variables

No new environment variables required. Uses existing:

- `AWS_REGION`
- `DYNAMODB_TABLE_NAME`
- `BEDROCK_MODEL_ID`

### Database Migrations

No schema changes required. TrainingProgress entity uses existing table structure.

### Feature Flags

Optional feature flag for AI Training Plan:

- `ENABLE_AI_TRAINING_PLAN` (default: true)
- Allows disabling if Bedrock costs become concern

### Rollout Strategy

1. Deploy backend changes (server actions, Bedrock flow)
2. Deploy frontend changes (UI components)
3. Monitor AI generation metrics for 24 hours
4. Gradual rollout to all users

## AI Role-Play Feature

### Overview

The AI Role-Play feature allows agents to practice real-world scenarios through interactive conversations with AI personas. This provides a safe environment to build confidence and refine skills before applying them with actual clients.

### Component: `AIRolePlay`

**Location:** `src/components/ai-role-play.tsx`

**Props:**

```typescript
interface AIRolePlayProps {
  moduleId?: string; // Optional: pre-select scenario based on module
  className?: string;
}
```

**State:**

- `selectedScenario`: Currently selected role-play scenario
- `messages`: Array of conversation messages
- `isAIResponding`: Loading state during AI response generation
- `sessionId`: Unique identifier for the current session
- `feedback`: AI-generated feedback after session completion

### Bedrock Flow: `role-play-flow.ts`

**Location:** `src/aws/bedrock/flows/role-play-flow.ts`

**Input Schema:**

```typescript
{
  scenario: string,
  conversationHistory: Array<{role: 'user' | 'ai', content: string}>,
  userMessage: string
}
```

**Output Schema:**

```typescript
{
  response: string,
  feedback?: string // Only provided when session ends
}
```

**System Prompt:**

- AI takes on specific persona (e.g., first-time homebuyer, skeptical seller, demanding client)
- Responds realistically based on scenario context
- Maintains conversation history for context
- Provides constructive feedback when user ends session

**Configuration:**

- Model: Claude 3.5 Sonnet
- Temperature: 0.8 (more natural conversation)
- Max Tokens: 1500

### Available Scenarios

**Buyer Scenarios:**

1. **First-Time Homebuyer**: Nervous client with many questions about the process
2. **Investor Client**: Analytical buyer focused on ROI and market data
3. **Luxury Buyer**: High-expectations client looking for premium service
4. **Relocating Family**: Out-of-state buyer unfamiliar with the area

**Seller Scenarios:**

1. **Overpriced Listing**: Seller with unrealistic price expectations
2. **Urgent Sale**: Seller who needs to close quickly due to job relocation
3. **Emotional Seller**: Long-time homeowner attached to their property
4. **FSBO Conversion**: For Sale By Owner considering hiring an agent

**Objection Handling:**

1. **Commission Negotiation**: Client questioning your commission rate
2. **Multiple Offers**: Buyer who lost out and is frustrated
3. **Inspection Issues**: Navigating repair negotiations after inspection
4. **Cold Feet**: Client having second thoughts before closing

### Data Models

**RolePlaySession Entity:**

```typescript
{
  PK: "USER#<userId>",
  SK: "ROLEPLAY#<sessionId>",
  EntityType: "RolePlaySession",
  Data: {
    id: string,
    scenario: string,
    messages: Array<{role: 'user' | 'ai', content: string, timestamp: string}>,
    feedback: string,
    completedAt: string,
    duration: number // in seconds
  },
  CreatedAt: number,
  UpdatedAt: number
}
```

### Correctness Properties

### Property 14: Role-play context maintenance

_For any_ role-play conversation, when a user sends a message, the AI response should be contextually relevant to the previous messages in the conversation history.

**Validates: Requirements 8.3**

### Property 15: Role-play feedback generation

_For any_ completed role-play session, the system should generate constructive feedback that references specific moments from the conversation.

**Validates: Requirements 8.4**

### Property 16: Role-play session persistence

_For any_ completed role-play session, querying the user's role-play sessions should return the complete transcript with all messages in chronological order.

**Validates: Requirements 8.5**

## Future Enhancements

### Potential Improvements

1. **Training Plan Persistence**: Save generated plans to DynamoDB for later reference
2. **Progress Analytics**: Track time spent per module, quiz scores, completion rates, role-play performance
3. **Personalized Recommendations**: Suggest modules and scenarios based on user's role or challenges
4. **Certificates**: Generate completion certificates for finished training
5. **Video Content**: Add video lessons alongside text content
6. **Community Features**: Allow agents to share insights and discuss strategies
7. **Spaced Repetition**: Remind users to review completed modules periodically
8. **Advanced Quizzes**: Add scenario-based questions, not just multiple choice
9. **Voice Role-Play**: Add speech-to-text and text-to-speech for more realistic practice
10. **AI Performance Scoring**: Quantitative scoring of role-play performance with improvement tracking

### Scalability Considerations

- Current design supports thousands of concurrent users
- DynamoDB auto-scales for read/write capacity
- Bedrock has per-account rate limits (monitor usage)
- Consider caching common training plan patterns if usage grows significantly
- Role-play sessions may generate significant token usage - monitor costs
