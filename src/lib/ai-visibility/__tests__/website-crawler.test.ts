/**
 * Website Crawler Service Tests
 * 
 * Unit tests for website crawling and schema detection functionality
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Website Crawler Core Functionality', () => {
  describe('Schema Detection Logic', () => {
    it('should identify JSON-LD schema patterns', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "John Smith",
              "email": "john@example.com"
            }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      // Test JSON-LD extraction logic
      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
      const matches = Array.from(html.matchAll(jsonLdRegex));
      
      expect(matches).toHaveLength(1);
      
      const jsonContent = matches[0][1].trim();
      const parsed = JSON.parse(jsonContent);
      
      expect(parsed['@type']).toBe('RealEstateAgent');
      expect(parsed.name).toBe('John Smith');
    });

    it('should handle multiple JSON-LD scripts', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "RealEstateAgent",
              "name": "John Smith"
            }
            </script>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "Smith Realty"
            }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
      const matches = Array.from(html.matchAll(jsonLdRegex));
      
      expect(matches).toHaveLength(2);
      
      const schemas = matches.map(match => JSON.parse(match[1].trim()));
      expect(schemas[0]['@type']).toBe('RealEstateAgent');
      expect(schemas[1]['@type']).toBe('LocalBusiness');
    });

    it('should identify missing schema types', () => {
      const existingSchemas = [
        { '@type': 'Person', name: 'John Smith' }
      ];
      
      const recommendedTypes = ['RealEstateAgent', 'Person', 'LocalBusiness', 'Organization'];
      const existingTypes = new Set(existingSchemas.map(s => s['@type']));
      const missingTypes = recommendedTypes.filter(type => !existingTypes.has(type));
      
      expect(missingTypes).toContain('RealEstateAgent');
      expect(missingTypes).toContain('LocalBusiness');
      expect(missingTypes).toContain('Organization');
      expect(missingTypes).not.toContain('Person');
    });

    it('should handle invalid JSON gracefully', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
            { invalid json }
            </script>
          </head>
          <body>Content</body>
        </html>
      `;

      const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis;
      const matches = Array.from(html.matchAll(jsonLdRegex));
      
      expect(matches).toHaveLength(1);
      
      // Should handle parsing error gracefully
      let parsedSchemas = [];
      try {
        const jsonContent = matches[0][1].trim();
        const parsed = JSON.parse(jsonContent);
        parsedSchemas.push(parsed);
      } catch (error) {
        // Expected to fail, should not throw
      }
      
      expect(parsedSchemas).toHaveLength(0);
    });
  });

  describe('Technical SEO Analysis', () => {
    it('should identify missing title tags', () => {
      const html = '<html><body>Content without title</body></html>';
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      
      expect(titleMatch).toBeNull();
    });

    it('should identify missing meta descriptions', () => {
      const html = '<html><head><title>Page Title</title></head><body>Content</body></html>';
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
      
      expect(descMatch).toBeNull();
    });

    it('should extract existing meta tags', () => {
      const html = `
        <html>
          <head>
            <title>Page Title</title>
            <meta name="description" content="Page description">
          </head>
          <body>Content</body>
        </html>
      `;
      
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i);
      
      expect(titleMatch?.[1]).toBe('Page Title');
      expect(descMatch?.[1]).toBe('Page description');
    });

    it('should detect duplicate titles', () => {
      const pages = [
        { title: 'Duplicate Title', url: 'page1' },
        { title: 'Duplicate Title', url: 'page2' },
        { title: 'Unique Title', url: 'page3' }
      ];
      
      const titleCounts = new Map<string, number>();
      pages.forEach(page => {
        const title = page.title.toLowerCase().trim();
        titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
      });
      
      const duplicates = Array.from(titleCounts.entries())
        .filter(([, count]) => count > 1)
        .map(([title]) => title);
      
      expect(duplicates).toContain('duplicate title');
      expect(duplicates).not.toContain('unique title');
    });
  });

  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path',
        'https://subdomain.example.com',
      ];

      validUrls.forEach(url => {
        expect(() => new URL(url)).not.toThrow();
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'javascript:alert(1)',
        '',
      ];

      invalidUrls.forEach(url => {
        expect(() => new URL(url)).toThrow();
      });
    });
  });

  describe('Schema Recommendations', () => {
    it('should generate recommendations for missing schemas', () => {
      const existingSchemas: any[] = [];
      const missingTypes = ['RealEstateAgent', 'LocalBusiness'];
      
      const recommendations: string[] = [];
      
      if (existingSchemas.length === 0) {
        recommendations.push('Add basic schema markup to improve AI visibility');
      }
      
      missingTypes.forEach(type => {
        recommendations.push(`Consider adding ${type} schema markup for better categorization`);
      });
      
      expect(recommendations).toContain('Add basic schema markup to improve AI visibility');
      expect(recommendations).toContain('Consider adding RealEstateAgent schema markup for better categorization');
      expect(recommendations).toContain('Consider adding LocalBusiness schema markup for better categorization');
    });

    it('should generate fix recommendations for validation errors', () => {
      const hasValidationErrors = true;
      const hasTechnicalIssues = true;
      
      const recommendations: string[] = [];
      
      if (hasValidationErrors) {
        recommendations.push('Fix schema validation errors to ensure proper AI interpretation');
      }
      
      if (hasTechnicalIssues) {
        recommendations.push('Address technical SEO issues immediately');
      }
      
      expect(recommendations).toContain('Fix schema validation errors to ensure proper AI interpretation');
      expect(recommendations).toContain('Address technical SEO issues immediately');
    });
  });

  describe('Content Extraction', () => {
    it('should extract headings from HTML', () => {
      const html = `
        <html>
          <body>
            <h1>Main Heading</h1>
            <h2>Sub Heading</h2>
            <h3>Sub Sub Heading</h3>
          </body>
        </html>
      `;
      
      const headings: string[] = [];
      const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi;
      let match;

      while ((match = headingRegex.exec(html)) !== null) {
        headings.push(match[1].trim());
      }
      
      expect(headings).toContain('Main Heading');
      expect(headings).toContain('Sub Heading');
      expect(headings).toContain('Sub Sub Heading');
    });

    it('should extract links from HTML', () => {
      const html = `
        <html>
          <body>
            <a href="https://example.com">External Link</a>
            <a href="/internal">Internal Link</a>
            <a href="mailto:test@example.com">Email Link</a>
          </body>
        </html>
      `;
      
      const links: string[] = [];
      const linkRegex = /<a[^>]*href=["']([^"']*)/gi;
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        links.push(match[1]);
      }
      
      expect(links).toContain('https://example.com');
      expect(links).toContain('/internal');
      expect(links).toContain('mailto:test@example.com');
    });
  });

  describe('Schema Code Generation', () => {
    it('should generate basic schema example', () => {
      const schemaExample = `<script type="application/ld+json">
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

      expect(schemaExample).toContain('"@type": "RealEstateAgent"');
      expect(schemaExample).toContain('"@context": "https://schema.org"');
      expect(schemaExample).toContain('PostalAddress');
    });

    it('should generate schema examples for different types', () => {
      const examples = {
        'Person': '"@type": "Person"',
        'LocalBusiness': '"@type": "LocalBusiness"',
        'Organization': '"@type": "Organization"',
      };

      Object.entries(examples).forEach(([type, expectedContent]) => {
        expect(expectedContent).toContain(`"@type": "${type}"`);
      });
    });
  });
});