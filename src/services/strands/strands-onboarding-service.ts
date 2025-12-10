/**
 * Strands AI Onboarding Service
 * 
 * Provides specialized onboarding for Strands AI capabilities
 * Introduces users to enhanced AI features and workflows
 */

import { z } from 'zod';
import { getRepository } from '@/aws/dynamodb/repository';

// Strands onboarding step types
export const StrandsOnboardingStepSchema = z.enum([
    'introduction',
    'enhanced-research',
    'content-studio',
    'listing-optimization',
    'market-intelligence',
    'workflow-orchestration',
    'brand-strategy',
    'image-analysis',
    'testing-validation',
    'completion'
]);

// Strands onboarding state
export const StrandsOnboardingStateSchema = z.object({
    userId: z.string(),
    currentStep: StrandsOnboardingStepSchema,
    completedSteps: z.array(StrandsOnboardingStepSchema),
    isComplete: z.boolean().default(false),
    startedAt: z.string(),
    completedAt: z.string().optional(),
    lastAccessedAt: z.string(),

    // Feature usage tracking
    featuresUsed: z.object({
        enhancedResearch: z.boolean().default(false),
        contentStudio: z.boolean().default(false),
        listingOptimization: z.boolean().default(false),
        marketIntelligence: z.boolean().default(false),
        workflowOrchestration: z.boolean().default(false),
        brandStrategy: z.boolean().default(false),
        imageAnalysis: z.boolean().default(false),
    }).default({}),

    // Performance metrics
    metrics: z.object({
        totalTestsRun: z.number().default(0),
        averageQualityScore: z.number().default(0),
        totalWorkflowsExecuted: z.number().default(0),
        favoriteFeatures: z.array(z.string()).default([]),
    }).default({}),

    // User preferences
    preferences: z.object({
        preferredContentTone: z.string().default('professional'),
        defaultTargetAudience: z.string().default('agents'),
        enableAdvancedFeatures: z.boolean().default(true),
        autoSaveResults: z.boolean().default(true),
    }).default({}),
});

export type StrandsOnboardingStep = z.infer<typeof StrandsOnboardingStepSchema>;
export type StrandsOnboardingState = z.infer<typeof StrandsOnboardingStateSchema>;

/**
 * Strands Onboarding Steps Configuration
 */
export const STRANDS_ONBOARDING_STEPS = {
    introduction: {
        id: 'introduction',
        title: 'Welcome to Strands AI',
        description: 'Discover the power of multi-agent AI workflows',
        estimatedTime: '2 minutes',
        features: [
            'Enhanced AI capabilities with intelligent orchestration',
            'Multi-step workflows for complex tasks',
            'Advanced market intelligence and research',
            'Seamless integration with existing tools'
        ],
        nextStep: 'enhanced-research'
    },

    'enhanced-research': {
        id: 'enhanced-research',
        title: 'Enhanced Research Agent',
        description: 'Experience intelligent research with web search integration',
        estimatedTime: '3 minutes',
        features: [
            'Multi-step research workflows',
            'Real-time web search integration',
            'Market analysis and trend identification',
            'Intelligent citation and source management'
        ],
        demoAction: 'Try researching "Austin real estate market trends 2024"',
        nextStep: 'content-studio'
    },

    'content-studio': {
        id: 'content-studio',
        title: 'Content Studio',
        description: 'Create professional content with AI-powered optimization',
        estimatedTime: '4 minutes',
        features: [
            'Unified content generation for all formats',
            'Platform-specific optimization',
            'SEO keyword integration',
            'Multi-platform social media content'
        ],
        demoAction: 'Generate a blog post about "First-time home buyer tips"',
        nextStep: 'listing-optimization'
    },

    'listing-optimization': {
        id: 'listing-optimization',
        title: 'Listing Optimization',
        description: 'Create compelling listings with persona-aware descriptions',
        estimatedTime: '3 minutes',
        features: [
            'Buyer persona targeting',
            'Market intelligence integration',
            'Competitive analysis',
            'SEO-optimized descriptions'
        ],
        demoAction: 'Optimize a listing for "Growing family in Austin"',
        nextStep: 'market-intelligence'
    },

    'market-intelligence': {
        id: 'market-intelligence',
        title: 'Market Intelligence',
        description: 'Advanced market analysis and trend forecasting',
        estimatedTime: '4 minutes',
        features: [
            'Real-time market analysis',
            'Trend identification with confidence scoring',
            'Investment opportunity analysis',
            'Competitive landscape assessment'
        ],
        demoAction: 'Analyze market trends for "Dallas investment opportunities"',
        nextStep: 'workflow-orchestration'
    },

    'workflow-orchestration': {
        id: 'workflow-orchestration',
        title: 'Workflow Orchestration',
        description: 'Execute complex multi-agent workflows',
        estimatedTime: '5 minutes',
        features: [
            'Multi-agent coordination',
            'Predefined workflow templates',
            'Dependency management',
            'Performance monitoring'
        ],
        demoAction: 'Run a complete content campaign workflow',
        nextStep: 'testing-validation'
    },

    'testing-validation': {
        id: 'testing-validation',
        title: 'Testing & Validation',
        description: 'Ensure quality with comprehensive testing',
        estimatedTime: '3 minutes',
        features: [
            'Automated quality validation',
            'Performance benchmarking',
            'Integration testing',
            'Detailed reporting'
        ],
        demoAction: 'Run the complete integration test suite',
        nextStep: 'completion'
    },

    completion: {
        id: 'completion',
        title: 'Strands AI Mastery',
        description: 'You\'re ready to leverage the full power of AI',
        estimatedTime: '1 minute',
        features: [
            'Access to all enhanced features',
            'Advanced workflow capabilities',
            'Performance monitoring',
            'Continuous improvements'
        ],
        nextStep: null
    }
} as const;

