/**
 * Market Insights Filters Component
 * 
 * Filter controls for location and timeframe selection
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Filter, Sparkles } from 'lucide-react';
import { LOCATION_OPTIONS, TIMEFRAME_OPTIONS } from '@/lib/data/market-insights-mock';
import type { MarketInsightsFilters } from '@/lib/types/market-insights';

interface MarketInsightsFiltersProps {
    filters: MarketInsightsFilters;
    onFiltersChange: (filters: MarketInsightsFilters) => void;
    onAnalyze: () => void;
}

export function MarketInsightsFilters({ 
    filters, 
    onFiltersChange, 
    onAnalyze 
}: MarketInsightsFiltersProps) {
    const handleLocationChange = (location: string) => {
        onFiltersChange({ ...filters, location });
    };

    const handleTimeframeChange = (timeframe: string) => {
        onFiltersChange({ ...filters, timeframe });
    };

    return (
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
                        <Select value={filters.location} onValueChange={handleLocationChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                                {LOCATION_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="timeframe">Timeframe</Label>
                        <Select value={filters.timeframe} onValueChange={handleTimeframeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEFRAME_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button className="w-full" onClick={onAnalyze}>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze Market
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}