'use server';

/**
 * Personalization Layer
 * 
 * Provides personalization utilities for AI responses including:
 * - Market prioritization for property suggestions
 * - Specialization-aware content filtering
 * - Tone matching and validation
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Property suggestion with market relevance score
 */
export interface PropertySuggestion {
  id: string;
  address: string;
  city: string;
  state: string;
  market: string;
  propertyType: string;
  price: number;
  features: string[];
  description?: string;
  marketRelevanceScore?: number;
  specializationMatch?: boolean;
}

/**
 * Market prioritization result
 */
export interface MarketPrioritizationResult {
  prioritizedProperties: PropertySuggestion[];
  primaryMarketProperties: PropertySuggestion[];
  secondaryMarketProperties: PropertySuggestion[];
  totalProperties: number;
  primaryMarketCount: number;
}

/**
 * Calculates market relevance score for a property based on agent profile
 * 
 * @param property Property to score
 * @param agentProfile Agent profile with primary market
 * @returns Relevance score (0-100)
 */
export function calculateMarketRelevance(
  property: PropertySuggestion,
  agentProfile: AgentProfile
): number {
  let score = 0;
  
  // Primary market exact match: +50 points
  const primaryMarket = agentProfile.primaryMarket.toLowerCase();
  const propertyMarket = property.market.toLowerCase();
  const propertyCity = property.city.toLowerCase();
  const propertyState = property.state.toLowerCase();
  
  if (propertyMarket === primaryMarket) {
    score += 50;
  } else if (primaryMarket.includes(propertyCity) || primaryMarket.includes(propertyState)) {
    score += 40;
  } else if (propertyCity && primaryMarket.includes(propertyCity)) {
    score += 30;
  } else if (propertyState && primaryMarket.includes(propertyState)) {
    score += 20;
  }
  
  // Specialization match: +30 points
  if (matchesSpecialization(property, agentProfile.specialization)) {
    score += 30;
    property.specializationMatch = true;
  }
  
  // Price range alignment with specialization: +20 points
  if (priceAlignedWithSpecialization(property.price, agentProfile.specialization)) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

/**
 * Checks if property matches agent's specialization
 */
function matchesSpecialization(
  property: PropertySuggestion,
  specialization: AgentProfile['specialization']
): boolean {
  const propertyType = property.propertyType.toLowerCase();
  const features = property.features.map(f => f.toLowerCase());
  const description = (property.description || '').toLowerCase();
  
  switch (specialization) {
    case 'luxury':
      // Luxury indicators: high-end features, premium materials
      const luxuryKeywords = ['luxury', 'premium', 'high-end', 'upscale', 'exclusive', 'gourmet', 'custom', 'designer'];
      return luxuryKeywords.some(keyword => 
        features.some(f => f.includes(keyword)) || description.includes(keyword)
      );
      
    case 'first-time-buyers':
      // First-time buyer indicators: starter homes, affordable, move-in ready
      const starterKeywords = ['starter', 'affordable', 'move-in ready', 'updated', 'turnkey', 'low maintenance'];
      return starterKeywords.some(keyword => 
        features.some(f => f.includes(keyword)) || description.includes(keyword)
      );
      
    case 'investment':
      // Investment indicators: rental potential, cash flow, ROI
      const investmentKeywords = ['rental', 'investment', 'cash flow', 'roi', 'income', 'multi-family', 'duplex', 'triplex'];
      return investmentKeywords.some(keyword => 
        features.some(f => f.includes(keyword)) || description.includes(keyword) || propertyType.includes(keyword)
      );
      
    case 'commercial':
      // Commercial property types
      const commercialTypes = ['commercial', 'office', 'retail', 'industrial', 'warehouse', 'mixed-use'];
      return commercialTypes.some(type => propertyType.includes(type));
      
    case 'general':
      // General matches all
      return true;
      
    default:
      return false;
  }
}

/**
 * Checks if property price aligns with specialization
 */
function priceAlignedWithSpecialization(
  price: number,
  specialization: AgentProfile['specialization']
): boolean {
  switch (specialization) {
    case 'luxury':
      // Luxury typically $1M+
      return price >= 1000000;
      
    case 'first-time-buyers':
      // First-time buyers typically under $400K
      return price < 400000;
      
    case 'investment':
      // Investment properties vary widely, but often under $500K for better ROI
      return price < 500000;
      
    case 'commercial':
      // Commercial varies widely
      return true;
      
    case 'general':
      // General accepts all price ranges
      return true;
      
    default:
      return false;
  }
}

/**
 * Prioritizes property suggestions based on agent's primary market
 * Requirement 3.2: Filter results to prioritize primary market
 * 
 * @param properties Array of property suggestions
 * @param agentProfile Agent profile with primary market
 * @returns Prioritized properties with market relevance scores
 */
export function prioritizeByMarket(
  properties: PropertySuggestion[],
  agentProfile: AgentProfile
): MarketPrioritizationResult {
  // Calculate relevance scores for all properties
  const scoredProperties = properties.map(property => ({
    ...property,
    marketRelevanceScore: calculateMarketRelevance(property, agentProfile),
  }));
  
  // Sort by relevance score (highest first)
  const prioritizedProperties = scoredProperties.sort(
    (a, b) => (b.marketRelevanceScore || 0) - (a.marketRelevanceScore || 0)
  );
  
  // Separate primary market (score >= 40) from secondary market
  const primaryMarketProperties = prioritizedProperties.filter(
    p => (p.marketRelevanceScore || 0) >= 40
  );
  
  const secondaryMarketProperties = prioritizedProperties.filter(
    p => (p.marketRelevanceScore || 0) < 40
  );
  
  return {
    prioritizedProperties,
    primaryMarketProperties,
    secondaryMarketProperties,
    totalProperties: properties.length,
    primaryMarketCount: primaryMarketProperties.length,
  };
}

/**
 * Filters properties to only include those in the agent's primary market
 * 
 * @param properties Array of property suggestions
 * @param agentProfile Agent profile with primary market
 * @param minRelevanceScore Minimum relevance score to include (default: 40)
 * @returns Filtered properties
 */
export function filterByPrimaryMarket(
  properties: PropertySuggestion[],
  agentProfile: AgentProfile,
  minRelevanceScore: number = 40
): PropertySuggestion[] {
  return properties
    .map(property => ({
      ...property,
      marketRelevanceScore: calculateMarketRelevance(property, agentProfile),
    }))
    .filter(property => (property.marketRelevanceScore || 0) >= minRelevanceScore)
    .sort((a, b) => (b.marketRelevanceScore || 0) - (a.marketRelevanceScore || 0));
}

/**
 * Ranks properties by specialization match
 * 
 * @param properties Array of property suggestions
 * @param agentProfile Agent profile with specialization
 * @returns Properties sorted by specialization match
 */
export function rankBySpecialization(
  properties: PropertySuggestion[],
  agentProfile: AgentProfile
): PropertySuggestion[] {
  return properties
    .map(property => ({
      ...property,
      specializationMatch: matchesSpecialization(property, agentProfile.specialization),
    }))
    .sort((a, b) => {
      // Specialization matches first
      if (a.specializationMatch && !b.specializationMatch) return -1;
      if (!a.specializationMatch && b.specializationMatch) return 1;
      
      // Then by price alignment
      const aAligned = priceAlignedWithSpecialization(a.price, agentProfile.specialization);
      const bAligned = priceAlignedWithSpecialization(b.price, agentProfile.specialization);
      if (aAligned && !bAligned) return -1;
      if (!aAligned && bAligned) return 1;
      
      return 0;
    });
}

/**
 * Combines market prioritization and specialization ranking
 * 
 * @param properties Array of property suggestions
 * @param agentProfile Agent profile
 * @returns Fully prioritized properties
 */
export function prioritizeProperties(
  properties: PropertySuggestion[],
  agentProfile: AgentProfile
): PropertySuggestion[] {
  // First, calculate market relevance and specialization match
  const enrichedProperties = properties.map(property => ({
    ...property,
    marketRelevanceScore: calculateMarketRelevance(property, agentProfile),
    specializationMatch: matchesSpecialization(property, agentProfile.specialization),
  }));
  
  // Sort by combined score: market relevance (70%) + specialization (30%)
  return enrichedProperties.sort((a, b) => {
    const aScore = (a.marketRelevanceScore || 0) * 0.7 + (a.specializationMatch ? 30 : 0);
    const bScore = (b.marketRelevanceScore || 0) * 0.7 + (b.specializationMatch ? 30 : 0);
    return bScore - aScore;
  });
}


/**
 * Specialization-aware content generation utilities
 * Requirement 3.3: Reflect agent's specialization and core principle
 */

/**
 * Content context with specialization focus
 */
export interface SpecializationContext {
  specialization: AgentProfile['specialization'];
  corePrinciple: string;
  focusAreas: string[];
  targetAudience: string;
  keyMessages: string[];
}

/**
 * Gets specialization-specific context for content generation
 * 
 * @param agentProfile Agent profile
 * @returns Specialization context
 */
export function getSpecializationContext(
  agentProfile: AgentProfile
): SpecializationContext {
  const contexts: Record<AgentProfile['specialization'], Omit<SpecializationContext, 'specialization' | 'corePrinciple'>> = {
    luxury: {
      focusAreas: [
        'High-end properties and premium amenities',
        'Exclusive neighborhoods and gated communities',
        'Custom features and designer finishes',
        'Privacy, security, and prestige',
        'Concierge-level service and white-glove experience',
      ],
      targetAudience: 'High-net-worth individuals, executives, and luxury home buyers',
      keyMessages: [
        'Exceptional quality and attention to detail',
        'Exclusive access to premium properties',
        'Personalized, discreet service',
        'Investment in lifestyle and prestige',
      ],
    },
    'first-time-buyers': {
      focusAreas: [
        'Affordable starter homes and condos',
        'First-time buyer programs and incentives',
        'Step-by-step guidance through the buying process',
        'Budget-friendly neighborhoods with growth potential',
        'Move-in ready properties and low maintenance options',
      ],
      targetAudience: 'First-time home buyers, young professionals, and growing families',
      keyMessages: [
        'Making homeownership accessible and achievable',
        'Educational support throughout the process',
        'Finding the perfect starter home within budget',
        'Building equity and long-term wealth',
      ],
    },
    investment: {
      focusAreas: [
        'Cash flow positive properties',
        'ROI analysis and market projections',
        'Multi-family and rental properties',
        'Value-add opportunities and fix-and-flip potential',
        'Portfolio diversification strategies',
      ],
      targetAudience: 'Real estate investors, landlords, and portfolio builders',
      keyMessages: [
        'Data-driven investment decisions',
        'Maximizing returns and cash flow',
        'Strategic property acquisition',
        'Long-term wealth building through real estate',
      ],
    },
    commercial: {
      focusAreas: [
        'Office buildings and retail spaces',
        'Industrial and warehouse properties',
        'Mixed-use developments',
        'Lease negotiations and tenant relations',
        'Commercial property valuation and analysis',
      ],
      targetAudience: 'Business owners, commercial investors, and corporate clients',
      keyMessages: [
        'Strategic location and business growth',
        'Professional transaction management',
        'Market expertise and industry knowledge',
        'Maximizing business value through real estate',
      ],
    },
    general: {
      focusAreas: [
        'Residential properties of all types',
        'Diverse neighborhoods and communities',
        'Buyer and seller representation',
        'Market knowledge and local expertise',
        'Comprehensive real estate services',
      ],
      targetAudience: 'Home buyers, sellers, and real estate clients of all types',
      keyMessages: [
        'Versatile expertise across property types',
        'Personalized service for every client',
        'Deep local market knowledge',
        'Trusted guidance through every transaction',
      ],
    },
  };
  
  const context = contexts[agentProfile.specialization];
  
  return {
    specialization: agentProfile.specialization,
    corePrinciple: agentProfile.corePrinciple,
    ...context,
  };
}

/**
 * Injects specialization and core principle into content
 * 
 * @param content Original content
 * @param agentProfile Agent profile
 * @returns Enhanced content with specialization focus
 */
export function injectSpecializationContext(
  content: string,
  agentProfile: AgentProfile
): string {
  const context = getSpecializationContext(agentProfile);
  
  // Check if content already mentions specialization or core principle
  const hasSpecialization = content.toLowerCase().includes(agentProfile.specialization);
  const hasCorePrinciple = content.toLowerCase().includes(
    agentProfile.corePrinciple.toLowerCase().substring(0, 20)
  );
  
  // If both are present, return as-is
  if (hasSpecialization && hasCorePrinciple) {
    return content;
  }
  
  // Otherwise, add a contextual note
  let enhancement = '';
  
  if (!hasSpecialization) {
    enhancement += `\n\nAs a ${agentProfile.specialization} specialist, `;
  }
  
  if (!hasCorePrinciple) {
    enhancement += `I focus on ${agentProfile.corePrinciple.toLowerCase()}. `;
  }
  
  // Insert enhancement at a natural break point (after first paragraph)
  const paragraphs = content.split('\n\n');
  if (paragraphs.length > 1) {
    paragraphs.splice(1, 0, enhancement.trim());
    return paragraphs.join('\n\n');
  }
  
  return content + enhancement;
}

/**
 * Validates that content reflects specialization and core principle
 * 
 * @param content Content to validate
 * @param agentProfile Agent profile
 * @returns Validation result with suggestions
 */
export function validateSpecializationAlignment(
  content: string,
  agentProfile: AgentProfile
): {
  aligned: boolean;
  specializationMentioned: boolean;
  corePrincipleReflected: boolean;
  suggestions: string[];
} {
  const context = getSpecializationContext(agentProfile);
  const lowerContent = content.toLowerCase();
  
  // Check for specialization keywords
  const specializationKeywords = context.focusAreas
    .flatMap(area => area.toLowerCase().split(' '))
    .filter(word => word.length > 4);
  
  const specializationMentioned = specializationKeywords.some(keyword =>
    lowerContent.includes(keyword)
  ) || lowerContent.includes(agentProfile.specialization);
  
  // Check for core principle reflection
  const corePrincipleWords = agentProfile.corePrinciple
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 4);
  
  const corePrincipleReflected = corePrincipleWords.some(word =>
    lowerContent.includes(word)
  );
  
  const aligned = specializationMentioned && corePrincipleReflected;
  
  const suggestions: string[] = [];
  
  if (!specializationMentioned) {
    suggestions.push(
      `Consider mentioning ${agentProfile.specialization} focus or related keywords: ${context.focusAreas[0]}`
    );
  }
  
  if (!corePrincipleReflected) {
    suggestions.push(
      `Consider incorporating the core principle: "${agentProfile.corePrinciple}"`
    );
  }
  
  return {
    aligned,
    specializationMentioned,
    corePrincipleReflected,
    suggestions,
  };
}

