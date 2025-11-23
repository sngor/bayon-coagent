'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Hand,
    Move,
    ZoomIn,
    ZoomOut,
    Clock,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOUCH_FRIENDLY_CLASSES } from '@/lib/mobile-optimization';
import {
    useMobileGestures,
    useSwipeGesture,
    usePinchGesture,
    useLongPressGesture,
    SwipeGesture,
    PinchGesture,
    LongPressGesture
} from '@/hooks/use-gesture-handler';

interface GestureEvent {
    id: string;
    type: 'swipe' | 'pinch' | 'long-press';
    details: string;
    timestamp: number;
}

export default function GestureDemo() {
    const [events, setEvents] = useState<GestureEvent[]>([]);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const addEvent = (type: GestureEvent['type'], details: string) => {
        const event: GestureEvent = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type,
            details,
            timestamp: Date.now(),
        };

        setEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
    };

    const clearEvents = () => {
        setEvents([]);
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    // Combined gesture handling
    const { ref: combinedRef } = useMobileGestures<HTMLDivElement>({
        onSwipeLeft: () => {
            addEvent('swipe', 'Swiped Left');
            setPosition(prev => ({ ...prev, x: prev.x - 20 }));
        },
        onSwipeRight: () => {
            addEvent('swipe', 'Swiped Right');
            setPosition(prev => ({ ...prev, x: prev.x + 20 }));
        },
        onSwipeUp: () => {
            addEvent('swipe', 'Swiped Up');
            setPosition(prev => ({ ...prev, y: prev.y - 20 }));
        },
        onSwipeDown: () => {
            addEvent('swipe', 'Swiped Down');
            setPosition(prev => ({ ...prev, y: prev.y + 20 }));
        },
        onPinchIn: (scaleValue) => {
            addEvent('pinch', `Pinched In (${scaleValue.toFixed(2)}x)`);
            setScale(prev => Math.max(0.5, prev * scaleValue));
        },
        onPinchOut: (scaleValue) => {
            addEvent('pinch', `Pinched Out (${scaleValue.toFixed(2)}x)`);
            setScale(prev => Math.min(3, prev * scaleValue));
        },
        onLongPress: (x, y) => {
            addEvent('long-press', `Long Press at (${Math.round(x)}, ${Math.round(y)})`);
        },
    });

    // Individual gesture handlers for demonstration
    const { ref: swipeRef } = useSwipeGesture<HTMLDivElement>((gesture: SwipeGesture) => {
        addEvent('swipe', `${gesture.direction.toUpperCase()} - ${Math.round(gesture.distance)}px in ${gesture.duration}ms`);
    });

    const { ref: pinchRef } = usePinchGesture<HTMLDivElement>({
        onPinchStart: (gesture: PinchGesture) => {
            addEvent('pinch', `Pinch Started at (${Math.round(gesture.centerX)}, ${Math.round(gesture.centerY)})`);
        },
        onPinch: (gesture: PinchGesture) => {
            addEvent('pinch', `Pinching: ${gesture.scale.toFixed(2)}x scale`);
        },
        onPinchEnd: (gesture: PinchGesture) => {
            addEvent('pinch', `Pinch Ended: Final scale ${gesture.scale.toFixed(2)}x`);
        },
    });

    const { ref: longPressRef } = useLongPressGesture<HTMLDivElement>({
        onLongPressStart: (gesture: LongPressGesture) => {
            addEvent('long-press', `Long Press Started at (${Math.round(gesture.x)}, ${Math.round(gesture.y)})`);
        },
        onLongPress: (gesture: LongPressGesture) => {
            addEvent('long-press', `Long Press: ${gesture.duration}ms duration`);
        },
        onLongPressEnd: (gesture: LongPressGesture) => {
            addEvent('long-press', `Long Press Ended after ${gesture.duration}ms`);
        },
    });

    const getEventIcon = (type: GestureEvent['type']) => {
        switch (type) {
            case 'swipe':
                return <Move className="w-4 h-4" />;
            case 'pinch':
                return <ZoomIn className="w-4 h-4" />;
            case 'long-press':
                return <Clock className="w-4 h-4" />;
            default:
                return <Hand className="w-4 h-4" />;
        }
    };

    const getEventColor = (type: GestureEvent['type']) => {
        switch (type) {
            case 'swipe':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pinch':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'long-press':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 p-4">
            <div className="text-center space-y-2">
                <h1 className="font-headline text-2xl font-bold">Mobile Gesture Demo</h1>
                <p className="text-muted-foreground">
                    Test swipe, pinch, and long-press gestures on the interactive areas below
                </p>
            </div>

            {/* Combined Gesture Area */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Hand className="w-5 h-5" />
                        Combined Gesture Area
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Try swiping, pinching, or long-pressing on this area
                    </p>
                </CardHeader>
                <CardContent>
                    <div
                        ref={combinedRef}
                        className={cn(
                            "relative h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-200",
                            "flex items-center justify-center cursor-pointer select-none",
                            "transition-transform duration-200 ease-out"
                        )}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        } as React.CSSProperties}
                    >
                        <div className="text-center space-y-2">
                            <Hand className="w-12 h-12 mx-auto text-blue-500" />
                            <p className="text-sm font-medium">Interactive Gesture Area</p>
                            <p className="text-xs text-muted-foreground">
                                Scale: {scale.toFixed(2)}x | Position: ({position.x}, {position.y})
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Individual Gesture Areas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Swipe Only */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Move className="w-4 h-4" />
                            Swipe Only
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            ref={swipeRef}
                            className="h-32 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-center cursor-pointer select-none"
                        >
                            <div className="text-center space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                    <ArrowLeft className="w-4 h-4" />
                                    <ArrowUp className="w-4 h-4" />
                                    <ArrowDown className="w-4 h-4" />
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                                <p className="text-xs text-muted-foreground">Swipe here</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pinch Only */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ZoomIn className="w-4 h-4" />
                            Pinch Only
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            ref={pinchRef}
                            className="h-32 bg-green-50 rounded-lg border border-green-200 flex items-center justify-center cursor-pointer select-none"
                        >
                            <div className="text-center space-y-1">
                                <div className="flex items-center justify-center gap-1">
                                    <ZoomOut className="w-4 h-4" />
                                    <ZoomIn className="w-4 h-4" />
                                </div>
                                <p className="text-xs text-muted-foreground">Pinch here</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Long Press Only */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Long Press Only
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            ref={longPressRef}
                            className="h-32 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-center cursor-pointer select-none"
                        >
                            <div className="text-center space-y-1">
                                <Clock className="w-6 h-6 mx-auto" />
                                <p className="text-xs text-muted-foreground">Hold here</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Event Log */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Hand className="w-5 h-5" />
                            Gesture Events
                        </CardTitle>
                        <Button
                            onClick={clearEvents}
                            variant="outline"
                            size="sm"
                            className={TOUCH_FRIENDLY_CLASSES.button}
                        >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Recent gesture events will appear here
                    </p>
                </CardHeader>
                <CardContent>
                    {events.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Hand className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No gestures detected yet</p>
                            <p className="text-sm">Try interacting with the areas above</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border",
                                        getEventColor(event.type)
                                    )}
                                >
                                    {getEventIcon(event.type)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{event.details}</p>
                                        <p className="text-xs opacity-75">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {event.type}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle>How to Test Gestures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-headline font-medium flex items-center gap-2">
                                <Move className="w-4 h-4" />
                                Swipe Gestures
                            </h4>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>• Swipe left, right, up, or down</li>
                                <li>• Minimum 50px distance</li>
                                <li>• Quick motion required</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-headline font-medium flex items-center gap-2">
                                <ZoomIn className="w-4 h-4" />
                                Pinch Gestures
                            </h4>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>• Use two fingers</li>
                                <li>• Pinch in to zoom out</li>
                                <li>• Pinch out to zoom in</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-headline font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Long Press
                            </h4>
                            <ul className="space-y-1 text-muted-foreground">
                                <li>• Hold for 500ms</li>
                                <li>• Don't move finger</li>
                                <li>• Feel haptic feedback</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}