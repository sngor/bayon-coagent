"use client";

import * as React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmationVariant = "danger" | "warning" | "info";

interface ConfirmationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
    isLoading?: boolean;
}

const variantConfig = {
    danger: {
        icon: Trash2,
        iconClassName: "text-red-500",
        confirmClassName:
            "bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white",
    },
    warning: {
        icon: AlertTriangle,
        iconClassName: "text-amber-500",
        confirmClassName:
            "bg-amber-600 hover:bg-amber-700 focus:ring-amber-600 text-white",
    },
    info: {
        icon: Info,
        iconClassName: "text-blue-500",
        confirmClassName:
            "bg-primary hover:bg-primary/90 focus:ring-primary text-primary-foreground",
    },
};

export function ConfirmationModal({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    isLoading = false,
}: ConfirmationModalProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = async () => {
        await onConfirm();
        onOpenChange(false);
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted",
                                config.iconClassName
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <AlertDialogTitle>{title}</AlertDialogTitle>
                            <AlertDialogDescription>{description}</AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={config.confirmClassName}
                    >
                        {isLoading ? "Processing..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
