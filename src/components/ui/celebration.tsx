"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/common";
import { CheckCircle2, Sparkles, Star, Trophy, Zap } from "lucide-react";

interface ConfettiPiece {
    id: number;
    left: number;
    delay: number;
    duration: number;
    color: string;
    size: number;
    rotation: number;
}

interface CelebrationProps {
    show: boolean;
    onComplete?: () => void;
    type?: "confetti" | "success" | "milestone" | "achievement";
    message?: string;
    duration?: number;
}

/**
 * Celebration component for major completions and milestones
 * Provides confetti animations and success feedback
 */
export function Celebration({
    show,
    onComplete,
    type = "confetti",
    message,
    duration = 3000,
}: CelebrationProps) {
    const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);

            // Generate confetti pieces
            if (type === "confetti" || type === "milestone" || type === "achievement") {
                const pieces: ConfettiPiece[] = [];
                const colors = [
                    "hsl(var(--primary))",
                    "hsl(var(--success))",
                    "hsl(var(--warning))",
                    "hsl(142 71% 45%)",
                    "hsl(220 60% 50%)",
                    "hsl(260 60% 50%)",
                ];

                const pieceCount = type === "confetti" ? 50 : 30;

                for (let i = 0; i < pieceCount; i++) {
                    pieces.push({
                        id: i,
                        left: Math.random() * 100,
                        delay: Math.random() * 0.5,
                        duration: 2 + Math.random() * 1.5,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 8 + Math.random() * 8,
                        rotation: Math.random() * 360,
                    });
                }
                setConfetti(pieces);
            }

            // Auto-hide after duration
            const timer = setTimeout(() => {
                setIsVisible(false);
                setConfetti([]);
                onComplete?.();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, type, duration, onComplete]);

    if (!show && !isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-50 pointer-events-none flex items-center justify-center",
                isVisible ? "animate-fade-in" : "animate-fade-out"
            )}
        >
            {/* Confetti pieces */}
            {(type === "confetti" || type === "milestone" || type === "achievement") &&
                confetti.map((piece) => (
                    <div
                        key={piece.id}
                        className="absolute top-0 animate-confetti"
                        style={{
                            left: `${piece.left}%`,
                            animationDelay: `${piece.delay}s`,
                            animationDuration: `${piece.duration}s`,
                        }}
                    >
                        <div
                            className="rounded-sm"
                            style={{
                                width: `${piece.size}px`,
                                height: `${piece.size}px`,
                                backgroundColor: piece.color,
                                transform: `rotate(${piece.rotation}deg)`,
                            }}
                        />
                    </div>
                ))}

            {/* Center message/icon */}
            {message && (
                <div className="relative z-10 animate-bounce-in">
                    <div className="bg-card/95 backdrop-blur-sm border-2 border-primary shadow-2xl rounded-2xl p-8 max-w-md mx-4">
                        <div className="flex flex-col items-center gap-4 text-center">
                            {type === "success" && (
                                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center animate-pulse-success">
                                    <CheckCircle2 className="w-10 h-10 text-success" />
                                </div>
                            )}
                            {type === "milestone" && (
                                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-success">
                                    <Trophy className="w-10 h-10 text-primary" />
                                </div>
                            )}
                            {type === "achievement" && (
                                <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center animate-pulse-success">
                                    <Star className="w-10 h-10 text-warning" />
                                </div>
                            )}
                            {type === "confetti" && (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center animate-pulse-success">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                            )}
                            <p className="text-lg font-semibold text-foreground">{message}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Subtle success animation for smaller achievements
 * Shows a brief checkmark animation without confetti
 */
export function SuccessPing({
    show,
    onComplete,
}: {
    show: boolean;
    onComplete?: () => void;
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                onComplete?.();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show && !isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="animate-bounce-in">
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center animate-success-ping">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                </div>
            </div>
        </div>
    );
}

/**
 * Sparkle effect for AI operations and special moments
 */
export function SparkleEffect({
    show,
    onComplete,
    message,
}: {
    show: boolean;
    onComplete?: () => void;
    message?: string;
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

    useEffect(() => {
        if (show) {
            setIsVisible(true);

            // Generate sparkle positions
            const sparklePositions = [];
            for (let i = 0; i < 12; i++) {
                sparklePositions.push({
                    id: i,
                    x: 30 + Math.random() * 40,
                    y: 30 + Math.random() * 40,
                    delay: Math.random() * 0.5,
                });
            }
            setSparkles(sparklePositions);

            const timer = setTimeout(() => {
                setIsVisible(false);
                setSparkles([]);
                onComplete?.();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!show && !isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="relative">
                {sparkles.map((sparkle) => (
                    <div
                        key={sparkle.id}
                        className="absolute animate-ping"
                        style={{
                            left: `${sparkle.x}%`,
                            top: `${sparkle.y}%`,
                            animationDelay: `${sparkle.delay}s`,
                            animationDuration: "1s",
                        }}
                    >
                        <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                ))}
                {message && (
                    <div className="relative z-10 animate-scale-in">
                        <div className="bg-card/95 backdrop-blur-sm border border-primary/20 shadow-xl rounded-xl px-6 py-4">
                            <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                <Zap className="w-4 h-4 text-primary" />
                                {message}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Hook to trigger celebrations programmatically
 */
export function useCelebration() {
    const [celebration, setCelebration] = useState<{
        show: boolean;
        type: "confetti" | "success" | "milestone" | "achievement";
        message?: string;
    }>({
        show: false,
        type: "confetti",
    });

    const celebrate = (
        type: "confetti" | "success" | "milestone" | "achievement" = "confetti",
        message?: string
    ) => {
        setCelebration({ show: true, type, message });
    };

    const handleComplete = () => {
        setCelebration((prev) => ({ ...prev, show: false }));
    };

    return {
        celebration,
        celebrate,
        handleComplete,
    };
}
