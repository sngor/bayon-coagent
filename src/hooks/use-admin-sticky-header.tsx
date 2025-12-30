'use client';

import { useRef, useEffect } from 'react';
import { useStickyHeader } from '@/hooks/use-sticky-header';

interface UseAdminStickyHeaderProps {
    title: string;
}

export function useAdminStickyHeader({ title }: UseAdminStickyHeaderProps) {
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
    }, [title, setHeaderInfo]);

    // Clear sticky header when component unmounts
    useEffect(() => {
        return () => {
            setHeaderInfo({ title: '', isVisible: false });
        };
    }, [setHeaderInfo]);

    return headerRef;
}