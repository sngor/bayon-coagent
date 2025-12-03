/**
 * @fileOverview Website crawling utilities for analyzing agent websites
 * 
 * This module provides functions to:
 * - Fetch website HTML with timeout handling
 * - Extract internal links from HTML
 * - Crawl multiple pages (homepage + up to 10 additional pages)
 * - Handle network errors and timeouts gracefully
 * 
 * Requirements: 1.2, 1.5
 */

import type { CrawledData } from '@/ai/schemas/website-analysis-schemas';

// Re-export the type for convenience
export type { CrawledData };

/**
 * Configuration options for website crawling
 */
export interface CrawlOptions {
    /** Timeout in milliseconds for homepage fetch (default: 30000) */
    homepageTimeout?: number;
    /** Timeout in milliseconds for additional page fetches (default: 15000) */
    additionalPageTimeout?: number;
    /** Maximum number of additional pages to crawl (default: 10) */
    maxAdditionalPages?: number;
    /** User agent string to use for requests */
    userAgent?: string;
}

/**
 * Default crawl options
 */
const DEFAULT_CRAWL_OPTIONS: Required<CrawlOptions> = {
    homepageTimeout: 30000,
    additionalPageTimeout: 15000,
    maxAdditionalPages: 10,
    userAgent: 'BayonCoagent-WebsiteAnalyzer/1.0',
};

/**
 * Fetch a single page with timeout
 * 
 * @param url - The URL to fetch
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @param userAgent - User agent string for the request
 * @returns The HTML content of the page
 * @throws Error if the request fails, times out, or returns non-HTML content
 */
