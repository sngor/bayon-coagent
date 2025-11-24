"use client";

import * as React from "react";
import {
    ConfirmationModal,
    ConfirmationVariant,
} from "@/components/ui/confirmation-modal";

interface ConfirmationOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmationVariant;
}

interface ConfirmationState extends ConfirmationOptions {
    open: boolean;
    isLoading: boolean;
    onConfirm: () => void | Promise<void>;
}

export function useConfirmation() {
    const [state, setState] = React.useState<ConfirmationState>({
        open: false,
        isLoading: false,
        title: "",
        description: "",
        onConfirm: () => { },
    });

    const confirm = React.useCallback(
        (options: ConfirmationOptions): Promise<boolean> => {
            return new Promise((resolve) => {
                setState({
                    open: true,
                    isLoading: false,
                    ...options,
                    onConfirm: async () => {
                        setState((prev) => ({ ...prev, isLoading: true }));
                        resolve(true);
                    },
                });
            });
        },
        []
    );

    const handleOpenChange = React.useCallback((open: boolean) => {
        if (!open) {
            setState((prev) => ({ ...prev, open: false }));
        }
    }, []);

    const ConfirmationDialog = React.useMemo(
        () => (
            <ConfirmationModal
                open={state.open}
                onOpenChange={handleOpenChange}
                onConfirm={state.onConfirm}
                title={state.title}
                description={state.description}
                confirmText={state.confirmText}
                cancelText={state.cancelText}
                variant={state.variant}
                isLoading={state.isLoading}
            />
        ),
        [state, handleOpenChange]
    );

    return { confirm, ConfirmationDialog };
}
