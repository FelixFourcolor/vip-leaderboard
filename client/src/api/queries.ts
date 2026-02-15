import { mapValues } from "es-toolkit";
import type { MonthlyData, MonthlyDataParams, RankingParams } from "./types";

export async function getLastUpdated(): Promise<Date> {
	const ts = await fetch("/api/last-updated").then((res) => res.json());
	return new Date(ts);
}

export function getRanking(params: RankingParams) {
	const url = `/api/ranking${createUrlParams(params)}`;
	return fetch(url).then((res) => res.json());
}

export async function getMonthlyData({
	cumulative,
	...apiParams
}: MonthlyDataParams): Promise<MonthlyData> {
	const url = `/api/monthly${createUrlParams(apiParams)}`;
	const data = (await fetch(url).then((res) => res.json())) as MonthlyData;
	if (!cumulative) {
		return data;
	}

	return mapValues(data, (tickets) => {
		let cumulativeCount = 0;
		return tickets.map(({ month, count }) => {
			cumulativeCount += count;
			return { month, count: cumulativeCount };
		});
	});
}

function createUrlParams(params: object): string {
	const urlSearchParams = new URLSearchParams(
		Object.entries(params)
			.filter(([_, v]) => v !== undefined)
			.map(([k, v]) => [k, String(v)]),
	).toString();
	return urlSearchParams ? `?${urlSearchParams}` : "";
}
