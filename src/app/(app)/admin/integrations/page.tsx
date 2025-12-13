'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
    Key,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Activity,
    Copy,
} from 'lucide-react';
import {
    generateAPIKey,
    getAllAPIKeys,
    getAPIKeyUsage,
    revokeAPIKey,
    getRateLimitAlerts,
    getIntegrations,
    updateIntegrationStatus,
} from '@/features/admin/actions/admin-actions';
import { APIKey, APIUsageMetrics, ThirdPartyIntegration, RateLimitAlert } from '@/services/admin/api-key-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function IntegrationsPage() {
    const { toast } = useToast();
    const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
    const [integrations, setIntegrations] = useState<ThirdPartyIntegration[]>([]);
    const [rateLimitAlerts, setRateLimitAlerts] = useState<RateLimitAlert[]>([]);
    const [selectedKeyUsage, setSelectedKeyUsage] = useState<APIUsageMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showRevokeDialog, setShowRevokeDialog] = useState(false);
    const [showUsageDialog, setShowUsageDialog] = useState(false);
    const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
    const [selectedKey, setSelectedKey] = useState<APIKey | null>(null);
    const [newKeyData, setNewKeyData] = useState<{ keyId: string; plainKey: string } | null>(null);
    const [showPlainKey, setShowPlainKey] = useState(false);

    // Form state
    const [keyName, setKeyName] = useState('');
    const [permissions, setPermissions] = useState<string[]>([]);

    const availablePermissions = [
        'read:analytics',
        'write:analytics',
        'read:users',
        'write:users',
        'read:content',
        'write:content',
        'read:reports',
        'write:reports',
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [keysResult, integrationsResult, alertsResult] = await Promise.all([
                getAllAPIKeys({ status: 'active' }),
                getIntegrations(),
                getRateLimitAlerts({ limit: 10 }),
            ]);

            if (keysResult.success && keysResult.data) {
                setApiKeys(keysResult.data.keys);
            }

            if (integrationsResult.success && integrationsResult.data) {
                setIntegrations(integrationsResult.data);
            }

            if (alertsResult.success && alertsResult.data) {
                setRateLimitAlerts(alertsResult.data);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load integrations data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateKey = async () => {
        if (!keyName.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a key name',
                variant: 'destructive',
            });
            return;
        }

        if (permissions.length === 0) {
            toast({
                title: 'Error',
                description: 'Please select at least one permission',
                variant: 'destructive',
            });
            return;
        }

        try {
            const result = await generateAPIKey(keyName, permissions);

            if (result.success && result.data) {
                setNewKeyData({
                    keyId: result.data.keyId,
                    plainKey: result.data.plainKey,
                });
                setShowCreateDialog(false);
                setShowNewKeyDialog(true);
                setKeyName('');
                setPermissions([]);
                loadData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to create API key',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error creating API key:', error);
            toast({
                title: 'Error',
                description: 'Failed to create API key',
                variant: 'destructive',
            });
        }
    };

    const handleRevokeKey = async () => {
        if (!selectedKey) return;

        try {
            const result = await revokeAPIKey(selectedKey.keyId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'API key revoked successfully',
                });
                setShowRevokeDialog(false);
                setSelectedKey(null);
                loadData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to revoke API key',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error revoking API key:', error);
            toast({
                title: 'Error',
                description: 'Failed to revoke API key',
                variant: 'destructive',
            });
        }
    };

    const handleViewUsage = async (key: APIKey) => {
        try {
            const result = await getAPIKeyUsage(key.keyId);

            if (result.success && result.data) {
                setSelectedKeyUsage(result.data);
                setShowUsageDialog(true);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to fetch API key usage',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error fetching API key usage:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch API key usage',
                variant: 'destructive',
            });
        }
    };

    const handleUpdateIntegrationStatus = async (
        integrationId: string,
        status: 'active' | 'inactive' | 'error'
    ) => {
        try {
            const result = await updateIntegrationStatus(integrationId, status);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Integration status updated successfully',
                });
                loadData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update integration status',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error updating integration status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update integration status',
                variant: 'destructive',
            });
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: 'Copied',
            description: 'API key copied to clipboard',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-500">Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            case 'revoked':
                return <Badge variant="destructive">Revoked</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading integrations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">API Keys & Integrations</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage API keys and third-party integrations
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create API Key
                </Button>
            </div>

            {/* Rate Limit Alerts */}
            {rateLimitAlerts.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Rate Limit Violations Detected</AlertTitle>
                    <AlertDescription>
                        {rateLimitAlerts.length} API key(s) have exceeded rate limits in the last 24 hours.
                    </AlertDescription>
                </Alert>
            )}

            {/* Third-Party Integrations */}
            <Card>
                <CardHeader>
                    <CardTitle>Third-Party Integrations</CardTitle>
                    <CardDescription>
                        Manage connections to external services
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {integrations.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No integrations configured
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Sync</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {integrations.map((integration) => (
                                    <TableRow key={integration.integrationId}>
                                        <TableCell className="font-medium">
                                            {integration.name}
                                        </TableCell>
                                        <TableCell>{integration.provider}</TableCell>
                                        <TableCell>{getStatusBadge(integration.status)}</TableCell>
                                        <TableCell>
                                            {integration.lastSync
                                                ? new Date(integration.lastSync).toLocaleString()
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleUpdateIntegrationStatus(
                                                        integration.integrationId,
                                                        integration.status === 'active'
                                                            ? 'inactive'
                                                            : 'active'
                                                    )
                                                }
                                            >
                                                {integration.status === 'active'
                                                    ? 'Disable'
                                                    : 'Enable'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* API Keys */}
            <Card>
                <CardHeader>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>
                        Manage API keys for programmatic access
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {apiKeys.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No API keys created yet
                        </p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Last Used</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {apiKeys.map((key) => (
                                    <TableRow key={key.keyId}>
                                        <TableCell className="font-medium">{key.name}</TableCell>
                                        <TableCell>
                                            {new Date(key.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {key.lastUsed
                                                ? new Date(key.lastUsed).toLocaleString()
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(key.status)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewUsage(key)}
                                            >
                                                <Activity className="h-4 w-4 mr-1" />
                                                Usage
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedKey(key);
                                                    setShowRevokeDialog(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Revoke
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create API Key Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                            Create a new API key for programmatic access. The key will only be shown once.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="keyName">Key Name</Label>
                            <Input
                                id="keyName"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                placeholder="e.g., Production API Key"
                            />
                        </div>
                        <div>
                            <Label>Permissions</Label>
                            <div className="space-y-2 mt-2">
                                {availablePermissions.map((permission) => (
                                    <div key={permission} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={permission}
                                            checked={permissions.includes(permission)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setPermissions([...permissions, permission]);
                                                } else {
                                                    setPermissions(
                                                        permissions.filter((p) => p !== permission)
                                                    );
                                                }
                                            }}
                                        />
                                        <Label htmlFor={permission} className="font-normal">
                                            {permission}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateKey}>Create Key</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Key Created Dialog */}
            <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>API Key Created</DialogTitle>
                        <DialogDescription>
                            Save this key securely. It will only be shown once.
                        </DialogDescription>
                    </DialogHeader>
                    {newKeyData && (
                        <div className="space-y-4">
                            <Alert>
                                <Key className="h-4 w-4" />
                                <AlertTitle>Important</AlertTitle>
                                <AlertDescription>
                                    Copy this key now. You won't be able to see it again.
                                </AlertDescription>
                            </Alert>
                            <div>
                                <Label>API Key</Label>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Input
                                        value={newKeyData.plainKey}
                                        type={showPlainKey ? 'text' : 'password'}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setShowPlainKey(!showPlainKey)}
                                    >
                                        {showPlainKey ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(newKeyData.plainKey)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                setShowNewKeyDialog(false);
                                setNewKeyData(null);
                                setShowPlainKey(false);
                            }}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Key Dialog */}
            <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke API Key</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke this API key? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedKey && (
                        <div className="py-4">
                            <p className="font-medium">{selectedKey.name}</p>
                            <p className="text-sm text-muted-foreground">
                                Created {new Date(selectedKey.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRevokeDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRevokeKey}>
                            Revoke Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Usage Dialog */}
            <Dialog open={showUsageDialog} onOpenChange={setShowUsageDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>API Key Usage</DialogTitle>
                        <DialogDescription>
                            Usage statistics and rate limit information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedKeyUsage && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Total Requests
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">
                                            {selectedKeyUsage.totalRequests.toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Requests Today
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">
                                            {selectedKeyUsage.requestsToday.toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Requests This Week
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">
                                            {selectedKeyUsage.requestsThisWeek.toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-medium">
                                            Requests This Month
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-2xl font-bold">
                                            {selectedKeyUsage.requestsThisMonth.toLocaleString()}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Rate Limit Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Limit
                                            </span>
                                            <span className="text-sm font-medium">
                                                {selectedKeyUsage.rateLimitStatus.limit} requests/hour
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Remaining
                                            </span>
                                            <span className="text-sm font-medium">
                                                {selectedKeyUsage.rateLimitStatus.remaining}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                Resets At
                                            </span>
                                            <span className="text-sm font-medium">
                                                {new Date(
                                                    selectedKeyUsage.rateLimitStatus.resetAt
                                                ).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">
                                        Usage by Endpoint
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(selectedKeyUsage.usageByEndpoint).map(
                                            ([endpoint, count]) => (
                                                <div
                                                    key={endpoint}
                                                    className="flex justify-between items-center"
                                                >
                                                    <span className="text-sm font-mono">
                                                        {endpoint}
                                                    </span>
                                                    <span className="text-sm font-medium">
                                                        {count.toLocaleString()}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowUsageDialog(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
