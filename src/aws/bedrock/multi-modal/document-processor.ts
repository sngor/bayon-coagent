/**
 * Document Processor Strand - Multi-Modal Processing for Documents
 * 
 * This strand provides comprehensive document processing capabilities for real estate professionals,
 * including key insight extraction, knowledge base integration, and document indexing.
 * 
 * Features:
 * - Key insight extraction from various document types
 * - Document summarization and analysis
 * - Knowledge base integration for searchable content
 * - Document indexing with metadata
 * - Support for multiple document formats (PDF, DOCX, TXT, MD)
 * - Real estate document specialization
 * 
 * Requirements validated:
 * - 5.4: Extracts key insights from uploaded documents and integrates them into the knowledge base
 * 
 * Property validated:
 * - Property 24: Document insight extraction - For any uploaded document,
 *   key insights should be extracted and stored in the knowledge base with proper indexing
 */

import type { AgentStrand, AgentCapabilities, AgentMemory, AgentMetrics } from '../agent-core';
import { getBedrockClient } from '../client';
import { z } from 'zod';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Document format types
 */
export type DocumentFormat = 'pdf' | 'docx' | 'txt' | 'md' | 'html' | 'json';

/**
 * Document type categories
 */
export type DocumentType =
    | 'contract'
    | 'listing-agreement'
    | 'market-report'
    | 'property-disclosure'
    | 'inspection-report'
    | 'appraisal'
    | 'research-paper'
    | 'article'
    | 'guide'
    | 'presentation'
    | 'general';

/**
 * Extracted insight from document
 */
export interface DocumentInsight {
    /** Insight category */
    category: 'key-fact' | 'statistic' | 'recommendation' | 'warning' | 'opportunity' | 'trend';

    /** Insight content */
    content: string;

    /** Importance level */
    importance: 'high' | 'medium' | 'low';

    /** Source location in document */
    sourceLocation?: string;

    /** Related topics/tags */
    tags: string[];

    /** Confidence score (0-1) */
    confidence: number;
}

/**
 * Document summary
 */
export interface DocumentSummary {
    /** Brief summary (1-2 sentences) */
    brief: string;

    /** Detailed summary (1-2 paragraphs) */
    detailed: string;

    /** Key points */
    keyPoints: string[];

    /** Main topics covered */
    topics: string[];

    /** Document purpose/intent */
    purpose: string;
}

/**
 * Document metadata for indexing
 */
export interface DocumentMetadata {
    /** Document title */
    title: string;

    /** Document type */
    type: DocumentType;

    /** Author/source */
    author?: string;

    /** Creation/publication date */
    date?: string;

    /** Document format */
    format: DocumentFormat;

    /** File size in bytes */
    fileSize?: number;

    /** Page count */
    pageCount?: number;

    /** Language */
    language: string;

    /** Keywords for search */
    keywords: string[];

    /** Categories/tags */
    categories: string[];
}

/**
 * Complete document analysis result
 */
export interface DocumentAnalysis {
    /** Document metadata */
    metadata: DocumentMetadata;

    /** Document summary */
    summary: DocumentSummary;

    /** Extracted insights */
    insights: DocumentInsight[];

    /** Key entities mentioned (people, places, organizations) */
    entities: {
        people: string[];
        places: string[];
        organizations: string[];
        properties: string[];
    };

    /** Actionable items extracted */
    actionItems: string[];

    /** Questions raised by the document */
    questions: string[];

    /** Related topics for knowledge base linking */
    relatedTopics: string[];

    /** Overall quality/relevance score */
    qualityScore: number;
}

/**
 * Document processing input
 */
export interface DocumentProcessingInput {
    /** Document content (text extracted from file) */
    content: string;

    /** Document format */
    format: DocumentFormat;

    /** Optional document type hint */
    documentType?: DocumentType;

    /** Optional filename */
    filename?: string;

    /** Agent profile for personalization */
    agentProfile?: AgentProfile;

    /** Processing focus */
    focus?: 'insights' | 'summary' | 'comprehensive' | 'indexing';

    /** Additional context */
    additionalContext?: string;
}

/**
 * Knowledge base entry for document
 */
