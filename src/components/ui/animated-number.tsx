'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils/common';

export interface AnimatedNumberProps {
    value: number;
    duration?: number;
    decimals?: number;
    format?: 'number' | 'currency' | 'percentage';
    currency?: string;
    className?: string;
    prefix?: string;
    suffix?: string;
}

/**
 * AnimatedNumber component that smoothly animates from 0 to the target value
 * with configurable easing, formatting, and duration.
 * 
 * @param value - The target number to animate to
 * @param duration - Animation duration in milliseconds (default: 1000)
 * @param decimals - Number of decimal places to display (default: 0)
 * @param format - Format type: 'number', 'currency', or 'percentage' (default: 'number')
 * @param currency - Currency code for currency format (default: 'USD')
 * @param className - Additional CSS classes
 * @param prefix - Text to display before the number
 * @param suffix - Text to display after the number
 */
export function AnimatedNumber({
    value,
    duration = 1000,
    decimals = 0,
    format = 'number',
    currency = 'USD',
    className,
    prefix = '',
    suffix = '',
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const animationFrameRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const startValueRef = useRef(0);

    useEffect(() => {
        // Cancel any ongoing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        // Store the starting value
        startValueRef.current = displayValue;
        startTimeRef.current = undefined;
        setIsAnimating(true);

        // Easing function: ease-out cubic for natural deceleration
        const easeOutCubic = (t: number): number => {
            return 1 - Math.pow(1 - t, 3);
        };

        const animate = (currentTime: number) => {
            if (!startTimeRef.current) {
                startTimeRef.current = currentTime;
            }

            const elapsed = currentTime - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);

            const currentValue =
                startValueRef.current + (value - startValueRef.current) * easedProgress;

            setDisplayValue(currentValue);

            if (progress < 1) {
                animationFrameRef.current = requestAnimationFrame(animate);
            } else {
                setIsAnimating(false);
            }
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [value, duration]);

    const formatNumber = (num: number): string => {
        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency,
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                }).format(num);

            case 'percentage':
                return new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                }).format(num / 100);

            case 'number':
            default:
                return new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                }).format(num);
        }
    };

    return (
        <span
            className={cn(
                'tabular-nums transition-opacity duration-200',
                isAnimating && 'opacity-90',
                className
            )}
        >
            {prefix}
            {formatNumber(displayValue)}
            {suffix}
        </span>
    );
}

/**
 * Convenience component for displaying animated currency values
 */
export function AnimatedCurrency({
    value,
    duration,
    currency = 'USD',
    className,
}: Omit<AnimatedNumberProps, 'format'>) {
    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            format="currency"
            currency={currency}
            decimals={0}
            className={className}
        />
    );
}

/**
 * Convenience component for displaying animated percentage values
 */
export function AnimatedPercentage({
    value,
    duration,
    decimals = 1,
    className,
}: Omit<AnimatedNumberProps, 'format'>) {
    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            format="percentage"
            decimals={decimals}
            className={className}
        />
    );
}

/**
 * Convenience component for displaying animated decimal numbers (like ratings)
 */
export function AnimatedDecimal({
    value,
    duration,
    decimals = 1,
    className,
    prefix,
    suffix,
}: Omit<AnimatedNumberProps, 'format'>) {
    return (
        <AnimatedNumber
            value={value}
            duration={duration}
            format="number"
            decimals={decimals}
            className={className}
            prefix={prefix}
            suffix={suffix}
        />
    );
}
