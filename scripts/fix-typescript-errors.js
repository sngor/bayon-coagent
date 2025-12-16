#!/usr/bin/env node

/**
 * Comprehensive TypeScript Error Fix Script
 * 
 * This script addresses the most common TypeScript errors in the codebase:
 * 1. Missing required properties in workflow steps
 * 2. Missing required parameters in function calls
 * 3. Incorrect repository method calls
 * 4. Type mismatches in service calls
 */

const fs = require('fs');
const path = require('path');

// Common fixes to apply
const FIXES = [
    {
        name: 'Fix workflow step missing properties',
        pattern: /(\{[\s\S]*?id:\s*['"`][^'"`]+['"`],[\s\S]*?agentType:\s*['"`][^'"`]+['"`],[\s\S]*?dependencies:\s*\[[^\]]*\],[\s\S]*?estimatedDuration:\s*\d+)([\s\S]*?\})/g,
        replacement: (match, p1, p2) => {
            if (p1.includes('maxRetries') || p1.includes('status') || p1.includes('retryCount')) {
                return match; // Already fixed
            }
            return p1 + ',\n                maxRetries: 2,\n                status: \'pending\' as const,\n                retryCount: 0' + p2;
        }
    },
    {
        name: 'Fix executeAgentWorkflow missing properties',
        pattern: /(executeAgentWorkflow\(\{[\s\S]*?workflowType:\s*['"`][^'"`]+['"`],[\s\S]*?userId[^,]*,[\s\S]*?name[^,]*,[\s\S]*?(?:description[^,]*,[\s\S]*?)?parameters:\s*[^}]+)([\s\S]*?\}\))/g,
        replacement: (match, p1, p2) => {
            if (p1.includes('priority') || p1.includes('saveResults') || p1.includes('executeAsync')) {
                return match; // Already fixed
            }
            const insertPoint = p1.lastIndexOf(',');
            if (insertPoint === -1) return match;

            const before = p1.substring(0, insertPoint + 1);
            const after = p1.substring(insertPoint + 1);

            return before + '\n        priority: \'normal\' as const,\n        saveResults: true,\n        executeAsync: true,\n        notifyOnCompletion: false,' + after + p2;
        }
    },
    {
        name: 'Fix generateContent missing properties',
        pattern: /(generateContent\(\{[\s\S]*?contentType[^,]*,[\s\S]*?topic[^,]*,[\s\S]*?userId[^,]*,[\s\S]*?tone[^,]*,[\s\S]*?targetAudience[^,]*,)([\s\S]*?\}\))/g,
        replacement: (match, p1, p2) => {
            if (p1.includes('length') || p1.includes('searchDepth') || p1.includes('includeData')) {
                return match; // Already fixed
            }
            return p1 + '\n            length: \'medium\' as const,\n            searchDepth: \'basic\' as const,\n            includeData: true,\n            generateVariations: 1,' + p2;
        }
    },
    {
        name: 'Fix repository.create calls',
        pattern: /repository\.create\(([^)]+)\)/g,
        replacement: (match, p1) => {
            // If it already has multiple parameters, don't change
            if (p1.includes(',')) {
                return match;
            }
            // This is a single parameter call that needs to be fixed
            const itemName = p1.trim();
            return `repository.create(\n                ${itemName}.PK,\n                ${itemName}.SK,\n                'WorkflowItem',\n                ${itemName},\n                {\n                    GSI1PK: ${itemName}.GSI1PK,\n                    GSI1SK: ${itemName}.GSI1SK\n                }\n            )`;
        }
    },
    {
        name: 'Fix console statements',
        pattern: /console\.(log|warn|error|debug)\(/g,
        replacement: 'logger.$1('
    },
    {
        name: 'Add logger import when needed',
        pattern: /^((?:import[\s\S]*?;\s*\n)*)([\s\S]*logger\.[a-zA-Z]+\()/m,
        replacement: (match, imports, rest) => {
            if (imports.includes('createLogger')) {
                return match; // Already has logger import
            }
            return imports + "import { createLogger } from '@/aws/logging/logger';\nconst logger = createLogger('service');\n\n" + rest;
        }
    }
];

// Files to process
const TARGET_FILES = [
    'src/services/strands/agent-orchestration-service.ts',
    'src/services/strands/content-studio-service.ts',
    'src/services/strands/image-analysis-service.ts',
    'src/services/strands/market-intelligence-service.ts',
    'src/services/strands/listing-description-service.ts',
    'src/services/strands/integration-testing-service.ts',
    'src/services/strands/base-executor.ts'
];

function applyFixes(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        console.log(`\n🔧 Processing: ${filePath}`);

        FIXES.forEach(fix => {
            const originalContent = content;

            if (typeof fix.replacement === 'function') {
                content = content.replace(fix.pattern, fix.replacement);
            } else {
                content = content.replace(fix.pattern, fix.replacement);
            }

            if (content !== originalContent) {
                console.log(`  ✅ Applied: ${fix.name}`);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  💾 Saved changes to ${filePath}`);
            return true;
        } else {
            console.log(`  ⏭️  No changes needed`);
            return false;
        }

    } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🚀 Starting TypeScript error fixes...\n');

    let processedCount = 0;
    let modifiedCount = 0;

    TARGET_FILES.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            processedCount++;
            if (applyFixes(filePath)) {
                modifiedCount++;
            }
        } else {
            console.log(`⚠️  File not found: ${filePath}`);
        }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${processedCount}`);
    console.log(`   Files modified: ${modifiedCount}`);

    if (modifiedCount > 0) {
        console.log(`\n✨ TypeScript fixes applied!`);
        console.log(`\n⚠️  Next steps:`);
        console.log(`   1. Run: npm run typecheck`);
        console.log(`   2. Review changes and test`);
        console.log(`   3. Fix any remaining errors manually`);
    } else {
        console.log(`\n✅ No fixes needed or all files already fixed!`);
    }
}

if (require.main === module) {
    main();
}

module.exports = { applyFixes, FIXES };