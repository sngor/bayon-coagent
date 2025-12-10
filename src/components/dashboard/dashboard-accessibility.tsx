import { ReactNode } from 'react';

interface DashboardSectionWrapperProps {
    children: ReactNode;
    title: string;
    description?: string;
    className?: string;
}

export function DashboardSectionWrapper({
    children,
    title,
    description,
    className
}: DashboardSectionWrapperProps) {
    return (
        <section
            className={className}
            role="region"
            aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}
            aria-describedby={description ? `${title.toLowerCase().replace(/\s+/g, '-')}-description` : undefined}
        >
            <div className="sr-only">
                <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}>
                    {title}
                </h2>
                {description && (
                    <p id={`${title.toLowerCase().replace(/\s+/g, '-')}-description`}>
                        {description}
                    </p>
                )}
            </div>
            {children}
        </section>
    );
}

// Skip link for keyboard navigation
export function DashboardSkipLinks() {
    return (
        <div className="sr-only focus-within:not-sr-only">
            <a
                href="#quick-actions"
                className="absolute top-4 left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
                Skip to Quick Actions
            </a>
            <a
                href="#performance-overview"
                className="absolute top-4 left-32 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
                Skip to Performance Overview
            </a>
        </div>
    );
}

// Keyboard navigation helper
export function enhanceKeyboardNavigation() {
    // Add keyboard shortcuts for common dashboard actions
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    document.getElementById('quick-actions')?.focus();
                    break;
                case '2':
                    event.preventDefault();
                    document.getElementById('performance-overview')?.focus();
                    break;
                case '3':
                    event.preventDefault();
                    document.getElementById('priority-actions')?.focus();
                    break;
            }
        }
    };

    return { handleKeyDown };
}