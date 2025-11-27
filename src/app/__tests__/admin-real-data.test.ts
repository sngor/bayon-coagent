import {
    getAdminDashboardStats,
    getOrganizationSettingsAction,
    updateOrganizationSettingsAction,
    getRecentActivityAction
} from '../admin-actions';

// Mock dependencies
jest.mock('@/aws/auth/server-auth', () => ({
    getCurrentUserServer: jest.fn().mockResolvedValue({ id: 'test-user-id' })
}));

jest.mock('@/app/actions', () => ({
    checkAdminStatusAction: jest.fn().mockResolvedValue({ isAdmin: true, role: 'super_admin' })
}));

jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: jest.fn().mockReturnValue({
        scan: jest.fn().mockResolvedValue({ count: 10, items: [] }),
        query: jest.fn().mockResolvedValue({ count: 5, items: [] }),
        get: jest.fn().mockImplementation((pk, sk) => {
            if (sk === 'PROFILE') return { organizationId: 'org-123' };
            if (pk.startsWith('ORG#')) return {
                name: 'Test Org',
                description: 'Test Desc',
                settings: { allowMemberInvites: true }
            };
            return null;
        }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({})
    }),
    getProfileKeys: jest.fn().mockReturnValue({ PK: 'USER#test-user-id', SK: 'PROFILE' }),
    getOrganizationKeys: jest.fn().mockReturnValue({ PK: 'ORG#org-123', SK: 'METADATA' })
}));

describe('Admin Actions (Real Data)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAdminDashboardStats', () => {
        it('should return stats from repository', async () => {
            const result = await getAdminDashboardStats();
            expect(result.message).toBe('success');
            expect(result.data.totalUsers).toBe(10);
            expect(result.data.totalFeedback).toBe(5);
        });
    });

    describe('getOrganizationSettingsAction', () => {
        it('should return organization settings', async () => {
            const result = await getOrganizationSettingsAction();
            expect(result.message).toBe('success');
            expect(result.data.name).toBe('Test Org');
        });
    });

    describe('updateOrganizationSettingsAction', () => {
        it('should update settings', async () => {
            const result = await updateOrganizationSettingsAction({
                name: 'New Name',
                description: 'New Desc',
                website: 'https://new.com',
                allowMemberInvites: false,
                requireApproval: true
            });
            expect(result.message).toBe('success');
        });
    });

    describe('getRecentActivityAction', () => {
        it('should return recent activity', async () => {
            const result = await getRecentActivityAction();
            expect(result.message).toBe('success');
            expect(Array.isArray(result.data)).toBe(true);
        });
    });
});
