/**
 * Document Management Service Tests
 * 
 * Tests for client dashboard document management functionality
 * Requirements: 6.1, 6.2, 6.3, 10.4
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Mock AWS services before importing
const mockGetCurrentUser = jest.fn();
const mockGetRepository = jest.fn();
const mockUploadFile = jest.fn();
const mockGetPresignedUrl = jest.fn();
const mockSendEmail = jest.fn();

jest.unstable_mockModule('@/aws/auth/cognito-client', () => ({
    getCurrentUser: mockGetCurrentUser,
}));

jest.unstable_mockModule('@/aws/dynamodb/repository', () => ({
    getRepository: mockGetRepository,
}));

jest.unstable_mockModule('@/aws/s3/client', () => ({
    uploadFile: mockUploadFile,
    getPresignedUrl: mockGetPresignedUrl,
    deleteFile: jest.fn(),
}));

jest.unstable_mockModule('@/aws/ses/client', () => ({
    sendEmail: mockSendEmail,
}));

const {
    uploadDocumentToDashboard,
    removeDocumentFromDashboard,
    listDashboardDocuments,
    getDocumentDownloadUrl,
    logDocumentDownload,
} = await import('@/features/client-dashboards/actions/client-dashboard-actions');

describe('Document Management Service', () => {
    const mockUser = { id: 'agent-123', email: 'agent@example.com' };
    const mockDashboard = {
        id: 'dashboard-123',
        agentId: 'agent-123',
        clientInfo: {
            name: 'John Doe',
            email: 'john@example.com',
        },
        dashboardConfig: {
            enableCMA: true,
            enablePropertySearch: true,
            enableHomeValuation: true,
            enableDocuments: true,
        },
        branding: {
            primaryColor: '#3b82f6',
            welcomeMessage: 'Welcome!',
            agentContact: {
                phone: '555-0100',
                email: 'agent@example.com',
            },
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetCurrentUser.mockResolvedValue(mockUser);
        mockSendEmail.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('uploadDocumentToDashboard', () => {
        it('should upload a valid PDF document', async () => {
            const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
            Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB
            // Mock arrayBuffer method
            mockFile.arrayBuffer = jest.fn().mockResolvedValue(new ArrayBuffer(1024 * 1024));

            const mockRepository = {
                get: jest.fn().mockResolvedValue(mockDashboard),
                create: jest.fn().mockResolvedValue(undefined),
            };
            mockGetRepository.mockReturnValue(mockRepository);
            mockUploadFile.mockResolvedValue('https://s3.amazonaws.com/bucket/file.pdf');

            const result = await uploadDocumentToDashboard('dashboard-123', mockFile);

            expect(result.message).toBe('success');
            expect(result.data).toBeTruthy();
            expect(result.data?.fileName).toBe('test.pdf');
            expect(result.data?.contentType).toBe('application/pdf');
            expect(mockUploadFile).toHaveBeenCalled();
        });

        it('should reject files larger than 25MB', async () => {
            const mockFile = new File(['test content'], 'large.pdf', { type: 'application/pdf' });
            Object.defineProperty(mockFile, 'size', { value: 26 * 1024 * 1024 }); // 26MB

            const mockRepository = {
                get: jest.fn().mockResolvedValue(mockDashboard),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await uploadDocumentToDashboard('dashboard-123', mockFile);

            expect(result.message).toBe('Validation failed');
            expect(result.data).toBeNull();
            expect(result.errors).toBeTruthy();
        });

        it('should reject invalid file types', async () => {
            const mockFile = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
            Object.defineProperty(mockFile, 'size', { value: 1024 }); // 1KB

            const mockRepository = {
                get: jest.fn().mockResolvedValue(mockDashboard),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await uploadDocumentToDashboard('dashboard-123', mockFile);

            expect(result.message).toBe('Validation failed');
            expect(result.data).toBeNull();
            expect(result.errors).toBeTruthy();
        });
    });

    describe('removeDocumentFromDashboard', () => {
        it('should soft delete a document', async () => {
            const mockDocument = {
                id: 'doc-123',
                agentId: 'agent-123',
                dashboardId: 'dashboard-123',
                fileName: 'test.pdf',
                fileSize: 1024,
                contentType: 'application/pdf',
                s3Key: 'agents/agent-123/dashboards/dashboard-123/documents/doc-123.pdf',
                uploadedAt: Date.now(),
            };

            const mockRepository = {
                get: jest.fn().mockResolvedValue(mockDocument),
                update: jest.fn().mockResolvedValue(undefined),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await removeDocumentFromDashboard('doc-123');

            expect(result.message).toBe('success');
            expect(result.data?.success).toBe(true);
            expect(mockRepository.update).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                expect.objectContaining({ deletedAt: expect.any(Number) })
            );
        });

        it('should reject removal of non-existent document', async () => {
            const mockRepository = {
                get: jest.fn().mockResolvedValue(null),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await removeDocumentFromDashboard('doc-999');

            expect(result.message).toBe('Document not found');
            expect(result.data).toBeNull();
        });
    });

    describe('listDashboardDocuments', () => {
        it('should list all active documents for a dashboard', async () => {
            const mockDocuments = [
                {
                    id: 'doc-1',
                    agentId: 'agent-123',
                    dashboardId: 'dashboard-123',
                    fileName: 'test1.pdf',
                    fileSize: 1024,
                    contentType: 'application/pdf',
                    s3Key: 'agents/agent-123/dashboards/dashboard-123/documents/doc-1.pdf',
                    uploadedAt: Date.now(),
                },
                {
                    id: 'doc-2',
                    agentId: 'agent-123',
                    dashboardId: 'dashboard-123',
                    fileName: 'test2.docx',
                    fileSize: 2048,
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    s3Key: 'agents/agent-123/dashboards/dashboard-123/documents/doc-2.docx',
                    uploadedAt: Date.now(),
                },
            ];

            const mockRepository = {
                get: jest.fn().mockResolvedValue(mockDashboard),
                query: jest.fn().mockResolvedValue({ items: mockDocuments }),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await listDashboardDocuments('dashboard-123');

            expect(result.message).toBe('success');
            expect(result.data).toHaveLength(2);
            expect(result.data?.[0].fileName).toBe('test1.pdf');
            expect(result.data?.[1].fileName).toBe('test2.docx');
        });

        it('should filter out soft-deleted documents', async () => {
            const mockDocuments = [
                {
                    id: 'doc-1',
                    agentId: 'agent-123',
                    dashboardId: 'dashboard-123',
                    fileName: 'test1.pdf',
                    fileSize: 1024,
                    contentType: 'application/pdf',
                    s3Key: 'agents/agent-123/dashboards/dashboard-123/documents/doc-1.pdf',
                    uploadedAt: Date.now(),
                },
                {
                    id: 'doc-2',
                    agentId: 'agent-123',
                    dashboardId: 'dashboard-123',
                    fileName: 'test2.docx',
                    fileSize: 2048,
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    s3Key: 'agents/agent-123/dashboards/dashboard-123/documents/doc-2.docx',
                    uploadedAt: Date.now(),
                    deletedAt: Date.now(), // This one is soft-deleted
                },
            ];

            const mockRepository = {
                get: jest.fn().mockResolvedValue(mockDashboard),
                query: jest.fn().mockResolvedValue({ items: mockDocuments }),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await listDashboardDocuments('dashboard-123');

            expect(result.message).toBe('success');
            expect(result.data).toHaveLength(1);
            expect(result.data?.[0].fileName).toBe('test1.pdf');
        });
    });

    describe('getDocumentDownloadUrl', () => {
        it('should generate presigned URL with 1-hour expiration', async () => {
            const mockDocument = {
                id: 'doc-123',
                agentId: 'agent-123',
                dashboardId: 'dashboard-123',
                fileName: 'test.pdf',
                fileSize: 1024,
                contentType: 'application/pdf',
                s3Key: 'agents/agent-123/dashboards/dashboard-123/documents/doc-123.pdf',
                uploadedAt: Date.now(),
            };

            const mockLink = {
                token: 'test-token',
                dashboardId: 'dashboard-123',
                agentId: 'agent-123',
                expiresAt: Date.now() + 86400000,
                accessCount: 0,
                createdAt: Date.now(),
                revoked: false,
            };

            const mockRepository = {
                get: jest.fn()
                    .mockResolvedValueOnce(mockLink) // First call for link validation
                    .mockResolvedValueOnce(mockDashboard) // Second call for dashboard
                    .mockResolvedValueOnce(mockDocument), // Third call for document
                update: jest.fn().mockResolvedValue(undefined),
                create: jest.fn().mockResolvedValue(undefined),
            };
            mockGetRepository.mockReturnValue(mockRepository);
            mockGetPresignedUrl.mockResolvedValue('https://s3.amazonaws.com/presigned-url');

            const result = await getDocumentDownloadUrl('test-token', 'doc-123');

            expect(result.message).toBe('success');
            expect(result.data?.url).toBe('https://s3.amazonaws.com/presigned-url');
            expect(result.data?.fileName).toBe('test.pdf');
            expect(mockGetPresignedUrl).toHaveBeenCalledWith(mockDocument.s3Key, 3600); // 1 hour = 3600 seconds
        });

        it('should reject access to documents from different dashboard', async () => {
            const mockDocument = {
                id: 'doc-123',
                agentId: 'agent-123',
                dashboardId: 'dashboard-456', // Different dashboard
                fileName: 'test.pdf',
                fileSize: 1024,
                contentType: 'application/pdf',
                s3Key: 'agents/agent-123/dashboards/dashboard-456/documents/doc-123.pdf',
                uploadedAt: Date.now(),
            };

            const mockLink = {
                token: 'test-token',
                dashboardId: 'dashboard-123',
                agentId: 'agent-123',
                expiresAt: Date.now() + 86400000,
                accessCount: 0,
                createdAt: Date.now(),
                revoked: false,
            };

            const mockRepository = {
                get: jest.fn()
                    .mockResolvedValueOnce(mockLink)
                    .mockResolvedValueOnce(mockDashboard)
                    .mockResolvedValueOnce(mockDocument),
                update: jest.fn().mockResolvedValue(undefined),
                create: jest.fn().mockResolvedValue(undefined),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await getDocumentDownloadUrl('test-token', 'doc-123');

            expect(result.message).toBe('Unauthorized');
            expect(result.data).toBeNull();
        });
    });

    describe('logDocumentDownload', () => {
        it('should log download event', async () => {
            const mockDocument = {
                id: 'doc-123',
                agentId: 'agent-123',
                dashboardId: 'dashboard-123',
                fileName: 'test.pdf',
                fileSize: 1024,
                contentType: 'application/pdf',
                s3Key: 'agents/agent-123/dashboards/dashboard-123/documents/doc-123.pdf',
                uploadedAt: Date.now(),
            };

            const mockLink = {
                token: 'test-token',
                dashboardId: 'dashboard-123',
                agentId: 'agent-123',
                expiresAt: Date.now() + 86400000,
                accessCount: 0,
                createdAt: Date.now(),
                revoked: false,
            };

            const mockRepository = {
                get: jest.fn()
                    .mockResolvedValueOnce(mockLink)
                    .mockResolvedValueOnce(mockDashboard)
                    .mockResolvedValueOnce(mockDocument),
                update: jest.fn().mockResolvedValue(undefined),
                create: jest.fn().mockResolvedValue(undefined),
            };
            mockGetRepository.mockReturnValue(mockRepository);

            const result = await logDocumentDownload('test-token', 'doc-123');

            expect(result.message).toBe('success');
            expect(result.data?.success).toBe(true);
            // Verify that create was called for logging (2 times: download log + analytics)
            expect(mockRepository.create).toHaveBeenCalledTimes(3); // Link validation creates one, then 2 for logging
        });
    });
});
