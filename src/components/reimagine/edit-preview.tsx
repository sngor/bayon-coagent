'use client';

/**
 * Edit Preview Component for Reimagine Image Toolkit
 * 
 * Features:
 * - Display original and edited images side-by-side
 * - Implement slider for before/after comparison
 * - Provide accept, regenerate, and cancel buttons
 * - Handle parameter adjustment for regeneration
 * 
 * Requirements: 12.1, 12.2, 12.4
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    X,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { OptimizedImage } from './optimized-image';
import { HelpTooltip, HelpText } from './help-tooltip';

interface EditPreviewProps {
    originalUrl: string;
    editedUrl: string;
    editType?: string;
    onAccept: () => void;
    onRegenerate: () => void;
    onCancel: () => void;
    isLoading?: boolean;
    className?: string;
}

export function EditPreview({
    originalUrl,
    editedUrl,
    editType,
    onAccept,
    onRegenerate,
    onCancel,
    isLoading = false,
    className,
}: EditPreviewProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Update container width on mount and resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Handle slider change
    const handleSliderChange = useCallback((value: number[]) => {
        setSliderPosition(value[0]);
    }, []);

    // Handle mouse move for dragging
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!isDragging || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            setSliderPosition(Math.max(0, Math.min(100, percentage)));
        },
        [isDragging]
    );

    // Handle touch move for mobile
    const handleTouchMove = useCallback(
        (e: React.TouchEvent<HTMLDivElement>) => {
            if (!isDragging || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            setSliderPosition(Math.max(0, Math.min(100, percentage)));
        },
        [isDragging]
    );

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen((prev) => !prev);
    }, []);

    // Format edit type for display
    const formatEditType = (type?: string) => {
        if (!type) return 'Edit';
        return type
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={cn('w-full', className)}
            >
                <Card className={cn(isFullscreen && 'fixed inset-4 z-50 flex flex-col')}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                Preview: {formatEditType(editType)}
                                <HelpTooltip
                                    content="Use the slider to compare before and after. Drag the handle or use the slider control below for precise comparison."
                                    side="right"
                                />
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={toggleFullscreen}
                                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                                >
                                    <Maximize2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className={cn('space-y-4', isFullscreen && 'flex-1 overflow-auto')}>
                        {/* Before/After Comparison */}
                        <div
                            ref={containerRef}
                            className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden cursor-col-resize select-none"
                            onMouseDown={() => setIsDragging(true)}
                            onMouseUp={() => setIsDragging(false)}
                            onMouseLeave={() => setIsDragging(false)}
                            onMouseMove={handleMouseMove}
                            onTouchStart={() => setIsDragging(true)}
                            onTouchEnd={() => setIsDragging(false)}
                            onTouchMove={handleTouchMove}
                        >
                            {/* Edited Image (Background) */}
                            <div className="absolute inset-0">
                                <img
                                    src={editedUrl}
                                    alt="Edited version"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                                    After
                                </div>
                            </div>

                            {/* Original Image (Clipped) */}
                            <div
                                className="absolute inset-0 overflow-hidden"
                                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                            >
                                {originalUrl && (
                                    <img
                                        src={originalUrl}
                                        alt="Original version"
                                        className="w-full h-full object-contain"
                                    />
                                )}
                                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
                                    Before
                                </div>
                            </div>

                            {/* Slider Handle */}
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize"
                                style={{ left: `${sliderPosition}%` }}
                            >
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
                                    <div className="flex items-center gap-1">
                                        <ChevronLeft className="h-4 w-4 text-gray-700" />
                                        <ChevronRight className="h-4 w-4 text-gray-700" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Slider Control */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>Before</span>
                                <span>After</span>
                            </div>
                            <Slider
                                value={[sliderPosition]}
                                onValueChange={handleSliderChange}
                                min={0}
                                max={100}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        {/* Side-by-Side View (Desktop) with optimized images */}
                        <div className="hidden lg:grid lg:grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Original</h3>
                                <div className="relative aspect-video rounded-lg overflow-hidden">
                                    {originalUrl ? (
                                        <OptimizedImage
                                            src={originalUrl}
                                            alt="Original"
                                            fill
                                            sizes="(min-width: 1024px) 50vw, 100vw"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted">
                                            <p className="text-muted-foreground">Original image not available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium">Edited</h3>
                                <div className="relative aspect-video rounded-lg overflow-hidden">
                                    <OptimizedImage
                                        src={editedUrl}
                                        alt="Edited"
                                        fill
                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                            <p className="font-medium mb-1">How to use:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Drag the slider or use the control below to compare before/after</li>
                                <li><strong>Accept:</strong> Save this edit to your history and make it available for download</li>
                                <li><strong>Regenerate:</strong> Adjust parameters and try again (no additional cost)</li>
                                <li><strong>Cancel:</strong> Discard this edit without saving</li>
                            </ul>
                        </div>
                        <HelpText className="text-center">
                            💡 <strong>Tip:</strong> After accepting, you can apply additional edits to create a chain (e.g., staging → enhancement → day-to-dusk)
                        </HelpText>
                    </CardContent>

                    <CardFooter className="flex flex-col sm:flex-row gap-3">
                        {/* Cancel Button */}
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>

                        {/* Regenerate Button */}
                        <Button
                            variant="secondary"
                            onClick={onRegenerate}
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                        </Button>

                        {/* Accept Button */}
                        <Button
                            variant="default"
                            onClick={onAccept}
                            disabled={isLoading}
                            className="w-full sm:w-auto sm:ml-auto"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Accept & Save
                        </Button>
                    </CardFooter>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
