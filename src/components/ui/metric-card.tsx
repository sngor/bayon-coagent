"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedNumber, AnimatedDecimal } from "./animated-number";
import { Sparkline } from "./sparkline";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface MetricCardProps {
    /**
     * The main metric value to display
     */
    value: number;
    /**
     * Label for the metric
     */
    label: string;
    /**
     * Optional icon to display
     */
    icon?: React.ReactNode;
    /**
     * Historical data for sparkline
     */
    trendData?: number[];
    /**
     * Change percentage (e.g., 12.5 for +12.5%)
     */
    changePercent?: number;
    /**
     * Number of decimal places for the value
     */
    decimals?: number;
    /**
     * Format type for the value
     */
    format?: "number" | "currency" | "percentage";
    /**
     * Prefix for the value (e.g., "+")
     */
    prefix?: string;
    /**
     * Suffix for the value (e.g., "k")
     */
    suffix?: string;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Callback when card is clicked
     */
    onClick?: () => void;
    /**
     * Show sparkline
     */
    showSparkline?: boolean;
    /**
     * Show trend indicator
     */
    showTrend?: boolean;
    /**
     * Color variant
     */
    variant?: "default" | "success" | "warning" | "error" | "primary";
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determine trend direction from change percentage
 */
function getTrendDirection(
    changePercent?: number
): "up" | "down" | "neutral" {
    if (changePercent === undefined || changePercent === null) return "neutral";
    if (Math.abs(changePercent) < 0.1) return "neutral";
    return changePercent > 0 ? "up" : "down";
}

/**
 * Get color classes based on variant and trend
 */
function getColorClasses(
    variant: MetricCardProps["variant"],
    trend: "up" | "down" | "neutral"
) {
    if (variant === "success") {
        return {
            gradient: "from-success/5 via-success/3 to-transparent",
            hoverGradient: "hover:from-success/10 hover:via-success/5",
            border: "hover:border-success/30",
            text: "text-success",
            glow: "hover:shadow-success/20",
        };
    }

    if (variant === "warning") {
        return {
            gradient: "from-warning/5 via-warning/3 to-transparent",
            hoverGradient: "hover:from-warning/10 hover:via-warning/5",
            border: "hover:border-warning/30",
            text: "text-warning",
            glow: "hover:shadow-warning/20",
        };
    }

    if (variant === "error") {
        return {
            gradient: "from-error/5 via-error/3 to-transparent",
            hoverGradient: "hover:from-error/10 hover:via-error/5",
            border: "hover:border-error/30",
            text: "text-error",
            glow: "hover:shadow-error/20",
        };
    }

    // Default and primary variants with trend-based colors
    if (trend === "up") {
        return {
            gradient: "from-success/5 via-success/3 to-transparent",
            hoverGradient: "hover:from-success/10 hover:via-success/5",
            border: "hover:border-success/30",
            text: "text-primary",
            glow: "hover:shadow-success/20",
        };
    }

    if (trend === "down") {
        return {
            gradient: "from-error/5 via-error/3 to-transparent",
            hoverGradient: "hover:from-error/10 hover:via-error/5",
            border: "hover:border-error/30",
            text: "text-primary",
            glow: "hover:shadow-error/20",
        };
    }

    // Neutral or default
    return {
        gradient: "from-primary/5 via-primary/3 to-transparent",
        hoverGradient: "hover:from-primary/10 hover:via-primary/5",
        border: "hover:border-primary/30",
        text: "text-primary",
        glow: "hover:shadow-primary/20",
    };
}

// ============================================================================
// Trend Indicator Component
// ============================================================================

interface TrendIndicatorProps {
    changePercent: number;
    trend: "up" | "down" | "neutral";
    animated?: boolean;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
    changePercent,
    trend,
    animated = true,
}) => {
    const Icon =
        trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

    const colorClass =
        trend === "up"
            ? "text-success"
            : trend === "down"
                ? "text-error"
                : "text-muted-foreground";

    const Component = animated ? motion.div : "div";
    const animationProps = animated
        ? {
            initial: { opacity: 0, scale: 0.8, x: -10 },
            animate: { opacity: 1, scale: 1, x: 0 },
            transition: {
                delay: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 20,
            },
        }
        : {};

    return (
        <Component
            {...animationProps}
            className={cn(
                "flex items-center gap-1 text-sm font-semibold tabular-nums",
                colorClass
            )}
        >
            <Icon className="h-4 w-4" />
            <span>
                {changePercent > 0 ? "+" : ""}
                {changePercent.toFixed(1)}%
            </span>
        </Component>
    );
};

// ============================================================================
// Main MetricCard Component
// ============================================================================

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
    (
        {
            value,
            label,
            icon,
            trendData,
            changePercent,
            decimals = 0,
            format = "number",
            prefix,
            suffix,
            className,
            onClick,
            showSparkline = true,
            showTrend = true,
            variant = "default",
        },
        ref
    ) => {
        const trend = getTrendDirection(changePercent);
        const colors = getColorClasses(variant, trend);

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{
                    scale: 1.02,
                    y: -4,
                    transition: { duration: 0.2 },
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={cn(
                    "group relative flex flex-col rounded-xl border-2 p-4 md:p-6",
                    "bg-gradient-to-br",
                    colors.gradient,
                    colors.hoverGradient,
                    "hover:shadow-lg",
                    colors.glow,
                    "hover:scale-[1.02]",
                    colors.border,
                    "transition-all duration-300",
                    onClick && "cursor-pointer",
                    className
                )}
                onClick={onClick}
            >
                {/* Animated glow effect on hover */}
                <motion.div
                    className="absolute inset-0 -z-10 rounded-xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(circle at center, ${variant === "success"
                            ? "hsl(var(--success))"
                            : variant === "warning"
                                ? "hsl(var(--warning))"
                                : variant === "error"
                                    ? "hsl(var(--error))"
                                    : "hsl(var(--primary))"
                            }15, transparent 70%)`,
                    }}
                />

                {/* Header with icon and trend */}
                <div className="mb-3 flex items-start justify-between">
                    {icon && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className={cn(
                                "rounded-lg p-2 transition-transform duration-300 group-hover:scale-110",
                                colors.text
                            )}
                        >
                            {icon}
                        </motion.div>
                    )}
                    {showTrend && changePercent !== undefined && (
                        <TrendIndicator changePercent={changePercent} trend={trend} />
                    )}
                </div>

                {/* Main value */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        "mb-2 text-4xl md:text-5xl font-bold font-headline transition-transform duration-300 group-hover:scale-110",
                        colors.text
                    )}
                >
                    {decimals > 0 ? (
                        <AnimatedDecimal
                            value={value}
                            decimals={decimals}
                            duration={1200}
                            prefix={prefix}
                            suffix={suffix}
                        />
                    ) : (
                        <AnimatedNumber
                            value={value}
                            duration={1200}
                            prefix={prefix}
                            suffix={suffix}
                            format={format}
                        />
                    )}
                </motion.div>

                {/* Label */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs md:text-sm font-medium text-muted-foreground"
                >
                    {label}
                </motion.p>

                {/* Sparkline */}
                {showSparkline && trendData && trendData.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scaleX: 0.8 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mt-4 pt-4 border-t border-border/50"
                    >
                        <Sparkline
                            data={trendData}
                            height={32}
                            showTooltip={true}
                            gradient={true}
                            animated={true}
                            strokeWidth={2}
                            smooth={true}
                        />
                    </motion.div>
                )}
            </motion.div>
        );
    }
);

MetricCard.displayName = "MetricCard";

// ============================================================================
// Export
// ============================================================================

export default MetricCard;
