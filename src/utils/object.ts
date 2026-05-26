// es-toolkit's pick doesn't work with drizzle's schema objects
export const pick = <T, const K extends keyof T>(obj: T, keys: readonly K[]) =>
	Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<T, K>;

// better typing than builtins

export const values = <T extends object>(obj: T) =>
	Object.values(obj) as T[keyof T][];

export const keys = <T extends object>(obj: T) =>
	Object.keys(obj) as (keyof T)[];
