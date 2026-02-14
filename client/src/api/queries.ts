import { mapValues } from "es-toolkit";
import type { MonthlyData } from "./types";

export async function getLastUpdated(): Promise<Date> {
	const ts = await fetch("/api/last-updated").then((res) => res.json());
	return new Date(ts);
}

export type MonthlyDataParams = {
	from?: string;
	to?: string;
	top?: number;
	cumulative?: boolean;
};

export async function getMonthlyData({
	cumulative,
	...apiParams
}: MonthlyDataParams): Promise<MonthlyData> {
	const query = new URLSearchParams(
		Object.entries(apiParams)
			.filter(([_, v]) => v !== undefined)
			.map(([k, v]) => [k, String(v)]),
	).toString();
	const url = `/api/monthly${query ? `?${query}` : ""}`;

	const data = (await fetch(url).then((res) => res.json())) as MonthlyData;
	if (!cumulative) {
		return data;
	}

	return mapValues(data, ({ tickets, ...userInfo }) => {
		let cumulativeCount = 0;
		const cumulativeTickets = tickets.map(({ month, count }) => {
			cumulativeCount += count;
			return { month, count: cumulativeCount };
		});
		return { ...userInfo, tickets: cumulativeTickets };
	});
}
