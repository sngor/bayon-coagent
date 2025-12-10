/**
 * Example usage of WorkflowCompletionSummary component
 * 
 * This file demonstrates how to use the WorkflowCompletionSummary component
 * in different scenarios.
 */

'use client';

import { WorkflowCompletionSummary } from './workflow-completion-summary';
import { WorkflowInstance, WorkflowPreset, WorkflowStatus, WorkflowCategory } from '@/types/workflows';

// Example completed workflow instance
const exampleInstance: WorkflowInstance = {
    id: 'wf-123',
    userId: 'user-456',
    presetId: 'market-update-post',
    status: WorkflowStatus.COMPLETED,
    currentStepId: 'social-variants',
    completedSteps: ['market-insights', 'blog-post', 'social-variants'],
    skippedSteps: ['research-query'], // Optional step was skipped
    contextData: {
        trendData: { /* market data */ },
        blogPost: { /* generated blog post */ },
        socialPosts: { /* generated social posts */ },
    },
    startedAt: '2024-01-15T10:00:00Z',
    lastActiveAt: '2024-01-15T10:35:00Z',
    completedAt: '2024-01-15T10:35:00Z',
    actualMinutes: 35,
};

// Example workflow preset
const examplePreset: WorkflowPreset = {
    id: 'market-update-post',
    title: 'Market Update Post',
    description: 'Create content based on current market trends',
    category: WorkflowCategory.CONTENT_CREATION,
    tags: ['content', 'market', 'blog', 'social'],
    estimatedMinutes: 30,
    isRecommended: false,
    icon: 'TrendingUp',
    outcomes: [
        'Market trend analysis',
        'Research-backed insights',
        'Blog post draft',
        'Social media variants'
    ],
    steps: [
        {
            id: 'market-insights',
            title: 'Analyze Market Trends',
            description: 'Review current market data and trends',
            hubRoute: '/market/insights?tab=trends',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Identify the most relevant trends for your audience',
            tips: [
                'Look for surprising or counterintuitive data',
                'Focus on local market trends'
            ],
            completionCriteria: 'Trend data selected',
            contextOutputs: ['trendData']
        },
        {
            id: 'research-query',
            title: 'Deep Dive Research',
            description: 'Get AI-powered research on the trend',
            hubRoute: '/research/agent',
            estimatedMinutes: 5,
            isOptional: true,
            helpText: 'Add depth and credibility to your content',
            tips: [
                'Ask specific questions about the trend',
                'Request statistics and data points'
            ],
            completionCriteria: 'Research report generated',
            contextInputs: ['trendData'],
            contextOutputs: ['researchReport']
        },
        {
            id: 'blog-post',
            title: 'Write Blog Post',
            description: 'Generate a blog post about the market trend',
            hubRoute: '/studio/write?type=blog',
            estimatedMinutes: 10,
            isOptional: false,
            helpText: 'Turn data into engaging content',
            tips: [
                'Include specific data points',
                'Add a clear call-to-action'
            ],
            completionCriteria: 'Blog post generated and saved',
            contextInputs: ['trendData', 'researchReport'],
            contextOutputs: ['blogPost']
        },
        {
            id: 'social-variants',
            title: 'Create Social Posts',
            description: 'Generate social media versions of your content',
            hubRoute: '/studio/write?type=social',
            estimatedMinutes: 5,
            isOptional: true,
            helpText: 'Maximize reach across platforms',
            tips: [
                'Customize for each platform',
                'Include relevant hashtags'
            ],
            completionCriteria: 'Social posts generated',
            contextInputs: ['blogPost', 'trendData'],
            contextOutputs: ['socialPosts']
        }
    ]
};

/**
 * Example 1: Basic usage with content workflow
 */
export function ContentWorkflowCompletionExample() {
    const handleRestart = () => {
        console.log('Restarting workflow...');
        // Navigate to workflow start or create new instance
    };

    const handleViewInLibrary = () => {
        console.log('Navigating to library...');
        // Navigate to /library/content
    };

    return (
        <div className="container max-w-4xl mx-auto py-8">
            <WorkflowCompletionSummary
                instance={exampleInstance}
                preset={examplePreset}
                onRestartWorkflow={handleRestart}
                onViewInLibrary={handleViewInLibrary}
            />
        </div>
    );
}

/**
 * Example 2: Brand building workflow (no Library button)
 */
