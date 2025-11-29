/**
 * Global text animation configuration
 * Controls where typing animations are enabled/disabled
 */

export const textAnimationConfig = {
    // Global setting - disable typing animations by default
    enableTypingAnimations: false,

    // Specific contexts where typing animations are allowed
    allowedContexts: {
        aiChatbot: true,      // AI chatbot responses
        assistant: true,      // AI assistant interface
        onboarding: false,    // Onboarding flows
        notifications: false, // Success/error messages
        general: false,       // General UI components
    },

    // Performance settings
    performance: {
        maxConcurrentAnimations: 1, // Limit simultaneous animations
        reducedMotionRespected: true,
        mobileOptimized: true,
    }
};

/**
 * Check if typing animations should be enabled for a specific context
 */
export function shouldEnableTypingAnimation(context: keyof typeof textAnimationConfig.allowedContexts = 'general'): boolean {
    // Always respect user's reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return false;
    }

    // Check global setting first
    if (!textAnimationConfig.enableTypingAnimations) {
        // Only allow in specifically enabled contexts
        return textAnimationConfig.allowedContexts[context] || false;
    }

    return textAnimationConfig.allowedContexts[context];
}

/**
 * Get optimized typing speed based on context and device
 */
export function getOptimizedTypingSpeed(context: keyof typeof textAnimationConfig.allowedContexts = 'general'): number {
    const baseSpeed = 150; // Base speed in ms

    // Faster on mobile for better UX
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        return baseSpeed * 0.7; // 30% faster on mobile
    }

    // Slower for AI responses to feel more natural
    if (context === 'aiChatbot' || context === 'assistant') {
        return baseSpeed * 1.2; // 20% slower for AI
    }

    return baseSpeed;
}

/**
 * Enable typing animations globally (for testing or special cases)
 */
export function enableTypingAnimations() {
    textAnimationConfig.enableTypingAnimations = true;
}

/**
 * Disable typing animations globally
 */
export function disableTypingAnimations() {
    textAnimationConfig.enableTypingAnimations = false;
}