import { useQuery } from "@tanstack/react-query";
import { mapValues } from "es-toolkit";
import type { MonthlyData } from "./types";

export function useGetLastUpdated(): Date | undefined {
	const { data } = useQuery({
		queryKey: ["lastUpdated"],
		queryFn: () =>
			fetch("/api/last-updated")
				.then((res) => res.json())
				.then((ts) => (ts ? new Date(ts) : undefined)),
	});

	return data;
}

type MonthlyDataParams = { from?: string; to?: string; cumulative: boolean } & (
	| { top?: number; user?: never }
	| { top?: never; user?: string }
);

export function useGetMonthlyData(params: MonthlyDataParams) {
	const { cumulative, ...apiParams } = params;
	const query = new URLSearchParams(
		Object.entries(apiParams).filter(([_, v]) => v !== undefined),
	).toString();
	const url = `/api/monthly${query ? `?${query}` : ""}`;

	const { data } = useQuery<MonthlyData>({
		queryKey: ["monthly", apiParams],
		queryFn: () => fetch(url).then((res) => res.json()),
	});

	if (!data || !cumulative) {
		return data;
	}

	return mapValues(data, ({ tickets, ...userInfo }) => {
		let cumulativeCount = 0;
		const cumulativeTickets = tickets.map(({ month, count }) => {
			cumulativeCount += count;
			return { month, count: cumulativeCount };
		});
		return { ...userInfo, tickets: cumulativeTickets };
	}) satisfies MonthlyData;
}
