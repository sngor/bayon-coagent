
'use client';

import { useState, useEffect, useActionState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Profile } from '@/lib/types';
import { JsonLdDisplay } from '@/components/json-ld-display';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { useItem } from '@/aws/dynamodb/hooks';
import { getRepository } from '@/aws/dynamodb';
import { getAgentProfileKeys, getSavedContentKeys } from '@/aws/dynamodb/keys';
import { generateBioAction } from '@/app/actions';
import { Sparkles, Loader2, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useWebAI } from '@/hooks/useWebAI';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileImageUpload } from '@/components/profile-image-upload';

const initialBioState = {
    message: '',
    data: '',
    errors: {}
};

function SaveButton({ content, type }: { content: string, type: string }) {
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();

    const handleSave = async () => {
        if (!user || !content) {
            toast({ variant: 'destructive', title: 'Could not save', description: 'Content or user is missing.' });
            return;
        }
        startTransition(async () => {
            try {
                const repository = getRepository();
                const contentId = Date.now().toString();
                const keys = getSavedContentKeys(user.id, contentId);
                await repository.put({
                    ...keys,
                    EntityType: 'SavedContent',
                    Data: {
                        content,
                        type,
                        createdAt: new Date().toISOString()
                    },
                    CreatedAt: Date.now(),
                    UpdatedAt: Date.now()
                });
                toast({ title: 'Content Saved!', description: 'Your content has been saved to your content library.' });
            } catch (error) {
                console.error('Failed to save content:', error);
                toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save content.' });
            }
        });
    }

    if (!content) return null;

    return (
        <Button variant="outline" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
        </Button>
    )
}

function GenerateBioButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant={pending ? 'shimmer' : 'ai'} size="sm" disabled={pending || disabled}>
            {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="mr-2 h-4 w-4" />
            )}
            {pending ? 'Generating...' : `Auto-Generate`}
        </Button>
    )
}

