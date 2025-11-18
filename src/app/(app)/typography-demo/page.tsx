"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TypographyDemoPage() {
    return (
        <div className="container mx-auto p-6 space-y-12">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold">Bold Typography System</h1>
                <p className="text-muted-foreground">
                    Showcasing the premium typography system with Inter variable font (weights 400-900)
                </p>
            </div>

            {/* Display Text Utilities */}
            <Card>
                <CardHeader>
                    <CardTitle>Display Text Utilities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Hero (72px / 800 weight)</p>
                        <h1 className="text-display-hero">
                            Your Real Estate Success
                        </h1>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Large (56px / 700 weight)</p>
                        <h2 className="text-display-large">
                            Build Your Authority Online
                        </h2>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Medium (40px / 700 weight)</p>
                        <h3 className="text-display-medium">
                            Marketing Made Simple
                        </h3>
                    </div>
                </CardContent>
            </Card>

            {/* Metric Number Styles */}
            <Card>
                <CardHeader>
                    <CardTitle>Metric Number Styles (Tabular Nums)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Large Metric (48px / 700 weight)</p>
                        <div className="text-metric-large text-primary">
                            $1,234,567
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Medium Metric (32px / 600 weight)</p>
                        <div className="text-metric-medium text-primary">
                            98.5%
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Small Metric (24px / 600 weight)</p>
                        <div className="text-metric-small text-primary">
                            1,234
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="text-center">
                            <div className="text-metric-large text-primary">42</div>
                            <p className="text-sm text-muted-foreground mt-2">Active Listings</p>
                        </div>
                        <div className="text-center">
                            <div className="text-metric-large text-success">95%</div>
                            <p className="text-sm text-muted-foreground mt-2">Client Satisfaction</p>
                        </div>
                        <div className="text-center">
                            <div className="text-metric-large text-primary">$2.4M</div>
                            <p className="text-sm text-muted-foreground mt-2">Total Sales</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gradient Text Effects */}
            <Card>
                <CardHeader>
                    <CardTitle>Gradient Text Effects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Default Gradient</p>
                        <h2 className="text-display-large text-gradient">
                            Premium Real Estate Marketing
                        </h2>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Primary Gradient</p>
                        <h2 className="text-display-large text-gradient-primary">
                            Grow Your Business
                        </h2>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Accent Gradient</p>
                        <h2 className="text-display-large text-gradient-accent">
                            AI-Powered Success
                        </h2>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Success Gradient</p>
                        <h2 className="text-display-large text-gradient-success">
                            Achieve Your Goals
                        </h2>
                    </div>
                </CardContent>
            </Card>

            {/* Bold CTA Text Styles */}
            <Card>
                <CardHeader>
                    <CardTitle>Bold CTA Text Styles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Standard CTA (18px / 700 weight)</p>
                        <Button size="lg" className="text-bold-cta">
                            Get Started Now
                        </Button>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Large CTA (20px / 800 weight)</p>
                        <Button size="lg" className="text-bold-cta-large">
                            Start Your Free Trial
                        </Button>
                    </div>

                    <div className="flex gap-4 mt-6">
                        <Button variant="default" className="text-bold-cta">
                            Create Marketing Plan
                        </Button>
                        <Button variant="outline" className="text-bold-cta">
                            View Examples
                        </Button>
                        <Button variant="ghost" className="text-bold-cta">
                            Learn More
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Heading Styles */}
            <Card>
                <CardHeader>
                    <CardTitle>Heading Styles with Authority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Heading 1 (32px / 700 weight)</p>
                        <h1 className="text-heading-1">
                            Transform Your Real Estate Marketing
                        </h1>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Heading 2 (24px / 600 weight)</p>
                        <h2 className="text-heading-2">
                            AI-Powered Content Generation
                        </h2>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground mb-2">Heading 3 (20px / 600 weight)</p>
                        <h3 className="text-heading-3">
                            Build Your Online Authority
                        </h3>
                    </div>
                </CardContent>
            </Card>

            {/* Real-world Example */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-12 space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-display-hero text-gradient-primary">
                            $2.4M
                        </h1>
                        <p className="text-heading-2 text-muted-foreground">
                            Total Sales This Quarter
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                        <div className="text-center space-y-2">
                            <div className="text-metric-large text-primary">42</div>
                            <p className="text-heading-3">Active Listings</p>
                            <p className="text-sm text-muted-foreground">+12% from last month</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-metric-large text-success">95%</div>
                            <p className="text-heading-3">Client Satisfaction</p>
                            <p className="text-sm text-muted-foreground">Based on 127 reviews</p>
                        </div>
                        <div className="text-center space-y-2">
                            <div className="text-metric-large text-primary">18</div>
                            <p className="text-heading-3">Closed Deals</p>
                            <p className="text-sm text-muted-foreground">This quarter</p>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <Button size="lg" className="text-bold-cta-large">
                            View Full Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Typography Guidelines */}
            <Card>
                <CardHeader>
                    <CardTitle>Typography Usage Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-heading-3 mb-2">Display Text</h3>
                        <p className="text-sm text-muted-foreground">
                            Use for hero sections, landing pages, and major page headings. Creates strong visual impact and hierarchy.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-heading-3 mb-2">Metric Numbers</h3>
                        <p className="text-sm text-muted-foreground">
                            Use tabular-nums for consistent number alignment in dashboards, statistics, and data displays. Perfect for financial figures and KPIs.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-heading-3 mb-2">Gradient Text</h3>
                        <p className="text-sm text-muted-foreground">
                            Apply to key headings and CTAs for premium feel. Use sparingly to maintain impact and avoid overwhelming the design.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-heading-3 mb-2">Bold CTAs</h3>
                        <p className="text-sm text-muted-foreground">
                            Use uppercase, bold, and letter-spaced text for primary action buttons. Creates urgency and draws attention to key actions.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-heading-3 mb-2">Responsive Behavior</h3>
                        <p className="text-sm text-muted-foreground">
                            Typography automatically scales down on mobile devices to maintain readability while preserving visual hierarchy.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
