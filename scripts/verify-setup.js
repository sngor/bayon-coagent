#!/usr/bin/env node

/**
 * Verification script for AWS infrastructure setup
 * Checks that all required components are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying AWS Infrastructure Setup...\n');

let allChecksPass = true;

function checkFile(filePath, description) {
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${description}: ${filePath}`);
    if (!exists) allChecksPass = false;
    return exists;
}

function checkPackage(packageName) {
    try {
        require.resolve(packageName);
        console.log(`✅ Package installed: ${packageName}`);
        return true;
    } catch (e) {
        console.log(`❌ Package missing: ${packageName}`);
        allChecksPass = false;
        return false;
    }
}

console.log('📦 Checking AWS SDK Packages:');
checkPackage('@aws-sdk/client-cognito-identity-provider');
checkPackage('@aws-sdk/client-dynamodb');
checkPackage('@aws-sdk/lib-dynamodb');
checkPackage('@aws-sdk/client-s3');
checkPackage('@aws-sdk/client-bedrock-runtime');

console.log('\n📁 Checking Configuration Files:');
checkFile('docker-compose.yml', 'Docker Compose configuration');
checkFile('.env.local', 'Local environment variables');
checkFile('.env.production', 'Production environment variables');
checkFile('src/aws/config.ts', 'AWS configuration module');
checkFile('scripts/init-localstack.sh', 'LocalStack initialization script');

console.log('\n📚 Checking Documentation:');
checkFile('AWS_SETUP.md', 'AWS setup documentation');

console.log('\n🧪 Checking Test Files:');
checkFile('src/aws/config.test.ts', 'Configuration module tests');

console.log('\n📝 Checking package.json scripts:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = [
    'localstack:start',
    'localstack:stop',
    'localstack:init',
    'localstack:logs'
];

requiredScripts.forEach(script => {
    const exists = packageJson.scripts && packageJson.scripts[script];
    const status = exists ? '✅' : '❌';
    console.log(`${status} Script: ${script}`);
    if (!exists) allChecksPass = false;
});

console.log('\n' + '='.repeat(50));
if (allChecksPass) {
    console.log('✅ All checks passed! AWS infrastructure setup is complete.');
    console.log('\nNext steps:');
    console.log('1. Start Docker Desktop');
    console.log('2. Run: npm run localstack:start');
    console.log('3. Run: npm run localstack:init');
    console.log('4. Run: npm run dev');
    process.exit(0);
} else {
    console.log('❌ Some checks failed. Please review the output above.');
    process.exit(1);
}
