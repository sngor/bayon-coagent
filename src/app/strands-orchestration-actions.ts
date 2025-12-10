'use server';

/**
 * Enhanced Agent Orchestration Actions using Strands-Inspired Workflows
 * 
 * These actions orchestrate multiple AI agents to execute complex workflows
 * and multi-step processes for comprehensive real estate solutions.
 */

import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { z } from 'zod';
import {
    executeAgentWorkflow,
    executeContentCampaign,
    executeListingOptimization,
    executeBrandBuilding,
    executeInvestmentAnalysis,
    type WorkflowOrchestrationInput,
    type WorkflowOrchestrationOutput,
    WorkflowTypeSchema,
    WorkflowPrioritySchema
} from '@/services/strands/agent-orchestration-service';

// Content campaign schema
const contentCampaignSchema = z.object({
    topic: z.string().min(1, 'Topic is required'),
    targetAudience: z.enum(['agents', 'buyers', 'sellers', 'investors']).default('agents'),
    platforms: z.array(z.string()).default(['linkedin', 'facebook']),
    location: z.string().default('Local Market'),
    priority: WorkflowPrioritySchema.default('normal'),
});

// Listing optimization schema
const listingOptimizationSchema = z.object({
    propertyType: z.string().min(1, 'Property type is required'),
    location: z.string().min(1, 'Location is required'),
    keyFeatures: z.string().min(1, 'Key features are required'),
    buyerPersona: z.string().min(1, 'Buyer persona is required'),
    price: z.string().optional(),
    priority: WorkflowPrioritySchema.default('normal'),
});

// Brand building schema
const brandBuildingSchema = z.object({
    agentName: z.string().min(1, 'Agent name is required'),
    location: z.string().min(1, 'Location is required'),
    specialization: z.string().min(1, 'Specialization is required'),
    targetMarket: z.string().default('general'),
    priority: WorkflowPrioritySchema.default('normal'),
});

// Investment analysis schema
const investmentAnalysisSchema = z.object({
    location: z.string().min(1, 'Location is required'),
    propertyType: z.string().min(1, 'Property type is required'),
    investmentGoals: z.string().min(1, 'Investment goals are required'),
    budget: z.string().optional(),
    priority: WorkflowPrioritySchema.default('normal'),
});

// Universal workflow schema
const universalWorkflowSchema = z.object({
    workflowType: WorkflowTypeSchema,
    name: z.string().min(1, 'Workflow name is required'),
    description: z.string().optional(),
    priority: WorkflowPrioritySchema.default('normal'),
    parameters: z.record(z.any()),
    executeAsync: z.boolean().default(true),
    saveResults: z.boolean().default(true),
    notifyOnCompletion: z.boolean().default(false),
});

/**
 * Content Campaign Orchestration Action
 * Executes: Research → Blog Content → Social Media → Market Update
 */
