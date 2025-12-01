/**
 * AEO (Answer Engine Optimization) Optimizer
 * 
 * Optimizes content for AI search engines and web bots:
 * - ChatGPT (OpenAI)
 * - Claude (Anthropic)
 * - Perplexity
 * - Google AI Overviews
 * - Bing Copilot
 * - Other LLM-powered search engines
 * 
 * AEO differs from SEO by focusing on how AI models extract and present information.
 */

import { z } from 'zod';
import { getBedrockClient } from './client';
import { MODEL_CONFIGS } from './flow-base';

/**
 * AEO optimization result
 */
export interface AEOOptimizationResult {
    score: number; // 0-100, how well optimized for AI engines
    optimizedContent: string;
    improvements: {
        category: string;
        before: string;
        after: string;
        impact: 'high' | 'medium' | 'low';
    }[];
    aiReadability: {
        score: number;
        structureClarity: number;
        factualDensity: number;
        citationQuality: number;
        answerDirectness: number;
    };
    recommendations: string[];
    schemaMarkup?: string; // Suggested schema.org markup
}

/**
 * AEO analysis result
 */
export interface AEOAnalysis {
    score: number;
    strengths: string[];
    weaknesses: string[];
    aiEngineCompatibility: {
        chatgpt: number;
        claude: number;
        perplexity: number;
        googleAI: number;
        bingCopilot: number;
    };
    extractability: {
        keyFacts: number; // How easily AI can extract key facts
        directAnswers: number; // How well content answers questions directly
        contextClarity: number; // How clear the context is
        structuredData: number; // Presence of structured data
    };
    recommendations: string[];
}

/**
 * AI response schema for AEO analysis
 */
const AEOAnalysisSchema = z.object({
    score: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    aiEngineCompatibility: z.object({
        chatgpt: z.number().min(0).max(100),
        claude: z.number().min(0).max(100),
        perplexity: z.number().min(0).max(100),
        googleAI: z.number().min(0).max(100),
        bingCopilot: z.number().min(0).max(100),
    }),
    extractability: z.object({
        keyFacts: z.number().min(0).max(100),
        directAnswers: z.number().min(0).max(100),
        contextClarity: z.number().min(0).max(100),
        structuredData: z.number().min(0).max(100),
    }),
    recommendations: z.array(z.string()),
});

/**
 * AI response schema for AEO optimization
 */
const AEOOptimizationSchema = z.object({
    optimizedContent: z.string(),
    improvements: z.array(z.object({
        category: z.string(),
        before: z.string(),
        after: z.string(),
        impact: z.enum(['high', 'medium', 'low']),
    })),
    aiReadability: z.object({
        score: z.number().min(0).max(100),
        structureClarity: z.number().min(0).max(100),
        factualDensity: z.number().min(0).max(100),
        citationQuality: z.number().min(0).max(100),
        answerDirectness: z.number().min(0).max(100),
    }),
    recommendations: z.array(z.string()),
    schemaMarkup: z.string().optional(),
});

/**
 * Analyzes content for AEO optimization opportunities
 */
export async function analyzeAEO(
    content: string,
    contentType: 'blog' | 'article' | 'faq' | 'guide' = 'blog'
): Promise<AEOAnalysis> {
    const client = getBedrockClient();

    const systemPrompt = `You are an expert in AEO (Answer Engine Optimization) - optimizing content for AI search engines and language models like ChatGPT, Claude, Perplexity, Google AI Overviews, and Bing Copilot.

Your role is to analyze how well content is structured for AI extraction and presentation.

Key AEO principles:
1. **Direct Answers**: AI engines prefer content that directly answers questions
2. **Clear Structure**: Well-organized content with clear headings and sections
3. **Factual Density**: High concentration of verifiable facts and data
4. **Context Clarity**: Clear context for each statement (who, what, when, where, why)
5. **Citation Quality**: Proper attribution and sources
6. **Extractability**: Easy for AI to extract key information
7. **Schema Markup**: Structured data that AI can parse
8. **Natural Language**: Conversational tone that AI can quote naturally`;

    const userPrompt = `Analyze the following ${contentType} content for AEO (Answer Engine Optimization):

**Content:**
\`\`\`
${content.substring(0, 8000)}${content.length > 8000 ? '\n... (truncated)' : ''}
\`\`\`

Evaluate how well this content is optimized for AI search engines and language models.

**Analysis Criteria:**

1. **AI Engine Compatibility (0-100 each):**
   - ChatGPT: How well structured for OpenAI's models
   - Claude: How well structured for Anthropic's models
   - Perplexity: How well suited for citation-based search
   - Google AI: How well optimized for AI Overviews
   - Bing Copilot: How well structured for Microsoft's AI

2. **Extractability (0-100 each):**
   - Key Facts: How easily AI can extract key information
   - Direct Answers: How well content answers questions directly
   - Context Clarity: How clear the context is for each statement
   - Structured Data: Presence of structured, parseable data

3. **Strengths & Weaknesses:**
   - What makes this content AI-friendly
   - What prevents AI from using it effectively

4. **Recommendations:**
   - Specific improvements for better AEO

Respond with JSON matching this structure:
{
  "score": <overall AEO score 0-100>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "aiEngineCompatibility": {
    "chatgpt": <0-100>,
    "claude": <0-100>,
    "perplexity": <0-100>,
    "googleAI": <0-100>,
    "bingCopilot": <0-100>
  },
  "extractability": {
    "keyFacts": <0-100>,
    "directAnswers": <0-100>,
    "contextClarity": <0-100>,
    "structuredData": <0-100>
  },
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}`;

    const result = await client.invokeWithPrompts(
        systemPrompt,
        userPrompt,
        AEOAnalysisSchema,
        {
            ...MODEL_CONFIGS.ANALYTICAL,
            flowName: 'aeoAnalysis',
        }
    );

    return result;
}

