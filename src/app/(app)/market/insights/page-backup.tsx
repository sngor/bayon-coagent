'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Home,
    DollarSign,
    Calendar,
    MapPin,
    AlertCircle,
    Sparkles,
    RefreshCw,
    Filter,
    Download,
    Share2,
    BarChart3,
    Target,
    Clock,
    Zap,
    Eye,
    Bell
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';
import { generateMarketInsightsAction, saveMarketAlertAction } from '@/app/actions';
import { StandardLoadingState } from '@/components/standard';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';

interface MarketTrend {
    id: string;
    title: string;
    description: string;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    timeframe: string;
    category: 'pricing' | 'inventory' | 'demand' | 'demographics';
    location: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    source: string;
    lastUpdated: string;
}

interface LifeEvent {
    id: string;
    type: 'marriage' | 'divorce' | 'job_change' | 'retirement' | 'new_baby' | 'empty_nest';
    location: string;
    probability: number;
    timeframe: string;
    potentialClients: number;
    averagePrice: number;
    description: string;
}

interface MarketAlert {
    id: string;
    type: 'price_change' | 'new_listing' | 'market_shift' | 'opportunity';
    title: string;
    description: string;
    location: string;
    urgency: 'high' | 'medium' | 'low';
    createdAt: string;
    actionRequired: boolean;
}

interface MarketInsightsState {
    trends: MarketTrend[];
    lifeEvents: LifeEvent[];
    alerts: MarketAlert[];
    isLoading: boolean;
    lastUpdated: string | null;
    selectedLocation: string;
    selectedTimeframe: string;
    activeTab: string;
}

