#!/usr/bin/env node

/**
 * TypeScript Error Analysis Script
 * 
 * Analyzes TypeScript errors and categorizes them by type and priority
 */

const { execSync } = require('child_process');

function analyzeErrors() {
    try {
        console.log('🔍 Analyzing TypeScript errors...\n');

        // Get all TypeScript errors
        const output = execSync('npm run typecheck 2>&1', { encoding: 'utf8' });
        const lines = output.split('\n');

        const errors = lines.filter(line => line.includes('error TS'));

        // Categorize errors
        const categories = {
            'Missing Modules': [],
            'Type Mismatches': [],
            'Missing Properties': [],
            'Parameter Issues': [],
            'Import/Export Issues': [],
            'Any Type Issues': [],
            'Other': []
        };

        errors.forEach(error => {
            if (error.includes('Cannot find module')) {
                categories['Missing Modules'].push(error);
            } else if (error.includes('is not assignable to')) {
                categories['Type Mismatches'].push(error);
            } else if (error.includes('is missing the following properties')) {
                categories['Missing Properties'].push(error);
            } else if (error.includes('Parameter') || error.includes('Argument')) {
                categories['Parameter Issues'].push(error);
            } else if (error.includes('implicitly has an \'any\' type')) {
                categories['Any Type Issues'].push(error);
            } else if (error.includes('TS2307') || error.includes('TS2305')) {
                categories['Import/Export Issues'].push(error);
            } else {
                categories['Other'].push(error);
            }
        });

        // Display results
        console.log(`📊 Total TypeScript Errors: ${errors.length}\n`);

        Object.entries(categories).forEach(([category, categoryErrors]) => {
            if (categoryErrors.length > 0) {
                console.log(`🔸 ${category}: ${categoryErrors.length} errors`);

                // Show top 3 examples
                categoryErrors.slice(0, 3).forEach(error => {
                    const match = error.match(/([^(]+)\((\d+),(\d+)\): (.+)/);
                    if (match) {
                        const [, file, line, col, message] = match;
                        const shortFile = file.replace(process.cwd() + '/', '');
                        console.log(`   ${shortFile}:${line} - ${message.substring(0, 80)}...`);
                    }
                });

                if (categoryErrors.length > 3) {
                    console.log(`   ... and ${categoryErrors.length - 3} more`);
                }
                console.log('');
            }
        });

        // Priority recommendations
        console.log('🎯 Priority Fix Recommendations:\n');

        if (categories['Missing Modules'].length > 0) {
            console.log('1. 🚨 HIGH: Fix missing modules - these prevent compilation');
            console.log('   - Install missing dependencies');
            console.log('   - Fix import paths');
            console.log('   - Create missing files\n');
        }

        if (categories['Missing Properties'].length > 0) {
            console.log('2. 🔥 HIGH: Fix missing properties - these break functionality');
            console.log('   - Add required properties to objects');
            console.log('   - Update interfaces/types');
            console.log('   - Use optional properties where appropriate\n');
        }

        if (categories['Type Mismatches'].length > 0) {
            console.log('3. ⚠️  MEDIUM: Fix type mismatches - these cause runtime issues');
            console.log('   - Update type definitions');
            console.log('   - Add type assertions where safe');
            console.log('   - Fix data transformations\n');
        }

        if (categories['Any Type Issues'].length > 0) {
            console.log('4. 📝 LOW: Fix implicit any types - these reduce type safety');
            console.log('   - Add explicit type annotations');
            console.log('   - Use proper interfaces');
            console.log('   - Enable stricter TypeScript settings\n');
        }

        // Quick wins
        const quickWins = [
            ...categories['Missing Modules'].filter(e => e.includes('Cannot find module \'@/')),
            ...categories['Import/Export Issues'].filter(e => e.includes('src/'))
        ];

        if (quickWins.length > 0) {
            console.log(`⚡ Quick Wins (${quickWins.length} errors):`);
            console.log('   These are likely simple import path fixes or missing files');
            console.log('   Focus on these first for maximum impact\n');
        }

        // Files with most errors
        const fileErrors = {};
        errors.forEach(error => {
            const match = error.match(/([^(]+)\(/);
            if (match) {
                const file = match[1].replace(process.cwd() + '/', '');
                fileErrors[file] = (fileErrors[file] || 0) + 1;
            }
        });

        const topFiles = Object.entries(fileErrors)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        if (topFiles.length > 0) {
            console.log('📁 Files with Most Errors:');
            topFiles.forEach(([file, count]) => {
                console.log(`   ${count.toString().padStart(3)} errors - ${file}`);
            });
        }

    } catch (error) {
        console.error('Error analyzing TypeScript errors:', error.message);
    }
}

if (require.main === module) {
    analyzeErrors();
}

module.exports = { analyzeErrors };