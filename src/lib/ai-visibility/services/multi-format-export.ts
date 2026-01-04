/**
 * Multi-Format Export Service Implementation
 * 
 * Service for comprehensive export functionality with multiple formats and platform guides
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */

import type {
  SchemaMarkup,
  ExportPackage,
  ExportFormat,
  ValidationResult,
  KnowledgeGraphEntity,
  RDFTriple,
} from '../types';

import type {
  ExportSchemaDataInput,
} from '../schemas';

import { AIVisibilityRepository } from '../repository';
import {
  createExportPackage,
  generateImplementationInstructions,
  generatePlatformGuides,
  validateRDFTriples,
  toJSONLD,
  toRDFXML,
  toTurtle,
  toMicrodata,
} from '../utils/export-formats';
import { 
  handleAIVisibilityOperation, 
  createGracefulAIOperation 
} from '../error-handler';
import { 
  AIVisibilityError, 
  ExportFormatError,
  ConfigurationError,
  DataPersistenceError 
} from '../errors';

/**
 * Export configuration options
 */
export interface ExportConfiguration {
  /** Export formats to include */
  formats: ExportFormat[];
  /** Include implementation instructions */
  includeInstructions: boolean;
  /** Include platform-specific guides */
  includePlatformGuides: boolean;
  /** Validate RDF output */
  validateRDF: boolean;
  /** Include metadata and ontology references */
  includeMetadata: boolean;
  /** Compress output files */
  compressOutput: boolean;
  /** Custom namespace prefixes */
  customNamespaces?: Record<string, string>;
}

/**
 * Export result with validation and metadata
 */
export interface ExportResult {
  /** Export package with all formats */
  package: ExportPackage;
  /** Validation results */
  validation: ValidationResult;
  /** Export metadata */
  metadata: {
    exportedAt: Date;
    userId: string;
    schemaCount: number;
    formats: ExportFormat[];
    fileSize: number; // in bytes
  };
  /** Download URLs for files */
  downloadUrls?: Record<ExportFormat, string>;
}

/**
 * Platform integration guide
 */
export interface PlatformIntegration {
  /** Platform name */
  platform: string;
  /** Integration difficulty */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Estimated implementation time */
  estimatedTime: string;
  /** Step-by-step guide */
  guide: string;
  /** Required tools or plugins */
  requirements: string[];
  /** Testing instructions */
  testing: string[];
  /** Common issues and solutions */
  troubleshooting: string[];
}

/**
 * Multi-Format Export Service Implementation
 */
export class MultiFormatExportService {
  private repository: AIVisibilityRepository;

  constructor(repository?: AIVisibilityRepository) {
    this.repository = repository || new AIVisibilityRepository();
  }

