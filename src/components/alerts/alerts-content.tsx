'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useUser } from '@/aws/auth';
import { StandardCard } from '@/components/standard/card';
import { StandardEmptyState } from '@/components/standard/empty-state';
import { StandardSkeleton } from '@/components/standard/skeleton';
import { SearchInput } from '@/components/ui/search-input';
import { FilterControls, useFilters, type FilterGroup } from '@/components/ui/filter-controls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Bell,
    BellRing,
    TrendingUp,
    Users,
    Home,
    DollarSign,
    MapPin,
    Calendar,
    Eye,
    EyeOff,
    X,
    AlertTriangle,
    Info,
    CheckCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import {
    getAlertsAction,
    markAlertAsReadAction,
    dismissAlertAction,
    getUnreadAlertCountAction
} from '@/app/actions';
import { AlertDetailModal } from '@/components/alerts/alert-detail-modal';
import { LazyAlertDetail } from '@/components/alerts/lazy-alert-detail';
import { AlertSkeletons } from '@/components/alerts/alert-skeletons';
import { AlertPerformanceMonitor } from '@/components/alerts/performance-monitor';
import { createPaginationManager, paginationUtils } from '@/lib/alerts/pagination';
import type { Alert, AlertType, AlertStatus, AlertPriority } from '@/lib/alerts/types';

// Alert type configurations
const ALERT_TYPE_CONFIG = {
    'life-event-lead': {
        label: 'Life Event Lead',
        icon: Users,
        color: 'bg-blue-500',
        variant: 'default' as const,
    },
    'competitor-new-listing': {
        label: 'New Listing',
        icon: Home,
        color: 'bg-green-500',
        variant: 'secondary' as const,
    },
    'competitor-price-reduction': {
        label: 'Price Reduction',
        icon: DollarSign,
        color: 'bg-orange-500',
        variant: 'secondary' as const,
    },
    'competitor-withdrawal': {
        label: 'Withdrawal',
        icon: Home,
        color: 'bg-red-500',
        variant: 'destructive' as const,
    },
    'neighborhood-trend': {
        label: 'Trend Alert',
        icon: TrendingUp,
        color: 'bg-purple-500',
        variant: 'default' as const,
    },
    'price-reduction': {
        label: 'Price Drop',
        icon: DollarSign,
        color: 'bg-orange-500',
        variant: 'secondary' as const,
    },
} as const;

// Priority configurations
const PRIORITY_CONFIG = {
    high: {
        label: 'High',
        icon: AlertTriangle,
        color: 'text-red-600',
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
    },
    medium: {
        label: 'Medium',
        icon: Info,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        borderColor: 'border-orange-200 dark:border-orange-800',
    },
    low: {
        label: 'Low',
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
    },
} as const;

interface AlertCardProps {
    alert: Alert;
    onMarkAsRead: (alertId: string) => void;
    onDismiss: (alertId: string) => void;
    onViewDetails: (alert: Alert) => void;
    isMobile: boolean;
}

function AlertCard({ alert, onMarkAsRead, onDismiss, onViewDetails, isMobile }: AlertCardProps) {
    const typeConfig = ALERT_TYPE_CONFIG[alert.type];
    const priorityConfig = PRIORITY_CONFIG[alert.priority];
    const TypeIcon = typeConfig.icon;
    const PriorityIcon = priorityConfig.icon;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 48) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    const getAlertSummary = (alert: Alert) => {
        switch (alert.type) {
            case 'life-event-lead':
                return `${alert.data.eventType} detected in ${alert.data.prospectLocation} (Score: ${alert.data.leadScore})`;
            case 'competitor-new-listing':
                return `${alert.data.competitorName} listed ${alert.data.propertyAddress} for ${alert.data.listingPrice?.toLocaleString()}`;
            case 'competitor-price-reduction':
                return `${alert.data.competitorName} reduced ${alert.data.propertyAddress} by ${alert.data.priceReductionPercent}%`;
            case 'competitor-withdrawal':
                return `${alert.data.competitorName} withdrew ${alert.data.propertyAddress} after ${alert.data.daysOnMarket} days`;
            case 'neighborhood-trend':
                return `${alert.data.neighborhood}: ${alert.data.trendType.replace('-', ' ')} of ${alert.data.changePercent}%`;
            case 'price-reduction':
                return `${alert.data.propertyAddress} reduced by ${alert.data.priceReduction.toLocaleString()} (${alert.data.priceReductionPercent}%)`;
            default:
                return 'Alert details';
        }
    };

    return (
        <Card
            className={cn(
                'transition-all duration-200 hover:shadow-md cursor-pointer',
                alert.status === 'unread' && 'ring-2 ring-primary/20',
                priorityConfig.borderColor
            )}
            onClick={() => onViewDetails(alert)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Alert Type Icon */}
                        <div className={cn(
                            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                            typeConfig.color,
                            'text-white'
                        )}>
                            <TypeIcon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant={typeConfig.variant} className="text-xs">
                                    {typeConfig.label}
                                </Badge>
                                <div className={cn(
                                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                    priorityConfig.bgColor,
                                    priorityConfig.color
                                )}>
                                    <PriorityIcon className="w-3 h-3" />
                                    {priorityConfig.label}
                                </div>
                                {alert.status === 'unread' && (
                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                )}
                            </div>

                            <CardTitle className="text-base font-semibold line-clamp-2">
                                {getAlertSummary(alert)}
                            </CardTitle>

                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(alert.createdAt)}
                                </div>
                                {alert.type.includes('competitor') && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        Competitor
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {alert.status === 'unread' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(alert.id);
                                }}
                                className="h-8 w-8 p-0"
                                title="Mark as read"
                            >
                                <Eye className="w-4 h-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(alert.id);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Dismiss alert"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}

