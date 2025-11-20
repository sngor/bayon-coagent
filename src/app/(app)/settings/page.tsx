'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { Loader2, Clock, Activity, Search, FileText, Home, Share2, Sparkles, Wand2, Brain, MapPin, TrendingUp, User, Palette, Bell, Link as LinkIcon, Shield, Trash2, CheckCircle2, XCircle, Smartphone, Monitor, Tablet, Globe, LogOut, Lock, Key, ShieldCheck, BarChart3 } from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useTheme } from 'next-themes';
import { LoginHistory } from '@/components/login-history';
import { UsageTracking, UsageStats } from '@/components/ui/usage-tracking';
import type { UsageLimit } from '@/components/ui/usage-tracking';
import { SocialMediaConnections } from '@/components/social-media-connections';
import { MLSConnection } from '@/components/mls-connection';

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
    const { theme, setTheme } = useTheme();
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);

    // Security states
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [isSecureConnection] = useState(typeof window !== 'undefined' && window.location.protocol === 'https:');
    const [hasStrongPassword] = useState(true); // This would be checked on backend
    const [emailVerified] = useState(user?.emailVerified ?? false);

    // Calculate security score
    const securityScore = [
        isSecureConnection,
        mfaEnabled,
        hasStrongPassword,
        emailVerified,
    ].filter(Boolean).length;
    const maxScore = 4;
    const securityPercentage = (securityScore / maxScore) * 100;

    const getSecurityLevel = () => {
        if (securityPercentage >= 75) return { label: 'Strong', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/50' };
        if (securityPercentage >= 50) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/50' };
        if (securityPercentage >= 25) return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/50' };
        return { label: 'Weak', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/50' };
    };

    const securityLevel = getSecurityLevel();

    // AI Usage tracking data
    const usageLimits: UsageLimit[] = [
        {
            feature: 'AI Content Generation',
            used: 45,
            limit: 100,
            period: 'monthly',
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        {
            feature: 'Image Enhancements',
            used: 12,
            limit: 50,
            period: 'monthly',
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        {
            feature: 'Research Reports',
            used: 8,
            limit: 20,
            period: 'monthly',
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        },
        {
            feature: 'Marketing Plans',
            used: 3,
            limit: 10,
            period: 'monthly',
            resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        }
    ];

    const usageStats = [
        {
            label: 'Total AI Requests',
            value: 68,
            previousValue: 52,
            format: 'number' as const
        },
        {
            label: 'Content Created',
            value: 45,
            previousValue: 38,
            format: 'number' as const
        },
        {
            label: 'Usage Rate',
            value: 68,
            previousValue: 65,
            format: 'percentage' as const
        }
    ];

    const [trustedDevices] = useState([
        {
            id: '1',
            name: 'Chrome on MacBook Pro',
            type: 'desktop',
            location: 'San Francisco, CA',
            lastActive: Date.now() - 1000 * 60 * 5, // 5 minutes ago
            current: true
        },
        {
            id: '2',
            name: 'Safari on iPhone 15',
            type: 'mobile',
            location: 'San Francisco, CA',
            lastActive: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
            current: false
        },
        {
            id: '3',
            name: 'Chrome on iPad Pro',
            type: 'tablet',
            location: 'Oakland, CA',
            lastActive: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
            current: false
        }
    ]);

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
                    <TabsTrigger value="preferences" className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Integrations
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Usage
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

                <TabsContent value="preferences" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>Customize the look and feel of the application</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="theme">Color Theme</Label>
                                <Select value={theme} onValueChange={setTheme}>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Manage your notification preferences</CardDescription>
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

                    <MLSConnection />

                    <SocialMediaConnections />
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" />
                                Security Status
                            </CardTitle>
                            <CardDescription>Your account security overview</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`h-12 w-12 rounded-full ${securityLevel.bgColor} flex items-center justify-center`}>
                                        <Shield className={`h-6 w-6 ${securityLevel.color}`} />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Security Level: {securityLevel.label}</p>
                                        <p className="text-sm text-muted-foreground">{securityScore} of {maxScore} security features enabled</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-2xl font-bold ${securityLevel.color}`}>{securityPercentage}%</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Secure Connection (HTTPS)</span>
                                    </div>
                                    {isSecureConnection ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Two-Factor Authentication</span>
                                    </div>
                                    {mfaEnabled ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <Key className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Strong Password</span>
                                    </div>
                                    {hasStrongPassword ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Email Verified</span>
                                    </div>
                                    {emailVerified ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                </div>
                            </div>

                            {securityPercentage < 100 && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Improve your security by enabling the missing features below
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>Add an extra layer of security to your account</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enable 2FA</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require a verification code in addition to your password
                                    </p>
                                </div>
                                <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
                            </div>
                            {mfaEnabled && (
                                <div className="pt-4 border-t space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                    </p>
                                    <div className="flex justify-center p-4 bg-muted rounded-lg">
                                        <div className="h-48 w-48 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                            <p className="text-xs text-muted-foreground">QR Code Placeholder</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="verification-code">Verification Code</Label>
                                        <Input id="verification-code" placeholder="Enter 6-digit code" maxLength={6} />
                                    </div>
                                    <Button className="w-full">Verify and Enable</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Trusted Devices</CardTitle>
                            <CardDescription>Devices where you're currently signed in</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {trustedDevices.map((device) => {
                                    const DeviceIcon = device.type === 'mobile' ? Smartphone : device.type === 'tablet' ? Tablet : Monitor;
                                    return (
                                        <div key={device.id} className="flex items-start gap-3 p-4 border rounded-lg">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <DeviceIcon className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-medium">{device.name}</p>
                                                    {device.current && (
                                                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Globe className="h-3 w-3" />
                                                        {device.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatTimestamp(device.lastActive)}
                                                    </span>
                                                </div>
                                            </div>
                                            {!device.current && (
                                                <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
                                                    <LogOut className="h-4 w-4" />
                                                    Revoke
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive">
                                    <LogOut className="h-4 w-4" />
                                    Sign Out All Other Devices
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent sign-ins to your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {user && <LoginHistory userId={user.id} />}
                        </CardContent>
                    </Card>

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

                <TabsContent value="usage" className="space-y-6">
                    <UsageStats stats={usageStats} />

                    <Card>
                        <CardHeader>
                            <CardTitle>AI Feature Usage</CardTitle>
                            <CardDescription>Track your monthly AI feature usage and limits</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {usageLimits.map((limit, index) => {
                                const percentage = (limit.used / limit.limit) * 100;
                                const isNearLimit = percentage >= 80;
                                const isAtLimit = percentage >= 100;

                                return (
                                    <div key={index} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">{limit.feature}</span>
                                                {isAtLimit && (
                                                    <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                                                        Limit Reached
                                                    </span>
                                                )}
                                                {isNearLimit && !isAtLimit && (
                                                    <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                                        Near Limit
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {limit.used} / {limit.limit}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${isAtLimit
                                                    ? 'bg-red-600 dark:bg-red-400'
                                                    : isNearLimit
                                                        ? 'bg-amber-500'
                                                        : 'bg-primary'
                                                    }`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span className="capitalize">{limit.period} limit</span>
                                            {limit.resetDate && (
                                                <span>Resets {limit.resetDate.toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Tips</CardTitle>
                            <CardDescription>Get the most out of your AI features</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex gap-3 p-3 bg-muted rounded-lg">
                                <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium mb-1">Optimize Your Prompts</p>
                                    <p className="text-xs text-muted-foreground">
                                        Be specific and detailed in your content requests to get better results on the first try
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-muted rounded-lg">
                                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium mb-1">Save Your Templates</p>
                                    <p className="text-xs text-muted-foreground">
                                        Create reusable templates for frequently generated content types
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-muted rounded-lg">
                                <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium mb-1">Track Your Performance</p>
                                    <p className="text-xs text-muted-foreground">
                                        Monitor which content types perform best and focus your usage there
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
