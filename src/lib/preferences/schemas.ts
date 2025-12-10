import { z } from "zod";

// Content Preferences
export const ContentPreferencesSchema = z.object({
    aiTone: z
        .enum(["professional", "casual", "authoritative", "friendly"])
        .default("professional"),
    contentLength: z.enum(["short", "medium", "long"]).default("medium"),
    targetAudience: z.array(z.string()).default([]),
    autoSaveEnabled: z.boolean().default(true),
    autoSaveInterval: z.number().min(30).max(600).default(60), // seconds
});

// Brand & Market Preferences
export const BrandPreferencesSchema = z.object({
    serviceAreas: z
        .array(
            z.object({
                city: z.string(),
                state: z.string(),
                zipCodes: z.array(z.string()).optional(),
            })
        )
        .default([]),
    propertyTypes: z
        .array(
            z.enum(["residential", "commercial", "luxury", "investment", "land"])
        )
        .default(["residential"]),
    nap: z
        .object({
            name: z.string(),
            address: z.string(),
            phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, {
                message: "Phone number must be in E.164 format",
            }),
        })
        .optional(),
    competitorTrackingFrequency: z
        .enum(["daily", "weekly", "monthly"])
        .default("weekly"),
});

// Notification Preferences
export const NotificationPreferencesSchema = z.object({
    email: z
        .object({
            enabled: z.boolean().default(true),
            frequency: z.enum(["realtime", "daily", "weekly"]).default("daily"),
        })
        .default({ enabled: true, frequency: "daily" }),
    push: z
        .object({
            enabled: z.boolean().default(false),
            categories: z
                .object({
                    marketAlerts: z.boolean().default(true),
                    contentReady: z.boolean().default(true),
                    researchComplete: z.boolean().default(true),
                    systemUpdates: z.boolean().default(false),
                })
                .default({
                    marketAlerts: true,
                    contentReady: true,
                    researchComplete: true,
                    systemUpdates: false,
                }),
        })
        .default({
            enabled: false,
            categories: {
                marketAlerts: true,
                contentReady: true,
                researchComplete: true,
                systemUpdates: false,
            },
        }),
    marketAlertThresholds: z
        .object({
            priceChangePercent: z.number().min(0).max(100).default(10),
            newListingsCount: z.number().min(1).default(5),
        })
        .default({ priceChangePercent: 10, newListingsCount: 5 }),
});

// Workflow Preferences
export const WorkflowPreferencesSchema = z.object({
    defaultHub: z
        .enum([
            "dashboard",
            "studio",
            "brand",
            "research",
            "market",
            "tools",
            "library",
            "assistant",
        ])
        .default("dashboard"),
    pinnedTools: z.array(z.string()).max(6).default([]),
    keyboardShortcuts: z.record(z.string(), z.string()).default({}),
    autoArchive: z
        .object({
            enabled: z.boolean().default(false),
            daysOld: z.number().min(30).max(365).default(90),
        })
        .default({ enabled: false, daysOld: 90 }),
    customTabOrder: z.record(z.string(), z.array(z.string())).default({}),
});

// Integration Preferences
export const IntegrationPreferencesSchema = z.object({
    autoSync: z.record(z.string(), z.boolean()).default({}),
    dataSharing: z
        .object({
            allowAnalytics: z.boolean().default(true),
            allowThirdParty: z.boolean().default(false),
        })
        .default({ allowAnalytics: true, allowThirdParty: false }),
    exportFormat: z.enum(["pdf", "docx", "html", "markdown"]).default("pdf"),
});

// Display Preferences
export const DisplayPreferencesSchema = z.object({
    theme: z.enum(["light", "dark", "auto"]).default("auto"),
    fontSize: z.enum(["small", "medium", "large"]).default("medium"),
    reducedMotion: z.boolean().default(false),
    language: z.enum(["en", "es"]).default("en"),
    colorScheme: z
        .object({
            primary: z
                .string()
                .regex(/^#[0-9A-F]{6}$/i, {
                    message: "Color must be a valid hex color code",
                })
                .optional(),
            accent: z
                .string()
                .regex(/^#[0-9A-F]{6}$/i, {
                    message: "Color must be a valid hex color code",
                })
                .optional(),
        })
        .optional(),
});

// Privacy Preferences
export const PrivacyPreferencesSchema = z.object({
    contentRetention: z
        .object({
            enabled: z.boolean().default(false),
            daysToKeep: z.number().min(30).max(730).default(365),
        })
        .default({ enabled: false, daysToKeep: 365 }),
    autoDeleteDrafts: z
        .object({
            enabled: z.boolean().default(false),
            daysOld: z.number().min(7).max(90).default(30),
        })
        .default({ enabled: false, daysOld: 30 }),
    analyticsOptOut: z.boolean().default(false),
});

// Complete Preferences Schema
export const UserPreferencesSchema = z.object({
    content: ContentPreferencesSchema,
    brand: BrandPreferencesSchema,
    notifications: NotificationPreferencesSchema,
    workflow: WorkflowPreferencesSchema,
    integrations: IntegrationPreferencesSchema,
    display: DisplayPreferencesSchema,
    privacy: PrivacyPreferencesSchema,
    updatedAt: z.string().datetime(),
});

// TypeScript types derived from schemas
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type ContentPreferences = z.infer<typeof ContentPreferencesSchema>;
export type BrandPreferences = z.infer<typeof BrandPreferencesSchema>;
export type NotificationPreferences = z.infer<
    typeof NotificationPreferencesSchema
>;
export type WorkflowPreferences = z.infer<typeof WorkflowPreferencesSchema>;
export type IntegrationPreferences = z.infer<
    typeof IntegrationPreferencesSchema
>;
export type DisplayPreferences = z.infer<typeof DisplayPreferencesSchema>;
export type PrivacyPreferences = z.infer<typeof PrivacyPreferencesSchema>;
