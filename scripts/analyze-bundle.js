#!/usr/bin/env node

/**
 * Bundle size analyzer script
 * Run with: node scripts/analyze-bundle.js
 * 
 * This script analyzes the Next.js build output to identify
 * large bundles and optimization opportunities
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(process.cwd(), '.next');
const BUILD_MANIFEST = path.join(BUILD_DIR, 'build-manifest.json');

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function analyzeBundle() {
    console.log('📊 Analyzing bundle size...\n');

    if (!fs.existsSync(BUILD_MANIFEST)) {
        console.error('❌ Build manifest not found. Run `npm run build` first.');
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(BUILD_MANIFEST, 'utf8'));

    // Analyze page bundles
    console.log('📄 Page Bundles:');
    console.log('─'.repeat(60));

    const pageSizes = {};

    for (const [page, files] of Object.entries(manifest.pages)) {
        let totalSize = 0;

        for (const file of files) {
            const filePath = path.join(BUILD_DIR, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                totalSize += stats.size;
            }
        }

        pageSizes[page] = totalSize;
    }

    // Sort by size
    const sortedPages = Object.entries(pageSizes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10

    for (const [page, size] of sortedPages) {
        const sizeStr = formatBytes(size);
        const warning = size > 500000 ? ' ⚠️' : ''; // Warn if > 500KB
        console.log(`${page.padEnd(40)} ${sizeStr}${warning}`);
    }

    console.log('\n');

    // Recommendations
    console.log('💡 Optimization Recommendations:');
    console.log('─'.repeat(60));

    const largePages = sortedPages.filter(([, size]) => size > 500000);

    if (largePages.length > 0) {
        console.log('⚠️  Large page bundles detected (> 500KB):');
        for (const [page] of largePages) {
            console.log(`   - ${page}`);
        }
        console.log('\n   Consider:');
        console.log('   • Using dynamic imports for heavy components');
        console.log('   • Code splitting with React.lazy()');
        console.log('   • Optimizing package imports');
        console.log('   • Removing unused dependencies');
    } else {
        console.log('✅ All page bundles are optimized (< 500KB)');
    }

    console.log('\n');

    // Check for common optimization opportunities
    console.log('🔍 Common Optimization Checks:');
    console.log('─'.repeat(60));

    const packageJson = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    );

    const heavyPackages = [
        'moment',
        'lodash',
        'date-fns',
        'recharts',
        'framer-motion',
    ];

    const foundHeavy = heavyPackages.filter(
        pkg => packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]
    );

    if (foundHeavy.length > 0) {
        console.log('📦 Heavy packages detected:');
        for (const pkg of foundHeavy) {
            console.log(`   - ${pkg}`);
        }
        console.log('\n   Consider:');
        console.log('   • Using tree-shakeable alternatives');
        console.log('   • Dynamic imports for these packages');
        console.log('   • Optimizing package imports in next.config.ts');
    } else {
        console.log('✅ No commonly heavy packages detected');
    }

    console.log('\n');
    console.log('📈 Performance Target: Initial content < 2 seconds');
    console.log('   Run the app and check browser DevTools > Performance');
    console.log('   Look for First Contentful Paint (FCP) metric');
    console.log('\n');
}

try {
    analyzeBundle();
} catch (error) {
    console.error('❌ Error analyzing bundle:', error.message);
    process.exit(1);
}
