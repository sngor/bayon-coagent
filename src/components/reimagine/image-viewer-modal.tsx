'use client';

/**
 * Image Viewer Modal for Edit History
 * 
 * A modal for viewing edit history images in full detail
 * with before/after comparison.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { cn } from '@/lib/utils/common';

interface ImageViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalUrl: string;
    editedUrl: string;
    editType: string;
    onDownload?: () => void;
}

export function ImageViewerModal({
    isOpen,
    onClose,
    originalUrl,
    editedUrl,
    editType,
    onDownload,
}: ImageViewerModalProps) {
    const [showComparison, setShowComparison] = useState(true);
    const [currentView, setCurrentView] = useState<'original' | 'edited'>('edited');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="relative w-full max-w-6xl h-[90vh] bg-background rounded-lg shadow-2xl border flex flex-col pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-3">
                                    <h2 className="font-headline text-lg font-semibold">
                                        {editType}
                                    </h2>
                                    <Badge variant="secondary">
                                        {showComparison ? 'Comparison' : currentView === 'original' ? 'Original' : 'Edited'}
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* View Toggle */}
                                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                                        <Button
                                            variant={showComparison ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setShowComparison(true)}
                                        >
                                            Comparison
                                        </Button>
                                        <Button
                                            variant={!showComparison ? 'default' : 'ghost'}
                                            size="sm"
                                            onClick={() => setShowComparison(false)}
                                        >
                                            Single
                                        </Button>
                                    </div>

                                    {/* Download */}
                                    {onDownload && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={onDownload}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    )}

                                    {/* Close */}
                                    <button
                                        onClick={onClose}
                                        aria-label="Close viewer"
                                        className="text-muted-foreground hover:text-foreground transition-colors p-2"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Image Content */}
                            <div className="flex-1 overflow-hidden p-4">
                                {showComparison ? (
                                    /* Comparison View */
                                    <div className="grid grid-cols-2 gap-4 h-full">
                                        {/* Original */}
                                        <div className="flex flex-col gap-2 h-full">
                                            <div className="text-sm font-medium text-muted-foreground">Original</div>
                                            <div className="relative flex-1 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                                <Image
                                                    src={originalUrl}
                                                    alt="Original"
                                                    fill
                                                    className="object-contain"
                                                    quality={100}
                                                />
                                            </div>
                                        </div>

                                        {/* Edited */}
                                        <div className="flex flex-col gap-2 h-full">
                                            <div className="text-sm font-medium text-muted-foreground">Edited</div>
                                            <div className="relative flex-1 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                                <Image
                                                    src={editedUrl}
                                                    alt="Edited"
                                                    fill
                                                    className="object-contain"
                                                    quality={100}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* Single View */
                                    <div className="relative h-full">
                                        <div className="relative h-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                                            <Image
                                                src={currentView === 'original' ? originalUrl : editedUrl}
                                                alt={currentView === 'original' ? 'Original' : 'Edited'}
                                                fill
                                                className="object-contain"
                                                quality={100}
                                            />
                                        </div>

                                        {/* Navigation Arrows */}
                                        <button
                                            onClick={() => setCurrentView('original')}
                                            disabled={currentView === 'original'}
                                            className={cn(
                                                'absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg transition-all',
                                                currentView === 'original' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background'
                                            )}
                                            aria-label="View original"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </button>

                                        <button
                                            onClick={() => setCurrentView('edited')}
                                            disabled={currentView === 'edited'}
                                            className={cn(
                                                'absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg transition-all',
                                                currentView === 'edited' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-background'
                                            )}
                                            aria-label="View edited"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </button>

                                        {/* View Indicator */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                            <button
                                                onClick={() => setCurrentView('original')}
                                                className={cn(
                                                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                                                    currentView === 'original'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-background/80 backdrop-blur-sm border hover:bg-background'
                                                )}
                                            >
                                                Original
                                            </button>
                                            <button
                                                onClick={() => setCurrentView('edited')}
                                                className={cn(
                                                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                                                    currentView === 'edited'
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'bg-background/80 backdrop-blur-sm border hover:bg-background'
                                                )}
                                            >
                                                Edited
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
