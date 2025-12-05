/**
 * Bundle Size Analytics API
 * 
 * Returns historical bundle size data for trend analysis.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const historyFile = path.join(process.cwd(), '.bundle-size-history.json');

        if (!fs.existsSync(historyFile)) {
            return NextResponse.json([]);
        }

        const data = fs.readFileSync(historyFile, 'utf8');
        const history = JSON.parse(data);

        return NextResponse.json(history);
    } catch (error) {
        console.error('Failed to load bundle size history:', error);
        return NextResponse.json(
            { error: 'Failed to load bundle size history' },
            { status: 500 }
        );
    }
}
