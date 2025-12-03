/**
 * Conversational Editor Usage Examples
 * 
 * Demonstrates how to use the ConversationalEditor for iterative content refinement
 */

import { ConversationalEditor } from './conversational-editor';

/**
 * Example 1: Basic editing session
 */
export async function basicEditingExample() {
    const editor = new ConversationalEditor();

    // Start a new editing session
    const session = await editor.startEditingSession(
        'blog-post-123',
        `The real estate market is changing. Buyers are looking for different things now.
    Interest rates have gone up. This affects affordability.`,
        'user-456',
        'blog-post'
    );

    console.log('Session started:', session.sessionId);
    console.log('Initial version:', session.versions[0].content);

    // First edit: Make it more engaging
    const suggestion1 = await editor.processEditRequest(
        session.sessionId,
        'user-456',
        'Make the opening more engaging and add a hook'
    );

    console.log('\nFirst suggestion:');
    console.log('Rationale:', suggestion1.rationale);
    console.log('Confidence:', suggestion1.confidence);
    console.log('Changes:', suggestion1.changes.length);

    // Apply the first edit
    const result1 = await editor.applyEdit(session.sessionId, 'user-456', suggestion1, true);
    console.log('\nFirst edit applied:', result1.message);
    console.log('New version:', result1.newVersion);

    // Second edit: Add statistics
    const suggestion2 = await editor.processEditRequest(
        session.sessionId,
        'user-456',
        'Add specific statistics about interest rates and market trends'
    );

    console.log('\nSecond suggestion:');
    console.log('Rationale:', suggestion2.rationale);

    // Apply the second edit
    const result2 = await editor.applyEdit(session.sessionId, 'user-456', suggestion2, true);
    console.log('\nSecond edit applied:', result2.message);

    // End the session
    const summary = await editor.endSession(session.sessionId, 'user-456');

    console.log('\n=== Session Summary ===');
    console.log('Total versions:', summary.totalVersions);
    console.log('Total edits:', summary.totalEdits);
    console.log('Duration:', summary.duration, 'ms');
    console.log('Improvements:');
    summary.improvements.forEach((imp) => console.log(`  - ${imp}`));
    console.log('Learnings:');
    summary.learnings.forEach((learning) =>
        console.log(`  - ${learning.pattern} (${learning.frequency}x)`)
    );

    return summary;
}

/**
 * Example 2: Rejecting suggestions
 */
export async function rejectSuggestionExample() {
    const editor = new ConversationalEditor();

    const session = await editor.startEditingSession(
        'social-post-456',
        'Check out this amazing property! 3 bed, 2 bath, great location.',
        'user-789',
        'social-media'
    );

    // Request an edit
    const suggestion = await editor.processEditRequest(
        session.sessionId,
        'user-789',
        'Make this more professional and formal'
    );

    console.log('Suggestion:', suggestion.suggestedContent);

    // User doesn't like it - reject
    const result = await editor.applyEdit(session.sessionId, 'user-789', suggestion, false);

    console.log('Result:', result.message);
    console.log('Content unchanged:', result.newContent === session.versions[0].content);

    return result;
}

/**
 * Example 3: Multiple refinement iterations
 */
export async function iterativeRefinementExample() {
    const editor = new ConversationalEditor();

    const initialContent = `Thinking about selling your home? Now might be the perfect time.
  The market is strong and buyers are actively looking.
  Contact me to learn more about your options.`;

    const session = await editor.startEditingSession(
        'email-789',
        initialContent,
        'user-123',
        'email'
    );

    // Series of refinements
    const refinements = [
        'Add a compelling subject line',
        'Make the opening more personal',
        'Add specific market data',
        'Strengthen the call to action',
        'Add a sense of urgency',
    ];

    for (const refinement of refinements) {
        console.log(`\nProcessing: "${refinement}"`);

        const suggestion = await editor.processEditRequest(
            session.sessionId,
            'user-123',
            refinement
        );

        console.log(`Confidence: ${suggestion.confidence}`);
        console.log(`Changes: ${suggestion.changes.length}`);

        // Apply if confidence is high enough
        if (suggestion.confidence > 0.7) {
            await editor.applyEdit(session.sessionId, 'user-123', suggestion, true);
            console.log('✓ Applied');
        } else {
            console.log('✗ Skipped (low confidence)');
        }
    }

    const summary = await editor.endSession(session.sessionId, 'user-123');

    console.log('\n=== Final Summary ===');
    console.log('Total refinements:', summary.totalEdits);
    console.log('Final content length:', summary.finalContent.length);

    return summary;
}

