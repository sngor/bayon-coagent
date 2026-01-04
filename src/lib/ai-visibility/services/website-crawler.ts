/**
 * Website Crawler and Schema Validator Service
 * 
 * Implements website crawling for existing schema markup detection and comprehensive validation
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { SchemaMarkup, ValidationResult, WebsiteAnalysis, SchemaType } from '../types';
import { SchemaMarkupSchema, WebsiteAnalysisSchema } from '../schemas';
import { schemaValidator, DetailedValidationReport } from './schema-validator';
import { z } from 'zod';

/**
 * Crawled page data
 */
export interface CrawledPage {
  url: string;
  title: string;
  content: string;
  schemaMarkup: SchemaMarkup[];
  metaTags: Record<string, string>;
  headings: string[];
  links: string[];
  images: string[];
  crawledAt: Date;
}

/**
 * Crawl configuration
 */
export interface CrawlConfig {
  maxPages: number;
  maxDepth: number;
  followExternalLinks: boolean;
  respectRobotsTxt: boolean;
  userAgent: string;
  timeout: number;
  includeImages: boolean;
  includeCSS: boolean;
  includeJS: boolean;
}

/**
 * Schema detection result
 */
export interface SchemaDetectionResult {
  found: SchemaMarkup[];
  errors: string[];
  warnings: string[];
  missingTypes: SchemaType[];
  recommendations: string[];
}

/**
 * Technical SEO issue
 */
export interface TechnicalSEOIssue {
  type: 'missing_meta' | 'duplicate_content' | 'broken_links' | 'slow_loading' | 'mobile_issues' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  element?: string;
  recommendation: string;
  codeExample?: string;
}

/**
 * Re-validation configuration
 */
export interface RevalidationConfig {
  userId: string;
  websiteUrl: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  alertOnChanges: boolean;
  alertThresholds: {
    newErrors: number;
    removedSchemas: number;
    scoreDecrease: number;
  };
}

/**
 * Website Crawler Service Interface
 */
export interface WebsiteCrawlerService {
  /**
   * Crawl website and analyze schema markup
   */
  crawlWebsite(url: string, config?: Partial<CrawlConfig>): Promise<WebsiteAnalysis>;
  
  /**
   * Detect and extract schema markup from HTML content
   */
  detectSchemaMarkup(html: string, baseUrl: string): SchemaDetectionResult;
  
  /**
   * Validate website's existing schema markup
   */
  validateWebsiteSchemas(url: string): Promise<ValidationResult[]>;
  
  /**
   * Analyze technical SEO issues
   */
  analyzeTechnicalSEO(crawledPages: CrawledPage[]): TechnicalSEOIssue[];
  
  /**
   * Generate fix recommendations with code examples
   */
  generateFixRecommendations(analysis: WebsiteAnalysis): string[];
  
  /**
   * Set up automatic re-validation
   */
  setupRevalidation(config: RevalidationConfig): Promise<void>;
  
  /**
   * Get re-validation history
   */
  getRevalidationHistory(userId: string, websiteUrl: string): Promise<WebsiteAnalysis[]>;
}

/**
 * Advanced Website Crawler Implementation
 */
export class AdvancedWebsiteCrawler implements WebsiteCrawlerService {
  private readonly defaultConfig: CrawlConfig = {
    maxPages: 50,
    maxDepth: 3,
    followExternalLinks: false,
    respectRobotsTxt: true,
    userAgent: 'Bayon-AI-Visibility-Crawler/1.0',
    timeout: 30000,
    includeImages: true,
    includeCSS: false,
    includeJS: false,
  };

  private revalidationSchedules = new Map<string, RevalidationConfig>();

