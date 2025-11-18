'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileCompletionBanner, ProfileCompletionChecklist } from '@/components/profile-completion-banner';
import { SuggestedNextSteps } from '@/components/suggested-next-steps';
import { useProfileCompletion, getSuggestedNextActions } from '@/hooks/use-profile-completion';
import type { Profile } from '@/lib/types';

export default function ProfileCompletionDemoPage() {
    const [profile, setProfile] = useState<Partial<Profile>>({
        name: 'John Doe',
        agencyName: 'Doe Real Estate',
    });

    const completionData = useProfileCompletion(profile);
    const suggestedSteps = getSuggestedNextActions(profile, false, false, false);

    const fillRequiredFields = () => {
        setProfile({
            name: 'John Doe',
            agencyName: 'Doe Real Estate',
            phone: '555-1234',
            address: '123 Main St, Seattle, WA',
            bio: 'Experienced real estate agent with a passion for helping clients find their dream homes.',
        });
    };

    const fillAllFields = () => {
        setProfile({
            name: 'John Doe',
            agencyName: 'Doe Real Estate',
            phone: '555-1234',
            address: '123 Main St, Seattle, WA',
            bio: 'Experienced real estate agent with a passion for helping clients find their dream homes.',
            yearsOfExperience: 10,
            licenseNumber: 'RE123456',
            website: 'https://johndoe.com',
            photoURL: 'https://picsum.photos/seed/1/96/96',
        });
    };

    const clearProfile = () => {
        setProfile({
            name: 'John Doe',
            agencyName: 'Doe Real Estate',
        });
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="Profile Completion Demo"
                description="Test the profile completion guidance components"
            />

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Demo Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={clearProfile} variant="outline">
                            Reset (Minimal)
                        </Button>
                        <Button onClick={fillRequiredFields} variant="outline">
                            Fill Required Fields
                        </Button>
                        <Button onClick={fillAllFields} variant="outline">
                            Fill All Fields
                        </Button>
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <h4 className="font-semibold">Current Status:</h4>
                        <ul className="text-sm space-y-1">
                            <li>Completion: {completionData.percentage}%</li>
                            <li>
                                Required Fields: {completionData.requiredComplete} /{' '}
                                {completionData.requiredTotal}
                            </li>
                            <li>
                                Total Fields: {completionData.completedCount} /{' '}
                                {completionData.totalCount}
                            </li>
                            <li>Has Required: {completionData.hasRequiredFields ? 'Yes' : 'No'}</li>
                            <li>Is Complete: {completionData.isComplete ? 'Yes' : 'No'}</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Completion Banner */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Profile Completion Banner</h3>
                <ProfileCompletionBanner profile={profile} />
            </div>

            {/* Suggested Next Steps */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Suggested Next Steps</h3>
                <SuggestedNextSteps steps={suggestedSteps} />
            </div>

            {/* Profile Completion Checklist */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Profile Completion Checklist</h3>
                <ProfileCompletionChecklist profile={profile} />
            </div>
        </div>
    );
}
