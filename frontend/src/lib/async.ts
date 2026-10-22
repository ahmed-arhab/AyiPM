/**
 * Calls `run` for every item, with at most `limit` calls in flight at once, and returns the results in the order of
 * `items`. Use it for many small API requests, so a bulk action doesn't flood the server.
 */
export async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await run(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}
