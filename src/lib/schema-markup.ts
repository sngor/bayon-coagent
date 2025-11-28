/**
 * Schema Markup Generators
 * 
 * Generates Schema.org structured data for SEO
 */

import { Testimonial, Profile } from "./types";

/**
 * Generates Review schema markup for a testimonial
 * @param testimonial The testimonial to generate schema for
 * @param agentName The agent's name
 * @returns Schema.org Review object
 */
export function generateReviewSchema(testimonial: Testimonial, agentName?: string) {
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
            "ratingValue": "5", // Default to 5 stars for testimonials
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
 * @param testimonials Array of testimonials
 * @param agentName The agent's name
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
            "ratingValue": "5.0", // All testimonials are positive
            "reviewCount": reviewCount.toString(),
            "bestRating": "5",
        },
    };
}

/**
 * Generates complete RealEstateAgent schema with reviews
 * @param profile The agent's profile
 * @param testimonials Array of featured testimonials
 * @returns Complete Schema.org RealEstateAgent object
 */
export function generateRealEstateAgentWithReviewsSchema(
    profile: Profile,
    testimonials: Testimonial[]
) {
    const reviews = testimonials.map((t) => generateReviewSchema(t, profile.name));

    return {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": profile.name || "",
        "description": profile.bio || "",
        "telephone": profile.phone || "",
        "url": profile.website || "",
        "license": profile.licenseNumber || "",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": profile.address || "",
        },
        ...(profile.linkedin || profile.twitter || profile.facebook
            ? {
                "sameAs": [profile.linkedin, profile.twitter, profile.facebook].filter(
                    Boolean
                ),
            }
            : {}),
        ...(profile.certifications && Array.isArray(profile.certifications)
            ? { "knowsAbout": profile.certifications }
            : {}),
        ...(testimonials.length > 0
            ? {
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "5.0",
                    "reviewCount": testimonials.length.toString(),
                    "bestRating": "5",
                },
                "review": reviews,
            }
            : {}),
    };
}

/**
 * Generates Article schema markup for blog posts
 * @param title The article title
 * @param description The article description
 * @param author The author's name
 * @param datePublished ISO date string
 * @param imageUrl Optional image URL
 * @returns Schema.org Article object
 */
export function generateArticleSchema(
    title: string,
    description: string,
    author: string,
    datePublished: string,
    imageUrl?: string
) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "author": {
            "@type": "Person",
            "name": author,
        },
        "datePublished": datePublished,
        "publisher": {
            "@type": "Organization",
            "name": author, // Use agent name as publisher
        },
        ...(imageUrl && {
            "image": imageUrl,
        }),
    };
}

/**
 * Validates schema markup against basic requirements
 * @param schema The schema object to validate
 * @returns Validation result with errors if any
 */
export function validateSchema(schema: any): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Check for required @type
    if (!schema["@type"]) {
        errors.push("Missing required @type property");
    }

    // Type-specific validation
    if (schema["@type"] === "Review") {
        if (!schema.author?.name) {
            errors.push("Review schema missing author name");
        }
        if (!schema.datePublished) {
            errors.push("Review schema missing datePublished");
        }
        if (!schema.reviewBody) {
            errors.push("Review schema missing reviewBody");
        }
    }

    if (schema["@type"] === "RealEstateAgent") {
        if (!schema.name) {
            errors.push("RealEstateAgent schema missing name");
        }
    }

    if (schema["@type"] === "Article") {
        if (!schema.headline) {
            errors.push("Article schema missing headline");
        }
        if (!schema.author?.name) {
            errors.push("Article schema missing author name");
        }
        if (!schema.datePublished) {
            errors.push("Article schema missing datePublished");
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}
