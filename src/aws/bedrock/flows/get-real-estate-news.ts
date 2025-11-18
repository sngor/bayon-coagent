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
    
    // Construct the query. Prioritize local news if a location is provided.
    const baseQuery = '"real estate" AND (market OR housing OR mortgage)';
    const finalQuery = location ? `(${baseQuery}) AND "${location}"` : baseQuery;
    
    url.searchParams.append('q', finalQuery);
    url.searchParams.append('sortBy', 'publishedAt');
    url.searchParams.append('language', 'en');
    url.searchParams.append('pageSize', '5');
    url.searchParams.append('apiKey', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to fetch news from NewsAPI: ${errorData.message}`);
    }

    const data = await response.json();

    const articles = data.articles.map((article: any) => ({
      title: article.title,
      url: article.url,
      source: article.source.name,
      summary: article.description,
    }));

    return { articles };
  }
);

export async function getRealEstateNews(
  input: GetRealEstateNewsInput
): Promise<GetRealEstateNewsOutput> {
  return getRealEstateNewsFlow.execute(input);
}
