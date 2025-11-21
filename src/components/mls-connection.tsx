/**
 * MLS Connection Component
 * UI for managing MLS provider connections
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock,
    Home,
    Loader2,
    RefreshCw,
    XCircle,
} from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';
import { useUser } from '@/aws/auth';
import { useToast } from '@/hooks/use-toast';
import type { MLSConnection } from '@/integrations/mls/types';

// MLS Provider configurations
const MLS_PROVIDERS = [
    { value: 'flexmls', label: 'FlexMLS', description: 'FBS/FlexMLS' },
    { value: 'crmls', label: 'CRMLS', description: 'California Regional MLS' },
    { value: 'bright', label: 'BrightMLS', description: 'Bright MLS' },
    { value: 'mlsgrid', label: 'MLS Grid', description: 'MLS Grid Network' },
] as const;

interface MLSConnectionProps {
    onConnectionChange?: () => void;
}

export function MLSConnection({ onConnectionChange }: MLSConnectionProps) {
    const { user } = useUser();
    const { toast } = useToast();

    const [connection, setConnection] = useState<MLSConnection | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [showConnectDialog, setShowConnectDialog] = useState(false);
    const [syncHistory, setSyncHistory] = useState<Array<{ timestamp: number; status: string }>>([]);

    // Form state
    const [selectedProvider, setSelectedProvider] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mlsId, setMlsId] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Load connection on mount
    useEffect(() => {
        loadConnection();
    }, [user]);

    async function loadConnection() {
        if (!user) {
            setIsLoading(false);
            return;
        }

        try {
            // Import actions dynamically to avoid circular dependencies
            const { getMLSConnectionsAction } = await import('@/app/mls-actions');
            const result = await getMLSConnectionsAction(user.id);

            if (result.success && result.data && result.data.length > 0) {
                // Get the first (most recent) connection
                setConnection(result.data[0]);

                // Load sync history
                const { getMLSSyncHistoryAction } = await import('@/app/mls-actions');
                const historyResult = await getMLSSyncHistoryAction(user.id);
                if (historyResult.success && historyResult.data) {
                    setSyncHistory(historyResult.data);
                }
            }
        } catch (error) {
            console.error('Failed to load MLS connection:', error);
            toast({
                title: 'Error',
                description: 'Failed to load MLS connection',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleConnect() {
        // Validate form
        const errors: Record<string, string> = {};
        if (!selectedProvider) errors.provider = 'Please select an MLS provider';
        if (!username) errors.username = 'Username is required';
        if (!password) errors.password = 'Password is required';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsConnecting(true);
        setFormErrors({});

        try {
            const { connectMLSAction } = await import('@/app/mls-actions');
            const result = await connectMLSAction({
                provider: selectedProvider,
                username,
                password,
                mlsId: mlsId || undefined,
            });

            if (result.success) {
                toast({
                    title: 'Connection Successful',
                    description: `Successfully connected to ${MLS_PROVIDERS.find(p => p.value === selectedProvider)?.label}`,
                });

                // Reset form
                setShowConnectDialog(false);
                setSelectedProvider('');
                setUsername('');
                setPassword('');
                setMlsId('');

                // Reload connection
                await loadConnection();

                // Notify parent
                onConnectionChange?.();
            } else {
                throw new Error(result.error || 'Failed to connect');
            }
        } catch (error) {
            console.error('Failed to connect to MLS:', error);
            toast({
                title: 'Connection Failed',
                description: error instanceof Error ? error.message : 'Failed to connect to MLS provider',
                variant: 'destructive',
            });
        } finally {
            setIsConnecting(false);
        }
    }

    async function handleDisconnect() {
        if (!user || !connection) return;

        setIsDisconnecting(true);

        try {
            const { disconnectMLSAction } = await import('@/app/mls-actions');
            const result = await disconnectMLSAction(user.id, connection.id);

            if (result.success) {
                toast({
                    title: 'Disconnected',
                    description: 'Successfully disconnected from MLS provider',
                });

                setConnection(null);
                setSyncHistory([]);

                // Notify parent
                onConnectionChange?.();
            } else {
                throw new Error(result.error || 'Failed to disconnect');
            }
        } catch (error) {
            console.error('Failed to disconnect from MLS:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to disconnect',
                variant: 'destructive',
            });
        } finally {
            setIsDisconnecting(false);
        }
    }

    async function handleSync() {
        if (!user || !connection) return;

        setIsSyncing(true);

        try {
            const { importMLSListings } = await import('@/app/mls-actions');
            const result = await importMLSListings(connection.id);

            if (result.success && result.data) {
                toast({
                    title: 'Sync Complete',
                    description: `Imported ${result.data.successfulImports} of ${result.data.totalListings} listings`,
                });

                // Reload sync history
                await loadConnection();
            } else {
                throw new Error(result.error || 'Failed to sync');
            }
        } catch (error) {
            console.error('Failed to sync MLS listings:', error);
            toast({
                title: 'Sync Failed',
                description: error instanceof Error ? error.message : 'Failed to sync listings',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    }

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

    function isTokenExpired(): boolean {
        if (!connection) return false;
        return Date.now() >= connection.expiresAt;
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <LoadingDots />
                        <span>Loading connection...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>MLS Connection</CardTitle>
                    <CardDescription>
                        Connect your MLS account to automatically import and sync your listings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {connection ? (
                        <>
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                        <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">
                                                {MLS_PROVIDERS.find(p => p.value === connection.provider)?.label || connection.provider}
                                            </p>
                                            {!isTokenExpired() ? (
                                                <Badge variant="outline" className="gap-1">
                                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                    Connected
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="gap-1">
                                                    <XCircle className="h-3 w-3 text-red-600" />
                                                    Expired
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {MLS_PROVIDERS.find(p => p.value === connection.provider)?.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSync}
                                        disabled={isSyncing || isTokenExpired()}
                                    >
                                        {isSyncing ? (
                                            <>
                                                <LoadingDots size="sm" className="mr-2" />
                                                Syncing...
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2" />
                                                Sync Now
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDisconnect}
                                        disabled={isDisconnecting}
                                    >
                                        {isDisconnecting ? (
                                            <>
                                                <LoadingDots size="sm" className="mr-2" />
                                                Disconnecting...
                                            </>
                                        ) : (
                                            'Disconnect'
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {isTokenExpired() && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Your MLS connection has expired. Please reconnect to continue syncing listings.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <Home className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">No MLS Connection</p>
                                    <p className="text-sm text-muted-foreground">
                                        Connect your MLS account to import listings
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => setShowConnectDialog(true)}>
                                Connect MLS
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Connection Details */}
            {connection && (
                <Card>
                    <CardHeader>
                        <CardTitle>Connection Details</CardTitle>
                        <CardDescription>
                            Your MLS account information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Agent ID</span>
                            <span className="text-sm font-medium">{connection.agentId}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Brokerage ID</span>
                            <span className="text-sm font-medium">{connection.brokerageId}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                            <span className="text-sm text-muted-foreground">Connected</span>
                            <span className="text-sm font-medium">
                                {new Date(connection.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-muted-foreground">Token Expires</span>
                            <span className="text-sm font-medium">
                                {new Date(connection.expiresAt).toLocaleDateString()}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Sync History */}
            {connection && syncHistory.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Sync History</CardTitle>
                        <CardDescription>
                            Recent listing synchronization activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {syncHistory.slice(0, 5).map((sync, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {formatTimestamp(sync.timestamp)}
                                        </span>
                                    </div>
                                    <Badge variant={sync.status === 'success' ? 'default' : 'destructive'}>
                                        {sync.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
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
                        <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">MLS Credentials</p>
                            <p className="text-xs text-muted-foreground">
                                Use the same credentials you use to log into your MLS system
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-muted rounded-lg">
                        <RefreshCw className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Automatic Sync</p>
                            <p className="text-xs text-muted-foreground">
                                Listings are automatically synced every 15 minutes to keep your data up-to-date
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-muted rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium mb-1">Secure Connection</p>
                            <p className="text-xs text-muted-foreground">
                                Your credentials are encrypted and stored securely using AWS KMS
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Connect Dialog */}
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Connect MLS Account</DialogTitle>
                        <DialogDescription>
                            Enter your MLS credentials to connect your account
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="provider">MLS Provider</Label>
                            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                                <SelectTrigger id="provider">
                                    <SelectValue placeholder="Select your MLS provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    {MLS_PROVIDERS.map((provider) => (
                                        <SelectItem key={provider.value} value={provider.value}>
                                            <div>
                                                <div className="font-medium">{provider.label}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {provider.description}
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.provider && (
                                <p className="text-sm text-destructive">{formErrors.provider}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your MLS username"
                            />
                            {formErrors.username && (
                                <p className="text-sm text-destructive">{formErrors.username}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your MLS password"
                            />
                            {formErrors.password && (
                                <p className="text-sm text-destructive">{formErrors.password}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mlsId">MLS ID (Optional)</Label>
                            <Input
                                id="mlsId"
                                type="text"
                                value={mlsId}
                                onChange={(e) => setMlsId(e.target.value)}
                                placeholder="Enter your MLS ID if required"
                            />
                            <p className="text-xs text-muted-foreground">
                                Some MLS providers require an additional MLS ID
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConnectDialog(false)}
                            disabled={isConnecting}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleConnect} disabled={isConnecting}>
                            {isConnecting ? (
                                <>
                                    <LoadingDots size="sm" className="mr-2" />
                                    Connecting...
                                </>
                            ) : (
                                'Connect'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
