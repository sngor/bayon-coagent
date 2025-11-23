import { z } from 'zod';

/**
 * Schema for audio transcription input
 */
export const AudioTranscriptionInputSchema = z.object({
    audioData: z.string().describe('Base64 encoded audio data'),
    audioFormat: z.enum(['webm', 'mp4', 'wav', 'ogg']).describe('Audio format'),
    duration: z.number().positive().describe('Duration in seconds'),
    userId: z.string().describe('User ID for logging and personalization'),
    context: z.string().optional().describe('Optional context about the recording'),
});

/**
 * Schema for audio transcription output
 */
export const AudioTranscriptionOutputSchema = z.object({
    transcript: z.string().describe('Transcribed text from the audio'),
    confidence: z.number().min(0).max(1).describe('Confidence score of the transcription'),
    language: z.string().optional().describe('Detected language of the audio'),
    duration: z.number().positive().describe('Actual duration processed'),
    wordCount: z.number().nonnegative().describe('Number of words in the transcript'),
    speakerCount: z.number().positive().default(1).describe('Estimated number of speakers'),
    keyPhrases: z.array(z.string()).optional().describe('Key phrases extracted from the transcript'),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional().describe('Overall sentiment of the transcript'),
});

export type AudioTranscriptionInput = z.infer<typeof AudioTranscriptionInputSchema>;
export type AudioTranscriptionOutput = z.infer<typeof AudioTranscriptionOutputSchema>;