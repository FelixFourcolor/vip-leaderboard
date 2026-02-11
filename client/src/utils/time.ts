export function toYyyyMm(date: Date): string {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthsInRange(from: string, to: string): string[] {
	const fromDate = new Date(from);
	const fromYear = fromDate.getUTCFullYear();
	const fromMonth = fromDate.getUTCMonth();

	const toDate = new Date(to);
	const toYear = toDate.getUTCFullYear();
	const toMonth = toDate.getUTCMonth();

	return Array.from(
		{ length: (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1 },
		(_, i) => {
			const date = new Date(Date.UTC(fromYear, fromMonth + i, 1));
			return toYyyyMm(date);
		},
	);
}

export function offset(
	yyymm: string,
	offset: Partial<Record<"months" | "years", number>>,
): string {
	const date = new Date(yyymm);
	if (offset.months) {
		date.setUTCMonth(date.getUTCMonth() + offset.months);
	}
	if (offset.years) {
		date.setUTCFullYear(date.getUTCFullYear() + offset.years);
	}
	return toYyyyMm(date);
}
