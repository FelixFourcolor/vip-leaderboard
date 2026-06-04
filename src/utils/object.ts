// es-toolkit's pick doesn't work with drizzle's schema objects
export const pick = <T, const K extends keyof T>(obj: T, keys: readonly K[]) =>
	Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<T, K>;

// better typing than builtins

export const values: <T extends object>(obj: T) => T[keyof T][] = Object.values;

export const keys: <T extends object>(obj: T) => (keyof T)[] = Object.keys;

export const entries: <T extends object>(obj: T) => [keyof T, T[keyof T]][] =
	Object.entries;

export const fromEntries: <K extends PropertyKey, V>(
	entries: [K, V][],
) => Record<K, V> = Object.fromEntries;