/**
 * Generates specialization-specific recommendations
 * 
 * @param agentProfile Agent profile
 * @param context Additional context (e.g., property details, market conditions)
 * @returns Array of recommendations
 */
export function generateSpecializationRecommendations(
  agentProfile: AgentProfile,
  context?: Record<string, any>
): string[] {
  const specializationContext = getSpecializationContext(agentProfile);
  const recommendations: string[] = [];
  
  // Add specialization-specific recommendations
  switch (agentProfile.specialization) {
    case 'luxury':
      recommendations.push(
        'Highlight premium features and exclusive amenities',
        'Emphasize privacy, security, and prestige',
        'Use sophisticated, refined language',
        'Focus on lifestyle and experience, not just property'
      );
      break;
      
    case 'first-time-buyers':
      recommendations.push(
        'Explain the buying process step-by-step',
        'Highlight affordability and value',
        'Mention first-time buyer programs and incentives',
        'Use encouraging, supportive language'
      );
      break;
      
    case 'investment':
      recommendations.push(
        'Include ROI analysis and cash flow projections',
        'Highlight rental potential and market appreciation',
        'Use data-driven, analytical language',
        'Focus on numbers and financial metrics'
      );
      break;
      
    case 'commercial':
      recommendations.push(
        'Emphasize location and business advantages',
        'Include zoning and usage information',
        'Highlight traffic patterns and accessibility',
        'Use professional, business-focused language'
      );
      break;
      
    case 'general':
      recommendations.push(
        'Provide balanced, comprehensive information',
        'Highlight versatility and broad expertise',
        'Use accessible, friendly language',
        'Focus on personalized service'
      );
      break;
  }
  
  // Add core principle-based recommendation
  recommendations.push(
    `Align messaging with core principle: "${agentProfile.corePrinciple}"`
  );
  
  return recommendations;
}

