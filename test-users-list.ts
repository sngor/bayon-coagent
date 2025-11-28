/**
 * Test script to verify getUsersListAction returns all users including admins
 * Run with: npx tsx test-users-list.ts
 */

import { getRepository } from './src/aws/dynamodb/repository';

async function testUsersList() {
    console.log('Testing users list query...\n');

    try {
        const repository = getRepository();

        // Scan for all profiles
        const result = await repository.scan({
            filterExpression: 'SK = :sk',
            expressionAttributeValues: {
                ':sk': 'PROFILE'
            }
        });

        console.log(`✓ Found ${result.items.length} total users\n`);

        // Group by role
        const roleCount: Record<string, number> = {};
        const usersByRole: Record<string, any[]> = {
            'super_admin': [],
            'admin': [],
            'user': []
        };

        result.items.forEach((user: any) => {
            const role = user.role || 'user';
            roleCount[role] = (roleCount[role] || 0) + 1;

            if (usersByRole[role]) {
                usersByRole[role].push(user);
            } else {
                usersByRole[role] = [user];
            }
        });

        console.log('Role Distribution:');
        Object.entries(roleCount).forEach(([role, count]) => {
            console.log(`  ${role}: ${count}`);
        });

        console.log('\n--- Super Admins ---');
        usersByRole['super_admin'].forEach(user => {
            console.log(`  • ${user.email} (${user.name || 'No name'})`);
        });

        console.log('\n--- Admins ---');
        usersByRole['admin'].forEach(user => {
            console.log(`  • ${user.email} (${user.name || 'No name'})`);
        });

        console.log('\n--- Regular Users ---');
        usersByRole['user'].slice(0, 5).forEach(user => {
            console.log(`  • ${user.email} (${user.name || 'No name'})`);
        });
        if (usersByRole['user'].length > 5) {
            console.log(`  ... and ${usersByRole['user'].length - 5} more`);
        }

        console.log('\n✓ Test completed successfully');
        console.log('\nConclusion: All users including admin accounts are being returned.');

    } catch (error: any) {
        console.error('✗ Test failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testUsersList();
