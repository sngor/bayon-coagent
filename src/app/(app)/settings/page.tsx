'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ContentSection, DataGrid, FormSection } from '@/components/ui';
import { useEffect, useState } from 'react';
import { Loader2, Clock, Activity, Search, FileText, Home, Share2, Sparkles, Wand2, Brain, MapPin, TrendingUp, User, Palette, Bell, Link as LinkIcon, Shield, Trash2, CheckCircle2, XCircle, Smartphone, Monitor, Tablet, Globe, LogOut, Lock, Key, ShieldCheck, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { useTheme } from 'next-themes';
import { useAccessibility } from '@/contexts/accessibility-context';
import { DebugAccessibility } from '@/components/debug-accessibility';
import { LoginHistory } from '@/components/login-history';
import { UsageTracking, UsageStats } from '@/components/ui/usage-tracking';
import type { UsageLimit } from '@/components/ui/usage-tracking';
import { SocialMediaConnections } from '@/components/social-media-connections';
import { MLSConnection } from '@/components/mls-connection';
import { FeatureToggles } from '@/components/feature-toggles';
import { NotificationSettings } from '@/lib/notifications/components';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { updateProfilePhotoUrlAction } from '@/app/actions';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';

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
        icon: <Activity className="h-4 w-4 text-muted-foreground" />,
        bgColor: 'bg-muted',
        label: 'Activity',
        source: 'Platform',
        sourceIcon: <Activity className="h-3 w-3" />
    };
}

