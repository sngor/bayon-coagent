/**
 * Response Enhancement Layer
 * 
 * This module provides post-processing capabilities for AI-generated responses:
 * 1. Qualifying language injection for predictions/forecasts
 * 2. Factual grounding verification
 * 3. Multiple fact citation enforcement
 * 
 * Requirements: 1.5, 2.1, 2.3, 2.4
 */

import { Citation } from './citation-service';

/**
 * Configuration for response enhancement
 */
export interface ResponseEnhancementConfig {
  enableQualifyingLanguage: boolean;
  enableFactualGrounding: boolean;
  enableCitationEnforcement: boolean;
  strictMode: boolean; // If true, reject responses that don't meet criteria
}

/**
 * Result of response enhancement processing
 */
export interface EnhancementResult {
  enhancedText: string;
  modificationsApplied: string[];
  warnings: string[];
  facts: ExtractedFact[];
  predictions: PredictionStatement[];
}

/**
 * Represents a factual statement extracted from text
 */
export interface ExtractedFact {
  text: string;
  startIndex: number;
  endIndex: number;
  hasCitation: boolean;
  citationId?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Represents a prediction or forecast statement
 */
export interface PredictionStatement {
  text: string;
  startIndex: number;
  endIndex: number;
  hasQualifyingLanguage: boolean;
  type: 'prediction' | 'forecast' | 'projection' | 'estimate';
}

/**
 * Patterns for detecting prediction/forecast statements
 */
const PREDICTION_PATTERNS = [
  // Future tense indicators
  /will (increase|decrease|rise|fall|grow|decline|improve|worsen|reach|hit|exceed)/gi,
  /is (going to|expected to|projected to|forecasted to|anticipated to|likely to)/gi,
  /are (going to|expected to|projected to|forecasted to|anticipated to|likely to)/gi,
  
  // Prediction keywords
  /(predict|forecast|project|estimate|expect|anticipate)s? (that|a|an)?/gi,
  /(future|upcoming|next year|next quarter|coming months?)/gi,
  
  // Market trend predictions
  /(market will|prices will|values will|demand will|supply will)/gi,
  /(trend (suggests|indicates|shows) (that)?.*will)/gi,
  
  // Investment language
  /(return|ROI|appreciation|growth) (will|should|could) (be|reach|exceed)/gi,
  /(investment|property) (will|should|could) (generate|produce|yield)/gi,
];

/**
 * Qualifying language templates to inject
 */
const QUALIFYING_PHRASES = [
  'historical trends suggest',
  'based on current data',
  'market indicators point to',
  'analysis suggests',
  'data indicates',
  'trends aim for',
  'projections suggest',
  'estimates indicate',
];

/**
 * Patterns for detecting factual statements that need citations
 */
const FACTUAL_PATTERNS = [
  // Specific numbers and statistics - percentage patterns
  /\d+(\.\d+)?%/gi,
  /(increase|decrease|growth|decline|change) (of|by) \d+/gi,
  /(median|average|mean) (price|value|cost|income) (is|was|reached) \$?\d+/gi,
  /(price|value|cost) (is|was) \$\d+/gi,
  
  // Market data
  /(sales|listings|inventory|transactions) (increased|decreased|rose|fell) (by|to)/gi,
  /(market|neighborhood|area|region) (has|had) \d+/gi,
  /(sales|inventory|listings) (reached|hit|totaled) \d+/gi,
  
  // Comparative statements
  /(higher|lower|more|less|greater|fewer) than (last|previous) (year|quarter|month)/gi,
  /(compared to|versus|vs\.?) (last|previous)/gi,
  
  // Definitive statements
  /(the (best|worst|highest|lowest|most|least))/gi,
  /(ranked|rated|scored) (number|#)?\d+/gi,
];

/**
 * Response Enhancement Service
 * 
 * Processes AI-generated responses to ensure they meet quality and safety standards
 */
export class ResponseEnhancementService {
  private config: ResponseEnhancementConfig;

  constructor(config: Partial<ResponseEnhancementConfig> = {}) {
    this.config = {
      enableQualifyingLanguage: true,
      enableFactualGrounding: true,
      enableCitationEnforcement: true,
      strictMode: false,
      ...config,
    };
  }

  /**
   * Enhance a response with qualifying language, fact checking, and citation enforcement
   */
  async enhance(
    text: string,
    citations: Citation[] = [],
    providedData: string[] = []
  ): Promise<EnhancementResult> {
    let enhancedText = text;
    const modificationsApplied: string[] = [];
    const warnings: string[] = [];

    // Step 1: Detect and enhance predictions with qualifying language
    let predictions: PredictionStatement[] = [];
    if (this.config.enableQualifyingLanguage) {
      const predictionResult = this.detectPredictions(enhancedText);
      predictions = predictionResult.predictions;
      
      if (predictionResult.needsEnhancement) {
        enhancedText = this.injectQualifyingLanguage(enhancedText, predictions);
        modificationsApplied.push('Added qualifying language to predictions');
      }
    }

    // Step 2: Extract and verify factual statements
    let facts: ExtractedFact[] = [];
    if (this.config.enableFactualGrounding) {
      facts = this.extractFacts(enhancedText);
      
      // Filter out facts that are part of prediction statements (they already have qualifying language)
      const factsNotInPredictions = facts.filter(fact => {
        return !predictions.some(pred => 
          fact.startIndex >= pred.startIndex && fact.endIndex <= pred.endIndex
        );
      });
      
      // Check if facts are grounded in provided data
      const groundingResult = this.verifyFactualGrounding(factsNotInPredictions, providedData, citations);
      
      if (groundingResult.unsourcedFacts.length > 0) {
        enhancedText = this.addUnsourcedDisclaimers(enhancedText, groundingResult.unsourcedFacts);
        modificationsApplied.push('Added disclaimers for unsourced facts');
        warnings.push(`${groundingResult.unsourcedFacts.length} facts lack source verification`);
      }
    }

    // Step 3: Enforce citation presence for facts
    if (this.config.enableCitationEnforcement) {
      const citationResult = this.checkCitationCoverage(facts, citations);
      
      if (citationResult.uncitedFacts.length > 0) {
        warnings.push(`${citationResult.uncitedFacts.length} facts lack citations`);
        
        if (this.config.strictMode) {
          throw new Error(
            `Response contains ${citationResult.uncitedFacts.length} uncited facts. ` +
            'Citations required for all factual statements.'
          );
        }
      }
    }

    return {
      enhancedText,
      modificationsApplied,
      warnings,
      facts,
      predictions,
    };
  }

  /**
   * Detect prediction/forecast statements in text
   */
  private detectPredictions(text: string): {
    predictions: PredictionStatement[];
    needsEnhancement: boolean;
  } {
    const predictions: PredictionStatement[] = [];
    let needsEnhancement = false;

    for (const pattern of PREDICTION_PATTERNS) {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index === undefined) continue;

        // Extract the full sentence containing the prediction
        const sentenceStart = text.lastIndexOf('.', match.index) + 1;
        const sentenceEnd = text.indexOf('.', match.index + match[0].length);
        const fullSentence = text.substring(
          sentenceStart,
          sentenceEnd === -1 ? text.length : sentenceEnd
        ).trim();

        // Check if it already has qualifying language
        const hasQualifying = QUALIFYING_PHRASES.some(phrase =>
          fullSentence.toLowerCase().includes(phrase.toLowerCase())
        );

        predictions.push({
          text: fullSentence,
          startIndex: sentenceStart,
          endIndex: sentenceEnd === -1 ? text.length : sentenceEnd,
          hasQualifyingLanguage: hasQualifying,
          type: this.classifyPredictionType(match[0]),
        });

        if (!hasQualifying) {
          needsEnhancement = true;
        }
      }
    }

    return { predictions, needsEnhancement };
  }

