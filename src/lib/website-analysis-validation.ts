/**
 * Website Analysis Validation Logic
 * 
 * Functions for validating schema markup, meta tags, and NAP consistency
 * for website analysis results.
 * 
 * Requirements: 3.2, 3.4, 4.3, 4.4, 6.2
 */

import type { TitleTag, MetaDescription } from '@/ai/schemas/website-analysis-schemas';

// ==================== Schema.org Validation ====================

/**
 * Required properties for common schema types
 */
const SCHEMA_REQUIRED_PROPERTIES: Record<string, string[]> = {
    Person: ['name'],
    RealEstateAgent: ['name'],
    LocalBusiness: ['name', 'address'],
    Organization: ['name'],
    Place: ['name'],
    PostalAddress: ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode'],
};

/**
 * Recommended properties for real estate agent schemas
 */
const SCHEMA_RECOMMENDED_PROPERTIES: Record<string, string[]> = {
    Person: ['name', 'email', 'telephone', 'image', 'jobTitle'],
    RealEstateAgent: ['name', 'email', 'telephone', 'image', 'address'],
    LocalBusiness: ['name', 'address', 'telephone', 'email', 'image', 'url'],
    Organization: ['name', 'url', 'logo', 'contactPoint'],
};

/**
 * Valid schema.org types for real estate agents
 */
const VALID_SCHEMA_TYPES = [
    'Person',
    'RealEstateAgent',
    'LocalBusiness',
    'Organization',
    'Place',
    'PostalAddress',
    'ContactPoint',
];

/**
 * Schema validation result
 */
export interface SchemaValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missingRequired: string[];
    missingRecommended: string[];
}

/**
 * Validate schema markup against schema.org specifications
 * 
 * Checks if the schema has:
 * - Valid @type
 * - Required properties for the type
 * - Recommended properties for real estate agents
 * 
 * @param schema - Schema object to validate
 * @returns Validation result with errors and warnings
 * 
 * @example
 * const result = validateSchemaMarkup({
 *   '@type': 'Person',
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * // Returns: { isValid: true, errors: [], warnings: [...], ... }
 * 
 * Requirements: 3.2, 3.4
 */
export function validateSchemaMarkup(schema: any): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingRequired: string[] = [];
    const missingRecommended: string[] = [];

    // Check if schema has @type
    if (!schema || typeof schema !== 'object') {
        errors.push('Schema must be a valid object');
        return {
            isValid: false,
            errors,
            warnings,
            missingRequired,
            missingRecommended,
        };
    }

    const schemaType = schema['@type'];
    if (!schemaType) {
        errors.push('Schema is missing required @type property');
        return {
            isValid: false,
            errors,
            warnings,
            missingRequired,
            missingRecommended,
        };
    }

    // Validate schema type
    if (!VALID_SCHEMA_TYPES.includes(schemaType)) {
        warnings.push(`Schema type "${schemaType}" is not commonly used for real estate agents`);
    }

    // Check required properties
    const requiredProps = SCHEMA_REQUIRED_PROPERTIES[schemaType] || [];
    for (const prop of requiredProps) {
        if (!schema[prop] || (typeof schema[prop] === 'string' && schema[prop].trim() === '')) {
            errors.push(`Missing required property: ${prop}`);
            missingRequired.push(prop);
        }
    }

    // Check recommended properties
    const recommendedProps = SCHEMA_RECOMMENDED_PROPERTIES[schemaType] || [];
    for (const prop of recommendedProps) {
        if (!schema[prop] || (typeof schema[prop] === 'string' && schema[prop].trim() === '')) {
            warnings.push(`Missing recommended property: ${prop}`);
            missingRecommended.push(prop);
        }
    }

    // Validate nested address if present
    if (schema.address && typeof schema.address === 'object') {
        const addressValidation = validateSchemaMarkup(schema.address);
        errors.push(...addressValidation.errors.map(e => `address.${e}`));
        warnings.push(...addressValidation.warnings.map(w => `address.${w}`));
    }

    // Validate @context if present
    if (schema['@context'] && schema['@context'] !== 'https://schema.org' && schema['@context'] !== 'http://schema.org') {
        warnings.push('Schema @context should be "https://schema.org"');
    }

    const isValid = errors.length === 0;

    return {
        isValid,
        errors,
        warnings,
        missingRequired,
        missingRecommended,
    };
}

