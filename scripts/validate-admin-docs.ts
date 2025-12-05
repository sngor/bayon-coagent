#!/usr/bin/env tsx
/**
 * Documentation Validation Script
 * 
 * Validates the consolidated admin documentation for:
 * 1. Markdown link integrity
 * 2. Content completeness
 * 3. Duplicate content detection (>50 words)
 * 4. Audience-appropriate content
 * 5. Navigation flow testing
 * 
 * Requirements: 1.1, 1.2, 1.4, 2.4, 3.4
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
    info: string[];
}

interface DocumentMetadata {
    path: string;
    content: string;
    links: string[];
    wordCount: number;
    sections: string[];
}

const DOCS_DIR = path.join(process.cwd(), 'docs/admin');
const CORE_DOCS = [
    'README.md',
    'USER_GUIDE.md',
    'API_REFERENCE.md',
    'DEVELOPER_GUIDE.md',
    'TESTING_GUIDE.md'
];

// Validation results
const results: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
    info: []
};

/**
 * Main validation function
 */
async function validateDocumentation(): Promise<void> {
    console.log('🔍 Starting Documentation Validation...\n');

    // Load all documents
    const documents = loadDocuments();

    // Run validation checks
    await validateMarkdownLinks(documents);
    await validateContentCompleteness(documents);
    await checkDuplicateContent(documents);
    await validateAudienceContent(documents);
    await testNavigationFlows(documents);

    // Print results
    printResults();
}

/**
 * Load all documentation files
 */
function loadDocuments(): Map<string, DocumentMetadata> {
    const documents = new Map<string, DocumentMetadata>();

    for (const filename of CORE_DOCS) {
        const filePath = path.join(DOCS_DIR, filename);

        if (!fs.existsSync(filePath)) {
            results.errors.push(`Missing core document: ${filename}`);
            results.passed = false;
            continue;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const links = extractLinks(content);
        const sections = extractSections(content);
        const wordCount = content.split(/\s+/).length;

        documents.set(filename, {
            path: filePath,
            content,
            links,
            wordCount,
            sections
        });

        results.info.push(`✓ Loaded ${filename} (${wordCount} words, ${links.length} links)`);
    }

    return documents;
}

/**
 * Extract markdown links from content
 */
function extractLinks(content: string): string[] {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
        links.push(match[2]); // URL part
    }

    return links;
}

/**
 * Extract section headings from content
 */
function extractSections(content: string): string[] {
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    const sections: string[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
        sections.push(match[1]);
    }

    return sections;
}

/**
 * Validate all markdown links
 * Requirement: 1.3 - Clear cross-references without duplicating content
 */
async function validateMarkdownLinks(documents: Map<string, DocumentMetadata>): Promise<void> {
    console.log('\n📎 Validating Markdown Links...');
    let brokenLinks = 0;
    let externalLinks = 0;
    let internalLinks = 0;

    for (const [filename, doc] of documents) {
        for (const link of doc.links) {
            // Skip external links (http/https)
            if (link.startsWith('http://') || link.startsWith('https://')) {
                externalLinks++;
                continue;
            }

            // Skip mailto links
            if (link.startsWith('mailto:')) {
                continue;
            }

            // Skip anchors only
            if (link.startsWith('#')) {
                // Validate anchor exists in current document
                const anchor = link.substring(1);
                const anchorExists = doc.sections.some(section =>
                    section.toLowerCase().replace(/[^a-z0-9]+/g, '-') === anchor
                );

                if (!anchorExists) {
                    results.warnings.push(`${filename}: Anchor not found: ${link}`);
                }
                internalLinks++;
                continue;
            }

            // Parse relative link
            const [targetFile, anchor] = link.split('#');
            const targetPath = path.join(DOCS_DIR, targetFile);

            // Check if target file exists
            if (!fs.existsSync(targetPath)) {
                results.errors.push(`${filename}: Broken link to ${targetFile}`);
                results.passed = false;
                brokenLinks++;
                continue;
            }

            // If anchor specified, validate it exists
            if (anchor) {
                const targetContent = fs.readFileSync(targetPath, 'utf-8');
                const targetSections = extractSections(targetContent);
                const anchorExists = targetSections.some(section =>
                    section.toLowerCase().replace(/[^a-z0-9]+/g, '-') === anchor
                );

                if (!anchorExists) {
                    results.warnings.push(`${filename}: Anchor not found in ${targetFile}: #${anchor}`);
                }
            }

            internalLinks++;
        }
    }

    if (brokenLinks === 0) {
        results.info.push(`✓ All internal links valid (${internalLinks} internal, ${externalLinks} external)`);
    } else {
        results.info.push(`✗ Found ${brokenLinks} broken links`);
    }
}

