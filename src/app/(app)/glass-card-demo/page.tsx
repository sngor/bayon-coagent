"use client"

import {
    GlassCard,
    GlassCardHeader,
    GlassCardTitle,
    GlassCardDescription,
    GlassCardContent,
    GlassCardFooter,
} from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, Users, Home } from "lucide-react"

export default function GlassCardDemoPage() {
    return (
        <div className="min-h-screen p-8 space-y-12">
            {/* Hero Section with Gradient Background */}
            <div className="relative">
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-primary/20 to-transparent blur-3xl" />
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-radial from-purple-600/20 to-transparent blur-3xl" />
                </div>

                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold">Glass Card Component</h1>
                        <p className="text-lg text-muted-foreground">
                            Professional glass morphism cards with backdrop blur effects
                        </p>
                    </div>

                    {/* Blur Levels */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Blur Levels</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GlassCard blur="sm">
                                <GlassCardHeader>
                                    <GlassCardTitle className="text-lg">Small</GlassCardTitle>
                                    <GlassCardDescription>4px blur</GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">Subtle glass effect for slight depth</p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard blur="md">
                                <GlassCardHeader>
                                    <GlassCardTitle className="text-lg">Medium</GlassCardTitle>
                                    <GlassCardDescription>12px blur</GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">Standard glass effect (default)</p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard blur="lg">
                                <GlassCardHeader>
                                    <GlassCardTitle className="text-lg">Large</GlassCardTitle>
                                    <GlassCardDescription>16px blur</GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">Strong effect for prominent cards</p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard blur="xl">
                                <GlassCardHeader>
                                    <GlassCardTitle className="text-lg">Extra Large</GlassCardTitle>
                                    <GlassCardDescription>24px blur</GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">Maximum effect for hero sections</p>
                                </GlassCardContent>
                            </GlassCard>
                        </div>
                    </section>

                    {/* Tint Options */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Tint Options</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <GlassCard tint="light" blur="lg">
                                <GlassCardHeader>
                                    <GlassCardTitle>Light Tint</GlassCardTitle>
                                    <GlassCardDescription>Default option</GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">
                                        White in light mode, dark in dark mode
                                    </p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard tint="dark" blur="lg">
                                <GlassCardHeader>
                                    <GlassCardTitle>Dark Tint</GlassCardTitle>
                                    <GlassCardDescription>Inverted colors</GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">
                                        Dark in light mode, light in dark mode
                                    </p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard tint="primary" blur="lg">
                                <GlassCardHeader>
                                    <GlassCardTitle>Primary Tint</GlassCardTitle>
                                    <GlassCardDescription>Brand color</GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">
                                        Uses primary color with transparency
                                    </p>
                                </GlassCardContent>
                            </GlassCard>
                        </div>
                    </section>

                    {/* Interactive Cards */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Interactive Cards</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <GlassCard interactive glow blur="lg">
                                <GlassCardHeader>
                                    <GlassCardTitle>Interactive + Glow</GlassCardTitle>
                                    <GlassCardDescription>
                                        Hover to see effects
                                    </GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">
                                        Scales up and lifts on hover with a subtle glow effect
                                    </p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard interactive gradientBorder blur="lg">
                                <GlassCardHeader>
                                    <GlassCardTitle>Gradient Border</GlassCardTitle>
                                    <GlassCardDescription>
                                        Premium styling
                                    </GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <p className="text-sm">
                                        Animated gradient border for featured content
                                    </p>
                                </GlassCardContent>
                            </GlassCard>
                        </div>
                    </section>

                    {/* Dashboard Example */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Dashboard Stats Example</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <GlassCard blur="lg" glow interactive>
                                <GlassCardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Total Revenue
                                        </p>
                                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="text-3xl font-bold">$45,231</div>
                                    <p className="text-xs text-success mt-1">+20.1% from last month</p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard blur="lg" glow interactive>
                                <GlassCardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Active Clients
                                        </p>
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="text-3xl font-bold">2,350</div>
                                    <p className="text-xs text-success mt-1">+180 this month</p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard blur="lg" glow interactive>
                                <GlassCardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Properties Listed
                                        </p>
                                        <Home className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="text-3xl font-bold">573</div>
                                    <p className="text-xs text-success mt-1">+12% this week</p>
                                </GlassCardContent>
                            </GlassCard>

                            <GlassCard blur="lg" glow interactive>
                                <GlassCardContent>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Conversion Rate
                                        </p>
                                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="text-3xl font-bold">24.5%</div>
                                    <p className="text-xs text-success mt-1">+4.3% from last month</p>
                                </GlassCardContent>
                            </GlassCard>
                        </div>
                    </section>

                    {/* Feature Card Example */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-semibold">Feature Highlight Example</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <GlassCard blur="xl" tint="primary" gradientBorder glow interactive>
                                <GlassCardHeader>
                                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                                        <Sparkles className="w-6 h-6 text-primary" />
                                    </div>
                                    <GlassCardTitle>AI-Powered Insights</GlassCardTitle>
                                    <GlassCardDescription>
                                        Get intelligent recommendations
                                    </GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Real-time market analysis</li>
                                        <li>✓ Predictive analytics</li>
                                        <li>✓ Automated reporting</li>
                                    </ul>
                                </GlassCardContent>
                                <GlassCardFooter>
                                    <Button variant="ghost" size="sm" className="w-full">
                                        Learn More
                                    </Button>
                                </GlassCardFooter>
                            </GlassCard>

                            <GlassCard blur="xl" tint="light" glow interactive>
                                <GlassCardHeader>
                                    <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
                                        <TrendingUp className="w-6 h-6 text-success" />
                                    </div>
                                    <GlassCardTitle>Performance Tracking</GlassCardTitle>
                                    <GlassCardDescription>
                                        Monitor your success metrics
                                    </GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Custom dashboards</li>
                                        <li>✓ Goal tracking</li>
                                        <li>✓ Trend analysis</li>
                                    </ul>
                                </GlassCardContent>
                                <GlassCardFooter>
                                    <Button variant="ghost" size="sm" className="w-full">
                                        View Dashboard
                                    </Button>
                                </GlassCardFooter>
                            </GlassCard>

                            <GlassCard blur="xl" tint="light" glow interactive>
                                <GlassCardHeader>
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                                        <Users className="w-6 h-6 text-purple-500" />
                                    </div>
                                    <GlassCardTitle>Client Management</GlassCardTitle>
                                    <GlassCardDescription>
                                        Organize your relationships
                                    </GlassCardDescription>
                                </GlassCardHeader>
                                <GlassCardContent>
                                    <ul className="space-y-2 text-sm">
                                        <li>✓ Contact database</li>
                                        <li>✓ Communication history</li>
                                        <li>✓ Follow-up reminders</li>
                                    </ul>
                                </GlassCardContent>
                                <GlassCardFooter>
                                    <Button variant="ghost" size="sm" className="w-full">
                                        Manage Clients
                                    </Button>
                                </GlassCardFooter>
                            </GlassCard>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
