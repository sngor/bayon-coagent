import { z } from 'zod';

/**
 * Schema for exchanging Google OAuth tokens
 */
export const ExchangeGoogleTokenInputSchema = z.object({
  code: z.string().describe('The OAuth authorization code'),
});

export const ExchangeGoogleTokenOutputSchema = z.object({
  accessToken: z.string().describe('The access token'),
  refreshToken: z.string().optional().describe('The refresh token'),
  expiresIn: z.number().describe('Token expiration time in seconds'),
  tokenType: z.string().describe('The token type (usually "Bearer")'),
});

export type ExchangeGoogleTokenInput = z.infer<typeof ExchangeGoogleTokenInputSchema>;
export type ExchangeGoogleTokenOutput = z.infer<typeof ExchangeGoogleTokenOutputSchema>;
