/**
 * Refinement Learning System - Usage Examples
 * 
 * Demonstrates how to use the refinement learning system to track patterns
 * from editing sessions and apply them to improve future content generation.
 */

import {
    ConversationalEditor,
    RefinementLearningSystem,
} from './index';

/**
 * Example 1: Complete Learning Workflow
 * 
 * Shows the full cycle from editing to learning to application
 */
export async function completeLearningWorkflow() {
    const editor = new ConversationalEditor();
    const learningSystem = new RefinementLearningSystem();

    const userId = 'user-456';
    const contentType = 'blog-post';

    // 1. User creates and edits content
    console.log('Step 1: Creating editing session...');
    const session = await editor.startEditingSession(
        'blog-post-123',
        `The real estate market is changing. Buyers are looking for homes with modern amenities.
        Sellers need to price competitively. Contact us for more information.`,
        userId,
        contentType
    );

    // 2. User makes multiple refinements
    console.log('Step 2: Processing edit requests...');

    const suggestion1 = await editor.processEditRequest(
        session.sessionId,
        userId,
        'Add specific data and statistics to support the claims'
    );
    await editor.applyEdit(session.sessionId, userId, suggestion1, true);

    const suggestion2 = await editor.processEditRequest(
        session.sessionId,
        userId,
        'Make the opening more engaging with a question'
    );
    await editor.applyEdit(session.sessionId, userId, suggestion2, true);

    const suggestion3 = await editor.processEditRequest(
        session.sessionId,
        userId,
        'Strengthen the call-to-action at the end'
    );
    await editor.applyEdit(session.sessionId, userId, suggestion3, true);

    // 3. End session and get summary
    console.log('Step 3: Ending session and generating summary...');
    const summary = await editor.endSession(session.sessionId, userId);
    console.log(`Made ${summary.totalEdits} edits in ${summary.duration}ms`);

    // 4. Track patterns from this session
    console.log('Step 4: Tracking refinement patterns...');
    const patterns = await learningSystem.trackRefinementPatterns(session, summary);
    console.log(`Identified ${patterns.length} patterns:`);
    patterns.forEach(pattern => {
        console.log(`  - ${pattern.pattern} (frequency: ${pattern.frequency})`);
    });

    // 5. Analyze quality improvements
    console.log('Step 5: Analyzing quality improvements...');
    const analysis = await learningSystem.analyzeQualityImprovements(session);
    console.log(`Overall quality gain: ${(analysis.overallQualityGain * 100).toFixed(0)}%`);
    console.log('Quality improvements:');
    analysis.qualityImprovements.forEach(imp => {
        console.log(`  - ${imp.metric}: ${imp.before} → ${imp.after} (${imp.significance})`);
    });

    // 6. Get recommendations
    console.log('Step 6: Recommendations for future content:');
    analysis.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
    });

    // 7. Apply learnings to new content
    console.log('Step 7: Applying learnings to new content...');
    const newContent = `The housing market continues to evolve. 
    Modern buyers have different priorities. 
    Reach out to learn more about current opportunities.`;

    const result = await learningSystem.applyLearnedPatterns(
        userId,
        contentType,
        newContent
    );

    console.log(`Applied ${result.appliedPatterns.length} learned patterns`);
    console.log(`Confidence boost: ${(result.confidenceBoost * 100).toFixed(0)}%`);
    console.log(`Expected quality improvement: ${(result.estimatedQualityImprovement * 100).toFixed(0)}%`);

    return {
        session,
        summary,
        patterns,
        analysis,
        applicationResult: result,
    };
}

/**
 * Example 2: Pattern Evolution Over Time
 * 
 * Shows how patterns become more refined with multiple sessions
 */
