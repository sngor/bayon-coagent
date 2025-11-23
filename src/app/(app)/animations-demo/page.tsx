/**
 * Animation Demo Page
 * Showcases all micro-animations available in the app
 */

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedCard, AnimatedCardHeader, AnimatedCardTitle, AnimatedCardContent } from '@/components/ui/animated-card';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { AnimatedIcon, SpinningIcon, PulsingIcon, BouncingIcon } from '@/components/ui/animated-icon';
import { AnimatedBadge } from '@/components/ui/animated-badge';
import { AnimatedInput } from '@/components/ui/animated-input';
import { AnimatedProgress, CircularProgress, StepProgress } from '@/components/ui/animated-progress';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { SuccessFeedback, InlineSuccess, AnimatedCheckmark } from '@/components/ui/success-feedback';
import { Skeleton, SkeletonCard, SkeletonAvatar, SkeletonText, SkeletonList } from '@/components/ui/skeleton-loader';
import { NotificationContainer, useNotifications } from '@/components/ui/animated-notification';
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { Sparkles, Heart, Star, Zap, Loader2, Plus, Send, Save } from 'lucide-react';

export default function AnimationsDemoPage() {
    const [showSuccess, setShowSuccess] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [currentStep, setCurrentStep] = React.useState(0);
    const { notifications, addNotification, removeNotification } = useNotifications();

    React.useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const steps = ['Profile', 'Details', 'Review', 'Complete'];

    return (
        <div className="container mx-auto p-6 space-y-12 max-w-7xl">
            <div className="space-y-2">
                <h1 className="font-headline text-4xl font-bold">Micro-Animations Demo</h1>
                <p className="text-muted-foreground">
                    Explore all the delightful micro-animations available in the app
                </p>
            </div>

            {/* Buttons */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Buttons</h2>
                <div className="flex flex-wrap gap-4">
                    <Button>Default Button</Button>
                    <Button variant="ai">AI Button</Button>
                    <Button variant="shimmer">Shimmer Button</Button>
                    <Button variant="success">Success Button</Button>
                    <Button variant="premium">Premium Button</Button>
                    <Button variant="glow">Glow Button</Button>
                    <Button variant="gradient-border">Gradient Border</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                </div>
            </section>

            {/* Cards */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Animated Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AnimatedCard variant="lift">
                        <AnimatedCardHeader>
                            <AnimatedCardTitle>Lift Effect</AnimatedCardTitle>
                        </AnimatedCardHeader>
                        <AnimatedCardContent>
                            <p className="text-sm text-muted-foreground">
                                Hover to see the card lift with shadow
                            </p>
                        </AnimatedCardContent>
                    </AnimatedCard>

                    <AnimatedCard variant="glow">
                        <AnimatedCardHeader>
                            <AnimatedCardTitle>Glow Effect</AnimatedCardTitle>
                        </AnimatedCardHeader>
                        <AnimatedCardContent>
                            <p className="text-sm text-muted-foreground">
                                Hover to see the glow effect
                            </p>
                        </AnimatedCardContent>
                    </AnimatedCard>

                    <AnimatedCard variant="scale">
                        <AnimatedCardHeader>
                            <AnimatedCardTitle>Scale Effect</AnimatedCardTitle>
                        </AnimatedCardHeader>
                        <AnimatedCardContent>
                            <p className="text-sm text-muted-foreground">
                                Hover to see the scale animation
                            </p>
                        </AnimatedCardContent>
                    </AnimatedCard>
                </div>
            </section>

            {/* Animated Lists */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Staggered Lists</h2>
                <AnimatedList staggerDelay={0.1}>
                    {['First Item', 'Second Item', 'Third Item', 'Fourth Item', 'Fifth Item'].map((item, i) => (
                        <AnimatedListItem key={i}>
                            <div className="p-4 border rounded-lg bg-card hover:bg-accent transition-colors">
                                {item}
                            </div>
                        </AnimatedListItem>
                    ))}
                </AnimatedList>
            </section>

            {/* Icons */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Animated Icons</h2>
                <div className="flex gap-8 items-center">
                    <div className="text-center space-y-2">
                        <SpinningIcon>
                            <Loader2 className="w-8 h-8 text-primary" />
                        </SpinningIcon>
                        <p className="text-xs text-muted-foreground">Spinning</p>
                    </div>
                    <div className="text-center space-y-2">
                        <PulsingIcon>
                            <Heart className="w-8 h-8 text-destructive" />
                        </PulsingIcon>
                        <p className="text-xs text-muted-foreground">Pulsing</p>
                    </div>
                    <div className="text-center space-y-2">
                        <BouncingIcon>
                            <Star className="w-8 h-8 text-warning" />
                        </BouncingIcon>
                        <p className="text-xs text-muted-foreground">Bounce on Hover</p>
                    </div>
                    <div className="text-center space-y-2">
                        <AnimatedIcon animation="pulse" trigger="always">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </AnimatedIcon>
                        <p className="text-xs text-muted-foreground">Always Pulse</p>
                    </div>
                </div>
            </section>

            {/* Badges */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Animated Badges</h2>
                <div className="flex flex-wrap gap-3">
                    <AnimatedBadge>Default</AnimatedBadge>
                    <AnimatedBadge variant="success">Success</AnimatedBadge>
                    <AnimatedBadge variant="destructive">Error</AnimatedBadge>
                    <AnimatedBadge variant="secondary">Secondary</AnimatedBadge>
                    <AnimatedBadge variant="glow">Glow Effect</AnimatedBadge>
                    <AnimatedBadge variant="outline">Outline</AnimatedBadge>
                </div>
            </section>

            {/* Inputs */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Animated Inputs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    <AnimatedInput placeholder="Normal input" />
                    <AnimatedInput placeholder="Success state" success successMessage="Looks good!" />
                    <AnimatedInput placeholder="Error state" error errorMessage="This field is required" />
                    <AnimatedInput placeholder="Focus to see animation" />
                </div>
            </section>

            {/* Progress Indicators */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Progress Indicators</h2>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Linear Progress</p>
                        <AnimatedProgress value={progress} showLabel />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Gradient Progress</p>
                        <AnimatedProgress value={progress} variant="gradient" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Circular Progress</p>
                        <CircularProgress value={progress} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Step Progress</p>
                        <StepProgress steps={steps} currentStep={currentStep} />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                                disabled={currentStep === 0}
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                                disabled={currentStep === steps.length - 1}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Success Feedback */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Success Feedback</h2>
                <div className="space-y-4">
                    <Button onClick={() => setShowSuccess(true)}>Show Success Feedback</Button>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Inline Success</p>
                        <InlineSuccess show={true} message="Action completed successfully!" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Animated Checkmark</p>
                        <AnimatedCheckmark size={64} />
                    </div>
                </div>
            </section>

            {/* Skeleton Loaders */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Skeleton Loaders</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Card Skeleton</p>
                        <SkeletonCard />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">List Skeleton</p>
                        <SkeletonList items={3} />
                    </div>
                </div>
            </section>

            {/* Tooltips */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Animated Tooltips</h2>
                <div className="flex gap-4">
                    <AnimatedTooltip content="This is a tooltip" side="top">
                        <Button variant="outline">Hover me (top)</Button>
                    </AnimatedTooltip>
                    <AnimatedTooltip content="Another tooltip" side="right">
                        <Button variant="outline">Hover me (right)</Button>
                    </AnimatedTooltip>
                    <AnimatedTooltip content="Tooltip content" side="bottom">
                        <Button variant="outline">Hover me (bottom)</Button>
                    </AnimatedTooltip>
                </div>
            </section>

            {/* Notifications */}
            <section className="space-y-4">
                <h2 className="font-headline text-2xl font-semibold">Notifications</h2>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={() =>
                            addNotification({
                                title: 'Success!',
                                description: 'Your action was completed successfully.',
                                variant: 'success',
                            })
                        }
                    >
                        Show Success
                    </Button>
                    <Button
                        onClick={() =>
                            addNotification({
                                title: 'Error occurred',
                                description: 'Something went wrong. Please try again.',
                                variant: 'error',
                            })
                        }
                    >
                        Show Error
                    </Button>
                    <Button
                        onClick={() =>
                            addNotification({
                                title: 'Warning',
                                description: 'Please review your input.',
                                variant: 'warning',
                            })
                        }
                    >
                        Show Warning
                    </Button>
                    <Button
                        onClick={() =>
                            addNotification({
                                title: 'Information',
                                description: 'Here is some useful information.',
                                variant: 'info',
                            })
                        }
                    >
                        Show Info
                    </Button>
                </div>
            </section>

            {/* Success Feedback Modal */}
            <SuccessFeedback
                show={showSuccess}
                message="Action completed successfully!"
                onComplete={() => setShowSuccess(false)}
            />

            {/* Notification Container */}
            <NotificationContainer
                notifications={notifications}
                onClose={removeNotification}
                position="top-right"
            />

            {/* Floating Action Button */}
            <FloatingActionButton
                actions={[
                    {
                        icon: <Plus className="w-5 h-5" />,
                        label: 'Create New',
                        onClick: () => console.log('Create'),
                    },
                    {
                        icon: <Send className="w-5 h-5" />,
                        label: 'Send Message',
                        onClick: () => console.log('Send'),
                        variant: 'success',
                    },
                    {
                        icon: <Save className="w-5 h-5" />,
                        label: 'Save Draft',
                        onClick: () => console.log('Save'),
                    },
                ]}
            />
        </div>
    );
}
