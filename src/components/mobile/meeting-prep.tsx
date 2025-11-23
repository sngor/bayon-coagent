'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Users, MapPin, DollarSign, FileText, Lightbulb, TrendingUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper function for currency formatting
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Types from design document
export interface MeetingPrepProps {
    userId: string;
    onGenerate: (materials: MeetingMaterials) => void;
}

export interface MeetingPrepRequest {
    clientName: string;
    clientEmail: string;
    meetingPurpose: string;
    propertyInterests: string[];
    budget: { min: number; max: number };
    notes: string;
}

export interface MeetingMaterials {
    summary: string;
    propertyRecommendations: Property[];
    marketInsights: string;
    discussionTopics: string[];
    editable: boolean;
}

interface Property {
    id: string;
    address: string;
    price: number;
    size: number;
    beds: number;
    baths: number;
    features: string[];
    photos: string[];
    matchReason?: string; // Optional to match the schema
}

interface MeetingPrepFormProps {
    userId: string;
    onSubmit: (request: MeetingPrepRequest) => void;
    isLoading?: boolean;
    className?: string;
}

export function MeetingPrepForm({ userId, onSubmit, isLoading = false, className }: MeetingPrepFormProps) {
    const [formData, setFormData] = useState<MeetingPrepRequest>({
        clientName: '',
        clientEmail: '',
        meetingPurpose: '',
        propertyInterests: [],
        budget: { min: 0, max: 0 },
        notes: ''
    });

    const [newPropertyInterest, setNewPropertyInterest] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.clientName.trim()) {
            newErrors.clientName = 'Client name is required';
        }

        if (!formData.clientEmail.trim()) {
            newErrors.clientEmail = 'Client email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
            newErrors.clientEmail = 'Please enter a valid email address';
        }

        if (!formData.meetingPurpose.trim()) {
            newErrors.meetingPurpose = 'Meeting purpose is required';
        }

        if (formData.budget.min < 0) {
            newErrors.budgetMin = 'Minimum budget cannot be negative';
        }

        if (formData.budget.max < 0) {
            newErrors.budgetMax = 'Maximum budget cannot be negative';
        }

        if (formData.budget.min > 0 && formData.budget.max > 0 && formData.budget.min > formData.budget.max) {
            newErrors.budgetMax = 'Maximum budget must be greater than minimum budget';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        onSubmit(formData);
    };

    const addPropertyInterest = () => {
        if (newPropertyInterest.trim() && !formData.propertyInterests.includes(newPropertyInterest.trim())) {
            setFormData(prev => ({
                ...prev,
                propertyInterests: [...prev.propertyInterests, newPropertyInterest.trim()]
            }));
            setNewPropertyInterest('');
        }
    };

    const removePropertyInterest = (interest: string) => {
        setFormData(prev => ({
            ...prev,
            propertyInterests: prev.propertyInterests.filter(item => item !== interest)
        }));
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Card className={cn("w-full max-w-2xl mx-auto", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Meeting Preparation
                </CardTitle>
                <CardDescription>
                    Generate AI-powered meeting materials with client information, property recommendations, and market insights
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Client Information */}
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Client Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="clientName">Client Name *</Label>
                                <Input
                                    id="clientName"
                                    type="text"
                                    value={formData.clientName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                    placeholder="Enter client's full name"
                                    className={errors.clientName ? 'border-red-500' : ''}
                                />
                                {errors.clientName && (
                                    <p className="text-sm text-red-500">{errors.clientName}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="clientEmail">Client Email *</Label>
                                <Input
                                    id="clientEmail"
                                    type="email"
                                    value={formData.clientEmail}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                                    placeholder="client@example.com"
                                    className={errors.clientEmail ? 'border-red-500' : ''}
                                />
                                {errors.clientEmail && (
                                    <p className="text-sm text-red-500">{errors.clientEmail}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Meeting Purpose */}
                    <div className="space-y-2">
                        <Label htmlFor="meetingPurpose">Meeting Purpose *</Label>
                        <Textarea
                            id="meetingPurpose"
                            value={formData.meetingPurpose}
                            onChange={(e) => setFormData(prev => ({ ...prev, meetingPurpose: e.target.value }))}
                            placeholder="Describe the purpose of this meeting (e.g., first-time buyer consultation, property showing, market analysis)"
                            rows={3}
                            className={errors.meetingPurpose ? 'border-red-500' : ''}
                        />
                        {errors.meetingPurpose && (
                            <p className="text-sm text-red-500">{errors.meetingPurpose}</p>
                        )}
                    </div>

                    {/* Property Interests */}
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Property Interests
                        </h3>

                        <div className="flex gap-2">
                            <Input
                                value={newPropertyInterest}
                                onChange={(e) => setNewPropertyInterest(e.target.value)}
                                placeholder="Add property type or location (e.g., Single family homes, Downtown condos)"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPropertyInterest())}
                            />
                            <Button
                                type="button"
                                onClick={addPropertyInterest}
                                variant="outline"
                                size="icon"
                                disabled={!newPropertyInterest.trim()}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {formData.propertyInterests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.propertyInterests.map((interest, index) => (
                                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                        {interest}
                                        <button
                                            type="button"
                                            onClick={() => removePropertyInterest(interest)}
                                            className="ml-1 hover:text-red-500"
                                            title={`Remove ${interest}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-4">
                        <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Budget Range
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="budgetMin">Minimum Budget</Label>
                                <Input
                                    id="budgetMin"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={formData.budget.min || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        budget: { ...prev.budget, min: parseInt(e.target.value) || 0 }
                                    }))}
                                    placeholder="0"
                                    className={errors.budgetMin ? 'border-red-500' : ''}
                                />
                                {errors.budgetMin && (
                                    <p className="text-sm text-red-500">{errors.budgetMin}</p>
                                )}
                                {formData.budget.min > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {formatCurrency(formData.budget.min)}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="budgetMax">Maximum Budget</Label>
                                <Input
                                    id="budgetMax"
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={formData.budget.max || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        budget: { ...prev.budget, max: parseInt(e.target.value) || 0 }
                                    }))}
                                    placeholder="0"
                                    className={errors.budgetMax ? 'border-red-500' : ''}
                                />
                                {errors.budgetMax && (
                                    <p className="text-sm text-red-500">{errors.budgetMax}</p>
                                )}
                                {formData.budget.max > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {formatCurrency(formData.budget.max)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any additional information about the client or meeting (optional)"
                            rows={3}
                        />
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Meeting Materials...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="mr-2 h-4 w-4" />
                                Generate Meeting Materials
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

interface MeetingMaterialsDisplayProps {
    materials: MeetingMaterials;
    onEdit: (materials: MeetingMaterials) => void;
    onSave: () => void;
    isEditing?: boolean;
    isSaving?: boolean;
    className?: string;
}

export function MeetingMaterialsDisplay({
    materials,
    onEdit,
    onSave,
    isEditing = false,
    isSaving = false,
    className
}: MeetingMaterialsDisplayProps) {
    const [editableMaterials, setEditableMaterials] = useState<MeetingMaterials>(materials);

    React.useEffect(() => {
        setEditableMaterials(materials);
    }, [materials]);

    const handleSave = () => {
        onEdit(editableMaterials);
        onSave();
    };

    return (
        <Card className={cn("w-full max-w-4xl mx-auto", className)}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Meeting Materials
                    </span>
                    <div className="flex gap-2">
                        {!isEditing ? (
                            <Button
                                variant="outline"
                                onClick={() => onEdit(editableMaterials)}
                                disabled={isSaving}
                            >
                                Edit Materials
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save to Library'
                                )}
                            </Button>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary */}
                <div className="space-y-3">
                    <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Meeting Summary
                    </h3>
                    {isEditing ? (
                        <Textarea
                            value={editableMaterials.summary}
                            onChange={(e) => setEditableMaterials(prev => ({ ...prev, summary: e.target.value }))}
                            rows={4}
                            className="w-full"
                        />
                    ) : (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="whitespace-pre-wrap">{materials.summary}</p>
                        </div>
                    )}
                </div>

                {/* Property Recommendations */}
                <div className="space-y-3">
                    <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Property Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {materials.propertyRecommendations.map((property, index) => (
                            <Card key={property.id} className="p-4">
                                <div className="space-y-2">
                                    <h4 className="font-headline font-medium">{property.address}</h4>
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{formatCurrency(property.price)}</span>
                                        <span>{property.beds} bed, {property.baths} bath</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {property.size.toLocaleString()} sq ft
                                    </div>
                                    {property.features.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {property.features.slice(0, 3).map((feature, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {feature}
                                                </Badge>
                                            ))}
                                            {property.features.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{property.features.length - 3} more
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Market Insights */}
                <div className="space-y-3">
                    <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Market Insights
                    </h3>
                    {isEditing ? (
                        <Textarea
                            value={editableMaterials.marketInsights}
                            onChange={(e) => setEditableMaterials(prev => ({ ...prev, marketInsights: e.target.value }))}
                            rows={4}
                            className="w-full"
                        />
                    ) : (
                        <div className="p-4 bg-muted rounded-lg">
                            <p className="whitespace-pre-wrap">{materials.marketInsights}</p>
                        </div>
                    )}
                </div>

                {/* Discussion Topics */}
                <div className="space-y-3">
                    <h3 className="font-headline text-lg font-semibold flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Discussion Topics
                    </h3>
                    <div className="space-y-2">
                        {materials.discussionTopics.map((topic, index) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-0.5">
                                    {index + 1}
                                </div>
                                {isEditing ? (
                                    <Input
                                        value={topic}
                                        onChange={(e) => {
                                            const newTopics = [...editableMaterials.discussionTopics];
                                            newTopics[index] = e.target.value;
                                            setEditableMaterials(prev => ({ ...prev, discussionTopics: newTopics }));
                                        }}
                                        className="flex-1"
                                    />
                                ) : (
                                    <p className="flex-1">{topic}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Main Meeting Prep Component
export default function MeetingPrep({ userId, onGenerate }: MeetingPrepProps) {
    const [materials, setMaterials] = useState<MeetingMaterials | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerateMaterials = async (request: MeetingPrepRequest) => {
        setIsGenerating(true);
        try {
            // Check if we're online
            const isOnline = navigator.onLine;

            if (isOnline) {
                // Import the server action dynamically to avoid SSR issues
                const { generateMeetingPrepAction } = await import('@/app/mobile-actions');

                const result = await generateMeetingPrepAction({
                    ...request,
                    userId
                });

                if (!result.success || !result.materials) {
                    throw new Error(result.error || 'Failed to generate meeting materials');
                }

                // Convert the Bedrock output to our component format
                const convertedMaterials: MeetingMaterials = {
                    summary: result.materials.summary,
                    propertyRecommendations: result.materials.propertyRecommendations,
                    marketInsights: result.materials.marketInsights,
                    discussionTopics: result.materials.discussionTopics,
                    editable: true
                };

                setMaterials(convertedMaterials);
                onGenerate(convertedMaterials);
            } else {
                // Queue the request for when we're back online
                const { OfflineSyncManager } = await import('@/lib/offline-sync-manager');
                const syncManager = new OfflineSyncManager();

                const operationId = await syncManager.queueOperation({
                    type: 'meeting-prep',
                    data: {
                        ...request,
                        userId,
                        operationType: 'generate',
                        timestamp: Date.now()
                    },
                    timestamp: Date.now()
                });

                console.log('Meeting prep request queued for offline sync:', operationId);

                // Show a message to the user that the request has been queued
                // For now, we'll create placeholder materials to show the UI
                const placeholderMaterials: MeetingMaterials = {
                    summary: `Meeting preparation request for ${request.clientName} has been queued. Materials will be generated when connectivity is restored.`,
                    propertyRecommendations: [],
                    marketInsights: 'Market insights will be available when connectivity is restored.',
                    discussionTopics: [
                        'This meeting prep request is queued for processing',
                        'Materials will be generated when you\'re back online',
                        'Check back later for complete meeting materials'
                    ],
                    editable: false
                };

                setMaterials(placeholderMaterials);
                onGenerate(placeholderMaterials);
            }
            return; // Exit early since we have real data

            // Mock materials (fallback - this code won't be reached)
            const mockMaterials: MeetingMaterials = {
                summary: `Meeting with ${request.clientName} scheduled for ${request.meetingPurpose}. Client is interested in ${request.propertyInterests.join(', ')} with a budget range of $${request.budget.min.toLocaleString()} - $${request.budget.max.toLocaleString()}.`,
                propertyRecommendations: [
                    {
                        id: '1',
                        address: '123 Main St, Anytown, ST 12345',
                        price: Math.floor((request.budget.min + request.budget.max) / 2),
                        size: 2000,
                        beds: 3,
                        baths: 2,
                        features: ['Updated Kitchen', 'Hardwood Floors', 'Garage'],
                        photos: []
                    }
                ],
                marketInsights: 'Current market conditions show strong buyer activity in the requested price range. Inventory levels are moderate with average days on market at 25 days.',
                discussionTopics: [
                    'Review current market conditions and trends',
                    'Discuss financing options and pre-approval status',
                    'Explore property preferences and must-haves',
                    'Schedule property viewings for recommended listings'
                ],
                editable: true
            };

            setMaterials(mockMaterials);
            onGenerate(mockMaterials);
        } catch (error) {
            console.error('Failed to generate meeting materials:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEditMaterials = (updatedMaterials: MeetingMaterials) => {
        setMaterials(updatedMaterials);
        setIsEditing(true);
    };

    const handleSaveMaterials = async () => {
        if (!materials) return;

        setIsSaving(true);
        try {
            // Check if we're online
            const isOnline = navigator.onLine;

            // Generate a unique ID for this meeting prep
            const prepId = `prep-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            if (isOnline) {
                // Import the server action dynamically to avoid SSR issues
                const { saveMeetingPrepAction } = await import('@/app/mobile-actions');

                const result = await saveMeetingPrepAction({
                    prepId,
                    clientInfo: {
                        clientName: 'Client', // This would come from the original request
                        clientEmail: 'client@example.com', // This would come from the original request
                        meetingPurpose: 'Meeting', // This would come from the original request
                        propertyInterests: [], // This would come from the original request
                        budget: { min: 0, max: 0 }, // This would come from the original request
                        notes: '' // This would come from the original request
                    },
                    materials: {
                        summary: materials.summary,
                        propertyRecommendations: materials.propertyRecommendations.map(prop => ({
                            ...prop,
                            matchReason: prop.matchReason || 'Matches client criteria'
                        })),
                        marketInsights: materials.marketInsights,
                        discussionTopics: materials.discussionTopics,
                        followUpActions: [], // Default empty array
                        preparationChecklist: [] // Default empty array
                    },
                    userId
                });

                if (!result.success) {
                    throw new Error(result.error || 'Failed to save meeting materials');
                }

                console.log('Meeting materials saved to library:', result.prepId);
                setIsEditing(false);
            } else {
                // Queue the save request for when we're back online
                const { OfflineSyncManager } = await import('@/lib/offline-sync-manager');
                const syncManager = new OfflineSyncManager();

                const operationId = await syncManager.queueOperation({
                    type: 'meeting-prep',
                    data: {
                        prepId,
                        clientName: 'Client', // This would come from the original request
                        clientEmail: 'client@example.com', // This would come from the original request
                        meetingPurpose: 'Meeting', // This would come from the original request
                        propertyInterests: [], // This would come from the original request
                        budget: { min: 0, max: 0 }, // This would come from the original request
                        notes: '', // This would come from the original request
                        materials: {
                            summary: materials.summary,
                            propertyRecommendations: materials.propertyRecommendations.map(prop => ({
                                ...prop,
                                matchReason: prop.matchReason || 'Matches client criteria'
                            })),
                            marketInsights: materials.marketInsights,
                            discussionTopics: materials.discussionTopics,
                            followUpActions: [], // Default empty array
                            preparationChecklist: [] // Default empty array
                        },
                        userId,
                        operationType: 'save',
                        timestamp: Date.now()
                    },
                    timestamp: Date.now()
                });

                console.log('Meeting prep save request queued for offline sync:', operationId);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to save materials:', error);
            // You might want to show a toast or error message to the user here
        } finally {
            setIsSaving(false);
        }
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="space-y-6">
            {!materials ? (
                <MeetingPrepForm
                    userId={userId}
                    onSubmit={handleGenerateMaterials}
                    isLoading={isGenerating}
                />
            ) : (
                <MeetingMaterialsDisplay
                    materials={materials}
                    onEdit={handleEditMaterials}
                    onSave={handleSaveMaterials}
                    isEditing={isEditing}
                    isSaving={isSaving}
                />
            )}
        </div>
    );
}