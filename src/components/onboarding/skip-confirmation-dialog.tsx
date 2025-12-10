'use client';

import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { ICON_SIZES } from '@/lib/constants/icon-sizes';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils/common';
import { createKeyboardHandler } from '@/lib/accessibility/keyboard-navigation';

export interface SkipConfirmationDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog open state changes */
    onOpenChange: (open: boolean) => void;
    /** Callback when user confirms skip */
    onConfirm: () => void | Promise<void>;
    /** Whether the confirmation is loading */
    isLoading?: boolean;
}

/**
 * SkipConfirmationDialog Component
 * 
 * Displays a confirmation dialog when user attempts to skip onboarding.
 * Explains the consequences of skipping and allows user to confirm or cancel.
 * 
 * Features:
 * - Clear warning about skipping
 * - Explanation of what happens when skipping
 * - Reassurance that steps can be accessed later
 * - Mobile-optimized layout
 * - Touch-optimized buttons (min 44x44px)
 * 
 * Requirements: 10.2, 10.3, 10.4, 10.5
 */
export function SkipConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading = false,
}: SkipConfirmationDialogProps) {
    const isMobile = useIsMobile();

    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    // Keyboard shortcuts for dialog
    useEffect(() => {
        if (!open) return;

        const handleKeyboard = createKeyboardHandler([
            {
                key: 'Escape',
                handler: () => onOpenChange(false),
                preventDefault: true,
            },
        ]);

        document.addEventListener('keydown', handleKeyboard);
        return () => document.removeEventListener('keydown', handleKeyboard);
    }, [open, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    "sm:max-w-md",
                    // Mobile-optimized padding
                    isMobile && "p-4"
                )}
                aria-describedby="skip-dialog-description"
            >
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div
                            className="flex-shrink-0 rounded-full bg-warning/10 p-2"
                            aria-hidden="true"
                        >
                            <AlertTriangle className={cn(
                                "text-warning",
                                ICON_SIZES.md
                            )} />
                        </div>
                        <DialogTitle
                            className={cn(
                                isMobile ? "text-lg" : "text-xl"
                            )}
                            id="skip-dialog-title"
                        >
                            Skip Onboarding?
                        </DialogTitle>
                    </div>
                    <DialogDescription
                        className={cn(
                            "text-left space-y-3",
                            isMobile ? "text-sm" : "text-base"
                        )}
                        id="skip-dialog-description"
                    >
                        <div>
                            You're about to skip the onboarding process. This means:
                        </div>
                        <ul
                            className="list-disc list-inside space-y-2 text-muted-foreground"
                            role="list"
                        >
                            <li role="listitem">You'll miss important platform features and tips</li>
                            <li role="listitem">Your profile won't be set up for personalized content</li>
                            <li role="listitem">You'll need to explore features on your own</li>
                        </ul>
                        <div className="text-foreground font-medium">
                            Don't worry - you can always access individual setup steps from your settings later.
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className={cn(
                            "w-full sm:w-auto",
                            // Touch target optimization for mobile (min 44x44px)
                            isMobile && "min-h-[44px] touch-manipulation"
                        )}
                        aria-label="Continue with onboarding setup. Press Escape to close."
                    >
                        Continue Setup
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        loading={isLoading}
                        className={cn(
                            "w-full sm:w-auto",
                            // Touch target optimization for mobile (min 44x44px)
                            isMobile && "min-h-[44px] touch-manipulation"
                        )}
                        aria-label="Skip onboarding and go to dashboard"
                    >
                        Skip to Dashboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
