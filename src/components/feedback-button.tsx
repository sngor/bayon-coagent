'use client';

import { useState, useEffect, useActionState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { submitFeedbackAction } from '@/app/actions';

const feedbackTypes = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'improvement', label: 'Improvement Suggestion' },
    { value: 'general', label: 'General Feedback' },
];

const initialState = {
    message: '',
    data: null,
    errors: {},
};

export function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackType, setFeedbackType] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const [state, formAction, isPending] = useActionState(submitFeedbackAction, initialState);

    // Handle form submission result
    useEffect(() => {
        if (state.message === 'success') {
            setIsSubmitted(true);
            toast({
                title: 'Feedback Sent!',
                description: 'Thank you for your feedback. We\'ll review it and get back to you if needed.',
            });

            // Reset form after a delay
            setTimeout(() => {
                setIsSubmitted(false);
                setFeedbackType('');
                setMessage('');
                setIsOpen(false);
            }, 2000);
        } else if (state.message && state.message !== '') {
            toast({
                title: 'Error',
                description: state.message,
                variant: 'destructive',
            });
        }
    }, [state, toast]);

    const resetForm = () => {
        setFeedbackType('');
        setMessage('');
        setIsSubmitted(false);
    };

    const handleFormSubmit = (formData: FormData) => {
        if (!feedbackType || !message.trim()) {
            toast({
                title: 'Missing Information',
                description: 'Please select a feedback type and enter your message.',
                variant: 'destructive',
            });
            return;
        }

        // Add the current form values to FormData
        formData.set('type', feedbackType);
        formData.set('message', message);

        formAction(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                resetForm();
            }
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground group-data-[state=collapsed]/sidebar-wrapper:justify-center group-data-[state=collapsed]/sidebar-wrapper:px-2"
                >
                    <MessageSquare className="h-4 w-4" />
                    <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">
                        Send Feedback
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Send Feedback
                    </DialogTitle>
                    <DialogDescription>
                        Help us improve Bayon Coagent by sharing your thoughts, reporting bugs, or suggesting new features.
                    </DialogDescription>
                </DialogHeader>

                {isSubmitted ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="font-headline text-lg font-semibold mb-2">Thank you!</h3>
                        <p className="text-muted-foreground">
                            Your feedback has been sent successfully.
                        </p>
                    </div>
                ) : (
                    <form action={handleFormSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="feedback-type">Feedback Type</Label>
                            <Select value={feedbackType} onValueChange={setFeedbackType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select feedback type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {feedbackTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {state.errors?.type && (
                                <p className="text-sm text-destructive">{state.errors.type[0]}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Tell us what's on your mind..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                className="resize-none"
                            />
                            {state.errors?.message && (
                                <p className="text-sm text-destructive">{state.errors.message[0]}</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                className="flex-1"
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isPending || !feedbackType || !message.trim()}
                                className="flex-1"
                            >
                                {isPending ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Feedback
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}