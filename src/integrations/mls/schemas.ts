/**
 * MLS Integration Zod Schemas
 * Data validation schemas for MLS entities
 */

import { z } from "zod";

export const AddressSchema = z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(2, "State is required").max(2, "State must be 2 characters"),
    zip: z.string().min(5, "Zip code is required"),
    country: z.string().default("US"),
});

export const PhotoSchema = z.object({
    url: z.string().url("Invalid photo URL"),
    caption: z.string().optional(),
    order: z.number().int().min(0),
});

export const ListingStatusSchema = z.enum(["active", "pending", "sold", "expired"]);

export const ListingSchema = z.object({
    mlsId: z.string().min(1, "MLS ID is required"),
    mlsNumber: z.string().min(1, "MLS number is required"),
    address: AddressSchema,
    price: z.number().positive("Price must be positive"),
    bedrooms: z.number().int().min(0, "Bedrooms must be non-negative"),
    bathrooms: z.number().min(0, "Bathrooms must be non-negative"),
    squareFeet: z.number().positive("Square feet must be positive"),
    propertyType: z.string().min(1, "Property type is required"),
    status: ListingStatusSchema,
    listDate: z.string().min(1, "List date is required"),
    description: z.string().optional(),
    photos: z.array(PhotoSchema),
    features: z.array(z.string()),
});

export const MLSCredentialsSchema = z.object({
    provider: z.string().min(1, "Provider is required"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    mlsId: z.string().optional(),
});

export const MLSConnectionSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    provider: z.string().min(1),
    agentId: z.string().min(1),
    brokerageId: z.string().min(1),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresAt: z.number().positive(),
    createdAt: z.number().positive(),
});

export const StatusUpdateSchema = z.object({
    mlsId: z.string().min(1),
    mlsNumber: z.string().min(1),
    oldStatus: ListingStatusSchema,
    newStatus: ListingStatusSchema,
    updatedAt: z.number().positive(),
});

// Type inference from schemas
export type AddressInput = z.infer<typeof AddressSchema>;
export type PhotoInput = z.infer<typeof PhotoSchema>;
export type ListingInput = z.infer<typeof ListingSchema>;
export type MLSCredentialsInput = z.infer<typeof MLSCredentialsSchema>;
export type MLSConnectionInput = z.infer<typeof MLSConnectionSchema>;
export type StatusUpdateInput = z.infer<typeof StatusUpdateSchema>;
