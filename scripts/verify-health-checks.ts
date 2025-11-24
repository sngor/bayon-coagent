#!/usr/bin/env tsx
/**
 * Health Check Verification Script
 * 
 * This script verifies that all service health check endpoints are configured correctly
 * in the SAM template and that the Lambda functions exist.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const templatePath = path.join(process.cwd(), 'template.yaml');
const lambdaDir = path.join(process.cwd(), 'src', 'lambda');

interface HealthCheckConfig {
    service: string;
    lambdaFile: string;
    lambdaFunction: string;
    apiResource: string;
    apiMethod: string;
    apiGateway: string;
}

const expectedHealthChecks: HealthCheckConfig[] = [
    {
        service: 'AI Service',
        lambdaFile: 'health-check-ai-service.ts',
        lambdaFunction: 'AiServiceHealthCheckFunction',
        apiResource: 'AiServiceHealthResource',
        apiMethod: 'AiServiceHealthMethod',
        apiGateway: 'AiServiceApi',
    },
    {
        service: 'Integration Service',
        lambdaFile: 'health-check-integration-service.ts',
        lambdaFunction: 'IntegrationServiceHealthCheckFunction',
        apiResource: 'IntegrationServiceHealthResource',
        apiMethod: 'IntegrationServiceHealthMethod',
        apiGateway: 'IntegrationServiceApi',
    },
    {
        service: 'Background Service',
        lambdaFile: 'health-check-background-service.ts',
        lambdaFunction: 'BackgroundServiceHealthCheckFunction',
        apiResource: 'BackgroundServiceHealthResource',
        apiMethod: 'BackgroundServiceHealthMethod',
        apiGateway: 'BackgroundServiceApi',
    },
    {
        service: 'Admin Service',
        lambdaFile: 'health-check-admin-service.ts',
        lambdaFunction: 'AdminServiceHealthCheckFunction',
        apiResource: 'AdminServiceHealthResource',
        apiMethod: 'AdminServiceHealthMethod',
        apiGateway: 'AdminServiceApi',
    },
];

/**
 * Check if a Lambda function file exists
 */
function checkLambdaFile(filename: string): boolean {
    const filePath = path.join(lambdaDir, filename);
    return fs.existsSync(filePath);
}

/**
 * Check if a resource exists in the SAM template
 */
function checkTemplateResource(template: any, resourceName: string): boolean {
    return template.Resources && resourceName in template.Resources;
}

/**
 * Get resource details from template
 */
function getResourceDetails(template: any, resourceName: string): any {
    return template.Resources?.[resourceName];
}

/**
 * Main verification function
 */
