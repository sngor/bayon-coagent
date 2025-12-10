/**
 * Centralized Actions Export
 * 
 * Organizes server actions by hub following the established architecture:
 * - Studio Hub: Content creation actions
 * - Brand Hub: Profile, audit, competitor actions  
 * - Research Hub: Research agent and knowledge actions
 * - Market Hub: Market intelligence actions
 * - Tools Hub: Calculator and analysis actions
 * - Library Hub: Content management actions
 */

// Studio Hub Actions
export * from './studio-actions';

// Brand Hub Actions  
export * from './brand-actions';

// Research Hub Actions
export * from './research-actions';

// Market Hub Actions
export * from './market-actions';

// Tools Hub Actions
export * from './tools-actions';

// Library Hub Actions
export * from './library-actions';

// Admin Actions (for admin routes)
export * from './admin-actions';

// Legacy exports for backward compatibility
// TODO: Migrate all imports to use hub-specific actions
export * from '../actions';