'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { StandardSkeleton } from '@/components/standard/skeleton';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import {
    Plus,
    MoreVertical,
    ExternalLink,
    Copy,
    Trash2,
    Eye,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Users,
    Link as LinkIcon,
    QrCode,
    Home,
    Calculator,
    FileText,
    TrendingUp,
    MessageSquare,
    Calendar,
    Star,
    Edit,
    Share2,
    Download,
    BarChart3
} from 'lucide-react';
import { QRCodeDialog } from '@/components/qrcode-dialog';
import {
    listDashboards,
    deleteDashboard,
    createDashboard,
    updateDashboard,
    getDashboardAnalytics
} from '@/app/client-dashboard-actions';

interface ClientDashboard {
    id: string;
    title: string;
    description: string;
    clientName: string;
    clientEmail: string;
    status: 'active' | 'draft' | 'archived';
    createdAt: string;
    updatedAt: string;
    lastViewed?: string;
    viewCount: number;
    publicUrl: string;
    features: string[];
    customization: {
        theme: 'light' | 'dark' | 'brand';
        primaryColor: string;
        logo?: string;
    };
}

interface DashboardAnalytics {
    totalViews: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    lastActivity: string;
    popularSections: Array<{
        section: string;
        views: number;
    }>;
}

const DASHBOARD_FEATURES = [
    { id: 'market-insights', label: 'Market Insights', icon: TrendingUp },
    { id: 'property-search', label: 'Property Search', icon: Home },
    { id: 'mortgage-calculator', label: 'Mortgage Calculator', icon: Calculator },
    { id: 'neighborhood-info', label: 'Neighborhood Info', icon: Users },
    { id: 'documents', label: 'Document Center', icon: FileText },
    { id: 'communication', label: 'Message Center', icon: MessageSquare },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'favorites', label: 'Saved Properties', icon: Star }
];

const DASHBOARD_TEMPLATES = [
    {
        id: 'buyer',
        name: 'First-Time Buyer',
        description: 'Perfect for first-time homebuyers with educational content and tools',
        features: ['market-insights', 'property-search', 'mortgage-calculator', 'neighborhood-info', 'documents']
    },
    {
        id: 'seller',
        name: 'Home Seller',
        description: 'Comprehensive dashboard for sellers with market analysis and listing tools',
        features: ['market-insights', 'documents', 'communication', 'appointments']
    },
    {
        id: 'investor',
        name: 'Real Estate Investor',
        description: 'Advanced analytics and investment tools for property investors',
        features: ['market-insights', 'property-search', 'mortgage-calculator', 'documents', 'communication']
    },
    {
        id: 'luxury',
        name: 'Luxury Client',
        description: 'Premium experience with exclusive market insights and concierge features',
        features: ['market-insights', 'property-search', 'neighborhood-info', 'documents', 'communication', 'appointments']
    }
];

