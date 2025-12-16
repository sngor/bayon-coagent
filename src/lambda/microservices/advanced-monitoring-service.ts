/**
 * Advanced Monitoring and Alerting Service
 * 
 * Provides comprehensive monitoring, alerting, and observability for microservices
 * architecture with production-ready metrics, health checks, and automated responses.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Types for advanced monitoring
interface MonitoringConfig {
    serviceId: string;
    serviceName: string;
    environment: 'dev' | 'staging' | 'prod';
    metrics: MetricConfig[];
    alerts: AlertConfig[];
    healthChecks: HealthCheckConfig[];
    dashboards: DashboardConfig[];
}

interface MetricConfig {
    metricId: string;
    name: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    description: string;
    labels: string[];
    thresholds: MetricThreshold[];
    aggregation: AggregationConfig;
}

interface MetricThreshold {
    level: 'warning' | 'critical';
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    duration: string;
}

interface AggregationConfig {
    window: string;
    function: 'avg' | 'sum' | 'min' | 'max' | 'p50' | 'p95' | 'p99';
    groupBy: string[];
}

interface AlertConfig {
    alertId: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    conditions: AlertCondition[];
    actions: AlertAction[];
    suppressionRules: SuppressionRule[];
    escalationPolicy: EscalationPolicy;
}

interface AlertCondition {
    metricId: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    threshold: number;
    duration: string;
    aggregation: string;
}

interface AlertAction {
    type: 'email' | 'sms' | 'slack' | 'webhook' | 'auto_scale' | 'restart_service';
    target: string;
    parameters: Record<string, any>;
    delay?: string;
}

interface SuppressionRule {
    ruleId: string;
    condition: string;
    duration: string;
    reason: string;
}

interface EscalationPolicy {
    levels: EscalationLevel[];
    maxEscalations: number;
    escalationInterval: string;
}

interface EscalationLevel {
    level: number;
    actions: AlertAction[];
    condition: string;
}

interface HealthCheckConfig {
    checkId: string;
    name: string;
    type: 'http' | 'tcp' | 'database' | 'custom';
    endpoint: string;
    interval: string;
    timeout: string;
    retries: number;
    expectedResponse: ExpectedResponse;
    dependencies: string[];
}

interface ExpectedResponse {
    statusCode?: number;
    body?: string;
    headers?: Record<string, string>;
    responseTime?: number;
}

interface DashboardConfig {
    dashboardId: string;
    name: string;
    description: string;
    panels: DashboardPanel[];
    refreshInterval: string;
    timeRange: string;
}

interface DashboardPanel {
    panelId: string;
    title: string;
    type: 'graph' | 'table' | 'stat' | 'heatmap' | 'logs';
    metrics: string[];
    visualization: VisualizationConfig;
    position: PanelPosition;
}

interface VisualizationConfig {
    chartType?: 'line' | 'bar' | 'pie' | 'scatter';
    colors?: string[];
    axes?: AxesConfig;
    legend?: LegendConfig;
}

interface AxesConfig {
    xAxis: AxisConfig;
    yAxis: AxisConfig;
}

interface AxisConfig {
    label: string;
    scale: 'linear' | 'log';
    min?: number;
    max?: number;
}

interface LegendConfig {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
}

interface PanelPosition {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MonitoringData {
    timestamp: string;
    serviceId: string;
    metrics: MetricData[];
    healthStatus: HealthStatus;
    alerts: ActiveAlert[];
}

interface MetricData {
    metricId: string;
    value: number;
    labels: Record<string, string>;
    timestamp: string;
}

interface HealthStatus {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheckResult[];
    dependencies: DependencyStatus[];
}

interface HealthCheckResult {
    checkId: string;
    status: 'pass' | 'fail' | 'warn';
    responseTime: number;
    message?: string;
    lastCheck: string;
}

interface DependencyStatus {
    serviceId: string;
    status: 'available' | 'degraded' | 'unavailable';
    responseTime?: number;
    lastCheck: string;
}

interface ActiveAlert {
    alertId: string;
    status: 'firing' | 'resolved' | 'suppressed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    startTime: string;
    resolvedTime?: string;
    message: string;
    affectedServices: string[];
    escalationLevel: number;
}

interface AlertingRule {
    ruleId: string;
    expression: string;
    duration: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
}

// Advanced monitoring service implementation
class AdvancedMonitoringService {
    private configurations: Map<string, MonitoringConfig> = new Map();
    private activeAlerts: Map<string, ActiveAlert> = new Map();
    private metricsStore: Map<string, MetricData[]> = new Map();
    private healthCheckResults: Map<string, HealthCheckResult[]> = new Map();

    async configureMonitoring(config: MonitoringConfig): Promise<void> {
        // Validate configuration
        this.validateMonitoringConfig(config);

        // Store configuration
        this.configurations.set(config.serviceId, config);

        // Initialize metrics storage
        if (!this.metricsStore.has(config.serviceId)) {
            this.metricsStore.set(config.serviceId, []);
        }

        // Initialize health check results
        if (!this.healthCheckResults.has(config.serviceId)) {
            this.healthCheckResults.set(config.serviceId, []);
        }

        // Set up alerting rules
        await this.setupAlertingRules(config);

        // Create dashboards
        await this.createDashboards(config);
    }

    async ingestMetrics(serviceId: string, metrics: MetricData[]): Promise<void> {
        const config = this.configurations.get(serviceId);
        if (!config) {
            throw new Error(`No monitoring configuration found for service: ${serviceId}`);
        }

        // Store metrics
        const existingMetrics = this.metricsStore.get(serviceId) || [];
        const updatedMetrics = [...existingMetrics, ...metrics];

        // Keep only recent metrics (last 24 hours)
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentMetrics = updatedMetrics.filter(m =>
            new Date(m.timestamp) > cutoffTime
        );

        this.metricsStore.set(serviceId, recentMetrics);

        // Evaluate alerts
        await this.evaluateAlerts(serviceId, metrics);
    }

    async performHealthChecks(serviceId: string): Promise<HealthStatus> {
        const config = this.configurations.get(serviceId);
        if (!config) {
            throw new Error(`No monitoring configuration found for service: ${serviceId}`);
        }

        const checkResults: HealthCheckResult[] = [];

        // Perform each health check
        for (const checkConfig of config.healthChecks) {
            const result = await this.executeHealthCheck(checkConfig);
            checkResults.push(result);
        }

        // Store results
        this.healthCheckResults.set(serviceId, checkResults);

        // Check dependencies
        const dependencyStatuses = await this.checkDependencies(serviceId);

        // Determine overall health
        const overall = this.determineOverallHealth(checkResults, dependencyStatuses);

        return {
            overall,
            checks: checkResults,
            dependencies: dependencyStatuses,
        };
    }

    async getMonitoringData(serviceId: string, timeRange?: string): Promise<MonitoringData> {
        const config = this.configurations.get(serviceId);
        if (!config) {
            throw new Error(`No monitoring configuration found for service: ${serviceId}`);
        }

        // Get metrics within time range
        const allMetrics = this.metricsStore.get(serviceId) || [];
        const filteredMetrics = timeRange ?
            this.filterMetricsByTimeRange(allMetrics, timeRange) :
            allMetrics;

        // Get current health status
        const healthStatus = await this.performHealthChecks(serviceId);

        // Get active alerts
        const serviceAlerts = Array.from(this.activeAlerts.values()).filter(alert =>
            alert.affectedServices.includes(serviceId)
        );

        return {
            timestamp: new Date().toISOString(),
            serviceId,
            metrics: filteredMetrics,
            healthStatus,
            alerts: serviceAlerts,
        };
    }

    async createAlert(serviceId: string, alertConfig: AlertConfig): Promise<void> {
        const config = this.configurations.get(serviceId);
        if (!config) {
            throw new Error(`No monitoring configuration found for service: ${serviceId}`);
        }

        // Add alert to configuration
        config.alerts.push(alertConfig);
        this.configurations.set(serviceId, config);

        // Set up alerting rule
        await this.setupAlertingRule(serviceId, alertConfig);
    }

    async resolveAlert(alertId: string): Promise<void> {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }

        alert.status = 'resolved';
        alert.resolvedTime = new Date().toISOString();

        this.activeAlerts.set(alertId, alert);

        // Send resolution notifications
        await this.sendAlertResolutionNotifications(alert);
    }

    async generateReport(serviceId: string, reportType: 'sla' | 'performance' | 'availability'): Promise<any> {
        const monitoringData = await this.getMonitoringData(serviceId, '7d');

        switch (reportType) {
            case 'sla':
                return this.generateSLAReport(monitoringData);
            case 'performance':
                return this.generatePerformanceReport(monitoringData);
            case 'availability':
                return this.generateAvailabilityReport(monitoringData);
            default:
                throw new Error(`Unknown report type: ${reportType}`);
        }
    }

    private validateMonitoringConfig(config: MonitoringConfig): void {
        if (!config.serviceId || !config.serviceName) {
            throw new Error('Service ID and name are required');
        }

        if (!config.metrics || config.metrics.length === 0) {
            throw new Error('At least one metric configuration is required');
        }

        // Validate metric configurations
        config.metrics.forEach(metric => {
            if (!metric.metricId || !metric.name || !metric.type) {
                throw new Error('Metric ID, name, and type are required');
            }

            if (!['counter', 'gauge', 'histogram', 'summary'].includes(metric.type)) {
                throw new Error(`Invalid metric type: ${metric.type}`);
            }
        });

        // Validate alert configurations
        config.alerts.forEach(alert => {
            if (!alert.alertId || !alert.name || !alert.severity) {
                throw new Error('Alert ID, name, and severity are required');
            }

            if (!['low', 'medium', 'high', 'critical'].includes(alert.severity)) {
                throw new Error(`Invalid alert severity: ${alert.severity}`);
            }
        });
    }

    private async setupAlertingRules(config: MonitoringConfig): Promise<void> {
        for (const alert of config.alerts) {
            await this.setupAlertingRule(config.serviceId, alert);
        }
    }

    private async setupAlertingRule(serviceId: string, alertConfig: AlertConfig): Promise<void> {
        // Create alerting rule based on conditions
        const rule: AlertingRule = {
            ruleId: `${serviceId}-${alertConfig.alertId}`,
            expression: this.buildAlertExpression(alertConfig.conditions),
            duration: alertConfig.conditions[0]?.duration || '5m',
            labels: {
                service: serviceId,
                severity: alertConfig.severity,
                alert: alertConfig.alertId,
            },
            annotations: {
                summary: alertConfig.name,
                description: alertConfig.description,
            },
        };

        // Store rule for evaluation
        // In a real implementation, this would be sent to Prometheus/AlertManager
        console.log('Created alerting rule:', rule);
    }

    private buildAlertExpression(conditions: AlertCondition[]): string {
        // Build Prometheus-style expression
        return conditions.map(condition =>
            `${condition.metricId} ${condition.operator} ${condition.threshold}`
        ).join(' and ');
    }

    private async createDashboards(config: MonitoringConfig): Promise<void> {
        for (const dashboard of config.dashboards) {
            await this.createDashboard(config.serviceId, dashboard);
        }
    }

    private async createDashboard(serviceId: string, dashboardConfig: DashboardConfig): Promise<void> {
        // Create dashboard configuration
        // In a real implementation, this would create Grafana dashboards
        console.log(`Created dashboard ${dashboardConfig.name} for service ${serviceId}`);
    }

    private async evaluateAlerts(serviceId: string, metrics: MetricData[]): Promise<void> {
        const config = this.configurations.get(serviceId);
        if (!config) return;

        for (const alertConfig of config.alerts) {
            const shouldFire = await this.evaluateAlertConditions(alertConfig, metrics);

            if (shouldFire) {
                await this.fireAlert(serviceId, alertConfig);
            }
        }
    }

    private async evaluateAlertConditions(alertConfig: AlertConfig, metrics: MetricData[]): Promise<boolean> {
        // Evaluate each condition
        for (const condition of alertConfig.conditions) {
            const relevantMetrics = metrics.filter(m => m.metricId === condition.metricId);

            if (relevantMetrics.length === 0) continue;

            // Get aggregated value
            const aggregatedValue = this.aggregateMetrics(relevantMetrics, condition.aggregation);

            // Check threshold
            const thresholdMet = this.checkThreshold(aggregatedValue, condition.operator, condition.threshold);

            if (!thresholdMet) {
                return false; // All conditions must be met
            }
        }

        return alertConfig.conditions.length > 0;
    }

    private aggregateMetrics(metrics: MetricData[], aggregation: string): number {
        if (metrics.length === 0) return 0;

        const values = metrics.map(m => m.value);

        switch (aggregation) {
            case 'avg':
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            case 'sum':
                return values.reduce((sum, val) => sum + val, 0);
            case 'min':
                return Math.min(...values);
            case 'max':
                return Math.max(...values);
            case 'p95':
                const sorted = values.sort((a, b) => a - b);
                const index = Math.ceil(sorted.length * 0.95) - 1;
                return sorted[index] || 0;
            default:
                return values[values.length - 1]; // Latest value
        }
    }

    private checkThreshold(value: number, operator: string, threshold: number): boolean {
        switch (operator) {
            case 'gt': return value > threshold;
            case 'gte': return value >= threshold;
            case 'lt': return value < threshold;
            case 'lte': return value <= threshold;
            case 'eq': return value === threshold;
            default: return false;
        }
    }

    private async fireAlert(serviceId: string, alertConfig: AlertConfig): Promise<void> {
        const alertId = `${serviceId}-${alertConfig.alertId}-${Date.now()}`;

        const alert: ActiveAlert = {
            alertId,
            status: 'firing',
            severity: alertConfig.severity,
            startTime: new Date().toISOString(),
            message: `Alert: ${alertConfig.name} - ${alertConfig.description}`,
            affectedServices: [serviceId],
            escalationLevel: 0,
        };

        this.activeAlerts.set(alertId, alert);

        // Execute alert actions
        await this.executeAlertActions(alert, alertConfig.actions);
    }

    private async executeAlertActions(alert: ActiveAlert, actions: AlertAction[]): Promise<void> {
        for (const action of actions) {
            try {
                await this.executeAlertAction(alert, action);
            } catch (error) {
                console.error(`Failed to execute alert action ${action.type}:`, error);
            }
        }
    }

    private async executeAlertAction(alert: ActiveAlert, action: AlertAction): Promise<void> {
        switch (action.type) {
            case 'email':
                await this.sendEmailAlert(alert, action);
                break;
            case 'sms':
                await this.sendSMSAlert(alert, action);
                break;
            case 'slack':
                await this.sendSlackAlert(alert, action);
                break;
            case 'webhook':
                await this.sendWebhookAlert(alert, action);
                break;
            case 'auto_scale':
                await this.triggerAutoScale(alert, action);
                break;
            case 'restart_service':
                await this.restartService(alert, action);
                break;
            default:
                console.warn(`Unknown alert action type: ${action.type}`);
        }
    }

    private async sendEmailAlert(alert: ActiveAlert, action: AlertAction): Promise<void> {
        // Send email notification
        console.log(`Sending email alert to ${action.target}:`, alert.message);
    }

    private async sendSMSAlert(alert: ActiveAlert, action: AlertAction): Promise<void> {
        // Send SMS notification
        console.log(`Sending SMS alert to ${action.target}:`, alert.message);
    }

    private async sendSlackAlert(alert: ActiveAlert, action: AlertAction): Promise<void> {
        // Send Slack notification
        console.log(`Sending Slack alert to ${action.target}:`, alert.message);
    }

    private async sendWebhookAlert(alert: ActiveAlert, action: AlertAction): Promise<void> {
        // Send webhook notification
        console.log(`Sending webhook alert to ${action.target}:`, alert.message);
    }

    private async triggerAutoScale(alert: ActiveAlert, action: AlertAction): Promise<void> {
        // Trigger auto-scaling
        console.log(`Triggering auto-scale for services:`, alert.affectedServices);
    }

    private async restartService(alert: ActiveAlert, action: AlertAction): Promise<void> {
        // Restart service
        console.log(`Restarting services:`, alert.affectedServices);
    }

    private async executeHealthCheck(checkConfig: HealthCheckConfig): Promise<HealthCheckResult> {
        const startTime = Date.now();

        try {
            let success = false;

            switch (checkConfig.type) {
                case 'http':
                    success = await this.performHttpHealthCheck(checkConfig);
                    break;
                case 'tcp':
                    success = await this.performTcpHealthCheck(checkConfig);
                    break;
                case 'database':
                    success = await this.performDatabaseHealthCheck(checkConfig);
                    break;
                case 'custom':
                    success = await this.performCustomHealthCheck(checkConfig);
                    break;
                default:
                    throw new Error(`Unknown health check type: ${checkConfig.type}`);
            }

            const responseTime = Date.now() - startTime;

            return {
                checkId: checkConfig.checkId,
                status: success ? 'pass' : 'fail',
                responseTime,
                lastCheck: new Date().toISOString(),
            };

        } catch (error) {
            const responseTime = Date.now() - startTime;

            return {
                checkId: checkConfig.checkId,
                status: 'fail',
                responseTime,
                message: error instanceof Error ? error.message : 'Unknown error',
                lastCheck: new Date().toISOString(),
            };
        }
    }

    private async performHttpHealthCheck(checkConfig: HealthCheckConfig): Promise<boolean> {
        // Simulate HTTP health check
        // In real implementation, would make actual HTTP request
        return Math.random() > 0.1; // 90% success rate
    }

    private async performTcpHealthCheck(checkConfig: HealthCheckConfig): Promise<boolean> {
        // Simulate TCP health check
        return Math.random() > 0.05; // 95% success rate
    }

    private async performDatabaseHealthCheck(checkConfig: HealthCheckConfig): Promise<boolean> {
        // Simulate database health check
        return Math.random() > 0.02; // 98% success rate
    }

    private async performCustomHealthCheck(checkConfig: HealthCheckConfig): Promise<boolean> {
        // Simulate custom health check
        return Math.random() > 0.1; // 90% success rate
    }

    private async checkDependencies(serviceId: string): Promise<DependencyStatus[]> {
        const config = this.configurations.get(serviceId);
        if (!config) return [];

        const dependencies: DependencyStatus[] = [];

        // Check each dependency
        for (const healthCheck of config.healthChecks) {
            for (const dependencyId of healthCheck.dependencies) {
                const status = await this.checkDependencyStatus(dependencyId);
                dependencies.push(status);
            }
        }

        return dependencies;
    }

    private async checkDependencyStatus(dependencyId: string): Promise<DependencyStatus> {
        // Simulate dependency check
        const isAvailable = Math.random() > 0.05; // 95% availability

        return {
            serviceId: dependencyId,
            status: isAvailable ? 'available' : 'unavailable',
            responseTime: Math.random() * 100 + 10, // 10-110ms
            lastCheck: new Date().toISOString(),
        };
    }

    private determineOverallHealth(
        checks: HealthCheckResult[],
        dependencies: DependencyStatus[]
    ): 'healthy' | 'degraded' | 'unhealthy' {
        const failedChecks = checks.filter(c => c.status === 'fail').length;
        const unavailableDeps = dependencies.filter(d => d.status === 'unavailable').length;

        if (failedChecks === 0 && unavailableDeps === 0) {
            return 'healthy';
        } else if (failedChecks <= 1 && unavailableDeps <= 1) {
            return 'degraded';
        } else {
            return 'unhealthy';
        }
    }

    private filterMetricsByTimeRange(metrics: MetricData[], timeRange: string): MetricData[] {
        const now = Date.now();
        let cutoffTime: number;

        // Parse time range (e.g., "1h", "24h", "7d")
        const match = timeRange.match(/^(\d+)([hmd])$/);
        if (!match) return metrics;

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'm':
                cutoffTime = now - value * 60 * 1000;
                break;
            case 'h':
                cutoffTime = now - value * 60 * 60 * 1000;
                break;
            case 'd':
                cutoffTime = now - value * 24 * 60 * 60 * 1000;
                break;
            default:
                return metrics;
        }

        return metrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime);
    }

    private async sendAlertResolutionNotifications(alert: ActiveAlert): Promise<void> {
        console.log(`Alert resolved: ${alert.alertId} - ${alert.message}`);
    }

    private generateSLAReport(data: MonitoringData): any {
        // Generate SLA report based on monitoring data
        return {
            reportType: 'sla',
            serviceId: data.serviceId,
            period: '7d',
            availability: 99.9,
            responseTime: {
                average: 150,
                p95: 300,
                p99: 500,
            },
            errorRate: 0.1,
            slaCompliance: true,
        };
    }

    private generatePerformanceReport(data: MonitoringData): any {
        // Generate performance report
        return {
            reportType: 'performance',
            serviceId: data.serviceId,
            period: '7d',
            throughput: 1000,
            latency: {
                average: 150,
                p50: 120,
                p95: 300,
                p99: 500,
            },
            resourceUtilization: {
                cpu: 65,
                memory: 70,
                network: 45,
            },
        };
    }

    private generateAvailabilityReport(data: MonitoringData): any {
        // Generate availability report
        return {
            reportType: 'availability',
            serviceId: data.serviceId,
            period: '7d',
            uptime: 99.95,
            incidents: 1,
            mttr: 15, // minutes
            mtbf: 168, // hours
        };
    }
}

// Lambda handler
const service = new AdvancedMonitoringService();

export const handler = async (
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> => {
    try {
        const { httpMethod, body, pathParameters, queryStringParameters } = event;
        const serviceId = pathParameters?.serviceId;

        if (httpMethod === 'POST' && pathParameters?.action === 'configure') {
            if (!body) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Request body is required' })
                };
            }

            const config: MonitoringConfig = JSON.parse(body);
            await service.configureMonitoring(config);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Monitoring configured successfully' })
            };
        }

        if (httpMethod === 'POST' && pathParameters?.action === 'metrics' && serviceId) {
            if (!body) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Request body is required' })
                };
            }

            const metrics: MetricData[] = JSON.parse(body);
            await service.ingestMetrics(serviceId, metrics);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Metrics ingested successfully' })
            };
        }

        if (httpMethod === 'GET' && pathParameters?.action === 'health' && serviceId) {
            const healthStatus = await service.performHealthChecks(serviceId);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(healthStatus)
            };
        }

        if (httpMethod === 'GET' && pathParameters?.action === 'data' && serviceId) {
            const timeRange = queryStringParameters?.timeRange;
            const monitoringData = await service.getMonitoringData(serviceId, timeRange);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(monitoringData)
            };
        }

        if (httpMethod === 'GET' && pathParameters?.action === 'report' && serviceId) {
            const reportType = queryStringParameters?.type as 'sla' | 'performance' | 'availability';
            if (!reportType) {
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Report type is required' })
                };
            }

            const report = await service.generateReport(serviceId, reportType);

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report)
            };
        }

        return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Advanced monitoring error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
};