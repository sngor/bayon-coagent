"use client";

/**
 * Feature Tooltip Component
 * 
 * A contextual tooltip that automatically manages its visibility based on
 * whether the user has seen it before. Integrates with TooltipProvider
 * to persist seen state.
 */

import * as React from "react";
import { useContextualTooltip } from "@/contexts/tooltip-context";
import { ContextualTooltip, ContextualTooltipProps } from "./contextual-tooltip";

export interface FeatureTooltipProps
    extends Omit<ContextualTooltipProps, "show" | "onDismiss"> {
    /** Unique identifier for this feature tooltip */
    id: string;
    /** The content to display in the tooltip */
    content: string | React.ReactNode;
    /** The element that triggers the tooltip */
    children: React.ReactNode;
    /** Side of the trigger to display tooltip */
    side?: "top" | "right" | "bottom" | "left";
    /** Additional CSS classes */
    className?: string;
    /** Whether to show on first render (default: true) */
    showOnFirstRender?: boolean;
}

/**
 * Feature tooltip that automatically shows for first-time users
 * and remembers when it has been dismissed
 */
export function FeatureTooltip({
    id,
    content,
    children,
    side = "top",
    className,
    showOnFirstRender = true,
    ...props
}: FeatureTooltipProps) {
    const { isVisible, dismiss, isLoading } = useContextualTooltip(id);

    // Don't show anything while loading
    if (isLoading) {
        return <>{children}</>;
    }

    // If tooltip has been seen, just render children
    if (!isVisible) {
        return <>{children}</>;
    }

    return (
        <ContextualTooltip
            id={id}
            content={content}
            show={isVisible}
            onDismiss={dismiss}
            side={side}
            className={className}
            dismissible={true}
            {...props}
        >
            {children}
        </ContextualTooltip>
    );
}

/**
 * Feature tooltip that shows on hover after being dismissed
 * Useful for features that users might want to reference again
 */
export function FeatureTooltipWithHover({
    id,
    content,
    children,
    side = "top",
    className,
    ...props
}: FeatureTooltipProps) {
    const { isVisible, dismiss, isLoading } = useContextualTooltip(id);
    const [showOnHover, setShowOnHover] = React.useState(false);

    // Don't show anything while loading
    if (isLoading) {
        return <>{children}</>;
    }

    // After dismissal, show on hover instead
    const shouldShow = isVisible || showOnHover;

    return (
        <div
            onMouseEnter={() => !isVisible && setShowOnHover(true)}
            onMouseLeave={() => setShowOnHover(false)}
        >
            <ContextualTooltip
                id={id}
                content={content}
                show={shouldShow}
                onDismiss={dismiss}
                side={side}
                className={className}
                dismissible={isVisible} // Only dismissible on first show
                {...props}
            >
                {children}
            </ContextualTooltip>
        </div>
    );
}
