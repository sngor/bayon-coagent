/**
 * AI Visibility Export Server Actions
 * 
 * Server actions for multi-format schema export functionality
 * Requirements: 8.1, 8.2, 8.4, 8.5
 */

'use server';

import { z } from 'zod';
import { 
  getMultiFormatExportService,
  ExportFormatSchema,
  type ExportFormat,
  type ExportResult,
  type PlatformIntegration,
} from '@/lib/ai-visibility';
import { getCurrentUserId } from '@/aws/auth/server-auth';

/**
 * Input schema for export schema data action
 */
const ExportSchemaDataInputSchema = z.object({
  formats: z.array(ExportFormatSchema).min(1).default(['json-ld', 'rdf-xml', 'turtle', 'microdata']),
  includeInstructions: z.boolean().default(true),
  includePlatformGuides: z.boolean().default(true),
  validateRDF: z.boolean().default(true),
  includeMetadata: z.boolean().default(true),
  compressOutput: z.boolean().default(false),
  customNamespaces: z.record(z.string(), z.string().url()).optional(),
});

/**
 * Input schema for platform-specific export
 */
const ExportForPlatformInputSchema = z.object({
  platform: z.enum(['wordpress', 'squarespace', 'shopify', 'wix', 'webflow', 'html']),
});

/**
 * Server action result type
 */
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Exports schema data in multiple formats with comprehensive guides
 */
export async function exportSchemaData(
  input: z.infer<typeof ExportSchemaDataInputSchema>
): Promise<ActionResult<ExportResult>> {
  try {
    // Validate input
    const validatedInput = ExportSchemaDataInputSchema.parse(input);

    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get export service
    const exportService = getMultiFormatExportService();

    // Export schema data
    const result = await exportService.exportSchemaData(userId, {
      formats: validatedInput.formats,
      includeInstructions: validatedInput.includeInstructions,
      includePlatformGuides: validatedInput.includePlatformGuides,
      validateRDF: validatedInput.validateRDF,
      includeMetadata: validatedInput.includeMetadata,
      compressOutput: validatedInput.compressOutput,
      customNamespaces: validatedInput.customNamespaces,
    });

    return {
      success: true,
      data: result,
      message: `Successfully exported schema data in ${validatedInput.formats.length} format(s)`,
    };
  } catch (error) {
    console.error('Error exporting schema data:', error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to export schema data',
    };
  }
}

/**
 * Exports schema data optimized for a specific platform
 */
export async function exportForPlatform(
  input: z.infer<typeof ExportForPlatformInputSchema>
): Promise<ActionResult<{
  exportPackage: any;
  integration: PlatformIntegration;
  validation: any;
}>> {
  try {
    // Validate input
    const validatedInput = ExportForPlatformInputSchema.parse(input);

    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get export service
    const exportService = getMultiFormatExportService();

    // Export for platform
    const result = await exportService.exportForPlatform(userId, validatedInput.platform);

    return {
      success: true,
      data: result,
      message: `Successfully exported schema data for ${validatedInput.platform}`,
    };
  } catch (error) {
    console.error('Error exporting for platform:', error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to export for platform',
    };
  }
}

/**
 * Generates an export summary report
 */
export async function generateExportSummary(
  exportResult: ExportResult
): Promise<ActionResult<string>> {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get export service
    const exportService = getMultiFormatExportService();

    // Generate summary
    const summary = await exportService.generateExportSummary(userId, exportResult);

    return {
      success: true,
      data: summary,
      message: 'Export summary generated successfully',
    };
  } catch (error) {
    console.error('Error generating export summary:', error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to generate export summary',
    };
  }
}

/**
 * Gets export history for the current user
 */
export async function getExportHistory(
  limit: number = 10
): Promise<ActionResult<any[]>> {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get repository
    const { AIVisibilityRepository } = await import('@/lib/ai-visibility');
    const repository = new AIVisibilityRepository();

    // Get export records
    const result = await repository.getExportRecords(userId, limit);

    return {
      success: true,
      data: result.items,
      message: `Retrieved ${result.items.length} export records`,
    };
  } catch (error) {
    console.error('Error getting export history:', error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to get export history',
    };
  }
}

/**
 * Downloads export data as a file
 */
export async function downloadExportFile(
  exportId: string,
  format: ExportFormat
): Promise<ActionResult<{
  content: string;
  filename: string;
  mimeType: string;
}>> {
  try {
    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get repository
    const { AIVisibilityRepository } = await import('@/lib/ai-visibility');
    const repository = new AIVisibilityRepository();

    // Get export records to find the specific export
    const exportRecords = await repository.getExportRecords(userId, 100);
    const exportRecord = exportRecords.items.find(record => record.exportId === exportId);

    if (!exportRecord) {
      return {
        success: false,
        error: 'Export record not found',
      };
    }

    // Re-generate the export (since we don't store the actual content)
    const exportService = getMultiFormatExportService();
    const result = await exportService.exportSchemaData(userId, {
      formats: [format],
      includeInstructions: true,
      includePlatformGuides: true,
      validateRDF: false,
      includeMetadata: true,
      compressOutput: false,
    });

    // Get the content for the requested format
    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json-ld':
        content = result.package.jsonLD;
        filename = `schema-markup-${exportId}.json`;
        mimeType = 'application/ld+json';
        break;
      case 'rdf-xml':
        content = result.package.rdfXML;
        filename = `schema-markup-${exportId}.rdf`;
        mimeType = 'application/rdf+xml';
        break;
      case 'turtle':
        content = result.package.turtle;
        filename = `schema-markup-${exportId}.ttl`;
        mimeType = 'text/turtle';
        break;
      case 'microdata':
        content = result.package.microdata;
        filename = `schema-markup-${exportId}.html`;
        mimeType = 'text/html';
        break;
      default:
        return {
          success: false,
          error: 'Unsupported export format',
        };
    }

    return {
      success: true,
      data: {
        content,
        filename,
        mimeType,
      },
      message: `Export file prepared for download`,
    };
  } catch (error) {
    console.error('Error downloading export file:', error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to prepare export file for download',
    };
  }
}

/**
 * Validates export configuration before export
 */
export async function validateExportConfiguration(
  input: z.infer<typeof ExportSchemaDataInputSchema>
): Promise<ActionResult<{
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
}>> {
  try {
    // Validate input schema
    const validatedInput = ExportSchemaDataInputSchema.parse(input);

    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for potential issues
    if (validatedInput.formats.length > 3) {
      warnings.push('Exporting many formats may increase processing time');
    }

    if (validatedInput.validateRDF && !validatedInput.formats.some(f => f === 'rdf-xml' || f === 'turtle')) {
      suggestions.push('RDF validation is enabled but no RDF formats selected');
    }

    if (!validatedInput.includeInstructions) {
      warnings.push('Implementation instructions will not be included');
    }

    if (!validatedInput.includePlatformGuides) {
      warnings.push('Platform-specific guides will not be included');
    }

    // Check custom namespaces
    if (validatedInput.customNamespaces) {
      const namespaceCount = Object.keys(validatedInput.customNamespaces).length;
      if (namespaceCount > 10) {
        warnings.push('Many custom namespaces may increase file size');
      }
    }

    return {
      success: true,
      data: {
        isValid: true,
        warnings,
        suggestions,
      },
      message: 'Export configuration validated',
    };
  } catch (error) {
    console.error('Error validating export configuration:', error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Invalid configuration: ${error.errors.map(e => e.message).join(', ')}`,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: 'Failed to validate export configuration',
    };
  }
}