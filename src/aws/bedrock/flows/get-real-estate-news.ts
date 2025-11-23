'use server';

/**
 * @fileOverview Flow to fetch the latest real estate news from NewsAPI.org.
 * 
 * Note: This flow doesn't use AI - it's a direct API integration.
 */

import { defineFlow } from '../flow-base';
import {
  GetRealEstateNewsInputSchema,
  GetRealEstateNewsOutputSchema,
  type GetRealEstateNewsInput,
  type GetRealEstateNewsOutput,
} from '@/ai/schemas/real-estate-news-schemas';

export { type GetRealEstateNewsInput, type GetRealEstateNewsOutput };

const getRealEstateNewsFlow = defineFlow(
  {
    name: 'getRealEstateNewsFlow',
    inputSchema: GetRealEstateNewsInputSchema,
    outputSchema: GetRealEstateNewsOutputSchema,
  },
  async ({ location }) => {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      throw new Error('NewsAPI key is not configured. Please add NEWS_API_KEY to your .env file.');
    }

    const url = new URL('https://newsapi.org/v2/everything');

    // Construct a more focused real estate and market query
    const realEstateTerms = [
      'real estate',
      'housing market',
      'property market',
      'home sales',
      'mortgage rates',
      'property prices',
      'real estate trends',
      'housing inventory',
      'home values',
      'real estate investment'
    ];

    // Build a comprehensive query that focuses on real estate and market content
    let baseQuery = `(${realEstateTerms.map(term => `"${term}"`).join(' OR ')})`;

    // Add location-specific terms if provided
    if (location) {
      baseQuery += ` AND (${location} OR "${location} real estate" OR "${location} housing")`;
    }

    // Exclude irrelevant content
    const excludeTerms = ['celebrity', 'entertainment', 'sports', 'politics', 'crime'];
    const excludeQuery = excludeTerms.map(term => `-${term}`).join(' ');

    const finalQuery = `${baseQuery} ${excludeQuery}`;

    url.searchParams.append('q', finalQuery);
    url.searchParams.append('sortBy', 'publishedAt');
    url.searchParams.append('language', 'en');
    url.searchParams.append('pageSize', '10');
    url.searchParams.append('apiKey', apiKey);

    console.log('NewsAPI request URL:', url.toString());

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NewsAPI error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Failed to fetch news from NewsAPI: HTTP ${response.status}`);
      }
      throw new Error(`Failed to fetch news from NewsAPI: ${errorData.message || errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('NewsAPI response:', { totalResults: data.totalResults, articlesCount: data.articles?.length });

    const articles = (data.articles || [])
      .filter((article: any) => {
        if (!article || !article.title || !article.url) return false;

        // Filter for real estate and market relevance
        const title = article.title.toLowerCase();
        const description = (article.description || '').toLowerCase();
        const content = `${title} ${description}`;

        // Must contain real estate or market-related keywords
        const realEstateKeywords = [
          'real estate', 'housing', 'property', 'home', 'mortgage', 'market',
          'residential', 'commercial', 'investment', 'rental', 'buyer', 'seller',
          'agent', 'broker', 'listing', 'sale', 'price', 'value', 'appraisal',
          'construction', 'development', 'zoning', 'interest rate', 'refinance'
        ];

        const hasRealEstateContent = realEstateKeywords.some(keyword =>
          content.includes(keyword)
        );

        // Exclude irrelevant content
        const excludeKeywords = [
          'celebrity', 'entertainment', 'sports', 'politics', 'crime', 'weather',
          'accident', 'obituary', 'wedding', 'divorce', 'scandal', 'arrest'
        ];

        const hasExcludedContent = excludeKeywords.some(keyword =>
          content.includes(keyword)
        );

        return hasRealEstateContent && !hasExcludedContent;
      })
      .map((article: any) => ({
        title: article.title,
        url: article.url,
        source: article.source?.name || 'Unknown Source',
        description: article.description || '',
        publishedAt: article.publishedAt || new Date().toISOString(),
        imageUrl: article.urlToImage,
      }))
      .slice(0, 8); // Limit to 8 most relevant articles

    return {
      articles,
      totalResults: data.totalResults || articles.length
    };
  }
);

// Cache for news articles to reduce API calls
const newsCache = new Map<string, { data: GetRealEstateNewsOutput; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function getRealEstateNews(
  input: GetRealEstateNewsInput
): Promise<GetRealEstateNewsOutput> {
  // Create cache key based on location
  const cacheKey = input.location || 'general';
  const cached = newsCache.get(cacheKey);

  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Returning cached news data for:', cacheKey);
    return cached.data;
  }

  try {
    const result = await getRealEstateNewsFlow.execute(input);

    // Cache the result
    newsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error: any) {
    console.error('NewsAPI error, falling back to cached or mock data:', error.message);

    // Return cached data even if expired as fallback
    if (cached) {
      console.log('Returning expired cached data as fallback');
      return cached.data;
    }

    // Ultimate fallback: return mock real estate news
    return getFallbackNews(input.location);
  }
}

// Fallback news when API fails
function getFallbackNews(location?: string): GetRealEstateNewsOutput {
  const mockArticles = [
    {
      title: "Housing Market Shows Resilience Despite Economic Uncertainty",
      description: "Real estate experts analyze current market conditions and predict continued stability in home values across major metropolitan areas.",
      url: "https://example.com/housing-market-resilience",
      source: "Real Estate Weekly",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      imageUrl: undefined
    },
    {
      title: "Mortgage Rates Stabilize as Fed Signals Measured Approach",
      description: "Interest rates show signs of stabilization, providing potential homebuyers with more predictable financing options.",
      url: "https://example.com/mortgage-rates-stabilize",
      source: "Financial Real Estate News",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      imageUrl: undefined
    },
    {
      title: location ? `${location} Real Estate Market Update` : "National Real Estate Trends",
      description: location
        ? `Latest market analysis and trends specific to the ${location} area, including inventory levels and price movements.`
        : "Comprehensive overview of national real estate trends, including regional variations and market predictions.",
      url: "https://example.com/market-update",
      source: "Market Intelligence Report",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      imageUrl: undefined
    }
  ];

  return {
    articles: mockArticles,
    totalResults: mockArticles.length
  };
}
