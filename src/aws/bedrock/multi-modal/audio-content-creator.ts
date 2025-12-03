/**
 * Audio Content Creator Strand - Multi-Modal Processing for Audio Content
 * 
 * This strand provides comprehensive audio content generation capabilities for real estate agents,
 * including podcast scripts, voice-optimized narration, pacing notes, and pronunciation guidance.
 * 
 * Features:
 * - Voice-optimized script generation for natural delivery
 * - Pacing and timing notes for professional narration
 * - Pronunciation guidance for technical terms and names
 * - Podcast script formatting with segments and transitions
 * - Audio content optimization for different formats (podcast, voiceover, audio ads)
 * - Real estate content specialization
 * 
 * Requirements validated:
 * - 5.3: Creates podcast scripts or audio content optimized for voice delivery
 * 
 * Property validated:
 * - Property 23: Audio optimization - For any generated audio content,
 *   the script should be optimized for voice delivery (appropriate pacing, pronunciation notes, pauses)
 */

import type { AgentStrand, AgentCapabilities, AgentMemory, AgentMetrics } from '../agent-core';
import { getBedrockClient } from '../client';
import { z } from 'zod';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Audio content format types
 */
export type AudioFormat =
    | 'podcast'
    | 'voiceover'
    | 'audio-ad'
    | 'audiobook'
    | 'voice-message'
    | 'radio-spot';

/**
 * Audio content style types
 */
export type AudioStyle =
    | 'conversational'
    | 'professional'
    | 'storytelling'
    | 'educational'
    | 'promotional'
    | 'interview'
    | 'narrative';

/**
 * Pacing instruction for audio delivery
 */
export interface PacingNote {
    /** Location in script (word/phrase) */
    location: string;

    /** Type of pacing instruction */
    type: 'pause' | 'slow-down' | 'speed-up' | 'emphasis' | 'breath';

    /** Duration in seconds (for pauses) */
    duration?: number;

    /** Instruction details */
    instruction: string;
}

/**
 * Pronunciation guidance for difficult words
 */
export interface PronunciationGuide {
    /** Word or phrase */
    word: string;

    /** Phonetic pronunciation */
    pronunciation: string;

    /** Additional notes */
    notes?: string;
}

/**
 * Audio script segment
 */
export interface AudioSegment {
    /** Segment title/label */
    title: string;

    /** Segment content/script */
    content: string;

    /** Estimated duration in seconds */
    duration: number;

    /** Pacing notes for this segment */
    pacingNotes: PacingNote[];

    /** Tone/delivery style for this segment */
    deliveryStyle: string;

    /** Background music suggestions */
    musicSuggestions?: string[];

    /** Sound effect suggestions */
    soundEffects?: string[];
}

/**
 * Complete audio script
 */
export interface AudioScript {
    /** Script title */
    title: string;

    /** Opening/intro */
    opening: string;

    /** Main script segments */
    segments: AudioSegment[];

    /** Closing/outro */
    closing: string;

    /** Estimated total duration in seconds */
    estimatedDuration: number;

    /** Pronunciation guide for difficult words */
    pronunciationGuide: PronunciationGuide[];

    /** Overall pacing notes */
    overallPacingNotes: string[];

    /** Delivery tips */
    deliveryTips: string[];

    /** Target audience */
    targetAudience?: string;

    /** Key messages */
    keyMessages?: string[];
}

/**
 * Audio content generation input
 */
export interface AudioContentInput {
    /** Topic or subject of the audio content */
    topic: string;

    /** Target duration in seconds */
    duration: number;

    /** Audio format */
    format: AudioFormat;

    /** Audio style */
    style: AudioStyle;

    /** Agent profile for personalization */
    agentProfile?: AgentProfile;

    /** Additional context or requirements */
    additionalContext?: string;

    /** Target audience */
    targetAudience?: string;

    /** Key points to cover */
    keyPoints?: string[];

    /** Tone preference */
    tone?: 'warm' | 'authoritative' | 'friendly' | 'energetic' | 'calm';
}

/**
 * Format-specific optimization parameters
 */
interface FormatOptimization {
    /** Optimal duration range */
    optimalDuration: { min: number; max: number };

    /** Recommended pacing */
    pacing: 'fast' | 'medium' | 'slow';

    /** Segment structure */
    segmentStructure: string[];

    /** Format-specific notes */
    formatNotes: string[];
}

/**
 * Format optimization configurations
 */
