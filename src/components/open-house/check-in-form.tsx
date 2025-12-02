'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { checkInVisitor } from '@/app/(app)/open-house/actions';
import { CheckInSource, InterestLevel } from '@/lib/open-house/types';

interface CheckInFormProps {
    sessionId: string;
    source: CheckInSource;
}

export function CheckInForm({ sessionId, source }: CheckInFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        interestLevel: InterestLevel.MEDIUM,
        notes: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await checkInVisitor(sessionId, {
                ...formData,
                source,
            });

            if (!result.success) {
                // Handle specific error codes
                if (result.code === 'DUPLICATE_EMAIL') {
                    toast({
                        title: 'Already Checked In',
                        description: result.error || 'This email has already been used to check in to this session.',
                        variant: 'destructive',
                    });
                } else if (result.code === 'SESSION_NOT_ACTIVE') {
                    toast({
                        title: 'Session Not Active',
                        description: result.error || 'This open house session is not currently active.',
                        variant: 'destructive',
                    });
                } else if (result.errors) {
                    // Display validation errors
                    const errorMessages = Object.values(result.errors).flat().join(', ');
                    toast({
                        title: 'Validation Error',
                        description: errorMessages,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Check-in Failed',
                        description: result.error || 'There was an error checking you in. Please try again.',
                        variant: 'destructive',
                    });
                }
                return;
            }

            toast({
                title: 'Check-in Successful',
                description: 'Thank you for checking in! We look forward to showing you around.',
            });

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                interestLevel: InterestLevel.MEDIUM,
                notes: '',
            });

            // Refresh the page to show updated stats
            router.refresh();
        } catch (error) {
            console.error('Check-in error:', error);
            toast({
                title: 'Check-in Failed',
                description: 'There was an unexpected error. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">
                    Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    required
                    disabled={isSubmitting}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="interestLevel">
                    Interest Level <span className="text-destructive">*</span>
                </Label>
                <Select
                    value={formData.interestLevel}
                    onValueChange={(value: InterestLevel) =>
                        setFormData({ ...formData, interestLevel: value })
                    }
                    disabled={isSubmitting}
                >
                    <SelectTrigger id="interestLevel">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={InterestLevel.HIGH}>
                            High - Ready to make an offer
                        </SelectItem>
                        <SelectItem value={InterestLevel.MEDIUM}>
                            Medium - Seriously considering
                        </SelectItem>
                        <SelectItem value={InterestLevel.LOW}>Low - Just browsing</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any questions or comments..."
                    rows={3}
                    disabled={isSubmitting}
                />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Checking In...
                    </>
                ) : (
                    'Check In'
                )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
                Your information will be used to follow up about this property
            </p>
        </form>
    );
}