export async function demonstratePatternEvolution() {
    const learningSystem = new RefinementLearningSystem();
    const userId = 'user-456';
    const contentType = 'blog-post';

    // Get all patterns for this user and content type
    const patterns = await learningSystem.getRelevantPatterns(userId, contentType);

    console.log(`Found ${patterns.length} learned patterns:`);
    console.log('');

    patterns.forEach((pattern, index) => {
        console.log(`Pattern ${index + 1}: ${pattern.pattern}`);
        console.log(`  Description: ${pattern.description}`);
        console.log(`  Frequency: ${pattern.frequency} times`);
        console.log(`  Quality Impact: ${(pattern.qualityImpact * 100).toFixed(0)}%`);
        console.log(`  Confidence: ${(pattern.confidence * 100).toFixed(0)}%`);
        console.log(`  Should apply to future: ${pattern.shouldApplyToFuture}`);
        console.log(`  Examples: ${pattern.examples.length}`);
        console.log('');
    });

    return patterns;
}

/**
 * Example 3: Quality Metrics Deep Dive
 * 
 * Analyzes specific quality metrics from an editing session
 */
export async function analyzeQualityMetrics(sessionId: string, userId: string) {
    const editor = new ConversationalEditor();
    const learningSystem = new RefinementLearningSystem();

    // Get the session (in practice, you'd retrieve this from storage)
    // For this example, we'll assume we have the session object
    console.log('Analyzing quality metrics for session:', sessionId);

    // This would be retrieved from storage in a real implementation
    // const session = await getSessionFromStorage(sessionId, userId);
    // const analysis = await learningSystem.analyzeQualityImprovements(session);

    // Example output structure:
    console.log('Quality Improvements:');
    console.log('');

    // Word count changes
    console.log('1. Word Count:');
    console.log('   Before: 150 words');
    console.log('   After: 200 words');
    console.log('   Change: +33% (medium significance)');
    console.log('   Interpretation: Content was expanded with more detail');
    console.log('');

    // Clarity improvements
    console.log('2. Clarity:');
    console.log('   Before: 0.65');
    console.log('   After: 0.85');
    console.log('   Improvement: +31% (high significance)');
    console.log('   Interpretation: Content became significantly clearer');
    console.log('');

    // Structure improvements
    console.log('3. Structure:');
    console.log('   Before: 8 structural elements');
    console.log('   After: 12 structural elements');
    console.log('   Improvement: +50% (high significance)');
    console.log('   Interpretation: Better organization with more sections');
    console.log('');

    console.log('Overall Quality Gain: 38%');
}

/**
 * Example 4: Integration with Content Generation
 * 
 * Shows how to integrate learning with content generation
 */
export async function generateImprovedContent(
    userId: string,
    contentType: string,
    prompt: string
) {
    const learningSystem = new RefinementLearningSystem();

    console.log('Generating content with learned patterns...');
    console.log(`Prompt: ${prompt}`);
    console.log('');

    // Step 1: Generate initial content (using your existing generation logic)
    const initialContent = await mockGenerateContent(prompt);
    console.log('Initial content generated');
    console.log('');

    // Step 2: Get relevant patterns
    const patterns = await learningSystem.getRelevantPatterns(userId, contentType);
    console.log(`Found ${patterns.length} relevant patterns`);
    console.log('');

    // Step 3: Apply learned patterns
    const result = await learningSystem.applyLearnedPatterns(
        userId,
        contentType,
        initialContent
    );

    console.log('Learning Application Results:');
    console.log(`  Applied patterns: ${result.appliedPatterns.length}`);
    result.appliedPatterns.forEach(patternId => {
        const pattern = patterns.find(p => p.patternId === patternId);
        if (pattern) {
            console.log(`    - ${pattern.pattern}`);
        }
    });
    console.log('');

    console.log(`  Skipped patterns: ${result.skippedPatterns.length}`);
    result.skippedPatterns.forEach(patternId => {
        const pattern = patterns.find(p => p.patternId === patternId);
        if (pattern) {
            console.log(`    - ${pattern.pattern} (not relevant to this content)`);
        }
    });
    console.log('');

    console.log(`  Confidence boost: ${(result.confidenceBoost * 100).toFixed(0)}%`);
    console.log(`  Expected quality improvement: ${(result.estimatedQualityImprovement * 100).toFixed(0)}%`);
    console.log('');

    // In a real implementation, you would use the patterns to modify the content
    // For now, we just return the initial content with metadata
    return {
        content: initialContent,
        appliedPatterns: result.appliedPatterns,
        qualityBoost: result.estimatedQualityImprovement,
    };
}

