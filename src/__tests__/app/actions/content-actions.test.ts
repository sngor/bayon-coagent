/**
 * Content Actions Tests
 * 
 * Tests for content generation server actions including blog posts,
 * social media content, and listing descriptions.
 */

import {
  generateBlogPostAction,
  generateSocialMediaPostAction,
  generateListingDescriptionAction,
  generateNeighborhoodGuideAction,
  saveContentAction,
  deleteContentAction,
  updateContentAction,
} from '@/app/actions/content-actions';
import { createMockFormData } from '@/lib/test-utils';

// Mock the Bedrock flows
jest.mock('@/aws/bedrock/flows/content-flows', () => ({
  generateBlogPost: jest.fn(),
  generateSocialMediaPost: jest.fn(),
  generateListingDescription: jest.fn(),
  generateNeighborhoodGuide: jest.fn(),
  generateVideoScript: jest.fn(),
  generateMarketUpdate: jest.fn(),
}));

// Mock error handling
jest.mock('@/app/actions/error-handling', () => ({
  handleAWSError: jest.fn((error, defaultMessage) => ({
    message: defaultMessage,
    context: { service: 'bedrock', retryable: true },
    originalError: error.message,
  })),
}));

import {
  generateBlogPost,
  generateSocialMediaPost,
  generateListingDescription,
  generateNeighborhoodGuide,
} from '@/aws/bedrock/flows/content-flows';

const mockGenerateBlogPost = generateBlogPost as jest.MockedFunction<typeof generateBlogPost>;
const mockGenerateSocialMediaPost = generateSocialMediaPost as jest.MockedFunction<typeof generateSocialMediaPost>;
const mockGenerateListingDescription = generateListingDescription as jest.MockedFunction<typeof generateListingDescription>;
const mockGenerateNeighborhoodGuide = generateNeighborhoodGuide as jest.MockedFunction<typeof generateNeighborhoodGuide>;

