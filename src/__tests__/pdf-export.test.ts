/**
 * Tests for PDF Export Functionality
 * Validates Requirements: 6.1
 */

import { generateSessionPDF } from '@/lib/open-house/pdf-export';
import { OpenHouseSession, Visitor, SessionStatus, InterestLevel, CheckInSource } from '@/lib/open-house/types';

describe('PDF Export', () => {
    // Sample session data
    const mockSession: OpenHouseSession = {
        sessionId: 'session-123',
        userId: 'user-456',
        propertyAddress: '123 Main Street, Anytown, CA 12345',
        scheduledDate: '2024-12-15',
        scheduledStartTime: '2024-12-15T14:00:00Z',
        scheduledEndTime: '2024-12-15T16:00:00Z',
        actualStartTime: '2024-12-15T14:05:00Z',
        actualEndTime: '2024-12-15T16:10:00Z',
        status: SessionStatus.COMPLETED,
        qrCodeUrl: 'https://example.com/qr/session-123.png',
        visitorCount: 3,
        interestLevelDistribution: {
            high: 1,
            medium: 1,
            low: 1,
        },
        photos: [],
        notes: 'Great turnout! Weather was perfect.',
        createdAt: '2024-12-10T10:00:00Z',
        updatedAt: '2024-12-15T16:10:00Z',
    };

    const mockVisitors: Visitor[] = [
        {
            visitorId: 'visitor-1',
            sessionId: 'session-123',
            userId: 'user-456',
            name: 'John Doe',
            email: 'john.doe@example.com',
            phone: '555-0101',
            interestLevel: InterestLevel.HIGH,
            notes: 'Very interested, wants to schedule a private showing',
            checkInTime: '2024-12-15T14:10:00Z',
            followUpGenerated: true,
            followUpSent: true,
            followUpSentAt: '2024-12-15T17:00:00Z',
            source: CheckInSource.QR,
            createdAt: '2024-12-15T14:10:00Z',
            updatedAt: '2024-12-15T17:00:00Z',
        },
        {
            visitorId: 'visitor-2',
            sessionId: 'session-123',
            userId: 'user-456',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            phone: '555-0102',
            interestLevel: InterestLevel.MEDIUM,
            checkInTime: '2024-12-15T14:30:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.MANUAL,
            createdAt: '2024-12-15T14:30:00Z',
            updatedAt: '2024-12-15T14:30:00Z',
        },
        {
            visitorId: 'visitor-3',
            sessionId: 'session-123',
            userId: 'user-456',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            phone: '555-0103',
            interestLevel: InterestLevel.LOW,
            notes: 'Just browsing the neighborhood',
            checkInTime: '2024-12-15T15:45:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.QR,
            createdAt: '2024-12-15T15:45:00Z',
            updatedAt: '2024-12-15T15:45:00Z',
        },
    ];

    describe('generateSessionPDF', () => {
        it('should generate a PDF buffer', () => {
            const pdfBuffer = generateSessionPDF(mockSession, mockVisitors);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should generate a valid PDF with correct header', () => {
            const pdfBuffer = generateSessionPDF(mockSession, mockVisitors);
            const pdfString = pdfBuffer.toString('latin1');

            // Check for PDF header
            expect(pdfString).toContain('%PDF');
        });

        it('should include session property address in PDF', () => {
            const pdfBuffer = generateSessionPDF(mockSession, mockVisitors);
            const pdfString = pdfBuffer.toString('latin1');

            // The property address should be in the PDF content
            expect(pdfString).toContain('123 Main Street');
        });

        it('should include visitor count in PDF', () => {
            const pdfBuffer = generateSessionPDF(mockSession, mockVisitors);
            const pdfString = pdfBuffer.toString('latin1');

            // Check for visitor count
            expect(pdfString).toContain('Total Visitors');
        });

        it('should handle sessions with no visitors', () => {
            const emptySession = {
                ...mockSession,
                visitorCount: 0,
                interestLevelDistribution: {
                    high: 0,
                    medium: 0,
                    low: 0,
                },
            };

            const pdfBuffer = generateSessionPDF(emptySession, []);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should handle sessions with many visitors', () => {
            // Create 50 mock visitors
            const manyVisitors: Visitor[] = Array.from({ length: 50 }, (_, i) => ({
                visitorId: `visitor-${i}`,
                sessionId: 'session-123',
                userId: 'user-456',
                name: `Visitor ${i}`,
                email: `visitor${i}@example.com`,
                phone: `555-${String(i).padStart(4, '0')}`,
                interestLevel: [InterestLevel.HIGH, InterestLevel.MEDIUM, InterestLevel.LOW][i % 3],
                checkInTime: `2024-12-15T${14 + Math.floor(i / 30)}:${String(i % 60).padStart(2, '0')}:00Z`,
                followUpGenerated: false,
                followUpSent: false,
                source: CheckInSource.QR,
                createdAt: `2024-12-15T${14 + Math.floor(i / 30)}:${String(i % 60).padStart(2, '0')}:00Z`,
                updatedAt: `2024-12-15T${14 + Math.floor(i / 30)}:${String(i % 60).padStart(2, '0')}:00Z`,
            }));

            const largeSession = {
                ...mockSession,
                visitorCount: 50,
                interestLevelDistribution: {
                    high: 17,
                    medium: 17,
                    low: 16,
                },
            };

            const pdfBuffer = generateSessionPDF(largeSession, manyVisitors);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);

            // Should create multiple pages
            const pdfString = pdfBuffer.toString('latin1');
            expect(pdfString).toContain('Page');
        });

        it('should include session notes when present', () => {
            const pdfBuffer = generateSessionPDF(mockSession, mockVisitors);
            const pdfString = pdfBuffer.toString('latin1');

            expect(pdfString).toContain('Notes');
        });

        it('should handle sessions without notes', () => {
            const sessionWithoutNotes = {
                ...mockSession,
                notes: undefined,
            };

            const pdfBuffer = generateSessionPDF(sessionWithoutNotes, mockVisitors);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should handle long visitor names and emails', () => {
            const longNameVisitors: Visitor[] = [
                {
                    visitorId: 'visitor-long',
                    sessionId: 'session-123',
                    userId: 'user-456',
                    name: 'Christopher Alexander Montgomery-Wellington III',
                    email: 'christopher.alexander.montgomery.wellington@verylongdomainname.com',
                    phone: '555-9999',
                    interestLevel: InterestLevel.HIGH,
                    checkInTime: '2024-12-15T14:10:00Z',
                    followUpGenerated: false,
                    followUpSent: false,
                    source: CheckInSource.MANUAL,
                    createdAt: '2024-12-15T14:10:00Z',
                    updatedAt: '2024-12-15T14:10:00Z',
                },
            ];

            const pdfBuffer = generateSessionPDF(mockSession, longNameVisitors);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should calculate and display duration correctly', () => {
            const pdfBuffer = generateSessionPDF(mockSession, mockVisitors);
            const pdfString = pdfBuffer.toString('latin1');

            // Session duration should be included
            expect(pdfString).toContain('Duration');
        });

        it('should handle sessions without end time', () => {
            const activeSession = {
                ...mockSession,
                actualEndTime: undefined,
                status: SessionStatus.ACTIVE,
            };

            const pdfBuffer = generateSessionPDF(activeSession, mockVisitors);

            expect(pdfBuffer).toBeInstanceOf(Buffer);
            expect(pdfBuffer.length).toBeGreaterThan(0);
        });

        it('should include interest level distribution', () => {
            const pdfBuffer = generateSessionPDF(mockSession, mockVisitors);
            const pdfString = pdfBuffer.toString('latin1');

            expect(pdfString).toContain('High Interest');
            expect(pdfString).toContain('Medium Interest');
            expect(pdfString).toContain('Low Interest');
        });

        it('should generate PDF within performance target', () => {
            // Create 100 visitors to test performance requirement (6.4)
            const manyVisitors: Visitor[] = Array.from({ length: 100 }, (_, i) => ({
                visitorId: `visitor-${i}`,
                sessionId: 'session-123',
                userId: 'user-456',
                name: `Visitor ${i}`,
                email: `visitor${i}@example.com`,
                phone: `555-${String(i).padStart(4, '0')}`,
                interestLevel: [InterestLevel.HIGH, InterestLevel.MEDIUM, InterestLevel.LOW][i % 3],
                checkInTime: `2024-12-15T14:00:00Z`,
                followUpGenerated: false,
                followUpSent: false,
                source: CheckInSource.QR,
                createdAt: `2024-12-15T14:00:00Z`,
                updatedAt: `2024-12-15T14:00:00Z`,
            }));

            const largeSession = {
                ...mockSession,
                visitorCount: 100,
            };

            const startTime = Date.now();
            const pdfBuffer = generateSessionPDF(largeSession, manyVisitors);
            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(pdfBuffer).toBeInstanceOf(Buffer);

            // Should complete within 10 seconds (Requirement 6.4)
            // Note: This is just the PDF generation time, not including S3 upload
            expect(duration).toBeLessThan(10000);
        });
    });
});
