/**
 * Types for Collaborative Editing System
 * 
 * Supports conversational editing, version control, and content refinement
 */

/**
 * Editing session state
 */
export interface EditingSession {
    sessionId: string;
    contentId: string;
    userId: string;
    versions: ContentVersion[];
    currentVersion: number;
    startedAt: string;
    lastActivityAt: string;
    status: 'active' | 'paused' | 'completed';
    metadata: {
        contentType: string;
        originalLength: number;
        editCount: number;
    };
}

/**
 * Content version with metadata
 */
export interface ContentVersion {
    versionNumber: number;
    content: string;
    createdAt: string;
    createdBy: 'user' | 'ai';
    changeDescription: string;
    metadata: VersionMetadata;
}

/**
 * Version metadata
 */
export interface VersionMetadata {
    editType: 'creation' | 'refinement' | 'suggestion' | 'rollback';
    changedSections: string[];
    wordCount: number;
    characterCount: number;
    confidence?: number;
}

/**
 * Edit request from user
 */
export interface EditRequest {
    sessionId: string;
    request: string;
    context?: Record<string, any>;
    preferences?: {
        tone?: string;
        style?: string;
        length?: 'shorter' | 'longer' | 'same';
    };
}

/**
 * Edit suggestion from AI
 */
export interface EditSuggestion {
    suggestionId: string;
    sessionId: string;
    originalContent: string;
    suggestedContent: string;
    changes: ContentChange[];
    rationale: string;
    confidence: number;
    createdAt: string;
}

/**
 * Individual content change
 */
export interface ContentChange {
    type: 'addition' | 'deletion' | 'modification';
    section: string;
    originalText?: string;
    newText?: string;
    startIndex: number;
    endIndex: number;
    reason: string;
}

/**
 * Editing session summary
 */
export interface EditingSummary {
    sessionId: string;
    totalVersions: number;
    totalEdits: number;
    duration: number;
    finalContent: string;
    improvements: string[];
    learnings: EditingLearning[];
}

/**
 * Learning from editing session
 */
export interface EditingLearning {
    pattern: string;
    frequency: number;
    context: string;
    shouldApplyToFuture: boolean;
}

/**
 * Version comparison result
 */
export interface VersionDiff {
    contentId: string;
    version1: number;
    version2: number;
    additions: DiffSegment[];
    deletions: DiffSegment[];
    modifications: DiffSegment[];
    summary: {
        addedWords: number;
        deletedWords: number;
        modifiedWords: number;
        overallChange: number;
    };
}

/**
 * Diff segment
 */
export interface DiffSegment {
    text: string;
    startIndex: number;
    endIndex: number;
    context: string;
}

/**
 * Conversational context
 */
export interface ConversationalContext {
    sessionId: string;
    conversationHistory: ConversationTurn[];
    currentFocus: string;
    userPreferences: Record<string, any>;
    contentContext: Record<string, any>;
}

/**
 * Conversation turn
 */
export interface ConversationTurn {
    speaker: 'user' | 'ai';
    message: string;
    timestamp: string;
    metadata?: Record<string, any>;
}

/**
 * Edit application result
 */
export interface EditApplicationResult {
    success: boolean;
    newVersion: number;
    newContent: string;
    appliedChanges: ContentChange[];
    rejectedChanges: ContentChange[];
    message: string;
}

/**
 * Preserved element in content adaptation
 */
export interface PreservedElement {
    type: 'key-point' | 'fact' | 'call-to-action' | 'brand-message';
    content: string;
    preserved: boolean;
    location: string;
}
