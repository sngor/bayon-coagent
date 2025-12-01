/**
 * SEO Scoring Algorithm
 * 
 * Evaluates content against SEO best practices and calculates a composite score (0-100).
 * Factors include title length, heading structure, keyword density, readability, and content length.
 */

export interface SEOScoreFactors {
    titleScore: number;
    headingScore: number;
    keywordScore: number;
    readabilityScore: number;
    contentLengthScore: number;
}

export interface SEOScoreResult {
    score: number; // 0-100 composite score
    factors: SEOScoreFactors;
    details: {
        titleLength: number;
        headingCounts: { h1: number; h2: number; h3: number };
        keywordDensity: number;
        readabilityScore: number;
        wordCount: number;
    };
}

/**
 * Calculates a comprehensive SEO score for content
 * @param content The content to analyze
 * @param title The title/headline
 * @param targetKeywords Optional array of target keywords
 * @returns SEO score result with breakdown
 */
export function calculateSEOScore(
    content: string,
    title: string,
    targetKeywords: string[] = []
): SEOScoreResult {
    const titleScore = evaluateTitleLength(title);
    const headingScore = evaluateHeadingStructure(content);
    const keywordScore = evaluateKeywordDensity(content, targetKeywords);
    const readabilityScore = evaluateReadability(content);
    const contentLengthScore = evaluateContentLength(content);

    // Weighted composite score
    const score = Math.round(
        titleScore * 0.2 +
        headingScore * 0.2 +
        keywordScore * 0.2 +
        readabilityScore * 0.2 +
        contentLengthScore * 0.2
    );

    const wordCount = countWords(content);
    const headingCounts = countHeadings(content);
    const keywordDensity = calculateKeywordDensity(content, targetKeywords);
    const fleschScore = calculateFleschReadingEase(content);

    return {
        score: Math.max(0, Math.min(100, score)),
        factors: {
            titleScore,
            headingScore,
            keywordScore,
            readabilityScore,
            contentLengthScore,
        },
        details: {
            titleLength: title.length,
            headingCounts,
            keywordDensity,
            readabilityScore: fleschScore,
            wordCount,
        },
    };
}

/**
 * Evaluates title length (optimal: 50-60 characters)
 * @param title The title to evaluate
 * @returns Score 0-100
 */
export function evaluateTitleLength(title: string): number {
    const length = title.length;

    if (length >= 50 && length <= 60) {
        return 100; // Optimal range
    } else if (length >= 40 && length < 50) {
        return 80; // Slightly short
    } else if (length > 60 && length <= 70) {
        return 80; // Slightly long
    } else if (length >= 30 && length < 40) {
        return 60; // Too short
    } else if (length > 70 && length <= 80) {
        return 60; // Too long
    } else if (length < 30) {
        return 30; // Way too short
    } else {
        return 30; // Way too long (>80)
    }
}

/**
 * Evaluates heading structure (H1, H2, H3)
 * @param content The content to evaluate
 * @returns Score 0-100
 */
export function evaluateHeadingStructure(content: string): number {
    const counts = countHeadings(content);
    let score = 0;

    // H1: Should have exactly 1
    if (counts.h1 === 1) {
        score += 40;
    } else if (counts.h1 === 0) {
        score += 0; // Missing H1 is bad
    } else {
        score += 20; // Multiple H1s is not ideal
    }

    // H2: Should have at least 2-3
    if (counts.h2 >= 2 && counts.h2 <= 6) {
        score += 40;
    } else if (counts.h2 === 1) {
        score += 20;
    } else if (counts.h2 > 6) {
        score += 30; // Too many is okay but not optimal
    } else {
        score += 0; // No H2s
    }

    // H3: Optional but good to have
    if (counts.h3 >= 1 && counts.h3 <= 10) {
        score += 20;
    } else if (counts.h3 > 10) {
        score += 10; // Too many
    } else {
        score += 10; // None is okay
    }

    return Math.min(100, score);
}

/**
 * Evaluates keyword density (optimal: 1-2%)
 * @param content The content to evaluate
 * @param targetKeywords Array of target keywords
 * @returns Score 0-100
 */
export function evaluateKeywordDensity(
    content: string,
    targetKeywords: string[]
): number {
    if (targetKeywords.length === 0) {
        return 50; // No keywords to evaluate, neutral score
    }

    const density = calculateKeywordDensity(content, targetKeywords);

    if (density >= 1 && density <= 2) {
        return 100; // Optimal range
    } else if (density >= 0.5 && density < 1) {
        return 70; // Slightly low
    } else if (density > 2 && density <= 3) {
        return 70; // Slightly high
    } else if (density >= 0.2 && density < 0.5) {
        return 40; // Too low
    } else if (density > 3 && density <= 5) {
        return 40; // Too high (keyword stuffing)
    } else if (density < 0.2) {
        return 20; // Way too low
    } else {
        return 10; // Way too high (>5%)
    }
}

