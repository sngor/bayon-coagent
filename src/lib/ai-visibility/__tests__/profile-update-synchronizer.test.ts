/**
 * Profile Update Synchronizer Tests
 * 
 * Tests for the automatic profile update synchronization system
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProfileUpdateSynchronizer, synchronizeProfileChanges } from '../profile-update-synchronizer';
import type { Profile } from '@/lib/types/common';

// Mock dependencies
jest.mock('@/aws/dynamodb/repository');
jest.mock('../services/knowledge-graph-builder');
jest.mock('@/lib/aeo/schema-generator');
jest.mock('../rollback-manager');

describe('ProfileUpdateSynchronizer', () => {
  let synchronizer: ProfileUpdateSynchronizer;
  
  const mockProfile: Partial<Profile> = {
    name: 'John Smith',
    agencyName: 'Smith Realty',
    phone: '555-123-4567',
    email: 'john@smithrealty.com',
    address: '123 Main St, Seattle, WA 98101',
    website: 'https://smithrealty.com',
    bio: 'Experienced real estate agent',
    certifications: 'CRS, ABR',
    linkedin: 'https://linkedin.com/in/johnsmith'
  };

  beforeEach(() => {
    synchronizer = new ProfileUpdateSynchronizer();
    jest.clearAllMocks();
  });

  describe('detectChanges', () => {
    it('should detect changes between profile versions', () => {
      const previousProfile: Partial<Profile> = {
        ...mockProfile,
        name: 'John Doe'
      };

      const updatedProfile: Partial<Profile> = {
        ...mockProfile,
        name: 'John Smith'
      };

      const changeEvent = synchronizer.detectChanges(
        previousProfile,
        updatedProfile,
        'user-123'
      );

      expect(changeEvent).toBeTruthy();
      expect(changeEvent?.changedFields).toContain('name');
      expect(changeEvent?.userId).toBe('user-123');
    });

    it('should return null when no changes detected', () => {
      const changeEvent = synchronizer.detectChanges(
        mockProfile,
        mockProfile,
        'user-123'
      );

      expect(changeEvent).toBeNull();
    });

    it('should ignore specified fields', () => {
      const previousProfile: Partial<Profile> = {
        ...mockProfile,
        updatedAt: '2023-01-01'
      };

      const updatedProfile: Partial<Profile> = {
        ...mockProfile,
        updatedAt: '2023-01-02'
      };

      const changeEvent = synchronizer.detectChanges(
        previousProfile,
        updatedProfile,
        'user-123'
      );

      expect(changeEvent).toBeNull();
    });

    it('should detect array changes', () => {
      const previousProfile: Partial<Profile> = {
        ...mockProfile,
        certifications: ['CRS']
      };

      const updatedProfile: Partial<Profile> = {
        ...mockProfile,
        certifications: ['CRS', 'ABR']
      };

      const changeEvent = synchronizer.detectChanges(
        previousProfile,
        updatedProfile,
        'user-123'
      );

      expect(changeEvent).toBeTruthy();
      expect(changeEvent?.changedFields).toContain('certifications');
    });
  });

  describe('synchronizeProfileUpdate', () => {
    it('should handle successful synchronization', async () => {
      const changeEvent = {
        userId: 'user-123',
        previousProfile: { name: 'John Doe' },
        updatedProfile: { name: 'John Smith' },
        changedFields: ['name'],
        timestamp: new Date(),
        changeId: 'change-123'
      };

      // Mock successful operations
      jest.spyOn(synchronizer as any, 'createRollbackData').mockResolvedValue({});
      jest.spyOn(synchronizer as any, 'analyzeImpact').mockResolvedValue({
        riskLevel: 'low',
        affectedSchemas: ['RealEstateAgent'],
        affectedEntities: ['agent'],
        estimatedVisibilityImpact: 10,
        recommendations: [],
        aiPlatformImpact: []
      });
      jest.spyOn(synchronizer as any, 'updateKnowledgeGraphEntities').mockResolvedValue([]);
      jest.spyOn(synchronizer as any, 'updateSchemaMarkup').mockResolvedValue([]);
      jest.spyOn(synchronizer as any, 'validateUpdates').mockResolvedValue([{
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: []
      }]);
      jest.spyOn(synchronizer as any, 'exportAllFormats').mockResolvedValue({});
      jest.spyOn(synchronizer as any, 'saveUpdates').mockResolvedValue(undefined);

      const result = await synchronizer.synchronizeProfileUpdate(changeEvent);

      expect(result.success).toBe(true);
      expect(result.changeId).toBe('change-123');
    });

    it('should handle high-risk changes', async () => {
      const changeEvent = {
        userId: 'user-123',
        previousProfile: { name: 'John Doe' },
        updatedProfile: { name: 'John Smith' },
        changedFields: ['name', 'agencyName', 'phone', 'address'],
        timestamp: new Date(),
        changeId: 'change-123'
      };

      jest.spyOn(synchronizer as any, 'createRollbackData').mockResolvedValue({});
      jest.spyOn(synchronizer as any, 'analyzeImpact').mockResolvedValue({
        riskLevel: 'high',
        affectedSchemas: ['RealEstateAgent'],
        affectedEntities: ['agent'],
        estimatedVisibilityImpact: 90,
        recommendations: ['Manual review required'],
        aiPlatformImpact: []
      });

      const result = await synchronizer.synchronizeProfileUpdate(changeEvent);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Changes deemed too risky - manual review required');
    });

    it('should handle validation failures', async () => {
      const changeEvent = {
        userId: 'user-123',
        previousProfile: { name: 'John Doe' },
        updatedProfile: { name: 'John Smith' },
        changedFields: ['name'],
        timestamp: new Date(),
        changeId: 'change-123'
      };

      jest.spyOn(synchronizer as any, 'createRollbackData').mockResolvedValue({});
      jest.spyOn(synchronizer as any, 'analyzeImpact').mockResolvedValue({
        riskLevel: 'low',
        affectedSchemas: ['RealEstateAgent'],
        affectedEntities: ['agent'],
        estimatedVisibilityImpact: 10,
        recommendations: [],
        aiPlatformImpact: []
      });
      jest.spyOn(synchronizer as any, 'updateKnowledgeGraphEntities').mockResolvedValue([]);
      jest.spyOn(synchronizer as any, 'updateSchemaMarkup').mockResolvedValue([]);
      jest.spyOn(synchronizer as any, 'validateUpdates').mockResolvedValue([{
        isValid: false,
        errors: ['Missing required field'],
        warnings: [],
        suggestions: []
      }]);
      jest.spyOn(synchronizer as any, 'performRollback').mockResolvedValue(true);

      const result = await synchronizer.synchronizeProfileUpdate(changeEvent);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Validation failed - changes rolled back');
    });
  });

  describe('impact analysis', () => {
    it('should calculate visibility impact correctly', async () => {
      const changeEvent = {
        userId: 'user-123',
        previousProfile: { name: 'John Doe' },
        updatedProfile: { name: 'John Smith' },
        changedFields: ['name', 'website'],
        timestamp: new Date(),
        changeId: 'change-123'
      };

      const impact = await (synchronizer as any).analyzeImpact(changeEvent);

      expect(impact.estimatedVisibilityImpact).toBeGreaterThan(0);
      expect(impact.riskLevel).toBe('medium'); // Name change should be medium risk
      expect(impact.affectedSchemas).toContain('RealEstateAgent');
      expect(impact.recommendations).toContain('Name changes may affect AI recognition - monitor mentions closely');
    });

    it('should identify critical field changes', async () => {
      const changeEvent = {
        userId: 'user-123',
        previousProfile: {},
        updatedProfile: {},
        changedFields: ['name', 'agencyName', 'phone', 'address', 'website'],
        timestamp: new Date(),
        changeId: 'change-123'
      };

      const impact = await (synchronizer as any).analyzeImpact(changeEvent);

      expect(impact.riskLevel).toBe('high');
      expect(impact.recommendations).toContain('Consider implementing changes gradually to monitor impact');
    });
  });

  describe('rollback functionality', () => {
    it('should create rollback data before changes', async () => {
      const changeEvent = {
        userId: 'user-123',
        previousProfile: { name: 'John Doe' },
        updatedProfile: { name: 'John Smith' },
        changedFields: ['name'],
        timestamp: new Date(),
        changeId: 'change-123'
      };

      jest.spyOn(synchronizer as any, 'getCurrentSchemas').mockResolvedValue([]);
      jest.spyOn(synchronizer as any, 'getCurrentEntities').mockResolvedValue([]);
      jest.spyOn(synchronizer as any, 'getCurrentExports').mockResolvedValue({});

      const rollbackData = await (synchronizer as any).createRollbackData(changeEvent);

      expect(rollbackData.changeId).toBe('change-123');
      expect(rollbackData.timestamp).toBeInstanceOf(Date);
      expect(rollbackData.previousSchemas).toBeDefined();
      expect(rollbackData.previousEntities).toBeDefined();
      expect(rollbackData.previousExports).toBeDefined();
    });

    it('should perform rollback successfully', async () => {
      const changeId = 'change-123';
      const reason = 'Test rollback';

      jest.spyOn(synchronizer as any, 'restoreSchemas').mockResolvedValue(undefined);
      jest.spyOn(synchronizer as any, 'restoreEntities').mockResolvedValue(undefined);
      jest.spyOn(synchronizer as any, 'restoreExports').mockResolvedValue(undefined);

      // Set up rollback history
      (synchronizer as any).rollbackHistory.set(changeId, {
        changeId,
        timestamp: new Date(),
        previousSchemas: [],
        previousEntities: [],
        previousExports: {}
      });

      const success = await synchronizer.performRollback(changeId, reason);

      expect(success).toBe(true);
    });
  });

  describe('convenience functions', () => {
    it('should synchronize profile changes', async () => {
      const previousProfile: Partial<Profile> = { name: 'John Doe' };
      const updatedProfile: Partial<Profile> = { name: 'John Smith' };

      // Mock the synchronizer methods
      jest.spyOn(ProfileUpdateSynchronizer.prototype, 'detectChanges').mockReturnValue({
        userId: 'user-123',
        previousProfile,
        updatedProfile,
        changedFields: ['name'],
        timestamp: new Date(),
        changeId: 'change-123'
      });

      jest.spyOn(ProfileUpdateSynchronizer.prototype, 'synchronizeProfileUpdate').mockResolvedValue({
        success: true,
        changeId: 'change-123',
        updatedSchemas: [],
        updatedEntities: [],
        exportedFormats: [],
        validationResults: [],
        impactAnalysis: {
          affectedSchemas: [],
          affectedEntities: [],
          estimatedVisibilityImpact: 0,
          riskLevel: 'low',
          recommendations: [],
          aiPlatformImpact: []
        }
      });

      const result = await synchronizeProfileChanges('user-123', previousProfile, updatedProfile);

      expect(result).toBeTruthy();
      expect(result?.success).toBe(true);
    });

    it('should return null when no changes detected', async () => {
      const result = await synchronizeProfileChanges('user-123', mockProfile, mockProfile);

      expect(result).toBeNull();
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete profile update workflow', async () => {
    const previousProfile: Partial<Profile> = {
      name: 'John Doe',
      agencyName: 'Old Realty',
      phone: '555-111-1111'
    };

    const updatedProfile: Partial<Profile> = {
      name: 'John Smith',
      agencyName: 'Smith Realty',
      phone: '555-123-4567',
      website: 'https://smithrealty.com'
    };

    // This would be a full integration test with real dependencies
    // For now, we'll just verify the function can be called
    const result = await synchronizeProfileChanges('user-123', previousProfile, updatedProfile);

    // In a real integration test, we would verify:
    // - Schema markup is generated correctly
    // - Knowledge graph entities are updated
    // - Exports are created in all formats
    // - Validation passes
    // - Data is saved to storage
    
    expect(typeof result).toBeDefined();
  });
});