/**
 * Profile Form Validation Schema
 * 
 * Zod schema for validating profile setup form data during onboarding.
 * 
 * Requirements: 2.2, 2.3
 */

import { z } from 'zod';

/**
 * Location schema for city, state, and zip code
 */
export const locationSchema = z.object({
    city: z.string().min(1, 'City is required').max(100, 'City must be less than 100 characters'),
    state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters').regex(/^[A-Z]{2}$/, 'State must be 2 uppercase letters (e.g., CA, NY)'),
    zipCode: z.string().min(5, 'ZIP code is required').max(10, 'ZIP code must be less than 10 characters').regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789'),
});

/**
 * Profile form schema
 * Validates all required and optional fields
 */
export const profileFormSchema = z.object({
    // Required fields
    firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
    brokerage: z.string().min(1, 'Brokerage is required').max(100, 'Brokerage must be less than 100 characters'),
    location: locationSchema,

    // Optional fields with validation when provided
    email: z.string().email('Invalid email format').optional().or(z.literal('')),
    phone: z.string()
        .regex(/^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, 'Phone must be a valid US phone number')
        .optional()
        .or(z.literal('')),
    licenseNumber: z.string().max(50, 'License number must be less than 50 characters').optional().or(z.literal('')),
    specialties: z.array(z.string()).min(1, 'At least one specialty is required'),
    yearsExperience: z.number().int().min(0, 'Years of experience must be 0 or greater').max(100, 'Years of experience must be less than 100').optional(),
    website: z.string().url('Website must be a valid URL').optional().or(z.literal('')),
});

/**
 * Type inference from schema
 */
export type ProfileFormData = z.infer<typeof profileFormSchema>;

/**
 * Specialty options for the multi-select
 */
export const specialtyOptions = [
    'Residential Sales',
    'Luxury Homes',
    'First-Time Buyers',
    'Investment Properties',
    'Commercial Real Estate',
    'Land & Lots',
    'New Construction',
    'Foreclosures & Short Sales',
    'Relocation',
    'Senior Housing',
    'Vacation Homes',
    'Property Management',
] as const;

/**
 * US States for the state dropdown
 */
export const usStates = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
] as const;
