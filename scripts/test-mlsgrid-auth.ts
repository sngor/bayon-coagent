#!/usr/bin/env tsx

/**
 * Test different MLS Grid authentication methods
 */

const token = 'a16ac59151786a60b9063240ebec1c169ae8b4d0';
const baseUrl = 'https://api.mlsgrid.com/v2';

async function testAuthMethod(method: string, headers: Record<string, string>) {
    console.log(`\nTesting: ${method}`);
    console.log('Headers:', JSON.stringify(headers, null, 2));

    try {
        const response = await fetch(`${baseUrl}/Property?$top=1`, {
            method: 'GET',
            headers,
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ SUCCESS!');
            console.log('Data:', JSON.stringify(data, null, 2).substring(0, 200));
            return true;
        } else {
            const text = await response.text();
            console.log('❌ Failed:', text.substring(0, 200));
            return false;
        }
    } catch (error) {
        console.log('❌ Error:', error instanceof Error ? error.message : 'Unknown');
        return false;
    }
}

async function main() {
    console.log('Testing MLS Grid Authentication Methods\n');
    console.log('Token:', token);
    console.log('Base URL:', baseUrl);

    const methods = [
        {
            name: 'Bearer Token',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        },
        {
            name: 'Token Header',
            headers: {
                'Token': token,
                'Accept': 'application/json',
            },
        },
        {
            name: 'X-API-Key',
            headers: {
                'X-API-Key': token,
                'Accept': 'application/json',
            },
        },
        {
            name: 'Authorization Token (no Bearer)',
            headers: {
                'Authorization': token,
                'Accept': 'application/json',
            },
        },
    ];

    for (const method of methods) {
        await testAuthMethod(method.name, method.headers);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
    }
}

main();