/**
 * Strands AI Onboarding Service
 */
class StrandsOnboardingService {

    /**
     * Initialize Strands onboarding for a user
     */
    async initializeStrandsOnboarding(userId: string): Promise<StrandsOnboardingState> {
        try {
            const repository = getRepository();
            const timestamp = new Date().toISOString();

            const onboardingState: StrandsOnboardingState = {
                userId,
                currentStep: 'introduction',
                completedSteps: [],
                isComplete: false,
                startedAt: timestamp,
                lastAccessedAt: timestamp,
                featuresUsed: {
                    enhancedResearch: false,
                    contentStudio: false,
                    listingOptimization: false,
                    marketIntelligence: false,
                    workflowOrchestration: false,
                },
                metrics: {
                    totalTestsRun: 0,
                    averageQualityScore: 0,
                    totalWorkflowsExecuted: 0,
                    favoriteFeatures: [],
                },
                preferences: {
                    preferredContentTone: 'professional',
                    defaultTargetAudience: 'agents',
                    enableAdvancedFeatures: true,
                    autoSaveResults: true,
                }
            };

            const onboardingItem = {
                PK: `USER#${userId}`,
                SK: 'STRANDS_ONBOARDING',
                GSI1PK: `USER#${userId}`,
                GSI1SK: `STRANDS_ONBOARDING#${timestamp}`,
                id: `strands_onboarding_${userId}`,
                userId,
                type: 'strands-onboarding',
                data: onboardingState,
                createdAt: timestamp,
                updatedAt: timestamp,
                source: 'strands-onboarding-service'
            };

            await repository.create(onboardingItem);

            console.log('✅ Strands onboarding initialized for user:', userId);
            return onboardingState;

        } catch (error) {
            console.error('❌ Failed to initialize Strands onboarding:', error);
            throw error;
        }
    }

    /**
     * Get Strands onboarding state for a user
     */
    async getStrandsOnboardingState(userId: string): Promise<StrandsOnboardingState | null> {
        try {
            const repository = getRepository();
            const result = await repository.get(`USER#${userId}`, 'STRANDS_ONBOARDING');

            if (!result || !result.data) {
                return null;
            }

            return result.data as StrandsOnboardingState;

        } catch (error) {
            console.error('❌ Failed to get Strands onboarding state:', error);
            return null;
        }
    }

