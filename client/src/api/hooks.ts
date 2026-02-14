import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import {
	getLastUpdated,
	getMonthlyData,
	type MonthlyDataParams,
} from "./queries";
import type { MonthlyData } from "./types";

export function useGetLastUpdated(): Date {
	const { data } = useSuspenseQuery({
		queryKey: ["lastUpdated"],
		queryFn: getLastUpdated,
		staleTime: Infinity,
	});
	return data;
}

export function useGetMonthlyData(
	params: MonthlyDataParams,
): MonthlyData | undefined {
	const { cumulative, ...apiParams } = params;

	const { data } = useQuery<MonthlyData>({
		queryKey: ["monthly", apiParams, cumulative],
		queryFn: () => getMonthlyData(params),
		staleTime: Infinity,
	});

	return data;
}
