/**
 * Unit tests for testimonial schema markup generation
 * Validates: Requirements 4.5, 8.3
 */

import {
    generateReviewSchema,
    generateAggregateRatingSchema,
    generateTestimonialSchemaWithContext,
    validateTestimonialForSchema,
} from "@/lib/schema/testimonial-schema";
import { Testimonial } from "@/lib/types/common";

describe("Testimonial Schema Markup", () => {
    const mockTestimonial: Testimonial = {
        id: "test-1",
        userId: "user-123",
        clientName: "John Doe",
        testimonialText: "Amazing service! Highly recommend.",
        dateReceived: "2024-01-15",
        clientPhotoUrl: "https://example.com/photo.jpg",
        isFeatured: true,
        displayOrder: 1,
        tags: ["buyer"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    describe("generateReviewSchema", () => {
        it("should generate valid Review schema with all required fields", () => {
            const schema = generateReviewSchema(mockTestimonial, "Jane Smith");

            expect(schema["@type"]).toBe("Review");
            expect(schema.author).toEqual({
                "@type": "Person",
                name: "John Doe",
            });
            expect(schema.datePublished).toBe("2024-01-15");
            expect(schema.reviewBody).toBe("Amazing service! Highly recommend.");
            expect(schema.reviewRating).toEqual({
                "@type": "Rating",
                ratingValue: "5",
                bestRating: "5",
            });
        });

        it("should include itemReviewed when agentName is provided", () => {
            const schema = generateReviewSchema(mockTestimonial, "Jane Smith");

            expect(schema.itemReviewed).toEqual({
                "@type": "RealEstateAgent",
                name: "Jane Smith",
            });
        });

        it("should not include itemReviewed when agentName is not provided", () => {
            const schema = generateReviewSchema(mockTestimonial);

            expect(schema.itemReviewed).toBeUndefined();
        });
    });

    describe("generateAggregateRatingSchema", () => {
        it("should generate AggregateRating schema for multiple testimonials", () => {
            const testimonials = [mockTestimonial, { ...mockTestimonial, id: "test-2" }];
            const schema = generateAggregateRatingSchema(testimonials, "Jane Smith");

            expect(schema["@type"]).toBe("RealEstateAgent");
            expect(schema.name).toBe("Jane Smith");
            expect(schema.aggregateRating).toEqual({
                "@type": "AggregateRating",
                ratingValue: "5.0",
                reviewCount: "2",
                bestRating: "5",
            });
        });
    });

    describe("generateTestimonialSchemaWithContext", () => {
        it("should include @context in schema", () => {
            const schema = generateTestimonialSchemaWithContext(
                mockTestimonial,
                "Jane Smith"
            );

            expect(schema["@context"]).toBe("https://schema.org");
            expect(schema["@type"]).toBe("Review");
        });
    });

    describe("validateTestimonialForSchema", () => {
        it("should validate testimonial with all required fields", () => {
            const result = validateTestimonialForSchema(mockTestimonial);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should return error when clientName is missing", () => {
            const invalidTestimonial = { ...mockTestimonial, clientName: "" };
            const result = validateTestimonialForSchema(invalidTestimonial);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Client name is required for Review schema");
        });

        it("should return error when testimonialText is missing", () => {
            const invalidTestimonial = { ...mockTestimonial, testimonialText: "" };
            const result = validateTestimonialForSchema(invalidTestimonial);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(
                "Testimonial text is required for Review schema"
            );
        });

        it("should return error when dateReceived is missing", () => {
            const invalidTestimonial = { ...mockTestimonial, dateReceived: "" };
            const result = validateTestimonialForSchema(invalidTestimonial);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("Date received is required for Review schema");
        });

        it("should return multiple errors when multiple fields are missing", () => {
            const invalidTestimonial = {
                ...mockTestimonial,
                clientName: "",
                testimonialText: "",
            };
            const result = validateTestimonialForSchema(invalidTestimonial);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(2);
        });
    });
});
