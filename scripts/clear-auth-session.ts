#!/usr/bin/env tsx

/**
 * Clear Auth Session Script
 * 
 * This script helps clear invalid authentication sessions from localStorage.
 * Run this if you're experiencing "Invalid Access Token" errors.
 * 
 * Usage:
 *   npm run clear-auth
 *   or
 *   npx tsx scripts/clear-auth-session.ts
 */

console.log('🔧 Clearing authentication session...');
console.log('');
console.log('To clear your session, open your browser console and run:');
console.log('');
console.log('  localStorage.removeItem("cognito_session")');
console.log('  location.reload()');
console.log('');
console.log('Or simply sign out and sign back in.');
console.log('');
console.log('✅ The app will now automatically handle invalid tokens and clear them.');