  /**
   * Exports schema data in multiple formats with comprehensive guides
   * Requirements: 8.1, 8.2, 8.4, 8.5
   */
  async exportSchemaData(
    userId: string,
    configuration: ExportConfiguration = {
      formats: ['json-ld', 'rdf-xml', 'turtle', 'microdata'],
      includeInstructions: true,
      includePlatformGuides: true,
      validateRDF: true,
      includeMetadata: true,
      compressOutput: false,
    }
  ): Promise<ExportResult> {
    return handleAIVisibilityOperation(
      async () => {
        if (!userId) {
          throw new ConfigurationError(
            'User ID is required for schema export',
            'export',
            ['userId']
          );
        }

        if (!configuration.formats || configuration.formats.length === 0) {
          throw new ConfigurationError(
            'At least one export format must be specified',
            'export',
            ['formats']
          );
        }

        // Get user's schema markup data
        const schemaData = await this.repository.getSchemaMarkup(userId);
        const schemas = schemaData.items;

        if (schemas.length === 0) {
          throw new DataPersistenceError(
            'No schema markup found for user. Please generate schema markup first.',
            'read',
            'schemaMarkup'
          );
        }

        try {
          // Create export package
          const exportPackage = this.createComprehensiveExportPackage(
            schemas,
            configuration
          );

          // Validate the export
          const validation = await this.validateExport(exportPackage, configuration);

          // Calculate metadata
          const metadata = {
            exportedAt: new Date(),
            userId,
            schemaCount: schemas.length,
            formats: configuration.formats,
            fileSize: this.calculatePackageSize(exportPackage),
          };

          // Store export record with error handling
          try {
            await this.repository.createExportRecord(userId, {
              exportId: `export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
              formats: configuration.formats,
              schemaCount: schemas.length,
              exportedAt: metadata.exportedAt,
              validation,
            });
          } catch (error) {
            // Log but don't fail the export if record storage fails
            console.warn(`Failed to store export record for user ${userId}:`, error);
          }

          return {
            package: exportPackage,
            validation,
            metadata,
          };
        } catch (error) {
          throw new ExportFormatError(
            'Failed to create export package',
            configuration.formats.join(', '),
            [error instanceof Error ? error.message : 'Unknown export error'],
            error instanceof Error ? error : undefined
          );
        }
      },
      'exportSchemaData',
      { userId, serviceName: 'multiFormatExport' }
    );
  }

  /**
   * Exports for specific platform with optimized format and guide
   */
  async exportForPlatform(
    userId: string,
    platform: 'wordpress' | 'squarespace' | 'shopify' | 'wix' | 'webflow' | 'html'
  ): Promise<{
    exportPackage: ExportPackage;
    integration: PlatformIntegration;
    validation: ValidationResult;
  }> {
    return handleAIVisibilityOperation(
      async () => {
        if (!userId) {
          throw new ConfigurationError(
            'User ID is required for platform export',
            'export',
            ['userId']
          );
        }

        const validPlatforms = ['wordpress', 'squarespace', 'shopify', 'wix', 'webflow', 'html'];
        if (!validPlatforms.includes(platform)) {
          throw new ConfigurationError(
            `Unsupported platform: ${platform}`,
            'export',
            ['platform']
          );
        }

        // Get platform-specific configuration
        const config = this.getPlatformConfiguration(platform);
        
        // Export with platform-specific settings
        const result = await this.exportSchemaData(userId, config);
        
        // Get detailed platform integration guide
        const integration = this.getPlatformIntegration(platform);

        return {
          exportPackage: result.package,
          integration,
          validation: result.validation,
        };
      },
      'exportForPlatform',
      { userId, serviceName: 'multiFormatExport', metadata: { platform } }
    );
  }

  /**
   * Creates a comprehensive export package with all requested formats
   */
  private createComprehensiveExportPackage(
    schemas: SchemaMarkup[],
    configuration: ExportConfiguration
  ): ExportPackage {
    const basePackage = createExportPackage(
      schemas,
      configuration.formats,
      {
        validateRDF: configuration.validateRDF,
        includeMetadata: configuration.includeMetadata,
      }
    );

    // Enhance with additional features
    let enhancedPackage = { ...basePackage };

    // Add custom instructions if requested
    if (configuration.includeInstructions) {
      enhancedPackage.instructions = this.generateEnhancedInstructions(
        configuration.formats,
        schemas
      );
    }

    // Add comprehensive platform guides if requested
    if (configuration.includePlatformGuides) {
      enhancedPackage.platformGuides = {
        ...enhancedPackage.platformGuides,
        ...this.generateAdvancedPlatformGuides(schemas),
      };
    }

    // Add custom namespaces if provided
    if (configuration.customNamespaces && 
        (configuration.formats.includes('rdf-xml') || configuration.formats.includes('turtle'))) {
      enhancedPackage = this.addCustomNamespaces(enhancedPackage, configuration.customNamespaces);
    }

    return enhancedPackage;
  }

  /**
   * Generates enhanced implementation instructions
   */
  private generateEnhancedInstructions(
    formats: ExportFormat[],
    schemas: SchemaMarkup[]
  ): string {
    let instructions = generateImplementationInstructions(formats);

    // Add AI-specific optimization tips
    instructions += `\n## AI Optimization Tips\n\n`;
    instructions += `### For AI Search Engines\n`;
    instructions += `1. **Consistency**: Ensure all schema markup matches your actual business information\n`;
    instructions += `2. **Completeness**: Include all available properties for better AI understanding\n`;
    instructions += `3. **Accuracy**: Keep information up-to-date as AI systems value fresh, accurate data\n`;
    instructions += `4. **Context**: Use structured data to provide context about your expertise and service areas\n\n`;

    instructions += `### Schema Types Included\n`;
    const schemaTypes = [...new Set(schemas.map(s => s['@type']))];
    schemaTypes.forEach(type => {
      instructions += `- **${type}**: ${this.getSchemaTypeDescription(type)}\n`;
    });
    instructions += `\n`;

    // Add monitoring recommendations
    instructions += `## Monitoring and Maintenance\n\n`;
    instructions += `### Regular Checks\n`;
    instructions += `1. **Monthly**: Validate schema markup using Google's tools\n`;
    instructions += `2. **Quarterly**: Update schema with new certifications or service areas\n`;
    instructions += `3. **Annually**: Review and optimize schema for new AI platform requirements\n\n`;

    instructions += `### AI Platform Monitoring\n`;
    instructions += `Monitor your mentions across AI platforms:\n`;
    instructions += `- ChatGPT: Search for your name and location\n`;
    instructions += `- Claude: Ask about real estate agents in your area\n`;
    instructions += `- Perplexity: Query for local real estate expertise\n`;
    instructions += `- Gemini: Search for property professionals nearby\n`;
    instructions += `- Bing Chat: Ask about real estate services in your market\n\n`;

    return instructions;
  }

  /**
   * Generates advanced platform-specific guides
   */
  private generateAdvancedPlatformGuides(schemas: SchemaMarkup[]): Record<string, string> {
    const baseGuides = generatePlatformGuides();
    const advancedGuides: Record<string, string> = {};

    // Enhance each platform guide with schema-specific instructions
    Object.entries(baseGuides).forEach(([platform, guide]) => {
      let enhancedGuide = guide;

      // Add schema-specific sections
      enhancedGuide += `\n\n## Schema-Specific Implementation\n\n`;
      
      const schemaTypes = [...new Set(schemas.map(s => s['@type']))];
      schemaTypes.forEach(type => {
        enhancedGuide += `### ${type} Schema\n`;
        enhancedGuide += this.getPlatformSpecificSchemaGuide(platform, type);
        enhancedGuide += `\n`;
      });

      // Add testing section
      enhancedGuide += `\n## Testing Your Implementation\n\n`;
      enhancedGuide += `### Validation Tools\n`;
      enhancedGuide += `1. **Google Rich Results Test**: Test how Google sees your schema\n`;
      enhancedGuide += `2. **Schema.org Validator**: Validate against Schema.org specifications\n`;
      enhancedGuide += `3. **AI Platform Testing**: Test mentions across AI platforms\n\n`;

      enhancedGuide += `### Common Issues\n`;
      enhancedGuide += this.getPlatformCommonIssues(platform);

      advancedGuides[platform] = enhancedGuide;
    });

    return advancedGuides;
  }

  /**
   * Gets platform-specific configuration
   */
  private getPlatformConfiguration(platform: string): ExportConfiguration {
    const baseConfig: ExportConfiguration = {
      formats: ['json-ld'],
      includeInstructions: true,
      includePlatformGuides: true,
      validateRDF: false,
      includeMetadata: true,
      compressOutput: false,
    };

    switch (platform) {
      case 'wordpress':
        return {
          ...baseConfig,
          formats: ['json-ld', 'microdata'],
        };
      case 'squarespace':
      case 'wix':
        return {
          ...baseConfig,
          formats: ['json-ld'],
        };
      case 'shopify':
        return {
          ...baseConfig,
          formats: ['json-ld', 'microdata'],
        };
      case 'webflow':
        return {
          ...baseConfig,
          formats: ['json-ld'],
        };
      case 'html':
        return {
          ...baseConfig,
          formats: ['json-ld', 'rdf-xml', 'turtle', 'microdata'],
          validateRDF: true,
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Gets detailed platform integration guide
   */
  private getPlatformIntegration(platform: string): PlatformIntegration {
    const integrations: Record<string, PlatformIntegration> = {
      wordpress: {
        platform: 'WordPress',
        difficulty: 'easy',
        estimatedTime: '15-30 minutes',
        guide: `WordPress offers multiple ways to implement schema markup, from plugins to manual code insertion.`,
        requirements: [
          'WordPress admin access',
          'Schema plugin (recommended: Schema & Structured Data for WP)',
          'Basic understanding of WordPress dashboard',
        ],
        testing: [
          'Use Google Rich Results Test',
          'Check with WordPress schema plugin validator',
          'Test on staging site first',
        ],
        troubleshooting: [
          'Plugin conflicts: Deactivate other SEO plugins temporarily',
          'Theme issues: Switch to default theme for testing',
          'Caching: Clear all caches after implementation',
        ],
      },
      squarespace: {
        platform: 'Squarespace',
        difficulty: 'medium',
        estimatedTime: '20-45 minutes',
        guide: `Squarespace requires manual code injection for schema markup implementation.`,
        requirements: [
          'Squarespace Business plan or higher',
          'Access to Code Injection settings',
          'Basic HTML knowledge',
        ],
        testing: [
          'Use Google Rich Results Test',
          'Test in Squarespace preview mode',
          'Validate after publishing',
        ],
        troubleshooting: [
          'Code injection not working: Check plan limitations',
          'Schema not appearing: Verify code placement in header',
          'Validation errors: Check JSON syntax carefully',
        ],
      },
      shopify: {
        platform: 'Shopify',
        difficulty: 'medium',
        estimatedTime: '30-60 minutes',
        guide: `Shopify allows schema implementation through theme editing or apps.`,
        requirements: [
          'Shopify store admin access',
          'Theme editing permissions',
          'Basic Liquid template knowledge (for manual implementation)',
        ],
        testing: [
          'Use Google Rich Results Test',
          'Test with Shopify theme inspector',
          'Validate on live store',
        ],
        troubleshooting: [
          'Theme updates overwriting changes: Use app-based solution',
          'Liquid syntax errors: Validate template syntax',
          'Schema conflicts: Check for existing schema markup',
        ],
      },
      wix: {
        platform: 'Wix',
        difficulty: 'easy',
        estimatedTime: '10-20 minutes',
        guide: `Wix provides built-in SEO tools and custom code options for schema implementation.`,
        requirements: [
          'Wix Premium plan',
          'Access to SEO settings',
          'Custom code feature enabled',
        ],
        testing: [
          'Use Wix SEO Wiz validation',
          'Test with Google Rich Results Test',
          'Check in Wix preview mode',
        ],
        troubleshooting: [
          'Custom code not loading: Check plan limitations',
          'SEO conflicts: Use either built-in tools or custom code',
          'Mobile issues: Test responsive implementation',
        ],
      },
      webflow: {
        platform: 'Webflow',
        difficulty: 'easy',
        estimatedTime: '15-25 minutes',
        guide: `Webflow offers flexible custom code options for schema implementation.`,
        requirements: [
          'Webflow account with custom code access',
          'Published site or staging environment',
          'Basic understanding of Webflow Designer',
        ],
        testing: [
          'Use Google Rich Results Test',
          'Test in Webflow preview',
          'Validate on published site',
        ],
        troubleshooting: [
          'Code not appearing: Check custom code placement',
          'CMS integration issues: Bind schema to CMS fields properly',
          'Publishing problems: Ensure all changes are published',
        ],
      },
      html: {
        platform: 'Static HTML',
        difficulty: 'hard',
        estimatedTime: '45-90 minutes',
        guide: `Static HTML implementation offers full control but requires manual maintenance.`,
        requirements: [
          'HTML/CSS knowledge',
          'Text editor or IDE',
          'Web server access',
          'Understanding of structured data formats',
        ],
        testing: [
          'Use Google Rich Results Test',
          'Validate HTML syntax',
          'Test across multiple browsers',
          'Check mobile responsiveness',
        ],
        troubleshooting: [
          'Syntax errors: Validate HTML and JSON-LD',
          'Schema not recognized: Check proper placement in <head>',
          'Multiple format conflicts: Use only one format per page',
        ],
      },
    };

    return integrations[platform] || integrations.html;
  }

  /**
   * Validates the export package
   */
  private async validateExport(
    exportPackage: ExportPackage,
    configuration: ExportConfiguration
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate JSON-LD
    if (configuration.formats.includes('json-ld')) {
      try {
        JSON.parse(exportPackage.jsonLD);
      } catch (error) {
        errors.push(`Invalid JSON-LD format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate RDF formats if requested
    if (configuration.validateRDF && 
        (configuration.formats.includes('rdf-xml') || configuration.formats.includes('turtle'))) {
      
      // Basic RDF validation (could be enhanced with proper RDF parser)
      if (configuration.formats.includes('rdf-xml')) {
        if (!exportPackage.rdfXML.includes('<?xml') || !exportPackage.rdfXML.includes('<rdf:RDF')) {
          errors.push('Invalid RDF/XML format: Missing XML declaration or RDF root element');
        }
      }

      if (configuration.formats.includes('turtle')) {
        if (!exportPackage.turtle.includes('@prefix') || !exportPackage.turtle.includes('.')) {
          warnings.push('Turtle format may be incomplete: Missing prefixes or statement terminators');
        }
      }
    }

    // Validate Microdata
    if (configuration.formats.includes('microdata')) {
      if (!exportPackage.microdata.includes('itemscope') || !exportPackage.microdata.includes('itemtype')) {
        errors.push('Invalid Microdata format: Missing required attributes');
      }
    }

    // Check for completeness
    if (exportPackage.instructions.length < 100) {
      warnings.push('Implementation instructions appear incomplete');
    }

    if (Object.keys(exportPackage.platformGuides).length === 0) {
      suggestions.push('Consider including platform-specific implementation guides');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Calculates the total size of the export package
   */
  private calculatePackageSize(exportPackage: ExportPackage): number {
    const jsonLDSize = new Blob([exportPackage.jsonLD]).size;
    const rdfXMLSize = new Blob([exportPackage.rdfXML]).size;
    const turtleSize = new Blob([exportPackage.turtle]).size;
    const microdataSize = new Blob([exportPackage.microdata]).size;
    const instructionsSize = new Blob([exportPackage.instructions]).size;
    
    const guidesSize = Object.values(exportPackage.platformGuides)
      .reduce((total, guide) => total + new Blob([guide]).size, 0);

    return jsonLDSize + rdfXMLSize + turtleSize + microdataSize + instructionsSize + guidesSize;
  }

  /**
   * Adds custom namespaces to RDF formats
   */
  private addCustomNamespaces(
    exportPackage: ExportPackage,
    customNamespaces: Record<string, string>
  ): ExportPackage {
    // Add custom namespaces to RDF/XML
    let rdfXML = exportPackage.rdfXML;
    Object.entries(customNamespaces).forEach(([prefix, uri]) => {
      const namespaceDecl = `xmlns:${prefix}="${uri}"`;
      if (!rdfXML.includes(namespaceDecl)) {
        rdfXML = rdfXML.replace(
          'xmlns:vcard="http://www.w3.org/2006/vcard/ns#"',
          `xmlns:vcard="http://www.w3.org/2006/vcard/ns#"\n    ${namespaceDecl}`
        );
      }
    });

    // Add custom namespaces to Turtle
    let turtle = exportPackage.turtle;
    Object.entries(customNamespaces).forEach(([prefix, uri]) => {
      const prefixDecl = `@prefix ${prefix}: <${uri}> .`;
      if (!turtle.includes(prefixDecl)) {
        turtle = turtle.replace(
          '@prefix agent: <https://agent.example.com/> .',
          `@prefix agent: <https://agent.example.com/> .\n${prefixDecl}`
        );
      }
    });

    return {
      ...exportPackage,
      rdfXML,
      turtle,
    };
  }

  /**
   * Gets description for schema type
   */
  private getSchemaTypeDescription(schemaType: string): string {
    const descriptions: Record<string, string> = {
      RealEstateAgent: 'Professional real estate agent information with expertise and service areas',
      Person: 'Personal information and contact details',
      LocalBusiness: 'Business information including location and hours',
      Organization: 'Organizational affiliations and memberships',
      Review: 'Client testimonials and feedback',
      AggregateRating: 'Overall rating based on client reviews',
    };

    return descriptions[schemaType] || 'Schema markup for structured data';
  }

  /**
   * Gets platform-specific schema implementation guide
   */
  private getPlatformSpecificSchemaGuide(platform: string, schemaType: string): string {
    // This could be expanded with more detailed platform-specific guidance
    return `For ${schemaType} schema on ${platform}:\n` +
           `1. Ensure the schema is placed in the appropriate location\n` +
           `2. Test the implementation with validation tools\n` +
           `3. Monitor for any platform-specific issues\n\n`;
  }

  /**
   * Gets common issues for platform
   */
  private getPlatformCommonIssues(platform: string): string {
    const commonIssues: Record<string, string> = {
      wordpress: `- Plugin conflicts with other SEO tools\n- Theme updates overwriting custom code\n- Caching preventing schema updates\n`,
      squarespace: `- Code injection limitations on lower plans\n- Schema not appearing in preview mode\n- Mobile rendering issues\n`,
      shopify: `- Theme updates removing custom code\n- Liquid syntax errors\n- App conflicts with manual implementation\n`,
      wix: `- Custom code not loading on free plans\n- SEO Wiz conflicts with manual schema\n- Mobile optimization issues\n`,
      webflow: `- Custom code not publishing properly\n- CMS binding issues with dynamic content\n- Staging vs. production differences\n`,
      html: `- JSON-LD syntax errors\n- Multiple schema format conflicts\n- Improper placement in document head\n`,
    };

    return commonIssues[platform] || commonIssues.html;
  }

  /**
   * Generates export summary report
   */
  async generateExportSummary(
    userId: string,
    exportResult: ExportResult
  ): Promise<string> {
    let summary = `# AI Visibility Schema Export Summary\n\n`;
    
    summary += `**Export Date:** ${exportResult.metadata.exportedAt.toISOString()}\n`;
    summary += `**User ID:** ${exportResult.metadata.userId}\n`;
    summary += `**Schema Count:** ${exportResult.metadata.schemaCount}\n`;
    summary += `**Formats:** ${exportResult.metadata.formats.join(', ')}\n`;
    summary += `**Total Size:** ${(exportResult.metadata.fileSize / 1024).toFixed(2)} KB\n\n`;

    summary += `## Validation Results\n\n`;
    summary += `**Status:** ${exportResult.validation.isValid ? '✅ Valid' : '❌ Invalid'}\n`;
    
    if (exportResult.validation.errors.length > 0) {
      summary += `**Errors:** ${exportResult.validation.errors.length}\n`;
      exportResult.validation.errors.forEach(error => {
        summary += `- ${error}\n`;
      });
    }

    if (exportResult.validation.warnings.length > 0) {
      summary += `**Warnings:** ${exportResult.validation.warnings.length}\n`;
      exportResult.validation.warnings.forEach(warning => {
        summary += `- ${warning}\n`;
      });
    }

    if (exportResult.validation.suggestions.length > 0) {
      summary += `**Suggestions:** ${exportResult.validation.suggestions.length}\n`;
      exportResult.validation.suggestions.forEach(suggestion => {
        summary += `- ${suggestion}\n`;
      });
    }

    summary += `\n## Next Steps\n\n`;
    summary += `1. Review the validation results above\n`;
    summary += `2. Choose the appropriate format for your platform\n`;
    summary += `3. Follow the platform-specific implementation guide\n`;
    summary += `4. Test your implementation with validation tools\n`;
    summary += `5. Monitor your AI visibility improvements\n\n`;

    return summary;
  }
}

/**
 * Singleton instance for the multi-format export service
 */
let multiFormatExportInstance: MultiFormatExportService | null = null;

/**
 * Gets the singleton multi-format export service instance
 */
export function getMultiFormatExportService(): MultiFormatExportService {
  if (!multiFormatExportInstance) {
    multiFormatExportInstance = new MultiFormatExportService();
  }
  return multiFormatExportInstance;
}

/**
 * Resets the singleton instance (for testing)
 */
export function resetMultiFormatExportService(): void {
  multiFormatExportInstance = null;
}