export async function fetchPage(
    url: string,
    timeoutMs: number = 30000,
    userAgent: string = DEFAULT_CRAWL_OPTIONS.userAgent
): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent,
            },
            signal: controller.signal,
            redirect: 'follow', // Follow redirects
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Provide more specific error messages based on status code
            if (response.status === 404) {
                throw new Error(`Page not found (404). Please verify the URL is correct.`);
            } else if (response.status === 403) {
                throw new Error(`Access forbidden (403). The website may be blocking automated access.`);
            } else if (response.status === 500 || response.status === 502 || response.status === 503) {
                throw new Error(`Website server error (${response.status}). The website may be temporarily down.`);
            } else if (response.status === 401) {
                throw new Error(`Authentication required (401). This website requires login to access.`);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        }

        // Verify content type is HTML
        const contentType = response.headers?.get('content-type') || '';
        if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
            throw new Error(`Invalid content type: ${contentType}. Expected HTML content. This may not be a website homepage.`);
        }

        const html = await response.text();

        // Basic validation that we got HTML
        if (!html || html.trim().length === 0) {
            throw new Error('Received empty response from website.');
        }

        // Check if response looks like HTML
        if (!html.toLowerCase().includes('<html') && !html.toLowerCase().includes('<!doctype')) {
            throw new Error('Response does not appear to be valid HTML.');
        }

        return html;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeoutMs / 1000} seconds. The website may be slow or unresponsive. Please try again.`);
            }
            if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
                throw new Error(`Website not found. Please check the URL spelling and ensure the website exists.`);
            }
            if (error.message.includes('ECONNREFUSED')) {
                throw new Error(`Connection refused. The website may be down or blocking connections.`);
            }
            if (error.message.includes('ETIMEDOUT')) {
                throw new Error(`Connection timeout. The website is not responding. Please try again later.`);
            }
            if (error.message.includes('certificate') || error.message.includes('SSL') || error.message.includes('TLS')) {
                throw new Error(`SSL/Certificate error. The website has an invalid or expired security certificate.`);
            }
            if (error.message.includes('ECONNRESET')) {
                throw new Error(`Connection reset. The website closed the connection unexpectedly.`);
            }
            // Re-throw with more context if not already handled
            if (!error.message.includes('Failed to fetch')) {
                throw new Error(`Failed to fetch ${url}: ${error.message}`);
            }
            throw error;
        }
        throw new Error(`Unexpected error while fetching ${url}`);
    }
}

/**
 * Extract internal links from HTML
 * 
 * Finds all href attributes in the HTML and filters for same-domain links.
 * Excludes anchors, mailto, tel, and javascript links.
 * 
 * @param html - The HTML content to parse
 * @param baseUrl - The base URL for resolving relative links
 * @returns Array of absolute URLs for internal pages
 */
export function extractInternalLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const urlObj = new URL(baseUrl);
    const domain = urlObj.hostname;

    // Simple regex to find href attributes
    // This is a basic implementation - for production, consider using a proper HTML parser
    const hrefRegex = /href=["']([^"']+)["']/gi;
    let match;

    while ((match = hrefRegex.exec(html)) !== null) {
        try {
            const href = match[1];

            // Skip anchors, mailto, tel, javascript
            if (
                href.startsWith('#') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                href.startsWith('javascript:')
            ) {
                continue;
            }

            // Resolve relative URLs
            const absoluteUrl = new URL(href, baseUrl);

            // Only include same-domain links
            if (absoluteUrl.hostname === domain) {
                // Clean URL (remove query params and hash)
                const cleanUrl = absoluteUrl.origin + absoluteUrl.pathname;

                // Avoid duplicates and self-references
                if (!links.includes(cleanUrl) && cleanUrl !== baseUrl) {
                    links.push(cleanUrl);
                }
            }
        } catch {
            // Invalid URL, skip
            continue;
        }
    }

    return links;
}

/**
 * Crawl a website (homepage + up to 10 additional pages)
 * 
 * This function:
 * 1. Validates the URL before crawling
 * 2. Checks cache for existing crawl data
 * 3. Fetches the homepage
 * 4. Extracts internal links from the homepage
 * 5. Fetches up to N additional pages IN PARALLEL (default: 10)
 * 6. Handles errors gracefully, continuing with other pages if one fails
 * 7. Caches the results for 24 hours
 * 
 * @param url - The website URL to crawl (should be the homepage)
 * @param options - Optional crawl configuration
 * @returns CrawledData containing homepage, additional pages, and crawled URLs
 * @throws Error if the URL is invalid or the homepage cannot be fetched
 */
export async function crawlWebsite(
    url: string,
    options: CrawlOptions = {}
): Promise<CrawledData> {
    const config = { ...DEFAULT_CRAWL_OPTIONS, ...options };

    console.log(`[crawlWebsite] Starting crawl of ${url}`);

    // Step 0: Validate URL
    if (!isValidCrawlUrl(url)) {
        throw new Error(
            'Invalid website URL. Please provide a valid http:// or https:// URL for a public website.'
        );
    }

    // Step 0.5: Check cache first (only in production/server environment)
    let cache: any = null;
    let deduplicateRequest: any = null;

    try {
        const cacheModule = await import('./website-analysis-cache');
        cache = cacheModule.getCrawlCache();
        deduplicateRequest = cacheModule.deduplicateRequest;

        const cachedData = cache.get(url);
        if (cachedData) {
            console.log(`[crawlWebsite] Using cached data for ${url}`);
            return cachedData;
        }
    } catch (error) {
        // Cache not available (e.g., in test environment), continue without caching
        console.log(`[crawlWebsite] Cache not available, proceeding without cache`);
    }

    // Step 0.6: Deduplicate concurrent requests (if available)
    const crawlFn = async () => {
        // Step 1: Fetch homepage
        let homepage: string;
        try {
            homepage = await fetchPage(url, config.homepageTimeout, config.userAgent);
            console.log(`[crawlWebsite] Homepage fetched (${homepage.length} bytes)`);
        } catch (error) {
            console.error(`[crawlWebsite] Failed to fetch homepage:`, error);
            // Re-throw with user-friendly message
            if (error instanceof Error) {
                throw error; // Already has user-friendly message from fetchPage
            }
            throw new Error('Unable to access the website. Please verify the URL and try again.');
        }

        // Step 2: Extract internal links
        let internalLinks: string[] = [];
        try {
            internalLinks = extractInternalLinks(homepage, url);
            console.log(`[crawlWebsite] Found ${internalLinks.length} internal links`);
        } catch (error) {
            console.warn(`[crawlWebsite] Failed to extract links:`, error);
            // Continue with just the homepage if link extraction fails
        }

        // Step 3: Fetch up to N additional pages IN PARALLEL
        const pagesToCrawl = internalLinks.slice(0, config.maxAdditionalPages);
        const additionalPages: string[] = [];
        const crawledUrls: string[] = [url]; // Start with homepage URL

        // Fetch all pages in parallel using Promise.allSettled
        // This allows some pages to fail without blocking others
        const startTime = Date.now();
        const fetchPromises = pagesToCrawl.map(async (pageUrl) => {
            try {
                const html = await fetchPage(
                    pageUrl,
                    config.additionalPageTimeout,
                    config.userAgent
                );
                return { success: true, url: pageUrl, html };
            } catch (error) {
                console.warn(`[crawlWebsite] Failed to fetch ${pageUrl}:`, error);
                return { success: false, url: pageUrl, error };
            }
        });

        const results = await Promise.allSettled(fetchPromises);
        const fetchTime = Date.now() - startTime;

        // Process results
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
                additionalPages.push(result.value.html);
                crawledUrls.push(result.value.url);
                console.log(`[crawlWebsite] Fetched ${result.value.url} (${result.value.html.length} bytes)`);
            }
        });

        console.log(
            `[crawlWebsite] Crawl complete. Fetched ${crawledUrls.length} pages total in ${fetchTime}ms (${Math.round(fetchTime / crawledUrls.length)}ms avg per page)`
        );

        const crawledData: CrawledData = {
            homepage,
            additionalPages,
            crawledUrls,
        };

        // Step 4: Cache the results (if cache is available)
        if (cache) {
            try {
                cache.set(url, crawledData);
            } catch (error) {
                console.warn(`[crawlWebsite] Failed to cache results:`, error);
            }
        }

        return crawledData;
    };

    // Use deduplication if available, otherwise just execute the crawl function
    if (deduplicateRequest) {
        return deduplicateRequest(url, crawlFn);
    } else {
        return crawlFn();
    }
}

/**
 * Validate a URL before crawling
 * 
 * Checks if the URL:
 * - Has a valid format
 * - Uses http or https protocol
 * - Is not a private/internal IP address (basic check)
 * 
 * @param url - The URL to validate
 * @returns true if valid, false otherwise
 */
export function isValidCrawlUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);

        // Only allow http and https
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return false;
        }

        // Basic check for private IP ranges (not exhaustive)
        const hostname = urlObj.hostname;
        if (
            hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') ||
            hostname.startsWith('172.17.') ||
            hostname.startsWith('172.18.') ||
            hostname.startsWith('172.19.') ||
            hostname.startsWith('172.20.') ||
            hostname.startsWith('172.21.') ||
            hostname.startsWith('172.22.') ||
            hostname.startsWith('172.23.') ||
            hostname.startsWith('172.24.') ||
            hostname.startsWith('172.25.') ||
            hostname.startsWith('172.26.') ||
            hostname.startsWith('172.27.') ||
            hostname.startsWith('172.28.') ||
            hostname.startsWith('172.29.') ||
            hostname.startsWith('172.30.') ||
            hostname.startsWith('172.31.')
        ) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}
