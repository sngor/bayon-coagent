import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/aws/dynamodb/repository';

/**
 * API endpoint to fetch research reports for a user
 */
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Query reports from DynamoDB
    const repository = getRepository();
    const PK = `USER#${userId}`;
    const SKPrefix = 'REPORT#';

    const reports = await repository.query(PK, SKPrefix, {
      limit,
      scanIndexForward: false, // descending order (newest first)
    });

    return NextResponse.json({ 
      success: true, 
      reports: reports || [] 
    });
  } catch (error: any) {
    console.error('Failed to fetch research reports:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch reports' 
    }, { status: 500 });
  }
}
