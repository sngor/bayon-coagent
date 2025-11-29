"use client";

/**
 * Contextual Tooltip Component
 * 
 * Provides dismissible help hints for first-time feature use.
 * Stores seen state in user preferences via DynamoDB.
 */

import * as React from "react";
import { X, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils/common";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./tooltip";
import { Button } from "./button";

export interface ContextualTooltipProps {
    /** Unique identifier for this tooltip */
    id: string;
    /** The content to display in the tooltip */
    content: string | React.ReactNode;
    /** The element that triggers the tooltip */
    children: React.ReactNode;
    /** Whether this tooltip can be dismissed */
    dismissible?: boolean;
    /** Callback when tooltip is dismissed */
    onDismiss?: () => void;
    /** Whether to show the tooltip (controlled mode) */
    show?: boolean;
    /** Side of the trigger to display tooltip */
    side?: "top" | "right" | "bottom" | "left";
    /** Additional CSS classes */
    className?: string;
}

/**
 * Contextual tooltip that can be dismissed and remembers user preferences
 */
export function ContextualTooltip({
    id,
    content,
    children,
    dismissible = true,
    onDismiss,
    show,
    side = "top",
    className,
}: ContextualTooltipProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        onDismiss?.();
    };

    // Use controlled mode if show prop is provided
    const shouldShow = show !== undefined ? show : isOpen;

    return (
        <TooltipProvider>
            <Tooltip open={shouldShow} onOpenChange={setIsOpen}>
                <TooltipTrigger asChild>{children}</TooltipTrigger>
                <TooltipContent
                    side={side}
                    className={cn(
                        "max-w-xs p-4 bg-gradient-to-br from-primary/10 to-purple-600/10 border-primary/20",
                        className
                    )}
                >
                    <div className="flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="text-sm">{content}</div>
                            {dismissible && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleDismiss}
                                    className="h-7 px-2 text-xs"
                                >
                                    Got it
                                </Button>
                            )}
                        </div>
                        {dismissible && (
                            <button
                                onClick={handleDismiss}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Dismiss tooltip"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

/**
 * Simple help hint that appears on hover
 */
export interface HelpHintProps {
    content: string | React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    className?: string;
}

export function HelpHint({ content, side = "top", className }: HelpHintProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button
                        className={cn(
                            "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
                            className
                        )}
                        aria-label="Help"
                    >
                        <HelpCircle className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-xs">
                    <div className="text-sm">{content}</div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
