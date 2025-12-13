'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import {
    Settings,
    Server,
    Database,
    Shield,
    AlertTriangle,
    CheckCircle,
    Wrench,
    RefreshCw,
    Power,
    Clock,
    Activity,
    HardDrive,
    Cpu,
    Wifi
} from 'lucide-react';

export function SystemClient() {
    const [loading, setLoading] = useState(true);
    const [systemStatus, setSystemStatus] = useState({
        server: 'healthy',
        database: 'healthy',
        cache: 'healthy',
        storage: 'healthy'
    });
    const [maintenanceMode, setMaintenanceMode] = useState(false);

    useEffect(() => {
        // Mock system status loading
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="h-4 w-4" />;
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            case 'error': return <AlertTriangle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">System Management</h1>
                    <p className="text-muted-foreground">Monitor system health and manage platform settings</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Status
                    </Button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Maintenance Mode</span>
                        <Switch
                            checked={maintenanceMode}
                            onCheckedChange={setMaintenanceMode}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading system status...</div>
            ) : (
                <>
                    {/* System Status Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Server Status</CardTitle>
                                <Server className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(systemStatus.server)}>
                                        {getStatusIcon(systemStatus.server)}
                                        {systemStatus.server}
                                    </Badge>
                                </div>
                                <p className="text-xs text-blue-600 mt-1">99.9% uptime</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Database</CardTitle>
                                <Database className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(systemStatus.database)}>
                                        {getStatusIcon(systemStatus.database)}
                                        {systemStatus.database}
                                    </Badge>
                                </div>
                                <p className="text-xs text-green-600 mt-1">Response: 12ms</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Cache</CardTitle>
                                <Activity className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(systemStatus.cache)}>
                                        {getStatusIcon(systemStatus.cache)}
                                        {systemStatus.cache}
                                    </Badge>
                                </div>
                                <p className="text-xs text-purple-600 mt-1">Hit rate: 94%</p>
                            </CardContent>
                        </Card>

                        <Card className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Storage</CardTitle>
                                <HardDrive className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent className="relative">
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(systemStatus.storage)}>
                                        {getStatusIcon(systemStatus.storage)}
                                        {systemStatus.storage}
                                    </Badge>
                                </div>
                                <p className="text-xs text-orange-600 mt-1">Usage: 68%</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* System Management Tabs */}
                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="overview">System Overview</TabsTrigger>
                            <TabsTrigger value="performance">Performance</TabsTrigger>
                            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                            <TabsTrigger value="logs">System Logs</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">System Health Overview</CardTitle>
                                    <CardDescription>Current system status and key metrics</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">CPU Usage</span>
                                                <span className="text-sm text-muted-foreground">23%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Memory Usage</span>
                                                <span className="text-sm text-muted-foreground">67%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Disk Usage</span>
                                                <span className="text-sm text-muted-foreground">45%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Network I/O</span>
                                                <span className="text-sm text-muted-foreground">12%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="performance" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Performance Metrics</CardTitle>
                                    <CardDescription>System performance and optimization data</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                            <Activity className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Performance Dashboard</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Advanced performance monitoring and analytics are being implemented.
                                        </p>
                                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                                            Coming Soon
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="maintenance" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Maintenance Tools</CardTitle>
                                    <CardDescription>System maintenance and administrative tools</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <div className="font-medium">Cache Clear</div>
                                                <div className="text-sm text-muted-foreground">Clear application cache</div>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Clear Cache
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <div className="font-medium">Database Optimization</div>
                                                <div className="text-sm text-muted-foreground">Optimize database performance</div>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <Wrench className="h-4 w-4 mr-2" />
                                                Optimize
                                            </Button>
                                        </div>
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <div className="font-medium">System Restart</div>
                                                <div className="text-sm text-muted-foreground">Restart application services</div>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <Power className="h-4 w-4 mr-2" />
                                                Restart
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="logs" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">System Logs</CardTitle>
                                    <CardDescription>Recent system events and error logs</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                            <Settings className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">System Logs</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Real-time log monitoring and analysis tools are being implemented.
                                        </p>
                                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                                            Coming Soon
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}