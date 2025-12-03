/**
 * Website Analysis NAP Comparison
 * 
 * Functions to compare extracted NAP (Name, Address, Phone) data with profile data
 * Implements fuzzy matching for addresses and phone numbers
 * Calculates consistency scores and generates discrepancy reports
 * 
 * Requirements: 6.4, 8.4
 */

import type { NAPData, NAPConsistency, NAPComponent } from '@/ai/schemas/website-analysis-schemas';

// ==================== Types ====================

/**
 * Profile NAP data for comparison
 */
export interface ProfileNAPData {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}

/**
 * NAP discrepancy details
 */
export interface NAPDiscrepancy {
    field: 'name' | 'address' | 'phone';
    profileValue: string;
    websiteValue: string;
    confidence: number;
    reason: string;
}

/**
 * NAP comparison result
 */
export interface NAPComparisonResult {
    napConsistency: NAPConsistency;
    discrepancies: NAPDiscrepancy[];
}

// ==================== Main Comparison Function ====================

/**
 * Compare extracted NAP data with profile NAP data
 * 
 * @param extractedNAP - NAP data extracted from website
 * @param profileNAP - NAP data from user profile
 * @returns NAP comparison result with consistency scores and discrepancies
 * 
 * Requirements: 6.4, 8.4
 */
export function compareNAPData(
    extractedNAP: NAPData,
    profileNAP: ProfileNAPData
): NAPComparisonResult {
    const discrepancies: NAPDiscrepancy[] = [];

    // Compare name
    const nameComparison = compareName(extractedNAP, profileNAP);
    if (!nameComparison.matches && nameComparison.found) {
        discrepancies.push({
            field: 'name',
            profileValue: profileNAP.name,
            websiteValue: nameComparison.found,
            confidence: nameComparison.confidence,
            reason: 'Business name on website does not match profile name',
        });
    }

    // Compare address
    const addressComparison = compareAddress(extractedNAP, profileNAP);
    if (!addressComparison.matches && addressComparison.found) {
        discrepancies.push({
            field: 'address',
            profileValue: profileNAP.address || '',
            websiteValue: addressComparison.found,
            confidence: addressComparison.confidence,
            reason: 'Address on website does not match profile address',
        });
    }

    // Compare phone
    const phoneComparison = comparePhone(extractedNAP, profileNAP);
    if (!phoneComparison.matches && phoneComparison.found) {
        discrepancies.push({
            field: 'phone',
            profileValue: profileNAP.phone || '',
            websiteValue: phoneComparison.found,
            confidence: phoneComparison.confidence,
            reason: 'Phone number on website does not match profile phone',
        });
    }

    // Calculate overall consistency score
    const overallConsistency = calculateOverallConsistency(
        nameComparison,
        addressComparison,
        phoneComparison
    );

    return {
        napConsistency: {
            name: nameComparison,
            address: addressComparison,
            phone: phoneComparison,
            overallConsistency,
        },
        discrepancies,
    };
}

// ==================== Name Comparison ====================

/**
 * Compare business name from website with profile name
 * 
 * @param extractedNAP - Extracted NAP data
 * @param profileNAP - Profile NAP data
 * @returns Name comparison result
 */
function compareName(extractedNAP: NAPData, profileNAP: ProfileNAPData): NAPComponent {
    // If no names extracted, return not found
    if (!extractedNAP.names || extractedNAP.names.length === 0) {
        return {
            found: undefined,
            matches: false,
            confidence: 0,
        };
    }

    const profileName = normalizeString(profileNAP.name);

    // Find best matching name from extracted names
    let bestMatch: string | undefined;
    let bestConfidence = 0;

    for (const extractedName of extractedNAP.names) {
        const normalized = normalizeString(extractedName);
        const confidence = calculateStringSimilarity(profileName, normalized);

        if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = extractedName;
        }
    }

    // Consider it a match if confidence is above threshold (0.8)
    const matches = bestConfidence >= 0.8;

    return {
        found: bestMatch,
        matches,
        confidence: bestConfidence,
    };
}

// ==================== Address Comparison ====================

/**
 * Compare address from website with profile address using fuzzy matching
 * 
 * @param extractedNAP - Extracted NAP data
 * @param profileNAP - Profile NAP data
 * @returns Address comparison result
 */
