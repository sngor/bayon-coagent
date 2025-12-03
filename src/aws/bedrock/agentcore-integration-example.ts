/**
 * AgentCore Integration - Usage Examples
 * 
 * This file demonstrates how to use the enhanced AgentCore system
 * with all integrated components.
 */

import { getEnhancedAgentCore } from './agentcore-integration';
import { createWorkerTask } from './worker-protocol';

/**
 * Example 1: Basic Task Execution with Full Enhancement Pipeline
 */
export async function example1_BasicTaskExecution() {
    const enhancedCore = getEnhancedAgentCore();

    // Create a task
    const task = createWorkerTask({
        type: 'content-generator',
        description: 'Generate a blog post about market trends',
        input: {
            topic: 'Real Estate Market Trends 2024',
            tone: 'professional',
            length: 'medium',
        },
        userId: 'user_123',
    });

    // Execute with full enhancement pipeline
    // This will:
    // 1. Add to priority queue
    // 2. Route using adaptive router
    // 3. Apply user preferences
    // 4. Load long-term memory
    // 5. Execute task
    // 6. Run quality assurance
    // 7. Track performance and costs
    // 8. Persist memory
    // 9. Check for handoff opportunities
    const result = await enhancedCore.executeTask(task);

    console.log('Task completed:', result);
}

/**
 * Example 2: Collaborative Multi-Strand Workflow
 */
export async function example2_CollaborativeWorkflow() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Create a complex task that requires multiple strands
    const analysisTask = createWorkerTask({
        type: 'data-analyst',
        description: 'Analyze market data for investment opportunities',
        input: {
            location: 'San Francisco, CA',
            budget: 1000000,
        },
        userId: 'user_123',
    });

    // Execute analysis
    const analysisResult = await enhancedCore.executeTask(analysisTask);

    // The handoff manager will automatically identify that content generation is needed
    // and create a handoff to the content-generator strand

    // Listen for handoff events
    enhancedCore.on('handoff-opportunity', async (taskId, nextTask) => {
        console.log('Handoff opportunity detected:', taskId, nextTask);

        // Execute the next task
        const contentResult = await enhancedCore.executeTask(nextTask);
        console.log('Content generated after handoff:', contentResult);
    });
}

/**
 * Example 3: Proactive Intelligence and Suggestions
 */
export async function example3_ProactiveIntelligence() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Detect opportunities for a user
    const opportunities = await components.opportunityDetector.detectOpportunities(
        'user_123',
        {
            // Market data would come from external sources
            recentSales: [],
            priceChanges: [],
            newListings: [],
        },
        {
            // Agent profile
            specialization: 'luxury-homes',
            location: 'San Francisco, CA',
            expertise: ['high-end-properties', 'investment-properties'],
        }
    );

    // Listen for proactive suggestions
    enhancedCore.on('proactive-suggestions', (opportunity, recommendations) => {
        console.log('Proactive opportunity detected:', opportunity);
        console.log('Recommendations:', recommendations);
    });

    // Analyze trends
    const trends = await components.trendAnalyzer.analyzeTrends(
        [], // Market data
        '30d'
    );

    console.log('Market trends:', trends);
}

/**
 * Example 4: Multi-Modal Content Processing
 */
export async function example4_MultiModalProcessing() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Analyze a property image
    const imageAnalysis = await components.imageAnalysisStrand.analyzeImage(
        'https://example.com/property.jpg',
        'suggestions'
    );

    console.log('Image analysis:', imageAnalysis);

    // Generate a video script
    const videoScript = await components.videoScriptGenerator.generateScript(
        'Property Tour: Luxury Home in San Francisco',
        180, // 3 minutes
        {
            platform: 'youtube',
            tone: 'professional',
            includeCallToAction: true,
        }
    );

    console.log('Video script:', videoScript);

    // Create audio content
    const audioContent = await components.audioContentCreator.generateAudioScript(
        'Market Update Podcast Episode',
        {
            duration: 600, // 10 minutes
            style: 'conversational',
            includeIntro: true,
            includeOutro: true,
        }
    );

    console.log('Audio content:', audioContent);

    // Check cross-modal consistency
    const consistencyCheck = await components.crossModalChecker.checkConsistency([
        { type: 'text', content: 'Blog post content...' },
        { type: 'video', content: videoScript },
        { type: 'audio', content: audioContent },
    ]);

    console.log('Consistency check:', consistencyCheck);
}

/**
 * Example 5: Quality Assurance Pipeline
 */
