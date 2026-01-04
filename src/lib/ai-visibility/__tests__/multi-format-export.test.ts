/**
 * Multi-Format Export Service Tests
 * 
 * Tests for the comprehensive export functionality
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MultiFormatExportService } from '../services/multi-format-export';
import type { SchemaMarkup, ExportFormat } from '../types';

// Mock the repository
jest.mock('../repository', () => ({
  AIVisibilityRepository: jest.fn().mockImplementation(() => ({
    getSchemaMarkup: jest.fn(),
    createExportRecord: jest.fn(),
    getExportRecords: jest.fn(),
  })),
}));

describe('MultiFormatExportService', () => {
  let exportService: MultiFormatExportService;
  let mockRepository: any;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      getSchemaMarkup: jest.fn(),
      createExportRecord: jest.fn(),
      getExportRecords: jest.fn(),
    };

    // Create service with mock repository
    exportService = new MultiFormatExportService(mockRepository);
  });

  describe('exportSchemaData', () => {
    const mockSchemas: SchemaMarkup[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': '#agent1',
        name: 'John Doe',
        description: 'Experienced real estate agent',
        email: 'john@example.com',
        telephone: '+1-555-0123',
        knowsAbout: ['Residential Real Estate', 'First-Time Buyers'],
        areaServed: [
          {
            '@type': 'Place',
            name: 'San Francisco, CA',
          },
        ],
      },
    ];

    beforeEach(() => {
      mockRepository.getSchemaMarkup.mockResolvedValue({
        items: mockSchemas,
      });
      mockRepository.createExportRecord.mockResolvedValue({});
    });

    it('should export schema data in multiple formats', async () => {
      const result = await exportService.exportSchemaData('user123', {
        formats: ['json-ld', 'rdf-xml', 'turtle', 'microdata'],
        includeInstructions: true,
        includePlatformGuides: true,
        validateRDF: true,
        includeMetadata: true,
        compressOutput: false,
      });

      expect(result.package).toBeDefined();
      expect(result.package.jsonLD).toContain('RealEstateAgent');
      expect(result.package.rdfXML).toContain('<?xml version="1.0"');
      expect(result.package.turtle).toContain('@prefix');
      expect(result.package.microdata).toContain('itemscope');
      expect(result.package.instructions).toContain('Implementation Guide');
      expect(result.validation.isValid).toBe(true);
      expect(result.metadata.schemaCount).toBe(1);
      expect(result.metadata.formats).toEqual(['json-ld', 'rdf-xml', 'turtle', 'microdata']);
    });

    it('should export only JSON-LD when specified', async () => {
      const result = await exportService.exportSchemaData('user123', {
        formats: ['json-ld'],
        includeInstructions: false,
        includePlatformGuides: false,
        validateRDF: false,
        includeMetadata: false,
        compressOutput: false,
      });

      expect(result.package.jsonLD).toContain('RealEstateAgent');
      expect(result.metadata.formats).toEqual(['json-ld']);
    });

    it('should validate RDF when requested', async () => {
      const result = await exportService.exportSchemaData('user123', {
        formats: ['rdf-xml', 'turtle'],
        includeInstructions: true,
        includePlatformGuides: true,
        validateRDF: true,
        includeMetadata: true,
        compressOutput: false,
      });

      expect(result.validation).toBeDefined();
      expect(result.validation.isValid).toBe(true);
    });

    it('should throw error when no schemas found', async () => {
      mockRepository.getSchemaMarkup.mockResolvedValue({
        items: [],
      });

      await expect(
        exportService.exportSchemaData('user123', {
          formats: ['json-ld'],
          includeInstructions: true,
          includePlatformGuides: true,
          validateRDF: false,
          includeMetadata: true,
          compressOutput: false,
        })
      ).rejects.toThrow('No schema markup found for user');
    });
  });

  describe('exportForPlatform', () => {
    const mockSchemas: SchemaMarkup[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        '@id': '#agent1',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ];

    beforeEach(() => {
      mockRepository.getSchemaMarkup.mockResolvedValue({
        items: mockSchemas,
      });
      mockRepository.createExportRecord.mockResolvedValue({});
    });

    it('should export for WordPress platform', async () => {
      const result = await exportService.exportForPlatform('user123', 'wordpress');

      expect(result.exportPackage).toBeDefined();
      expect(result.integration).toBeDefined();
      expect(result.integration.platform).toBe('WordPress');
      expect(result.integration.difficulty).toBe('easy');
      expect(result.integration.requirements).toContain('WordPress admin access');
      expect(result.validation).toBeDefined();
    });

    it('should export for Squarespace platform', async () => {
      const result = await exportService.exportForPlatform('user123', 'squarespace');

      expect(result.integration.platform).toBe('Squarespace');
      expect(result.integration.difficulty).toBe('medium');
      expect(result.integration.requirements).toContain('Squarespace Business plan or higher');
    });

    it('should export for HTML platform with all formats', async () => {
      const result = await exportService.exportForPlatform('user123', 'html');

      expect(result.integration.platform).toBe('Static HTML');
      expect(result.integration.difficulty).toBe('hard');
      expect(result.integration.requirements).toContain('HTML/CSS knowledge');
    });
  });

  describe('generateExportSummary', () => {
    it('should generate comprehensive export summary', async () => {
      const mockExportResult = {
        package: {
          jsonLD: '{"@context": "https://schema.org"}',
          rdfXML: '<?xml version="1.0"?>',
          turtle: '@prefix schema: <https://schema.org/> .',
          microdata: '<div itemscope>',
          instructions: 'Implementation guide...',
          platformGuides: {},
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: ['Minor warning'],
          suggestions: ['Consider adding more properties'],
        },
        metadata: {
          exportedAt: new Date('2024-01-15T10:00:00Z'),
          userId: 'user123',
          schemaCount: 2,
          formats: ['json-ld', 'rdf-xml'] as ExportFormat[],
          fileSize: 1024,
        },
      };

      const summary = await exportService.generateExportSummary('user123', mockExportResult);

      expect(summary).toContain('AI Visibility Schema Export Summary');
      expect(summary).toContain('**Export Date:** 2024-01-15T10:00:00.000Z');
      expect(summary).toContain('**User ID:** user123');
      expect(summary).toContain('**Schema Count:** 2');
      expect(summary).toContain('**Formats:** json-ld, rdf-xml');
      expect(summary).toContain('**Total Size:** 1.00 KB');
      expect(summary).toContain('**Status:** ✅ Valid');
      expect(summary).toContain('**Warnings:** 1');
      expect(summary).toContain('Minor warning');
      expect(summary).toContain('**Suggestions:** 1');
      expect(summary).toContain('Consider adding more properties');
      expect(summary).toContain('Next Steps');
    });
  });

  describe('Platform Configuration', () => {
    it('should return correct configuration for WordPress', () => {
      const config = (exportService as any).getPlatformConfiguration('wordpress');
      
      expect(config.formats).toEqual(['json-ld', 'microdata']);
      expect(config.includeInstructions).toBe(true);
      expect(config.includePlatformGuides).toBe(true);
    });

    it('should return correct configuration for Squarespace', () => {
      const config = (exportService as any).getPlatformConfiguration('squarespace');
      
      expect(config.formats).toEqual(['json-ld']);
      expect(config.validateRDF).toBe(false);
    });

    it('should return correct configuration for HTML', () => {
      const config = (exportService as any).getPlatformConfiguration('html');
      
      expect(config.formats).toEqual(['json-ld', 'rdf-xml', 'turtle', 'microdata']);
      expect(config.validateRDF).toBe(true);
    });
  });

  describe('Platform Integration Guides', () => {
    it('should provide detailed WordPress integration guide', () => {
      const integration = (exportService as any).getPlatformIntegration('wordpress');
      
      expect(integration.platform).toBe('WordPress');
      expect(integration.difficulty).toBe('easy');
      expect(integration.estimatedTime).toBe('15-30 minutes');
      expect(integration.requirements).toContain('WordPress admin access');
      expect(integration.testing).toContain('Use Google Rich Results Test');
      expect(integration.troubleshooting).toContainEqual(expect.stringContaining('Plugin conflicts'));
    });

    it('should provide detailed Shopify integration guide', () => {
      const integration = (exportService as any).getPlatformIntegration('shopify');
      
      expect(integration.platform).toBe('Shopify');
      expect(integration.difficulty).toBe('medium');
      expect(integration.estimatedTime).toBe('30-60 minutes');
      expect(integration.requirements).toContain('Shopify store admin access');
    });
  });

  describe('Validation', () => {
    it('should validate export package correctly', async () => {
      const mockPackage = {
        jsonLD: '{"@context": "https://schema.org", "@type": "RealEstateAgent"}',
        rdfXML: '<?xml version="1.0"?><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"></rdf:RDF>',
        turtle: '@prefix schema: <https://schema.org/> .\n<#agent> a schema:RealEstateAgent .',
        microdata: '<div itemscope itemtype="https://schema.org/RealEstateAgent"></div>',
        instructions: 'Implementation guide for schema markup',
        platformGuides: { wordpress: 'WordPress guide' },
      };

      const validation = await (exportService as any).validateExport(mockPackage, {
        formats: ['json-ld', 'rdf-xml', 'turtle', 'microdata'],
        validateRDF: true,
      });

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid JSON-LD', async () => {
      const mockPackage = {
        jsonLD: 'invalid json',
        rdfXML: '',
        turtle: '',
        microdata: '',
        instructions: '',
        platformGuides: {},
      };

      const validation = await (exportService as any).validateExport(mockPackage, {
        formats: ['json-ld'],
        validateRDF: false,
      });

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContainEqual(expect.stringContaining('Invalid JSON-LD format'));
    });
  });
});