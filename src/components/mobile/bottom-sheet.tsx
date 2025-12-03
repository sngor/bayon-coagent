"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/common"
import { triggerHapticFeedback } from "@/lib/mobile-optimization"

interface BottomSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
    title?: string
    description?: string
    snapPoints?: number[] // Percentage heights for snap positions
    defaultSnapPoint?: number
    className?: string
}

/**
 * Mobile-optimized bottom sheet component
 * 
 * Features:
 * - Swipe to dismiss
 * - Snap points for different heights
 * - Touch-optimized drag handle
 * - Haptic feedback on interactions
 * - One-handed operation friendly
 * 
 * Requirements: 4.1, 5.1, 8.3
 */
export function BottomSheet({
    open,
    onOpenChange,
    children,
    title,
    description,
    snapPoints = [90, 50],
    defaultSnapPoint = 0,
    className,
}: BottomSheetProps) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [currentSnapPoint, setCurrentSnapPoint] = React.useState(defaultSnapPoint)
    const [dragStartY, setDragStartY] = React.useState(0)
    const [dragCurrentY, setDragCurrentY] = React.useState(0)
    const sheetRef = React.useRef<HTMLDivElement>(null)

    const currentHeight = snapPoints[currentSnapPoint]

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true)
        setDragStartY(e.touches[0].clientY)
        setDragCurrentY(e.touches[0].clientY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        setDragCurrentY(e.touches[0].clientY)
    }

    const handleTouchEnd = () => {
        if (!isDragging) return
        setIsDragging(false)

        const dragDistance = dragCurrentY - dragStartY
        const threshold = 50 // Minimum drag distance to trigger action

        if (dragDistance > threshold) {
            // Dragged down
            if (currentSnapPoint < snapPoints.length - 1) {
                // Snap to next lower point
                setCurrentSnapPoint(currentSnapPoint + 1)
                triggerHapticFeedback(10)
            } else {
                // Close if at lowest snap point
                onOpenChange(false)
                triggerHapticFeedback([10, 50, 10])
            }
        } else if (dragDistance < -threshold) {
            // Dragged up
            if (currentSnapPoint > 0) {
                setCurrentSnapPoint(currentSnapPoint - 1)
                triggerHapticFeedback(10)
            }
        }

        setDragStartY(0)
        setDragCurrentY(0)
    }

    const handleClose = () => {
        onOpenChange(false)
        triggerHapticFeedback(10)
    }

    if (!open) return null

    const dragOffset = isDragging ? Math.max(0, dragCurrentY - dragStartY) : 0

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                    open ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={handleClose}
            />

            {/* Bottom Sheet */}
            <div
                ref={sheetRef}
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out",
                    className
                )}
                style={{
                    height: `${currentHeight}vh`,
                    transform: `translateY(${dragOffset}px)`,
                }}
            >
                {/* Drag Handle */}
                <div
                    className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                </div>

                {/* Header */}
                {(title || description) && (
                    <div className="px-6 pb-4 border-b">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {title && (
                                    <h2 className="text-xl font-semibold text-foreground">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleClose}
                                className="ml-4 p-2 rounded-full hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: `calc(${currentHeight}vh - 120px)` }}>
                    {children}
                </div>
            </div>
        </>
    )
}

export function BottomSheetTrigger({
    children,
    onClick,
    className,
}: {
    children: React.ReactNode
    onClick: () => void
    className?: string
}) {
    const handleClick = () => {
        triggerHapticFeedback(10)
        onClick()
    }

    return (
        <button
            onClick={handleClick}
            className={cn("touch-manipulation", className)}
        >
            {children}
        </button>
    )
}
