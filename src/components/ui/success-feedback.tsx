/**
 * Success Feedback Component
 * Provides animated success feedback with checkmark animation
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { successPing, successCheck, scaleIn } from '@/lib/animations';

export interface SuccessFeedbackProps {
    show: boolean;
    message?: string;
    duration?: number;
    onComplete?: () => void;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const SuccessFeedback: React.FC<SuccessFeedbackProps> = ({
    show,
    message,
    duration = 2000,
    onComplete,
    className,
    size = 'md',
}) => {
    React.useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                onComplete?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, duration, onComplete]);

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
    };

    const iconSizes = {
        sm: 24,
        md: 32,
        lg: 48,
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={cn(
                        'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
                        className
                    )}
                >
                    <div className="relative flex flex-col items-center gap-4">
                        {/* Success circle with ping effect */}
                        <div className="relative">
                            <motion.div
                                className={cn(
                                    'rounded-full bg-success flex items-center justify-center',
                                    sizeClasses[size]
                                )}
                                variants={scaleIn}
                            >
                                <Check className="text-success-foreground" size={iconSizes[size]} />
                            </motion.div>

                            {/* Ping effect */}
                            <motion.div
                                className={cn(
                                    'absolute inset-0 rounded-full bg-success',
                                    sizeClasses[size]
                                )}
                                variants={successPing}
                                initial="initial"
                                animate="animate"
                            />
                        </div>

                        {/* Success message */}
                        {message && (
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-lg font-medium text-foreground"
                            >
                                {message}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Inline success indicator (for forms, buttons, etc.)
export interface InlineSuccessProps {
    show: boolean;
    message?: string;
    className?: string;
}

export const InlineSuccess: React.FC<InlineSuccessProps> = ({ show, message, className }) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className={cn('flex items-center gap-2 text-success', className)}
                >
                    <motion.div
                        className="w-5 h-5 rounded-full bg-success flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                    >
                        <Check className="w-3 h-3 text-success-foreground" />
                    </motion.div>
                    {message && <span className="text-sm font-medium">{message}</span>}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Success checkmark SVG animation
export const AnimatedCheckmark: React.FC<{ className?: string; size?: number }> = ({
    className,
    size = 64,
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            className={cn('text-success', className)}
        >
            <motion.circle
                cx="32"
                cy="32"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <motion.path
                d="M 16 32 L 28 44 L 48 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={successCheck}
                initial="hidden"
                animate="visible"
            />
        </svg>
    );
};
