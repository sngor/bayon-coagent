/**
 * Validation Script for Profile Update Synchronizer
 * 
 * Simple validation to ensure the implementation works correctly
 */

import { ProfileUpdateSynchronizer, synchronizeProfileChanges } from './profile-update-synchronizer';
import type { Profile } from '@/lib/types/common';

/**
 * Validates the profile update synchronizer implementation
 */
export async function validateProfileUpdateSynchronizer(): Promise<boolean> {
  console.log('🔍 Validating Profile Update Synchronizer...');

  try {
    // Test 1: Change Detection
    console.log('✅ Test 1: Change Detection');
    const synchronizer = new ProfileUpdateSynchronizer();
    
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

    const changeEvent = synchronizer.detectChanges(
      previousProfile,
      updatedProfile,
      'test-user-123'
    );

    if (!changeEvent) {
      console.error('❌ Change detection failed - no changes detected');
      return false;
    }

    if (changeEvent.changedFields.length !== 4) {
      console.error(`❌ Expected 4 changed fields, got ${changeEvent.changedFields.length}`);
      return false;
    }

    console.log(`✅ Detected ${changeEvent.changedFields.length} changed fields: ${changeEvent.changedFields.join(', ')}`);

    // Test 2: No Changes Detection
    console.log('✅ Test 2: No Changes Detection');
    const noChangeEvent = synchronizer.detectChanges(
      updatedProfile,
      updatedProfile,
      'test-user-123'
    );

    if (noChangeEvent !== null) {
      console.error('❌ No change detection failed - changes detected when none should exist');
      return false;
    }

    console.log('✅ Correctly detected no changes');

    // Test 3: Ignored Fields
    console.log('✅ Test 3: Ignored Fields');
    const profileWithIgnoredChanges: Partial<Profile> = {
      ...updatedProfile,
      updatedAt: '2023-01-02',
      lastSeen: '2023-01-02'
    };

    const ignoredChangeEvent = synchronizer.detectChanges(
      updatedProfile,
      profileWithIgnoredChanges,
      'test-user-123'
    );

    if (ignoredChangeEvent !== null) {
      console.error('❌ Ignored fields test failed - changes detected for ignored fields');
      return false;
    }

    console.log('✅ Correctly ignored updatedAt and lastSeen fields');

    // Test 4: Change ID Generation
    console.log('✅ Test 4: Change ID Generation');
    const changeEvent1 = synchronizer.detectChanges(
      { name: 'John' },
      { name: 'Jane' },
      'test-user-123'
    );

    const changeEvent2 = synchronizer.detectChanges(
      { name: 'Bob' },
      { name: 'Alice' },
      'test-user-123'
    );

    if (!changeEvent1?.changeId || !changeEvent2?.changeId) {
      console.error('❌ Change ID generation failed');
      return false;
    }

    if (changeEvent1.changeId === changeEvent2.changeId) {
      console.error('❌ Change IDs are not unique');
      return false;
    }

    console.log('✅ Change IDs are unique and properly generated');

    // Test 5: Array Changes
    console.log('✅ Test 5: Array Changes');
    const arrayChangeEvent = synchronizer.detectChanges(
      { certifications: ['CRS'] },
      { certifications: ['CRS', 'ABR'] },
      'test-user-123'
    );

    if (!arrayChangeEvent || !arrayChangeEvent.changedFields.includes('certifications')) {
      console.error('❌ Array change detection failed');
      return false;
    }

    console.log('✅ Array changes detected correctly');

    // Test 6: Convenience Function
    console.log('✅ Test 6: Convenience Function');
    
    // Mock the synchronization to avoid actual storage operations
    const originalSync = ProfileUpdateSynchronizer.prototype.synchronizeProfileUpdate;
    ProfileUpdateSynchronizer.prototype.synchronizeProfileUpdate = async () => ({
      success: true,
      changeId: 'mock-change-123',
      updatedSchemas: [],
      updatedEntities: [],
      exportedFormats: [],
      validationResults: [],
      impactAnalysis: {
        affectedSchemas: ['RealEstateAgent'],
        affectedEntities: ['agent'],
        estimatedVisibilityImpact: 10,
        riskLevel: 'low' as const,
        recommendations: [],
        aiPlatformImpact: []
      }
    });

    const syncResult = await synchronizeProfileChanges(
      'test-user-123',
      previousProfile,
      updatedProfile
    );

    // Restore original method
    ProfileUpdateSynchronizer.prototype.synchronizeProfileUpdate = originalSync;

    if (!syncResult || !syncResult.success) {
      console.error('❌ Convenience function test failed');
      return false;
    }

    console.log('✅ Convenience function works correctly');

    console.log('🎉 All validation tests passed!');
    return true;

  } catch (error) {
    console.error('❌ Validation failed with error:', error);
    return false;
  }
}

/**
 * Validates the rollback manager implementation
 */
export async function validateRollbackManager(): Promise<boolean> {
  console.log('🔍 Validating Rollback Manager...');

  try {
    const { rollbackManager } = await import('./rollback-manager');

    // Test rollback status
    const status = await rollbackManager.getRollbackStatus('test-user', 'test-change');
    
    if (!status || typeof status.rollbackAvailable !== 'boolean') {
      console.error('❌ Rollback status test failed');
      return false;
    }

    console.log('✅ Rollback status retrieval works');

    // Test rollback history
    const history = rollbackManager.getRollbackHistory('test-user');
    
    if (!Array.isArray(history)) {
      console.error('❌ Rollback history test failed');
      return false;
    }

    console.log('✅ Rollback history retrieval works');

    console.log('🎉 Rollback Manager validation passed!');
    return true;

  } catch (error) {
    console.error('❌ Rollback Manager validation failed:', error);
    return false;
  }
}

/**
 * Main validation function
 */
export async function runValidation(): Promise<void> {
  console.log('🚀 Starting Profile Update Synchronization Validation\n');

  const synchronizerValid = await validateProfileUpdateSynchronizer();
  const rollbackValid = await validateRollbackManager();

  console.log('\n📊 Validation Results:');
  console.log(`Profile Update Synchronizer: ${synchronizerValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Rollback Manager: ${rollbackValid ? '✅ PASS' : '❌ FAIL'}`);

  if (synchronizerValid && rollbackValid) {
    console.log('\n🎉 All validations passed! The implementation is working correctly.');
  } else {
    console.log('\n❌ Some validations failed. Please review the implementation.');
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  runValidation().catch(console.error);
}