const FORMAT_CONFIGS: Record<AudioFormat, FormatOptimization> = {
    podcast: {
        optimalDuration: { min: 900, max: 3600 }, // 15-60 minutes
        pacing: 'medium',
        segmentStructure: ['intro', 'main-content', 'segments', 'outro'],
        formatNotes: [
            'Include intro music and branding',
            'Natural conversational tone',
            'Include transitions between segments',
            'Add call-to-action before outro',
            'Consider listener retention throughout',
        ],
    },
    voiceover: {
        optimalDuration: { min: 30, max: 300 }, // 30 seconds - 5 minutes
        pacing: 'medium',
        segmentStructure: ['hook', 'main-content', 'conclusion'],
        formatNotes: [
            'Clear, professional delivery',
            'Match pacing to visual content',
            'Emphasize key points',
            'Natural pauses for visual transitions',
        ],
    },
    'audio-ad': {
        optimalDuration: { min: 15, max: 60 }, // 15-60 seconds
        pacing: 'fast',
        segmentStructure: ['hook', 'value-proposition', 'call-to-action'],
        formatNotes: [
            'Grab attention immediately',
            'Clear, memorable message',
            'Strong call-to-action',
            'Energetic delivery',
            'Repeat key information',
        ],
    },
    audiobook: {
        optimalDuration: { min: 1800, max: 7200 }, // 30 minutes - 2 hours
        pacing: 'slow',
        segmentStructure: ['introduction', 'chapters', 'conclusion'],
        formatNotes: [
            'Consistent, clear narration',
            'Appropriate pauses for comprehension',
            'Character voices if applicable',
            'Chapter transitions',
        ],
    },
    'voice-message': {
        optimalDuration: { min: 30, max: 180 }, // 30 seconds - 3 minutes
        pacing: 'medium',
        segmentStructure: ['greeting', 'message', 'closing'],
        formatNotes: [
            'Personal, conversational tone',
            'Clear and concise',
            'Warm delivery',
            'Natural pacing',
        ],
    },
    'radio-spot': {
        optimalDuration: { min: 30, max: 60 }, // 30-60 seconds
        pacing: 'fast',
        segmentStructure: ['hook', 'message', 'call-to-action'],
        formatNotes: [
            'Attention-grabbing opening',
            'Clear, memorable message',
            'Strong call-to-action with contact info',
            'Energetic, engaging delivery',
        ],
    },
};

/**
 * AudioContentCreator - Specialized strand for audio content generation
 */
