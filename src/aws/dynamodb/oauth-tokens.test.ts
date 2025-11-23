/**
 * Tests for OAuth Token Storage and Management
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  storeOAuthTokens,
  getOAuthTokens,
  updateOAuthTokens,
  deleteOAuthTokens,
  areTokensExpired,
  type OAuthTokenData,
} from './oauth-tokens';
import { getRepository } from './repository';
import { getOAuthTokenKeys } from './keys';

// Mock the repository
jest.mock('@/aws/dynamodb/repository', () => ({
  getRepository: jest.fn(),
}));
jest.mock('@/aws/dynamodb/keys', () => ({
  getOAuthTokenKeys: jest.fn(),
}));

describe('OAuth Token Management', () => {
  const mockUserId = 'test-user-123';
  const mockProvider = 'GOOGLE_BUSINESS';
  const mockTokenData: OAuthTokenData = {
    agentProfileId: mockUserId,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiryDate: Date.now() + 3600000, // 1 hour from now
  };

  const mockKeys = {
    PK: `OAUTH#${mockUserId}`,
    SK: mockProvider,
  };

  let mockRepository: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock repository
    mockRepository = {
      put: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    (getRepository as jest.Mock).mockReturnValue(mockRepository);
    (getOAuthTokenKeys as jest.Mock).mockReturnValue(mockKeys);
  });

  describe('storeOAuthTokens', () => {
    it('should store OAuth tokens with correct structure', async () => {
      await storeOAuthTokens(mockUserId, mockTokenData, mockProvider);

      expect(getOAuthTokenKeys).toHaveBeenCalledWith(mockUserId, mockProvider);
      expect(mockRepository.put).toHaveBeenCalledWith(
        expect.objectContaining({
          PK: mockKeys.PK,
          SK: mockKeys.SK,
          EntityType: 'OAuthToken',
          Data: expect.objectContaining({
            ...mockTokenData,
            provider: mockProvider,
          }),
        })
      );
    });

    it('should include timestamps when storing tokens', async () => {
      const beforeTime = Date.now();
      await storeOAuthTokens(mockUserId, mockTokenData, mockProvider);
      const afterTime = Date.now();

      const putCall = mockRepository.put.mock.calls[0][0];
      expect(putCall.CreatedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(putCall.CreatedAt).toBeLessThanOrEqual(afterTime);
      expect(putCall.UpdatedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(putCall.UpdatedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('getOAuthTokens', () => {
    it('should retrieve OAuth tokens', async () => {
      mockRepository.get.mockResolvedValue(mockTokenData);

      const result = await getOAuthTokens(mockUserId, mockProvider);

      expect(getOAuthTokenKeys).toHaveBeenCalledWith(mockUserId, mockProvider);
      expect(mockRepository.get).toHaveBeenCalledWith(mockKeys.PK, mockKeys.SK);
      expect(result).toEqual(mockTokenData);
    });

    it('should return null when tokens not found', async () => {
      mockRepository.get.mockResolvedValue(null);

      const result = await getOAuthTokens(mockUserId, mockProvider);

      expect(result).toBeNull();
    });
  });

  describe('updateOAuthTokens', () => {
    it('should update OAuth tokens with partial data', async () => {
      const updates = {
        accessToken: 'new-access-token',
        expiryDate: Date.now() + 7200000,
      };

      await updateOAuthTokens(mockUserId, updates, mockProvider);

      expect(getOAuthTokenKeys).toHaveBeenCalledWith(mockUserId, mockProvider);
      expect(mockRepository.update).toHaveBeenCalledWith(
        mockKeys.PK,
        mockKeys.SK,
        updates
      );
    });
  });

  describe('deleteOAuthTokens', () => {
    it('should delete OAuth tokens', async () => {
      await deleteOAuthTokens(mockUserId, mockProvider);

      expect(getOAuthTokenKeys).toHaveBeenCalledWith(mockUserId, mockProvider);
      expect(mockRepository.delete).toHaveBeenCalledWith(mockKeys.PK, mockKeys.SK);
    });
  });

  describe('areTokensExpired', () => {
    it('should return false for valid tokens', () => {
      const validTokenData: OAuthTokenData = {
        ...mockTokenData,
        expiryDate: Date.now() + 3600000, // 1 hour from now
      };

      expect(areTokensExpired(validTokenData)).toBe(false);
    });

    it('should return true for expired tokens', () => {
      const expiredTokenData: OAuthTokenData = {
        ...mockTokenData,
        expiryDate: Date.now() - 1000, // 1 second ago
      };

      expect(areTokensExpired(expiredTokenData)).toBe(true);
    });

    it('should return true for tokens expiring within 5 minutes', () => {
      const soonToExpireTokenData: OAuthTokenData = {
        ...mockTokenData,
        expiryDate: Date.now() + 4 * 60 * 1000, // 4 minutes from now
      };

      expect(areTokensExpired(soonToExpireTokenData)).toBe(true);
    });

    it('should return false for tokens expiring after 5 minutes', () => {
      const validTokenData: OAuthTokenData = {
        ...mockTokenData,
        expiryDate: Date.now() + 6 * 60 * 1000, // 6 minutes from now
      };

      expect(areTokensExpired(validTokenData)).toBe(false);
    });
  });

  describe('Key Pattern', () => {
    it('should use correct key pattern for OAuth tokens', () => {
      const keys = getOAuthTokenKeys(mockUserId, mockProvider);

      expect(keys.PK).toBe(`OAUTH#${mockUserId}`);
      expect(keys.SK).toBe(mockProvider);
    });

    it('should default to GOOGLE_BUSINESS provider', () => {
      const keys = getOAuthTokenKeys(mockUserId);

      expect(keys.SK).toBe('GOOGLE_BUSINESS');
    });
  });
});
