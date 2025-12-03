/**
 * Version Control System
 * 
 * Manages content versioning with creation, history, rollback, and comparison.
 * Ensures all content modifications are tracked and reversible.
 * 
 * Requirements: 11.2
 */

import { getRepository } from '@/aws/dynamodb/repository';
import {
    ContentVersion,
    VersionMetadata,
    VersionDiff,
    DiffSegment,
} from './types';

/**
 * VersionControlSystem class for managing content versions
 */
export class VersionControlSystem {
    private repository: ReturnType<typeof getRepository>;

    constructor() {
        this.repository = getRepository();
    }

    /**
     * Creates a new version of content
     * 
     * @param contentId - Unique identifier for the content
     * @param userId - User ID who owns the content
     * @param content - The content to version
     * @param metadata - Version metadata
     * @returns The created content version
     */
    async createVersion(
        contentId: string,
        userId: string,
        content: string,
        metadata: VersionMetadata
    ): Promise<ContentVersion> {
        // Get existing versions to determine next version number
        const history = await this.getHistory(contentId, userId);
        const versionNumber = history.length + 1;

        const version: ContentVersion = {
            versionNumber,
            content,
            createdAt: new Date().toISOString(),
            createdBy: metadata.editType === 'creation' ? 'user' : 'ai',
            changeDescription: this.generateChangeDescription(metadata),
            metadata: {
                ...metadata,
                wordCount: this.countWords(content),
                characterCount: content.length,
            },
        };

        // Store version in DynamoDB
        await this.repository.create(
            `USER#${userId}`,
            `CONTENT_VERSION#${contentId}#${versionNumber}`,
            'ContentVersion',
            version
        );

        // Update content metadata with latest version
        await this.updateContentMetadata(contentId, userId, versionNumber);

        return version;
    }

    /**
     * Gets the complete version history for content
     * 
     * @param contentId - The content identifier
     * @param userId - The user ID who owns the content
     * @returns Array of all versions in chronological order
     */
    async getHistory(contentId: string, userId: string): Promise<ContentVersion[]> {
        // Query all versions for this content
        const items = await this.repository.query<ContentVersion>(
            `USER#${userId}`,
            `CONTENT_VERSION#${contentId}#`
        );

        // Sort by version number
        return items.sort((a, b) => a.versionNumber - b.versionNumber);
    }

    /**
     * Rolls back content to a previous version
     * 
     * @param contentId - The content identifier
     * @param userId - The user ID who owns the content
     * @param versionNumber - The version number to roll back to
     * @returns The content from the specified version
     */
    async rollback(
        contentId: string,
        userId: string,
        versionNumber: number
    ): Promise<string> {
        // Get the target version
        const targetVersion = await this.repository.get<ContentVersion>(
            `USER#${userId}`,
            `CONTENT_VERSION#${contentId}#${versionNumber}`
        );

        if (!targetVersion) {
            throw new Error(
                `Version ${versionNumber} not found for content ${contentId}`
            );
        }

        // Create a new version that is a rollback
        const rollbackMetadata: VersionMetadata = {
            editType: 'rollback',
            changedSections: ['all'],
            wordCount: targetVersion.metadata.wordCount,
            characterCount: targetVersion.metadata.characterCount,
        };

        await this.createVersion(
            contentId,
            userId,
            targetVersion.content,
            rollbackMetadata
        );

        return targetVersion.content;
    }

