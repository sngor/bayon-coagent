/**
 * Environment Debug API
 * 
 * Helps diagnose environment variable issues in production.
 * SECURITY: Only shows if variables are set, not their values.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check critical environment variables (without exposing values)
    const envCheck = {
      // AWS Configuration
      AWS_REGION: !!process.env.AWS_REGION,
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      
      // Cognito Configuration
      COGNITO_USER_POOL_ID: !!process.env.COGNITO_USER_POOL_ID,
      COGNITO_CLIENT_ID: !!process.env.COGNITO_CLIENT_ID,
      NEXT_PUBLIC_USER_POOL_CLIENT_ID: !!process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
      
      // Stripe Configuration
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: !!process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      
      // Email Configuration
      FROM_EMAIL: !!process.env.FROM_EMAIL,
      AWS_SES_REGION: !!process.env.AWS_SES_REGION,
      
      // Application Configuration
      NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
      CRON_SECRET_TOKEN: !!process.env.CRON_SECRET_TOKEN,
      
      // Node Environment
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    // Count missing variables
    const totalVars = Object.keys(envCheck).length;
    const setVars = Object.values(envCheck).filter(Boolean).length;
    const missingVars = Object.entries(envCheck)
      .filter(([_, isSet]) => !isSet)
      .map(([name]) => name);

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      platform: process.env.VERCEL_ENV || 'unknown',
      summary: {
        total: totalVars,
        set: setVars,
        missing: totalVars - setVars,
        percentage: Math.round((setVars / totalVars) * 100),
      },
      variables: envCheck,
      missingVariables: missingVars,
      recommendations: missingVars.length > 0 ? [
        'Set missing environment variables in your deployment platform',
        'For Amplify: Go to App Settings → Environment Variables',
        'For Vercel: Go to Project Settings → Environment Variables',
        'Redeploy after setting variables',
      ] : [
        'All environment variables are configured!',
        'If APIs are still failing, check AWS IAM permissions',
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check environment variables',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}