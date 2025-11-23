'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Users,
    MessageSquare,
    BarChart3,
    Settings,
    Activity,
    Shield,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Clock,
    ArrowRight,
    Zap,
    DollarSign,
    Server,
    Cpu,
    Database,
    Globe,
    AlertTriangle
} from 'lucide-react';

export default function AdminPage() {
    return (
        <div className="space-y-8">
            {/* System Status Banner */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">All Systems Operational</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">Last checked: 2 minutes ago</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" asChild className="border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900/50">
                    <Link href="/admin/health">
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0</div>
                        <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">+0% from last month</span>
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
                            <DollarSign className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">$0.00 cost</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Feedback</CardTitle>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                            <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-600 font-medium">No items pending</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-green-600">100%</div>
                        <div className="flex items-center gap-2 mt-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">All services online</span>
                        </div>
                        <Progress value={100} className="mt-3 h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-2 border-dashed border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Priority Actions</CardTitle>
                                <CardDescription className="text-base">Items requiring immediate attention</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="h-5 w-5 text-orange-600" />
                                <span className="font-medium">Review Feedback</span>
                            </div>
                            <Badge variant="secondary">0 pending</Badge>
                        </div>
                        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                            <Link href="/admin/feedback">
                                Review All Feedback
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">System Monitoring</CardTitle>
                                <CardDescription className="text-base">Real-time system status and performance</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Database</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-green-600" />
                                <span className="text-sm">APIs</span>
                            </div>
                        </div>
                        <Button variant="outline" asChild className="w-full border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/50">
                            <Link href="/admin/health">
                                View System Health
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Management Areas */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="font-headline text-2xl font-bold">Management Areas</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* User Management */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">User Management</CardTitle>
                                    <CardDescription>Accounts & analytics</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
                                    <div className="font-bold text-lg">0</div>
                                    <div className="text-muted-foreground">Total</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                    <div className="font-bold text-lg">0</div>
                                    <div className="text-muted-foreground">Active</div>
                                </div>
                            </div>
                            <Button variant="outline" asChild className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50">
                                <Link href="/admin/users">
                                    Manage Users
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Analytics */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-colors">
                                    <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Analytics & Insights</CardTitle>
                                    <CardDescription>Metrics & costs</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/50 rounded-lg">
                                    <div className="font-bold text-lg">$0</div>
                                    <div className="text-muted-foreground">AI Costs</div>
                                </div>
                                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
                                    <div className="font-bold text-lg">0</div>
                                    <div className="text-muted-foreground">Requests</div>
                                </div>
                            </div>
                            <Button variant="outline" asChild className="w-full group-hover:bg-purple-50 dark:group-hover:bg-purple-950/50">
                                <Link href="/admin/analytics">
                                    View Analytics
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Feature Management */}
                    <Card className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl group-hover:bg-green-200 dark:group-hover:bg-green-800/50 transition-colors">
                                    <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Feature Control</CardTitle>
                                    <CardDescription>Flags & rollouts</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-center p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
                                    <div className="font-bold text-lg">8</div>
                                    <div className="text-muted-foreground">Active</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg">
                                    <div className="font-bold text-lg">3</div>
                                    <div className="text-muted-foreground">Beta</div>
                                </div>
                            </div>
                            <Button variant="outline" asChild className="w-full group-hover:bg-green-50 dark:group-hover:bg-green-950/50">
                                <Link href="/admin/features">
                                    Manage Features
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Secondary Actions */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
                                <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Admin Management</CardTitle>
                                <CardDescription>Create and manage admin accounts</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/admin/setup">
                                Manage Admins
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                                <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">User Feedback</CardTitle>
                                <CardDescription>Review and respond to user feedback</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/admin/feedback">
                                View Feedback
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Recent Activity</CardTitle>
                                <CardDescription>Latest system events and user actions</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">
                            View All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                            <Clock className="h-8 w-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
                        <p className="text-sm max-w-md mx-auto">
                            Activity logs will appear here as users interact with the platform.
                            This includes logins, feature usage, and system events.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}