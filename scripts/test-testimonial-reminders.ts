#!/usr/bin/env tsx
/**
 * Test Testimonial Reminder System
 * 
 * This script demonstrates and tests the testimonial reminder functionality
 * Run with: npx tsx scripts/test-testimonial-reminders.ts
 */

import { sendTestimonialReminders, expireOldTestimonialRequests } from '../src/services/notifications/testimonial-reminder-service';

async function main() {
    console.log('🔔 Testimonial Reminder System Test\n');
    console.log('='.repeat(60));

    // Test with a sample user ID
    const testUserId = process.argv[2];

    if (!testUserId) {
        console.log('\n❌ Error: User ID required');
        console.log('\nUsage: npx tsx scripts/test-testimonial-reminders.ts <userId>');
        console.log('\nExample: npx tsx scripts/test-testimonial-reminders.ts user-123');
        process.exit(1);
    }

    console.log(`\n📧 Testing reminder system for user: ${testUserId}\n`);

    try {
        // Test sending reminders
        console.log('1️⃣  Checking for pending requests older than 14 days...');
        const reminderResult = await sendTestimonialReminders(testUserId);

        if (reminderResult.success) {
            console.log(`   ✅ Success!`);
            console.log(`   📨 Reminders sent: ${reminderResult.remindersSent}`);

            if (reminderResult.errors.length > 0) {
                console.log(`   ⚠️  Errors encountered: ${reminderResult.errors.length}`);
                reminderResult.errors.forEach((error: string, i: number) => {
                    console.log(`      ${i + 1}. ${error}`);
                });
            }
        } else {
            console.log(`   ❌ Failed: ${reminderResult.errors.join(', ')}`);
        }

        console.log('\n2️⃣  Checking for expired requests...');
        const expirationResult = await expireOldTestimonialRequests(testUserId);

        if (expirationResult.success) {
            console.log(`   ✅ Success!`);
            console.log(`   🗓️  Requests expired: ${expirationResult.requestsExpired}`);

            if (expirationResult.errors.length > 0) {
                console.log(`   ⚠️  Errors encountered: ${expirationResult.errors.length}`);
                expirationResult.errors.forEach((error: string, i: number) => {
                    console.log(`      ${i + 1}. ${error}`);
                });
            }
        } else {
            console.log(`   ❌ Failed: ${expirationResult.errors.join(', ')}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('\n✨ Test complete!\n');

        // Summary
        console.log('📊 Summary:');
        console.log(`   • Reminders sent: ${reminderResult.remindersSent}`);
        console.log(`   • Requests expired: ${expirationResult.requestsExpired}`);
        console.log(`   • Total errors: ${reminderResult.errors.length + expirationResult.errors.length}`);

        console.log('\n💡 Next Steps:');
        console.log('   1. Set up AWS EventBridge to run this daily');
        console.log('   2. Configure CRON_SECRET for API endpoint security');
        console.log('   3. Monitor CloudWatch logs for email delivery');
        console.log('   4. Verify AWS SES is configured and out of sandbox\n');

    } catch (error: any) {
        console.error('\n❌ Unexpected error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