async function main() {
    console.log('='.repeat(80));
    console.log('Health Check Configuration Verification');
    console.log('='.repeat(80));

    try {
        // Read SAM template
        console.log('\nReading SAM template...');
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        const template = yaml.parse(templateContent);

        let allChecksPass = true;
        const results: Array<{
            service: string;
            checks: Array<{ name: string; passed: boolean; details?: string }>;
        }> = [];

        // Verify each health check configuration
        for (const config of expectedHealthChecks) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`Checking ${config.service}...`);
            console.log('='.repeat(80));

            const checks: Array<{ name: string; passed: boolean; details?: string }> = [];

            // Check Lambda file exists
            const lambdaExists = checkLambdaFile(config.lambdaFile);
            checks.push({
                name: 'Lambda Function File',
                passed: lambdaExists,
                details: lambdaExists ? `✅ ${config.lambdaFile}` : `❌ ${config.lambdaFile} not found`,
            });
            console.log(`  Lambda File: ${lambdaExists ? '✅' : '❌'} ${config.lambdaFile}`);

            // Check Lambda function in template
            const lambdaInTemplate = checkTemplateResource(template, config.lambdaFunction);
            checks.push({
                name: 'Lambda Function in Template',
                passed: lambdaInTemplate,
                details: lambdaInTemplate ? `✅ ${config.lambdaFunction}` : `❌ ${config.lambdaFunction} not found`,
            });
            console.log(`  Lambda Resource: ${lambdaInTemplate ? '✅' : '❌'} ${config.lambdaFunction}`);

            if (lambdaInTemplate) {
                const lambdaDetails = getResourceDetails(template, config.lambdaFunction);
                const handler = lambdaDetails?.Properties?.Handler;
                console.log(`    Handler: ${handler}`);
            }

            // Check API Gateway resource
            const apiResourceExists = checkTemplateResource(template, config.apiResource);
            checks.push({
                name: 'API Gateway Resource',
                passed: apiResourceExists,
                details: apiResourceExists ? `✅ ${config.apiResource}` : `❌ ${config.apiResource} not found`,
            });
            console.log(`  API Resource: ${apiResourceExists ? '✅' : '❌'} ${config.apiResource}`);

            if (apiResourceExists) {
                const resourceDetails = getResourceDetails(template, config.apiResource);
                const pathPart = resourceDetails?.Properties?.PathPart;
                console.log(`    Path: /${pathPart}`);
            }

            // Check API Gateway method
            const apiMethodExists = checkTemplateResource(template, config.apiMethod);
            checks.push({
                name: 'API Gateway Method',
                passed: apiMethodExists,
                details: apiMethodExists ? `✅ ${config.apiMethod}` : `❌ ${config.apiMethod} not found`,
            });
            console.log(`  API Method: ${apiMethodExists ? '✅' : '❌'} ${config.apiMethod}`);

            if (apiMethodExists) {
                const methodDetails = getResourceDetails(template, config.apiMethod);
                const httpMethod = methodDetails?.Properties?.HttpMethod;
                const authType = methodDetails?.Properties?.AuthorizationType;
                console.log(`    HTTP Method: ${httpMethod}`);
                console.log(`    Auth Type: ${authType}`);
            }

            // Check API Gateway exists
            const apiGatewayExists = checkTemplateResource(template, config.apiGateway);
            checks.push({
                name: 'API Gateway',
                passed: apiGatewayExists,
                details: apiGatewayExists ? `✅ ${config.apiGateway}` : `❌ ${config.apiGateway} not found`,
            });
            console.log(`  API Gateway: ${apiGatewayExists ? '✅' : '❌'} ${config.apiGateway}`);

            // Check deployment dependency
            const deploymentName = `${config.apiGateway.replace('Api', '')}ApiDeployment`;
            const deploymentExists = checkTemplateResource(template, deploymentName);
            if (deploymentExists) {
                const deploymentDetails = getResourceDetails(template, deploymentName);
                const dependsOn = deploymentDetails?.DependsOn || [];
                const hasDependency = Array.isArray(dependsOn)
                    ? dependsOn.includes(config.apiMethod)
                    : dependsOn === config.apiMethod;

                checks.push({
                    name: 'Deployment Dependency',
                    passed: hasDependency,
                    details: hasDependency
                        ? `✅ ${deploymentName} depends on ${config.apiMethod}`
                        : `⚠️  ${deploymentName} missing dependency on ${config.apiMethod}`,
                });
                console.log(`  Deployment Dependency: ${hasDependency ? '✅' : '⚠️'}`);
            }

            results.push({ service: config.service, checks });

            const allPassed = checks.every(c => c.passed);
            if (!allPassed) {
                allChecksPass = false;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('Summary');
        console.log('='.repeat(80));

        for (const result of results) {
            const passedCount = result.checks.filter(c => c.passed).length;
            const totalCount = result.checks.length;
            const icon = passedCount === totalCount ? '✅' : '❌';
            console.log(`${icon} ${result.service}: ${passedCount}/${totalCount} checks passed`);
        }

        if (allChecksPass) {
            console.log('\n✅ All health check endpoints are properly configured!');
            console.log('\nNext steps:');
            console.log('  1. Deploy the infrastructure: npm run sam:deploy:dev');
            console.log('  2. Test the endpoints using AWS CLI or the AWS Console');
            process.exit(0);
        } else {
            console.log('\n❌ Some health check configurations are missing or incomplete.');
            console.log('Please review the errors above and update the SAM template.');
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
}

// Run the verification
main();
