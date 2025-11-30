'use client';

import React from 'react';
import { cn } from '@/lib/utils/common';

export interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    strokeWidth?: number;
    className?: string;
    color?: string;
    fillColor?: string;
    showFill?: boolean;
    showDots?: boolean;
    animate?: boolean;
}

export function Sparkline({
    data,
    width = 100,
    height = 30,
    strokeWidth = 2,
    className,
    color = 'currentColor',
    fillColor,
    showFill = false,
    showDots = false,
    animate = true,
}: SparklineProps) {
    if (data.length === 0) return null;

    const padding = strokeWidth;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Generate points
    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - min) / range) * chartHeight;
        return { x, y };
    });

    // Generate path
    const linePath = points
        .map((point, index) => {
            if (index === 0) return `M ${point.x},${point.y}`;
            return `L ${point.x},${point.y}`;
        })
        .join(' ');

    // Generate fill path
    const fillPath = showFill
        ? `${linePath} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`
        : '';

    return (
        <svg
            width={width}
            height={height}
            className={cn('overflow-visible', className)}
            viewBox={`0 0 ${width} ${height}`}
        >
            {showFill && fillPath && (
                <path
                    d={fillPath}
                    fill={fillColor || color}
                    opacity={0.1}
                    className={animate ? 'animate-in fade-in duration-500' : ''}
                />
            )}
            <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={animate ? 'animate-in fade-in duration-500' : ''}
            />
            {showDots &&
                points.map((point, index) => (
                    <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r={strokeWidth}
                        fill={color}
                        className={animate ? 'animate-in fade-in duration-500' : ''}
                        style={{ animationDelay: `${index * 50}ms` }}
                    />
                ))}
        </svg>
    );
}

export interface SparklineBarProps {
    data: number[];
    width?: number;
    height?: number;
    className?: string;
    color?: string;
    animate?: boolean;
}

export function SparklineBar({
    data,
    width = 100,
    height = 30,
    className,
    color = 'currentColor',
    animate = true,
}: SparklineBarProps) {
    if (data.length === 0) return null;

    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const max = Math.max(...data);
    const barWidth = chartWidth / data.length;
    const gap = barWidth * 0.2;
    const actualBarWidth = barWidth - gap;

    return (
        <svg
            width={width}
            height={height}
            className={cn('overflow-visible', className)}
            viewBox={`0 0 ${width} ${height}`}
        >
            {data.map((value, index) => {
                const barHeight = (value / max) * chartHeight;
                const x = padding + index * barWidth + gap / 2;
                const y = padding + chartHeight - barHeight;

                return (
                    <rect
                        key={index}
                        x={x}
                        y={y}
                        width={actualBarWidth}
                        height={barHeight}
                        fill={color}
                        rx={1}
                        className={animate ? 'animate-in fade-in duration-500' : ''}
                        style={{ animationDelay: `${index * 50}ms` }}
                    />
                );
            })}
        </svg>
    );
}

export interface SparklineCardProps extends SparklineProps {
    title: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
}

export function SparklineCard({ title, value, trend, trendLabel, ...props }: SparklineCardProps) {
    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <div className="flex flex-col space-y-1.5 mb-4">
                <h3 className="font-semibold leading-none tracking-tight text-sm text-muted-foreground">{title}</h3>
                <div className="text-2xl font-bold">{value}</div>
            </div>
            <div className="h-[40px]">
                <Sparkline {...props} width={props.width || 200} height={props.height || 40} />
            </div>
            {(trend !== undefined || trendLabel) && (
                <div className="mt-2 flex items-center text-xs">
                    {trend !== undefined && (
                        <span className={cn(
                            "font-medium mr-1",
                            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-muted-foreground"
                        )}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                    {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
                </div>
            )}
        </div>
    );
}
