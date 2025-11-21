'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    TrendingUp,
    Users,
    Home,
    DollarSign,
    MapPin,
    Calendar,
    Star,
    AlertTriangle,
    Info,
    CheckCircle,
    Eye,
    X,
    Phone,
    Mail,
    MessageSquare,
    ExternalLink,
    Building,
    Bed,
    Bath,
    Square,
    Clock,
    Target,
    TrendingDown,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Alert } from '@/lib/alerts/types';

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

interface AlertDetailModalProps {
    alert: Alert | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onMarkAsRead: (alertId: string) => void;
    onDismiss: (alertId: string) => void;
}

export function AlertDetailModal({
    alert,
    open,
    onOpenChange,
    onMarkAsRead,
    onDismiss
}: AlertDetailModalProps) {
    const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
    const [isDismissing, setIsDismissing] = useState(false);

    if (!alert) return null;

    const typeConfig = ALERT_TYPE_CONFIG[alert.type];
    const priorityConfig = PRIORITY_CONFIG[alert.priority];
    const TypeIcon = typeConfig.icon;
    const PriorityIcon = priorityConfig.icon;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const handleMarkAsRead = async () => {
        if (alert.status === 'read') return;

        setIsMarkingAsRead(true);
        try {
            await onMarkAsRead(alert.id);
        } catch (error) {
            console.error('Error marking as read:', error);
        } finally {
            setIsMarkingAsRead(false);
        }
    };

    const handleDismiss = async () => {
        setIsDismissing(true);
        try {
            await onDismiss(alert.id);
            onOpenChange(false);
        } catch (error) {
            console.error('Error dismissing alert:', error);
        } finally {
            setIsDismissing(false);
        }
    };

    const renderAlertContent = () => {
        switch (alert.type) {
            case 'life-event-lead':
                return (
                    <div className="space-y-6">
                        {/* Lead Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Lead Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span>{alert.data.prospectLocation}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                                        <div className="mt-1">
                                            <Badge variant="outline" className="capitalize">
                                                {alert.data.eventType.replace('-', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Event Date</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span>{formatDate(alert.data.eventDate)}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Lead Score</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Star className="w-4 h-4 text-yellow-500" />
                                            <span className="font-semibold">{alert.data.leadScore}/100</span>
                                        </div>
                                    </div>
                                </div>

                                {alert.data.additionalEvents && alert.data.additionalEvents.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Additional Events</label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {alert.data.additionalEvents.map((event, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                    {event}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recommended Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Recommended Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm leading-relaxed">{alert.data.recommendedAction}</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <Button size="sm" variant="outline">
                                        <Phone className="w-4 h-4 mr-2" />
                                        Call Prospect
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Email
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Send Message
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'competitor-new-listing':
            case 'competitor-price-reduction':
            case 'competitor-withdrawal':
                return (
                    <div className="space-y-6">
                        {/* Property Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Home className="w-5 h-5" />
                                    Property Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">Property Address</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{alert.data.propertyAddress}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Competitor</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Building className="w-4 h-4 text-muted-foreground" />
                                            <span>{alert.data.competitorName}</span>
                                        </div>
                                    </div>
                                    {alert.data.daysOnMarket && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Days on Market</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>{alert.data.daysOnMarket} days</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Price Information */}
                                {(alert.data.listingPrice || alert.data.originalPrice || alert.data.newPrice) && (
                                    <div className="space-y-3">
                                        <Separator />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {alert.data.listingPrice && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Listing Price</label>
                                                    <div className="text-lg font-semibold text-green-600 mt-1">
                                                        {formatCurrency(alert.data.listingPrice)}
                                                    </div>
                                                </div>
                                            )}
                                            {alert.data.originalPrice && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">Original Price</label>
                                                    <div className="text-lg font-semibold text-muted-foreground line-through mt-1">
                                                        {formatCurrency(alert.data.originalPrice)}
                                                    </div>
                                                </div>
                                            )}
                                            {alert.data.newPrice && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">New Price</label>
                                                    <div className="text-lg font-semibold text-orange-600 mt-1">
                                                        {formatCurrency(alert.data.newPrice)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {alert.data.priceReduction && alert.data.priceReductionPercent && (
                                            <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <TrendingDown className="w-5 h-5 text-orange-600" />
                                                    <span className="font-medium text-orange-600">
                                                        Price Reduced by {formatCurrency(alert.data.priceReduction)} ({alert.data.priceReductionPercent}%)
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recommended Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Recommended Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {alert.type === 'competitor-new-listing' && (
                                        <p className="text-sm leading-relaxed">
                                            A competitor has listed a new property in your target area. Consider reaching out to neighbors who might be interested in selling or buyers looking in this area.
                                        </p>
                                    )}
                                    {alert.type === 'competitor-price-reduction' && (
                                        <p className="text-sm leading-relaxed">
                                            This price reduction might indicate market softening or property issues. Consider informing your buyers about this opportunity and analyzing comparable properties.
                                        </p>
                                    )}
                                    {alert.type === 'competitor-withdrawal' && (
                                        <p className="text-sm leading-relaxed">
                                            This property was withdrawn from the market. The seller might be open to working with a new agent or reconsidering their pricing strategy.
                                        </p>
                                    )}

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <Button size="sm" variant="outline">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View Property
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Contact Neighbors
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Notify Buyers
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'neighborhood-trend':
                return (
                    <div className="space-y-6">
                        {/* Trend Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Trend Analysis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">Neighborhood</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{alert.data.neighborhood}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Trend Type</label>
                                        <div className="mt-1">
                                            <Badge variant="outline" className="capitalize">
                                                {alert.data.trendType.replace('-', ' ')}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Change</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            <span className="font-semibold text-green-600">
                                                {alert.data.changePercent > 0 ? '+' : ''}{alert.data.changePercent}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Current vs Previous Values */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Previous Value</label>
                                        <div className="text-lg font-semibold mt-1">
                                            {alert.data.trendType.includes('price')
                                                ? formatCurrency(alert.data.previousValue)
                                                : alert.data.previousValue.toLocaleString()
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Current Value</label>
                                        <div className="text-lg font-semibold text-green-600 mt-1">
                                            {alert.data.trendType.includes('price')
                                                ? formatCurrency(alert.data.currentValue)
                                                : alert.data.currentValue.toLocaleString()
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Historical Context */}
                                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Historical Context</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-blue-700 dark:text-blue-300">90-day average:</span>
                                            <span className="ml-2 font-medium">
                                                {alert.data.historicalContext.avg90Day.toLocaleString()}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-blue-700 dark:text-blue-300">365-day average:</span>
                                            <span className="ml-2 font-medium">
                                                {alert.data.historicalContext.avg365Day.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommended Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Recommended Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <p className="text-sm leading-relaxed">
                                        This trend indicates significant market movement in {alert.data.neighborhood}.
                                        Consider creating content about this trend to establish yourself as a market expert.
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <Button size="sm" variant="outline">
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Create Market Report
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Share on Social
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Email Clients
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'price-reduction':
                return (
                    <div className="space-y-6">
                        {/* Property Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Home className="w-5 h-5" />
                                    Property Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-muted-foreground">Property Address</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{alert.data.propertyAddress}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Days on Market</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>{alert.data.daysOnMarket} days</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Information */}
                                <div className="space-y-3">
                                    <Separator />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Original Price</label>
                                            <div className="text-lg font-semibold text-muted-foreground line-through mt-1">
                                                {formatCurrency(alert.data.originalPrice)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">New Price</label>
                                            <div className="text-lg font-semibold text-green-600 mt-1">
                                                {formatCurrency(alert.data.newPrice)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <TrendingDown className="w-5 h-5 text-orange-600" />
                                            <span className="font-medium text-orange-600">
                                                Price Reduced by {formatCurrency(alert.data.priceReduction)} ({alert.data.priceReductionPercent}%)
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Property Details */}
                                <div className="space-y-3">
                                    <Separator />
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Bed className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {alert.data.propertyDetails.bedrooms} bed{alert.data.propertyDetails.bedrooms !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Bath className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {alert.data.propertyDetails.bathrooms} bath{alert.data.propertyDetails.bathrooms !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Square className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {alert.data.propertyDetails.squareFeet.toLocaleString()} sq ft
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm capitalize">
                                                {alert.data.propertyDetails.propertyType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommended Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Recommended Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <p className="text-sm leading-relaxed">
                                        This property has reduced its price, making it a potential opportunity for your buyers.
                                        The price reduction might indicate motivated sellers or market adjustment.
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <Button size="sm" variant="outline">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View Property
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Phone className="w-4 h-4 mr-2" />
                                            Call Buyers
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Mail className="w-4 h-4 mr-2" />
                                            Send Alert
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Alert details not available</p>
                    </div>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start gap-4">
                        {/* Alert Type Icon */}
                        <div className={cn(
                            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                            typeConfig.color,
                            'text-white'
                        )}>
                            <TypeIcon className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant={typeConfig.variant}>
                                    {typeConfig.label}
                                </Badge>
                                <div className={cn(
                                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                                    priorityConfig.bgColor,
                                    priorityConfig.color
                                )}>
                                    <PriorityIcon className="w-3 h-3" />
                                    {priorityConfig.label} Priority
                                </div>
                                {alert.status === 'unread' && (
                                    <Badge variant="destructive" className="text-xs">
                                        Unread
                                    </Badge>
                                )}
                            </div>

                            <DialogTitle className="text-xl font-semibold">
                                {typeConfig.label} Alert
                            </DialogTitle>

                            <DialogDescription className="flex items-center gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Created {formatDate(alert.createdAt)}
                                </div>
                                {alert.readAt && (
                                    <div className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        Read {formatDate(alert.readAt)}
                                    </div>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-6">
                    {renderAlertContent()}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <div className="flex gap-2 w-full sm:w-auto">
                        {alert.status === 'unread' && (
                            <Button
                                variant="outline"
                                onClick={handleMarkAsRead}
                                disabled={isMarkingAsRead}
                                className="flex-1 sm:flex-none"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                {isMarkingAsRead ? 'Marking...' : 'Mark as Read'}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={handleDismiss}
                            disabled={isDismissing}
                            className="flex-1 sm:flex-none"
                        >
                            <X className="w-4 h-4 mr-2" />
                            {isDismissing ? 'Dismissing...' : 'Dismiss'}
                        </Button>
                    </div>
                    <Button onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}