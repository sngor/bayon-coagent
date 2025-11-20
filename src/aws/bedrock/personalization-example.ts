/**
 * Personalization Layer Examples
 * 
 * This file demonstrates how to use the personalization layer
 * for various use cases in the Kiro AI Assistant.
 */

import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import {
  prioritizeByMarket,
  filterByPrimaryMarket,
  prioritizeProperties,
  getSpecializationContext,
  injectSpecializationContext,
  validateSpecializationAlignment,
  generateSpecializationRecommendations,
  getToneProfile,
  detectTone,
  validateTone,
  getTonePromptInstructions,
  validateProfileUpdatePropagation,
  type PropertySuggestion,
} from './personalization';

/**
 * Example 1: Market Prioritization
 * 
 * Shows how to prioritize property suggestions based on agent's primary market
 */
export async function exampleMarketPrioritization() {
  // Sample agent profile
  const agentProfile: AgentProfile = {
    userId: 'user_123',
    agentName: 'Jane Smith',
    primaryMarket: 'Austin, TX',
    specialization: 'luxury',
    preferredTone: 'warm-consultative',
    corePrinciple: 'Maximize client ROI with data-first strategies',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  // Sample properties
  const properties: PropertySuggestion[] = [
    {
      id: '1',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      market: 'Austin, TX',
      propertyType: 'Single Family',
      price: 1500000,
      features: ['luxury', 'pool', 'gourmet kitchen'],
      description: 'Stunning luxury home with premium finishes',
    },
    {
      id: '2',
      address: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      market: 'Dallas, TX',
      propertyType: 'Single Family',
      price: 800000,
      features: ['updated', 'large yard'],
      description: 'Beautiful family home in great neighborhood',
    },
    {
      id: '3',
      address: '789 Hill Dr',
      city: 'Austin',
      state: 'TX',
      market: 'Austin, TX',
      propertyType: 'Condo',
      price: 2000000,
      features: ['luxury', 'downtown', 'high-rise', 'concierge'],
      description: 'Exclusive high-rise condo with city views',
    },
  ];

  // Prioritize by market
  const result = prioritizeByMarket(properties, agentProfile);

  console.log('=== Market Prioritization Example ===');
  console.log(`Total properties: ${result.totalProperties}`);
  console.log(`Primary market properties: ${result.primaryMarketCount}`);
  console.log('\nPrimary Market Properties:');
  result.primaryMarketProperties.forEach(p => {
    console.log(`  - ${p.address}: Score ${p.marketRelevanceScore}/100`);
  });

  // Filter to only primary market
  const filtered = filterByPrimaryMarket(properties, agentProfile);
  console.log(`\nFiltered to primary market: ${filtered.length} properties`);

  // Full prioritization (market + specialization)
  const prioritized = prioritizeProperties(properties, agentProfile);
  console.log('\nFully Prioritized (Market + Specialization):');
  prioritized.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.address}`);
    console.log(`     Market Score: ${p.marketRelevanceScore}/100`);
    console.log(`     Specialization Match: ${p.specializationMatch ? 'Yes' : 'No'}`);
  });
}

/**
 * Example 2: Specialization Context
 * 
 * Shows how to get and use specialization-specific context
 */
export async function exampleSpecializationContext() {
  const agentProfile: AgentProfile = {
    userId: 'user_123',
    agentName: 'John Doe',
    primaryMarket: 'Denver, CO',
    specialization: 'first-time-buyers',
    preferredTone: 'warm-consultative',
    corePrinciple: 'Making homeownership accessible for everyone',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  console.log('\n=== Specialization Context Example ===');
  
  // Get specialization context
  const context = getSpecializationContext(agentProfile);
  console.log(`Specialization: ${context.specialization}`);
  console.log(`Target Audience: ${context.targetAudience}`);
  console.log('\nFocus Areas:');
  context.focusAreas.forEach(area => console.log(`  - ${area}`));
  console.log('\nKey Messages:');
  context.keyMessages.forEach(msg => console.log(`  - ${msg}`));

  // Generate recommendations
  const recommendations = generateSpecializationRecommendations(agentProfile);
  console.log('\nContent Recommendations:');
  recommendations.forEach(rec => console.log(`  - ${rec}`));

  // Inject specialization into content
  const originalContent = 'This property is perfect for your needs. It has great features and is in a good location.';
  const enhanced = injectSpecializationContext(originalContent, agentProfile);
  console.log('\nOriginal Content:');
  console.log(originalContent);
  console.log('\nEnhanced Content:');
  console.log(enhanced);

  // Validate specialization alignment
  const validation = validateSpecializationAlignment(enhanced, agentProfile);
  console.log('\nValidation:');
  console.log(`  Aligned: ${validation.aligned}`);
  console.log(`  Specialization Mentioned: ${validation.specializationMentioned}`);
  console.log(`  Core Principle Reflected: ${validation.corePrincipleReflected}`);
  if (validation.suggestions.length > 0) {
    console.log('  Suggestions:');
    validation.suggestions.forEach(s => console.log(`    - ${s}`));
  }
}

/**
 * Example 3: Tone Matching
 * 
 * Shows how to detect and validate tone in content
 */
export async function exampleToneMatching() {
  console.log('\n=== Tone Matching Example ===');

  // Test different tones
  const tones: AgentProfile['preferredTone'][] = [
    'warm-consultative',
    'direct-data-driven',
    'professional',
    'casual',
  ];

  const sampleContent = {
    'warm-consultative': "I'm so excited to help you find your dream home! Together, we'll explore the perfect neighborhoods that match your family's needs.",
    'direct-data-driven': "Market data shows a 12% increase in property values. Analysis indicates strong appreciation potential based on current trends.",
    'professional': "I specialize in comprehensive real estate services and am committed to facilitating optimal outcomes for my clients through strategic expertise.",
    'casual': "Hey! Let's check out some awesome properties this weekend. I found some really cool places you're gonna love!",
  };

  for (const tone of tones) {
    console.log(`\n--- ${tone} ---`);
    
    // Get tone profile
    const profile = getToneProfile(tone);
    console.log(`Formality: ${profile.formalityLevel}`);
    console.log(`Emotional Tone: ${profile.emotionalTone}`);
    console.log(`Sample Indicators: ${profile.vocabularyIndicators.slice(0, 3).join(', ')}`);

    // Detect tone in sample content
    const content = sampleContent[tone];
    const detection = detectTone(content);
    console.log(`\nSample Content: "${content.substring(0, 60)}..."`);
    console.log(`Detected Tone: ${detection.tone} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`);

    // Validate tone
    const validation = validateTone(content, tone);
    console.log(`Matches Expected: ${validation.matches}`);
    if (!validation.matches) {
      console.log('Suggestions:', validation.suggestions);
    }
  }

  // Get prompt instructions for a tone
  console.log('\n--- Tone Prompt Instructions ---');
  const instructions = getTonePromptInstructions('warm-consultative');
  console.log(instructions);
}

/**
 * Example 4: Profile Update Propagation
 * 
 * Shows how to validate profile updates are immediately available
 */
export async function exampleProfileUpdatePropagation() {
  console.log('\n=== Profile Update Propagation Example ===');

  const userId = 'user_123';

  // Simulate profile update
  console.log('Updating profile...');
  const updates = {
    preferredTone: 'casual' as const,
    primaryMarket: 'Seattle, WA',
  };

  // In real usage, you would call:
  // await profileRepo.updateProfile(userId, updates);

  // Validate updates are available
  console.log('Validating update propagation...');
  
  // Note: This would actually check the database in real usage
  const validation = await validateProfileUpdatePropagation(userId, updates);
  
  console.log(`Update Success: ${validation.success}`);
  console.log(`Applied Updates: ${validation.appliedUpdates.join(', ')}`);
  if (validation.missingUpdates.length > 0) {
    console.log(`Missing Updates: ${validation.missingUpdates.join(', ')}`);
  }

  console.log('\nNext AI request will automatically use updated profile!');
}

/**
 * Example 5: Complete Workflow
 * 
 * Shows a complete workflow using multiple personalization features
 */
export async function exampleCompleteWorkflow() {
  console.log('\n=== Complete Workflow Example ===');

  const agentProfile: AgentProfile = {
    userId: 'user_123',
    agentName: 'Sarah Johnson',
    primaryMarket: 'Miami, FL',
    specialization: 'luxury',
    preferredTone: 'professional',
    corePrinciple: 'Delivering exceptional service and exclusive opportunities',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  console.log(`Agent: ${agentProfile.agentName}`);
  console.log(`Market: ${agentProfile.primaryMarket}`);
  console.log(`Specialization: ${agentProfile.specialization}`);
  console.log(`Tone: ${agentProfile.preferredTone}`);

  // 1. Get properties and prioritize
  const properties: PropertySuggestion[] = [
    {
      id: '1',
      address: '100 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      market: 'Miami, FL',
      propertyType: 'Waterfront Estate',
      price: 5000000,
      features: ['luxury', 'oceanfront', 'private dock', 'infinity pool'],
      description: 'Spectacular oceanfront estate with private beach access',
    },
    {
      id: '2',
      address: '200 Bay Road',
      city: 'Fort Lauderdale',
      state: 'FL',
      market: 'Fort Lauderdale, FL',
      propertyType: 'Condo',
      price: 800000,
      features: ['updated', 'water view'],
      description: 'Modern condo with bay views',
    },
  ];

  console.log('\n1. Prioritizing properties...');
  const prioritized = prioritizeProperties(properties, agentProfile);
  console.log(`Top property: ${prioritized[0].address} (Score: ${prioritized[0].marketRelevanceScore}/100)`);

  // 2. Generate content with specialization
  console.log('\n2. Generating specialized content...');
  const content = `This exceptional ${prioritized[0].propertyType.toLowerCase()} represents the pinnacle of luxury living in ${agentProfile.primaryMarket}.`;
  const enhanced = injectSpecializationContext(content, agentProfile);
  console.log(enhanced);

  // 3. Validate tone
  console.log('\n3. Validating tone...');
  const toneValidation = validateTone(enhanced, agentProfile.preferredTone);
  console.log(`Tone matches: ${toneValidation.matches}`);
  console.log(`Detected: ${toneValidation.detectedTone} (${(toneValidation.confidence * 100).toFixed(0)}% confidence)`);

  // 4. Validate specialization
  console.log('\n4. Validating specialization alignment...');
  const specValidation = validateSpecializationAlignment(enhanced, agentProfile);
  console.log(`Aligned: ${specValidation.aligned}`);
  console.log(`Specialization mentioned: ${specValidation.specializationMentioned}`);
  console.log(`Core principle reflected: ${specValidation.corePrincipleReflected}`);

  console.log('\n✓ Workflow complete - content is fully personalized!');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  await exampleMarketPrioritization();
  await exampleSpecializationContext();
  await exampleToneMatching();
  await exampleProfileUpdatePropagation();
  await exampleCompleteWorkflow();
}

// Uncomment to run examples:
// runAllExamples().catch(console.error);