export default function MarketInsightsPage() {
    const { user } = useUser();
    const [state, setState] = useState<MarketInsightsState>({
        trends: [],
        lifeEvents: [],
        alerts: [],
        isLoading: false,
        lastUpdated: null,
        selectedLocation: 'all',
        selectedTimeframe: '30d',
        activeTab: 'trends'
    });

    // Load initial data
    useEffect(() => {
        if (user) {
            loadMarketData();
        }
    }, [user, state.selectedLocation, state.selectedTimeframe]);

    const loadMarketData = async () => {
        setState(prev => ({ ...prev, isLoading: true }));
        
        try {
            const result = await generateMarketInsightsAction({
                location: state.selectedLocation,
                timeframe: state.selectedTimeframe,
                includeLifeEvents: true,
                includeAlerts: true
            });

            if (result.data) {
                setState(prev => ({
                    ...prev,
                    trends: result.data.trends || [],
                    lifeEvents: result.data.lifeEvents || [],
                    alerts: result.data.alerts || [],
                    lastUpdated: new Date().toISOString(),
                    isLoading: false
                }));
            }
        } catch (error) {
            console.error('Failed to load market data:', error);
            toast({
                title: "Error loading market data",
                description: "Please try again later.",
                variant: "destructive"
            });
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleCreateAlert = async (trend: MarketTrend) => {
        try {
            await saveMarketAlertAction({
                type: 'market_shift',
                title: `${trend.title} Alert`,
                description: `Monitor changes in ${trend.title.toLowerCase()}`,
                location: trend.location,
                criteria: {
                    category: trend.category,
                    threshold: trend.percentage,
                    direction: trend.trend
                }
            });

            toast({
                title: "Alert created",
                description: "You'll be notified of changes to this trend.",
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Failed to create alert",
                description: "Please try again later.",
                variant: "destructive"
            });
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
            default: return <BarChart3 className="h-4 w-4 text-blue-500" />;
        }
    };

    const getLifeEventIcon = (type: LifeEvent['type']) => {
        const icons = {
            marriage: '💒',
            divorce: '💔',
            job_change: '💼',
            retirement: '🏖️',
            new_baby: '👶',
            empty_nest: '🏠'
        };
        return icons[type] || '📊';
    };

    const filteredTrends = useMemo(() => {
        return state.trends.filter(trend => 
            state.selectedLocation === 'all' || trend.location === state.selectedLocation
        );
    }, [state.trends, state.selectedLocation]);

    const filteredLifeEvents = useMemo(() => {
        return state.lifeEvents.filter(event => 
            state.selectedLocation === 'all' || event.location === state.selectedLocation
        );
    }, [state.lifeEvents, state.selectedLocation]);

    if (state.isLoading && state.trends.length === 0) {
        return <StandardLoadingState title="Loading market insights..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Market Insights"
                description="AI-powered market intelligence and trend analysis"
                icon={BarChart3}
                actions={
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            onClick={loadMarketData}
                            disabled={state.isLoading}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button>
                            <Download className="mr-2 h-4 w-4" />
                            Export Report
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Select 
                                value={state.selectedLocation} 
                                onValueChange={(value) => setState(prev => ({ ...prev, selectedLocation: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="downtown">Downtown</SelectItem>
                                    <SelectItem value="suburbs">Suburbs</SelectItem>
                                    <SelectItem value="waterfront">Waterfront</SelectItem>
                                    <SelectItem value="historic">Historic District</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="timeframe">Timeframe</Label>
                            <Select 
                                value={state.selectedTimeframe} 
                                onValueChange={(value) => setState(prev => ({ ...prev, selectedTimeframe: value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select timeframe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 days</SelectItem>
                                    <SelectItem value="30d">Last 30 days</SelectItem>
                                    <SelectItem value="90d">Last 90 days</SelectItem>
                                    <SelectItem value="1y">Last year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            {state.lastUpdated && (
                                <div className="text-sm text-muted-foreground">
                                    <Clock className="inline h-4 w-4 mr-1" />
                                    Updated {new Date(state.lastUpdated).toLocaleTimeString()}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trends">Market Trends</TabsTrigger>
                    <TabsTrigger value="life-events">Life Events</TabsTrigger>
                    <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-4">
                    {filteredTrends.length === 0 ? (
                        <IntelligentEmptyState
                            icon={BarChart3}
                            title="No market trends available"
                            description="Market trend data will appear here once analysis is complete."
                            action={
                                <Button onClick={loadMarketData} disabled={state.isLoading}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Load Trends
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-4">
                            {filteredTrends.map((trend) => (
                                <Card key={trend.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {getTrendIcon(trend.trend)}
                                                <div>
                                                    <CardTitle className="text-lg">{trend.title}</CardTitle>
                                                    <CardDescription>{trend.description}</CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={trend.impact === 'high' ? 'destructive' : trend.impact === 'medium' ? 'default' : 'secondary'}>
                                                    {trend.impact} impact
                                                </Badge>
                                                <Badge variant="outline">
                                                    {Math.abs(trend.percentage)}% {trend.trend}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Location</div>
                                                <div className="font-medium">{trend.location}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Category</div>
                                                <div className="font-medium capitalize">{trend.category}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Confidence</div>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={trend.confidence} className="w-16" />
                                                    <span className="text-sm">{trend.confidence}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Source</div>
                                                <div className="font-medium">{trend.source}</div>
                                            </div>
                                        </div>
                                        
                                        {trend.actionable && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleCreateAlert(trend)}
                                                >
                                                    <Bell className="mr-2 h-4 w-4" />
                                                    Create Alert
                                                </Button>
                                                <Button size="sm" variant="outline">
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="life-events" className="space-y-4">
                    {filteredLifeEvents.length === 0 ? (
                        <IntelligentEmptyState
                            icon={Users}
                            title="No life events detected"
                            description="Life event predictions will appear here to help you identify potential clients."
                            action={
                                <Button onClick={loadMarketData} disabled={state.isLoading}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Analyze Events
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-4">
                            {filteredLifeEvents.map((event) => (
                                <Card key={event.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{getLifeEventIcon(event.type)}</span>
                                                <div>
                                                    <CardTitle className="text-lg capitalize">
                                                        {event.type.replace('_', ' ')} Opportunities
                                                    </CardTitle>
                                                    <CardDescription>{event.description}</CardDescription>
                                                </div>
                                            </div>
                                            <Badge variant="outline">
                                                {event.probability}% probability
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">Location</div>
                                                <div className="font-medium">{event.location}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Potential Clients</div>
                                                <div className="font-medium">{event.potentialClients.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Avg. Price Range</div>
                                                <div className="font-medium">${event.averagePrice.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-muted-foreground">Timeframe</div>
                                                <div className="font-medium">{event.timeframe}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <Button size="sm">
                                                <Target className="mr-2 h-4 w-4" />
                                                Create Campaign
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Zap className="mr-2 h-4 w-4" />
                                                Generate Content
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="alerts" className="space-y-4">
                    {state.alerts.length === 0 ? (
                        <IntelligentEmptyState
                            icon={Bell}
                            title="No active alerts"
                            description="Market alerts will appear here when significant changes are detected."
                            action={
                                <Button onClick={loadMarketData} disabled={state.isLoading}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Check for Alerts
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-4">
                            {state.alerts.map((alert) => (
                                <Alert key={alert.id} className={`border-l-4 ${
                                    alert.urgency === 'high' ? 'border-l-red-500' :
                                    alert.urgency === 'medium' ? 'border-l-yellow-500' :
                                    'border-l-blue-500'
                                }`}>
                                    <AlertCircle className="h-4 w-4" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold">{alert.title}</h4>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={alert.urgency === 'high' ? 'destructive' : 'default'}>
                                                    {alert.urgency} priority
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(alert.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <AlertDescription className="mb-3">
                                            {alert.description}
                                        </AlertDescription>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            {alert.location}
                                        </div>
                                        {alert.actionRequired && (
                                            <div className="mt-3 flex gap-2">
                                                <Button size="sm">Take Action</Button>
                                                <Button size="sm" variant="outline">Dismiss</Button>
                                            </div>
                                        )}
                                    </div>
                                </Alert>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
    confidence: number;
}

interface LifeEvent {
    id: string;
    type: 'marriage' | 'divorce' | 'job_change' | 'retirement' | 'birth' | 'death';
    location: string;
    predictedCount: number;
    timeframe: string;
    confidence: number;
    marketImpact: 'high' | 'medium' | 'low';
    description: string;
}

const mockTrends: MarketTrend[] = [
    {
        id: '1',
        title: 'Home Prices Rising',
        description: 'Median home prices have increased due to low inventory and high demand from millennials entering the market.',
        trend: 'up',
        percentage: 8.5,
        timeframe: 'Last 3 months',
        category: 'pricing',
        location: 'Seattle, WA',
        confidence: 92
    },
    {
        id: '2',
        title: 'Inventory Shortage',
        description: 'Available homes for sale have decreased significantly, creating a competitive buyer market.',
        trend: 'down',
        percentage: -15.2,
        timeframe: 'Last 6 months',
        category: 'inventory',
        location: 'Seattle, WA',
        confidence: 88
    },
    {
        id: '3',
        title: 'First-Time Buyer Activity',
        description: 'Increased activity from first-time homebuyers taking advantage of assistance programs.',
        trend: 'up',
        percentage: 12.3,
        timeframe: 'Last month',
        category: 'demand',
        location: 'Seattle, WA',
        confidence: 85
    }
];

const mockLifeEvents: LifeEvent[] = [
    {
        id: '1',
        type: 'marriage',
        location: 'King County, WA',
        predictedCount: 1250,
        timeframe: 'Next 6 months',
        confidence: 78,
        marketImpact: 'high',
        description: 'Newlyweds typically purchase their first home within 2 years of marriage'
    },
    {
        id: '2',
        type: 'job_change',
        location: 'Seattle Metro',
        predictedCount: 3400,
        timeframe: 'Next 3 months',
        confidence: 82,
        marketImpact: 'medium',
        description: 'Job relocations often trigger home purchases in new areas'
    },
    {
        id: '3',
        type: 'retirement',
        location: 'Eastside',
        predictedCount: 890,
        timeframe: 'Next 12 months',
        confidence: 75,
        marketImpact: 'medium',
        description: 'Retirees often downsize or relocate to retirement-friendly communities'
    }
];

export default function MarketInsightsPage() {
    const { user } = useUser();
    const [selectedLocation, setSelectedLocation] = useState('Seattle, WA');
    const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
    const [trends] = useState<MarketTrend[]>(mockTrends);
    const [lifeEvents] = useState<LifeEvent[]>(mockLifeEvents);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('trends');

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-600" />;
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-600" />;
            default:
                return <TrendingUp className="h-4 w-4 text-gray-600" />;
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getLifeEventIcon = (type: LifeEvent['type']) => {
        switch (type) {
            case 'marriage':
                return '💒';
            case 'divorce':
                return '💔';
            case 'job_change':
                return '💼';
            case 'retirement':
                return '🏖️';
            case 'birth':
                return '👶';
            case 'death':
                return '🕊️';
            default:
                return '📅';
        }
    };

    const getLifeEventLabel = (type: LifeEvent['type']) => {
        switch (type) {
            case 'marriage':
                return 'Marriages';
            case 'divorce':
                return 'Divorces';
            case 'job_change':
                return 'Job Changes';
            case 'retirement':
                return 'Retirements';
            case 'birth':
                return 'Births';
            case 'death':
                return 'Deaths';
            default:
                return 'Life Events';
        }
    };

    const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
        switch (impact) {
            case 'high':
                return 'bg-red-100 text-red-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
        }
    };

    const refreshData = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast({
                title: 'Data Refreshed',
                description: 'Market insights have been updated with the latest data.',
            });
        } catch (error) {
            toast({
                title: 'Refresh Failed',
                description: 'Unable to refresh market data. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const exportData = () => {
        toast({
            title: 'Export Started',
            description: 'Your market insights report is being prepared for download.',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Market Insights"
                description="Track market trends and life event predictions to identify opportunities"
                icon={TrendingUp}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={exportData}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline" onClick={refreshData} disabled={isLoading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                }
            />

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Seattle, WA">Seattle, WA</SelectItem>
                                    <SelectItem value="Bellevue, WA">Bellevue, WA</SelectItem>
                                    <SelectItem value="Tacoma, WA">Tacoma, WA</SelectItem>
                                    <SelectItem value="King County, WA">King County, WA</SelectItem>
                                    <SelectItem value="Pierce County, WA">Pierce County, WA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="timeframe">Timeframe</Label>
                            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select timeframe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1month">Last Month</SelectItem>
                                    <SelectItem value="3months">Last 3 Months</SelectItem>
                                    <SelectItem value="6months">Last 6 Months</SelectItem>
                                    <SelectItem value="1year">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button className="w-full">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Analyze Market
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="trends">Market Trends</TabsTrigger>
                    <TabsTrigger value="life-events">Life Event Predictions</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="space-y-6">
                    <div className="grid gap-6">
                        {trends.map((trend) => (
                            <Card key={trend.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {getTrendIcon(trend.trend)}
                                            <div>
                                                <CardTitle className="text-lg">{trend.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {trend.location}
                                                    <span>•</span>
                                                    {trend.timeframe}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${getTrendColor(trend.trend)}`}>
                                                {trend.trend === 'up' ? '+' : ''}{trend.percentage}%
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {trend.confidence}% confidence
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">{trend.description}</p>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className="capitalize">
                                            {trend.category}
                                        </Badge>
                                        <Button variant="ghost" size="sm">
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Share Insight
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="life-events" className="space-y-6">
                    <div className="grid gap-6">
                        {lifeEvents.map((event) => (
                            <Card key={event.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="text-2xl">{getLifeEventIcon(event.type)}</div>
                                            <div>
                                                <CardTitle className="text-lg">{getLifeEventLabel(event.type)}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {event.location}
                                                    <span>•</span>
                                                    {event.timeframe}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-primary">
                                                {event.predictedCount.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {event.confidence}% confidence
                                                </Badge>
                                                <Badge className={`text-xs ${getImpactColor(event.marketImpact)}`}>
                                                    {event.marketImpact} impact
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">{event.description}</p>
                                    <div className="flex items-center gap-4">
                                        <Button variant="outline" size="sm">
                                            <Users className="h-4 w-4 mr-2" />
                                            Target Audience
                                        </Button>
                                        <Button variant="ghost" size="sm">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            Set Reminder
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg. Home Price</p>
                                <p className="text-2xl font-bold">$785K</p>
                                <p className="text-xs text-green-600">+5.2% from last month</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Market Activity</p>
                                <p className="text-2xl font-bold">High</p>
                                <p className="text-xs text-green-600">Above seasonal average</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-orange-600" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Days on Market</p>
                                <p className="text-2xl font-bold">18</p>
                                <p className="text-xs text-red-600">-3 days from last month</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-600" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Life Events</p>
                                <p className="text-2xl font-bold">5.5K</p>
                                <p className="text-xs text-blue-600">Predicted next 6 months</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}