  /**
   * Classify the type of prediction statement
   */
  private classifyPredictionType(matchText: string): PredictionStatement['type'] {
    const lower = matchText.toLowerCase();
    if (lower.includes('forecast')) return 'forecast';
    if (lower.includes('project')) return 'projection';
    if (lower.includes('estimate')) return 'estimate';
    return 'prediction';
  }

  /**
   * Inject qualifying language into prediction statements
   */
  private injectQualifyingLanguage(
    text: string,
    predictions: PredictionStatement[]
  ): string {
    let enhancedText = text;
    let offset = 0;

    // Sort predictions by start index to process in order
    const sortedPredictions = [...predictions].sort((a, b) => a.startIndex - b.startIndex);

    for (const prediction of sortedPredictions) {
      if (prediction.hasQualifyingLanguage) continue;

      // Select an appropriate qualifying phrase
      const qualifyingPhrase = this.selectQualifyingPhrase(prediction.type);
      
      // Find the best insertion point (usually after the subject, before the verb)
      const insertionPoint = this.findInsertionPoint(prediction.text);
      const adjustedStart = prediction.startIndex + offset;
      const adjustedInsertionPoint = adjustedStart + insertionPoint;

      // Insert the qualifying phrase
      const before = enhancedText.substring(0, adjustedInsertionPoint);
      const after = enhancedText.substring(adjustedInsertionPoint);
      enhancedText = `${before}${qualifyingPhrase}, ${after}`;
      
      offset += qualifyingPhrase.length + 2; // +2 for ", "
    }

    return enhancedText;
  }

