"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

/** Fallback for private-browsing modes where localStorage throws. */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored !== null) return stored;
  } catch {
    /* storage unavailable — fall through to the in-memory copy */
  }
  return memory.get(key) ?? null;
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota or private mode — preferences last for this session only */
  }
  memory.set(key, value);
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

const noopSubscribe = () => () => {};

/** False during server render and the hydration pass, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

/**
 * State backed by localStorage, shared across every hook instance using the
 * same key. Server-rendered markup always uses `initialValue`, so hydration
 * stays consistent; the stored value takes over immediately afterwards.
 *
 * Returns `[value, setValue, hydrated]`.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // Held in state purely so inline defaults such as `[]` stay referentially
  // stable — otherwise every render would produce a fresh fallback object.
  const [fallback] = useState(initialValue);
  const hydrated = useHydrated();

  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null
  );

  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const stored = read(key);
      let current = fallback;
      if (stored !== null) {
        try {
          current = JSON.parse(stored) as T;
        } catch {
          /* keep the fallback */
        }
      }
      const resolved =
        typeof next === "function" ? (next as (c: T) => T)(current) : next;
      write(key, JSON.stringify(resolved));
      notify();
    },
    [key, fallback]
  );

  return [value, setValue, hydrated] as const;
}
