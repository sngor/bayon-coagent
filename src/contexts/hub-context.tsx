'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BreadcrumbItem } from '@/components/hub/types';

interface HubContextValue {
    currentHub: string;
    currentTab: string;
    setHub: (hub: string) => void;
    setTab: (tab: string) => void;
    breadcrumbs: BreadcrumbItem[];
    setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

const HubContext = createContext<HubContextValue | undefined>(undefined);

export function HubProvider({ children }: { children: ReactNode }) {
    const [currentHub, setCurrentHub] = useState<string>('');
    const [currentTab, setCurrentTab] = useState<string>('');
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

    const setHub = useCallback((hub: string) => {
        setCurrentHub(hub);
    }, []);

    const setTab = useCallback((tab: string) => {
        setCurrentTab(tab);
    }, []);

    const updateBreadcrumbs = useCallback((items: BreadcrumbItem[]) => {
        setBreadcrumbs(items);
    }, []);

    return (
        <HubContext.Provider
            value={{
                currentHub,
                currentTab,
                setHub,
                setTab,
                breadcrumbs,
                setBreadcrumbs: updateBreadcrumbs,
            }}
        >
            {children}
        </HubContext.Provider>
    );
}

export function useHub() {
    const context = useContext(HubContext);
    if (context === undefined) {
        throw new Error('useHub must be used within a HubProvider');
    }
    return context;
}
