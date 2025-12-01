/**
 * Testimonial Schema Markup Generator
 * 
 * Generates Schema.org Review structured data for testimonials
 * Validates: Requirements 4.5, 8.3
 */

import { Testimonial } from "@/lib/types/common";

/**
 * Generates Review schema markup for a single testimonial
 * 
 * @param testimonial - The testimonial to generate schema for
 * @param agentName - Optional agent name to include in itemReviewed
 * @returns Schema.org Review object with rating, author, and date
 */
export function generateReviewSchema(
    testimonial: Testimonial,
    agentName?: string
) {
    return {
        "@type": "Review",
        "author": {
            "@type": "Person",
            "name": testimonial.clientName,
        },
        "datePublished": testimonial.dateReceived,
        "reviewBody": testimonial.testimonialText,
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5",
            "bestRating": "5",
        },
        ...(agentName && {
            "itemReviewed": {
                "@type": "RealEstateAgent",
                "name": agentName,
            },
        }),
    };
}

/**
 * Generates AggregateRating schema markup for multiple testimonials
 * 
 * @param testimonials - Array of testimonials to aggregate
 * @param agentName - The agent's name
 * @returns Schema.org AggregateRating object
 */
export function generateAggregateRatingSchema(
    testimonials: Testimonial[],
    agentName: string
) {
    const reviewCount = testimonials.length;

    return {
        "@type": "RealEstateAgent",
        "name": agentName,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": reviewCount.toString(),
            "bestRating": "5",
        },
    };
}

/**
 * Generates complete schema markup with context for embedding in HTML
 * 
 * @param testimonial - The testimonial to generate schema for
 * @param agentName - Optional agent name
 * @returns Complete Schema.org object with @context
 */
export function generateTestimonialSchemaWithContext(
    testimonial: Testimonial,
    agentName?: string
) {
    return {
        "@context": "https://schema.org",
        ...generateReviewSchema(testimonial, agentName),
    };
}

/**
 * Validates that a testimonial has all required fields for schema generation
 * 
 * @param testimonial - The testimonial to validate
 * @returns Validation result with errors if any
 */
export function validateTestimonialForSchema(testimonial: Testimonial): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!testimonial.clientName || testimonial.clientName.trim() === "") {
        errors.push("Client name is required for Review schema");
    }

    if (!testimonial.testimonialText || testimonial.testimonialText.trim() === "") {
        errors.push("Testimonial text is required for Review schema");
    }

    if (!testimonial.dateReceived) {
        errors.push("Date received is required for Review schema");
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