/**
 * Example 5: Pattern-Based Content Recommendations
 * 
 * Uses learned patterns to provide recommendations before generation
 */
export async function getContentRecommendations(
    userId: string,
    contentType: string
) {
    const learningSystem = new RefinementLearningSystem();

    console.log('Getting content recommendations based on learned patterns...');
    console.log('');

    // Get patterns
    const patterns = await learningSystem.getRelevantPatterns(userId, contentType);

    // Filter high-impact patterns
    const highImpactPatterns = patterns.filter(
        p => p.qualityImpact > 0.7 && p.confidence > 0.7 && p.shouldApplyToFuture
    );

    console.log('Recommendations for your next content:');
    console.log('');

    if (highImpactPatterns.length === 0) {
        console.log('No specific recommendations yet. Create and edit more content to build your pattern library.');
        return [];
    }

    const recommendations = highImpactPatterns.map((pattern, index) => {
        const recommendation = {
            priority: index + 1,
            pattern: pattern.pattern,
            description: pattern.description,
            impact: `${(pattern.qualityImpact * 100).toFixed(0)}% quality improvement`,
            confidence: `${(pattern.confidence * 100).toFixed(0)}% confidence`,
            frequency: `Applied ${pattern.frequency} times`,
            examples: pattern.examples.length,
        };

        console.log(`${recommendation.priority}. ${recommendation.pattern}`);
        console.log(`   ${recommendation.description}`);
        console.log(`   Impact: ${recommendation.impact}`);
        console.log(`   Confidence: ${recommendation.confidence}`);
        console.log(`   History: ${recommendation.frequency}`);
        console.log('');

        return recommendation;
    });

    return recommendations;
}

/**
 * Mock content generation function
 * In a real implementation, this would call your AI generation service
 */
async function mockGenerateContent(prompt: string): Promise<string> {
    return `Generated content based on: ${prompt}
    
This is a sample blog post about real estate. It includes relevant information
and follows best practices for content creation.`;
}

/**
 * Example 6: Continuous Learning Loop
 * 
 * Demonstrates the continuous improvement cycle
 */
export async function demonstrateContinuousLearning() {
    console.log('=== Continuous Learning Loop ===');
    console.log('');

    const userId = 'user-456';
    const contentType = 'blog-post';

    // Iteration 1: First content
    console.log('Iteration 1: First content generation');
    console.log('  - No patterns yet');
    console.log('  - User edits: Add data, improve clarity, strengthen CTA');
    console.log('  - Patterns learned: 3');
    console.log('');

    // Iteration 2: Second content
    console.log('Iteration 2: Second content generation');
    console.log('  - Applied 2 patterns from iteration 1');
    console.log('  - User edits: Adjust tone, add examples');
    console.log('  - Patterns learned: 2 new, 2 reinforced');
    console.log('');

    // Iteration 3: Third content
    console.log('Iteration 3: Third content generation');
    console.log('  - Applied 4 patterns (confidence increased)');
    console.log('  - User edits: Minor tweaks only');
    console.log('  - Patterns learned: 1 new, 4 reinforced');
    console.log('');

    // Iteration 4: Fourth content
    console.log('Iteration 4: Fourth content generation');
    console.log('  - Applied 5 patterns (high confidence)');
    console.log('  - User edits: Minimal changes needed');
    console.log('  - Quality improvement: 45% vs iteration 1');
    console.log('');

    console.log('Result: Content quality improves with each iteration');
    console.log('        Edit time decreases as patterns are learned');
    console.log('        User satisfaction increases');
}

// Export all examples
export const examples = {
    completeLearningWorkflow,
    demonstratePatternEvolution,
    analyzeQualityMetrics,
    generateImprovedContent,
    getContentRecommendations,
    demonstrateContinuousLearning,
};
