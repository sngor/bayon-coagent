/**
 * Animated Input Component
 * Input with focus animations and validation feedback
 */

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

export interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
    success?: boolean;
    errorMessage?: string;
    successMessage?: string;
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
    ({ className, type, error, success, errorMessage, successMessage, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);

        return (
            <div className="relative w-full">
                <motion.div
                    className="relative"
                    animate={{
                        scale: isFocused ? 1.01 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <input
                        type={type}
                        className={cn(
                            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-[inset_0_1px_2px_0_rgb(0_0_0_/_0.05)]',
                            error && 'border-destructive focus-visible:ring-destructive',
                            success && 'border-success focus-visible:ring-success',
                            (error || success) && 'pr-10',
                            className
                        )}
                        ref={ref}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        {...props}
                    />

                    {/* Success/Error Icons */}
                    {success && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <Check className="h-4 w-4 text-success" />
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1, rotate: [0, -10, 10, -10, 0] }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </motion.div>
                    )}
                </motion.div>

                {/* Error/Success Messages */}
                {errorMessage && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-1 text-xs text-destructive"
                    >
                        {errorMessage}
                    </motion.p>
                )}

                {successMessage && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mt-1 text-xs text-success"
                    >
                        {successMessage}
                    </motion.p>
                )}
            </div>
        );
    }
);

AnimatedInput.displayName = 'AnimatedInput';
