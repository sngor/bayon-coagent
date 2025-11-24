/**
 * Enhanced Workflow Schemas for Multi-Agent Coordination
 * 
 * These schemas support the enhanced orchestrator and agent strands
 * with improved validation, context sharing, and quality assessment.
 */

import { z } from 'zod';

/**
 * Enhanced Agent Profile Schema with learning capabilities
 */
export const EnhancedAgentProfileSchema = z.object({
    userId: z.string(),
    agentName: z.string(),
    primaryMarket: z.string(),
    specialization: z.enum(['luxury', 'first-time-buyers', 'investment', 'commercial', 'general']),
    preferredTone: z.enum(['warm-consultative', 'direct-data-driven', 'professional', 'casual']),
    corePrinciple: z.string(),

    // Enhanced profile fields for better personalization
    marketExpertise: z.object({
        yearsOfExperience: z.number().optional(),
        averagePrice: z.number().optional(),
        topNeighborhoods: z.array(z.string()).optional(),
        marketTrends: z.array(z.string()).optional(),
    }).optional(),

    brandPreferences: z.object({
        logoUrl: z.string().optional(),
        brandColors: z.array(z.string()).optional(),
        tagline: z.string().optional(),
        uniqueSellingProposition: z.string().optional(),
    }).optional(),

    communicationStyle: z.object({
        formalityLevel: z.enum(['very-formal', 'formal', 'casual', 'very-casual']).optional(),
        technicalDepth: z.enum(['basic', 'intermediate', 'advanced', 'expert']).optional(),
        emotionalTone: z.enum(['empathetic', 'neutral', 'analytical', 'enthusiastic']).optional(),
    }).optional(),

    learningPreferences: z.object({
        contentTypes: z.array(z.string()).optional(),
        successfulPatterns: z.record(z.any()).optional(),
        qualityFeedback: z.array(z.object({
            contentId: z.string(),
            rating: z.number().min(1).max(5),
            feedback: z.string().optional(),
            timestamp: z.string(),
        })).optional(),
    }).optional(),
});

export type EnhancedAgentProfile = z.infer<typeof EnhancedAgentProfileSchema>;

/**
 * Enhanced Context Schema for multi-agent coordination
 */
export const EnhancedContextSchema = z.object({
    // Basic context
    userId: z.string().optional(),
    workflowId: z.string().optional(),
    conversationId: z.string().optional(),

    // Agent coordination context
    agentProfile: EnhancedAgentProfileSchema.optional(),
    sharedContext: z.record(z.any()).optional(),
    previousResults: z.array(z.any()).optional(),

    // Quality requirements
    qualityRequirements: z.object({
        minimumConfidence: z.number().min(0).max(1).optional(),
        requiresCitation: z.boolean().optional(),
        requiresPersonalization: z.boolean().optional(),
        targetAudience: z.string().optional(),
        contentLength: z.enum(['short', 'medium', 'long', 'variable']).optional(),
    }).optional(),

    // Execution preferences
    executionPreferences: z.object({
        priorityLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        maxExecutionTime: z.number().optional(),
        enableAdaptiveExecution: z.boolean().optional(),
        contextSharingEnabled: z.boolean().optional(),
    }).optional(),

    // Market and property context
    marketContext: z.object({
        market: z.string().optional(),
        propertyType: z.string().optional(),
        priceRange: z.object({
            min: z.number().optional(),
            max: z.number().optional(),
        }).optional(),
        timeframe: z.string().optional(),
        seasonality: z.string().optional(),
    }).optional(),
});

export type EnhancedContext = z.infer<typeof EnhancedContextSchema>;

/**
 * Enhanced Data Analyst Input Schema
 */
export const EnhancedDataAnalystInputSchema = z.object({
    query: z.string().describe('The data analysis query or question'),
    dataSource: z.enum(['tavily', 'web', 'mls', 'market-reports', 'internal']).default('tavily'),
    analysisType: z.enum(['market-trends', 'property-comparison', 'statistical-analysis', 'forecast', 'general']).optional(),
    context: EnhancedContextSchema.optional(),

    // Enhanced analysis parameters
    analysisDepth: z.enum(['surface', 'standard', 'deep', 'comprehensive']).default('standard'),
    confidenceThreshold: z.number().min(0).max(1).default(0.7),
    includeVisualizations: z.boolean().default(false),

    // Context from previous agents
    sharedInsights: z.array(z.object({
        source: z.string(),
        insight: z.string(),
        confidence: z.number(),
        relevance: z.number(),
    })).optional(),
});

export type EnhancedDataAnalystInput = z.infer<typeof EnhancedDataAnalystInputSchema>;

