'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Progress } from '@/components/ui/progress';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    Download,
    Mail,
    Calendar,
    TrendingUp,
    TrendingDown,
    Activity,
    Crown,
    Clock,
    MapPin,
    Phone,
    Building,
    MoreHorizontal,
    Eye,
    UserX,
    Settings
} from 'lucide-react';

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="space-y-8">
            {/* User Overview Stats */}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
                        <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0</div>
                        <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">0% activity rate</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New This Week</CardTitle>
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                            <UserPlus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0</div>
                        <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-600 font-medium">0 this week</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                            <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold">0</div>
                        <div className="flex items-center gap-2 mt-2">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">0% conversion</span>
                        </div>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* User Management Interface */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">User Management</CardTitle>
                            <CardDescription>Search, filter, and manage user accounts</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="all">All Users</TabsTrigger>
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                                <TabsTrigger value="premium">Premium</TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 w-64"
                                    />
                                </div>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="all" className="space-y-4">
                            {/* Empty State */}
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-full w-fit mx-auto mb-4">
                                    <Users className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                    When users register for the platform, they will appear here.
                                    You can search, filter, and manage all user accounts from this interface.
                                </p>
                                <Button variant="outline">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Invite First User
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="active" className="space-y-4">
                            <div className="text-center py-8 text-muted-foreground">
                                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No active users in the last 30 days</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="inactive" className="space-y-4">
                            <div className="text-center py-8 text-muted-foreground">
                                <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No inactive users found</p>
                            </div>
                        </TabsContent>

                        <TabsContent value="premium" className="space-y-4">
                            <div className="text-center py-8 text-muted-foreground">
                                <Crown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No premium users yet</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* User Analytics */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">User Growth Trends</CardTitle>
                        <CardDescription>Registration and activity patterns over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium mb-2">Growth Analytics Coming Soon</p>
                            <p className="text-sm">Charts and trends will appear here as user data accumulates</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Feature Usage</CardTitle>
                        <CardDescription>Most popular features among users</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Studio (Content Creation)</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Market Research</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Brand Tools</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />

                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Calculators</span>
                                <span className="text-sm text-muted-foreground">0 uses</span>
                            </div>
                            <Progress value={0} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common user management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Mail className="h-5 w-5" />
                            <span className="text-sm">Send Newsletter</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <UserPlus className="h-5 w-5" />
                            <span className="text-sm">Bulk Import</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Download className="h-5 w-5" />
                            <span className="text-sm">Export Data</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2">
                            <Settings className="h-5 w-5" />
                            <span className="text-sm">User Settings</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}