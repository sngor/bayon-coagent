"use client";

import { Testimonial } from "@/lib/types/common";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { format } from "date-fns";
import { generateReviewSchema } from "@/lib/schema-markup";

interface ProfileTestimonialsDisplayProps {
    testimonials: Testimonial[];
    agentName?: string;
}

export function ProfileTestimonialsDisplay({
    testimonials,
    agentName,
}: ProfileTestimonialsDisplayProps) {
    if (testimonials.length === 0) {
        return null;
    }

    // Get initials from client name
    const getInitials = (name: string): string => {
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate schema markup for all testimonials
    const reviewSchemas = testimonials.map((testimonial) =>
        generateReviewSchema(testimonial, agentName)
    );

    return (
        <>
            {/* Schema Markup */}
            {reviewSchemas.map((schema, index) => (
                <script
                    key={`review-schema-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(schema),
                    }}
                />
            ))}

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold mb-2">Client Testimonials</h2>
                        <p className="text-muted-foreground">
                            What my clients say about working with me
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {testimonials.map((testimonial) => (
                            <Card
                                key={testimonial.id}
                                className="relative overflow-hidden hover:shadow-lg transition-shadow"
                            >
                                <CardContent className="pt-6">
                                    {/* Quote Icon */}
                                    <div className="absolute top-4 right-4 opacity-10">
                                        <Quote className="h-12 w-12" />
                                    </div>

                                    {/* Client Photo and Name */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <Avatar className="h-12 w-12">
                                            {testimonial.clientPhotoUrl && (
                                                <AvatarImage
                                                    src={testimonial.clientPhotoUrl}
                                                    alt={testimonial.clientName}
                                                />
                                            )}
                                            <AvatarFallback>
                                                {getInitials(testimonial.clientName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{testimonial.clientName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(testimonial.dateReceived), "MMMM yyyy")}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Testimonial Text */}
                                    <blockquote className="text-sm leading-relaxed text-muted-foreground relative z-10">
                                        "{testimonial.testimonialText}"
                                    </blockquote>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
