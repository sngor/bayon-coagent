'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/aws/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { createDashboard } from '@/app/client-dashboard-actions';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';

export default function NewClientDashboardPage() {
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [propertyInterests, setPropertyInterests] = useState('');
    const [notes, setNotes] = useState('');
    const [enableCMA, setEnableCMA] = useState(false);
    const [enablePropertySearch, setEnablePropertySearch] = useState(true);
    const [enableHomeValuation, setEnableHomeValuation] = useState(true);
    const [enableDocuments, setEnableDocuments] = useState(true);
    const [enableCalculators, setEnableCalculators] = useState(false);
    const [enableMilestones, setEnableMilestones] = useState(false);
    const [enableVendors, setEnableVendors] = useState(false);
    const [primaryColor, setPrimaryColor] = useState('#3b82f6');
    const [welcomeMessage, setWelcomeMessage] = useState('Welcome to your personalized real estate portal!');
    const [agentPhone, setAgentPhone] = useState('');
    const [agentEmail, setAgentEmail] = useState('');

    // Handle create dashboard
    const handleCreate = async () => {
        if (!user) return;

        // Validation
        if (!clientName.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Client name is required',
            });
            return;
        }

        if (!clientEmail.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Client email is required',
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(clientEmail)) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please enter a valid email address',
            });
            return;
        }

        // Validate welcome message
        if (!welcomeMessage.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Welcome message is required',
            });
            return;
        }

        // Validate agent phone
        if (!agentPhone.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Your contact phone is required',
            });
            return;
        }

        // Validate agent email
        if (!agentEmail.trim()) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Your contact email is required',
            });
            return;
        }

        // Validate agent email format
        if (!emailRegex.test(agentEmail)) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please enter a valid agent email address',
            });
            return;
        }

        setIsCreating(true);
        try {
            const formData = new FormData();
            formData.append('clientName', clientName);
            formData.append('clientEmail', clientEmail);
            formData.append('clientPhone', clientPhone);
            formData.append('propertyInterests', propertyInterests);
            formData.append('notes', notes);
            formData.append('enableCMA', enableCMA.toString());
            formData.append('enablePropertySearch', enablePropertySearch.toString());
            formData.append('enableHomeValuation', enableHomeValuation.toString());
            formData.append('enableDocuments', enableDocuments.toString());
            formData.append('enableCalculators', enableCalculators.toString());
            formData.append('enableMilestones', enableMilestones.toString());
            formData.append('enableVendors', enableVendors.toString());
            formData.append('primaryColor', primaryColor);
            formData.append('welcomeMessage', welcomeMessage);
            formData.append('agentPhone', agentPhone);
            formData.append('agentEmail', agentEmail);

            const result = await createDashboard(null, formData);

            if (result.message === 'success' && result.data) {
                toast({
                    title: 'Success',
                    description: 'Dashboard created successfully',
                });
                // Redirect to the new dashboard
                router.push(`/client-dashboards/${result.data.id}`);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result.message || 'Failed to create dashboard',
                });
                setIsCreating(false);
            }
        } catch (error) {
            console.error('Error creating dashboard:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to create dashboard',
            });
            setIsCreating(false);
        }
    };

    if (isUserLoading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="p-12">
                        <div className="flex items-center justify-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <IntelligentEmptyState
                icon={Users}
                title="Authentication Required"
                description="Please log in to create client dashboards"
                actions={[
                    {
                        label: 'Go to Login',
                        onClick: () => router.push('/login'),
                    },
                ]}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/client-dashboards')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
            </div>

            <Card>
                <CardGradientMesh>
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-2xl font-bold font-headline">
                            Create Client Dashboard
                        </CardTitle>
                        <CardDescription>
                            Set up a personalized portal for your client
                        </CardDescription>
                    </CardHeader>
                </CardGradientMesh>
            </Card>

            {/* Client Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Client Information</CardTitle>
                    <CardDescription>
                        Basic information about your client
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientName">
                                Client Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="clientName"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientEmail">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="clientEmail"
                                type="email"
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="clientPhone">Phone (Optional)</Label>
                            <Input
                                id="clientPhone"
                                type="tel"
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                placeholder="(555) 123-4567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="propertyInterests">Property Interests</Label>
                            <Input
                                id="propertyInterests"
                                value={propertyInterests}
                                onChange={(e) => setPropertyInterests(e.target.value)}
                                placeholder="3 bed, 2 bath in Downtown"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes about the client..."
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Dashboard Features */}
            <Card>
                <CardHeader>
                    <CardTitle>Dashboard Features</CardTitle>
                    <CardDescription>
                        Choose which features to enable for this client
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Property Search</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow client to search for properties
                            </p>
                        </div>
                        <Switch
                            checked={enablePropertySearch}
                            onCheckedChange={setEnablePropertySearch}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Home Valuation</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable property valuation tools
                            </p>
                        </div>
                        <Switch
                            checked={enableHomeValuation}
                            onCheckedChange={setEnableHomeValuation}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Comparative Market Analysis (CMA)</Label>
                            <p className="text-sm text-muted-foreground">
                                Show CMA reports to the client
                            </p>
                        </div>
                        <Switch checked={enableCMA} onCheckedChange={setEnableCMA} />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Documents</Label>
                            <p className="text-sm text-muted-foreground">
                                Share documents with the client
                            </p>
                        </div>
                        <Switch
                            checked={enableDocuments}
                            onCheckedChange={setEnableDocuments}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Calculators</Label>
                            <p className="text-sm text-muted-foreground">
                                Mortgage and ROI calculators
                            </p>
                        </div>
                        <Switch
                            checked={enableCalculators}
                            onCheckedChange={setEnableCalculators}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Transaction Milestones</Label>
                            <p className="text-sm text-muted-foreground">
                                Track transaction progress
                            </p>
                        </div>
                        <Switch
                            checked={enableMilestones}
                            onCheckedChange={setEnableMilestones}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Vendor Directory</Label>
                            <p className="text-sm text-muted-foreground">
                                Share recommended vendors
                            </p>
                        </div>
                        <Switch
                            checked={enableVendors}
                            onCheckedChange={setEnableVendors}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Branding */}
            <Card>
                <CardHeader>
                    <CardTitle>Branding & Contact</CardTitle>
                    <CardDescription>
                        Customize the appearance and contact information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="primaryColor"
                                type="color"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                className="w-20 h-10"
                            />
                            <Input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => setPrimaryColor(e.target.value)}
                                placeholder="#3b82f6"
                                className="flex-1"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="welcomeMessage">
                            Welcome Message <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="welcomeMessage"
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            placeholder="Welcome to your personalized real estate portal..."
                            rows={3}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="agentPhone">
                                Your Contact Phone <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="agentPhone"
                                type="tel"
                                value={agentPhone}
                                onChange={(e) => setAgentPhone(e.target.value)}
                                placeholder="(555) 987-6543"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agentEmail">
                                Your Contact Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="agentEmail"
                                type="email"
                                value={agentEmail}
                                onChange={(e) => setAgentEmail(e.target.value)}
                                placeholder="agent@example.com"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                <Button
                    variant="outline"
                    onClick={() => router.push('/client-dashboards')}
                    disabled={isCreating}
                >
                    Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                            Creating...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Dashboard
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