/**
 * Evaluates readability using Flesch Reading Ease
 * @param content The content to evaluate
 * @returns Score 0-100
 */
export function evaluateReadability(content: string): number {
    const fleschScore = calculateFleschReadingEase(content);

    // Flesch scores: 60-70 is standard, 70-80 is fairly easy, 80-90 is easy
    // For real estate content, aim for 60-80 (accessible but professional)
    if (fleschScore >= 60 && fleschScore <= 80) {
        return 100; // Optimal range
    } else if (fleschScore >= 50 && fleschScore < 60) {
        return 80; // Slightly difficult
    } else if (fleschScore > 80 && fleschScore <= 90) {
        return 80; // Slightly too easy
    } else if (fleschScore >= 40 && fleschScore < 50) {
        return 60; // Difficult
    } else if (fleschScore > 90) {
        return 60; // Too simple
    } else if (fleschScore >= 30 && fleschScore < 40) {
        return 40; // Very difficult
    } else {
        return 20; // Extremely difficult (<30)
    }
}

/**
 * Evaluates content length (optimal: 1500+ words)
 * @param content The content to evaluate
 * @returns Score 0-100
 */
export function evaluateContentLength(content: string): number {
    const wordCount = countWords(content);

    if (wordCount >= 1500) {
        return 100; // Optimal length
    } else if (wordCount >= 1000 && wordCount < 1500) {
        return 80; // Good length
    } else if (wordCount >= 750 && wordCount < 1000) {
        return 60; // Acceptable length
    } else if (wordCount >= 500 && wordCount < 750) {
        return 40; // Short
    } else if (wordCount >= 300 && wordCount < 500) {
        return 20; // Too short
    } else {
        return 10; // Way too short (<300)
    }
}

/**
 * Counts words in content
 * @param content The content to analyze
 * @returns Word count
 */
export function countWords(content: string): number {
    // Remove HTML tags and extra whitespace
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;

    // Split by whitespace and filter empty strings
    const words = text.split(/\s+/).filter(word => word.length > 0);
    return words.length;
}

/**
 * Counts headings in content
 * @param content The content to analyze
 * @returns Heading counts
 */
export function countHeadings(content: string): { h1: number; h2: number; h3: number } {
    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (content.match(/<h3[^>]*>/gi) || []).length;

    return {
        h1: h1Count,
        h2: h2Count,
        h3: h3Count,
    };
}

/**
 * Calculates keyword density as a percentage
 * @param content The content to analyze
 * @param targetKeywords Array of target keywords
 * @returns Keyword density percentage
 */
export function calculateKeywordDensity(
    content: string,
    targetKeywords: string[]
): number {
    if (targetKeywords.length === 0) return 0;

    const text = content.replace(/<[^>]*>/g, ' ').toLowerCase();
    const totalWords = countWords(content);

    if (totalWords === 0) return 0;

    let totalKeywordOccurrences = 0;

    for (const keyword of targetKeywords) {
        const keywordLower = keyword.toLowerCase();
        const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = text.match(regex);
        totalKeywordOccurrences += matches ? matches.length : 0;
    }

    return (totalKeywordOccurrences / totalWords) * 100;
}

/**
 * Calculates Flesch Reading Ease score
 * Formula: 206.835 - 1.015 * (total words / total sentences) - 84.6 * (total syllables / total words)
 * @param content The content to analyze
 * @returns Flesch Reading Ease score (0-100+)
 */
export function calculateFleschReadingEase(content: string): number {
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    if (!text) return 0;

    const totalWords = countWords(text);
    if (totalWords === 0) return 0;

    const totalSentences = countSentences(text);
    const totalSyllables = countSyllables(text);

    if (totalSentences === 0) return 0;

    const score = 206.835 - 1.015 * (totalWords / totalSentences) - 84.6 * (totalSyllables / totalWords);

    // Clamp to reasonable range
    return Math.max(0, Math.min(100, score));
}

/**
 * Counts sentences in text
 * @param text The text to analyze
 * @returns Sentence count
 */
export function countSentences(text: string): number {
    // Split by sentence-ending punctuation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return Math.max(1, sentences.length);
}

/**
 * Counts syllables in text (approximation)
 * @param text The text to analyze
 * @returns Syllable count
 */
export function countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    let totalSyllables = 0;

    for (const word of words) {
        totalSyllables += countSyllablesInWord(word);
    }

    return totalSyllables;
}

/**
 * Counts syllables in a single word (approximation)
 * @param word The word to analyze
 * @returns Syllable count
 */
export function countSyllablesInWord(word: string): number {
    // Remove non-alphabetic characters
    word = word.replace(/[^a-z]/g, '');
    if (word.length === 0) return 0;
    if (word.length <= 3) return 1;

    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g);
    let syllables = vowelGroups ? vowelGroups.length : 0;

    // Adjust for silent 'e' at the end
    if (word.endsWith('e') && syllables > 1) {
        syllables--;
    }

    // Ensure at least 1 syllable
    return Math.max(1, syllables);
}