describe('Content Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBlogPostAction', () => {
    it('should generate blog post successfully', async () => {
      const mockBlogPost = {
        title: 'Test Blog Post',
        content: 'This is a test blog post content.',
        excerpt: 'Test excerpt',
        tags: ['real estate', 'tips'],
      };

      mockGenerateBlogPost.mockResolvedValue(mockBlogPost);

      const formData = createMockFormData({
        topic: 'First-time home buying tips',
        targetAudience: 'first-time-buyers',
        tone: 'friendly',
        keywords: 'home buying, tips, first time',
        length: 'medium',
      });

      const result = await generateBlogPostAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.blogPost).toEqual(mockBlogPost);
      expect(result.data.metadata.wordCount).toBeDefined();
      expect(result.data.metadata.readingTime).toBeDefined();
      expect(mockGenerateBlogPost).toHaveBeenCalledWith({
        topic: 'First-time home buying tips',
        targetAudience: 'first-time-buyers',
        tone: 'friendly',
        keywords: 'home buying, tips, first time',
        length: 'medium',
      });
    });

    it('should handle validation errors', async () => {
      const formData = createMockFormData({
        topic: '', // Invalid: empty topic
        targetAudience: 'first-time-buyers',
        tone: 'friendly',
      });

      const result = await generateBlogPostAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors.topic).toContain('Topic is required');
      expect(mockGenerateBlogPost).not.toHaveBeenCalled();
    });

    it('should handle generation errors', async () => {
      mockGenerateBlogPost.mockRejectedValue(new Error('Bedrock service error'));

      const formData = createMockFormData({
        topic: 'Test topic',
        targetAudience: 'first-time-buyers',
        tone: 'friendly',
      });

      const result = await generateBlogPostAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to generate blog post');
    });

    it('should validate enum values', async () => {
      const formData = createMockFormData({
        topic: 'Test topic',
        targetAudience: 'invalid-audience', // Invalid enum value
        tone: 'friendly',
      });

      const result = await generateBlogPostAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('generateSocialMediaPostAction', () => {
    it('should generate social media post successfully', async () => {
      const mockPost = {
        content: 'Check out this amazing property! 🏠 #RealEstate #DreamHome',
        hashtags: ['#RealEstate', '#DreamHome'],
        platform: 'instagram',
      };

      mockGenerateSocialMediaPost.mockResolvedValue(mockPost);

      const formData = createMockFormData({
        platform: 'instagram',
        content: 'Amazing property for sale',
        tone: 'engaging',
        includeHashtags: 'true',
        includeEmojis: 'true',
      });

      const result = await generateSocialMediaPostAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.post).toEqual(mockPost);
      expect(result.data.metadata.characterCount).toBeDefined();
      expect(result.data.metadata.platform).toBe('instagram');
    });

    it('should handle boolean conversion', async () => {
      const mockPost = {
        content: 'Simple post without hashtags',
        hashtags: [],
        platform: 'linkedin',
      };

      mockGenerateSocialMediaPost.mockResolvedValue(mockPost);

      const formData = createMockFormData({
        platform: 'linkedin',
        content: 'Professional content',
        tone: 'professional',
        includeHashtags: 'false',
        includeEmojis: 'false',
      });

      const result = await generateSocialMediaPostAction({}, formData);

      expect(result.success).toBe(true);
      expect(mockGenerateSocialMediaPost).toHaveBeenCalledWith({
        platform: 'linkedin',
        content: 'Professional content',
        tone: 'professional',
        includeHashtags: false,
        includeEmojis: false,
      });
    });
  });

  describe('generateListingDescriptionAction', () => {
    it('should generate listing description successfully', async () => {
      const mockDescription = {
        description: 'Beautiful 3-bedroom home in a quiet neighborhood...',
        highlights: ['3 bedrooms', '2 bathrooms', 'Updated kitchen'],
        callToAction: 'Schedule your showing today!',
      };

      mockGenerateListingDescription.mockResolvedValue(mockDescription);

      const formData = createMockFormData({
        propertyType: 'single-family',
        bedrooms: '3',
        bathrooms: '2',
        squareFootage: '1500',
        neighborhood: 'Downtown',
        price: '350000',
        targetBuyer: 'family',
        tone: 'warm',
      });

      const result = await generateListingDescriptionAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.description).toEqual(mockDescription);
      expect(mockGenerateListingDescription).toHaveBeenCalledWith({
        propertyType: 'single-family',
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 1500,
        neighborhood: 'Downtown',
        price: 350000,
        targetBuyer: 'family',
        tone: 'warm',
        features: [],
        lotSize: undefined,
        yearBuilt: undefined,
      });
    });

    it('should handle array features', async () => {
      const mockDescription = {
        description: 'Luxury home with premium features...',
        highlights: ['Pool', 'Garage', 'Garden'],
        callToAction: 'Contact us for details!',
      };

      mockGenerateListingDescription.mockResolvedValue(mockDescription);

      const formData = createMockFormData({
        propertyType: 'single-family',
        bedrooms: '4',
        bathrooms: '3',
        neighborhood: 'Suburbs',
        price: '500000',
        targetBuyer: 'luxury',
        tone: 'luxurious',
        features: ['Pool', 'Garage', 'Garden'],
      });

      const result = await generateListingDescriptionAction({}, formData);

      expect(result.success).toBe(true);
      expect(mockGenerateListingDescription).toHaveBeenCalledWith(
        expect.objectContaining({
          features: ['Pool', 'Garage', 'Garden'],
        })
      );
    });

    it('should validate numeric fields', async () => {
      const formData = createMockFormData({
        propertyType: 'single-family',
        bedrooms: '-1', // Invalid: negative number
        bathrooms: '2',
        neighborhood: 'Downtown',
        price: '350000',
        targetBuyer: 'family',
        tone: 'warm',
      });

      const result = await generateListingDescriptionAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('generateNeighborhoodGuideAction', () => {
    it('should generate neighborhood guide successfully', async () => {
      const mockGuide = {
        title: 'Downtown Living Guide',
        sections: {
          overview: 'Downtown is a vibrant area...',
          schools: 'Top-rated schools nearby...',
          amenities: 'Shopping, dining, and entertainment...',
          transportation: 'Easy access to public transit...',
          marketData: 'Average home prices and trends...',
        },
      };

      mockGenerateNeighborhoodGuide.mockResolvedValue(mockGuide);

      const formData = createMockFormData({
        neighborhood: 'Downtown',
        city: 'Seattle',
        state: 'WA',
        targetAudience: 'young-professionals',
        includeSchools: 'true',
        includeAmenities: 'true',
        includeTransportation: 'true',
        includeMarketData: 'true',
      });

      const result = await generateNeighborhoodGuideAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.guide).toEqual(mockGuide);
      expect(result.data.metadata.sections).toBe(5);
      expect(result.data.metadata.location).toBe('Downtown, Seattle, WA');
    });

    it('should validate state abbreviation', async () => {
      const formData = createMockFormData({
        neighborhood: 'Downtown',
        city: 'Seattle',
        state: 'Washington', // Invalid: should be 2-letter abbreviation
        targetAudience: 'families',
      });

      const result = await generateNeighborhoodGuideAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors.state).toContain('Use state abbreviation');
    });
  });

  describe('saveContentAction', () => {
    it('should save content successfully', async () => {
      const formData = createMockFormData({
        type: 'blog-post',
        title: 'My Blog Post',
        content: 'This is the content of my blog post.',
        metadata: JSON.stringify({ author: 'John Doe' }),
        tags: 'real estate, tips, buying',
      });

      const result = await saveContentAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.type).toBe('blog-post');
      expect(result.data.title).toBe('My Blog Post');
      expect(result.data.contentId).toBeDefined();
      expect(result.data.savedAt).toBeDefined();
    });

    it('should handle invalid JSON metadata', async () => {
      const formData = createMockFormData({
        type: 'blog-post',
        title: 'My Blog Post',
        content: 'Content',
        metadata: 'invalid-json',
      });

      const result = await saveContentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to save content');
    });

    it('should validate content type enum', async () => {
      const formData = createMockFormData({
        type: 'invalid-type',
        title: 'Test',
        content: 'Content',
      });

      const result = await saveContentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('deleteContentAction', () => {
    it('should delete content successfully', async () => {
      const formData = createMockFormData({
        contentId: 'content_123',
      });

      const result = await deleteContentAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.contentId).toBe('content_123');
      expect(result.data.deletedAt).toBeDefined();
    });

    it('should validate required contentId', async () => {
      const formData = createMockFormData({
        contentId: '',
      });

      const result = await deleteContentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors.contentId).toContain('Content ID is required');
    });
  });

  describe('updateContentAction', () => {
    it('should update content successfully', async () => {
      const formData = createMockFormData({
        contentId: 'content_123',
        title: 'Updated Title',
        content: 'Updated content',
        tags: 'updated, tags',
      });

      const result = await updateContentAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.contentId).toBe('content_123');
      expect(result.data.updatedAt).toBeDefined();
    });

    it('should handle partial updates', async () => {
      const formData = createMockFormData({
        contentId: 'content_123',
        title: 'New Title Only',
      });

      const result = await updateContentAction({}, formData);

      expect(result.success).toBe(true);
      expect(result.data.contentId).toBe('content_123');
    });

    it('should validate contentId is required', async () => {
      const formData = createMockFormData({
        title: 'Title without ID',
      });

      const result = await updateContentAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.errors.contentId).toContain('Content ID is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle AWS service errors consistently', async () => {
      mockGenerateBlogPost.mockRejectedValue(new Error('ThrottlingException'));

      const formData = createMockFormData({
        topic: 'Test topic',
        targetAudience: 'first-time-buyers',
        tone: 'friendly',
      });

      const result = await generateBlogPostAction({}, formData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to generate blog post');
    });

    it('should preserve previous state data on errors', async () => {
      const formData = createMockFormData({
        topic: '', // Invalid
      });

      const prevState = { data: { previousInput: 'test' } };
      const result = await generateBlogPostAction(prevState, formData);

      expect(result.success).toBe(false);
      expect(result.data).toEqual({ previousInput: 'test' });
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize input data', async () => {
      const mockBlogPost = {
        title: 'Clean Title',
        content: 'Clean content',
      };

      mockGenerateBlogPost.mockResolvedValue(mockBlogPost);

      const formData = createMockFormData({
        topic: '  <script>alert("xss")</script>Real Estate Tips  ',
        targetAudience: 'first-time-buyers',
        tone: 'friendly',
      });

      const result = await generateBlogPostAction({}, formData);

      expect(result.success).toBe(true);
      expect(mockGenerateBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({
          topic: 'Real Estate Tips', // Should be sanitized
        })
      );
    });
  });
});