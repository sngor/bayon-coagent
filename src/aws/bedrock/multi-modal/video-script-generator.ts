/**
 * Video Script Generator Strand - Multi-Modal Processing for Video Content
 * 
 * This strand provides comprehensive video script generation capabilities for real estate agents,
 * including engagement hooks, structured sections, calls-to-action, and platform-specific optimization.
 * 
 * Features:
 * - Engagement hook generation for viewer retention
 * - Structured section creation with clear flow
 * - Call-to-action generation for lead conversion
 * - Platform-specific optimization (YouTube, Instagram, TikTok, Facebook)
 * - Duration-based script adaptation
 * - Real estate content specialization
 * 
 * Requirements validated:
 * - 5.2: Generates optimized video scripts with engagement hooks and calls-to-action
 * 
 * Property validated:
 * - Property 22: Video script structure - For any generated video script,
 *   it should include an engagement hook, structured sections, and a call-to-action
 */

import type { AgentStrand, AgentCapabilities, AgentMemory, AgentMetrics } from '../agent-core';
import { getBedrockClient } from '../client';
import { z } from 'zod';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Video platform types
 */
export type VideoPlatform = 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'linkedin';

/**
 * Video style types
 */
export type VideoStyle =
    | 'educational'
    | 'promotional'
    | 'storytelling'
    | 'testimonial'
    | 'property-tour'
    | 'market-update'
    | 'tips-and-tricks'
    | 'behind-the-scenes';

/**
 * Script section with timing and content
 */
export interface ScriptSection {
    /** Section title */
    title: string;

    /** Section content/dialogue */
    content: string;

    /** Estimated duration in seconds */
    duration: number;

    /** Visual suggestions for this section */
    visualSuggestions: string[];

    /** B-roll suggestions */
    brollSuggestions?: string[];

    /** On-screen text suggestions */
    onScreenText?: string[];
}

/**
 * Complete video script
 */
export interface VideoScript {
    /** Video title */
    title: string;

    /** Engagement hook (first 3-5 seconds) */
    hook: string;

    /** Main script sections */
    sections: ScriptSection[];

    /** Call-to-action */
    callToAction: string;

    /** Estimated total duration in seconds */
    estimatedDuration: number;

    /** SEO keywords */
    keywords: string[];

    /** Video description */
    description?: string;

    /** Hashtags (for social platforms) */
    hashtags?: string[];

    /** Platform-specific notes */
    platformNotes?: string[];
}

/**
 * Video script generation input
 */
export interface VideoScriptInput {
    /** Topic or subject of the video */
    topic: string;

    /** Target duration in seconds */
    duration: number;

    /** Video style */
    style: VideoStyle;

    /** Target platform (optional, for optimization) */
    platform?: VideoPlatform;

    /** Agent profile for personalization */
    agentProfile?: AgentProfile;

    /** Additional context or requirements */
    additionalContext?: string;

    /** Target audience */
    targetAudience?: string;

    /** Key points to cover */
    keyPoints?: string[];
}

/**
 * Platform-specific optimization parameters
 */
interface PlatformOptimization {
    /** Optimal video length range */
    optimalDuration: { min: number; max: number };

    /** Hook duration (seconds) */
    hookDuration: number;

    /** Recommended pacing */
    pacing: 'fast' | 'medium' | 'slow';

    /** CTA placement */
    ctaPlacement: 'beginning' | 'middle' | 'end' | 'multiple';

    /** Format preferences */
    formatPreferences: string[];

    /** Content style notes */
    styleNotes: string[];
}

/**
 * Platform optimization configurations
 */