export async function executeContentCampaignAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: WorkflowOrchestrationOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute content campaigns' },
            data: null,
        };
    }

    // Parse platforms from form data
    const platformsData = formData.get('platforms');
    let platforms: string[] = [];

    if (typeof platformsData === 'string') {
        try {
            platforms = JSON.parse(platformsData);
        } catch {
            platforms = [platformsData];
        }
    }

    // Validate input
    const validatedFields = contentCampaignSchema.safeParse({
        topic: formData.get('topic'),
        targetAudience: formData.get('targetAudience') || 'agents',
        platforms: platforms.length > 0 ? platforms : ['linkedin', 'facebook'],
        location: formData.get('location') || 'Local Market',
        priority: formData.get('priority') || 'normal',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.topic?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🚀 Starting content campaign orchestration...');

        const result = await executeContentCampaign(
            validatedFields.data.topic,
            user.id,
            {
                targetAudience: validatedFields.data.targetAudience,
                platforms: validatedFields.data.platforms,
                location: validatedFields.data.location,
            }
        );

        if (result.success) {
            console.log('✅ Content campaign orchestration completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Content campaign orchestration failed');
        }

    } catch (error) {
        console.error('❌ Content campaign orchestration failed:', error);
        return {
            message: `Content campaign failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { orchestration: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Listing Optimization Orchestration Action
 * Executes: Market Analysis → Competitive Analysis → Description Generation
 */
export async function executeListingOptimizationAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: WorkflowOrchestrationOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute listing optimization' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = listingOptimizationSchema.safeParse({
        propertyType: formData.get('propertyType'),
        location: formData.get('location'),
        keyFeatures: formData.get('keyFeatures'),
        buyerPersona: formData.get('buyerPersona'),
        price: formData.get('price') || undefined,
        priority: formData.get('priority') || 'normal',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.propertyType?.[0] || fieldErrors.location?.[0] || fieldErrors.keyFeatures?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🏠 Starting listing optimization orchestration...');

        const result = await executeListingOptimization(
            {
                propertyType: validatedFields.data.propertyType,
                location: validatedFields.data.location,
                keyFeatures: validatedFields.data.keyFeatures,
                buyerPersona: validatedFields.data.buyerPersona,
                price: validatedFields.data.price,
            },
            user.id
        );

        if (result.success) {
            console.log('✅ Listing optimization orchestration completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Listing optimization orchestration failed');
        }

    } catch (error) {
        console.error('❌ Listing optimization orchestration failed:', error);
        return {
            message: `Listing optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { orchestration: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Brand Building Orchestration Action
 * Executes: Competitive Research → Market Positioning → Content Strategy
 */
export async function executeBrandBuildingAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: WorkflowOrchestrationOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute brand building' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = brandBuildingSchema.safeParse({
        agentName: formData.get('agentName'),
        location: formData.get('location'),
        specialization: formData.get('specialization'),
        targetMarket: formData.get('targetMarket') || 'general',
        priority: formData.get('priority') || 'normal',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.agentName?.[0] || fieldErrors.location?.[0] || fieldErrors.specialization?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('🎯 Starting brand building orchestration...');

        const result = await executeBrandBuilding(
            {
                agentName: validatedFields.data.agentName,
                location: validatedFields.data.location,
                specialization: validatedFields.data.specialization,
                targetMarket: validatedFields.data.targetMarket,
            },
            user.id
        );

        if (result.success) {
            console.log('✅ Brand building orchestration completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Brand building orchestration failed');
        }

    } catch (error) {
        console.error('❌ Brand building orchestration failed:', error);
        return {
            message: `Brand building failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { orchestration: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Investment Analysis Orchestration Action
 * Executes: Market Research → Trend Analysis → Opportunity Analysis
 */
export async function executeInvestmentAnalysisAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: WorkflowOrchestrationOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute investment analysis' },
            data: null,
        };
    }

    // Validate input
    const validatedFields = investmentAnalysisSchema.safeParse({
        location: formData.get('location'),
        propertyType: formData.get('propertyType'),
        investmentGoals: formData.get('investmentGoals'),
        budget: formData.get('budget') || undefined,
        priority: formData.get('priority') || 'normal',
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        return {
            message: fieldErrors.location?.[0] || fieldErrors.propertyType?.[0] || fieldErrors.investmentGoals?.[0] || 'Validation failed',
            errors: fieldErrors,
            data: null,
        };
    }

    try {
        console.log('💰 Starting investment analysis orchestration...');

        const result = await executeInvestmentAnalysis(
            {
                location: validatedFields.data.location,
                propertyType: validatedFields.data.propertyType,
                investmentGoals: validatedFields.data.investmentGoals,
                budget: validatedFields.data.budget,
            },
            user.id
        );

        if (result.success) {
            console.log('✅ Investment analysis orchestration completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Investment analysis orchestration failed');
        }

    } catch (error) {
        console.error('❌ Investment analysis orchestration failed:', error);
        return {
            message: `Investment analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { orchestration: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Universal Workflow Orchestration Action
 * Handles any workflow type with unified interface
 */
export async function executeUniversalWorkflowAction(
    prevState: any,
    formData: FormData
): Promise<{
    message: string;
    data: WorkflowOrchestrationOutput | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to execute workflows' },
            data: null,
        };
    }

    try {
        // Parse parameters from form data
        const parametersData = formData.get('parameters');
        let parameters: any = {};

        if (typeof parametersData === 'string') {
            try {
                parameters = JSON.parse(parametersData);
            } catch (error) {
                return {
                    message: 'Invalid parameters format',
                    errors: { parameters: ['Parameters must be valid JSON'] },
                    data: null,
                };
            }
        }

        // Validate input
        const validatedFields = universalWorkflowSchema.safeParse({
            workflowType: formData.get('workflowType'),
            name: formData.get('name'),
            description: formData.get('description') || undefined,
            priority: formData.get('priority') || 'normal',
            parameters,
            executeAsync: formData.get('executeAsync') !== 'false',
            saveResults: formData.get('saveResults') !== 'false',
            notifyOnCompletion: formData.get('notifyOnCompletion') === 'true',
        });

        if (!validatedFields.success) {
            const fieldErrors = validatedFields.error.flatten().fieldErrors;
            return {
                message: fieldErrors.workflowType?.[0] || fieldErrors.name?.[0] || 'Validation failed',
                errors: fieldErrors,
                data: null,
            };
        }

        console.log(`🚀 Starting universal workflow orchestration: ${validatedFields.data.workflowType}`);

        // Build input object
        const input: WorkflowOrchestrationInput = {
            workflowType: validatedFields.data.workflowType,
            userId: user.id,
            name: validatedFields.data.name,
            description: validatedFields.data.description,
            priority: validatedFields.data.priority,
            parameters: validatedFields.data.parameters,
            executeAsync: validatedFields.data.executeAsync,
            saveResults: validatedFields.data.saveResults,
            notifyOnCompletion: validatedFields.data.notifyOnCompletion,
        };

        const result = await executeAgentWorkflow(input);

        if (result.success) {
            console.log('✅ Universal workflow orchestration completed successfully');
            return {
                message: 'success',
                data: result,
                errors: {},
            };
        } else {
            throw new Error(result.error || 'Workflow orchestration failed');
        }

    } catch (error) {
        console.error('❌ Universal workflow orchestration failed:', error);
        return {
            message: `Workflow orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { orchestration: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * Get Workflow Status Action
 * Retrieves the current status of a running workflow
 */
export async function getWorkflowStatusAction(
    workflowId: string
): Promise<{
    message: string;
    data: any | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to check workflow status' },
            data: null,
        };
    }

    if (!workflowId) {
        return {
            message: 'Workflow ID is required',
            errors: { workflowId: ['Workflow ID is required'] },
            data: null,
        };
    }

    try {
        const { getRepository } = await import('@/aws/dynamodb/repository');
        const repository = getRepository();

        // Query for the workflow
        const result = await repository.get(`USER#${user.id}`, `WORKFLOW#${workflowId}`);

        if (!result) {
            return {
                message: 'Workflow not found',
                errors: { workflow: ['Workflow not found'] },
                data: null,
            };
        }

        return {
            message: 'success',
            data: result,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Failed to get workflow status:', error);
        return {
            message: `Failed to get workflow status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { status: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}

/**
 * List User Workflows Action
 * Retrieves all workflows for the current user
 */
export async function listUserWorkflowsAction(): Promise<{
    message: string;
    data: any[] | null;
    errors: any;
}> {
    // Get current user
    const user = await getCurrentUserServer();
    if (!user) {
        return {
            message: 'Authentication required',
            errors: { auth: 'Please sign in to list workflows' },
            data: null,
        };
    }

    try {
        const { getRepository } = await import('@/aws/dynamodb/repository');
        const repository = getRepository();

        // Query for all workflows for this user
        const result = await repository.query(`USER#${user.id}`, 'WORKFLOW#', {
            limit: 50,
            scanIndexForward: false, // Most recent first
        });

        const workflows = result.items.map((item: any) => ({
            id: item.id,
            workflowType: item.workflowType,
            name: item.name,
            description: item.description,
            status: item.status,
            createdAt: item.createdAt,
            completedAt: item.completedAt,
            totalDuration: item.totalDuration,
            completedSteps: item.completedSteps,
            totalSteps: item.totalSteps,
            summary: item.summary,
        }));

        return {
            message: 'success',
            data: workflows,
            errors: {},
        };

    } catch (error) {
        console.error('❌ Failed to list workflows:', error);
        return {
            message: `Failed to list workflows: ${error instanceof Error ? error.message : 'Unknown error'}`,
            errors: { list: error instanceof Error ? error.message : 'Unknown error' },
            data: null,
        };
    }
}