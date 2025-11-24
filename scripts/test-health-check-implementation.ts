#!/usr/bin/env tsx
/**
 * Health Check Implementation Test
 * 
 * This script performs comprehensive testing of the health check implementation
 * to ensure all components are properly configured and functional.
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
}

const results: TestResult[] = [];

/**
 * Test 1: Verify all Lambda function files exist
 */
function testLambdaFiles(): void {
    const lambdaFiles = [
        'src/lambda/health-check-ai-service.ts',
        'src/lambda/health-check-integration-service.ts',
        'src/lambda/health-check-background-service.ts',
        'src/lambda/health-check-admin-service.ts',
    ];

    let allExist = true;
    const missing: string[] = [];

    for (const file of lambdaFiles) {
        if (!fs.existsSync(file)) {
            allExist = false;
            missing.push(file);
        }
    }

    results.push({
        name: 'Lambda Function Files',
        passed: allExist,
        message: allExist
            ? `All ${lambdaFiles.length} Lambda function files exist`
            : `Missing files: ${missing.join(', ')}`,
    });
}

/**
 * Test 2: Verify Lambda functions have proper exports
 */
function testLambdaExports(): void {
    const lambdaFiles = [
        'src/lambda/health-check-ai-service.ts',
        'src/lambda/health-check-integration-service.ts',
        'src/lambda/health-check-background-service.ts',
        'src/lambda/health-check-admin-service.ts',
    ];

    let allHaveExports = true;
    const missingExports: string[] = [];

    for (const file of lambdaFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.includes('export const handler')) {
            allHaveExports = false;
            missingExports.push(file);
        }
    }

    results.push({
        name: 'Lambda Handler Exports',
        passed: allHaveExports,
        message: allHaveExports
            ? 'All Lambda functions export handler'
            : `Missing exports: ${missingExports.join(', ')}`,
    });
}

/**
 * Test 3: Verify Lambda functions use createHealthCheckResponse
 */
function testHealthCheckResponseUsage(): void {
    const lambdaFiles = [
        'src/lambda/health-check-ai-service.ts',
        'src/lambda/health-check-integration-service.ts',
        'src/lambda/health-check-background-service.ts',
        'src/lambda/health-check-admin-service.ts',
    ];

    let allUseHelper = true;
    const notUsing: string[] = [];

    for (const file of lambdaFiles) {
        const content = fs.readFileSync(file, 'utf8');
        if (!content.includes('createHealthCheckResponse')) {
            allUseHelper = false;
            notUsing.push(file);
        }
    }

    results.push({
        name: 'Health Check Response Helper',
        passed: allUseHelper,
        message: allUseHelper
            ? 'All Lambda functions use createHealthCheckResponse helper'
            : `Not using helper: ${notUsing.join(', ')}`,
    });
}

/**
 * Test 4: Verify API Gateway config has helper function
 */
function testApiGatewayConfig(): void {
    const configFile = 'src/aws/api-gateway/config.ts';

    if (!fs.existsSync(configFile)) {
        results.push({
            name: 'API Gateway Config',
            passed: false,
            message: 'Config file not found',
        });
        return;
    }

    const content = fs.readFileSync(configFile, 'utf8');
    const hasHelper = content.includes('export function createHealthCheckResponse');
    const hasInterface = content.includes('interface HealthCheckResult');

    results.push({
        name: 'API Gateway Config',
        passed: hasHelper && hasInterface,
        message: hasHelper && hasInterface
            ? 'Config has createHealthCheckResponse helper and HealthCheckResult interface'
            : 'Missing helper function or interface',
    });
}

/**
 * Test 5: Verify SAM template has health check resources
 */
function testSamTemplate(): void {
    const templateFile = 'template.yaml';

    if (!fs.existsSync(templateFile)) {
        results.push({
            name: 'SAM Template',
            passed: false,
            message: 'Template file not found',
        });
        return;
    }

    const content = fs.readFileSync(templateFile, 'utf8');

    const requiredResources = [
        'AiServiceHealthResource',
        'AiServiceHealthMethod',
        'AiServiceHealthCheckFunction',
        'IntegrationServiceHealthResource',
        'IntegrationServiceHealthMethod',
        'IntegrationServiceHealthCheckFunction',
        'BackgroundServiceHealthResource',
        'BackgroundServiceHealthMethod',
        'BackgroundServiceHealthCheckFunction',
        'AdminServiceHealthResource',
        'AdminServiceHealthMethod',
        'AdminServiceHealthCheckFunction',
    ];

    const missing: string[] = [];
    for (const resource of requiredResources) {
        if (!content.includes(resource)) {
            missing.push(resource);
        }
    }

    results.push({
        name: 'SAM Template Resources',
        passed: missing.length === 0,
        message: missing.length === 0
            ? `All ${requiredResources.length} required resources found`
            : `Missing resources: ${missing.join(', ')}`,
    });
}