/**
 * Tone matching and validation utilities
 * Requirement 3.4: Use preferred tone in responses
 */

/**
 * Tone characteristics and indicators
 */
export interface ToneProfile {
  tone: AgentProfile['preferredTone'];
  characteristics: string[];
  vocabularyIndicators: string[];
  sentenceStructure: string;
  formalityLevel: 'formal' | 'semi-formal' | 'informal';
  emotionalTone: 'warm' | 'neutral' | 'analytical';
}

/**
 * Tone validation result
 */
export interface ToneValidationResult {
  matches: boolean;
  detectedTone: AgentProfile['preferredTone'] | 'mixed' | 'unknown';
  confidence: number;
  indicators: {
    vocabulary: string[];
    structure: string[];
    formality: string;
  };
  suggestions: string[];
}

/**
 * Gets tone profile for a specific tone preference
 * 
 * @param tone Preferred tone
 * @returns Tone profile with characteristics
 */
export function getToneProfile(tone: AgentProfile['preferredTone']): ToneProfile {
  const profiles: Record<AgentProfile['preferredTone'], ToneProfile> = {
    'warm-consultative': {
      tone: 'warm-consultative',
      characteristics: [
        'Friendly and approachable',
        'Empathetic and understanding',
        'Relationship-focused',
        'Personal and conversational',
        'Supportive and encouraging',
      ],
      vocabularyIndicators: [
        'happy to', 'excited to', 'love to', 'understand', 'help you',
        'together', 'partnership', 'journey', 'guide', 'support',
        'feel', 'care', 'important', 'special', 'perfect for you',
      ],
      sentenceStructure: 'Conversational with personal pronouns (I, we, you)',
      formalityLevel: 'semi-formal',
      emotionalTone: 'warm',
    },
    'direct-data-driven': {
      tone: 'direct-data-driven',
      characteristics: [
        'Factual and analytical',
        'Numbers and statistics focused',
        'Concise and to-the-point',
        'Evidence-based',
        'Objective and professional',
      ],
      vocabularyIndicators: [
        'data shows', 'statistics indicate', 'analysis reveals', 'metrics',
        'percentage', 'increase', 'decrease', 'trend', 'forecast',
        'according to', 'based on', 'evidence', 'research', 'study',
      ],
      sentenceStructure: 'Direct statements with supporting data',
      formalityLevel: 'formal',
      emotionalTone: 'analytical',
    },
    'professional': {
      tone: 'professional',
      characteristics: [
        'Polished and refined',
        'Expertise-focused',
        'Formal and respectful',
        'Industry-standard language',
        'Authoritative yet approachable',
      ],
      vocabularyIndicators: [
        'expertise', 'experience', 'professional', 'comprehensive',
        'strategic', 'optimize', 'ensure', 'facilitate', 'implement',
        'recommend', 'advise', 'specialize', 'dedicated', 'committed',
      ],
      sentenceStructure: 'Well-structured with professional terminology',
      formalityLevel: 'formal',
      emotionalTone: 'neutral',
    },
    'casual': {
      tone: 'casual',
      characteristics: [
        'Approachable and friendly',
        'Conversational and relatable',
        'Easy-going and relaxed',
        'Simple language',
        'Personable and down-to-earth',
      ],
      vocabularyIndicators: [
        'great', 'awesome', 'cool', 'check out', 'take a look',
        'pretty', 'really', 'super', 'totally', 'definitely',
        'hey', 'sure', 'no problem', 'sounds good', 'let\'s',
      ],
      sentenceStructure: 'Short, simple sentences with contractions',
      formalityLevel: 'informal',
      emotionalTone: 'warm',
    },
  };
  
  return profiles[tone];
}