export function AlertsContent() {
    const { user, isUserLoading } = useUser();
    const isMobile = useIsMobile();

    // State
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const pageSize = 20;

    // Pagination manager
    const paginationManager = useMemo(() => createPaginationManager({ pageSize }), [pageSize]);

    // Filters
    const { selectedFilters, handleFilterChange, handleClearAll } = useFilters();

    // Filter groups configuration
    const filterGroups: FilterGroup[] = useMemo(() => [
        {
            id: 'type',
            label: 'Alert Type',
            options: [
                { value: 'life-event-lead', label: 'Life Event Leads' },
                { value: 'competitor-new-listing', label: 'New Listings' },
                { value: 'competitor-price-reduction', label: 'Price Reductions' },
                { value: 'competitor-withdrawal', label: 'Withdrawals' },
                { value: 'neighborhood-trend', label: 'Trend Alerts' },
                { value: 'price-reduction', label: 'Price Drops' },
            ],
        },
        {
            id: 'status',
            label: 'Status',
            options: [
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' },
            ],
        },
        {
            id: 'priority',
            label: 'Priority',
            options: [
                { value: 'high', label: 'High Priority' },
                { value: 'medium', label: 'Medium Priority' },
                { value: 'low', label: 'Low Priority' },
            ],
        },
    ], []);

    // Debounced search to avoid excessive API calls
    const debouncedFetchAlerts = useMemo(
        () => paginationUtils.debouncePagination(
            async (page: number, filters: any, search: string) => {
                if (!user) {
                    throw new Error('User not authenticated');
                }

                const { offset, limit } = paginationUtils.getOffsetPagination(page, pageSize);

                const result = await getAlertsAction({
                    types: filters.type as AlertType[],
                    status: filters.status as AlertStatus[],
                    priority: filters.priority as AlertPriority[],
                    searchQuery: search || undefined,
                }, {
                    limit,
                    offset,
                    sortOrder: 'desc'
                });

                if (result.message === 'Alerts retrieved successfully' && result.data) {
                    return result.data;
                } else {
                    throw new Error(result.message);
                }
            },
            300
        ),
        [user, pageSize]
    );

    // Fetch alerts with pagination
    const fetchAlerts = useCallback(async (page: number = currentPage) => {
        if (!user || isUserLoading) {
            console.log('Skipping fetch - user not ready:', { user: !!user, isUserLoading });
            return;
        }

        try {
            setIsLoading(true);

            // Check if we have cached data for this page
            const cachedData = paginationManager.getPageData(page);
            if (cachedData && !searchQuery && Object.values(selectedFilters).every(f => f.length === 0)) {
                setAlerts(cachedData);
                setIsLoading(false);
                return;
            }

            const result = await debouncedFetchAlerts(page, selectedFilters, searchQuery);

            setAlerts(result.alerts);
            setTotalCount(result.totalCount);
            setHasMore(result.hasMore);

            // Cache the results
            paginationManager.setPageData(page, result.alerts, undefined, result.totalCount);

        } catch (error) {
            console.error('Error fetching alerts:', error);
            setAlerts([]);
            setTotalCount(0);
            setHasMore(false);

            // If authentication error, show a more helpful message
            if (error instanceof Error && error.message.includes('Authentication required')) {
                toast({
                    variant: 'destructive',
                    title: 'Authentication Error',
                    description: 'Please refresh the page and try again.',
                });
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, isUserLoading, currentPage, selectedFilters, searchQuery, debouncedFetchAlerts, paginationManager]);

    // Fetch unread count
    const fetchUnreadCount = async () => {
        if (!user || isUserLoading) {
            console.log('Skipping unread count fetch - user not ready:', { user: !!user, isUserLoading });
            return;
        }

        try {
            const result = await getUnreadAlertCountAction();
            if (result.message === 'Unread alert count retrieved successfully' && result.data) {
                setUnreadCount(result.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Initial load
    useEffect(() => {
        if (user && !isUserLoading) {
            fetchAlerts();
            fetchUnreadCount();
        }
    }, [user, isUserLoading]);

    // Refetch when filters change
    useEffect(() => {
        if (user && !isUserLoading) {
            // Reset to first page when filters change
            if (currentPage !== 1) {
                setCurrentPage(1);
            } else {
                fetchAlerts(1);
            }
            // Clear pagination cache when filters change
            paginationManager.clear();
        }
    }, [selectedFilters, searchQuery, user, isUserLoading]);

    // Fetch when page changes
    useEffect(() => {
        if (user && !isUserLoading) {
            fetchAlerts(currentPage);
        }
    }, [currentPage, fetchAlerts, user, isUserLoading]);

    // Handle mark as read
    const handleMarkAsRead = async (alertId: string) => {
        try {
            const result = await markAlertAsReadAction(alertId);
            if (result.message === 'Alert marked as read successfully') {
                setAlerts(prev => prev.map(alert =>
                    alert.id === alertId
                        ? { ...alert, status: 'read' as AlertStatus, readAt: new Date().toISOString() }
                        : alert
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
                toast({ title: 'Alert marked as read' });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error marking alert as read:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to mark alert as read',
            });
        }
    };

    // Handle view details
    const handleViewDetails = (alert: Alert) => {
        setSelectedAlert(alert);
        setIsModalOpen(true);
    };

    // Handle dismiss
    const handleDismiss = async (alertId: string) => {
        try {
            const result = await dismissAlertAction(alertId);
            if (result.message === 'Alert dismissed successfully') {
                setAlerts(prev => prev.filter(alert => alert.id !== alertId));
                // Update unread count if the dismissed alert was unread
                const dismissedAlert = alerts.find(alert => alert.id === alertId);
                if (dismissedAlert?.status === 'unread') {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                toast({ title: 'Alert dismissed' });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error dismissing alert:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to dismiss alert',
            });
        }
    };

    if (isUserLoading) {
        return <StandardSkeleton variant="card" count={3} />;
    }

    return (
        <div className="space-y-6">
            {/* Performance Monitor (Development Only) */}
            <AlertPerformanceMonitor />

            {/* Search and Filters */}
            <StandardCard>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search alerts..."
                                className="w-full"
                            />
                        </div>
                    </div>

                    <FilterControls
                        filterGroups={filterGroups}
                        selectedFilters={selectedFilters}
                        onFilterChange={handleFilterChange}
                        onClearAll={handleClearAll}
                        className="flex-wrap"
                    />
                </div>
            </StandardCard>

            {/* Alerts List */}
            {isLoading ? (
                <AlertSkeletons.List count={pageSize} />
            ) : alerts.length === 0 ? (
                <StandardEmptyState
                    icon={<BellRing className="h-16 w-16 text-muted-foreground" />}
                    title="No Alerts Found"
                    description={
                        searchQuery || Object.values(selectedFilters).some(f => f.length > 0)
                            ? "No alerts match your current search and filters."
                            : "You don't have any market alerts yet. Alerts will appear here when market opportunities are detected."
                    }
                />
            ) : (
                <div className="space-y-4">
                    {alerts.map((alert) => (
                        <LazyAlertDetail
                            key={alert.id}
                            alert={alert}
                            onLoad={(loadedAlert) => {
                                // Optional: Handle alert load event
                            }}
                        >
                            {(loadedAlert, isLoadingDetail) => (
                                <AlertCard
                                    alert={loadedAlert}
                                    onMarkAsRead={handleMarkAsRead}
                                    onDismiss={handleDismiss}
                                    onViewDetails={handleViewDetails}
                                    isMobile={isMobile}
                                />
                            )}
                        </LazyAlertDetail>
                    ))}
                </div>
            )}

            {/* Alert Detail Modal */}
            <AlertDetailModal
                alert={selectedAlert}
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onMarkAsRead={handleMarkAsRead}
                onDismiss={handleDismiss}
            />
        </div>
    );
}