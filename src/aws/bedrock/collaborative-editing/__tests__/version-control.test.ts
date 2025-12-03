/**
 * Unit tests for VersionControlSystem
 */

import { VersionControlSystem } from '../version-control';
import { ContentVersion, VersionMetadata } from '../types';

describe('VersionControlSystem', () => {
    let vcs: VersionControlSystem;

    beforeEach(() => {
        vcs = new VersionControlSystem();
    });

    describe('createVersion', () => {
        const testUserId = 'test-user-' + Date.now();
        const testContentId = 'test-content-' + Date.now();

        afterEach(async () => {
            // Cleanup
            try {
                await vcs.deleteAllVersions(testContentId, testUserId);
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        it('should create a new version with version number 1 when no history exists', async () => {
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            const version = await vcs.createVersion(
                testContentId,
                testUserId,
                'Initial content',
                metadata
            );

            expect(version.versionNumber).toBe(1);
            expect(version.content).toBe('Initial content');
            expect(version.createdBy).toBe('user');
            expect(version.metadata.wordCount).toBe(2);
            expect(version.metadata.characterCount).toBe(15);
        });

        it('should increment version number when history exists', async () => {
            // Create first version
            const metadata1: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };
            await vcs.createVersion(testContentId, testUserId, 'Version 1', metadata1);

            // Create second version
            const metadata2: VersionMetadata = {
                editType: 'refinement',
                changedSections: ['intro'],
                wordCount: 0,
                characterCount: 0,
            };
            await vcs.createVersion(testContentId, testUserId, 'Version 2', metadata2);

            // Create third version
            const metadata3: VersionMetadata = {
                editType: 'refinement',
                changedSections: ['conclusion'],
                wordCount: 0,
                characterCount: 0,
            };
            const version = await vcs.createVersion(
                testContentId,
                testUserId,
                'Version 3',
                metadata3
            );

            expect(version.versionNumber).toBe(3);
        });

        it('should calculate word count and character count automatically', async () => {
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            const content = 'This is a test with seven words here';
            const version = await vcs.createVersion(
                testContentId,
                testUserId,
                content,
                metadata
            );

            expect(version.metadata.wordCount).toBe(8);
            expect(version.metadata.characterCount).toBe(content.length);
        });

        it('should set createdBy to "ai" for non-creation edit types', async () => {
            const metadata: VersionMetadata = {
                editType: 'refinement',
                changedSections: ['intro'],
                wordCount: 0,
                characterCount: 0,
            };

            const version = await vcs.createVersion(
                testContentId,
                testUserId,
                'Refined content',
                metadata
            );

            expect(version.createdBy).toBe('ai');
        });
    });

    describe('getHistory', () => {
        const testUserId = 'test-user-history-' + Date.now();
        const testContentId = 'test-content-history-' + Date.now();

        afterEach(async () => {
            try {
                await vcs.deleteAllVersions(testContentId, testUserId);
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        it('should return empty array when no versions exist', async () => {
            const history = await vcs.getHistory(testContentId, testUserId);
            expect(history).toEqual([]);
        });

        it('should return versions sorted by version number', async () => {
            // Create versions
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            await vcs.createVersion(testContentId, testUserId, 'Version 1', metadata);
            await vcs.createVersion(testContentId, testUserId, 'Version 2', {
                ...metadata,
                editType: 'refinement',
            });
            await vcs.createVersion(testContentId, testUserId, 'Version 3', {
                ...metadata,
                editType: 'refinement',
            });

            const history = await vcs.getHistory(testContentId, testUserId);

            expect(history).toHaveLength(3);
            expect(history[0].versionNumber).toBe(1);
            expect(history[1].versionNumber).toBe(2);
            expect(history[2].versionNumber).toBe(3);
        });
    });

    describe('rollback', () => {
        const testUserId = 'test-user-rollback-' + Date.now();
        const testContentId = 'test-content-rollback-' + Date.now();

        afterEach(async () => {
            try {
                await vcs.deleteAllVersions(testContentId, testUserId);
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        it('should restore content from a previous version', async () => {
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            // Create versions
            await vcs.createVersion(testContentId, testUserId, 'Version 1 content', metadata);
            await vcs.createVersion(testContentId, testUserId, 'Version 2 content', {
                ...metadata,
                editType: 'refinement',
            });
            await vcs.createVersion(testContentId, testUserId, 'Version 3 content', {
                ...metadata,
                editType: 'refinement',
            });

            // Rollback to version 2
            const restoredContent = await vcs.rollback(testContentId, testUserId, 2);

            expect(restoredContent).toBe('Version 2 content');

            // Verify a new version was created
            const history = await vcs.getHistory(testContentId, testUserId);
            expect(history).toHaveLength(4);
            expect(history[3].content).toBe('Version 2 content');
            expect(history[3].metadata.editType).toBe('rollback');
        });

        it('should throw error when version not found', async () => {
            await expect(
                vcs.rollback(testContentId, testUserId, 99)
            ).rejects.toThrow(`Version 99 not found for content ${testContentId}`);
        });
    });

    describe('compareVersions', () => {
        const testUserId = 'test-user-compare-' + Date.now();
        const testContentId = 'test-content-compare-' + Date.now();

        afterEach(async () => {
            try {
                await vcs.deleteAllVersions(testContentId, testUserId);
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        it('should generate diff between two versions', async () => {
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            // Create versions
            await vcs.createVersion(
                testContentId,
                testUserId,
                'This is the original content. It has some text.',
                metadata
            );
            await vcs.createVersion(
                testContentId,
                testUserId,
                'This is the updated content. It has more text now.',
                { ...metadata, editType: 'refinement' }
            );

            const diff = await vcs.compareVersions(testContentId, testUserId, 1, 2);

            expect(diff.contentId).toBe(testContentId);
            expect(diff.version1).toBe(1);
            expect(diff.version2).toBe(2);
            expect(diff.summary.overallChange).toBeGreaterThan(0);
        });

        it('should throw error when versions not found', async () => {
            await expect(
                vcs.compareVersions(testContentId, testUserId, 1, 2)
            ).rejects.toThrow('One or both versions not found: 1, 2');
        });
    });

    describe('getVersion', () => {
        const testUserId = 'test-user-getversion-' + Date.now();
        const testContentId = 'test-content-getversion-' + Date.now();

        afterEach(async () => {
            try {
                await vcs.deleteAllVersions(testContentId, testUserId);
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        it('should retrieve a specific version', async () => {
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            // Create versions
            await vcs.createVersion(testContentId, testUserId, 'Version 1', metadata);
            await vcs.createVersion(testContentId, testUserId, 'Version 2', {
                ...metadata,
                editType: 'refinement',
            });
            await vcs.createVersion(testContentId, testUserId, 'Version 3 content', {
                ...metadata,
                editType: 'refinement',
            });

            const result = await vcs.getVersion(testContentId, testUserId, 3);

            expect(result).not.toBeNull();
            expect(result?.versionNumber).toBe(3);
            expect(result?.content).toBe('Version 3 content');
        });

        it('should return null when version not found', async () => {
            const result = await vcs.getVersion(testContentId, testUserId, 99);
            expect(result).toBeNull();
        });
    });

    describe('getLatestVersionNumber', () => {
        const testUserId = 'test-user-latest-' + Date.now();
        const testContentId = 'test-content-latest-' + Date.now();

        afterEach(async () => {
            try {
                await vcs.deleteAllVersions(testContentId, testUserId);
            } catch (error) {
                // Ignore cleanup errors
            }
        });

        it('should return latest version number', async () => {
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            // Create versions
            await vcs.createVersion(testContentId, testUserId, 'V1', metadata);
            await vcs.createVersion(testContentId, testUserId, 'V2', {
                ...metadata,
                editType: 'refinement',
            });
            await vcs.createVersion(testContentId, testUserId, 'V3', {
                ...metadata,
                editType: 'refinement',
            });

            const latestVersion = await vcs.getLatestVersionNumber(
                testContentId,
                testUserId
            );

            expect(latestVersion).toBe(3);
        });

        it('should return 0 when no versions exist', async () => {
            const latestVersion = await vcs.getLatestVersionNumber(
                testContentId,
                testUserId
            );

            expect(latestVersion).toBe(0);
        });
    });

    describe('deleteAllVersions', () => {
        const testUserId = 'test-user-delete-' + Date.now();
        const testContentId = 'test-content-delete-' + Date.now();

        it('should delete all versions and metadata', async () => {
            const metadata: VersionMetadata = {
                editType: 'creation',
                changedSections: [],
                wordCount: 0,
                characterCount: 0,
            };

            // Create versions
            await vcs.createVersion(testContentId, testUserId, 'V1', metadata);
            await vcs.createVersion(testContentId, testUserId, 'V2', {
                ...metadata,
                editType: 'refinement',
            });

            // Verify versions exist
            let history = await vcs.getHistory(testContentId, testUserId);
            expect(history).toHaveLength(2);

            // Delete all versions
            await vcs.deleteAllVersions(testContentId, testUserId);

            // Verify versions are deleted
            history = await vcs.getHistory(testContentId, testUserId);
            expect(history).toHaveLength(0);
        });
    });
});
