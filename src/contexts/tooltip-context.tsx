"use client";

/**
 * Tooltip Context Provider
 * 
 * Manages tooltip visibility state and persists seen tooltips to user preferences.
 * Provides hooks for checking if a tooltip has been seen and marking tooltips as seen.
 */

import * as React from "react";
import { useUser } from "@/aws/auth/use-user";
import { getRepository } from "@/aws/dynamodb/repository";

export interface TooltipPreferences {
    /** Set of tooltip IDs that have been seen/dismissed */
    seenTooltips: Set<string>;
}

export interface TooltipContextValue {
    /** Check if a tooltip has been seen */
    hasSeenTooltip: (tooltipId: string) => boolean;
    /** Mark a tooltip as seen */
    markTooltipAsSeen: (tooltipId: string) => Promise<void>;
    /** Reset all seen tooltips (for testing/debugging) */
    resetSeenTooltips: () => Promise<void>;
    /** Loading state */
    isLoading: boolean;
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(
    undefined
);

export interface TooltipProviderProps {
    children: React.ReactNode;
}

/**
 * Provider component that manages tooltip state and persistence
 */
export function TooltipProvider({ children }: TooltipProviderProps) {
    const { user } = useUser();
    const [seenTooltips, setSeenTooltips] = React.useState<Set<string>>(
        new Set()
    );
    const [isLoading, setIsLoading] = React.useState(true);

    // Load seen tooltips from DynamoDB when user is available
    React.useEffect(() => {
        async function loadSeenTooltips() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const repository = getRepository();
                const preferences = await repository.get<{ seenTooltips: string[] }>(
                    `USER#${user.id}`,
                    "PREFERENCES#TOOLTIPS"
                );

                if (preferences?.seenTooltips) {
                    setSeenTooltips(new Set(preferences.seenTooltips));
                }
            } catch (error) {
                console.error("Failed to load tooltip preferences:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadSeenTooltips();
    }, [user?.id]);

    const hasSeenTooltip = React.useCallback(
        (tooltipId: string): boolean => {
            return seenTooltips.has(tooltipId);
        },
        [seenTooltips]
    );

    const markTooltipAsSeen = React.useCallback(
        async (tooltipId: string) => {
            if (!user?.id) {
                console.warn("Cannot save tooltip preference: user not authenticated");
                return;
            }

            // Update local state immediately
            setSeenTooltips((prev) => new Set([...prev, tooltipId]));

            // Persist to DynamoDB
            try {
                const repository = getRepository();
                const newSeenTooltips = [...seenTooltips, tooltipId];

                await repository.create(
                    `USER#${user.id}`,
                    "PREFERENCES#TOOLTIPS",
                    "UserProfile",
                    { seenTooltips: newSeenTooltips }
                );
            } catch (error) {
                console.error("Failed to save tooltip preference:", error);
                // Revert local state on error
                setSeenTooltips((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(tooltipId);
                    return newSet;
                });
            }
        },
        [user?.id, seenTooltips]
    );

    const resetSeenTooltips = React.useCallback(async () => {
        if (!user?.id) {
            return;
        }

        setSeenTooltips(new Set());

        try {
            const repository = getRepository();
            await repository.delete(
                `USER#${user.id}`,
                "PREFERENCES#TOOLTIPS"
            );
        } catch (error) {
            console.error("Failed to reset tooltip preferences:", error);
        }
    }, [user?.id]);

    const value: TooltipContextValue = {
        hasSeenTooltip,
        markTooltipAsSeen,
        resetSeenTooltips,
        isLoading,
    };

    return (
        <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
    );
}

/**
 * Hook to access tooltip context
 */
export function useTooltipContext(): TooltipContextValue {
    const context = React.useContext(TooltipContext);
    if (!context) {
        throw new Error("useTooltipContext must be used within TooltipProvider");
    }
    return context;
}

/**
 * Hook to manage a specific tooltip's visibility
 */
export function useContextualTooltip(tooltipId: string) {
    const { hasSeenTooltip, markTooltipAsSeen, isLoading } = useTooltipContext();
    const [isVisible, setIsVisible] = React.useState(false);

    // Show tooltip if it hasn't been seen yet
    React.useEffect(() => {
        if (!isLoading && !hasSeenTooltip(tooltipId)) {
            setIsVisible(true);
        }
    }, [tooltipId, hasSeenTooltip, isLoading]);

    const dismiss = React.useCallback(async () => {
        setIsVisible(false);
        await markTooltipAsSeen(tooltipId);
    }, [tooltipId, markTooltipAsSeen]);

    return {
        isVisible,
        dismiss,
        isLoading,
    };
}
