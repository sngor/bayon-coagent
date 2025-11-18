'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    AnimatedNumber,
    AnimatedCurrency,
    AnimatedPercentage,
    AnimatedDecimal
} from '@/components/ui/animated-number';
import { RefreshCw, DollarSign, Percent, Hash, Star } from 'lucide-react';

export default function AnimatedNumberDemoPage() {
    const [numberValue, setNumberValue] = useState(1234);
    const [currencyValue, setCurrencyValue] = useState(50000);
    const [percentageValue, setPercentageValue] = useState(75);
    const [ratingValue, setRatingValue] = useState(4.5);
    const [duration, setDuration] = useState(1000);

    const randomizeValues = () => {
        setNumberValue(Math.floor(Math.random() * 10000));
        setCurrencyValue(Math.floor(Math.random() * 100000));
        setPercentageValue(Math.floor(Math.random() * 100));
        setRatingValue(parseFloat((Math.random() * 5).toFixed(1)));
    };

    return (
        <div className="space-y-6 md:space-y-8">
            <PageHeader
                title="Animated Number Component Demo"
                description="Test the animated number counter with different formats and configurations"
            />

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Controls</CardTitle>
                    <CardDescription>Adjust values and animation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duration">Animation Duration (ms)</Label>
                            <Input
                                id="duration"
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value) || 1000)}
                                min={100}
                                max={5000}
                                step={100}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={randomizeValues} className="w-full">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Randomize All Values
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Number Format */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-primary" />
                        Standard Number Format
                    </CardTitle>
                    <CardDescription>Animated integer with thousand separators</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="text-6xl font-bold text-primary">
                            <AnimatedNumber value={numberValue} duration={duration} />
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={numberValue}
                                onChange={(e) => setNumberValue(parseInt(e.target.value) || 0)}
                                className="w-32"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setNumberValue(Math.floor(Math.random() * 10000))}
                            >
                                Random
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Currency Format */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-success" />
                        Currency Format
                    </CardTitle>
                    <CardDescription>Animated currency with proper formatting</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="text-6xl font-bold text-success">
                            <AnimatedCurrency value={currencyValue} duration={duration} />
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={currencyValue}
                                onChange={(e) => setCurrencyValue(parseInt(e.target.value) || 0)}
                                className="w-32"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setCurrencyValue(Math.floor(Math.random() * 100000))}
                            >
                                Random
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Percentage Format */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5 text-blue-500" />
                        Percentage Format
                    </CardTitle>
                    <CardDescription>Animated percentage with decimal precision</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="text-6xl font-bold text-blue-500">
                            <AnimatedPercentage value={percentageValue} duration={duration} />
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={percentageValue}
                                onChange={(e) => setPercentageValue(parseInt(e.target.value) || 0)}
                                min={0}
                                max={100}
                                className="w-32"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setPercentageValue(Math.floor(Math.random() * 100))}
                            >
                                Random
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Decimal Format (Rating) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Decimal Format (Rating)
                    </CardTitle>
                    <CardDescription>Animated decimal number with custom prefix/suffix</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="text-6xl font-bold text-yellow-500">
                            <AnimatedDecimal
                                value={ratingValue}
                                duration={duration}
                                decimals={1}
                            />
                        </div>
                        <div className="flex items-center gap-1 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-8 w-8 ${i < Math.floor(ratingValue)
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-muted-foreground/30'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={ratingValue}
                                onChange={(e) => setRatingValue(parseFloat(e.target.value) || 0)}
                                min={0}
                                max={5}
                                step={0.1}
                                className="w-32"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setRatingValue(parseFloat((Math.random() * 5).toFixed(1)))}
                            >
                                Random
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard-style Example */}
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Metrics Example</CardTitle>
                    <CardDescription>How animated numbers look in a real dashboard context</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 p-6 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent hover:from-primary/10 hover:via-primary/5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="text-5xl font-bold text-primary mb-2">
                                <AnimatedDecimal value={ratingValue} decimals={1} duration={duration} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-xl border-2 p-6 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent hover:from-primary/10 hover:via-primary/5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="text-5xl font-bold text-primary mb-2">
                                <AnimatedNumber value={numberValue} duration={duration} />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">Total Reviews</p>
                        </div>

                        <div className="flex flex-col items-center justify-center rounded-xl border-2 p-6 bg-gradient-to-br from-success/5 via-success/3 to-transparent hover:from-success/10 hover:via-success/5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
                            <div className="text-5xl font-bold text-primary mb-2">
                                <AnimatedNumber
                                    value={Math.floor(numberValue / 10)}
                                    duration={duration}
                                    prefix="+"
                                />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">New (30 days)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