const PLATFORM_CONFIGS: Record<VideoPlatform, PlatformOptimization> = {
    youtube: {
        optimalDuration: { min: 480, max: 900 }, // 8-15 minutes
        hookDuration: 5,
        pacing: 'medium',
        ctaPlacement: 'multiple',
        formatPreferences: ['educational', 'in-depth', 'storytelling'],
        styleNotes: [
            'Include chapter markers in description',
            'Front-load value in first 30 seconds',
            'Use pattern interrupts every 2-3 minutes',
            'Include mid-roll CTA for longer videos',
        ],
    },
    instagram: {
        optimalDuration: { min: 15, max: 90 }, // 15-90 seconds
        hookDuration: 2,
        pacing: 'fast',
        ctaPlacement: 'end',
        formatPreferences: ['visual-first', 'quick-tips', 'behind-the-scenes'],
        styleNotes: [
            'Optimize for vertical format (9:16)',
            'Use captions (80% watch without sound)',
            'Strong visual storytelling',
            'Quick cuts and dynamic pacing',
        ],
    },
    tiktok: {
        optimalDuration: { min: 15, max: 60 }, // 15-60 seconds
        hookDuration: 1,
        pacing: 'fast',
        ctaPlacement: 'end',
        formatPreferences: ['entertaining', 'trending', 'authentic'],
        styleNotes: [
            'Hook in first second is critical',
            'Use trending sounds when possible',
            'Authentic, unpolished feel works best',
            'Vertical format only (9:16)',
            'Text overlays for key points',
        ],
    },
    facebook: {
        optimalDuration: { min: 60, max: 180 }, // 1-3 minutes
        hookDuration: 3,
        pacing: 'medium',
        ctaPlacement: 'end',
        formatPreferences: ['community-focused', 'informative', 'shareable'],
        styleNotes: [
            'Optimize for silent viewing with captions',
            'Square format (1:1) performs well',
            'Community engagement focus',
            'Shareable content performs best',
        ],
    },
    linkedin: {
        optimalDuration: { min: 30, max: 180 }, // 30 seconds - 3 minutes
        hookDuration: 3,
        pacing: 'medium',
        ctaPlacement: 'end',
        formatPreferences: ['professional', 'educational', 'industry-insights'],
        styleNotes: [
            'Professional tone and presentation',
            'Value-driven content',
            'Industry insights and expertise',
            'Square or horizontal format',
        ],
    },
};

/**
 * VideoScriptGenerator - Specialized strand for video script generation
 */
export class VideoScriptGenerator implements AgentStrand {
    id: string;
    type: 'content-generator' = 'content-generator';
    capabilities: AgentCapabilities;
    state: 'idle' | 'active' | 'busy' | 'overloaded' | 'error' | 'maintenance';
    memory: AgentMemory;
    metrics: AgentMetrics;
    createdAt: string;
    lastActiveAt: string;

    private bedrockClient = getBedrockClient();

    constructor(id?: string) {
        const now = new Date().toISOString();

        this.id = id || this.generateStrandId();
        this.state = 'idle';
        this.createdAt = now;
        this.lastActiveAt = now;

        this.capabilities = {
            expertise: [
                'video-script-writing',
                'engagement-hooks',
                'storytelling',
                'platform-optimization',
                'real-estate-content',
                'call-to-action-creation',
            ],
            taskTypes: [
                'video-script-generation',
                'hook-creation',
                'platform-optimization',
                'content-structuring',
            ],
            qualityScore: 0.90,
            speedScore: 0.88,
            reliabilityScore: 0.93,
            maxConcurrentTasks: 4,
            preferredModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        };

        this.memory = {
            workingMemory: {},
            knowledgeBase: {},
            recentTasks: [],
            learnedPatterns: {},
        };

        this.metrics = {
            tasksCompleted: 0,
            successRate: 1.0,
            avgExecutionTime: 0,
            currentLoad: 0,
            recentQualityRatings: [],
            lastUpdated: now,
        };
    }

