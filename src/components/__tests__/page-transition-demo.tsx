/**
 * Page Transition Demo
 * 
 * This file demonstrates the page transition feature implementation.
 * The PageTransition component is already integrated into the app layout,
 * so all page navigations automatically have smooth transitions.
 * 
 * To see it in action:
 * 1. Run the development server: npm run dev
 * 2. Navigate to any authenticated page
 * 3. Click between different pages in the sidebar
 * 4. Observe the smooth fade transitions
 */

import { PageTransition } from '../page-transition';

// Example 1: Basic usage (already implemented in app layout)
export function BasicPageTransitionExample() {
    return (
        <PageTransition>
            <div className="space-y-6">
                <h1 className="font-headline text-3xl font-bold">Page Content</h1>
                <p>This content will fade in smoothly when the page loads.</p>
            </div>
        </PageTransition>
    );
}

// Example 2: With complex content
export function ComplexPageTransitionExample() {
    return (
        <PageTransition>
            <div className="space-y-8">
                <header>
                    <h1 className="font-headline text-4xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back!</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Cards will all fade in together */}
                    <div className="rounded-lg border p-6">
                        <h3 className="font-headline font-semibold">Metric 1</h3>
                        <p className="text-2xl font-bold">1,234</p>
                    </div>
                    <div className="rounded-lg border p-6">
                        <h3 className="font-headline font-semibold">Metric 2</h3>
                        <p className="text-2xl font-bold">5,678</p>
                    </div>
                    <div className="rounded-lg border p-6">
                        <h3 className="font-headline font-semibold">Metric 3</h3>
                        <p className="text-2xl font-bold">9,012</p>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
}

// Example 3: Testing reduced motion
export function ReducedMotionExample() {
    return (
        <div className="space-y-4 p-6">
            <h2 className="font-headline text-2xl font-bold">Testing Reduced Motion</h2>
            <div className="space-y-2">
                <p>To test reduced motion preferences:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Enable reduced motion in your OS settings</li>
                    <li>Navigate between pages</li>
                    <li>Verify animations are instant (no fade effects)</li>
                </ol>
            </div>

            <div className="rounded-lg border p-4 bg-muted">
                <p className="text-sm">
                    <strong>Note:</strong> The PageTransition component automatically
                    respects the user's reduced motion preference through CSS media queries.
                    No JavaScript changes are needed.
                </p>
            </div>
        </div>
    );
}

/**
 * Animation Classes Available
 * 
 * The following animation classes are available for use:
 * - animate-fade-in: Simple fade in (300ms)
 * - animate-fade-out: Simple fade out (200ms)
 * - animate-page-transition: Fade in with subtle slide up (300ms)
 * - animate-fade-in-up: Fade in with larger slide up (400ms)
 * 
 * All animations respect prefers-reduced-motion and will be disabled
 * when the user has that preference enabled.
 */

export const animationExamples = {
    fadeIn: 'animate-fade-in',
    fadeOut: 'animate-fade-out',
    pageTransition: 'animate-page-transition',
    fadeInUp: 'animate-fade-in-up',
};
