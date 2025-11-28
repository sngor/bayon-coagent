'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Hand,
    Move,
    ZoomIn,
    ZoomOut,
    Timer,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import {
    useGestureHandler,
    useSwipeGesture,
    usePinchGesture,
    useLongPressGesture,
    useMobileGestures,
    type SwipeGesture,
    type PinchGesture,
    type LongPressGesture
} from '@/hooks/use-gesture-handler';
import { cn } from '@/lib/utils';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';

interface GestureEvent {
    type: string;
    timestamp: number;
    details: string;
}

export function GestureDemo() {
    const [events, setEvents] = useState<GestureEvent[]>([]);
    const [scale, setScale] = useState(1);
    const [isLongPressing, setIsLongPressing] = useState(false);

    const addEvent = (type: string, details: string) => {
        setEvents(prev => [
            { type, timestamp: Date.now(), details },
            ...prev.slice(0, 9) // Keep last 10 events
        ]);
    };

    const clearEvents = () => {
        setEvents([]);
        setScale(1);
        setIsLongPressing(false);
    };

    return (
        <div className="space-y-6 p-4 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-headline font-bold">Gesture Handling Demo</h1>
                <p className="text-muted-foreground">
                    Try swipe, pinch, and long-press gestures on the cards below
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Swipe Demo */}
                <SwipeDemo onEvent={addEvent} />

                {/* Pinch Demo */}
                <PinchDemo scale={scale} setScale={setScale} onEvent={addEvent} />

                {/* Long Press Demo */}
                <LongPressDemo
                    isLongPressing={isLongPressing}
                    setIsLongPressing={setIsLongPressing}
                    onEvent={addEvent}
                />

                {/* Combined Gestures Demo */}
                <CombinedGesturesDemo onEvent={addEvent} />
            </div>

            {/* Event Log */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Event Log</CardTitle>
                        <CardDescription>Recent gesture events</CardDescription>
                    </div>
                    <Button
                        onClick={clearEvents}
                        variant="outline"
                        size="sm"
                        className={TOUCH_FRIENDLY_CLASSES.button}
                    >
                        Clear
                    </Button>
                </CardHeader>
                <CardContent>
                    {events.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No events yet. Try interacting with the cards above!
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {events.map((event, index) => (
                                <div
                                    key={`${event.timestamp}-${index}`}
                                    className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 text-sm"
                                >
                                    <Badge variant="secondary" className="shrink-0">
                                        {event.type}
                                    </Badge>
                                    <span className="text-muted-foreground flex-1">
                                        {event.details}
                                    </span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function SwipeDemo({ onEvent }: { onEvent: (type: string, details: string) => void }) {
    const [lastSwipe, setLastSwipe] = useState<string | null>(null);

    const { ref } = useSwipeGesture<HTMLDivElement>(
        (gesture: SwipeGesture) => {
            setLastSwipe(gesture.direction);
            onEvent(
                'Swipe',
                `Direction: ${gesture.direction}, Distance: ${Math.round(gesture.distance)}px, Velocity: ${gesture.velocity.toFixed(2)}px/ms`
            );
            setTimeout(() => setLastSwipe(null), 1000);
        },
        {
            swipeThreshold: 50,
            swipeVelocityThreshold: 0.3,
            hapticFeedback: true,
            visualFeedback: true,
        }
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Move className="w-5 h-5" />
                    Swipe Gestures
                </CardTitle>
                <CardDescription>
                    Swipe in any direction
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    ref={ref}
                    className={cn(
                        "relative h-48 rounded-lg border-2 border-dashed border-muted-foreground/25",
                        "flex items-center justify-center",
                        "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
                        "touch-pan-y select-none cursor-move",
                        "transition-all duration-200",
                        lastSwipe && "scale-95"
                    )}
                >
                    <div className="text-center space-y-2">
                        <Hand className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">Swipe Here</p>
                        {lastSwipe && (
                            <div className="flex items-center justify-center gap-2">
                                {lastSwipe === 'left' && <ArrowLeft className="w-5 h-5 text-blue-600" />}
                                {lastSwipe === 'right' && <ArrowRight className="w-5 h-5 text-blue-600" />}
                                {lastSwipe === 'up' && <ArrowUp className="w-5 h-5 text-blue-600" />}
                                {lastSwipe === 'down' && <ArrowDown className="w-5 h-5 text-blue-600" />}
                                <Badge variant="default">{lastSwipe}</Badge>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function PinchDemo({
    scale,
    setScale,
    onEvent
}: {
    scale: number;
    setScale: (scale: number) => void;
    onEvent: (type: string, details: string) => void;
}) {
    const { ref } = usePinchGesture<HTMLDivElement>(
        {
            onPinch: (gesture: PinchGesture) => {
                setScale(gesture.scale);
            },
            onPinchEnd: (gesture: PinchGesture) => {
                onEvent(
                    'Pinch',
                    `Scale: ${gesture.scale.toFixed(2)}x, Distance: ${Math.round(gesture.currentDistance)}px`
                );
            },
        },
        {
            pinchThreshold: 0.1,
            hapticFeedback: true,
            visualFeedback: false, // Disable default visual feedback
        }
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {scale > 1 ? <ZoomIn className="w-5 h-5" /> : <ZoomOut className="w-5 h-5" />}
                    Pinch Gestures
                </CardTitle>
                <CardDescription>
                    Use two fingers to zoom
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    ref={ref}
                    className={cn(
                        "relative h-48 rounded-lg border-2 border-dashed border-muted-foreground/25",
                        "flex items-center justify-center overflow-hidden",
                        "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
                        "touch-pan-y select-none"
                    )}
                >
                    <div
                        className="text-center space-y-2 transition-transform duration-100"
                        style={{ transform: `scale(${scale})` }}
                    >
                        <Hand className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">Pinch to Zoom</p>
                        <Badge variant="secondary">
                            {scale.toFixed(2)}x
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LongPressDemo({
    isLongPressing,
    setIsLongPressing,
    onEvent
}: {
    isLongPressing: boolean;
    setIsLongPressing: (value: boolean) => void;
    onEvent: (type: string, details: string) => void;
}) {
    const { ref } = useLongPressGesture<HTMLDivElement>(
        {
            onLongPressStart: (gesture: LongPressGesture) => {
                setIsLongPressing(true);
                onEvent(
                    'Long Press Start',
                    `Position: (${Math.round(gesture.x)}, ${Math.round(gesture.y)})`
                );
            },
            onLongPressEnd: (gesture: LongPressGesture) => {
                setIsLongPressing(false);
                onEvent(
                    'Long Press End',
                    `Duration: ${gesture.duration}ms`
                );
            },
        },
        {
            longPressDelay: 500,
            longPressMoveThreshold: 10,
            hapticFeedback: true,
            visualFeedback: true,
        }
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5" />
                    Long Press Gestures
                </CardTitle>
                <CardDescription>
                    Press and hold for 500ms
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    ref={ref}
                    className={cn(
                        "relative h-48 rounded-lg border-2 border-dashed border-muted-foreground/25",
                        "flex items-center justify-center",
                        "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
                        "touch-pan-y select-none cursor-pointer",
                        "transition-all duration-200",
                        isLongPressing && "scale-95 bg-green-100 dark:bg-green-900/30"
                    )}
                >
                    <div className="text-center space-y-2">
                        <Hand className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">Press & Hold</p>
                        {isLongPressing && (
                            <Badge variant="default" className="bg-green-600">
                                Pressing...
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CombinedGesturesDemo({ onEvent }: { onEvent: (type: string, details: string) => void }) {
    const [lastGesture, setLastGesture] = useState<string | null>(null);

    const { ref } = useMobileGestures<HTMLDivElement>(
        {
            onSwipeLeft: () => {
                setLastGesture('← Swipe Left');
                onEvent('Combined', 'Swipe Left detected');
                setTimeout(() => setLastGesture(null), 1000);
            },
            onSwipeRight: () => {
                setLastGesture('Swipe Right →');
                onEvent('Combined', 'Swipe Right detected');
                setTimeout(() => setLastGesture(null), 1000);
            },
            onSwipeUp: () => {
                setLastGesture('↑ Swipe Up');
                onEvent('Combined', 'Swipe Up detected');
                setTimeout(() => setLastGesture(null), 1000);
            },
            onSwipeDown: () => {
                setLastGesture('↓ Swipe Down');
                onEvent('Combined', 'Swipe Down detected');
                setTimeout(() => setLastGesture(null), 1000);
            },
            onPinchIn: (scale) => {
                setLastGesture(`Pinch In ${scale.toFixed(2)}x`);
                onEvent('Combined', `Pinch In: ${scale.toFixed(2)}x`);
                setTimeout(() => setLastGesture(null), 1000);
            },
            onPinchOut: (scale) => {
                setLastGesture(`Pinch Out ${scale.toFixed(2)}x`);
                onEvent('Combined', `Pinch Out: ${scale.toFixed(2)}x`);
                setTimeout(() => setLastGesture(null), 1000);
            },
            onLongPress: (x, y) => {
                setLastGesture(`Long Press at (${Math.round(x)}, ${Math.round(y)})`);
                onEvent('Combined', `Long Press at (${Math.round(x)}, ${Math.round(y)})`);
                setTimeout(() => setLastGesture(null), 1000);
            },
        },
        {
            hapticFeedback: true,
            visualFeedback: true,
        }
    );

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Hand className="w-5 h-5" />
                    All Gestures Combined
                </CardTitle>
                <CardDescription>
                    Try any gesture: swipe, pinch, or long press
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div
                    ref={ref}
                    className={cn(
                        "relative h-48 rounded-lg border-2 border-dashed border-muted-foreground/25",
                        "flex items-center justify-center",
                        "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
                        "touch-pan-y select-none cursor-move",
                        "transition-all duration-200"
                    )}
                >
                    <div className="text-center space-y-2">
                        <Hand className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm font-medium">Try Any Gesture</p>
                        {lastGesture && (
                            <Badge variant="default" className="text-base px-4 py-2">
                                {lastGesture}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
