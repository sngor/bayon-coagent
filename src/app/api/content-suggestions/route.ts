import { NextRequest, NextResponse } from 'next/server';
import { getContentSuggestionsEngine } from '@/lib/ai-content-suggestions';

/**
 * POST /api/content-suggestions
 * 
 * Gets AI-powered content suggestions for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, marketFocus } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const engine = getContentSuggestionsEngine();
    const suggestions = await engine.getContentSuggestions(userId, marketFocus);

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Failed to get content suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
