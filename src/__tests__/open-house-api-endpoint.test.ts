/**
 * Open House API Endpoint Tests
 * 
 * Tests for the external integration API endpoint
 * Validates Requirements: 10.1, 10.2
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/open-house/sessions/[sessionId]/route';
import { getCurrentUserServer } from '@/aws/auth/server-auth';
import { getRepository } from '@/aws/dynamodb/repository';
import { clearRateLimit, clearAllRateLimits } from '@/lib/api/rate-limiter';
import { OpenHouseSession, Visitor, SessionStatus, InterestLevel, CheckInSource } from '@/lib/open-house/types';

// Mock dependencies
jest.mock('@/aws/auth/server-auth');
jest.mock('@/aws/dynamodb/repository');

const mockGetCurrentUserServer = getCurrentUserServer as jest.MockedFunction<typeof getCurrentUserServer>;
const mockGetRepository = getRepository as jest.MockedFunction<typeof getRepository>;

describe('Open House API Endpoint', () => {
    const mockUserId = 'test-user-123';
    const mockSessionId = 'session-456';

    const mockSession: OpenHouseSession = {
        sessionId: mockSessionId,
        userId: mockUserId,
        propertyAddress: '123 Main St',
        scheduledDate: '2024-12-15',
        scheduledStartTime: '2024-12-15T14:00:00Z',
        actualStartTime: '2024-12-15T14:05:00Z',
        status: SessionStatus.ACTIVE,
        qrCodeUrl: 'https://example.com/qr/session-456.png',
        visitorCount: 2,
        interestLevelDistribution: {
            high: 1,
            medium: 1,
            low: 0
        },
        photos: [],
        createdAt: '2024-12-15T13:00:00Z',
        updatedAt: '2024-12-15T14:05:00Z'
    };

    const mockVisitors: Visitor[] = [
        {
            visitorId: 'visitor-1',
            sessionId: mockSessionId,
            userId: mockUserId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-1234',
            interestLevel: InterestLevel.HIGH,
            checkInTime: '2024-12-15T14:10:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.MANUAL,
            createdAt: '2024-12-15T14:10:00Z',
            updatedAt: '2024-12-15T14:10:00Z'
        },
        {
            visitorId: 'visitor-2',
            sessionId: mockSessionId,
            userId: mockUserId,
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-5678',
            interestLevel: InterestLevel.MEDIUM,
            checkInTime: '2024-12-15T14:15:00Z',
            followUpGenerated: false,
            followUpSent: false,
            source: CheckInSource.QR,
            createdAt: '2024-12-15T14:15:00Z',
            updatedAt: '2024-12-15T14:15:00Z'
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        clearAllRateLimits();
    });

    describe('Authentication', () => {
        it('should return 401 when user is not authenticated', async () => {
            mockGetCurrentUserServer.mockResolvedValue(null);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.success).toBe(false);
            expect(data.code).toBe('UNAUTHORIZED');
            expect(data.error).toBe('Authentication required');
        });

        it('should proceed when user is authenticated', async () => {
            mockGetCurrentUserServer.mockResolvedValue({
                id: mockUserId,
                email: 'test@example.com',
                emailVerified: true,
                attributes: {}
            });

            const mockRepository = {
                getOpenHouseSession: jest.fn().mockResolvedValue(mockSession),
                queryVisitorsBySession: jest.fn().mockResolvedValue({ items: mockVisitors })
            };
            mockGetRepository.mockReturnValue(mockRepository as any);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });

            expect(response.status).toBe(200);
        });
    });

    describe('Request Validation', () => {
        beforeEach(() => {
            mockGetCurrentUserServer.mockResolvedValue({
                id: mockUserId,
                email: 'test@example.com',
                emailVerified: true,
                attributes: {}
            });
        });

        it('should return 400 when sessionId is missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/');
            const response = await GET(request, { params: { sessionId: '' } });
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INVALID_REQUEST');
        });

        it('should return 404 when session is not found', async () => {
            const mockRepository = {
                getOpenHouseSession: jest.fn().mockResolvedValue(null)
            };
            mockGetRepository.mockReturnValue(mockRepository as any);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/nonexistent');
            const response = await GET(request, { params: { sessionId: 'nonexistent' } });
            const data = await response.json();

            expect(response.status).toBe(404);
            expect(data.success).toBe(false);
            expect(data.code).toBe('NOT_FOUND');
        });

        it('should return 403 when user does not own the session', async () => {
            const mockRepository = {
                getOpenHouseSession: jest.fn().mockResolvedValue({
                    ...mockSession,
                    userId: 'different-user'
                })
            };
            mockGetRepository.mockReturnValue(mockRepository as any);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.success).toBe(false);
            expect(data.code).toBe('FORBIDDEN');
        });
    });

    describe('Response Format', () => {
        beforeEach(() => {
            mockGetCurrentUserServer.mockResolvedValue({
                id: mockUserId,
                email: 'test@example.com',
                emailVerified: true,
                attributes: {}
            });
        });

        it('should return complete session data in JSON format', async () => {
            const mockRepository = {
                getOpenHouseSession: jest.fn().mockResolvedValue(mockSession),
                queryVisitorsBySession: jest.fn().mockResolvedValue({ items: mockVisitors })
            };
            mockGetRepository.mockReturnValue(mockRepository as any);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data.session).toBeDefined();
            expect(data.data.visitors).toBeDefined();
            expect(data.meta).toBeDefined();

            // Verify session data structure
            expect(data.data.session.sessionId).toBe(mockSessionId);
            expect(data.data.session.propertyAddress).toBe('123 Main St');
            expect(data.data.session.status).toBe(SessionStatus.ACTIVE);
            expect(data.data.session.visitorCount).toBe(2);

            // Verify visitors data
            expect(data.data.visitors).toHaveLength(2);
            expect(data.data.visitors[0].name).toBe('John Doe');
            expect(data.data.visitors[1].name).toBe('Jane Smith');

            // Verify metadata
            expect(data.meta.totalVisitors).toBe(2);
            expect(data.meta.requestedAt).toBeDefined();
        });

        it('should include proper headers', async () => {
            const mockRepository = {
                getOpenHouseSession: jest.fn().mockResolvedValue(mockSession),
                queryVisitorsBySession: jest.fn().mockResolvedValue({ items: mockVisitors })
            };
            mockGetRepository.mockReturnValue(mockRepository as any);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });

            expect(response.headers.get('Content-Type')).toBe('application/json');
            expect(response.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
            expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
        });

        it('should handle sessions with no visitors', async () => {
            const mockRepository = {
                getOpenHouseSession: jest.fn().mockResolvedValue(mockSession),
                queryVisitorsBySession: jest.fn().mockResolvedValue({ items: [] })
            };
            mockGetRepository.mockReturnValue(mockRepository as any);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.visitors).toHaveLength(0);
            expect(data.meta.totalVisitors).toBe(0);
        });
    });

    describe('Rate Limiting', () => {
        beforeEach(() => {
            mockGetCurrentUserServer.mockResolvedValue({
                id: mockUserId,
                email: 'test@example.com',
                emailVerified: true,
                attributes: {}
            });

            const mockRepository = {
                getOpenHouseSession: jest.fn().mockResolvedValue(mockSession),
                queryVisitorsBySession: jest.fn().mockResolvedValue({ items: mockVisitors })
            };
            mockGetRepository.mockReturnValue(mockRepository as any);
        });

        it('should allow requests within rate limit', async () => {
            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });

            expect(response.status).toBe(200);
            expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
        });

        it('should return 429 when rate limit is exceeded', async () => {
            // Make 100 requests to hit the limit
            for (let i = 0; i < 100; i++) {
                const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
                await GET(request, { params: { sessionId: mockSessionId } });
            }

            // 101st request should be rate limited
            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });
            const data = await response.json();

            expect(response.status).toBe(429);
            expect(data.success).toBe(false);
            expect(data.code).toBe('RATE_LIMIT_EXCEEDED');
            expect(data.retryAfter).toBeDefined();
            expect(response.headers.get('Retry-After')).toBeDefined();
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
        });

        it('should include rate limit headers in response', async () => {
            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });

            expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
            expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            mockGetCurrentUserServer.mockResolvedValue({
                id: mockUserId,
                email: 'test@example.com',
                emailVerified: true,
                attributes: {}
            });
        });

        it('should return 500 when database error occurs', async () => {
            const mockRepository = {
                getOpenHouseSession: jest.fn().mockRejectedValue(new Error('Database error'))
            };
            mockGetRepository.mockReturnValue(mockRepository as any);

            const request = new NextRequest('http://localhost:3000/api/open-house/sessions/session-456');
            const response = await GET(request, { params: { sessionId: mockSessionId } });
            const data = await response.json();

            expect(response.status).toBe(500);
            expect(data.success).toBe(false);
            expect(data.code).toBe('INTERNAL_ERROR');
            expect(data.error).toBe('Failed to fetch session data');
        });
    });
});
