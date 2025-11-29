'use client';

import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sendClientInquiry } from '@/features/client-dashboards/actions/client-dashboard-actions';

interface ContactFormProps {
    token: string;
    primaryColor: string;
    onClose: () => void;
    defaultType?: 'general' | 'cma' | 'property' | 'valuation';
    defaultSubject?: string;
    propertyId?: string;
    propertyAddress?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
}

/**
 * Contact Form Component
 * 
 * A modal form for clients to send inquiries to their agent.
 * Supports different inquiry types (general, CMA, property, valuation).
 * Tracks all contact requests in analytics and sends email notifications to the agent.
 * 
 * Requirements: 4.5, 7.1
 */
export function ContactForm({
    token,
    primaryColor,
    onClose,
    defaultType = 'general',
    defaultSubject = '',
    propertyId,
    propertyAddress,
    clientName,
    clientEmail,
    clientPhone,
}: ContactFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        subject: defaultSubject,
        message: '',
        name: clientName || '',
        email: clientEmail || '',
        phone: clientPhone || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const result = await sendClientInquiry(token, {
                type: defaultType,
                subject: formData.subject,
                message: formData.message,
                clientName: formData.name || undefined,
                clientEmail: formData.email || undefined,
                clientPhone: formData.phone || undefined,
                propertyId,
                propertyAddress,
            });

            if (result.message === 'success') {
                setIsSuccess(true);
                // Auto-close after 2 seconds
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(result.message || 'Failed to send inquiry. Please try again.');
            }
        } catch (err) {
            console.error('Failed to send inquiry:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Get title based on inquiry type
    const getTitle = () => {
        switch (defaultType) {
            case 'cma':
                return 'Discuss This Report';
            case 'property':
                return 'Ask About This Property';
            case 'valuation':
                return 'Discuss This Valuation';
            default:
                return 'Contact Your Agent';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between"
                    style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: primaryColor,
                    }}
                >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {getTitle()}
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="flex-shrink-0"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Success Message */}
                {isSuccess ? (
                    <div className="px-6 py-12 text-center">
                        <div
                            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: `${primaryColor}20` }}
                        >
                            <Send
                                className="h-8 w-8"
                                style={{ color: primaryColor }}
                            />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Message Sent!
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400">
                            Your agent will get back to you soon.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                            {/* Property Info (if applicable) */}
                            {propertyAddress && (
                                <div
                                    className="p-4 rounded-lg"
                                    style={{ backgroundColor: `${primaryColor}10` }}
                                >
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Property:
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {propertyAddress}
                                    </p>
                                </div>
                            )}

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Your Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone (Optional)</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="(555) 123-4567"
                                    className="w-full"
                                />
                            </div>

                            {/* Subject */}
                            <div className="space-y-2">
                                <Label htmlFor="subject">
                                    Subject <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="subject"
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => handleChange('subject', e.target.value)}
                                    placeholder="What would you like to discuss?"
                                    required
                                    className="w-full"
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <Label htmlFor="message">
                                    Message <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="message"
                                    value={formData.message}
                                    onChange={(e) => handleChange('message', e.target.value)}
                                    placeholder="Tell your agent what you'd like to know..."
                                    required
                                    rows={6}
                                    className="w-full resize-none"
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {error}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || !formData.subject || !formData.message}
                                    className="min-w-[120px]"
                                    style={{
                                        backgroundColor: primaryColor,
                                        color: '#ffffff',
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
