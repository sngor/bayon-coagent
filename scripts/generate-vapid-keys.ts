#!/usr/bin/env tsx
/**
 * Generate VAPID Keys for Web Push Notifications
 * 
 * This script generates VAPID (Voluntary Application Server Identification) keys
 * required for Web Push notifications. Run this once during setup and add the keys
 * to your environment variables.
 * 
 * Usage:
 *   tsx scripts/generate-vapid-keys.ts
 */

import { PushChannelHandler } from '../src/lib/notifications/channels/push-channel-handler';

console.log('Generating VAPID keys for Web Push notifications...\n');

const keys = PushChannelHandler.generateVapidKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('Add these to your .env.local and .env.production files:\n');
console.log('─'.repeat(80));
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:support@bayoncoagent.com`);
console.log('─'.repeat(80));
console.log('\n⚠️  Important:');
console.log('  - Keep the private key secret and never commit it to version control');
console.log('  - The public key will be used in the client-side code');
console.log('  - Update VAPID_SUBJECT with your actual support email');
console.log('  - These keys should be the same across all environments for consistency\n');
