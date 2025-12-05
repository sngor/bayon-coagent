#!/usr/bin/env node

/**
 * Bundle Size Tracking Script
 * 
 * This script tracks bundle sizes over time and stores them for trend analysis.
 * It creates a JSON file with historical bundle size data.
 */

const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(process.cwd(), '.bundle-size-history.json');
const MAX_HISTORY_ENTRIES = 100;

function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

function findFiles(dir, extension, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;

    const files = fs.readdirSync(dir);
    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findFiles(filePath, extension, fileList);
        } else if (file.endsWith(extension) && !file.endsWith('.map')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function calculateBundleSizes() {
    const buildDir = path.join(process.cwd(), '.next');

    const jsFiles = findFiles(path.join(buildDir, 'static'), '.js');
    const cssFiles = findFiles(path.join(buildDir, 'static'), '.css');

    const totalJS = jsFiles.reduce((sum, file) => sum + getFileSize(file), 0);
    const totalCSS = cssFiles.reduce((sum, file) => sum + getFileSize(file), 0);

    return {
        totalJS: Math.round(totalJS / 1024), // KB
        totalCSS: Math.round(totalCSS / 1024), // KB
        total: Math.round((totalJS + totalCSS) / 1024), // KB
        jsFileCount: jsFiles.length,
        cssFileCount: cssFiles.length,
    };
}


function loadHistory() {
    if (!fs.existsSync(HISTORY_FILE)) {
        return [];
    }

    try {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load history:', error);
        return [];
    }
}

function saveHistory(history) {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('Failed to save history:', error);
    }
}

function main() {
    console.log('📊 Tracking bundle sizes...\n');

    const sizes = calculateBundleSizes();
    const history = loadHistory();

    const entry = {
        timestamp: new Date().toISOString(),
        commit: process.env.GITHUB_SHA || 'local',
        branch: process.env.GITHUB_REF_NAME || 'local',
        ...sizes,
    };

    history.push(entry);

    // Keep only the last MAX_HISTORY_ENTRIES
    if (history.length > MAX_HISTORY_ENTRIES) {
        history.splice(0, history.length - MAX_HISTORY_ENTRIES);
    }

    saveHistory(history);

    console.log('Current bundle sizes:');
    console.log(`  Total JS:  ${sizes.totalJS} KB (${sizes.jsFileCount} files)`);
    console.log(`  Total CSS: ${sizes.totalCSS} KB (${sizes.cssFileCount} files)`);
    console.log(`  Total:     ${sizes.total} KB`);

    if (history.length > 1) {
        const previous = history[history.length - 2];
        const jsDiff = sizes.totalJS - previous.totalJS;
        const cssDiff = sizes.totalCSS - previous.totalCSS;
        const totalDiff = sizes.total - previous.total;

        console.log('\nChange from previous build:');
        console.log(`  JS:  ${jsDiff > 0 ? '+' : ''}${jsDiff} KB`);
        console.log(`  CSS: ${cssDiff > 0 ? '+' : ''}${cssDiff} KB`);
        console.log(`  Total: ${totalDiff > 0 ? '+' : ''}${totalDiff} KB`);
    }

    console.log(`\n✅ Bundle size tracked (${history.length} entries)`);
}

main();
