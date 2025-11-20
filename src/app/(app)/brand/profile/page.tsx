
'use client';

import { useState, useEffect, useActionState, useTransition, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { StandardPageLayout, StandardFormField } from '@/components/standard';
import { StandardFormActions } from '@/components/standard/form-actions';
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
import { Textarea } from '@/components/ui/textarea';
import type { Profile } from '@/lib/types';
import { JsonLdDisplay } from '@/components/json-ld-display';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { useItem } from '@/aws/dynamodb/hooks';
import { getAgentProfileKeys } from '@/aws/dynamodb/keys';
import { generateBioAction, updateProfilePhotoUrlAction, saveContentAction } from '@/app/actions';
import { Save, User, Building2, Award, Phone, Globe, Share2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { ProfileCompletionChecklist } from '@/components/profile-completion-banner';
import { StandardLoadingSpinner } from '@/components/standard';

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
                const result = await saveContentAction(content, type);
                if (result.message === 'Content saved successfully') {
                    toast({ title: 'Content Saved!', description: 'Your content has been saved to your content library.' });
                } else {
                    throw new Error(result.errors?.[0] || 'Save failed');
                }
            } catch (error) {
                console.error('Failed to save content:', error);
                toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save content.' });
            }
        });
    }

    if (!content) return null;

    return (
        <Button variant="outline" size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? (
                <>
                    <StandardLoadingSpinner size="sm" className="mr-2" />
                    Saving...
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                </>
            )}
        </Button>
    )
}

function GenerateBioButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <StandardFormActions
            primaryAction={{
                label: 'Auto-Generate',
                type: 'submit',
                variant: 'ai',
                loading: pending,
                disabled: disabled,
            }}
            alignment="right"
        />
    )
}

// Section Components for better organization
function BasicInfoSection({ profile, onInputChange }: { profile: Partial<Profile>, onInputChange: any }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                <span>BASIC INFORMATION</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardFormField label="Full Name" id="name" required>
                    <Input id="name" name="name" value={profile.name || ''} onChange={onInputChange} placeholder="John Smith" />
                </StandardFormField>
                <StandardFormField label="Agency Name" id="agencyName" required>
                    <Input id="agencyName" name="agencyName" value={profile.agencyName || ''} onChange={onInputChange} placeholder="Smith Realty Group" />
                </StandardFormField>
            </div>
        </div>
    );
}

function ProfessionalDetailsSection({ profile, onInputChange }: { profile: Partial<Profile>, onInputChange: any }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Award className="h-4 w-4" />
                <span>PROFESSIONAL CREDENTIALS</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardFormField label="License Number" id="licenseNumber">
                    <Input id="licenseNumber" name="licenseNumber" value={profile.licenseNumber || ''} onChange={onInputChange} placeholder="RE123456" />
                </StandardFormField>
                <StandardFormField label="Years of Experience" id="yearsOfExperience">
                    <Input id="yearsOfExperience" name="yearsOfExperience" type="number" value={profile.yearsOfExperience || ''} onChange={onInputChange} placeholder="5" />
                </StandardFormField>
            </div>
            <StandardFormField
                label="Certifications"
                id="certifications"
                hint="Separate multiple certifications with commas"
            >
                <Input
                    id="certifications"
                    name="certifications"
                    value={profile.certifications ? (Array.isArray(profile.certifications) ? profile.certifications.join(', ') : profile.certifications) : ''}
                    onChange={onInputChange}
                    placeholder="e.g., CRS, ABR, GRI (comma-separated)"
                />
            </StandardFormField>
        </div>
    );
}

function BioSection({ profile, onInputChange, bioFormAction }: { profile: Partial<Profile>, onInputChange: any, bioFormAction: any }) {
    const isGenerateDisabled = !profile.name || !profile.agencyName || !profile.yearsOfExperience;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>PROFESSIONAL BIO</span>
                </div>
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
            <StandardFormField
                label=""
                id="bio"
                hint={isGenerateDisabled ? "Complete your name, agency, and years of experience to enable AI bio generation" : undefined}
            >
                <Textarea
                    id="bio"
                    name="bio"
                    value={profile.bio || ''}
                    onChange={onInputChange}
                    rows={6}
                    placeholder="Tell clients about your experience, expertise, and what makes you unique..."
                />
            </StandardFormField>
        </div>
    );
}

