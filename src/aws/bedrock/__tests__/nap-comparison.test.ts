/**
 * Property-based tests for NAP comparison logic
 * 
 * Feature: ai-model-optimization, Property 11: NAP comparison ignores formatting differences
 * Validates: Requirements 7.3
 */

import * as fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';

/**
 * Helper function to normalize NAP data for comparison
 * This simulates the comparison logic that should be used in NAP audits
 */
function normalizeNapField(value: string): string {
  let normalized = value
    .toLowerCase()
    .trim();
  
  // Check if this looks like a phone number (contains mostly digits)
  const digitCount = (normalized.match(/\d/g) || []).length;
  const isPhone = digitCount >= 10;
  
  if (isPhone) {
    // For phone numbers: remove all formatting
    return normalized
      .replace(/[\s\-\(\)\.\+]/g, '')
      .replace(/^1/, ''); // Remove leading 1 (country code)
  } else {
    // For addresses and names: normalize abbreviations and formatting
    return normalized
      // Remove periods from abbreviations
      .replace(/\./g, '')
      // Normalize address abbreviations (handle both full and abbreviated forms)
      .replace(/\b(street|st)\b/gi, 'st')
      .replace(/\b(avenue|ave)\b/gi, 'ave')
      .replace(/\b(road|rd)\b/gi, 'rd')
      .replace(/\b(drive|dr)\b/gi, 'dr')
      .replace(/\b(lane|ln)\b/gi, 'ln')
      .replace(/\b(boulevard|blvd)\b/gi, 'blvd')
      .replace(/\b(apartment|apt)\b/gi, 'apt')
      .replace(/\b(suite|ste)\b/gi, 'ste')
      // Remove apostrophes and other special characters
      .replace(/['']/g, '')
      // Normalize whitespace to single spaces
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Helper function to check if two NAP fields are substantially equivalent
 */
function areNapFieldsEquivalent(field1: string, field2: string): boolean {
  return normalizeNapField(field1) === normalizeNapField(field2);
}

describe('NAP Comparison Property Tests', () => {
  describe('Property 11: NAP comparison ignores formatting differences', () => {
    /**
     * Phone numbers with different formatting should be considered equivalent
     * Requirements 7.3
     */
    it('should treat phone numbers with different formatting as equivalent', () => {
      fc.assert(
        fc.property(
          // Generate a base phone number (10 digits)
          fc.tuple(
            fc.integer({ min: 200, max: 999 }), // area code
            fc.integer({ min: 200, max: 999 }), // exchange
            fc.integer({ min: 1000, max: 9999 }) // line number
          ),
          ([area, exchange, line]) => {
            const digits = `${area}${exchange}${line}`;
            
            // Different formatting variations
            const formats = [
              digits, // 1234567890
              `${area}-${exchange}-${line}`, // 123-456-7890
              `(${area}) ${exchange}-${line}`, // (123) 456-7890
              `${area}.${exchange}.${line}`, // 123.456.7890
              `${area} ${exchange} ${line}`, // 123 456 7890
              `(${area})${exchange}-${line}`, // (123)456-7890
            ];
            
            // All formats should be considered equivalent
            for (let i = 0; i < formats.length; i++) {
              for (let j = i + 1; j < formats.length; j++) {
                expect(areNapFieldsEquivalent(formats[i], formats[j])).toBe(true);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Addresses with different abbreviations should be considered equivalent
     * Requirements 7.3
     */
    it('should treat addresses with different abbreviations as equivalent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.constantFrom('Main', 'Oak', 'Maple', 'Park', 'Washington'),
          fc.constantFrom(
            ['Street', 'St', 'St.'],
            ['Avenue', 'Ave', 'Ave.'],
            ['Road', 'Rd', 'Rd.'],
            ['Drive', 'Dr', 'Dr.'],
            ['Lane', 'Ln', 'Ln.'],
            ['Boulevard', 'Blvd', 'Blvd.']
          ),
          (number, streetName, [full, abbr1, abbr2]) => {
            const address1 = `${number} ${streetName} ${full}`;
            const address2 = `${number} ${streetName} ${abbr1}`;
            const address3 = `${number} ${streetName} ${abbr2}`;
            
            // All variations should be considered equivalent
            expect(areNapFieldsEquivalent(address1, address2)).toBe(true);
            expect(areNapFieldsEquivalent(address2, address3)).toBe(true);
            expect(areNapFieldsEquivalent(address1, address3)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Names with different casing should be considered equivalent
     * Requirements 7.3
     */
    it('should treat names with different casing as equivalent', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'John Smith',
            'Jane Doe',
            'Robert Johnson',
            'Mary Williams',
            'Michael Brown'
          ),
          (name) => {
            const variations = [
              name.toLowerCase(), // john smith
              name.toUpperCase(), // JOHN SMITH
              name, // John Smith
              name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '), // Proper case
            ];
            
            // All casing variations should be considered equivalent
            for (let i = 0; i < variations.length; i++) {
              for (let j = i + 1; j < variations.length; j++) {
                expect(areNapFieldsEquivalent(variations[i], variations[j])).toBe(true);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Addresses with extra whitespace should be considered equivalent
     * Requirements 7.3
     */
    it('should treat addresses with extra whitespace as equivalent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.constantFrom('Main', 'Oak', 'Maple'),
          fc.constantFrom('Street', 'Avenue', 'Road'),
          (number, streetName, streetType) => {
            const baseAddress = `${number} ${streetName} ${streetType}`;
            
            const variations = [
              baseAddress,
              `  ${baseAddress}  `, // Leading/trailing whitespace
              `${number}  ${streetName}  ${streetType}`, // Extra spaces between words
              `${number}\t${streetName}\t${streetType}`, // Tabs instead of spaces
              ` ${number} ${streetName} ${streetType} `, // Mixed whitespace
            ];
            
            // All whitespace variations should be considered equivalent
            for (let i = 0; i < variations.length; i++) {
              for (let j = i + 1; j < variations.length; j++) {
                expect(areNapFieldsEquivalent(variations[i], variations[j])).toBe(true);
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Apartment/Suite abbreviations should be considered equivalent
     * Requirements 7.3
     */
    it('should treat apartment and suite abbreviations as equivalent', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.constantFrom('Main', 'Oak'),
          fc.constantFrom('Street', 'Avenue'),
          fc.integer({ min: 1, max: 999 }),
          fc.constantFrom(
            ['Apartment', 'Apt', 'Apt.'],
            ['Suite', 'Ste', 'Ste.']
          ),
          (number, streetName, streetType, unitNumber, [full, abbr1, abbr2]) => {
            const address1 = `${number} ${streetName} ${streetType} ${full} ${unitNumber}`;
            const address2 = `${number} ${streetName} ${streetType} ${abbr1} ${unitNumber}`;
            const address3 = `${number} ${streetName} ${streetType} ${abbr2} ${unitNumber}`;
            
            // All variations should be considered equivalent
            expect(areNapFieldsEquivalent(address1, address2)).toBe(true);
            expect(areNapFieldsEquivalent(address2, address3)).toBe(true);
            expect(areNapFieldsEquivalent(address1, address3)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Substantially different values should NOT be considered equivalent
     * Requirements 7.3
     */
    it('should detect substantive differences in NAP data', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 200, max: 999 }),
            fc.integer({ min: 200, max: 999 }),
            fc.integer({ min: 1000, max: 9999 })
          ),
          fc.tuple(
            fc.integer({ min: 200, max: 999 }),
            fc.integer({ min: 200, max: 999 }),
            fc.integer({ min: 1000, max: 9999 })
          ),
          ([area1, exchange1, line1], [area2, exchange2, line2]) => {
            // Skip if phone numbers are the same
            if (area1 === area2 && exchange1 === exchange2 && line1 === line2) {
              return true;
            }
            
            const phone1 = `${area1}-${exchange1}-${line1}`;
            const phone2 = `${area2}-${exchange2}-${line2}`;
            
            // Different phone numbers should NOT be considered equivalent
            expect(areNapFieldsEquivalent(phone1, phone2)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Different street names should NOT be considered equivalent
     * Requirements 7.3
     */
    it('should detect different street names', () => {
      const streetPairs = [
        ['123 Main Street', '123 Oak Street'],
        ['456 Park Avenue', '456 Maple Avenue'],
        ['789 First Street', '789 Second Street'],
      ];

      streetPairs.forEach(([addr1, addr2]) => {
        expect(areNapFieldsEquivalent(addr1, addr2)).toBe(false);
      });
    });

    /**
     * Different street numbers should NOT be considered equivalent
     * Requirements 7.3
     */
    it('should detect different street numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          fc.integer({ min: 1, max: 9999 }),
          fc.constantFrom('Main', 'Oak', 'Maple'),
          fc.constantFrom('Street', 'Avenue'),
          (number1, number2, streetName, streetType) => {
            // Skip if numbers are the same
            if (number1 === number2) {
              return true;
            }
            
            const address1 = `${number1} ${streetName} ${streetType}`;
            const address2 = `${number2} ${streetName} ${streetType}`;
            
            // Different street numbers should NOT be considered equivalent
            expect(areNapFieldsEquivalent(address1, address2)).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Comparison should be symmetric
     * Requirements 7.3
     */
    it('should have symmetric comparison (A == B implies B == A)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 50 }),
          fc.string({ minLength: 5, maxLength: 50 }),
          (field1, field2) => {
            const result1 = areNapFieldsEquivalent(field1, field2);
            const result2 = areNapFieldsEquivalent(field2, field1);
            
            // Comparison should be symmetric
            expect(result1).toBe(result2);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Comparison should be transitive
     * Requirements 7.3
     */
    it('should have transitive comparison (A == B and B == C implies A == C)', () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.integer({ min: 200, max: 999 }),
            fc.integer({ min: 200, max: 999 }),
            fc.integer({ min: 1000, max: 9999 })
          ),
          ([area, exchange, line]) => {
            const phone1 = `${area}-${exchange}-${line}`;
            const phone2 = `(${area}) ${exchange}-${line}`;
            const phone3 = `${area}.${exchange}.${line}`;
            
            const eq12 = areNapFieldsEquivalent(phone1, phone2);
            const eq23 = areNapFieldsEquivalent(phone2, phone3);
            const eq13 = areNapFieldsEquivalent(phone1, phone3);
            
            // If phone1 == phone2 and phone2 == phone3, then phone1 == phone3
            if (eq12 && eq23) {
              expect(eq13).toBe(true);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Comparison should be reflexive (A == A)
     * Requirements 7.3
     */
    it('should have reflexive comparison (any value equals itself)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (field) => {
            // Any value should be equivalent to itself
            expect(areNapFieldsEquivalent(field, field)).toBe(true);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('NAP Comparison Edge Cases', () => {
    /**
     * Empty strings should be handled correctly
     */
    it('should handle empty strings', () => {
      expect(areNapFieldsEquivalent('', '')).toBe(true);
      expect(areNapFieldsEquivalent('123 Main St', '')).toBe(false);
      expect(areNapFieldsEquivalent('', '123 Main St')).toBe(false);
    });

    /**
     * Whitespace-only strings should be treated as empty
     */
    it('should treat whitespace-only strings as empty', () => {
      expect(areNapFieldsEquivalent('   ', '')).toBe(true);
      expect(areNapFieldsEquivalent('\t\t', '')).toBe(true);
      expect(areNapFieldsEquivalent('  \n  ', '')).toBe(true);
    });

    /**
     * Special characters in addresses should be handled
     */
    it('should handle special characters in addresses', () => {
      const addr1 = "123 O'Brien Street";
      const addr2 = "123 O'Brien St";
      
      // Should still recognize the abbreviation despite apostrophe
      expect(areNapFieldsEquivalent(addr1, addr2)).toBe(true);
    });

    /**
     * International phone formats should be normalized
     */
    it('should normalize international phone formats', () => {
      const phone1 = '+1 (123) 456-7890';
      const phone2 = '1234567890';
      const phone3 = '123-456-7890';
      
      // After removing formatting, these should be equivalent
      // (assuming we strip the +1 country code)
      const normalized1 = normalizeNapField(phone1).replace(/^\+?1/, '');
      const normalized2 = normalizeNapField(phone2);
      const normalized3 = normalizeNapField(phone3);
      
      expect(normalized1).toBe(normalized2);
      expect(normalized2).toBe(normalized3);
    });
  });
});
