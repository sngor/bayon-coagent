'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { TabToggle, TabToggleContent } from '@/components/ui/tab-toggle';
import { Progress } from '@/components/ui/progress';
import { useFeatureToggles, FeatureToggle } from '@/lib/feature-toggles';
import {
    Settings,
    CheckCircle,
    XCircle,
    Target,
    Beaker,
    BarChart3,
    Zap,
    Search,
    Plus,
    Eye,
    Edit,
    Play,
    Pause,
    Wand2,
    Calculator,
    Library,
    GraduationCap,
    MessageSquare,
    Users,
    Trash2,
    DoorOpen
} from 'lucide-react';
import { AISparkleIcon } from '@/components/ui/real-estate-icons';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createFeatureAction, updateFeatureAction, toggleFeatureAction, deleteFeatureAction } from '@/features/admin/actions/admin-actions';

export default function AdminFeaturesPage() {
    const { features } = useFeatureToggles();
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<FeatureToggle | null>(null);

    // Filter features for each tab
    const coreFeatures = features.filter(f => !['beta', 'development'].includes(f.status || '') && (f.category === 'hub' || f.category === 'feature'));
    const betaFeaturesList = features.filter(f => f.status === 'beta');
    const developmentFeatures = features.filter(f => f.status === 'development');

    // Fallback for beta features if none exist (to show UI structure as per original design)
    // In a real app, we might want to show an empty state or the actual data.
    // For now, let's just use the filtered lists.

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'enabled': return 'text-green-600 border-green-600 bg-green-50 dark:bg-green-950/50';
            case 'beta': return 'text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-950/50';
            case 'disabled': return 'text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-950/50';
            case 'development': return 'text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950/50';
            default: return 'text-gray-600 border-gray-600 bg-gray-50 dark:bg-gray-950/50';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'enabled': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'beta': return <Beaker className="h-4 w-4 text-yellow-600" />;
            case 'disabled': return <XCircle className="h-4 w-4 text-gray-600" />;
            case 'development': return <Settings className="h-4 w-4 text-blue-600" />;
            default: return <XCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getFeatureIcon = (iconName: string) => {
        switch (iconName) {
            case 'Wand2': return <Wand2 className="h-5 w-5 text-purple-600" />;
            case 'Target': return <Target className="h-5 w-5 text-red-600" />;
            case 'Search': return <Search className="h-5 w-5 text-blue-600" />;
            case 'AISparkleIcon': return <AISparkleIcon className="h-5 w-5 text-blue-600" />;
            case 'Calculator': return <Calculator className="h-5 w-5 text-orange-600" />;
            case 'Library': return <Library className="h-5 w-5 text-indigo-600" />;
            case 'GraduationCap': return <GraduationCap className="h-5 w-5 text-yellow-600" />;
            case 'MessageSquare': return <MessageSquare className="h-5 w-5 text-green-600" />;
            case 'Users': return <Users className="h-5 w-5 text-teal-600" />;
            case 'DoorOpen': return <DoorOpen className="h-5 w-5 text-amber-600" />;
            default: return <Zap className="h-5 w-5 text-gray-600" />;
        }
    };

    const getFeatureUrl = (featureId: string) => {
        switch (featureId) {
            case 'brand': return '/brand';
            case 'studio': return '/studio';
            case 'research': return '/research';
            case 'tools': return '/tools';
            case 'library': return '/library';
            case 'training': return '/training';
            case 'assistant': return '/assistant';
            case 'client-dashboards': return '/dashboard';
            default: return '#';
        }
    };

    const activeCount = coreFeatures.filter(f => f.enabled).length;
    const totalCount = coreFeatures.length;
    const activePercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0;

    const handleCreate = (formData: FormData) => {
        startTransition(async () => {
            const result = await createFeatureAction(null, formData);
            if (result.message === 'success') {
                toast({ title: "Success", description: "Feature created successfully" });
                setIsCreateOpen(false);
            } else {
                toast({ title: "Error", description: result.message || "Failed to create feature", variant: "destructive" });
            }
        });
    };

    const handleUpdate = (formData: FormData) => {
        startTransition(async () => {
            const result = await updateFeatureAction(null, formData);
            if (result.message === 'success') {
                toast({ title: "Success", description: "Feature updated successfully" });
                setIsEditOpen(false);
                setSelectedFeature(null);
            } else {
                toast({ title: "Error", description: result.message || "Failed to update feature", variant: "destructive" });
            }
        });
    };

    const handleToggle = async (featureId: string, enabled: boolean) => {
        // Optimistic update handled by useFeatureToggles if we used it, but here we want server persistence
        startTransition(async () => {
            const result = await toggleFeatureAction(featureId, enabled);
            if (result.message === 'success') {
                toast({ title: "Success", description: `Feature ${enabled ? 'enabled' : 'disabled'}` });
            } else {
                toast({ title: "Error", description: "Failed to toggle feature", variant: "destructive" });
            }
        });
    };

    const handleDelete = async (featureId: string) => {
        if (!confirm('Are you sure you want to delete this feature?')) return;

        startTransition(async () => {
            const result = await deleteFeatureAction(featureId);
            if (result.message === 'success') {
                toast({ title: "Success", description: "Feature deleted successfully" });
            } else {
                toast({ title: "Error", description: "Failed to delete feature", variant: "destructive" });
            }
        });
    };

    const openEdit = (feature: FeatureToggle) => {
        setSelectedFeature(feature);
        setIsEditOpen(true);
    };

    return (
        <div className="space-y-8">
            {/* Feature Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Features</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-green-600">{activeCount}</div>
                        <p className="text-xs text-green-600 mt-1">Core features enabled</p>
                        <Progress value={activePercentage} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Beta Features</CardTitle>
                        <Beaker className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-yellow-600">{betaFeaturesList.length}</div>
                        <p className="text-xs text-yellow-600 mt-1">In beta testing</p>
                        <Progress value={betaFeaturesList.length > 0 ? 50 : 0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Development</CardTitle>
                        <Settings className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-blue-600">{developmentFeatures.length}</div>
                        <p className="text-xs text-blue-600 mt-1">Under development</p>
                        <Progress value={developmentFeatures.length > 0 ? 25 : 0} className="mt-3 h-2" />
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20" />
                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">A/B Tests</CardTitle>
                        <Target className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent className="relative">
                        <div className="text-3xl font-bold text-purple-600">0</div>
                        <p className="text-xs text-purple-600 mt-1">Active experiments</p>
                        <Progress value={0} className="mt-3 h-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Feature Management Interface */}
            <TabToggle
                defaultValue="core"
                tabs={[
                    { value: "core", label: "Core Features", icon: Zap },
                    { value: "beta", label: "Beta Features", icon: Beaker },
                    { value: "experiments", label: "A/B Tests", icon: Target },
                    { value: "rollouts", label: "Feature Rollouts", icon: BarChart3 }
                ]}
            >
                <div className="flex items-center justify-end mb-6">
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Feature
                    </Button>
                </div>

                <TabToggleContent value="core" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Zap className="h-5 w-5 text-green-600" />
                                Core Platform Features
                            </CardTitle>
                            <CardDescription>Essential features that power the Bayon Coagent platform</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {coreFeatures.map((feature) => (
                                <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 bg-muted rounded-lg">
                                            {getFeatureIcon(feature.icon)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-medium">{feature.name}</h4>
                                                <Badge variant="outline" className={getStatusColor(feature.enabled ? 'enabled' : 'disabled')}>
                                                    {feature.enabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Type: {feature.category === 'hub' ? 'Hub' : 'Feature'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={feature.enabled}
                                            onCheckedChange={(checked) => handleToggle(feature.id, checked)}
                                            disabled={isPending}
                                        />
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={getFeatureUrl(feature.id)}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(feature)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(feature.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabToggleContent>

                <TabToggleContent value="beta" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Beaker className="h-5 w-5 text-yellow-600" />
                                Beta Features & Experiments
                            </CardTitle>
                            <CardDescription>Features in testing phase with controlled rollouts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {betaFeaturesList.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No beta features currently active.
                                </div>
                            )}
                            {betaFeaturesList.map((feature) => (
                                <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                                            {getStatusIcon(feature.status || 'beta')}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="font-medium">{feature.name}</h4>
                                                <Badge variant="outline" className={getStatusColor(feature.status || 'beta')}>
                                                    {feature.status || 'beta'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <span>Rollout: {feature.rollout || 0}%</span>
                                                <span>Beta Users: {feature.users || 0}</span>
                                            </div>
                                            {(feature.rollout || 0) > 0 && (
                                                <Progress value={feature.rollout} className="mt-2 h-2 w-32" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(feature)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(feature.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabToggleContent>

                <TabToggleContent value="experiments" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-purple-600" />
                                A/B Testing & Experiments
                            </CardTitle>
                            <CardDescription>Controlled experiments to optimize user experience</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/50 rounded-full w-fit mx-auto mb-4">
                                    <Target className="h-8 w-8 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No Active A/B Tests</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                    A/B testing framework is ready for implementation.
                                    Create experiments to test feature variations and optimize user experience.
                                </p>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create A/B Test
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabToggleContent>

                <TabToggleContent value="rollouts" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                                Feature Rollout Management
                            </CardTitle>
                            <CardDescription>Gradual feature deployment and user targeting</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full w-fit mx-auto mb-4">
                                    <BarChart3 className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Rollout Management Coming Soon</h3>
                                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                                    Advanced rollout controls will allow gradual feature deployment
                                    with user targeting and automatic rollback capabilities.
                                </p>
                                <Button variant="outline">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configure Rollouts
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabToggleContent>
            </TabToggle>

            {/* Create Feature Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Feature</DialogTitle>
                        <DialogDescription>
                            Add a new feature or hub to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="id" className="text-right">ID</Label>
                                <Input id="id" name="id" placeholder="feature-id" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" name="name" placeholder="Feature Name" className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea id="description" name="description" placeholder="Feature description" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Category</Label>
                                <Select name="category" defaultValue="feature">
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="feature">Feature</SelectItem>
                                        <SelectItem value="hub">Hub</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">Status</Label>
                                <Select name="status" defaultValue="enabled">
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="enabled">Enabled</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                        <SelectItem value="beta">Beta</SelectItem>
                                        <SelectItem value="development">Development</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="rollout" className="text-right">Rollout %</Label>
                                <Input id="rollout" name="rollout" type="number" min="0" max="100" defaultValue="0" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="icon" className="text-right">Icon</Label>
                                <Select name="icon" defaultValue="Zap">
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Zap">Zap</SelectItem>
                                        <SelectItem value="Wand2">Wand2 (Studio)</SelectItem>
                                        <SelectItem value="Target">Target (Brand)</SelectItem>
                                        <SelectItem value="AISparkleIcon">AI Sparkle (Intelligence)</SelectItem>
                                        <SelectItem value="Calculator">Calculator (Tools)</SelectItem>
                                        <SelectItem value="Library">Library</SelectItem>
                                        <SelectItem value="GraduationCap">Graduation Cap (Learning)</SelectItem>
                                        <SelectItem value="MessageSquare">Message Square (Assistant)</SelectItem>
                                        <SelectItem value="Users">Users (Clients)</SelectItem>
                                        <SelectItem value="DoorOpen">Door Open (Open House)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="enabled" className="text-right">Enabled</Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Switch id="enabled" name="enabled" value="true" defaultChecked />
                                    <Label htmlFor="enabled">Enable immediately</Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isPending}>Create Feature</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Feature Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Feature</DialogTitle>
                        <DialogDescription>
                            Update feature details.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedFeature && (
                        <form action={handleUpdate}>
                            <input type="hidden" name="id" value={selectedFeature.id} />
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                                    <Input id="edit-name" name="name" defaultValue={selectedFeature.name} className="col-span-3" required />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-description" className="text-right">Description</Label>
                                    <Textarea id="edit-description" name="description" defaultValue={selectedFeature.description} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-category" className="text-right">Category</Label>
                                    <Select name="category" defaultValue={selectedFeature.category}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="feature">Feature</SelectItem>
                                            <SelectItem value="hub">Hub</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-status" className="text-right">Status</Label>
                                    <Select name="status" defaultValue={selectedFeature.status || 'enabled'}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="enabled">Enabled</SelectItem>
                                            <SelectItem value="disabled">Disabled</SelectItem>
                                            <SelectItem value="beta">Beta</SelectItem>
                                            <SelectItem value="development">Development</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-rollout" className="text-right">Rollout %</Label>
                                    <Input id="edit-rollout" name="rollout" type="number" min="0" max="100" defaultValue={selectedFeature.rollout || 0} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-icon" className="text-right">Icon</Label>
                                    <Select name="icon" defaultValue={selectedFeature.icon}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select icon" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Zap">Zap</SelectItem>
                                            <SelectItem value="Wand2">Wand2 (Studio)</SelectItem>
                                            <SelectItem value="Target">Target (Brand)</SelectItem>
                                            <SelectItem value="AISparkleIcon">AI Sparkle (Intelligence)</SelectItem>
                                            <SelectItem value="Calculator">Calculator (Tools)</SelectItem>
                                            <SelectItem value="Library">Library</SelectItem>
                                            <SelectItem value="GraduationCap">Graduation Cap (Learning)</SelectItem>
                                            <SelectItem value="MessageSquare">Message Square (Assistant)</SelectItem>
                                            <SelectItem value="Users">Users (Clients)</SelectItem>
                                            <SelectItem value="DoorOpen">Door Open (Open House)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-enabled" className="text-right">Enabled</Label>
                                    <div className="col-span-3 flex items-center space-x-2">
                                        <Switch id="edit-enabled" name="enabled" value="true" defaultChecked={selectedFeature.enabled} />
                                        <Label htmlFor="edit-enabled">Is Active</Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isPending}>Save Changes</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}