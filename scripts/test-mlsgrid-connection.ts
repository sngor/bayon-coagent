#!/usr/bin/env tsx

/**
 * Test MLS Grid API Connection
 * 
 * This script tests the MLS Grid API connection using the demo access token.
 * Run with: npx tsx scripts/test-mlsgrid-connection.ts
 */

import 'dotenv/config';

const MLSGRID_API_URL = process.env.MLSGRID_API_URL || 'https://api.mlsgrid.com/v2';
const MLSGRID_ACCESS_TOKEN = process.env.MLSGRID_ACCESS_TOKEN;

interface TestResult {
    test: string;
    success: boolean;
    data?: any;
    error?: string;
}

async function testConnection(): Promise<TestResult> {
    console.log('🔍 Testing MLS Grid API connection...\n');

    if (!MLSGRID_ACCESS_TOKEN) {
        return {
            test: 'Connection',
            success: false,
            error: 'MLSGRID_ACCESS_TOKEN not found in environment variables',
        };
    }

    try {
        // Test basic API connectivity with MLS Grid best practices
        const params = new URLSearchParams({
            '$filter': 'MlgCanView eq true',
            '$top': '1',
        });

        const response = await fetch(`${MLSGRID_API_URL}/Property?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MLSGRID_ACCESS_TOKEN}`,
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip,deflate',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                test: 'Connection',
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}\n${errorText}`,
            };
        }

        const data = await response.json();

        return {
            test: 'Connection',
            success: true,
            data: {
                status: response.status,
                recordCount: data.value?.length || 0,
                hasData: !!data.value,
            },
        };
    } catch (error) {
        return {
            test: 'Connection',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function testPropertyEndpoint(): Promise<TestResult> {
    console.log('🏠 Testing Property endpoint (MLS Grid Best Practices)...\n');

    if (!MLSGRID_ACCESS_TOKEN) {
        return {
            test: 'Property Endpoint',
            success: false,
            error: 'MLSGRID_ACCESS_TOKEN not found',
        };
    }

    try {
        // MLS Grid Best Practice: Include MlgCanView filter and use $expand for Media
        const params = new URLSearchParams({
            '$filter': 'MlgCanView eq true',
            '$top': '5',
            '$select': 'ListingKey,ListingId,UnparsedAddress,City,StateOrProvince,ListPrice,StandardStatus,OriginatingSystemName',
            '$expand': 'Media',
        });

        const response = await fetch(`${MLSGRID_API_URL}/Property?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MLSGRID_ACCESS_TOKEN}`,
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip,deflate', // Required by MLS Grid
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                test: 'Property Endpoint',
                success: false,
                error: `HTTP ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json();
        const properties = data.value || [];

        return {
            test: 'Property Endpoint',
            success: true,
            data: {
                count: properties.length,
                hasNextLink: !!data['@odata.nextLink'],
                sample: properties[0] ? {
                    ListingId: properties[0].ListingId,
                    Address: properties[0].UnparsedAddress,
                    City: properties[0].City,
                    Price: properties[0].ListPrice,
                    Status: properties[0].StandardStatus,
                    MLS: properties[0].OriginatingSystemName,
                    MediaCount: properties[0].Media?.length || 0,
                } : null,
            },
        };
    } catch (error) {
        return {
            test: 'Property Endpoint',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function testMemberEndpoint(): Promise<TestResult> {
    console.log('👤 Testing Member endpoint...\n');

    if (!MLSGRID_ACCESS_TOKEN) {
        return {
            test: 'Member Endpoint',
            success: false,
            error: 'MLSGRID_ACCESS_TOKEN not found',
        };
    }

    try {
        const params = new URLSearchParams({
            '$top': '1',
            '$select': 'MemberKey,MemberMlsId,MemberFirstName,MemberLastName,OfficeMlsId',
        });

        const response = await fetch(`${MLSGRID_API_URL}/Member?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MLSGRID_ACCESS_TOKEN}`,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                test: 'Member Endpoint',
                success: false,
                error: `HTTP ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json();
        const members = data.value || [];

        return {
            test: 'Member Endpoint',
            success: true,
            data: {
                count: members.length,
                sample: members[0] || null,
            },
        };
    } catch (error) {
        return {
            test: 'Member Endpoint',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

async function testMediaEndpoint(): Promise<TestResult> {
    console.log('📸 Testing Media via Property expansion (MLS Grid v2 requirement)...\n');

    if (!MLSGRID_ACCESS_TOKEN) {
        return {
            test: 'Media Endpoint',
            success: false,
            error: 'MLSGRID_ACCESS_TOKEN not found',
        };
    }

    try {
        // In MLS Grid v2, Media must be accessed via Property expansion
        const params = new URLSearchParams({
            '$filter': 'MlgCanView eq true',
            '$top': '1',
            '$select': 'ListingKey,ListingId,UnparsedAddress',
            '$expand': 'Media',
        });

        const response = await fetch(`${MLSGRID_API_URL}/Property?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MLSGRID_ACCESS_TOKEN}`,
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip,deflate',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                test: 'Media Endpoint',
                success: false,
                error: `HTTP ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json();
        const properties = data.value || [];
        const mediaCount = properties.reduce((total: number, prop: any) => total + (prop.Media?.length || 0), 0);

        return {
            test: 'Media Endpoint',
            success: true,
            data: {
                propertiesWithMedia: properties.filter((p: any) => p.Media?.length > 0).length,
                totalMediaItems: mediaCount,
                sample: properties[0]?.Media?.[0] || null,
            },
        };
    } catch (error) {
        return {
            test: 'Media Endpoint',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

function printResult(result: TestResult) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);

    if (result.success && result.data) {
        console.log('   Data:', JSON.stringify(result.data, null, 2));
    }

    if (!result.success && result.error) {
        console.log('   Error:', result.error);
    }

    console.log('');
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('         MLS Grid API Connection Test');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`API URL: ${MLSGRID_API_URL}`);
    console.log(`Token: ${MLSGRID_ACCESS_TOKEN ? '✓ Present' : '✗ Missing'}\n`);

    const results: TestResult[] = [];

    // Run tests
    results.push(await testConnection());
    results.push(await testPropertyEndpoint());
    results.push(await testMemberEndpoint());
    results.push(await testMediaEndpoint());

    // Print results
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('                    Results');
    console.log('═══════════════════════════════════════════════════════\n');

    results.forEach(printResult);

    // Summary
    const passed = results.filter(r => r.success).length;
    const total = results.length;

    console.log('═══════════════════════════════════════════════════════');
    console.log(`Summary: ${passed}/${total} tests passed`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (passed === total) {
        console.log('🎉 All tests passed! MLS Grid API is ready to use.\n');
        process.exit(0);
    } else {
        console.log('⚠️  Some tests failed. Check the errors above.\n');
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
