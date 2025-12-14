import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const aiServiceUrl = process.env.NEXT_PUBLIC_AI_SERVICE_API_URL;

        if (!aiServiceUrl) {
            return NextResponse.json(
                { error: { message: 'AI service URL not configured' } },
                { status: 500 }
            );
        }

        // Get authorization header from the original request
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: { message: 'Authorization header required' } },
                { status: 401 }
            );
        }

        // Determine the correct endpoint based on request body type
        let endpoint = '/content'; // default
        if (body.type && ['generate-listing-description', 'optimize-listing-description', 'generate-from-images'].includes(body.type)) {
            endpoint = '/studio';
        } else if (body.type && ['research-agent', 'property-valuation', 'renovation-roi'].includes(body.type)) {
            endpoint = '/research';
        } else if (body.type && ['find-competitors', 'enrich-competitor', 'nap-audit', 'agent-bio', 'marketing-plan'].includes(body.type)) {
            endpoint = '/brand';
        }

        console.log('Forwarding request to:', `${aiServiceUrl}${endpoint}`);
        console.log('Request body:', JSON.stringify(body, null, 2));
        console.log('Auth header:', authHeader ? 'Present' : 'Missing');

        // Forward the request to the actual API Gateway
        const response = await fetch(`${aiServiceUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(body),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response from API Gateway:', text);
            return NextResponse.json(
                { error: { message: `API Gateway returned non-JSON response: ${text.substring(0, 200)}...` } },
                { status: 502 }
            );
        }

        const data = await response.json();

        if (!response.ok) {
            console.error('API Gateway error response:', data);
            return NextResponse.json(
                { error: data.error || { message: `HTTP ${response.status}: ${response.statusText}` } },
                { status: response.status }
            );
        }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy error:', error);

        // Provide more specific error information
        let errorMessage = 'Internal server error';
        if (error instanceof Error) {
            errorMessage = error.message;

            // Check for common network errors
            if (error.message.includes('fetch')) {
                errorMessage = `Failed to connect to AI service: ${error.message}`;
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'PROXY_ERROR',
                    message: errorMessage
                }
            },
            { status: 500 }
        );
    }
}