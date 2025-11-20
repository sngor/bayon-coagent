/**
 * Social Media Connections Component
 * UI for managing Facebook, Instagram, and LinkedIn OAuth connections
 * 
 * Requirements: 6.1, 6.4, 6.5
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AlertCircle,
    CheckCircle2,
    Facebook,
    Instagram,
    Linkedin,
    Loader2,
    XCircle,
} from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useToast } from '@/hooks/use-toast';
import {
    initiateOAuthConnectionAction,
    getAllOAuthConnectionsAction,
    disconnectOAuthConnectionAction,
    getFacebookPagesAction,
    getInstagramBusinessAccountsAction,
    updateSelectedFacebookPageAction,
} from '@/app/social-oauth-actions';
import type { Platform, OAuthConnection } from '@/integrations/social/types';

interface PlatformConfig {
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    description: string;
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
    facebook: {
        name: 'Facebook',
        icon: <Facebook className="h-5 w-5" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50',
        description: 'Post to your Facebook Pages',
    },
    instagram: {
        name: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-100 dark:bg-pink-900/50',
        description: 'Share to your Instagram Business Account',
    },
    linkedin: {
        name: 'LinkedIn',
        icon: <Linkedin className="h-5 w-5" />,
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50',
        description: 'Publish to your LinkedIn profile',
    },
};

export function SocialMediaConnections() {
    const { user } = useUser();
    const { toast } = useToast();
    const [connections, setConnections] = useState<Record<Platform, OAuthConnection | null>>({
        facebook: null,
        instagram: null,
        linkedin: null,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
    const [disconnectingPlatform, setDisconnectingPlatform] = useState<Platform | null>(null);

    // Facebook page selection
    const [facebookPages, setFacebookPages] = useState<Array<{ id: string; name: string; access_token: string }>>([]);
    const [selectedPageId, setSelectedPageId] = useState<string>('');
    const [isLoadingPages, setIsLoadingPages] = useState(false);

    // Instagram business account verification
    const [instagramBusinessAccounts, setInstagramBusinessAccounts] = useState<Array<{ id: string; username?: string }>>([]);
    const [hasInstagramBusiness, setHasInstagramBusiness] = useState(false);

    // Load connections on mount
    useEffect(() => {
        loadConnections();
    }, [user]);

    // Load Facebook pages when Facebook is connected
    useEffect(() => {
        if (connections.facebook && user) {
            loadFacebookPages();
        }
    }, [connections.facebook, user]);

    // Load Instagram business accounts when Instagram is connected
    useEffect(() => {
        if (connections.instagram && user) {
            loadInstagramBusinessAccounts();
        }
    }, [connections.instagram, user]);

    // Handle URL parameters (success/error from OAuth callback)
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');
        const message = params.get('message');
        const platform = params.get('platform');

        if (success && platform) {
            toast({
                title: 'Connection Successful',
                description: `Successfully connected to ${PLATFORM_CONFIGS[platform as Platform]?.name || platform}`,
            });
            // Reload connections
            loadConnections();
            // Clear URL parameters
            window.history.replaceState({}, '', '/settings');
        }

        if (error) {
            toast({
                title: 'Connection Failed',
                description: message || 'Failed to connect to social media platform',
                variant: 'destructive',
            });
            // Clear URL parameters
            window.history.replaceState({}, '', '/settings');
        }
    }, []);

    async function loadConnections() {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            const result = await getAllOAuthConnectionsAction(user.id);
            if (result.success && result.data) {
                setConnections(result.data);
            }
        } catch (error) {
            console.error('Failed to load connections:', error);
            toast({
                title: 'Error',
                description: 'Failed to load social media connections',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function loadFacebookPages() {
        if (!user) return;

        setIsLoadingPages(true);
        try {
            const result = await getFacebookPagesAction(user.id);
            if (result.success && result.data) {
                setFacebookPages(result.data);
                // Set default selected page if metadata has one
                const selectedPage = connections.facebook?.metadata?.selectedPageId;
                if (selectedPage) {
                    setSelectedPageId(selectedPage);
                } else if (result.data.length > 0) {
                    setSelectedPageId(result.data[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load Facebook pages:', error);
        } finally {
            setIsLoadingPages(false);
        }
    }

    async function loadInstagramBusinessAccounts() {
        if (!user) return;

        try {
            const result = await getInstagramBusinessAccountsAction(user.id);
            if (result.success && result.data) {
                setInstagramBusinessAccounts(result.data);
                setHasInstagramBusiness(result.data.length > 0);
            }
        } catch (error) {
            console.error('Failed to load Instagram business accounts:', error);
        }
    }

    async function handleConnect(platform: Platform) {
        if (!user) {
            toast({
                title: 'Error',
                description: 'You must be logged in to connect social media accounts',
                variant: 'destructive',
            });
            return;
        }

        setConnectingPlatform(platform);

        try {
            const result = await initiateOAuthConnectionAction(user.id, platform);
            if (result.success && result.data?.authUrl) {
                // Redirect to OAuth provider
                window.location.href = result.data.authUrl;
            } else {
                throw new Error(result.error || 'Failed to initiate connection');
            }
        } catch (error) {
            console.error(`Failed to connect to ${platform}:`, error);
            toast({
                title: 'Connection Failed',
                description: error instanceof Error ? error.message : 'Failed to initiate connection',
                variant: 'destructive',
            });
            setConnectingPlatform(null);
        }
    }

    async function handleDisconnect(platform: Platform) {
        if (!user) return;

        setDisconnectingPlatform(platform);

        try {
            const result = await disconnectOAuthConnectionAction(user.id, platform);
            if (result.success) {
                toast({
                    title: 'Disconnected',
                    description: `Successfully disconnected from ${PLATFORM_CONFIGS[platform].name}`,
                });
                // Reload connections
                await loadConnections();
            } else {
                throw new Error(result.error || 'Failed to disconnect');
            }
        } catch (error) {
            console.error(`Failed to disconnect from ${platform}:`, error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to disconnect',
                variant: 'destructive',
            });
        } finally {
            setDisconnectingPlatform(null);
        }
    }

    async function handlePageSelection(pageId: string) {
        if (!user) return;

        setSelectedPageId(pageId);

        const page = facebookPages.find(p => p.id === pageId);
        if (!page) return;

        try {
            const result = await updateSelectedFacebookPageAction(user.id, pageId, page.access_token);
            if (result.success) {
                toast({
                    title: 'Page Selected',
                    description: `Posts will be published to ${page.name}`,
                });
            }
        } catch (error) {
            console.error('Failed to update page selection:', error);
            toast({
                title: 'Error',
                description: 'Failed to update page selection',
                variant: 'destructive',
            });
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Social Media Connections</CardTitle>
                    <CardDescription>
                        Connect your social media accounts to publish listings directly from Bayon Coagent
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(['facebook', 'instagram', 'linkedin'] as Platform[]).map((platform) => {
                        const config = PLATFORM_CONFIGS[platform];
                        const connection = connections[platform];
                        const isConnected = !!connection;
                        const isConnecting = connectingPlatform === platform;
                        const isDisconnecting = disconnectingPlatform === platform;

                        return (
                            <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
                                        <span className={config.color}>{config.icon}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{config.name}</p>
                                            {isConnected && (
                                                <Badge variant="outline" className="gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                    Connected
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{config.description}</p>
                                        {isConnected && connection.platformUsername && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Connected as: {connection.platformUsername}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    {isConnected ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDisconnect(platform)}
                                            disabled={isDisconnecting}
                                        >
                                            {isDisconnecting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Disconnecting...
                                                </>
                                            ) : (
                                                'Disconnect'
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleConnect(platform)}
                                            disabled={isConnecting}
                                        >
                                            {isConnecting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                    Connecting...
                                                </>
                                            ) : (
                                                'Connect'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Facebook Page Selection */}
            {connections.facebook && facebookPages.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Facebook Page Selection</CardTitle>
                        <CardDescription>
                            Choose which Facebook Page to publish listings to
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingPages ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Select value={selectedPageId} onValueChange={handlePageSelection}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a Facebook Page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {facebookPages.map((page) => (
                                            <SelectItem key={page.id} value={page.id}>
                                                {page.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {facebookPages.length} page{facebookPages.length !== 1 ? 's' : ''} available
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Instagram Business Account Verification */}
            {connections.instagram && (
                <Card>
                    <CardHeader>
                        <CardTitle>Instagram Business Account</CardTitle>
                        <CardDescription>
                            Verify your Instagram Business Account status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {hasInstagramBusiness ? (
                            <Alert>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription>
                                    Instagram Business Account verified. You can publish listings to Instagram.
                                    {instagramBusinessAccounts.length > 0 && instagramBusinessAccounts[0].username && (
                                        <span className="block mt-1 text-sm">
                                            Account: @{instagramBusinessAccounts[0].username}
                                        </span>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No Instagram Business Account found. To publish to Instagram, you need to:
                                    <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                                        <li>Convert your Instagram account to a Business Account</li>
                                        <li>Connect it to a Facebook Page</li>
                                        <li>Reconnect Instagram in Bayon Coagent</li>
                                    </ol>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Connection Tips */}
            <Card>
                <CardHeader>
                    <CardTitle>Connection Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex gap-3 p-3 bg-muted rounded-lg">
                        <Facebook className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Facebook Pages</p>
                            <p className="text-xs text-muted-foreground">
                                Make sure you're an admin of the Facebook Page you want to post to
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-muted rounded-lg">
                        <Instagram className="h-5 w-5 text-pink-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Instagram Business</p>
                            <p className="text-xs text-muted-foreground">
                                Instagram posting requires a Business Account connected to a Facebook Page
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-muted rounded-lg">
                        <Linkedin className="h-5 w-5 text-blue-700 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">LinkedIn Profile</p>
                            <p className="text-xs text-muted-foreground">
                                Posts will be published to your personal LinkedIn profile
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
