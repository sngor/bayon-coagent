import { NextRequest, NextResponse } from 'next/server';
import { getBedrockClient } from '@/aws/bedrock/client';
import { z } from 'zod';

/**
 * Simple API endpoint to test AWS Bedrock connectivity
 */
export async function POST(request: NextRequest) {
  try {
    const client = getBedrockClient();
    
    // Simple test schema
    const testSchema = z.object({
      status: z.string(),
    });

    // Make a minimal test call
    const result = await client.invoke(
      'Respond with JSON: {"status": "ok"}',
      testSchema,
      {
        temperature: 0.1,
        maxTokens: 50,
      }
    );

    if (result.status === 'ok') {
      return NextResponse.json({ 
        success: true, 
        message: 'AI service is connected and working' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Unexpected response from AI service' 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('AI connection test failed:', error);
    
    let errorMessage = 'Failed to connect to AI service';
    
    if (error.message?.includes('credentials')) {
      errorMessage = 'AWS credentials not configured';
    } else if (error.message?.includes('AccessDenied')) {
      errorMessage = 'AWS credentials lack Bedrock permissions';
    } else if (error.message?.includes('ValidationException')) {
      errorMessage = 'Invalid model configuration';
    } else if (error.message?.includes('ResourceNotFound')) {
      errorMessage = 'Model not available in region';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
