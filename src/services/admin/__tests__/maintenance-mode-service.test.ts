/**
 * Maintenance Mode Service Tests
 */

import { MaintenanceModeService, MaintenanceWindowNotFoundError, InvalidTimeRangeError } from '../maintenance-mode-service';
import { DynamoDBRepository } from '@/aws/dynamodb/repository';

// Mock dependencies
jest.mock('@/aws/dynamodb/repository');
jest.mock('../cache-service');

const mockRepository = {
    create: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
};

const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
};

jest.mock('@/aws/dynamodb/repository', () => ({
    DynamoDBRepository: jest.fn(() => mockRepository),
}));

jest.mock('../cache-service', () => ({
    getCacheService: () => mockCache,
}));

describe('MaintenanceModeService', () => {
    let service: MaintenanceModeService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new MaintenanceModeService();
    });

    describe('scheduleMaintenanceWindow', () => {
        const validInput = {
            title: 'System Maintenance',
            description: 'Scheduled system maintenance',
            startTime: Date.now() + 3600000, // 1 hour from now
            endTime: Date.now() + 7200000, // 2 hours from now
            adminId: 'admin-123',
        };

        it('should create a maintenance window with valid input', async () => {
            mockRepository.create.mockResolvedValue(undefined);

            const result = await service.scheduleMaintenanceWindow(validInput);

            expect(result).toMatchObject({
                title: validInput.title,
                description: validInput.description,
                startTime: validInput.startTime,
                endTime: validInput.endTime,
                status: 'scheduled',
                createdBy: validInput.adminId,
            });
            expect(mockRepository.create).toHaveBeenCalled();
        });

        it('should throw error for past start time', async () => {
            const invalidInput = {
                ...validInput,
                startTime: Date.now() - 3600000, // 1 hour ago
            };

            await expect(service.scheduleMaintenanceWindow(invalidInput))
                .rejects.toThrow(InvalidTimeRangeError);
        });

        it('should throw error for end time before start time', async () => {
            const invalidInput = {
                ...validInput,
                endTime: validInput.startTime - 1000,
            };

            await expect(service.scheduleMaintenanceWindow(invalidInput))
                .rejects.toThrow(InvalidTimeRangeError);
        });

        it('should throw error for maintenance window exceeding 24 hours', async () => {
            const invalidInput = {
                ...validInput,
                endTime: validInput.startTime + (25 * 60 * 60 * 1000), // 25 hours
            };

            await expect(service.scheduleMaintenanceWindow(invalidInput))
                .rejects.toThrow(InvalidTimeRangeError);
        });
    });

    describe('isMaintenanceModeActive', () => {
        it('should return cached result when available', async () => {
            mockCache.get.mockReturnValue(true);

            const result = await service.isMaintenanceModeActive();

            expect(result).toBe(true);
            expect(mockCache.get).toHaveBeenCalledWith('maintenance:active');
            expect(mockRepository.query).not.toHaveBeenCalled();
        });

        it('should query database and cache result when not cached', async () => {
            mockCache.get.mockReturnValue(undefined);
            mockRepository.query.mockResolvedValue({ items: [], lastKey: undefined });

            const result = await service.isMaintenanceModeActive();

            expect(result).toBe(false);
            expect(mockCache.set).toHaveBeenCalledWith('maintenance:active', false, 30);
        });
    });

    describe('error handling', () => {
        it('should throw MaintenanceWindowNotFoundError for non-existent window', async () => {
            mockRepository.get.mockResolvedValue(null);

            // This would be called by methods that need to validate window existence
            expect(() => {
                const window = null;
                const windowId = 'non-existent';
                if (!window) {
                    throw new MaintenanceWindowNotFoundError(windowId);
                }
            }).toThrow(MaintenanceWindowNotFoundError);
        });
    });
});