    /**
     * Complete a Strands onboarding step
     */
    async completeStrandsStep(
        userId: string,
        step: StrandsOnboardingStep,
        featureUsed?: keyof StrandsOnboardingState['featuresUsed']
    ): Promise<StrandsOnboardingState> {
        try {
            let state = await this.getStrandsOnboardingState(userId);

            if (!state) {
                // Initialize if doesn't exist
                state = await this.initializeStrandsOnboarding(userId);
            }

            // Mark step as completed
            if (!state.completedSteps.includes(step)) {
                state.completedSteps.push(step);
            }

            // Update current step to next step
            const stepConfig = STRANDS_ONBOARDING_STEPS[step];
            if (stepConfig.nextStep) {
                state.currentStep = stepConfig.nextStep as StrandsOnboardingStep;
            }

            // Mark feature as used if specified
            if (featureUsed && featureUsed in state.featuresUsed) {
                state.featuresUsed[featureUsed] = true;
            }

            // Check if onboarding is complete
            const allSteps = Object.keys(STRANDS_ONBOARDING_STEPS) as StrandsOnboardingStep[];
            const requiredSteps = allSteps.filter(s => s !== 'completion');
            state.isComplete = requiredSteps.every(s => state.completedSteps.includes(s));

            if (state.isComplete && !state.completedAt) {
                state.completedAt = new Date().toISOString();
            }

            state.lastAccessedAt = new Date().toISOString();

            // Save updated state
            await this.updateStrandsOnboardingState(userId, state);

            console.log(`✅ Completed Strands onboarding step: ${step} for user: ${userId}`);
            return state;

        } catch (error) {
            console.error('❌ Failed to complete Strands onboarding step:', error);
            throw error;
        }
    }

    /**
     * Update user metrics from test results
     */
    async updateMetricsFromTest(
        userId: string,
        testResult: {
            qualityScore?: number;
            executionTime?: number;
            testType?: string;
        }
    ): Promise<void> {
        try {
            const state = await this.getStrandsOnboardingState(userId);
            if (!state) return;

            // Update metrics
            state.metrics.totalTestsRun += 1;

            if (testResult.qualityScore) {
                const currentAvg = state.metrics.averageQualityScore;
                const totalTests = state.metrics.totalTestsRun;
                state.metrics.averageQualityScore =
                    ((currentAvg * (totalTests - 1)) + testResult.qualityScore) / totalTests;
            }

            state.lastAccessedAt = new Date().toISOString();

            await this.updateStrandsOnboardingState(userId, state);

        } catch (error) {
            console.error('❌ Failed to update metrics from test:', error);
            // Don't throw - this is non-critical
        }
    }

    /**
     * Update user metrics from workflow execution
     */
    async updateMetricsFromWorkflow(
        userId: string,
        workflowResult: {
            workflowType?: string;
            completedSteps?: number;
            totalSteps?: number;
            totalDuration?: number;
        }
    ): Promise<void> {
        try {
            const state = await this.getStrandsOnboardingState(userId);
            if (!state) return;

            // Update workflow metrics
            state.metrics.totalWorkflowsExecuted += 1;

            // Track favorite features based on usage
            if (workflowResult.workflowType) {
                const featureMap: Record<string, keyof StrandsOnboardingState['featuresUsed']> = {
                    'content-campaign': 'contentStudio',
                    'listing-optimization': 'listingOptimization',
                    'brand-building': 'enhancedResearch',
                    'investment-analysis': 'marketIntelligence'
                };

                const feature = featureMap[workflowResult.workflowType];
                if (feature) {
                    state.featuresUsed[feature] = true;

                    if (!state.metrics.favoriteFeatures.includes(workflowResult.workflowType)) {
                        state.metrics.favoriteFeatures.push(workflowResult.workflowType);
                    }
                }
            }

            state.lastAccessedAt = new Date().toISOString();

            await this.updateStrandsOnboardingState(userId, state);

        } catch (error) {
            console.error('❌ Failed to update metrics from workflow:', error);
            // Don't throw - this is non-critical
        }
    }

