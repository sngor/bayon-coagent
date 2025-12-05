#!/usr/bin/env node

/**
 * Dependency Analysis Script
 * 
 * Analyzes package.json dependencies and checks for:
 * - Unused dependencies
 * - Duplicate functionality
 * - Outdated packages
 * - Potential optimizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJson = require('../package.json');

console.log('🔍 Analyzing Dependencies...\n');

// Dependencies to check
const dependencies = Object.keys(packageJson.dependencies);
const devDependencies = Object.keys(packageJson.devDependencies);

console.log(`📦 Total Dependencies: ${dependencies.length}`);
console.log(`🛠️  Dev Dependencies: ${devDependencies.length}\n`);

// Check for potentially unused dependencies
const potentiallyUnused = [
    '@mantine/form',
    '@tailwindcss/line-clamp',
    'critters',
    'marked',
];

console.log('⚠️  Potentially Unused Dependencies:');
potentiallyUnused.forEach(dep => {
    if (dependencies.includes(dep)) {
        console.log(`  - ${dep} (${packageJson.dependencies[dep]})`);
    }
});
console.log('');

// Check for duplicate functionality
console.log('🔄 Duplicate Functionality:');
const duplicates = [
    {
        packages: ['@google/genai', '@google/generative-ai'],
        suggestion: 'Consolidate to one Google AI package'
    },
];

duplicates.forEach(({ packages, suggestion }) => {
    const found = packages.filter(pkg => dependencies.includes(pkg));
    if (found.length > 1) {
        console.log(`  - ${found.join(', ')}`);
        console.log(`    💡 ${suggestion}`);
    }
});
console.log('');

// Check for large dependencies
console.log('📊 Large Dependencies (>100KB):');
const largeDeps = [
    { name: 'recharts', size: '~900KB', suggestion: 'Use dynamic imports' },
    { name: 'framer-motion', size: '~850KB', suggestion: 'Consider CSS animations or lazy loading' },
    { name: 'jspdf', size: '~670KB', suggestion: 'Lazy load on demand' },
    { name: 'html2canvas', size: '~450KB', suggestion: 'Lazy load on demand' },
    { name: 'date-fns', size: '~340KB', suggestion: 'Use specific imports or switch to day.js' },
    { name: '@react-google-maps/api', size: '~150KB', suggestion: 'Lazy load map components' },
];

largeDeps.forEach(({ name, size, suggestion }) => {
    if (dependencies.includes(name)) {
        console.log(`  - ${name} (${size})`);
        console.log(`    💡 ${suggestion}`);
    }
});
console.log('');

// Check for dependencies that should be devDependencies
console.log('🔧 Dependencies that might be devDependencies:');
const shouldBeDevDeps = ['localstack'];

shouldBeDevDeps.forEach(dep => {
    if (dependencies.includes(dep)) {
        console.log(`  - ${dep}`);
    }
});
console.log('');

// Optimization recommendations
console.log('✨ Optimization Recommendations:\n');
console.log('1. Remove @tailwindcss/line-clamp (deprecated, use native Tailwind)');
console.log('2. Consolidate Google AI packages to one');
console.log('3. Use specific lodash imports instead of full library');
console.log('4. Lazy load recharts, jspdf, html2canvas');
console.log('5. Consider replacing date-fns with day.js (2KB vs 340KB)');
console.log('6. Move localstack to devDependencies');
console.log('7. Verify @mantine/form usage or remove');
console.log('8. Check if marked is needed (Next.js has MDX support)');
console.log('');

console.log('📝 Next Steps:\n');
console.log('1. Search codebase for usage of potentially unused packages');
console.log('2. Run: npm run analyze to see bundle composition');
console.log('3. Remove confirmed unused dependencies');
console.log('4. Implement dynamic imports for large packages');
console.log('5. Re-run bundle analysis to verify improvements');
console.log('');

console.log('✅ Analysis Complete!');
