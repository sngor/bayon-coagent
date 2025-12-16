'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
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
    Bell,
    Plus,
    Settings,
    Trash2,
    Edit,
    MapPin,
    DollarSign,
    Home,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';

interface MarketAlert {
    id: string;
    name: string;
    type: 'price_change' | 'new_listing' | 'market_trend' | 'inventory_change';
    location: string;
    criteria: {
        priceMin?: number;
        priceMax?: number;
        propertyType?: string;
        changeThreshold?: number;
    };
    isActive: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    createdAt: string;
    lastTriggered?: string;
    triggerCount: number;
}

interface AlertNotification {
    id: string;
    alertId: string;
    alertName: string;
    message: string;
    type: 'price_increase' | 'price_decrease' | 'new_listing' | 'trend_change';
    timestamp: string;
    isRead: boolean;
    data?: any;
}

const mockAlerts: MarketAlert[] = [
    {
        id: '1',
        name: 'Seattle Luxury Homes Price Drop',
        type: 'price_change',
        location: 'Seattle, WA',
        criteria: {
            priceMin: 1000000,
            propertyType: 'Single-Family Home',
            changeThreshold: -5
        },
        isActive: true,
        frequency: 'immediate',
        createdAt: '2024-01-10T10:00:00Z',
        lastTriggered: '2024-01-14T15:30:00Z',
        triggerCount: 3
    },
    {
        id: '2',
        name: 'New Condos in Bellevue',
        type: 'new_listing',
        location: 'Bellevue, WA',
        criteria: {
            priceMax: 800000,
            propertyType: 'Condo'
        },
        isActive: true,
        frequency: 'daily',
        createdAt: '2024-01-08T14:20:00Z',
        lastTriggered: '2024-01-15T09:00:00Z',
        triggerCount: 12
    },
    {
        id: '3',
        name: 'King County Market Trends',
        type: 'market_trend',
        location: 'King County, WA',
        criteria: {
            changeThreshold: 10
        },
        isActive: false,
        frequency: 'weekly',
        createdAt: '2024-01-05T16:45:00Z',
        triggerCount: 0
    }
];

const mockNotifications: AlertNotification[] = [
    {
        id: '1',
        alertId: '1',
        alertName: 'Seattle Luxury Homes Price Drop',
        message: '3 luxury homes in Seattle reduced prices by 5-8%',
        type: 'price_decrease',
        timestamp: '2024-01-15T15:30:00Z',
        isRead: false
    },
    {
        id: '2',
        alertId: '2',
        alertName: 'New Condos in Bellevue',
        message: '5 new condos listed under $800K in Bellevue',
        type: 'new_listing',
        timestamp: '2024-01-15T09:00:00Z',
        isRead: false
    },
    {
        id: '3',
        alertId: '1',
        alertName: 'Seattle Luxury Homes Price Drop',
        message: 'Luxury home at 123 Pine St reduced by $150K',
        type: 'price_decrease',
        timestamp: '2024-01-14T15:30:00Z',
        isRead: true
    }
];