export async function example5_QualityAssurance() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    const content = `
        This beautiful 3-bedroom home in San Francisco offers stunning views
        and modern amenities. Perfect for families looking for a spacious home
        in a great neighborhood.
    `;

    // Run comprehensive quality checks
    const qaResult = await components.qualityAssurance.validateContent(
        content,
        ['factual', 'compliance', 'brand', 'seo']
    );

    console.log('Quality assurance result:', qaResult);

    // Run specific checks
    const factCheck = await components.factChecker.checkFacts(content);
    console.log('Fact check:', factCheck);

    const complianceCheck = await components.complianceValidator.validateCompliance(
        content,
        {
            fairHousing: true,
            discriminatoryLanguage: true,
            legalCompliance: true,
        }
    );
    console.log('Compliance check:', complianceCheck);

    const seoCheck = await components.seoOptimizer.analyzeSEO(
        content,
        ['san francisco real estate', 'family homes', '3 bedroom homes']
    );
    console.log('SEO analysis:', seoCheck);
}

/**
 * Example 6: Performance Analytics and Monitoring
 */
export async function example6_PerformanceAnalytics() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Get performance analytics
    const analytics = await components.performanceTracker.getAnalytics({
        strandId: 'strand_123',
        timeframe: '7d',
    });

    console.log('Performance analytics:', analytics);

    // Get cost breakdown
    const costs = await components.costMonitor.calculateCosts(
        'strand',
        '30d'
    );

    console.log('Cost breakdown:', costs);

    // Track ROI
    const roi = await components.roiTracker.calculateROI(
        'user_123',
        '30d'
    );

    console.log('ROI metrics:', roi);

    // Listen for cost alerts
    components.costMonitor.on('cost-alert', (alert) => {
        console.log('Cost alert:', alert);
    });
}

/**
 * Example 7: Adaptive Routing and Fallbacks
 */
export async function example7_AdaptiveRouting() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Create a task
    const task = createWorkerTask({
        type: 'content-generator',
        description: 'Generate complex market analysis',
        input: {
            complexity: 'high',
            requiresResearch: true,
        },
        userId: 'user_123',
    });

    // Route with adaptive router
    const routingDecision = await components.adaptiveRouter.routeTask(
        task,
        enhancedCore.getAgentCore().getAllStrands(),
        {
            preferHighQuality: true,
            maxWaitTime: 5000,
        }
    );

    console.log('Routing decision:', routingDecision);

    // If routing fails, fallback manager handles it
    enhancedCore.on('fallback-executed', (context) => {
        console.log('Fallback executed:', context);
    });

    // Load balancing across strands
    const loadStatus = await components.loadBalancer.getLoadStatus();
    console.log('Load status:', loadStatus);
}

/**
 * Example 8: Collaborative Editing
 */
export async function example8_CollaborativeEditing() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Start an editing session
    const session = await components.conversationalEditor.startEditingSession(
        'content_123',
        'Original blog post content...'
    );

    console.log('Editing session started:', session);

    // Process edit requests
    const editSuggestion = await components.conversationalEditor.processEditRequest(
        session.sessionId,
        'Make the tone more professional and add statistics'
    );

    console.log('Edit suggestion:', editSuggestion);

    // Apply the edit
    const updatedContent = await components.conversationalEditor.applyEdit(
        session.sessionId,
        editSuggestion,
        true
    );

    console.log('Updated content:', updatedContent);

    // Version control
    const versions = await components.versionControl.getHistory('content_123');
    console.log('Version history:', versions);

    // Style transfer
    const transferredContent = await components.styleTransfer.transferStyle(
        'Original content...',
        {
            targetTone: 'casual',
            targetFormat: 'social-media',
            preserveMessage: true,
        }
    );

    console.log('Transferred content:', transferredContent);
}

/**
 * Example 9: Integration and Automation
 */
export async function example9_IntegrationAutomation() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Schedule social media post
    const scheduledPost = await components.socialMediaScheduler.schedulePost(
        {
            content: 'Check out this amazing property!',
            imageUrl: 'https://example.com/property.jpg',
            platforms: ['facebook', 'instagram', 'twitter'],
        },
        new Date(Date.now() + 3600000), // 1 hour from now
        ['facebook', 'instagram']
    );

    console.log('Post scheduled:', scheduledPost);

    // Get optimal posting time
    const optimalTime = await components.socialMediaScheduler.getOptimalTime(
        'user_123',
        'instagram',
        'property-listing'
    );

    console.log('Optimal posting time:', optimalTime);

    // Connect to CRM
    const clientData = await components.crmConnector.getClientData('client_123');
    console.log('Client data:', clientData);

    // Personalize content with CRM data
    const personalizedContent = await components.crmConnector.personalizeContent(
        'Hello {firstName}, here is a property that matches your criteria...',
        clientData
    );

    console.log('Personalized content:', personalizedContent);

    // Generate email campaign
    const campaign = await components.campaignGenerator.generateDripCampaign(
        'user_123',
        {
            campaignType: 'nurture',
            duration: 30,
            frequency: 'weekly',
        }
    );

    console.log('Email campaign:', campaign);

    // Workflow automation
    const workflow = await components.workflowAutomation.createWorkflow({
        name: 'Content Creation to Publication',
        steps: [
            { type: 'generate-content', config: {} },
            { type: 'quality-check', config: {} },
            { type: 'schedule-post', config: {} },
        ],
        trigger: 'manual',
    });

    console.log('Workflow created:', workflow);
}

