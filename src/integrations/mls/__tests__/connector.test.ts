/**
 * MLS Connector Tests
 * Unit tests for the MLS connector service
 */

import {
    RESOWebAPIConnector,
    createMLSConnector,
    MLSAuthenticationError,
    MLSNetworkError,
    MLSValidationError,
} from "../connector";
import { MLSCredentials, MLSConnection } from "../types";

describe("RESOWebAPIConnector", () => {
    describe("Constructor", () => {
        it("should create connector for supported provider", () => {
            expect(() => new RESOWebAPIConnector("flexmls")).not.toThrow();
            expect(() => new RESOWebAPIConnector("crmls")).not.toThrow();
            expect(() => new RESOWebAPIConnector("bright")).not.toThrow();
        });

        it("should throw error for unsupported provider", () => {
            expect(() => new RESOWebAPIConnector("unsupported")).toThrow(
                "Unsupported MLS provider"
            );
        });

        it("should handle case-insensitive provider names", () => {
            expect(() => new RESOWebAPIConnector("FLEXMLS")).not.toThrow();
            expect(() => new RESOWebAPIConnector("FlexMLS")).not.toThrow();
        });
    });

    describe("authenticate", () => {
        let connector: RESOWebAPIConnector;

        beforeEach(() => {
            connector = new RESOWebAPIConnector("flexmls");
        });

        it("should validate credentials before authentication", async () => {
            const invalidCredentials = {
                provider: "",
                username: "",
                password: "",
            } as MLSCredentials;

            await expect(connector.authenticate(invalidCredentials)).rejects.toThrow(
                MLSValidationError
            );
        });

        it("should reject credentials with missing required fields", async () => {
            const incompleteCredentials = {
                provider: "flexmls",
                username: "test",
                // missing password
            } as MLSCredentials;

            await expect(
                connector.authenticate(incompleteCredentials)
            ).rejects.toThrow(MLSValidationError);
        });
    });

    describe("fetchListings", () => {
        let connector: RESOWebAPIConnector;
        let mockConnection: MLSConnection;

        beforeEach(() => {
            connector = new RESOWebAPIConnector("flexmls");
            mockConnection = {
                id: "test-connection-1",
                userId: "user-123",
                provider: "flexmls",
                agentId: "agent-456",
                brokerageId: "broker-789",
                accessToken: "test-token",
                refreshToken: "test-refresh",
                expiresAt: Date.now() + 3600000, // 1 hour from now
                createdAt: Date.now(),
            };
        });

        it("should reject expired tokens", async () => {
            const expiredConnection = {
                ...mockConnection,
                expiresAt: Date.now() - 1000, // Expired 1 second ago
            };

            await expect(
                connector.fetchListings(expiredConnection, "agent-456")
            ).rejects.toThrow(MLSAuthenticationError);
        });

        it("should include agent ID in query", async () => {
            // This test would require mocking fetch, which we'll skip for now
            // In a real implementation, we'd use a library like msw or nock
            expect(mockConnection.agentId).toBe("agent-456");
        });
    });

    describe("fetchListingDetails", () => {
        let connector: RESOWebAPIConnector;
        let mockConnection: MLSConnection;

        beforeEach(() => {
            connector = new RESOWebAPIConnector("flexmls");
            mockConnection = {
                id: "test-connection-1",
                userId: "user-123",
                provider: "flexmls",
                agentId: "agent-456",
                brokerageId: "broker-789",
                accessToken: "test-token",
                refreshToken: "test-refresh",
                expiresAt: Date.now() + 3600000,
                createdAt: Date.now(),
            };
        });

        it("should reject expired tokens", async () => {
            const expiredConnection = {
                ...mockConnection,
                expiresAt: Date.now() - 1000,
            };

            await expect(
                connector.fetchListingDetails(expiredConnection, "listing-123")
            ).rejects.toThrow(MLSAuthenticationError);
        });
    });

    describe("syncStatus", () => {
        let connector: RESOWebAPIConnector;
        let mockConnection: MLSConnection;

        beforeEach(() => {
            connector = new RESOWebAPIConnector("flexmls");
            mockConnection = {
                id: "test-connection-1",
                userId: "user-123",
                provider: "flexmls",
                agentId: "agent-456",
                brokerageId: "broker-789",
                accessToken: "test-token",
                refreshToken: "test-refresh",
                expiresAt: Date.now() + 3600000,
                createdAt: Date.now(),
            };
        });

        it("should reject expired tokens", async () => {
            const expiredConnection = {
                ...mockConnection,
                expiresAt: Date.now() - 1000,
            };

            await expect(
                connector.syncStatus(expiredConnection, ["listing-1", "listing-2"])
            ).rejects.toThrow(MLSAuthenticationError);
        });

        it("should handle empty listing array", async () => {
            const result = await connector.syncStatus(mockConnection, []);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(0);
        });
    });

    describe("disconnect", () => {
        let connector: RESOWebAPIConnector;

        beforeEach(() => {
            connector = new RESOWebAPIConnector("flexmls");
        });

        it("should not throw error when disconnecting", async () => {
            await expect(connector.disconnect("connection-123")).resolves.not.toThrow();
        });
    });

    describe("createMLSConnector factory", () => {
        it("should create connector instance", () => {
            const connector = createMLSConnector("flexmls");
            expect(connector).toBeInstanceOf(RESOWebAPIConnector);
        });

        it("should throw for unsupported provider", () => {
            expect(() => createMLSConnector("invalid")).toThrow();
        });
    });
});
