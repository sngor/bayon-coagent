/**
 * CSV Export Tests
 * 
 * Tests for CSV generation functionality
 * Validates Requirements: 6.2, 6.3
 */

import { generateVisitorCSV, generateVisitorCSVBuffer, DEFAULT_CSV_FIELDS } from '@/lib/open-house/csv-export';
import { Visitor, InterestLevel, CheckInSource } from '@/lib/open-house/types';

describe('CSV Export', () => {
    // Sample visitor data
    const mockVisitors: Visitor[] = [
        {
            visitorId: 'visitor-1',
            sessionId: 'session-1',
            userId: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-0100',
            interestLevel: InterestLevel.HIGH,
            notes: 'Very interested in the property',
            checkInTime: '2024-01-15T10:30:00Z',
            followUpGenerated: true,
            followUpSent: true,
            followUpSentAt: '2024-01-15T14:00:00Z',
            source: CheckInSource.QR,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T14:00:00Z',
        },
        {
            visitorId: 'visitor-2',
            sessionId: 'session-1',
            userId: 'user-1',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-0200',
            interestLevel: InterestLevel.MEDIUM,
            notes: 'Interested but needs to discuss with spouse',
            checkInTime: '2024-01-15T11:00:00Z',
            followUpGenerated: true,
            followUpSent: false,
            source: CheckInSource.MANUAL,
            createdAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-01-15T11:00:00Z',
        },
        {
            visitorId: 'visitor-3',
            sessionId: 'session-1',
            userId: 'user-1',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            phone: '555-0300',
            interestLevel: InterestLevel.LOW,
            checkInTime: '2024-01-15T11:30:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.QR,
            createdAt: '2024-01-15T11:30:00Z',
            updatedAt: '2024-01-15T11:30:00Z',
        },
    ];

    describe('generateVisitorCSV', () => {
        it('should generate CSV with all fields by default', () => {
            const csv = generateVisitorCSV(mockVisitors);

            // Check header row
            expect(csv).toContain('Visitor ID');
            expect(csv).toContain('Name');
            expect(csv).toContain('Email');
            expect(csv).toContain('Phone');
            expect(csv).toContain('Interest Level');
            expect(csv).toContain('Check-in Time');
            expect(csv).toContain('Check-in Source');
            expect(csv).toContain('Follow-up Generated');
            expect(csv).toContain('Follow-up Sent');
            expect(csv).toContain('Notes');

            // Check data rows
            expect(csv).toContain('John Doe');
            expect(csv).toContain('john@example.com');
            expect(csv).toContain('555-0100');
            expect(csv).toContain('High');

            expect(csv).toContain('Jane Smith');
            expect(csv).toContain('jane@example.com');
            expect(csv).toContain('Medium');

            expect(csv).toContain('Bob Johnson');
            expect(csv).toContain('bob@example.com');
            expect(csv).toContain('Low');
        });

        it('should include all visitor information including timestamps and interest levels (Requirement 6.2)', () => {
            const csv = generateVisitorCSV(mockVisitors);

            // Verify all required fields are present
            const lines = csv.split('\n');
            expect(lines.length).toBe(4); // Header + 3 visitors

            // Check that timestamps are formatted
            expect(csv).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // Date format

            // Check interest levels
            expect(csv).toContain('High');
            expect(csv).toContain('Medium');
            expect(csv).toContain('Low');

            // Check follow-up status
            expect(csv).toContain('Yes');
            expect(csv).toContain('No');
        });

        it('should filter fields based on permissions (Requirement 6.3)', () => {
            // Export with limited fields (simulating permission restrictions)
            const csv = generateVisitorCSV(mockVisitors, {
                name: true,
                email: true,
                interestLevel: true,
                checkInTime: true,
                phone: false, // Exclude phone
                notes: false, // Exclude notes
                visitorId: false, // Exclude visitor ID
            });

            // Should include permitted fields
            expect(csv).toContain('Name');
            expect(csv).toContain('Email');
            expect(csv).toContain('Interest Level');
            expect(csv).toContain('Check-in Time');

            // Should NOT include restricted fields
            expect(csv).not.toContain('Phone');
            expect(csv).not.toContain('Notes');
            expect(csv).not.toContain('Visitor ID');

            // Data should still be present for included fields
            expect(csv).toContain('John Doe');
            expect(csv).toContain('john@example.com');
        });

        it('should handle empty visitor list', () => {
            const csv = generateVisitorCSV([]);

            // Should have header row only
            const lines = csv.split('\n');
            expect(lines.length).toBe(1);
            expect(csv).toContain('Visitor ID');
        });

        it('should escape CSV special characters', () => {
            const visitorWithSpecialChars: Visitor = {
                ...mockVisitors[0],
                name: 'John "Johnny" Doe',
                notes: 'Has questions about:\n- Price\n- Location',
                email: 'test,email@example.com',
            };

            const csv = generateVisitorCSV([visitorWithSpecialChars]);

            // Should wrap fields with special characters in quotes
            expect(csv).toContain('"John ""Johnny"" Doe"'); // Escaped quotes
            expect(csv).toContain('"Has questions about:\n- Price\n- Location"'); // Newlines
            expect(csv).toContain('"test,email@example.com"'); // Commas
        });

        it('should handle missing optional fields', () => {
            const visitorWithoutOptionalFields: Visitor = {
                visitorId: 'visitor-4',
                sessionId: 'session-1',
                userId: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                phone: '555-0400',
                interestLevel: InterestLevel.MEDIUM,
                checkInTime: '2024-01-15T12:00:00Z',
                followUpGenerated: false,
                followUpSent: false,
                source: CheckInSource.MANUAL,
                createdAt: '2024-01-15T12:00:00Z',
                updatedAt: '2024-01-15T12:00:00Z',
                // notes, followUpSentAt are undefined
            };

            const csv = generateVisitorCSV([visitorWithoutOptionalFields]);

            // Should handle missing fields gracefully
            expect(csv).toContain('Test User');
            expect(csv).toContain('test@example.com');

            // Should have empty values for missing optional fields
            const lines = csv.split('\n');
            expect(lines.length).toBe(2); // Header + 1 visitor
        });

        it('should format dates consistently', () => {
            const csv = generateVisitorCSV(mockVisitors);

            // All dates should be formatted in a consistent way
            // Check that dates are present and formatted
            expect(csv).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/);
        });

        it('should capitalize interest levels and sources', () => {
            const csv = generateVisitorCSV(mockVisitors);

            // Interest levels should be capitalized
            expect(csv).toContain('High');
            expect(csv).toContain('Medium');
            expect(csv).toContain('Low');

            // Sources should be capitalized
            expect(csv).toContain('Qr');
            expect(csv).toContain('Manual');
        });

        it('should handle large visitor lists efficiently', () => {
            // Generate 100 visitors
            const largeVisitorList: Visitor[] = Array.from({ length: 100 }, (_, i) => ({
                visitorId: `visitor-${i}`,
                sessionId: 'session-1',
                userId: 'user-1',
                name: `Visitor ${i}`,
                email: `visitor${i}@example.com`,
                phone: `555-${String(i).padStart(4, '0')}`,
                interestLevel: [InterestLevel.LOW, InterestLevel.MEDIUM, InterestLevel.HIGH][i % 3],
                checkInTime: new Date(2024, 0, 15, 10 + Math.floor(i / 10), i % 60).toISOString(),
                followUpGenerated: i % 2 === 0,
                followUpSent: i % 3 === 0,
                source: i % 2 === 0 ? CheckInSource.QR : CheckInSource.MANUAL,
                createdAt: new Date(2024, 0, 15, 10 + Math.floor(i / 10), i % 60).toISOString(),
                updatedAt: new Date(2024, 0, 15, 10 + Math.floor(i / 10), i % 60).toISOString(),
            }));

            const startTime = Date.now();
            const csv = generateVisitorCSV(largeVisitorList);
            const endTime = Date.now();

            // Should complete within reasonable time (< 1 second for 100 visitors)
            expect(endTime - startTime).toBeLessThan(1000);

            // Should have correct number of rows
            const lines = csv.split('\n');
            expect(lines.length).toBe(101); // Header + 100 visitors
        });
    });

    describe('generateVisitorCSVBuffer', () => {
        it('should generate a Buffer from CSV content', () => {
            const buffer = generateVisitorCSVBuffer(mockVisitors);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Convert back to string and verify content
            const csvString = buffer.toString('utf-8');
            expect(csvString).toContain('John Doe');
            expect(csvString).toContain('jane@example.com');
        });

        it('should support field filtering', () => {
            const buffer = generateVisitorCSVBuffer(mockVisitors, {
                name: true,
                email: true,
                phone: false,
            });

            const csvString = buffer.toString('utf-8');
            expect(csvString).toContain('Name');
            expect(csvString).toContain('Email');
            expect(csvString).not.toContain('Phone');
        });
    });

    describe('DEFAULT_CSV_FIELDS', () => {
        it('should include all fields by default', () => {
            expect(DEFAULT_CSV_FIELDS.name).toBe(true);
            expect(DEFAULT_CSV_FIELDS.email).toBe(true);
            expect(DEFAULT_CSV_FIELDS.phone).toBe(true);
            expect(DEFAULT_CSV_FIELDS.interestLevel).toBe(true);
            expect(DEFAULT_CSV_FIELDS.notes).toBe(true);
            expect(DEFAULT_CSV_FIELDS.checkInTime).toBe(true);
            expect(DEFAULT_CSV_FIELDS.followUpGenerated).toBe(true);
            expect(DEFAULT_CSV_FIELDS.followUpSent).toBe(true);
            expect(DEFAULT_CSV_FIELDS.followUpSentAt).toBe(true);
            expect(DEFAULT_CSV_FIELDS.source).toBe(true);
            expect(DEFAULT_CSV_FIELDS.visitorId).toBe(true);
            expect(DEFAULT_CSV_FIELDS.createdAt).toBe(true);
            expect(DEFAULT_CSV_FIELDS.updatedAt).toBe(true);
        });
    });
});
