export type YyyyMm = `${number}-${number}`;

export function toYyyyMm(date: Date): YyyyMm {
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}` as YyyyMm;
}

export function toDate(yyyyMm: YyyyMm): Date {
	const [year, month] = yyyyMm.split("-").map(Number);
	return new Date(year!, month! - 1, 1);
}

export function monthsInRange(
	since: YyyyMm | Date,
	until: YyyyMm | Date,
): YyyyMm[] {
	const sinceDate = new Date(since);
	const sinceYear = sinceDate.getUTCFullYear();
	const sinceMonth = sinceDate.getUTCMonth();

	const untilDate = new Date(until);
	const untilYear = untilDate.getUTCFullYear();
	const untilMonth = untilDate.getUTCMonth();

	return Array.from(
		{ length: (untilYear - sinceYear) * 12 + (untilMonth - sinceMonth) + 1 },
		(_, i) => {
			const date = new Date(Date.UTC(sinceYear, sinceMonth + i, 1));
			return toYyyyMm(date);
		},
	);
}

export function offset(
	date: YyyyMm | Date,
	offset: Partial<Record<"days" | "months" | "years", number>>,
): YyyyMm {
	date = new Date(date);
	if (offset.days) {
		date.setUTCDate(date.getUTCDate() + offset.days);
	}
	if (offset.months) {
		date.setUTCMonth(date.getUTCMonth() + offset.months);
	}
	if (offset.years) {
		date.setUTCFullYear(date.getUTCFullYear() + offset.years);
	}
	return toYyyyMm(date);
}
