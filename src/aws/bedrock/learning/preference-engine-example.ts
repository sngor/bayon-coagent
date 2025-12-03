/**
 * Preference Engine Usage Examples
 * 
 * Demonstrates how to use the PreferenceEngine for learning and applying user preferences.
 */

import { getPreferenceEngine } from './preference-engine';
import type { FeedbackRecord, UserPreferences } from './types';

/**
 * Example 1: Learning preferences from feedback
 */
async function exampleLearnPreferences() {
    const engine = getPreferenceEngine();
    const userId = 'user-123';

    // Sample feedback records
    const feedbackRecords: FeedbackRecord[] = [
        {
            id: 'fb-1',
            userId,
            taskId: 'task-1',
            strandId: 'content-generator',
            feedbackType: 'rating',
            rating: 5,
            timestamp: new Date().toISOString(),
            metadata: {
                tone: 'professional',
                formality: 0.8,
                topic: 'market-analysis',
                format: 'blog-post',
                confidence: 0.9,
                hasCitations: true,
            },
        },
        {
            id: 'fb-2',
            userId,
            taskId: 'task-2',
            strandId: 'content-generator',
            feedbackType: 'rating',
            rating: 4,
            timestamp: new Date().toISOString(),
            metadata: {
                tone: 'professional',
                formality: 0.7,
                topic: 'market-analysis',
                format: 'social-media',
                confidence: 0.85,
            },
        },
        {
            id: 'fb-3',
            userId,
            taskId: 'task-3',
            strandId: 'content-generator',
            feedbackType: 'edit',
            edits: {
                originalContent: 'This is a very long detailed explanation...',
                editedContent: 'This is a concise explanation.',
                sectionsModified: ['introduction', 'conclusion'],
                changeType: 'modification',
                editDuration: 120,
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
            metadata: {
                topic: 'listing-description',
            },
        },
        {
            id: 'fb-4',
            userId,
            taskId: 'task-4',
            strandId: 'content-generator',
            feedbackType: 'engagement',
            engagement: {
                views: 250,
                clicks: 45,
                shares: 12,
                conversions: 3,
                timeOnPage: 180,
            },
            timestamp: new Date().toISOString(),
            metadata: {
                topic: 'market-analysis',
                format: 'blog-post',
            },
        },
        {
            id: 'fb-5',
            userId,
            taskId: 'task-5',
            strandId: 'content-generator',
            feedbackType: 'rating',
            rating: 5,
            timestamp: new Date().toISOString(),
            metadata: {
                tone: 'professional',
                formality: 0.75,
                topic: 'neighborhood-guide',
                format: 'blog-post',
                confidence: 0.88,
                hasCitations: true,
            },
        },
    ];

    // Learn preferences from feedback
    const preferences = await engine.learnPreferences(userId, feedbackRecords);

    console.log('Learned Preferences:');
    console.log('Content Style:', preferences.contentStyle);
    console.log('Topic Preferences:', preferences.topicPreferences);
    console.log('Format Preferences:', preferences.formatPreferences);
    console.log('Quality Thresholds:', preferences.qualityThresholds);

    return preferences;
}

/**
 * Example 2: Applying preferences to a task
 */
async function exampleApplyPreferences() {
    const engine = getPreferenceEngine();
    const userId = 'user-123';

    // Get user preferences
    const preferences = await engine.getPreferences(userId);

    // Original task
    const task = {
        id: 'task-new',
        type: 'content-generation',
        topic: 'market-analysis',
        format: 'blog-post',
        // No style preferences specified
    };

    console.log('Original Task:', task);

    // Apply preferences
    const enhancedTask = await engine.applyPreferences(task, preferences);

    console.log('Enhanced Task:', enhancedTask);
    console.log('Applied tone:', (enhancedTask as any).tone);
    console.log('Applied formality:', (enhancedTask as any).formality);
    console.log('Applied length:', (enhancedTask as any).targetLength);
    console.log('Applied confidence threshold:', (enhancedTask as any).minConfidence);

    return enhancedTask;
}

/**
 * Example 3: Incremental preference updates
 */
async function exampleIncrementalUpdate() {
    const engine = getPreferenceEngine();
    const userId = 'user-123';

    // Get current preferences
    const beforePreferences = await engine.getPreferences(userId);
    console.log('Before Update:', beforePreferences.topicPreferences);

    // New feedback
    const newFeedback: FeedbackRecord = {
        id: 'fb-new',
        userId,
        taskId: 'task-new',
        strandId: 'content-generator',
        feedbackType: 'rating',
        rating: 5,
        timestamp: new Date().toISOString(),
        metadata: {
            topic: 'investment-analysis',
            format: 'report',
            confidence: 0.92,
        },
    };

    // Update preferences incrementally
    await engine.updatePreferences(userId, newFeedback);

    // Get updated preferences
    const afterPreferences = await engine.getPreferences(userId);
    console.log('After Update:', afterPreferences.topicPreferences);
    console.log('Version:', afterPreferences.version);
}

/**
 * Example 4: Custom configuration
 */
async function exampleCustomConfiguration() {
    const { PreferenceEngine } = await import('./preference-engine');

    // Create engine with custom config
    const engine = new PreferenceEngine({
        minSamplesForLearning: 10,      // Require more samples
        recencyWeight: 0.9,              // Heavily weight recent feedback
        confidenceThreshold: 0.8,        // Higher confidence required
        autoUpdate: true,                // Enable auto-updates
    });

    const userId = 'user-456';
    const feedbackRecords: FeedbackRecord[] = [
        // ... at least 10 feedback records ...
    ];

    // This will only learn if we have 10+ samples
    const preferences = await engine.learnPreferences(userId, feedbackRecords);

    console.log('Learned with custom config:', preferences);
}

/**
 * Example 5: Integration with content generation
 */
async function exampleContentGenerationIntegration() {
    const engine = getPreferenceEngine();
    const userId = 'user-123';

    // Step 1: Get user preferences
    const preferences = await engine.getPreferences(userId);

    // Step 2: Create content generation task
    const contentTask = {
        userId,
        type: 'blog-post',
        topic: 'market-trends',
        keywords: ['real estate', 'market analysis'],
    };

    // Step 3: Apply preferences
    const enhancedTask = await engine.applyPreferences(contentTask, preferences);

    // Step 4: Generate content with preferences
    const taskWithPrefs = enhancedTask as any;
    console.log('Generating content with preferences:');
    console.log('- Tone:', taskWithPrefs.tone);
    console.log('- Formality:', taskWithPrefs.formality);
    console.log('- Target Length:', taskWithPrefs.targetLength);
    console.log('- Min Confidence:', taskWithPrefs.minConfidence);
    console.log('- Require Citations:', taskWithPrefs.requireCitations);

    // Simulate content generation
    // const content = await generateContent(enhancedTask);

    // Step 5: Collect feedback
    const feedback: FeedbackRecord = {
        id: 'fb-generated',
        userId,
        taskId: contentTask.userId,
        strandId: 'content-generator',
        feedbackType: 'rating',
        rating: 4,
        timestamp: new Date().toISOString(),
        metadata: {
            topic: contentTask.topic,
            format: contentTask.type,
            tone: taskWithPrefs.tone,
            formality: taskWithPrefs.formality,
        },
    };

    // Step 6: Update preferences based on feedback
    await engine.updatePreferences(userId, feedback);

    console.log('Preferences updated based on feedback');
}

/**
 * Example 6: Handling insufficient feedback
 */
async function exampleInsufficientFeedback() {
    const engine = getPreferenceEngine({
        minSamplesForLearning: 5,
    });

    const userId = 'new-user';

    // Only 2 feedback records (less than minimum)
    const feedbackRecords: FeedbackRecord[] = [
        {
            id: 'fb-1',
            userId,
            taskId: 'task-1',
            strandId: 'content-generator',
            feedbackType: 'rating',
            rating: 4,
            timestamp: new Date().toISOString(),
            metadata: {},
        },
        {
            id: 'fb-2',
            userId,
            taskId: 'task-2',
            strandId: 'content-generator',
            feedbackType: 'rating',
            rating: 5,
            timestamp: new Date().toISOString(),
            metadata: {},
        },
    ];

    // Will return default preferences
    const preferences = await engine.learnPreferences(userId, feedbackRecords);

    console.log('Insufficient feedback - using defaults:');
    console.log('Version:', preferences.version); // Will be 0
    console.log('Content Style:', preferences.contentStyle);
}

// Export examples for testing
export {
    exampleLearnPreferences,
    exampleApplyPreferences,
    exampleIncrementalUpdate,
    exampleCustomConfiguration,
    exampleContentGenerationIntegration,
    exampleInsufficientFeedback,
};

// Run examples if executed directly
if (require.main === module) {
    (async () => {
        console.log('\n=== Example 1: Learning Preferences ===');
        await exampleLearnPreferences();

        console.log('\n=== Example 2: Applying Preferences ===');
        await exampleApplyPreferences();

        console.log('\n=== Example 3: Incremental Updates ===');
        await exampleIncrementalUpdate();

        console.log('\n=== Example 5: Content Generation Integration ===');
        await exampleContentGenerationIntegration();

        console.log('\n=== Example 6: Insufficient Feedback ===');
        await exampleInsufficientFeedback();
    })();
}