    /**
     * Generates a complete video script
     * 
     * @param input - Video script generation input
     * @param userId - Optional user ID for tracking
     * @returns Complete video script
     */
    async generateScript(input: VideoScriptInput, userId?: string): Promise<VideoScript> {
        const startTime = Date.now();

        try {
            this.state = 'active';
            this.lastActiveAt = new Date().toISOString();

            // Get platform optimization if specified
            const platformConfig = input.platform ? PLATFORM_CONFIGS[input.platform] : null;

            // Construct the system prompt
            const systemPrompt = this.constructSystemPrompt(input, platformConfig);

            // Construct the user prompt
            const userPrompt = this.constructUserPrompt(input);

            // Define the output schema
            const outputSchema = z.object({
                title: z.string().describe('Compelling video title'),
                hook: z.string().describe('Engaging hook for the first few seconds'),
                sections: z.array(z.object({
                    title: z.string(),
                    content: z.string(),
                    duration: z.number(),
                    visualSuggestions: z.array(z.string()),
                    brollSuggestions: z.array(z.string()).optional(),
                    onScreenText: z.array(z.string()).optional(),
                })),
                callToAction: z.string().describe('Clear call-to-action'),
                estimatedDuration: z.number().describe('Total duration in seconds'),
                keywords: z.array(z.string()).describe('SEO keywords'),
                description: z.string().optional().describe('Video description'),
                hashtags: z.array(z.string()).optional().describe('Relevant hashtags'),
                platformNotes: z.array(z.string()).optional().describe('Platform-specific notes'),
            });

            // Invoke Bedrock
            const result = await this.bedrockClient.invokeWithPrompts<z.infer<typeof outputSchema>>(
                systemPrompt,
                userPrompt,
                outputSchema,
                userId
            );

            // Update metrics
            const executionTime = Date.now() - startTime;
            this.updateMetrics(true, executionTime);

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.updateMetrics(false, executionTime);
            this.state = 'error';
            throw error;
        } finally {
            this.state = this.metrics.currentLoad > 0.8 ? 'busy' :
                this.metrics.currentLoad > 0 ? 'active' : 'idle';
        }
    }

    /**
     * Optimizes an existing script for a specific platform
     * 
     * @param script - Original video script
     * @param platform - Target platform
     * @param userId - Optional user ID for tracking
     * @returns Platform-optimized script
     */
    async optimizeForPlatform(
        script: VideoScript,
        platform: VideoPlatform,
        userId?: string
    ): Promise<VideoScript> {
        const startTime = Date.now();

        try {
            this.state = 'active';
            this.lastActiveAt = new Date().toISOString();

            const platformConfig = PLATFORM_CONFIGS[platform];

            // Construct optimization prompt
            const systemPrompt = `You are an expert video content strategist specializing in platform-specific optimization for real estate content.

Your task is to adapt video scripts for optimal performance on ${platform}.

Platform Guidelines for ${platform}:
- Optimal Duration: ${platformConfig.optimalDuration.min}-${platformConfig.optimalDuration.max} seconds
- Hook Duration: ${platformConfig.hookDuration} seconds
- Pacing: ${platformConfig.pacing}
- CTA Placement: ${platformConfig.ctaPlacement}
- Format Preferences: ${platformConfig.formatPreferences.join(', ')}

Platform-Specific Notes:
${platformConfig.styleNotes.map(note => `- ${note}`).join('\n')}

Adapt the script while maintaining the core message and value proposition.`;

            const userPrompt = `Please optimize this video script for ${platform}:

Original Script:
Title: ${script.title}
Hook: ${script.hook}
Duration: ${script.estimatedDuration} seconds

Sections:
${script.sections.map((section, i) => `${i + 1}. ${section.title} (${section.duration}s)\n${section.content}`).join('\n\n')}

Call-to-Action: ${script.callToAction}

Provide an optimized version that follows ${platform}'s best practices while maintaining the core message.`;

            const outputSchema = z.object({
                title: z.string(),
                hook: z.string(),
                sections: z.array(z.object({
                    title: z.string(),
                    content: z.string(),
                    duration: z.number(),
                    visualSuggestions: z.array(z.string()),
                    brollSuggestions: z.array(z.string()).optional(),
                    onScreenText: z.array(z.string()).optional(),
                })),
                callToAction: z.string(),
                estimatedDuration: z.number(),
                keywords: z.array(z.string()),
                description: z.string().optional(),
                hashtags: z.array(z.string()).optional(),
                platformNotes: z.array(z.string()).optional(),
            });

            const result = await this.bedrockClient.invokeWithPrompts<z.infer<typeof outputSchema>>(
                systemPrompt,
                userPrompt,
                outputSchema,
                userId
            );

            const executionTime = Date.now() - startTime;
            this.updateMetrics(true, executionTime);

            return result;

        } catch (error) {
            const executionTime = Date.now() - startTime;
            this.updateMetrics(false, executionTime);
            this.state = 'error';
            throw error;
        } finally {
            this.state = this.metrics.currentLoad > 0.8 ? 'busy' :
                this.metrics.currentLoad > 0 ? 'active' : 'idle';
        }
    }

