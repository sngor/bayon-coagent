"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface SparklineProps {
    /**
     * Array of numeric values to display
     */
    data: number[];
    /**
     * Primary color for the line and gradient
     */
    color?: string;
    /**
     * Height of the sparkline in pixels
     */
    height?: number;
    /**
     * Width of the sparkline (defaults to 100%)
     */
    width?: string | number;
    /**
     * Additional CSS classes
     */
    className?: string;
    /**
     * Show tooltip on hover
     */
    showTooltip?: boolean;
    /**
     * Enable gradient fill
     */
    gradient?: boolean;
    /**
     * Show trend indicator (up/down/neutral)
     */
    showTrend?: boolean;
    /**
     * Animate the line drawing effect
     */
    animated?: boolean;
    /**
     * Line thickness in pixels
     */
    strokeWidth?: number;
    /**
     * Smooth or sharp line curves
     */
    smooth?: boolean;
    /**
     * Format function for tooltip values
     */
    formatValue?: (value: number) => string;
    /**
     * Callback when sparkline is clicked
     */
    onClick?: () => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate trend direction from data
 */
function calculateTrend(data: number[]): "up" | "down" | "neutral" {
    if (data.length < 2) return "neutral";

    const first = data[0];
    const last = data[data.length - 1];
    const change = last - first;
    const threshold = Math.abs(first * 0.01); // 1% threshold

    if (Math.abs(change) < threshold) return "neutral";
    return change > 0 ? "up" : "down";
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(data: number[]): number {
    if (data.length < 2) return 0;

    const first = data[0];
    const last = data[data.length - 1];

    if (first === 0) return 0;

    return ((last - first) / first) * 100;
}

// ============================================================================
// Animated Tooltip Component
// ============================================================================

interface SparklineTooltipProps {
    active?: boolean;
    payload?: any[];
    formatValue?: (value: number) => string;
}

const SparklineTooltip: React.FC<SparklineTooltipProps> = ({
    active,
    payload,
    formatValue,
}) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const value = payload[0].value;
    const displayValue = formatValue
        ? formatValue(value)
        : value.toLocaleString();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                }}
                className={cn(
                    "rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm",
                    "px-3 py-1.5 shadow-xl shadow-primary/10"
                )}
            >
                <span className="text-xs font-mono font-semibold tabular-nums text-foreground">
                    {displayValue}
                </span>
            </motion.div>
        </AnimatePresence>
    );
};

// ============================================================================
// Trend Indicator Component
// ============================================================================

interface TrendIndicatorProps {
    trend: "up" | "down" | "neutral";
    change: number;
    className?: string;
}

const TrendIndicator: React.FC<TrendIndicatorProps> = ({
    trend,
    change,
    className,
}) => {
    const Icon =
        trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

    const colorClass =
        trend === "up"
            ? "text-green-600 dark:text-green-400"
            : trend === "down"
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            className={cn("flex items-center gap-1", colorClass, className)}
        >
            <Icon className="h-3 w-3" />
            <span className="text-xs font-semibold tabular-nums">
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
            </span>
        </motion.div>
    );
};

// ============================================================================
// Main Sparkline Component
// ============================================================================

