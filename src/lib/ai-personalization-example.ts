/**
 * AI Personalization Engine - Usage Examples
 * 
 * This file demonstrates how to use the AI Personalization Engine
 * in various scenarios throughout the application.
 */

import { getPersonalizationEngine } from './ai-personalization';

/**
 * Example 1: Track feature usage when user visits a page
 */
export async function exampleTrackFeatureUsage(userId: string) {
  const engine = getPersonalizationEngine();

  // Track when user visits marketing plan page
  await engine.trackFeatureUsage(userId, 'marketing-plan');

  // Track when user uses content engine
  await engine.trackFeatureUsage(userId, 'content-engine');

  // Track when user runs brand audit
  await engine.trackFeatureUsage(userId, 'brand-audit');

  console.log('Feature usage tracked successfully');
}

/**
 * Example 2: Get personalized dashboard for a user
 */
export async function exampleGetPersonalizedDashboard(userId: string) {
  const engine = getPersonalizationEngine();

  const dashboard = await engine.getPersonalizedDashboard(userId);

  console.log('Priority Actions:', dashboard.priorityActions);
  console.log('Suggested Content:', dashboard.suggestedContent);
  console.log('Market Insights:', dashboard.marketInsights);
  console.log('Next Best Actions:', dashboard.nextBestActions);

  return dashboard;
}

/**
 * Example 3: Get contextual AI suggestions
 */
export async function exampleGetContextualSuggestions(userId: string) {
  const engine = getPersonalizationEngine();

  const suggestions = await engine.getAISuggestions(userId, {
    currentPage: 'dashboard',
    recentActions: ['viewed-profile', 'created-blog-post'],
    timeOfDay: new Date().getHours(),
    profileCompletion: 80,
  });

  console.log('AI Suggestions:', suggestions);

  return suggestions;
}

/**
 * Example 4: Track content preferences
 */
export async function exampleTrackContentPreferences(userId: string) {
  const engine = getPersonalizationEngine();

  // User successfully created a blog post
  await engine.trackContentPreference(userId, 'blog-post', true);

  // User successfully created social media content
  await engine.trackContentPreference(userId, 'social-media', true);

  // User abandoned video script creation
  await engine.trackContentPreference(userId, 'video-script', false);

  console.log('Content preferences updated');
}

/**
 * Example 5: Set user goals
 */
export async function exampleSetUserGoals(userId: string) {
  const engine = getPersonalizationEngine();

  await engine.updateGoals(userId, {
    shortTerm: [
      'Complete profile setup',
      'Run first brand audit',
      'Create 5 blog posts this month',
    ],
    longTerm: [
      'Become top-ranked agent in my market',
      'Build strong online presence',
      'Generate 10+ leads per month from content marketing',
    ],
  });

  console.log('User goals updated');
}

/**
 * Example 6: Set market focus
 */
export async function exampleSetMarketFocus(userId: string) {
  const engine = getPersonalizationEngine();

  await engine.updateMarketFocus(userId, [
    'Luxury homes',
    'Downtown condos',
    'First-time home buyers',
    'Investment properties',
  ]);

  console.log('Market focus updated');
}

/**
 * Example 7: Get frequently used features
 */
export async function exampleGetFrequentFeatures(userId: string) {
  const engine = getPersonalizationEngine();

  const frequentFeatures = await engine.getFrequentFeatures(userId);

  console.log('Most frequently used features:', frequentFeatures);

  return frequentFeatures;
}

/**
 * Example 8: Complete onboarding flow with personalization
 */
export async function exampleOnboardingFlow(userId: string) {
  const engine = getPersonalizationEngine();

  // Step 1: Set market focus during onboarding
  await engine.updateMarketFocus(userId, ['Luxury homes', 'Waterfront properties']);

  // Step 2: Set initial goals
  await engine.updateGoals(userId, {
    shortTerm: ['Complete profile', 'Run brand audit'],
    longTerm: ['Establish market authority', 'Generate consistent leads'],
  });

  // Step 3: Track first feature usage
  await engine.trackFeatureUsage(userId, 'profile-setup');

  // Step 4: Get personalized recommendations for next steps
  const dashboard = await engine.getPersonalizedDashboard(userId);

  console.log('Onboarding complete. Next steps:', dashboard.priorityActions);

  return dashboard;
}

