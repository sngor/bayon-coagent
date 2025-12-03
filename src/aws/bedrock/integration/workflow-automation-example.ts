/**
 * Workflow Automation System - Usage Examples
 * 
 * Examples demonstrating how to use the workflow automation system
 * for multi-step automated workflows.
 */

import {
    WorkflowAutomationEngine,
    WORKFLOW_TEMPLATES,
    type WorkflowTemplate,
    type WorkflowExecutionOptions,
} from './workflow-automation';

/**
 * Example 1: Execute a predefined workflow template
 * 
 * Use a built-in template to automate content creation and posting.
 */
export async function executeContentToSocialWorkflow(userId: string) {
    const engine = new WorkflowAutomationEngine();

    // Create workflow from template
    const workflow = await engine.createWorkflow(
        userId,
        WORKFLOW_TEMPLATES['content-to-social'],
        {
            topic: 'Spring Market Update',
            platform: 'facebook',
            targetAudience: 'first-time-buyers',
        }
    );

    console.log('Created workflow:', workflow.id);

    // Execute workflow with auto-approval
    const result = await engine.executeWorkflow(workflow.id, {
        autoApprove: true,
        notifyOnCompletion: true,
    });

    console.log('Workflow execution result:', result);
    console.log('Status:', result.status);
    console.log('Completed steps:', result.metrics.completedSteps);
    console.log('Total duration:', result.metrics.totalDuration, 'ms');

    return result;
}

/**
 * Example 2: Execute listing promotion campaign
 * 
 * Automate the entire listing promotion process from content
 * generation to scheduling.
 */
export async function executeListingCampaign(
    userId: string,
    listingData: any
) {
    const engine = new WorkflowAutomationEngine();

    // Create workflow with listing data
    const workflow = await engine.createWorkflow(
        userId,
        WORKFLOW_TEMPLATES['listing-campaign'],
        {
            listingId: listingData.id,
            address: listingData.address,
            price: listingData.price,
            features: listingData.features,
            images: listingData.images,
        }
    );

    console.log('Created listing campaign workflow:', workflow.id);

    // Execute workflow
    const result = await engine.executeWorkflow(workflow.id, {
        autoApprove: false, // Require manual approval for listing campaigns
        notifyOnCompletion: true,
    });

    if (result.status === 'completed') {
        console.log('Listing campaign successfully created!');
        console.log('Social posts scheduled:', result.steps.find(s => s.stepId === 'schedule-social-posts')?.output);
        console.log('Email campaign scheduled:', result.steps.find(s => s.stepId === 'schedule-email-campaign')?.output);
    } else if (result.status === 'paused') {
        console.log('Workflow paused for review');
    } else {
        console.error('Workflow failed:', result.error);
    }

    return result;
}

/**
 * Example 3: Create custom workflow template
 * 
 * Define a custom workflow for specific business needs.
 */
export async function createCustomWorkflow(userId: string) {
    const engine = new WorkflowAutomationEngine();

    // Define custom template
    const customTemplate: WorkflowTemplate = {
        id: 'custom-newsletter',
        name: 'Monthly Newsletter Workflow',
        description: 'Generate and send monthly newsletter',
        steps: [
            {
                id: 'gather-content',
                type: 'analyze',
                name: 'Gather Content',
                description: 'Collect top performing content from last month',
                config: {
                    timeframe: '30days',
                    contentTypes: ['blog', 'social', 'market-update'],
                },
            },
            {
                id: 'generate-newsletter',
                type: 'generate',
                name: 'Generate Newsletter',
                description: 'Create newsletter from top content',
                config: {
                    contentType: 'newsletter',
                    sections: ['highlights', 'market-update', 'tips'],
                },
                dependencies: ['gather-content'],
            },
            {
                id: 'review-newsletter',
                type: 'review',
                name: 'Review Newsletter',
                description: 'Quality check newsletter',
                config: {
                    checks: ['grammar', 'links', 'images'],
                },
                dependencies: ['generate-newsletter'],
            },
            {
                id: 'send-newsletter',
                type: 'post',
                name: 'Send Newsletter',
                description: 'Send newsletter to subscribers',
                config: {
                    platform: 'email',
                    segmentation: 'all-subscribers',
                },
                dependencies: ['review-newsletter'],
            },
            {
                id: 'track-performance',
                type: 'analyze',
                name: 'Track Performance',
                description: 'Monitor newsletter performance',
                config: {
                    metrics: ['open-rate', 'click-rate', 'conversions'],
                    duration: '7days',
                },
                dependencies: ['send-newsletter'],
                optional: true,
            },
        ],
        qualityGates: [
            {
                id: 'link-validation',
                name: 'Validate All Links',
                type: 'validation',
                condition: {},
                action: 'pause',
            },
        ],
        defaultVariables: {
            frequency: 'monthly',
            timezone: 'America/New_York',
        },
    };

    // Create and execute workflow
    const workflow = await engine.createWorkflow(
        userId,
        customTemplate,
        {
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear(),
        }
    );

    const result = await engine.executeWorkflow(workflow.id, {
        notifyOnCompletion: true,
    });

    return result;
}

