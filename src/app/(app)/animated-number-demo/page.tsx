'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function AnimatedNumberDemoPage() {
    const [value, setValue] = useState(1234);
    const [currency, setCurrency] = useState(50000);
    const [percentage, setPercentage] = useState(75.5);

    return (
        <StandardPageLayout
            title="Animated Numbers Demo"
            description="Smooth number counting animations"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Number Animation</CardTitle>
                        <CardDescription>Smooth counting animation for numbers</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">
                            <AnimatedNumber value={value} />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setValue(Math.floor(Math.random() * 10000))}>
                                Random Number
                            </Button>
                            <Button variant="outline" onClick={() => setValue(0)}>
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Currency Format</CardTitle>
                        <CardDescription>Animated currency values with formatting</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">
                            <AnimatedNumber value={currency} format="currency" />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setCurrency(Math.floor(Math.random() * 1000000))}>
                                Random Amount
                            </Button>
                            <Button variant="outline" onClick={() => setCurrency(0)}>
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Percentage Format</CardTitle>
                        <CardDescription>Animated percentage values</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-4xl font-bold">
                            <AnimatedNumber value={percentage} format="percentage" decimals={1} />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => setPercentage(Math.random() * 100)}>
                                Random Percentage
                            </Button>
                            <Button variant="outline" onClick={() => setPercentage(0)}>
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Total Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                <AnimatedNumber value={1234567} format="currency" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Conversion Rate</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                <AnimatedNumber value={8.5} format="percentage" decimals={1} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Active Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                <AnimatedNumber value={45678} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { AnimatedNumber } from '@/components/ui/animated-number';

// Basic number
<AnimatedNumber value={1234} />

// Currency
<AnimatedNumber value={50000} format="currency" />

// Percentage
<AnimatedNumber value={75.5} format="percentage" decimals={1} />`}</code>
                        </pre>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
