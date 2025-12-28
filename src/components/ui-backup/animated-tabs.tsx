'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils/common';

const AnimatedTabs = TabsPrimitive.Root;

const AnimatedTabsList = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
    const [indicatorStyle, setIndicatorStyle] = React.useState({ left: 0, width: 0 });
    const tabsRef = React.useRef<HTMLDivElement>(null);
    const observerRef = React.useRef<MutationObserver | null>(null);

    const updateIndicator = React.useCallback(() => {
        if (tabsRef.current) {
            const activeTab = tabsRef.current.querySelector('[data-state="active"]') as HTMLElement;
            if (activeTab) {
                const containerRect = tabsRef.current.getBoundingClientRect();
                const tabRect = activeTab.getBoundingClientRect();
                const left = tabRect.left - containerRect.left;
                setIndicatorStyle({ left, width: tabRect.width });
            }
        }
    }, []);

    React.useEffect(() => {
        updateIndicator();

        // Watch for attribute changes on child elements
        if (tabsRef.current) {
            observerRef.current = new MutationObserver(() => {
                updateIndicator();
            });

            observerRef.current.observe(tabsRef.current, {
                attributes: true,
                attributeFilter: ['data-state'],
                subtree: true,
            });
        }

        // Update on resize
        window.addEventListener('resize', updateIndicator);

        // Small delay to ensure DOM is ready
        const timer = setTimeout(updateIndicator, 100);

        return () => {
            window.removeEventListener('resize', updateIndicator);
            observerRef.current?.disconnect();
            clearTimeout(timer);
        };
    }, [updateIndicator]);

    return (
        <TabsPrimitive.List
            ref={tabsRef}
            className={cn(
                'relative inline-flex h-auto w-fit justify-start gap-1.5 rounded-lg bg-muted border border-border/50 p-1.5 overflow-x-auto',
                className
            )}
            style={{ boxShadow: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)' }}
            {...props}
        >
            {/* Animated indicator */}
            {indicatorStyle.width > 0 && (
                <div
                    className="absolute top-1.5 bottom-1.5 rounded-md bg-background shadow-md transition-all duration-300 ease-out pointer-events-none"
                    style={{
                        left: `${indicatorStyle.left}px`,
                        width: `${indicatorStyle.width}px`,
                    }}
                />
            )}
            {children}
        </TabsPrimitive.List>
    );
});
AnimatedTabsList.displayName = 'AnimatedTabsList';

const AnimatedTabsTrigger = React.forwardRef<
    React.ElementRef<typeof TabsPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            'relative z-10 flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors',
            'hover:text-foreground',
            'data-[state=active]:text-foreground data-[state=active]:font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            'min-h-[44px] touch-manipulation',
            className
        )}
        {...props}
    />
));
AnimatedTabsTrigger.displayName = 'AnimatedTabsTrigger';

const AnimatedTabsContent = TabsPrimitive.Content;

export { AnimatedTabs, AnimatedTabsList, AnimatedTabsTrigger, AnimatedTabsContent };