export default function SettingsPage() {
    const { user } = useUser();
    const { theme, setTheme } = useTheme();
    const pageMetadata = getPageMetadata('/settings');
    const { toast } = useToast();
    const { preferences, updatePreference } = useAccessibility();
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [isLoadingActivity, setIsLoadingActivity] = useState(true);

    // Profile form state
    const [fullName, setFullName] = useState('');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Google connection state
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);

    // Handle URL tab parameter
    const [activeTab, setActiveTab] = useState('account');

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['account', 'preferences', 'integrations', 'security', 'usage', 'features'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, []);

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

    // Load profile data and preferences
    useEffect(() => {
        async function loadProfile() {
            if (!user) {
                setIsLoadingProfile(false);
                return;
            }

            try {
                const { getProfileAction } = await import('@/app/actions');
                const result = await getProfileAction(user.id);
                if (result.data?.Data) {
                    setFullName(result.data.Data.name || '');
                    setProfilePhotoUrl(result.data.Data.photoURL || '');
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        }

        loadProfile();
    }, [user]);

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

    // Check Google connection status
    useEffect(() => {
        async function checkGoogleConnection() {
            if (!user) return;

            try {
                const { getGoogleConnectionStatusAction } = await import('@/app/actions');
                const result = await getGoogleConnectionStatusAction(user.id);
                if (result.message === 'success') {
                    setIsGoogleConnected(result.isConnected);
                }
            } catch (error) {
                console.error('Failed to check Google connection:', error);
            }
        }

        checkGoogleConnection();
    }, [user]);

    // Handle profile save
    const handleSaveProfile = async () => {
        if (!user) return;

        setIsSavingProfile(true);
        try {
            const { saveProfileAction, getProfileAction } = await import('@/app/actions');

            // First, get the existing profile data
            const existingProfileResult = await getProfileAction(user.id);
            const existingProfileData = existingProfileResult.data?.Data || {};

            // Merge the new name with existing profile data
            const updatedProfile = {
                ...existingProfileData,
                name: fullName
            };

            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('profile', JSON.stringify(updatedProfile));

            const result = await saveProfileAction({}, formData);

            if (result.message === 'success') {
                toast({
                    title: 'Profile Updated',
                    description: 'Your full name has been saved successfully.',
                });

                // Trigger a page refresh to reload the profile data in the layout
                setTimeout(() => window.location.reload(), 1000);
            } else {
                console.error('Failed to save profile:', result.message);
                toast({
                    title: 'Error',
                    description: 'Failed to save profile. Please try again.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast({
                title: 'Error',
                description: 'Failed to save profile. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Handle accessibility preference save
    const handleHighContrastBordersChange = async (enabled: boolean) => {
        try {
            await updatePreference('highContrastBorders', enabled);
            toast({
                title: 'Accessibility Updated',
                description: `High contrast borders ${enabled ? 'enabled' : 'disabled'}.`,
            });
        } catch (error) {
            console.error('Error saving accessibility preference:', error);
            toast({
                title: 'Error',
                description: 'Failed to save accessibility preference. Please try again.',
                variant: 'destructive',
            });
        }
    };

    return (
        <>
            <div className="animate-fade-in-up space-y-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">Manage your account and preferences</p>
                    </div>
                    {pageMetadata && <FavoritesButton item={pageMetadata} variant="outline" size="sm" />}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="overflow-x-auto">
                        <TabsTrigger value="account">
                            <User className="h-4 w-4" />
                            <span className="hidden sm:inline whitespace-nowrap">Account</span>
                        </TabsTrigger>
                        <TabsTrigger value="preferences">
                            <Palette className="h-4 w-4" />
                            <span className="hidden sm:inline whitespace-nowrap">Preferences</span>
                        </TabsTrigger>
                        <TabsTrigger value="integrations">
                            <LinkIcon className="h-4 w-4" />
                            <span className="hidden sm:inline whitespace-nowrap">Integrations</span>
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Shield className="h-4 w-4" />
                            <span className="hidden sm:inline whitespace-nowrap">Security</span>
                        </TabsTrigger>
                        <TabsTrigger value="usage">
                            <BarChart3 className="h-4 w-4" />
                            <span className="hidden sm:inline whitespace-nowrap">Usage</span>
                        </TabsTrigger>
                        <TabsTrigger value="features">
                            <Wand2 className="h-4 w-4" />
                            <span className="hidden sm:inline whitespace-nowrap">Features</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="account" className="space-y-6">
                        <FormSection title="Profile Photo" description="Update your profile picture" icon={User} variant="card">
                            <div className="flex justify-center py-4">
                                <ProfileImageUpload
                                    userId={user?.id || ''}
                                    currentImageUrl={profilePhotoUrl}
                                    userName={fullName}
                                    onImageUpdate={async (url: string) => {
                                        setProfilePhotoUrl(url);
                                        if (user?.id) {
                                            try {
                                                const result = await updateProfilePhotoUrlAction(user.id, url);
                                                if (result.message === 'Profile photo updated successfully') {
                                                    const { getCache } = await import('@/aws/dynamodb/hooks/cache');
                                                    const cache = getCache();
                                                    cache.invalidatePartition(`USER#${user.id}`);
                                                    toast({
                                                        title: 'Profile Photo Updated!',
                                                        description: 'Your profile photo has been uploaded successfully.',
                                                    });
                                                    try {
                                                        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: { photoURL: url } }));
                                                    } catch (err) {
                                                        console.warn('Could not dispatch profileUpdated event', err);
                                                    }
                                                } else {
                                                    throw new Error(result.errors?.[0] || 'Update failed');
                                                }
                                            } catch (error) {
                                                console.error('Failed to update profile photo:', error);
                                                toast({
                                                    variant: 'destructive',
                                                    title: 'Update Failed',
                                                    description: 'Could not update profile photo.',
                                                });
                                            }
                                        }
                                    }}
                                    size="xl"
                                />
                            </div>
                        </FormSection>

                        <FormSection title="Account Information" description="Your account details and profile settings" icon={User} variant="card">
                            <DataGrid columns={1}>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={user?.email || ''} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        disabled={isLoadingProfile}
                                    />
                                </div>
                                <div className="pt-4">
                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={isSavingProfile || isLoadingProfile}
                                    >
                                        {isSavingProfile ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </DataGrid>
                        </FormSection>

                        <FormSection title="Password" description="Change your password" icon={Lock} variant="card">
                            <DataGrid columns={1}>
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
                                <div className="pt-4">
                                    <Button>Update Password</Button>
                                </div>
                            </DataGrid>
                        </FormSection>

                        <Card className="border-destructive/20">
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
                        <FormSection title="Appearance" description="Customize the look and feel of the application" icon={Palette} variant="card">
                            <DataGrid columns={1}>
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
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="space-y-0.5">
                                        <Label>Full Width Layout</Label>
                                        <p className="text-sm text-muted-foreground">Allow pages to use full screen width instead of being centered with maximum width</p>
                                    </div>
                                    <Switch
                                        checked={preferences.fullWidth}
                                        onCheckedChange={async (enabled) => {
                                            try {
                                                await updatePreference('fullWidth', enabled);
                                                toast({
                                                    title: 'Layout Updated',
                                                    description: `Pages will now ${enabled ? 'use full width' : 'be centered with maximum width'}.`,
                                                });
                                            } catch (error) {
                                                console.error('Error saving layout preference:', error);
                                                toast({
                                                    title: 'Error',
                                                    description: 'Failed to save layout preference. Please try again.',
                                                    variant: 'destructive',
                                                });
                                            }
                                        }}
                                    />
                                </div>
                            </DataGrid>
                        </FormSection>

                        <FormSection title="Accessibility" description="Improve accessibility and visual clarity" icon={User} variant="card">
                            <DataGrid columns={1}>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>High Contrast Borders</Label>
                                        <p className="text-sm text-muted-foreground">Use black borders for better contrast when elements don't have shadows</p>
                                    </div>
                                    <Switch
                                        checked={preferences.highContrastBorders}
                                        onCheckedChange={handleHighContrastBordersChange}
                                    />
                                </div>
                            </DataGrid>
                        </FormSection>

                        {/* Notification Settings - Full notification system */}
                        {user && <NotificationSettings userId={user.id} />}
                    </TabsContent>

                    <TabsContent value="integrations" className="space-y-6">
                        <ContentSection title="Connected Services" description="Manage your third-party integrations" icon={LinkIcon} variant="card">
                            <DataGrid columns={1}>
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                            <LinkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Google Business Profile</p>
                                            <p className="text-sm text-muted-foreground">
                                                {isGoogleConnected ? 'Connected' : 'Not connected'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant={isGoogleConnected ? "outline" : "default"}
                                        onClick={async () => {
                                            if (isGoogleConnected) {
                                                // Optional: Add disconnect logic here
                                                toast({
                                                    title: "Already Connected",
                                                    description: "Your Google Business Profile is already connected.",
                                                });
                                            } else {
                                                const { connectGoogleBusinessProfileAction } = await import('@/app/actions');
                                                await connectGoogleBusinessProfileAction();
                                            }
                                        }}
                                    >
                                        {isGoogleConnected ? 'Connected' : 'Connect'}
                                    </Button>
                                </div>
                                <div className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
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
                            </DataGrid>
                        </ContentSection>

                        <MLSConnection />

                        <SocialMediaConnections />
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6">
                        <ContentSection title="Security Status" description="Your account security overview" icon={ShieldCheck} variant="card">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-6 border rounded-xl bg-gradient-to-br from-card to-accent/5">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-14 w-14 rounded-full ${securityLevel.bgColor} flex items-center justify-center shadow-sm`}>
                                            <Shield className={`h-7 w-7 ${securityLevel.color}`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">Security Level: {securityLevel.label}</p>
                                            <p className="text-sm text-muted-foreground">{securityScore} of {maxScore} security features enabled</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-3xl font-bold ${securityLevel.color}`}>{securityPercentage}%</p>
                                    </div>
                                </div>

                                <DataGrid columns={1} className="gap-2">
                                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Secure Connection (HTTPS)</span>
                                        </div>
                                        {isSecureConnection ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Two-Factor Authentication</span>
                                        </div>
                                        {mfaEnabled ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Key className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Strong Password</span>
                                        </div>
                                        {hasStrongPassword ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/5 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Email Verified</span>
                                        </div>
                                        {emailVerified ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        )}
                                    </div>
                                </DataGrid>

                                {securityPercentage < 100 && (
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Improve your security by enabling the missing features below
                                        </p>
                                    </div>
                                )}
                            </div>
                        </ContentSection>

                        <FormSection title="Two-Factor Authentication" description="Add an extra layer of security to your account" icon={Shield} variant="card">
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
                        </FormSection>

                        <ContentSection title="Trusted Devices" description="Devices where you're currently signed in" icon={Smartphone} variant="card">
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
                        </ContentSection>

                        <ContentSection title="Login History" description="Recent sign-ins to your account" icon={Clock} variant="card">
                            {user && <LoginHistory userId={user.id} />}
                        </ContentSection>


                    </TabsContent>

                    <TabsContent value="usage" className="space-y-6">
                        <UsageStats stats={usageStats} />

                        <ContentSection title="AI Feature Usage" description="Track your monthly AI feature usage and limits" icon={BarChart3} variant="card">
                            <DataGrid columns={1}>
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
                                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-primary'
                                                        }`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </DataGrid>
                        </ContentSection>

                        <ContentSection title="Recent Activity" description="Your latest content generation and AI interactions" icon={Activity} variant="card">
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
                                <DataGrid columns={1}>
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
                                </DataGrid>
                            )}
                        </ContentSection>
                        <ContentSection title="Usage Tips" description="Get the most out of your AI features" icon={Sparkles} variant="card">
                            <DataGrid columns={1}>
                                <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                                    <Brain className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium mb-1">Optimize Your Prompts</p>
                                        <p className="text-xs text-muted-foreground">
                                            Be specific and detailed in your content requests to get better results on the first try
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium mb-1">Save Your Templates</p>
                                        <p className="text-xs text-muted-foreground">
                                            Create reusable templates for frequently generated content types
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                                    <TrendingUp className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium mb-1">Track Your Performance</p>
                                        <p className="text-xs text-muted-foreground">
                                            Monitor which content types perform best and focus your usage there
                                        </p>
                                    </div>
                                </div>
                            </DataGrid>
                        </ContentSection>
                    </TabsContent>

                    <TabsContent value="features" className="space-y-6">
                        <FeatureToggles />
                    </TabsContent>
                </Tabs >
            </div >
            <DebugAccessibility />
        </>
    );
}
