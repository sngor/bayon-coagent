'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/aws/auth';
import type { Profile } from '@/lib/types/common';
import { toast } from '@/hooks/use-toast';

interface UseProfileDataReturn {
    profile: Partial<Profile>;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => void;
}

const LOADING_TIMEOUT = 10000; // 10 seconds timeout

export function useProfileData(): UseProfileDataReturn {
    const { user, isUserLoading } = useUser();
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        if (isUserLoading) {
            return;
        }

        if (!user?.id) {
            setIsLoading(false);
            setError(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Create a timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Loading took too long. Please check your connection and try again.')), LOADING_TIMEOUT);
            });

            // Race between the actual request and timeout
            const { getProfileAction } = await import('@/app/actions');
            const result = await Promise.race([
                getProfileAction(user.id),
                timeoutPromise
            ]) as { message: string; data?: any; errors: any };

            console.log('Profile load result:', result);

            if (result.message === 'success' && result.data) {
                // Ensure certifications is properly formatted for the form
                const profileData: Partial<Profile> = {
                    ...result.data,
                    certifications: Array.isArray(result.data.certifications)
                        ? result.data.certifications.join(', ')
                        : result.data.certifications || '',
                    yearsOfExperience: result.data.yearsOfExperience?.toString() || ''
                };
                setProfile(profileData);
            } else {
                console.log('No profile data found, using empty profile');
                // Initialize with empty profile if no data found
                const emptyProfile: Partial<Profile> = {
                    name: '',
                    agencyName: '',
                    phone: '',
                    address: '',
                    bio: '',
                    yearsOfExperience: '',
                    licenseNumber: '',
                    website: '',
                    certifications: '',
                    linkedin: '',
                    twitter: '',
                    facebook: '',
                    zillowEmail: '',
                    photoURL: ''
                };
                setProfile(emptyProfile);
            }
        } catch (error) {
            console.warn('Profile loading issue:', error instanceof Error ? error.message : 'Unknown error');
            const errorMessage = error instanceof Error && error.message.includes('took too long')
                ? 'Loading took too long. Please check your connection and try again.'
                : 'Could not load your profile data. Please try refreshing the page.';

            setError(errorMessage);

            // Still set an empty profile so the form is usable
            const emptyProfile: Partial<Profile> = {
                name: '',
                agencyName: '',
                phone: '',
                address: '',
                bio: '',
                yearsOfExperience: '',
                licenseNumber: '',
                website: '',
                certifications: '',
                linkedin: '',
                twitter: '',
                facebook: '',
                zillowEmail: '',
                photoURL: ''
            };
            setProfile(emptyProfile);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, isUserLoading]);

    const updateProfile = useCallback((updates: Partial<Profile>) => {
        setProfile(prev => ({ ...prev, ...updates }));
    }, []);

    const refetch = useCallback(async () => {
        await loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    return {
        profile,
        isLoading,
        error,
        refetch,
        updateProfile
    };
}