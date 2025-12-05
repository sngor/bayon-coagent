/**
 * Lighthouse Analytics API
 * 
 * Returns recent Lighthouse audit scores.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const resultsDir = path.join(process.cwd(), 'lighthouse-results');

        if (!fs.existsSync(resultsDir)) {
            return NextResponse.json([]);
        }

        // Find the most recent results file
        const files = fs.readdirSync(resultsDir)
            .filter(file => file.endsWith('.json'))
            .sort()
            .reverse();

        if (files.length === 0) {
            return NextResponse.json([]);
        }

        // Read the most recent file
        const latestFile = path.join(resultsDir, files[0]);
        const data = fs.readFileSync(latestFile, 'utf8');
        const results = JSON.parse(data);

        return NextResponse.json(results);
    } catch (error) {
        console.error('Failed to load Lighthouse scores:', error);
        return NextResponse.json(
            { error: 'Failed to load Lighthouse scores' },
            { status: 500 }
        );
    }
}
