'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export interface CompletionCelebrationProps {
    /** User's first name for personalization */
    userName?: string;
    /** Whether to show confetti animation */
    showConfetti?: boolean;
    /** Callback when animation completes */
    onAnimationComplete?: () => void;
}

/**
 * CompletionCelebration Component
 * 
 * Displays a celebration animation when user completes onboarding.
 * Features:
 * - Confetti animation using canvas
 * - Success checkmark with scale animation
 * - Fade-in welcome message
 * - Mobile-optimized animations
 * 
 * Requirements: 6.4, 9.5
 */
export function CompletionCelebration({
    userName,
    showConfetti = true,
    onAnimationComplete,
}: CompletionCelebrationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isMobile = useIsMobile();
    const [animationComplete, setAnimationComplete] = useState(false);

    // Confetti animation
    useEffect(() => {
        if (!showConfetti || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const updateCanvasSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);

        // Confetti particle class
        class Confetti {
            x: number;
            y: number;
            size: number;
            speedY: number;
            speedX: number;
            color: string;
            rotation: number;
            rotationSpeed: number;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = -10;
                this.size = Math.random() * 8 + 4;
                this.speedY = Math.random() * 3 + 2;
                this.speedX = Math.random() * 2 - 1;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 10 - 5;

                // Color palette
                const colors = [
                    '#FF6B6B', // Red
                    '#4ECDC4', // Teal
                    '#45B7D1', // Blue
                    '#FFA07A', // Orange
                    '#98D8C8', // Mint
                    '#F7DC6F', // Yellow
                    '#BB8FCE', // Purple
                ];
                this.color = colors[Math.floor(Math.random() * colors.length)];
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.rotation += this.rotationSpeed;
                this.speedY += 0.1; // Gravity
            }

            draw(ctx: CanvasRenderingContext2D) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        // Create confetti particles
        const confettiCount = isMobile ? 50 : 100;
        const confettiArray: Confetti[] = [];

        // Stagger confetti creation
        let createdCount = 0;
        const createInterval = setInterval(() => {
            if (createdCount < confettiCount) {
                confettiArray.push(new Confetti());
                createdCount++;
            } else {
                clearInterval(createInterval);
            }
        }, 30);

        // Animation loop
        let animationId: number;
        let startTime = Date.now();
        const duration = 4000; // 4 seconds

        const animate = () => {
            const elapsed = Date.now() - startTime;

            if (elapsed > duration) {
                // Fade out
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setAnimationComplete(true);
                onAnimationComplete?.();
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            confettiArray.forEach((confetti, index) => {
                confetti.update();
                confetti.draw(ctx);

                // Remove confetti that's off screen
                if (confetti.y > canvas.height) {
                    confettiArray.splice(index, 1);
                }
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            clearInterval(createInterval);
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [showConfetti, isMobile, onAnimationComplete]);

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Confetti Canvas */}
            {showConfetti && (
                <canvas
                    ref={canvasRef}
                    className="fixed inset-0 pointer-events-none z-50"
                    aria-hidden="true"
                />
            )}

            {/* Celebration Content */}
            <div className="relative z-10 text-center space-y-6 sm:space-y-8 px-4">
                {/* Success Icon with Animation */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2,
                    }}
                    className="flex justify-center"
                >
                    <div className="relative">
                        <CheckCircle2
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 text-green-500"
                            strokeWidth={2}
                        />
                        {/* Sparkle effect */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, duration: 0.3 }}
                            className="absolute -top-2 -right-2"
                        >
                            <Sparkles className="w-8 h-8 text-yellow-400" />
                        </motion.div>
                    </div>
                </motion.div>

                {/* Success Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="space-y-3 sm:space-y-4"
                >
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline tracking-tight">
                        You're All Set{userName ? `, ${userName}` : ''}! 🎉
                    </h1>
                    <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Welcome to Bayon Coagent. Let's start building your success story.
                    </p>
                </motion.div>

                {/* Additional Info */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    className="text-sm sm:text-base text-muted-foreground"
                >
                    <p>Redirecting to your dashboard...</p>
                </motion.div>

                {/* Loading Indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="flex justify-center"
                >
                    <div className="flex space-x-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                            className="w-2 h-2 bg-primary rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                            className="w-2 h-2 bg-primary rounded-full"
                        />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                            className="w-2 h-2 bg-primary rounded-full"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