export class AudioContentCreator implements AgentStrand {
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
                'audio-script-writing',
                'voice-optimization',
                'podcast-production',
                'pacing-guidance',
                'pronunciation-coaching',
                'audio-storytelling',
            ],
            taskTypes: [
                'audio-script-generation',
                'podcast-script-creation',
                'voiceover-writing',
                'audio-ad-creation',
            ],
            qualityScore: 0.91,
            speedScore: 0.87,
            reliabilityScore: 0.94,
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
     * Generates a complete audio script optimized for voice delivery
     * 
     * @param input - Audio content generation input
     * @param userId - Optional user ID for tracking
     * @returns Complete audio script with pacing and pronunciation notes
     */
    async generateScript(input: AudioContentInput, userId?: string): Promise<AudioScript> {
        const startTime = Date.now();

        try {
            this.state = 'active';
            this.lastActiveAt = new Date().toISOString();

            // Get format optimization
            const formatConfig = FORMAT_CONFIGS[input.format];

            // Construct the system prompt
            const systemPrompt = this.constructSystemPrompt(input, formatConfig);

            // Construct the user prompt
            const userPrompt = this.constructUserPrompt(input);

            // Define the output schema
            const outputSchema = z.object({
                title: z.string().describe('Compelling audio content title'),
                opening: z.string().describe('Opening/intro script'),
                segments: z.array(z.object({
                    title: z.string(),
                    content: z.string(),
                    duration: z.number(),
                    pacingNotes: z.array(z.object({
                        location: z.string(),
                        type: z.enum(['pause', 'slow-down', 'speed-up', 'emphasis', 'breath']),
                        duration: z.number().optional(),
                        instruction: z.string(),
                    })),
                    deliveryStyle: z.string(),
                    musicSuggestions: z.array(z.string()).optional(),
                    soundEffects: z.array(z.string()).optional(),
                })),
                closing: z.string().describe('Closing/outro script'),
                estimatedDuration: z.number().describe('Total duration in seconds'),
                pronunciationGuide: z.array(z.object({
                    word: z.string(),
                    pronunciation: z.string(),
                    notes: z.string().optional(),
                })),
                overallPacingNotes: z.array(z.string()).describe('General pacing guidance'),
                deliveryTips: z.array(z.string()).describe('Tips for optimal delivery'),
                targetAudience: z.string().optional(),
                keyMessages: z.array(z.string()).optional(),
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
     * Generates a podcast script with segments and transitions
     * 
     * @param topic - Podcast topic
     * @param duration - Target duration in seconds
     * @param agentProfile - Agent profile for personalization
     * @param userId - Optional user ID for tracking
     * @returns Podcast script
     */
    async generatePodcastScript(
        topic: string,
        duration: number,
        agentProfile?: AgentProfile,
        userId?: string
    ): Promise<AudioScript> {
        return this.generateScript({
            topic,
            duration,
            format: 'podcast',
            style: 'conversational',
            agentProfile,
        }, userId);
    }

    /**
     * Generates a voiceover script for video content
     * 
     * @param topic - Voiceover topic
     * @param duration - Target duration in seconds
     * @param style - Delivery style
     * @param userId - Optional user ID for tracking
     * @returns Voiceover script
     */
    async generateVoiceoverScript(
        topic: string,
        duration: number,
        style: AudioStyle = 'professional',
        userId?: string
    ): Promise<AudioScript> {
        return this.generateScript({
            topic,
            duration,
            format: 'voiceover',
            style,
        }, userId);
    }

    /**
     * Generates an audio advertisement script
     * 
     * @param topic - Ad topic/offer
     * @param duration - Target duration in seconds (typically 30 or 60 seconds)
     * @param agentProfile - Agent profile for personalization
     * @param userId - Optional user ID for tracking
     * @returns Audio ad script
     */
    async generateAudioAd(
        topic: string,
        duration: number,
        agentProfile?: AgentProfile,
        userId?: string
    ): Promise<AudioScript> {
        return this.generateScript({
            topic,
            duration,
            format: 'audio-ad',
            style: 'promotional',
            agentProfile,
            tone: 'energetic',
        }, userId);
    }

    /**
     * Optimizes existing text for voice delivery
     * 
     * @param text - Original text
     * @param format - Target audio format
     * @param userId - Optional user ID for tracking
     * @returns Voice-optimized script with pacing notes
     */
    async optimizeForVoice(
        text: string,
        format: AudioFormat,
        userId?: string
    ): Promise<AudioScript> {
        const formatConfig = FORMAT_CONFIGS[format];

        const systemPrompt = `You are an expert audio script optimizer specializing in voice delivery for real estate content.

Your task is to transform written text into voice-optimized scripts with appropriate pacing, pronunciation guidance, and delivery notes.

Format: ${format}
Optimal Duration: ${formatConfig.optimalDuration.min}-${formatConfig.optimalDuration.max} seconds
Pacing: ${formatConfig.pacing}

Format-Specific Guidelines:
${formatConfig.formatNotes.map(note => `- ${note}`).join('\n')}

Voice Optimization Requirements:
1. Break text into natural speaking segments
2. Add pacing notes (pauses, emphasis, speed changes)
3. Identify difficult words and provide pronunciation guidance
4. Add delivery tips for natural, engaging narration
5. Include breath marks for longer passages
6. Suggest appropriate tone and energy levels
7. Mark transitions and segment breaks

Respond with a complete, voice-optimized audio script in the specified JSON format.`;

        const userPrompt = `Please optimize this text for voice delivery as a ${format}:

${text}

Provide a complete audio script with pacing notes, pronunciation guidance, and delivery tips.`;

        const outputSchema = z.object({
            title: z.string(),
            opening: z.string(),
            segments: z.array(z.object({
                title: z.string(),
                content: z.string(),
                duration: z.number(),
                pacingNotes: z.array(z.object({
                    location: z.string(),
                    type: z.enum(['pause', 'slow-down', 'speed-up', 'emphasis', 'breath']),
                    duration: z.number().optional(),
                    instruction: z.string(),
                })),
                deliveryStyle: z.string(),
                musicSuggestions: z.array(z.string()).optional(),
                soundEffects: z.array(z.string()).optional(),
            })),
            closing: z.string(),
            estimatedDuration: z.number(),
            pronunciationGuide: z.array(z.object({
                word: z.string(),
                pronunciation: z.string(),
                notes: z.string().optional(),
            })),
            overallPacingNotes: z.array(z.string()),
            deliveryTips: z.array(z.string()),
            targetAudience: z.string().optional(),
            keyMessages: z.array(z.string()).optional(),
        });

        const result = await this.bedrockClient.invokeWithPrompts<z.infer<typeof outputSchema>>(
            systemPrompt,
            userPrompt,
            outputSchema,
            userId
        );

        return result;
    }

    /**
     * Constructs the system prompt for audio script generation
     */
    private constructSystemPrompt(input: AudioContentInput, formatConfig: FormatOptimization): string {
        const agentName = input.agentProfile?.agentName || 'a real estate professional';
        const agentMarket = input.agentProfile?.primaryMarket || 'the local market';
        const agentSpecialization = input.agentProfile?.specialization || 'general real estate';

        let prompt = `You are an expert audio content creator specializing in voice-optimized scripts for real estate professionals.

You are creating a ${input.format} script in a ${input.style} style for ${agentName}, who specializes in ${agentSpecialization} in ${agentMarket}.

Audio Content Requirements:
- Topic: ${input.topic}
- Target Duration: ${input.duration} seconds
- Format: ${input.format}
- Style: ${input.style}
${input.tone ? `- Tone: ${input.tone}` : ''}
${input.targetAudience ? `- Target Audience: ${input.targetAudience}` : ''}
${input.additionalContext ? `- Additional Context: ${input.additionalContext}` : ''}

Format Guidelines for ${input.format}:
- Optimal Duration: ${formatConfig.optimalDuration.min}-${formatConfig.optimalDuration.max} seconds
- Recommended Pacing: ${formatConfig.pacing}
- Segment Structure: ${formatConfig.segmentStructure.join(' → ')}

Format-Specific Notes:
${formatConfig.formatNotes.map(note => `- ${note}`).join('\n')}

Script Structure Requirements:
1. OPENING: Engaging introduction that hooks the listener
2. SEGMENTS: Main content broken into logical, digestible sections
3. CLOSING: Strong conclusion with clear call-to-action

Voice Optimization Requirements:
- Write for the ear, not the eye (conversational, natural language)
- Use short sentences and simple words
- Include pacing notes (pauses, emphasis, speed changes)
- Mark difficult words with pronunciation guidance
- Add breath marks for natural delivery
- Include delivery tips for tone and energy
- Optimize for listener comprehension and retention

Each segment should include:
- Title and voice-optimized content
- Estimated duration
- Specific pacing notes (where to pause, emphasize, slow down, etc.)
- Delivery style guidance
- Optional music and sound effect suggestions

Pronunciation Guide:
- Identify technical terms, place names, and difficult words
- Provide phonetic pronunciations
- Add contextual notes when helpful

Delivery Tips:
- Overall pacing guidance
- Energy level recommendations
- Tone and emotion notes
- Tips for natural, engaging delivery

Content Guidelines:
- Conversational, natural language (write how people speak)
- Short sentences for easy delivery
- Active voice and present tense
- Specific examples and stories
- Clear transitions between segments
- Appropriate pauses for comprehension
- Engaging, listener-focused content

Real Estate Focus:
- Professional yet approachable
- Value-driven content
- Actionable insights
- Market expertise
- Build trust and authority

Respond with a complete, production-ready audio script in the specified JSON format.`;

        return prompt;
    }

    /**
     * Constructs the user prompt for audio script generation
     */
    private constructUserPrompt(input: AudioContentInput): string {
        let prompt = `Create a ${input.duration}-second ${input.format} script in a ${input.style} style about: ${input.topic}`;

        if (input.keyPoints && input.keyPoints.length > 0) {
            prompt += `\n\nKey Points to Cover:\n${input.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}`;
        }

        prompt += `\n\nProvide a complete audio script optimized for voice delivery with pacing notes, pronunciation guidance, and delivery tips.`;

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
        return `audio-content-creator_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Singleton instance
 */
let audioContentCreatorInstance: AudioContentCreator | null = null;

/**
 * Gets the singleton AudioContentCreator instance
 */
export function getAudioContentCreator(): AudioContentCreator {
    if (!audioContentCreatorInstance) {
        audioContentCreatorInstance = new AudioContentCreator();
    }
    return audioContentCreatorInstance;
}

/**
 * Resets the AudioContentCreator singleton (useful for testing)
 */
export function resetAudioContentCreator(): void {
    audioContentCreatorInstance = null;
}