export interface KnowledgeBaseEntry {
    /** Unique entry ID */
    id: string;

    /** Document metadata */
    metadata: DocumentMetadata;

    /** Document summary */
    summary: string;

    /** Searchable content chunks */
    contentChunks: {
        text: string;
        embedding?: number[];
        metadata: Record<string, any>;
    }[];

    /** Extracted insights */
    insights: DocumentInsight[];

    /** Tags for categorization */
    tags: string[];

    /** Creation timestamp */
    createdAt: string;

    /** Last updated timestamp */
    updatedAt: string;
}

/**
 * DocumentProcessor - Specialized strand for document processing and knowledge extraction
 */
export class DocumentProcessor implements AgentStrand {
    id: string;
    type: 'data-analyst' = 'data-analyst';
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
                'document-analysis',
                'insight-extraction',
                'knowledge-management',
                'document-indexing',
                'content-summarization',
                'entity-extraction',
            ],
            taskTypes: [
                'document-processing',
                'insight-extraction',
                'document-summarization',
                'knowledge-base-integration',
            ],
            qualityScore: 0.93,
            speedScore: 0.84,
            reliabilityScore: 0.96,
            maxConcurrentTasks: 3,
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
     * Processes a document and extracts comprehensive analysis
     * 
     * @param input - Document processing input
     * @param userId - Optional user ID for tracking
     * @returns Complete document analysis
     */
    async processDocument(input: DocumentProcessingInput, userId?: string): Promise<DocumentAnalysis> {
        const startTime = Date.now();

        try {
            this.state = 'active';
            this.lastActiveAt = new Date().toISOString();

            // Construct the system prompt
            const systemPrompt = this.constructSystemPrompt(input);

            // Construct the user prompt
            const userPrompt = this.constructUserPrompt(input);

            // Define the output schema
            const outputSchema = z.object({
                metadata: z.object({
                    title: z.string(),
                    type: z.enum([
                        'contract',
                        'listing-agreement',
                        'market-report',
                        'property-disclosure',
                        'inspection-report',
                        'appraisal',
                        'research-paper',
                        'article',
                        'guide',
                        'presentation',
                        'general',
                    ]),
                    author: z.string().optional(),
                    date: z.string().optional(),
                    format: z.enum(['pdf', 'docx', 'txt', 'md', 'html', 'json']),
                    fileSize: z.number().optional(),
                    pageCount: z.number().optional(),
                    language: z.string(),
                    keywords: z.array(z.string()),
                    categories: z.array(z.string()),
                }),
                summary: z.object({
                    brief: z.string(),
                    detailed: z.string(),
                    keyPoints: z.array(z.string()),
                    topics: z.array(z.string()),
                    purpose: z.string(),
                }),
                insights: z.array(z.object({
                    category: z.enum(['key-fact', 'statistic', 'recommendation', 'warning', 'opportunity', 'trend']),
                    content: z.string(),
                    importance: z.enum(['high', 'medium', 'low']),
                    sourceLocation: z.string().optional(),
                    tags: z.array(z.string()),
                    confidence: z.number(),
                })),
                entities: z.object({
                    people: z.array(z.string()),
                    places: z.array(z.string()),
                    organizations: z.array(z.string()),
                    properties: z.array(z.string()),
                }),
                actionItems: z.array(z.string()),
                questions: z.array(z.string()),
                relatedTopics: z.array(z.string()),
                qualityScore: z.number(),
            });

            // Invoke Bedrock
            const result = await this.bedrockClient.invokeWithPrompts<z.infer<typeof outputSchema>>(
                systemPrompt,
                userPrompt,
                outputSchema
            );

            // Update metrics
            const executionTime = Date.now() - startTime;
            this.updateMetrics(true, executionTime);

            return result as DocumentAnalysis;

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
     * Extracts key insights from a document
     * 
     * @param content - Document content
     * @param format - Document format
     * @param userId - Optional user ID for tracking
     * @returns Extracted insights
     */
    async extractInsights(
        content: string,
        format: DocumentFormat,
        userId?: string
    ): Promise<DocumentInsight[]> {
        const analysis = await this.processDocument({
            content,
            format,
            focus: 'insights',
        }, userId);

        return analysis.insights;
    }

    /**
     * Generates a summary of a document
     * 
     * @param content - Document content
     * @param format - Document format
     * @param userId - Optional user ID for tracking
     * @returns Document summary
     */
    async summarizeDocument(
        content: string,
        format: DocumentFormat,
        userId?: string
    ): Promise<DocumentSummary> {
        const analysis = await this.processDocument({
            content,
            format,
            focus: 'summary',
        }, userId);

        return analysis.summary;
    }

    /**
     * Indexes a document for knowledge base integration
     * 
     * @param content - Document content
     * @param format - Document format
     * @param filename - Optional filename
     * @param agentProfile - Optional agent profile
     * @param userId - Optional user ID for tracking
     * @returns Knowledge base entry
     */
    async indexDocument(
        content: string,
        format: DocumentFormat,
        filename?: string,
        agentProfile?: AgentProfile,
        userId?: string
    ): Promise<KnowledgeBaseEntry> {
        const analysis = await this.processDocument({
            content,
            format,
            filename,
            agentProfile,
            focus: 'indexing',
        }, userId);

        // Create knowledge base entry
        const entry: KnowledgeBaseEntry = {
            id: this.generateEntryId(),
            metadata: analysis.metadata,
            summary: analysis.summary.detailed,
            contentChunks: this.chunkContent(content, analysis),
            insights: analysis.insights,
            tags: [...analysis.metadata.keywords, ...analysis.metadata.categories],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Store in memory for potential retrieval
        this.memory.knowledgeBase[entry.id] = entry;

        return entry;
    }

    /**
     * Searches indexed documents by query
     * 
     * @param query - Search query
     * @param limit - Maximum number of results
     * @returns Matching knowledge base entries
     */
    async searchDocuments(query: string, limit: number = 10): Promise<KnowledgeBaseEntry[]> {
        // Simple keyword-based search in memory
        // In production, this would use semantic search with embeddings
        const entries = Object.values(this.memory.knowledgeBase) as KnowledgeBaseEntry[];
        const queryLower = query.toLowerCase();

        const scored = entries.map(entry => {
            let score = 0;

            // Check title
            if (entry.metadata.title.toLowerCase().includes(queryLower)) {
                score += 10;
            }

            // Check summary
            if (entry.summary.toLowerCase().includes(queryLower)) {
                score += 5;
            }

            // Check tags
            const matchingTags = entry.tags.filter(tag =>
                tag.toLowerCase().includes(queryLower)
            ).length;
            score += matchingTags * 3;

            // Check insights
            const matchingInsights = entry.insights.filter(insight =>
                insight.content.toLowerCase().includes(queryLower)
            ).length;
            score += matchingInsights * 2;

            return { entry, score };
        });

        return scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.entry);
    }

    /**
     * Chunks document content for knowledge base storage
     */
    private chunkContent(content: string, analysis: DocumentAnalysis): KnowledgeBaseEntry['contentChunks'] {
        // Split content into chunks of approximately 500 words
        const words = content.split(/\s+/);
        const chunkSize = 500;
        const chunks: KnowledgeBaseEntry['contentChunks'] = [];

        for (let i = 0; i < words.length; i += chunkSize) {
            const chunkWords = words.slice(i, i + chunkSize);
            const chunkText = chunkWords.join(' ');

            chunks.push({
                text: chunkText,
                metadata: {
                    chunkIndex: chunks.length,
                    wordCount: chunkWords.length,
                    startPosition: i,
                    endPosition: i + chunkWords.length,
                },
            });
        }

        return chunks;
    }

    /**
     * Constructs the system prompt for document processing
     */
    private constructSystemPrompt(input: DocumentProcessingInput): string {
        const agentName = input.agentProfile?.agentName || 'a real estate professional';
        const agentMarket = input.agentProfile?.primaryMarket || 'the local market';
        const agentSpecialization = input.agentProfile?.specialization || 'general real estate';

        let prompt = `You are an expert document analyst specializing in real estate content extraction and knowledge management.

You are processing a document for ${agentName}, who specializes in ${agentSpecialization} in ${agentMarket}.

Document Processing Requirements:
- Format: ${input.format}
${input.documentType ? `- Document Type: ${input.documentType}` : ''}
${input.filename ? `- Filename: ${input.filename}` : ''}
${input.additionalContext ? `- Additional Context: ${input.additionalContext}` : ''}

Your task is to perform comprehensive document analysis including:

1. METADATA EXTRACTION:
   - Identify document title, type, author, date
   - Extract keywords and categories
   - Determine language and document characteristics
   - Assess document quality and relevance

2. SUMMARIZATION:
   - Create brief summary (1-2 sentences)
   - Create detailed summary (1-2 paragraphs)
   - Extract key points (5-10 bullet points)
   - Identify main topics covered
   - Determine document purpose/intent

3. INSIGHT EXTRACTION:
   - Identify key facts and statistics
   - Extract recommendations and best practices
   - Flag warnings or important notices
   - Identify opportunities mentioned
   - Detect trends or patterns
   - Assess importance and confidence for each insight
   - Tag insights with relevant topics

4. ENTITY EXTRACTION:
   - Identify people mentioned (names, roles)
   - Extract places (cities, neighborhoods, addresses)
   - Identify organizations (companies, agencies)
   - Extract property references (addresses, descriptions)

5. ACTION ITEMS:
   - Extract actionable tasks or next steps
   - Identify deadlines or time-sensitive items
   - Note required follow-ups

6. QUESTIONS & TOPICS:
   - Identify questions raised by the document
   - Extract related topics for knowledge base linking
   - Suggest connections to other content

7. QUALITY ASSESSMENT:
   - Assess overall document quality (0-1 scale)
   - Consider relevance, accuracy, completeness
   - Evaluate usefulness for real estate professional

`;

        if (input.focus) {
            prompt += `\nProcessing Focus: ${input.focus}
`;
            switch (input.focus) {
                case 'insights':
                    prompt += 'Prioritize deep insight extraction with high-quality analysis.\n';
                    break;
                case 'summary':
                    prompt += 'Prioritize comprehensive summarization and key point extraction.\n';
                    break;
                case 'indexing':
                    prompt += 'Prioritize metadata extraction and knowledge base integration.\n';
                    break;
                case 'comprehensive':
                    prompt += 'Provide complete analysis across all dimensions.\n';
                    break;
            }
        }

        prompt += `
Real Estate Context:
- Focus on information relevant to real estate professionals
- Prioritize market insights, property data, and industry trends
- Extract actionable intelligence for business decisions
- Identify compliance and legal considerations
- Note competitive intelligence and market opportunities

Analysis Guidelines:
- Be thorough and accurate
- Provide specific, actionable insights
- Use clear, professional language
- Tag content appropriately for searchability
- Assess confidence levels honestly
- Prioritize high-value information
- Consider the agent's market and specialization

Respond with a complete document analysis in the specified JSON format.`;

        return prompt;
    }

    /**
     * Constructs the user prompt for document processing
     */
    private constructUserPrompt(input: DocumentProcessingInput): string {
        let prompt = `Please analyze this document and extract comprehensive insights:

`;

        if (input.filename) {
            prompt += `Filename: ${input.filename}\n`;
        }

        prompt += `Format: ${input.format}\n`;

        if (input.documentType) {
            prompt += `Document Type: ${input.documentType}\n`;
        }

        prompt += `\nDocument Content:\n${input.content}`;

        if (input.focus) {
            prompt += `\n\nFocus on: ${input.focus}`;
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
        return `document-processor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Generates a unique entry ID for knowledge base
     */
    private generateEntryId(): string {
        return `kb-entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
}

/**
 * Singleton instance
 */
let documentProcessorInstance: DocumentProcessor | null = null;

/**
 * Gets the singleton DocumentProcessor instance
 */
export function getDocumentProcessor(): DocumentProcessor {
    if (!documentProcessorInstance) {
        documentProcessorInstance = new DocumentProcessor();
    }
    return documentProcessorInstance;
}

/**
 * Resets the DocumentProcessor singleton (useful for testing)
 */
export function resetDocumentProcessor(): void {
    documentProcessorInstance = null;
}