function ProfileForm({ profile, onInputChange, onSave, isSaving, isLoading, bioFormAction, userId, onImageUpdate }: { profile: Partial<Profile>, onInputChange: any, onSave: any, isSaving: boolean, isLoading: boolean, bioFormAction: any, userId: string, onImageUpdate: (url: string) => void }) {
    const isGenerateDisabled = isLoading || !profile.name || !profile.agencyName || !profile.yearsOfExperience;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Agent & Agency Details</CardTitle>
                <CardDescription>
                    This information is used to build your E-E-A-T profile and generate schema.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-center">
                    <ProfileImageUpload
                        userId={userId}
                        currentImageUrl={profile.photoURL}
                        userName={profile.name}
                        onImageUpdate={onImageUpdate}
                        size="xl"
                    />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" value={profile.name || ''} onChange={onInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="agencyName">Agency Name</Label>
                        <Input id="agencyName" name="agencyName" value={profile.agencyName || ''} onChange={onInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="licenseNumber">License Number</Label>
                        <Input id="licenseNumber" name="licenseNumber" value={profile.licenseNumber || ''} onChange={onInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                        <Input id="yearsOfExperience" name="yearsOfExperience" type="number" value={profile.yearsOfExperience || ''} onChange={onInputChange} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                    <Input id="certifications" name="certifications" value={profile.certifications ? (Array.isArray(profile.certifications) ? profile.certifications.join(', ') : profile.certifications) : ''} onChange={onInputChange} />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="bio">Professional Bio</Label>
                        <div className="flex items-center gap-2">
                            <SaveButton content={profile.bio || ''} type="Bio" />
                            <form action={bioFormAction}>
                                <input type="hidden" name="name" value={profile.name || ''} />
                                <input type="hidden" name="experience" value={profile.yearsOfExperience?.toString() || ''} />
                                <input type="hidden" name="certifications" value={Array.isArray(profile.certifications) ? profile.certifications.join(', ') : profile.certifications || ''} />
                                <input type="hidden" name="agencyName" value={profile.agencyName || ''} />
                                <GenerateBioButton disabled={isGenerateDisabled} />
                            </form>
                        </div>
                    </div>
                    <Textarea id="bio" name="bio" value={profile.bio || ''} onChange={onInputChange} rows={6} />
                </div>

                <Separator />

                <div>
                    <h3 className="text-lg font-medium font-headline mb-4">Contact & Social Links</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" name="phone" value={profile.phone || ''} onChange={onInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website URL</Label>
                                <Input id="website" name="website" value={profile.website || ''} onChange={onInputChange} placeholder="https://your-website.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="zillowEmail">Zillow Email</Label>
                            <Input id="zillowEmail" name="zillowEmail" type="email" value={profile.zillowEmail || ''} onChange={onInputChange} placeholder="e.g., your-email@zillow-premier-agent.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Primary Business Address</Label>
                            <Input id="address" name="address" value={profile.address || ''} onChange={onInputChange} placeholder="e.g., 123 Main St, Seattle, WA 98101" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                                <Input id="linkedin" name="linkedin" value={profile.linkedin || ''} onChange={onInputChange} placeholder="https://linkedin.com/in/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="twitter">Twitter/X Profile URL</Label>
                                <Input id="twitter" name="twitter" value={profile.twitter || ''} onChange={onInputChange} placeholder="https://x.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="facebook">Facebook Profile URL</Label>
                                <Input id="facebook" name="facebook" value={profile.facebook || ''} onChange={onInputChange} placeholder="https://facebook.com/..." />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={onSave} disabled={isSaving || isLoading}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function ProfilePage() {
    const { user } = useUser();
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [isSaving, setIsSaving] = useState(false);

    const [bioState, bioFormAction] = useActionState(generateBioAction, initialBioState);

    // Memoize DynamoDB keys
    const agentProfilePK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
    const agentProfileSK = useMemo(() => 'AGENT#main', []);

    const { data: agentProfileData, isLoading } = useItem<Profile>(agentProfilePK, agentProfileSK);

    useEffect(() => {
        if (agentProfileData) {
            setProfile(agentProfileData);
        }
    }, [agentProfileData]);

    // Effect for server-side generation results
    useEffect(() => {
        if (bioState.message === 'success' && bioState.data) {
            setProfile(prev => ({ ...prev, bio: bioState.data as string }));
            toast({
                title: 'Bio Generated!',
                description: 'Your new professional bio was generated by our cloud AI.',
            });
        } else if (bioState.message && bioState.message !== 'success') {
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: bioState.message,
            })
        }
    }, [bioState]);


    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { id, value } = e.target;
        setProfile((prev) => ({ ...prev, [id]: value }));
    };

    const handleImageUpdate = async (url: string) => {
        setProfile((prev) => ({ ...prev, photoURL: url }));

        if (user) {
            try {
                const repository = getRepository();
                const keys = getAgentProfileKeys(user.id, 'main');
                await repository.update(keys.PK, keys.SK, { photoURL: url });

                toast({
                    title: 'Profile Photo Updated!',
                    description: 'Your profile photo has been uploaded to S3.',
                });
            } catch (error) {
                console.error('Failed to update profile photo:', error);
                toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: 'Could not update profile photo.',
                });
            }
        }
    };

    const handleSave = async () => {
        if (!user) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Not logged in.",
            });
            return;
        }

        setIsSaving(true);

        try {
            const dataToSave = {
                ...profile,
                certifications: typeof profile.certifications === 'string' ? profile.certifications.split(',').map(s => s.trim()) : (profile.certifications || []),
                yearsOfExperience: Number(profile.yearsOfExperience) || 0,
            };

            const repository = getRepository();
            const keys = getAgentProfileKeys(user.id, 'main');

            // If profile exists, update it; otherwise create it
            if (agentProfileData) {
                await repository.update(keys.PK, keys.SK, dataToSave);
            } else {
                await repository.put({
                    ...keys,
                    EntityType: 'RealEstateAgentProfile',
                    Data: dataToSave,
                    CreatedAt: Date.now(),
                    UpdatedAt: Date.now()
                });
            }

            toast({
                title: 'Profile Saved!',
                description: 'Your information has been updated successfully.',
            });
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save profile.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const generateAgentSchema = (p: Partial<Profile>) => ({
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: p.name || '',
        description: p.bio || '',
        telephone: p.phone || '',
        url: p.website || '',
        license: p.licenseNumber || '',
        address: {
            '@type': 'PostalAddress',
            streetAddress: p.address || '',
        },
        sameAs: [p.linkedin, p.twitter, p.facebook].filter(Boolean),
        knowsAbout: p.certifications ? (Array.isArray(p.certifications) ? p.certifications : p.certifications.split(', ')) : [],
        alumniOf: 'Real Estate Professional',
    });

    const generateAgencySchema = (p: Partial<Profile>) => ({
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgency',
        name: p.agencyName || '',
        agent: {
            '@type': 'RealEstateAgent',
            name: p.name || '',
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: p.address || '',
        },
    });


    return (
        <div className="animate-fade-in-up space-y-8">
            <PageHeader
                title="Unified Profile"
                description="Your single source of truth. Update once, deploy everywhere."
            />
            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile">Your Profile</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-6">
                    <ProfileForm
                        profile={profile}
                        onInputChange={handleInputChange}
                        onSave={handleSave}
                        isSaving={isSaving}
                        isLoading={isLoading}
                        bioFormAction={bioFormAction}
                        userId={user?.id || ''}
                        onImageUpdate={handleImageUpdate}
                    />
                </TabsContent>
                <TabsContent value="schema" className="mt-6">
                    <div className="grid gap-8 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">RealEstateAgent Schema</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <JsonLdDisplay schema={generateAgentSchema(profile)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline">RealEstateAgency Schema</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <JsonLdDisplay schema={generateAgencySchema(profile)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
