"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Line,
    LineChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Brush,
} from "recharts";
import { cn } from "@/lib/utils/common";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig,
} from "@/components/ui/chart";

// ============================================================================
// Types
// ============================================================================

export interface AnimatedChartData {
    [key: string]: string | number;
}

export interface AnimatedChartProps {
    data: AnimatedChartData[];
    type?: "line" | "bar" | "area";
    dataKey: string;
    xAxisKey: string;
    config: ChartConfig;
    gradient?: boolean;
    interactive?: boolean;
    animated?: boolean;
    height?: number;
    className?: string;
    showGrid?: boolean;
    showLegend?: boolean;
    showBrush?: boolean;
    colors?: {
        primary?: string;
        secondary?: string;
        gradient?: {
            start: string;
            end: string;
        };
    };
    onDataPointClick?: (data: AnimatedChartData) => void;
}

// ============================================================================
// Custom Animated Tooltip
// ============================================================================

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
    config: ChartConfig;
}

const CustomAnimatedTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
    config,
}) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                }}
                className={cn(
                    "rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl",
                    "px-4 py-3 shadow-2xl shadow-primary/10",
                    "min-w-[180px]"
                )}
            >
                <div className="space-y-2">
                    {label && (
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                    )}
                    {payload.map((entry, index) => {
                        const itemConfig = config[entry.dataKey];
                        return (
                            <motion.div
                                key={`tooltip-item-${index}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{
                                            backgroundColor: entry.color,
                                            boxShadow: `0 0 8px ${entry.color}40`,
                                        }}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {itemConfig?.label || entry.name}
                                    </span>
                                </div>
                                <span className="text-sm font-bold tabular-nums text-foreground">
                                    {typeof entry.value === "number"
                                        ? entry.value.toLocaleString()
                                        : entry.value}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

// ============================================================================
// Custom Animated Dot
// ============================================================================

interface AnimatedDotProps {
    cx?: number;
    cy?: number;
    payload?: any;
    value?: number;
    fill?: string;
}

const AnimatedDot: React.FC<AnimatedDotProps> = ({ cx, cy, fill }) => {
    if (cx === undefined || cy === undefined) return null;

    return (
        <motion.circle
            cx={cx}
            cy={cy}
            r={4}
            fill={fill}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.5, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
            }}
            style={{
                filter: `drop-shadow(0 0 6px ${fill}80)`,
            }}
        />
    );
};

// ============================================================================
// Main Animated Chart Component
// ============================================================================

export const AnimatedChart = React.forwardRef<
    HTMLDivElement,
    AnimatedChartProps
>(
    (
        {
            data,
            type = "area",
            dataKey,
            xAxisKey,
            config,
            gradient = true,
            interactive = true,
            animated = true,
            height = 300,
            className,
            showGrid = true,
            showLegend = false,
            showBrush = false,
            colors = {
                primary: "hsl(var(--primary))",
                secondary: "hsl(var(--accent-start))",
                gradient: {
                    start: "hsl(var(--primary))",
                    end: "hsl(var(--accent-start))",
                },
            },
            onDataPointClick,
        },
        ref
    ) => {
        const [isHovered, setIsHovered] = React.useState(false);
        const [animationComplete, setAnimationComplete] = React.useState(false);

        // Generate unique gradient ID
        const gradientId = React.useId().replace(/:/g, "");

        // Animation variants for container
        const containerVariants = {
            hidden: { opacity: 0, y: 20 },
            visible: {
                opacity: 1,
                y: 0,
                transition: {
                    duration: 0.5,
                    ease: "easeOut",
                },
            },
        };

        React.useEffect(() => {
            // Mark animation as complete after initial render
            const timer = setTimeout(() => setAnimationComplete(true), 1000);
            return () => clearTimeout(timer);
        }, []);

        const chartConfig: ChartConfig = {
            ...config,
            [dataKey]: {
                label: config[dataKey]?.label || dataKey,
                color: colors.primary,
            },
        };

        const renderChart = () => {
            const commonProps = {
                data,
                margin: { top: 10, right: 10, left: 0, bottom: 0 },
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false),
            };

            const commonAxisProps = {
                stroke: "hsl(var(--muted-foreground))",
                fontSize: 12,
                tickLine: false,
                axisLine: false,
            };

            const animationProps = animated
                ? {
                    animationDuration: 1000,
                    animationEasing: "ease-out" as const,
                    isAnimationActive: !animationComplete,
                }
                : {
                    isAnimationActive: false,
                };

            switch (type) {
                case "area":
                    return (
                        <AreaChart {...commonProps}>
                            {gradient && (
                                <defs>
                                    <linearGradient
                                        id={`gradient-${gradientId}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor={colors.gradient?.start || colors.primary}
                                            stopOpacity={0.8}
                                        />
                                        <stop
                                            offset="50%"
                                            stopColor={colors.gradient?.end || colors.secondary}
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={colors.gradient?.end || colors.secondary}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                            )}
                            {showGrid && (
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                    opacity={0.3}
                                    vertical={false}
                                />
                            )}
                            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
                            <YAxis {...commonAxisProps} />
                            {interactive && (
                                <Tooltip
                                    content={<CustomAnimatedTooltip config={chartConfig} />}
                                    cursor={{
                                        stroke: colors.primary,
                                        strokeWidth: 2,
                                        strokeDasharray: "5 5",
                                    }}
                                />
                            )}
                            {showLegend && <Legend />}
                            {showBrush && (
                                <Brush
                                    dataKey={xAxisKey}
                                    height={30}
                                    stroke={colors.primary}
                                    fill="hsl(var(--muted))"
                                />
                            )}
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={colors.primary}
                                strokeWidth={3}
                                fill={
                                    gradient ? `url(#gradient-${gradientId})` : colors.primary
                                }
                                dot={
                                    interactive ? <AnimatedDot fill={colors.primary} /> : false
                                }
                                activeDot={
                                    interactive
                                        ? {
                                            r: 6,
                                            fill: colors.primary,
                                            stroke: "hsl(var(--background))",
                                            strokeWidth: 2,
                                        }
                                        : false
                                }
                                {...animationProps}
                            />
                        </AreaChart>
                    );

                case "line":
                    return (
                        <LineChart {...commonProps}>
                            {showGrid && (
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                    opacity={0.3}
                                    vertical={false}
                                />
                            )}
                            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
                            <YAxis {...commonAxisProps} />
                            {interactive && (
                                <Tooltip
                                    content={<CustomAnimatedTooltip config={chartConfig} />}
                                    cursor={{
                                        stroke: colors.primary,
                                        strokeWidth: 2,
                                        strokeDasharray: "5 5",
                                    }}
                                />
                            )}
                            {showLegend && <Legend />}
                            {showBrush && (
                                <Brush
                                    dataKey={xAxisKey}
                                    height={30}
                                    stroke={colors.primary}
                                    fill="hsl(var(--muted))"
                                />
                            )}
                            <Line
                                type="monotone"
                                dataKey={dataKey}
                                stroke={colors.primary}
                                strokeWidth={3}
                                dot={
                                    interactive ? <AnimatedDot fill={colors.primary} /> : false
                                }
                                activeDot={
                                    interactive
                                        ? {
                                            r: 6,
                                            fill: colors.primary,
                                            stroke: "hsl(var(--background))",
                                            strokeWidth: 2,
                                        }
                                        : false
                                }
                                {...animationProps}
                            />
                        </LineChart>
                    );

                case "bar":
                    return (
                        <BarChart {...commonProps}>
                            {gradient && (
                                <defs>
                                    <linearGradient
                                        id={`gradient-${gradientId}`}
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor={colors.gradient?.start || colors.primary}
                                            stopOpacity={0.9}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={colors.gradient?.end || colors.secondary}
                                            stopOpacity={0.7}
                                        />
                                    </linearGradient>
                                </defs>
                            )}
                            {showGrid && (
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="hsl(var(--border))"
                                    opacity={0.3}
                                    vertical={false}
                                />
                            )}
                            <XAxis dataKey={xAxisKey} {...commonAxisProps} />
                            <YAxis {...commonAxisProps} />
                            {interactive && (
                                <Tooltip
                                    content={<CustomAnimatedTooltip config={chartConfig} />}
                                    cursor={{
                                        fill: "hsl(var(--muted))",
                                        opacity: 0.3,
                                    }}
                                />
                            )}
                            {showLegend && <Legend />}
                            {showBrush && (
                                <Brush
                                    dataKey={xAxisKey}
                                    height={30}
                                    stroke={colors.primary}
                                    fill="hsl(var(--muted))"
                                />
                            )}
                            <Bar
                                dataKey={dataKey}
                                fill={
                                    gradient ? `url(#gradient-${gradientId})` : colors.primary
                                }
                                radius={[8, 8, 0, 0]}
                                {...animationProps}
                            />
                        </BarChart>
                    );

                default:
                    return null;
            }
        };

        return (
            <motion.div
                ref={ref}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={cn("relative w-full", className)}
                style={{ height }}
            >
                {/* Gradient background effect */}
                {gradient && isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/5 to-accent-start/5 blur-xl"
                    />
                )}

                <ResponsiveContainer width="100%" height="100%">
                    {renderChart() || <div />}
                </ResponsiveContainer>
            </motion.div>
        );
    }
);

