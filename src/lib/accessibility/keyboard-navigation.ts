/**
 * Keyboard Navigation Utilities
 * 
 * Provides utilities for implementing keyboard navigation patterns.
 * Supports Tab, Enter, Escape, and Arrow key navigation.
 * 
 * Requirements: 7.1, 7.3
 */

export type KeyboardKey =
    | 'Tab'
    | 'Enter'
    | 'Escape'
    | 'ArrowUp'
    | 'ArrowDown'
    | 'ArrowLeft'
    | 'ArrowRight'
    | 'Space';

export interface KeyboardHandler {
    key: KeyboardKey;
    handler: (event: KeyboardEvent) => void;
    preventDefault?: boolean;
}

/**
 * Creates a keyboard event handler that maps keys to actions
 * 
 * @param handlers - Array of keyboard handlers
 * @returns A keyboard event handler function
 */
export function createKeyboardHandler(handlers: KeyboardHandler[]) {
    return (event: KeyboardEvent) => {
        const handler = handlers.find(h => h.key === event.key);

        if (handler) {
            if (handler.preventDefault) {
                event.preventDefault();
            }
            handler.handler(event);
        }
    };
}

/**
 * Focuses the first focusable element within a container
 * 
 * @param container - The container element
 */
export function focusFirstElement(container: HTMLElement): void {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

/**
 * Focuses the last focusable element within a container
 * 
 * @param container - The container element
 */
export function focusLastElement(container: HTMLElement): void {
    const focusableElements = getFocusableElements(container);
    if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1].focus();
    }
}

/**
 * Gets all focusable elements within a container
 * 
 * @param container - The container element
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Traps focus within a container (useful for modals)
 * 
 * @param container - The container element
 * @returns A cleanup function to remove the trap
 */
export function trapFocus(container: HTMLElement): () => void {
    const focusableElements = getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab') return;

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

    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
        container.removeEventListener('keydown', handleKeyDown);
    };
}

/**
 * Handles arrow key navigation for a list of items
 * 
 * @param event - The keyboard event
 * @param currentIndex - The current focused item index
 * @param totalItems - The total number of items
 * @param onNavigate - Callback when navigation occurs
 * @param orientation - The orientation of the list ('vertical' or 'horizontal')
 */
export function handleArrowNavigation(
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (newIndex: number) => void,
    orientation: 'vertical' | 'horizontal' = 'vertical'
): void {
    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    if (event.key === nextKey) {
        event.preventDefault();
        const newIndex = (currentIndex + 1) % totalItems;
        onNavigate(newIndex);
    } else if (event.key === prevKey) {
        event.preventDefault();
        const newIndex = (currentIndex - 1 + totalItems) % totalItems;
        onNavigate(newIndex);
    }
}

/**
 * Creates a roving tabindex manager for a list of items
 * Implements the roving tabindex pattern for keyboard navigation
 * 
 * @param items - Array of item elements
 * @param currentIndex - The current focused item index
 */
export function updateRovingTabindex(items: HTMLElement[], currentIndex: number): void {
    items.forEach((item, index) => {
        if (index === currentIndex) {
            item.setAttribute('tabindex', '0');
            item.focus();
        } else {
            item.setAttribute('tabindex', '-1');
        }
    });
}