export default function MarketAlertsPage() {
    const { user } = useUser();
    const [alerts, setAlerts] = useState<MarketAlert[]>(mockAlerts);
    const [notifications, setNotifications] = useState<AlertNotification[]>(mockNotifications);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingAlert, setEditingAlert] = useState<MarketAlert | null>(null);

    // New alert form state
    const [newAlert, setNewAlert] = useState({
        name: '',
        type: 'price_change' as MarketAlert['type'],
        location: '',
        priceMin: '',
        priceMax: '',
        propertyType: '',
        changeThreshold: '',
        frequency: 'daily' as MarketAlert['frequency']
    });

    const resetNewAlert = () => {
        setNewAlert({
            name: '',
            type: 'price_change',
            location: '',
            priceMin: '',
            priceMax: '',
            propertyType: '',
            changeThreshold: '',
            frequency: 'daily'
        });
    };

    const handleCreateAlert = () => {
        if (!newAlert.name || !newAlert.location) {
            toast({
                title: 'Missing Information',
                description: 'Please provide a name and location for your alert.',
                variant: 'destructive',
            });
            return;
        }

        const alert: MarketAlert = {
            id: Date.now().toString(),
            name: newAlert.name,
            type: newAlert.type,
            location: newAlert.location,
            criteria: {
                priceMin: newAlert.priceMin ? parseInt(newAlert.priceMin) : undefined,
                priceMax: newAlert.priceMax ? parseInt(newAlert.priceMax) : undefined,
                propertyType: newAlert.propertyType || undefined,
                changeThreshold: newAlert.changeThreshold ? parseInt(newAlert.changeThreshold) : undefined,
            },
            isActive: true,
            frequency: newAlert.frequency,
            createdAt: new Date().toISOString(),
            triggerCount: 0
        };

        setAlerts(prev => [...prev, alert]);
        setShowCreateDialog(false);
        resetNewAlert();

        toast({
            title: 'Alert Created',
            description: `"${alert.name}" is now monitoring the market for you.`,
        });
    };

    const toggleAlert = (alertId: string) => {
        setAlerts(prev => prev.map(alert =>
            alert.id === alertId
                ? { ...alert, isActive: !alert.isActive }
                : alert
        ));

        const alert = alerts.find(a => a.id === alertId);
        toast({
            title: alert?.isActive ? 'Alert Disabled' : 'Alert Enabled',
            description: alert?.isActive
                ? `"${alert.name}" will no longer send notifications.`
                : `"${alert.name}" is now active and monitoring.`,
        });
    };

    const deleteAlert = (alertId: string) => {
        const alert = alerts.find(a => a.id === alertId);
        setAlerts(prev => prev.filter(a => a.id !== alertId));

        toast({
            title: 'Alert Deleted',
            description: `"${alert?.name}" has been removed.`,
        });
    };

    const markNotificationRead = (notificationId: string) => {
        setNotifications(prev => prev.map(notif =>
            notif.id === notificationId
                ? { ...notif, isRead: true }
                : notif
        ));
    };

    const getAlertTypeIcon = (type: MarketAlert['type']) => {
        switch (type) {
            case 'price_change':
                return <DollarSign className="h-4 w-4" />;
            case 'new_listing':
                return <Home className="h-4 w-4" />;
            case 'market_trend':
                return <TrendingUp className="h-4 w-4" />;
            case 'inventory_change':
                return <AlertCircle className="h-4 w-4" />;
        }
    };

    const getAlertTypeLabel = (type: MarketAlert['type']) => {
        switch (type) {
            case 'price_change':
                return 'Price Change';
            case 'new_listing':
                return 'New Listing';
            case 'market_trend':
                return 'Market Trend';
            case 'inventory_change':
                return 'Inventory Change';
        }
    };

    const getNotificationIcon = (type: AlertNotification['type']) => {
        switch (type) {
            case 'price_increase':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'price_decrease':
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            case 'new_listing':
                return <Home className="h-4 w-4 text-blue-600" />;
            case 'trend_change':
                return <AlertCircle className="h-4 w-4 text-orange-600" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Alerts</h1>
                    <p className="text-muted-foreground">
                        Get notified about price changes, new listings, and market trends
                    </p>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Alert
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create Market Alert</DialogTitle>
                            <DialogDescription>
                                Set up automated notifications for market changes that matter to you.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="alert-name">Alert Name</Label>
                                <Input
                                    id="alert-name"
                                    placeholder="e.g., Downtown Seattle Price Drops"
                                    value={newAlert.name}
                                    onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="alert-type">Alert Type</Label>
                                    <Select value={newAlert.type} onValueChange={(value: MarketAlert['type']) => setNewAlert(prev => ({ ...prev, type: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="price_change">Price Change</SelectItem>
                                            <SelectItem value="new_listing">New Listing</SelectItem>
                                            <SelectItem value="market_trend">Market Trend</SelectItem>
                                            <SelectItem value="inventory_change">Inventory Change</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="frequency">Frequency</Label>
                                    <Select value={newAlert.frequency} onValueChange={(value: MarketAlert['frequency']) => setNewAlert(prev => ({ ...prev, frequency: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="immediate">Immediate</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    placeholder="e.g., Seattle, WA or King County"
                                    value={newAlert.location}
                                    onChange={(e) => setNewAlert(prev => ({ ...prev, location: e.target.value }))}
                                />
                            </div>

                            {(newAlert.type === 'price_change' || newAlert.type === 'new_listing') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="price-min">Min Price</Label>
                                        <Input
                                            id="price-min"
                                            type="number"
                                            placeholder="500000"
                                            value={newAlert.priceMin}
                                            onChange={(e) => setNewAlert(prev => ({ ...prev, priceMin: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price-max">Max Price</Label>
                                        <Input
                                            id="price-max"
                                            type="number"
                                            placeholder="1000000"
                                            value={newAlert.priceMax}
                                            onChange={(e) => setNewAlert(prev => ({ ...prev, priceMax: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {newAlert.type === 'price_change' && (
                                <div className="space-y-2">
                                    <Label htmlFor="change-threshold">Price Change Threshold (%)</Label>
                                    <Input
                                        id="change-threshold"
                                        type="number"
                                        placeholder="5 (for 5% change)"
                                        value={newAlert.changeThreshold}
                                        onChange={(e) => setNewAlert(prev => ({ ...prev, changeThreshold: e.target.value }))}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="property-type">Property Type (Optional)</Label>
                                <Select value={newAlert.propertyType} onValueChange={(value) => setNewAlert(prev => ({ ...prev, propertyType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All property types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Types</SelectItem>
                                        <SelectItem value="Single-Family Home">Single-Family Home</SelectItem>
                                        <SelectItem value="Condo">Condo</SelectItem>
                                        <SelectItem value="Townhouse">Townhouse</SelectItem>
                                        <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateAlert}>
                                Create Alert
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Active Alerts */}
                <div className="lg:col-span-2 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Your Alerts ({alerts.length})
                            </CardTitle>
                            <CardDescription>
                                Manage your market monitoring alerts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Alerts Set</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create your first alert to start monitoring the market
                                    </p>
                                    <Button onClick={() => setShowCreateDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Alert
                                    </Button>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <Card key={alert.id} className={`${alert.isActive ? 'border-green-200' : 'border-gray-200'}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${alert.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                        {getAlertTypeIcon(alert.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{alert.name}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline">
                                                                {getAlertTypeLabel(alert.type)}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {alert.frequency}
                                                            </Badge>
                                                            {alert.isActive ? (
                                                                <Badge className="bg-green-100 text-green-800">Active</Badge>
                                                            ) : (
                                                                <Badge variant="secondary">Paused</Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {alert.location}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Bell className="h-3 w-3" />
                                                                {alert.triggerCount} triggers
                                                            </div>
                                                            {alert.lastTriggered && (
                                                                <div className="flex items-center gap-1">
                                                                    <Clock className="h-3 w-3" />
                                                                    Last: {formatDate(alert.lastTriggered)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={alert.isActive}
                                                        onCheckedChange={() => toggleAlert(alert.id)}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingAlert(alert)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteAlert(alert.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Notifications */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Recent Notifications
                                {unreadCount > 0 && (
                                    <Badge className="bg-red-100 text-red-800">
                                        {unreadCount} new
                                    </Badge>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {notifications.length === 0 ? (
                                <div className="text-center py-6">
                                    <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${notification.isRead
                                                ? 'bg-gray-50 border-gray-200'
                                                : 'bg-blue-50 border-blue-200'
                                            }`}
                                        onClick={() => markNotificationRead(notification.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {notification.alertName}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {formatDate(notification.timestamp)}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}