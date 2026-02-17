import { mapValues } from "es-toolkit";
import { slidingWindow } from "@/utils/iter";
import { monthsInRange } from "@/utils/time";
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
	from,
	to,
	top,
}: MonthlyDataParams): Promise<MonthlyData> {
	const url = `/api/monthly${createUrlParams({ from, to, top })}`;
	const rawData: Record<
		string,
		Array<{ month: string; count: number }>
	> = await fetch(url).then((res) => res.json());

	// fill in gaps, apply cumulative
	const months = monthsInRange(from, to);
	function* calculate(
		data: Array<{ month: string; count: number }>,
	): Generator<{ month: string; count: number | null }> {
		const monthlyCount = Object.fromEntries(
			data.map(({ month, count }) => [month, count]),
		);

		if (!cumulative) {
			for (const month of months) {
				const count = monthlyCount[month];
				yield { month, count: count ?? null };
			}
			return;
		}

		let accumulator = 0;
		for (const [month, nextMonth] of slidingWindow(months, 2)) {
			if (!month) {
				continue;
			}
			const count = monthlyCount[month];
			if (count !== undefined) {
				accumulator += count;
				yield { month, count: accumulator };
				continue;
			}
			if (!nextMonth) {
				yield { month, count: accumulator };
				continue;
			}
			yield { month, count: null };
		}
	}

	return mapValues(rawData, (entries) => Array.from(calculate(entries)));
}

function createUrlParams(params: object): string {
	const urlSearchParams = new URLSearchParams(
		Object.entries(params)
			.filter(([_, v]) => v !== undefined)
			.map(([k, v]) => [k, String(v)]),
	).toString();
	return urlSearchParams ? `?${urlSearchParams}` : "";
}
