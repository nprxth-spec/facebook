/**
 * Simple concurrency limiter — runs at most `limit` async tasks at a time.
 * Avoids flooding external APIs (Facebook, Google) with unlimited parallel requests.
 *
 * Usage:
 *   const results = await runWithConcurrency(items, 5, async (item) => { ... });
 */
export async function runWithConcurrency<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;

    async function worker() {
        while (index < items.length) {
            const current = index++;
            results[current] = await fn(items[current], current);
        }
    }

    const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
    await Promise.all(workers);
    return results;
}