function compareAddress(extractedNAP: NAPData, profileNAP: ProfileNAPData): NAPComponent {
    // If no profile address, can't compare
    if (!profileNAP.address) {
        return {
            found: undefined,
            matches: false,
            confidence: 0,
        };
    }

    // If no addresses extracted, return not found
    if (extractedNAP.addresses.length === 0) {
        return {
            found: undefined,
            matches: false,
            confidence: 0,
        };
    }

    const profileAddress = normalizeAddress(profileNAP.address);

    // Find best matching address from extracted addresses
    let bestMatch: string | undefined;
    let bestConfidence = 0;

    for (const extractedAddress of extractedNAP.addresses) {
        const normalized = normalizeAddress(extractedAddress);
        const confidence = calculateAddressSimilarity(profileAddress, normalized);

        if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = extractedAddress;
        }
    }

    // Consider it a match if confidence is above threshold (0.75 for addresses)
    const matches = bestConfidence >= 0.75;

    return {
        found: bestMatch,
        matches,
        confidence: bestConfidence,
    };
}

// ==================== Phone Comparison ====================

/**
 * Compare phone number from website with profile phone using fuzzy matching
 * 
 * @param extractedNAP - Extracted NAP data
 * @param profileNAP - Profile NAP data
 * @returns Phone comparison result
 */
function comparePhone(extractedNAP: NAPData, profileNAP: ProfileNAPData): NAPComponent {
    // If no profile phone, can't compare
    if (!profileNAP.phone) {
        return {
            found: undefined,
            matches: false,
            confidence: 0,
        };
    }

    // If no phones extracted, return not found
    if (extractedNAP.phones.length === 0) {
        return {
            found: undefined,
            matches: false,
            confidence: 0,
        };
    }

    const profilePhone = normalizePhone(profileNAP.phone);

    // Find best matching phone from extracted phones
    let bestMatch: string | undefined;
    let bestConfidence = 0;

    for (const extractedPhone of extractedNAP.phones) {
        const normalized = normalizePhone(extractedPhone);
        const confidence = calculatePhoneSimilarity(profilePhone, normalized);

        if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestMatch = extractedPhone;
        }
    }

    // Consider it a match if confidence is above threshold (0.9 for phones)
    const matches = bestConfidence >= 0.9;

    return {
        found: bestMatch,
        matches,
        confidence: bestConfidence,
    };
}

// ==================== Normalization Functions ====================

/**
 * Normalize a string for comparison
 * - Convert to lowercase
 * - Remove extra whitespace
 * - Remove special characters
 */
function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s]/g, '');
}

/**
 * Normalize an address for comparison
 * - Convert to lowercase
 * - Standardize abbreviations (St -> Street, Ave -> Avenue, etc.)
 * - Remove punctuation
 * - Remove extra whitespace
 */
