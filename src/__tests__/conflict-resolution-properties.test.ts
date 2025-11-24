/**
 * Property-Based Tests for Conflict Resolution
 * 
 * **Feature: microservices-architecture, Property 24: Conflict Resolution**
 * **Validates: Requirements 7.5**
 * 
 * Property: For any data conflict, resolution mechanisms should resolve
 * conflicts without data corruption.
 * 
 * This test verifies that:
 * 1. Concurrent updates are detected
 * 2. Conflicts are resolved using defined strategies
 * 3. No data is lost or corrupted
 * 4. Resolution is deterministic and consistent
 */

import * as fc from 'fast-check';

// Conflict resolution strategies
type ConflictStrategy = 'last-write-wins' | 'first-write-wins' | 'merge' | 'manual';

// Data record with version tracking
interface DataRecord {
    id: string;
    userId: string;
    data: Record<string, any>;
    version: number;
    updatedAt: string;
    updatedBy: string;
}

// Update operation
interface UpdateOperation {
    recordId: string;
    userId: string;
    changes: Record<string, any>;
    expectedVersion: number;
    timestamp: string;
}

// Conflict detection result
interface ConflictDetection {
    hasConflict: boolean;
    currentVersion: number;
    expectedVersion: number;
    conflictingFields?: string[];
}

// Conflict resolution result
interface ConflictResolution {
    success: boolean;
    resolvedData: Record<string, any>;
    strategy: ConflictStrategy;
    version: number;
    conflictResolved: boolean;
}

/**
 * Simulate data store with version tracking
 */
class VersionedDataStore {
    private records: Map<string, DataRecord> = new Map();

    get(id: string): DataRecord | undefined {
        return this.records.get(id);
    }

    create(record: DataRecord): void {
        this.records.set(record.id, { ...record, version: 1 });
    }

    update(id: string, changes: Record<string, any>, expectedVersion: number, userId: string): ConflictDetection {
        const current = this.records.get(id);

        if (!current) {
            throw new Error('Record not found');
        }

        // Detect version conflict
        if (current.version !== expectedVersion) {
            return {
                hasConflict: true,
                currentVersion: current.version,
                expectedVersion,
                conflictingFields: Object.keys(changes),
            };
        }

        // No conflict - apply update
        this.records.set(id, {
            ...current,
            data: { ...current.data, ...changes },
            version: current.version + 1,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
        });

        return {
            hasConflict: false,
            currentVersion: current.version + 1,
            expectedVersion,
        };
    }

    forceUpdate(id: string, data: Record<string, any>, version: number, userId: string): void {
        const current = this.records.get(id);
        if (!current) {
            throw new Error('Record not found');
        }

        this.records.set(id, {
            ...current,
            data,
            version,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
        });
    }
}

/**
 * Resolve conflict using specified strategy
 */
function resolveConflict(
    current: DataRecord,
    update: UpdateOperation,
    strategy: ConflictStrategy
): ConflictResolution {
    switch (strategy) {
        case 'last-write-wins':
            // Latest update wins
            return {
                success: true,
                resolvedData: { ...current.data, ...update.changes },
                strategy,
                version: current.version + 1,
                conflictResolved: true,
            };

        case 'first-write-wins':
            // Keep current data, reject update
            return {
                success: true,
                resolvedData: current.data,
                strategy,
                version: current.version,
                conflictResolved: true,
            };

        case 'merge':
            // Merge non-conflicting fields
            const merged = { ...current.data };
            const conflictingFields: string[] = [];

            for (const [key, value] of Object.entries(update.changes)) {
                if (current.data[key] !== undefined && current.data[key] !== value) {
                    // Conflict detected - use last-write-wins for this field
                    merged[key] = value;
                    conflictingFields.push(key);
                } else {
                    merged[key] = value;
                }
            }

            return {
                success: true,
                resolvedData: merged,
                strategy,
                version: current.version + 1,
                conflictResolved: true,
            };

        case 'manual':
            // Require manual resolution
            return {
                success: false,
                resolvedData: current.data,
                strategy,
                version: current.version,
                conflictResolved: false,
            };

        default:
            throw new Error(`Unknown strategy: ${strategy}`);
    }
}