/**
 * Detects the tone of content
 * 
 * @param content Content to analyze
 * @returns Detected tone with confidence
 */
export function detectTone(content: string): {
  tone: AgentProfile['preferredTone'] | 'mixed' | 'unknown';
  confidence: number;
  scores: Record<AgentProfile['preferredTone'], number>;
} {
  const lowerContent = content.toLowerCase();
  const tones: AgentProfile['preferredTone'][] = [
    'warm-consultative',
    'direct-data-driven',
    'professional',
    'casual',
  ];
  
  const scores: Record<AgentProfile['preferredTone'], number> = {
    'warm-consultative': 0,
    'direct-data-driven': 0,
    'professional': 0,
    'casual': 0,
  };
  
  // Score each tone based on vocabulary indicators
  for (const tone of tones) {
    const profile = getToneProfile(tone);
    
    for (const indicator of profile.vocabularyIndicators) {
      if (lowerContent.includes(indicator.toLowerCase())) {
        scores[tone] += 1;
      }
    }
  }
  
  // Find the highest scoring tone
  const maxScore = Math.max(...Object.values(scores));
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  if (maxScore === 0) {
    return { tone: 'unknown', confidence: 0, scores };
  }
  
  // Check if multiple tones have similar high scores (mixed tone)
  const highScoreTones = tones.filter(tone => scores[tone] >= maxScore * 0.8);
  
  if (highScoreTones.length > 1) {
    return {
      tone: 'mixed',
      confidence: maxScore / totalScore,
      scores,
    };
  }
  
  const detectedTone = tones.find(tone => scores[tone] === maxScore)!;
  const confidence = totalScore > 0 ? maxScore / totalScore : 0;
  
  return { tone: detectedTone, confidence, scores };
}