    /**
     * Generates just an engagement hook
     * 
     * @param topic - Video topic
     * @param duration - Hook duration in seconds
     * @param style - Video style
     * @param userId - Optional user ID for tracking
     * @returns Engagement hook
     */
    async generateHook(
        topic: string,
        duration: number,
        style: VideoStyle,
        userId?: string
    ): Promise<string> {
        const systemPrompt = `You are an expert at creating compelling video hooks that grab attention in the first few seconds.

Create a ${duration}-second hook for a ${style} video about: ${topic}

The hook should:
- Immediately grab attention
- Create curiosity or urgency
- Be concise and punchy
- Set up the value proposition
- Work well for real estate content

Respond with ONLY the hook text, no additional explanation.`;

        const userPrompt = `Create a ${duration}-second engagement hook for a video about: ${topic}`;

        const result = await this.bedrockClient.invoke(systemPrompt + '\n\n' + userPrompt, userId);

        return result.trim();
    }

    /**
     * Generates a call-to-action
     * 
     * @param goal - The goal of the CTA (e.g., 'schedule consultation', 'download guide')
     * @param agentProfile - Agent profile for personalization
     * @param userId - Optional user ID for tracking
     * @returns Call-to-action text
     */
    async generateCallToAction(
        goal: string,
        agentProfile?: AgentProfile,
        userId?: string
    ): Promise<string> {
        const agentName = agentProfile?.agentName || 'me';
        const agentContact = agentProfile?.contactInfo?.phone || agentProfile?.contactInfo?.email || 'the link in the description';

        const systemPrompt = `You are an expert at creating compelling calls-to-action for real estate video content.

Create a clear, actionable CTA that encourages viewers to: ${goal}

The CTA should:
- Be specific and actionable
- Create urgency or value
- Be natural and conversational
- Include clear next steps
- Be appropriate for video content

Agent Information:
- Name: ${agentName}
- Contact: ${agentContact}

Respond with ONLY the CTA text, no additional explanation.`;

        const userPrompt = `Create a call-to-action for: ${goal}`;

        const result = await this.bedrockClient.invoke(systemPrompt + '\n\n' + userPrompt, userId);

        return result.trim();
    }