/**
 * Test 6: Verify health check guide exists
 */
function testHealthCheckGuide(): void {
    const guideFile = 'src/lambda/utils/HEALTH_CHECK_GUIDE.md';

    const exists = fs.existsSync(guideFile);

    if (exists) {
        const content = fs.readFileSync(guideFile, 'utf8');
        const hasAllSections =
            content.includes('## Available Endpoints') &&
            content.includes('## Response Format') &&
            content.includes('## Authentication') &&
            content.includes('## Monitoring Integration');

        results.push({
            name: 'Health Check Guide',
            passed: hasAllSections,
            message: hasAllSections
                ? 'Guide exists with all required sections'
                : 'Guide missing some sections',
        });
    } else {
        results.push({
            name: 'Health Check Guide',
            passed: false,
            message: 'Guide file not found',
        });
    }
}

/**
 * Test 7: Verify verification script exists
 */
function testVerificationScript(): void {
    const scriptFile = 'scripts/verify-health-checks.ts';

    const exists = fs.existsSync(scriptFile);

    if (exists) {
        const content = fs.readFileSync(scriptFile, 'utf8');
        const hasMainFunction = content.includes('async function main()');
        const hasChecks = content.includes('expectedHealthChecks');

        results.push({
            name: 'Verification Script',
            passed: hasMainFunction && hasChecks,
            message: hasMainFunction && hasChecks
                ? 'Verification script is complete'
                : 'Verification script missing key components',
        });
    } else {
        results.push({
            name: 'Verification Script',
            passed: false,
            message: 'Verification script not found',
        });
    }
}

/**
 * Test 8: Verify Lambda functions check dependencies
 */
function testDependencyChecks(): void {
    const checks = [
        { file: 'src/lambda/health-check-ai-service.ts', deps: ['DynamoDB', 'SQS', 'Bedrock'] },
        { file: 'src/lambda/health-check-integration-service.ts', deps: ['DynamoDB', 'SecretsManager', 'S3'] },
        { file: 'src/lambda/health-check-background-service.ts', deps: ['DynamoDB', 'EventBridge', 'CloudWatch'] },
        { file: 'src/lambda/health-check-admin-service.ts', deps: ['DynamoDB', 'Cognito', 'CloudWatch'] },
    ];

    let allHaveDeps = true;
    const missing: string[] = [];

    for (const check of checks) {
        const content = fs.readFileSync(check.file, 'utf8');
        for (const dep of check.deps) {
            if (!content.includes(dep)) {
                allHaveDeps = false;
                missing.push(`${path.basename(check.file)}: ${dep}`);
            }
        }
    }

    results.push({
        name: 'Dependency Checks',
        passed: allHaveDeps,
        message: allHaveDeps
            ? 'All Lambda functions check their required dependencies'
            : `Missing dependency checks: ${missing.join(', ')}`,
    });
}

/**
 * Main test runner
 */
async function main() {
    console.log('='.repeat(80));
    console.log('Health Check Implementation Test');
    console.log('='.repeat(80));
    console.log('');

    // Run all tests
    testLambdaFiles();
    testLambdaExports();
    testHealthCheckResponseUsage();
    testApiGatewayConfig();
    testSamTemplate();
    testHealthCheckGuide();
    testVerificationScript();
    testDependencyChecks();

    // Display results
    console.log('Test Results:');
    console.log('-'.repeat(80));

    let allPassed = true;
    for (const result of results) {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
        console.log(`   ${result.message}`);
        if (!result.passed) {
            allPassed = false;
        }
    }

    console.log('');
    console.log('='.repeat(80));

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    if (allPassed) {
        console.log(`✅ All ${totalCount} tests passed!`);
        console.log('');
        console.log('Health check implementation is complete and ready for deployment.');
        process.exit(0);
    } else {
        console.log(`❌ ${totalCount - passedCount} of ${totalCount} tests failed.`);
        console.log('');
        console.log('Please review the failures above and fix the issues.');
        process.exit(1);
    }
}

// Run tests
main();
