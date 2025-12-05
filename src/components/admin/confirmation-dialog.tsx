/**
 * Confirmation Dialog Component
 * 
 * A reusable confirmation dialog for sensitive admin actions.
 * Emphasizes elevated privilege level and requires explicit confirmation.
 */

'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Shield, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/common';

export interface ConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'default' | 'destructive' | 'warning';
    emphasizePrivilege?: boolean;
    isLoading?: boolean;
}

/**
 * ConfirmationDialog component for sensitive admin actions
 * 
 * Features:
 * - Clear title and description
 * - Customizable confirm/cancel labels
 * - Visual variants (default, destructive, warning)
 * - Optional privilege level emphasis
 * - Loading state support
 */
export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    variant = 'default',
    emphasizePrivilege = false,
    isLoading = false,
}: ConfirmationDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    const variantStyles = {
        default: {
            icon: Shield,
            iconColor: 'text-blue-600 dark:text-blue-400',
            buttonClass: '',
        },
        destructive: {
            icon: AlertTriangle,
            iconColor: 'text-red-600 dark:text-red-400',
            buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: AlertTriangle,
            iconColor: 'text-orange-600 dark:text-orange-400',
            buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
        },
    };

    const style = variantStyles[variant];
    const Icon = style.icon;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                            'flex items-center justify-center w-10 h-10 rounded-full',
                            variant === 'destructive' ? 'bg-red-100 dark:bg-red-900/20' :
                                variant === 'warning' ? 'bg-orange-100 dark:bg-orange-900/20' :
                                    'bg-blue-100 dark:bg-blue-900/20'
                        )}>
                            <Icon className={cn('h-5 w-5', style.iconColor)} />
                        </div>
                        <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left">
                        {description}
                    </AlertDialogDescription>
                    {emphasizePrivilege && (
                        <div className="mt-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                            <div className="flex items-start gap-2">
                                <Shield className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-orange-800 dark:text-orange-300">
                                    <strong>Elevated Privilege Action:</strong> This action requires admin privileges and will be logged in the audit trail.
                                </p>
                            </div>
                        </div>
                    )}
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        {cancelLabel}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={style.buttonClass}
                    >
                        {isLoading ? 'Processing...' : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Hook to manage confirmation dialog state
 * 
 * Usage:
 * ```tsx
 * const confirmDialog = useConfirmationDialog();
 * 
 * // Show dialog
 * confirmDialog.show({
 *   title: 'Assign Admin Role',
 *   description: 'Are you sure you want to assign admin role to this user?',
 *   onConfirm: async () => { ... }
 * });
 * 
 * // Render dialog
 * <ConfirmationDialog {...confirmDialog.props} />
 * ```
 */
export function useConfirmationDialog() {
    const [open, setOpen] = React.useState(false);
    const [props, setProps] = React.useState<Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>>({
        title: '',
        description: '',
        onConfirm: () => { },
    });

    const show = (dialogProps: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
        setProps(dialogProps);
        setOpen(true);
    };

    const hide = () => {
        setOpen(false);
    };

    return {
        show,
        hide,
        props: {
            ...props,
            open,
            onOpenChange: setOpen,
        },
    };
}

// Need to import React for useState
import * as React from 'react';