/**
 * Example 4: Handle workflow with quality gates
 * 
 * Execute workflow that may pause for quality checks.
 */
export async function executeWorkflowWithQualityGates(userId: string) {
    const engine = new WorkflowAutomationEngine();

    const workflow = await engine.createWorkflow(
        userId,
        WORKFLOW_TEMPLATES['listing-campaign']
    );

    // Execute workflow (may pause at quality gates)
    const result = await engine.executeWorkflow(workflow.id, {
        skipQualityGates: false, // Don't skip quality gates
    });

    if (result.status === 'paused') {
        console.log('Workflow paused at quality gate');
        console.log('Quality gates failed:', result.metrics.qualityGatesFailed);

        // User reviews and approves
        // ... manual review process ...

        // Resume workflow
        const resumeResult = await engine.resumeWorkflow(workflow.id, {
            autoApprove: true,
        });

        console.log('Workflow resumed:', resumeResult.status);
        return resumeResult;
    }

    return result;
}

/**
 * Example 5: Monitor workflow execution
 * 
 * Track workflow progress and handle errors.
 */
export async function monitorWorkflowExecution(userId: string) {
    const engine = new WorkflowAutomationEngine();

    // List all workflows for user
    const workflows = await engine.listWorkflows(userId);
    console.log('Total workflows:', workflows.length);

    // Filter by status
    const activeWorkflows = await engine.listWorkflows(userId, 'active');
    console.log('Active workflows:', activeWorkflows.length);

    const pausedWorkflows = await engine.listWorkflows(userId, 'paused');
    console.log('Paused workflows:', pausedWorkflows.length);

    // Get specific workflow
    if (workflows.length > 0) {
        const workflow = await engine.getWorkflow(workflows[0].id);
        console.log('Workflow details:', workflow);

        // Check step statuses
        workflow?.steps.forEach(step => {
            console.log(`Step ${step.id}: ${step.status}`);
            if (step.error) {
                console.error(`  Error: ${step.error}`);
            }
        });
    }
}

/**
 * Example 6: Pause and resume workflow
 * 
 * Manually control workflow execution.
 */
export async function pauseAndResumeWorkflow(
    userId: string,
    workflowId: string
) {
    const engine = new WorkflowAutomationEngine();

    // Pause workflow
    await engine.pauseWorkflow(workflowId);
    console.log('Workflow paused');

    // ... do something else ...

    // Resume workflow
    const result = await engine.resumeWorkflow(workflowId, {
        autoApprove: true,
    });

    console.log('Workflow resumed:', result.status);
    return result;
}

/**
 * Example 7: Cancel workflow
 * 
 * Stop workflow execution.
 */
export async function cancelWorkflow(
    userId: string,
    workflowId: string
) {
    const engine = new WorkflowAutomationEngine();

    await engine.cancelWorkflow(workflowId);
    console.log('Workflow cancelled');
}

