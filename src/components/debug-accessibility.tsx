'use client';

import { useEffect, useState } from 'react';
import { useAccessibility } from '@/contexts/accessibility-context';

export function DebugAccessibility() {
    const { preferences } = useAccessibility();
    const [hasClass, setHasClass] = useState(false);

    useEffect(() => {
        const checkClass = () => {
            const hasHighContrastClass = document.documentElement.classList.contains('high-contrast-borders');
            setHasClass(hasHighContrastClass);
            console.log('Class check:', hasHighContrastClass, 'Preference:', preferences.highContrastBorders);
        };

        checkClass();

        // Check every second to monitor changes
        const interval = setInterval(checkClass, 1000);

        return () => clearInterval(interval);
    }, [preferences.highContrastBorders]);

    return (
        <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50">
            <div>Preference: {preferences.highContrastBorders ? 'ON' : 'OFF'}</div>
            <div>HTML Class: {hasClass ? 'PRESENT' : 'MISSING'}</div>
            <div className="border border-gray-300 p-2 mt-2">
                Test Border Element
            </div>
        </div>
    );
}