"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { cn } from "@/lib/utils/common"
import { triggerHapticFeedback } from "@/lib/mobile-optimization"
import { Card } from "@/components/ui/card"

interface SwipeableCardProps {
    children: React.ReactNode
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onSwipeUp?: () => void
    onSwipeDown?: () => void
    className?: string
    swipeThreshold?: number
    enableHaptics?: boolean
}

/**
 * Swipeable card component for mobile interfaces
 * 
 * Features:
 * - Swipe gestures in all directions
 * - Visual feedback during swipe
 * - Haptic feedback on swipe actions
 * - Smooth animations
 * - Touch-optimized
 * 
 * Requirements: 5.2 (swipeable photo galleries)
 */
export function SwipeableCard({
    children,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    className,
    swipeThreshold = 100,
    enableHaptics = true,
}: SwipeableCardProps) {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    // Visual feedback based on swipe direction
    const rotateZ = useTransform(x, [-200, 0, 200], [-10, 0, 10])
    const opacity = useTransform(
        x,
        [-200, -swipeThreshold, 0, swipeThreshold, 200],
        [0.5, 1, 1, 1, 0.5]
    )

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const { offset, velocity } = info

        // Check if swipe threshold is met
        const swipeVelocityThreshold = 500
        const shouldSwipe =
            Math.abs(offset.x) > swipeThreshold ||
            Math.abs(offset.y) > swipeThreshold ||
            Math.abs(velocity.x) > swipeVelocityThreshold ||
            Math.abs(velocity.y) > swipeVelocityThreshold

        if (!shouldSwipe) {
            return
        }

        // Determine swipe direction
        const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y)

        if (isHorizontal) {
            if (offset.x > 0 && onSwipeRight) {
                if (enableHaptics) triggerHapticFeedback(10)
                onSwipeRight()
            } else if (offset.x < 0 && onSwipeLeft) {
                if (enableHaptics) triggerHapticFeedback(10)
                onSwipeLeft()
            }
        } else {
            if (offset.y > 0 && onSwipeDown) {
                if (enableHaptics) triggerHapticFeedback(10)
                onSwipeDown()
            } else if (offset.y < 0 && onSwipeUp) {
                if (enableHaptics) triggerHapticFeedback(10)
                onSwipeUp()
            }
        }
    }

    return (
        <motion.div
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            style={{
                x,
                y,
                rotateZ,
                opacity,
            }}
            className={cn("touch-manipulation cursor-grab active:cursor-grabbing", className)}
        >
            {children}
        </motion.div>
    )
}

interface SwipeableCardStackProps {
    cards: React.ReactNode[]
    onCardSwiped?: (index: number, direction: "left" | "right" | "up" | "down") => void
    className?: string
}

/**
 * Stack of swipeable cards with Tinder-like behavior
 * 
 * Requirements: 5.2 (swipeable comparable galleries)
 */
export function SwipeableCardStack({
    cards,
    onCardSwiped,
    className,
}: SwipeableCardStackProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [direction, setDirection] = React.useState<"left" | "right" | "up" | "down" | null>(null)

    const handleSwipe = (dir: "left" | "right" | "up" | "down") => {
        setDirection(dir)
        onCardSwiped?.(currentIndex, dir)

        // Move to next card after animation
        setTimeout(() => {
            setCurrentIndex((prev) => Math.min(prev + 1, cards.length - 1))
            setDirection(null)
        }, 300)
    }

    if (currentIndex >= cards.length) {
        return (
            <div className={cn("flex items-center justify-center p-8 text-center", className)}>
                <p className="text-muted-foreground">No more cards</p>
            </div>
        )
    }

    return (
        <div className={cn("relative", className)}>
            {/* Show current and next card for depth effect */}
            {cards.slice(currentIndex, currentIndex + 2).map((card, index) => (
                <motion.div
                    key={currentIndex + index}
                    className="absolute inset-0"
                    initial={index === 0 ? { scale: 1, y: 0 } : { scale: 0.95, y: 10 }}
                    animate={
                        index === 0 && direction
                            ? {
                                x: direction === "left" ? -300 : direction === "right" ? 300 : 0,
                                y: direction === "up" ? -300 : direction === "down" ? 300 : 0,
                                opacity: 0,
                                transition: { duration: 0.3 },
                            }
                            : index === 0
                                ? { scale: 1, y: 0 }
                                : { scale: 0.95, y: 10 }
                    }
                    style={{ zIndex: cards.length - index }}
                >
                    {index === 0 ? (
                        <SwipeableCard
                            onSwipeLeft={() => handleSwipe("left")}
                            onSwipeRight={() => handleSwipe("right")}
                            onSwipeUp={() => handleSwipe("up")}
                            onSwipeDown={() => handleSwipe("down")}
                        >
                            {card}
                        </SwipeableCard>
                    ) : (
                        card
                    )}
                </motion.div>
            ))}
        </div>
    )
}

interface SwipeableGalleryProps {
    images: string[]
    onImageChange?: (index: number) => void
    className?: string
}

/**
 * Swipeable image gallery for property photos
 * 
 * Requirements: 5.2 (swipeable photo galleries)
 */
export function SwipeableGallery({
    images,
    onImageChange,
    className,
}: SwipeableGalleryProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0)

    const handleSwipeLeft = () => {
        const newIndex = Math.min(currentIndex + 1, images.length - 1)
        setCurrentIndex(newIndex)
        onImageChange?.(newIndex)
    }

    const handleSwipeRight = () => {
        const newIndex = Math.max(currentIndex - 1, 0)
        setCurrentIndex(newIndex)
        onImageChange?.(newIndex)
    }

    return (
        <div className={cn("relative overflow-hidden rounded-lg", className)}>
            <SwipeableCard
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
            >
                <Card className="overflow-hidden">
                    <img
                        src={images[currentIndex]}
                        alt={`Property image ${currentIndex + 1}`}
                        className="w-full h-full object-cover"
                    />
                </Card>
            </SwipeableCard>

            {/* Indicators */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setCurrentIndex(index)
                            onImageChange?.(index)
                            triggerHapticFeedback(10)
                        }}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all touch-manipulation",
                            index === currentIndex
                                ? "bg-white w-6"
                                : "bg-white/50"
                        )}
                        aria-label={`Go to image ${index + 1}`}
                    />
                ))}
            </div>

            {/* Counter */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    )
}
