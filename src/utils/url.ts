export function createUrlParams(params: object): string {
	const urlSearchParams = new URLSearchParams(
		Object.entries(params)
			.filter(([_, v]) => v !== undefined)
			.map(([k, v]) => [k, String(v)]),
	).toString();
	return urlSearchParams ? `?${urlSearchParams}` : "";
}
