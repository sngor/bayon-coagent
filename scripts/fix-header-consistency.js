#!/usr/bin/env node

/**
 * Header Consistency Fix Script
 * 
 * This script helps identify and fix inconsistent header patterns across the application.
 * It scans for common anti-patterns and suggests fixes.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Common inconsistent patterns to look for
const INCONSISTENT_PATTERNS = [
    // Page title patterns
    {
        pattern: /<h1\s+className="[^"]*text-3xl[^"]*font-bold[^"]*"[^>]*>/g,
        suggestion: 'Replace with PageHeader component',
        severity: 'high'
    },
    {
        pattern: /<h1\s+className="[^"]*text-2xl[^"]*font-bold[^"]*"[^>]*>/g,
        suggestion: 'Replace with PageHeader component',
        severity: 'high'
    },
    {
        pattern: /<h2\s+className="[^"]*text-2xl[^"]*font-semibold[^"]*"[^>]*>/g,
        suggestion: 'Replace with PageHeader or SectionHeader component',
        severity: 'medium'
    },
    
    // Card title patterns
    {
        pattern: /<CardTitle\s+className="[^"]*text-2xl[^"]*font-bold[^"]*"[^>]*>/g,
        suggestion: 'Replace with CardHeaderStandard component',
        severity: 'medium'
    },
    {
        pattern: /<CardTitle\s+className="[^"]*font-headline\s+text-2xl[^"]*"[^>]*>/g,
        suggestion: 'Use CardHeaderStandard for consistency',
        severity: 'low'
    },
    
    // Missing font-headline class
    {
        pattern: /className="[^"]*text-(xl|2xl|3xl)[^"]*font-(bold|semibold)[^"]*"/g,
        suggestion: 'Add font-headline class for consistent typography',
        severity: 'low'
    }
];

// Standard component imports to suggest
const STANDARD_IMPORTS = {
    'PageHeader': "import { PageHeader } from '@/components/ui';",
    'CardHeaderStandard': "import { CardHeaderStandard } from '@/components/ui';",
    'SectionHeader': "import { SectionHeader } from '@/components/ui';"
};

// Hub-specific icon suggestions
const HUB_ICONS = {
    'dashboard': ['Activity', 'BarChart3', 'Home'],
    'assistant': ['MessageSquare', 'Bot', 'Sparkles'],
    'brand': ['Target', 'Award', 'Users', 'Building2'],
    'studio': ['PenTool', 'Sparkles', 'FileText', 'Image'],
    'research': ['Search', 'BookOpen', 'Brain'],
    'market': ['TrendingUp', 'BarChart3', 'MapPin', 'Globe'],
    'tools': ['Calculator', 'DollarSign', 'Home', 'Wrench'],
    'library': ['FolderOpen', 'Archive', 'Image', 'FileText'],
    'clients': ['Users', 'UserCheck', 'Contact'],
    'learning': ['GraduationCap', 'BookOpen', 'Play', 'Award']
};

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for inconsistent patterns
    INCONSISTENT_PATTERNS.forEach(({ pattern, suggestion, severity }) => {
        const matches = content.match(pattern);
        if (matches) {
            matches.forEach(match => {
                issues.push({
                    file: filePath,
                    pattern: match,
                    suggestion,
                    severity,
                    line: getLineNumber(content, match)
                });
            });
        }
    });
    
    return issues;
}

function getLineNumber(content, searchString) {
    const lines = content.substring(0, content.indexOf(searchString)).split('\n');
    return lines.length;
}

function getHubFromPath(filePath) {
    const pathParts = filePath.split('/');
    const appIndex = pathParts.indexOf('(app)');
    if (appIndex !== -1 && pathParts[appIndex + 1]) {
        return pathParts[appIndex + 1];
    }
    return null;
}

function suggestIcon(filePath) {
    const hub = getHubFromPath(filePath);
    if (hub && HUB_ICONS[hub]) {
        return HUB_ICONS[hub][0]; // Suggest the first icon for the hub
    }
    return null;
}

function generateFix(issue) {
    const hub = getHubFromPath(issue.file);
    const suggestedIcon = suggestIcon(issue.file);
    
    let fix = '';
    
    if (issue.pattern.includes('<h1')) {
        fix = `
// Replace this:
${issue.pattern}

// With this:
<PageHeader
    title="Your Page Title"
    description="Your page description"
    ${suggestedIcon ? `icon={${suggestedIcon}}` : ''}
/>

// Don't forget to add the import:
${STANDARD_IMPORTS.PageHeader}
${suggestedIcon ? `import { ${suggestedIcon} } from 'lucide-react';` : ''}
`;
    } else if (issue.pattern.includes('CardTitle')) {
        fix = `
// Replace this:
<CardHeader>
    ${issue.pattern}
    <CardDescription>...</CardDescription>
</CardHeader>

// With this:
<CardHeaderStandard
    title="Your Card Title"
    description="Your card description"
    ${suggestedIcon ? `icon={${suggestedIcon}}` : ''}
/>

// Don't forget to add the import:
${STANDARD_IMPORTS.CardHeaderStandard}
${suggestedIcon ? `import { ${suggestedIcon} } from 'lucide-react';` : ''}
`;
    }
    
    return fix;
}

function main() {
    console.log('🔍 Scanning for header consistency issues...\n');
    
    // Scan all TypeScript React files in the app directory
    const files = glob.sync('src/app/**/*.tsx', { ignore: ['**/node_modules/**'] });
    
    let totalIssues = 0;
    const issuesByFile = {};
    
    files.forEach(file => {
        const issues = scanFile(file);
        if (issues.length > 0) {
            issuesByFile[file] = issues;
            totalIssues += issues.length;
        }
    });
    
    if (totalIssues === 0) {
        console.log('✅ No header consistency issues found!');
        return;
    }
    
    console.log(`Found ${totalIssues} header consistency issues across ${Object.keys(issuesByFile).length} files:\n`);
    
    // Group issues by severity
    const issuesBySeverity = { high: [], medium: [], low: [] };
    
    Object.entries(issuesByFile).forEach(([file, issues]) => {
        issues.forEach(issue => {
            issuesBySeverity[issue.severity].push(issue);
        });
    });
    
    // Report high severity issues first
    ['high', 'medium', 'low'].forEach(severity => {
        const issues = issuesBySeverity[severity];
        if (issues.length === 0) return;
        
        console.log(`\n${'🔴🟡🟢'[['high', 'medium', 'low'].indexOf(severity)]} ${severity.toUpperCase()} PRIORITY (${issues.length} issues):`);
        console.log('─'.repeat(50));
        
        issues.forEach(issue => {
            console.log(`\n📁 ${issue.file}:${issue.line}`);
            console.log(`   Pattern: ${issue.pattern.substring(0, 80)}...`);
            console.log(`   💡 ${issue.suggestion}`);
            
            if (severity === 'high') {
                console.log(`\n   🔧 Suggested fix:`);
                console.log(generateFix(issue));
            }
        });
    });
    
    console.log('\n📋 SUMMARY:');
    console.log('─'.repeat(30));
    console.log(`High priority: ${issuesBySeverity.high.length} issues`);
    console.log(`Medium priority: ${issuesBySeverity.medium.length} issues`);
    console.log(`Low priority: ${issuesBySeverity.low.length} issues`);
    console.log(`Total: ${totalIssues} issues`);
    
    console.log('\n📚 RESOURCES:');
    console.log('─'.repeat(30));
    console.log('• Header Styling Guide: docs/ui-standards/header-styling-guide.md');
    console.log('• Component Documentation: docs/quick-reference/components.md');
    console.log('• PageHeader Component: src/components/ui/page-header.tsx');
    console.log('• CardHeaderStandard Component: src/components/ui/card-header-standard.tsx');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('─'.repeat(30));
    console.log('1. Fix high priority issues first');
    console.log('2. Test each page after making changes');
    console.log('3. Ensure proper imports are added');
    console.log('4. Run this script again to verify fixes');
    console.log('5. Update any custom styling as needed');
}

if (require.main === module) {
    main();
}

module.exports = { scanFile, generateFix, INCONSISTENT_PATTERNS };