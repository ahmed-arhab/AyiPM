import { describe, expect, it } from 'vitest';
import { mapWithConcurrency } from './async';

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Runs `run` for each item and records how many calls were in flight; each call waits until released. */
function trackedRun() {
  const pending = new Map<number, () => void>();
  const started: number[] = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const run = (item: number) =>
    new Promise<string>((resolve) => {
      started.push(item);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      pending.set(item, () => {
        inFlight -= 1;
        resolve(`result ${item}`);
      });
    });
  const release = async (item: number) => {
    pending.get(item)?.();
    pending.delete(item);
    // Let the worker that was waiting on this call pick up its next item.
    await tick();
  };
  return { run, release, started, maxInFlight: () => maxInFlight };
}

describe('mapWithConcurrency', () => {
  it('returns an empty list without calling run for no items', async () => {
    let calls = 0;
    await expect(
      mapWithConcurrency([], 3, async () => {
        calls += 1;
      })
    ).resolves.toEqual([]);
    expect(calls).toBe(0);
  });

  it('never has more than `limit` calls in flight, and starts the next as one finishes', async () => {
    const t = trackedRun();
    const done = mapWithConcurrency([1, 2, 3, 4, 5], 2, t.run);
    await tick();
    expect(t.started).toEqual([1, 2]);

    await t.release(2);
    expect(t.started).toEqual([1, 2, 3]);
    await t.release(1);
    expect(t.started).toEqual([1, 2, 3, 4]);
    for (const item of [3, 4, 5]) await t.release(item);

    await expect(done).resolves.toEqual(['result 1', 'result 2', 'result 3', 'result 4', 'result 5']);
    expect(t.maxInFlight()).toBe(2);
  });

  it('keeps results in the order of the items when calls finish out of order', async () => {
    const t = trackedRun();
    const done = mapWithConcurrency([1, 2, 3], 3, t.run);
    await tick();
    for (const item of [3, 1, 2]) await t.release(item);
    await expect(done).resolves.toEqual(['result 1', 'result 2', 'result 3']);
  });

  it('starts every call at once when the limit is above the number of items', async () => {
    const t = trackedRun();
    const done = mapWithConcurrency([1, 2, 3], 10, t.run);
    await tick();
    expect(t.started).toEqual([1, 2, 3]);
    for (const item of [1, 2, 3]) await t.release(item);
    await done;
  });

  it.each([0, -1])('still runs one call at a time with a limit of %d', async (limit) => {
    const t = trackedRun();
    const done = mapWithConcurrency([1, 2], limit, t.run);
    await tick();
    expect(t.started).toEqual([1]);
    await t.release(1);
    await t.release(2);
    await expect(done).resolves.toEqual(['result 1', 'result 2']);
    expect(t.maxInFlight()).toBe(1);
  });

  it('rejects when a call fails', async () => {
    const run = async (item: number) => {
      if (item === 2) throw new Error('boom');
      return item;
    };
    await expect(mapWithConcurrency([1, 2, 3], 2, run)).rejects.toThrow('boom');
  });
});