/**
 * Optimizes content for AEO
 */
export async function optimizeForAEO(
    content: string,
    contentType: 'blog' | 'article' | 'faq' | 'guide' = 'blog',
    targetKeywords?: string[]
): Promise<AEOOptimizationResult> {
    const client = getBedrockClient();

    // First analyze to understand current state
    const analysis = await analyzeAEO(content, contentType);

    const systemPrompt = `You are an expert in AEO (Answer Engine Optimization). Your role is to optimize content so AI search engines and language models can easily extract, understand, and present the information.

Optimization principles:
1. **Question-Answer Format**: Structure content to answer specific questions
2. **Clear Hierarchy**: Use proper heading structure (H1, H2, H3)
3. **Factual Statements**: Lead with facts, then provide context
4. **Bullet Points**: Use lists for easy extraction
5. **Data Tables**: Present data in structured formats
6. **Citations**: Include sources and references
7. **Definitions**: Define key terms clearly
8. **Examples**: Provide concrete examples
9. **Summaries**: Include TL;DR or key takeaways
10. **Schema Markup**: Suggest structured data markup`;

    const keywordsContext = targetKeywords?.length
        ? `\n**Target Keywords:** ${targetKeywords.join(', ')}`
        : '';

    const userPrompt = `Optimize the following content for AI search engines (ChatGPT, Claude, Perplexity, Google AI, Bing Copilot):

**Original Content:**
\`\`\`
${content}
\`\`\`

**Current AEO Score:** ${analysis.score}/100

**Weaknesses to Address:**
${analysis.weaknesses.map(w => `- ${w}`).join('\n')}

**Recommendations:**
${analysis.recommendations.map(r => `- ${r}`).join('\n')}${keywordsContext}

**Optimization Goals:**
1. Make content easily extractable by AI
2. Structure for direct answer presentation
3. Add clear context to all statements
4. Improve factual density
5. Enhance citation quality
6. Add structured data where appropriate

**Constraints:**
- Maintain the core message and intent
- Keep content accurate and factual
- Preserve real estate focus
- Use natural, conversational language
- Don't add false information

Respond with JSON:
{
  "optimizedContent": "<the AEO-optimized content>",
  "improvements": [
    {
      "category": "<what was improved>",
      "before": "<original text snippet>",
      "after": "<improved text snippet>",
      "impact": "high|medium|low"
    }
  ],
  "aiReadability": {
    "score": <0-100>,
    "structureClarity": <0-100>,
    "factualDensity": <0-100>,
    "citationQuality": <0-100>,
    "answerDirectness": <0-100>
  },
  "recommendations": ["<additional recommendation 1>", ...],
  "schemaMarkup": "<suggested schema.org JSON-LD markup (optional)>"
}`;

    const result = await client.invokeWithPrompts(
        systemPrompt,
        userPrompt,
        AEOOptimizationSchema,
        {
            ...MODEL_CONFIGS.CREATIVE,
            maxTokens: 8192,
            flowName: 'aeoOptimization',
        }
    );

    return {
        score: result.aiReadability.score,
        optimizedContent: result.optimizedContent,
        improvements: result.improvements,
        aiReadability: result.aiReadability,
        recommendations: result.recommendations,
        schemaMarkup: result.schemaMarkup,
    };
}

