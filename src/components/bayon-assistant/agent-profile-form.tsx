'use client';

/**
 * Agent Profile Form Component
 * 
 * Form component for creating and updating Kiro AI Assistant agent profiles.
 * Provides validation, error display, and save/update handling.
 * 
 * Requirements: 8.1, 8.4
 */

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import {
    createAgentProfile,
    updateAgentProfile,
    type ProfileActionResponse,
} from '@/app/profile-actions';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Save, AlertCircle, Sparkles } from 'lucide-react';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

interface AgentProfileFormProps {
    /** Existing profile data for editing (undefined for creation) */
    profile?: AgentProfile;
    /** Callback when profile is successfully saved */
    onSuccess?: (profile: AgentProfile) => void;
    /** Callback when form is cancelled */
    onCancel?: () => void;
}

const initialState: ProfileActionResponse = {
    success: false,
};

/**
 * Submit button with loading state
 */
function SubmitButton({ isEdit }: { isEdit: boolean }) {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? (
                <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {isEdit ? 'Updating...' : 'Creating...'}
                </>
            ) : (
                <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEdit ? 'Update Profile' : 'Create Profile'}
                </>
            )}
        </Button>
    );
}

/**
 * Agent Profile Form Component
 * 
 * Provides a form for creating or updating agent profiles with:
 * - All required profile fields
 * - Validation and error display
 * - Save/update handling
 * - Success/error feedback
 */
export function AgentProfileForm({
    profile,
    onSuccess,
    onCancel,
}: AgentProfileFormProps) {
    const isEdit = !!profile;
    const action = isEdit ? updateAgentProfile : createAgentProfile;
    const [state, formAction] = useActionState(action, initialState);

    // Handle success/error feedback
    useEffect(() => {
        if (state.success && state.data) {
            toast({
                title: isEdit ? 'Profile Updated' : 'Profile Created',
                description: state.message || 'Your agent profile has been saved successfully.',
            });
            onSuccess?.(state.data);
        } else if (state.error) {
            toast({
                variant: 'destructive',
                title: isEdit ? 'Update Failed' : 'Creation Failed',
                description: state.error,
            });
        }
    }, [state, isEdit, onSuccess]);

    return (
        <form action={formAction}>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <CardTitle className="font-headline">
                            {isEdit ? 'Edit Agent Profile' : 'Create Agent Profile'}
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Personalize your Kiro AI Assistant with your professional information.
                        This profile will be used to tailor all AI responses to your market and style.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* General Error Display */}
                    {state.error && !state.errors && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Agent Name */}
                    <div className="space-y-2">
                        <Label htmlFor="agentName">
                            Agent Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="agentName"
                            name="agentName"
                            defaultValue={profile?.agentName}
                            placeholder="Jane Smith"
                            required
                            maxLength={100}
                        />
                        {state.errors?.agentName && (
                            <p className="text-sm text-destructive">
                                {state.errors.agentName[0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your professional name as you want it to appear in AI-generated content
                        </p>
                    </div>

                    {/* Primary Market */}
                    <div className="space-y-2">
                        <Label htmlFor="primaryMarket">
                            Primary Market <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="primaryMarket"
                            name="primaryMarket"
                            defaultValue={profile?.primaryMarket}
                            placeholder="Austin, TX"
                            required
                            maxLength={200}
                        />
                        {state.errors?.primaryMarket && (
                            <p className="text-sm text-destructive">
                                {state.errors.primaryMarket[0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            The geographic area you primarily serve (e.g., "Austin, TX" or "San Francisco Bay Area")
                        </p>
                    </div>

                    {/* Specialization */}
                    <div className="space-y-2">
                        <Label htmlFor="specialization">
                            Specialization <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            name="specialization"
                            defaultValue={profile?.specialization || 'general'}
                            required
                        >
                            <SelectTrigger id="specialization">
                                <SelectValue placeholder="Select your specialization" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="luxury">Luxury Properties</SelectItem>
                                <SelectItem value="first-time-buyers">First-Time Buyers</SelectItem>
                                <SelectItem value="investment">Investment Properties</SelectItem>
                                <SelectItem value="commercial">Commercial Real Estate</SelectItem>
                                <SelectItem value="general">General Real Estate</SelectItem>
                            </SelectContent>
                        </Select>
                        {state.errors?.specialization && (
                            <p className="text-sm text-destructive">
                                {state.errors.specialization[0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your area of expertise - helps tailor property suggestions and content
                        </p>
                    </div>

                    {/* Preferred Tone */}
                    <div className="space-y-2">
                        <Label htmlFor="preferredTone">
                            Preferred Tone <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            name="preferredTone"
                            defaultValue={profile?.preferredTone || 'professional'}
                            required
                        >
                            <SelectTrigger id="preferredTone">
                                <SelectValue placeholder="Select your preferred tone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="warm-consultative">
                                    Warm & Consultative
                                </SelectItem>
                                <SelectItem value="direct-data-driven">
                                    Direct & Data-Driven
                                </SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="casual">Casual & Friendly</SelectItem>
                            </SelectContent>
                        </Select>
                        {state.errors?.preferredTone && (
                            <p className="text-sm text-destructive">
                                {state.errors.preferredTone[0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            The communication style you prefer for AI-generated content
                        </p>
                    </div>

                    {/* Core Principle */}
                    <div className="space-y-2">
                        <Label htmlFor="corePrinciple">
                            Core Principle <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="corePrinciple"
                            name="corePrinciple"
                            defaultValue={profile?.corePrinciple}
                            placeholder="Maximize client ROI with data-first strategies and personalized service"
                            required
                            minLength={10}
                            maxLength={500}
                            rows={4}
                        />
                        {state.errors?.corePrinciple && (
                            <p className="text-sm text-destructive">
                                {state.errors.corePrinciple[0]}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Your guiding philosophy or mission statement (10-500 characters)
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="flex justify-between items-center border-t pt-6">
                    <p className="text-sm text-muted-foreground">
                        <span className="text-destructive">*</span> Required fields
                    </p>
                    <div className="flex gap-2">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <SubmitButton isEdit={isEdit} />
                    </div>
                </CardFooter>
            </Card>
        </form>
    );
}
