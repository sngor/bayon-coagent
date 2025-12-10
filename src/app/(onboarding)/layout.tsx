'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth/use-user';
import { SessionLoading } from '@/components/session-loading';
import { SubtleGradientMesh } from '@/components/ui/gradient-mesh';
import dynamic from 'next/dynamic';
import '@/styles/onboarding-mobile.css';

// Lazy load the resume banner (only shown conditionally)
const LazyResumeBanner = dynamic(
    () => import('@/components/onboarding/resume-banner').then((mod) => ({ default: mod.ResumeBanner })),
    {
        loading: () => null,
        ssr: false,
    }
);

/**
 * Onboarding Layout
 * 
 * Provides a minimal layout for the onboarding flow without the main app sidebar.
 * Handles authentication checks and redirects unauthenticated users to login.
 * Includes mobile-first responsive optimizations and code splitting.
 * 
 * Requirements: 7.1, 7.4
 */
export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [isUserLoading, user, router]);

    if (isUserLoading || !user || !isMounted) {
        return <SessionLoading />;
    }

    return (
        <SubtleGradientMesh>
            <div className="min-h-screen w-full prevent-overscroll">
                <Suspense fallback={null}>
                    {children}
                </Suspense>

                {/* ARIA Live Regions for screen reader announcements */}
                <div
                    id="aria-live-polite"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                />
                <div
                    id="aria-live-assertive"
                    role="alert"
                    aria-live="assertive"
                    aria-atomic="true"
                    className="sr-only"
                />
            </div>
        </SubtleGradientMesh>
    );
}
