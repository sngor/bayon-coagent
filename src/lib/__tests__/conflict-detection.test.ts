/**
 * Tests for Conflict Detection System
 */

import {
    generateContentHash,
    detectConflict,
    detectDraftConflict,
    detectEditConflict,
    canAutoResolve,
    autoResolveConflict,
    mergeContent,
    getConflictSummary
} from '../conflict-detection';
import { DraftItem } from '../indexeddb-schema';

describe('Conflict Detection', () => {
    describe('generateContentHash', () => {
        it('should generate consistent hashes for identical content', () => {
            const content1 = 'Hello world';
            const content2 = 'Hello world';

            expect(generateContentHash(content1)).toBe(generateContentHash(content2));
        });

        it('should generate different hashes for different content', () => {
            const content1 = 'Hello world';
            const content2 = 'Hello universe';

            expect(generateContentHash(content1)).not.toBe(generateContentHash(content2));
        });

        it('should handle object content', () => {
            const content1 = { title: 'Test', body: 'Content' };
            const content2 = { title: 'Test', body: 'Content' };
            const content3 = { title: 'Test', body: 'Different' };

            expect(generateContentHash(content1)).toBe(generateContentHash(content2));
            expect(generateContentHash(content1)).not.toBe(generateContentHash(content3));
        });
    });

    describe('detectConflict', () => {
        it('should return null for identical content', () => {
            const localVersion = {
                id: 'test-1',
                content: 'Same content',
                timestamp: Date.now()
            };

            const remoteVersion = {
                id: 'test-1',
                content: 'Same content',
                timestamp: Date.now()
            };

            const conflict = detectConflict(localVersion, remoteVersion);
            expect(conflict).toBeNull();
        });

        it('should detect content conflicts', () => {
            const localVersion = {
                id: 'test-1',
                content: 'Local content',
                timestamp: Date.now()
            };

            const remoteVersion = {
                id: 'test-1',
                content: 'Remote content',
                timestamp: Date.now()
            };

            const conflict = detectConflict(localVersion, remoteVersion);
            expect(conflict).not.toBeNull();
            expect(conflict?.conflictType).toBe('both'); // Same timestamp, different content
        });

        it('should detect timestamp conflicts', () => {
            const baseTime = Date.now();
            const localVersion = {
                id: 'test-1',
                content: 'Different content',
                timestamp: baseTime + 10 * 60 * 1000 // 10 minutes later
            };

            const remoteVersion = {
                id: 'test-1',
                content: 'Remote content',
                timestamp: baseTime
            };

            const conflict = detectConflict(localVersion, remoteVersion);
            expect(conflict).not.toBeNull();
            expect(conflict?.conflictType).toBe('timestamp');
        });
    });

    describe('detectDraftConflict', () => {
        it('should detect conflicts in draft items', () => {
            const localDraft: DraftItem = {
                id: 'draft-1',
                type: 'blog',
                content: { title: 'Local Title', body: 'Local content' },
                lastModified: Date.now(),
                synced: false,
                userId: 'user-1'
            };

            const remoteDraft = {
                id: 'draft-1',
                content: { title: 'Remote Title', body: 'Remote content' },
                lastModified: Date.now(),
                userId: 'user-1'
            };

            const conflict = detectDraftConflict(localDraft, remoteDraft);
            expect(conflict).not.toBeNull();
            expect(conflict?.type).toBe('draft');
        });
    });

    describe('canAutoResolve', () => {
        it('should allow auto-resolve for significantly different timestamps', () => {
            const baseTime = Date.now();
            const conflict = {
                id: 'conflict-1',
                type: 'content' as const,
                localVersion: {
                    id: 'test-1',
                    content: 'Local content',
                    timestamp: baseTime + 2 * 60 * 60 * 1000, // 2 hours later
                    contentHash: 'hash1',
                    source: 'local' as const
                },
                remoteVersion: {
                    id: 'test-1',
                    content: 'Remote content',
                    timestamp: baseTime,
                    contentHash: 'hash2',
                    source: 'remote' as const
                },
                conflictType: 'timestamp' as const,
                detectedAt: Date.now(),
                resolved: false
            };

            expect(canAutoResolve(conflict)).toBe(true);
        });

        it('should not allow auto-resolve for recent conflicts', () => {
            const baseTime = Date.now();
            const conflict = {
                id: 'conflict-1',
                type: 'content' as const,
                localVersion: {
                    id: 'test-1',
                    content: 'Local content',
                    timestamp: baseTime + 5 * 60 * 1000, // 5 minutes later
                    contentHash: 'hash1',
                    source: 'local' as const
                },
                remoteVersion: {
                    id: 'test-1',
                    content: 'Remote content',
                    timestamp: baseTime,
                    contentHash: 'hash2',
                    source: 'remote' as const
                },
                conflictType: 'both' as const,
                detectedAt: Date.now(),
                resolved: false
            };

            expect(canAutoResolve(conflict)).toBe(false);
        });
    });

    describe('autoResolveConflict', () => {
        it('should choose the newer version', () => {
            const baseTime = Date.now();
            const conflict = {
                id: 'conflict-1',
                type: 'content' as const,
                localVersion: {
                    id: 'test-1',
                    content: 'Local content (newer)',
                    timestamp: baseTime + 1000,
                    contentHash: 'hash1',
                    source: 'local' as const
                },
                remoteVersion: {
                    id: 'test-1',
                    content: 'Remote content (older)',
                    timestamp: baseTime,
                    contentHash: 'hash2',
                    source: 'remote' as const
                },
                conflictType: 'timestamp' as const,
                detectedAt: Date.now(),
                resolved: false
            };

            const resolution = autoResolveConflict(conflict);
            expect(resolution.resolution).toBe('use-local');
            expect(resolution.resolvedContent).toBe('Local content (newer)');
        });
    });

    describe('mergeContent', () => {
        it('should merge string content', () => {
            const local = 'Local content';
            const remote = 'Remote content';

            const merged = mergeContent(local, remote, 'combine');
            expect(merged).toContain('Local content');
            expect(merged).toContain('Remote content');
            expect(merged).toContain('--- MERGED ---');
        });

        it('should merge object content', () => {
            const local = { title: 'Local Title', body: 'Local body' };
            const remote = { title: 'Remote Title', description: 'Remote desc' };

            const merged = mergeContent(local, remote, 'combine');
            expect(merged.title).toBe('Local Title'); // Local takes precedence
            expect(merged.description).toBe('Remote desc'); // Remote field added
            expect(merged._merged).toBe(true);
        });
    });

    describe('getConflictSummary', () => {
        it('should generate appropriate summary for time differences', () => {
            const baseTime = Date.now();
            const conflict = {
                id: 'conflict-1',
                type: 'content' as const,
                localVersion: {
                    id: 'test-1',
                    content: 'Local content',
                    timestamp: baseTime + 2 * 60 * 60 * 1000, // 2 hours later
                    contentHash: 'hash1',
                    source: 'local' as const
                },
                remoteVersion: {
                    id: 'test-1',
                    content: 'Remote content',
                    timestamp: baseTime,
                    contentHash: 'hash2',
                    source: 'remote' as const
                },
                conflictType: 'timestamp' as const,
                detectedAt: Date.now(),
                resolved: false
            };

            const summary = getConflictSummary(conflict);
            expect(summary).toContain('timestamp');
            expect(summary).toContain('2h');
        });
    });
});