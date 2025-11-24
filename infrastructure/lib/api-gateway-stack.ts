import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface ApiGatewayStackProps extends cdk.StackProps {
    environment: string;
    applicationRole: iam.Role;
    customDomainName?: string;
    certificateArn?: string;
    hostedZoneId?: string;
}

export class ApiGatewayStack extends cdk.Stack {
    public readonly restApi: apigateway.RestApi;
    public readonly aiServiceApi: apigateway.RestApi;
    public readonly integrationServiceApi: apigateway.RestApi;
    public readonly backgroundServiceApi: apigateway.RestApi;
    public readonly adminServiceApi: apigateway.RestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
        super(scope, id, props);

        const { environment, applicationRole, customDomainName, certificateArn, hostedZoneId } = props;
        const isProd = environment === 'production';

        // Create CloudWatch Log Group for API Gateway
        const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
            logGroupName: `/aws/apigateway/bayon-coagent-${environment}`,
            retention: isProd ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
            removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
        });

        // Create IAM role for API Gateway CloudWatch logging
        const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
            assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
            ],
        });

        // Main API Gateway for Core Platform Service
        this.restApi = new apigateway.RestApi(this, 'MainRestApi', {
            restApiName: `bayon-coagent-main-${environment}`,
            description: `Bayon CoAgent Main API Gateway (${environment})`,
            deployOptions: {
                stageName: environment,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: !isProd,
                tracingEnabled: true,
                metricsEnabled: true,
                accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    caller: true,
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    user: true,
                }),
            },
            defaultCorsPreflightOptions: {
                allowOrigins: isProd
                    ? ['https://yourdomain.com']
                    : ['http://localhost:3000'],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                    'X-Amz-User-Agent',
                    'X-Trace-Id',
                ],
                allowCredentials: true,
            },
            policy: new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        principals: [new iam.AnyPrincipal()],
                        actions: ['execute-api:Invoke'],
                        resources: ['*'],
                    }),
                ],
            }),
        });

        // AI Processing Service API Gateway
        this.aiServiceApi = new apigateway.RestApi(this, 'AiServiceApi', {
            restApiName: `bayon-coagent-ai-${environment}`,
            description: `Bayon CoAgent AI Processing Service API (${environment})`,
            deployOptions: {
                stageName: 'v1',
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: !isProd,
                tracingEnabled: true,
                metricsEnabled: true,
                throttleSettings: {
                    rateLimit: isProd ? 1000 : 100,
                    burstLimit: isProd ? 2000 : 200,
                },
            },
            defaultCorsPreflightOptions: {
                allowOrigins: isProd
                    ? ['https://yourdomain.com']
                    : ['http://localhost:3000'],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Api-Key',
                    'X-Trace-Id',
                ],
            },
        });

        // External Integration Service API Gateway
        this.integrationServiceApi = new apigateway.RestApi(this, 'IntegrationServiceApi', {
            restApiName: `bayon-coagent-integration-${environment}`,
            description: `Bayon CoAgent Integration Service API (${environment})`,
            deployOptions: {
                stageName: 'v1',
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: !isProd,
                tracingEnabled: true,
                metricsEnabled: true,
                throttleSettings: {
                    rateLimit: isProd ? 500 : 50,
                    burstLimit: isProd ? 1000 : 100,
                },
            },
            defaultCorsPreflightOptions: {
                allowOrigins: isProd
                    ? ['https://yourdomain.com']
                    : ['http://localhost:3000'],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Api-Key',
                    'X-Trace-Id',
                ],
            },
        });

        // Background Processing Service API Gateway
        this.backgroundServiceApi = new apigateway.RestApi(this, 'BackgroundServiceApi', {
            restApiName: `bayon-coagent-background-${environment}`,
            description: `Bayon CoAgent Background Processing Service API (${environment})`,
            deployOptions: {
                stageName: 'v1',
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: !isProd,
                tracingEnabled: true,
                metricsEnabled: true,
                throttleSettings: {
                    rateLimit: isProd ? 200 : 20,
                    burstLimit: isProd ? 400 : 40,
                },
            },
            defaultCorsPreflightOptions: {
                allowOrigins: isProd
                    ? ['https://yourdomain.com']
                    : ['http://localhost:3000'],
                allowMethods: ['GET', 'POST', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Api-Key',
                    'X-Trace-Id',
                ],
            },
        });

        // Admin Service API Gateway
        this.adminServiceApi = new apigateway.RestApi(this, 'AdminServiceApi', {
            restApiName: `bayon-coagent-admin-${environment}`,
            description: `Bayon CoAgent Admin Service API (${environment})`,
            deployOptions: {
                stageName: 'v1',
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: !isProd,
                tracingEnabled: true,
                metricsEnabled: true,
                throttleSettings: {
                    rateLimit: isProd ? 100 : 10,
                    burstLimit: isProd ? 200 : 20,
                },
            },
            defaultCorsPreflightOptions: {
                allowOrigins: isProd
                    ? ['https://yourdomain.com']
                    : ['http://localhost:3000'],
                allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'Authorization',
                    'X-Api-Key',
                    'X-Trace-Id',
                ],
            },
        });

        // Create Usage Plans for different service tiers
        this.createUsagePlans();

        // Set up API versioning and documentation
        this.setupApiDocumentation();

        // Configure custom domain if provided
        if (customDomainName && certificateArn) {
            this.setupCustomDomain(customDomainName, certificateArn, hostedZoneId);
        }

        // Create request/response transformations
        this.setupRequestResponseTransformations();

        // Set up monitoring and alarms
        this.setupMonitoring();

        // Outputs
        this.createOutputs();
    }

    private createUsagePlans() {
        const isProd = this.node.tryGetContext('environment') === 'production';

        // Basic tier usage plan
        const basicUsagePlan = this.restApi.addUsagePlan('BasicUsagePlan', {
            name: `bayon-coagent-basic-${this.node.tryGetContext('environment')}`,
            description: 'Basic usage plan for standard users',
            throttle: {
                rateLimit: isProd ? 100 : 10,
                burstLimit: isProd ? 200 : 20,
            },
            quota: {
                limit: isProd ? 10000 : 1000,
                period: apigateway.Period.DAY,
            },
        });

        // Premium tier usage plan
        const premiumUsagePlan = this.restApi.addUsagePlan('PremiumUsagePlan', {
            name: `bayon-coagent-premium-${this.node.tryGetContext('environment')}`,
            description: 'Premium usage plan for power users',
            throttle: {
                rateLimit: isProd ? 500 : 50,
                burstLimit: isProd ? 1000 : 100,
            },
            quota: {
                limit: isProd ? 50000 : 5000,
                period: apigateway.Period.DAY,
            },
        });

        // Enterprise tier usage plan
        const enterpriseUsagePlan = this.restApi.addUsagePlan('EnterpriseUsagePlan', {
            name: `bayon-coagent-enterprise-${this.node.tryGetContext('environment')}`,
            description: 'Enterprise usage plan for high-volume users',
            throttle: {
                rateLimit: isProd ? 2000 : 200,
                burstLimit: isProd ? 4000 : 400,
            },
            quota: {
                limit: isProd ? 200000 : 20000,
                period: apigateway.Period.DAY,
            },
        });

        // Associate usage plans with API stages
        basicUsagePlan.addApiStage({
            stage: this.restApi.deploymentStage,
        });

        premiumUsagePlan.addApiStage({
            stage: this.restApi.deploymentStage,
        });

        enterpriseUsagePlan.addApiStage({
            stage: this.restApi.deploymentStage,
        });

        // Service-specific usage plans
        const aiServiceUsagePlan = this.aiServiceApi.addUsagePlan('AiServiceUsagePlan', {
            name: `bayon-coagent-ai-service-${this.node.tryGetContext('environment')}`,
            description: 'Usage plan for AI processing service',
            throttle: {
                rateLimit: isProd ? 1000 : 100,
                burstLimit: isProd ? 2000 : 200,
            },
            quota: {
                limit: isProd ? 100000 : 10000,
                period: apigateway.Period.DAY,
            },
        });

        aiServiceUsagePlan.addApiStage({
            stage: this.aiServiceApi.deploymentStage,
        });
    }

    private setupApiDocumentation() {
        // Main API documentation
        const mainApiDocumentation = this.restApi.addDocumentationVersion('MainApiDocs', {
            version: 'v1',
            description: 'Bayon CoAgent Main API Documentation',
        });

        // AI Service API documentation
        const aiApiDocumentation = this.aiServiceApi.addDocumentationVersion('AiApiDocs', {
            version: 'v1',
            description: 'Bayon CoAgent AI Processing Service API Documentation',
        });

        // Integration Service API documentation
        const integrationApiDocumentation = this.integrationServiceApi.addDocumentationVersion('IntegrationApiDocs', {
            version: 'v1',
            description: 'Bayon CoAgent Integration Service API Documentation',
        });

        // Background Service API documentation
        const backgroundApiDocumentation = this.backgroundServiceApi.addDocumentationVersion('BackgroundApiDocs', {
            version: 'v1',
            description: 'Bayon CoAgent Background Processing Service API Documentation',
        });

        // Admin Service API documentation
        const adminApiDocumentation = this.adminServiceApi.addDocumentationVersion('AdminApiDocs', {
            version: 'v1',
            description: 'Bayon CoAgent Admin Service API Documentation',
        });
    }

    private setupCustomDomain(domainName: string, certificateArn: string, hostedZoneId?: string) {
        const certificate = certificatemanager.Certificate.fromCertificateArn(
            this,
            'ApiCertificate',
            certificateArn
        );

        // Main API custom domain
        const mainDomain = new apigateway.DomainName(this, 'MainApiDomain', {
            domainName: `api.${domainName}`,
            certificate,
            endpointType: apigateway.EndpointType.REGIONAL,
            securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        });

        mainDomain.addBasePathMapping(this.restApi, {
            basePath: 'v1',
        });

        // Service-specific subdomains
        const aiDomain = new apigateway.DomainName(this, 'AiApiDomain', {
            domainName: `ai-api.${domainName}`,
            certificate,
            endpointType: apigateway.EndpointType.REGIONAL,
            securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        });

        aiDomain.addBasePathMapping(this.aiServiceApi, {
            basePath: 'v1',
        });

        const integrationDomain = new apigateway.DomainName(this, 'IntegrationApiDomain', {
            domainName: `integration-api.${domainName}`,
            certificate,
            endpointType: apigateway.EndpointType.REGIONAL,
            securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
        });

        integrationDomain.addBasePathMapping(this.integrationServiceApi, {
            basePath: 'v1',
        });

        // Create Route53 records if hosted zone is provided
        if (hostedZoneId) {
            const hostedZone = route53.HostedZone.fromHostedZoneId(this, 'HostedZone', hostedZoneId);

            new route53.ARecord(this, 'MainApiAliasRecord', {
                zone: hostedZone,
                recordName: 'api',
                target: route53.RecordTarget.fromAlias(new route53targets.ApiGatewayDomain(mainDomain)),
            });

            new route53.ARecord(this, 'AiApiAliasRecord', {
                zone: hostedZone,
                recordName: 'ai-api',
                target: route53.RecordTarget.fromAlias(new route53targets.ApiGatewayDomain(aiDomain)),
            });

            new route53.ARecord(this, 'IntegrationApiAliasRecord', {
                zone: hostedZone,
                recordName: 'integration-api',
                target: route53.RecordTarget.fromAlias(new route53targets.ApiGatewayDomain(integrationDomain)),
            });
        }
    }

    private setupRequestResponseTransformations() {
        // Create request/response models for common transformations
        const errorResponseModel = this.restApi.addModel('ErrorResponseModel', {
            contentType: 'application/json',
            modelName: 'ErrorResponse',
            schema: {
                schema: apigateway.JsonSchemaVersion.DRAFT4,
                title: 'Error Response',
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    error: {
                        type: apigateway.JsonSchemaType.OBJECT,
                        properties: {
                            code: { type: apigateway.JsonSchemaType.STRING },
                            message: { type: apigateway.JsonSchemaType.STRING },
                            details: { type: apigateway.JsonSchemaType.OBJECT },
                            traceId: { type: apigateway.JsonSchemaType.STRING },
                        },
                        required: ['code', 'message'],
                    },
                },
                required: ['error'],
            },
        });

        const successResponseModel = this.restApi.addModel('SuccessResponseModel', {
            contentType: 'application/json',
            modelName: 'SuccessResponse',
            schema: {
                schema: apigateway.JsonSchemaVersion.DRAFT4,
                title: 'Success Response',
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    success: { type: apigateway.JsonSchemaType.BOOLEAN },
                    data: { type: apigateway.JsonSchemaType.OBJECT },
                    message: { type: apigateway.JsonSchemaType.STRING },
                    traceId: { type: apigateway.JsonSchemaType.STRING },
                },
                required: ['success'],
            },
        });

        // Create request validators
        const requestValidator = this.restApi.addRequestValidator('RequestValidator', {
            requestValidatorName: 'Validate body and parameters',
            validateRequestBody: true,
            validateRequestParameters: true,
        });

        // Store models and validators for use in service integrations
        this.node.setContext('errorResponseModel', errorResponseModel);
        this.node.setContext('successResponseModel', successResponseModel);
        this.node.setContext('requestValidator', requestValidator);
    }

    private setupMonitoring() {
        const isProd = this.node.tryGetContext('environment') === 'production';

        // Create CloudWatch alarms for API Gateway metrics
        const apis = [
            { api: this.restApi, name: 'Main' },
            { api: this.aiServiceApi, name: 'AI' },
            { api: this.integrationServiceApi, name: 'Integration' },
            { api: this.backgroundServiceApi, name: 'Background' },
            { api: this.adminServiceApi, name: 'Admin' },
        ];

        apis.forEach(({ api, name }) => {
            // 4XX Error Rate Alarm
            new cdk.aws_cloudwatch.Alarm(this, `${name}Api4XXErrorAlarm`, {
                alarmName: `${this.node.tryGetContext('environment')}-${name.toLowerCase()}-api-4xx-errors`,
                alarmDescription: `Alert when ${name} API 4XX error rate exceeds threshold`,
                metric: api.metricClientError({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
                threshold: isProd ? 50 : 10,
                evaluationPeriods: 2,
                treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
            });

            // 5XX Error Rate Alarm
            new cdk.aws_cloudwatch.Alarm(this, `${name}Api5XXErrorAlarm`, {
                alarmName: `${this.node.tryGetContext('environment')}-${name.toLowerCase()}-api-5xx-errors`,
                alarmDescription: `Alert when ${name} API 5XX error rate exceeds threshold`,
                metric: api.metricServerError({
                    statistic: 'Sum',
                    period: cdk.Duration.minutes(5),
                }),
                threshold: isProd ? 10 : 5,
                evaluationPeriods: 1,
                treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
            });

            // Latency Alarm
            new cdk.aws_cloudwatch.Alarm(this, `${name}ApiLatencyAlarm`, {
                alarmName: `${this.node.tryGetContext('environment')}-${name.toLowerCase()}-api-latency`,
                alarmDescription: `Alert when ${name} API latency exceeds threshold`,
                metric: api.metricLatency({
                    statistic: 'Average',
                    period: cdk.Duration.minutes(5),
                }),
                threshold: isProd ? 5000 : 10000, // milliseconds
                evaluationPeriods: 2,
                treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
            });
        });
    }

    private createOutputs() {
        const environment = this.node.tryGetContext('environment');

        // Main API outputs
        new cdk.CfnOutput(this, 'MainRestApiId', {
            value: this.restApi.restApiId,
            description: 'Main REST API ID',
            exportName: `${environment}-MainRestApiId`,
        });

        new cdk.CfnOutput(this, 'MainRestApiUrl', {
            value: this.restApi.url,
            description: 'Main REST API URL',
            exportName: `${environment}-MainRestApiUrl`,
        });

        // AI Service API outputs
        new cdk.CfnOutput(this, 'AiServiceApiId', {
            value: this.aiServiceApi.restApiId,
            description: 'AI Service API ID',
            exportName: `${environment}-AiServiceApiId`,
        });

        new cdk.CfnOutput(this, 'AiServiceApiUrl', {
            value: this.aiServiceApi.url,
            description: 'AI Service API URL',
            exportName: `${environment}-AiServiceApiUrl`,
        });

        // Integration Service API outputs
        new cdk.CfnOutput(this, 'IntegrationServiceApiId', {
            value: this.integrationServiceApi.restApiId,
            description: 'Integration Service API ID',
            exportName: `${environment}-IntegrationServiceApiId`,
        });

        new cdk.CfnOutput(this, 'IntegrationServiceApiUrl', {
            value: this.integrationServiceApi.url,
            description: 'Integration Service API URL',
            exportName: `${environment}-IntegrationServiceApiUrl`,
        });

        // Background Service API outputs
        new cdk.CfnOutput(this, 'BackgroundServiceApiId', {
            value: this.backgroundServiceApi.restApiId,
            description: 'Background Service API ID',
            exportName: `${environment}-BackgroundServiceApiId`,
        });

        new cdk.CfnOutput(this, 'BackgroundServiceApiUrl', {
            value: this.backgroundServiceApi.url,
            description: 'Background Service API URL',
            exportName: `${environment}-BackgroundServiceApiUrl`,
        });

        // Admin Service API outputs
        new cdk.CfnOutput(this, 'AdminServiceApiId', {
            value: this.adminServiceApi.restApiId,
            description: 'Admin Service API ID',
            exportName: `${environment}-AdminServiceApiId`,
        });

        new cdk.CfnOutput(this, 'AdminServiceApiUrl', {
            value: this.adminServiceApi.url,
            description: 'Admin Service API URL',
            exportName: `${environment}-AdminServiceApiUrl`,
        });
    }
}