/**
 * Validate multiple schema objects
 * 
 * @param schemas - Array of schema objects to validate
 * @returns Array of validation results
 * 
 * @example
 * const results = validateMultipleSchemas([schema1, schema2]);
 * 
 * Requirements: 3.2, 3.4
 */
export function validateMultipleSchemas(schemas: any[]): SchemaValidationResult[] {
    return schemas.map(schema => validateSchemaMarkup(schema));
}

/**
 * Check if schema has recommended types for real estate agents
 * 
 * @param schemaTypes - Array of schema types found
 * @returns Object with presence flags for recommended types
 * 
 * @example
 * const presence = checkRecommendedSchemaTypes(['Person', 'LocalBusiness']);
 * // Returns: { hasPerson: true, hasRealEstateAgent: false, hasLocalBusiness: true, hasOrganization: false }
 * 
 * Requirements: 3.2, 3.4
 */
export function checkRecommendedSchemaTypes(schemaTypes: string[]): {
    hasPerson: boolean;
    hasRealEstateAgent: boolean;
    hasLocalBusiness: boolean;
    hasOrganization: boolean;
} {
    return {
        hasPerson: schemaTypes.includes('Person'),
        hasRealEstateAgent: schemaTypes.includes('RealEstateAgent'),
        hasLocalBusiness: schemaTypes.includes('LocalBusiness'),
        hasOrganization: schemaTypes.includes('Organization'),
    };
}

// ==================== Meta Tag Validation ====================

/**
 * Title tag length constraints
 */
export const TITLE_TAG_MIN_LENGTH = 30;
export const TITLE_TAG_MAX_LENGTH = 60;
export const TITLE_TAG_OPTIMAL_MIN = 30;
export const TITLE_TAG_OPTIMAL_MAX = 60;

/**
 * Meta description length constraints
 */
export const META_DESCRIPTION_MIN_LENGTH = 120;
export const META_DESCRIPTION_MAX_LENGTH = 160;
export const META_DESCRIPTION_OPTIMAL_MIN = 120;
export const META_DESCRIPTION_OPTIMAL_MAX = 160;

/**
 * Validate title tag length
 * 
 * Checks if title tag is between 30 and 60 characters.
 * This is the optimal length for search engines and AI systems.
 * 
 * @param title - Title tag content
 * @returns Validation result with isOptimal flag and issues
 * 
 * @example
 * const result = validateTitleTag('John Doe - Real Estate Agent');
 * // Returns: { content: '...', length: 31, isOptimal: true, issues: [] }
 * 
 * Requirements: 4.3
 */
export function validateTitleTag(title: string | undefined): TitleTag {
    const content = title || '';
    const length = content.length;
    const issues: string[] = [];
    let isOptimal = true;

    if (length === 0) {
        issues.push('Title tag is missing');
        isOptimal = false;
    } else if (length < TITLE_TAG_MIN_LENGTH) {
        issues.push(`Title tag is too short (${length} characters). Recommended: ${TITLE_TAG_MIN_LENGTH}-${TITLE_TAG_MAX_LENGTH} characters`);
        isOptimal = false;
    } else if (length > TITLE_TAG_MAX_LENGTH) {
        issues.push(`Title tag is too long (${length} characters). Recommended: ${TITLE_TAG_MIN_LENGTH}-${TITLE_TAG_MAX_LENGTH} characters. It may be truncated in search results`);
        isOptimal = false;
    }

    // Additional quality checks
    if (content && !content.includes(' ')) {
        issues.push('Title tag should contain multiple words for better context');
        isOptimal = false;
    }

    if (content && content.toLowerCase() === content) {
        issues.push('Consider using proper capitalization in title tag');
    }

    return {
        content: content || undefined,
        length,
        isOptimal,
        issues,
    };
}

