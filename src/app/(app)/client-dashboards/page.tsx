'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { StandardSkeleton } from '@/components/standard/skeleton';
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
} from 'lucide-react';
import { QRCodeDialog } from '@/components/qrcode-dialog';
import {
    listDashboards,
    deleteDashboard,
    listAllAgentLinks,
    type ClientDashboard,
    type SecuredLink
} from '@/features/client-dashboards/actions/client-dashboard-actions';
import { formatDistanceToNow } from 'date-fns';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageMetadata } from '@/lib/page-metadata';

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
                        {(() => {
                            const pageMetadata = getPageMetadata('/client-dashboards');
                            return pageMetadata ? <FavoritesButton item={pageMetadata} /> : null;
                        })()}
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
