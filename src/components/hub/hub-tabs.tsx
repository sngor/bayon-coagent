'use client';

import { usePathname, useRouter } from 'next/navigation';
import { HubTabsProps } from './types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useRef } from 'react';

export function HubTabs({ tabs, activeTab, onChange, variant = 'default' }: HubTabsProps) {
    const pathname = usePathname();
    const router = useRouter();
    const tabsRef = useRef<HTMLDivElement>(null);

    // Determine active tab from pathname if not explicitly provided
    const currentTab = activeTab || tabs.find(tab => pathname.startsWith(tab.href))?.id || tabs[0]?.id;

    const handleTabClick = (tab: typeof tabs[0]) => {
        if (onChange) {
            onChange(tab.id);
        } else {
            router.push(tab.href);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            const prevTab = tabs[index - 1];
            handleTabClick(prevTab);
            // Focus previous tab
            const prevButton = tabsRef.current?.children[index - 1] as HTMLButtonElement;
            prevButton?.focus();
        } else if (e.key === 'ArrowRight' && index < tabs.length - 1) {
            e.preventDefault();
            const nextTab = tabs[index + 1];
            handleTabClick(nextTab);
            // Focus next tab
            const nextButton = tabsRef.current?.children[index + 1] as HTMLButtonElement;
            nextButton?.focus();
        }
    };

    const baseStyles = 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variantStyles = {
        default: {
            tab: 'border-b-2 border-transparent hover:border-muted-foreground/50 data-[active=true]:border-primary data-[active=true]:text-primary',
            container: 'border-b border-border'
        },
        pills: {
            tab: 'rounded-full hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground',
            container: ''
        },
        underline: {
            tab: 'border-b-2 border-transparent hover:text-foreground data-[active=true]:border-primary data-[active=true]:text-foreground',
            container: 'border-b border-border'
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className={cn('flex items-center gap-2 overflow-x-auto scrollbar-hide', styles.container)}>
            <div ref={tabsRef} className="flex items-center gap-2" role="tablist">
                {tabs.map((tab, index) => {
                    const isActive = tab.id === currentTab;
                    const Icon = tab.icon;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive ? 'true' : 'false'}
                            aria-controls={`tabpanel-${tab.id}`}
                            id={`tab-${tab.id}`}
                            tabIndex={isActive ? 0 : -1}
                            data-active={isActive}
                            onClick={() => handleTabClick(tab)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={cn(
                                baseStyles,
                                styles.tab,
                                !isActive && 'text-muted-foreground'
                            )}
                        >
                            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                            <span className="whitespace-nowrap">{tab.label}</span>
                            {tab.badge !== undefined && (
                                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5" aria-label={`${tab.badge} items`}>
                                    {tab.badge}
                                </Badge>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
