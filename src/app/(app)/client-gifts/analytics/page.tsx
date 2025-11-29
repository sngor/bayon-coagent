'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HubLayout } from '@/components/hub/hub-layout';
import {
    Gift,
    Package,
    Calendar,
    CheckCircle2,
    TrendingUp,
    Users,
    DollarSign,
    Heart,
    Star,
    Award,
    Target,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Mock analytics data
const ANALYTICS_DATA = {
    totalPackages: 24,
    activePackages: 12,
    completedPackages: 8,
    scheduledGifts: 42,
    totalSpent: 8450,
    averagePerClient: 352,
    clientSatisfaction: 4.8,
    repeatBusinessRate: 68,
    referralRate: 45,
    tierDistribution: {
        gold: 8,
        platinum: 10,
        diamond: 4,
        titanium: 2,
    },
    popularGifts: [
        { name: 'Moving Supplies', count: 18, percentage: 75 },
        { name: 'Under Contract Gift', count: 16, percentage: 67 },
        { name: 'Midway Surprise', count: 14, percentage: 58 },
        { name: 'Thank You Card', count: 12, percentage: 50 },
        { name: 'Celebratory Dinner', count: 6, percentage: 25 },
    ],
    monthlyTrend: [
        { month: 'Jan', packages: 2, revenue: 1200 },
        { month: 'Feb', packages: 3, revenue: 1800 },
        { month: 'Mar', packages: 4, revenue: 2400 },
        { month: 'Apr', packages: 3, revenue: 1500 },
        { month: 'May', packages: 5, revenue: 2800 },
        { month: 'Jun', packages: 4, revenue: 2200 },
    ],
    impactMetrics: {
        clientRetention: 85,
        referralsGenerated: 22,
        positiveReviews: 18,
        socialMediaMentions: 34,
    },
};

export default function ClientGiftsAnalyticsPage() {
    const hubTabs = [
        { label: 'Gift Packages', href: '/client-gifts', icon: Gift },
        { label: 'Templates', href: '/client-gifts/templates', icon: Package },
        { label: 'Calendar', href: '/client-gifts/calendar', icon: Calendar },
        { label: 'Analytics', href: '/client-gifts/analytics', icon: CheckCircle2 },
    ];

    return (
        <HubLayout
            title="Gift Analytics"
            description="Track the impact and ROI of your client gifting program"
            icon={CheckCircle2}
            tabs={hubTabs}
        >
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Packages</p>
                                <p className="text-3xl font-bold mt-2">{ANALYTICS_DATA.totalPackages}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {ANALYTICS_DATA.activePackages} active
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Gift className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                                <p className="text-3xl font-bold mt-2">${ANALYTICS_DATA.totalSpent.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    ${ANALYTICS_DATA.averagePerClient} per client
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Satisfaction Score</p>
                                <p className="text-3xl font-bold mt-2">{ANALYTICS_DATA.clientSatisfaction}/5.0</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Based on client feedback
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Star className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Repeat Business</p>
                                <p className="text-3xl font-bold mt-2">{ANALYTICS_DATA.repeatBusinessRate}%</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {ANALYTICS_DATA.referralRate}% referral rate
                                </p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Package Tier Distribution & Popular Gifts */}
            <div className="grid gap-6 lg:grid-cols-2 mb-6">
                {/* Tier Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Package Tier Distribution</CardTitle>
                        <CardDescription>Breakdown of active packages by tier</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(ANALYTICS_DATA.tierDistribution).map(([tier, count]) => {
                            const percentage = (count / ANALYTICS_DATA.totalPackages) * 100;
                            const colors = {
                                gold: { bg: 'bg-yellow-500', text: 'text-yellow-600' },
                                platinum: { bg: 'bg-gray-500', text: 'text-gray-600' },
                                diamond: { bg: 'bg-blue-500', text: 'text-blue-600' },
                                titanium: { bg: 'bg-purple-500', text: 'text-purple-600' },
                            };
                            const color = colors[tier as keyof typeof colors];

                            return (
                                <div key={tier} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${color.bg}`} />
                                            <span className="text-sm font-medium capitalize">{tier}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {count} packages ({percentage.toFixed(0)}%)
                                        </div>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Popular Gifts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Most Popular Gifts</CardTitle>
                        <CardDescription>Top 5 gifts by delivery frequency</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {ANALYTICS_DATA.popularGifts.map((gift, index) => (
                            <div key={gift.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                                            {index + 1}
                                        </Badge>
                                        <span className="text-sm font-medium">{gift.name}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {gift.count} times ({gift.percentage}%)
                                    </div>
                                </div>
                                <Progress value={gift.percentage} className="h-2" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Impact Metrics */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Business Impact Metrics</CardTitle>
                    <CardDescription>
                        How your gifting program contributes to business growth
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <Target className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{ANALYTICS_DATA.impactMetrics.clientRetention}%</p>
                                    <p className="text-sm text-muted-foreground">Client Retention</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Clients who returned for repeat business
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{ANALYTICS_DATA.impactMetrics.referralsGenerated}</p>
                                    <p className="text-sm text-muted-foreground">Referrals Generated</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                New clients from word-of-mouth
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                    <Award className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{ANALYTICS_DATA.impactMetrics.positiveReviews}</p>
                                    <p className="text-sm text-muted-foreground">Positive Reviews</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                5-star reviews mentioning gifts
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                    <Heart className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{ANALYTICS_DATA.impactMetrics.socialMediaMentions}</p>
                                    <p className="text-sm text-muted-foreground">Social Mentions</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Clients sharing gifts on social media
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ROI Calculator */}
            <Card>
                <CardHeader>
                    <CardTitle>Return on Investment (ROI)</CardTitle>
                    <CardDescription>
                        Calculate the value generated by your gifting program
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Total Investment</p>
                            <p className="text-2xl font-bold">${ANALYTICS_DATA.totalSpent.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">Estimated Revenue Generated</p>
                            <p className="text-2xl font-bold text-green-600">
                                ${((ANALYTICS_DATA.totalSpent * 4.5) | 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                From referrals and repeat business
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">ROI</p>
                            <p className="text-2xl font-bold text-green-600">350%</p>
                            <p className="text-xs text-muted-foreground">
                                $3.50 returned per $1 invested
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-green-700">
                                    Strong ROI Performance
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Your gifting program is generating significant returns through increased client
                                    satisfaction, repeat business, and referrals. Consider expanding to higher tiers
                                    for premium clients to maximize impact.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </HubLayout>
    );
}
