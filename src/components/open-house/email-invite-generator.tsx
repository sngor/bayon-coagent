'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Copy, Check, Download, Calendar } from 'lucide-react';
import { generateOpenHouseEmailInvite } from '@/app/(app)/open-house/actions';
import { toast } from '@/hooks/use-toast';
import type { GenerateOpenHouseEmailInviteOutput } from '@/aws/bedrock/flows/generate-open-house-marketing';

interface EmailInviteGeneratorProps {
    sessionId: string;
}

type RecipientType = 'general' | 'past_client' | 'sphere_of_influence';

/**
 * Component for generating email invitations with calendar attachments
 * Validates Requirements: 16.4
 */
export function EmailInviteGenerator({ sessionId }: EmailInviteGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [invitation, setInvitation] = useState<GenerateOpenHouseEmailInviteOutput | null>(null);
    const [recipientType, setRecipientType] = useState<RecipientType>('general');
    const [personalMessage, setPersonalMessage] = useState('');
    const [includeCalendar, setIncludeCalendar] = useState(true);
    const [includeRSVP, setIncludeRSVP] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const recipientTypes = {
        general: {
            label: 'General Public',
            description: 'Broad appeal for anyone interested in the property',
        },
        past_client: {
            label: 'Past Clients',
            description: 'Personalized for previous clients and referrals',
        },
        sphere_of_influence: {
            label: 'Sphere of Influence',
            description: 'Tailored for your network and connections',
        },
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await generateOpenHouseEmailInvite(sessionId, {
                recipientType,
                personalMessage: personalMessage || undefined,
                includeCalendarAttachment: includeCalendar,
                includeRSVPLink: includeRSVP,
            });

            if (result.success && result.invitation) {
                setInvitation(result.invitation);
                toast({
                    title: '✨ Invitation Generated!',
                    description: 'Your email invitation is ready to send',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Generation Failed',
                    description: result.error || 'Failed to generate email invitation',
                });
            }
        } catch (error) {
            console.error('Email invitation generation error:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: 'An unexpected error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (field: string, content: string) => {
        navigator.clipboard.writeText(content);
        setCopiedField(field);
        toast({
            title: '✨ Copied!',
            description: `${field} copied to clipboard`,
        });
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleDownloadCalendar = () => {
        if (!invitation?.calendarEvent) return;

        // Generate ICS file content
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Bayon Coagent//Open House//EN
BEGIN:VEVENT
UID:${sessionId}@bayoncoagent.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${invitation.calendarEvent.startTime.replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${invitation.calendarEvent.endTime.replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${invitation.calendarEvent.title}
DESCRIPTION:${invitation.calendarEvent.description}
LOCATION:${invitation.calendarEvent.location}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `open-house-${sessionId}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
            title: '✨ Downloaded!',
            description: 'Calendar event saved',
        });
    };

    return (
        <div className="space-y-6">
            {/* Configuration Options */}
            <div className="space-y-4">
                <div className="space-y-3">
                    <Label>Recipient Type</Label>
                    <RadioGroup
                        value={recipientType}
                        onValueChange={(v) => setRecipientType(v as RecipientType)}
                    >
                        {(Object.keys(recipientTypes) as RecipientType[]).map((type) => (
                            <div key={type} className="flex items-start space-x-2">
                                <RadioGroupItem value={type} id={type} className="mt-1" />
                                <div className="flex-1">
                                    <Label htmlFor={type} className="font-normal cursor-pointer">
                                        {recipientTypes[type].label}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {recipientTypes[type].description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                    <Textarea
                        id="personal-message"
                        placeholder="Add a personal touch to your invitation..."
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value)}
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                        This will be included at the beginning of your email
                    </p>
                </div>

                <div className="space-y-3">
                    <Label>Include Elements</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="calendar"
                                checked={includeCalendar}
                                onCheckedChange={(checked) => setIncludeCalendar(checked as boolean)}
                            />
                            <Label htmlFor="calendar" className="font-normal cursor-pointer">
                                Include calendar attachment (.ics file)
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="rsvp"
                                checked={includeRSVP}
                                onCheckedChange={(checked) => setIncludeRSVP(checked as boolean)}
                            />
                            <Label htmlFor="rsvp" className="font-normal cursor-pointer">
                                Include RSVP tracking link
                            </Label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Invitation...
                    </>
                ) : (
                    <>
                        <Mail className="mr-2 h-4 w-4" />
                        Generate Email Invitation
                    </>
                )}
            </Button>

            {/* Generated Invitation */}
            {invitation && (
                <Card>
                    <CardContent className="pt-6 space-y-6">
                        {/* Subject Line */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Subject Line</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCopy('Subject', invitation.subject)}
                                    disabled={copiedField === 'Subject'}
                                >
                                    {copiedField === 'Subject' ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                            <div className="p-3 rounded-lg border bg-muted/50 font-medium">
                                {invitation.subject}
                            </div>
                        </div>

                        <Separator />

                        {/* Preheader */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Preheader</Label>
                            <div className="p-2 rounded-lg border bg-muted/30 text-sm italic">
                                {invitation.preheader}
                            </div>
                        </div>

                        <Separator />

                        {/* Email Body */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Email Body</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const fullBody = `${invitation.greeting}\n\n${invitation.introduction}\n\n${invitation.bodyContent}\n\n${invitation.closingMessage}\n\n${invitation.signature.name}\n${invitation.signature.phone} | ${invitation.signature.email}`;
                                        handleCopy('Email body', fullBody);
                                    }}
                                    disabled={copiedField === 'Email body'}
                                >
                                    {copiedField === 'Email body' ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
                                <p className="font-semibold">{invitation.greeting}</p>
                                <p className="whitespace-pre-wrap">{invitation.introduction}</p>

                                <div>
                                    <p className="font-semibold mb-2">Property Highlights:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {invitation.propertyHighlights.map((highlight, idx) => (
                                            <li key={idx}>{highlight}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="border-l-4 border-primary pl-4">
                                    <p className="font-semibold">{invitation.eventDetails.date}</p>
                                    <p>{invitation.eventDetails.time}</p>
                                    <p className="text-sm text-muted-foreground">{invitation.eventDetails.address}</p>
                                    {invitation.eventDetails.parkingInfo && (
                                        <p className="text-sm mt-2">{invitation.eventDetails.parkingInfo}</p>
                                    )}
                                </div>

                                <p className="whitespace-pre-wrap">{invitation.bodyContent}</p>

                                <p className="font-semibold text-primary">{invitation.callToAction}</p>

                                <p className="whitespace-pre-wrap">{invitation.closingMessage}</p>

                                <div className="border-t pt-4 text-sm">
                                    <p className="font-semibold">{invitation.signature.name}</p>
                                    {invitation.signature.title && <p>{invitation.signature.title}</p>}
                                    {invitation.signature.brokerage && <p>{invitation.signature.brokerage}</p>}
                                    <p>{invitation.signature.phone} | {invitation.signature.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Event */}
                        {invitation.calendarEvent && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-base font-semibold">
                                            Calendar Attachment
                                        </Label>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDownloadCalendar}
                                        >
                                            <Download className="mr-2 h-4 w-4" />
                                            Download .ics
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                                        <Calendar className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-sm">
                                            Calendar event ready for attachment
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* RSVP Message */}
                        {invitation.rsvpMessage && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">RSVP Message</Label>
                                    <div className="p-3 rounded-lg border bg-muted/50 text-sm">
                                        {invitation.rsvpMessage}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Additional Notes */}
                        {invitation.additionalNotes && invitation.additionalNotes.length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">Additional Notes</Label>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        {invitation.additionalNotes.map((note, idx) => (
                                            <li key={idx}>{note}</li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