/**
 * Enhanced Data Analyst Output Schema
 */
export const EnhancedDataAnalystOutputSchema = z.object({
    dataPoints: z.array(z.object({
        label: z.string(),
        value: z.string(),
        unit: z.string().optional(),
        source: z.string(),
        confidence: z.number().min(0).max(1),
        trend: z.enum(['increasing', 'decreasing', 'stable', 'volatile']).optional(),
        significance: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    })),

    summary: z.string().describe('Comprehensive analysis summary'),

    insights: z.array(z.object({
        insight: z.string(),
        confidence: z.number().min(0).max(1),
        impact: z.enum(['low', 'medium', 'high']),
        actionable: z.boolean(),
    })),

    trends: z.array(z.object({
        trend: z.string(),
        direction: z.enum(['up', 'down', 'stable', 'volatile']),
        strength: z.enum(['weak', 'moderate', 'strong']),
        timeframe: z.string(),
        confidence: z.number().min(0).max(1),
    })).optional(),

    sources: z.array(z.object({
        url: z.string(),
        title: z.string(),
        sourceType: z.string(),
        reliability: z.number().min(0).max(1).optional(),
        recency: z.string().optional(),
    })),

    confidence: z.number().min(0).max(1),

    recommendations: z.array(z.object({
        recommendation: z.string(),
        priority: z.enum(['low', 'medium', 'high']),
        rationale: z.string(),
        confidence: z.number().min(0).max(1),
    })).optional(),

    // Quality metrics
    qualityMetrics: z.object({
        dataQuality: z.number().min(0).max(1),
        sourceReliability: z.number().min(0).max(1),
        analysisDepth: z.number().min(0).max(1),
        actionability: z.number().min(0).max(1),
    }),

    // Context for sharing with other agents
    contextForSharing: z.object({
        keyFindings: z.array(z.string()),
        marketConditions: z.string().optional(),
        dataLimitations: z.array(z.string()).optional(),
        followUpQuestions: z.array(z.string()).optional(),
    }).optional(),
});

export type EnhancedDataAnalystOutput = z.infer<typeof EnhancedDataAnalystOutputSchema>;

/**
 * Enhanced Content Generator Input Schema
 */
export const EnhancedContentGeneratorInputSchema = z.object({
    contentType: z.enum([
        'email', 'listing', 'social-post', 'blog-post', 'newsletter',
        'market-update', 'client-communication', 'marketing-copy',
        'video-script', 'presentation', 'flyer', 'brochure'
    ]),

    instructions: z.string().describe('Specific instructions for content creation'),
    targetLength: z.number().optional().describe('Target word count'),

    context: EnhancedContextSchema.optional(),

    // Enhanced content parameters
    targetAudience: z.enum(['buyers', 'sellers', 'investors', 'general', 'professionals']).optional(),
    contentGoal: z.enum(['inform', 'persuade', 'engage', 'educate', 'convert']).optional(),
    distributionChannel: z.enum(['email', 'social', 'website', 'print', 'presentation']).optional(),

    // Brand consistency requirements
    brandConsistencyLevel: z.enum(['strict', 'moderate', 'flexible']).default('moderate'),
    includeCallToAction: z.boolean().default(true),

    // Context from other agents
    dataInsights: z.array(z.object({
        insight: z.string(),
        confidence: z.number(),
        source: z.string(),
    })).optional(),

    marketContext: z.object({
        currentTrends: z.array(z.string()).optional(),
        marketConditions: z.string().optional(),
        competitiveAdvantages: z.array(z.string()).optional(),
    }).optional(),
});

export type EnhancedContentGeneratorInput = z.infer<typeof EnhancedContentGeneratorInputSchema>;

/**
 * Enhanced Content Generator Output Schema
 */
