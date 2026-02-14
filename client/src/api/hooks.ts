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
	const { data } = useQuery<MonthlyData>({
		queryKey: ["monthly", params],
		queryFn: () => getMonthlyData(params),
		staleTime: Infinity,
	});
	return data;
}