/**
 * Validate meta description length
 * 
 * Checks if meta description is between 120 and 160 characters.
 * This is the optimal length for search engines and AI systems.
 * 
 * @param description - Meta description content
 * @returns Validation result with isOptimal flag and issues
 * 
 * @example
 * const result = validateMetaDescription('Experienced real estate agent...');
 * // Returns: { content: '...', length: 145, isOptimal: true, issues: [] }
 * 
 * Requirements: 4.4
 */
export function validateMetaDescription(description: string | undefined): MetaDescription {
    const content = description || '';
    const length = content.length;
    const issues: string[] = [];
    let isOptimal = true;

    if (length === 0) {
        issues.push('Meta description is missing');
        isOptimal = false;
    } else if (length < META_DESCRIPTION_MIN_LENGTH) {
        issues.push(`Meta description is too short (${length} characters). Recommended: ${META_DESCRIPTION_MIN_LENGTH}-${META_DESCRIPTION_MAX_LENGTH} characters`);
        isOptimal = false;
    } else if (length > META_DESCRIPTION_MAX_LENGTH) {
        issues.push(`Meta description is too long (${length} characters). Recommended: ${META_DESCRIPTION_MIN_LENGTH}-${META_DESCRIPTION_MAX_LENGTH} characters. It may be truncated in search results`);
        isOptimal = false;
    }

    // Additional quality checks
    if (content && content.split(' ').length < 10) {
        issues.push('Meta description should be more descriptive (at least 10 words)');
    }

    if (content && !content.includes('.') && !content.includes('!') && !content.includes('?')) {
        issues.push('Consider adding punctuation to meta description for better readability');
    }

    return {
        content: content || undefined,
        length,
        isOptimal,
        issues,
    };
}

/**
 * Check if meta tag length is within optimal range
 * 
 * @param length - Length of the meta tag
 * @param min - Minimum optimal length
 * @param max - Maximum optimal length
 * @returns True if within optimal range
 * 
 * @example
 * isOptimalLength(45, 30, 60); // Returns: true
 * isOptimalLength(25, 30, 60); // Returns: false
 */
export function isOptimalLength(length: number, min: number, max: number): boolean {
    return length >= min && length <= max;
}

// ==================== NAP Consistency Validation ====================

/**
 * NAP consistency check result
 */
export interface NAPConsistencyResult {
    isConsistent: boolean;
    inconsistencies: string[];
    details: {
        names: string[];
        addresses: string[];
        phones: string[];
    };
}

/**
 * Normalize phone number for comparison
 * 
 * Removes all non-digit characters to compare phone numbers
 * 
 * @param phone - Phone number string
 * @returns Normalized phone number (digits only)
 * 
 * @example
 * normalizePhone('(555) 123-4567'); // Returns: '5551234567'
 * normalizePhone('+1-555-123-4567'); // Returns: '15551234567'
 */
export function normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
}

/**
 * Normalize address for comparison
 * 
 * Converts to lowercase, removes extra spaces, and standardizes abbreviations
 * 
 * @param address - Address string
 * @returns Normalized address
 * 
 * @example
 * normalizeAddress('123 Main St.'); // Returns: '123 main street'
 * normalizeAddress('456  Oak   Ave'); // Returns: '456 oak avenue'
 */
export function normalizeAddress(address: string): string {
    return address
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\bst\b\.?/g, 'street')
        .replace(/\bave\b\.?/g, 'avenue')
        .replace(/\brd\b\.?/g, 'road')
        .replace(/\bblvd\b\.?/g, 'boulevard')
        .replace(/\bdr\b\.?/g, 'drive')
        .replace(/\bln\b\.?/g, 'lane')
        .replace(/\bct\b\.?/g, 'court')
        .replace(/\bapt\b\.?/g, 'apartment')
        .replace(/\bste\b\.?/g, 'suite');
}

/**
 * Normalize name for comparison
 * 
 * Converts to lowercase and removes extra spaces
 * 
 * @param name - Name string
 * @returns Normalized name
 * 
 * @example
 * normalizeName('John  Doe'); // Returns: 'john doe'
 * normalizeName('JANE SMITH'); // Returns: 'jane smith'
 */