export const EnhancedContentGeneratorOutputSchema = z.object({
    content: z.string().describe('The generated content'),

    tone: z.string().describe('The tone used in the content'),
    wordCount: z.number().describe('Actual word count'),

    keyThemes: z.array(z.string()).describe('Main themes covered'),

    personalizationApplied: z.object({
        agentNameUsed: z.boolean(),
        marketMentioned: z.boolean(),
        specializationReflected: z.boolean(),
        corePrincipleIncluded: z.boolean(),
        brandVoiceMatched: z.boolean(),
        targetAudienceAddressed: z.boolean(),
    }),

    // Enhanced quality metrics
    qualityScore: z.number().min(0).max(1),
    brandConsistency: z.number().min(0).max(1),
    engagementPotential: z.number().min(0).max(1),

    // Content analysis
    contentAnalysis: z.object({
        readabilityScore: z.number().min(0).max(100).optional(),
        sentimentScore: z.number().min(-1).max(1).optional(),
        keywordDensity: z.record(z.number()).optional(),
        callToActionStrength: z.enum(['weak', 'moderate', 'strong']).optional(),
    }).optional(),

    // SEO and optimization
    seoOptimization: z.object({
        primaryKeywords: z.array(z.string()).optional(),
        metaDescription: z.string().optional(),
        suggestedHashtags: z.array(z.string()).optional(),
    }).optional(),

    // Variations and alternatives
    alternativeVersions: z.array(z.object({
        version: z.string(),
        purpose: z.string(),
        content: z.string(),
    })).optional(),

    // Context for sharing
    contextForSharing: z.object({
        contentThemes: z.array(z.string()),
        brandElements: z.array(z.string()),
        successfulPatterns: z.array(z.string()),
    }).optional(),
});

export type EnhancedContentGeneratorOutput = z.infer<typeof EnhancedContentGeneratorOutputSchema>;

/**
 * Enhanced Market Forecaster Input Schema
 */
export const EnhancedMarketForecasterInputSchema = z.object({
    query: z.string().describe('The forecasting query or question'),
    timeframe: z.string().default('12 months').describe('Forecast timeframe'),
    market: z.string().optional().describe('Specific market or area'),

    context: EnhancedContextSchema.optional(),

    // Enhanced forecasting parameters
    forecastType: z.enum(['price', 'volume', 'trends', 'opportunities', 'risks', 'comprehensive']).optional(),
    confidenceLevel: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
    includeScenarios: z.boolean().default(true),

    // Historical context
    historicalData: z.array(z.object({
        period: z.string(),
        metric: z.string(),
        value: z.number(),
        source: z.string(),
    })).optional(),

    // Context from other agents
    marketAnalysis: z.object({
        currentConditions: z.string().optional(),
        keyTrends: z.array(z.string()).optional(),
        dataPoints: z.array(z.object({
            metric: z.string(),
            value: z.string(),
            confidence: z.number(),
        })).optional(),
    }).optional(),
});

export type EnhancedMarketForecasterInput = z.infer<typeof EnhancedMarketForecasterInputSchema>;

/**
 * Enhanced Market Forecaster Output Schema
 */
export const EnhancedMarketForecasterOutputSchema = z.object({
    predictions: z.array(z.object({
        metric: z.string(),
        currentValue: z.string().optional(),
        predictedValue: z.string(),
        confidence: z.number().min(0).max(1),
        timeframe: z.string(),
        reasoning: z.string(),
        qualifyingLanguage: z.string(),

        // Enhanced prediction details
        predictionRange: z.object({
            low: z.string(),
            high: z.string(),
            mostLikely: z.string(),
        }).optional(),

        keyAssumptions: z.array(z.string()).optional(),
        riskFactors: z.array(z.string()).optional(),
    })),

    marketTrends: z.array(z.object({
        trend: z.string(),
        direction: z.enum(['up', 'down', 'stable', 'volatile']),
        strength: z.enum(['weak', 'moderate', 'strong']),
        confidence: z.number().min(0).max(1),
        timeframe: z.string(),
        impact: z.enum(['low', 'medium', 'high']),
    })),

    scenarios: z.array(z.object({
        name: z.string(),
        probability: z.number().min(0).max(1),
        description: z.string(),
        implications: z.array(z.string()),
        keyIndicators: z.array(z.string()),
    })).optional(),

    riskFactors: z.array(z.object({
        risk: z.string(),
        probability: z.enum(['low', 'medium', 'high']),
        impact: z.enum(['low', 'medium', 'high']),
        mitigation: z.string().optional(),
    })),

    opportunities: z.array(z.object({
        opportunity: z.string(),
        probability: z.enum(['low', 'medium', 'high']),
        potential: z.enum(['low', 'medium', 'high']),
        timeframe: z.string(),
        actionRequired: z.string().optional(),
    })),

    summary: z.string(),

    disclaimers: z.array(z.string()),

    confidenceLevel: z.number().min(0).max(1),

    // Enhanced analysis
    marketCycle: z.object({
        currentPhase: z.enum(['expansion', 'peak', 'contraction', 'trough', 'recovery']),
        phaseConfidence: z.number().min(0).max(1),
        expectedDuration: z.string().optional(),
    }).optional(),

    comparativeAnalysis: z.object({
        similarMarkets: z.array(z.string()).optional(),
        historicalComparisons: z.array(z.string()).optional(),
        benchmarkMetrics: z.record(z.string()).optional(),
    }).optional(),

    // Context for sharing
    contextForSharing: z.object({
        marketOutlook: z.string(),
        keyPredictions: z.array(z.string()),
        investmentImplications: z.array(z.string()),
        timingSuggestions: z.array(z.string()),
    }).optional(),
});