/**
 * Validates that content matches the preferred tone
 * Requirement 3.4: Use preferred tone in responses
 * 
 * @param content Content to validate
 * @param preferredTone Preferred tone from agent profile
 * @returns Validation result with suggestions
 */
export function validateTone(
  content: string,
  preferredTone: AgentProfile['preferredTone']
): ToneValidationResult {
  const detection = detectTone(content);
  const profile = getToneProfile(preferredTone);
  const lowerContent = content.toLowerCase();
  
  // Check if detected tone matches preferred tone
  const matches = detection.tone === preferredTone && detection.confidence >= 0.5;
  
  // Find vocabulary indicators present in content
  const vocabularyIndicators = profile.vocabularyIndicators.filter(indicator =>
    lowerContent.includes(indicator.toLowerCase())
  );
  
  // Analyze sentence structure
  const structureIndicators: string[] = [];
  
  // Check for contractions (casual tone)
  if (content.includes("'")) {
    structureIndicators.push('Uses contractions');
  }
  
  // Check for questions (warm-consultative)
  if (content.includes('?')) {
    structureIndicators.push('Includes questions');
  }
  
  // Check for numbers/data (direct-data-driven)
  if (/\d+%|\$\d+|\d+\.\d+/.test(content)) {
    structureIndicators.push('Includes numerical data');
  }
  
  // Analyze formality
  const formalityIndicators = [
    'furthermore', 'moreover', 'consequently', 'therefore',
    'additionally', 'subsequently', 'accordingly',
  ];
  const hasFormalIndicators = formalityIndicators.some(indicator =>
    lowerContent.includes(indicator)
  );
  
  const formality = hasFormalIndicators ? 'formal' : 
    vocabularyIndicators.length > 0 ? profile.formalityLevel : 'unknown';
  
  // Generate suggestions if tone doesn't match
  const suggestions: string[] = [];
  
  if (!matches) {
    suggestions.push(
      `Content tone (${detection.tone}) doesn't match preferred tone (${preferredTone})`
    );
    
    switch (preferredTone) {
      case 'warm-consultative':
        suggestions.push(
          'Use more personal language (I, we, you)',
          'Add empathetic phrases like "I understand" or "happy to help"',
          'Include relationship-building language'
        );
        break;
        
      case 'direct-data-driven':
        suggestions.push(
          'Include more statistics and data points',
          'Use phrases like "data shows" or "analysis indicates"',
          'Focus on facts and evidence'
        );
        break;
        
      case 'professional':
        suggestions.push(
          'Use more formal, industry-standard terminology',
          'Avoid casual language and contractions',
          'Emphasize expertise and experience'
        );
        break;
        
      case 'casual':
        suggestions.push(
          'Use simpler, more conversational language',
          'Include contractions and friendly phrases',
          'Keep sentences short and approachable'
        );
        break;
    }
  }
  
  return {
    matches,
    detectedTone: detection.tone,
    confidence: detection.confidence,
    indicators: {
      vocabulary: vocabularyIndicators,
      structure: structureIndicators,
      formality,
    },
    suggestions,
  };
}

