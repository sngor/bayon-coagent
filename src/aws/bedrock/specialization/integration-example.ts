/**
 * Specialization System Integration Example
 * 
 * Demonstrates how to integrate the specialization system with AgentCore
 * and use it in real-world scenarios.
 */

import { getAgentCore } from '../agent-core';
import { createWorkerTask } from '../worker-protocol';
import {
    getSpecializationManager,
    createMarketSpecialization,
    createAgentSpecificSpecialization,
    createContentTypeSpecialization,
    createGeographicSpecialization,
    getMarketSpecialization,
    getContentTypeSpecialization,
    PREDEFINED_MARKET_SPECIALIZATIONS,
} from './index';
import type { TaskContext } from './types';

/**
 * Example 1: Initialize specialized strands for common scenarios
 */
export async function initializeCommonSpecializations() {
    const agentCore = getAgentCore();
    const specManager = getSpecializationManager();

    // Get content generator base strand
    const contentGenerators = agentCore.getStrandsByType('content-generator');
    if (contentGenerators.length === 0) {
        throw new Error('No content generator strands available');
    }
    const baseStrand = contentGenerators[0];

    // Create market specializations
    const marketTypes = ['luxury', 'first-time-buyers', 'investment', 'commercial'];
    const marketSpecialists = [];

    for (const marketType of marketTypes) {
        const config = getMarketSpecialization(marketType);
        const specialist = await specManager.createSpecializedStrand(baseStrand, config);
        marketSpecialists.push(specialist);
        console.log(`Created ${marketType} market specialist: ${specialist.id}`);
    }

    // Create content-type specializations
    const contentTypes = ['blog-post', 'social-media', 'listing-description', 'email'];
    const contentSpecialists = [];

    for (const contentType of contentTypes) {
        const config = getContentTypeSpecialization(contentType);
        const specialist = await specManager.createSpecializedStrand(baseStrand, config);
        contentSpecialists.push(specialist);
        console.log(`Created ${contentType} content specialist: ${specialist.id}`);
    }

    return {
        marketSpecialists,
        contentSpecialists,
    };
}

/**
 * Example 2: Route a luxury listing task to the appropriate specialist
 */
export async function createLuxuryListingDescription(
    userId: string,
    propertyData: {
        address: string;
        price: number;
        bedrooms: number;
        bathrooms: number;
        sqft: number;
        features: string[];
    }
) {
    const specManager = getSpecializationManager();

    // Create the task
    const task = createWorkerTask(
        'content-generator',
        'Create a luxury property listing description',
        {
            propertyType: 'luxury-estate',
            ...propertyData,
        }
    );

    // Define context for routing
    const context: TaskContext = {
        userId,
        agentProfile: {
            id: userId,
            marketFocus: 'luxury',
        },
        contentType: 'listing-description',
    };

    // Get the best specialist
    const decision = await specManager.getSpecialistStrand(task, context);

    console.log('Routing Decision:');
    console.log(`  Selected: ${decision.selectedStrand.id}`);
    console.log(`  Reason: ${decision.reason}`);
    console.log(`  Confidence: ${(decision.confidence * 100).toFixed(1)}%`);

    // Execute the task with the selected specialist
    // (In production, this would integrate with the actual task execution system)
    return {
        task,
        specialist: decision.selectedStrand,
        decision,
    };
}

/**
 * Example 3: Create an agent-specific specialist based on their style
 */
export async function createAgentStyleSpecialist(
    agentId: string,
    styleProfile: {
        tone: string;
        preferredWords: string[];
        avoidWords: string[];
        openingStyle: string;
        closingStyle: string;
    }
) {
    const agentCore = getAgentCore();
    const specManager = getSpecializationManager();

    // Get base strand
    const baseStrand = agentCore.getStrandsByType('content-generator')[0];

    // Create agent-specific configuration
    const config = createAgentSpecificSpecialization({
        agentId,
        stylePreferences: {
            tone: styleProfile.tone,
            vocabulary: styleProfile.preferredWords,
            avoidWords: styleProfile.avoidWords,
            sentenceStructure: 'varied',
        },
        contentPatterns: {
            openingStyle: styleProfile.openingStyle,
            closingStyle: styleProfile.closingStyle,
            callToActionStyle: 'conversational',
        },
        performanceHistory: [],
    });

    // Create the specialized strand
    const specialist = await specManager.createSpecializedStrand(baseStrand, config);

    console.log(`Created agent-specific specialist for ${agentId}: ${specialist.id}`);

    return specialist;
}

/**
 * Example 4: Create a geographic specialist for a specific region
 */
export async function createRegionalSpecialist(
    region: string,
    localData: {
        neighborhoods: string[];
        schools: string[];
        amenities: string[];
        marketTrends: Record<string, any>;
    }
) {
    const agentCore = getAgentCore();
    const specManager = getSpecializationManager();

    // Get base strand
    const baseStrand = agentCore.getStrandsByType('content-generator')[0];

    // Create geographic configuration
    const config = createGeographicSpecialization({
        region,
        localKnowledge: {
            neighborhoods: localData.neighborhoods,
            schools: localData.schools,
            amenities: localData.amenities,
            marketTrends: localData.marketTrends,
        },
        regionalPreferences: {
            language: 'en-US',
            culturalNotes: [],
        },
    });

    // Create the specialized strand
    const specialist = await specManager.createSpecializedStrand(baseStrand, config);

    console.log(`Created regional specialist for ${region}: ${specialist.id}`);

    return specialist;
}

/**
 * Example 5: Smart routing based on multiple context factors
 */
