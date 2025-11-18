'use server';

/**
 * @fileOverview Flow to exchange a Google OAuth authorization code for tokens.
 * 
 * Note: This flow doesn't use AI - it's a direct OAuth integration.
 */

import { defineFlow } from '../flow-base';
import {
  ExchangeGoogleTokenInputSchema,
  ExchangeGoogleTokenOutputSchema,
  type ExchangeGoogleTokenInput,
  type ExchangeGoogleTokenOutput,
} from '@/ai/schemas/google-token-schemas';

export { type ExchangeGoogleTokenInput, type ExchangeGoogleTokenOutput };

const exchangeGoogleTokenFlow = defineFlow(
  {
    name: 'exchangeGoogleTokenFlow',
    inputSchema: ExchangeGoogleTokenInputSchema,
    outputSchema: ExchangeGoogleTokenOutputSchema,
  },
  async ({ code }) => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error_description}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: Date.now() + data.expires_in * 1000,
    };
  }
);

export async function exchangeGoogleToken(
  input: ExchangeGoogleTokenInput
): Promise<ExchangeGoogleTokenOutput> {
  return exchangeGoogleTokenFlow.execute(input);
}
