export function getAnyValue<T>(obj: Record<any, T>): T | undefined {
	for (const key in obj) {
		return obj[key];
	}
}
