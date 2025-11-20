#!/usr/bin/env node

/**
 * Lighthouse Performance Testing Script
 * 
 * This script runs Lighthouse audits on key pages of the application
 * and generates a report with scores for Performance, Accessibility, 
 * Best Practices, and SEO.
 * 
 * Usage:
 *   node scripts/lighthouse-test.js [url]
 * 
 * Example:
 *   node scripts/lighthouse-test.js http://localhost:3000
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Pages to test
const PAGES_TO_TEST = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Studio - Write', path: '/studio/write' },
    { name: 'Studio - Describe', path: '/studio/describe' },
    { name: 'Studio - Reimagine', path: '/studio/reimagine' },
    { name: 'Intelligence - Research', path: '/intelligence/research' },
    { name: 'Intelligence - Competitors', path: '/intelligence/competitors' },
    { name: 'Intelligence - Market Insights', path: '/intelligence/market-insights' },
    { name: 'Brand Center - Profile', path: '/brand-center/profile' },
    { name: 'Brand Center - Audit', path: '/brand-center/audit' },
    { name: 'Brand Center - Strategy', path: '/brand-center/strategy' },
    { name: 'Projects', path: '/projects' },
    { name: 'Training - Lessons', path: '/training/lessons' },
    { name: 'Training - AI Plan', path: '/training/ai-plan' },
];

// Lighthouse configuration
const lighthouseConfig = {
    extends: 'lighthouse:default',
    settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'desktop',
        throttling: {
            rttMs: 40,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
            disabled: false,
        },
    },
};

// Mobile configuration
const mobileConfig = {
    extends: 'lighthouse:default',
    settings: {
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        throttling: {
            rttMs: 150,
            throughputKbps: 1.6 * 1024,
            cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
            mobile: true,
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            disabled: false,
        },
    },
};

async function launchChromeAndRunLighthouse(url, config) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
        logLevel: 'info',
        output: 'json',
        port: chrome.port,
    };

    const runnerResult = await lighthouse(url, options, config);
    await chrome.kill();

    return runnerResult;
}

function formatScore(score) {
    if (score === null || score === undefined) return 'N/A';
    const percentage = Math.round(score * 100);
    if (percentage >= 90) return `\x1b[32m${percentage}\x1b[0m`; // Green
    if (percentage >= 50) return `\x1b[33m${percentage}\x1b[0m`; // Yellow
    return `\x1b[31m${percentage}\x1b[0m`; // Red
}

function printResults(results) {
    console.log('\n' + '='.repeat(80));
    console.log('LIGHTHOUSE TEST RESULTS');
    console.log('='.repeat(80) + '\n');

    let allPassed = true;
    const summary = {
        performance: [],
        accessibility: [],
        bestPractices: [],
        seo: [],
    };

    results.forEach(result => {
        console.log(`\n📄 ${result.name} (${result.formFactor})`);
        console.log('-'.repeat(80));
        console.log(`Performance:     ${formatScore(result.scores.performance)}`);
        console.log(`Accessibility:   ${formatScore(result.scores.accessibility)}`);
        console.log(`Best Practices:  ${formatScore(result.scores['best-practices'])}`);
        console.log(`SEO:             ${formatScore(result.scores.seo)}`);

        // Check if scores meet targets
        const perfScore = Math.round(result.scores.performance * 100);
        const a11yScore = Math.round(result.scores.accessibility * 100);

        if (perfScore < 90) {
            allPassed = false;
            console.log(`\x1b[31m⚠️  Performance score below target (90)\x1b[0m`);
        }
        if (a11yScore < 95) {
            allPassed = false;
            console.log(`\x1b[31m⚠️  Accessibility score below target (95)\x1b[0m`);
        }

        // Collect for summary
        summary.performance.push(perfScore);
        summary.accessibility.push(a11yScore);
        summary.bestPractices.push(Math.round(result.scores['best-practices'] * 100));
        summary.seo.push(Math.round(result.scores.seo * 100));
    });

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));

    const avgPerf = Math.round(summary.performance.reduce((a, b) => a + b, 0) / summary.performance.length);
    const avgA11y = Math.round(summary.accessibility.reduce((a, b) => a + b, 0) / summary.accessibility.length);
    const avgBP = Math.round(summary.bestPractices.reduce((a, b) => a + b, 0) / summary.bestPractices.length);
    const avgSEO = Math.round(summary.seo.reduce((a, b) => a + b, 0) / summary.seo.length);

    console.log(`\nAverage Performance:     ${formatScore(avgPerf / 100)} (Target: 90+)`);
    console.log(`Average Accessibility:   ${formatScore(avgA11y / 100)} (Target: 95+)`);
    console.log(`Average Best Practices:  ${formatScore(avgBP / 100)}`);
    console.log(`Average SEO:             ${formatScore(avgSEO / 100)}`);

    console.log('\n' + '='.repeat(80));

    if (allPassed) {
        console.log('\x1b[32m✅ All pages meet Lighthouse targets!\x1b[0m\n');
        return 0;
    } else {
        console.log('\x1b[31m❌ Some pages do not meet Lighthouse targets\x1b[0m\n');
        return 1;
    }
}

async function runTests(baseUrl) {
    console.log(`\n🚀 Starting Lighthouse tests for: ${baseUrl}\n`);
    console.log('This may take several minutes...\n');

    const results = [];

    // Test desktop version
    console.log('Testing Desktop version...');
    for (const page of PAGES_TO_TEST) {
        const url = `${baseUrl}${page.path}`;
        console.log(`  Testing: ${page.name}...`);

        try {
            const result = await launchChromeAndRunLighthouse(url, lighthouseConfig);
            results.push({
                name: page.name,
                path: page.path,
                formFactor: 'Desktop',
                scores: {
                    performance: result.lhr.categories.performance.score,
                    accessibility: result.lhr.categories.accessibility.score,
                    'best-practices': result.lhr.categories['best-practices'].score,
                    seo: result.lhr.categories.seo.score,
                },
            });
        } catch (error) {
            console.error(`    Error testing ${page.name}:`, error.message);
            results.push({
                name: page.name,
                path: page.path,
                formFactor: 'Desktop',
                scores: {
                    performance: null,
                    accessibility: null,
                    'best-practices': null,
                    seo: null,
                },
                error: error.message,
            });
        }
    }

    // Save results to file
    const resultsDir = path.join(process.cwd(), 'lighthouse-results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(resultsDir, `lighthouse-${timestamp}.json`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n📊 Results saved to: ${resultsFile}`);

    return printResults(results);
}

// Main execution
const baseUrl = process.argv[2] || 'http://localhost:3000';

runTests(baseUrl)
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
