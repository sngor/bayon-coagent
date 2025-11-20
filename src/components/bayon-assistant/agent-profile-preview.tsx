'use client';

/**
 * Agent Profile Preview Component
 * 
 * Display component for viewing agent profile information with edit mode toggle.
 * Shows all profile fields in a read-only card format.
 * 
 * Requirements: 8.3
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    User,
    MapPin,
    Briefcase,
    MessageSquare,
    Target,
    Edit,
    Calendar,
    Sparkles,
} from 'lucide-react';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import { AgentProfileForm } from './agent-profile-form';

interface AgentProfilePreviewProps {
    /** Agent profile data to display */
    profile: AgentProfile;
    /** Callback when profile is updated */
    onUpdate?: (profile: AgentProfile) => void;
    /** Whether to show edit button */
    showEditButton?: boolean;
}

/**
 * Maps specialization values to display labels
 */
const specializationLabels: Record<AgentProfile['specialization'], string> = {
    luxury: 'Luxury Properties',
    'first-time-buyers': 'First-Time Buyers',
    investment: 'Investment Properties',
    commercial: 'Commercial Real Estate',
    general: 'General Real Estate',
};

/**
 * Maps tone values to display labels
 */
const toneLabels: Record<AgentProfile['preferredTone'], string> = {
    'warm-consultative': 'Warm & Consultative',
    'direct-data-driven': 'Direct & Data-Driven',
    professional: 'Professional',
    casual: 'Casual & Friendly',
};

/**
 * Profile field display component
 */
function ProfileField({
    icon: Icon,
    label,
    value,
    badge,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    badge?: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                {badge ? (
                    <Badge variant="secondary" className="font-normal">
                        {value}
                    </Badge>
                ) : (
                    <p className="text-sm">{value}</p>
                )}
            </div>
        </div>
    );
}

/**
 * Agent Profile Preview Component
 * 
 * Displays agent profile information in a card format with:
 * - All profile fields in read-only view
 * - Edit mode toggle
 * - Formatted dates
 * - Visual hierarchy with icons
 */
export function AgentProfilePreview({
    profile,
    onUpdate,
    showEditButton = true,
}: AgentProfilePreviewProps) {
    const [isEditing, setIsEditing] = useState(false);

    const handleSuccess = (updatedProfile: AgentProfile) => {
        setIsEditing(false);
        onUpdate?.(updatedProfile);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    // Format dates for display
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    // If in edit mode, show the form
    if (isEditing) {
        return (
            <AgentProfileForm
                profile={profile}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        );
    }

    // Otherwise, show the preview
    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="font-headline">Agent Profile</CardTitle>
                        </div>
                        <CardDescription>
                            Your personalization settings for the Kiro AI Assistant
                        </CardDescription>
                    </div>
                    {showEditButton && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Basic Information
                    </h3>
                    <div className="space-y-4">
                        <ProfileField
                            icon={User}
                            label="Agent Name"
                            value={profile.agentName}
                        />
                        <ProfileField
                            icon={MapPin}
                            label="Primary Market"
                            value={profile.primaryMarket}
                        />
                    </div>
                </div>

                <Separator />

                {/* Professional Details */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Professional Details
                    </h3>
                    <div className="space-y-4">
                        <ProfileField
                            icon={Briefcase}
                            label="Specialization"
                            value={specializationLabels[profile.specialization]}
                            badge
                        />
                        <ProfileField
                            icon={MessageSquare}
                            label="Preferred Tone"
                            value={toneLabels[profile.preferredTone]}
                            badge
                        />
                    </div>
                </div>

                <Separator />

                {/* Core Principle */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Core Principle
                    </h3>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm leading-relaxed">{profile.corePrinciple}</p>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {formatDate(profile.createdAt)}</span>
                    </div>
                    {profile.updatedAt !== profile.createdAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Last updated: {formatDate(profile.updatedAt)}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
