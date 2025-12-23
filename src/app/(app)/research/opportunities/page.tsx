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
    Target,
    TrendingUp,
    DollarSign,
    Users,
    MapPin,
    Calendar,
    Star,
    AlertCircle,
    Sparkles,
    RefreshCw,
    Eye,
    Bookmark,
    Share2,
    Filter
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';

interface InvestmentOpportunity {
    id: string;
    title: string;
    description: string;
    location: string;
    opportunityType: 'undervalued' | 'emerging_area' | 'renovation' | 'flip' | 'rental';
    potentialROI: number;
    investmentRange: {
        min: number;
        max: number;
    };
    riskLevel: 'low' | 'medium' | 'high';
    timeframe: string;
    confidence: number;
    keyFactors: string[];
    marketData: {
        avgPrice: number;
        priceGrowth: number;
        inventory: number;
        daysOnMarket: number;
    };
    isBookmarked?: boolean;
}

interface ClientOpportunity {
    id: string;
    type: 'life_event' | 'market_timing' | 'demographic_shift';
    title: string;
    description: string;
    targetAudience: string;
    location: string;
    urgency: 'high' | 'medium' | 'low';
    potentialClients: number;
    actionItems: string[];
    timeline: string;
    confidence: number;
}

const mockInvestmentOpportunities: InvestmentOpportunity[] = [
    {
        id: '1',
        title: 'Undervalued Condos in South Lake Union',
        description: 'Recent market correction has created opportunities for well-positioned condos near tech companies.',
        location: 'South Lake Union, Seattle',
        opportunityType: 'undervalued',
        potentialROI: 18.5,
        investmentRange: { min: 600000, max: 900000 },
        riskLevel: 'medium',
        timeframe: '12-18 months',
        confidence: 85,
        keyFactors: [
            'Tech company expansion plans',
            '15% price reduction from peak',
            'Low inventory in area',
            'New transit connections'
        ],
        marketData: {
            avgPrice: 750000,
            priceGrowth: -8.2,
            inventory: 45,
            daysOnMarket: 28
        }
    },
    {
        id: '2',
        title: 'Emerging Neighborhood: Georgetown',
        description: 'Industrial area transitioning to mixed-use with significant upside potential.',
        location: 'Georgetown, Seattle',
        opportunityType: 'emerging_area',
        potentialROI: 25.3,
        investmentRange: { min: 400000, max: 650000 },
        riskLevel: 'high',
        timeframe: '2-3 years',
        confidence: 72,
        keyFactors: [
            'Zoning changes approved',
            'New brewery and restaurant district',
            'Light rail extension planned',
            'Artist community growth'
        ],
        marketData: {
            avgPrice: 525000,
            priceGrowth: 12.1,
            inventory: 23,
            daysOnMarket: 35
        }
    },
    {
        id: '3',
        title: 'Fix-and-Flip in Ballard',
        description: 'Older homes in prime location with renovation potential and strong resale market.',
        location: 'Ballard, Seattle',
        opportunityType: 'flip',
        potentialROI: 22.7,
        investmentRange: { min: 800000, max: 1200000 },
        riskLevel: 'medium',
        timeframe: '6-9 months',
        confidence: 78,
        keyFactors: [
            'High demand for renovated homes',
            'Strong neighborhood amenities',
            'Limited new construction',
            'Experienced contractor network'
        ],
        marketData: {
            avgPrice: 950000,
            priceGrowth: 3.8,
            inventory: 18,
            daysOnMarket: 15
        }
    }
];

