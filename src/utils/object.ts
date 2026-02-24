export function getAnyValue<T>(obj: Record<any, T>): T | undefined {
	for (const key in obj) {
		return obj[key];
	}
}

// es-toolkit's pick doesn't work with drizzle's schema objects
export function pick<T, const K extends keyof T>(
	obj: T,
	keys: K[],
): Pick<T, K> {
	return Object.fromEntries(keys.map((key) => [key, obj[key]])) as Pick<T, K>;
}