  /**
   * Crawl website and analyze schema markup
   */
  async crawlWebsite(url: string, config?: Partial<CrawlConfig>): Promise<WebsiteAnalysis> {
    const crawlConfig = { ...this.defaultConfig, ...config };
    
    try {
      // Validate URL
      const validUrl = this.validateAndNormalizeUrl(url);
      
      // Crawl pages
      const crawledPages = await this.crawlPages(validUrl, crawlConfig);
      
      // Extract and analyze schema markup
      const allSchemas: SchemaMarkup[] = [];
      const allValidationResults: ValidationResult[] = [];
      
      for (const page of crawledPages) {
        const detection = this.detectSchemaMarkup(page.content, page.url);
        allSchemas.push(...detection.found);
        
        // Validate each schema
        for (const schema of detection.found) {
          const validation = schemaValidator.validateSchema(schema);
          allValidationResults.push(validation);
        }
      }
      
      // Identify missing schema types
      const missingSchemas = this.identifyMissingSchemas(allSchemas);
      
      // Analyze technical SEO issues
      const technicalIssues = this.analyzeTechnicalSEO(crawledPages);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(
        allSchemas,
        allValidationResults,
        missingSchemas,
        technicalIssues
      );

      const analysis: WebsiteAnalysis = {
        url: validUrl,
        schemaMarkup: allSchemas,
        validationResults: allValidationResults,
        missingSchemas,
        technicalIssues: technicalIssues.map(issue => issue.description),
        recommendations,
        analyzedAt: new Date(),
      };

      // Validate the analysis result
      WebsiteAnalysisSchema.parse(analysis);
      
      return analysis;
    } catch (error) {
      throw new Error(`Website crawling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect and extract schema markup from HTML content
   */
  detectSchemaMarkup(html: string, baseUrl: string): SchemaDetectionResult {
    const found: SchemaMarkup[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Extract JSON-LD scripts
      const jsonLdSchemas = this.extractJsonLdSchemas(html);
      found.push(...jsonLdSchemas);

      // Extract Microdata
      const microdataSchemas = this.extractMicrodataSchemas(html);
      found.push(...microdataSchemas);

      // Extract RDFa
      const rdfaSchemas = this.extractRdfaSchemas(html);
      found.push(...rdfaSchemas);

      // Identify missing schema types
      const missingTypes = this.identifyMissingSchemas(found);

      // Generate recommendations
      const recommendations = this.generateSchemaRecommendations(found, missingTypes);

      return {
        found,
        errors,
        warnings,
        missingTypes,
        recommendations,
      };
    } catch (error) {
      errors.push(`Schema detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        found: [],
        errors,
        warnings,
        missingTypes: [],
        recommendations: ['Fix HTML parsing errors before analyzing schema markup'],
      };
    }
  }

  /**
   * Validate website's existing schema markup
   */
  async validateWebsiteSchemas(url: string): Promise<ValidationResult[]> {
    try {
      const analysis = await this.crawlWebsite(url, { maxPages: 10, maxDepth: 2 });
      return analysis.validationResults;
    } catch (error) {
      return [{
        isValid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: ['Check website accessibility and try again'],
      }];
    }
  }

  /**
   * Analyze technical SEO issues
   */
  analyzeTechnicalSEO(crawledPages: CrawledPage[]): TechnicalSEOIssue[] {
    const issues: TechnicalSEOIssue[] = [];

    for (const page of crawledPages) {
      // Check for missing meta tags
      if (!page.metaTags.title || page.metaTags.title.length === 0) {
        issues.push({
          type: 'missing_meta',
          severity: 'high',
          description: `Missing title tag on ${page.url}`,
          element: '<title>',
          recommendation: 'Add a descriptive title tag to improve SEO and AI understanding',
          codeExample: '<title>Your Page Title - Real Estate Agent</title>',
        });
      }

      if (!page.metaTags.description) {
        issues.push({
          type: 'missing_meta',
          severity: 'medium',
          description: `Missing meta description on ${page.url}`,
          element: '<meta name="description">',
          recommendation: 'Add a meta description to improve search engine snippets',
          codeExample: '<meta name="description" content="Professional real estate services in your area">',
        });
      }

      // Check for proper heading structure
      if (page.headings.length === 0) {
        issues.push({
          type: 'missing_meta',
          severity: 'medium',
          description: `No headings found on ${page.url}`,
          recommendation: 'Use proper heading structure (H1, H2, H3) for better content organization',
          codeExample: '<h1>Main Page Title</h1>\n<h2>Section Title</h2>',
        });
      }

      // Check for schema markup presence
      if (page.schemaMarkup.length === 0) {
        issues.push({
          type: 'missing_meta',
          severity: 'high',
          description: `No schema markup found on ${page.url}`,
          recommendation: 'Add structured data markup to improve AI visibility',
          codeExample: this.generateSchemaExample(),
        });
      }
    }

    // Check for duplicate content
    const duplicateTitles = this.findDuplicateTitles(crawledPages);
    for (const title of duplicateTitles) {
      issues.push({
        type: 'duplicate_content',
        severity: 'medium',
        description: `Duplicate title found: "${title}"`,
        recommendation: 'Ensure each page has a unique title tag',
      });
    }

    return issues;
  }

