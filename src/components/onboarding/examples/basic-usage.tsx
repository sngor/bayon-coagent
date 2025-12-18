/**
 * Onboarding Components - Usage Examples
 * 
 * This file demonstrates various ways to use the onboarding components.
 * Copy and adapt these examples for your onboarding steps.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingContainer } from '../onboarding-container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * Example 1: Simple Welcome Step
 * 
 * Basic onboarding step with just content and navigation.
 */
export function WelcomeStepExample() {
    const router = useRouter();

    return (
        <OnboardingContainer
            currentStep={1}
            totalSteps={6}
            stepId="welcome"
            title="Welcome to Bayon Coagent"
            description="Your AI-powered success platform for real estate"
            onNext={() => router.push('/onboarding/profile')}
            onSkip={() => router.push('/dashboard')}
            nextLabel="Get Started"
        >
            <div className="space-y-6">
                <p className="text-lg text-center">
                    Let's get you set up in just a few minutes.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-2">Create Content</h3>
                            <p className="text-sm text-muted-foreground">
                                Generate blog posts, social media, and listings with AI
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-2">Build Your Brand</h3>
                            <p className="text-sm text-muted-foreground">
                                Own your market position and outshine competitors
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </OnboardingContainer>
    );
}

/**
 * Example 2: Form Step with Validation
 * 
 * Onboarding step with form submission and loading state.
 */
export function ProfileStepExample() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        brokerage: '',
    });

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Save profile data
            // Navigate to next step
            router.push('/onboarding/tour');
        } catch (error) {
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = formData.firstName && formData.lastName && formData.brokerage;

    return (
        <OnboardingContainer
            currentStep={2}
            totalSteps={6}
            stepId="profile"
            title="Set Up Your Profile"
            description="Tell us about yourself so we can personalize your experience"
            onNext={isFormValid ? handleSubmit : undefined}
            onSkip={() => router.push('/dashboard')}
            isLoading={isSubmitting}
        >
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="John"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="Doe"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="brokerage">Brokerage *</Label>
                        <Input
                            id="brokerage"
                            value={formData.brokerage}
                            onChange={(e) => setFormData({ ...formData, brokerage: e.target.value })}
                            placeholder="Your Brokerage Name"
                            required
                        />
                    </div>

                    {!isFormValid && (
                        <p className="text-sm text-muted-foreground">
                            * Please fill in all required fields to continue
                        </p>
                    )}
                </CardContent>
            </Card>
        </OnboardingContainer>
    );
}

/**
 * Example 3: Multi-Step Tour
 * 
 * Onboarding step with internal navigation and back button.
 */
