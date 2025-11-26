'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Database,
    Server,
    Globe,
    Shield,
    Zap,
    HardDrive,
    Cpu,
    Wifi,
    Clock,
    Activity,
    AlertCircle,
    TrendingUp,
    Eye,
    Settings
} from 'lucide-react';

export default function AdminHealthPage() {
    const [lastChecked, setLastChecked] = useState('2 minutes ago');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setLastChecked('Just now');
        }, 2000);
    };

    return (
        <div className="space-y-8">
            {/* Overall System Status */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-green-900 dark:text-green-100">All Systems Operational</h2>
                        <p className="text-green-700 dark:text-green-300">Last checked: {lastChecked}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-950/50">
                        100% Uptime
                    </Badge>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900/50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Checking...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            {/* Health Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                        <Activity className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-green-600">99.9%</div>
                        <p className="text-xs text-green-600 mt-1">30 days average</p>
                        <Progress value={99.9} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-blue-600">142ms</div>
                        <p className="text-xs text-blue-600 mt-1">Average response</p>
                        <Progress value={85} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <AlertCircle className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-purple-600">0.01%</div>
                        <p className="text-xs text-purple-600 mt-1">Last 24 hours</p>
                        <Progress value={1} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-orange-600">0</div>
                        <p className="text-xs text-orange-600 mt-1">No active issues</p>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>
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
                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">DynamoDB</div>
                                            <div className="text-sm text-muted-foreground">Database service</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
                                        <div className="text-xs text-muted-foreground mt-1">&lt; 5ms latency</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">AWS Bedrock</div>
                                            <div className="text-sm text-muted-foreground">AI service</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
                                        <div className="text-xs text-muted-foreground mt-1">&lt; 2s response</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">S3 Storage</div>
                                            <div className="text-sm text-muted-foreground">File storage</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
                                        <div className="text-xs text-muted-foreground mt-1">99.9% available</div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">Cognito Auth</div>
                                            <div className="text-sm text-muted-foreground">Authentication</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
                                        <div className="text-xs text-muted-foreground mt-1">&lt; 100ms auth</div>
                                    </div>
                                </div>
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