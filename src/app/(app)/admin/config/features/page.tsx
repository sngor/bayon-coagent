'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Settings, Users, Target, AlertCircle } from 'lucide-react';
import {
    getFeatureFlags,
    updateFeatureFlag,
    createFeatureFlag,
} from '@/features/admin/actions/admin-actions';
import { FeatureFlag } from '@/services/admin/platform-config-service';

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
    const { toast } = useToast();

    // Form state for create/edit
    const [formData, setFormData] = useState({
        flagId: '',
        name: '',
        description: '',
        enabled: false,
        rolloutPercentage: 0,
        targetUsers: '',
        targetRoles: '',
    });

    useEffect(() => {
        loadFlags();
    }, []);

    const loadFlags = async () => {
        try {
            setLoading(true);
            const result = await getFeatureFlags();

            if (result.success && result.data) {
                setFlags(result.data);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load feature flags',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load feature flags',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (flag: FeatureFlag) => {
        try {
            setUpdating(flag.flagId);

            const result = await updateFeatureFlag(flag.flagId, {
                enabled: !flag.enabled,
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                await loadFlags();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update feature flag',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update feature flag',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const handleUpdateRollout = async (flag: FeatureFlag, percentage: number) => {
        try {
            setUpdating(flag.flagId);

            const result = await updateFeatureFlag(flag.flagId, {
                rolloutPercentage: percentage,
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                await loadFlags();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update rollout percentage',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update rollout percentage',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const handleCreateFlag = async () => {
        try {
            setUpdating('create');

            const targetUsers = formData.targetUsers
                ? formData.targetUsers.split(',').map((u) => u.trim()).filter(Boolean)
                : undefined;

            const targetRoles = formData.targetRoles
                ? formData.targetRoles.split(',').map((r) => r.trim()).filter(Boolean)
                : undefined;

            const result = await createFeatureFlag(
                formData.flagId,
                formData.name,
                formData.description,
                formData.enabled,
                formData.rolloutPercentage,
                targetUsers,
                targetRoles
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                setCreateDialogOpen(false);
                resetForm();
                await loadFlags();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to create feature flag',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create feature flag',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const handleEditFlag = async () => {
        if (!editingFlag) return;

        try {
            setUpdating('edit');

            const targetUsers = formData.targetUsers
                ? formData.targetUsers.split(',').map((u) => u.trim()).filter(Boolean)
                : undefined;

            const targetRoles = formData.targetRoles
                ? formData.targetRoles.split(',').map((r) => r.trim()).filter(Boolean)
                : undefined;

            const result = await updateFeatureFlag(editingFlag.flagId, {
                name: formData.name,
                description: formData.description,
                enabled: formData.enabled,
                rolloutPercentage: formData.rolloutPercentage,
                targetUsers,
                targetRoles,
            });

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                setEditingFlag(null);
                resetForm();
                await loadFlags();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update feature flag',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update feature flag',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const openEditDialog = (flag: FeatureFlag) => {
        setEditingFlag(flag);
        setFormData({
            flagId: flag.flagId,
            name: flag.name,
            description: flag.description,
            enabled: flag.enabled,
            rolloutPercentage: flag.rolloutPercentage,
            targetUsers: flag.targetUsers?.join(', ') || '',
            targetRoles: flag.targetRoles?.join(', ') || '',
        });
    };

    const resetForm = () => {
        setFormData({
            flagId: '',
            name: '',
            description: '',
            enabled: false,
            rolloutPercentage: 0,
            targetUsers: '',
            targetRoles: '',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Feature Flags</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage feature flags and control feature rollout across the platform
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Flag
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Feature Flag</DialogTitle>
                            <DialogDescription>
                                Create a new feature flag to control feature availability
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="flagId">Flag ID *</Label>
                                <Input
                                    id="flagId"
                                    placeholder="e.g., new-dashboard"
                                    value={formData.flagId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, flagId: e.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Unique identifier for the flag (lowercase, hyphens allowed)
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., New Dashboard"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what this feature flag controls"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="enabled"
                                    checked={formData.enabled}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, enabled: checked })
                                    }
                                />
                                <Label htmlFor="enabled">Enabled</Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Rollout Percentage: {formData.rolloutPercentage}%</Label>
                                <Slider
                                    value={[formData.rolloutPercentage]}
                                    onValueChange={([value]) =>
                                        setFormData({ ...formData, rolloutPercentage: value })
                                    }
                                    max={100}
                                    step={5}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Percentage of users who will see this feature
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetUsers">Target Users (Optional)</Label>
                                <Input
                                    id="targetUsers"
                                    placeholder="user-id-1, user-id-2"
                                    value={formData.targetUsers}
                                    onChange={(e) =>
                                        setFormData({ ...formData, targetUsers: e.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Comma-separated list of user IDs
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="targetRoles">Target Roles (Optional)</Label>
                                <Input
                                    id="targetRoles"
                                    placeholder="admin, super_admin"
                                    value={formData.targetRoles}
                                    onChange={(e) =>
                                        setFormData({ ...formData, targetRoles: e.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Comma-separated list of roles
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setCreateDialogOpen(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateFlag}
                                disabled={
                                    !formData.flagId || !formData.name || updating === 'create'
                                }
                            >
                                {updating === 'create' && (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                )}
                                Create Flag
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
                        <Settings className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{flags.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {flags.filter((f) => f.enabled).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Targeted</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {
                                flags.filter(
                                    (f) =>
                                        (f.targetUsers && f.targetUsers.length > 0) ||
                                        (f.targetRoles && f.targetRoles.length > 0)
                                ).length
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Feature Flags List */}
            <div className="space-y-4">
                {flags.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Feature Flags</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Create your first feature flag to start controlling feature rollout
                            </p>
                            <Button onClick={() => setCreateDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Flag
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    flags.map((flag) => (
                        <Card key={flag.flagId}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle>{flag.name}</CardTitle>
                                            {flag.enabled ? (
                                                <Badge variant="default">Enabled</Badge>
                                            ) : (
                                                <Badge variant="secondary">Disabled</Badge>
                                            )}
                                        </div>
                                        <CardDescription>
                                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                                {flag.flagId}
                                            </code>
                                        </CardDescription>
                                        {flag.description && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {flag.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={flag.enabled}
                                            onCheckedChange={() => handleToggleEnabled(flag)}
                                            disabled={updating === flag.flagId}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(flag)}
                                        >
                                            Edit
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Rollout Percentage */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm">
                                            Rollout: {flag.rolloutPercentage}%
                                        </Label>
                                        {updating === flag.flagId && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                    </div>
                                    <Slider
                                        value={[flag.rolloutPercentage]}
                                        onValueChange={([value]) =>
                                            handleUpdateRollout(flag, value)
                                        }
                                        max={100}
                                        step={5}
                                        disabled={updating === flag.flagId}
                                    />
                                </div>

                                {/* Targeting Info */}
                                {((flag.targetUsers && flag.targetUsers.length > 0) ||
                                    (flag.targetRoles && flag.targetRoles.length > 0)) && (
                                        <div className="space-y-2 pt-2 border-t">
                                            <Label className="text-sm font-medium">Targeting</Label>
                                            {flag.targetUsers && flag.targetUsers.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">
                                                        {flag.targetUsers.length} Users
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {flag.targetUsers.slice(0, 3).join(', ')}
                                                        {flag.targetUsers.length > 3 && '...'}
                                                    </span>
                                                </div>
                                            )}
                                            {flag.targetRoles && flag.targetRoles.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">Roles</Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {flag.targetRoles.join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                    <span>
                                        Created: {new Date(flag.createdAt).toLocaleDateString()}
                                    </span>
                                    <span>
                                        Updated: {new Date(flag.updatedAt).toLocaleDateString()}
                                    </span>
                                    <span>By: {flag.createdBy}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingFlag} onOpenChange={(open) => !open && setEditingFlag(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Feature Flag</DialogTitle>
                        <DialogDescription>
                            Update the feature flag configuration
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Flag ID</Label>
                            <Input value={formData.flagId} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="edit-enabled"
                                checked={formData.enabled}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, enabled: checked })
                                }
                            />
                            <Label htmlFor="edit-enabled">Enabled</Label>
                        </div>
                        <div className="space-y-2">
                            <Label>Rollout Percentage: {formData.rolloutPercentage}%</Label>
                            <Slider
                                value={[formData.rolloutPercentage]}
                                onValueChange={([value]) =>
                                    setFormData({ ...formData, rolloutPercentage: value })
                                }
                                max={100}
                                step={5}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-targetUsers">Target Users (Optional)</Label>
                            <Input
                                id="edit-targetUsers"
                                placeholder="user-id-1, user-id-2"
                                value={formData.targetUsers}
                                onChange={(e) =>
                                    setFormData({ ...formData, targetUsers: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-targetRoles">Target Roles (Optional)</Label>
                            <Input
                                id="edit-targetRoles"
                                placeholder="admin, super_admin"
                                value={formData.targetRoles}
                                onChange={(e) =>
                                    setFormData({ ...formData, targetRoles: e.target.value })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingFlag(null);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditFlag}
                            disabled={!formData.name || updating === 'edit'}
                        >
                            {updating === 'edit' && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
