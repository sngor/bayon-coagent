'use client';

import { useRef, useEffect } from 'react';
import { useStickyHeader } from '@/hooks/use-sticky-header';
import { LucideIcon } from 'lucide-react';

interface UseAdminStickyHeaderProps {
    title: string;
    icon: LucideIcon;
}

export function useAdminStickyHeader({ title, icon }: UseAdminStickyHeaderProps) {
    const headerRef = useRef<HTMLDivElement>(null);
    const { setHeaderInfo } = useStickyHeader();

    // Use IntersectionObserver to detect when header is covered
    useEffect(() => {
        if (!headerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                const isCovered = !entry.isIntersecting;

                setHeaderInfo({
                    title,
                    icon,
                    isVisible: isCovered
                });
            },
            {
                rootMargin: '-20px 0px 0px 0px',
                threshold: 0
            }
        );

        observer.observe(headerRef.current);
        return () => observer.disconnect();
    }, [title, icon, setHeaderInfo]);

    // Clear sticky header when component unmounts
    useEffect(() => {
        return () => {
            setHeaderInfo({ title: '', icon: undefined, isVisible: false });
        };
    }, [setHeaderInfo]);

    return headerRef;
}