const mockClientOpportunities: ClientOpportunity[] = [
    {
        id: '1',
        type: 'life_event',
        title: 'New Parent Home Buyers',
        description: 'Families with newborns typically upgrade to larger homes within 18 months.',
        targetAudience: 'Families with children 0-2 years',
        location: 'Eastside suburbs',
        urgency: 'high',
        potentialClients: 1250,
        actionItems: [
            'Target pediatrician office partnerships',
            'Create family-focused content',
            'Develop school district guides',
            'Partner with childcare centers'
        ],
        timeline: 'Next 6 months',
        confidence: 88
    },
    {
        id: '2',
        type: 'market_timing',
        title: 'Rate Drop Opportunity',
        description: 'Anticipated rate decreases will bring buyers back to the market.',
        targetAudience: 'First-time buyers who were priced out',
        location: 'King County',
        urgency: 'medium',
        potentialClients: 3400,
        actionItems: [
            'Pre-qualify waiting buyers',
            'Create rate education content',
            'Build lender partnerships',
            'Prepare market re-entry campaigns'
        ],
        timeline: 'Next 3-4 months',
        confidence: 75
    },
    {
        id: '3',
        type: 'demographic_shift',
        title: 'Remote Worker Relocations',
        description: 'Tech workers moving from expensive urban areas to suburban locations.',
        targetAudience: 'Remote tech workers',
        location: 'Suburban King County',
        urgency: 'medium',
        potentialClients: 890,
        actionItems: [
            'Highlight home office spaces',
            'Create remote work lifestyle content',
            'Partner with co-working spaces',
            'Develop tech company relationships'
        ],
        timeline: 'Ongoing',
        confidence: 82
    }
];

