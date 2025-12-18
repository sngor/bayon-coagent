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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { OnboardingContainer } from '@/components/onboarding';
import {
    LazySkipConfirmationDialog,
} from '@/components/onboarding/lazy-components';
import { useDebouncedCallback, useDebouncedValue } from '@/lib/performance/debounce';
import { useOptimisticSteps } from '@/lib/performance/optimistic-updates';
import { getOptimizedImageProps } from '@/lib/performance/image-optimization';
import { onboardingAnalytics } from '@/services/onboarding/onboarding-analytics';

// Types
interface ProfileData {
    name?: string;
    email?: string;
    bio?: string;
    brokerage?: string;
    [key: string]: unknown;
}

interface ListItem {
    id: string;
    name: string;
}

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
        async (data: ProfileData) => {
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
                <Input
                    type="text"
                    placeholder="Search brokerages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
    const [items, setItems] = useState<ListItem[]>([]);
    const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    const addItem = async (name: string) => {
        const newItem = { id: Date.now().toString(), name };

        // Optimistic update - add immediately
        setItems((prev) => [...prev, newItem]);
        setLoadingItems((prev) => new Set(prev).add(newItem.id));

        try {
            // Actual API call
            await saveItemToServer(newItem);
        } catch (error) {
            // Rollback on error
            setItems((prev) => prev.filter((item) => item.id !== newItem.id));
            toast({
                title: "Error",
                description: "Failed to add item. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoadingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(newItem.id);
                return newSet;
            });
        }
    };

    const removeItem = async (id: string) => {
        // Store for rollback
        const itemToRemove = items.find((item) => item.id === id);

        // Show loading state
        setLoadingItems((prev) => new Set(prev).add(id));

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
            toast({
                title: "Error",
                description: "Failed to remove item. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoadingItems((prev) => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    return (
        <div className="space-y-4">
            <Button type="button" onClick={() => addItem('New Item')}>
                Add Item
            </Button>
            <ul className="space-y-2">
                {items.map((item) => {
                    const isLoading = loadingItems.has(item.id);
                    return (
                        <li key={item.id} className="flex items-center justify-between p-2 border rounded">
                            <span className={isLoading ? "opacity-50" : ""}>{item.name}</span>
                            <Button 
                                type="button" 
                                variant="destructive" 
                                size="sm"
                                disabled={isLoading}
                                onClick={() => removeItem(item.id)}
                            >
                                {isLoading ? "Removing..." : "Remove"}
                            </Button>
                        </li>
                    );
                })}
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
    const [errors, setErrors] = useState<Partial<typeof formData>>({});
    const { toast } = useToast();

    // Validation function
    const validateField = (field: keyof typeof formData, value: string): string | undefined => {
        switch (field) {
            case 'name':
                return value.trim().length < 2 ? 'Name must be at least 2 characters' : undefined;
            case 'email':
                return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Invalid email format' : undefined;
            case 'bio':
                return value.length > 500 ? 'Bio must be less than 500 characters' : undefined;
            default:
                return undefined;
        }
    };

    // Debounced auto-save
    const debouncedSave = useDebouncedCallback(
        async (data: typeof formData) => {
            // Only save if no validation errors
            const hasErrors = Object.values(errors).some(error => error);
            if (!hasErrors) {
                try {
                    await saveFormToServer(data);
                    toast({
                        title: "Saved",
                        description: "Your changes have been saved automatically.",
                    });
                } catch (error) {
                    toast({
                        title: "Error",
                        description: "Failed to save changes. Please try again.",
                        variant: "destructive",
                    });
                }
            }
        },
        1000 // 1 second delay
    );

    const handleChange = (field: keyof typeof formData, value: string) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        
        // Validate field
        const error = validateField(field, value);
        setErrors(prev => ({ ...prev, [field]: error }));
        
        // Only auto-save if no error
        if (!error) {
            debouncedSave(newData);
        }
    };

    return (
        <form className="space-y-4">
            <div>
                <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Name"
                    className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
            </div>
            <div>
                <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Email"
                    className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                    <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
            </div>
            <div>
                <Textarea
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Bio"
                    className={errors.bio ? "border-destructive" : ""}
                />
                {errors.bio && (
                    <p className="text-sm text-destructive mt-1">{errors.bio}</p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                    {formData.bio.length}/500 characters
                </p>
            </div>
        </form>
    );
}

// Mock functions for examples
async function saveProfile(data: ProfileData): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
        throw new Error('Network error');
    }
}

async function navigateToNextStep(): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return 2;
}

async function navigateToPreviousStep(): Promise<number> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return 0;
}

async function saveItemToServer(item: ListItem): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
        throw new Error('Server error');
    }
}

async function deleteItemFromServer(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
        throw new Error('Delete failed');
    }
}

async function saveFormToServer(data: ProfileData): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Simulate occasional failures for testing
    if (Math.random() < 0.1) {
        throw new Error('Save failed');
    }
}
