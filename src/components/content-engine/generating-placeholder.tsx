/**
 * Generating Content Placeholder Component
 * Extracted from content-engine page for reusability
 */

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const GENERATING_MESSAGES = [
    'Consulting with our digital marketing experts...',
    'Brewing up some fresh content ideas...',
    'Analyzing market trends for the perfect angle...',
    'Assembling your content, pixel by pixel...',
    'Teaching the AI about curb appeal...',
    'Warming up the creativity engines...',
    'Finding the most persuasive adjectives...',
    'Checking for SEO best practices...',
];

export function GeneratingContentPlaceholder() {
    const [currentMessage, setCurrentMessage] = useState(GENERATING_MESSAGES[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessage(prevMessage => {
                const currentIndex = GENERATING_MESSAGES.indexOf(prevMessage);
                const nextIndex = (currentIndex + 1) % GENERATING_MESSAGES.length;
                return GENERATING_MESSAGES[nextIndex];
            });
        }, 2500); // Change message every 2.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-12 transition-all duration-300">
            <div className="relative mb-8">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 w-20 h-20 -left-2 -top-2 border-4 border-primary/10 rounded-full animate-ping" />
                {/* Middle rotating ring */}
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                {/* Inner spinning ring */}
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                {/* Sparkles icon with pulse */}
                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 text-primary animate-pulse" />
                {/* Floating sparkles */}
                <div className="absolute -top-2 -right-2 w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                <div className="absolute top-1/2 -right-3 w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>
            <div className="space-y-3 max-w-md">
                <p className="font-semibold text-lg animate-pulse bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    {currentMessage}
                </p>
                <p className="text-sm">This may take a few moments.</p>
                <div className="flex justify-center gap-1 mt-4">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
            </div>
        </div>
    );
}