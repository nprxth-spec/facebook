/**
 * Unified cache utility — uses Upstash Redis when configured, falls back to
 * an in-process Map otherwise (fine for dev / single-instance deployments).
 *
 * ENV vars required for Redis mode:
 *   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=AXxx...
 *
 * When not set, the app silently uses an in-memory Map (same as before).
 */

import { Redis } from "@upstash/redis";

// ---- In-memory fallback ----
const memCache = new Map<string, { data: unknown; expiresAt: number }>();

// ---- Upstash client (lazy init) ----
let redis: Redis | null = null;
function getRedis(): Redis | null {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return null;
    }
    if (!redis) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
    return redis;
}

/** Get cached value. Returns null if missing or expired. */
export async function cacheGet<T>(key: string): Promise<T | null> {
    const client = getRedis();
    if (client) {
        try {
            const val = await client.get<T>(key);
            return val ?? null;
        } catch (e) {
            console.warn("[cache] Redis get error, falling back to mem:", e);
        }
    }

    // In-memory fallback
    const entry = memCache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
        memCache.delete(key);
        return null;
    }
    return entry.data as T;
}

/** Set a cached value with TTL in seconds. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const client = getRedis();
    if (client) {
        try {
            await client.set(key, value, { ex: ttlSeconds });
            return;
        } catch (e) {
            console.warn("[cache] Redis set error, falling back to mem:", e);
        }
    }

    // In-memory fallback
    memCache.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Delete a cached value. */
export async function cacheDel(key: string): Promise<void> {
    const client = getRedis();
    if (client) {
        try {
            await client.del(key);
            return;
        } catch (e) {
            console.warn("[cache] Redis del error:", e);
        }
    }
    memCache.delete(key);
}

/** Check if Redis is configured and reachable. */
export function isRedisConfigured(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