function normalizeAddress(address: string): string {
    let normalized = address.toLowerCase().trim();

    // Standardize common abbreviations
    const abbreviations: Record<string, string> = {
        'street': 'st',
        'avenue': 'ave',
        'road': 'rd',
        'boulevard': 'blvd',
        'lane': 'ln',
        'drive': 'dr',
        'court': 'ct',
        'place': 'pl',
        'way': 'way',
        'circle': 'cir',
        'parkway': 'pkwy',
        'suite': 'ste',
        'apartment': 'apt',
        'building': 'bldg',
        'floor': 'fl',
        'north': 'n',
        'south': 's',
        'east': 'e',
        'west': 'w',
    };

    // Replace full words with abbreviations
    for (const [full, abbr] of Object.entries(abbreviations)) {
        const regex = new RegExp(`\\b${full}\\b`, 'gi');
        normalized = normalized.replace(regex, abbr);
    }

    // Remove punctuation and extra whitespace
    normalized = normalized
        .replace(/[.,#]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    return normalized;
}

/**
 * Normalize a phone number for comparison
 * - Remove all non-digit characters
 * - Remove country code if present (1)
 */
function normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // Remove leading 1 (US country code)
    if (normalized.length === 11 && normalized.startsWith('1')) {
        normalized = normalized.substring(1);
    }

    return normalized;
}

// ==================== Similarity Calculation ====================

/**
 * Calculate string similarity using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return 1 - (distance / maxLength);
}

/**
 * Calculate address similarity with special handling for address components
 */
function calculateAddressSimilarity(addr1: string, addr2: string): number {
    if (addr1 === addr2) return 1;

    // Split addresses into components
    const components1 = addr1.split(' ');
    const components2 = addr2.split(' ');

    // Check if street number matches (most important)
    const streetNumber1 = components1[0];
    const streetNumber2 = components2[0];

    if (streetNumber1 !== streetNumber2) {
        // Different street numbers = very low confidence
        return 0.2;
    }

    // Street number matches, calculate overall similarity
    return calculateStringSimilarity(addr1, addr2);
}

/**
 * Calculate phone similarity
 * For phones, we want exact match after normalization
 */
function calculatePhoneSimilarity(phone1: string, phone2: string): number {
    if (phone1 === phone2) return 1;

    // For phones, partial matches are not useful
    // Calculate similarity but weight it heavily toward exact match
    const similarity = calculateStringSimilarity(phone1, phone2);

    // If not exact match, reduce confidence significantly
    return similarity === 1 ? 1 : similarity * 0.5;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits required to change one string into the other
 */
function levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create a 2D array for dynamic programming
    const matrix: number[][] = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) {
        matrix[i][0] = i;
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

// ==================== Overall Consistency Calculation ====================

/**
 * Calculate overall NAP consistency score (0-100)
 * 
 * Weights:
 * - Name: 30%
 * - Address: 40%
 * - Phone: 30%
 * 
 * @param nameComparison - Name comparison result
 * @param addressComparison - Address comparison result
 * @param phoneComparison - Phone comparison result
 * @returns Overall consistency score (0-100)
 */
function calculateOverallConsistency(
    nameComparison: NAPComponent,
    addressComparison: NAPComponent,
    phoneComparison: NAPComponent
): number {
    // Calculate weighted score
    const nameScore = nameComparison.confidence * 30;
    const addressScore = addressComparison.confidence * 40;
    const phoneScore = phoneComparison.confidence * 30;

    const totalScore = nameScore + addressScore + phoneScore;

    // Round to nearest integer
    return Math.round(totalScore);
}

// ==================== Discrepancy Report Generation ====================

/**
 * Generate a human-readable discrepancy report
 * 
 * @param discrepancies - Array of NAP discrepancies
 * @returns Formatted discrepancy report
 */
export function generateDiscrepancyReport(discrepancies: NAPDiscrepancy[]): string {
    if (discrepancies.length === 0) {
        return 'No NAP discrepancies found. Your business information is consistent!';
    }

    const lines: string[] = [
        'NAP Discrepancy Report',
        '======================',
        '',
        `Found ${discrepancies.length} discrepancy(ies):`,
        '',
    ];

    for (const discrepancy of discrepancies) {
        lines.push(`${discrepancy.field.toUpperCase()}:`);
        lines.push(`  Profile: ${discrepancy.profileValue}`);
        lines.push(`  Website: ${discrepancy.websiteValue}`);
        lines.push(`  Confidence: ${(discrepancy.confidence * 100).toFixed(0)}%`);
        lines.push(`  Issue: ${discrepancy.reason}`);
        lines.push('');
    }

    lines.push('Recommendation: Update your website to match your profile information exactly.');

    return lines.join('\n');
}

/**
 * Check if NAP data has internal inconsistencies
 * (multiple different values for the same field on the website)
 * 
 * @param napData - Extracted NAP data
 * @returns Array of internal inconsistencies
 */
export function checkInternalConsistency(napData: NAPData): {
    field: 'phone' | 'address' | 'email';
    values: string[];
    reason: string;
}[] {
    const inconsistencies: {
        field: 'phone' | 'address' | 'email';
        values: string[];
        reason: string;
    }[] = [];

    // Check phone consistency
    if (napData.phones.length > 1) {
        const uniquePhones = new Set(napData.phones.map(normalizePhone));
        if (uniquePhones.size > 1) {
            inconsistencies.push({
                field: 'phone',
                values: Array.from(uniquePhones),
                reason: 'Multiple different phone numbers found on website',
            });
        }
    }

    // Check address consistency
    if (napData.addresses.length > 1) {
        const uniqueAddresses = new Set(napData.addresses.map(normalizeAddress));
        if (uniqueAddresses.size > 1) {
            inconsistencies.push({
                field: 'address',
                values: Array.from(uniqueAddresses),
                reason: 'Multiple different addresses found on website',
            });
        }
    }

    // Check email consistency
    if (napData.emails.length > 1) {
        const uniqueEmails = new Set(napData.emails.map(e => e.toLowerCase()));
        if (uniqueEmails.size > 1) {
            inconsistencies.push({
                field: 'email',
                values: Array.from(uniqueEmails),
                reason: 'Multiple different email addresses found on website',
            });
        }
    }

    return inconsistencies;
}
