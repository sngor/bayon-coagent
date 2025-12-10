/**
 * Focus Management Utilities
 * 
 * Provides utilities for managing focus during transitions and interactions.
 * Ensures focus is properly restored and managed for accessibility.
 * 
 * Requirements: 7.1, 7.3
 */

/**
 * Stores the currently focused element
 */
let previouslyFocusedElement: HTMLElement | null = null;

/**
 * Saves the currently focused element
 */
export function saveFocus(): void {
    previouslyFocusedElement = document.activeElement as HTMLElement;
}

/**
 * Restores focus to the previously focused element
 */
export function restoreFocus(): void {
    if (previouslyFocusedElement && document.body.contains(previouslyFocusedElement)) {
        previouslyFocusedElement.focus();
        previouslyFocusedElement = null;
    }
}

/**
 * Focuses an element with optional delay
 * 
 * @param element - The element to focus
 * @param delay - Optional delay in milliseconds
 */
export function focusElement(element: HTMLElement | null, delay: number = 0): void {
    if (!element) return;

    if (delay > 0) {
        setTimeout(() => {
            element.focus();
        }, delay);
    } else {
        element.focus();
    }
}

/**
 * Focuses an element by selector
 * 
 * @param selector - The CSS selector
 * @param delay - Optional delay in milliseconds
 */
export function focusBySelector(selector: string, delay: number = 0): void {
    const element = document.querySelector<HTMLElement>(selector);
    focusElement(element, delay);
}

/**
 * Manages focus for step transitions
 * Focuses the main content area after a step change
 * 
 * @param stepId - The ID of the new step
 */
export function manageFocusForStepTransition(stepId: string): void {
    // Wait for the transition animation to complete
    setTimeout(() => {
        // Try to focus the main heading without selecting text
        const heading = document.querySelector<HTMLElement>('h1');
        if (heading) {
            // Make heading focusable temporarily
            heading.setAttribute('tabindex', '-1');

            // Focus without selecting text
            heading.focus({ preventScroll: true });

            // Clear any text selection that might have occurred
            if (window.getSelection) {
                window.getSelection()?.removeAllRanges();
            }

            // Remove tabindex after focus
            heading.addEventListener('blur', () => {
                heading.removeAttribute('tabindex');
            }, { once: true });
        } else {
            // Fallback: focus the main content area
            const main = document.querySelector<HTMLElement>('main');
            if (main) {
                main.setAttribute('tabindex', '-1');
                main.focus();
                main.addEventListener('blur', () => {
                    main.removeAttribute('tabindex');
                }, { once: true });
            }
        }
    }, 350); // Match the transition duration
}

/**
 * Creates a focus trap for modal dialogs
 * 
 * @param container - The container element to trap focus within
 * @returns A cleanup function
 */
export function createFocusTrap(container: HTMLElement): () => void {
    // Save the currently focused element
    saveFocus();

    const focusableSelector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusableElements = () => {
        return Array.from(
            container.querySelectorAll<HTMLElement>(focusableSelector)
        );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                event.preventDefault();
                lastElement?.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                event.preventDefault();
                firstElement?.focus();
            }
        }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
        restoreFocus();
    };
}

/**
 * Ensures an element is visible in the viewport
 * Scrolls the element into view if needed
 * 
 * @param element - The element to make visible
 * @param options - Scroll options
 */
export function ensureVisible(
    element: HTMLElement,
    options: ScrollIntoViewOptions = { behavior: 'smooth', block: 'nearest' }
): void {
    element.scrollIntoView(options);
}
