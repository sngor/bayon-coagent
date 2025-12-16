'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Home,
    Users,
    Calendar,
    MapPin,
    Download,
    RefreshCw,
    Filter,
    Eye,
    Share2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth/use-user';

interface MarketMetric {
    id: string;
    name: string;
    value: number;
    change: number;
    changeType: 'increase' | 'decrease';
    period: string;
    unit: string;
    category: 'pricing' | 'inventory' | 'activity' | 'demographics';
}

interface PerformanceData {
    period: string;
    medianPrice: number;
    salesVolume: number;
    daysOnMarket: number;
    pricePerSqFt: number;
    inventoryLevel: number;
}

interface CompetitorAnalysis {
    agentName: string;
    salesVolume: number;
    avgPrice: number;
    marketShare: number;
    specialties: string[];
    performance: 'outperforming' | 'average' | 'underperforming';
}

const mockMetrics: MarketMetric[] = [
    {
        id: '1',
        name: 'Median Home Price',
        value: 785000,
        change: 5.2,
        changeType: 'increase',
        period: 'vs last month',
        unit: 'currency',
        category: 'pricing'
    },
    {
        id: '2',
        name: 'Active Listings',
        value: 1247,
        change: -12.8,
        changeType: 'decrease',
        period: 'vs last month',
        unit: 'number',
        category: 'inventory'
    },
    {
        id: '3',
        name: 'Days on Market',
        value: 18,
        change: -15.2,
        changeType: 'decrease',
        period: 'vs last month',
        unit: 'days',
        category: 'activity'
    },
    {
        id: '4',
        name: 'Sales Volume',
        value: 892,
        change: 8.7,
        changeType: 'increase',
        period: 'vs last month',
        unit: 'number',
        category: 'activity'
    },
    {
        id: '5',
        name: 'Price per Sq Ft',
        value: 485,
        change: 3.1,
        changeType: 'increase',
        period: 'vs last month',
        unit: 'currency',
        category: 'pricing'
    },
    {
        id: '6',
        name: 'New Listings',
        value: 324,
        change: -5.4,
        changeType: 'decrease',
        period: 'vs last month',
        unit: 'number',
        category: 'inventory'
    }
];

const mockPerformanceData: PerformanceData[] = [
    { period: 'Jan 2024', medianPrice: 750000, salesVolume: 820, daysOnMarket: 25, pricePerSqFt: 465, inventoryLevel: 1450 },
    { period: 'Feb 2024', medianPrice: 762000, salesVolume: 745, daysOnMarket: 22, pricePerSqFt: 472, inventoryLevel: 1380 },
    { period: 'Mar 2024', medianPrice: 778000, salesVolume: 892, daysOnMarket: 20, pricePerSqFt: 481, inventoryLevel: 1320 },
    { period: 'Apr 2024', medianPrice: 785000, salesVolume: 934, daysOnMarket: 18, pricePerSqFt: 485, inventoryLevel: 1247 },
];

const mockCompetitors: CompetitorAnalysis[] = [
    {
        agentName: 'Sarah Johnson',
        salesVolume: 45,
        avgPrice: 892000,
        marketShare: 3.2,
        specialties: ['Luxury Homes', 'Waterfront'],
        performance: 'outperforming'
    },
    {
        agentName: 'Mike Chen',
        salesVolume: 38,
        avgPrice: 675000,
        marketShare: 2.8,
        specialties: ['First-Time Buyers', 'Condos'],
        performance: 'average'
    },
    {
        agentName: 'Lisa Rodriguez',
        salesVolume: 52,
        avgPrice: 745000,
        marketShare: 3.8,
        specialties: ['Investment Properties', 'Relocation'],
        performance: 'outperforming'
    },
    {
        agentName: 'David Kim',
        salesVolume: 28,
        avgPrice: 580000,
        marketShare: 2.1,
        specialties: ['Starter Homes', 'Townhomes'],
        performance: 'underperforming'
    }
];

