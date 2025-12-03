/**
 * Tests for Website Analysis NAP Comparison
 * 
 * Tests NAP comparison logic including fuzzy matching for addresses and phone numbers
 */

import {
    compareNAPData,
    generateDiscrepancyReport,
    checkInternalConsistency,
    type ProfileNAPData,
} from '../website-analysis-nap-comparison';
import type { NAPData } from '@/ai/schemas/website-analysis-schemas';

describe('NAP Comparison', () => {
    describe('compareNAPData', () => {
        it('should match identical NAP data', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe Real Estate'],
                phones: ['(555) 123-4567'],
                emails: ['john@example.com'],
                addresses: ['123 Main Street, City, ST 12345'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St, City, ST 12345',
                email: 'john@example.com',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.name.matches).toBe(true);
            expect(result.napConsistency.phone.matches).toBe(true);
            expect(result.napConsistency.address.matches).toBe(true);
            expect(result.napConsistency.overallConsistency).toBeGreaterThan(90);
            expect(result.discrepancies).toHaveLength(0);
        });

        it('should detect name mismatch', () => {
            const extractedNAP: NAPData = {
                names: ['Jane Smith Realty'],
                phones: ['(555) 123-4567'],
                emails: ['john@example.com'],
                addresses: ['123 Main Street'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.name.matches).toBe(false);
            expect(result.discrepancies.length).toBeGreaterThan(0);
            expect(result.discrepancies.some(d => d.field === 'name')).toBe(true);
        });

        it('should detect phone mismatch', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe Real Estate'],
                phones: ['(555) 999-8888'],
                emails: ['john@example.com'],
                addresses: ['123 Main Street'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.phone.matches).toBe(false);
            expect(result.discrepancies.some(d => d.field === 'phone')).toBe(true);
        });

        it('should detect address mismatch', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe Real Estate'],
                phones: ['(555) 123-4567'],
                emails: ['john@example.com'],
                addresses: ['456 Oak Avenue'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.address.matches).toBe(false);
            expect(result.discrepancies.some(d => d.field === 'address')).toBe(true);
        });

        it('should handle missing profile data', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe Real Estate'],
                phones: ['(555) 123-4567'],
                emails: ['john@example.com'],
                addresses: ['123 Main Street'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                // No phone or address
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.name.matches).toBe(true);
            expect(result.napConsistency.phone.matches).toBe(false);
            expect(result.napConsistency.address.matches).toBe(false);
        });

        it('should handle missing extracted data', () => {
            const extractedNAP: NAPData = {
                names: [],
                phones: [],
                emails: [],
                addresses: [],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.name.found).toBeUndefined();
            expect(result.napConsistency.phone.found).toBeUndefined();
            expect(result.napConsistency.address.found).toBeUndefined();
            expect(result.napConsistency.overallConsistency).toBe(0);
        });
    });

    describe('Phone Fuzzy Matching', () => {
        it('should match phone numbers with different formatting', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe'],
                phones: ['555.123.4567'],
                emails: [],
                addresses: [],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe',
                phone: '(555) 123-4567',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.phone.matches).toBe(true);
        });

        it('should match phone numbers with country code', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe'],
                phones: ['+1-555-123-4567'],
                emails: [],
                addresses: [],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe',
                phone: '555-123-4567',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.phone.matches).toBe(true);
        });

        it('should not match different phone numbers', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe'],
                phones: ['555-999-8888'],
                emails: [],
                addresses: [],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe',
                phone: '555-123-4567',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.phone.matches).toBe(false);
        });
    });

    describe('Address Fuzzy Matching', () => {
        it('should match addresses with different abbreviations', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe'],
                phones: [],
                emails: [],
                addresses: ['123 Main Street'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.address.matches).toBe(true);
        });

        it('should match addresses with different punctuation', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe'],
                phones: [],
                emails: [],
                addresses: ['123 Main St., Suite 100'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe',
                address: '123 Main St Suite 100',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.address.matches).toBe(true);
        });

        it('should not match addresses with different street numbers', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe'],
                phones: [],
                emails: [],
                addresses: ['456 Main Street'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.address.matches).toBe(false);
        });
    });

    describe('generateDiscrepancyReport', () => {
        it('should generate report for no discrepancies', () => {
            const report = generateDiscrepancyReport([]);

            expect(report).toContain('No NAP discrepancies found');
            expect(report).toContain('consistent');
        });

        it('should generate report for discrepancies', () => {
            const discrepancies = [
                {
                    field: 'phone' as const,
                    profileValue: '555-123-4567',
                    websiteValue: '555-999-8888',
                    confidence: 0.5,
                    reason: 'Phone number on website does not match profile phone',
                },
            ];

            const report = generateDiscrepancyReport(discrepancies);

            expect(report).toContain('PHONE');
            expect(report).toContain('555-123-4567');
            expect(report).toContain('555-999-8888');
            expect(report).toContain('50%');
        });
    });

    describe('checkInternalConsistency', () => {
        it('should detect multiple different phone numbers', () => {
            const napData: NAPData = {
                names: ['John Doe'],
                phones: ['555-123-4567', '555-999-8888'],
                emails: [],
                addresses: [],
            };

            const inconsistencies = checkInternalConsistency(napData);

            expect(inconsistencies.length).toBeGreaterThan(0);
            expect(inconsistencies.some(i => i.field === 'phone')).toBe(true);
        });

        it('should detect multiple different addresses', () => {
            const napData: NAPData = {
                names: ['John Doe'],
                phones: [],
                emails: [],
                addresses: ['123 Main St', '456 Oak Ave'],
            };

            const inconsistencies = checkInternalConsistency(napData);

            expect(inconsistencies.length).toBeGreaterThan(0);
            expect(inconsistencies.some(i => i.field === 'address')).toBe(true);
        });

        it('should not flag same phone in different formats', () => {
            const napData: NAPData = {
                names: ['John Doe'],
                phones: ['555-123-4567', '(555) 123-4567'],
                emails: [],
                addresses: [],
            };

            const inconsistencies = checkInternalConsistency(napData);

            // Should not flag as inconsistent since they normalize to the same value
            expect(inconsistencies.some(i => i.field === 'phone')).toBe(false);
        });

        it('should return empty array for consistent data', () => {
            const napData: NAPData = {
                names: ['John Doe'],
                phones: ['555-123-4567'],
                emails: ['john@example.com'],
                addresses: ['123 Main St'],
            };

            const inconsistencies = checkInternalConsistency(napData);

            expect(inconsistencies).toHaveLength(0);
        });
    });

    describe('Overall Consistency Score', () => {
        it('should calculate high score for perfect match', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe Real Estate'],
                phones: ['555-123-4567'],
                emails: [],
                addresses: ['123 Main St'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.overallConsistency).toBeGreaterThanOrEqual(95);
        });

        it('should calculate low score for multiple mismatches', () => {
            const extractedNAP: NAPData = {
                names: ['Jane Smith Realty'],
                phones: ['555-999-8888'],
                emails: [],
                addresses: ['456 Oak Ave'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.overallConsistency).toBeLessThan(50);
        });

        it('should calculate medium score for partial match', () => {
            const extractedNAP: NAPData = {
                names: ['John Doe Real Estate'],
                phones: ['555-999-8888'],
                emails: [],
                addresses: ['123 Main St'],
            };

            const profileNAP: ProfileNAPData = {
                name: 'John Doe Real Estate',
                phone: '555-123-4567',
                address: '123 Main St',
            };

            const result = compareNAPData(extractedNAP, profileNAP);

            expect(result.napConsistency.overallConsistency).toBeGreaterThan(50);
            expect(result.napConsistency.overallConsistency).toBeLessThan(90);
        });
    });
});
