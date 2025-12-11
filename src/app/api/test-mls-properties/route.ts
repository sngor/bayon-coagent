import { NextResponse } from 'next/server';

/**
 * Test endpoint for MLS Grid demo data
 * This endpoint fetches sample properties from MLS Grid demo API
 */
export async function GET() {
    try {
        const MLSGRID_API_URL = process.env.MLSGRID_API_URL;
        const MLSGRID_ACCESS_TOKEN = process.env.MLSGRID_ACCESS_TOKEN;

        if (!MLSGRID_API_URL || !MLSGRID_ACCESS_TOKEN) {
            return NextResponse.json(
                {
                    error: 'MLS Grid configuration missing',
                    details: 'MLSGRID_API_URL and MLSGRID_ACCESS_TOKEN must be configured'
                },
                { status: 500 }
            );
        }

        // Build query parameters following MLS Grid best practices
        const params = new URLSearchParams({
            '$filter': 'MlgCanView eq true',
            '$top': '12', // Fetch 12 properties for demo
            '$select': [
                'ListingKey',
                'ListingId',
                'UnparsedAddress',
                'City',
                'StateOrProvince',
                'PostalCode',
                'ListPrice',
                'BedroomsTotal',
                'BathroomsTotalInteger',
                'LivingArea',
                'PropertyType',
                'StandardStatus',
                'OriginatingSystemName',
                'PublicRemarks'
            ].join(','),
            '$expand': 'Media',
            '$orderby': 'ListPrice desc' // Show higher priced properties first
        });

        const url = `${MLSGRID_API_URL}/Property?${params.toString()}`;

        console.log('Fetching MLS Grid data from:', url.split('?')[0]);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MLSGRID_ACCESS_TOKEN}`,
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip,deflate',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('MLS Grid API error:', response.status, errorText);

            return NextResponse.json(
                {
                    error: `MLS Grid API error: ${response.status}`,
                    details: errorText
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        const properties = data.value || [];

        console.log(`Successfully fetched ${properties.length} properties from MLS Grid`);

        return NextResponse.json({
            success: true,
            count: properties.length,
            properties: properties,
            hasMore: !!data['@odata.nextLink'],
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Failed to fetch MLS Grid properties:', error);

        return NextResponse.json(
            {
                error: 'Failed to fetch properties',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}