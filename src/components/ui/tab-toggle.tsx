'use client';

import * as React from 'react';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { cn } from '@/lib/utils';

export interface TabToggleItem {
    value: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: number | string;
}

export interface TabToggleProps {
    tabs: TabToggleItem[];
    defaultValue: string;
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

export function TabToggle({
    tabs,
    defaultValue,
    value,
    onValueChange,
    children,
    className
}: TabToggleProps) {
    return (
        <Tabs
            defaultValue={defaultValue}
            value={value}
            onValueChange={onValueChange}
            className={cn("space-y-6", className)}
        >
            <TabsList>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {Icon && <Icon className="h-4 w-4" />}
                            <span className="whitespace-nowrap">{tab.label}</span>
                            {tab.badge !== undefined && (
                                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                    {tab.badge}
                                </span>
                            )}
                        </TabsTrigger>
                    );
                })}
            </TabsList>
            {children}
        </Tabs>
    );
}

export { TabsContent as TabToggleContent };