/**
 * Adjusts content to match preferred tone
 * 
 * @param content Original content
 * @param preferredTone Preferred tone
 * @returns Suggestions for tone adjustment
 */
export function suggestToneAdjustments(
  content: string,
  preferredTone: AgentProfile['preferredTone']
): string[] {
  const validation = validateTone(content, preferredTone);
  
  if (validation.matches) {
    return ['Content tone matches preferred tone'];
  }
  
  return validation.suggestions;
}

/**
 * Gets tone-specific prompt instructions
 * 
 * @param preferredTone Preferred tone
 * @returns Prompt instructions for AI
 */
export function getTonePromptInstructions(
  preferredTone: AgentProfile['preferredTone']
): string {
  const profile = getToneProfile(preferredTone);
  
  return `
**Tone: ${profile.tone}**

Characteristics:
${profile.characteristics.map(c => `- ${c}`).join('\n')}

Language Guidelines:
- Use vocabulary like: ${profile.vocabularyIndicators.slice(0, 5).join(', ')}
- ${profile.sentenceStructure}
- Formality level: ${profile.formalityLevel}
- Emotional tone: ${profile.emotionalTone}

Ensure all content matches this tone consistently throughout the response.
`.trim();
}

/**
 * Profile update propagation utilities
 * Requirement 3.5: Apply new preferences immediately after profile updates
 * 
 * Note: Cache invalidation is handled by AgentProfileRepository.updateProfile()
 * which automatically invalidates the cache when a profile is updated.
 * This ensures that subsequent requests will fetch the updated profile.
 */

