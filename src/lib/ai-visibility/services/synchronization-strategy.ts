/**
 * Synchronization Strategy Pattern
 * Handles different synchronization approaches based on change type and risk level
 */

import type { 
  ProfileChangeEvent, 
  SynchronizationResult, 
  ImpactAnalysis
} from '../types/synchronization.types';
import type { 
  SchemaMarkup, 
  KnowledgeGraphEntity, 
  ValidationResult,
  ExportFormat
} from '../types';
import { generateAgentProfileSchema } from '@/lib/aeo/schema-generator';
import { knowledgeGraphBuilder } from './knowledge-graph-builder';
import { PerformanceOptimizer } from './performance-optimizer';
import { 
  ValidationError, 
  HighRiskChangeError,
  SynchronizationErrorHandler 
} from '../errors/synchronization-errors';

// Enhanced context interface
interface SynchronizationContext {
  readonly changeEvent: ProfileChangeEvent;
  readonly impactAnalysis: ImpactAnalysis;
  readonly repository: any; // AIVisibilityRepository
  rollbackData?: any;
  updatedEntities: KnowledgeGraphEntity[];
  updatedSchemas: SchemaMarkup[];
  validationResults: ValidationResult[];
  exportedFormats: Record<ExportFormat, string>;
  
  // Performance tracking methods
  startPhase(phase: string): void;
  recordAPICall(service: string, operation: string, duration: number, success: boolean, retryCount?: number): void;
  getPhaseMetrics(): Record<string, number>;
  getAPICallMetrics(): any[];
  buildSuccessResult(): SynchronizationResult;
  buildErrorResult(error: unknown): SynchronizationResult;
}

export interface SynchronizationStrategy {
  canHandle(changeEvent: ProfileChangeEvent, impactAnalysis: ImpactAnalysis): boolean;
  execute(context: SynchronizationContext): Promise<SynchronizationResult>;
}

export class LowRiskSynchronizationStrategy implements SynchronizationStrategy {
  canHandle(changeEvent: ProfileChangeEvent, impactAnalysis: ImpactAnalysis): boolean {
    return impactAnalysis.riskLevel === 'low';
  }

  async execute(context: SynchronizationContext): Promise<SynchronizationResult> {
    try {
      // Fast path for low-risk changes
      context.startPhase('entity_update');
      await this.executeBasicUpdates(context);
      
      context.startPhase('validation');
      await this.executeValidation(context);
      
      context.startPhase('storage');
      await this.saveUpdates(context);
      
      return context.buildSuccessResult();
    } catch (error) {
      throw SynchronizationErrorHandler.handle(error, {
        strategy: 'low-risk',
        changeId: context.changeEvent.changeId
      });
    }
  }

  private async executeBasicUpdates(context: SynchronizationContext): Promise<void> {
    const { changeEvent } = context;
    const { updatedProfile, changedFields } = changeEvent;

    // Generate updated schemas only for affected types
    const { affectedSchemas } = PerformanceOptimizer.analyzeAffectedComponents(changedFields);
    
    if (affectedSchemas.size > 0) {
      const profileSchemas = generateAgentProfileSchema({
        name: updatedProfile.name || '',
        agencyName: updatedProfile.agencyName,
        jobTitle: 'Real Estate Agent',
        address: updatedProfile.address,
        phone: updatedProfile.phone,
        email: updatedProfile.email,
        website: updatedProfile.website,
        socialMedia: {
          linkedin: updatedProfile.linkedin,
          twitter: updatedProfile.twitter,
          facebook: updatedProfile.facebook,
          instagram: updatedProfile.instagram
        }
      });

      context.updatedSchemas = profileSchemas;
    }

    // Basic entity updates for low-risk changes
    if (changedFields.includes('name') || changedFields.includes('bio')) {
      const agentEntity = knowledgeGraphBuilder.buildAgentEntity({
        userId: changeEvent.userId,
        agentName: updatedProfile.name,
        name: updatedProfile.name,
        email: updatedProfile.email,
        bio: updatedProfile.bio,
        specialization: updatedProfile.specializations,
        primaryMarket: updatedProfile.address,
        preferredTone: 'professional',
        agentType: 'residential',
        corePrinciple: 'client-focused',
        role: 'Real Estate Agent'
      } as any);

      if (agentEntity) {
        context.updatedEntities = [agentEntity];
      }
    }
  }

