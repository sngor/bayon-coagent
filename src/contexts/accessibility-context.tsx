'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@/aws/auth';

interface AccessibilityPreferences {
    highContrastBorders: boolean;
}

interface AccessibilityContextType {
    preferences: AccessibilityPreferences;
    updatePreference: (key: keyof AccessibilityPreferences, value: boolean) => Promise<void>;
    isLoading: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const [preferences, setPreferences] = useState<AccessibilityPreferences>({
        highContrastBorders: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load preferences from user profile
    useEffect(() => {
        async function loadPreferences() {
            if (!user) {
                setIsLoading(false);
                return;
            }

            try {
                const { getProfileAction } = await import('@/app/actions');
                const result = await getProfileAction(user.id);

                if (result.data?.Data?.preferences) {
                    const userPreferences = result.data.Data.preferences;
                    setPreferences({
                        highContrastBorders: userPreferences.highContrastBorders || false,
                    });
                }
            } catch (error) {
                console.error('Failed to load accessibility preferences:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadPreferences();
    }, [user]);

    // Apply preferences to document
    useEffect(() => {
        const htmlElement = document.documentElement;

        const isDark = htmlElement.classList.contains('dark');
        const borderColor = isDark ? 'white' : 'black';

        // Always remove first to ensure clean state
        htmlElement.classList.remove('high-contrast-borders');
        htmlElement.style.removeProperty('--accessibility-border-override');

        if (preferences.highContrastBorders) {
            // Set the CSS custom property and add class
            htmlElement.style.setProperty('--accessibility-border-override', borderColor);
            htmlElement.classList.add('high-contrast-borders');
            console.log('✅ ENABLED: High contrast borders with color:', borderColor);
            console.log('   Class present:', htmlElement.classList.contains('high-contrast-borders'));
            console.log('   CSS property:', htmlElement.style.getPropertyValue('--accessibility-border-override'));
        } else {
            console.log('❌ DISABLED: High contrast borders removed');
            console.log('   Class present:', htmlElement.classList.contains('high-contrast-borders'));
            console.log('   CSS property:', htmlElement.style.getPropertyValue('--accessibility-border-override'));
        }

        // Trigger a custom event to notify components of the change
        window.dispatchEvent(new CustomEvent('accessibilityPreferenceChanged', {
            detail: { highContrastBorders: preferences.highContrastBorders }
        }));
    }, [preferences.highContrastBorders]);

    const updatePreference = async (key: keyof AccessibilityPreferences, value: boolean) => {
        if (!user) return;

        // Optimistically update the UI
        setPreferences(prev => ({ ...prev, [key]: value }));

        try {
            const { saveProfileAction, getProfileAction } = await import('@/app/actions');

            // Get existing profile data
            const existingProfileResult = await getProfileAction(user.id);
            const existingProfileData = existingProfileResult.data?.Data || {};

            // Update preferences
            const updatedProfile = {
                ...existingProfileData,
                preferences: {
                    ...existingProfileData.preferences,
                    [key]: value
                }
            };

            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('profile', JSON.stringify(updatedProfile));

            const result = await saveProfileAction({}, formData);

            if (result.message !== 'success') {
                // Revert on failure
                setPreferences(prev => ({ ...prev, [key]: !value }));
                throw new Error('Failed to save preference');
            }
        } catch (error) {
            // Revert on error
            setPreferences(prev => ({ ...prev, [key]: !value }));
            throw error;
        }
    };

    return (
        <AccessibilityContext.Provider value={{ preferences, updatePreference, isLoading }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility() {
    const context = useContext(AccessibilityContext);
    if (context === undefined) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }
    return context;
}