  /**
   * Select an appropriate qualifying phrase based on prediction type
   */
  private selectQualifyingPhrase(type: PredictionStatement['type']): string {
    const phrases = {
      prediction: ['analysis suggests', 'data indicates', 'trends suggest'],
      forecast: ['projections suggest', 'forecasts indicate', 'models suggest'],
      projection: ['projections indicate', 'estimates suggest', 'data projects'],
      estimate: ['estimates indicate', 'analysis suggests', 'calculations suggest'],
    };

    const options = phrases[type];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Find the best insertion point for qualifying language
   */
  private findInsertionPoint(sentence: string): number {
    // Look for common verb patterns where we can insert qualifying language
    const verbPatterns = [
      /\b(will|should|could|may|might)\b/i,
      /\b(is|are|was|were)\s+(going to|expected to|projected to)/i,
    ];

    for (const pattern of verbPatterns) {
      const match = sentence.match(pattern);
      if (match && match.index !== undefined) {
        return match.index;
      }
    }

    // Default: insert at the beginning
    return 0;
  }

  /**
   * Extract factual statements from text
   */
  private extractFacts(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const processedRanges = new Set<string>();

    for (const pattern of FACTUAL_PATTERNS) {
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        if (match.index === undefined) continue;

        // Extract the full sentence containing the fact
        let sentenceStart = text.lastIndexOf('.', match.index);
        sentenceStart = sentenceStart === -1 ? 0 : sentenceStart + 1;
        
        // Find the end of the sentence, accounting for citations
        let sentenceEnd = match.index + match[0].length;
        
        // Look for citation patterns after the match
        const remainingText = text.substring(sentenceEnd);
        const citationMatch = remainingText.match(/^\s*(\([^)]+\)|\[[^\]]+\]\([^)]+\))/);
        
        if (citationMatch) {
          // Include the citation in the sentence
          sentenceEnd += citationMatch[0].length;
        }
        
        // Now find the actual sentence end (period)
        const periodIndex = text.indexOf('.', sentenceEnd);
        const endIndex = periodIndex === -1 ? text.length : periodIndex;
        
        // Avoid duplicate facts from overlapping patterns
        const rangeKey = `${sentenceStart}-${endIndex}`;
        if (processedRanges.has(rangeKey)) continue;
        processedRanges.add(rangeKey);

        const fullSentence = text.substring(sentenceStart, endIndex).trim();