  private async executeValidation(context: SynchronizationContext): Promise<void> {
    // Basic validation for low-risk changes
    const validationResults = await PerformanceOptimizer.validateBatch(
      context.updatedSchemas,
      async (schema) => this.validateSchema(schema),
      { failFast: false, maxConcurrency: 3 }
    );

    if (!validationResults.isValid) {
      throw new ValidationError('Schema validation failed', validationResults.errors);
    }

    context.validationResults = [{
      isValid: validationResults.isValid,
      errors: validationResults.errors.map(err => ({
        code: 'VALIDATION_ERROR',
        message: err,
        severity: 'error' as const
      })),
      warnings: [],
      suggestions: [],
      validatedAt: new Date(),
      validationDuration: 0
    }];
  }

  private async saveUpdates(context: SynchronizationContext): Promise<void> {
    const { repository, changeEvent } = context;
    
    await repository.saveBatch(changeEvent.userId, {
      schemas: context.updatedSchemas,
      entities: context.updatedEntities
    });
  }

  private async validateSchema(schema: SchemaMarkup): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!schema['@context']) errors.push('Missing @context');
    if (!schema['@type']) errors.push('Missing @type');
    if (!schema.name) errors.push('Missing name property');

    return { isValid: errors.length === 0, errors };
  }
}

export class HighRiskSynchronizationStrategy implements SynchronizationStrategy {
  canHandle(changeEvent: ProfileChangeEvent, impactAnalysis: ImpactAnalysis): boolean {
    return impactAnalysis.riskLevel === 'high' || impactAnalysis.riskLevel === 'critical';
  }

  async execute(context: SynchronizationContext): Promise<SynchronizationResult> {
    try {
      // Comprehensive path for high-risk changes
      context.startPhase('validation');
      await this.executePreSyncValidation(context);
      
      context.startPhase('entity_update');
      await this.executeEntityUpdates(context);
      
      context.startPhase('validation');
      await this.executeComprehensiveValidation(context);
      
      context.startPhase('export');
      await this.executeExportAndSave(context);
      
      context.startPhase('validation');
      await this.executePostSyncValidation(context);
      
      return context.buildSuccessResult();
    } catch (error) {
      // Attempt rollback for high-risk failures
      if (context.rollbackData) {
        try {
          await this.performRollback(context);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }
      }
      
      throw SynchronizationErrorHandler.handle(error, {
        strategy: 'high-risk',
        changeId: context.changeEvent.changeId
      });
    }
  }

  private async executePreSyncValidation(context: SynchronizationContext): Promise<void> {
    // Create comprehensive rollback data
    context.rollbackData = await this.createRollbackData(context);
    
    // Additional risk assessment
    if (context.impactAnalysis.riskLevel === 'critical') {
      throw new HighRiskChangeError(
        context.impactAnalysis.riskLevel,
        context.impactAnalysis.affectedSchemas,
        { changeId: context.changeEvent.changeId }
      );
    }
  }

  private async executeEntityUpdates(context: SynchronizationContext): Promise<void> {
    // Comprehensive entity updates
    const { changeEvent } = context;
    const { updatedProfile, changedFields } = changeEvent;

    // Update all affected entities
    const { affectedEntities } = PerformanceOptimizer.analyzeAffectedComponents(changedFields);
    
    for (const entityType of affectedEntities) {
      switch (entityType) {
        case 'agent':
          const agentEntity = knowledgeGraphBuilder.buildAgentEntity({
            userId: changeEvent.userId,
            agentName: updatedProfile.name,
            name: updatedProfile.name,
            email: updatedProfile.email,
            bio: updatedProfile.bio,
            specialization: updatedProfile.specializations,
            primaryMarket: updatedProfile.address,
            preferredTone: 'professional',
            agentType: 'residential',
            corePrinciple: 'client-focused',
            role: 'Real Estate Agent'
          } as any);
          
          if (agentEntity) context.updatedEntities.push(agentEntity);
          break;

        case 'geographic':
          if (changedFields.includes('address') || changedFields.includes('serviceAreas')) {
            const serviceAreas = updatedProfile.serviceAreas || [updatedProfile.address || ''];
            const geoEntities = knowledgeGraphBuilder.createGeographicRelationships(serviceAreas);
            context.updatedEntities.push(...geoEntities);
          }
          break;

        case 'certifications':
          if (changedFields.includes('certifications')) {
            const certifications = Array.isArray(updatedProfile.certifications) 
              ? updatedProfile.certifications 
              : updatedProfile.certifications?.split(',').map(c => c.trim()) || [];
            
            const certEntities = knowledgeGraphBuilder.linkCertifications(certifications, `agent-${changeEvent.userId}`);
            context.updatedEntities.push(...certEntities);
          }
          break;
      }
    }

    // Generate comprehensive schemas
    const profileSchemas = generateAgentProfileSchema({
      name: updatedProfile.name || '',
      agencyName: updatedProfile.agencyName,
      jobTitle: 'Real Estate Agent',
      address: updatedProfile.address,
      phone: updatedProfile.phone,
      email: updatedProfile.email,
      website: updatedProfile.website,
      socialMedia: {
        linkedin: updatedProfile.linkedin,
        twitter: updatedProfile.twitter,
        facebook: updatedProfile.facebook,
        instagram: updatedProfile.instagram
      }
    });

    context.updatedSchemas = profileSchemas;
  }