export const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
    (
        {
            data,
            color = "hsl(var(--primary))",
            height = 40,
            width = "100%",
            className,
            showTooltip = true,
            gradient = true,
            showTrend = false,
            animated = true,
            strokeWidth = 2,
            smooth = true,
            formatValue,
            onClick,
        },
        ref
    ) => {
        const [isHovered, setIsHovered] = React.useState(false);
        const [animationComplete, setAnimationComplete] = React.useState(false);

        // Generate unique gradient ID
        const gradientId = React.useId().replace(/:/g, "");

        // Transform data for recharts
        const chartData = React.useMemo(
            () => data.map((value, index) => ({ index, value })),
            [data]
        );

        // Calculate trend
        const trend = React.useMemo(() => calculateTrend(data), [data]);
        const percentageChange = React.useMemo(
            () => calculatePercentageChange(data),
            [data]
        );

        // Mark animation as complete after initial render
        React.useEffect(() => {
            if (animated) {
                const timer = setTimeout(() => setAnimationComplete(true), 1000);
                return () => clearTimeout(timer);
            } else {
                setAnimationComplete(true);
            }
        }, [animated]);

        // Determine trend color
        const trendColor = React.useMemo(() => {
            if (trend === "up") return "hsl(142, 71%, 45%)"; // success green
            if (trend === "down") return "hsl(0, 84%, 60%)"; // error red
            return color;
        }, [trend, color]);

        return (
            <div
                ref={ref}
                className={cn(
                    "relative inline-flex items-center gap-2",
                    onClick && "cursor-pointer",
                    className
                )}
                onClick={onClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Sparkline Chart */}
                <motion.div
                    initial={animated ? { opacity: 0, scale: 0.95 } : false}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="relative"
                    style={{ height, width }}
                >
                    {/* Glow effect on hover */}
                    {isHovered && gradient && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 -z-10 rounded-lg blur-xl"
                            style={{
                                background: `radial-gradient(circle, ${trendColor}20 0%, transparent 70%)`,
                            }}
                        />
                    )}

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                        >
                            {/* Gradient Definition */}
                            {gradient && (
                                <defs>
                                    <linearGradient
                                        id={`sparkline-gradient-${gradientId}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor={trendColor}
                                            stopOpacity={0.6}
                                        />
                                        <stop
                                            offset="50%"
                                            stopColor={trendColor}
                                            stopOpacity={0.2}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={trendColor}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                            )}

                            {/* Tooltip */}
                            {showTooltip && (
                                <Tooltip
                                    content={
                                        <SparklineTooltip formatValue={formatValue} />
                                    }
                                    cursor={false}
                                    wrapperStyle={{ zIndex: 1000 }}
                                />
                            )}

                            {/* Area with animated line drawing */}
                            <Area
                                type={smooth ? "monotone" : "linear"}
                                dataKey="value"
                                stroke={trendColor}
                                strokeWidth={strokeWidth}
                                fill={
                                    gradient
                                        ? `url(#sparkline-gradient-${gradientId})`
                                        : trendColor
                                }
                                fillOpacity={gradient ? 1 : 0.2}
                                dot={false}
                                activeDot={
                                    showTooltip
                                        ? {
                                            r: 4,
                                            fill: trendColor,
                                            stroke: "hsl(var(--background))",
                                            strokeWidth: 2,
                                        }
                                        : false
                                }
                                isAnimationActive={animated && !animationComplete}
                                animationDuration={800}
                                animationEasing="ease-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Trend Indicator */}
                {showTrend && (
                    <TrendIndicator trend={trend} change={percentageChange} />
                )}
            </div>
        );
    }
);

Sparkline.displayName = "Sparkline";

// ============================================================================
// Sparkline Card Component (for dashboard usage)
// ============================================================================

export interface SparklineCardProps {
    title: string;
    value: string | number;
    data: number[];
    color?: string;
    formatValue?: (value: number) => string;
    className?: string;
    onClick?: () => void;
}

export const SparklineCard = React.forwardRef<
    HTMLDivElement,
    SparklineCardProps
>(({ title, value, data, color, formatValue, className, onClick }, ref) => {
    const trend = calculateTrend(data);
    const percentageChange = calculatePercentageChange(data);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={cn(
                "rounded-xl border bg-card p-4 shadow-sm transition-all",
                "hover:shadow-md hover:border-primary/20",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                            {title}
                        </p>
                        <p className="text-2xl font-bold tabular-nums tracking-tight">
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>
                    </div>
                    <TrendIndicator trend={trend} change={percentageChange} />
                </div>

                {/* Sparkline */}
                <Sparkline
                    data={data}
                    color={color}
                    height={48}
                    gradient={true}
                    showTooltip={true}
                    animated={true}
                    formatValue={formatValue}
                />
            </div>
        </motion.div>
    );
});

SparklineCard.displayName = "SparklineCard";

// ============================================================================
// Export
// ============================================================================

export default Sparkline;
