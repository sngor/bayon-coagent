/**
 * Conversational Editor
 * 
 * Enables iterative content refinement through natural conversation.
 * Supports conversational understanding, suggestion generation, and edit application.
 * 
 * Requirements: 11.1, 11.3
 */

import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { getBedrockClient } from '../client';
import { getRepository } from '@/aws/dynamodb/repository';
import {
    EditingSession,
    ContentVersion,
    EditRequest,
    EditSuggestion,
    EditApplicationResult,
    EditingSummary,
    ContentChange,
    ConversationalContext,
    ConversationTurn,
    VersionMetadata,
    EditingLearning,
} from './types';

/**
 * ConversationalEditor class for managing editing sessions
 */
export class ConversationalEditor {
    private client: BedrockRuntimeClient;
    private repository: ReturnType<typeof getRepository>;
    private modelId: string;

    constructor(
        client?: BedrockRuntimeClient,
        modelId: string = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
    ) {
        const bedrockClient = client || getBedrockClient();
        // Ensure we have a BedrockRuntimeClient
        if ('config' in bedrockClient && 'send' in bedrockClient) {
            this.client = bedrockClient as BedrockRuntimeClient;
        } else {
            throw new Error('Invalid Bedrock client provided');
        }
        this.repository = getRepository();
        this.modelId = modelId;
    }

    /**
     * Starts a new editing session
     * 
     * @param contentId - Unique identifier for the content
     * @param initialContent - The initial content to edit
     * @param userId - User ID for the session
     * @param contentType - Type of content (e.g., 'blog-post', 'social-media')
     * @returns The created editing session
     */
    async startEditingSession(
        contentId: string,
        initialContent: string,
        userId: string,
        contentType: string = 'text'
    ): Promise<EditingSession> {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const initialVersion: ContentVersion = {
            versionNumber: 1,
            content: initialContent,
            createdAt: now,
            createdBy: 'user',
            changeDescription: 'Initial version',
            metadata: {
                editType: 'creation',
                changedSections: [],
                wordCount: this.countWords(initialContent),
                characterCount: initialContent.length,
            },
        };

        const session: EditingSession = {
            sessionId,
            contentId,
            userId,
            versions: [initialVersion],
            currentVersion: 1,
            startedAt: now,
            lastActivityAt: now,
            status: 'active',
            metadata: {
                contentType,
                originalLength: initialContent.length,
                editCount: 0,
            },
        };

        // Store session in DynamoDB
        await this.repository.create(
            `USER#${userId}`,
            `EDITING_SESSION#${sessionId}`,
            'EditingSession',
            session
        );

        return session;
    }