function ContactSection({ profile, onInputChange }: { profile: Partial<Profile>, onInputChange: any }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>CONTACT INFORMATION</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardFormField label="Phone Number" id="phone" required>
                    <Input id="phone" name="phone" type="tel" value={profile.phone || ''} onChange={onInputChange} placeholder="(555) 123-4567" />
                </StandardFormField>
                <StandardFormField label="Website URL" id="website">
                    <Input id="website" name="website" type="url" value={profile.website || ''} onChange={onInputChange} placeholder="https://your-website.com" />
                </StandardFormField>
            </div>
            <StandardFormField
                label="Primary Business Address"
                id="address"
                required
                hint="Used for NAP consistency and local SEO"
            >
                <Input id="address" name="address" value={profile.address || ''} onChange={onInputChange} placeholder="123 Main St, Seattle, WA 98101" />
            </StandardFormField>
            <StandardFormField
                label="Zillow Email"
                id="zillowEmail"
                hint="For importing Zillow reviews"
            >
                <Input id="zillowEmail" name="zillowEmail" type="email" value={profile.zillowEmail || ''} onChange={onInputChange} placeholder="your-email@zillow-premier-agent.com" />
            </StandardFormField>
        </div>
    );
}

function SocialLinksSection({ profile, onInputChange }: { profile: Partial<Profile>, onInputChange: any }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Share2 className="h-4 w-4" />
                <span>SOCIAL MEDIA</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StandardFormField label="LinkedIn" id="linkedin">
                    <Input id="linkedin" name="linkedin" type="url" value={profile.linkedin || ''} onChange={onInputChange} placeholder="https://linkedin.com/in/..." />
                </StandardFormField>
                <StandardFormField label="Twitter/X" id="twitter">
                    <Input id="twitter" name="twitter" type="url" value={profile.twitter || ''} onChange={onInputChange} placeholder="https://x.com/..." />
                </StandardFormField>
                <StandardFormField label="Facebook" id="facebook">
                    <Input id="facebook" name="facebook" type="url" value={profile.facebook || ''} onChange={onInputChange} placeholder="https://facebook.com/..." />
                </StandardFormField>
            </div>
            <p className="text-xs text-muted-foreground">Social profiles improve your E-E-A-T score and schema markup</p>
        </div>
    );
}

function ProfileForm({ profile, onInputChange, onSave, isSaving, isLoading, bioFormAction, userId, onImageUpdate }: { profile: Partial<Profile>, onInputChange: any, onSave: any, isSaving: boolean, isLoading: boolean, bioFormAction: any, userId: string, onImageUpdate: (url: string) => void }) {
    return (
        <div className="space-y-6">
            {/* Profile Photo Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center">
                        <ProfileImageUpload
                            userId={userId}
                            currentImageUrl={profile.photoURL}
                            userName={profile.name}
                            onImageUpdate={onImageUpdate}
                            size="xl"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Main Profile Information Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Profile Information</CardTitle>
                    <CardDescription>
                        Build your E-E-A-T profile and generate schema markup for better SEO
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <BasicInfoSection profile={profile} onInputChange={onInputChange} />
                    <Separator />
                    <ProfessionalDetailsSection profile={profile} onInputChange={onInputChange} />
                    <Separator />
                    <BioSection profile={profile} onInputChange={onInputChange} bioFormAction={bioFormAction} />
                    <Separator />
                    <ContactSection profile={profile} onInputChange={onInputChange} />
                    <Separator />
                    <SocialLinksSection profile={profile} onInputChange={onInputChange} />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        <span className="text-destructive">*</span> Required fields
                    </p>
                    <Button onClick={onSave} disabled={isSaving || isLoading} size="lg">
                        {isSaving ? (
                            <>
                                <StandardLoadingSpinner size="sm" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
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
                const result = await updateProfilePhotoUrlAction(url);

                if (result.message === 'Profile photo updated successfully') {
                    toast({
                        title: 'Profile Photo Updated!',
                        description: 'Your profile photo has been uploaded to S3.',
                    });
                } else {
                    throw new Error(result.errors?.[0] || 'Update failed');
                }
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

            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('profile', JSON.stringify(dataToSave));

            const { saveProfileAction } = await import('@/app/actions');
            const result = await saveProfileAction({}, formData);

            if (result.message === 'success') {
                toast({
                    title: 'Profile Saved!',
                    description: 'Your information has been updated successfully.',
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            console.error('Failed to save profile:', error);
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: error.message || 'Could not save profile.',
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
        <StandardPageLayout
            spacing="default"
        >
            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile">Your Profile</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
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
                        </div>
                        <div className="lg:col-span-1">
                            <div className="sticky top-6">
                                <ProfileCompletionChecklist profile={profile} />
                            </div>
                        </div>
                    </div>
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
        </StandardPageLayout>
    );
}