export function BrandWorkflowCompletionExample() {
    const brandInstance: WorkflowInstance = {
        ...exampleInstance,
        presetId: 'launch-your-brand',
        completedSteps: ['profile-setup', 'brand-audit', 'competitor-analysis', 'strategy-generation'],
        skippedSteps: [],
        actualMinutes: 42,
    };

    const brandPreset: WorkflowPreset = {
        id: 'launch-your-brand',
        title: 'Launch Your Brand',
        description: 'Build your online presence from the ground up',
        category: WorkflowCategory.BRAND_BUILDING,
        tags: ['onboarding', 'brand', 'profile', 'strategy'],
        estimatedMinutes: 45,
        isRecommended: true,
        icon: 'Rocket',
        outcomes: [
            'Complete professional profile',
            'NAP consistency audit',
            'Competitor analysis',
            'Personalized marketing strategy'
        ],
        steps: [
            {
                id: 'profile-setup',
                title: 'Set Up Your Profile',
                description: 'Create your professional profile with business details',
                hubRoute: '/brand/profile',
                estimatedMinutes: 15,
                isOptional: false,
                helpText: 'Your profile is the foundation of your online presence',
                tips: ['Use a professional headshot', 'Include all contact information'],
                completionCriteria: 'Profile saved with required fields',
                contextOutputs: ['profileData']
            },
            {
                id: 'brand-audit',
                title: 'Audit Your Presence',
                description: 'Check NAP consistency and import reviews',
                hubRoute: '/brand/audit',
                estimatedMinutes: 10,
                isOptional: false,
                helpText: 'Ensure your business information is consistent everywhere',
                tips: ['Fix any inconsistencies immediately'],
                completionCriteria: 'Audit completed',
                contextInputs: ['profileData'],
                contextOutputs: ['auditResults']
            },
            {
                id: 'competitor-analysis',
                title: 'Analyze Competitors',
                description: 'Discover and track your main competitors',
                hubRoute: '/brand/competitors',
                estimatedMinutes: 10,
                isOptional: false,
                helpText: 'Know who you\'re competing against',
                tips: ['Add 3-5 main competitors'],
                completionCriteria: 'At least one competitor added',
                contextInputs: ['profileData'],
                contextOutputs: ['competitors']
            },
            {
                id: 'strategy-generation',
                title: 'Generate Your Strategy',
                description: 'Get a personalized 3-step marketing plan',
                hubRoute: '/brand/strategy',
                estimatedMinutes: 10,
                isOptional: false,
                helpText: 'Your AI-powered roadmap to success',
                tips: ['Review all three steps carefully'],
                completionCriteria: 'Strategy generated and saved',
                contextInputs: ['profileData', 'auditResults', 'competitors'],
                contextOutputs: ['strategy']
            }
        ]
    };

    const handleRestart = () => {
        console.log('Restarting brand workflow...');
    };

    return (
        <div className="container max-w-4xl mx-auto py-8">
            <WorkflowCompletionSummary
                instance={brandInstance}
                preset={brandPreset}
                onRestartWorkflow={handleRestart}
            // No onViewInLibrary for brand workflows
            />
        </div>
    );
}

/**
 * Example 3: Workflow with multiple skipped steps
 */
export function WorkflowWithSkippedStepsExample() {
    const instanceWithSkips: WorkflowInstance = {
        ...exampleInstance,
        completedSteps: ['market-insights', 'blog-post'],
        skippedSteps: ['research-query', 'social-variants'], // Both optional steps skipped
        actualMinutes: 20,
    };

    const handleRestart = () => {
        console.log('Restarting workflow...');
    };

    const handleViewInLibrary = () => {
        console.log('Navigating to library...');
    };

    return (
        <div className="container max-w-4xl mx-auto py-8">
            <WorkflowCompletionSummary
                instance={instanceWithSkips}
                preset={examplePreset}
                onRestartWorkflow={handleRestart}
                onViewInLibrary={handleViewInLibrary}
            />
        </div>
    );
}

/**
 * Example 4: Integration with workflow context
 */
export function WorkflowCompletionWithContextExample() {
    // This would typically come from useWorkflowContext or similar
    const instance = exampleInstance;
    const preset = examplePreset;

    const handleRestart = async () => {
        // Call server action to create new instance
        // const newInstance = await restartWorkflow(instance.presetId);
        // Navigate to first step
        // router.push(`/workflows/${newInstance.id}`);
    };

    const handleViewInLibrary = () => {
        // Navigate to library with filter
        // router.push('/library/content?workflow=' + instance.id);
    };

    return (
        <div className="container max-w-4xl mx-auto py-8">
            <WorkflowCompletionSummary
                instance={instance}
                preset={preset}
                onRestartWorkflow={handleRestart}
                onViewInLibrary={handleViewInLibrary}
                className="animate-in fade-in-50 duration-500"
            />
        </div>
    );
}