    /**
     * Processes an edit request through conversational understanding
     * 
     * @param sessionId - The editing session ID
     * @param userId - The user ID
     * @param request - The user's edit request
     * @returns An edit suggestion based on the request
     */
    async processEditRequest(
        sessionId: string,
        userId: string,
        request: string
    ): Promise<EditSuggestion> {
        // Retrieve session
        const session = await this.getSession(sessionId, userId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // Get current content
        const currentVersion = session.versions[session.currentVersion - 1];
        const currentContent = currentVersion.content;

        // Build conversational context
        const context = await this.buildConversationalContext(session, request);

        // Generate edit suggestion using AI
        const suggestion = await this.generateEditSuggestion(
            currentContent,
            request,
            context
        );

        // Store suggestion
        await this.storeSuggestion(session.userId, suggestion);

        // Update session activity
        await this.updateSessionActivity(session);

        return suggestion;
    }

    /**
     * Applies an edit to the content
     * 
     * @param sessionId - The editing session ID
     * @param userId - The user ID
     * @param edit - The edit suggestion to apply
     * @param approved - Whether the user approved the edit
     * @returns The result of applying the edit
     */
    async applyEdit(
        sessionId: string,
        userId: string,
        edit: EditSuggestion,
        approved: boolean
    ): Promise<EditApplicationResult> {
        const session = await this.getSession(sessionId, userId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        if (!approved) {
            return {
                success: false,
                newVersion: session.currentVersion,
                newContent: session.versions[session.currentVersion - 1].content,
                appliedChanges: [],
                rejectedChanges: edit.changes,
                message: 'Edit rejected by user',
            };
        }

        // Create new version with the suggested content
        const newVersion: ContentVersion = {
            versionNumber: session.currentVersion + 1,
            content: edit.suggestedContent,
            createdAt: new Date().toISOString(),
            createdBy: 'ai',
            changeDescription: edit.rationale,
            metadata: {
                editType: 'refinement',
                changedSections: edit.changes.map((c) => c.section),
                wordCount: this.countWords(edit.suggestedContent),
                characterCount: edit.suggestedContent.length,
                confidence: edit.confidence,
            },
        };

        // Update session
        session.versions.push(newVersion);
        session.currentVersion = newVersion.versionNumber;
        session.lastActivityAt = new Date().toISOString();
        session.metadata.editCount += 1;

        // Save updated session
        await this.repository.update(
            `USER#${session.userId}`,
            `EDITING_SESSION#${sessionId}`,
            {
                versions: session.versions,
                currentVersion: session.currentVersion,
                lastActivityAt: session.lastActivityAt,
                metadata: session.metadata,
            }
        );

        return {
            success: true,
            newVersion: newVersion.versionNumber,
            newContent: newVersion.content,
            appliedChanges: edit.changes,
            rejectedChanges: [],
            message: 'Edit applied successfully',
        };
    }

    /**
     * Ends an editing session and generates a summary
     * 
     * @param sessionId - The editing session ID
     * @param userId - The user ID
     * @returns A summary of the editing session
     */
    async endSession(sessionId: string, userId: string): Promise<EditingSummary> {
        const session = await this.getSession(sessionId, userId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        const duration =
            new Date(session.lastActivityAt).getTime() -
            new Date(session.startedAt).getTime();

        // Analyze improvements
        const improvements = await this.analyzeImprovements(session);

        // Extract learnings
        const learnings = await this.extractLearnings(session);

        const summary: EditingSummary = {
            sessionId,
            totalVersions: session.versions.length,
            totalEdits: session.metadata.editCount,
            duration,
            finalContent: session.versions[session.currentVersion - 1].content,
            improvements,
            learnings,
        };

        // Update session status
        await this.repository.update(
            `USER#${session.userId}`,
            `EDITING_SESSION#${sessionId}`,
            {
                status: 'completed',
            }
        );

        // Store summary
        await this.repository.create(
            `USER#${session.userId}`,
            `EDITING_SUMMARY#${sessionId}`,
            'EditingSummary',
            summary
        );

        return summary;
    }

    /**
     * Builds conversational context from session history
     */
    private async buildConversationalContext(
        session: EditingSession,
        currentRequest: string
    ): Promise<ConversationalContext> {
        // Get conversation history from previous edits
        const conversationHistory: ConversationTurn[] = [];

        // Add version history as conversation turns
        for (let i = 1; i < session.versions.length; i++) {
            const version = session.versions[i];
            conversationHistory.push({
                speaker: 'user',
                message: `Edit request: ${version.changeDescription}`,
                timestamp: version.createdAt,
            });
            conversationHistory.push({
                speaker: 'ai',
                message: `Applied changes to ${version.metadata.changedSections.join(', ')}`,
                timestamp: version.createdAt,
            });
        }

        // Add current request
        conversationHistory.push({
            speaker: 'user',
            message: currentRequest,
            timestamp: new Date().toISOString(),
        });

        return {
            sessionId: session.sessionId,
            conversationHistory,
            currentFocus: this.extractFocus(currentRequest),
            userPreferences: {},
            contentContext: {
                contentType: session.metadata.contentType,
                currentLength: session.versions[session.currentVersion - 1].content.length,
                editCount: session.metadata.editCount,
            },
        };
    }

    /**
     * Generates an edit suggestion using AI
     */
    private async generateEditSuggestion(
        currentContent: string,
        request: string,
        context: ConversationalContext
    ): Promise<EditSuggestion> {
        const systemPrompt = `You are an expert content editor helping refine content through conversation.
Your role is to understand edit requests and suggest specific improvements.

Current content:
${currentContent}

Edit request: ${request}

Provide a detailed edit suggestion that:
1. Understands the user's intent
2. Makes specific, targeted changes
3. Explains the rationale for each change
4. Maintains the core message and style

Respond in JSON format with:
{
  "suggestedContent": "the edited content",
  "changes": [
    {
      "type": "addition|deletion|modification",
      "section": "section name",
      "originalText": "original text if applicable",
      "newText": "new text if applicable",
      "startIndex": 0,
      "endIndex": 0,
      "reason": "explanation"
    }
  ],
  "rationale": "overall explanation of changes",
  "confidence": 0.95
}`;

        const command = new ConverseCommand({
            modelId: this.modelId,
            messages: [
                {
                    role: 'user',
                    content: [{ text: systemPrompt }],
                },
            ],
            inferenceConfig: {
                temperature: 0.7,
                maxTokens: 4000,
            },
        });

        const response = await this.client.send(command);
        const responseText = response.output?.message?.content?.[0]?.text || '{}';

        // Parse AI response
        let aiResponse;
        try {
            aiResponse = JSON.parse(responseText);
        } catch (error) {
            // Fallback if JSON parsing fails
            aiResponse = {
                suggestedContent: currentContent,
                changes: [],
                rationale: 'Unable to generate specific suggestions',
                confidence: 0.5,
            };
        }

        const suggestionId = `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        return {
            suggestionId,
            sessionId: context.sessionId,
            originalContent: currentContent,
            suggestedContent: aiResponse.suggestedContent || currentContent,
            changes: aiResponse.changes || [],
            rationale: aiResponse.rationale || 'Content refinement',
            confidence: aiResponse.confidence || 0.8,
            createdAt: new Date().toISOString(),
        };
    }

    /**
     * Retrieves a session from storage
     * Note: This is a simplified implementation. In production, you should:
     * 1. Pass userId to this method
     * 2. Use a GSI for querying by sessionId
     * 3. Store sessionId -> userId mapping
     */
    private async getSession(sessionId: string, userId: string): Promise<EditingSession | null> {
        const item = await this.repository.get<EditingSession>(
            `USER#${userId}`,
            `EDITING_SESSION#${sessionId}`
        );
        return item;
    }

    /**
     * Stores an edit suggestion
     */
    private async storeSuggestion(
        userId: string,
        suggestion: EditSuggestion
    ): Promise<void> {
        await this.repository.create(
            `USER#${userId}`,
            `EDIT_SUGGESTION#${suggestion.suggestionId}`,
            'EditSuggestion',
            suggestion
        );
    }

    /**
     * Updates session activity timestamp
     */
    private async updateSessionActivity(session: EditingSession): Promise<void> {
        await this.repository.update(
            `USER#${session.userId}`,
            `EDITING_SESSION#${session.sessionId}`,
            {
                lastActivityAt: new Date().toISOString(),
            }
        );
    }

    /**
     * Analyzes improvements made during the session
     */
    private async analyzeImprovements(
        session: EditingSession
    ): Promise<string[]> {
        const improvements: string[] = [];

        const firstVersion = session.versions[0];
        const lastVersion = session.versions[session.versions.length - 1];

        // Word count change
        const wordCountChange =
            lastVersion.metadata.wordCount - firstVersion.metadata.wordCount;
        if (wordCountChange !== 0) {
            improvements.push(
                `Content ${wordCountChange > 0 ? 'expanded' : 'condensed'} by ${Math.abs(wordCountChange)} words`
            );
        }

        // Sections edited
        const allSections = new Set<string>();
        session.versions.forEach((v) => {
            v.metadata.changedSections.forEach((s) => allSections.add(s));
        });
        if (allSections.size > 0) {
            improvements.push(`Refined ${allSections.size} sections`);
        }

        // Edit count
        if (session.metadata.editCount > 0) {
            improvements.push(`Applied ${session.metadata.editCount} refinements`);
        }

        return improvements;
    }

    /**
     * Extracts learnings from the editing session
     */
    private async extractLearnings(
        session: EditingSession
    ): Promise<EditingLearning[]> {
        const learnings: EditingLearning[] = [];

        // Analyze patterns in edits
        const sectionFrequency = new Map<string, number>();
        session.versions.forEach((v) => {
            v.metadata.changedSections.forEach((section) => {
                sectionFrequency.set(section, (sectionFrequency.get(section) || 0) + 1);
            });
        });

        // Create learnings from frequent edits
        sectionFrequency.forEach((frequency, section) => {
            if (frequency > 1) {
                learnings.push({
                    pattern: `Frequent edits to ${section}`,
                    frequency,
                    context: session.metadata.contentType,
                    shouldApplyToFuture: frequency > 2,
                });
            }
        });

        return learnings;
    }

    /**
     * Extracts the focus area from a request
     */
    private extractFocus(request: string): string {
        const lowerRequest = request.toLowerCase();

        if (lowerRequest.includes('tone') || lowerRequest.includes('voice')) {
            return 'tone';
        }
        if (lowerRequest.includes('length') || lowerRequest.includes('shorter') || lowerRequest.includes('longer')) {
            return 'length';
        }
        if (lowerRequest.includes('clarity') || lowerRequest.includes('clear')) {
            return 'clarity';
        }
        if (lowerRequest.includes('grammar') || lowerRequest.includes('spelling')) {
            return 'grammar';
        }
        if (lowerRequest.includes('structure') || lowerRequest.includes('organization')) {
            return 'structure';
        }

        return 'general';
    }

    /**
     * Counts words in text
     */
    private countWords(text: string): number {
        return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
    }
}

/**
 * Creates a new conversational editor instance
 */
export function createConversationalEditor(
    client?: BedrockRuntimeClient,
    modelId?: string
): ConversationalEditor {
    return new ConversationalEditor(client, modelId);
}
