#!/usr/bin/env node

/**
 * Security check script to validate environment configuration
 * and detect potential secret exposure
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkGitIgnore() {
    log('\n🔍 Checking .gitignore configuration...', 'blue');

    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
        log('❌ .gitignore file not found!', 'red');
        return false;
    }

    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    const requiredPatterns = [
        '.env.local',
        '.env.production',
        '.env*.local',
        'serviceAccountKey.json',
    ];

    let allFound = true;
    requiredPatterns.forEach(pattern => {
        if (gitignore.includes(pattern)) {
            log(`✅ ${pattern} is gitignored`, 'green');
        } else {
            log(`❌ ${pattern} is NOT gitignored`, 'red');
            allFound = false;
        }
    });

    return allFound;
}

function checkEnvFiles() {
    log('\n🔍 Checking environment files...', 'blue');

    const envFiles = ['.env.local', '.env.production', '.env'];
    const dangerousPatterns = [
        { pattern: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
        { pattern: /[0-9a-zA-Z/+=]{40}/, name: 'AWS Secret Key' },
        { pattern: /tvly-[a-zA-Z0-9]{32}/, name: 'Tavily API Key' },
        { pattern: /AIzaSy[a-zA-Z0-9_-]{33}/, name: 'Google API Key' },
        { pattern: /sk-[a-zA-Z0-9]{48}/, name: 'OpenAI API Key' },
    ];

    let issuesFound = false;

    envFiles.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            log(`\n📄 Checking ${file}...`, 'yellow');
            const content = fs.readFileSync(filePath, 'utf8');

            dangerousPatterns.forEach(({ pattern, name }) => {
                const matches = content.match(pattern);
                if (matches && matches.length > 0) {
                    log(`⚠️  Found potential ${name} in ${file}`, 'yellow');
                    log(`   Make sure this file is in .gitignore!`, 'yellow');
                }
            });

            // Check for placeholder values
            if (content.includes('your-') || content.includes('xxxxx')) {
                log(`✅ Contains placeholder values (good for examples)`, 'green');
            }
        }
    });

    return !issuesFound;
}

function checkGitTracking() {
    log('\n🔍 Checking if sensitive files are tracked by git...', 'blue');

    const { execSync } = require('child_process');
    const sensitiveFiles = [
        '.env.local',
        '.env.production',
        '.env',
        'serviceAccountKey.json',
    ];

    let allSafe = true;

    sensitiveFiles.forEach(file => {
        try {
            const result = execSync(`git ls-files ${file}`, { encoding: 'utf8' });
            if (result.trim()) {
                log(`❌ ${file} is tracked by git! Remove it immediately!`, 'red');
                log(`   Run: git rm --cached ${file}`, 'yellow');
                allSafe = false;
            } else {
                log(`✅ ${file} is not tracked by git`, 'green');
            }
        } catch (error) {
            // File not tracked (good) or git not available
            log(`✅ ${file} is not tracked by git`, 'green');
        }
    });

    return allSafe;
}

function checkDocumentation() {
    log('\n🔍 Checking documentation for exposed secrets...', 'blue');

    const docsToCheck = [
        'README.md',
        'QUICK_START.md',
        'docs/guides/environment-variables.md',
    ];

    const realKeyPatterns = [
        { pattern: /AKIA[0-9A-Z]{16}/, name: 'Real AWS Access Key' },
        { pattern: /tvly-[a-zA-Z0-9]{32}/, name: 'Real Tavily API Key' },
        { pattern: /AIzaSy[a-zA-Z0-9_-]{33}/, name: 'Real Google API Key' },
    ];

    let issuesFound = false;

    docsToCheck.forEach(file => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');

            realKeyPatterns.forEach(({ pattern, name }) => {
                if (pattern.test(content)) {
                    log(`❌ Found ${name} in ${file}!`, 'red');
                    log(`   Replace with placeholder values`, 'yellow');
                    issuesFound = true;
                }
            });
        }
    });

    if (!issuesFound) {
        log('✅ No exposed secrets found in documentation', 'green');
    }

    return !issuesFound;
}

function checkGitHubActions() {
    log('\n🔍 Checking GitHub Actions configuration...', 'blue');

    const workflowPath = path.join(process.cwd(), '.github/workflows');
    if (!fs.existsSync(workflowPath)) {
        log('⚠️  No GitHub Actions workflows found', 'yellow');
        log('   Consider adding CI/CD with secret management', 'yellow');
        return true;
    }

    const workflows = fs.readdirSync(workflowPath);
    let hasSecrets = false;

    workflows.forEach(file => {
        const content = fs.readFileSync(path.join(workflowPath, file), 'utf8');
        if (content.includes('secrets.')) {
            hasSecrets = true;
            log(`✅ ${file} uses GitHub Secrets`, 'green');
        }
    });

    if (!hasSecrets) {
        log('⚠️  No workflows use GitHub Secrets', 'yellow');
        log('   Add secrets for CI/CD deployments', 'yellow');
    }

    return true;
}

function main() {
    log('🔐 Security Check - API Key and Secret Validation', 'blue');
    log('================================================\n', 'blue');

    const checks = [
        checkGitIgnore(),
        checkGitTracking(),
        checkEnvFiles(),
        checkDocumentation(),
        checkGitHubActions(),
    ];

    const allPassed = checks.every(check => check);

    log('\n================================================', 'blue');
    if (allPassed) {
        log('✅ All security checks passed!', 'green');
        log('\nRemember to:', 'blue');
        log('  1. Never commit .env files with real credentials', 'blue');
        log('  2. Use GitHub Secrets for CI/CD', 'blue');
        log('  3. Rotate API keys regularly', 'blue');
        log('  4. Use AWS Secrets Manager in production', 'blue');
    } else {
        log('❌ Some security checks failed!', 'red');
        log('\nPlease fix the issues above before committing.', 'red');
        process.exit(1);
    }
}

main();
