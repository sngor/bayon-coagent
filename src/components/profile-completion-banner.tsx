'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { CheckCircle2, Circle, ArrowRight, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { Profile } from "@/lib/types/common";

type UserProfile = Profile;
import Link from 'next/link';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';

export interface ProfileField {
    key: keyof UserProfile;
    label: string;
    benefit: string;
    required: boolean;
}

const PROFILE_FIELDS: ProfileField[] = [
    {
        key: 'name',
        label: 'Full Name',
        benefit: 'Personalizes your marketing content',
        required: true,
    },
    {
        key: 'agencyName',
        label: 'Agency Name',
        benefit: 'Builds your brand identity',
        required: true,
    },
    {
        key: 'phone',
        label: 'Phone Number',
        benefit: 'Enables NAP consistency checks',
        required: true,
    },
    {
        key: 'address',
        label: 'Business Address',
        benefit: 'Powers local SEO features',
        required: true,
    },
    {
        key: 'bio',
        label: 'Professional Bio',
        benefit: 'Enhances your E-E-A-T profile',
        required: true,
    },
    {
        key: 'yearsOfExperience',
        label: 'Years of Experience',
        benefit: 'Demonstrates expertise',
        required: false,
    },
    {
        key: 'licenseNumber',
        label: 'License Number',
        benefit: 'Builds trust and credibility',
        required: false,
    },
    {
        key: 'website',
        label: 'Website URL',
        benefit: 'Improves online presence',
        required: false,
    },
    {
        key: 'photoURL',
        label: 'Profile Photo',
        benefit: 'Makes your content more personal',
        required: false,
    },
];

export interface ProfileCompletionBannerProps {
    profile: Partial<Profile>;
    className?: string;
    onDismiss?: () => void;
}

