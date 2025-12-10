/**
 * Performance Optimization Examples
 * 
 * This file demonstrates how to use all performance optimizations together
 * in a real onboarding component.
 * 
 * Requirements: 7.1, 8.5
 */

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { OnboardingContainer } from '@/components/onboarding';
import {
    LazySkipConfirmationDialog,
    LazyProfileForm,
} from '@/components/onboarding/lazy-components';
import { useDebouncedCallback, useDebouncedValue } from '@/lib/performance/debounce';
import { useOptimisticSteps } from '@/lib/performance/optimistic-updates';
import { getOptimizedImageProps } from '@/lib/performance/image-optimization';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';

/**
 * Example: Profile Setup Page with All Optimizations
 */
export function ProfileSetupExample() {
    const [searchTerm, setSearchTerm] = useState('');
    const [showSkipDialog, setShowSkipDialog] = useState(false);
    const userId = 'example-user-id';
    const flowType = 'user';

    // 1. OPTIMISTIC UPDATES - Step navigation with immediate feedback
    const { currentStep, nextStep, previousStep } = useOptimisticSteps(6, 1);

    // 2. DEBOUNCING - Search input with 300ms delay
    const debouncedSearch = useDebouncedValue(searchTerm, 300);

    // 3. DEBOUNCING - Auto-save with 500ms delay
    const debouncedSave = useDebouncedCallback(
        async (data: any) => {
            console.log('Auto-saving profile:', data);
            // Save to server
            await saveProfile(data);
        },
        500
    );

    // 4. ANALYTICS BATCHING - Events are automatically batched
    const handleStepComplete = useCallback(async () => {
        // Track completion (batched automatically)
        await onboardingAnalytics.trackStepCompleted(
            userId,
            flowType,
            'profile-setup'
        );

        // Navigate with optimistic update
        await nextStep(async () => {
            // Actual navigation
            return await navigateToNextStep();
        });
    }, [userId, flowType, nextStep]);

    const handleSkip = useCallback(async () => {
        // Track skip (batched automatically)
        await onboardingAnalytics.trackStepSkipped(
            userId,
            flowType,
            'profile-setup'
        );

        setShowSkipDialog(false);
    }, [userId, flowType]);

    return (
        <OnboardingContainer
            currentStep={currentStep}
            totalSteps={6}
            stepId="profile-setup"
            title="Set Up Your Profile"
            description="Tell us about yourself so we can personalize your experience"
            onNext={handleStepComplete}
            onSkip={() => setShowSkipDialog(true)}
            onBack={async () => {
                await previousStep(async () => {
                    return await navigateToPreviousStep();
                });
            }}
        >
            {/* 5. IMAGE OPTIMIZATION - Optimized hero image */}
            <div className="mb-6">
                <Image
                    src="/images/onboarding/profile-setup.png"
                    alt="Profile setup illustration"
                    width={800}
                    height={600}
                    priority
                    quality={85}
                    className="rounded-lg"
                />
            </div>

            {/* Search with Debouncing */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search brokerages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                />
                <p className="text-sm text-muted-foreground mt-1">
                    Searching for: {debouncedSearch}
                </p>
            </div>

            {/* Lazy-Loaded Profile Form */}
            {/* Note: LazyProfileForm props depend on actual implementation */}
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Profile form would be rendered here with lazy loading
                </p>
            </div>

            {/* Lazy-Loaded Skip Dialog */}
            {showSkipDialog && (
                <LazySkipConfirmationDialog
                    open={showSkipDialog}
                    onOpenChange={setShowSkipDialog}
                    onConfirm={handleSkip}
                />
            )}
        </OnboardingContainer>
    );
}

/**
 * Example: List with Optimistic Updates
 */
export function OptimisticListExample() {
    const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);

    const addItem = async (name: string) => {
        const newItem = { id: Date.now().toString(), name };

        // Optimistic update - add immediately
        setItems((prev) => [...prev, newItem]);

        try {
            // Actual API call
            await saveItemToServer(newItem);
        } catch (error) {
            // Rollback on error
            setItems((prev) => prev.filter((item) => item.id !== newItem.id));
            console.error('Failed to add item:', error);
        }
    };

    const removeItem = async (id: string) => {
        // Store for rollback
        const itemToRemove = items.find((item) => item.id === id);

        // Optimistic update - remove immediately
        setItems((prev) => prev.filter((item) => item.id !== id));

        try {
            // Actual API call
            await deleteItemFromServer(id);
        } catch (error) {
            // Rollback on error
            if (itemToRemove) {
                setItems((prev) => [...prev, itemToRemove]);
            }
            console.error('Failed to remove item:', error);
        }
    };

    return (
        <div>
            <button onClick={() => addItem('New Item')}>
                Add Item
            </button>
            <ul>
                {items.map((item) => (
                    <li key={item.id}>
                        {item.name}
                        <button onClick={() => removeItem(item.id)}>
                            Remove
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/**
 * Example: Form with Debounced Auto-Save
 */
export function DebouncedFormExample() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: '',
    });

    // Debounced auto-save
    const debouncedSave = useDebouncedCallback(
        async (data: typeof formData) => {
            console.log('Auto-saving form:', data);
            await saveFormToServer(data);
        },
        1000 // 1 second delay
    );

    const handleChange = (field: keyof typeof formData, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        debouncedSave(newData);
    };

    return (
        <form>
            <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Name"
            />
            <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email"
            />
            <textarea
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Bio"
            />
        </form>
    );
}

// Mock functions for examples
async function saveProfile(data: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function navigateToNextStep(): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return 2;
}

async function navigateToPreviousStep(): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return 0;
}

async function saveItemToServer(item: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
}

async function deleteItemFromServer(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
}

async function saveFormToServer(data: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
}
