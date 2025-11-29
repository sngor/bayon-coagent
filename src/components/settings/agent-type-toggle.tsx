'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Loader2, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateAgentProfile, getAgentProfile } from '@/app/profile-actions';

export function AgentTypeToggle() {
    const [agentType, setAgentType] = useState<'buyer' | 'seller' | 'hybrid'>('hybrid');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        async function loadProfile() {
            try {
                const result = await getAgentProfile();
                if (result.success && result.data) {
                    setAgentType(result.data.agentType || 'hybrid');
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadProfile();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('agentType', agentType);

            // We need to pass other required fields if they are missing in the partial update?
            // updateAgentProfile handles partial updates, so just sending agentType should be fine
            // provided the backend supports it.
            // Let's check profile-actions.ts implementation.
            // It uses updateAgentProfileSchema = agentProfileSchema.partial();
            // So sending just one field is valid.

            const result = await updateAgentProfile({}, formData);

            if (result.success) {
                toast({
                    title: 'Settings Saved',
                    description: 'Your agent type has been updated.',
                });
            } else {
                throw new Error(result.error || 'Failed to update agent type');
            }
        } catch (error) {
            console.error('Error saving agent type:', error);
            toast({
                title: 'Error',
                description: 'Failed to save agent type. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5" />
                    Agent Focus Mode
                </CardTitle>
                <CardDescription>
                    Select your primary focus to tailor the AI's suggestions and tools.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <RadioGroup
                    value={agentType}
                    onValueChange={(value) => setAgentType(value as 'buyer' | 'seller' | 'hybrid')}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div>
                        <RadioGroupItem value="buyer" id="buyer" className="peer sr-only" />
                        <Label
                            htmlFor="buyer"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <span className="text-lg font-semibold mb-1">Buyer Agent</span>
                            <span className="text-sm text-center text-muted-foreground">
                                Focus on finding properties and helping buyers.
                            </span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="seller" id="seller" className="peer sr-only" />
                        <Label
                            htmlFor="seller"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <span className="text-lg font-semibold mb-1">Seller Agent</span>
                            <span className="text-sm text-center text-muted-foreground">
                                Focus on listings, marketing, and helping sellers.
                            </span>
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="hybrid" id="hybrid" className="peer sr-only" />
                        <Label
                            htmlFor="hybrid"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <span className="text-lg font-semibold mb-1">Hybrid</span>
                            <span className="text-sm text-center text-muted-foreground">
                                Balanced set of tools for both buyers and sellers.
                            </span>
                        </Label>
                    </div>
                </RadioGroup>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
