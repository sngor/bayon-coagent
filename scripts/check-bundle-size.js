#!/usr/bin/env node

/**
 * Bundle Size Monitoring Script
 * 
 * This script checks the bundle sizes after a production build and
 * ensures they don't exceed the defined thresholds.
 * 
 * Usage:
 *   node scripts/check-bundle-size.js
 * 
 * Exit codes:
 *   0 - All bundles within limits
 *   1 - One or more bundles exceed limits
 */

const fs = require('fs');
const path = require('path');

// Bundle size thresholds (in KB)
const THRESHOLDS = {
    // Initial bundle size limit (gzipped)
    INITIAL_JS: 200, // 200KB as per design document
    INITIAL_CSS: 50,  // 50KB as per design document

    // Individual page bundles
    PAGE_JS: 150,     // 150KB per page

    // Shared chunks
    SHARED_JS: 100,   // 100KB for shared chunks
};

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    bold: '\x1b[1m',
};

/**
 * Format bytes to KB with 2 decimal places
 */
function formatKB(bytes) {
    return (bytes / 1024).toFixed(2);
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
}

/**
 * Check if a file exceeds the threshold
 */
function checkThreshold(filePath, thresholdKB, label) {
    const sizeBytes = getFileSize(filePath);
    const sizeKB = sizeBytes / 1024;
    const percentage = (sizeKB / thresholdKB) * 100;

    const status = sizeKB <= thresholdKB ? 'PASS' : 'FAIL';
    const color = sizeKB <= thresholdKB ? colors.green : colors.red;

    console.log(
        `${color}${status}${colors.reset} ${label}: ${formatKB(sizeBytes)} KB / ${thresholdKB} KB (${percentage.toFixed(1)}%)`
    );

    return sizeKB <= thresholdKB;
}

/**
 * Find all JavaScript files in the build directory
 */
function findJSFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findJSFiles(filePath, fileList);
        } else if (file.endsWith('.js') && !file.endsWith('.map')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Find all CSS files in the build directory
 */
function findCSSFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            findCSSFiles(filePath, fileList);
        } else if (file.endsWith('.css') && !file.endsWith('.map')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

/**
 * Main function
 */
function main() {
    console.log(`${colors.bold}${colors.blue}Bundle Size Check${colors.reset}\n`);

    const buildDir = path.join(process.cwd(), '.next');

    // Check if build directory exists
    if (!fs.existsSync(buildDir)) {
        console.error(`${colors.red}Error: Build directory not found. Run 'npm run build' first.${colors.reset}`);
        process.exit(1);
    }

    let allPassed = true;

    // Check JavaScript bundles
    console.log(`${colors.bold}JavaScript Bundles:${colors.reset}`);
    const jsFiles = findJSFiles(path.join(buildDir, 'static'));

    // Find main app bundle
    const mainBundle = jsFiles.find((file) => file.includes('main-') || file.includes('app-'));
    if (mainBundle) {
        const passed = checkThreshold(mainBundle, THRESHOLDS.INITIAL_JS, 'Main Bundle');
        allPassed = allPassed && passed;
    }

    // Check page bundles
    const pageFiles = jsFiles.filter((file) => file.includes('/pages/'));
    pageFiles.forEach((file) => {
        const fileName = path.basename(file);
        const passed = checkThreshold(file, THRESHOLDS.PAGE_JS, `Page: ${fileName}`);
        allPassed = allPassed && passed;
    });

    // Check shared chunks
    const chunkFiles = jsFiles.filter((file) => file.includes('/chunks/') && !file.includes('/pages/'));
    chunkFiles.forEach((file) => {
        const fileName = path.basename(file);
        const sizeKB = getFileSize(file) / 1024;

        // Only check chunks larger than 50KB
        if (sizeKB > 50) {
            const passed = checkThreshold(file, THRESHOLDS.SHARED_JS, `Chunk: ${fileName}`);
            allPassed = allPassed && passed;
        }
    });

    // Check CSS bundles
    console.log(`\n${colors.bold}CSS Bundles:${colors.reset}`);
    const cssFiles = findCSSFiles(path.join(buildDir, 'static'));

    cssFiles.forEach((file) => {
        const fileName = path.basename(file);
        const passed = checkThreshold(file, THRESHOLDS.INITIAL_CSS, `CSS: ${fileName}`);
        allPassed = allPassed && passed;
    });

    // Calculate total bundle size
    console.log(`\n${colors.bold}Total Bundle Sizes:${colors.reset}`);
    const totalJS = jsFiles.reduce((sum, file) => sum + getFileSize(file), 0);
    const totalCSS = cssFiles.reduce((sum, file) => sum + getFileSize(file), 0);
    const totalSize = totalJS + totalCSS;

    console.log(`Total JavaScript: ${formatKB(totalJS)} KB`);
    console.log(`Total CSS: ${formatKB(totalCSS)} KB`);
    console.log(`Total Size: ${formatKB(totalSize)} KB`);

    // Summary
    console.log(`\n${colors.bold}Summary:${colors.reset}`);
    if (allPassed) {
        console.log(`${colors.green}✓ All bundles are within size limits${colors.reset}`);
        process.exit(0);
    } else {
        console.log(`${colors.red}✗ Some bundles exceed size limits${colors.reset}`);
        console.log(`\n${colors.yellow}Recommendations:${colors.reset}`);
        console.log('1. Use dynamic imports for heavy components');
        console.log('2. Check for duplicate dependencies');
        console.log('3. Remove unused code and dependencies');
        console.log('4. Use code splitting for large pages');
        console.log('5. Run "npm run analyze" to visualize bundle composition');
        process.exit(1);
    }
}

// Run the script
main();