/**
 * Example 10: Competitive Intelligence
 */
export async function example10_CompetitiveIntelligence() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Monitor competitors
    const competitorActivity = await components.competitorMonitor.analyzeCompetitor(
        'competitor_123',
        {
            contentTypes: ['blog', 'social-media', 'listings'],
            timeframe: '30d',
        }
    );

    console.log('Competitor activity:', competitorActivity);

    // Analyze gaps
    const gaps = await components.gapAnalyzer.analyzeGaps(
        'user_123',
        ['competitor_1', 'competitor_2', 'competitor_3']
    );

    console.log('Competitive gaps:', gaps);

    // Generate differentiation strategy
    const strategy = await components.differentiationEngine.generateStrategy(
        'user_123',
        {
            competitors: ['competitor_1', 'competitor_2'],
            strengths: ['local-expertise', 'luxury-market'],
            weaknesses: ['social-media-presence'],
        }
    );

    console.log('Differentiation strategy:', strategy);

    // Track benchmarks
    const benchmarks = await components.benchmarkTracker.compareToBenchmarks(
        'user_123',
        {
            metrics: ['engagement', 'reach', 'conversions'],
            timeframe: '30d',
        }
    );

    console.log('Benchmark comparison:', benchmarks);
}

/**
 * Example 11: Learning from User Feedback
 */
export async function example11_LearningFromFeedback() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // User provides feedback on generated content
    await components.preferenceEngine.recordFeedback('user_123', {
        contentId: 'content_123',
        rating: 4.5,
        edits: [
            { section: 'introduction', change: 'made more concise' },
            { section: 'conclusion', change: 'added call-to-action' },
        ],
        preferences: {
            tone: 'professional',
            length: 'concise',
            includeStatistics: true,
        },
    });

    // Get learned preferences
    const preferences = await components.preferenceEngine.getPreferences('user_123');
    console.log('Learned preferences:', preferences);

    // Apply preferences to new task
    const task = createWorkerTask({
        type: 'content-generator',
        description: 'Generate blog post',
        input: {},
        userId: 'user_123',
    });

    const enhancedTask = components.preferenceEngine.applyPreferences(task, preferences);
    console.log('Task with preferences applied:', enhancedTask);
}

/**
 * Example 12: Memory and Context Management
 */
export async function example12_MemoryManagement() {
    const enhancedCore = getEnhancedAgentCore();
    const components = enhancedCore.getComponents();

    // Persist strand memory
    await components.longTermMemory.persistMemory('strand_123', {
        workingMemory: {},
        knowledgeBase: {
            'user_preferences': { tone: 'professional', style: 'concise' },
            'successful_patterns': ['data-driven', 'storytelling'],
        },
        recentTasks: [],
        learnedPatterns: {},
    });

    // Retrieve memory
    const memory = await components.longTermMemory.retrieveMemory('strand_123');
    console.log('Retrieved memory:', memory);

    // Semantic search
    const searchResults = await components.semanticSearch.search(
        'luxury real estate marketing strategies',
        {
            limit: 10,
            threshold: 0.7,
        }
    );

    console.log('Semantic search results:', searchResults);

    // Consolidate old memories
    await components.longTermMemory.consolidateMemories(
        'strand_123',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    );
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('=== Example 1: Basic Task Execution ===');
    await example1_BasicTaskExecution();

    console.log('\n=== Example 2: Collaborative Workflow ===');
    await example2_CollaborativeWorkflow();

    console.log('\n=== Example 3: Proactive Intelligence ===');
    await example3_ProactiveIntelligence();

    console.log('\n=== Example 4: Multi-Modal Processing ===');
    await example4_MultiModalProcessing();

    console.log('\n=== Example 5: Quality Assurance ===');
    await example5_QualityAssurance();

    console.log('\n=== Example 6: Performance Analytics ===');
    await example6_PerformanceAnalytics();

    console.log('\n=== Example 7: Adaptive Routing ===');
    await example7_AdaptiveRouting();

    console.log('\n=== Example 8: Collaborative Editing ===');
    await example8_CollaborativeEditing();

    console.log('\n=== Example 9: Integration and Automation ===');
    await example9_IntegrationAutomation();

    console.log('\n=== Example 10: Competitive Intelligence ===');
    await example10_CompetitiveIntelligence();

    console.log('\n=== Example 11: Learning from Feedback ===');
    await example11_LearningFromFeedback();

    console.log('\n=== Example 12: Memory Management ===');
    await example12_MemoryManagement();
}