/**
 * Validate content completeness against inventory
 * Requirement: 1.1 - Single authoritative source for each piece of information
 */
async function validateContentCompleteness(documents: Map<string, DocumentMetadata>): Promise<void> {
    console.log('\n📋 Validating Content Completeness...');

    // Expected content in each document
    const expectedContent = {
        'README.md': [
            'Documentation by User Type',
            'I want to use the admin platform',
            'I want to integrate with the API',
            'I want to develop or extend features',
            'I want to test the system'
        ],
        'USER_GUIDE.md': [
            'Getting Started',
            'Analytics Dashboard',
            'User Management',
            'Content Moderation',
            'Support Tickets',
            'System Health',
            'Platform Configuration',
            'Billing Management',
            'Common Workflows',
            'Troubleshooting'
        ],
        'API_REFERENCE.md': [
            'Authentication',
            'Response Format',
            'Analytics API',
            'User Activity API',
            'Content Moderation API',
            'Support Tickets API',
            'System Health API',
            'Error Codes',
            'Rate Limiting'
        ],
        'DEVELOPER_GUIDE.md': [
            'Architecture Overview',
            'Database Schema',
            'Service Layer',
            'Server Actions',
            'UI Components',
            'Authentication & Authorization',
            'Testing',
            'Deployment',
            'Performance Optimization'
        ],
        'TESTING_GUIDE.md': [
            'Quick Start',
            'Test Suites',
            'Unit Tests',
            'Integration Tests',
            'Performance Targets',
            'Test Coverage Report',
            'Manual QA Checklist'
        ]
    };

    for (const [filename, expectedSections] of Object.entries(expectedContent)) {
        const doc = documents.get(filename);
        if (!doc) continue;

        const missingSections: string[] = [];
        for (const section of expectedSections) {
            const found = doc.sections.some(s =>
                s.toLowerCase().includes(section.toLowerCase())
            );
            if (!found) {
                missingSections.push(section);
            }
        }

        if (missingSections.length > 0) {
            results.warnings.push(`${filename}: Missing expected sections: ${missingSections.join(', ')}`);
        } else {
            results.info.push(`✓ ${filename}: All expected sections present`);
        }
    }
}

/**
 * Check for duplicate content (>50 words)
 * Requirement: 1.2, 1.4 - No duplication, single source of truth
 */
async function checkDuplicateContent(documents: Map<string, DocumentMetadata>): Promise<void> {
    console.log('\n🔄 Checking for Duplicate Content...');

    const MIN_WORDS = 50;
    const docArray = Array.from(documents.entries());
    let duplicatesFound = 0;

    for (let i = 0; i < docArray.length; i++) {
        for (let j = i + 1; j < docArray.length; j++) {
            const [file1, doc1] = docArray[i];
            const [file2, doc2] = docArray[j];

            // Extract paragraphs (>50 words)
            const paragraphs1 = extractParagraphs(doc1.content, MIN_WORDS);
            const paragraphs2 = extractParagraphs(doc2.content, MIN_WORDS);

            // Check for similar paragraphs
            for (const p1 of paragraphs1) {
                for (const p2 of paragraphs2) {
                    const similarity = calculateSimilarity(p1, p2);
                    if (similarity > 0.8) { // 80% similar
                        results.warnings.push(
                            `Potential duplicate content between ${file1} and ${file2} (${Math.round(similarity * 100)}% similar)`
                        );
                        duplicatesFound++;
                    }
                }
            }
        }
    }

    if (duplicatesFound === 0) {
        results.info.push(`✓ No significant duplicate content found (>50 words, >80% similar)`);
    } else {
        results.info.push(`⚠ Found ${duplicatesFound} potential duplicates`);
    }
}

/**
 * Extract paragraphs with minimum word count
 */
function extractParagraphs(content: string, minWords: number): string[] {
    // Split by double newlines (paragraphs)
    const paragraphs = content.split(/\n\n+/);

    return paragraphs
        .map(p => p.trim())
        .filter(p => {
            const wordCount = p.split(/\s+/).length;
            return wordCount >= minWords && !p.startsWith('#') && !p.startsWith('```');
        });
}