AnimatedChart.displayName = "AnimatedChart";

// ============================================================================
// Sparkline Component (Compact inline chart)
// ============================================================================

export interface SparklineProps {
    data: number[];
    color?: string;
    height?: number;
    className?: string;
    showTooltip?: boolean;
    gradient?: boolean;
}

export const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
    (
        {
            data,
            color = "hsl(var(--primary))",
            height = 40,
            className,
            showTooltip = true,
            gradient = true,
        },
        ref
    ) => {
        const gradientId = React.useId().replace(/:/g, "");
        const chartData = data.map((value, index) => ({ index, value }));

        return (
            <div
                ref={ref}
                className={cn("w-full", className)}
                style={{ height }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 2, right: 2, left: 2, bottom: 2 }}
                    >
                        {gradient && (
                            <defs>
                                <linearGradient
                                    id={`sparkline-${gradientId}`}
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="5%" stopColor={color} stopOpacity={0.6} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                        )}
                        {showTooltip && (
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload || payload.length === 0) return null;
                                    return (
                                        <div className="rounded-lg border bg-background px-2 py-1 text-xs shadow-lg">
                                            <span className="font-mono font-semibold">
                                                {payload[0].value?.toLocaleString()}
                                            </span>
                                        </div>
                                    );
                                }}
                                cursor={false}
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            fill={gradient ? `url(#sparkline-${gradientId})` : color}
                            dot={false}
                            isAnimationActive={true}
                            animationDuration={800}
                            animationEasing="ease-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    }
);

Sparkline.displayName = "Sparkline";