export type EnhancedMarketForecasterOutput = z.infer<typeof EnhancedMarketForecasterOutputSchema>;

/**
 * Workflow Coordination Schema
 */
export const WorkflowCoordinationSchema = z.object({
    workflowId: z.string(),

    tasks: z.array(z.object({
        taskId: z.string(),
        agentType: z.enum(['data-analyst', 'content-generator', 'market-forecaster']),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        dependencies: z.array(z.string()),

        contextRequirements: z.object({
            requiresSharedContext: z.boolean(),
            contextKeys: z.array(z.string()).optional(),
            minimumContextQuality: z.number().min(0).max(1).optional(),
        }).optional(),

        qualityRequirements: z.object({
            minimumConfidence: z.number().min(0).max(1),
            requiresCitation: z.boolean(),
            qualityThreshold: z.number().min(0).max(1),
        }),
    })),

    coordinationPlan: z.object({
        executionStrategy: z.enum(['sequential', 'parallel', 'mixed', 'adaptive']),

        contextSharingPlan: z.array(z.object({
            fromTask: z.string(),
            toTask: z.string(),
            contextType: z.string(),
            timing: z.enum(['immediate', 'on-completion', 'on-demand']),
            transformation: z.string().optional(),
        })),

        qualityGates: z.array(z.object({
            taskId: z.string(),
            qualityCheck: z.string(),
            threshold: z.number(),
            action: z.enum(['continue', 'retry', 'escalate', 'abort']),
        })).optional(),

        adaptiveRules: z.array(z.object({
            condition: z.string(),
            action: z.string(),
            parameters: z.record(z.any()).optional(),
        })).optional(),
    }),

    expectedOutcome: z.object({
        deliverables: z.array(z.string()),
        qualityExpectations: z.record(z.number()),
        timelineExpectations: z.object({
            estimatedDuration: z.number(),
            criticalPath: z.array(z.string()),
        }),
    }),
});

export type WorkflowCoordination = z.infer<typeof WorkflowCoordinationSchema>;

/**
 * Enhanced Workflow Result Schema
 */
export const EnhancedWorkflowResultSchema = z.object({
    workflowId: z.string(),

    synthesizedResponse: z.string(),
    keyPoints: z.array(z.string()),

    citations: z.array(z.object({
        url: z.string(),
        title: z.string(),
        sourceType: z.string(),
        reliability: z.number().min(0).max(1).optional(),
        relevance: z.number().min(0).max(1).optional(),
    })),

    qualityMetrics: z.object({
        overallQuality: z.number().min(0).max(1),
        confidenceLevel: z.number().min(0).max(1),
        completeness: z.number().min(0).max(1),
        consistency: z.number().min(0).max(1),
        personalization: z.number().min(0).max(1),
    }),

    executionMetrics: z.object({
        totalExecutionTime: z.number(),
        parallelEfficiency: z.number().min(0).max(1),
        agentUtilization: z.record(z.number()),
        contextSharingEvents: z.number(),
        qualityGatesPassed: z.number(),
        adaptiveActionsTriggered: z.number(),
    }),

    agentPerformance: z.array(z.object({
        agentType: z.string(),
        tasksCompleted: z.number(),
        avgExecutionTime: z.number(),
        successRate: z.number().min(0).max(1),
        qualityScore: z.number().min(0).max(1),
        improvementSuggestions: z.array(z.string()).optional(),
    })),

    workflowInsights: z.object({
        bottlenecks: z.array(z.string()),
        optimizationSuggestions: z.array(z.string()),
        learningPoints: z.array(z.string()),
        successFactors: z.array(z.string()),
    }),

    contextGenerated: z.object({
        sharedInsights: z.array(z.object({
            insight: z.string(),
            confidence: z.number(),
            source: z.string(),
            applicability: z.array(z.string()),
        })),

        learnedPatterns: z.array(z.object({
            pattern: z.string(),
            frequency: z.number(),
            effectiveness: z.number(),
            context: z.string(),
        })),

        qualityFeedback: z.array(z.object({
            aspect: z.string(),
            rating: z.number().min(1).max(5),
            feedback: z.string(),
            improvement: z.string().optional(),
        })),
    }).optional(),
});

export type EnhancedWorkflowResult = z.infer<typeof EnhancedWorkflowResultSchema>;