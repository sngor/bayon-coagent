/**
 * Profile Update Synchronizer Unit Tests
 * 
 * Simple unit tests for the profile synchronization system
 */

import { ProfileUpdateSynchronizer } from '../profile-update-synchronizer';
import type { Profile } from '@/lib/types/common';

describe('ProfileUpdateSynchronizer Unit Tests', () => {
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
  });

  test('should detect changes between profile versions', () => {
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
    expect(changeEvent?.changeId).toBeTruthy();
  });

  test('should return null when no changes detected', () => {
    const changeEvent = synchronizer.detectChanges(
      mockProfile,
      mockProfile,
      'user-123'
    );

    expect(changeEvent).toBeNull();
  });

  test('should ignore specified fields', () => {
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

  test('should detect multiple field changes', () => {
    const previousProfile: Partial<Profile> = {
      name: 'John Doe',
      agencyName: 'Old Realty',
      phone: '555-111-1111'
    };

    const updatedProfile: Partial<Profile> = {
      name: 'John Smith',
      agencyName: 'Smith Realty',
      phone: '555-123-4567'
    };

    const changeEvent = synchronizer.detectChanges(
      previousProfile,
      updatedProfile,
      'user-123'
    );

    expect(changeEvent).toBeTruthy();
    expect(changeEvent?.changedFields).toHaveLength(3);
    expect(changeEvent?.changedFields).toContain('name');
    expect(changeEvent?.changedFields).toContain('agencyName');
    expect(changeEvent?.changedFields).toContain('phone');
  });

  test('should generate unique change IDs', () => {
    const changeEvent1 = synchronizer.detectChanges(
      { name: 'John' },
      { name: 'Jane' },
      'user-123'
    );

    const changeEvent2 = synchronizer.detectChanges(
      { name: 'Bob' },
      { name: 'Alice' },
      'user-123'
    );

    expect(changeEvent1?.changeId).toBeTruthy();
    expect(changeEvent2?.changeId).toBeTruthy();
    expect(changeEvent1?.changeId).not.toBe(changeEvent2?.changeId);
  });

  test('should handle array changes correctly', () => {
    const previousProfile: Partial<Profile> = {
      certifications: ['CRS']
    };

    const updatedProfile: Partial<Profile> = {
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

  test('should handle object changes correctly', () => {
    const previousProfile: Partial<Profile> = {
      socialMedia: { linkedin: 'old-url' }
    };

    const updatedProfile: Partial<Profile> = {
      socialMedia: { linkedin: 'new-url' }
    };

    const changeEvent = synchronizer.detectChanges(
      previousProfile,
      updatedProfile,
      'user-123'
    );

    expect(changeEvent).toBeTruthy();
    expect(changeEvent?.changedFields).toContain('socialMedia');
  });
});