/**
 * Example 8: Execute market analysis workflow
 * 
 * Generate comprehensive market analysis report.
 */
export async function executeMarketAnalysisWorkflow(
    userId: string,
    marketData: any
) {
    const engine = new WorkflowAutomationEngine();

    const workflow = await engine.createWorkflow(
        userId,
        WORKFLOW_TEMPLATES['market-analysis-report'],
        {
            location: marketData.location,
            timeframe: marketData.timeframe || '90days',
            propertyTypes: marketData.propertyTypes || ['single-family', 'condo'],
        }
    );

    const result = await engine.executeWorkflow(workflow.id, {
        autoApprove: true,
        notifyOnCompletion: true,
    });

    if (result.status === 'completed') {
        console.log('Market analysis report generated!');
        const reportStep = result.steps.find(s => s.stepId === 'generate-report');
        console.log('Report:', reportStep?.output);
    }

    return result;
}

/**
 * Example 9: Workflow with retry configuration
 * 
 * Handle transient failures with automatic retries.
 */
export async function executeWorkflowWithRetries(userId: string) {
    const engine = new WorkflowAutomationEngine();

    const templateWithRetries: WorkflowTemplate = {
        id: 'resilient-workflow',
        name: 'Resilient Content Workflow',
        description: 'Workflow with retry logic for reliability',
        steps: [
            {
                id: 'generate-content',
                type: 'generate',
                name: 'Generate Content',
                description: 'Generate content with retries',
                config: {
                    contentType: 'blog-post',
                },
                retryConfig: {
                    maxAttempts: 3,
                    backoffMs: 1000,
                    backoffMultiplier: 2,
                },
            },
            {
                id: 'post-content',
                type: 'post',
                name: 'Post Content',
                description: 'Post content with retries',
                config: {
                    platform: 'blog',
                },
                dependencies: ['generate-content'],
                retryConfig: {
                    maxAttempts: 5,
                    backoffMs: 2000,
                    backoffMultiplier: 1.5,
                },
            },
        ],
        qualityGates: [],
    };

    const workflow = await engine.createWorkflow(
        userId,
        templateWithRetries
    );

    const result = await engine.executeWorkflow(workflow.id);

    console.log('Workflow with retries completed');
    console.log('Failed steps:', result.metrics.failedSteps);

    return result;
}

/**
 * Example 10: Workflow with optional steps
 * 
 * Execute workflow where some steps can fail without stopping execution.
 */
export async function executeWorkflowWithOptionalSteps(userId: string) {
    const engine = new WorkflowAutomationEngine();

    const templateWithOptionalSteps: WorkflowTemplate = {
        id: 'flexible-workflow',
        name: 'Flexible Content Workflow',
        description: 'Workflow with optional analytics steps',
        steps: [
            {
                id: 'generate-content',
                type: 'generate',
                name: 'Generate Content',
                description: 'Generate content',
                config: {
                    contentType: 'social-post',
                },
            },
            {
                id: 'post-content',
                type: 'post',
                name: 'Post Content',
                description: 'Post to social media',
                config: {
                    platform: 'facebook',
                },
                dependencies: ['generate-content'],
            },
            {
                id: 'analyze-engagement',
                type: 'analyze',
                name: 'Analyze Engagement',
                description: 'Track engagement metrics',
                config: {
                    metrics: ['likes', 'shares', 'comments'],
                },
                dependencies: ['post-content'],
                optional: true, // Won't stop workflow if it fails
            },
            {
                id: 'generate-insights',
                type: 'analyze',
                name: 'Generate Insights',
                description: 'Generate performance insights',
                config: {},
                dependencies: ['analyze-engagement'],
                optional: true, // Won't stop workflow if it fails
            },
        ],
        qualityGates: [],
    };

    const workflow = await engine.createWorkflow(
        userId,
        templateWithOptionalSteps
    );

    const result = await engine.executeWorkflow(workflow.id);

    console.log('Workflow completed');
    console.log('Completed steps:', result.metrics.completedSteps);
    console.log('Skipped steps:', result.metrics.skippedSteps);

    return result;
}