/**
 * Quick AEO check - fast analysis without full optimization
 */
export async function quickAEOCheck(content: string): Promise<{
    score: number;
    issues: string[];
    quickFixes: string[];
}> {
    const analysis = await analyzeAEO(content);

    // Identify quick fixes
    const quickFixes: string[] = [];

    if (analysis.extractability.directAnswers < 70) {
        quickFixes.push('Add direct answers to common questions at the start');
    }

    if (analysis.extractability.structuredData < 50) {
        quickFixes.push('Use bullet points and numbered lists for key information');
    }

    if (analysis.extractability.contextClarity < 70) {
        quickFixes.push('Add context (who, what, when, where) to key statements');
    }

    if (analysis.extractability.keyFacts < 70) {
        quickFixes.push('Lead paragraphs with factual statements');
    }

    return {
        score: analysis.score,
        issues: analysis.weaknesses,
        quickFixes,
    };
}

/**
 * Generates FAQ section optimized for AI engines
 */
export async function generateAEOFAQ(
    content: string,
    numQuestions: number = 5
): Promise<{ question: string; answer: string }[]> {
    const client = getBedrockClient();

    const systemPrompt = `You are an expert at creating FAQ sections optimized for AI search engines. Generate questions and answers that AI models can easily extract and present to users.`;

    const userPrompt = `Based on the following content, generate ${numQuestions} frequently asked questions with clear, direct answers optimized for AI extraction:

**Content:**
\`\`\`
${content.substring(0, 4000)}
\`\`\`

**Requirements:**
- Questions should be natural, conversational queries users would ask
- Answers should be direct and factual (2-3 sentences)
- Include specific data, numbers, or facts when possible
- Use clear, simple language
- Structure answers for easy AI extraction

Respond with JSON:
{
  "faqs": [
    {
      "question": "<question>",
      "answer": "<direct answer>"
    }
  ]
}`;

    const FAQSchema = z.object({
        faqs: z.array(z.object({
            question: z.string(),
            answer: z.string(),
        })),
    });

    const result = await client.invokeWithPrompts(
        systemPrompt,
        userPrompt,
        FAQSchema,
        {
            ...MODEL_CONFIGS.BALANCED,
            flowName: 'aeoFAQGeneration',
        }
    );

    return result.faqs;
}

/**
 * Generates schema.org markup for better AI understanding
 */
export function generateSchemaMarkup(
    contentType: 'Article' | 'BlogPosting' | 'FAQPage' | 'HowTo',
    data: {
        headline: string;
        description?: string;
        author?: string;
        datePublished?: string;
        keywords?: string[];
        faqs?: { question: string; answer: string }[];
    }
): string {
    const baseSchema = {
        '@context': 'https://schema.org',
        '@type': contentType,
        headline: data.headline,
        description: data.description,
        author: data.author ? {
            '@type': 'Person',
            name: data.author,
        } : undefined,
        datePublished: data.datePublished,
        keywords: data.keywords?.join(', '),
    };

    if (contentType === 'FAQPage' && data.faqs) {
        return JSON.stringify({
            ...baseSchema,
            mainEntity: data.faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
        }, null, 2);
    }

    return JSON.stringify(baseSchema, null, 2);
}

/**
 * AEO best practices checker
 */
export function checkAEOBestPractices(content: string): {
    passed: string[];
    failed: string[];
    score: number;
} {
    const checks = {
        'Has clear headings': /^#{1,3}\s+.+$/m.test(content),
        'Uses bullet points': /^[\*\-]\s+.+$/m.test(content),
        'Contains numbers/data': /\d+%|\d+\s+(percent|dollars|homes|properties)/i.test(content),
        'Has question format': /\?/g.test(content),
        'Includes examples': /for example|such as|like|including/i.test(content),
        'Uses clear language': content.split(' ').length / content.split('.').length < 25, // Avg sentence length < 25 words
        'Has introduction': content.length > 200,
        'Has conclusion': /in conclusion|to sum up|in summary|overall/i.test(content),
    };

    const passed: string[] = [];
    const failed: string[] = [];

    Object.entries(checks).forEach(([check, result]) => {
        if (result) {
            passed.push(check);
        } else {
            failed.push(check);
        }
    });

    const score = Math.round((passed.length / Object.keys(checks).length) * 100);

    return { passed, failed, score };
}