export function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check NAP consistency across multiple instances
 * 
 * Compares all found instances of name, address, and phone to detect inconsistencies.
 * Uses normalization to handle formatting variations.
 * 
 * @param napData - Object containing arrays of names, addresses, and phones
 * @returns Consistency check result
 * 
 * @example
 * const result = checkNAPConsistency({
 *   names: ['John Doe', 'John Doe'],
 *   addresses: ['123 Main St', '123 Main Street'],
 *   phones: ['555-1234', '(555) 1234']
 * });
 * // Returns: { isConsistent: true, inconsistencies: [], details: {...} }
 * 
 * Requirements: 6.2
 */
export function checkNAPConsistency(napData: {
    names?: string[];
    addresses?: string[];
    phones?: string[];
}): NAPConsistencyResult {
    const inconsistencies: string[] = [];
    const names = napData.names || [];
    const addresses = napData.addresses || [];
    const phones = napData.phones || [];

    // Check name consistency
    if (names.length > 1) {
        const normalizedNames = names.map(normalizeName);
        const uniqueNames = [...new Set(normalizedNames)];
        if (uniqueNames.length > 1) {
            inconsistencies.push(`Found ${uniqueNames.length} different business names: ${names.join(', ')}`);
        }
    }

    // Check address consistency
    if (addresses.length > 1) {
        const normalizedAddresses = addresses.map(normalizeAddress);
        const uniqueAddresses = [...new Set(normalizedAddresses)];
        if (uniqueAddresses.length > 1) {
            inconsistencies.push(`Found ${uniqueAddresses.length} different addresses: ${addresses.join(', ')}`);
        }
    }

    // Check phone consistency
    if (phones.length > 1) {
        const normalizedPhones = phones.map(normalizePhone);
        const uniquePhones = [...new Set(normalizedPhones)];
        if (uniquePhones.length > 1) {
            inconsistencies.push(`Found ${uniquePhones.length} different phone numbers: ${phones.join(', ')}`);
        }
    }

    return {
        isConsistent: inconsistencies.length === 0,
        inconsistencies,
        details: {
            names,
            addresses,
            phones,
        },
    };
}

/**
 * Compare extracted NAP with profile NAP
 * 
 * Checks if the NAP data found on the website matches the user's profile data.
 * Uses fuzzy matching to handle formatting variations.
 * 
 * @param extractedNAP - NAP data extracted from website
 * @param profileNAP - NAP data from user profile
 * @returns Comparison result with match flags and confidence scores
 * 
 * @example
 * const result = compareNAPWithProfile(
 *   { name: 'John Doe', address: '123 Main St', phone: '555-1234' },
 *   { name: 'John Doe', address: '123 Main Street', phone: '(555) 1234' }
 * );
 * // Returns: { nameMatches: true, addressMatches: true, phoneMatches: true, ... }
 * 
 * Requirements: 6.2
 */
