/**
 * Unit tests for Scheduled AI Monitoring Lambda Function
 */

import { describe, it, expect } from '@jest/globals';
import { handler, healthCheck } from '../scheduled-ai-monitoring';

describe('Scheduled AI Monitoring Lambda', () => {
    it('should export handler function', () => {
        expect(typeof handler).toBe('function');
    });

    it('should export healthCheck function', () => {
        expect(typeof healthCheck).toBe('function');
    });

    it('should return healthy status from healthCheck', async () => {
        const result = await healthCheck();
        expect(result.status).toBe('healthy');
        expect(result.timestamp).toBeDefined();
    });
});
