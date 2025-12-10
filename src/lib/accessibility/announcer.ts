/**
 * Screen Reader Announcer Utility
 * 
 * Provides utilities for announcing dynamic content changes to screen readers.
 * Uses ARIA live regions to communicate updates without disrupting the user's flow.
 * 
 * Requirements: 7.1, 7.3
 */

export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Announces a message to screen readers using ARIA live regions
 * 
 * @param message - The message to announce
 * @param priority - The priority level ('polite' or 'assertive')
 */
export function announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    // Find or create the live region
    let liveRegion = document.getElementById(`aria-live-${priority}`);

    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = `aria-live-${priority}`;
        liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
        liveRegion.setAttribute('aria-live', priority);
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }

    // Clear previous message
    liveRegion.textContent = '';

    // Set new message after a brief delay to ensure screen readers pick it up
    setTimeout(() => {
        if (liveRegion) {
            liveRegion.textContent = message;
        }
    }, 100);
}

/**
 * Announces progress updates to screen readers
 * 
 * @param currentStep - The current step number
 * @param totalSteps - The total number of steps
 * @param stepName - Optional name of the current step
 */
export function announceProgress(
    currentStep: number,
    totalSteps: number,
    stepName?: string
): void {
    const percentage = Math.round((currentStep / totalSteps) * 100);
    const message = stepName
        ? `Step ${currentStep} of ${totalSteps}: ${stepName}. ${percentage}% complete.`
        : `Step ${currentStep} of ${totalSteps}. ${percentage}% complete.`;

    announce(message, 'polite');
}

/**
 * Announces navigation events to screen readers
 * 
 * @param action - The navigation action (e.g., 'next', 'back', 'skip')
 * @param destination - Optional destination description
 */
export function announceNavigation(action: string, destination?: string): void {
    const message = destination
        ? `Navigating ${action} to ${destination}`
        : `Navigating ${action}`;

    announce(message, 'polite');
}

/**
 * Announces errors to screen readers with assertive priority
 * 
 * @param error - The error message
 */
export function announceError(error: string): void {
    announce(`Error: ${error}`, 'assertive');
}

/**
 * Announces success messages to screen readers
 * 
 * @param message - The success message
 */
export function announceSuccess(message: string): void {
    announce(`Success: ${message}`, 'polite');
}
