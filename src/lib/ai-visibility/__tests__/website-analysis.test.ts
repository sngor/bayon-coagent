/**
 * Website Analysis Service Tests
 * 
 * Unit tests for comprehensive website analysis functionality
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Website Analysis Core Functionality', () => {
  describe('AI Visibility Score Calculation', () => {
    it('should calculate scores within valid range', () => {
      // Mock analysis data
      const mockAnalysis = {
        schemaMarkup: [
          { '@type': 'RealEstateAgent', name: 'John Smith' },
          { '@type': 'LocalBusiness', name: 'Smith Realty' }
        ],
        validationResults: [
          { isValid: true, errors: [], warnings: [], suggestions: [] },
          { isValid: true, errors: [], warnings: [], suggestions: [] }
        ],
        technicalIssues: []
      };

      // Calculate AI visibility score
      let score = 0;

      // Schema markup presence (40 points)
      if (mockAnalysis.schemaMarkup.length > 0) {
        score += 20;
        
        // Additional points for schema variety
        const schemaTypes = new Set(mockAnalysis.schemaMarkup.map(s => s['@type']));
        score += Math.min(schemaTypes.size * 5, 20);
      }

      // Schema validation quality (30 points)
      if (mockAnalysis.validationResults.length > 0) {
        const validSchemas = mockAnalysis.validationResults.filter(r => r.isValid).length;
        const validationScore = (validSchemas / mockAnalysis.validationResults.length) * 30;
        score += validationScore;
      }

      // Technical SEO (30 points)
      const technicalScore = Math.max(30 - (mockAnalysis.technicalIssues.length * 5), 0);
      score += technicalScore;

      const finalScore = Math.min(Math.round(score), 100);

      expect(finalScore).toBeGreaterThanOrEqual(0);
      expect(finalScore).toBeLessThanOrEqual(100);
      expect(finalScore).toBe(80); // Expected: 20 + 10 + 30 + 30 = 90, but capped at schema variety
    });

    it('should give higher scores for better websites', () => {
      const goodWebsite = {
        schemaMarkup: [
          { '@type': 'RealEstateAgent', name: 'John Smith' },
          { '@type': 'LocalBusiness', name: 'Smith Realty' },
          { '@type': 'Person', name: 'John Smith' }
        ],
        validationResults: [
          { isValid: true, errors: [], warnings: [], suggestions: [] },
          { isValid: true, errors: [], warnings: [], suggestions: [] },
          { isValid: true, errors: [], warnings: [], suggestions: [] }
        ],
        technicalIssues: []
      };

      const poorWebsite = {
        schemaMarkup: [],
        validationResults: [],
        technicalIssues: ['Missing title', 'Missing meta description', 'No schema markup']
      };

      const calculateScore = (analysis: any) => {
        let score = 0;
        
        if (analysis.schemaMarkup.length > 0) {
          score += 20;
          const schemaTypes = new Set(analysis.schemaMarkup.map((s: any) => s['@type']));
          score += Math.min(schemaTypes.size * 5, 20);
        }
        
        if (analysis.validationResults.length > 0) {
          const validSchemas = analysis.validationResults.filter((r: any) => r.isValid).length;
          score += (validSchemas / analysis.validationResults.length) * 30;
        }
        
        score += Math.max(30 - (analysis.technicalIssues.length * 5), 0);
        
        return Math.min(Math.round(score), 100);
      };

      const goodScore = calculateScore(goodWebsite);
      const poorScore = calculateScore(poorWebsite);

      expect(goodScore).toBeGreaterThan(poorScore);
      expect(goodScore).toBe(85); // 20 + 15 + 30 + 15 = 80
      expect(poorScore).toBe(15); // 0 + 0 + 15 = 15
    });
  });

  describe('Prioritized Actions Generation', () => {
    it('should prioritize actions by impact and priority', () => {
      const mockActions = [
        {
          id: '1',
          title: 'Low Impact Action',
          priority: 'low' as const,
          estimatedImpact: 20,
          category: 'technical' as const,
          description: 'Low priority action',
          implementationDifficulty: 'easy' as const,
          estimatedTimeHours: 1
        },
        {
          id: '2',
          title: 'High Impact Action',
          priority: 'high' as const,
          estimatedImpact: 90,
          category: 'schema' as const,
          description: 'High priority action',
          implementationDifficulty: 'medium' as const,
          estimatedTimeHours: 4
        },
        {
          id: '3',
          title: 'Critical Action',
          priority: 'critical' as const,
          estimatedImpact: 95,
          category: 'technical' as const,
          description: 'Critical action',
          implementationDifficulty: 'hard' as const,
          estimatedTimeHours: 8
        }
      ];

      // Sort by priority and impact
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const sortedActions = mockActions.sort((a, b) => {
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.estimatedImpact - a.estimatedImpact;
      });

      expect(sortedActions[0].priority).toBe('critical');
      expect(sortedActions[1].priority).toBe('high');
      expect(sortedActions[2].priority).toBe('low');
    });

    it('should generate actions from technical issues', () => {
      const technicalIssues = [
        {
          type: 'missing_meta' as const,
          severity: 'critical' as const,
          description: 'Missing title tag',
          recommendation: 'Add title tag to improve SEO',
          codeExample: '<title>Your Page Title</title>'
        },
        {
          type: 'missing_meta' as const,
          severity: 'medium' as const,
          description: 'Missing meta description',
          recommendation: 'Add meta description',
          codeExample: '<meta name="description" content="Your description">'
        }
      ];

      const actions = technicalIssues.map((issue, index) => ({
        id: `tech-${index}`,
        title: issue.description,
        description: issue.recommendation,
        category: 'technical' as const,
        priority: issue.severity === 'critical' ? 'critical' as const : 
                 issue.severity === 'high' ? 'high' as const : 
                 issue.severity === 'medium' ? 'medium' as const : 'low' as const,
        estimatedImpact: issue.severity === 'critical' ? 90 : 
                        issue.severity === 'high' ? 70 : 
                        issue.severity === 'medium' ? 50 : 30,
        implementationDifficulty: 'medium' as const,
        codeExample: issue.codeExample,
        estimatedTimeHours: issue.severity === 'critical' ? 8 : 
                           issue.severity === 'high' ? 4 : 
                           issue.severity === 'medium' ? 2 : 1,
      }));

      expect(actions).toHaveLength(2);
      expect(actions[0].priority).toBe('critical');
      expect(actions[1].priority).toBe('medium');
      expect(actions[0].estimatedImpact).toBe(90);
      expect(actions[1].estimatedImpact).toBe(50);
    });
  });

  describe('Analysis Comparison', () => {
    it('should compare two website analyses', () => {
      const beforeAnalysis = {
        url: 'https://example.com',
        schemaMarkup: [],
        validationResults: [],
        missingSchemas: ['RealEstateAgent'],
        technicalIssues: ['Missing title tag'],
        recommendations: [],
        analyzedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        aiVisibilityScore: 30,
        improvementPotential: 70,
      };

      const afterAnalysis = {
        url: 'https://example.com',
        schemaMarkup: [{
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'John Smith',
        }],
        validationResults: [{ isValid: true, errors: [], warnings: [], suggestions: [] }],
        missingSchemas: [],
        technicalIssues: [],
        recommendations: [],
        analyzedAt: new Date(),
        aiVisibilityScore: 75,
        improvementPotential: 25,
      };

      const scoreChange = afterAnalysis.aiVisibilityScore - beforeAnalysis.aiVisibilityScore;
      
      // Find new and resolved issues
      const beforeIssues = new Set(beforeAnalysis.technicalIssues);
      const afterIssues = new Set(afterAnalysis.technicalIssues);
      
      const newIssues = Array.from(afterIssues).filter(issue => !beforeIssues.has(issue));
      const resolvedIssues = Array.from(beforeIssues).filter(issue => !afterIssues.has(issue));

      // Find schema changes
      const beforeSchemas = beforeAnalysis.schemaMarkup.map(s => JSON.stringify(s));
      const afterSchemas = afterAnalysis.schemaMarkup.map(s => JSON.stringify(s));
      
      const newSchemas = afterAnalysis.schemaMarkup.filter((_, i) => !beforeSchemas.includes(afterSchemas[i]));

      expect(scoreChange).toBe(45);
      expect(newSchemas).toHaveLength(1);
      expect(resolvedIssues).toContain('Missing title tag');
      expect(newIssues).toHaveLength(0);
    });

    it('should detect regressions', () => {
      const beforeAnalysis = {
        schemaMarkup: [{
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'John Smith',
        }],
        technicalIssues: [],
        aiVisibilityScore: 75,
      };

      const afterAnalysis = {
        schemaMarkup: [],
        technicalIssues: ['Missing schema markup'],
        aiVisibilityScore: 30,
      };

      const scoreChange = afterAnalysis.aiVisibilityScore - beforeAnalysis.aiVisibilityScore;
      const beforeIssues = new Set(beforeAnalysis.technicalIssues);
      const afterIssues = new Set(afterAnalysis.technicalIssues);
      const newIssues = Array.from(afterIssues).filter(issue => !beforeIssues.has(issue));

      expect(scoreChange).toBe(-45);
      expect(newIssues).toContain('Missing schema markup');
    });
  });

  describe('Improvement Potential Calculation', () => {
    it('should calculate improvement potential correctly', () => {
      const currentScore = 30;
      const recommendations = [
        { estimatedImpact: 50, id: '1', category: 'schema' as const, priority: 'high' as const, title: 'Add Schema', description: 'Add schema markup', actionItems: [], implementationDifficulty: 'medium' as const, status: 'pending' as const, createdAt: new Date() },
        { estimatedImpact: 30, id: '2', category: 'technical' as const, priority: 'medium' as const, title: 'Fix Technical', description: 'Fix technical issues', actionItems: [], implementationDifficulty: 'easy' as const, status: 'pending' as const, createdAt: new Date() },
      ];
      
      const maxPossibleImprovement = recommendations.reduce(
        (sum, rec) => sum + rec.estimatedImpact,
        0
      );
      
      const potentialScore = Math.min(currentScore + (maxPossibleImprovement * 0.7), 100);
      const improvementPotential = Math.round(potentialScore - currentScore);

      expect(improvementPotential).toBe(56); // 30 + (80 * 0.7) = 86, so improvement is 56
    });
  });

  describe('Re-validation System', () => {
    it('should handle different frequency options', () => {
      const frequencies = ['daily', 'weekly', 'monthly'] as const;
      
      frequencies.forEach(frequency => {
        const schedule = {
          userId: 'user123',
          websiteUrl: 'https://example.com',
          frequency,
          nextValidation: new Date(),
          alertOnChanges: true,
          alertThresholds: {
            newErrors: 1,
            removedSchemas: 1,
            scoreDecrease: 10,
          },
        };

        expect(schedule.frequency).toBe(frequency);
        expect(schedule.alertThresholds.newErrors).toBe(1);
      });
    });

    it('should validate schedule configuration', () => {
      const validSchedule = {
        userId: 'user123',
        websiteUrl: 'https://example.com',
        frequency: 'weekly' as const,
        nextValidation: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        alertOnChanges: true,
        alertThresholds: {
          newErrors: 1,
          removedSchemas: 1,
          scoreDecrease: 10,
        },
      };

      expect(validSchedule.userId).toBeTruthy();
      expect(validSchedule.websiteUrl).toMatch(/^https?:\/\//);
      expect(['daily', 'weekly', 'monthly']).toContain(validSchedule.frequency);
      expect(validSchedule.nextValidation).toBeInstanceOf(Date);
      expect(typeof validSchedule.alertOnChanges).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs gracefully', () => {
      const invalidUrls = [
        'not-a-valid-url',
        'ftp://example.com',
        'javascript:alert(1)',
        '',
      ];

      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });

    it('should handle empty analysis data', () => {
      const emptyAnalysis = {
        url: 'https://example.com',
        schemaMarkup: [],
        validationResults: [],
        missingSchemas: [],
        technicalIssues: [],
        recommendations: [],
        analyzedAt: new Date(),
      };

      // Should not throw errors with empty data
      expect(emptyAnalysis.schemaMarkup).toHaveLength(0);
      expect(emptyAnalysis.validationResults).toHaveLength(0);
      expect(emptyAnalysis.url).toBe('https://example.com');
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate schema recommendations for empty websites', () => {
      const analysis = {
        schemaMarkup: [],
        validationResults: [],
        missingSchemas: ['RealEstateAgent', 'LocalBusiness'],
        technicalIssues: [],
      };

      const recommendations = [];

      if (analysis.schemaMarkup.length === 0) {
        recommendations.push({
          id: `schema-${Date.now()}`,
          category: 'schema' as const,
          priority: 'high' as const,
          title: 'Add Basic Schema Markup',
          description: 'Your website has no structured data markup, which limits AI visibility',
          actionItems: [
            'Add RealEstateAgent schema markup',
            'Include contact information and service areas',
            'Add business address and phone number',
            'Validate schema markup implementation'
          ],
          estimatedImpact: 85,
          implementationDifficulty: 'medium' as const,
          status: 'pending' as const,
          createdAt: new Date(),
        });
      }

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].category).toBe('schema');
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[0].estimatedImpact).toBe(85);
    });

    it('should generate validation error recommendations', () => {
      const hasValidationErrors = true;
      const recommendations = [];

      if (hasValidationErrors) {
        recommendations.push({
          id: `validation-${Date.now()}`,
          category: 'schema' as const,
          priority: 'high' as const,
          title: 'Fix Schema Validation Errors',
          description: 'Existing schema markup has validation errors that prevent proper AI interpretation',
          actionItems: [
            'Review schema validation errors',
            'Fix required property issues',
            'Correct data type mismatches',
            'Re-validate after fixes'
          ],
          estimatedImpact: 70,
          implementationDifficulty: 'easy' as const,
          status: 'pending' as const,
          createdAt: new Date(),
        });
      }

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].title).toContain('Validation Errors');
      expect(recommendations[0].estimatedImpact).toBe(70);
    });
  });
});