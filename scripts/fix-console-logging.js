#!/usr/bin/env node

/**
 * Script to replace console.log statements with proper logging
 * This helps maintain consistent logging across the application
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to process (excluding node_modules, .next, etc.)
const INCLUDE_PATTERNS = [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx'
];

const EXCLUDE_PATTERNS = [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/test-*',
    '**/mock*'
];

// Console statement patterns to replace
const CONSOLE_REPLACEMENTS = [
    {
        pattern: /console\.log\(/g,
        replacement: 'logger.info(',
        needsImport: true
    },
    {
        pattern: /console\.warn\(/g,
        replacement: 'logger.warn(',
        needsImport: true
    },
    {
        pattern: /console\.error\(/g,
        replacement: 'logger.error(',
        needsImport: true
    },
    {
        pattern: /console\.debug\(/g,
        replacement: 'logger.debug(',
        needsImport: true
    }
];

const LOGGER_IMPORT = `import { createLogger } from '@/aws/logging/logger';\n`;
const LOGGER_INSTANCE = `const logger = createLogger('${getServiceName}');\n`;

function getServiceName(filePath) {
    // Extract service name from file path
    const parts = filePath.split('/');
    if (parts.includes('services')) {
        const serviceIndex = parts.indexOf('services');
        return parts[serviceIndex + 1] || 'unknown-service';
    }
    if (parts.includes('components')) {
        return 'ui-component';
    }
    if (parts.includes('app')) {
        return 'app-router';
    }
    return 'application';
}

function processFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        let needsLoggerImport = false;

        // Check if file already has logger import
        const hasLoggerImport = content.includes('createLogger') || content.includes('logger');

        // Apply replacements
        CONSOLE_REPLACEMENTS.forEach(({ pattern, replacement, needsImport }) => {
            if (pattern.test(content)) {
                content = content.replace(pattern, replacement);
                modified = true;
                if (needsImport && !hasLoggerImport) {
                    needsLoggerImport = true;
                }
            }
        });

        // Add logger import and instance if needed
        if (needsLoggerImport && modified) {
            const serviceName = getServiceName(filePath);
            const loggerSetup = `${LOGGER_IMPORT}${LOGGER_INSTANCE.replace('${getServiceName}', serviceName)}\n`;

            // Find the best place to insert the import
            const lines = content.split('\n');
            let insertIndex = 0;

            // Find last import statement
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith('import ') || lines[i].startsWith('const ') && lines[i].includes('require(')) {
                    insertIndex = i + 1;
                } else if (lines[i].trim() === '' || lines[i].startsWith('//') || lines[i].startsWith('/*')) {
                    continue;
                } else {
                    break;
                }
            }

            lines.splice(insertIndex, 0, '', loggerSetup);
            content = lines.join('\n');
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ Fixed logging in: ${filePath}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

function getAllFiles() {
    try {
        // Use find command to get all TypeScript/JavaScript files
        const result = execSync(`find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | grep -v test | grep -v spec | grep -v mock`, { encoding: 'utf8' });
        return result.trim().split('\n').filter(Boolean);
    } catch (error) {
        console.error('Error finding files:', error.message);
        return [];
    }
}

function main() {
    console.log('🔧 Starting console logging fix...\n');

    const files = getAllFiles();
    let processedCount = 0;
    let modifiedCount = 0;

    files.forEach(filePath => {
        processedCount++;
        if (processFile(filePath)) {
            modifiedCount++;
        }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Files processed: ${processedCount}`);
    console.log(`   Files modified: ${modifiedCount}`);
    console.log(`\n✨ Console logging fix complete!`);

    if (modifiedCount > 0) {
        console.log('\n⚠️  Next steps:');
        console.log('   1. Review the changes');
        console.log('   2. Run npm run typecheck to verify');
        console.log('   3. Test the application');
    }
}

if (require.main === module) {
    main();
}

module.exports = { processFile, getAllFiles };