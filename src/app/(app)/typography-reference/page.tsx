"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function TypographyReferencePage() {
    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="space-y-4">
                <h1 className="font-headline text-display-large text-gradient">
                    Typography Scale Reference
                </h1>
                <p className="text-lg text-muted-foreground max-w-3xl">
                    A comprehensive visual guide to the typography system used throughout
                    the Co-agent Marketer platform. This reference demonstrates all
                    available text styles, their usage, and accessibility considerations.
                </p>
            </div>

            <Separator />

            {/* Display Text Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-heading-1 mb-2">Display Text</h2>
                    <p className="text-muted-foreground">
                        Use for hero sections, landing pages, and major announcements
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Display Hero</CardTitle>
                            <Badge variant="outline">72px / 800 weight</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-display-hero">
                            Transform Your Marketing
                        </div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-display-hero"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Landing page headlines, hero section
                            titles, major feature announcements
                        </p>
                        <p className="text-sm text-muted-foreground">
                            <strong>Responsive:</strong> 72px (desktop) → 56px (tablet) →
                            40px (mobile)
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Display Large</CardTitle>
                            <Badge variant="outline">56px / 700 weight</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-display-large">
                            AI-Powered Marketing Plans
                        </div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-display-large"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Section headlines, feature page titles,
                            important announcements
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Display Medium</CardTitle>
                            <Badge variant="outline">40px / 700 weight</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-display-medium">Your Marketing Dashboard</div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-display-medium"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Page section headers, card titles in hero
                            sections
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* Heading Styles Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-heading-1 mb-2">Heading Styles</h2>
                    <p className="text-muted-foreground">
                        Use for content hierarchy within pages
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Heading 1</CardTitle>
                            <Badge variant="outline">32px / 700 weight</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h1 className="font-headline text-heading-1">Brand Audit Results</h1>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-heading-1"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Page titles, main section headings,
                            primary content headers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Heading 2</CardTitle>
                            <Badge variant="outline">24px / 600 weight</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h2 className="font-headline text-heading-2">NAP Consistency Check</h2>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-heading-2"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Subsection headings, card titles, feature
                            labels
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Heading 3</CardTitle>
                            <Badge variant="outline">20px / 600 weight</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <h3 className="font-headline text-heading-3">Recent Activity</h3>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-heading-3"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Tertiary headings, list section headers,
                            component titles
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* Metric Display Styles Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-heading-1 mb-2">Metric Display Styles</h2>
                    <p className="text-muted-foreground">
                        Use for displaying numbers, statistics, and data visualizations
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Metric Large</CardTitle>
                            <Badge variant="outline">48px / 700 weight / Tabular</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-metric-large text-primary">$2,450,000</div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-metric-large"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Dashboard key metrics, large statistics,
                            hero numbers
                        </p>
                        <p className="text-sm text-muted-foreground">
                            <strong>Features:</strong> Tabular numbers for alignment, tight
                            letter spacing
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Metric Medium</CardTitle>
                            <Badge variant="outline">32px / 600 weight / Tabular</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-metric-medium text-success">127</div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-metric-medium"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Card metrics, secondary statistics,
                            comparison numbers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Metric Small</CardTitle>
                            <Badge variant="outline">24px / 600 weight / Tabular</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-metric-small">42%</div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-metric-small"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Inline metrics, small stat cards, list
                            item numbers
                        </p>
                    </CardContent>
                </Card>

                {/* Metric Alignment Demo */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tabular Number Alignment</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Revenue</span>
                                <span className="text-metric-small">$1,234,567</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Expenses</span>
                                <span className="text-metric-small">$234,567</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Profit</span>
                                <span className="text-metric-small text-success">
                                    $1,000,000
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Notice how the numbers align perfectly due to tabular-nums
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* CTA Styles Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-heading-1 mb-2">Call-to-Action Styles</h2>
                    <p className="text-muted-foreground">
                        Use for buttons, links, and action-oriented text
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Bold CTA</CardTitle>
                            <Badge variant="outline">18px / 700 weight / Uppercase</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button size="lg">
                            <span className="text-bold-cta">Get Started</span>
                        </Button>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-bold-cta"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Primary button text, important action
                            links, navigation items
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Bold CTA Large</CardTitle>
                            <Badge variant="outline">20px / 800 weight / Uppercase</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button size="lg" className="h-14 px-8">
                            <span className="text-bold-cta-large">Start Free Trial</span>
                        </Button>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-bold-cta-large"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Hero CTAs, primary landing page actions,
                            major conversion buttons
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* Gradient Text Effects Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-heading-1 mb-2">Gradient Text Effects</h2>
                    <p className="text-muted-foreground">
                        Add visual interest and emphasis to headings
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Default Gradient</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-display-medium text-gradient">
                            Welcome to the Future
                        </div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-display-medium text-gradient"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong>Usage:</strong> Hero headlines, feature titles, special
                            announcements
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Primary Gradient</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-display-medium text-gradient-primary">
                            AI-Powered Insights
                        </div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-display-medium text-gradient-primary"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Uses primary brand colors for gradient effect
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Accent Gradient</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-display-medium text-gradient-accent">
                            Premium Features
                        </div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-display-medium text-gradient-accent"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Uses accent gradient (purple to blue) for special emphasis
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Success Gradient</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-metric-large text-gradient-success">+127%</div>
                        <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded">
                            className="text-metric-large text-gradient-success"
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Uses success colors for positive messaging
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* Real-World Examples Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-heading-1 mb-2">Real-World Examples</h2>
                    <p className="text-muted-foreground">
                        See how typography styles work together in common UI patterns
                    </p>
                </div>

                {/* Dashboard Card Example */}
                <Card>
                    <CardHeader>
                        <CardTitle>Dashboard Metric Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle className="text-heading-3">
                                    Total Revenue
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-metric-large text-gradient-success">
                                    $2.4M
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    +12.5% from last month
                                </p>
                            </CardContent>
                        </Card>
                    </CardContent>
                </Card>

                {/* Hero Section Example */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hero Section</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gradient-to-br from-primary/10 to-purple-600/10 p-12 rounded-lg">
                            <h1 className="font-headline text-display-hero text-gradient mb-6">
                                Transform Your Real Estate Marketing
                            </h1>
                            <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                                AI-powered tools to build your brand, create content, and
                                dominate your market
                            </p>
                            <Button size="lg">
                                <span className="text-bold-cta-large">Get Started Free</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Grid Example */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stats Grid</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-metric-medium text-primary">127</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Active Listings
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-metric-medium text-success">4.8</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Average Rating
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-metric-medium text-primary">2.4K</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Total Views
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="text-metric-medium text-success">+42%</div>
                                <p className="text-sm text-muted-foreground mt-1">Growth</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            {/* Accessibility Section */}
            <section className="space-y-6">
                <div>
                    <h2 className="font-headline text-heading-1 mb-2">Accessibility Guidelines</h2>
                    <p className="text-muted-foreground">
                        Ensure your typography meets WCAG 2.1 Level AA standards
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Contrast Requirements</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-muted rounded">
                                <span className="text-sm">Normal text (&lt; 18px)</span>
                                <Badge>4.5:1 minimum</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted rounded">
                                <span className="text-sm">
                                    Large text (≥ 18px or ≥ 14px bold)
                                </span>
                                <Badge>3:1 minimum</Badge>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-muted rounded">
                                <span className="text-sm">Display text</span>
                                <Badge>3:1 minimum</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Best Practices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-success mt-1">✓</span>
                                <span>Use semantic HTML (h1, h2, h3) for proper hierarchy</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success mt-1">✓</span>
                                <span>
                                    Test gradient text with color blindness simulators
                                </span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success mt-1">✓</span>
                                <span>Maintain minimum 44x44px touch targets on mobile</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-success mt-1">✓</span>
                                <span>Never use text smaller than 16px for body content</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">✗</span>
                                <span>Don't use gradient text for body content</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-destructive mt-1">✗</span>
                                <span>Don't use all caps for long-form text</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </section>

            {/* Footer */}
            <div className="pt-8 border-t">
                <p className="text-sm text-muted-foreground text-center">
                    For complete documentation, see{" "}
                    <code className="bg-muted px-2 py-1 rounded">
                        TYPOGRAPHY_SCALE_DOCUMENTATION.md
                    </code>
                </p>
            </div>
        </div>
    );
}
