/**
 * Schema Markup Generator
 * 
 * Generates schema.org structured data for real estate agents and listings
 */

import type {
    LocalBusinessSchema,
    PersonSchema,
    FAQPageSchema,
} from '@/lib/types/aeo-types';

/**
 * Generate LocalBusiness schema for real estate agent
 */
export function generateLocalBusinessSchema(data: {
    name: string;
    agencyName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    website?: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    reviewCount?: number;
    averageRating?: number;
    priceRange?: string;
    openingHours?: Array<{
        days: string[];
        opens: string;
        closes: string;
    }>;
}): LocalBusinessSchema {
    const schema: LocalBusinessSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: data.agencyName || data.name,
    };

    // Add website
    if (data.website) {
        schema.url = data.website;
        schema['@id'] = data.website;
    }

    // Add phone
    if (data.phone) {
        schema.telephone = data.phone;
    }

    // Add address
    if (data.address || data.city || data.state) {
        schema.address = {
            '@type': 'PostalAddress',
            streetAddress: data.address,
            addressLocality: data.city,
            addressRegion: data.state,
            postalCode: data.zipCode,
            addressCountry: data.country || 'US',
        };
    }

    // Add geo coordinates
    if (data.latitude && data.longitude) {
        schema.geo = {
            '@type': 'GeoCoordinates',
            latitude: data.latitude,
            longitude: data.longitude,
        };
    }

    // Add opening hours
    if (data.openingHours && data.openingHours.length > 0) {
        schema.openingHoursSpecification = data.openingHours.map((hours) => ({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: hours.days,
            opens: hours.opens,
            closes: hours.closes,
        }));
    }

    // Add price range
    if (data.priceRange) {
        schema.priceRange = data.priceRange;
    }

    // Add aggregate rating
    if (data.reviewCount && data.averageRating) {
        schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: data.averageRating,
            reviewCount: data.reviewCount,
        };
    }

    return schema;
}

/**
 * Generate Person schema for real estate agent
 */
export function generatePersonSchema(data: {
    name: string;
    jobTitle?: string;
    agencyName?: string;
    website?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    profileImage?: string;
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        linkedin?: string;
        twitter?: string;
    };
}): PersonSchema {
    const schema: PersonSchema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: data.name,
    };

    // Add job title
    if (data.jobTitle) {
        schema.jobTitle = data.jobTitle;
    } else {
        schema.jobTitle = 'Real Estate Agent';
    }

    // Add agency
    if (data.agencyName) {
        schema.worksFor = {
            '@type': 'Organization',
            name: data.agencyName,
        };
    }

    // Add contact info
    if (data.website) {
        schema.url = data.website;
    }
    if (data.email) {
        schema.email = data.email;
    }
    if (data.phone) {
        schema.telephone = data.phone;
    }

    // Add profile image
    if (data.profileImage) {
        schema.image = data.profileImage;
    }

    // Add location
    if (data.city || data.state) {
        schema.address = {
            '@type': 'PostalAddress',
            addressLocality: data.city,
            addressRegion: data.state,
        };
    }

    // Add social media profiles
    const socialUrls: string[] = [];
    if (data.socialMedia) {
        if (data.socialMedia.facebook) socialUrls.push(data.socialMedia.facebook);
        if (data.socialMedia.instagram) socialUrls.push(data.socialMedia.instagram);
        if (data.socialMedia.linkedin) socialUrls.push(data.socialMedia.linkedin);
        if (data.socialMedia.twitter) socialUrls.push(data.socialMedia.twitter);
    }
    if (socialUrls.length > 0) {
        schema.sameAs = socialUrls;
    }

    return schema;
}

/**
 * Generate FAQPage schema
 */
export function generateFAQPageSchema(
    faqs: Array<{ question: string; answer: string }>
): FAQPageSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

/**
 * Generate RealEstateListing schema
 */
