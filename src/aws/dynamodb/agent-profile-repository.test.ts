/**
 * Agent Profile Repository Tests
 * 
 * Tests for the AgentProfileRepository class
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AgentProfileRepository, AgentProfile, CreateAgentProfileInput } from './agent-profile-repository';
import { DynamoDBRepository } from './repository';

// Mock the repository
jest.mock('./repository');

describe('AgentProfileRepository', () => {
  let repository: AgentProfileRepository;
  let mockDynamoDBRepo: any;

  const validProfile: CreateAgentProfileInput = {
    agentName: 'Jane Smith',
    primaryMarket: 'Austin, TX',
    specialization: 'luxury',
    preferredTone: 'warm-consultative',
    corePrinciple: 'Maximize client ROI with data-first strategies'
  };

  beforeEach(() => {
    // Create mock DynamoDB repository
    mockDynamoDBRepo = {
      get: jest.fn<any>(),
      create: jest.fn<any>(),
      update: jest.fn<any>(),
      delete: jest.fn<any>(),
    };

    // Create repository instance with mock
    repository = new AgentProfileRepository(mockDynamoDBRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
    repository.clearCache();
    repository.clearPerformanceMetrics();
  });

  describe('createProfile', () => {
    it('should create a valid agent profile', async () => {
      mockDynamoDBRepo.get.mockResolvedValue(null); // No existing profile

      const result = await repository.createProfile('user123', validProfile);

      expect(result).toMatchObject({
        userId: 'user123',
        agentName: 'Jane Smith',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury',
        preferredTone: 'warm-consultative',
        corePrinciple: 'Maximize client ROI with data-first strategies'
      });
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(mockDynamoDBRepo.create).toHaveBeenCalled();
    });

    it('should reject profile with missing required fields', async () => {
      const invalidProfile = {
        agentName: 'Jane Smith',
        // Missing other required fields
      } as CreateAgentProfileInput;

      await expect(
        repository.createProfile('user123', invalidProfile)
      ).rejects.toThrow('Validation failed');
    });

    it('should reject profile with empty agent name', async () => {
      const invalidProfile = {
        ...validProfile,
        agentName: ''
      };

      await expect(
        repository.createProfile('user123', invalidProfile)
      ).rejects.toThrow('Agent name is required');
    });

    it('should reject profile with invalid specialization', async () => {
      const invalidProfile = {
        ...validProfile,
        specialization: 'invalid' as any
      };

      await expect(
        repository.createProfile('user123', invalidProfile)
      ).rejects.toThrow('Specialization must be one of');
    });

    it('should reject profile with short core principle', async () => {
      const invalidProfile = {
        ...validProfile,
        corePrinciple: 'Too short'
      };

      await expect(
        repository.createProfile('user123', invalidProfile)
      ).rejects.toThrow('Core principle must be at least 10 characters');
    });

    it('should reject if profile already exists', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      await expect(
        repository.createProfile('user123', validProfile)
      ).rejects.toThrow('Agent profile already exists');
    });

    it('should record performance metrics', async () => {
      mockDynamoDBRepo.get.mockResolvedValue(null);

      await repository.createProfile('user123', validProfile);

      const metrics = repository.getPerformanceMetrics('create');
      expect(metrics.length).toBe(1);
      expect(metrics[0].operation).toBe('create');
      expect(metrics[0].duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getProfile', () => {
    it('should retrieve an existing profile', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      const result = await repository.getProfile('user123');

      expect(result).toEqual(existingProfile);
      expect(mockDynamoDBRepo.get).toHaveBeenCalled();
    });

    it('should return null for non-existent profile', async () => {
      mockDynamoDBRepo.get.mockResolvedValue(null);

      const result = await repository.getProfile('user123');

      expect(result).toBeNull();
    });

    it('should use cache on second retrieval', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      // First call - should hit database
      await repository.getProfile('user123');
      expect(mockDynamoDBRepo.get).toHaveBeenCalledTimes(1);

      // Second call - should hit cache
      await repository.getProfile('user123');
      expect(mockDynamoDBRepo.get).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should record cache hit in metrics', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      // First call - cache miss
      await repository.getProfile('user123');
      
      // Second call - cache hit
      await repository.getProfile('user123');

      const metrics = repository.getPerformanceMetrics('get');
      expect(metrics.length).toBe(2);
      expect(metrics[0].cacheHit).toBe(false);
      expect(metrics[1].cacheHit).toBe(true);
    });

    it('should meet performance requirement (< 500ms)', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      await repository.getProfile('user123');

      const stats = repository.getPerformanceStats('get');
      expect(stats).not.toBeNull();
      expect(stats!.avgDuration).toBeLessThan(500);
    });
  });

  describe('updateProfile', () => {
    it('should update an existing profile', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      await repository.updateProfile('user123', {
        agentName: 'Jane Doe'
      });

      expect(mockDynamoDBRepo.update).toHaveBeenCalled();
    });

    it('should reject update for non-existent profile', async () => {
      mockDynamoDBRepo.get.mockResolvedValue(null);

      await expect(
        repository.updateProfile('user123', { agentName: 'Jane Doe' })
      ).rejects.toThrow('Agent profile not found');
    });

    it('should validate update data', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      await expect(
        repository.updateProfile('user123', { agentName: '' })
      ).rejects.toThrow('Agent name is required');
    });

    it('should invalidate cache after update', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      // First get to populate cache
      await repository.getProfile('user123');
      expect(mockDynamoDBRepo.get).toHaveBeenCalledTimes(1);

      // Update should invalidate cache
      await repository.updateProfile('user123', { agentName: 'Jane Doe' });

      // Next get should hit database again
      await repository.getProfile('user123');
      expect(mockDynamoDBRepo.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile', async () => {
      await repository.deleteProfile('user123');

      expect(mockDynamoDBRepo.delete).toHaveBeenCalled();
    });

    it('should invalidate cache after delete', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      // First get to populate cache
      await repository.getProfile('user123');
      
      // Delete should invalidate cache
      await repository.deleteProfile('user123');

      // Next get should hit database again
      mockDynamoDBRepo.get.mockResolvedValue(null);
      const result = await repository.getProfile('user123');
      expect(result).toBeNull();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics for all operations', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(null);
      await repository.createProfile('user123', validProfile);

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);
      await repository.getProfile('user123');
      await repository.updateProfile('user123', { agentName: 'Jane Doe' });
      await repository.deleteProfile('user123');

      const allMetrics = repository.getPerformanceMetrics();
      expect(allMetrics.length).toBeGreaterThan(0);

      const createMetrics = repository.getPerformanceMetrics('create');
      expect(createMetrics.length).toBe(1);

      const getMetrics = repository.getPerformanceMetrics('get');
      expect(getMetrics.length).toBeGreaterThan(0);

      const updateMetrics = repository.getPerformanceMetrics('update');
      expect(updateMetrics.length).toBe(1);

      const deleteMetrics = repository.getPerformanceMetrics('delete');
      expect(deleteMetrics.length).toBe(1);
    });

    it('should calculate performance statistics correctly', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      // Perform multiple gets
      for (let i = 0; i < 10; i++) {
        await repository.getProfile('user123');
      }

      const stats = repository.getPerformanceStats('get');
      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(10);
      expect(stats!.avgDuration).toBeGreaterThanOrEqual(0);
      expect(stats!.minDuration).toBeLessThanOrEqual(stats!.maxDuration);
      expect(stats!.p95Duration).toBeGreaterThanOrEqual(0);
      expect(stats!.cacheHitRate).toBeGreaterThan(0); // Should have cache hits
    });

    it('should return null stats when no metrics exist', () => {
      const stats = repository.getPerformanceStats('get');
      expect(stats).toBeNull();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', async () => {
      const existingProfile: AgentProfile = {
        userId: 'user123',
        ...validProfile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockDynamoDBRepo.get.mockResolvedValue(existingProfile);

      // Populate cache
      await repository.getProfile('user123');
      expect(mockDynamoDBRepo.get).toHaveBeenCalledTimes(1);

      // Clear cache
      repository.clearCache();

      // Next get should hit database
      await repository.getProfile('user123');
      expect(mockDynamoDBRepo.get).toHaveBeenCalledTimes(2);
    });
  });
});