        // Check if the sentence has a citation (look for markdown links or parenthetical citations)
        const hasCitation = /\[.*?\]\(.*?\)|\([^)]*:.*?\)/.test(fullSentence);

        facts.push({
          text: fullSentence,
          startIndex: sentenceStart,
          endIndex,
          hasCitation,
          confidence: this.assessFactConfidence(fullSentence),
        });
      }
    }

    return facts;
  }

  /**
   * Assess confidence level of a factual statement
   */
  private assessFactConfidence(factText: string): ExtractedFact['confidence'] {
    // High confidence: specific percentages (check first, before comparative words)
    if (/\d+(\.\d+)?%/.test(factText)) {
      return 'high';
    }
    
    // High confidence: specific dollar amounts
    if (/\$\d+[,\d]*/.test(factText)) {
      return 'high';
    }

    // Medium confidence: comparative statements, trends, or numbers without percentages
    if (/(higher|lower|more|less|increased|decreased|rose|fell)/i.test(factText)) {
      return 'medium';
    }

    // Low confidence: general statements
    return 'low';
  }

  /**
   * Verify that facts are grounded in provided data or citations
   */
  private verifyFactualGrounding(
    facts: ExtractedFact[],
    providedData: string[],
    citations: Citation[]
  ): {
    groundedFacts: ExtractedFact[];
    unsourcedFacts: ExtractedFact[];
  } {
    const groundedFacts: ExtractedFact[] = [];
    const unsourcedFacts: ExtractedFact[] = [];

    for (const fact of facts) {
      // Check if fact has a citation
      if (fact.hasCitation) {
        groundedFacts.push(fact);
        continue;
      }

      // Check if fact content appears in provided data
      const isGrounded = providedData.some(data =>
        this.isFactGroundedInData(fact.text, data)
      );

      if (isGrounded) {
        groundedFacts.push(fact);
      } else {
        unsourcedFacts.push(fact);
      }
    }

    return { groundedFacts, unsourcedFacts };
  }

  /**
   * Check if a fact is grounded in provided data
   */
  private isFactGroundedInData(factText: string, data: string): boolean {
    // Extract key numbers and terms from the fact
    const numbers = factText.match(/\d+(\.\d+)?/g) || [];
    const keyTerms = factText
      .toLowerCase()
      .match(/\b(increase|decrease|median|average|price|sales|market)\b/g) || [];

    // Check if the data contains the same numbers and related terms
    const dataLower = data.toLowerCase();
    const hasNumbers = numbers.some(num => dataLower.includes(num));
    const hasTerms = keyTerms.some(term => dataLower.includes(term));

    return hasNumbers && hasTerms;
  }

  /**
   * Add disclaimers for unsourced facts
   */
  private addUnsourcedDisclaimers(
    text: string,
    unsourcedFacts: ExtractedFact[]
  ): string {
    if (unsourcedFacts.length === 0) return text;
    
    let enhancedText = text;
    let offset = 0;

    // Sort by start index to process in order
    const sortedFacts = [...unsourcedFacts].sort((a, b) => a.startIndex - b.startIndex);

    for (const fact of sortedFacts) {
      const disclaimer = ' (unverified projection based on general industry trends)';
      const adjustedEnd = fact.endIndex + offset;

      const before = enhancedText.substring(0, adjustedEnd);
      const after = enhancedText.substring(adjustedEnd);
      enhancedText = `${before}${disclaimer}${after}`;
      
      offset += disclaimer.length;
    }

    return enhancedText;
  }

  /**
   * Check citation coverage for facts
   */
  private checkCitationCoverage(
    facts: ExtractedFact[],
    citations: Citation[]
  ): {
    citedFacts: ExtractedFact[];
    uncitedFacts: ExtractedFact[];
  } {
    const citedFacts: ExtractedFact[] = [];
    const uncitedFacts: ExtractedFact[] = [];

    for (const fact of facts) {
      if (fact.hasCitation) {
        citedFacts.push(fact);
      } else {
        uncitedFacts.push(fact);
      }
    }

    return { citedFacts, uncitedFacts };
  }
}

/**
 * Default configuration for response enhancement
 */
export const DEFAULT_ENHANCEMENT_CONFIG: ResponseEnhancementConfig = {
  enableQualifyingLanguage: true,
  enableFactualGrounding: true,
  enableCitationEnforcement: true,
  strictMode: false,
};
