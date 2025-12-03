"use client";

/**
 * Mobile Onboarding Provider
 * 
 * Manages the mobile feature tour and onboarding state.
 * Shows the tour to first-time mobile users and tracks completion.
 */

import * as React from "react";
import { useUser } from "@/aws/auth/use-user";
import { getRepository } from "@/aws/dynamodb/repository";
import { MobileFeatureTour } from "./mobile-feature-tour";
import { useIsMobile } from "@/hooks/use-mobile";

export interface MobileOnboardingState {
    hasCompletedTour: boolean;
    tourCompletedAt?: string;
    tourSkipped?: boolean;
}

export interface MobileOnboardingContextValue {
    /** Whether the user has completed the mobile tour */
    hasCompletedTour: boolean;
    /** Start the mobile tour */
    startTour: () => void;
    /** Mark tour as completed */
    completeTour: () => Promise<void>;
    /** Skip the tour */
    skipTour: () => Promise<void>;
    /** Reset tour state (for testing) */
    resetTour: () => Promise<void>;
    /** Loading state */
    isLoading: boolean;
}

const MobileOnboardingContext = React.createContext<
    MobileOnboardingContextValue | undefined
>(undefined);

export interface MobileOnboardingProviderProps {
    children: React.ReactNode;
    /** Whether to automatically show tour for first-time users */
    autoShow?: boolean;
}

/**
 * Provider that manages mobile onboarding state
 */
export function MobileOnboardingProvider({
    children,
    autoShow = true,
}: MobileOnboardingProviderProps) {
    const { user } = useUser();
    const isMobile = useIsMobile();
    const [state, setState] = React.useState<MobileOnboardingState>({
        hasCompletedTour: false,
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [showTour, setShowTour] = React.useState(false);

    // Load onboarding state from DynamoDB
    React.useEffect(() => {
        async function loadOnboardingState() {
            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                const repository = getRepository();
                const onboardingState = await repository.get<MobileOnboardingState>(
                    `USER#${user.id}`,
                    "ONBOARDING#MOBILE"
                );

                if (onboardingState) {
                    setState(onboardingState);
                } else if (autoShow && isMobile) {
                    // First-time mobile user - show tour
                    setShowTour(true);
                }
            } catch (error) {
                console.error("Failed to load mobile onboarding state:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadOnboardingState();
    }, [user?.id, autoShow, isMobile]);

    const startTour = React.useCallback(() => {
        setShowTour(true);
    }, []);

    const completeTour = React.useCallback(async () => {
        if (!user?.id) {
            console.warn("Cannot save onboarding state: user not authenticated");
            return;
        }

        const newState: MobileOnboardingState = {
            hasCompletedTour: true,
            tourCompletedAt: new Date().toISOString(),
            tourSkipped: false,
        };

        setState(newState);
        setShowTour(false);

        try {
            const repository = getRepository();
            await repository.create(
                `USER#${user.id}`,
                "ONBOARDING#MOBILE",
                "UserProfile",
                newState
            );
        } catch (error) {
            console.error("Failed to save mobile onboarding state:", error);
        }
    }, [user?.id]);

    const skipTour = React.useCallback(async () => {
        if (!user?.id) {
            console.warn("Cannot save onboarding state: user not authenticated");
            return;
        }

        const newState: MobileOnboardingState = {
            hasCompletedTour: true,
            tourCompletedAt: new Date().toISOString(),
            tourSkipped: true,
        };

        setState(newState);
        setShowTour(false);

        try {
            const repository = getRepository();
            await repository.create(
                `USER#${user.id}`,
                "ONBOARDING#MOBILE",
                "UserProfile",
                newState
            );
        } catch (error) {
            console.error("Failed to save mobile onboarding state:", error);
        }
    }, [user?.id]);

    const resetTour = React.useCallback(async () => {
        if (!user?.id) {
            return;
        }

        setState({ hasCompletedTour: false });

        try {
            const repository = getRepository();
            await repository.delete(`USER#${user.id}`, "ONBOARDING#MOBILE");
        } catch (error) {
            console.error("Failed to reset mobile onboarding state:", error);
        }
    }, [user?.id]);

    const value: MobileOnboardingContextValue = {
        hasCompletedTour: state.hasCompletedTour,
        startTour,
        completeTour,
        skipTour,
        resetTour,
        isLoading,
    };

    return (
        <MobileOnboardingContext.Provider value={value}>
            {children}
            {isMobile && (
                <MobileFeatureTour
                    show={showTour}
                    onComplete={completeTour}
                    onSkip={skipTour}
                />
            )}
        </MobileOnboardingContext.Provider>
    );
}

/**
 * Hook to access mobile onboarding context
 */
export function useMobileOnboarding(): MobileOnboardingContextValue {
    const context = React.useContext(MobileOnboardingContext);
    if (!context) {
        throw new Error(
            "useMobileOnboarding must be used within MobileOnboardingProvider"
        );
    }
    return context;
}
