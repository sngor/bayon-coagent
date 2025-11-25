'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileCompletionBanner, ProfileCompletionChecklist } from '@/components/profile-completion-banner';
import type { Profile } from '@/lib/types';

export default function ProfileCompletionDemoPage() {
    // Sample profiles with different completion levels
    const emptyProfile: Partial<Profile> = {
        id: '1',
    };

    const partialProfile: Partial<Profile> = {
        id: '2',
        name: 'John Smith',
        agencyName: 'Smith Realty',
        phone: '555-0123',
    };

    const completeProfile: Partial<Profile> = {
        id: '3',
        name: 'Jane Doe',
        agencyName: 'Doe Real Estate',
        phone: '555-0456',
        address: '123 Main St, Seattle, WA 98101',
        bio: 'Experienced real estate agent specializing in luxury homes.',
        yearsOfExperience: 10,
        licenseNumber: 'RE123456',
        website: 'https://janedoe.com',
        photoURL: 'https://picsum.photos/200',
        certifications: ['Certified Luxury Home Marketing Specialist'],
    };

    return (
        <StandardPageLayout
            title="Profile Completion Demo"
            description="Profile completion UI patterns with progress tracking"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Empty Profile (0% Complete)</CardTitle>
                        <CardDescription>Shows when user has just signed up</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileCompletionBanner profile={emptyProfile} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Partial Profile (33% Complete)</CardTitle>
                        <CardDescription>Shows progress with required fields completed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileCompletionBanner profile={partialProfile} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Complete Profile (100%)</CardTitle>
                        <CardDescription>Banner is hidden when profile is complete</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProfileCompletionBanner profile={completeProfile} />
                        <p className="text-sm text-muted-foreground mt-4">
                            ✓ Banner is hidden when profile is 100% complete
                        </p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Checklist View - Empty</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProfileCompletionChecklist profile={emptyProfile} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Checklist View - Partial</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ProfileCompletionChecklist profile={partialProfile} />
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { ProfileCompletionBanner } from '@/components/profile-completion-banner';

// Banner variant (shows progress and next steps)
<ProfileCompletionBanner profile={agentProfile} />

// Checklist variant (detailed field-by-field view)
<ProfileCompletionChecklist profile={agentProfile} />`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Real-time completion percentage calculation</li>
                            <li>✓ Required vs optional field distinction</li>
                            <li>✓ Contextual next steps based on completion level</li>
                            <li>✓ Visual progress bar with gradient styling</li>
                            <li>✓ Missing field benefits explanation</li>
                            <li>✓ Smart action buttons (complete profile or generate plan)</li>
                            <li>✓ Auto-hides when profile is 100% complete</li>
                            <li>✓ Responsive design for mobile and desktop</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