export function ProfileCompletionBanner({
    profile,
    className,
    onDismiss,
}: ProfileCompletionBannerProps) {
    const completionData = useMemo(() => {
        const completed = PROFILE_FIELDS.filter((field) => {
            const value = profile[field.key];
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            // Handle string values more carefully
            if (typeof value === 'string') {
                return value.trim() !== '';
            }
            // Handle numbers
            if (typeof value === 'number') {
                return value > 0;
            }
            return value !== undefined && value !== null && value !== '';
        });

        const requiredFields = PROFILE_FIELDS.filter((f) => f.required);
        const completedRequired = completed.filter((f) => f.required);
        const missingFields = PROFILE_FIELDS.filter((field) => {
            const value = profile[field.key];
            if (Array.isArray(value)) {
                return value.length === 0;
            }
            // Handle string values more carefully
            if (typeof value === 'string') {
                return value.trim() === '';
            }
            // Handle numbers
            if (typeof value === 'number') {
                return value <= 0;
            }
            return value === undefined || value === null || value === '';
        });

        const percentage = Math.round(
            (completed.length / PROFILE_FIELDS.length) * 100
        );
        const isComplete = percentage === 100;
        const hasRequiredFields = completedRequired.length === requiredFields.length;

        return {
            completed: completed.length,
            total: PROFILE_FIELDS.length,
            percentage,
            isComplete,
            hasRequiredFields,
            missingFields,
            nextField: missingFields[0],
        };
    }, [profile]);

    // Don't show banner if profile is complete
    if (completionData.isComplete) {
        return null;
    }

    const getNextStepMessage = () => {
        if (!completionData.hasRequiredFields) {
            return 'Complete required fields to unlock AI-powered marketing tools';
        }
        return 'Complete your profile to maximize your marketing potential';
    };

    const getNextStepAction = () => {
        if (completionData.hasRequiredFields) {
            return {
                label: 'Generate Marketing Plan',
                href: '/marketing-plan',
                icon: Sparkles,
            };
        }
        return null;
    };

    const nextAction = getNextStepAction();

    return (
        <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
        >
            <Card
                className={cn(
                    'border-primary/20 bg-background/50 overflow-hidden',
                    className
                )}
            >
                <CardGradientMesh>
                    <CardContent className="pt-6 relative z-10">
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <h3 className="text-lg font-semibold font-headline">
                                        Complete Your Profile
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {getNextStepMessage()}
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <motion.div
                                        className="text-right"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                    >
                                        <div className="text-2xl font-bold text-primary">
                                            {completionData.percentage}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {completionData.completed} of {completionData.total}
                                        </div>
                                    </motion.div>
                                    {onDismiss && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onDismiss}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                            title="Dismiss banner"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <AnimatedProgress value={completionData.percentage} className="h-2" />

                            {/* Missing Fields */}
                            {completionData.missingFields.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Missing Information:</p>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {completionData.missingFields.slice(0, 4).map((field) => (
                                            <div
                                                key={field.key}
                                                className="flex items-start gap-2 rounded-lg bg-background/40 backdrop-blur-sm p-3 border border-white/10"
                                            >
                                                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {field.label}
                                                        {field.required && (
                                                            <span className="text-destructive ml-1">*</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {field.benefit}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {completionData.missingFields.length > 4 && (
                                        <p className="text-xs text-muted-foreground">
                                            +{completionData.missingFields.length - 4} more fields
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Link href="/profile" className="flex-1">
                                    <Button className="w-full shadow-md">
                                        Complete Profile
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                {nextAction && completionData.hasRequiredFields && (
                                    <Link href={nextAction.href} className="flex-1">
                                        <Button variant="outline" className="w-full bg-background/50 backdrop-blur-sm">
                                            <nextAction.icon className="mr-2 h-4 w-4" />
                                            {nextAction.label}
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {/* Benefits */}
                            {!completionData.hasRequiredFields && (
                                <div className="rounded-lg bg-primary/5 p-3 border border-primary/10 backdrop-blur-sm">
                                    <p className="text-xs text-muted-foreground">
                                        <strong className="text-foreground">Why complete your profile?</strong>{' '}
                                        A complete profile enables AI-powered features like marketing plan
                                        generation, brand audits, and personalized content creation.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </CardGradientMesh>
            </Card>
        </motion.div>
    );
}

export interface ProfileCompletionChecklistProps {
    profile: Partial<Profile>;
    className?: string;
}

export function ProfileCompletionChecklist({
    profile,
    className,
}: ProfileCompletionChecklistProps) {
    const fieldStatus = useMemo(() => {
        return PROFILE_FIELDS.map((field) => {
            const value = profile[field.key];
            let isComplete = false;

            if (Array.isArray(value)) {
                isComplete = value.length > 0;
            } else if (typeof value === 'string') {
                isComplete = value.trim() !== '';
            } else if (typeof value === 'number') {
                isComplete = value > 0;
            } else {
                isComplete = value !== undefined && value !== null && value !== '';
            }

            return {
                ...field,
                isComplete,
            };
        });
    }, [profile]);

    const requiredComplete = fieldStatus.filter(
        (f) => f.required && f.isComplete
    ).length;
    const requiredTotal = fieldStatus.filter((f) => f.required).length;

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardGradientMesh>
                <CardContent className="pt-6 relative z-10">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold font-headline">
                                Profile Checklist
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {requiredComplete === requiredTotal
                                    ? 'All required fields complete! Add optional fields to enhance your profile.'
                                    : `Complete ${requiredTotal - requiredComplete} required field${requiredTotal - requiredComplete !== 1 ? 's' : ''} to get started.`}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {fieldStatus.map((field) => (
                                <div
                                    key={field.key}
                                    className={cn(
                                        'flex items-start gap-3 rounded-lg p-3 transition-colors backdrop-blur-sm',
                                        field.isComplete
                                            ? 'bg-success/5 border border-success/20'
                                            : 'bg-muted/50 border border-transparent'
                                    )}
                                >
                                    {field.isComplete ? (
                                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <p
                                            className={cn(
                                                'text-sm font-medium',
                                                field.isComplete && 'text-success'
                                            )}
                                        >
                                            {field.label}
                                            {field.required && !field.isComplete && (
                                                <span className="text-destructive ml-1">*</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {field.benefit}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </CardGradientMesh>
        </Card>
    );
}