    /**
     * Compares two versions and generates a diff
     * 
     * @param contentId - The content identifier
     * @param userId - The user ID who owns the content
     * @param version1 - First version number
     * @param version2 - Second version number
     * @returns Detailed diff between the two versions
     */
    async compareVersions(
        contentId: string,
        userId: string,
        version1: number,
        version2: number
    ): Promise<VersionDiff> {
        // Get both versions
        const v1 = await this.repository.get<ContentVersion>(
            `USER#${userId}`,
            `CONTENT_VERSION#${contentId}#${version1}`
        );
        const v2 = await this.repository.get<ContentVersion>(
            `USER#${userId}`,
            `CONTENT_VERSION#${contentId}#${version2}`
        );

        if (!v1 || !v2) {
            throw new Error(
                `One or both versions not found: ${version1}, ${version2}`
            );
        }

        // Generate diff
        const diff = this.generateDiff(v1.content, v2.content);

        return {
            contentId,
            version1,
            version2,
            additions: diff.additions,
            deletions: diff.deletions,
            modifications: diff.modifications,
            summary: {
                addedWords: diff.additions.reduce(
                    (sum, seg) => sum + this.countWords(seg.text),
                    0
                ),
                deletedWords: diff.deletions.reduce(
                    (sum, seg) => sum + this.countWords(seg.text),
                    0
                ),
                modifiedWords: diff.modifications.reduce(
                    (sum, seg) => sum + this.countWords(seg.text),
                    0
                ),
                overallChange: this.calculateOverallChange(v1.content, v2.content),
            },
        };
    }

    /**
     * Gets a specific version
     * 
     * @param contentId - The content identifier
     * @param userId - The user ID who owns the content
     * @param versionNumber - The version number to retrieve
     * @returns The content version or null if not found
     */
    async getVersion(
        contentId: string,
        userId: string,
        versionNumber: number
    ): Promise<ContentVersion | null> {
        return await this.repository.get<ContentVersion>(
            `USER#${userId}`,
            `CONTENT_VERSION#${contentId}#${versionNumber}`
        );
    }

    /**
     * Gets the latest version number for content
     * 
     * @param contentId - The content identifier
     * @param userId - The user ID who owns the content
     * @returns The latest version number or 0 if no versions exist
     */
    async getLatestVersionNumber(
        contentId: string,
        userId: string
    ): Promise<number> {
        const history = await this.getHistory(contentId, userId);
        return history.length > 0 ? history[history.length - 1].versionNumber : 0;
    }

    /**
     * Deletes all versions for content (use with caution)
     * 
     * @param contentId - The content identifier
     * @param userId - The user ID who owns the content
     */
    async deleteAllVersions(contentId: string, userId: string): Promise<void> {
        const history = await this.getHistory(contentId, userId);

        for (const version of history) {
            await this.repository.delete(
                `USER#${userId}`,
                `CONTENT_VERSION#${contentId}#${version.versionNumber}`
            );
        }

        // Clean up content metadata
        await this.repository.delete(
            `USER#${userId}`,
            `CONTENT_METADATA#${contentId}`
        );
    }

    /**
     * Generates a human-readable change description from metadata
     */
    private generateChangeDescription(metadata: VersionMetadata): string {
        switch (metadata.editType) {
            case 'creation':
                return 'Initial version created';
            case 'refinement':
                return `Refined ${metadata.changedSections.join(', ')}`;
            case 'suggestion':
                return `Applied suggestions to ${metadata.changedSections.join(', ')}`;
            case 'rollback':
                return 'Rolled back to previous version';
            default:
                return 'Content updated';
        }
    }

    /**
     * Updates content metadata with latest version info
     */
    private async updateContentMetadata(
        contentId: string,
        userId: string,
        latestVersion: number
    ): Promise<void> {
        const metadata = {
            contentId,
            latestVersion,
            lastModified: new Date().toISOString(),
        };

        await this.repository.create(
            `USER#${userId}`,
            `CONTENT_METADATA#${contentId}`,
            'ContentMetadata',
            metadata
        );
    }

