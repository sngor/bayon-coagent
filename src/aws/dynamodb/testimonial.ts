/**
 * Testimonial Module
 * 
 * Central export point for all testimonial-related operations.
 * Combines repository and service functions for easy importing.
 */

export {
    // Repository functions
    createTestimonial,
    getTestimonial,
    updateTestimonial,
    deleteTestimonial,
    queryTestimonials,
    queryFeaturedTestimonials,

    // Service functions
    uploadClientPhoto,
    deleteTestimonialWithAssets,
} from './testimonial-service';

export type { Testimonial } from '@/lib/types/common/common';
export type { QueryOptions, QueryResult } from './types';
