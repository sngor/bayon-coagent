'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Globe,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    Download,
    ExternalLink,
    Star,
    Calendar,
    MapPin,
    Phone,
    Clock,
    Users,
    TrendingUp,
    Shield,
    Zap,
    Settings,
    Loader2,
    Plus,
    RefreshCw as Sync
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import {
    connectGoogleBusinessProfile,
    syncGoogleBusinessProfile,
    importGoogleReviews,
    getGoogleBusinessProfile,
    type GoogleBusinessProfile,
    type GoogleReview,
} from '@/app/brand-actions';
import {
    ContentSection,
    DataGrid,
    ActionBar,
    LoadingSection,
    EmptySection,
} from '@/components/ui';

export default function BrandIntegrationsPage() {
    const { user } = useUser();
    const [googleProfile, setGoogleProfile] = useState<GoogleBusinessProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isImportingReviews, setIsImportingReviews] = useState(false);
    const [showConnectDialog, setShowConnectDialog] = useState(false);
    const [recentReviews, setRecentReviews] = useState<GoogleReview[]>([]);

    // Load Google Business Profile data
    useEffect(() => {
        if (user?.id) {
            loadGoogleProfile();
        }
    }, [user?.id]);

    const loadGoogleProfile = async () => {
        setIsLoading(true);
        try {
            const result = await getGoogleBusinessProfile();
            if (result.success && result.profile) {
                setGoogleProfile(result.profile);
            }
        } catch (error) {
            console.error('Failed to load Google Business Profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectGoogle = async () => {
        setIsConnecting(true);
        try {
            // In production, this would initiate OAuth flow
            // For now, simulate the connection
            const result = await connectGoogleBusinessProfile('mock_access_token', 'mock_refresh_token');

            if (result.success && result.profile) {
                setGoogleProfile(result.profile);
                setShowConnectDialog(false);

                toast({
                    title: 'Google Business Profile Connected!',
                    description: 'Your profile has been successfully connected and synced.',
                });
            } else {
                throw new Error(result.error || 'Failed to connect');
            }
        } catch (error) {
            toast({
                title: 'Connection Failed',
                description: error instanceof Error ? error.message : 'Failed to connect Google Business Profile',
                variant: 'destructive',
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleSyncProfile = async () => {
        if (!googleProfile) return;

        setIsSyncing(true);
        try {
            const result = await syncGoogleBusinessProfile();

            if (result.success && result.profile) {
                setGoogleProfile(result.profile);

                toast({
                    title: 'Profile Synced',
                    description: 'Your Google Business Profile data has been updated.',
                });
            } else {
                throw new Error(result.error || 'Failed to sync');
            }
        } catch (error) {
            toast({
                title: 'Sync Failed',
                description: error instanceof Error ? error.message : 'Failed to sync profile data',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleImportReviews = async () => {
        setIsImportingReviews(true);
        try {
            const result = await importGoogleReviews();

            if (result.success && result.reviews) {
                setRecentReviews(result.reviews);

                toast({
                    title: 'Reviews Imported',
                    description: `Successfully imported ${result.reviews.length} reviews from Google Business Profile.`,
                });
            } else {
                throw new Error(result.error || 'Failed to import reviews');
            }
        } catch (error) {
            toast({
                title: 'Import Failed',
                description: error instanceof Error ? error.message : 'Failed to import reviews',
                variant: 'destructive',
            });
        } finally {
            setIsImportingReviews(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getConnectionStatus = () => {
        if (!googleProfile) return { status: 'disconnected', color: 'red', text: 'Not Connected' };

        const lastSynced = new Date(googleProfile.lastSynced);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSynced.getTime()) / (1000 * 60 * 60);

        if (hoursSinceSync > 24) {
            return { status: 'stale', color: 'yellow', text: 'Needs Sync' };
        }

        return { status: 'connected', color: 'green', text: 'Connected' };
    };

    const connectionStatus = getConnectionStatus();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Brand Integrations</h1>
                    <p className="text-muted-foreground">
                        Connect your business profiles and sync your online presence
                    </p>
                </div>
            </div>

            {isLoading ? (
                <LoadingSection
                    title="Loading integrations..."
                    description="Checking your connected accounts"
                    variant="default"
                />
            ) : (
                <div className="space-y-6">
                    {/* Google Business Profile Integration */}
                    <Card className={`border-2 ${connectionStatus.status === 'connected' ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10' :
                        connectionStatus.status === 'stale' ? 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-900/10' :
                            'border-gray-200 dark:border-gray-800'
                        }`}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${connectionStatus.status === 'connected' ? 'bg-green-100 dark:bg-green-900/30' :
                                        connectionStatus.status === 'stale' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                            'bg-gray-100 dark:bg-gray-900/30'
                                        }`}>
                                        <Globe className={`h-8 w-8 ${connectionStatus.status === 'connected' ? 'text-green-600 dark:text-green-400' :
                                            connectionStatus.status === 'stale' ? 'text-yellow-600 dark:text-yellow-400' :
                                                'text-gray-600 dark:text-gray-400'
                                            }`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">Google Business Profile</CardTitle>
                                        <CardDescription className="text-base">
                                            Sync your business information, reviews, and photos from Google
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge
                                    variant={connectionStatus.status === 'connected' ? 'default' : 'secondary'}
                                    className={`${connectionStatus.status === 'connected' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                        connectionStatus.status === 'stale' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                        }`}
                                >
                                    {connectionStatus.status === 'connected' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                    {connectionStatus.status === 'stale' && <AlertCircle className="h-3 w-3 mr-1" />}
                                    {connectionStatus.text}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {!googleProfile ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                        <Globe className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Connect Your Google Business Profile</h3>
                                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                        Automatically sync your business information, import reviews, and ensure consistency across platforms.
                                    </p>

                                    <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                                        <DialogTrigger asChild>
                                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Connect Google Business Profile
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Connect Google Business Profile</DialogTitle>
                                                <DialogDescription>
                                                    This will allow us to sync your business information and import reviews automatically.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-3">
                                                    <h4 className="font-semibold">What we'll sync:</h4>
                                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                                        <li className="flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            Business name, address, and phone number
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            Business hours and category
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            Customer reviews and ratings
                                                        </li>
                                                        <li className="flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                            Business photos and description
                                                        </li>
                                                    </ul>
                                                </div>
                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                                        <Shield className="h-4 w-4 inline mr-1" />
                                                        Your data is secure. We only read information to help improve your online presence.
                                                    </p>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleConnectGoogle} disabled={isConnecting}>
                                                    {isConnecting ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Connecting...
                                                        </>
                                                    ) : (
                                                        'Connect Account'
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Business Information */}
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <MapPin className="h-5 w-5" />
                                                    Business Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground">Business Name</div>
                                                    <div className="font-semibold">{googleProfile.businessName}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground">Address</div>
                                                    <div>{googleProfile.address}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                                                    <div>{googleProfile.phone}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-muted-foreground">Category</div>
                                                    <div>{googleProfile.category}</div>
                                                </div>
                                                {googleProfile.isVerified && (
                                                    <div className="flex items-center gap-2 text-green-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Verified Business</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <TrendingUp className="h-5 w-5" />
                                                    Performance Metrics
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                                        <span className="text-sm font-medium">Average Rating</span>
                                                    </div>
                                                    <span className="text-2xl font-bold">{googleProfile.rating?.toFixed(1) || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-blue-600" />
                                                        <span className="text-sm font-medium">Total Reviews</span>
                                                    </div>
                                                    <span className="text-2xl font-bold">{googleProfile.reviewCount || 0}</span>
                                                </div>
                                                <div className="pt-2 border-t">
                                                    <div className="text-xs text-muted-foreground">
                                                        Last synced: {formatDate(googleProfile.lastSynced)}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3">
                                        <Button onClick={handleSyncProfile} disabled={isSyncing} variant="outline">
                                            {isSyncing ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Syncing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sync className="h-4 w-4 mr-2" />
                                                    Sync Profile
                                                </>
                                            )}
                                        </Button>

                                        <Button onClick={handleImportReviews} disabled={isImportingReviews}>
                                            {isImportingReviews ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Import Reviews
                                                </>
                                            )}
                                        </Button>

                                        <Button variant="outline" asChild>
                                            <a href="https://business.google.com/" target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Manage on Google
                                            </a>
                                        </Button>
                                    </div>

                                    {/* Recent Reviews */}
                                    {recentReviews.length > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Recently Imported Reviews</CardTitle>
                                                <CardDescription>
                                                    Latest reviews from your Google Business Profile
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {recentReviews.map((review) => (
                                                        <div key={review.id} className="p-4 border rounded-lg">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <div className="font-semibold">{review.author}</div>
                                                                    <div className="flex items-center gap-1">
                                                                        {[...Array(5)].map((_, i) => (
                                                                            <Star
                                                                                key={i}
                                                                                className={`h-4 w-4 ${i < review.rating
                                                                                    ? 'text-yellow-400 fill-yellow-400'
                                                                                    : 'text-gray-300'
                                                                                    }`}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {formatDate(review.date)}
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground italic">
                                                                "{review.comment}"
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Coming Soon Integrations */}
                    <Card className="border-dashed border-2">
                        <CardHeader>
                            <CardTitle className="text-xl">More Integrations Coming Soon</CardTitle>
                            <CardDescription>
                                We're working on additional integrations to help you manage your online presence
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 border rounded-lg opacity-60">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="font-semibold">Zillow</div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Sync your agent profile and import reviews
                                    </p>
                                    <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                                </div>

                                <div className="p-4 border rounded-lg opacity-60">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="font-semibold">Facebook Business</div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Manage your Facebook business page
                                    </p>
                                    <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                                </div>

                                <div className="p-4 border rounded-lg opacity-60">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="font-semibold">Yelp Business</div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Monitor and respond to Yelp reviews
                                    </p>
                                    <Badge variant="secondary" className="mt-2">Coming Soon</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}