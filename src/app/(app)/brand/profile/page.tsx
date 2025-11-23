
'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
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
import { generateBioAction, saveContentAction } from '@/app/actions';
import { Save, User, Building2, Award, Phone, Share2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';

import { ProfileCompletionChecklist } from '@/components/profile-completion-banner';
import { StandardLoadingSpinner } from '@/components/standard';
import { STICKY_POSITIONS } from '@/lib/utils';

const initialBioState = {
    message: '',
    data: '',
    errors: {}
};

function SaveButton({ content, type }: { content: string, type: string }) {
    const { user } = useUser();
    const [isPending, startTransition] = useTransition();

    const handleSave = async () => {
        if (!user?.id || !content) {
            toast({ variant: 'destructive', title: 'Could not save', description: 'Content or user is missing.' });
            return;
        }
        startTransition(async () => {
            try {
                const result = await saveContentAction(user.id, content, type);
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
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <User className="h-4 w-4" />
                <span>BASIC INFORMATION</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StandardFormField label="Full Name" id="name" required>
                    <Input id="name" name="name" value={profile.name || ''} onChange={onInputChange} placeholder="John Smith" />
                </StandardFormField>
                <StandardFormField label="Agency Name" id="agencyName" required>
                    <Input id="agencyName" name="agencyName" type="text" value={profile.agencyName || ''} onChange={onInputChange} placeholder="Smith Realty Group" />
                </StandardFormField>
            </div>
        </div>
    );
}

function ProfessionalDetailsSection({ profile, onInputChange }: { profile: Partial<Profile>, onInputChange: any }) {
    return (
        <div className="space-y-6">
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
                hint="Add your certifications (e.g., CRS, ABR, GRI)"
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
        <div className="space-y-6">
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
        <div className="space-y-6">
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
                hint="This helps clients find you and improves your local search ranking"
            >
                <Input id="address" name="address" value={profile.address || ''} onChange={onInputChange} placeholder="123 Main St, Seattle, WA 98101" />
            </StandardFormField>
            <StandardFormField
                label="Zillow Email"
                id="zillowEmail"
                hint="We'll use this to import your Zillow reviews"
            >
                <Input id="zillowEmail" name="zillowEmail" type="email" value={profile.zillowEmail || ''} onChange={onInputChange} placeholder="your-email@zillow-premier-agent.com" />
            </StandardFormField>
        </div>
    );
}

function SocialLinksSection({ profile, onInputChange }: { profile: Partial<Profile>, onInputChange: any }) {
    return (
        <div className="space-y-6">
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
            <p className="text-xs text-muted-foreground">Adding social profiles helps Google verify your expertise and authority</p>
        </div>
    );
}

function ProfileForm({ profile, onInputChange, onSave, isSaving, isLoading, bioFormAction }: { profile: Partial<Profile>, onInputChange: any, onSave: any, isSaving: boolean, isLoading: boolean, bioFormAction: any }) {
    return (
        <div className="space-y-8">
            {/* Main Profile Information Card */}
            <Card>
                <CardHeader className="pb-6">
                    <CardTitle className="font-headline">Profile Information</CardTitle>
                    <CardDescription>
                        Build the professional profile that gets you found and trusted online
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-0">
                    <BasicInfoSection profile={profile} onInputChange={onInputChange} />
                    <div className="py-2">
                        <Separator />
                    </div>
                    <ProfessionalDetailsSection profile={profile} onInputChange={onInputChange} />
                    <div className="py-2">
                        <Separator />
                    </div>
                    <BioSection profile={profile} onInputChange={onInputChange} bioFormAction={bioFormAction} />
                    <div className="py-2">
                        <Separator />
                    </div>
                    <ContactSection profile={profile} onInputChange={onInputChange} />
                    <div className="py-2">
                        <Separator />
                    </div>
                    <SocialLinksSection profile={profile} onInputChange={onInputChange} />
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-6">
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
    const { user, isUserLoading } = useUser();
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [isSaving, setIsSaving] = useState(false);

    const [bioState, bioFormAction] = useActionState(generateBioAction, initialBioState);

    const [isLoading, setIsLoading] = useState(true);

    // Load profile data using server action instead of useItem hook
    useEffect(() => {
        const loadProfile = async () => {
            if (isUserLoading) {
                return;
            }

            if (!user?.id) {
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                const { getProfileAction } = await import('@/app/actions');
                const result = await getProfileAction(user.id);

                console.log('Profile load result:', result);

                if (result.message === 'success' && result.data) {
                    // Ensure certifications is properly formatted for the form
                    const profileData: Partial<Profile> = {
                        ...result.data,
                        certifications: Array.isArray(result.data.certifications)
                            ? result.data.certifications.join(', ')
                            : result.data.certifications || '',
                        yearsOfExperience: result.data.yearsOfExperience?.toString() || ''
                    };
                    setProfile(profileData);
                } else {
                    console.log('No profile data found, using empty profile');
                    // Initialize with empty profile if no data found
                    const emptyProfile: Partial<Profile> = {
                        name: '',
                        agencyName: '',
                        phone: '',
                        address: '',
                        bio: '',
                        yearsOfExperience: '',
                        licenseNumber: '',
                        website: '',
                        certifications: '',
                        linkedin: '',
                        twitter: '',
                        facebook: '',
                        zillowEmail: '',
                        photoURL: ''
                    };
                    setProfile(emptyProfile);
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
                toast({
                    variant: 'destructive',
                    title: 'Failed to Load Profile',
                    description: 'Could not load your profile data. Please try refreshing the page.',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [user?.id, isUserLoading]);

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



    const handleSave = async () => {
        if (!user?.id) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Not logged in.",
            });
            return;
        }

        // Validate required fields
        const requiredFields = {
            name: 'Full Name',
            agencyName: 'Agency Name',
            phone: 'Phone Number',
            address: 'Business Address',
        };

        const missingFields = Object.entries(requiredFields)
            .filter(([key]) => !profile[key as keyof Profile])
            .map(([, label]) => label);

        if (missingFields.length > 0) {
            toast({
                variant: "destructive",
                title: "Missing Required Fields",
                description: `Please fill in: ${missingFields.join(', ')}`,
            });
            return;
        }

        setIsSaving(true);

        try {
            const dataToSave = {
                ...profile,
                certifications: typeof profile.certifications === 'string'
                    ? profile.certifications.split(',').map(s => s.trim()).filter(Boolean)
                    : (profile.certifications || []),
                yearsOfExperience: Number(profile.yearsOfExperience) || 0,
            };

            console.log('Saving profile data:', dataToSave);

            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('profile', JSON.stringify(dataToSave));

            const { saveProfileAction } = await import('@/app/actions');
            const result = await saveProfileAction({}, formData);

            console.log('Save result:', result);

            if (result.message === 'success') {
                // Update local state with the saved data (formatted for form display)
                const updatedProfile: Partial<Profile> = {
                    ...dataToSave,
                    certifications: Array.isArray(dataToSave.certifications)
                        ? dataToSave.certifications.join(', ')
                        : dataToSave.certifications || '',
                    yearsOfExperience: dataToSave.yearsOfExperience?.toString() || ''
                };
                setProfile(updatedProfile);

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
        <div className="space-y-6">
            <Tabs defaultValue="profile">
                <TabsList>
                    <TabsTrigger value="profile">
                        <span className="whitespace-nowrap">Your Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="schema">
                        <span className="whitespace-nowrap">Schema</span>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <ProfileForm
                                profile={profile}
                                onInputChange={handleInputChange}
                                onSave={handleSave}
                                isSaving={isSaving}
                                isLoading={isLoading}
                                bioFormAction={bioFormAction}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <div className={`sticky ${STICKY_POSITIONS.BELOW_HUB_TABS}`}>
                                <ProfileCompletionChecklist profile={profile} />
                            </div>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="schema" className="mt-8">
                    <div className="grid gap-8 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-6">
                                <CardTitle className="font-headline">RealEstateAgent Schema</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <JsonLdDisplay schema={generateAgentSchema(profile)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-6">
                                <CardTitle className="font-headline">RealEstateAgency Schema</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <JsonLdDisplay schema={generateAgencySchema(profile)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
