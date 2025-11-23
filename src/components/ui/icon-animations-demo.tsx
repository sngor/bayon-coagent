'use client';

/**
 * Icon Animation Library Demo
 * 
 * Interactive demonstration of all icon animation variants with controls.
 * Use this component to preview animations and test configurations.
 */

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
    iconAnimations,
    type AnimationSpeed,
    type AnimationStyle,
    prefersReducedMotion,
} from '@/lib/icon-animations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HouseIcon, ChartIcon, AISparkleIcon, SuccessIcon } from './real-estate-icons';

export function IconAnimationsDemo() {
    const [speed, setSpeed] = useState<AnimationSpeed>('normal');
    const [style, setStyle] = useState<AnimationStyle>('normal');
    const [key, setKey] = useState(0);

    const reducedMotion = prefersReducedMotion();

    const replay = () => setKey((k) => k + 1);

    return (
        <div className="space-y-8 p-8">
            {/* Header */}
            <div>
                <h1 className="font-headline text-3xl font-bold mb-2">Icon Animation Library</h1>
                <p className="text-muted-foreground">
                    Interactive demonstration of all animation variants with live controls
                </p>
                {reducedMotion && (
                    <Badge variant="outline" className="mt-2">
                        Reduced Motion Enabled
                    </Badge>
                )}
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Animation Controls</CardTitle>
                    <CardDescription>Adjust speed and style to see how animations change</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Speed</label>
                        <Select value={speed} onValueChange={(v) => setSpeed(v as AnimationSpeed)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="instant">Instant (0ms)</SelectItem>
                                <SelectItem value="fast">Fast (200ms)</SelectItem>
                                <SelectItem value="normal">Normal (400ms)</SelectItem>
                                <SelectItem value="slow">Slow (800ms)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Style</label>
                        <Select value={style} onValueChange={(v) => setStyle(v as AnimationStyle)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="subtle">Subtle (1.05x)</SelectItem>
                                <SelectItem value="normal">Normal (1.1x)</SelectItem>
                                <SelectItem value="energetic">Energetic (1.2x)</SelectItem>
                                <SelectItem value="playful">Playful (1.3x)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button onClick={replay}>Replay All</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Animation Demos */}
            <Tabs defaultValue="entrance" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="entrance">Entrance</TabsTrigger>
                    <TabsTrigger value="interaction">Interaction</TabsTrigger>
                    <TabsTrigger value="path">Path Drawing</TabsTrigger>
                    <TabsTrigger value="composite">Composite</TabsTrigger>
                    <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>

                {/* Entrance Animations */}
                <TabsContent value="entrance" className="space-y-4">
                    <AnimationCard
                        title="Fade In"
                        description="Smooth opacity transition from 0 to 1"
                        code="iconAnimations.fadeIn({ speed, style })"
                    >
                        <motion.div
                            key={`fadeIn-${key}`}
                            variants={iconAnimations.fadeIn({ speed, style })}
                            initial="initial"
                            animate="animate"
                        >
                            <HouseIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Scale In"
                        description="Pop effect that scales from 0 to 1"
                        code="iconAnimations.scaleIn({ speed, style })"
                    >
                        <motion.div
                            key={`scaleIn-${key}`}
                            variants={iconAnimations.scaleIn({ speed, style })}
                            initial="initial"
                            animate="animate"
                        >
                            <ChartIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Slide In (Up)"
                        description="Slide from bottom with fade"
                        code="iconAnimations.slideIn('up', { speed, style })"
                    >
                        <motion.div
                            key={`slideUp-${key}`}
                            variants={iconAnimations.slideIn('up', { speed, style })}
                            initial="initial"
                            animate="animate"
                        >
                            <HouseIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Bounce In"
                        description="Playful bounce effect with overshoot"
                        code="iconAnimations.bounceIn({ speed, style })"
                    >
                        <motion.div
                            key={`bounceIn-${key}`}
                            variants={iconAnimations.bounceIn({ speed, style })}
                            initial="initial"
                            animate="animate"
                        >
                            <SuccessIcon animated={false} className="w-16 h-16 text-success" />
                        </motion.div>
                    </AnimationCard>
                </TabsContent>

                {/* Interaction Animations */}
                <TabsContent value="interaction" className="space-y-4">
                    <AnimationCard
                        title="Hover"
                        description="Scale up on hover, scale down on tap"
                        code="iconAnimations.hover({ speed, style })"
                    >
                        <motion.div
                            variants={iconAnimations.hover({ speed, style })}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            className="cursor-pointer"
                        >
                            <HouseIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Pulse"
                        description="Continuous pulsing animation"
                        code="iconAnimations.pulse({ speed, style })"
                    >
                        <motion.div variants={iconAnimations.pulse({ speed, style })} animate="animate">
                            <ChartIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Rotate"
                        description="Continuous rotation animation"
                        code="iconAnimations.rotate({ speed })"
                    >
                        <motion.div variants={iconAnimations.rotate({ speed })} animate="animate">
                            <AISparkleIcon animated={false} className="w-16 h-16" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Wiggle"
                        description="Shake animation for attention"
                        code="iconAnimations.wiggle({ speed, style })"
                    >
                        <Button onClick={() => setKey((k) => k + 1)}>Trigger Wiggle</Button>
                        <motion.div
                            key={`wiggle-${key}`}
                            variants={iconAnimations.wiggle({ speed, style })}
                            animate="animate"
                        >
                            <HouseIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>
                </TabsContent>

                {/* Path Drawing */}
                <TabsContent value="path" className="space-y-4">
                    <AnimationCard
                        title="Path Draw"
                        description="Animate SVG path from 0 to full length"
                        code="iconAnimations.pathDraw({ speed })"
                    >
                        <svg viewBox="0 0 100 100" className="w-32 h-32">
                            <motion.path
                                key={`path-${key}`}
                                d="M 10 50 Q 30 10, 50 50 T 90 50"
                                stroke="hsl(var(--primary))"
                                strokeWidth="4"
                                fill="none"
                                variants={iconAnimations.pathDraw({ speed })}
                                initial="initial"
                                animate="animate"
                            />
                        </svg>
                    </AnimationCard>

                    <AnimationCard
                        title="Staggered Paths"
                        description="Multiple paths drawing in sequence"
                        code="iconAnimations.staggeredPath(3, { speed })"
                    >
                        <svg viewBox="0 0 100 100" className="w-32 h-32">
                            {iconAnimations.staggeredPath(3, { speed }).map((variants, i) => (
                                <motion.line
                                    key={`line-${key}-${i}`}
                                    x1="20"
                                    y1={30 + i * 20}
                                    x2="80"
                                    y2={30 + i * 20}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth="4"
                                    variants={variants}
                                    initial="initial"
                                    animate="animate"
                                />
                            ))}
                        </svg>
                    </AnimationCard>
                </TabsContent>

                {/* Composite Animations */}
                <TabsContent value="composite" className="space-y-4">
                    <AnimationCard
                        title="Success"
                        description="Celebration animation for success states"
                        code="iconAnimations.success({ style })"
                    >
                        <motion.div
                            key={`success-${key}`}
                            variants={iconAnimations.success({ style })}
                            initial="initial"
                            animate="animate"
                        >
                            <SuccessIcon animated={false} className="w-16 h-16 text-success" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Spinner"
                        description="Loading spinner animation"
                        code="iconAnimations.spinner({ speed })"
                    >
                        <motion.svg
                            viewBox="0 0 24 24"
                            className="w-16 h-16"
                            variants={iconAnimations.spinner({ speed })}
                            animate="animate"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="hsl(var(--primary))"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray="60"
                                strokeLinecap="round"
                            />
                        </motion.svg>
                    </AnimationCard>

                    <AnimationCard
                        title="Sparkle"
                        description="AI/magic effect with rotation and pulse"
                        code="iconAnimations.sparkle({ speed, style })"
                    >
                        <motion.div variants={iconAnimations.sparkle({ speed, style })} animate="animate">
                            <AISparkleIcon animated={false} className="w-16 h-16" />
                        </motion.div>
                    </AnimationCard>
                </TabsContent>

                {/* Presets */}
                <TabsContent value="presets" className="space-y-4">
                    <AnimationCard
                        title="Standard"
                        description="Default icon animation with entrance and hover"
                        code="iconAnimations.standard()"
                    >
                        <motion.div
                            key={`standard-${key}`}
                            variants={iconAnimations.standard()}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap="tap"
                            className="cursor-pointer"
                        >
                            <HouseIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Navigation"
                        description="Subtle animation for navigation items"
                        code="iconAnimations.navigation()"
                    >
                        <motion.div
                            key={`nav-${key}`}
                            variants={iconAnimations.navigation()}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap="tap"
                            className="cursor-pointer"
                        >
                            <ChartIcon animated={false} className="w-16 h-16 text-primary" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Feature"
                        description="Energetic animation for feature highlights"
                        code="iconAnimations.feature()"
                    >
                        <motion.div
                            key={`feature-${key}`}
                            variants={iconAnimations.feature()}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            whileTap="tap"
                            className="cursor-pointer"
                        >
                            <AISparkleIcon animated={false} className="w-16 h-16" />
                        </motion.div>
                    </AnimationCard>

                    <AnimationCard
                        title="Empty State"
                        description="Gentle animation for empty state illustrations"
                        code="iconAnimations.emptyState()"
                    >
                        <motion.div
                            key={`empty-${key}`}
                            variants={iconAnimations.emptyState()}
                            initial="initial"
                            animate="animate"
                        >
                            <HouseIcon animated={false} className="w-16 h-16 text-muted-foreground" />
                        </motion.div>
                    </AnimationCard>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AnimationCard({
    title,
    description,
    code,
    children,
}: {
    title: string;
    description: string;
    code: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center justify-center min-h-[120px] flex-1">{children}</div>
                    <div className="flex-1 ml-8">
                        <code className="text-sm bg-muted p-3 rounded-lg block">{code}</code>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
