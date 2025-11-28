'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getOrganizationSettingsAction, updateOrganizationSettingsAction } from '@/app/admin-actions';
import { Building2, Save, Palette } from 'lucide-react';
import { ProfileImageUpload } from '@/components/profile-image-upload';

interface OrganizationSettings {
    name: string;
    description: string;
    website: string;
    allowMemberInvites: boolean;
    requireApproval: boolean;
    logo?: string;
    brandColor?: string;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<OrganizationSettings>({
        name: '',
        description: '',
        website: '',
        allowMemberInvites: true,
        requireApproval: false,
        logo: '',
        brandColor: '#0f172a',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            const result = await getOrganizationSettingsAction();
            if (result.message === 'success' && result.data) {
                setSettings(result.data);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        setIsSaving(true);
        try {
            const result = await updateOrganizationSettingsAction(settings);

            if (result.message === 'success') {
                toast({
                    title: 'Settings saved',
                    description: 'Your organization settings have been updated',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Card className="overflow-hidden bg-background/50 border-primary/20">
                    <CardGradientMesh>
                        <CardContent className="pt-6 relative z-10">
                            <p className="text-center text-muted-foreground">Loading settings...</p>
                        </CardContent>
                    </CardGradientMesh>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Organization Information</CardTitle>
                                <CardDescription>Manage your organization's basic information</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input
                                id="name"
                                value={settings.name}
                                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                placeholder="Acme Real Estate"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={settings.description}
                                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                                placeholder="Brief description of your organization"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                type="url"
                                value={settings.website}
                                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                placeholder="https://example.com"
                            />
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Palette className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Branding & Appearance</CardTitle>
                                <CardDescription>Customize the look and feel of your portal</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <div className="space-y-4">
                            <Label>Team Logo</Label>
                            <div className="flex items-center gap-6">
                                <ProfileImageUpload
                                    userId="organization-logo"
                                    currentImageUrl={settings.logo}
                                    onImageUpdate={(url) => setSettings({ ...settings, logo: url })}
                                    size="lg"
                                    userName={settings.name || 'Organization'}
                                />
                                <div className="text-sm text-muted-foreground">
                                    <p>Upload your organization's logo.</p>
                                    <p>Recommended size: 512x512px.</p>
                                    <p>Supported formats: PNG, JPG, WebP.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="brandColor">Primary Brand Color</Label>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Input
                                        id="brandColorPicker"
                                        type="color"
                                        value={settings.brandColor || '#0f172a'}
                                        onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                                        className="h-10 w-14 p-1 cursor-pointer"
                                    />
                                </div>
                                <Input
                                    id="brandColor"
                                    type="text"
                                    value={settings.brandColor || '#0f172a'}
                                    onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                                    placeholder="#0f172a"
                                    className="font-mono w-32"
                                />
                                <div
                                    className="h-10 w-10 rounded-md border border-border"
                                    style={{ backgroundColor: settings.brandColor || '#0f172a' }}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                This color will be used for buttons, links, and other accents.
                            </p>
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            <Card className="overflow-hidden bg-background/50 border-primary/20">
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <CardTitle>Team Settings</CardTitle>
                        <CardDescription>Configure how your team operates</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="allowMemberInvites">Allow Member Invites</Label>
                                <p className="text-sm text-muted-foreground">
                                    Let team members invite new people
                                </p>
                            </div>
                            <Switch
                                id="allowMemberInvites"
                                checked={settings.allowMemberInvites}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, allowMemberInvites: checked })
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="requireApproval">Require Approval</Label>
                                <p className="text-sm text-muted-foreground">
                                    New members need admin approval to join
                                </p>
                            </div>
                            <Switch
                                id="requireApproval"
                                checked={settings.requireApproval}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, requireApproval: checked })
                                }
                            />
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