/**
 * Example 9: Workflow pattern detection
 */
export async function exampleWorkflowPatternDetection(userId: string) {
  const engine = getPersonalizationEngine();

  // Simulate a common workflow: Profile → Brand Audit → Marketing Plan → Content
  await engine.trackFeatureUsage(userId, 'profile');
  await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate time passing

  await engine.trackFeatureUsage(userId, 'brand-audit');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await engine.trackFeatureUsage(userId, 'marketing-plan');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await engine.trackFeatureUsage(userId, 'content-engine');

  // Get next best actions (should predict content-engine based on pattern)
  const profile = await engine.getProfile(userId);
  const nextActions = await engine.getNextBestActions(profile);

  console.log('Detected workflow patterns:', profile.workflowPatterns.commonSequences);
  console.log('Suggested next actions:', nextActions);

  return nextActions;
}

/**
 * Example 10: Time-based recommendations
 */
export async function exampleTimeBasedRecommendations(userId: string) {
  const engine = getPersonalizationEngine();

  // Track usage at different times
  const hour = new Date().getHours();

  await engine.trackFeatureUsage(userId, 'content-engine');

  const profile = await engine.getProfile(userId);

  console.log(`Usage at hour ${hour}:`, profile.workflowPatterns.timeOfDayUsage);

  // Get recommendations based on time of day
  const suggestions = await engine.getAISuggestions(userId, {
    timeOfDay: hour,
    currentPage: 'dashboard',
  });

  console.log('Time-based suggestions:', suggestions);

  return suggestions;
}

/**
 * Example 11: Full personalization lifecycle
 */
export async function exampleFullPersonalizationLifecycle(userId: string) {
  const engine = getPersonalizationEngine();

  console.log('=== Starting Personalization Lifecycle ===');

  // 1. Initialize profile with market focus and goals
  console.log('\n1. Setting up profile...');
  await engine.updateMarketFocus(userId, ['Suburban homes', 'Family neighborhoods']);
  await engine.updateGoals(userId, {
    shortTerm: ['Build online presence', 'Create consistent content'],
    longTerm: ['Become neighborhood expert', 'Generate 20 leads/month'],
  });

  // 2. Track feature usage over time
  console.log('\n2. Tracking feature usage...');
  const features = [
    'dashboard',
    'profile',
    'brand-audit',
    'marketing-plan',
    'content-engine',
    'content-engine', // Used twice
    'brand-audit', // Used twice
  ];

  for (const feature of features) {
    await engine.trackFeatureUsage(userId, feature);
  }

  // 3. Track content preferences
  console.log('\n3. Tracking content preferences...');
  await engine.trackContentPreference(userId, 'blog-post', true);
  await engine.trackContentPreference(userId, 'social-media', true);

  // 4. Get personalized dashboard
  console.log('\n4. Generating personalized dashboard...');
  const dashboard = await engine.getPersonalizedDashboard(userId);

  console.log('\nPriority Actions:');
  dashboard.priorityActions.forEach((action, i) => {
    console.log(`  ${i + 1}. ${action.title} (${action.priority})`);
    console.log(`     ${action.description}`);
  });

  console.log('\nMarket Insights:');
  dashboard.marketInsights.forEach((insight, i) => {
    console.log(`  ${i + 1}. ${insight.title} (${insight.category})`);
    console.log(`     ${insight.description}`);
  });

  // 5. Get frequent features
  console.log('\n5. Most frequently used features:');
  const frequentFeatures = await engine.getFrequentFeatures(userId);
  console.log('  ', frequentFeatures.join(', '));

  // 6. Get profile summary
  console.log('\n6. Profile summary:');
  const profile = await engine.getProfile(userId);
  console.log('   Market Focus:', profile.marketFocus.join(', '));
  console.log('   Short-term Goals:', profile.goals.shortTerm.join(', '));
  console.log('   Workflow Sequences:', profile.workflowPatterns.commonSequences.length);

  console.log('\n=== Personalization Lifecycle Complete ===');

  return {
    dashboard,
    frequentFeatures,
    profile,
  };
}