    /**
     * Constructs the system prompt for script generation
     */
    private constructSystemPrompt(input: VideoScriptInput, platformConfig: PlatformOptimization | null): string {
        const agentName = input.agentProfile?.agentName || 'a real estate professional';
        const agentMarket = input.agentProfile?.primaryMarket || 'the local market';
        const agentSpecialization = input.agentProfile?.specialization || 'general real estate';

        let prompt = `You are an expert video script writer specializing in real estate content.

You are creating a ${input.style} video script for ${agentName}, who specializes in ${agentSpecialization} in ${agentMarket}.

Video Requirements:
- Topic: ${input.topic}
- Target Duration: ${input.duration} seconds
- Style: ${input.style}
${input.targetAudience ? `- Target Audience: ${input.targetAudience}` : ''}
${input.additionalContext ? `- Additional Context: ${input.additionalContext}` : ''}

Script Structure Requirements:
1. HOOK (${platformConfig?.hookDuration || 3}-5 seconds): Grab attention immediately with a compelling opening
2. SECTIONS: Break content into clear, logical sections with timing
3. CALL-TO-ACTION: End with a clear, actionable CTA

Each section should include:
- Title and content (dialogue/narration)
- Estimated duration
- Visual suggestions (what to show on screen)
- B-roll suggestions (supplementary footage)
- On-screen text suggestions (key points to display)

`;

        if (platformConfig) {
            prompt += `\nPlatform Optimization (${input.platform}):
- Optimal Duration: ${platformConfig.optimalDuration.min}-${platformConfig.optimalDuration.max} seconds
- Hook Duration: ${platformConfig.hookDuration} seconds
- Pacing: ${platformConfig.pacing}
- CTA Placement: ${platformConfig.ctaPlacement}

Platform-Specific Guidelines:
${platformConfig.styleNotes.map(note => `- ${note}`).join('\n')}

`;
        }

        prompt += `\nContent Guidelines:
- Use conversational, authentic language
- Focus on value and actionable insights
- Include specific examples and data when relevant
- Maintain professional yet approachable tone
- Optimize for viewer retention
- Include pattern interrupts to maintain engagement
- Make it scannable with clear sections

SEO Considerations:
- Include relevant keywords naturally
- Create a compelling title
- Write a description that encourages clicks
${input.platform && ['instagram', 'tiktok'].includes(input.platform) ? '- Include relevant hashtags' : ''}

Respond with a complete, production-ready video script in the specified JSON format.`;

        return prompt;
    }

    /**
     * Constructs the user prompt for script generation
     */
    private constructUserPrompt(input: VideoScriptInput): string {
        let prompt = `Create a ${input.duration}-second ${input.style} video script about: ${input.topic}`;

        if (input.keyPoints && input.keyPoints.length > 0) {
            prompt += `\n\nKey Points to Cover:\n${input.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}`;
        }

        if (input.platform) {
            prompt += `\n\nOptimize for ${input.platform}.`;
        }

        return prompt;
    }

    /**
     * Updates strand metrics after task completion
     */
    private updateMetrics(success: boolean, executionTime: number): void {
        this.metrics.tasksCompleted += 1;

        // Update success rate (weighted average of last 20 tasks)
        const recentSuccesses = this.memory.recentTasks.slice(0, 19).filter(t => t.success).length;
        this.metrics.successRate = (recentSuccesses + (success ? 1 : 0)) / Math.min(this.metrics.tasksCompleted, 20);

        // Update average execution time (weighted average of last 10 tasks)
        const recentTimes = this.memory.recentTasks.slice(0, 9).map(t => t.executionTime);
        const totalTime = recentTimes.reduce((sum, t) => sum + t, 0) + executionTime;
        this.metrics.avgExecutionTime = totalTime / Math.min(this.metrics.tasksCompleted, 10);

        // Update current load
        const activeTasks = Object.keys(this.memory.workingMemory).length;
        this.metrics.currentLoad = activeTasks / this.capabilities.maxConcurrentTasks;

        this.metrics.lastUpdated = new Date().toISOString();
    }

    /**
     * Generates a unique strand ID
     */
    private generateStrandId(): string {
        return `video-script-generator_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Singleton instance
 */
let videoScriptGeneratorInstance: VideoScriptGenerator | null = null;

/**
 * Gets the singleton VideoScriptGenerator instance
 */
export function getVideoScriptGenerator(): VideoScriptGenerator {
    if (!videoScriptGeneratorInstance) {
        videoScriptGeneratorInstance = new VideoScriptGenerator();
    }
    return videoScriptGeneratorInstance;
}

/**
 * Resets the VideoScriptGenerator singleton (useful for testing)
 */
export function resetVideoScriptGenerator(): void {
    videoScriptGeneratorInstance = null;
}
