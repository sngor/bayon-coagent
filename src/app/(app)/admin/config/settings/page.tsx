'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, AlertCircle, Save } from 'lucide-react';
import {
    getPlatformSettings,
    updatePlatformSetting,
} from '@/features/admin/actions/admin-actions';
import { PlatformSettings } from '@/services/admin/platform-config-service';

type SettingCategory = 'general' | 'ai' | 'billing' | 'email' | 'security';

export default function PlatformSettingsPage() {
    const [settings, setSettings] = useState<PlatformSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<SettingCategory>('general');
    const [editingSetting, setEditingSetting] = useState<PlatformSettings | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const { toast } = useToast();

    useEffect(() => {
        loadSettings();
    }, [selectedCategory]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const result = await getPlatformSettings(selectedCategory);

            if (result.success && result.data) {
                setSettings(result.data);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load platform settings',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to load platform settings',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSetting = async () => {
        if (!editingSetting) return;

        try {
            setUpdating(editingSetting.settingId);

            // Parse value based on type
            let parsedValue: any = editValue;
            try {
                // Try to parse as JSON for objects/arrays
                parsedValue = JSON.parse(editValue);
            } catch {
                // If not JSON, check if it's a number or boolean
                if (editValue === 'true') parsedValue = true;
                else if (editValue === 'false') parsedValue = false;
                else if (!isNaN(Number(editValue)) && editValue !== '') {
                    parsedValue = Number(editValue);
                }
            }

            const result = await updatePlatformSetting(
                editingSetting.category,
                editingSetting.key,
                parsedValue
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: result.message,
                });
                setEditingSetting(null);
                setEditValue('');
                await loadSettings();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update setting',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update setting',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    const openEditDialog = (setting: PlatformSettings) => {
        setEditingSetting(setting);
        setEditValue(
            typeof setting.value === 'object'
                ? JSON.stringify(setting.value, null, 2)
                : String(setting.value)
        );
    };

    const getCategoryColor = (category: SettingCategory) => {
        const colors = {
            general: 'bg-blue-500/10 text-blue-500',
            ai: 'bg-purple-500/10 text-purple-500',
            billing: 'bg-green-500/10 text-green-500',
            email: 'bg-orange-500/10 text-orange-500',
            security: 'bg-red-500/10 text-red-500',
        };
        return colors[category];
    };

    const filteredSettings = settings.filter((s) => s.category === selectedCategory);

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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Configure platform-wide settings and preferences
                </p>
            </div>

            {/* Category Selector */}
            <Card>
                <CardHeader>
                    <CardTitle>Category</CardTitle>
                    <CardDescription>Select a category to view and edit settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedCategory}
                        onValueChange={(value) => setSelectedCategory(value as SettingCategory)}
                    >
                        <SelectTrigger className="w-full md:w-[300px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="ai">AI & Models</SelectItem>
                            <SelectItem value="billing">Billing & Payments</SelectItem>
                            <SelectItem value="email">Email & Notifications</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Settings List */}
            <div className="space-y-4">
                {filteredSettings.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Settings Found</h3>
                            <p className="text-muted-foreground text-center">
                                No settings are configured for the {selectedCategory} category yet
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredSettings.map((setting) => (
                        <Card key={setting.settingId}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <CardTitle className="text-lg">{setting.key}</CardTitle>
                                            <Badge
                                                variant="secondary"
                                                className={getCategoryColor(setting.category)}
                                            >
                                                {setting.category}
                                            </Badge>
                                        </div>
                                        {setting.description && (
                                            <CardDescription>{setting.description}</CardDescription>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEditDialog(setting)}
                                    >
                                        Edit
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Current Value */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Current Value</Label>
                                    <div className="p-3 bg-muted rounded-md">
                                        <code className="text-sm">
                                            {typeof setting.value === 'object'
                                                ? JSON.stringify(setting.value, null, 2)
                                                : String(setting.value)}
                                        </code>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                                    <span>
                                        Updated: {new Date(setting.updatedAt).toLocaleDateString()}
                                    </span>
                                    <span>By: {setting.updatedBy}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog
                open={!!editingSetting}
                onOpenChange={(open) => !open && setEditingSetting(null)}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Setting</DialogTitle>
                        <DialogDescription>
                            Update the value for {editingSetting?.key}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Setting Key</Label>
                            <Input value={editingSetting?.key || ''} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Input value={editingSetting?.category || ''} disabled />
                        </div>
                        {editingSetting?.description && (
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <p className="text-sm text-muted-foreground">
                                    {editingSetting.description}
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit-value">Value *</Label>
                            <textarea
                                id="edit-value"
                                className="w-full min-h-[200px] p-3 rounded-md border bg-background font-mono text-sm"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Enter value (JSON, string, number, or boolean)"
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a valid value. For objects/arrays, use JSON format.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setEditingSetting(null);
                                setEditValue('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateSetting}
                            disabled={!editValue || updating === editingSetting?.settingId}
                        >
                            {updating === editingSetting?.settingId && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
