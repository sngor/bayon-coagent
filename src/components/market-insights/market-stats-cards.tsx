/**
 * Market Stats Cards Component
 * 
 * Quick stats overview cards for market insights
 */

import { Card, CardContent } from '@/components/ui/card';
import { Home, TrendingUp, Calendar, Users } from 'lucide-react';

interface MarketStat {
    id: string;
    label: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
}

const MARKET_STATS: MarketStat[] = [
    {
        id: 'avg-price',
        label: 'Avg. Home Price',
        value: '$785K',
        change: '+5.2% from last month',
        changeType: 'positive',
        icon: Home,
        iconColor: 'text-blue-600'
    },
    {
        id: 'market-activity',
        label: 'Market Activity',
        value: 'High',
        change: 'Above seasonal average',
        changeType: 'positive',
        icon: TrendingUp,
        iconColor: 'text-green-600'
    },
    {
        id: 'days-on-market',
        label: 'Days on Market',
        value: '18',
        change: '-3 days from last month',
        changeType: 'negative',
        icon: Calendar,
        iconColor: 'text-orange-600'
    },
    {
        id: 'life-events',
        label: 'Life Events',
        value: '5.5K',
        change: 'Predicted next 6 months',
        changeType: 'neutral',
        icon: Users,
        iconColor: 'text-purple-600'
    }
];

export function MarketStatsCards() {
    const getChangeColor = (changeType: MarketStat['changeType']) => {
        switch (changeType) {
            case 'positive':
                return 'text-green-600';
            case 'negative':
                return 'text-red-600';
            default:
                return 'text-blue-600';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {MARKET_STATS.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.id}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.label}
                                    </p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className={`text-xs ${getChangeColor(stat.changeType)}`}>
                                        {stat.change}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}