export default function ResearchOpportunitiesPage() {
    const { user } = useUser();
    const [investmentOpportunities, setInvestmentOpportunities] = useState<InvestmentOpportunity[]>(mockInvestmentOpportunities);
    const [clientOpportunities] = useState<ClientOpportunity[]>(mockClientOpportunities);
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
    const [selectedOpportunityType, setSelectedOpportunityType] = useState('all');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('investment');

    const refreshOpportunities = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            toast({
                title: 'Opportunities Updated',
                description: 'Latest market opportunities have been analyzed.',
            });
        } catch (error) {
            toast({
                title: 'Refresh Failed',
                description: 'Unable to refresh opportunities. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBookmark = (opportunityId: string) => {
        setInvestmentOpportunities(prev => prev.map(opp =>
            opp.id === opportunityId
                ? { ...opp, isBookmarked: !opp.isBookmarked }
                : opp
        ));

        const opportunity = investmentOpportunities.find(o => o.id === opportunityId);
        toast({
            title: opportunity?.isBookmarked ? 'Bookmark Removed' : 'Opportunity Bookmarked',
            description: opportunity?.isBookmarked
                ? 'Opportunity removed from your bookmarks.'
                : 'Opportunity saved to your bookmarks.',
        });
    };

    const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
        switch (risk) {
            case 'low':
                return 'bg-green-100 text-green-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'high':
                return 'bg-red-100 text-red-800';
        }
    };

    const getUrgencyColor = (urgency: 'low' | 'medium' | 'high') => {
        switch (urgency) {
            case 'low':
                return 'bg-gray-100 text-gray-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'high':
                return 'bg-red-100 text-red-800';
        }
    };

    const getOpportunityTypeLabel = (type: InvestmentOpportunity['opportunityType']) => {
        switch (type) {
            case 'undervalued':
                return 'Undervalued';
            case 'emerging_area':
                return 'Emerging Area';
            case 'renovation':
                return 'Renovation';
            case 'flip':
                return 'Fix & Flip';
            case 'rental':
                return 'Rental Property';
        }
    };

    const getClientOpportunityIcon = (type: ClientOpportunity['type']) => {
        switch (type) {
            case 'life_event':
                return '👶';
            case 'market_timing':
                return '⏰';
            case 'demographic_shift':
                return '📊';
        }
    };

    const filteredInvestmentOpportunities = investmentOpportunities.filter(opp => {
        if (selectedLocation !== 'all' && !opp.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
            return false;
        }
        if (selectedRiskLevel !== 'all' && opp.riskLevel !== selectedRiskLevel) {
            return false;
        }
        if (selectedOpportunityType !== 'all' && opp.opportunityType !== selectedOpportunityType) {
            return false;
        }
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Market Opportunities</h1>
                    <p className="text-muted-foreground">
                        Discover investment opportunities and identify potential clients
                    </p>
                </div>
                <Button onClick={refreshOpportunities} disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh Analysis
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Location</label>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All locations" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Locations</SelectItem>
                                    <SelectItem value="seattle">Seattle</SelectItem>
                                    <SelectItem value="bellevue">Bellevue</SelectItem>
                                    <SelectItem value="tacoma">Tacoma</SelectItem>
                                    <SelectItem value="eastside">Eastside</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Risk Level</label>
                            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All risk levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Risk Levels</SelectItem>
                                    <SelectItem value="low">Low Risk</SelectItem>
                                    <SelectItem value="medium">Medium Risk</SelectItem>
                                    <SelectItem value="high">High Risk</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Opportunity Type</label>
                            <Select value={selectedOpportunityType} onValueChange={setSelectedOpportunityType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="undervalued">Undervalued</SelectItem>
                                    <SelectItem value="emerging_area">Emerging Area</SelectItem>
                                    <SelectItem value="renovation">Renovation</SelectItem>
                                    <SelectItem value="flip">Fix & Flip</SelectItem>
                                    <SelectItem value="rental">Rental Property</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setSelectedLocation('all');
                                    setSelectedRiskLevel('all');
                                    setSelectedOpportunityType('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="investment">Investment Opportunities</TabsTrigger>
                    <TabsTrigger value="clients">Client Opportunities</TabsTrigger>
                </TabsList>

                <TabsContent value="investment" className="space-y-6">
                    <div className="grid gap-6">
                        {filteredInvestmentOpportunities.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Target className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Opportunities Found</h3>
                                    <p className="text-muted-foreground text-center">
                                        No investment opportunities match your current filters. Try adjusting your criteria.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredInvestmentOpportunities.map((opportunity) => (
                                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        {getOpportunityTypeLabel(opportunity.opportunityType)}
                                                    </Badge>
                                                    <Badge className={getRiskColor(opportunity.riskLevel)}>
                                                        {opportunity.riskLevel} risk
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {opportunity.confidence}% confidence
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {opportunity.location}
                                                    <span>•</span>
                                                    <Calendar className="h-3 w-3" />
                                                    {opportunity.timeframe}
                                                </CardDescription>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {opportunity.potentialROI}% ROI
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    ${opportunity.investmentRange.min.toLocaleString()} - ${opportunity.investmentRange.max.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-muted-foreground mb-4">{opportunity.description}</p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div className="text-center p-3 bg-muted rounded-lg">
                                                <div className="text-lg font-semibold">${opportunity.marketData.avgPrice.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground">Avg Price</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted rounded-lg">
                                                <div className={`text-lg font-semibold ${opportunity.marketData.priceGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {opportunity.marketData.priceGrowth >= 0 ? '+' : ''}{opportunity.marketData.priceGrowth}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">Price Growth</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted rounded-lg">
                                                <div className="text-lg font-semibold">{opportunity.marketData.inventory}</div>
                                                <div className="text-xs text-muted-foreground">Inventory</div>
                                            </div>
                                            <div className="text-center p-3 bg-muted rounded-lg">
                                                <div className="text-lg font-semibold">{opportunity.marketData.daysOnMarket}</div>
                                                <div className="text-xs text-muted-foreground">Days on Market</div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="font-semibold mb-2">Key Factors:</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {opportunity.keyFactors.map((factor, index) => (
                                                    <div key={index} className="flex items-center gap-2 text-sm">
                                                        <Star className="h-3 w-3 text-yellow-500" />
                                                        {factor}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    Share
                                                </Button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleBookmark(opportunity.id)}
                                                className={opportunity.isBookmarked ? 'text-yellow-600' : ''}
                                            >
                                                <Bookmark className={`h-4 w-4 ${opportunity.isBookmarked ? 'fill-current' : ''}`} />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="clients" className="space-y-6">
                    <div className="grid gap-6">
                        {clientOpportunities.map((opportunity) => (
                            <Card key={opportunity.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="text-2xl">{getClientOpportunityIcon(opportunity.type)}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={getUrgencyColor(opportunity.urgency)}>
                                                        {opportunity.urgency} urgency
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {opportunity.confidence}% confidence
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                                                <CardDescription className="flex items-center gap-2 mt-1">
                                                    <Users className="h-3 w-3" />
                                                    {opportunity.targetAudience}
                                                    <span>•</span>
                                                    <MapPin className="h-3 w-3" />
                                                    {opportunity.location}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-primary">
                                                {opportunity.potentialClients.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Potential Clients
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-4">{opportunity.description}</p>

                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2">Action Items:</h4>
                                        <div className="space-y-2">
                                            {opportunity.actionItems.map((action, index) => (
                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                    <AlertCircle className="h-3 w-3 text-blue-500" />
                                                    {action}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {opportunity.timeline}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm">
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Create Campaign
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Share2 className="h-4 w-4 mr-2" />
                                                Share
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}