  private async executeComprehensiveValidation(context: SynchronizationContext): Promise<void> {
    // Comprehensive validation with detailed reporting
    const schemaValidation = await PerformanceOptimizer.validateBatch(
      context.updatedSchemas,
      async (schema) => this.validateSchemaComprehensive(schema),
      { failFast: true, maxConcurrency: 2 }
    );

    if (!schemaValidation.isValid) {
      throw new ValidationError('Comprehensive schema validation failed', schemaValidation.errors);
    }

    context.validationResults = [{
      isValid: schemaValidation.isValid,
      errors: schemaValidation.errors.map(err => ({
        code: 'COMPREHENSIVE_VALIDATION_ERROR',
        message: err,
        severity: 'error' as const
      })),
      warnings: [],
      suggestions: [],
      validatedAt: new Date(),
      validationDuration: 0
    }];
  }

  private async executeExportAndSave(context: SynchronizationContext): Promise<void> {
    // Generate all export formats
    context.exportedFormats = {
      'json-ld': JSON.stringify(context.updatedSchemas, null, 2),
      'rdf-xml': this.convertToRDFXML(context.updatedSchemas),
      'turtle': this.convertToTurtle(context.updatedSchemas),
      'microdata': this.convertToMicrodata(context.updatedSchemas)
    };

    // Save with comprehensive data
    await context.repository.saveBatch(context.changeEvent.userId, {
      schemas: context.updatedSchemas,
      entities: context.updatedEntities,
      exports: context.exportedFormats
    });
  }

  private async executePostSyncValidation(context: SynchronizationContext): Promise<void> {
    // Post-sync validation and monitoring setup
    // This would integrate with the rollback manager for automatic rollback evaluation
  }

  private async createRollbackData(context: SynchronizationContext): Promise<any> {
    const { repository, changeEvent } = context;
    
    return {
      changeId: changeEvent.changeId,
      timestamp: new Date(),
      version: 1,
      previousSchemas: await repository.getSchemas(changeEvent.userId),
      previousEntities: await repository.getEntities(changeEvent.userId),
      previousExports: await repository.getExports(changeEvent.userId)
    };
  }

  private async performRollback(context: SynchronizationContext): Promise<void> {
    if (!context.rollbackData) return;
    
    await context.repository.saveBatch(context.changeEvent.userId, {
      schemas: context.rollbackData.previousSchemas,
      entities: context.rollbackData.previousEntities,
      exports: context.rollbackData.previousExports
    });
  }

  private async validateSchemaComprehensive(schema: SchemaMarkup): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic validation
    if (!schema['@context']) errors.push('Missing @context');
    if (!schema['@type']) errors.push('Missing @type');
    if (!schema.name) errors.push('Missing name property');

    // Type-specific comprehensive validation
    if (schema['@type'] === 'RealEstateAgent') {
      if (!schema.telephone) errors.push('Missing telephone - required for RealEstateAgent');
      if (!schema.address) errors.push('Missing address - required for local SEO');
      if (!schema.url) errors.push('Missing website URL - recommended for visibility');
    }

    return { isValid: errors.length === 0, errors };
  }

  private convertToRDFXML(schemas: SchemaMarkup[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:schema="https://schema.org/">
  <!-- RDF/XML representation of ${schemas.length} schemas -->
</rdf:RDF>`;
  }

  private convertToTurtle(schemas: SchemaMarkup[]): string {
    return `@prefix schema: <https://schema.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .

# Turtle representation of ${schemas.length} schemas`;
  }

  private convertToMicrodata(schemas: SchemaMarkup[]): string {
    return `<!-- Microdata representation of ${schemas.length} schemas -->
<div itemscope itemtype="https://schema.org/RealEstateAgent">
  <!-- Microdata markup would be generated here -->
</div>`;
  }
}

export class SynchronizationStrategyFactory {
  private strategies: SynchronizationStrategy[] = [
    new LowRiskSynchronizationStrategy(),
    new HighRiskSynchronizationStrategy()
  ];

  getStrategy(changeEvent: ProfileChangeEvent, impactAnalysis: ImpactAnalysis): SynchronizationStrategy {
    const strategy = this.strategies.find(s => s.canHandle(changeEvent, impactAnalysis));
    
    if (!strategy) {
      throw new Error(`No synchronization strategy found for risk level: ${impactAnalysis.riskLevel}`);
    }
    
    return strategy;
  }
}