export function generateListingSchema(data: {
    name: string;
    description: string;
    price: number;
    currency?: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
    propertyType?: string;
    numberOfRooms?: number;
    numberOfBedrooms?: number;
    numberOfBathrooms?: number;
    floorSize?: number;
    floorSizeUnit?: string;
    yearBuilt?: number;
    images?: string[];
    latitude?: number;
    longitude?: number;
    agentName?: string;
    agentPhone?: string;
    agentEmail?: string;
}) {
    const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: data.name,
        description: data.description,
        offers: {
            '@type': 'Offer',
            price: data.price,
            priceCurrency: data.currency || 'USD',
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: data.address,
            addressLocality: data.city,
            addressRegion: data.state,
            postalCode: data.zipCode,
            addressCountry: data.country || 'US',
        },
    };

    // Add property details
    if (data.propertyType) {
        schema.additionalType = data.propertyType;
    }

    if (data.numberOfRooms) {
        schema.numberOfRooms = data.numberOfRooms;
    }

    if (data.numberOfBedrooms) {
        schema.numberOfBedrooms = data.numberOfBedrooms;
    }

    if (data.numberOfBathrooms) {
        schema.numberOfBathrooms = data.numberOfBathrooms;
    }

    if (data.floorSize) {
        schema.floorSize = {
            '@type': 'QuantitativeValue',
            value: data.floorSize,
            unitCode: data.floorSizeUnit || 'SQF',
        };
    }

    if (data.yearBuilt) {
        schema.yearBuilt = data.yearBuilt;
    }

    // Add images
    if (data.images && data.images.length > 0) {
        schema.image = data.images;
    }

    // Add geo coordinates
    if (data.latitude && data.longitude) {
        schema.geo = {
            '@type': 'GeoCoordinates',
            latitude: data.latitude,
            longitude: data.longitude,
        };
    }

    // Add agent info
    if (data.agentName) {
        schema.agent = {
            '@type': 'RealEstateAgent',
            name: data.agentName,
            telephone: data.agentPhone,
            email: data.agentEmail,
        };
    }

    return schema;
}

/**
 * Convert schema object to JSON-LD script tag
 */
export function schemaToScriptTag(schema: any): string {
    return `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`;
}

/**
 * Validate schema markup
 */
export function validateSchema(schema: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!schema['@context']) {
        errors.push('Missing @context');
    }
    if (!schema['@type']) {
        errors.push('Missing @type');
    }

    // Type-specific validation
    if (schema['@type'] === 'RealEstateAgent' || schema['@type'] === 'LocalBusiness') {
        if (!schema.name) {
            errors.push('Missing name');
        }
        if (!schema.address) {
            warnings.push('Missing address - recommended for local SEO');
        }
        if (!schema.telephone) {
            warnings.push('Missing telephone - recommended for contact');
        }
    }

    if (schema['@type'] === 'Person') {
        if (!schema.name) {
            errors.push('Missing name');
        }
        if (!schema.jobTitle) {
            warnings.push('Missing jobTitle - recommended for clarity');
        }
    }

    if (schema['@type'] === 'FAQPage') {
        if (!schema.mainEntity || schema.mainEntity.length === 0) {
            errors.push('Missing FAQ questions');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Generate combined schema for agent profile page
 */
export function generateAgentProfileSchema(data: {
    name: string;
    agencyName?: string;
    jobTitle?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    profileImage?: string;
    reviewCount?: number;
    averageRating?: number;
    socialMedia?: {
        facebook?: string;
        instagram?: string;
        linkedin?: string;
        twitter?: string;
    };
    faqs?: Array<{ question: string; answer: string }>;
}) {
    const schemas: any[] = [];

    // Add Person schema
    schemas.push(
        generatePersonSchema({
            name: data.name,
            jobTitle: data.jobTitle,
            agencyName: data.agencyName,
            website: data.website,
            email: data.email,
            phone: data.phone,
            city: data.city,
            state: data.state,
            profileImage: data.profileImage,
            socialMedia: data.socialMedia,
        })
    );

    // Add LocalBusiness schema
    schemas.push(
        generateLocalBusinessSchema({
            name: data.name,
            agencyName: data.agencyName,
            address: data.address,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            phone: data.phone,
            website: data.website,
            email: data.email,
            reviewCount: data.reviewCount,
            averageRating: data.averageRating,
        })
    );

    // Add FAQPage schema if FAQs provided
    if (data.faqs && data.faqs.length > 0) {
        schemas.push(generateFAQPageSchema(data.faqs));
    }

    return schemas;
}
