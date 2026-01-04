/**
 * AI Visibility Optimization - Performance Tests
 * 
 * Tests system performance under various load conditions and validates
 * response times, memory usage, and throughput.
 * 
 * Requirements: Performance and scalability validation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AIVisibilityRepository,
  AISearchMonitorService,
  AIVisibilityScoringEngine,
  OptimizationEngineService,
  MultiFormatExportService,
  GeographicSchemaGenerator,
  AdvancedWebsiteAnalysisService,
} from '../index';

// Performance test configuration
const PERFORMANCE_THRESHOLDS = {
  SCHEMA_GENERATION_MS: 1000,
  SCORE_CALCULATION_MS: 500,
  EXPORT_GENERATION_MS: 2000,
  CONCURRENT_REQUESTS: 20,
  BULK_OPERATION_SIZE: 100,
  MEMORY_LIMIT_MB: 100,
  RESPONSE_TIME_P95_MS: 2000,
};

// Mock profile for performance testing
const mockProfile = {
  id: 'perf-test-agent',
  name: 'Performance Test Agent',
  email: 'perf@test.com',
  phone: '+1-555-PERF-TEST',
  website: 'https://perftest.com',
  bio: 'Agent for performance testing',
  certifications: ['CRS', 'GRI'],
  specializations: ['Performance Testing'],
  serviceAreas: ['Test City'],
  address: {
    streetAddress: '123 Test St',
    addressLocality: 'Test City',
    addressRegion: 'TS',
    postalCode: '12345',
    addressCountry: 'US',
  },
  socialProfiles: ['https://test.com/profile'],
  testimonials: [],
};

describe('AI Visibility Optimization - Performance Tests', () => {
  let repository: AIVisibilityRepository;
  let aiSearchMonitor: AISearchMonitorService;
  let scoringEngine: AIVisibilityScoringEngine;
  let optimizationEngine: OptimizationEngineService;
  let exportService: MultiFormatExportService;
  let schemaGenerator: GeographicSchemaGenerator;
  let websiteAnalysis: AdvancedWebsiteAnalysisService;

  beforeEach(() => {
    repository = new AIVisibilityRepository();
    aiSearchMonitor = new AISearchMonitorService();
    scoringEngine = new AIVisibilityScoringEngine();
    optimizationEngine = new OptimizationEngineService();
    exportService = new MultiFormatExportService();
    schemaGenerator = new GeographicSchemaGenerator();
    websiteAnalysis = new AdvancedWebsiteAnalysisService();

    // Mock external services for consistent performance testing
    jest.spyOn(aiSearchMonitor, 'queryAIPlatforms').mockImplementation(async () => {
      // Simulate realistic API response time
      await new Promise(resolve => setTimeout(resolve, 100));
      return [
        {
          id: 'perf-mention-1',
          platform: 'chatgpt',
          query: 'performance test query',
          response: 'Performance test response',
          mentionContext: 'Performance test context',
          position: 1,
          sentiment: 'positive',
          competitorsAlsoMentioned: [],
          timestamp: new Date(),
          confidence: 0.9,
        },
      ];
    });

    jest.spyOn(websiteAnalysis, 'analyzeWebsite').mockImplementation(async () => {
      // Simulate website analysis time
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        overallScore: 75,
        issues: [],
        recommendations: [],
        technicalSEO: { score: 80 },
        schemaMarkup: { score: 70 },
        performance: { score: 85 },
        lastAnalyzed: new Date(),
      } as any;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Individual Service Performance', () => {
    it('should generate schema markup within performance threshold', async () => {
      const startTime = Date.now();
      
      const schemaMarkup = await schemaGenerator.generateRealEstateAgentSchema(mockProfile);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(schemaMarkup).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SCHEMA_GENERATION_MS);
    });

    it('should calculate visibility score within performance threshold', async () => {
      const mockSchemaMarkup = [{
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: mockProfile.name,
      }];

      const startTime = Date.now();
      
      const visibilityScore = await scoringEngine.calculateVisibilityScore({
        profile: mockProfile,
        schemaMarkup: mockSchemaMarkup,
        aiMentions: [],
        websiteAnalysis: { overallScore: 75 } as any,
        competitorAnalysis: null,
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(visibilityScore).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SCORE_CALCULATION_MS);
    });

    it('should export data within performance threshold', async () => {
      const mockSchemaMarkup = [{
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: mockProfile.name,
      }];

      const startTime = Date.now();
      
      const exportPackage = await exportService.exportMultiFormat({
        schemaMarkup: mockSchemaMarkup,
        format: 'all',
        includeInstructions: true,
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(exportPackage).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.EXPORT_GENERATION_MS);
    });
  });

  describe('Concurrent Load Testing', () => {
    it('should handle concurrent schema generation requests', async () => {
      const concurrentRequests = PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS;
      const startTime = Date.now();
      
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        const testProfile = {
          ...mockProfile,
          id: `concurrent-${index}`,
          name: `Concurrent Agent ${index}`,
        };
        
        return schemaGenerator.generateRealEstateAgentSchema(testProfile);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / concurrentRequests;

      // All requests should complete successfully
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result['@type']).toBe('RealEstateAgent');
      });

      // Average response time should be reasonable
      expect(averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SCHEMA_GENERATION_MS);
      
      // Total time should show some parallelization benefit
      expect(totalDuration).toBeLessThan(concurrentRequests * PERFORMANCE_THRESHOLDS.SCHEMA_GENERATION_MS);
    });

    it('should handle concurrent AI monitoring requests', async () => {
      const concurrentRequests = Math.min(PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS, 10); // Limit for API calls
      const startTime = Date.now();
      
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        return aiSearchMonitor.queryAIPlatforms([
          {
            query: `concurrent test query ${index}`,
            location: 'Test City',
            agentName: `Agent ${index}`,
          },
        ]);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // All requests should complete successfully
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });

      // Should complete within reasonable time (allowing for API rate limits)
      expect(totalDuration).toBeLessThan(10000); // 10 seconds max
    });

    it('should handle concurrent score calculations', async () => {
      const concurrentRequests = PERFORMANCE_THRESHOLDS.CONCURRENT_REQUESTS;
      const mockData = {
        schemaMarkup: [{ '@type': 'RealEstateAgent', name: 'Test' }],
        aiMentions: [],
        websiteAnalysis: { overallScore: 75 } as any,
        competitorAnalysis: null,
      };

      const startTime = Date.now();
      
      const promises = Array(concurrentRequests).fill(null).map(async (_, index) => {
        const testProfile = {
          ...mockProfile,
          id: `score-test-${index}`,
        };
        
        return scoringEngine.calculateVisibilityScore({
          profile: testProfile,
          ...mockData,
        });
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / concurrentRequests;

      // All calculations should complete successfully
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.overall).toBeGreaterThanOrEqual(0);
        expect(result.overall).toBeLessThanOrEqual(100);
      });

      // Performance should be good
      expect(averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SCORE_CALCULATION_MS);
    });
  });

  describe('Bulk Operations Performance', () => {
    it('should handle bulk schema generation efficiently', async () => {
      const bulkSize = PERFORMANCE_THRESHOLDS.BULK_OPERATION_SIZE;
      const startTime = Date.now();
      const initialMemory = process.memoryUsage().heapUsed;
      
      const results = [];
      for (let i = 0; i < bulkSize; i++) {
        const testProfile = {
          ...mockProfile,
          id: `bulk-${i}`,
          name: `Bulk Agent ${i}`,
        };
        
        const schema = await schemaGenerator.generateRealEstateAgentSchema(testProfile);
        results.push(schema);
        
        // Periodic garbage collection to test memory efficiency
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }
      
      const endTime = Date.now();
      const finalMemory = process.memoryUsage().heapUsed;
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / bulkSize;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024); // MB

      // All operations should complete successfully
      expect(results).toHaveLength(bulkSize);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result['@type']).toBe('RealEstateAgent');
      });

      // Performance metrics
      expect(averageDuration).toBeLessThan(PERFORMANCE_THRESHOLDS.SCHEMA_GENERATION_MS);
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT_MB);
    });

    it('should handle bulk export operations efficiently', async () => {
      const bulkSize = Math.min(PERFORMANCE_THRESHOLDS.BULK_OPERATION_SIZE, 50); // Smaller for exports
      const mockSchemas = Array(bulkSize).fill(null).map((_, index) => ({
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: `Bulk Export Agent ${index}`,
      }));

      const startTime = Date.now();
      
      const exportPackage = await exportService.exportMultiFormat({
        schemaMarkup: mockSchemas,
        format: 'all',
        includeInstructions: true,
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(exportPackage).toBeDefined();
      expect(exportPackage.formats).toContain('json-ld');
      expect(exportPackage.formats).toContain('rdf-xml');
      expect(exportPackage.formats).toContain('turtle');
      expect(exportPackage.formats).toContain('microdata');

      // Should complete within reasonable time for bulk operation
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.EXPORT_GENERATION_MS * 2);
    });
  });

  describe('Memory Usage and Efficiency', () => {
    it('should maintain stable memory usage during repeated operations', async () => {
      const iterations = 50;
      const memorySnapshots: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const testProfile = {
          ...mockProfile,
          id: `memory-test-${i}`,
        };
        
        await schemaGenerator.generateRealEstateAgentSchema(testProfile);
        
        // Take memory snapshot every 10 iterations
        if (i % 10 === 0) {
          if (global.gc) global.gc(); // Force garbage collection
          memorySnapshots.push(process.memoryUsage().heapUsed);
        }
      }

      // Memory should not continuously increase (indicating memory leaks)
      const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);
      
      expect(memoryGrowthMB).toBeLessThan(PERFORMANCE_THRESHOLDS.MEMORY_LIMIT_MB);
    });

    it('should efficiently handle large schema objects', async () => {
      const largeProfile = {
        ...mockProfile,
        bio: 'A'.repeat(10000), // 10KB bio
        certifications: Array(100).fill('Certification'),
        specializations: Array(50).fill('Specialization'),
        serviceAreas: Array(200).fill('Service Area'),
        testimonials: Array(100).fill(null).map((_, i) => ({
          id: `testimonial-${i}`,
          author: `Author ${i}`,
          rating: 5,
          text: 'B'.repeat(1000), // 1KB per testimonial
          date: '2024-01-01',
        })),
      };

      const startTime = Date.now();
      const initialMemory = process.memoryUsage().heapUsed;
      
      const schemaMarkup = await schemaGenerator.generateRealEstateAgentSchema(largeProfile);
      
      const endTime = Date.now();
      const finalMemory = process.memoryUsage().heapUsed;
      const duration = endTime - startTime;
      const memoryUsed = (finalMemory - initialMemory) / (1024 * 1024); // MB

      expect(schemaMarkup).toBeDefined();
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.SCHEMA_GENERATION_MS * 2); // Allow 2x for large data
      expect(memoryUsed).toBeLessThan(50); // Should not use more than 50MB for one profile
    });
  });

  describe('Response Time Distribution', () => {
    it('should maintain consistent response times under load', async () => {
      const sampleSize = 100;
      const responseTimes: number[] = [];
      
      for (let i = 0; i < sampleSize; i++) {
        const testProfile = {
          ...mockProfile,
          id: `response-time-${i}`,
        };
        
        const startTime = Date.now();
        await schemaGenerator.generateRealEstateAgentSchema(testProfile);
        const endTime = Date.now();
        
        responseTimes.push(endTime - startTime);
      }

      // Calculate percentiles
      responseTimes.sort((a, b) => a - b);
      const p50 = responseTimes[Math.floor(sampleSize * 0.5)];
      const p95 = responseTimes[Math.floor(sampleSize * 0.95)];
      const p99 = responseTimes[Math.floor(sampleSize * 0.99)];
      const average = responseTimes.reduce((sum, time) => sum + time, 0) / sampleSize;

      // Performance assertions
      expect(average).toBeLessThan(PERFORMANCE_THRESHOLDS.SCHEMA_GENERATION_MS);
      expect(p95).toBeLessThan(PERFORMANCE_THRESHOLDS.RESPONSE_TIME_P95_MS);
      expect(p99).toBeLessThan(PERFORMANCE_THRESHOLDS.RESPONSE_TIME_P95_MS * 1.5);
      
      // Consistency check - p95 should not be too much higher than median
      expect(p95).toBeLessThan(p50 * 3);
    });
  });

  describe('Resource Cleanup and Garbage Collection', () => {
    it('should properly clean up resources after operations', async () => {
      const initialHandles = process._getActiveHandles().length;
      const initialRequests = process._getActiveRequests().length;
      
      // Perform multiple operations that might create handles/requests
      for (let i = 0; i < 10; i++) {
        await schemaGenerator.generateRealEstateAgentSchema(mockProfile);
        await aiSearchMonitor.queryAIPlatforms([{
          query: 'cleanup test',
          location: 'Test City',
          agentName: 'Test Agent',
        }]);
      }
      
      // Allow some time for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalHandles = process._getActiveHandles().length;
      const finalRequests = process._getActiveRequests().length;
      
      // Should not have significantly more handles/requests
      expect(finalHandles - initialHandles).toBeLessThanOrEqual(5);
      expect(finalRequests - initialRequests).toBeLessThanOrEqual(2);
    });
  });
});