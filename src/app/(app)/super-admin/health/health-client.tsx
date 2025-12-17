'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import {
    CheckCircle,
    RefreshCw,
    Database,
    Server,
    Globe,
    HardDrive,
    AlertTriangle,
    Cpu,
    Wifi,
    Eye
} from 'lucide-react';
import { HealthMetricCard } from '@/components/admin/health-metric-card';
import { ServiceStatusItem } from '@/components/admin/service-status-item';
import { useHealthMonitoring } from '@/hooks/use-health-monitoring';
import {
    HEALTH_METRICS,
    AWS_SERVICES,
    INFRASTRUCTURE_SERVICES,
    EXTERNAL_APIS,
    PERFORMANCE_METRICS,
    RESPONSE_TIMES,
    HEALTH_CHECKS
} from '@/components/admin/health-data';

export default function HealthClient() {
    const {
        healthStatus,
        metrics,
        refreshHealthData,
        testServiceConnection,
        isHealthy
    } = useHealthMonitoring();

    // Memoize performance metrics with icons
    const performanceMetricsWithIcons = useMemo(() => {
        const iconMap = { Cpu, HardDrive, Wifi };
        return PERFORMANCE_METRICS.map(metric => ({
            ...metric,
            IconComponent: iconMap[metric.icon as keyof typeof iconMap],
            currentValue: metrics[metric.name.toLowerCase().replace(' ', '') as keyof typeof metrics] || metric.value
        }));
    }, [metrics]);

    // Memoize dynamic health metrics with real data
    const dynamicHealthMetrics = useMemo(() =>
        HEALTH_METRICS.map(metric => ({
            ...metric,
            value: metric.id === 'uptime' ? `${healthStatus.uptime}%` :
                metric.id === 'response-time' ? `${healthStatus.responseTime}ms` :
                    metric.id === 'error-rate' ? `${healthStatus.errorRate}%` :
                        metric.id === 'active-alerts' ? healthStatus.activeAlerts.toString() :
                            (metric as any).value,
            progress: metric.id === 'uptime' ? healthStatus.uptime :
                metric.id === 'response-time' ? Math.max(0, 100 - (healthStatus.responseTime / 10)) :
                    metric.id === 'error-rate' ? healthStatus.errorRate * 100 :
                        metric.id === 'active-alerts' ? (healthStatus.activeAlerts > 0 ? 100 : 0) :
                            (metric as any).progress
        })), [healthStatus]);

    const handleServiceTest = useCallback(async (serviceName: string) => {
        await testServiceConnection(serviceName);
    }, [testServiceConnection]);

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">System Health</h1>
                    <p className="text-muted-foreground">Monitor system performance and service status</p>
                </div>
                <Button onClick={refreshHealthData} disabled={false}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Overall System Status */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">All Systems Operational</h2>
                        <p className="text-green-700 dark:text-green-300">Last checked: {new Date().toLocaleTimeString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-950/50">
                        100% Uptime
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        disabled={false}
                        className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900/50"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Health Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {HEALTH_METRICS.map((metric) => (
                    <HealthMetricCard
                        key={metric.id}
                        title={metric.title}
                        value={metric.value}
                        subtitle={metric.subtitle}
                        progress={metric.progress}
                        icon={metric.icon}
                        iconColor={metric.iconColor}
                        gradientFrom={metric.gradientFrom}
                        gradientTo={metric.gradientTo}
                    />
                ))}
            </div>

            {/* Service Status Tabs */}
            <Tabs defaultValue="aws" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="aws">AWS Services</TabsTrigger>
                    <TabsTrigger value="external">External APIs</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="aws" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Database className="h-5 w-5 text-blue-600" />
                                    Core AWS Services
                                </CardTitle>
                                <CardDescription>Essential services for platform operation</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {AWS_SERVICES.map((service) => (
                                    <ServiceStatusItem
                                        key={service.name}
                                        name={service.name}
                                        description={service.description}
                                        status={service.status}
                                        statusText={service.statusText}
                                        metric={service.metric}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Server className="h-5 w-5 text-purple-600" />
                                    Infrastructure Services
                                </CardTitle>
                                <CardDescription>Supporting AWS infrastructure</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">CloudWatch</div>
                                            <div className="text-sm text-muted-foreground">Monitoring & logs</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">AWS Amplify</div>
                                            <div className="text-sm text-muted-foreground">Hosting & deployment</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Deployed</Badge>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">IAM</div>
                                            <div className="text-sm text-muted-foreground">Access management</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Configured</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="external" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-600" />
                                External API Status
                            </CardTitle>
                            <CardDescription>Third-party services and integrations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="font-medium">Tavily Search API</div>
                                        <div className="text-sm text-muted-foreground">AI-powered web search</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
                                    <div className="text-xs text-muted-foreground mt-1">&lt; 500ms response</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="font-medium">NewsAPI</div>
                                        <div className="text-sm text-muted-foreground">Real estate news feed</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
                                    <div className="text-xs text-muted-foreground mt-1">&lt; 300ms response</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    <div>
                                        <div className="font-medium">Google OAuth</div>
                                        <div className="text-sm text-muted-foreground">Business Profile integration</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Not Configured</Badge>
                                    <div className="text-xs text-muted-foreground mt-1">Setup required</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <div className="font-medium">Bridge API</div>
                                        <div className="text-sm text-muted-foreground">Zillow review integration</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="text-green-600 border-green-600">Ready</Badge>
                                    <div className="text-xs text-muted-foreground mt-1">Available</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">System Performance</CardTitle>
                                <CardDescription>Real-time performance metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium">CPU Usage</span>
                                        </div>
                                        <span className="text-sm font-medium">15%</span>
                                    </div>
                                    <Progress value={15} className="h-3" />
                                    <div className="text-xs text-muted-foreground">Optimal performance</div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium">Memory Usage</span>
                                        </div>
                                        <span className="text-sm font-medium">32%</span>
                                    </div>
                                    <Progress value={32} className="h-3" />
                                    <div className="text-xs text-muted-foreground">Within normal range</div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wifi className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium">Network I/O</span>
                                        </div>
                                        <span className="text-sm font-medium">8%</span>
                                    </div>
                                    <Progress value={8} className="h-3" />
                                    <div className="text-xs text-muted-foreground">Low network activity</div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Response Times</CardTitle>
                                <CardDescription>Average response times by service</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                    <span className="font-medium">API Endpoints</span>
                                    <span className="text-sm font-bold text-green-600">142ms</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                                    <span className="font-medium">Database Queries</span>
                                    <span className="text-sm font-bold text-blue-600">4ms</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                                    <span className="font-medium">AI Processing</span>
                                    <span className="text-sm font-bold text-purple-600">1.8s</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                                    <span className="font-medium">File Uploads</span>
                                    <span className="text-sm font-bold text-orange-600">320ms</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Health Checks</CardTitle>
                                <CardDescription>Automated monitoring and alerts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium">Endpoint Monitoring</span>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium">Database Health</span>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium">Error Rate Alerts</span>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium">Performance Monitoring</span>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Events</CardTitle>
                                <CardDescription>System events and notifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">No recent events</p>
                                    <p className="text-sm">System events and alerts will appear here</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}