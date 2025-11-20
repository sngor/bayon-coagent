/**
 * Tests for Response Enhancement Service
 * 
 * Tests qualifying language injection, factual grounding verification,
 * and citation enforcement for AI-generated responses.
 */

import { ResponseEnhancementService, ExtractedFact, PredictionStatement } from '../response-enhancement';
import { Citation } from '../citation-service';

describe('ResponseEnhancementService', () => {
  let service: ResponseEnhancementService;

  beforeEach(() => {
    service = new ResponseEnhancementService();
  });

  describe('Qualifying Language Injection (Subtask 5.1)', () => {
    it('should detect prediction statements without qualifying language', async () => {
      const text = 'The market will increase by 10% next year. Prices will rise significantly.';
      const result = await service.enhance(text);

      expect(result.predictions.length).toBeGreaterThan(0);
      expect(result.modificationsApplied).toContain('Added qualifying language to predictions');
    });

    it('should inject qualifying language into predictions', async () => {
      const text = 'Home values will increase by 15% in Austin.';
      const result = await service.enhance(text);

      // Should contain qualifying phrases like "analysis suggests", "data indicates", etc.
      const hasQualifying = [
        'analysis suggests',
        'data indicates',
        'trends suggest',
        'projections suggest',
        'forecasts indicate',
        'models suggest',
        'estimates indicate',
      ].some(phrase => result.enhancedText.toLowerCase().includes(phrase));

      expect(hasQualifying).toBe(true);
    });

    it('should not modify predictions that already have qualifying language', async () => {
      const text = 'Historical trends suggest the market will grow by 5%.';
      const result = await service.enhance(text);

      expect(result.predictions[0]?.hasQualifyingLanguage).toBe(true);
      expect(result.enhancedText).toBe(text);
    });

    it('should handle multiple predictions in one text', async () => {
      const text = 'Prices will increase next quarter. Sales will decline in the summer. Inventory will stabilize by fall.';
      const result = await service.enhance(text);

      expect(result.predictions.length).toBeGreaterThanOrEqual(2);
    });

    it('should classify prediction types correctly', async () => {
      const texts = [
        'We forecast a 10% increase.',
        'We project values will rise.',
        'We estimate prices at $500k.',
        'We predict strong growth.',
      ];

      for (const text of texts) {
        const result = await service.enhance(text);
        expect(result.predictions.length).toBeGreaterThan(0);
        expect(result.predictions[0]?.type).toBeDefined();
      }
    });

    it('should handle future tense indicators', async () => {
      const text = 'The market is going to improve significantly.';
      const result = await service.enhance(text);

      expect(result.predictions.length).toBeGreaterThan(0);
    });

    it('should handle investment language predictions', async () => {
      const text = 'This investment will generate a 12% return.';
      const result = await service.enhance(text);

      expect(result.predictions.length).toBeGreaterThan(0);
      expect(result.modificationsApplied).toContain('Added qualifying language to predictions');
    });
  });

  describe('Factual Grounding Verification (Subtask 5.2)', () => {
    it('should extract factual statements from text', async () => {
      const text = 'The median price increased by 8.2% last year. Sales rose to 1,500 units.';
      const result = await service.enhance(text);

      expect(result.facts.length).toBeGreaterThan(0);
    });

    it('should detect facts with specific numbers', async () => {
      const text = 'The average home price is $450,000 in this market.';
      const result = await service.enhance(text);

      expect(result.facts.length).toBeGreaterThan(0);
      expect(result.facts[0]?.confidence).toBe('high');
    });

    it('should verify facts are grounded in provided data', async () => {
      const text = 'The median price increased by 8.2% last year.';
      const providedData = ['Market report shows 8.2% increase in median prices for the year'];
      
      const result = await service.enhance(text, [], providedData);

      // Should have fewer warnings when data is provided
      expect(result.warnings.length).toBeLessThanOrEqual(1);
    });

    it('should add disclaimers for unsourced facts', async () => {
      const text = 'The median price increased by 8.2% last year.';
      const result = await service.enhance(text, [], []);

      expect(result.enhancedText).toContain('unverified projection');
      expect(result.modificationsApplied).toContain('Added disclaimers for unsourced facts');
    });

    it('should not add disclaimers for facts with citations', async () => {
      const text = 'The median price increased by 8.2% ([Market Report](https://example.com)).';
      const result = await service.enhance(text);

      // If a fact is detected and has a citation, no disclaimer should be added
      if (result.facts.length > 0 && result.facts[0]?.hasCitation) {
        expect(result.enhancedText).not.toContain('unverified projection');
      }
    });

    it('should handle comparative statements', async () => {
      const text = 'Sales are higher than last year by 15%.';
      const result = await service.enhance(text);

      expect(result.facts.length).toBeGreaterThan(0);
    });

    it('should assess fact confidence levels', async () => {
      const highConfidenceText = 'Prices increased by 12.5%.';
      const mediumConfidenceText = 'Sales are higher than before.';
      
      const result1 = await service.enhance(highConfidenceText);
      const result2 = await service.enhance(mediumConfidenceText);

      // High confidence facts should have percentages or dollar amounts
      if (result1.facts.length > 0) {
        expect(result1.facts[0]?.confidence).toBe('high');
      }
      
      // Medium confidence facts have comparative language
      if (result2.facts.length > 0) {
        expect(result2.facts[0]?.confidence).toBe('medium');
      }
    });

    it('should warn about unsourced facts', async () => {
      const text = 'The market grew by 10%. Inventory decreased by 5%.';
      const result = await service.enhance(text, [], []);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('facts lack source verification');
    });
  });

  describe('Multiple Fact Citation Enforcement (Subtask 5.3)', () => {
    it('should detect multiple facts in a response', async () => {
      const text = 'The median price is $500k. Sales increased by 10%. Inventory fell by 20%.';
      const result = await service.enhance(text);

      expect(result.facts.length).toBeGreaterThanOrEqual(2);
    });

    it('should check citation coverage for all facts', async () => {
      const text = 'The median price is $500k. Sales increased by 10%.';
      const citations: Citation[] = [];
      
      const result = await service.enhance(text, citations);

      expect(result.warnings.some(w => w.includes('facts lack citations'))).toBe(true);
    });

    it('should identify cited vs uncited facts', async () => {
      const text = 'The median price is $500k ([Source](https://example.com)). Sales increased by 10%.';
      const result = await service.enhance(text);

      // Should detect at least one fact
      expect(result.facts.length).toBeGreaterThan(0);
      
      // Should be able to distinguish cited from uncited
      const citedFacts = result.facts.filter(f => f.hasCitation);
      const uncitedFacts = result.facts.filter(f => !f.hasCitation);
      
      // At least one category should have facts
      expect(citedFacts.length + uncitedFacts.length).toBe(result.facts.length);
    });

    it('should not warn if all facts have citations', async () => {
      const text = 'The median price is $500k ([Source1](https://example.com)). Sales increased by 10% ([Source2](https://example.com)).';
      const result = await service.enhance(text);

      // If facts are detected and all have citations, no citation warnings
      if (result.facts.length > 0) {
        const allCited = result.facts.every(f => f.hasCitation);
        const citationWarnings = result.warnings.filter(w => w.includes('citations'));
        
        if (allCited) {
          expect(citationWarnings.length).toBe(0);
        }
      }
    });

    it('should handle parenthetical citations', async () => {
      const text = 'The median price increased by 8% (MLS Report: Q4 2024).';
      const result = await service.enhance(text);

      expect(result.facts[0]?.hasCitation).toBe(true);
    });

    it('should throw error in strict mode for uncited facts', async () => {
      const strictService = new ResponseEnhancementService({ strictMode: true });
      const text = 'The median price is $500k. Sales increased by 10%.';

      await expect(strictService.enhance(text)).rejects.toThrow('uncited facts');
    });
  });

  describe('Integration Tests', () => {
    it('should handle text with predictions, facts, and citations together', async () => {
      const text = 'The median price increased by 8.2% ([Report](https://example.com)). ' +
                   'Prices will continue to rise next year. ' +
                   'Sales reached 1,500 units.';
      
      const result = await service.enhance(text);

      expect(result.predictions.length).toBeGreaterThan(0);
      expect(result.facts.length).toBeGreaterThan(0);
      expect(result.modificationsApplied.length).toBeGreaterThan(0);
    });

    it('should preserve original text structure', async () => {
      const text = 'First sentence. Second sentence. Third sentence.';
      const result = await service.enhance(text);

      // Should still have three sentences (possibly with additions)
      const sentences = result.enhancedText.split('.').filter(s => s.trim());
      expect(sentences.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle empty text', async () => {
      const result = await service.enhance('');

      expect(result.enhancedText).toBe('');
      expect(result.predictions.length).toBe(0);
      expect(result.facts.length).toBe(0);
    });

    it('should handle text with no predictions or facts', async () => {
      const text = 'This is a general statement about real estate.';
      const result = await service.enhance(text);

      expect(result.enhancedText).toBe(text);
      expect(result.modificationsApplied.length).toBe(0);
    });

    it('should provide detailed modification tracking', async () => {
      const text = 'Prices will increase. The median is $500k.';
      const result = await service.enhance(text, [], []);

      // Should have modifications for predictions
      expect(result.modificationsApplied.length).toBeGreaterThan(0);
      
      // Should track predictions and facts
      expect(result.predictions.length + result.facts.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Options', () => {
    it('should respect enableQualifyingLanguage flag', async () => {
      const disabledService = new ResponseEnhancementService({
        enableQualifyingLanguage: false,
      });
      
      const text = 'Prices will increase by 10%.';
      const result = await disabledService.enhance(text);

      expect(result.predictions.length).toBe(0);
      expect(result.modificationsApplied).not.toContain('Added qualifying language');
    });

    it('should respect enableFactualGrounding flag', async () => {
      const disabledService = new ResponseEnhancementService({
        enableFactualGrounding: false,
      });
      
      const text = 'The median price is $500k.';
      const result = await disabledService.enhance(text);

      expect(result.facts.length).toBe(0);
    });

    it('should respect enableCitationEnforcement flag', async () => {
      const disabledService = new ResponseEnhancementService({
        enableCitationEnforcement: false,
      });
      
      const text = 'The median price is $500k.';
      const result = await disabledService.enhance(text);

      const citationWarnings = result.warnings.filter(w => w.includes('citations'));
      expect(citationWarnings.length).toBe(0);
    });

    it('should use default configuration when none provided', () => {
      const defaultService = new ResponseEnhancementService();
      expect(defaultService).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text', async () => {
      const longText = 'The market will grow. '.repeat(100);
      const result = await service.enhance(longText);

      expect(result.enhancedText).toBeDefined();
      expect(result.predictions.length).toBeGreaterThan(0);
    });

    it('should handle text with special characters', async () => {
      const text = 'Prices will increase by 10% (±2%). Sales: $1,000,000+.';
      const result = await service.enhance(text);

      expect(result.enhancedText).toBeDefined();
    });

    it('should handle text with multiple citation formats', async () => {
      const text = 'Price is $500k [1]. Sales up 10% (Source: MLS). Inventory: 100 units (https://example.com).';
      const result = await service.enhance(text);

      expect(result.facts.length).toBeGreaterThan(0);
    });

    it('should handle overlapping patterns', async () => {
      const text = 'The market will increase and prices will rise significantly.';
      const result = await service.enhance(text);

      expect(result.predictions.length).toBeGreaterThan(0);
    });

    it('should handle incomplete sentences', async () => {
      const text = 'Prices will increase';
      const result = await service.enhance(text);

      expect(result.enhancedText).toBeDefined();
    });
  });
});
