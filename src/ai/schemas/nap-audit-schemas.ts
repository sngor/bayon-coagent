import { z } from 'zod';

/**
 * Schema for NAP (Name, Address, Phone) audit
 */
export const RunNapAuditInputSchema = z.object({
  name: z.string().describe('The agent name'),
  address: z.string().describe('The agent address'),
  phone: z.string().describe('The agent phone number'),
  agencyName: z.string().describe('The agency name'),
  website: z.string().optional().describe('The agent website (optional)'),
});

export const RunNapAuditOutputSchema = z.object({
  results: z.array(z.object({
    platform: z.string().describe('The platform name (e.g., Google Business Profile, Zillow, Realtor.com, etc.)'),
    platformUrl: z.string().optional().or(z.literal('')).describe('The URL of the profile page on this platform (empty string if not found)'),
    foundName: z.string().optional().or(z.literal('')).describe('The name found on this platform (empty string if not found)'),
    foundAddress: z.string().optional().or(z.literal('')).describe('The address found on this platform (empty string if not found)'),
    foundPhone: z.string().optional().or(z.literal('')).describe('The phone number found on this platform (empty string if not found)'),
    status: z.enum(['Consistent', 'Inconsistent', 'Not Found']).describe('The consistency status for this platform'),
  })).describe('Array of audit results for each platform'),
});

export type RunNapAuditInput = z.infer<typeof RunNapAuditInputSchema>;
export type RunNapAuditOutput = z.infer<typeof RunNapAuditOutputSchema>;
