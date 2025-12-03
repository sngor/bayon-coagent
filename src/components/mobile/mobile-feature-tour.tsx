"use client";

/**
 * Mobile Feature Tour Component
 * 
 * Provides an interactive tour of mobile-specific features for first-time users.
 * Shows key features like Quick Capture, Quick Actions, Voice Notes, and Quick Share.
 */

import * as React from "react";
import { X, Camera, Zap, Mic, Share2, MapPin, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/common";
import { useIsMobile } from "@/hooks/use-mobile";

export interface TourStep {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    image?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
    {
        id: "welcome",
        title: "Welcome to Mobile Features",
        description: "Bayon Coagent is now optimized for mobile! Capture property details, create content, and manage leads on the go.",
        icon: Camera,
    },
    {
        id: "quick-capture",
        title: "Quick Capture",
        description: "Use your camera and voice to instantly capture property details. AI will analyze photos and transcribe voice notes automatically.",
        icon: Camera,
    },
    {
        id: "quick-actions",
        title: "Quick Actions",
        description: "Access your most-used features with one tap. The menu learns from your usage and prioritizes frequently used actions.",
        icon: Zap,
    },
    {
        id: "voice-notes",
        title: "Voice Notes",
        description: "Record voice notes at properties and attach them to listings. Notes are automatically transcribed and synced to the cloud.",
        icon: Mic,
    },
    {
        id: "quick-share",
        title: "Quick Share",
        description: "Share property details via QR code, SMS, or social media. Track engagement to know when prospects view your listings.",
        icon: Share2,
    },
    {
        id: "location-services",
        title: "Location Services",
        description: "Get reminders when you arrive at properties, navigate with one tap, and automatically log check-ins.",
        icon: MapPin,
    },
    {
        id: "offline-mode",
        title: "Works Offline",
        description: "All features work without internet. Actions are queued and automatically sync when you're back online.",
        icon: Bell,
    },
];

export interface MobileFeatureTourProps {
    /** Custom tour steps (optional) */
    steps?: TourStep[];
    /** Callback when tour is completed */
    onComplete?: () => void;
    /** Callback when tour is skipped */
    onSkip?: () => void;
    /** Whether to show the tour */
    show?: boolean;
}

export function MobileFeatureTour({
    steps = DEFAULT_TOUR_STEPS,
    onComplete,
    onSkip,
    show = true,
}: MobileFeatureTourProps) {
    const [currentStep, setCurrentStep] = React.useState(0);
    const [isVisible, setIsVisible] = React.useState(show);
    const isMobile = useIsMobile();

    React.useEffect(() => {
        setIsVisible(show);
    }, [show]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        setIsVisible(false);
        onSkip?.();
    };

    const handleComplete = () => {
        setIsVisible(false);
        onComplete?.();
    };

    if (!isVisible || !isMobile) {
        return null;
    }

    const step = steps[currentStep];
    const Icon = step.icon;
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md bg-gradient-to-br from-background to-muted/20 border-primary/20">
                    <div className="p-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-primary/10">
                                    <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Step {currentStep + 1} of {steps.length}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSkip}
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="space-y-4">
                            <p className="text-muted-foreground leading-relaxed">
                                {step.description}
                            </p>

                            {step.image && (
                                <div className="rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        className="w-full h-auto"
                                    />
                                </div>
                            )}

                            {step.action && (
                                <Button
                                    onClick={step.action.onClick}
                                    className="w-full"
                                    variant="outline"
                                >
                                    {step.action.label}
                                </Button>
                            )}
                        </div>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-2">
                            {steps.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={cn(
                                        "h-2 rounded-full transition-all",
                                        index === currentStep
                                            ? "w-8 bg-primary"
                                            : "w-2 bg-muted-foreground/30"
                                    )}
                                    aria-label={`Go to step ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={isFirstStep}
                                className="flex-1"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>
                            <Button
                                onClick={handleNext}
                                className="flex-1"
                            >
                                {isLastStep ? "Get Started" : "Next"}
                                {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
                            </Button>
                        </div>

                        {/* Skip Button */}
                        {!isLastStep && (
                            <div className="text-center">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSkip}
                                    className="text-muted-foreground"
                                >
                                    Skip tour
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
