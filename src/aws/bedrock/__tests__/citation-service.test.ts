/**
 * Citation Service Tests
 * 
 * Unit tests for the CitationService class
 */

import { CitationService, Citation, CitationSourceType } from '../citation-service';
import { CitationRepository } from '../citation-repository';

describe('CitationService', () => {
  let service: CitationService;

  beforeEach(() => {
    service = new CitationService();
  });

  describe('addCitation', () => {
    it('should create a citation with all required fields', async () => {
      const citation = await service.addCitation('Test fact', {
        url: 'https://example.com/report',
        title: 'Test Report',
        sourceType: 'market-report',
      });

      expect(citation).toMatchObject({
        url: 'https://example.com/report',
        title: 'Test Report',
        sourceType: 'market-report',
      });
      expect(citation.id).toBeDefined();
      expect(citation.accessedAt).toBeDefined();
      expect(typeof citation.validated).toBe('boolean');
    });
  });

  describe('validateURL', () => {
    it('should return false for invalid URL format', async () => {
      const isValid = await service.validateURL('not-a-url');
      expect(isValid).toBe(false);
    });

    it('should handle timeout gracefully', async () => {
      // Use a very short timeout to force timeout
      const isValid = await service.validateURL('https://httpstat.us/200?sleep=10000', {
        timeoutMs: 100,
      });
      expect(isValid).toBe(false);
    });
  });

  describe('formatCitations', () => {
    it('should format citations with hyperlinks', async () => {
      const citations: Citation[] = [
        {
          id: 'cite1',
          url: 'https://example.com/report1',
          title: 'Market Report Q4',
          sourceType: 'market-report',
          accessedAt: new Date().toISOString(),
          validated: true,
        },
        {
          id: 'cite2',
          url: 'https://example.com/mls',
          title: 'MLS Listing 12345',
          sourceType: 'mls',
          accessedAt: new Date().toISOString(),
          validated: false,
        },
      ];

      const formatted = await service.formatCitations('Test text', citations);
      
      expect(formatted).toContain('Test text');
      expect(formatted).toContain('[1]');
      expect(formatted).toContain('[2]');
      expect(formatted).toContain('Market Report: Market Report Q4');
      expect(formatted).toContain('MLS Listing: MLS Listing 12345');
      expect(formatted).toContain('accessibility not verified');
    });

    it('should return original text when no citations', async () => {
      const formatted = await service.formatCitations('Test text', []);
      expect(formatted).toBe('Test text');
    });
  });

  describe('extractCitations', () => {
    it('should extract markdown-style links', async () => {
      const text = 'Check out [this report](https://example.com/report) and [this data](https://api.example.com/data)';
      const citations = await service.extractCitations(text);

      expect(citations).toHaveLength(2);
      expect(citations[0].title).toBe('this report');
      expect(citations[0].url).toBe('https://example.com/report');
      expect(citations[1].title).toBe('this data');
      expect(citations[1].url).toBe('https://api.example.com/data');
    });

    it('should skip non-HTTP URLs', async () => {
      const text = 'Check out [local file](file:///path/to/file)';
      const citations = await service.extractCitations(text);

      expect(citations).toHaveLength(0);
    });

    it('should infer source types correctly', async () => {
      const text = 'See [MLS listing](https://mls.example.com/123) and [Market Report](https://example.com/market-report)';
      const citations = await service.extractCitations(text);

      expect(citations[0].sourceType).toBe('mls');
      expect(citations[1].sourceType).toBe('market-report');
    });
  });

  describe('labelCitations', () => {
    it('should add labels to citations', () => {
      const citations: Citation[] = [
        {
          id: 'cite1',
          url: 'https://example.com/1',
          title: 'Source 1',
          sourceType: 'web',
          accessedAt: new Date().toISOString(),
          validated: true,
        },
        {
          id: 'cite2',
          url: 'https://example.com/2',
          title: 'Source 2',
          sourceType: 'web',
          accessedAt: new Date().toISOString(),
          validated: true,
        },
      ];

      const labeled = service.labelCitations(citations);

      expect(labeled[0].label).toBe('[1]');
      expect(labeled[1].label).toBe('[2]');
    });
  });

  describe('formatWithNumberedCitations', () => {
    it('should format text with numbered citations section', () => {
      const citations: Citation[] = [
        {
          id: 'cite1',
          url: 'https://example.com/report',
          title: 'Market Report',
          sourceType: 'market-report',
          accessedAt: new Date().toISOString(),
          validated: true,
        },
      ];

      const formatted = service.formatWithNumberedCitations('Test response', citations);

      expect(formatted).toContain('Test response');
      expect(formatted).toContain('**Sources:**');
      expect(formatted).toContain('[1] Market Report: [Market Report](https://example.com/report)');
    });

    it('should include validation note for unvalidated URLs', () => {
      const citations: Citation[] = [
        {
          id: 'cite1',
          url: 'https://example.com/report',
          title: 'Market Report',
          sourceType: 'market-report',
          accessedAt: new Date().toISOString(),
          validated: false,
        },
      ];

      const formatted = service.formatWithNumberedCitations('Test response', citations);

      expect(formatted).toContain('(accessibility not verified)');
    });
  });

  describe('createCitationWithFallback', () => {
    it('should create citation even if validation fails', async () => {
      const citation = await service.createCitationWithFallback(
        'https://invalid-url-that-does-not-exist.example.com',
        'Test Source',
        'web'
      );

      expect(citation).toBeDefined();
      expect(citation.url).toBe('https://invalid-url-that-does-not-exist.example.com');
      expect(citation.title).toBe('Test Source');
      expect(citation.validated).toBe(false);
    });
  });

  describe('validateURLsBatch', () => {
    it('should validate multiple URLs in parallel', async () => {
      const urls = [
        'https://example.com',
        'not-a-url',
        'https://another-example.com',
      ];

      const results = await service.validateURLsBatch(urls, 5000);

      expect(results.size).toBe(3);
      expect(results.get('not-a-url')).toBe(false);
    });
  });
});
