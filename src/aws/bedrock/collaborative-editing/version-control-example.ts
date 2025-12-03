/**
 * Version Control System Usage Examples
 * 
 * This file demonstrates how to use the VersionControlSystem
 * for managing content versions.
 */

import { VersionControlSystem } from './version-control';
import { VersionMetadata } from './types';

/**
 * Example 1: Creating and managing versions
 */
export async function exampleBasicVersioning() {
    const vcs = new VersionControlSystem();
    const userId = 'user-123';
    const contentId = 'blog-post-456';

    // Create initial version
    const metadata1: VersionMetadata = {
        editType: 'creation',
        changedSections: [],
        wordCount: 0,
        characterCount: 0,
    };

    const version1 = await vcs.createVersion(
        contentId,
        userId,
        'This is my first blog post about real estate.',
        metadata1
    );

    console.log(`Created version ${version1.versionNumber}`);
    console.log(`Word count: ${version1.metadata.wordCount}`);

    // Create a refined version
    const metadata2: VersionMetadata = {
        editType: 'refinement',
        changedSections: ['introduction'],
        wordCount: 0,
        characterCount: 0,
    };

    const version2 = await vcs.createVersion(
        contentId,
        userId,
        'This is my comprehensive guide to real estate investing.',
        metadata2
    );

    console.log(`Created version ${version2.versionNumber}`);
    console.log(`Created by: ${version2.createdBy}`); // 'ai' for refinements

    return { version1, version2 };
}

/**
 * Example 2: Viewing version history
 */
export async function exampleViewHistory() {
    const vcs = new VersionControlSystem();
    const userId = 'user-123';
    const contentId = 'blog-post-456';

    // Get all versions
    const history = await vcs.getHistory(contentId, userId);

    console.log(`Total versions: ${history.length}`);

    history.forEach((version) => {
        console.log(`\nVersion ${version.versionNumber}:`);
        console.log(`  Created: ${version.createdAt}`);
        console.log(`  By: ${version.createdBy}`);
        console.log(`  Description: ${version.changeDescription}`);
        console.log(`  Words: ${version.metadata.wordCount}`);
        console.log(`  Sections changed: ${version.metadata.changedSections.join(', ')}`);
    });

    return history;
}

/**
 * Example 3: Rolling back to a previous version
 */
export async function exampleRollback() {
    const vcs = new VersionControlSystem();
    const userId = 'user-123';
    const contentId = 'blog-post-456';

    // Get current version
    const latestVersion = await vcs.getLatestVersionNumber(contentId, userId);
    console.log(`Current version: ${latestVersion}`);

    // Rollback to version 2
    const restoredContent = await vcs.rollback(contentId, userId, 2);
    console.log('Rolled back to version 2');
    console.log(`Restored content: ${restoredContent.substring(0, 50)}...`);

    // Check new version was created
    const newLatestVersion = await vcs.getLatestVersionNumber(contentId, userId);
    console.log(`New version created: ${newLatestVersion}`);

    return restoredContent;
}

/**
 * Example 4: Comparing versions
 */
export async function exampleCompareVersions() {
    const vcs = new VersionControlSystem();
    const userId = 'user-123';
    const contentId = 'blog-post-456';

    // Compare version 1 and version 3
    const diff = await vcs.compareVersions(contentId, userId, 1, 3);

    console.log('\nVersion Comparison:');
    console.log(`Comparing version ${diff.version1} to version ${diff.version2}`);
    console.log(`\nSummary:`);
    console.log(`  Added words: ${diff.summary.addedWords}`);
    console.log(`  Deleted words: ${diff.summary.deletedWords}`);
    console.log(`  Modified words: ${diff.summary.modifiedWords}`);
    console.log(`  Overall change: ${diff.summary.overallChange.toFixed(2)}%`);

    console.log(`\nAdditions (${diff.additions.length}):`);
    diff.additions.forEach((addition, i) => {
        console.log(`  ${i + 1}. "${addition.text}"`);
    });

    console.log(`\nDeletions (${diff.deletions.length}):`);
    diff.deletions.forEach((deletion, i) => {
        console.log(`  ${i + 1}. "${deletion.text}"`);
    });

    console.log(`\nModifications (${diff.modifications.length}):`);
    diff.modifications.forEach((modification, i) => {
        console.log(`  ${i + 1}. "${modification.text}"`);
    });

    return diff;
}

/**
 * Example 5: Integration with ConversationalEditor
 */
export async function exampleIntegrationWithEditor() {
    const vcs = new VersionControlSystem();
    const userId = 'user-123';
    const contentId = 'blog-post-456';

    // Simulate editing session creating versions
    const metadata: VersionMetadata = {
        editType: 'creation',
        changedSections: [],
        wordCount: 0,
        characterCount: 0,
    };

    // Initial content
    await vcs.createVersion(
        contentId,
        userId,
        'Real estate market is changing rapidly.',
        metadata
    );

    // After first edit
    await vcs.createVersion(
        contentId,
        userId,
        'The real estate market is experiencing rapid transformation.',
        {
            ...metadata,
            editType: 'refinement',
            changedSections: ['opening'],
        }
    );

    // After second edit
    await vcs.createVersion(
        contentId,
        userId,
        'The real estate market is experiencing rapid transformation. Here are the key trends to watch.',
        {
            ...metadata,
            editType: 'refinement',
            changedSections: ['opening', 'body'],
        }
    );

    // View the evolution
    const history = await vcs.getHistory(contentId, userId);
    console.log('\nContent Evolution:');
    history.forEach((version, i) => {
        console.log(`\nStep ${i + 1}:`);
        console.log(`  ${version.content}`);
        console.log(`  (${version.changeDescription})`);
    });

    return history;
}

/**
 * Example 6: Getting a specific version
 */
export async function exampleGetSpecificVersion() {
    const vcs = new VersionControlSystem();
    const userId = 'user-123';
    const contentId = 'blog-post-456';

    // Get version 2
    const version = await vcs.getVersion(contentId, userId, 2);

    if (version) {
        console.log(`\nVersion ${version.versionNumber}:`);
        console.log(`Content: ${version.content}`);
        console.log(`Created: ${version.createdAt}`);
        console.log(`By: ${version.createdBy}`);
        console.log(`Description: ${version.changeDescription}`);
    } else {
        console.log('Version not found');
    }

    return version;
}

/**
 * Example 7: Cleanup - deleting all versions
 */
export async function exampleCleanup() {
    const vcs = new VersionControlSystem();
    const userId = 'user-123';
    const contentId = 'blog-post-456';

    // Check current versions
    const beforeHistory = await vcs.getHistory(contentId, userId);
    console.log(`Versions before cleanup: ${beforeHistory.length}`);

    // Delete all versions
    await vcs.deleteAllVersions(contentId, userId);

    // Verify deletion
    const afterHistory = await vcs.getHistory(contentId, userId);
    console.log(`Versions after cleanup: ${afterHistory.length}`);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
    console.log('=== Version Control System Examples ===\n');

    try {
        console.log('Example 1: Basic Versioning');
        await exampleBasicVersioning();

        console.log('\n\nExample 2: View History');
        await exampleViewHistory();

        console.log('\n\nExample 3: Rollback');
        await exampleRollback();

        console.log('\n\nExample 4: Compare Versions');
        await exampleCompareVersions();

        console.log('\n\nExample 5: Integration with Editor');
        await exampleIntegrationWithEditor();

        console.log('\n\nExample 6: Get Specific Version');
        await exampleGetSpecificVersion();

        console.log('\n\nExample 7: Cleanup');
        await exampleCleanup();

        console.log('\n\n=== All examples completed successfully ===');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}
