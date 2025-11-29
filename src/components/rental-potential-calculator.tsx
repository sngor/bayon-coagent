'use client';

import { useActionState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { generateRentalPotential, type RentalPotentialState } from '@/app/rental-actions';
import {
    Calculator,
    DollarSign,
    Home,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Copy,
    MapPin,
    Loader2,
    Building,
    Calendar,
    Bed,
    Bath
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { toast } from '@/hooks/use-toast';

const propertyTypes = [
    { value: 'single-family', label: 'Single Family Home' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'condo', label: 'Condominium' },
    { value: 'multi-family', label: 'Multi-Family' },
    { value: 'apartment', label: 'Apartment' },
];

const initialState: RentalPotentialState = {
    message: '',
    data: null,
    errors: {},
};

export function RentalPotentialCalculator() {
    const [state, formAction, isPending] = useActionState(
        generateRentalPotential,
        initialState
    );

    const copyResults = () => {
        if (!state.data) return;

        const results = `
Rental Potential Analysis

Property: ${state.data.comparableRentals[0]?.address || 'Analyzed Property'}

Long-Term Rental:
Estimated Rent: ${formatCurrency(state.data.longTermRental.estimatedMonthlyRent)}/mo
Range: ${formatCurrency(state.data.longTermRental.rentRange.low)} - ${formatCurrency(state.data.longTermRental.rentRange.high)}
Demand: ${state.data.longTermRental.demandLevel.toUpperCase()}

Short-Term Rental (Airbnb/VRBO):
Est. Monthly Revenue: ${formatCurrency(state.data.shortTermRental.estimatedMonthlyRevenue)}/mo
Daily Rate: ${formatCurrency(state.data.shortTermRental.estimatedDailyRate)}
Occupancy: ${state.data.shortTermRental.estimatedOccupancyRate}%
Seasonality: ${state.data.shortTermRental.seasonality}

Market Analysis:
Condition: ${state.data.marketAnalysis.rentalMarketCondition}
Trends:
${state.data.marketAnalysis.trends.map(t => `• ${t}`).join('\n')}
        `.trim();

        navigator.clipboard.writeText(results);
        toast({ title: 'Results Copied', description: 'Rental potential analysis copied to clipboard.' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Input Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building className="h-5 w-5" />
                            Rental Potential Calculator
                        </CardTitle>
                        <CardDescription>
                            Compare long-term vs. short-term rental income potential
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-6">
                            {/* Address */}
                            <div className="space-y-2">
                                <Label htmlFor="address">Property Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="address"
                                        name="address"
                                        className="pl-10"
                                        placeholder="123 Main St, City, State"
                                        required
                                    />
                                </div>
                                {state.errors?.address && (
                                    <p className="text-sm text-red-600">{state.errors.address[0]}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Beds */}
                                <div className="space-y-2">
                                    <Label htmlFor="beds">Bedrooms</Label>
                                    <div className="relative">
                                        <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="beds"
                                            name="beds"
                                            type="number"
                                            className="pl-10"
                                            placeholder="3"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Baths */}
                                <div className="space-y-2">
                                    <Label htmlFor="baths">Bathrooms</Label>
                                    <div className="relative">
                                        <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="baths"
                                            name="baths"
                                            type="number"
                                            step="0.5"
                                            className="pl-10"
                                            placeholder="2"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Property Type */}
                            <div className="space-y-2">
                                <Label>Property Type</Label>
                                <Select name="propertyType" defaultValue="single-family">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {propertyTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Special Features */}
                            <div className="space-y-2">
                                <Label htmlFor="specialFeatures">Special Features (Optional)</Label>
                                <Textarea
                                    id="specialFeatures"
                                    name="specialFeatures"
                                    placeholder="Pool, hot tub, ocean view, near downtown..."
                                    rows={2}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Analyzing Market...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="h-4 w-4 mr-2" />
                                        Calculate Rental Potential
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Analysis Results
                        </CardTitle>
                        <CardDescription>
                            Estimated income for long-term and short-term strategies
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {state.data ? (
                            <>
                                {/* Comparison Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Long Term */}
                                    <div className="p-4 rounded-lg border bg-blue-50/50 border-blue-100">
                                        <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold">
                                            <Home className="h-4 w-4" />
                                            Long-Term
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(state.data.longTermRental.estimatedMonthlyRent)}
                                            <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Range: {formatCurrency(state.data.longTermRental.rentRange.low)} - {formatCurrency(state.data.longTermRental.rentRange.high)}
                                        </div>
                                        <Badge variant="outline" className="mt-2 bg-white">
                                            {state.data.longTermRental.demandLevel.toUpperCase()} DEMAND
                                        </Badge>
                                    </div>

                                    {/* Short Term */}
                                    <div className="p-4 rounded-lg border bg-purple-50/50 border-purple-100">
                                        <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold">
                                            <Calendar className="h-4 w-4" />
                                            Short-Term
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(state.data.shortTermRental.estimatedMonthlyRevenue)}
                                            <span className="text-sm font-normal text-muted-foreground">/mo</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Daily: {formatCurrency(state.data.shortTermRental.estimatedDailyRate)} • Occ: {state.data.shortTermRental.estimatedOccupancyRate}%
                                        </div>
                                        <div className="text-xs text-purple-600 mt-2 italic">
                                            {state.data.shortTermRental.seasonality}
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Market Analysis */}
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">Market Analysis</h4>
                                    <div className="text-sm text-muted-foreground">
                                        <span className="font-medium text-gray-900 dark:text-white">Condition: </span>
                                        {state.data.marketAnalysis.rentalMarketCondition}
                                    </div>
                                    <div className="space-y-1">
                                        {state.data.marketAnalysis.trends.map((trend, i) => (
                                            <div key={i} className="text-sm flex gap-2">
                                                <span className="text-primary">•</span>
                                                {trend}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Comparable Rentals */}
                                {state.data.comparableRentals.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-sm">Comparable Rentals</h4>
                                        <div className="space-y-2">
                                            {state.data.comparableRentals.map((comp, i) => (
                                                <div key={i} className="text-sm flex justify-between items-center p-2 rounded bg-muted/50">
                                                    <div className="truncate flex-1 mr-2">
                                                        {comp.address}
                                                        <span className="text-xs text-muted-foreground block">
                                                            {comp.type === 'short-term' ? 'Short-Term' : 'Long-Term'} • {comp.beds}bd/{comp.baths}ba
                                                        </span>
                                                    </div>
                                                    <div className="font-medium">
                                                        {formatCurrency(comp.price)}
                                                        <span className="text-xs font-normal text-muted-foreground">
                                                            {comp.type === 'short-term' ? '/night' : '/mo'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button variant="outline" size="sm" onClick={copyResults}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Analysis
                                    </Button>
                                </div>

                                <Alert className="bg-yellow-50 border-yellow-200">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-xs text-yellow-800">
                                        {state.data.disclaimer}
                                    </AlertDescription>
                                </Alert>
                            </>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Home className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>Enter property details to analyze rental potential</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
