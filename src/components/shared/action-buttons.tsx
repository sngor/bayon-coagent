'use client';

import { Button } from '@/components/ui/button';
import { Copy, Check, Save, Download, Share2, Trash2, Edit, Plus } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
    // Primary action
    primaryLabel?: string;
    primaryIcon?: React.ReactNode;
    onPrimaryClick?: () => void;
    primaryLoading?: boolean;
    primaryDisabled?: boolean;
    primaryVariant?: 'default' | 'ai' | 'outline' | 'ghost' | 'destructive';

    // Secondary action
    secondaryLabel?: string;
    secondaryIcon?: React.ReactNode;
    onSecondaryClick?: () => void;
    secondaryDisabled?: boolean;

    // Quick actions
    onCopy?: () => void;
    onSave?: () => void;
    onDownload?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
    onEdit?: () => void;

    // State
    copied?: boolean;
    saved?: boolean;

    // Layout
    alignment?: 'left' | 'right' | 'between' | 'center';
    className?: string;
}

/**
 * Standardized action buttons for forms and content
 * Provides consistent button patterns across the app
 */
export function ActionButtons({
    primaryLabel,
    primaryIcon,
    onPrimaryClick,
    primaryLoading = false,
    primaryDisabled = false,
    primaryVariant = 'default',
    secondaryLabel,
    secondaryIcon,
    onSecondaryClick,
    secondaryDisabled = false,
    onCopy,
    onSave,
    onDownload,
    onShare,
    onDelete,
    onEdit,
    copied = false,
    saved = false,
    alignment = 'right',
    className,
}: ActionButtonsProps) {
    const alignmentClasses = {
        left: 'justify-start',
        right: 'justify-end',
        between: 'justify-between',
        center: 'justify-center',
    };

    return (
        <div className={cn('flex items-center gap-2', alignmentClasses[alignment], className)}>
            {/* Secondary/Cancel button */}
            {secondaryLabel && onSecondaryClick && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={onSecondaryClick}
                    disabled={secondaryDisabled || primaryLoading}
                >
                    {secondaryIcon}
                    {secondaryLabel}
                </Button>
            )}

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
                {onEdit && (
                    <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                )}

                {onCopy && (
                    <Button
                        type="button"
                        variant={copied ? 'default' : 'outline'}
                        size="sm"
                        onClick={onCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                            </>
                        )}
                    </Button>
                )}

                {onSave && (
                    <Button
                        type="button"
                        variant={saved ? 'default' : 'outline'}
                        size="sm"
                        onClick={onSave}
                    >
                        {saved ? (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Saved!
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                            </>
                        )}
                    </Button>
                )}

                {onDownload && (
                    <Button type="button" variant="outline" size="sm" onClick={onDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                )}

                {onShare && (
                    <Button type="button" variant="outline" size="sm" onClick={onShare}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                    </Button>
                )}

                {onDelete && (
                    <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                )}
            </div>

            {/* Primary action button */}
            {primaryLabel && onPrimaryClick && (
                <Button
                    type="button"
                    variant={primaryVariant}
                    onClick={onPrimaryClick}
                    disabled={primaryDisabled || primaryLoading}
                >
                    {primaryLoading ? (
                        <>
                            <LoadingDots size="sm" className="mr-2" />
                            {primaryLabel}...
                        </>
                    ) : (
                        <>
                            {primaryIcon}
                            {primaryLabel}
                        </>
                    )}
                </Button>
            )}
        </div>
    );
}

// Preset button configurations
export const ActionButtonPresets = {
    generateAI: {
        primaryLabel: 'Generate',
        primaryVariant: 'ai' as const,
        primaryIcon: <Plus className="mr-2 h-4 w-4" />,
    },
    saveForm: {
        primaryLabel: 'Save',
        primaryVariant: 'default' as const,
        secondaryLabel: 'Cancel',
    },
    deleteConfirm: {
        primaryLabel: 'Delete',
        primaryVariant: 'destructive' as const,
        secondaryLabel: 'Cancel',
    },
};
