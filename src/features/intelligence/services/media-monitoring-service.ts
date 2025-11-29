import type { MediaMention, MediaType, SentimentType, NewsArticle } from '../types/media-types';
import { v4 as uuidv4 } from 'uuid';

interface NewsAPIResponse {
    status: string;
    totalResults: number;
    articles: any[];
}

/**
 * Service for fetching and processing media mentions from various sources
 */
export class MediaMonitoringService {
    private newsApiKey: string;

    constructor() {
        this.newsApiKey = process.env.NEWS_API_KEY || '';
        if (!this.newsApiKey) {
            console.warn('NEWS_API_KEY not configured. Media monitoring will not function.');
        }
    }

    /**
     * Fetch news articles from NewsAPI
     */
    async fetchNewsArticles(
        query: string = 'real estate',
        from?: Date,
        to?: Date,
        pageSize: number = 100
    ): Promise<NewsArticle[]> {
        if (!this.newsApiKey) {
            throw new Error('NewsAPI key is not configured');
        }

        const params = new URLSearchParams({
            q: query,
            apiKey: this.newsApiKey,
            pageSize: pageSize.toString(),
            sortBy: 'publishedAt',
            language: 'en',
        });

        if (from) {
            params.append('from', from.toISOString());
        }
        if (to) {
            params.append('to', to.toISOString());
        }

        const response = await fetch(
            `https://newsapi.org/v2/everything?${params.toString()}`
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`NewsAPI error: ${error.message || response.statusText}`);
        }

        const data: NewsAPIResponse = await response.json();
        return data.articles;
    }

    /**
     * Convert NewsAPI article to MediaMention
     */
    convertToMediaMention(
        article: any,
        userId: string
    ): MediaMention {
        const sentiment = this.analyzeSentiment(article.title + ' ' + article.description);

        return {
            id: uuidv4(),
            userId,
            title: article.title || 'Untitled',
            description: article.description || '',
            content: article.content || '',
            url: article.url,
            source: article.source?.name || 'Unknown',
            author: article.author || undefined,
            mediaType: this.categorizeMediaType(article.source?.name || ''),
            publishedAt: new Date(article.publishedAt).getTime(),
            sentiment: sentiment.type,
            sentimentScore: sentiment.score,
            reach: this.estimateReach(article.source?.name || ''),
            keywords: this.extractKeywords(article.title + ' ' + article.description),
            imageUrl: article.urlToImage || undefined,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
    }

    /**
     * Simple sentiment analysis
     * In production, consider using AWS Comprehend or a dedicated sentiment API
     */
    private analyzeSentiment(text: string): { type: SentimentType; score: number } {
        const lowerText = text.toLowerCase();

        const positiveWords = [
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'growth', 'increase', 'rise', 'boom', 'success', 'gain', 'profit',
            'strong', 'soar', 'surge', 'record', 'best', 'top'
        ];

        const negativeWords = [
            'bad', 'poor', 'terrible', 'awful', 'worst', 'decline', 'fall',
            'drop', 'crash', 'loss', 'crisis', 'problem', 'issue', 'concern',
            'weak', 'plunge', 'slump', 'low', 'down'
        ];

        let positiveCount = 0;
        let negativeCount = 0;

        positiveWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) positiveCount += matches.length;
        });

        negativeWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerText.match(regex);
            if (matches) negativeCount += matches.length;
        });

        const totalSentimentWords = positiveCount + negativeCount;

        if (totalSentimentWords === 0) {
            return { type: 'neutral', score: 0 };
        }

        const score = (positiveCount - negativeCount) / totalSentimentWords;

        if (score > 0.2) {
            return { type: 'positive', score };
        } else if (score < -0.2) {
            return { type: 'negative', score };
        } else {
            return { type: 'neutral', score };
        }
    }

    /**
     * Categorize media type based on source name
     */
    private categorizeMediaType(sourceName: string): MediaType {
        const source = sourceName.toLowerCase();

        // Broadcast
        if (source.includes('cnn') || source.includes('fox') || source.includes('nbc') ||
            source.includes('abc') || source.includes('cbs') || source.includes('bbc')) {
            return 'broadcast';
        }

        // Press/Print
        if (source.includes('times') || source.includes('post') || source.includes('journal') ||
            source.includes('tribune') || source.includes('herald') || source.includes('gazette')) {
            return 'press';
        }

        // Social
        if (source.includes('twitter') || source.includes('facebook') || source.includes('reddit') ||
            source.includes('instagram') || source.includes('social')) {
            return 'social';
        }

        // Default to online
        return 'online';
    }

    /**
     * Estimate reach based on source
     */
    private estimateReach(sourceName: string): number {
        const source = sourceName.toLowerCase();

        // Major outlets
        if (source.includes('cnn') || source.includes('fox news') || source.includes('new york times')) {
            return Math.random() * 5000000 + 1000000; // 1-6M
        }

        if (source.includes('washington post') || source.includes('wall street')) {
            return Math.random() * 3000000 + 500000; // 500K-3.5M
        }

        // Regional/smaller outlets
        if (source.includes('local') || source.includes('regional')) {
            return Math.random() * 100000 + 10000; // 10K-110K
        }

        // Default
        return Math.random() * 500000 + 50000; // 50K-550K
    }

    /**
     * Extract keywords from text
     */
    private extractKeywords(text: string): string[] {
        const realEstateKeywords = [
            'real estate', 'housing', 'property', 'market', 'home', 'mortgage',
            'rates', 'prices', 'sales', 'inventory', 'buyers', 'sellers',
            'commercial', 'residential', 'development', 'construction'
        ];

        const found: string[] = [];
        const lowerText = text.toLowerCase();

        realEstateKeywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                found.push(keyword);
            }
        });

        return found;
    }

    /**
     * Fetch and convert news for a user
     */
    async fetchMediaMentionsForUser(
        userId: string,
        query: string = 'real estate',
        from?: Date,
        to?: Date
    ): Promise<MediaMention[]> {
        const articles = await this.fetchNewsArticles(query, from, to);
        return articles.map(article => this.convertToMediaMention(article, userId));
    }
}

// Export singleton instance
export const mediaMonitoringService = new MediaMonitoringService();
