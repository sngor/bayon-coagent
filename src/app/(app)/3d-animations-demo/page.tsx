'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Star,
    Award,
    TrendingUp,
    MessageSquare,
    PenTool,
    Search,
    Calculator,
    Users,
    Target,
    Zap,
    Calendar,
    Clock,
    CheckCircle2,
    BarChart3,
    Activity,
    Sparkles,
    Eye,
    Heart,
    DollarSign,
    Home,
    Settings,
} from 'lucide-react';

// Import our 3D components
import { Dashboard3DLayout, Grid3DLayout, Section3D } from '@/components/ui/3d-dashboard-layout';
import { Metric3DCard, RevenueMetric3DCard, EngagementMetric3DCard, GrowthMetric3DCard } from '@/components/ui/3d-metric-cards';
import {
    House3DIcon,
    Chart3DIcon,
    AISparkle3DIcon,
    Success3DIcon,
    Target3DIcon,
    Users3DIcon,
    Content3DIcon
} from '@/components/ui/3d-interactive-icons';

// Import UI components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StandardPageLayout } from '@/components/standard';

/**
 * 3D Animations Demo Page
 * 
 * Showcases all the new 3D interactive animations and components
 */
export default function Animations3DDemoPage() {
    const [animationsEnabled, setAnimationsEnabled] = useState(true);
    const [intensity, setIntensity] = useState<'subtle' | 'medium' | 'strong'>('medium');
    const [glowEffects, setGlowEffects] = useState(true);
    const [particleEffects, setParticleEffects] = useState(true);
    const [floatingElements, setFloatingElements] = useState(true);

    return (
        <StandardPageLayout
            title="3D Interactive Animations"
            description="Experience the enhanced dashboard with 3D interactive elements, hover effects, and smooth animations"
        >
            <Dashboard3DLayout
                enableParallax={true}
                staggerDelay={0.1}
                floatingElements={floatingElements}
                className="space-y-8"
            >
                {/* Controls Section */}
                <Section3D depth="shallow">
                    <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <Settings className="w-5 h-5" />
                                Animation Controls
                            </CardTitle>
                            <CardDescription>
                                Adjust the animation settings to see different effects
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="animations"
                                        checked={animationsEnabled}
                                        onCheckedChange={setAnimationsEnabled}
                                    />
                                    <Label htmlFor="animations">Animations</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="glow"
                                        checked={glowEffects}
                                        onCheckedChange={setGlowEffects}
                                    />
                                    <Label htmlFor="glow">Glow Effects</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="particles"
                                        checked={particleEffects}
                                        onCheckedChange={setParticleEffects}
                                    />
                                    <Label htmlFor="particles">Particles</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="floating"
                                        checked={floatingElements}
                                        onCheckedChange={setFloatingElements}
                                    />
                                    <Label htmlFor="floating">Floating Elements</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="intensity">Intensity</Label>
                                    <Select value={intensity} onValueChange={(value: 'subtle' | 'medium' | 'strong') => setIntensity(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="subtle">Subtle</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="strong">Strong</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Section3D>

                {/* 3D Icons Showcase */}
                <Section3D
                    title="3D Interactive Icons"
                    description="Hover over the icons to see 3D effects, mouse tracking, and animations"
                    depth="medium"
                >
                    <Tabs defaultValue="icons" className="space-y-6">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="icons">3D Icons</TabsTrigger>
                            <TabsTrigger value="metrics">Metric Cards</TabsTrigger>
                            <TabsTrigger value="layouts">Layout Effects</TabsTrigger>
                        </TabsList>

                        <TabsContent value="icons" className="space-y-6">
                            <Grid3DLayout columns={4} gap="lg">
                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                                    <House3DIcon
                                        className="w-16 h-16 mx-auto mb-4 text-primary"
                                        animated={animationsEnabled}
                                        intensity={intensity}
                                        floatingAnimation={animationsEnabled}
                                        glowEffect={glowEffects}
                                        size="xl"
                                    />
                                    <h3 className="font-semibold mb-2">House 3D</h3>
                                    <p className="text-sm text-muted-foreground">Architectural depth with animated construction</p>
                                </Card>

                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                                    <Chart3DIcon
                                        className="w-16 h-16 mx-auto mb-4 text-blue-600"
                                        animated={animationsEnabled}
                                        intensity={intensity}
                                        floatingAnimation={animationsEnabled}
                                        glowEffect={glowEffects}
                                        size="xl"
                                    />
                                    <h3 className="font-semibold mb-2">Chart 3D</h3>
                                    <p className="text-sm text-muted-foreground">Data visualization with growing bars</p>
                                </Card>

                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                                    <AISparkle3DIcon
                                        className="w-16 h-16 mx-auto mb-4 text-purple-600"
                                        animated={animationsEnabled}
                                        intensity={intensity}
                                        floatingAnimation={animationsEnabled}
                                        glowEffect={glowEffects}
                                        particleEffect={particleEffects}
                                        size="xl"
                                    />
                                    <h3 className="font-semibold mb-2">AI Sparkle 3D</h3>
                                    <p className="text-sm text-muted-foreground">Particle effects with rotating rays</p>
                                </Card>

                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                                    <Success3DIcon
                                        className="w-16 h-16 mx-auto mb-4 text-green-600"
                                        animated={animationsEnabled}
                                        intensity={intensity}
                                        floatingAnimation={animationsEnabled}
                                        glowEffect={glowEffects}
                                        size="xl"
                                    />
                                    <h3 className="font-semibold mb-2">Success 3D</h3>
                                    <p className="text-sm text-muted-foreground">Celebration effect with spring animation</p>
                                </Card>

                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                                    <Target3DIcon
                                        className="w-16 h-16 mx-auto mb-4 text-orange-600"
                                        animated={animationsEnabled}
                                        intensity={intensity}
                                        floatingAnimation={animationsEnabled}
                                        glowEffect={glowEffects}
                                        size="xl"
                                    />
                                    <h3 className="font-semibold mb-2">Target 3D</h3>
                                    <p className="text-sm text-muted-foreground">Focus rings with pulsing animation</p>
                                </Card>

                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                                    <Users3DIcon
                                        className="w-16 h-16 mx-auto mb-4 text-indigo-600"
                                        animated={animationsEnabled}
                                        intensity={intensity}
                                        floatingAnimation={animationsEnabled}
                                        glowEffect={glowEffects}
                                        size="xl"
                                    />
                                    <h3 className="font-semibold mb-2">Users 3D</h3>
                                    <p className="text-sm text-muted-foreground">Connection lines with staggered entry</p>
                                </Card>

                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300">
                                    <Content3DIcon
                                        className="w-16 h-16 mx-auto mb-4 text-teal-600"
                                        animated={animationsEnabled}
                                        intensity={intensity}
                                        floatingAnimation={animationsEnabled}
                                        glowEffect={glowEffects}
                                        size="xl"
                                    />
                                    <h3 className="font-semibold mb-2">Content 3D</h3>
                                    <p className="text-sm text-muted-foreground">Document layers with text animation</p>
                                </Card>

                                <Card className="p-8 text-center hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-primary/10 to-purple-600/10 border-primary/20">
                                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <motion.div
                                            animate={animationsEnabled ? {
                                                rotate: [0, 360],
                                                scale: [1, 1.1, 1],
                                            } : {}}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <Sparkles className="w-16 h-16 text-primary" />
                                        </motion.div>
                                    </div>
                                    <h3 className="font-semibold mb-2">Custom Animation</h3>
                                    <p className="text-sm text-muted-foreground">Build your own 3D effects</p>
                                </Card>
                            </Grid3DLayout>
                        </TabsContent>

                        <TabsContent value="metrics" className="space-y-6">
                            <Grid3DLayout columns={2} gap="lg">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold">Standard Metrics</h3>
                                    <Grid3DLayout columns={2} gap="md">
                                        <Metric3DCard
                                            title="Total Views"
                                            value="125,430"
                                            icon={Eye}
                                            trend="up"
                                            change={12.5}
                                            changeLabel="vs last month"
                                            animated={animationsEnabled}
                                            intensity={intensity}
                                            glowColor={glowEffects ? "#3b82f6" : undefined}
                                            particleEffect={particleEffects}
                                        />

                                        <Metric3DCard
                                            title="Engagement Rate"
                                            value="8.4%"
                                            icon={Heart}
                                            trend="up"
                                            change={5.2}
                                            changeLabel="vs last month"
                                            animated={animationsEnabled}
                                            intensity={intensity}
                                            glowColor={glowEffects ? "#10b981" : undefined}
                                            particleEffect={particleEffects}
                                        />

                                        <Metric3DCard
                                            title="Conversion Rate"
                                            value="3.2%"
                                            icon={Target}
                                            trend="down"
                                            change={-2.1}
                                            changeLabel="vs last month"
                                            animated={animationsEnabled}
                                            intensity={intensity}
                                            glowColor={glowEffects ? "#ef4444" : undefined}
                                        />

                                        <Metric3DCard
                                            title="Active Users"
                                            value="2,847"
                                            icon={Users}
                                            trend="neutral"
                                            animated={animationsEnabled}
                                            intensity={intensity}
                                            glowColor={glowEffects ? "#6b7280" : undefined}
                                        />
                                    </Grid3DLayout>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold">Specialized Metrics</h3>
                                    <div className="space-y-4">
                                        <RevenueMetric3DCard
                                            title="Monthly Revenue"
                                            revenue={45230}
                                            previousRevenue={38950}
                                            icon={DollarSign}
                                            animated={animationsEnabled}
                                            intensity={intensity}
                                            size="lg"
                                        />

                                        <EngagementMetric3DCard
                                            title="Social Engagement"
                                            rate={12.8}
                                            previousRate={11.2}
                                            icon={MessageSquare}
                                            animated={animationsEnabled}
                                            intensity={intensity}
                                            size="lg"
                                        />

                                        <GrowthMetric3DCard
                                            title="Lead Generation"
                                            current={156}
                                            previous={134}
                                            icon={TrendingUp}
                                            animated={animationsEnabled}
                                            intensity={intensity}
                                            size="lg"
                                        />
                                    </div>
                                </div>
                            </Grid3DLayout>
                        </TabsContent>

                        <TabsContent value="layouts" className="space-y-6">
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Staggered Grid Animation</h3>
                                    <Grid3DLayout columns={4} gap="md" staggered={true}>
                                        {[...Array(8)].map((_, i) => (
                                            <Card key={i} className="p-6 text-center">
                                                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <span className="text-primary font-bold">{i + 1}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">Card {i + 1}</p>
                                            </Card>
                                        ))}
                                    </Grid3DLayout>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Section Depth Effects</h3>
                                    <div className="space-y-6">
                                        <Section3D depth="shallow" title="Shallow Depth" description="Subtle 3D effect">
                                            <Card className="p-6">
                                                <p className="text-muted-foreground">This section has a shallow 3D depth effect.</p>
                                            </Card>
                                        </Section3D>

                                        <Section3D depth="medium" title="Medium Depth" description="Moderate 3D effect">
                                            <Card className="p-6">
                                                <p className="text-muted-foreground">This section has a medium 3D depth effect.</p>
                                            </Card>
                                        </Section3D>

                                        <Section3D depth="deep" title="Deep Depth" description="Strong 3D effect">
                                            <Card className="p-6">
                                                <p className="text-muted-foreground">This section has a deep 3D depth effect.</p>
                                            </Card>
                                        </Section3D>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Interactive Hover Zones</h3>
                                    <Grid3DLayout columns={3} gap="md">
                                        {['Subtle', 'Medium', 'Strong'].map((level, i) => (
                                            <Card key={level} className="p-8 text-center hover:shadow-2xl transition-all duration-300">
                                                <motion.div
                                                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center"
                                                    whileHover={{
                                                        scale: 1.1,
                                                        rotateY: 10,
                                                        rotateX: -5,
                                                    }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <Home className="w-8 h-8 text-white" />
                                                </motion.div>
                                                <h4 className="font-semibold mb-2">{level} Intensity</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Hover to see {level.toLowerCase()} 3D effects
                                                </p>
                                            </Card>
                                        ))}
                                    </Grid3DLayout>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Section3D>

                {/* Performance Tips */}
                <Section3D
                    title="Performance & Usage Tips"
                    description="Best practices for implementing 3D animations"
                    depth="shallow"
                >
                    <Grid3DLayout columns={2} gap="lg">
                        <Card className="p-6">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Performance Tips
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Use <code>will-change: transform</code> for better performance
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Limit the number of animated elements on screen
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Use <code>transform3d()</code> to enable hardware acceleration
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Provide options to disable animations for accessibility
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="p-6">
                            <CardHeader className="px-0 pt-0">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-500" />
                                    Usage Guidelines
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <ul className="space-y-3 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Use subtle animations for better user experience
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Provide visual feedback for interactive elements
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Maintain consistency across similar components
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        Test on different devices and screen sizes
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </Grid3DLayout>
                </Section3D>
            </Dashboard3DLayout>
        </StandardPageLayout>
    );
}