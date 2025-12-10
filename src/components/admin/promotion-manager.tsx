'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    AnimatedTabs as Tabs,
    AnimatedTabsContent as TabsContent,
    AnimatedTabsList as TabsList,
    AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import {
    Calendar,
    TrendingUp,
    Users,
    DollarSign,
    Percent,
    Plus,
    BarChart3,
    Sparkles,
    Home,
    Leaf,
    Sun,
    Snowflake
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SeasonalSuggestion {
    season: string;
    title: string;
    description: string;
    suggestedDiscount: number;
    targetMonths: number[];
    marketingMessage: string;
}

interface PromotionCampaign {
    id: string;
    name: string;
    description: string;
    couponId: string;
    startDate: string;
    endDate: string;
    targetAudience: string;
    marketSeason: string;
    discountType: string;
    discountValue: number;
    maxRedemptions?: number;
    currentRedemptions: number;
    isActive: boolean;
}

const seasonIcons = {
    spring_buying: Leaf,
    summer_peak: Sun,
    fall_market: Calendar,
    winter_planning: Snowflake,
    new_year: Sparkles,
    year_end: TrendingUp,
};

export function PromotionManager() {
    const [activePromotions, setActivePromotions] = useState<PromotionCampaign[]>([]);
    const [seasonalSuggestions, setSeasonalSuggestions] = useState<SeasonalSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadPromotionsData();
    }, []);

    const loadPromotionsData = async () => {
        try {
            setIsLoading(true);

            // Load active promotions
            const activeResponse = await fetch('/api/admin/promotions?action=active');
            const activeData = await activeResponse.json();
            setActivePromotions(activeData.promotions || []);

            // Load seasonal suggestions
            const suggestionsResponse = await fetch('/api/admin/promotions?action=seasonal-suggestions');
            const suggestionsData = await suggestionsResponse.json();
            setSeasonalSuggestions(suggestionsData.suggestions || []);

        } catch (error) {
            console.error('Error loading promotions:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load promotions data',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const createSeasonalPromotion = async (seasonType: string, customDiscount?: number) => {
        try {
            setIsCreating(true);

            const response = await fetch('/api/admin/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create-seasonal',
                    seasonType,
                    customDiscount,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Promotion Created!',
                    description: `${data.campaign.name} has been created successfully`,
                });
                loadPromotionsData(); // Refresh data
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error creating promotion:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to create seasonal promotion',
            });
        } finally {
            setIsCreating(false);
        }
    };

    const deactivatePromotion = async (campaignId: string) => {
        try {
            const response = await fetch('/api/admin/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'deactivate',
                    campaignId,
                }),
            });

            if (response.ok) {
                toast({
                    title: 'Promotion Deactivated',
                    description: 'The promotion has been successfully deactivated',
                });
                loadPromotionsData(); // Refresh data
            } else {
                const data = await response.json();
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error deactivating promotion:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to deactivate promotion',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading promotions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Promotion Management</h2>
                    <p className="text-muted-foreground">
                        Manage seasonal promotions and coupon campaigns for real estate agents
                    </p>
                </div>
            </div>

            <Tabs defaultValue="active" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="active">Active Promotions</TabsTrigger>
                    <TabsTrigger value="seasonal">Seasonal Suggestions</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-4">
                    <div className="grid gap-4">
                        {activePromotions.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-8">
                                    <Home className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Active Promotions</h3>
                                    <p className="text-muted-foreground text-center mb-4">
                                        Create seasonal promotions to boost real estate agent signups
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            activePromotions.map((promotion) => (
                                <Card key={promotion.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="flex items-center gap-2">
                                                    {promotion.name}
                                                    <Badge variant="secondary">
                                                        {promotion.discountType === 'percentage'
                                                            ? `${promotion.discountValue}% off`
                                                            : `$${promotion.discountValue} off`
                                                        }
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription>{promotion.description}</CardDescription>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deactivatePromotion(promotion.id)}
                                            >
                                                Deactivate
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <Label className="text-muted-foreground">Coupon Code</Label>
                                                <p className="font-mono font-semibold">{promotion.couponId}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Target Audience</Label>
                                                <p className="capitalize">{promotion.targetAudience.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Market Season</Label>
                                                <p className="capitalize">{promotion.marketSeason.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                                <Label className="text-muted-foreground">Usage</Label>
                                                <p>
                                                    {promotion.currentRedemptions}
                                                    {promotion.maxRedemptions && ` / ${promotion.maxRedemptions}`}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="seasonal" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        {seasonalSuggestions.map((suggestion) => {
                            const IconComponent = seasonIcons[suggestion.season as keyof typeof seasonIcons] || Calendar;

                            return (
                                <Card key={suggestion.season} className="relative">
                                    <CardHeader>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                <IconComponent className="h-5 w-5 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                                                <CardDescription>{suggestion.description}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-3 bg-muted rounded-lg">
                                            <p className="text-sm font-medium text-primary">
                                                "{suggestion.marketingMessage}"
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Percent className="h-4 w-4" />
                                                    {suggestion.suggestedDiscount}% off
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {suggestion.targetMonths.length} months
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => createSeasonalPromotion(suggestion.season)}
                                                disabled={isCreating}
                                                size="sm"
                                            >
                                                <Plus className="h-4 w-4 mr-1" />
                                                Create Campaign
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Promotion Analytics
                            </CardTitle>
                            <CardDescription>
                                Track the performance of your promotional campaigns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Analytics dashboard coming soon...</p>
                                <p className="text-sm">Track redemption rates, conversion metrics, and ROI</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}