export default function MarketAnalyticsPage() {
    const { user } = useUser();
    const [selectedLocation, setSelectedLocation] = useState('Seattle, WA');
    const [selectedTimeframe, setSelectedTimeframe] = useState('3months');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [metrics] = useState<MarketMetric[]>(mockMetrics);
    const [performanceData] = useState<PerformanceData[]>(mockPerformanceData);
    const [competitors] = useState<CompetitorAnalysis[]>(mockCompetitors);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const refreshAnalytics = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast({
                title: 'Analytics Updated',
                description: 'Market analytics have been refreshed with the latest data.',
            });
        } catch (error) {
            toast({
                title: 'Refresh Failed',
                description: 'Unable to refresh analytics. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const exportReport = () => {
        toast({
            title: 'Export Started',
            description: 'Your market analytics report is being prepared for download.',
        });
    };

    const formatValue = (value: number, unit: string) => {
        switch (unit) {
            case 'currency':
                return `$${value.toLocaleString()}`;
            case 'days':
                return `${value} days`;
            case 'number':
                return value.toLocaleString();
            default:
                return value.toString();
        }
    };

    const getMetricIcon = (category: MarketMetric['category']) => {
        switch (category) {
            case 'pricing':
                return <DollarSign className="h-5 w-5 text-green-600" />;
            case 'inventory':
                return <Home className="h-5 w-5 text-blue-600" />;
            case 'activity':
                return <TrendingUp className="h-5 w-5 text-purple-600" />;
            case 'demographics':
                return <Users className="h-5 w-5 text-orange-600" />;
        }
    };

    const getPerformanceColor = (performance: CompetitorAnalysis['performance']) => {
        switch (performance) {
            case 'outperforming':
                return 'bg-green-100 text-green-800';
            case 'average':
                return 'bg-yellow-100 text-yellow-800';
            case 'underperforming':
                return 'bg-red-100 text-red-800';
        }
    };

    const filteredMetrics = selectedCategory === 'all'
        ? metrics
        : metrics.filter(metric => metric.category === selectedCategory);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Analytics</h1>
                    <p className="text-muted-foreground">
                        Comprehensive market data analysis and performance tracking
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={exportReport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                    <Button onClick={refreshAnalytics} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Analytics Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select location" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Seattle, WA">Seattle, WA</SelectItem>
                                    <SelectItem value="Bellevue, WA">Bellevue, WA</SelectItem>
                                    <SelectItem value="Tacoma, WA">Tacoma, WA</SelectItem>
                                    <SelectItem value="King County, WA">King County, WA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Timeframe</label>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="pricing">Pricing</SelectItem>
                                    <SelectItem value="inventory">Inventory</SelectItem>
                                    <SelectItem value="activity">Market Activity</SelectItem>
                                    <SelectItem value="demographics">Demographics</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" className="w-full">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Generate Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Market Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance Trends</TabsTrigger>
                    <TabsTrigger value="competition">Competition Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMetrics.map((metric) => (
                            <Card key={metric.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getMetricIcon(metric.category)}
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                                                <p className="text-2xl font-bold">{formatValue(metric.value, metric.unit)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`flex items-center gap-1 text-sm font-medium ${metric.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {metric.changeType === 'increase' ? (
                                                    <TrendingUp className="h-3 w-3" />
                                                ) : (
                                                    <TrendingDown className="h-3 w-3" />
                                                )}
                                                {metric.changeType === 'increase' ? '+' : ''}{metric.change}%
                                            </div>
                                            <p className="text-xs text-muted-foreground">{metric.period}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Market Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Market Summary</CardTitle>
                            <CardDescription>
                                Key insights for {selectedLocation} over the {selectedTimeframe}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-3">Market Conditions</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Market Temperature</span>
                                            <Badge className="bg-orange-100 text-orange-800">Hot</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Buyer Demand</span>
                                            <Badge className="bg-green-100 text-green-800">High</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Inventory Level</span>
                                            <Badge className="bg-red-100 text-red-800">Low</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Price Trend</span>
                                            <Badge className="bg-green-100 text-green-800">Rising</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3">Key Insights</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li>• Inventory shortage driving competitive market</li>
                                        <li>• Homes selling 15% faster than seasonal average</li>
                                        <li>• Price growth accelerating in luxury segment</li>
                                        <li>• First-time buyer activity increasing with rate stability</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    {/* Performance Chart Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Market Performance Trends</CardTitle>
                            <CardDescription>
                                Historical performance data for {selectedLocation}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                                <div className="text-center">
                                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground">Interactive charts coming soon</p>
                                    <p className="text-sm text-muted-foreground">Performance visualization will be displayed here</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Data Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historical Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Period</th>
                                            <th className="text-right p-2">Median Price</th>
                                            <th className="text-right p-2">Sales Volume</th>
                                            <th className="text-right p-2">Days on Market</th>
                                            <th className="text-right p-2">Price/Sq Ft</th>
                                            <th className="text-right p-2">Inventory</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {performanceData.map((data, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="p-2 font-medium">{data.period}</td>
                                                <td className="p-2 text-right">${data.medianPrice.toLocaleString()}</td>
                                                <td className="p-2 text-right">{data.salesVolume}</td>
                                                <td className="p-2 text-right">{data.daysOnMarket}</td>
                                                <td className="p-2 text-right">${data.pricePerSqFt}</td>
                                                <td className="p-2 text-right">{data.inventoryLevel}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="competition" className="space-y-6">
                    {/* Competitor Analysis */}
                    <div className="grid gap-4">
                        {competitors.map((competitor, index) => (
                            <Card key={index}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                                <Users className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{competitor.agentName}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className={getPerformanceColor(competitor.performance)}>
                                                        {competitor.performance}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {competitor.marketShare}% market share
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    <span>{competitor.salesVolume} sales</span>
                                                    <span>Avg: ${competitor.avgPrice.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex flex-wrap gap-1 justify-end mb-2">
                                                {competitor.specialties.map((specialty, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        {specialty}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Profile
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Market Position Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Market Position</CardTitle>
                            <CardDescription>
                                How you compare to other agents in {selectedLocation}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <div className="text-2xl font-bold text-primary">Top 15%</div>
                                    <div className="text-sm text-muted-foreground">Sales Volume Ranking</div>
                                </div>
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">$892K</div>
                                    <div className="text-sm text-muted-foreground">Average Sale Price</div>
                                </div>
                                <div className="text-center p-4 bg-muted rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">4.2%</div>
                                    <div className="text-sm text-muted-foreground">Market Share</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}