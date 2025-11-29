'use client';

/**
 * Delete Confirmation Modal for Edit History
 * 
 * A custom modal for confirming deletion of edit history items
 * with a clean, modern design and smooth animations.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/common';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
    editType?: string;
}

export function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    isDeleting = false,
    editType,
}: DeleteConfirmationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="relative w-full max-w-md bg-background rounded-lg shadow-lg border"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                aria-label="Close dialog"
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Content */}
                            <div className="p-6">
                                {/* Icon */}
                                <div className="flex items-center justify-center mb-4">
                                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                        <AlertTriangle className="h-6 w-6 text-destructive" />
                                    </div>
                                </div>

                                {/* Title */}
                                <h2 className="font-headline text-xl font-semibold text-center mb-2">
                                    Delete Edit?
                                </h2>

                                {/* Description */}
                                <p className="text-sm text-muted-foreground text-center mb-6">
                                    {editType ? (
                                        <>
                                            Are you sure you want to delete this{' '}
                                            <span className="font-medium text-foreground">{editType}</span> edit?
                                            This action cannot be undone.
                                        </>
                                    ) : (
                                        'Are you sure you want to delete this edit? This action cannot be undone.'
                                    )}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={onClose}
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={onConfirm}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
