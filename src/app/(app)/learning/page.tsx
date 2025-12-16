'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LearningRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to lessons as the default learning tab
        router.replace('/learning/lessons');
    }, [router]);

    return null;
}