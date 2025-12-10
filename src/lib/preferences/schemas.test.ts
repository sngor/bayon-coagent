import { describe, it, expect } from "@jest/globals";
import {
    ContentPreferencesSchema,
    BrandPreferencesSchema,
    NotificationPreferencesSchema,
    WorkflowPreferencesSchema,
    IntegrationPreferencesSchema,
    DisplayPreferencesSchema,
    PrivacyPreferencesSchema,
    UserPreferencesSchema,
} from "./schemas";

describe("Preference Schemas", () => {
    describe("ContentPreferencesSchema", () => {
        it("should parse with default values", () => {
            const result = ContentPreferencesSchema.parse({});
            expect(result.aiTone).toBe("professional");
            expect(result.contentLength).toBe("medium");
            expect(result.targetAudience).toEqual([]);
            expect(result.autoSaveEnabled).toBe(true);
            expect(result.autoSaveInterval).toBe(60);
        });

        it("should reject invalid autoSaveInterval", () => {
            expect(() => {
                ContentPreferencesSchema.parse({ autoSaveInterval: 10 });
            }).toThrow();
        });

        it("should accept valid values", () => {
            const result = ContentPreferencesSchema.parse({
                aiTone: "casual",
                contentLength: "long",
                targetAudience: ["buyers", "sellers"],
                autoSaveEnabled: false,
                autoSaveInterval: 120,
            });
            expect(result.aiTone).toBe("casual");
            expect(result.contentLength).toBe("long");
        });
    });

    describe("BrandPreferencesSchema", () => {
        it("should parse with default values", () => {
            const result = BrandPreferencesSchema.parse({});
            expect(result.serviceAreas).toEqual([]);
            expect(result.propertyTypes).toEqual(["residential"]);
            expect(result.competitorTrackingFrequency).toBe("weekly");
        });

        it("should validate phone number in E.164 format", () => {
            const validNap = {
                name: "John Doe",
                address: "123 Main St",
                phone: "+12345678901",
            };
            const result = BrandPreferencesSchema.parse({ nap: validNap });
            expect(result.nap?.phone).toBe("+12345678901");
        });

        it("should reject invalid phone number", () => {
            const invalidNap = {
                name: "John Doe",
                address: "123 Main St",
                phone: "abc",
            };
            expect(() => {
                BrandPreferencesSchema.parse({ nap: invalidNap });
            }).toThrow();
        });
    });

    describe("NotificationPreferencesSchema", () => {
        it("should parse with default values", () => {
            const result = NotificationPreferencesSchema.parse({});
            expect(result.email.enabled).toBe(true);
            expect(result.email.frequency).toBe("daily");
            expect(result.push.enabled).toBe(false);
            expect(result.marketAlertThresholds.priceChangePercent).toBe(10);
        });

        it("should reject invalid threshold values", () => {
            expect(() => {
                NotificationPreferencesSchema.parse({
                    marketAlertThresholds: { priceChangePercent: 150 },
                });
            }).toThrow();
        });
    });

    describe("WorkflowPreferencesSchema", () => {
        it("should parse with default values", () => {
            const result = WorkflowPreferencesSchema.parse({});
            expect(result.defaultHub).toBe("dashboard");
            expect(result.pinnedTools).toEqual([]);
            expect(result.autoArchive.enabled).toBe(false);
        });

        it("should reject more than 6 pinned tools", () => {
            expect(() => {
                WorkflowPreferencesSchema.parse({
                    pinnedTools: ["1", "2", "3", "4", "5", "6", "7"],
                });
            }).toThrow();
        });
    });

    describe("IntegrationPreferencesSchema", () => {
        it("should parse with default values", () => {
            const result = IntegrationPreferencesSchema.parse({});
            expect(result.dataSharing.allowAnalytics).toBe(true);
            expect(result.dataSharing.allowThirdParty).toBe(false);
            expect(result.exportFormat).toBe("pdf");
        });
    });

    describe("DisplayPreferencesSchema", () => {
        it("should parse with default values", () => {
            const result = DisplayPreferencesSchema.parse({});
            expect(result.theme).toBe("auto");
            expect(result.fontSize).toBe("medium");
            expect(result.reducedMotion).toBe(false);
            expect(result.language).toBe("en");
        });

        it("should validate hex color codes", () => {
            const result = DisplayPreferencesSchema.parse({
                colorScheme: {
                    primary: "#FF5733",
                    accent: "#33FF57",
                },
            });
            expect(result.colorScheme?.primary).toBe("#FF5733");
        });

        it("should reject invalid hex color codes", () => {
            expect(() => {
                DisplayPreferencesSchema.parse({
                    colorScheme: {
                        primary: "#GG5733",
                    },
                });
            }).toThrow();
        });
    });

    describe("PrivacyPreferencesSchema", () => {
        it("should parse with default values", () => {
            const result = PrivacyPreferencesSchema.parse({});
            expect(result.contentRetention.enabled).toBe(false);
            expect(result.contentRetention.daysToKeep).toBe(365);
            expect(result.analyticsOptOut).toBe(false);
        });

        it("should reject invalid retention days", () => {
            expect(() => {
                PrivacyPreferencesSchema.parse({
                    contentRetention: { daysToKeep: 10 },
                });
            }).toThrow();
        });
    });

    describe("UserPreferencesSchema", () => {
        it("should parse complete preferences with defaults", () => {
            const result = UserPreferencesSchema.parse({
                content: {},
                brand: {},
                notifications: {},
                workflow: {},
                integrations: {},
                display: {},
                privacy: {},
                updatedAt: new Date().toISOString(),
            });

            expect(result.content.aiTone).toBe("professional");
            expect(result.brand.propertyTypes).toEqual(["residential"]);
            expect(result.notifications.email.enabled).toBe(true);
            expect(result.workflow.defaultHub).toBe("dashboard");
            expect(result.integrations.exportFormat).toBe("pdf");
            expect(result.display.theme).toBe("auto");
            expect(result.privacy.analyticsOptOut).toBe(false);
        });

        it("should require updatedAt field", () => {
            expect(() => {
                UserPreferencesSchema.parse({
                    content: {},
                    brand: {},
                    notifications: {},
                    workflow: {},
                    integrations: {},
                    display: {},
                    privacy: {},
                });
            }).toThrow();
        });

        it("should validate datetime format for updatedAt", () => {
            expect(() => {
                UserPreferencesSchema.parse({
                    content: {},
                    brand: {},
                    notifications: {},
                    workflow: {},
                    integrations: {},
                    display: {},
                    privacy: {},
                    updatedAt: "invalid-date",
                });
            }).toThrow();
        });
    });
});