export function compareNAPWithProfile(
    extractedNAP: {
        name?: string;
        address?: string;
        phone?: string;
    },
    profileNAP: {
        name?: string;
        address?: string;
        phone?: string;
    }
): {
    nameMatches: boolean;
    addressMatches: boolean;
    phoneMatches: boolean;
    nameConfidence: number;
    addressConfidence: number;
    phoneConfidence: number;
    discrepancies: string[];
} {
    const discrepancies: string[] = [];

    // Compare names
    let nameMatches = false;
    let nameConfidence = 0;
    if (extractedNAP.name && profileNAP.name) {
        const normalizedExtracted = normalizeName(extractedNAP.name);
        const normalizedProfile = normalizeName(profileNAP.name);
        nameMatches = normalizedExtracted === normalizedProfile;
        nameConfidence = nameMatches ? 1.0 : 0.0;
        if (!nameMatches) {
            discrepancies.push(`Name mismatch: Website shows "${extractedNAP.name}" but profile has "${profileNAP.name}"`);
        }
    } else if (!extractedNAP.name && profileNAP.name) {
        discrepancies.push('Name not found on website but present in profile');
    }

    // Compare addresses
    let addressMatches = false;
    let addressConfidence = 0;
    if (extractedNAP.address && profileNAP.address) {
        const normalizedExtracted = normalizeAddress(extractedNAP.address);
        const normalizedProfile = normalizeAddress(profileNAP.address);
        addressMatches = normalizedExtracted === normalizedProfile;
        addressConfidence = addressMatches ? 1.0 : 0.0;
        if (!addressMatches) {
            discrepancies.push(`Address mismatch: Website shows "${extractedNAP.address}" but profile has "${profileNAP.address}"`);
        }
    } else if (!extractedNAP.address && profileNAP.address) {
        discrepancies.push('Address not found on website but present in profile');
    }

    // Compare phones
    let phoneMatches = false;
    let phoneConfidence = 0;
    if (extractedNAP.phone && profileNAP.phone) {
        const normalizedExtracted = normalizePhone(extractedNAP.phone);
        const normalizedProfile = normalizePhone(profileNAP.phone);
        phoneMatches = normalizedExtracted === normalizedProfile;
        phoneConfidence = phoneMatches ? 1.0 : 0.0;
        if (!phoneMatches) {
            discrepancies.push(`Phone mismatch: Website shows "${extractedNAP.phone}" but profile has "${profileNAP.phone}"`);
        }
    } else if (!extractedNAP.phone && profileNAP.phone) {
        discrepancies.push('Phone not found on website but present in profile');
    }

    return {
        nameMatches,
        addressMatches,
        phoneMatches,
        nameConfidence,
        addressConfidence,
        phoneConfidence,
        discrepancies,
    };
}

/**
 * Calculate overall NAP consistency score
 * 
 * Combines internal consistency and profile matching into a single score (0-100)
 * 
 * @param internalConsistency - Result from checkNAPConsistency
 * @param profileComparison - Result from compareNAPWithProfile
 * @returns Overall consistency score (0-100)
 * 
 * @example
 * const score = calculateNAPConsistencyScore(consistencyResult, comparisonResult);
 * // Returns: 85
 * 
 * Requirements: 6.2
 */
export function calculateNAPConsistencyScore(
    internalConsistency: NAPConsistencyResult,
    profileComparison: {
        nameConfidence: number;
        addressConfidence: number;
        phoneConfidence: number;
    }
): number {
    // Internal consistency: 50% of score
    const internalScore = internalConsistency.isConsistent ? 50 : 25;

    // Profile matching: 50% of score (weighted by component)
    const profileScore =
        (profileComparison.nameConfidence * 15) +
        (profileComparison.addressConfidence * 20) +
        (profileComparison.phoneConfidence * 15);

    return Math.round(internalScore + profileScore);
}

// ==================== Helper Functions ====================

/**
 * Get validation summary
 * 
 * Generates a human-readable summary of all validation issues
 * 
 * @param schemaValidation - Schema validation results
 * @param titleValidation - Title tag validation result
 * @param descriptionValidation - Meta description validation result
 * @param napConsistency - NAP consistency result
 * @returns Summary string
 */
export function getValidationSummary(
    schemaValidation: SchemaValidationResult[],
    titleValidation: TitleTag,
    descriptionValidation: MetaDescription,
    napConsistency: NAPConsistencyResult
): string {
    const issues: string[] = [];

    // Schema issues
    const schemaErrors = schemaValidation.flatMap(v => v.errors);
    if (schemaErrors.length > 0) {
        issues.push(`${schemaErrors.length} schema validation error(s)`);
    }

    // Title issues
    if (!titleValidation.isOptimal) {
        issues.push('Title tag needs optimization');
    }

    // Description issues
    if (!descriptionValidation.isOptimal) {
        issues.push('Meta description needs optimization');
    }

    // NAP issues
    if (!napConsistency.isConsistent) {
        issues.push(`${napConsistency.inconsistencies.length} NAP inconsistency(ies)`);
    }

    if (issues.length === 0) {
        return 'All validation checks passed';
    }

    return `Found ${issues.length} issue(s): ${issues.join(', ')}`;
}
