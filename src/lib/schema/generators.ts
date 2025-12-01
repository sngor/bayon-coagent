/**
 * Schema Markup Generators
 * 
 * Generates Schema.org structured data for profiles, blog posts, and testimonials
 * Requirements: 8.1, 8.2, 8.3
 */

import { Profile, Testimonial } from "@/lib/types/common";

// ==================== Person and RealEstateAgent Schema ====================

/**
 * Generates Person schema markup for an agent profile
 * 
 * @param profile - The agent's profile data
 * @returns Schema.org Person object
 */
export function generatePersonSchema(profile: Profile) {
    const schema: any = {
        "@type": "Person",
        "name": profile.name || "",
    };

    // Add optional fields if available
    if (profile.phone) {
        schema.telephone = profile.phone;
    }

    if (profile.website) {
        schema.url = profile.website;
    }

    if (profile.address) {
        schema.address = {
            "@type": "PostalAddress",
            "streetAddress": profile.address,
        };
    }

    // Add social media profiles
    const socialProfiles = [
        profile.linkedin,
        profile.twitter,
        profile.facebook,
    ].filter(Boolean);

    if (socialProfiles.length > 0) {
        schema.sameAs = socialProfiles;
    }

    return schema;
}

/**
 * Generates RealEstateAgent schema markup for an agent profile
 * 
 * @param profile - The agent's profile data
 * @returns Schema.org RealEstateAgent object
 */
export function generateRealEstateAgentSchema(profile: Profile) {
    const schema: any = {
        "@type": "RealEstateAgent",
        "name": profile.name || "",
    };

    // Add optional fields
    if (profile.bio) {
        schema.description = profile.bio;
    }

    if (profile.phone) {
        schema.telephone = profile.phone;
    }

    if (profile.website) {
        schema.url = profile.website;
    }

    if (profile.licenseNumber) {
        schema.license = profile.licenseNumber;
    }

    if (profile.address) {
        schema.address = {
            "@type": "PostalAddress",
            "streetAddress": profile.address,
        };
    }

    // Add agency information
    if (profile.agencyName) {
        schema.worksFor = {
            "@type": "Organization",
            "name": profile.agencyName,
        };
    }

    // Add social media profiles
    const socialProfiles = [
        profile.linkedin,
        profile.twitter,
        profile.facebook,
    ].filter(Boolean);

    if (socialProfiles.length > 0) {
        schema.sameAs = socialProfiles;
    }

    // Add certifications as knowsAbout
    if (profile.certifications) {
        const certs = Array.isArray(profile.certifications)
            ? profile.certifications
            : [profile.certifications];
        schema.knowsAbout = certs;
    }

    return schema;
}

/**
 * Generates complete RealEstateAgent schema with reviews
 * 
 * @param profile - The agent's profile data
 * @param testimonials - Array of featured testimonials
 * @returns Complete Schema.org RealEstateAgent object with reviews
 */
export function generateRealEstateAgentWithReviewsSchema(
    profile: Profile,
    testimonials: Testimonial[]
) {
    const baseSchema = generateRealEstateAgentSchema(profile);

    // Add aggregate rating if testimonials exist
    if (testimonials.length > 0) {
        baseSchema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": testimonials.length.toString(),
            "bestRating": "5",
        };

        // Add individual reviews
        baseSchema.review = testimonials.map((testimonial) =>
            generateReviewSchema(testimonial, profile.name)
        );
    }

    return {
        "@context": "https://schema.org",
        ...baseSchema,
    };
}

// ==================== Article Schema ====================

export interface ArticleSchemaInput {
    title: string;
    description?: string;
    content: string;
    author: string;
    datePublished: string;
    dateModified?: string;
    imageUrl?: string;
    url?: string;
}

/**
 * Generates Article schema markup for blog posts
 * 
 * @param input - Article data including title, content, author, etc.
 * @returns Schema.org Article object
 */
export function generateArticleSchema(input: ArticleSchemaInput) {
    const schema: any = {
        "@type": "Article",
        "headline": input.title,
        "author": {
            "@type": "Person",
            "name": input.author,
        },
        "datePublished": input.datePublished,
        "publisher": {
            "@type": "Organization",
            "name": input.author, // Use agent name as publisher
        },
    };

    // Add optional fields
    if (input.description) {
        schema.description = input.description;
    }

    if (input.dateModified) {
        schema.dateModified = input.dateModified;
    }

    if (input.imageUrl) {
        schema.image = input.imageUrl;
    }

    if (input.url) {
        schema.url = input.url;
    }

    // Add article body (truncated for schema)
    if (input.content) {
        schema.articleBody = input.content.substring(0, 500);
    }

    return {
        "@context": "https://schema.org",
        ...schema,
    };
}

// ==================== Review Schema ====================

/**
 * Generates Review schema markup for a single testimonial
 * 
 * @param testimonial - The testimonial to generate schema for
 * @param agentName - Optional agent name to include in itemReviewed
 * @returns Schema.org Review object
 */
export function generateReviewSchema(
    testimonial: Testimonial,
    agentName?: string
) {
    const schema: any = {
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
    };

    // Add itemReviewed if agent name provided
    if (agentName) {
        schema.itemReviewed = {
            "@type": "RealEstateAgent",
            "name": agentName,
        };
    }

    return schema;
}

/**
 * Generates Review schema with context for embedding in HTML
 * 
 * @param testimonial - The testimonial to generate schema for
 * @param agentName - Optional agent name
 * @returns Complete Schema.org Review object with @context
 */
export function generateReviewSchemaWithContext(
    testimonial: Testimonial,
    agentName?: string
) {
    return {
        "@context": "https://schema.org",
        ...generateReviewSchema(testimonial, agentName),
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
    return {
        "@type": "RealEstateAgent",
        "name": agentName,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": testimonials.length.toString(),
            "bestRating": "5",
        },
    };
}

// ==================== Utility Functions ====================

/**
 * Converts schema object to JSON-LD script tag string
 * 
 * @param schema - The schema object to convert
 * @returns HTML script tag with JSON-LD
 */
export function schemaToJsonLd(schema: any): string {
    return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

/**
 * Generates multiple schema objects for a page
 * 
 * @param schemas - Array of schema objects
 * @returns Array of JSON-LD script tags
 */
export function generateMultipleSchemas(schemas: any[]): string[] {
    return schemas.map(schemaToJsonLd);
}