/**
 * Calculate similarity between two strings (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

/**
 * Validate audience-appropriate content
 * Requirement: 2.4, 3.4 - Separation of concerns by audience
 */
async function validateAudienceContent(documents: Map<string, DocumentMetadata>): Promise<void> {
    console.log('\n👥 Validating Audience-Appropriate Content...');

    // Define inappropriate content patterns for each document type
    const inappropriatePatterns = {
        'USER_GUIDE.md': {
            patterns: [
                /interface\s+\w+\s*{/,  // TypeScript interfaces
                /class\s+\w+\s*{/,      // Class definitions
                /async function/,        // Function definitions
                /import.*from/,          // Import statements
            ],
            description: 'technical implementation details'
        },
        'API_REFERENCE.md': {
            patterns: [
                /Navigate to/,           // User workflow instructions
                /Click.*button/,         // UI instructions
                /Common Tasks:/,         // User task descriptions
            ],
            description: 'user workflow instructions'
        },
        'DEVELOPER_GUIDE.md': {
            patterns: [
                /As a user/,             // User stories
                /Click.*to/,             // User instructions
            ],
            description: 'user-facing instructions'
        }
    };

    for (const [filename, rules] of Object.entries(inappropriatePatterns)) {
        const doc = documents.get(filename);
        if (!doc) continue;

        let violations = 0;
        for (const pattern of rules.patterns) {
            const matches = doc.content.match(pattern);
            if (matches) {
                violations += matches.length;
            }
        }

        if (violations > 0) {
            results.warnings.push(
                `${filename}: Contains ${violations} instances of ${rules.description}`
            );
        } else {
            results.info.push(`✓ ${filename}: Content appropriate for target audience`);
        }
    }
}

/**
 * Test navigation flows from README
 * Requirement: 3.1, 3.2 - Clear entry point and navigation
 */
async function testNavigationFlows(documents: Map<string, DocumentMetadata>): Promise<void> {
    console.log('\n🧭 Testing Navigation Flows...');

    const readme = documents.get('README.md');
    if (!readme) {
        results.errors.push('README.md not found for navigation testing');
        results.passed = false;
        return;
    }

    // Expected navigation paths from README
    const expectedPaths = [
        { text: 'User Guide', file: 'USER_GUIDE.md' },
        { text: 'API Reference', file: 'API_REFERENCE.md' },
        { text: 'Developer Guide', file: 'DEVELOPER_GUIDE.md' },
        { text: 'Testing Guide', file: 'TESTING_GUIDE.md' }
    ];

    let missingPaths = 0;
    for (const path of expectedPaths) {
        const hasLink = readme.links.some(link => link.includes(path.file));
        if (!hasLink) {
            results.errors.push(`README.md: Missing navigation link to ${path.file}`);
            results.passed = false;
            missingPaths++;
        }
    }

    if (missingPaths === 0) {
        results.info.push(`✓ All navigation paths from README are valid`);
    }

    // Check for clear user type sections
    const userTypeSections = [
        'I want to use the admin platform',
        'I want to integrate with the API',
        'I want to develop or extend features',
        'I want to test the system'
    ];

    let missingSections = 0;
    for (const section of userTypeSections) {
        if (!readme.content.includes(section)) {
            results.warnings.push(`README.md: Missing user type section: "${section}"`);
            missingSections++;
        }
    }

    if (missingSections === 0) {
        results.info.push(`✓ README contains all user type navigation sections`);
    }
}

/**
 * Print validation results
 */
function printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(60));

    if (results.info.length > 0) {
        console.log('\n✅ INFO:');
        results.info.forEach(msg => console.log(`   ${msg}`));
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        results.warnings.forEach(msg => console.log(`   ${msg}`));
    }

    if (results.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        results.errors.forEach(msg => console.log(`   ${msg}`));
    }

    console.log('\n' + '='.repeat(60));
    if (results.passed) {
        console.log('✅ VALIDATION PASSED');
    } else {
        console.log('❌ VALIDATION FAILED');
    }
    console.log('='.repeat(60) + '\n');

    // Exit with appropriate code
    process.exit(results.passed ? 0 : 1);
}

// Run validation
validateDocumentation().catch(error => {
    console.error('Validation script error:', error);
    process.exit(1);
});