    /**
     * Generates a diff between two text strings
     */
    private generateDiff(
        text1: string,
        text2: string
    ): {
        additions: DiffSegment[];
        deletions: DiffSegment[];
        modifications: DiffSegment[];
    } {
        const additions: DiffSegment[] = [];
        const deletions: DiffSegment[] = [];
        const modifications: DiffSegment[] = [];

        // Split into sentences for comparison
        const sentences1 = this.splitIntoSentences(text1);
        const sentences2 = this.splitIntoSentences(text2);

        // Simple diff algorithm: compare sentence by sentence
        let index1 = 0;
        let index2 = 0;
        let charIndex1 = 0;
        let charIndex2 = 0;

        while (index1 < sentences1.length || index2 < sentences2.length) {
            if (index1 >= sentences1.length) {
                // Remaining sentences in text2 are additions
                const sentence = sentences2[index2];
                additions.push({
                    text: sentence,
                    startIndex: charIndex2,
                    endIndex: charIndex2 + sentence.length,
                    context: this.getContext(sentences2, index2),
                });
                charIndex2 += sentence.length;
                index2++;
            } else if (index2 >= sentences2.length) {
                // Remaining sentences in text1 are deletions
                const sentence = sentences1[index1];
                deletions.push({
                    text: sentence,
                    startIndex: charIndex1,
                    endIndex: charIndex1 + sentence.length,
                    context: this.getContext(sentences1, index1),
                });
                charIndex1 += sentence.length;
                index1++;
            } else if (sentences1[index1] === sentences2[index2]) {
                // Sentences match, move forward
                charIndex1 += sentences1[index1].length;
                charIndex2 += sentences2[index2].length;
                index1++;
                index2++;
            } else {
                // Sentences differ - check if it's a modification or add/delete
                const similarity = this.calculateSimilarity(
                    sentences1[index1],
                    sentences2[index2]
                );

                if (similarity > 0.5) {
                    // Similar enough to be a modification
                    modifications.push({
                        text: sentences2[index2],
                        startIndex: charIndex2,
                        endIndex: charIndex2 + sentences2[index2].length,
                        context: this.getContext(sentences2, index2),
                    });
                    charIndex1 += sentences1[index1].length;
                    charIndex2 += sentences2[index2].length;
                    index1++;
                    index2++;
                } else {
                    // Check if sentence from text1 appears later in text2
                    const foundInText2 = sentences2
                        .slice(index2 + 1)
                        .indexOf(sentences1[index1]);

                    if (foundInText2 !== -1) {
                        // Sentence was moved or text was added before it
                        const sentence = sentences2[index2];
                        additions.push({
                            text: sentence,
                            startIndex: charIndex2,
                            endIndex: charIndex2 + sentence.length,
                            context: this.getContext(sentences2, index2),
                        });
                        charIndex2 += sentence.length;
                        index2++;
                    } else {
                        // Sentence was deleted
                        const sentence = sentences1[index1];
                        deletions.push({
                            text: sentence,
                            startIndex: charIndex1,
                            endIndex: charIndex1 + sentence.length,
                            context: this.getContext(sentences1, index1),
                        });
                        charIndex1 += sentence.length;
                        index1++;
                    }
                }
            }
        }

        return { additions, deletions, modifications };
    }

    /**
     * Splits text into sentences
     */
    private splitIntoSentences(text: string): string[] {
        // Simple sentence splitting (can be improved with NLP)
        return text
            .split(/[.!?]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    /**
     * Gets context around a sentence
     */
    private getContext(sentences: string[], index: number): string {
        const start = Math.max(0, index - 1);
        const end = Math.min(sentences.length, index + 2);
        return sentences.slice(start, end).join('. ');
    }

    /**
     * Calculates similarity between two strings (0-1)
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) {
            return 1.0;
        }

        const editDistance = this.levenshteinDistance(str1, str2);
        return (longer.length - editDistance) / longer.length;
    }

    /**
     * Calculates Levenshtein distance between two strings
     */
    private levenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Calculates overall change percentage between two texts
     */
    private calculateOverallChange(text1: string, text2: string): number {
        const distance = this.levenshteinDistance(text1, text2);
        const maxLength = Math.max(text1.length, text2.length);
        return maxLength > 0 ? (distance / maxLength) * 100 : 0;
    }

    /**
     * Counts words in text
     */
    private countWords(text: string): number {
        return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
    }
}

/**
 * Creates a new version control system instance
 */
export function createVersionControlSystem(): VersionControlSystem {
    return new VersionControlSystem();
}
