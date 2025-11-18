import { z } from 'zod';

/**
 * Schema for life event predictor
 */
export const lifeEventPredictorSchema = z.object({
  client_data: z.string().min(1, 'Client data is required'),
});

export type LifeEventPredictorInput = z.infer<typeof lifeEventPredictorSchema>;
