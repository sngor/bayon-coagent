import { NextResponse } from 'next/server';

/**
 * API endpoint to check external service configurations
 * This runs server-side so it can access environment variables
 */
export async function GET() {
    try {
        const services = {
            tavily: checkService(process.env.TAVILY_API_KEY),
            newsApi: checkService(process.env.NEWS_API_KEY),
            bridgeApi: checkService(process.env.BRIDGE_API_KEY),
        };

        return NextResponse.json(services);
    } catch (error) {
        console.error('Error checking services:', error);
        return NextResponse.json(
            { error: 'Failed to check services' },
            { status: 500 }
        );
    }
}

function checkService(apiKey: string | undefined): { status: 'connected' | 'not-configured'; error?: string } {
    if (apiKey && apiKey.length > 0) {
        return { status: 'connected' };
    }
    return { status: 'not-configured', error: 'API key not configured' };
}