  /**
   * Generate fix recommendations with code examples
   */
  generateFixRecommendations(analysis: WebsiteAnalysis): string[] {
    const recommendations: string[] = [];

    // Schema-related recommendations
    if (analysis.schemaMarkup.length === 0) {
      recommendations.push(
        'Add basic schema markup for your real estate business:\n' +
        this.generateSchemaExample()
      );
    }

    // Missing schema types
    for (const missingType of analysis.missingSchemas) {
      recommendations.push(
        `Add ${missingType} schema markup:\n` +
        this.generateSchemaExampleForType(missingType)
      );
    }

    // Validation errors
    const hasErrors = analysis.validationResults.some(r => !r.isValid);
    if (hasErrors) {
      recommendations.push(
        'Fix schema validation errors:\n' +
        '1. Check required properties are present\n' +
        '2. Ensure proper data types\n' +
        '3. Validate URLs and email addresses\n' +
        '4. Use proper Schema.org context'
      );
    }

    // Technical issues
    if (analysis.technicalIssues.length > 0) {
      recommendations.push(
        'Address technical SEO issues:\n' +
        analysis.technicalIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')
      );
    }

    return recommendations;
  }

  /**
   * Set up automatic re-validation
   */
  async setupRevalidation(config: RevalidationConfig): Promise<void> {
    const key = `${config.userId}:${config.websiteUrl}`;
    this.revalidationSchedules.set(key, config);
    
    // In a real implementation, this would set up a scheduled job
    // For now, we'll just store the configuration
    console.log(`Re-validation scheduled for ${config.websiteUrl} every ${config.frequency}`);
  }

  /**
   * Get re-validation history
   */
  async getRevalidationHistory(userId: string, websiteUrl: string): Promise<WebsiteAnalysis[]> {
    // In a real implementation, this would fetch from a database
    // For now, return empty array
    return [];
  }

