/**
 * Floating Action Button (FAB)
 * Animated floating button with expand/collapse functionality
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

export interface FABAction {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'success' | 'destructive';
}

export interface FloatingActionButtonProps {
    actions?: FABAction[];
    mainIcon?: React.ReactNode;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    actions = [],
    mainIcon,
    position = 'bottom-right',
    className,
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const positionClasses = {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6',
    };

    const actionPositions = {
        'bottom-right': 'bottom-20',
        'bottom-left': 'bottom-20',
        'top-right': 'top-20',
        'top-left': 'top-20',
    };

    return (
        <div className={cn('fixed z-50', positionClasses[position], className)}>
            {/* Action Items */}
            <AnimatePresence>
                {isOpen && actions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn('absolute right-0 flex flex-col gap-3', actionPositions[position])}
                    >
                        {actions.map((action, index) => (
                            <motion.button
                                key={index}
                                initial={{ scale: 0, opacity: 0, y: 20 }}
                                animate={{
                                    scale: 1,
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        delay: index * 0.05,
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 20,
                                    },
                                }}
                                exit={{
                                    scale: 0,
                                    opacity: 0,
                                    y: 20,
                                    transition: { delay: (actions.length - index - 1) * 0.05 },
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    'flex items-center gap-3 rounded-full px-4 py-3 shadow-lg transition-all',
                                    action.variant === 'success' && 'bg-success text-success-foreground',
                                    action.variant === 'destructive' && 'bg-destructive text-destructive-foreground',
                                    !action.variant && 'bg-primary text-primary-foreground'
                                )}
                            >
                                <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
                                <div className="w-5 h-5 flex items-center justify-center">{action.icon}</div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main FAB Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
            >
                {mainIcon || <Plus className="w-6 h-6" />}
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
