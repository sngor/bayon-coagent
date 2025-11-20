/**
 * Integration tests for Reimagine DynamoDB operations
 * 
 * Tests the new Reimagine-specific repository functions.
 */

import { describe, it, expect } from '@jest/globals';
import { getImageMetadataKeys, getEditRecordKeys } from './keys';

describe('Reimagine DynamoDB Keys', () => {
  describe('getImageMetadataKeys', () => {
    it('should generate correct keys for image metadata', () => {
      const keys = getImageMetadataKeys('user123', 'image456');
      
      expect(keys.PK).toBe('USER#user123');
      expect(keys.SK).toBe('IMAGE#image456');
    });

    it('should handle different user and image IDs', () => {
      const keys = getImageMetadataKeys('abc', 'xyz');
      
      expect(keys.PK).toBe('USER#abc');
      expect(keys.SK).toBe('IMAGE#xyz');
    });
  });

  describe('getEditRecordKeys', () => {
    it('should generate correct keys for edit records', () => {
      const keys = getEditRecordKeys('user123', 'edit789');
      
      expect(keys.PK).toBe('USER#user123');
      expect(keys.SK).toBe('EDIT#edit789');
    });

    it('should handle different user and edit IDs', () => {
      const keys = getEditRecordKeys('abc', 'xyz');
      
      expect(keys.PK).toBe('USER#abc');
      expect(keys.SK).toBe('EDIT#xyz');
    });
  });
});
