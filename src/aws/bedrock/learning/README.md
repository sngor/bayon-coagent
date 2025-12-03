# Learning & Feedback Module

This module provides preference learning and feedback processing capabilities for the AgentStrands system.

## Overview

The Learning & Feedback module enables the system to learn from user interactions and adapt behavior over time. It analyzes feedback patterns to extract user preferences and applies them to improve future task execution.

## Components

### PreferenceEngine

The core component that learns from feedback and applies preferences to tasks.

**Key Features:**

- Learns content style preferences (tone, formality, length)
- Tracks topic and format preferences
- Determines quality thresholds
- Applies preferences to task execution
- Supports incremental updates

**Requirements:** 2.3, 2.4

## Usage

### Basic Usage

```typescript
import { getPreferenceEngine } from "@/aws/bedrock/learning";

// Get the preference engine
const engine = getPreferenceEngine();

// Learn preferences from feedback
const feedbackRecords = [
  /* ... feedback data ... */
];
const preferences = await engine.learnPreferences(userId, feedbackRecords);

// Apply preferences to a task
const task = {
  /* ... task data ... */
};
const enhancedTask = await engine.applyPreferences(task, preferences);

// Get current preferences
const currentPreferences = await engine.getPreferences(userId);

// Update preferences with new feedback
await engine.updatePreferences(userId, newFeedback);
```

### Configuration

```typescript
import { PreferenceEngine } from "@/aws/bedrock/learning";

const engine = new PreferenceEngine({
  minSamplesForLearning: 10, // Minimum feedback samples
  recencyWeight: 0.8, // Weight for recent feedback
  confidenceThreshold: 0.7, // Minimum confidence for updates
  autoUpdate: true, // Enable automatic updates
});
```

## Data Models

### UserPreferences

```typescript
interface UserPreferences {
  userId: string;
  contentStyle: {
    tone: string; // e.g., 'professional', 'casual'
    formality: number; // 0-1 scale
    length: "concise" | "moderate" | "detailed";
  };
  topicPreferences: Record<string, number>; // topic -> score
  formatPreferences: Record<string, number>; // format -> score
  qualityThresholds: {
    minConfidence: number;
    requireCitations: boolean;
  };
  lastUpdated: string;
  version: number;
}
```

### FeedbackRecord

```typescript
interface FeedbackRecord {
  id: string;
  userId: string;
  taskId: string;
  strandId: string;
  feedbackType: "rating" | "edit" | "engagement";
  rating?: number; // 1-5 scale
  edits?: EditRecord;
  engagement?: EngagementMetrics;
  timestamp: string;
  metadata: Record<string, any>;
}
```

## Learning Algorithm

### Content Style Learning

1. **Tone**: Identifies most frequent tone in highly-rated content
2. **Formality**: Calculates average formality score from ratings
3. **Length**: Analyzes edit patterns (shortening vs lengthening)

### Topic Preferences

- Combines rating scores and engagement metrics
- Normalizes scores to 0-1 range
- Calculates weighted averages

### Format Preferences

- Similar to topic preferences
- Tracks performance by content format
- Identifies preferred formats

### Quality Thresholds

- Determines minimum acceptable confidence from ratings
- Identifies citation preferences from feedback patterns

## Incremental Updates

The engine supports incremental updates using exponential moving average:

```
new_score = old_score * (1 - recency_weight) + new_value * recency_weight
```

This allows the system to adapt to changing preferences over time while maintaining stability.

## Storage

Preferences are stored in DynamoDB with the following key pattern:

- **PK**: `USER#{userId}`
- **SK**: `PREFERENCES`
- **EntityType**: `UserPreferences`

## Integration

### With Feedback Collection (Task 4)

Once the feedback collection system is implemented, the preference engine will automatically process new feedback:

```typescript
// Feedback collector triggers preference update
await feedbackCollector.recordRating(taskId, strandId, rating);
await preferenceEngine.updatePreferences(userId, feedbackRecord);
```

### With Task Execution

Apply preferences before executing tasks:

```typescript
// Get user preferences
const preferences = await preferenceEngine.getPreferences(userId);

// Apply to task
const enhancedTask = await preferenceEngine.applyPreferences(task, preferences);

// Execute with preferences
const result = await executeTask(enhancedTask);
```

## Testing

The module includes property-based tests to verify:

- **Property 8**: Behavioral adaptation based on feedback
- **Property 9**: Preference application to tasks

See tasks 6.1 and 6.2 in the implementation plan.

## Future Enhancements

1. **A/B Testing Integration**: Compare preference-based vs default execution
2. **Multi-User Learning**: Learn from aggregated user patterns
3. **Preference Explanations**: Provide insights into why preferences were learned
4. **Preference Export/Import**: Allow users to share preferences
5. **Preference Versioning**: Track preference evolution over time

## Related Modules

- **Feedback Collection** (Task 4): Provides feedback data
- **Memory System**: Stores long-term preference history
- **Quality Assurance**: Uses quality thresholds from preferences
- **Adaptive Routing**: Routes based on user preferences

## Requirements Mapping

- **Requirement 2.3**: Behavioral adaptation from feedback
- **Requirement 2.4**: Preference application to tasks