/**
 * Profile update event for tracking changes
 */
export interface ProfileUpdateEvent {
  userId: string;
  updatedFields: string[];
  timestamp: string;
  previousValues?: Partial<AgentProfile>;
  newValues: Partial<AgentProfile>;
}

/**
 * Validates that profile updates are immediately available
 * This is a helper for testing profile update propagation
 * 
 * @param userId User ID
 * @param expectedUpdates Expected field updates
 * @returns Validation result
 */
export async function validateProfileUpdatePropagation(
  userId: string,
  expectedUpdates: Partial<AgentProfile>
): Promise<{
  success: boolean;
  appliedUpdates: string[];
  missingUpdates: string[];
}> {
  const { getAgentProfileRepository } = await import('@/aws/dynamodb/agent-profile-repository');
  const profileRepo = getAgentProfileRepository();
  
  // Fetch the profile (should get fresh data due to cache invalidation)
  const profile = await profileRepo.getProfile(userId);
  
  if (!profile) {
    return {
      success: false,
      appliedUpdates: [],
      missingUpdates: Object.keys(expectedUpdates),
    };
  }
  
  const appliedUpdates: string[] = [];
  const missingUpdates: string[] = [];
  
  // Check each expected update
  for (const [key, expectedValue] of Object.entries(expectedUpdates)) {
    const actualValue = profile[key as keyof AgentProfile];
    
    if (actualValue === expectedValue) {
      appliedUpdates.push(key);
    } else {
      missingUpdates.push(key);
    }
  }
  
  return {
    success: missingUpdates.length === 0,
    appliedUpdates,
    missingUpdates,
  };
}