export async function smartRouteContentTask(
    userId: string,
    taskDescription: string,
    taskInput: Record<string, any>,
    contextData: {
        agentMarketFocus?: string;
        agentLocation?: string;
        contentType?: string;
        targetAudience?: string;
    }
) {
    const specManager = getSpecializationManager();

    // Create the task
    const task = createWorkerTask(
        'content-generator',
        taskDescription,
        taskInput
    );

    // Build comprehensive context
    const context: TaskContext = {
        userId,
        agentProfile: {
            id: userId,
            marketFocus: contextData.agentMarketFocus,
            location: contextData.agentLocation,
        },
        contentType: contextData.contentType,
        targetAudience: contextData.targetAudience,
    };

    // Get routing decision
    const decision = await specManager.getSpecialistStrand(task, context);

    // Log the decision and alternatives
    console.log('\n=== Smart Routing Decision ===');
    console.log(`Task: ${taskDescription}`);
    console.log(`\nSelected Specialist:`);
    console.log(`  ID: ${decision.selectedStrand.id}`);
    console.log(`  Reason: ${decision.reason}`);
    console.log(`  Confidence: ${(decision.confidence * 100).toFixed(1)}%`);

    if (decision.alternatives.length > 0) {
        console.log(`\nAlternatives:`);
        decision.alternatives.forEach((alt, idx) => {
            console.log(`  ${idx + 1}. ${alt.strand.id}`);
            console.log(`     Score: ${(alt.score * 100).toFixed(1)}%`);
            console.log(`     Reason: ${alt.reason}`);
        });
    }

    return decision;
}

/**
 * Example 6: Monitor and prune specialists
 */
export async function monitorAndPruneSpecialists() {
    const specManager = getSpecializationManager();

    // Get all specialized strands
    const specialists = specManager.getAllSpecializedStrands();

    console.log(`\n=== Specialist Monitoring ===`);
    console.log(`Total specialists: ${specialists.length}`);

    // Analyze performance
    const performanceReport = specialists.map(specialist => {
        const perf = specialist.specializationPerformance;
        return {
            id: specialist.id,
            type: specialist.specialization.type,
            domain: specialist.specialization.domain,
            tasksCompleted: specialist.metrics.tasksCompleted,
            utilizationRate: (perf.utilizationRate * 100).toFixed(1) + '%',
            qualityImprovement: perf.comparisonToBase.qualityImprovement.toFixed(1) + '%',
            lastUsed: perf.lastUsed,
        };
    });

    console.log('\nPerformance Report:');
    console.table(performanceReport);

    // Prune unused specialists
    const prunedIds = await specManager.pruneUnusedSpecialists();

    if (prunedIds.length > 0) {
        console.log(`\nPruned ${prunedIds.length} unused specialists:`);
        prunedIds.forEach(id => console.log(`  - ${id}`));
    } else {
        console.log('\nNo specialists needed pruning');
    }

    return {
        total: specialists.length,
        pruned: prunedIds.length,
        remaining: specialists.length - prunedIds.length,
    };
}

/**
 * Example 7: Complete workflow - from initialization to execution
 */
export async function completeSpecializationWorkflow() {
    console.log('=== Complete Specialization Workflow ===\n');

    // Step 1: Initialize common specializations
    console.log('Step 1: Initializing common specializations...');
    await initializeCommonSpecializations();

    // Step 2: Create a luxury listing
    console.log('\nStep 2: Creating luxury listing...');
    const luxuryResult = await createLuxuryListingDescription('agent123', {
        address: '123 Mansion Drive, Beverly Hills, CA',
        price: 8500000,
        bedrooms: 6,
        bathrooms: 8,
        sqft: 12000,
        features: [
            'infinity pool',
            'wine cellar',
            'home theater',
            'smart home system',
            'ocean views',
        ],
    });

    // Step 3: Create agent-specific specialist
    console.log('\nStep 3: Creating agent-specific specialist...');
    await createAgentStyleSpecialist('agent123', {
        tone: 'professional-luxury',
        preferredWords: ['exceptional', 'exquisite', 'unparalleled', 'prestigious'],
        avoidWords: ['cheap', 'affordable', 'budget'],
        openingStyle: 'dramatic-statement',
        closingStyle: 'exclusive-invitation',
    });

    // Step 4: Create regional specialist
    console.log('\nStep 4: Creating regional specialist...');
    await createRegionalSpecialist('Beverly Hills, CA', {
        neighborhoods: ['Trousdale Estates', 'Beverly Hills Flats', 'Beverly Park'],
        schools: ['Beverly Hills High School', 'Hawthorne School'],
        amenities: ['Rodeo Drive', 'Beverly Gardens Park', 'Greystone Mansion'],
        marketTrends: {
            avgPrice: 5000000,
            medianDaysOnMarket: 45,
            inventoryLevel: 'low',
        },
    });

    // Step 5: Smart routing example
    console.log('\nStep 5: Smart routing example...');
    await smartRouteContentTask(
        'agent123',
        'Create a social media post about a new luxury listing',
        {
            propertyType: 'luxury-estate',
            price: 8500000,
            highlights: ['ocean views', 'infinity pool', 'wine cellar'],
        },
        {
            agentMarketFocus: 'luxury',
            agentLocation: 'Beverly Hills, CA',
            contentType: 'social-media',
            targetAudience: 'high-net-worth individuals',
        }
    );

    // Step 6: Monitor and prune
    console.log('\nStep 6: Monitoring and pruning...');
    await monitorAndPruneSpecialists();

    console.log('\n=== Workflow Complete ===');
}

// Export for use in other modules
export default {
    initializeCommonSpecializations,
    createLuxuryListingDescription,
    createAgentStyleSpecialist,
    createRegionalSpecialist,
    smartRouteContentTask,
    monitorAndPruneSpecialists,
    completeSpecializationWorkflow,
};
