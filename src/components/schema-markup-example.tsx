/**
 * Schema Markup System Usage Example
 * 
 * This file demonstrates how to use the schema markup generators,
 * validators, and UI components together.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SchemaMarkupValidator } from '@/components/schema-markup-validator';
import {
    performComprehensiveValidation,
    generateDetailedReport,
    type ComprehensiveValidationReport,
} from '@/lib/schema/comprehensive-validator';
import {
    generateRealEstateAgentWithReviewsSchema,
    generateArticleSchema,
    schemaToJsonLd,
} from '@/lib/schema/generators';
import type { Profile, Testimonial } from '@/lib/types/common';

/**
 * Example: Validating a profile page with testimonials
 */
export function ProfileSchemaExample() {
    const [report, setReport] = useState<ComprehensiveValidationReport | null>(null);

    const handleValidate = () => {
        // Example profile data
        const profile: Profile = {
            id: 'user-123',
            name: 'John Smith',
            bio: 'Experienced real estate agent specializing in luxury homes',
            phone: '555-0123',
            address: '123 Main St, Seattle, WA',
            website: 'https://johnsmith.com',
            licenseNumber: 'RE-12345',
            agencyName: 'Smith Realty Group',
            linkedin: 'https://linkedin.com/in/johnsmith',
            certifications: ['CRS', 'GRI', 'ABR'],
        };

        // Example testimonials
        const testimonials: Testimonial[] = [
            {
                id: 'test-1',
                userId: 'user-123',
                clientName: 'Jane Doe',
                testimonialText: 'John helped us find our dream home! Highly recommended.',
                dateReceived: '2024-01-15',
                isFeatured: true,
                tags: ['buyer'],
                status: 'published',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
            {
                id: 'test-2',
                userId: 'user-123',
                clientName: 'Bob Johnson',
                testimonialText: 'Professional and knowledgeable. Made the selling process easy.',
                dateReceived: '2024-02-20',
                isFeatured: true,
                tags: ['seller'],
                status: 'published',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];

        // Perform comprehensive validation
        const validationReport = performComprehensiveValidation({
            profile,
            testimonials,
        });

        setReport(validationReport);

        // You can also generate a text report
        const textReport = generateDetailedReport(validationReport);
        console.log(textReport);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Profile Schema Validation</h2>
                <Button onClick={handleValidate}>Validate Schema</Button>
            </div>

            {report && <SchemaMarkupValidator report={report} />}
        </div>
    );
}

/**
 * Example: Generating schema markup for a blog post
 */
export function BlogPostSchemaExample() {
    const [schema, setSchema] = useState<string>('');

    const handleGenerate = () => {
        // Generate Article schema
        const articleSchema = generateArticleSchema({
            title: 'Seattle Real Estate Market Trends 2024',
            description: 'Discover the latest trends in Seattle\'s real estate market',
            content: 'The Seattle real estate market continues to show strong growth...',
            author: 'John Smith',
            datePublished: '2024-01-20',
            imageUrl: 'https://example.com/image.jpg',
            url: 'https://johnsmith.com/blog/seattle-trends-2024',
        });

        // Convert to JSON-LD for embedding in HTML
        const jsonLd = schemaToJsonLd(articleSchema);
        setSchema(jsonLd);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Blog Post Schema Generation</h2>
                <Button onClick={handleGenerate}>Generate Schema</Button>
            </div>

            {schema && (
                <div className="rounded-lg border bg-muted/50 p-4 overflow-x-auto">
                    <pre className="text-xs">{schema}</pre>
                </div>
            )}

            <div className="text-sm text-muted-foreground">
                <p>Add this script tag to your blog post HTML head section:</p>
                <code className="block mt-2 p-2 bg-muted rounded">
                    {`<head>`}
                    <br />
                    {`  {/* Other head elements */}`}
                    <br />
                    {`  <script type="application/ld+json">`}
                    <br />
                    {`    {JSON.stringify(articleSchema, null, 2)}`}
                    <br />
                    {`  </script>`}
                    <br />
                    {`</head>`}
                </code>
            </div>
        </div>
    );
}

/**
 * Example: Generating schema markup for testimonials
 */
export function TestimonialsSchemaExample() {
    const [schema, setSchema] = useState<string>('');

    const handleGenerate = () => {
        const profile: Profile = {
            name: 'John Smith',
            bio: 'Experienced real estate agent',
            phone: '555-0123',
            address: '123 Main St, Seattle, WA',
            licenseNumber: 'RE-12345',
        };

        const testimonials: Testimonial[] = [
            {
                id: 'test-1',
                userId: 'user-123',
                clientName: 'Jane Doe',
                testimonialText: 'Excellent service!',
                dateReceived: '2024-01-15',
                isFeatured: true,
                tags: [],
                status: 'published',
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];

        // Generate RealEstateAgent schema with reviews
        const agentSchema = generateRealEstateAgentWithReviewsSchema(
            profile,
            testimonials
        );

        const jsonLd = schemaToJsonLd(agentSchema);
        setSchema(jsonLd);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Testimonials Schema Generation</h2>
                <Button onClick={handleGenerate}>Generate Schema</Button>
            </div>

            {schema && (
                <div className="rounded-lg border bg-muted/50 p-4 overflow-x-auto">
                    <pre className="text-xs">{schema}</pre>
                </div>
            )}
        </div>
    );
}