/**
 * Creates a profile update event for logging/tracking
 * 
 * @param userId User ID
 * @param previousProfile Previous profile state
 * @param updates Applied updates
 * @returns Profile update event
 */
export function createProfileUpdateEvent(
  userId: string,
  previousProfile: AgentProfile | null,
  updates: Partial<AgentProfile>
): ProfileUpdateEvent {
  const updatedFields = Object.keys(updates);
  
  let previousValues: Partial<AgentProfile> | undefined = undefined;
  if (previousProfile) {
    previousValues = {};
    for (const field of updatedFields) {
      const key = field as keyof AgentProfile;
      (previousValues as any)[key] = previousProfile[key];
    }
  }
  
  return {
    userId,
    updatedFields,
    timestamp: new Date().toISOString(),
    previousValues,
    newValues: updates,
  };
}

/**
 * Ensures profile cache is cleared after updates
 * This is called automatically by AgentProfileRepository.updateProfile()
 * but can be called manually if needed
 * 
 * @param userId User ID
 */
export async function ensureProfileCacheCleared(userId: string): Promise<void> {
  const { getAgentProfileRepository } = await import('@/aws/dynamodb/agent-profile-repository');
  const profileRepo = getAgentProfileRepository();
  
  // The repository's updateProfile method already invalidates the cache,
  // but we can also manually clear it if needed
  profileRepo.clearCache();
}

/**
 * Gets profile update recommendations based on usage patterns
 * 
 * @param agentProfile Current agent profile
 * @param usageContext Usage context (e.g., content types generated, markets queried)
 * @returns Recommendations for profile updates
 */
export function getProfileUpdateRecommendations(
  agentProfile: AgentProfile,
  usageContext?: {
    contentTypes?: string[];
    marketsQueried?: string[];
    specializationMismatches?: number;
  }
): string[] {
  const recommendations: string[] = [];
  
  if (usageContext?.marketsQueried && usageContext.marketsQueried.length > 0) {
    // Check if user is frequently querying markets outside their primary market
    const otherMarkets = usageContext.marketsQueried.filter(
      market => market.toLowerCase() !== agentProfile.primaryMarket.toLowerCase()
    );
    
    if (otherMarkets.length > usageContext.marketsQueried.length * 0.5) {
      recommendations.push(
        `Consider updating primary market - you frequently query: ${otherMarkets.slice(0, 3).join(', ')}`
      );
    }
  }
  
  if (usageContext?.specializationMismatches && usageContext.specializationMismatches > 5) {
    recommendations.push(
      'Consider reviewing your specialization - recent queries suggest different focus areas'
    );
  }
  
  if (!agentProfile.corePrinciple || agentProfile.corePrinciple.length < 20) {
    recommendations.push(
      'Consider expanding your core principle to better reflect your unique value proposition'
    );
  }
  
  return recommendations;
}