/**
 * Example 4: Content type specific editing
 */
export async function contentTypeEditingExample() {
    const editor = new ConversationalEditor();

    // Blog post editing
    const blogSession = await editor.startEditingSession(
        'blog-001',
        'Real estate investing can be profitable...',
        'user-456',
        'blog-post'
    );

    const blogSuggestion = await editor.processEditRequest(
        blogSession.sessionId,
        'user-456',
        'Add SEO keywords and improve readability'
    );

    console.log('Blog post suggestion:', blogSuggestion.rationale);

    // Social media editing
    const socialSession = await editor.startEditingSession(
        'social-001',
        'New listing alert! Beautiful home...',
        'user-456',
        'social-media'
    );

    const socialSuggestion = await editor.processEditRequest(
        socialSession.sessionId,
        'user-456',
        'Make this more engaging for Instagram with emojis'
    );

    console.log('Social media suggestion:', socialSuggestion.rationale);

    // Email editing
    const emailSession = await editor.startEditingSession(
        'email-001',
        'Hi [Name], I wanted to reach out...',
        'user-456',
        'email'
    );

    const emailSuggestion = await editor.processEditRequest(
        emailSession.sessionId,
        'user-456',
        'Make this more personalized and add a clear next step'
    );

    console.log('Email suggestion:', emailSuggestion.rationale);

    return {
        blog: blogSuggestion,
        social: socialSuggestion,
        email: emailSuggestion,
    };
}

/**
 * Example 5: Analyzing edit patterns
 */
export async function analyzeEditPatternsExample() {
    const editor = new ConversationalEditor();

    const session = await editor.startEditingSession(
        'listing-desc-001',
        'Beautiful 3-bedroom home in great neighborhood...',
        'user-789',
        'listing-description'
    );

    // Make several edits focusing on different aspects
    const edits = [
        'Improve the opening hook',
        'Add more details about the kitchen',
        'Enhance the neighborhood description',
        'Improve the opening hook again', // Repeated focus
        'Add call to action',
        'Refine the neighborhood description', // Repeated focus
    ];

    for (const edit of edits) {
        const suggestion = await editor.processEditRequest(session.sessionId, 'user-789', edit);
        await editor.applyEdit(session.sessionId, 'user-789', suggestion, true);
    }

    const summary = await editor.endSession(session.sessionId, 'user-789');

    console.log('\n=== Edit Pattern Analysis ===');
    console.log('Learnings from this session:');
    summary.learnings.forEach((learning) => {
        console.log(`\nPattern: ${learning.pattern}`);
        console.log(`Frequency: ${learning.frequency}`);
        console.log(`Context: ${learning.context}`);
        console.log(`Apply to future: ${learning.shouldApplyToFuture}`);
    });

    return summary;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('=== Example 1: Basic Editing ===');
    await basicEditingExample();

    console.log('\n\n=== Example 2: Rejecting Suggestions ===');
    await rejectSuggestionExample();

    console.log('\n\n=== Example 3: Iterative Refinement ===');
    await iterativeRefinementExample();

    console.log('\n\n=== Example 4: Content Type Editing ===');
    await contentTypeEditingExample();

    console.log('\n\n=== Example 5: Analyzing Edit Patterns ===');
    await analyzeEditPatternsExample();
}

// Run examples if this file is executed directly
if (require.main === module) {
    runAllExamples()
        .then(() => {
            console.log('\n✓ All examples completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error running examples:', error);
            process.exit(1);
        });
}
