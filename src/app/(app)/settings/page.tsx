
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/aws/auth';
import { useItem } from '@/aws/dynamodb/hooks';
import Image from 'next/image';
import { useRef, useActionState, useEffect, useTransition, useMemo } from 'react';
import { updatePasswordAction, updateProfilePhotoAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import type { Profile } from '@/lib/types';
import { useS3Upload } from '@/hooks/use-s3-upload';


function UpdatePasswordButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? 'Updating...' : 'Update Password'}
        </Button>
    )
}

function ChangePasswordForm() {
    const [state, formAction] = useActionState(updatePasswordAction, { message: '', errors: {} });

    useEffect(() => {
        if (state.message === 'success') {
            toast({ title: 'Password Updated', description: 'Your password has been changed successfully.' });
        } else if (state.message) {
            toast({ variant: 'destructive', title: 'Update Failed', description: state.message });
        }
    }, [state]);

    return (
        <form action={formAction} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" required />
                {state.errors?.currentPassword && <p className="text-sm text-destructive">{state.errors.currentPassword[0]}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" name="newPassword" type="password" required />
                {state.errors?.newPassword && <p className="text-sm text-destructive">{state.errors.newPassword[0]}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required />
                {state.errors?.confirmPassword && <p className="text-sm text-destructive">{state.errors.confirmPassword[0]}</p>}
            </div>
            <UpdatePasswordButton />
        </form>
    );
}

export default function SettingsPage() {
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFile, isUploading } = useS3Upload();


    // Memoize DynamoDB keys
    const agentProfilePK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const agentProfileSK = useMemo(() => 'AGENT#main', []);

    const { data: agentProfile } = useItem<Profile>(agentProfilePK, agentProfileSK);

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        try {
            const key = `users/${user.id}/profile.jpg`;
            const downloadURL = await uploadFile(file, key);

            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('photoURL', downloadURL);

            const result = await updateProfilePhotoAction(null, formData);

            if (result.message === 'success') {
                toast({ title: 'Profile Photo Updated', description: 'Your new photo has been saved.' });
            } else {
                toast({ variant: 'destructive', title: 'Upload Failed', description: result.message });
            }
        } catch (error) {
            console.error("Error uploading file: ", error);
            toast({ variant: 'destructive', title: 'Upload Failed', description: 'An error occurred while uploading the image.' });
        }
    }

    return (
        <div className="animate-fade-in-up space-y-8">
            <PageHeader
                title="Settings"
                description="Manage your account, profile, and application settings."
            />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Account</CardTitle>
                            <CardDescription>
                                Manage your sign-in and security settings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChangePasswordForm />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel of the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="theme" className="text-base">Theme</Label>
                                <ThemeToggle />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Profile Picture</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <Image
                                src={agentProfile?.photoURL || 'https://picsum.photos/seed/1/128/128'}
                                alt="Profile Picture"
                                width={128}
                                height={128}
                                className="rounded-full border-4 border-background shadow-md"
                            />
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isUploading ? 'Uploading...' : 'Change Photo'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
