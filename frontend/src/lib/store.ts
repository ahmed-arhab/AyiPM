import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';

type Listener = () => void;
type Updater<T> = Partial<T> | ((state: T) => Partial<T> | null);

export interface Store<T> {
  getState: () => T;
  setState: (updater: Updater<T>) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (updater) => {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      if (!patch || Object.keys(patch).length === 0) return;
      state = { ...state, ...patch };
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type EqualityFn<S> = (a: S, b: S) => boolean;

export function shallowEqual<S>(a: S, b: S): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
  );
}

// Mirrors use-sync-external-store/with-selector so derived values only re-render when they actually change.
export function useStoreSelector<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  isEqual: EqualityFn<S> = Object.is
): S {
  const instRef = useRef<{ hasValue: boolean; value: S }>({ hasValue: false, value: undefined as S });
  const inst = instRef.current;

  const getSelection = useMemo(() => {
    let hasMemo = false;
    let memoizedState: T;
    let memoizedSelection: S;

    return () => {
      const nextState = store.getState();
      if (hasMemo && Object.is(memoizedState, nextState)) return memoizedSelection;

      const nextSelection = selector(nextState);
      const previous = hasMemo ? memoizedSelection : inst.hasValue ? inst.value : undefined;
      const canReuse = (hasMemo || inst.hasValue) && isEqual(previous as S, nextSelection);

      hasMemo = true;
      memoizedState = nextState;
      memoizedSelection = canReuse ? (previous as S) : nextSelection;
      return memoizedSelection;
    };
  }, [store, selector, isEqual, inst]);

  const value = useSyncExternalStore(store.subscribe, getSelection, getSelection);

  useEffect(() => {
    inst.hasValue = true;
    inst.value = value;
  }, [inst, value]);

  return value;
}

export function memoizeOne<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  let lastArgs: A | null = null;
  let lastResult: R;
  return (...args: A) => {
    if (lastArgs && lastArgs.length === args.length && lastArgs.every((arg, i) => Object.is(arg, args[i]))) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  };
}
