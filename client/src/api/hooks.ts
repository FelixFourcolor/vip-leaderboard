import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getLastUpdated, getMonthlyData, getRanking } from "./queries";
import type {
	MonthlyData,
	MonthlyDataParams,
	RankingData,
	RankingParams,
} from "./types";

export function useGetLastUpdated(): Date {
	const { data } = useSuspenseQuery({
		queryKey: ["lastUpdated"],
		queryFn: getLastUpdated,
		staleTime: Infinity,
	});
	return data;
}

export function useGetRanking(params: RankingParams): RankingData | undefined {
	const { data } = useQuery<RankingData>({
		queryKey: ["ranking", params],
		queryFn: () => getRanking(params),
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
