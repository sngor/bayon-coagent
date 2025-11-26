'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Zap,
    Clock,
    Users,
    Activity,
    Database,
    Server,
    Globe,
    AlertTriangle,
    CheckCircle,
    Download,
    RefreshCw,
    Cpu,
    HardDrive,
    Wifi
} from 'lucide-react';

export default function AdminAnalyticsPage() {
    const [timeRange, setTimeRange] = useState('7d');

    return (
        <div className="space-y-8">
            {/* Time Range Selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                        Real-time Data
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Costs (Month)</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">$0.00</div>
                        <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">+0% vs last month</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">AI Requests Today</CardTitle>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Activity className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">0 per hour avg</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0ms</div>
                        <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Excellent</span>
                        </div>
                        <Progress value={100} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0%</div>
                        <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">No errors</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Analytics Tabs */}
            <Tabs defaultValue="usage" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="usage">Feature Usage</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
                    <TabsTrigger value="users">User Behavior</TabsTrigger>
                </TabsList>

                <TabsContent value="usage" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Hub Usage Distribution</CardTitle>
                                <CardDescription>Most popular features by usage count</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                            <span className="font-medium">Studio (Content Creation)</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">0 uses</span>
                                    </div>
                                    <Progress value={0} className="h-2" />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="font-medium">Market Research</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">0 uses</span>
                                    </div>
                                    <Progress value={0} className="h-2" />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                            <span className="font-medium">Brand Tools</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">0 uses</span>
                                    </div>
                                    <Progress value={0} className="h-2" />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                            <span className="font-medium">Tools & Calculators</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">0 uses</span>
                                    </div>
                                    <Progress value={0} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Usage Trends</CardTitle>
                                <CardDescription>Feature usage over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">Usage Charts Coming Soon</p>
                                    <p className="text-sm">Interactive charts will show usage patterns as data accumulates</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">System Performance</CardTitle>
                                <CardDescription>Real-time system metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Database className="h-5 w-5 text-blue-600" />
                                            <span className="font-medium">Database Performance</span>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-600">Excellent</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Read Latency</span>
                                            <div className="font-medium">&lt; 5ms</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Write Latency</span>
                                            <div className="font-medium">&lt; 10ms</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Server className="h-5 w-5 text-purple-600" />
                                            <span className="font-medium">API Performance</span>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-600">Healthy</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Avg Response</span>
                                            <div className="font-medium">&lt; 200ms</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Success Rate</span>
                                            <div className="font-medium">100%</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-orange-600" />
                                            <span className="font-medium">AI Services</span>
                                        </div>
                                        <Badge variant="outline" className="text-green-600 border-green-600">Operational</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Bedrock Latency</span>
                                            <div className="font-medium">&lt; 2s</div>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Success Rate</span>
                                            <div className="font-medium">100%</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Resource Utilization</CardTitle>
                                <CardDescription>Current system resource usage</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Cpu className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium">CPU Usage</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">15%</span>
                                    </div>
                                    <Progress value={15} className="h-2" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HardDrive className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium">Memory Usage</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">32%</span>
                                    </div>
                                    <Progress value={32} className="h-2" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Wifi className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm font-medium">Network I/O</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">8%</span>
                                    </div>
                                    <Progress value={8} className="h-2" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-orange-600" />
                                            <span className="text-sm font-medium">Storage Usage</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">5%</span>
                                    </div>
                                    <Progress value={5} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="costs" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                                <CardDescription>Monthly AWS service costs</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Zap className="h-5 w-5 text-blue-600" />
                                            <span className="font-medium">AWS Bedrock (AI)</span>
                                        </div>
                                        <span className="font-bold">$0.00</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Database className="h-5 w-5 text-green-600" />
                                            <span className="font-medium">DynamoDB</span>
                                        </div>
                                        <span className="font-bold">$0.00</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <HardDrive className="h-5 w-5 text-purple-600" />
                                            <span className="font-medium">S3 Storage</span>
                                        </div>
                                        <span className="font-bold">$0.00</span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Globe className="h-5 w-5 text-orange-600" />
                                            <span className="font-medium">External APIs</span>
                                        </div>
                                        <span className="font-bold">$0.00</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between text-lg font-bold">
                                        <span>Total Monthly Cost</span>
                                        <span>$0.00</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Cost Trends</CardTitle>
                                <CardDescription>Cost analysis over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">Cost Analytics Coming Soon</p>
                                    <p className="text-sm">Detailed cost breakdowns and trends will appear as usage grows</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">User Engagement</CardTitle>
                                <CardDescription>How users interact with the platform</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">User Analytics Coming Soon</p>
                                    <p className="text-sm">Engagement metrics will appear as user activity increases</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Session Analytics</CardTitle>
                                <CardDescription>User session patterns and duration</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="font-medium mb-2">Session Data Coming Soon</p>
                                    <p className="text-sm">Session analytics will be available once users start using the platform</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}