export default function ClientDashboardsPage() {
    const { user } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'dashboards' | 'templates' | 'analytics'>('dashboards');
    const [dashboards, setDashboards] = useState<ClientDashboard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDashboard, setSelectedDashboard] = useState<ClientDashboard | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [dashboardToDelete, setDashboardToDelete] = useState<string | null>(null);
    const [analytics, setAnalytics] = useState<Record<string, DashboardAnalytics>>({});

    // Form state for creating/editing dashboards
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        clientName: '',
        clientEmail: '',
        template: '',
        features: [] as string[],
        theme: 'light' as 'light' | 'dark' | 'brand',
        primaryColor: '#3b82f6'
    });

    useEffect(() => {
        if (user) {
            loadDashboards();
        }
    }, [user]);

    const loadDashboards = async () => {
        setIsLoading(true);
        try {
            const result = await listDashboards();
            if (result.data) {
                setDashboards(result.data);
                // Load analytics for each dashboard
                const analyticsPromises = result.data.map(async (dashboard: ClientDashboard) => {
                    const analyticsResult = await getDashboardAnalytics(dashboard.id);
                    return { id: dashboard.id, analytics: analyticsResult.data };
                });
                const analyticsResults = await Promise.all(analyticsPromises);
                const analyticsMap = analyticsResults.reduce((acc, { id, analytics }) => {
                    if (analytics) acc[id] = analytics;
                    return acc;
                }, {} as Record<string, DashboardAnalytics>);
                setAnalytics(analyticsMap);
            }
        } catch (error) {
            console.error('Failed to load dashboards:', error);
            toast({
                title: "Failed to load dashboards",
                description: "Please try again later.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDashboard = async () => {
        if (!formData.title || !formData.clientName || !formData.clientEmail) {
            toast({
                title: "Missing required fields",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        try {
            const result = await createDashboard({
                title: formData.title,
                description: formData.description,
                clientName: formData.clientName,
                clientEmail: formData.clientEmail,
                features: formData.features,
                customization: {
                    theme: formData.theme,
                    primaryColor: formData.primaryColor
                }
            });

            if (result.data) {
                setDashboards(prev => [result.data, ...prev]);
                setShowCreateDialog(false);
                resetForm();
                toast({
                    title: "Dashboard created",
                    description: "Client dashboard has been created successfully.",
                    variant: "success"
                });
            }
        } catch (error) {
            toast({
                title: "Failed to create dashboard",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
    };

    const handleDeleteDashboard = async () => {
        if (!dashboardToDelete) return;

        try {
            await deleteDashboard(dashboardToDelete);
            setDashboards(prev => prev.filter(d => d.id !== dashboardToDelete));
            setShowDeleteDialog(false);
            setDashboardToDelete(null);
            toast({
                title: "Dashboard deleted",
                description: "Client dashboard has been removed.",
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Failed to delete dashboard",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
    };

    const handleCopyLink = (dashboard: ClientDashboard) => {
        navigator.clipboard.writeText(dashboard.publicUrl);
        toast({
            title: "Link copied",
            description: "Dashboard link has been copied to clipboard.",
            variant: "success"
        });
    };

    const handleApplyTemplate = (templateId: string) => {
        const template = DASHBOARD_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                template: templateId,
                features: template.features
            }));
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            clientName: '',
            clientEmail: '',
            template: '',
            features: [],
            theme: 'light',
            primaryColor: '#3b82f6'
        });
    };

    const filteredDashboards = useMemo(() => {
        if (!searchQuery) return dashboards;
        return dashboards.filter(dashboard =>
            dashboard.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dashboard.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dashboard.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [dashboards, searchQuery]);

    const dashboardStats = useMemo(() => {
        const total = dashboards.length;
        const active = dashboards.filter(d => d.status === 'active').length;
        const totalViews = Object.values(analytics).reduce((sum, a) => sum + (a.totalViews || 0), 0);
        const avgViews = total > 0 ? Math.round(totalViews / total) : 0;

        return { total, active, totalViews, avgViews };
    }, [dashboards, analytics]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Client Dashboards</h1>
                    <p className="text-muted-foreground">
                        Create personalized dashboards for your clients with market insights and tools
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Dashboard
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{dashboardStats.total}</div>
                        <div className="text-sm text-muted-foreground">Total Dashboards</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{dashboardStats.active}</div>
                        <div className="text-sm text-muted-foreground">Active Dashboards</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">{dashboardStats.totalViews}</div>
                        <div className="text-sm text-muted-foreground">Total Views</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{dashboardStats.avgViews}</div>
                        <div className="text-sm text-muted-foreground">Avg Views per Dashboard</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dashboards">
                        <Users className="mr-2 h-4 w-4" />
                        Dashboards ({dashboards.length})
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        <FileText className="mr-2 h-4 w-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboards" className="space-y-4">
                    {/* Search */}
                    <Card>
                        <CardContent className="pt-6">
                            <SearchInput
                                placeholder="Search dashboards..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                className="max-w-md"
                            />
                        </CardContent>
                    </Card>

                    {/* Dashboards List */}
                    {isLoading ? (
                        <div className="grid gap-4">
                            {[1, 2, 3].map(i => (
                                <StandardSkeleton key={i} className="h-32" />
                            ))}
                        </div>
                    ) : filteredDashboards.length === 0 ? (
                        <IntelligentEmptyState
                            icon={Users}
                            title="No client dashboards"
                            description="Create personalized dashboards to share market insights and tools with your clients."
                            action={
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Dashboard
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-4">
                            {filteredDashboards.map((dashboard) => (
                                <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">{dashboard.title}</h3>
                                                    <Badge variant={dashboard.status === 'active' ? 'default' : 'secondary'}>
                                                        {dashboard.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    {dashboard.description}
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Client</div>
                                                        <div className="font-medium">{dashboard.clientName}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Email</div>
                                                        <div className="font-medium text-sm">{dashboard.clientEmail}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Views</div>
                                                        <div className="font-medium">{dashboard.viewCount}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Last Updated</div>
                                                        <div className="font-medium text-sm">
                                                            {new Date(dashboard.updatedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {dashboard.features.map(featureId => {
                                                        const feature = DASHBOARD_FEATURES.find(f => f.id === featureId);
                                                        return feature ? (
                                                            <Badge key={featureId} variant="outline" className="text-xs">
                                                                {feature.label}
                                                            </Badge>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => window.open(dashboard.publicUrl, '_blank')}
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleCopyLink(dashboard)}
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <QRCodeDialog url={dashboard.publicUrl} title={dashboard.title}>
                                                    <Button size="sm" variant="ghost">
                                                        <QrCode className="h-4 w-4" />
                                                    </Button>
                                                </QRCodeDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Dashboard
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Share2 className="mr-2 h-4 w-4" />
                                                            Share Dashboard
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Export Data
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setDashboardToDelete(dashboard.id);
                                                                setShowDeleteDialog(true);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Dashboard
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dashboard Templates</CardTitle>
                            <CardDescription>
                                Pre-configured dashboard templates for different client types
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {DASHBOARD_TEMPLATES.map((template) => (
                                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="pt-6">
                                            <h3 className="font-semibold mb-2">{template.name}</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                {template.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {template.features.map(featureId => {
                                                    const feature = DASHBOARD_FEATURES.find(f => f.id === featureId);
                                                    return feature ? (
                                                        <Badge key={featureId} variant="outline" className="text-xs">
                                                            {feature.label}
                                                        </Badge>
                                                    ) : null;
                                                })}
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="w-full"
                                                onClick={() => {
                                                    handleApplyTemplate(template.id);
                                                    setShowCreateDialog(true);
                                                }}
                                            >
                                                Use Template
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dashboard Analytics</CardTitle>
                            <CardDescription>
                                Performance metrics for your client dashboards
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(analytics).length === 0 ? (
                                <div className="text-center py-12">
                                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
                                    <p className="text-muted-foreground">
                                        Analytics will appear here once your dashboards start receiving views.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {dashboards.map(dashboard => {
                                        const dashboardAnalytics = analytics[dashboard.id];
                                        if (!dashboardAnalytics) return null;

                                        return (
                                            <div key={dashboard.id} className="border rounded-lg p-4">
                                                <h4 className="font-semibold mb-4">{dashboard.title}</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {dashboardAnalytics.totalViews}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Total Views</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {dashboardAnalytics.uniqueVisitors}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Unique Visitors</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-purple-600">
                                                            {Math.round(dashboardAnalytics.avgTimeOnPage / 60)}m
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Avg Time on Page</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Last Activity</div>
                                                        <div className="font-medium text-sm">
                                                            {new Date(dashboardAnalytics.lastActivity).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Dashboard Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Client Dashboard</DialogTitle>
                        <DialogDescription>
                            Create a personalized dashboard for your client with market insights and tools.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Dashboard Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., John's Home Search Dashboard"
                                />
                            </div>
                            <div>
                                <Label htmlFor="clientName">Client Name *</Label>
                                <Input
                                    id="clientName"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                    placeholder="John Smith"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="clientEmail">Client Email *</Label>
                            <Input
                                id="clientEmail"
                                type="email"
                                value={formData.clientEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                                placeholder="john@example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of this dashboard..."
                            />
                        </div>
                        <div>
                            <Label>Template (Optional)</Label>
                            <Select value={formData.template} onValueChange={(value) => handleApplyTemplate(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DASHBOARD_TEMPLATES.map(template => (
                                        <SelectItem key={template.id} value={template.id}>
                                            {template.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Features</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {DASHBOARD_FEATURES.map(feature => (
                                    <label key={feature.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.features.includes(feature.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        features: [...prev.features, feature.id]
                                                    }));
                                                } else {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        features: prev.features.filter(f => f !== feature.id)
                                                    }));
                                                }
                                            }}
                                        />
                                        <span className="text-sm">{feature.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="theme">Theme</Label>
                                <Select value={formData.theme} onValueChange={(value: any) => setFormData(prev => ({ ...prev, theme: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                        <SelectItem value="brand">Brand Colors</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="primaryColor">Primary Color</Label>
                                <Input
                                    id="primaryColor"
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateDashboard}>
                            Create Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this client dashboard? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDashboard}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
    listAllAgentLinks,
    type ClientDashboard,
    type SecuredLink
} from '@/features/client-dashboards/actions/client-dashboard-actions';
import { formatDistanceToNow } from 'date-fns';


// Helper function to format dates
function formatDate(timestamp: number): string {
    try {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
        return 'Unknown';
    }
}

// Helper function to get link status
function getLinkStatus(dashboardId: string, links: SecuredLink[]): {
    status: 'active' | 'expired' | 'none';
    label: string;
    variant: 'default' | 'secondary' | 'destructive';
    icon: React.ReactNode;
    link?: SecuredLink;
} {
    // Find active link for this dashboard
    // Sort by creation date (newest first) to get the most recent one
    const dashboardLinks = links
        .filter(l => l.dashboardId === dashboardId && !l.revoked)
        .sort((a, b) => b.createdAt - a.createdAt);

    const activeLink = dashboardLinks[0];

    if (!activeLink) {
        return {
            status: 'none',
            label: 'No Link',
            variant: 'secondary',
            icon: <AlertCircle className="h-3 w-3" />,
        };
    }

    const isExpired = activeLink.expiresAt < Date.now();

    if (isExpired) {
        return {
            status: 'expired',
            label: 'Expired',
            variant: 'destructive',
            icon: <AlertCircle className="h-3 w-3" />,
            link: activeLink,
        };
    }

    return {
        status: 'active',
        label: 'Active',
        variant: 'default',
        icon: <CheckCircle2 className="h-3 w-3" />,
        link: activeLink,
    };
}

export default function ClientDashboardsPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [dashboards, setDashboards] = useState<ClientDashboard[] | null>(null);
    const [links, setLinks] = useState<SecuredLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dashboardToDelete, setDashboardToDelete] = useState<ClientDashboard | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [qrCodeDialogState, setQrCodeDialogState] = useState<{
        open: boolean;
        url: string;
        title: string;
    }>({ open: false, url: '', title: '' });

    // Fetch dashboards
    useEffect(() => {
        if (!user) {
            setDashboards([]);
            setIsLoading(false);
            return;
        }

        const fetchDashboards = async () => {
            setIsLoading(true);
            try {
                const [dashboardsResult, linksResult] = await Promise.all([
                    listDashboards(),
                    listAllAgentLinks()
                ]);

                if (dashboardsResult.data) {
                    setDashboards(dashboardsResult.data);
                } else {
                    setDashboards([]);
                    if (dashboardsResult.errors) {
                        console.warn('Failed to fetch dashboards:', JSON.stringify(dashboardsResult.errors));
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: dashboardsResult.message || 'Failed to load dashboards',
                        });
                    }
                }

                if (linksResult.data) {
                    setLinks(linksResult.data);
                }
            } catch (error) {
                console.warn('Error fetching data:', error instanceof Error ? error.message : String(error));
                setDashboards([]);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load dashboards',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboards();
    }, [user]);

    // Refresh function
    const refreshDashboards = async () => {
        setIsRefreshing(true);
        try {
            const [dashboardsResult, linksResult] = await Promise.all([
                listDashboards(),
                listAllAgentLinks()
            ]);

            if (dashboardsResult.data) {
                setDashboards(dashboardsResult.data);
            }

            if (linksResult.data) {
                setLinks(linksResult.data);
            }
        } catch (error) {
            console.warn('Error refreshing dashboards:', error instanceof Error ? error.message : String(error));
        } finally {
            setIsRefreshing(false);
        }
    };

    // Filter dashboards by search query
    const filteredDashboards = useMemo(() => {
        if (!dashboards) return [];
        if (!searchQuery) return dashboards;

        const query = searchQuery.toLowerCase();
        return dashboards.filter(
            (dashboard) =>
                dashboard.clientInfo.name.toLowerCase().includes(query) ||
                dashboard.clientInfo.email.toLowerCase().includes(query) ||
                dashboard.clientInfo.phone?.toLowerCase().includes(query) ||
                dashboard.clientInfo.propertyInterests?.toLowerCase().includes(query)
        );
    }, [dashboards, searchQuery]);

    // Sort dashboards by most recently updated
    const sortedDashboards = useMemo(() => {
        return [...filteredDashboards].sort((a, b) => b.updatedAt - a.updatedAt);
    }, [filteredDashboards]);

    // Handle create dashboard
    const handleCreateDashboard = () => {
        router.push('/client-dashboards/new');
    };

    // Handle view dashboard
    const handleViewDashboard = (dashboardId: string) => {
        router.push(`/client-dashboards/${dashboardId}`);
    };

    // Handle copy link
    const handleCopyLink = (link: string) => {
        const baseUrl = window.location.origin;
        // If the link is already a full URL, use it. Otherwise construct it.
        // The server action returns a full URL usually, but let's be safe.
        const fullUrl = link.startsWith('http') ? link : `${baseUrl}/d/${link}`;

        navigator.clipboard.writeText(fullUrl);
        toast({
            title: 'Copied',
            description: 'Link copied to clipboard',
        });
    };

    // Handle delete dashboard
    const handleDeleteDashboard = async () => {
        if (!dashboardToDelete) return;

        try {
            const formData = new FormData();
            formData.append('dashboardId', dashboardToDelete.id);

            const result = await deleteDashboard(null, formData);

            if (result.message === 'success') {
                setDashboards(dashboards?.filter(d => d.id !== dashboardToDelete.id) || []);
                toast({
                    title: 'Success',
                    description: 'Dashboard deleted successfully',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to delete dashboard',
                });
            }
        } catch (error) {
            console.error('Error deleting dashboard:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete dashboard',
            });
        } finally {
            setDashboardToDelete(null);
        }
    };

    const isLoadingState = isUserLoading || isLoading || isRefreshing;

    if (isLoadingState) {
        return <StandardSkeleton variant="card" count={6} />;
    }

    if (!user) {
        return (
            <IntelligentEmptyState
                icon={Users}
                title="Authentication Required"
                description="Please log in to manage client dashboards"
                actions={[
                    {
                        label: 'Go to Login',
                        onClick: () => router.push('/login'),
                    },
                ]}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header with Pin Button */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold font-headline">Client Dashboards</CardTitle>
                            <CardDescription>
                                Create and manage personalized client portals
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Header with search and create button */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by client name, email, or interests..."
                    />
                </div>
                <Button onClick={handleCreateDashboard} size="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dashboard
                </Button>
            </div>

            {/* Dashboard list */}
            {sortedDashboards.length === 0 ? (
                <IntelligentEmptyState
                    icon={Users}
                    title={searchQuery ? 'No Dashboards Found' : 'No Client Dashboards Yet'}
                    description={
                        searchQuery
                            ? 'Try adjusting your search criteria'
                            : 'Create your first client dashboard to start sharing personalized content with your clients'
                    }
                    actions={
                        !searchQuery
                            ? [
                                {
                                    label: 'Create Dashboard',
                                    onClick: handleCreateDashboard,
                                },
                            ]
                            : []
                    }
                />
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {sortedDashboards.map((dashboard) => {
                        const linkStatus = getLinkStatus(dashboard.id, links);
                        const enabledFeatures = [
                            dashboard.dashboardConfig.enableCMA && 'CMA',
                            dashboard.dashboardConfig.enablePropertySearch && 'Search',
                            dashboard.dashboardConfig.enableHomeValuation && 'Valuation',
                            dashboard.dashboardConfig.enableDocuments && 'Documents',
                        ].filter((f): f is string => typeof f === 'string');

                        // Get stats from link
                        const views = linkStatus.link?.accessCount || 0;
                        const lastAccessed = linkStatus.link?.lastAccessedAt
                            ? formatDate(linkStatus.link.lastAccessedAt)
                            : 'Never';

                        return (
                            <Card
                                key={dashboard.id}
                                className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden bg-background/50 border-primary/20"
                                onClick={() => handleViewDashboard(dashboard.id)}
                            >
                                <CardGradientMesh>
                                    <CardHeader className="pb-3 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg truncate">
                                                    {dashboard.clientInfo.name}
                                                </CardTitle>
                                                <CardDescription className="truncate">
                                                    {dashboard.clientInfo.email}
                                                </CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDashboard(dashboard.id);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Dashboard
                                                    </DropdownMenuItem>
                                                    {linkStatus.status === 'active' && linkStatus.link && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Construct the full link URL
                                                                    // The token is stored in the link object
                                                                    const baseUrl = window.location.origin;
                                                                    const linkUrl = `${baseUrl}/d/${linkStatus.link!.token}`;
                                                                    handleCopyLink(linkUrl);
                                                                }}
                                                            >
                                                                <Copy className="h-4 w-4 mr-2" />
                                                                Copy Link
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const baseUrl = window.location.origin;
                                                                    const linkUrl = `${baseUrl}/d/${linkStatus.link!.token}`;
                                                                    setQrCodeDialogState({
                                                                        open: true,
                                                                        url: linkUrl,
                                                                        title: dashboard.clientInfo.name,
                                                                    });
                                                                }}
                                                            >
                                                                <QrCode className="h-4 w-4 mr-2" />
                                                                QR Code
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDashboardToDelete(dashboard);
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 relative z-10">
                                        {/* Link Status */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Link Status</span>
                                            <Badge variant={linkStatus.variant} className="gap-1">
                                                {linkStatus.icon}
                                                {linkStatus.label}
                                            </Badge>
                                        </div>

                                        {/* Enabled Features */}
                                        <div className="space-y-1">
                                            <span className="text-sm text-muted-foreground">Enabled Features</span>
                                            <div className="flex flex-wrap gap-1">
                                                {enabledFeatures.map((feature) => (
                                                    <Badge key={feature} variant="outline" className="text-xs">
                                                        {feature}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">Views</div>
                                                <div className="text-sm font-medium">{views}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">Last Accessed</div>
                                                <div className="text-sm font-medium">{lastAccessed}</div>
                                            </div>
                                        </div>

                                        {/* Last Updated */}
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                                            <Clock className="h-3 w-3" />
                                            Updated {formatDate(dashboard.updatedAt)}
                                        </div>
                                    </CardContent>
                                </CardGradientMesh>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!dashboardToDelete} onOpenChange={() => setDashboardToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the dashboard for{' '}
                            <strong>{dashboardToDelete?.clientInfo.name}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteDashboard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* QR Code Dialog */}
            <QRCodeDialog
                open={qrCodeDialogState.open}
                onOpenChange={(open) => setQrCodeDialogState((prev) => ({ ...prev, open }))}
                url={qrCodeDialogState.url}
                title={qrCodeDialogState.title}
            />
        </div>
    );
}
