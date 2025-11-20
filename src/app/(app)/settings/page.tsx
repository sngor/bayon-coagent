'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { Loader2, Clock, Activity, Search, FileText, Home, Share2, Sparkles, Wand2, Brain, MapPin, TrendingUp, User, Palette, Bell, Link as LinkIcon, Shield, Trash2 } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { LoginHistory } from '@/components/login-history';

function formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return new Date(timestamp).toLocaleDateString();
}

function getActivityConfig(activity: any) {
    const contentTypeMap: Record<string, { icon: React.ReactNode; bgColor: string; label: string; source: string; sourceIcon: React.ReactNode }> = {
        'blog-post': {
            icon: <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            bgColor: 'bg-blue-100 dark:bg-blue-900/50',
            label: 'Blog Post Generated',
            source: 'Studio',
            sourceIcon: <Brain className="h-3 w-3" />
        },
        'social-media': {
            icon: <Share2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
            bgColor: 'bg-green-100 dark:bg-green-900/50',
            label: 'Social Media Post',
            source: 'Studio',
            sourceIcon: <Brain className="h-3 w-3" />
        },
        'listing-description': {
            icon: <Home className="h-4 w-4 text-pink-600 dark:text-pink-400" />,
            bgColor: 'bg-pink-100 dark:bg-pink-900/50',
            label: 'Listing Description',
            source: 'Studio',
            sourceIcon: <Brain className="h-3 w-3" />
        },
        'market-update': {
            icon: <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
            bgColor: 'bg-indigo-100 dark:bg-indigo-900/50',
            label: 'Market Update',
            source: 'Studio',
            sourceIcon: <Brain className="h-3 w-3" />
        },
        'video-script': {
            icon: <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
            bgColor: 'bg-purple-100 dark:bg-purple-900/50',
            label: 'Video Script',
            source: 'Studio',
            sourceIcon: <Brain className="h-3 w-3" />
        },
        'neighborhood-guide': {
            icon: <MapPin className="h-4 w-4 text-teal-600 dark:text-teal-400" />,
            bgColor: 'bg-teal-100 dark:bg-teal-900/50',
            label: 'Neighborhood Guide',
            source: 'Studio',
            sourceIcon: <Brain className="h-3 w-3" />
        },
    };

    if (activity.type === 'content') {
        const config = contentTypeMap[activity.contentType] || {
            icon: <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            bgColor: 'bg-blue-100 dark:bg-blue-900/50',
            label: 'Content Created',
            source: 'Studio',
            sourceIcon: <Brain className="h-3 w-3" />
        };
        return config;
    } else if (activity.type === 'report') {
        return {
            icon: <Search className="h-4 w-4 text-orange-600 dark:text-orange-400" />,
            bgColor: 'bg-orange-100 dark:bg-orange-900/50',
            label: 'Research Report',
            source: 'Market',
            sourceIcon: <Brain className="h-3 w-3" />
        };
    } else if (activity.type === 'plan') {
        return {
            icon: <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />,
            bgColor: 'bg-violet-100 dark:bg-violet-900/50',
            label: 'Marketing Plan',
            source: 'Brand',
            sourceIcon: <Brain className="h-3 w-3" />
        };
    } else if (activity.type === 'edit') {
        return {
            icon: <Wand2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
            bgColor: 'bg-purple-100 dark:bg-purple-900/50',
            label: 'Image Enhanced',
            source: 'Reimagine',
            sourceIcon: <Wand2 className="h-3 w-3" />
        };
    }

    return {
        icon: <Activity className="h-4 w-4 text-gray-600 dark:text-gray-400" />,
        bgColor: 'bg-gray-100 dark:bg-gray-900/50',
        label: 'Activity',
        source: 'Platform',
        sourceIcon: <Activity className="h-3 w-3" />
    };
}

export default function SettingsPage() {
    const { user } = useUser();
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);

    useEffect(() => {
        async function loadRecentActivity() {
            if (!user) {
                setIsLoadingActivity(false);
                return;
            }

            try {
                const { getRecentActivityAction } = await import('@/app/actions');
                const result = await getRecentActivityAction(user.id);
                if (result.data) {
                    setRecentActivity(result.data);
                }
            } catch (error) {
                console.error('Failed to load recent activity:', error);
            } finally {
                setIsLoadingActivity(false);
            }
        }

        loadRecentActivity();
    }, [user]);

    return (
        <div className="animate-fade-in-up space-y-6">
            <Tabs defaultValue="account" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="account" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Account
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Appearance
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Activity
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Information</CardTitle>
                            <CardDescription>Your account details and profile settings</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={user?.email || ''} disabled />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" type="text" placeholder="Enter your name" />
                            </div>
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Irreversible account actions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive" className="gap-2">
                                <Trash2 className="h-4 w-4" />
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme</CardTitle>
                            <CardDescription>Customize the appearance of the application</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="theme">Color Theme</Label>
                                <Select defaultValue="system">
                                    <SelectTrigger id="theme">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="system">System</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Compact Mode</Label>
                                    <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Notifications</CardTitle>
                            <CardDescription>Manage your email notification preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Content Generation Complete</Label>
                                    <p className="text-sm text-muted-foreground">Get notified when AI content is ready</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Weekly Activity Summary</Label>
                                    <p className="text-sm text-muted-foreground">Receive a weekly digest of your activity</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Marketing Tips</Label>
                                    <p className="text-sm text-muted-foreground">Get tips and best practices</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Services</CardTitle>
                            <CardDescription>Manage your third-party integrations</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                        <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Google Business Profile</p>
                                        <p className="text-sm text-muted-foreground">Not connected</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => window.location.href = '/brand/profile'}>
                                    Connect
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                        <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Zillow Reviews</p>
                                        <p className="text-sm text-muted-foreground">Import your reviews</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => window.location.href = '/brand/audit'}>
                                    Import
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>Change your password</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                            <Button>Update Password</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent sign-ins to your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <LoginHistory />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Recent Activity</CardTitle>
                            <CardDescription>
                                Your latest content generation and AI interactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingActivity ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : recentActivity.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">No recent activity yet</p>
                                    <p className="text-xs mt-1">Start creating content to see your activity here</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {recentActivity.map((activity) => {
                                            const activityConfig = getActivityConfig(activity);
                                            return (
                                                <div key={activity.id} className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                                    <div className={`rounded-md ${activityConfig.bgColor} p-2`}>
                                                        {activityConfig.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold mb-1">{activityConfig.label}</p>
                                                        <p className="text-xs text-muted-foreground mb-2 truncate">
                                                            {activity.title}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTimestamp(activity.timestamp)}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                {activityConfig.sourceIcon}
                                                                {activityConfig.source}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => window.location.href = '/library/content'}
                                        >
                                            View All Activity
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