/**
 * Apply conflict resolution to data store
 */
function applyConflictResolution(
    store: VersionedDataStore,
    recordId: string,
    resolution: ConflictResolution,
    userId: string
): void {
    if (resolution.success && resolution.conflictResolved) {
        store.forceUpdate(recordId, resolution.resolvedData, resolution.version, userId);
    }
}

/**
 * Verify data integrity after conflict resolution
 */
function verifyDataIntegrity(
    original: DataRecord,
    updates: UpdateOperation[],
    resolved: DataRecord,
    strategy?: ConflictStrategy
): boolean {
    // For first-write-wins, version may not increase if update was rejected
    if (strategy !== 'first-write-wins' && resolved.version <= original.version) {
        return false;
    }

    // Check no original data was lost
    for (const field of Object.keys(original.data)) {
        if (!(field in resolved.data)) {
            // Original field was lost
            return false;
        }
    }

    // For strategies other than first-write-wins, check update fields were applied
    if (strategy !== 'first-write-wins') {
        const updateFields = new Set(updates.flatMap(u => Object.keys(u.changes)));
        for (const field of updateFields) {
            if (!(field in resolved.data)) {
                // Update field was lost
                return false;
            }
        }
    }

    return true;
}

describe('Conflict Resolution Properties', () => {
    // Configure fast-check to run 100 iterations
    const fcConfig = { numRuns: 100 };

    /**
     * Property 24: Conflict Resolution
     * 
     * For any data conflict, resolution mechanisms should resolve
     * conflicts without data corruption.
     */
    it(
        'should resolve conflicts without data corruption',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    // Generate initial record
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        userId: fc.string({ minLength: 5, maxLength: 20 }),
                        data: fc.dictionary(
                            fc.string({ minLength: 1, maxLength: 10 }),
                            fc.oneof(fc.string(), fc.integer(), fc.boolean())
                        ),
                    }),
                    // Generate conflicting updates
                    fc.array(
                        fc.record({
                            changes: fc.dictionary(
                                fc.string({ minLength: 1, maxLength: 10 }),
                                fc.oneof(fc.string(), fc.integer(), fc.boolean())
                            ),
                            userId: fc.string({ minLength: 5, maxLength: 20 }),
                        }),
                        { minLength: 2, maxLength: 5 }
                    ),
                    // Generate conflict resolution strategy
                    fc.constantFrom<ConflictStrategy>(
                        'last-write-wins',
                        'first-write-wins',
                        'merge'
                    ),
                    async (initialRecord, updates, strategy) => {
                        const store = new VersionedDataStore();

                        // Create initial record
                        const record: DataRecord = {
                            ...initialRecord,
                            version: 1,
                            updatedAt: new Date().toISOString(),
                            updatedBy: initialRecord.userId,
                        };
                        store.create(record);

                        // Apply first update successfully
                        const firstUpdate: UpdateOperation = {
                            recordId: record.id,
                            userId: updates[0].userId,
                            changes: updates[0].changes,
                            expectedVersion: 1,
                            timestamp: new Date().toISOString(),
                        };

                        const firstResult = store.update(
                            record.id,
                            firstUpdate.changes,
                            firstUpdate.expectedVersion,
                            firstUpdate.userId
                        );

                        expect(firstResult.hasConflict).toBe(false);

                        // Apply remaining updates with stale version (conflict)
                        for (let i = 1; i < updates.length; i++) {
                            const update: UpdateOperation = {
                                recordId: record.id,
                                userId: updates[i].userId,
                                changes: updates[i].changes,
                                expectedVersion: 1, // Stale version - will conflict
                                timestamp: new Date().toISOString(),
                            };

                            const result = store.update(
                                record.id,
                                update.changes,
                                update.expectedVersion,
                                update.userId
                            );

                            // Should detect conflict
                            expect(result.hasConflict).toBe(true);
                            expect(result.currentVersion).toBeGreaterThan(result.expectedVersion);

                            // Resolve conflict
                            const current = store.get(record.id)!;
                            const resolution = resolveConflict(current, update, strategy);

                            // Verify resolution succeeded (except for manual strategy)
                            if (strategy !== 'manual') {
                                expect(resolution.success).toBe(true);
                                expect(resolution.conflictResolved).toBe(true);

                                // Apply resolution
                                applyConflictResolution(store, record.id, resolution, update.userId);

                                // Verify data integrity
                                const resolved = store.get(record.id)!;
                                const integrity = verifyDataIntegrity(record, [update], resolved, strategy);
                                expect(integrity).toBe(true);

                                // Verify version increased (except for first-write-wins which keeps current)
                                if (strategy !== 'first-write-wins') {
                                    expect(resolved.version).toBeGreaterThan(current.version);
                                } else {
                                    // first-write-wins keeps current version
                                    expect(resolved.version).toBeGreaterThanOrEqual(current.version);
                                }
                            }
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Last-write-wins is deterministic
     * 
     * For any sequence of updates, last-write-wins should produce
     * consistent results based on timestamp order.
     */
    it(
        'should apply last-write-wins deterministically',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        userId: fc.string({ minLength: 5, maxLength: 20 }),
                        data: fc.dictionary(fc.string(), fc.string()),
                    }),
                    fc.array(
                        fc.record({
                            field: fc.string({ minLength: 1, maxLength: 10 }),
                            value: fc.string(),
                            userId: fc.string({ minLength: 5, maxLength: 20 }),
                        }),
                        { minLength: 2, maxLength: 5 }
                    ),
                    async (initialRecord, updates) => {
                        const store = new VersionedDataStore();

                        const record: DataRecord = {
                            ...initialRecord,
                            version: 1,
                            updatedAt: new Date().toISOString(),
                            updatedBy: initialRecord.userId,
                        };
                        store.create(record);

                        // Apply updates with conflicts
                        let lastValue: string | undefined;

                        for (const update of updates) {
                            const current = store.get(record.id)!;
                            const updateOp: UpdateOperation = {
                                recordId: record.id,
                                userId: update.userId,
                                changes: { [update.field]: update.value },
                                expectedVersion: 1, // Intentionally stale
                                timestamp: new Date().toISOString(),
                            };

                            const resolution = resolveConflict(current, updateOp, 'last-write-wins');
                            applyConflictResolution(store, record.id, resolution, update.userId);

                            lastValue = update.value;
                        }

                        // Verify last update won
                        const final = store.get(record.id)!;
                        const lastUpdate = updates[updates.length - 1];
                        expect(final.data[lastUpdate.field]).toBe(lastValue);
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Merge strategy preserves non-conflicting changes
     * 
     * For any updates to different fields, merge should preserve all changes.
     */
    it(
        'should preserve non-conflicting changes with merge strategy',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        userId: fc.string({ minLength: 5, maxLength: 20 }),
                        data: fc.dictionary(fc.string(), fc.string()),
                    }),
                    fc.array(
                        fc.record({
                            field: fc.string({ minLength: 1, maxLength: 10 }),
                            value: fc.string(),
                            userId: fc.string({ minLength: 5, maxLength: 20 }),
                        }),
                        { minLength: 2, maxLength: 5 }
                    ),
                    async (initialRecord, updates) => {
                        // Filter out special JavaScript properties
                        const filteredUpdates = updates.filter(
                            u => !['__proto__', 'constructor', 'prototype'].includes(u.field)
                        );

                        if (filteredUpdates.length < 2) {
                            return; // Need at least 2 updates
                        }

                        // Ensure updates are to different fields
                        const uniqueFields = new Set(filteredUpdates.map(u => u.field));
                        if (uniqueFields.size !== filteredUpdates.length) {
                            return; // Skip if fields overlap
                        }

                        const store = new VersionedDataStore();

                        const record: DataRecord = {
                            ...initialRecord,
                            version: 1,
                            updatedAt: new Date().toISOString(),
                            updatedBy: initialRecord.userId,
                        };
                        store.create(record);

                        // Apply all updates with merge strategy
                        for (const update of filteredUpdates) {
                            const current = store.get(record.id)!;
                            const updateOp: UpdateOperation = {
                                recordId: record.id,
                                userId: update.userId,
                                changes: { [update.field]: update.value },
                                expectedVersion: 1, // Intentionally stale
                                timestamp: new Date().toISOString(),
                            };

                            const resolution = resolveConflict(current, updateOp, 'merge');
                            applyConflictResolution(store, record.id, resolution, update.userId);
                        }

                        // Verify all updates were preserved
                        const final = store.get(record.id)!;
                        for (const update of filteredUpdates) {
                            expect(final.data[update.field]).toBe(update.value);
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: No data loss during conflict resolution
     * 
     * For any conflict resolution, original data should not be lost
     * unless explicitly overwritten.
     */
    it(
        'should not lose data during conflict resolution',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        userId: fc.string({ minLength: 5, maxLength: 20 }),
                        data: fc.dictionary(
                            fc.string({ minLength: 1, maxLength: 10 }),
                            fc.string()
                        ),
                    }),
                    fc.record({
                        changes: fc.dictionary(
                            fc.string({ minLength: 1, maxLength: 10 }),
                            fc.string()
                        ),
                        userId: fc.string({ minLength: 5, maxLength: 20 }),
                    }),
                    fc.constantFrom<ConflictStrategy>('last-write-wins', 'merge'),
                    async (initialRecord, update, strategy) => {
                        const store = new VersionedDataStore();

                        const record: DataRecord = {
                            ...initialRecord,
                            version: 1,
                            updatedAt: new Date().toISOString(),
                            updatedBy: initialRecord.userId,
                        };
                        store.create(record);

                        // Get original fields
                        const originalFields = Object.keys(record.data);

                        // Apply conflicting update
                        const updateOp: UpdateOperation = {
                            recordId: record.id,
                            userId: update.userId,
                            changes: update.changes,
                            expectedVersion: 1,
                            timestamp: new Date().toISOString(),
                        };

                        // Force a conflict by updating first
                        store.update(record.id, { temp: 'value' }, 1, 'system');

                        // Now apply conflicting update
                        const current = store.get(record.id)!;
                        const resolution = resolveConflict(current, updateOp, strategy);
                        applyConflictResolution(store, record.id, resolution, update.userId);

                        // Verify original fields still exist (unless explicitly overwritten)
                        const final = store.get(record.id)!;
                        for (const field of originalFields) {
                            if (!(field in update.changes)) {
                                // Field not in update, should still exist
                                expect(final.data[field]).toBe(record.data[field]);
                            }
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );

    /**
     * Property: Version monotonically increases
     * 
     * For any conflict resolution, version number should always increase.
     */
    it(
        'should monotonically increase version numbers',
        async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        userId: fc.string({ minLength: 5, maxLength: 20 }),
                        data: fc.dictionary(fc.string(), fc.string()),
                    }),
                    fc.array(
                        fc.record({
                            changes: fc.dictionary(fc.string(), fc.string()),
                            userId: fc.string({ minLength: 5, maxLength: 20 }),
                        }),
                        { minLength: 3, maxLength: 10 }
                    ),
                    async (initialRecord, updates) => {
                        const store = new VersionedDataStore();

                        const record: DataRecord = {
                            ...initialRecord,
                            version: 1,
                            updatedAt: new Date().toISOString(),
                            updatedBy: initialRecord.userId,
                        };
                        store.create(record);

                        let previousVersion = 1;

                        // Apply updates and verify version increases
                        for (const update of updates) {
                            const current = store.get(record.id)!;
                            const updateOp: UpdateOperation = {
                                recordId: record.id,
                                userId: update.userId,
                                changes: update.changes,
                                expectedVersion: 1, // Intentionally stale
                                timestamp: new Date().toISOString(),
                            };

                            const resolution = resolveConflict(current, updateOp, 'last-write-wins');
                            applyConflictResolution(store, record.id, resolution, update.userId);

                            const updated = store.get(record.id)!;
                            expect(updated.version).toBeGreaterThan(previousVersion);
                            previousVersion = updated.version;
                        }
                    }
                ),
                fcConfig
            );
        },
        30000
    );
});
