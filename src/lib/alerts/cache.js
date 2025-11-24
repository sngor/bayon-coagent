"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAlertCache = exports.alertCache = exports.AlertCache = void 0;
class AlertCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000;
        this.maxCacheSize = 1000;
    }
    generateKey(userId, filters, options) {
        const filtersKey = JSON.stringify(filters || {});
        const optionsKey = JSON.stringify(options || {});
        return `alerts:${userId}:${Buffer.from(filtersKey).toString('base64')}:${Buffer.from(optionsKey).toString('base64')}`;
    }
    generateUnreadCountKey(userId) {
        return `unread_count:${userId}`;
    }
    generateStatsKey(userId) {
        return `stats:${userId}`;
    }
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    enforceMaxSize() {
        if (this.cache.size <= this.maxCacheSize)
            return;
        const entries = Array.from(this.cache.entries())
            .sort(([, a], [, b]) => a.timestamp - b.timestamp);
        const entriesToRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
        entriesToRemove.forEach(([key]) => this.cache.delete(key));
    }
    get(userId, filters, options) {
        this.cleanup();
        const key = this.generateKey(userId, filters, options);
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    set(userId, data, filters, options, ttl = this.defaultTTL) {
        this.cleanup();
        this.enforceMaxSize();
        const key = this.generateKey(userId, filters, options);
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }
    getUnreadCount(userId) {
        this.cleanup();
        const key = this.generateUnreadCountKey(userId);
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    setUnreadCount(userId, count, ttl = this.defaultTTL) {
        this.cleanup();
        this.enforceMaxSize();
        const key = this.generateUnreadCountKey(userId);
        this.cache.set(key, {
            data: count,
            timestamp: Date.now(),
            ttl,
        });
    }
    getStats(userId) {
        this.cleanup();
        const key = this.generateStatsKey(userId);
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    setStats(userId, stats, ttl = this.defaultTTL) {
        this.cleanup();
        this.enforceMaxSize();
        const key = this.generateStatsKey(userId);
        this.cache.set(key, {
            data: stats,
            timestamp: Date.now(),
            ttl,
        });
    }
    invalidateUser(userId) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(userId)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    invalidateAlertUpdate(userId, alertId) {
        this.invalidateUser(userId);
    }
    invalidateNewAlert(userId) {
        this.invalidateUser(userId);
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        const now = Date.now();
        const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            age: now - entry.timestamp,
            ttl: entry.ttl,
        }));
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: 0,
            entries,
        };
    }
}
exports.AlertCache = AlertCache;
exports.alertCache = new AlertCache();
const getAlertCache = () => exports.alertCache;
exports.getAlertCache = getAlertCache;
