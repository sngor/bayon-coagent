/**
 * Social Media Connections Component
 * UI for managing Facebook, Instagram, and LinkedIn OAuth connections
 * Enhanced with streamlined onboarding, connection troubleshooting, and health monitoring
 * 
 * Requirements: 1.2, 8.1 (Task 9.2: Streamlined channel connection experience)
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    AlertCircle,
    CheckCircle2,
    Facebook,
    Instagram,
    Linkedin,
    Loader2,
    XCircle,
    HelpCircle,
    RefreshCw,
    Settings,
    Wifi,
    WifiOff,
    Clock,
    Shield,
    Trash2,
    Twitter,
} from 'lucide-react';
import { useUser } from '@/aws/auth';
import { useToast } from '@/hooks/use-toast';
import {
    initiateOAuthConnectionAction,
    getConnectedChannelsAction,
    disconnectOAuthConnectionAction,
    getFacebookPagesAction,
    getInstagramBusinessAccountsAction,
    updateSelectedFacebookPageAction,
    validateChannelAction,
    monitorConnectionHealthAction,
    runConnectionDiagnosticsAction,
} from '@/app/social-oauth-actions';
import type { Platform, OAuthConnection } from '@/integrations/social/types';

interface PlatformConfig {
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    description: string;
    setupSteps: string[];
    troubleshooting: {
        issue: string;
        solution: string;
    }[];
}

interface ConnectionStatus {
    platform: Platform;
    connection: OAuthConnection | null;
    isHealthy: boolean;
    lastUsed?: number;
    lastValidated?: number;
    status: 'connected' | 'expired' | 'error' | 'disconnected';
    statusMessage?: string;
}

interface DisconnectOptions {
    retainData: boolean;
    retainAnalytics: boolean;
    notifyOnReconnect: boolean;
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
    facebook: {
        name: 'Facebook',
        icon: <Facebook className="h-5 w-5" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50',
        description: 'Post to your Facebook Pages',
        setupSteps: [
            'Click "Connect" to authorize Bayon Coagent',
            'Log in to your Facebook account',
            'Grant permissions for page management',
            'Select which Facebook Page to use for posting',
            'Test your connection'
        ],
        troubleshooting: [
            {
                issue: 'No Facebook Pages found',
                solution: 'Make sure you\'re an admin of at least one Facebook Page'
            },
            {
                issue: 'Permission denied',
                solution: 'Ensure you grant all requested permissions during authorization'
            },
            {
                issue: 'Connection expired',
                solution: 'Reconnect your account to refresh the access token'
            }
        ]
    },
    instagram: {
        name: 'Instagram',
        icon: <Instagram className="h-5 w-5" />,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-100 dark:bg-pink-900/50',
        description: 'Share to your Instagram Business Account',
        setupSteps: [
            'Convert your Instagram to a Business Account',
            'Connect Instagram to a Facebook Page',
            'Click "Connect" in Bayon Coagent',
            'Authorize through Facebook',
            'Verify your Business Account is detected'
        ],
        troubleshooting: [
            {
                issue: 'No Business Account found',
                solution: 'Convert your Instagram to a Business Account and connect it to a Facebook Page'
            },
            {
                issue: 'Can\'t post to Instagram',
                solution: 'Ensure your Instagram Business Account is properly linked to a Facebook Page'
            },
            {
                issue: 'Authorization failed',
                solution: 'Try disconnecting and reconnecting through Facebook'
            }
        ]
    },
    linkedin: {
        name: 'LinkedIn',
        icon: <Linkedin className="h-5 w-5" />,
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-100 dark:bg-blue-900/50',
        description: 'Publish to your LinkedIn profile',
        setupSteps: [
            'Click "Connect" to authorize Bayon Coagent',
            'Log in to your LinkedIn account',
            'Grant permissions for posting',
            'Confirm your profile information',
            'Test your connection'
        ],
        troubleshooting: [
            {
                issue: 'Profile not found',
                solution: 'Ensure your LinkedIn profile is complete and public'
            },
            {
                issue: 'Posting failed',
                solution: 'Check that you have posting permissions enabled'
            },
            {
                issue: 'Token expired',
                solution: 'Reconnect your LinkedIn account to refresh access'
            }
        ]
    },
    twitter: {
        name: 'Twitter/X',
        icon: <Twitter className="h-5 w-5" />,
        color: 'text-black dark:text-white',
        bgColor: 'bg-gray-100 dark:bg-gray-900/50',
        description: 'Post tweets to your Twitter/X account',
        setupSteps: [
            'Click "Connect" to authorize Bayon Coagent',
            'Log in to your Twitter/X account',
            'Grant permissions for posting and reading',
            'Confirm your account information',
            'Test your connection'
        ],
        troubleshooting: [
            {
                issue: 'Authorization failed',
                solution: 'Make sure you grant all requested permissions during setup'
            },
            {
                issue: 'Tweet posting failed',
                solution: 'Check that your account has posting permissions and isn\'t suspended'
            },
            {
                issue: 'API limits reached',
                solution: 'Twitter has rate limits - wait a few minutes before trying again'
            }
        ]
    },
};

export function SocialMediaConnections() {
    const { user } = useUser();
    const { toast } = useToast();
    const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
    const [disconnectingPlatform, setDisconnectingPlatform] = useState<Platform | null>(null);
    const [validatingPlatform, setValidatingPlatform] = useState<Platform | null>(null);

    // Onboarding and troubleshooting modals
    const [showOnboardingModal, setShowOnboardingModal] = useState<Platform | null>(null);
    const [showTroubleshootingModal, setShowTroubleshootingModal] = useState<Platform | null>(null);
    const [showDisconnectModal, setShowDisconnectModal] = useState<Platform | null>(null);
    const [showDiagnosticsModal, setShowDiagnosticsModal] = useState<Platform | null>(null);
    const [disconnectOptions, setDisconnectOptions] = useState<DisconnectOptions>({
        retainData: true,
        retainAnalytics: true,
        notifyOnReconnect: true,
    });

    // Diagnostics state
    const [diagnosticsResults, setDiagnosticsResults] = useState<any>(null);
    const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);

    // Health monitoring
    const [healthCheckProgress, setHealthCheckProgress] = useState(0);
    const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false);

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
        const facebookStatus = connectionStatuses.find(s => s.platform === 'facebook');
        if (facebookStatus?.connection && user) {
            loadFacebookPages();
        }
    }, [connectionStatuses, user]);

    // Load Instagram business accounts when Instagram is connected
    useEffect(() => {
        const instagramStatus = connectionStatuses.find(s => s.platform === 'instagram');
        if (instagramStatus?.connection && user) {
            loadInstagramBusinessAccounts();
        }
    }, [connectionStatuses, user]);

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
            const result = await getConnectedChannelsAction(user.id);
            if (result.success && result.data) {
                setConnectionStatuses(result.data);
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
                const facebookStatus = connectionStatuses.find(s => s.platform === 'facebook');
                const selectedPage = facebookStatus?.connection?.metadata?.selectedPageId;
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
            setShowDisconnectModal(null);
        }
    }

    async function handleValidateConnection(platform: Platform) {
        if (!user) return;

        setValidatingPlatform(platform);

        try {
            const result = await validateChannelAction(user.id, platform);
            if (result.success && result.data) {
                if (result.data.isValid) {
                    toast({
                        title: 'Connection Valid',
                        description: `${PLATFORM_CONFIGS[platform].name} connection is working properly`,
                    });
                } else {
                    toast({
                        title: 'Connection Issue',
                        description: result.data.error || 'Connection validation failed',
                        variant: 'destructive',
                    });
                }
                // Reload connections to update status
                await loadConnections();
            }
        } catch (error) {
            console.error(`Failed to validate ${platform} connection:`, error);
            toast({
                title: 'Validation Failed',
                description: 'Unable to test connection',
                variant: 'destructive',
            });
        } finally {
            setValidatingPlatform(null);
        }
    }

    async function runHealthCheck() {
        if (!user) return;

        setIsRunningHealthCheck(true);
        setHealthCheckProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setHealthCheckProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const result = await monitorConnectionHealthAction(user.id);

            clearInterval(progressInterval);
            setHealthCheckProgress(100);

            if (result.success && result.data) {
                const { healthyConnections, unhealthyConnections, alertsSent } = result.data;

                if (unhealthyConnections.length === 0) {
                    toast({
                        title: 'All Connections Healthy',
                        description: `${healthyConnections.length} connection(s) are working properly`,
                    });
                } else {
                    toast({
                        title: 'Connection Issues Found',
                        description: `${unhealthyConnections.length} connection(s) need attention`,
                        variant: 'destructive',
                    });
                }

                // Reload connections to show updated status
                await loadConnections();
            }
        } catch (error) {
            console.error('Health check failed:', error);
            toast({
                title: 'Health Check Failed',
                description: 'Unable to check connection health',
                variant: 'destructive',
            });
        } finally {
            setIsRunningHealthCheck(false);
            setTimeout(() => setHealthCheckProgress(0), 1000);
        }
    }

    async function runDiagnostics(platform: Platform) {
        if (!user) return;

        setIsRunningDiagnostics(true);
        setDiagnosticsResults(null);

        try {
            const result = await runConnectionDiagnosticsAction(user.id, platform);

            if (result.success && result.data) {
                setDiagnosticsResults(result.data);
                setShowDiagnosticsModal(platform);

                toast({
                    title: 'Diagnostics Complete',
                    description: `Found ${result.data.tests.length} test results`,
                });
            } else {
                throw new Error(result.error || 'Diagnostics failed');
            }
        } catch (error) {
            console.error('Diagnostics failed:', error);
            toast({
                title: 'Diagnostics Failed',
                description: 'Unable to run connection diagnostics',
                variant: 'destructive',
            });
        } finally {
            setIsRunningDiagnostics(false);
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

    function getStatusIcon(status: ConnectionStatus['status'], isHealthy: boolean) {
        if (status === 'connected' && isHealthy) {
            return <Wifi className="h-4 w-4 text-green-600" />;
        } else if (status === 'connected' && !isHealthy) {
            return <AlertCircle className="h-4 w-4 text-yellow-600" />;
        } else if (status === 'expired') {
            return <Clock className="h-4 w-4 text-red-600" />;
        } else if (status === 'error') {
            return <WifiOff className="h-4 w-4 text-red-600" />;
        } else {
            return <WifiOff className="h-4 w-4 text-gray-400" />;
        }
    }

    function getStatusBadge(status: ConnectionStatus['status'], isHealthy: boolean) {
        if (status === 'connected' && isHealthy) {
            return (
                <Badge variant="outline" className="gap-1 text-green-700 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                </Badge>
            );
        } else if (status === 'connected' && !isHealthy) {
            return (
                <Badge variant="outline" className="gap-1 text-yellow-700 border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-3 w-3" />
                    Warning
                </Badge>
            );
        } else if (status === 'expired') {
            return (
                <Badge variant="outline" className="gap-1 text-red-700 border-red-200 bg-red-50">
                    <XCircle className="h-3 w-3" />
                    Expired
                </Badge>
            );
        } else if (status === 'error') {
            return (
                <Badge variant="outline" className="gap-1 text-red-700 border-red-200 bg-red-50">
                    <XCircle className="h-3 w-3" />
                    Error
                </Badge>
            );
        } else {
            return (
                <Badge variant="outline" className="gap-1 text-gray-500 border-gray-200">
                    <WifiOff className="h-3 w-3" />
                    Not Connected
                </Badge>
            );
        }
    }

    function formatLastUsed(timestamp?: number) {
        if (!timestamp) return 'Never used';

        const now = Date.now();
        const diff = now - timestamp;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        return 'Just now';
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
        <TooltipProvider>
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Social Media Connections</CardTitle>
                                <CardDescription>
                                    Connect your social media accounts to publish listings directly from Bayon Coagent
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={runHealthCheck}
                                            disabled={isRunningHealthCheck}
                                        >
                                            {isRunningHealthCheck ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <RefreshCw className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Check connection health</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                        {isRunningHealthCheck && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Running health check...
                                </div>
                                <Progress value={healthCheckProgress} className="h-2" />
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(['facebook', 'instagram', 'linkedin', 'twitter'] as Platform[]).map((platform) => {
                            const config = PLATFORM_CONFIGS[platform];
                            const connectionStatus = connectionStatuses.find(s => s.platform === platform);
                            const isConnected = connectionStatus?.status === 'connected';
                            const isConnecting = connectingPlatform === platform;
                            const isDisconnecting = disconnectingPlatform === platform;
                            const isValidating = validatingPlatform === platform;

                            return (
                                <div key={platform} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full ${config.bgColor} flex items-center justify-center relative`}>
                                            <span className={config.color}>{config.icon}</span>
                                            {connectionStatus && (
                                                <div className="absolute -bottom-1 -right-1">
                                                    {getStatusIcon(connectionStatus.status, connectionStatus.isHealthy)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium">{config.name}</p>
                                                {connectionStatus && getStatusBadge(connectionStatus.status, connectionStatus.isHealthy)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{config.description}</p>
                                            {connectionStatus?.connection?.platformUsername && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Connected as: {connectionStatus.connection.platformUsername}
                                                </p>
                                            )}
                                            {connectionStatus?.lastUsed && (
                                                <p className="text-xs text-muted-foreground">
                                                    Last used: {formatLastUsed(connectionStatus.lastUsed)}
                                                </p>
                                            )}
                                            {connectionStatus?.statusMessage && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {connectionStatus.statusMessage}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isConnected && (
                                            <>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleValidateConnection(platform)}
                                                            disabled={isValidating}
                                                        >
                                                            {isValidating ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Shield className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Test connection</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => runDiagnostics(platform)}
                                                            disabled={isRunningDiagnostics}
                                                        >
                                                            {isRunningDiagnostics ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Settings className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Run diagnostics</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowTroubleshootingModal(platform)}
                                                        >
                                                            <HelpCircle className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Troubleshooting</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setShowDisconnectModal(platform)}
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
                                            </>
                                        )}
                                        {!isConnected && (
                                            <>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setShowOnboardingModal(platform)}
                                                        >
                                                            <HelpCircle className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Setup guide</p>
                                                    </TooltipContent>
                                                </Tooltip>
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
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Facebook Page Selection */}
                {connectionStatuses.find(s => s.platform === 'facebook')?.connection && facebookPages.length > 0 && (
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
                {connectionStatuses.find(s => s.platform === 'instagram')?.connection && (
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
                        <div className="flex gap-3 p-3 bg-muted rounded-lg">
                            <Twitter className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium mb-1">Twitter/X Account</p>
                                <p className="text-xs text-muted-foreground">
                                    Tweets will be posted to your connected Twitter/X account
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Onboarding Modal */}
                <Dialog open={!!showOnboardingModal} onOpenChange={() => setShowOnboardingModal(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                {showOnboardingModal && PLATFORM_CONFIGS[showOnboardingModal].icon}
                                Connect {showOnboardingModal && PLATFORM_CONFIGS[showOnboardingModal].name}
                            </DialogTitle>
                            <DialogDescription>
                                Follow these steps to connect your {showOnboardingModal && PLATFORM_CONFIGS[showOnboardingModal].name} account
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {showOnboardingModal && PLATFORM_CONFIGS[showOnboardingModal].setupSteps.map((step, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                    <p className="text-sm">{step}</p>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowOnboardingModal(null)}>
                                Cancel
                            </Button>
                            <Button onClick={() => {
                                if (showOnboardingModal) {
                                    handleConnect(showOnboardingModal);
                                    setShowOnboardingModal(null);
                                }
                            }}>
                                Start Connection
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Troubleshooting Modal */}
                <Dialog open={!!showTroubleshootingModal} onOpenChange={() => setShowTroubleshootingModal(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5" />
                                Troubleshooting {showTroubleshootingModal && PLATFORM_CONFIGS[showTroubleshootingModal].name}
                            </DialogTitle>
                            <DialogDescription>
                                Common issues and solutions for {showTroubleshootingModal && PLATFORM_CONFIGS[showTroubleshootingModal].name} connections
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {showTroubleshootingModal && PLATFORM_CONFIGS[showTroubleshootingModal].troubleshooting.map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">{item.issue}</p>
                                            <p className="text-sm text-muted-foreground">{item.solution}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowTroubleshootingModal(null)}>
                                Close
                            </Button>
                            <Button onClick={() => {
                                if (showTroubleshootingModal) {
                                    handleValidateConnection(showTroubleshootingModal);
                                    setShowTroubleshootingModal(null);
                                }
                            }}>
                                Test Connection
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Disconnect Modal with Data Retention Options */}
                <Dialog open={!!showDisconnectModal} onOpenChange={() => setShowDisconnectModal(null)}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-red-500" />
                                Disconnect {showDisconnectModal && PLATFORM_CONFIGS[showDisconnectModal].name}
                            </DialogTitle>
                            <DialogDescription>
                                Choose what happens to your data when you disconnect this account
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="retain-data"
                                        checked={disconnectOptions.retainData}
                                        onCheckedChange={(checked) =>
                                            setDisconnectOptions(prev => ({ ...prev, retainData: !!checked }))
                                        }
                                    />
                                    <label htmlFor="retain-data" className="text-sm font-medium">
                                        Keep scheduled posts
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground ml-6">
                                    Scheduled posts will remain but won't be published until you reconnect
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="retain-analytics"
                                        checked={disconnectOptions.retainAnalytics}
                                        onCheckedChange={(checked) =>
                                            setDisconnectOptions(prev => ({ ...prev, retainAnalytics: !!checked }))
                                        }
                                    />
                                    <label htmlFor="retain-analytics" className="text-sm font-medium">
                                        Keep analytics data
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground ml-6">
                                    Historical performance data will be preserved
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="notify-reconnect"
                                        checked={disconnectOptions.notifyOnReconnect}
                                        onCheckedChange={(checked) =>
                                            setDisconnectOptions(prev => ({ ...prev, notifyOnReconnect: !!checked }))
                                        }
                                    />
                                    <label htmlFor="notify-reconnect" className="text-sm font-medium">
                                        Notify me to reconnect
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground ml-6">
                                    Get reminders to reconnect this account for scheduled posts
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDisconnectModal(null)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (showDisconnectModal) {
                                        handleDisconnect(showDisconnectModal);
                                    }
                                }}
                                disabled={disconnectingPlatform === showDisconnectModal}
                            >
                                {disconnectingPlatform === showDisconnectModal ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Disconnecting...
                                    </>
                                ) : (
                                    'Disconnect Account'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Diagnostics Modal */}
                <Dialog open={!!showDiagnosticsModal} onOpenChange={() => setShowDiagnosticsModal(null)}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Connection Diagnostics - {showDiagnosticsModal && PLATFORM_CONFIGS[showDiagnosticsModal].name}
                            </DialogTitle>
                            <DialogDescription>
                                Automated diagnostics and troubleshooting results
                            </DialogDescription>
                        </DialogHeader>
                        {diagnosticsResults && (
                            <div className="space-y-6">
                                {/* Overall Status */}
                                <div className="flex items-center gap-3 p-4 rounded-lg border">
                                    {diagnosticsResults.overallStatus === 'healthy' && (
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    )}
                                    {diagnosticsResults.overallStatus === 'warning' && (
                                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                                    )}
                                    {diagnosticsResults.overallStatus === 'error' && (
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    )}
                                    <div>
                                        <p className="font-medium">
                                            Overall Status: {diagnosticsResults.overallStatus === 'healthy' ? 'Healthy' :
                                                diagnosticsResults.overallStatus === 'warning' ? 'Warning' : 'Error'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {diagnosticsResults.tests.length} tests completed
                                        </p>
                                    </div>
                                </div>

                                {/* Test Results */}
                                <div className="space-y-3">
                                    <h4 className="font-medium">Test Results</h4>
                                    {diagnosticsResults.tests.map((test: any, index: number) => (
                                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                                            {test.status === 'pass' && (
                                                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            {test.status === 'warning' && (
                                                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            {test.status === 'fail' && (
                                                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{test.test}</p>
                                                <p className="text-sm text-muted-foreground">{test.message}</p>
                                                {test.suggestion && (
                                                    <p className="text-sm text-blue-600 mt-1">
                                                        💡 {test.suggestion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Recommendations */}
                                {diagnosticsResults.recommendations.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium">Recommendations</h4>
                                        <div className="space-y-2">
                                            {diagnosticsResults.recommendations.map((rec: string, index: number) => (
                                                <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
                                                    <p className="text-sm">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDiagnosticsModal(null)}>
                                Close
                            </Button>
                            {showDiagnosticsModal && (
                                <Button onClick={() => {
                                    handleValidateConnection(showDiagnosticsModal);
                                    setShowDiagnosticsModal(null);
                                }}>
                                    Test Connection
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
