'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StickyHeaderInfo {
    title: string;
    icon?: LucideIcon;
    isVisible: boolean;
}

interface StickyHeaderContextType {
    headerInfo: StickyHeaderInfo;
    setHeaderInfo: (info: StickyHeaderInfo) => void;
}

const StickyHeaderContext = createContext<StickyHeaderContextType | undefined>(undefined);

export function StickyHeaderProvider({ children }: { children: ReactNode }) {
    const [headerInfo, setHeaderInfo] = useState<StickyHeaderInfo>({
        title: '',
        icon: undefined,
        isVisible: false
    });

    return (
        <StickyHeaderContext.Provider value={{ headerInfo, setHeaderInfo }}>
            {children}
        </StickyHeaderContext.Provider>
    );
}

export function useStickyHeader() {
    const context = useContext(StickyHeaderContext);
    if (!context) {
        throw new Error('useStickyHeader must be used within StickyHeaderProvider');
    }
    return context;
}
