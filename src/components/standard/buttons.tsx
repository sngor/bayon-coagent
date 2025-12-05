'use client';

import * as React from 'react';
import { Loader2, Save, X, Trash2, Plus, Check, ArrowLeft, ArrowRight, Download, Upload, Copy, Edit, RefreshCw, Search, Send, Sparkles } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/common';

// ============================================================================
// Base Action Button Component
// ============================================================================

export interface ActionButtonProps extends Omit<ButtonProps, 'children'> {
    loading?: boolean;
    loadingText?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}

export function ActionButton({
    loading = false,
    loadingText,
    icon,
    children,
    disabled,
    className,
    ...props
}: ActionButtonProps) {
    return (
        <Button
            disabled={disabled || loading}
            className={className}
            {...props}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText || children}
                </>
            ) : (
                <>
                    {icon && <span className="mr-2">{icon}</span>}
                    {children}
                </>
            )}
        </Button>
    );
}

// ============================================================================
// Common Action Buttons
// ============================================================================

export interface CommonButtonProps extends Omit<ButtonProps, 'children' | 'variant'> {
    loading?: boolean;
    loadingText?: string;
}

export function SaveButton({ loading, loadingText = 'Saving...', ...props }: CommonButtonProps) {
    return (
        <ActionButton
            variant="default"
            icon={!loading && <Save className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            Save
        </ActionButton>
    );
}

export function CancelButton({ ...props }: Omit<ButtonProps, 'children' | 'variant'>) {
    return (
        <Button variant="outline" {...props}>
            <X className="mr-2 h-4 w-4" />
            Cancel
        </Button>
    );
}

export function DeleteButton({ loading, loadingText = 'Deleting...', ...props }: CommonButtonProps) {
    return (
        <ActionButton
            variant="destructive"
            icon={!loading && <Trash2 className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            Delete
        </ActionButton>
    );
}

export function CreateButton({ loading, loadingText = 'Creating...', children = 'Create', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="default"
            icon={!loading && <Plus className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function SubmitButton({ loading, loadingText = 'Submitting...', children = 'Submit', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            type="submit"
            variant="default"
            icon={!loading && <Check className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function BackButton({ children = 'Back', ...props }: Omit<ButtonProps, 'children' | 'variant'> & { children?: React.ReactNode }) {
    return (
        <Button variant="outline" {...props}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {children}
        </Button>
    );
}

export function NextButton({ children = 'Next', ...props }: Omit<ButtonProps, 'children' | 'variant'> & { children?: React.ReactNode }) {
    return (
        <Button variant="default" {...props}>
            {children}
            <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
    );
}

export function DownloadButton({ loading, loadingText = 'Downloading...', children = 'Download', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="outline"
            icon={!loading && <Download className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function UploadButton({ loading, loadingText = 'Uploading...', children = 'Upload', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="outline"
            icon={!loading && <Upload className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function CopyButton({ loading, loadingText = 'Copying...', children = 'Copy', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="outline"
            icon={!loading && <Copy className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function EditButton({ children = 'Edit', ...props }: Omit<ButtonProps, 'children' | 'variant'> & { children?: React.ReactNode }) {
    return (
        <Button variant="outline" {...props}>
            <Edit className="mr-2 h-4 w-4" />
            {children}
        </Button>
    );
}

export function RefreshButton({ loading, loadingText = 'Refreshing...', children = 'Refresh', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="outline"
            icon={!loading && <RefreshCw className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function SearchButton({ loading, loadingText = 'Searching...', children = 'Search', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="outline"
            icon={!loading && <Search className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function SendButton({ loading, loadingText = 'Sending...', children = 'Send', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="default"
            icon={!loading && <Send className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

// ============================================================================
// AI-Specific Buttons
// ============================================================================

export function GenerateButton({ loading, loadingText = 'Generating...', children = 'Generate', ...props }: CommonButtonProps & { children?: React.ReactNode }) {
    return (
        <ActionButton
            variant="ai"
            icon={!loading && <Sparkles className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

export function AIButton({ loading, loadingText, children, ...props }: CommonButtonProps & { children: React.ReactNode }) {
    return (
        <ActionButton
            variant="ai"
            icon={!loading && <Sparkles className="h-4 w-4" />}
            loading={loading}
            loadingText={loadingText}
            {...props}
        >
            {children}
        </ActionButton>
    );
}

// ============================================================================
// Form Button Groups
// ============================================================================

export interface FormActionsProps {
    onCancel?: () => void;
    onSubmit?: () => void;
    submitText?: string;
    cancelText?: string;
    isSubmitting?: boolean;
    submitLoadingText?: string;
    submitVariant?: ButtonProps['variant'];
    alignment?: 'left' | 'right' | 'between' | 'center';
    className?: string;
    children?: React.ReactNode;
}

export function FormActions({
    onCancel,
    onSubmit,
    submitText = 'Submit',
    cancelText = 'Cancel',
    isSubmitting = false,
    submitLoadingText = 'Submitting...',
    submitVariant = 'default',
    alignment = 'right',
    className,
    children,
}: FormActionsProps) {
    const alignmentClasses = {
        left: 'justify-start',
        right: 'justify-end',
        between: 'justify-between',
        center: 'justify-center',
    };

    return (
        <div className={cn('flex gap-3', alignmentClasses[alignment], className)}>
            {children || (
                <>
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            {cancelText}
                        </Button>
                    )}
                    {onSubmit && (
                        <ActionButton
                            type="submit"
                            variant={submitVariant}
                            onClick={onSubmit}
                            loading={isSubmitting}
                            loadingText={submitLoadingText}
                        >
                            {submitText}
                        </ActionButton>
                    )}
                </>
            )}
        </div>
    );
}

export interface DialogActionsProps extends FormActionsProps {
    onClose?: () => void;
    closeText?: string;
}

export function DialogActions({
    onClose,
    closeText = 'Close',
    ...props
}: DialogActionsProps) {
    return (
        <FormActions
            onCancel={onClose}
            cancelText={closeText}
            {...props}
        />
    );
}

// ============================================================================
// Icon-Only Buttons
// ============================================================================

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'size'> {
    icon: React.ReactNode;
    label: string; // For accessibility
    size?: ButtonProps['size'];
}

export function IconButton({ icon, label, size = 'icon', ...props }: IconButtonProps) {
    return (
        <Button
            size={size}
            aria-label={label}
            title={label}
            {...props}
        >
            {icon}
        </Button>
    );
}

// Common icon-only buttons
export function CloseIconButton(props: Omit<IconButtonProps, 'icon' | 'label'>) {
    return <IconButton icon={<X className="h-4 w-4" />} label="Close" variant="ghost" {...props} />;
}

export function DeleteIconButton(props: Omit<IconButtonProps, 'icon' | 'label'>) {
    return <IconButton icon={<Trash2 className="h-4 w-4" />} label="Delete" variant="ghost" {...props} />;
}

export function EditIconButton(props: Omit<IconButtonProps, 'icon' | 'label'>) {
    return <IconButton icon={<Edit className="h-4 w-4" />} label="Edit" variant="ghost" {...props} />;
}

export function CopyIconButton(props: Omit<IconButtonProps, 'icon' | 'label'>) {
    return <IconButton icon={<Copy className="h-4 w-4" />} label="Copy" variant="ghost" {...props} />;
}

export function RefreshIconButton(props: Omit<IconButtonProps, 'icon' | 'label'>) {
    return <IconButton icon={<RefreshCw className="h-4 w-4" />} label="Refresh" variant="ghost" {...props} />;
}
