'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProfileCompletionBanner } from '@/components/profile-completion-banner';
import { Target, Sparkles } from 'lucide-react';
import { useProfileCompletion, useProfileCompletionActions } from '@/hooks/use-profile-completion-enhanced';
import { toast } from '@/hooks/use-toast';
import type { Profile } from '@/lib/types/common';

interface ProfileCompletionSectionProps {
    agentProfile: Profile | null;
    userId: string;
}

export function ProfileCompletionSection({ agentProfile, userId }: ProfileCompletionSectionProps) {
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    const { completionPercentage, isComplete } = useProfileCompletion(agentProfile);
    const { handleBannerDismiss, handleBannerShow, getBannerDismissedState } = useProfileCompletionActions(userId);

    // Load dismissed banner state from localStorage
    useEffect(() => {
        const dismissed = getBannerDismissedState();
        setIsBannerDismissed(dismissed);
    }, [getBannerDismissedState]);

    // Auto-clear dismissed state and show congratulations when profile is complete
    useEffect(() => {
        if (!agentProfile || !isComplete) return;

        // Clear the dismissed state since profile is now complete
        handleBannerShow();
        setIsBannerDismissed(false);

        // Show congratulations toast if this is the first time reaching 100%
        const congratulatedKey = `profile-completed-${userId}`;
        const hasBeenCongratulated = localStorage.getItem(congratulatedKey) === 'true';

        if (!hasBeenCongratulated) {
            localStorage.setItem(congratulatedKey, 'true');
            toast({
                title: "🎉 Profile Complete!",
                description: "Your profile is now complete and all AI features are unlocked!",
            });
        }
    }, [agentProfile, isComplete, userId, handleBannerShow]);

    const onBannerDismiss = () => {
        handleBannerDismiss();
        setIsBannerDismissed(true);

        toast({
            title: "Banner dismissed",
            description: "You can always complete your profile later from the Brand section.",
        });
    };

    const onShowDetails = () => {
        handleBannerShow();
        setIsBannerDismissed(false);
    };

    // Don't show anything if profile is complete or completion is too low
    if (!agentProfile || completionPercentage < 50 || isComplete) {
        return null;
    }

    // Show full banner if not dismissed
    if (!isBannerDismissed) {
        return (
            <div className="animate-fade-in-up animate-delay-100">
                <ProfileCompletionBanner
                    profile={agentProfile}
                    onDismiss={onBannerDismiss}
                />
            </div>
        );
    }

    // Show compact version when dismissed
    return (
        <div className="animate-fade-in-up animate-delay-100">
            <div className="group relative overflow-hidden flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/5 hover:via-primary/3 hover:to-primary/5 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">Profile {completionPercentage}% complete</p>
                        <p className="text-xs text-muted-foreground">Complete your profile to unlock more features</p>
                    </div>
                </div>
                <div className="relative flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild className="shadow-sm">
                        <Link href="/brand/profile">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Complete Profile
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onShowDetails}
                        className="text-xs hover:bg-primary/10"
                    >
                        Show Details
                    </Button>
                </div>
            </div>
        </div>
    );
}