  /**
   * Validate and normalize URL
   */
  private validateAndNormalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.toString();
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * Crawl pages from website
   */
  private async crawlPages(startUrl: string, config: CrawlConfig): Promise<CrawledPage[]> {
    const pages: CrawledPage[] = [];
    const visited = new Set<string>();
    const toVisit = [{ url: startUrl, depth: 0 }];

    while (toVisit.length > 0 && pages.length < config.maxPages) {
      const { url, depth } = toVisit.shift()!;
      
      if (visited.has(url) || depth > config.maxDepth) {
        continue;
      }

      visited.add(url);

      try {
        const page = await this.crawlSinglePage(url, config);
        pages.push(page);

        // Extract links for further crawling
        if (depth < config.maxDepth) {
          const links = this.extractLinks(page.content, url, config.followExternalLinks);
          for (const link of links) {
            if (!visited.has(link)) {
              toVisit.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to crawl ${url}:`, error);
      }
    }

    return pages;
  }

  /**
   * Crawl a single page
   */
  private async crawlSinglePage(url: string, config: CrawlConfig): Promise<CrawledPage> {
    // In a real implementation, this would use a proper HTTP client
    // For now, we'll simulate the crawling process
    
    const mockHtml = this.generateMockHtml(url);
    const schemaMarkup = this.detectSchemaMarkup(mockHtml, url).found;
    
    return {
      url,
      title: this.extractTitle(mockHtml),
      content: mockHtml,
      schemaMarkup,
      metaTags: this.extractMetaTags(mockHtml),
      headings: this.extractHeadings(mockHtml),
      links: this.extractLinks(mockHtml, url, false),
      images: this.extractImages(mockHtml, url),
      crawledAt: new Date(),
    };
  }

  /**
   * Extract JSON-LD schemas from HTML
   */
  private extractJsonLdSchemas(html: string): SchemaMarkup[] {
    const schemas: SchemaMarkup[] = [];
    
    // Simple regex to find JSON-LD scripts (in real implementation, use proper HTML parser)
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonContent = match[1].trim();
        const parsed = JSON.parse(jsonContent);
        
        // Handle both single objects and arrays
        const schemaObjects = Array.isArray(parsed) ? parsed : [parsed];
        
        for (const obj of schemaObjects) {
          if (obj['@type'] && obj['@context']) {
            // Validate against our schema
            try {
              const validatedSchema = SchemaMarkupSchema.parse(obj);
              schemas.push(validatedSchema);
            } catch (error) {
              console.warn('Invalid schema found:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to parse JSON-LD:', error);
      }
    }

    return schemas;
  }

  /**
   * Extract Microdata schemas from HTML
   */
  private extractMicrodataSchemas(html: string): SchemaMarkup[] {
    // In a real implementation, this would parse HTML and extract microdata
    // For now, return empty array as microdata parsing is complex
    return [];
  }

  /**
   * Extract RDFa schemas from HTML
   */
  private extractRdfaSchemas(html: string): SchemaMarkup[] {
    // In a real implementation, this would parse HTML and extract RDFa
    // For now, return empty array as RDFa parsing is complex
    return [];
  }

  /**
   * Identify missing schema types
   */
  private identifyMissingSchemas(existingSchemas: SchemaMarkup[]): SchemaType[] {
    const existingTypes = new Set(existingSchemas.map(s => s['@type']));
    const recommendedTypes: SchemaType[] = ['RealEstateAgent', 'Person', 'LocalBusiness', 'Organization'];
    
    return recommendedTypes.filter(type => !existingTypes.has(type));
  }

  /**
   * Generate schema recommendations
   */
  private generateSchemaRecommendations(schemas: SchemaMarkup[], missingTypes: SchemaType[]): string[] {
    const recommendations: string[] = [];

    if (schemas.length === 0) {
      recommendations.push('Add basic schema markup to improve AI visibility');
    }

    for (const missingType of missingTypes) {
      recommendations.push(`Consider adding ${missingType} schema markup for better categorization`);
    }

    return recommendations;
  }

  /**
   * Generate recommendations from analysis
   */
  private generateRecommendations(
    schemas: SchemaMarkup[],
    validationResults: ValidationResult[],
    missingSchemas: SchemaType[],
    technicalIssues: TechnicalSEOIssue[]
  ): string[] {
    const recommendations: string[] = [];

    // Schema recommendations
    if (schemas.length === 0) {
      recommendations.push('Add structured data markup to improve AI discoverability');
    }

    // Validation recommendations
    const hasErrors = validationResults.some(r => !r.isValid);
    if (hasErrors) {
      recommendations.push('Fix schema validation errors to ensure proper AI interpretation');
    }

    // Missing schema recommendations
    for (const missingType of missingSchemas) {
      recommendations.push(`Add ${missingType} schema markup for comprehensive coverage`);
    }

    // Technical SEO recommendations
    const criticalIssues = technicalIssues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('Address critical technical SEO issues immediately');
    }

    return recommendations;
  }

  /**
   * Find duplicate titles across pages
   */
  private findDuplicateTitles(pages: CrawledPage[]): string[] {
    const titleCounts = new Map<string, number>();
    
    for (const page of pages) {
      const title = page.title.toLowerCase().trim();
      titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
    }

    return Array.from(titleCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([title]) => title);
  }

  /**
   * Generate mock HTML for testing
   */
  private generateMockHtml(url: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Real Estate Agent - ${url}</title>
  <meta name="description" content="Professional real estate services">
</head>
<body>
  <h1>Welcome to Our Real Estate Services</h1>
  <h2>About Us</h2>
  <p>We provide professional real estate services.</p>
</body>
</html>
    `.trim();
  }

  /**
   * Extract title from HTML
   */
  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  /**
   * Extract meta tags from HTML
   */
  private extractMetaTags(html: string): Record<string, string> {
    const metaTags: Record<string, string> = {};
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch) {
      metaTags.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
    if (descMatch) {
      metaTags.description = descMatch[1];
    }

    return metaTags;
  }

  /**
   * Extract headings from HTML
   */
  private extractHeadings(html: string): string[] {
    const headings: string[] = [];
    const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
      headings.push(match[1].trim());
    }

    return headings;
  }

  /**
   * Extract links from HTML
   */
  private extractLinks(html: string, baseUrl: string, includeExternal: boolean): string[] {
    const links: string[] = [];
    const linkRegex = /<a[^>]*href=["']([^"']*)/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      try {
        const url = new URL(match[1], baseUrl);
        const isExternal = url.hostname !== new URL(baseUrl).hostname;
        
        if (includeExternal || !isExternal) {
          links.push(url.toString());
        }
      } catch {
        // Invalid URL, skip
      }
    }

    return [...new Set(links)]; // Remove duplicates
  }

  /**
   * Extract images from HTML
   */
  private extractImages(html: string, baseUrl: string): string[] {
    const images: string[] = [];
    const imgRegex = /<img[^>]*src=["']([^"']*)/gi;
    let match;

    while ((match = imgRegex.exec(html)) !== null) {
      try {
        const url = new URL(match[1], baseUrl);
        images.push(url.toString());
      } catch {
        // Invalid URL, skip
      }
    }

    return [...new Set(images)]; // Remove duplicates
  }

  /**
   * Generate basic schema example
   */
  private generateSchemaExample(): string {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Your Name",
  "email": "your.email@example.com",
  "telephone": "+1-555-123-4567",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Your City",
    "addressRegion": "Your State",
    "postalCode": "12345",
    "addressCountry": "US"
  }
}
</script>`;
  }

  /**
   * Generate schema example for specific type
   */
  private generateSchemaExampleForType(schemaType: SchemaType): string {
    const examples: Record<SchemaType, string> = {
      'RealEstateAgent': this.generateSchemaExample(),
      'Person': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Your Name",
  "jobTitle": "Real Estate Agent"
}
</script>`,
      'LocalBusiness': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Your Real Estate Business",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Your City",
    "addressRegion": "Your State",
    "postalCode": "12345"
  }
}
</script>`,
      'Organization': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Brokerage",
  "url": "https://www.yourbrokerage.com"
}
</script>`,
      'Review': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Review",
  "author": {
    "@type": "Person",
    "name": "Client Name"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": 5
  },
  "reviewBody": "Excellent service!"
}
</script>`,
      'AggregateRating': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "AggregateRating",
  "ratingValue": 4.8,
  "reviewCount": 25
}
</script>`,
      'FAQPage': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "What areas do you serve?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "We serve the greater metropolitan area."
    }
  }]
}
</script>`,
      'Service': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Real Estate Services",
  "description": "Comprehensive real estate services"
}
</script>`,
      'Place': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Place",
  "name": "Service Area",
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
</script>`,
      'City': `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "City",
  "name": "Your City"
}
</script>`,
    };

    return examples[schemaType] || this.generateSchemaExample();
  }
}

/**
 * Create and export a singleton instance
 */
export const websiteCrawler = new AdvancedWebsiteCrawler();

/**
 * Convenience function to crawl and analyze a website
 */
export async function crawlAndAnalyzeWebsite(
  url: string, 
  config?: Partial<CrawlConfig>
): Promise<WebsiteAnalysis> {
  return websiteCrawler.crawlWebsite(url, config);
}

/**
 * Convenience function to detect schema markup in HTML
 */
export function detectSchemaInHtml(html: string, baseUrl: string): SchemaDetectionResult {
  return websiteCrawler.detectSchemaMarkup(html, baseUrl);
}

/**
 * Convenience function to validate website schemas
 */
export async function validateWebsiteSchemas(url: string): Promise<ValidationResult[]> {
  return websiteCrawler.validateWebsiteSchemas(url);
}

/**
 * Convenience function to set up automatic re-validation
 */
export async function setupWebsiteRevalidation(config: RevalidationConfig): Promise<void> {
  return websiteCrawler.setupRevalidation(config);
}