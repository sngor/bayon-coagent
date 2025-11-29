"use client";

import { useState } from "react";
import { TestimonialRequest } from "@/lib/types/common/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TestimonialRequestFormProps {
    onSubmit: (data: { clientName: string; clientEmail: string }) => Promise<void>;
    requests?: TestimonialRequest[];
}

export function TestimonialRequestForm({
    onSubmit,
    requests = [],
}: TestimonialRequestFormProps) {
    const [formData, setFormData] = useState({
        clientName: "",
        clientEmail: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.clientName.trim()) {
            newErrors.clientName = "Client name is required";
        }

        if (!formData.clientEmail.trim()) {
            newErrors.clientEmail = "Client email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
            newErrors.clientEmail = "Please enter a valid email address";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            // Reset form on success
            setFormData({ clientName: "", clientEmail: "" });
            setErrors({});
        } catch (error) {
            console.error("Form submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusBadge = (status: TestimonialRequest["status"]) => {
        switch (status) {
            case "pending":
                return (
                    <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                );
            case "submitted":
                return (
                    <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Submitted
                    </Badge>
                );
            case "expired":
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Expired
                    </Badge>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Request Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Send Testimonial Request</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="clientName">
                                Client Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="clientName"
                                value={formData.clientName}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                                }
                                error={errors.clientName}
                                placeholder="John Smith"
                            />
                        </div>

                        <div>
                            <Label htmlFor="clientEmail">
                                Client Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="clientEmail"
                                type="email"
                                value={formData.clientEmail}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        clientEmail: e.target.value,
                                    }))
                                }
                                error={errors.clientEmail}
                                placeholder="john@example.com"
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            <Mail className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Sending..." : "Send Request"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Request Status Tracking */}
            {requests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Request Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-start justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium truncate">{request.clientName}</p>
                                            {getStatusBadge(request.status)}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {request.clientEmail}
                                        </p>
                                        <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Sent: {format(new Date(request.sentAt), "MMM d, yyyy")}
                                            </div>
                                            {request.reminderSentAt && (
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    Reminder sent:{" "}
                                                    {format(new Date(request.reminderSentAt), "MMM d, yyyy")}
                                                </div>
                                            )}
                                            {request.submittedAt && (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Submitted:{" "}
                                                    {format(new Date(request.submittedAt), "MMM d, yyyy")}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Expires: {format(new Date(request.expiresAt), "MMM d, yyyy")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
