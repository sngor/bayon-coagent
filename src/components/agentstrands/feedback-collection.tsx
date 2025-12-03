"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FeedbackCollectionProps {
    taskId: string;
    strandId: string;
    contentId?: string;
    onFeedbackSubmitted?: () => void;
    className?: string;
}

export function FeedbackCollection({
    taskId,
    strandId,
    contentId,
    onFeedbackSubmitted,
    className,
}: FeedbackCollectionProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: "Rating required",
                description: "Please select a rating before submitting.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/agentstrands/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskId,
                    strandId,
                    feedbackType: "rating",
                    rating,
                    metadata: {
                        comment: comment || undefined,
                        contentId,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit feedback");
            }

            toast({
                title: "Feedback submitted",
                description: "Thank you for helping us improve!",
            });

            // Reset form
            setRating(0);
            setComment("");
            onFeedbackSubmitted?.();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Rate this content
                </CardTitle>
                <CardDescription>
                    Your feedback helps us improve the quality of AI-generated content
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Star Rating */}
                <div className="space-y-2">
                    <Label>How would you rate this content?</Label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                                aria-label={`Rate ${star} out of 5 stars`}
                                title={`Rate ${star} out of 5 stars`}
                            >
                                <Star
                                    className={cn(
                                        "h-8 w-8 transition-colors",
                                        (hoveredRating || rating) >= star
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-300"
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {rating === 1 && "Poor - Needs significant improvement"}
                            {rating === 2 && "Fair - Below expectations"}
                            {rating === 3 && "Good - Meets expectations"}
                            {rating === 4 && "Very Good - Exceeds expectations"}
                            {rating === 5 && "Excellent - Outstanding quality"}
                        </p>
                    )}
                </div>

                {/* Optional Comment */}
                <div className="space-y-2">
                    <Label htmlFor="comment">Additional comments (optional)</Label>
                    <Textarea
                        id="comment"
                        placeholder="Tell us what you liked or what could be improved..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={3}
                        className="resize-none"
                    />
                </div>

                {/* Submit Button */}
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                    className="w-full"
                >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
            </CardContent>
        </Card>
    );
}

// Quick feedback buttons for inline use
interface QuickFeedbackProps {
    taskId: string;
    strandId: string;
    onFeedbackSubmitted?: () => void;
    className?: string;
}

export function QuickFeedback({
    taskId,
    strandId,
    onFeedbackSubmitted,
    className,
}: QuickFeedbackProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const submitFeedback = async (rating: number) => {
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/agentstrands/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskId,
                    strandId,
                    feedbackType: "rating",
                    rating,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit feedback");
            }

            toast({
                title: "Thanks for your feedback!",
                description: rating >= 4 ? "Glad you liked it!" : "We'll work on improving.",
            });

            onFeedbackSubmitted?.();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit feedback.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="text-sm text-muted-foreground">Was this helpful?</span>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => submitFeedback(5)}
                disabled={isSubmitting}
                className="h-8 px-2"
            >
                <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => submitFeedback(2)}
                disabled={isSubmitting}
                className="h-8 px-2"
            >
                <ThumbsDown className="h-4 w-4" />
            </Button>
        </div>
    );
}