export function TourStepExample() {
    const router = useRouter();
    const [currentTourStep, setCurrentTourStep] = useState(0);

    const tourSteps = [
        {
            title: 'Studio Hub',
            description: 'Create content in minutes with AI-powered tools',
        },
        {
            title: 'Brand Hub',
            description: 'Build your market position and track competitors',
        },
        {
            title: 'Research Hub',
            description: 'Get comprehensive research on any market topic',
        },
    ];

    const handleNext = () => {
        if (currentTourStep < tourSteps.length - 1) {
            setCurrentTourStep(currentTourStep + 1);
        } else {
            router.push('/onboarding/selection');
        }
    };

    const handleBack = () => {
        if (currentTourStep > 0) {
            setCurrentTourStep(currentTourStep - 1);
        } else {
            router.push('/onboarding/profile');
        }
    };

    return (
        <OnboardingContainer
            currentStep={3}
            totalSteps={6}
            stepId="tour"
            title="Feature Tour"
            description="Explore what you can do with Bayon Coagent"
            onNext={handleNext}
            onBack={handleBack}
            onSkip={() => router.push('/dashboard')}
            nextLabel={currentTourStep === tourSteps.length - 1 ? 'Continue' : 'Next Feature'}
        >
            <div className="space-y-6">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                        Feature {currentTourStep + 1} of {tourSteps.length}
                    </p>
                </div>

                <Card>
                    <CardContent className="p-8 text-center space-y-4">
                        <h3 className="text-2xl font-semibold">
                            {tourSteps[currentTourStep].title}
                        </h3>
                        <p className="text-lg text-muted-foreground">
                            {tourSteps[currentTourStep].description}
                        </p>
                    </CardContent>
                </Card>

                <div className="flex justify-center gap-2">
                    {tourSteps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-colors ${index === currentTourStep ? 'bg-primary' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </OnboardingContainer>
    );
}

/**
 * Example 4: Selection Step
 * 
 * Onboarding step with multiple choice selection.
 */
export function SelectionStepExample() {
    const router = useRouter();
    const [selectedHub, setSelectedHub] = useState<string | null>(null);

    const hubs = [
        { id: 'studio', name: 'Studio', path: '/studio' },
        { id: 'brand', name: 'Brand', path: '/brand' },
        { id: 'research', name: 'Research', path: '/research' },
    ];

    const handleNext = () => {
        if (selectedHub) {
            const hub = hubs.find(h => h.id === selectedHub);
            router.push(hub?.path || '/dashboard');
        }
    };

    return (
        <OnboardingContainer
            currentStep={4}
            totalSteps={6}
            stepId="selection"
            title="Choose Your Starting Point"
            description="Select which hub you'd like to explore first"
            onNext={selectedHub ? handleNext : undefined}
            onBack={() => router.push('/onboarding/tour')}
            onSkip={() => router.push('/dashboard')}
            nextLabel="Explore Hub"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {hubs.map((hub) => (
                    <Card
                        key={hub.id}
                        className={`cursor-pointer transition-all ${selectedHub === hub.id
                                ? 'ring-2 ring-primary'
                                : 'hover:shadow-md'
                            }`}
                        onClick={() => setSelectedHub(hub.id)}
                    >
                        <CardContent className="p-6 text-center">
                            <h3 className="font-semibold text-lg">{hub.name}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!selectedHub && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                    Select a hub to continue, or skip to go to the dashboard
                </p>
            )}
        </OnboardingContainer>
    );
}

/**
 * Example 5: Completion Step
 * 
 * Final onboarding step with no skip option.
 */
export function CompletionStepExample() {
    const router = useRouter();

    return (
        <OnboardingContainer
            currentStep={6}
            totalSteps={6}
            stepId="complete"
            title="You're All Set!"
            description="Welcome to Bayon Coagent"
            onNext={() => router.push('/dashboard')}
            nextLabel="Go to Dashboard"
            allowSkip={false}  // No skip on final step
            showProgress={true}
        >
            <div className="text-center space-y-6">
                <div className="text-6xl">🎉</div>

                <div className="space-y-2">
                    <h3 className="text-2xl font-semibold">
                        Your account is ready!
                    </h3>
                    <p className="text-lg text-muted-foreground">
                        Start creating amazing content and building your brand
                    </p>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <h4 className="font-semibold mb-3">Quick Tips:</h4>
                        <ul className="text-sm text-muted-foreground space-y-2 text-left">
                            <li>• Complete your profile for better AI results</li>
                            <li>• Connect your Google Business Profile</li>
                            <li>• Try creating your first blog post</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </OnboardingContainer>
    );
}

/**
 * Example 6: Custom Progress Hidden
 * 
 * Onboarding step without progress bar (for special cases).
 */
export function CustomStepExample() {
    const router = useRouter();

    return (
        <OnboardingContainer
            currentStep={1}
            totalSteps={1}
            stepId="custom"
            title="Special Setup"
            description="This is a standalone setup step"
            onNext={() => router.push('/dashboard')}
            showProgress={false}  // Hide progress bar
            allowSkip={false}     // No skip option
        >
            <div className="space-y-4">
                <p>This step doesn't show progress or skip options.</p>
                <p>Use this pattern for required setup steps.</p>
            </div>
        </OnboardingContainer>
    );
}
