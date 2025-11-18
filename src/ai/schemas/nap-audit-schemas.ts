import { z } from 'zod';

/**
 * Schema for NAP (Name, Address, Phone) audit
 */
export const RunNapAuditInputSchema = z.object({
  name: z.string().describe('The agent name'),
  address: z.string().describe('The agent address'),
  phone: z.string().describe('The agent phone number'),
  agencyName: z.string().describe('The agency name'),
  website: z.string().describe('The agent website'),
});

export const RunNapAuditOutputSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall NAP consistency score (0-100)'),
  inconsistencies: z.array(z.object({
    platform: z.string().describe('The platform where inconsistency was found'),
    field: z.string().describe('The field with inconsistency (name, address, or phone)'),
    expected: z.string().describe('The expected value'),
    found: z.string().describe('The value found on the platform'),
  })).describe('Array of NAP inconsistencies found'),
  recommendations: z.array(z.string()).describe('Recommendations for fixing inconsistencies'),
});

export type RunNapAuditInput = z.infer<typeof RunNapAuditInputSchema>;
export type RunNapAuditOutput = z.infer<typeof RunNapAuditOutputSchema>;