    /**
     * Get onboarding progress summary
     */
    async getOnboardingProgress(userId: string): Promise<{
        progress: number;
        currentStep: StrandsOnboardingStep;
        nextStep: StrandsOnboardingStep | null;
        completedFeatures: string[];
        recommendations: string[];
    } | null> {
        try {
            const state = await this.getStrandsOnboardingState(userId);
            if (!state) return null;

            const allSteps = Object.keys(STRANDS_ONBOARDING_STEPS) as StrandsOnboardingStep[];
            const progress = (state.completedSteps.length / allSteps.length) * 100;

            const currentStepConfig = STRANDS_ONBOARDING_STEPS[state.currentStep];
            const nextStep = currentStepConfig.nextStep as StrandsOnboardingStep | null;

            const completedFeatures = Object.entries(state.featuresUsed)
                .filter(([_, used]) => used)
                .map(([feature, _]) => feature);

            // Generate recommendations based on usage patterns
            const recommendations = this.generateRecommendations(state);

            return {
                progress: Math.round(progress),
                currentStep: state.currentStep,
                nextStep,
                completedFeatures,
                recommendations
            };

        } catch (error) {
            console.error('❌ Failed to get onboarding progress:', error);
            return null;
        }
    }

    /**
     * Check if user needs Strands onboarding
     */
    async needsStrandsOnboarding(userId: string): Promise<boolean> {
        try {
            const state = await this.getStrandsOnboardingState(userId);

            // If no state exists, user needs onboarding
            if (!state) return true;

            // If onboarding is complete, user doesn't need it
            if (state.isComplete) return false;

            // If user has used multiple features, they might not need full onboarding
            const featuresUsedCount = Object.values(state.featuresUsed).filter(Boolean).length;
            if (featuresUsedCount >= 3) return false;

            return true;

        } catch (error) {
            console.error('❌ Failed to check Strands onboarding needs:', error);
            return false; // Default to not needing onboarding on error
        }
    }

    /**
     * Update Strands onboarding state
     */
    private async updateStrandsOnboardingState(
        userId: string,
        state: StrandsOnboardingState
    ): Promise<void> {
        try {
            const repository = getRepository();
            const timestamp = new Date().toISOString();

            const updates = {
                data: state,
                updatedAt: timestamp
            };

            await repository.update(`USER#${userId}`, 'STRANDS_ONBOARDING', updates);

        } catch (error) {
            console.error('❌ Failed to update Strands onboarding state:', error);
            throw error;
        }
    }

    /**
     * Generate personalized recommendations
     */
    private generateRecommendations(state: StrandsOnboardingState): string[] {
        const recommendations: string[] = [];

        // Based on features used
        if (!state.featuresUsed.enhancedResearch) {
            recommendations.push('Try the Enhanced Research Agent for comprehensive market analysis');
        }

        if (!state.featuresUsed.workflowOrchestration) {
            recommendations.push('Execute a workflow to see multi-agent coordination in action');
        }

        if (state.metrics.averageQualityScore < 80) {
            recommendations.push('Run validation tests to improve output quality');
        }

        if (state.metrics.totalWorkflowsExecuted === 0) {
            recommendations.push('Start with a Content Campaign workflow for a complete experience');
        }

        // Based on preferences
        if (state.preferences.enableAdvancedFeatures) {
            recommendations.push('Explore advanced market intelligence features');
        }

        return recommendations.slice(0, 3); // Return top 3 recommendations
    }
}

// Export singleton instance
export const strandsOnboardingService = new StrandsOnboardingService();

/**
 * Convenience functions
 */
export async function initializeStrandsOnboarding(userId: string): Promise<StrandsOnboardingState> {
    return strandsOnboardingService.initializeStrandsOnboarding(userId);
}

export async function completeStrandsStep(
    userId: string,
    step: StrandsOnboardingStep,
    featureUsed?: keyof StrandsOnboardingState['featuresUsed']
): Promise<StrandsOnboardingState> {
    return strandsOnboardingService.completeStrandsStep(userId, step, featureUsed);
}

export async function getStrandsOnboardingProgress(userId: string) {
    return strandsOnboardingService.getOnboardingProgress(userId);
}

export async function needsStrandsOnboarding(userId: string): Promise<boolean> {
    return strandsOnboardingService.needsStrandsOnboarding(userId);
}