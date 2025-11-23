# News Feed Setup Guide

## Overview

The news feed is now located in the **Market Hub → News tab** and has been optimized to reduce NewsAPI costs and improve performance through intelligent caching, rate limiting, and fallback mechanisms.

## Environment Variables

Add these to your `.env.local` file:

```bash
# Required: NewsAPI.org API key
NEWS_API_KEY=your_newsapi_key_here

# Optional: Specify your NewsAPI tier for better rate limiting
NEWS_API_TIER=free  # Options: free, developer, business
```

## Getting a NewsAPI Key

1. Go to [NewsAPI.org](https://newsapi.org/)
2. Sign up for a free account
3. Copy your API key from the dashboard
4. Add it to your `.env.local` file

## Rate Limits by Tier

- **Free**: 100 requests/day
- **Developer**: 500 requests/day
- **Business**: 50,000 requests/day

## Cost Optimization Features

### 1. Intelligent Caching

- News articles are cached for 30 minutes
- Reduces API calls by ~90% for repeated requests
- Automatic cache cleanup prevents memory leaks

### 2. Request Deduplication

- Multiple requests for the same location are merged
- Prevents duplicate API calls during rapid filtering

### 3. Fallback System

- Shows cached articles when API fails
- Provides mock articles when no cache exists
- Graceful degradation ensures users always see content

### 4. Rate Limiting

- Tracks hourly request limits
- Returns cached data when limits are reached
- Prevents unexpected API charges

### 5. Smart Prefetching

- Preloads news for common locations
- Improves perceived performance
- Only runs when cache is empty

## Monitoring

In development mode, you'll see a monitoring widget that shows:

- Cache hit/miss statistics
- Active request count
- Cache health metrics

## Configuration

Adjust settings in `src/lib/news-config.ts`:

```typescript
export const NEWS_CONFIG = {
  CACHE_DURATION: 30 * 60 * 1000, // 30 minutes
  MAX_REQUESTS_PER_HOUR: 100, // Adjust based on your plan
  ENABLE_FALLBACK_NEWS: true, // Show mock news when API fails
  ENABLE_PREFETCH: true, // Preload common locations
  // ... more options
};
```

## Troubleshooting

### No Articles Showing

1. Check that `NEWS_API_KEY` is set in `.env.local`
2. Verify your API key is valid at NewsAPI.org
3. Check browser console for error messages

### Rate Limit Errors

1. Reduce `MAX_REQUESTS_PER_HOUR` in config
2. Increase `CACHE_DURATION` to cache longer
3. Consider upgrading your NewsAPI plan

### Performance Issues

1. Enable monitoring to see cache statistics
2. Increase cache duration if hit rate is low
3. Reduce prefetch locations if needed

## Production Deployment

For production:

1. Set `NEWS_API_KEY` in your deployment environment
2. Set `NEWS_API_TIER` to match your plan
3. Monitor usage through NewsAPI dashboard
4. Consider implementing usage alerts

The system is designed to gracefully handle API failures and rate limits, ensuring users always have a good experience even when the external API is unavailable.
