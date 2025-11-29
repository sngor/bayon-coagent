#!/usr/bin/env node

/**
 * Script to update import paths after codebase reorganization
 * 
 * This script finds and replaces old import paths with new ones
 * across the entire codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the import path mappings (old -> new)
const importMappings = [
    // Actions moved to feature modules
    {
        from: '@/app/client-dashboard-actions',
        to: '@/features/client-dashboards/actions/client-dashboard-actions'
    },
    {
        from: '@/app/client-nudge-actions',
        to: '@/features/client-dashboards/actions/client-nudge-actions'
    },
    {
        from: '@/app/mobile-actions',
        to: '@/features/client-dashboards/actions/mobile-actions'
    },
    {
        from: '@/app/content-workflow-actions',
        to: '@/features/content-engine/actions/content-workflow-actions'
    },
    {
        from: '@/app/content-workflow-oauth-actions',
        to: '@/features/content-engine/actions/content-workflow-oauth-actions'
    },
    {
        from: '@/app/post-card-actions',
        to: '@/features/content-engine/actions/post-card-actions'
    },
    {
        from: '@/app/bayon-assistant-actions',
        to: '@/features/intelligence/actions/bayon-assistant-actions'
    },
    {
        from: '@/app/bayon-vision-actions',
        to: '@/features/intelligence/actions/bayon-vision-actions'
    },
    {
        from: '@/app/reimagine-actions',
        to: '@/features/intelligence/actions/reimagine-actions'
    },
    {
        from: '@/app/multi-angle-staging-actions',
        to: '@/features/intelligence/actions/multi-angle-staging-actions'
    },
    {
        from: '@/app/knowledge-actions',
        to: '@/features/intelligence/actions/knowledge-actions'
    },
    {
        from: '@/app/agent-document-actions',
        to: '@/features/intelligence/actions/agent-document-actions'
    },
    {
        from: '@/app/mls-actions',
        to: '@/features/integrations/actions/mls-actions'
    },
    {
        from: '@/app/mls-status-sync-actions',
        to: '@/features/integrations/actions/mls-status-sync-actions'
    },
    {
        from: '@/app/social-oauth-actions',
        to: '@/features/integrations/actions/social-oauth-actions'
    },
    {
        from: '@/app/social-publishing-actions',
        to: '@/features/integrations/actions/social-publishing-actions'
    },
    {
        from: '@/app/oauth-actions',
        to: '@/features/integrations/actions/oauth-actions'
    },
    {
        from: '@/app/admin-actions',
        to: '@/features/admin/actions/admin-actions'
    },
    {
        from: '@/app/permission-actions',
        to: '@/features/admin/actions/permission-actions'
    },
    {
        from: '@/app/notification-actions',
        to: '@/services/notifications/notification-actions'
    },
    {
        from: '@/app/unsubscribe-actions',
        to: '@/services/notifications/unsubscribe-actions'
    },
    {
        from: '@/app/performance-metrics-actions',
        to: '@/services/monitoring/performance-metrics-actions'
    },
    {
        from: '@/app/cost-tracking-actions',
        to: '@/services/monitoring/cost-tracking-actions'
    },
    // Services reorganization
    {
        from: '@/services/analytics-service',
        to: '@/services/analytics/analytics-service'
    },
    {
        from: '@/services/enhanced-publishing-service',
        to: '@/services/publishing/enhanced-publishing-service'
    },
    {
        from: '@/services/publishing-error-handler',
        to: '@/services/publishing/publishing-error-handler'
    },
    {
        from: '@/services/scheduling-service',
        to: '@/services/publishing/scheduling-service'
    },
    {
        from: '@/services/template-service',
        to: '@/services/publishing/template-service'
    },
    {
        from: '@/services/news-service',
        to: '@/services/analytics/news-service'
    },
    // Lib reorganization
    {
        from: '@/lib/types',
        to: '@/lib/types/common'
    },
    {
        from: '@/lib/utils',
        to: '@/lib/utils/common'
    },
    {
        from: '@/lib/search-utils',
        to: '@/lib/utils/search-utils'
    },
    {
        from: '@/lib/news-config',
        to: '@/lib/constants/news-config'
    },
    {
        from: '@/lib/training-data',
        to: '@/lib/constants/training-data'
    },
];

console.log('🔧 Starting import path updates...\n');

// Find all TypeScript and JavaScript files
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludeDirs = ['node_modules', '.next', 'dist', '.git'];

function findFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                findFiles(filePath, fileList);
            }
        } else {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

const projectRoot = process.cwd();
const srcDir = path.join(projectRoot, 'src');
const files = findFiles(srcDir);

console.log(`Found ${files.length} files to process\n`);

let updatedFiles = 0;
let totalReplacements = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let fileChanged = false;
    let fileReplacements = 0;

    importMappings.forEach(({ from, to }) => {
        const fromPattern = new RegExp(from.replace(/\//g, '\\/'), 'g');
        const matches = content.match(fromPattern);

        if (matches) {
            content = content.replace(fromPattern, to);
            fileReplacements += matches.length;
            fileChanged = true;
        }
    });

    if (fileChanged) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFiles++;
        totalReplacements += fileReplacements;
        console.log(`✅ Updated ${fileReplacements} imports in: ${path.relative(projectRoot, file)}`);
    }
});

console.log(`\n✨ Complete! Updated ${totalReplacements} imports across ${updatedFiles} files\n`);

// Remind user to check TypeScript errors
console.log('⚠️  Next steps:');
console.log('1. Run: npm run type-check');
console.log('2. Fix any remaining import errors');
console.log('3. Run tests to verify nothing broke\n');
