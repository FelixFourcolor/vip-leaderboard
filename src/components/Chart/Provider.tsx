import { mapValues } from "es-toolkit";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { getMonthlyData, type MonthlyRanking } from "@/db/monthlyRanking";
import { windows3 } from "@/utils/array";
import { monthsInRange } from "@/utils/time";
import { useChartControls } from "./Controls";
import { colorsCount, getSeriesColor } from "./colors";
import { ChartContext } from "./context";

type Props = {
	children: (_: { entries: MonthlyRanking }) => ReactNode;
};
export function ChartProvider({ children: Chart }: Props) {
	const [{ since, until, fromRank, cumulative }] = useChartControls();
	const [visibleUsersCount, setVisibleUsersCount] = useState(colorsCount);

	const [totalData = {}, setTotalData] = useState<MonthlyRanking>();
	useEffect(() => {
		getMonthlyData({ since, until }).then(setTotalData);
	}, [since, until]);

	const chartData = useMemo<MonthlyRanking>(() => {
		const months = monthsInRange(since, until);
		const filteredData = Object.fromEntries(
			Object.entries(totalData).filter(
				([, { rank }]) =>
					fromRank <= rank && rank < fromRank + visibleUsersCount,
			),
		);
		return mapValues(filteredData, ({ monthlyCount, ...userData }) => {
			const countByMonth = Object.fromEntries(
				monthlyCount.map(({ month, count }) => [month, count]),
			);

			if (!cumulative) {
				return {
					...userData,
					monthlyCount: months.map((month) => ({
						month,
						count: countByMonth[month] ?? null,
					})),
				};
			}

			let accumulator = 0;
			return {
				...userData,
				monthlyCount: months.map((month) => {
					const count = countByMonth[month];
					if (count != null) {
						accumulator += count;
						return { month, count: accumulator };
					}
					return { month, count: null };
				}),
			};
		});
	}, [totalData, cumulative, fromRank, visibleUsersCount, since, until]);

	const isolatedPoints = useMemo(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			return new Set(
				windows3(monthlyCount)
					.filter(([pre, cur, nex]) => !pre?.count && cur.count && !nex?.count)
					.map(([, cur]) => cur.month),
			);
		});
	}, [chartData]);

	// workaround for nivo's bug of not exposing seriesId for each point
	const idByColor = useMemo(() => {
		// requires number of users <= 10 = number of colors
		return Object.fromEntries(
			Object.entries(chartData).map(([userId, userData]) => [
				getSeriesColor(userData),
				userId,
			]),
		);
	}, [chartData]);

	const [highlightedUser, setHighlightedUser] = useState<string>();
	const [hoveredPoint, setHoveredPoint] = useState<{ x: Date; y: number }>();

	return (
		<ChartContext
			value={{
				chartData,
				isolatedPoints,
				idByColor,
				visibleUsersCount,
				setVisibleUsersCount,
				highlightedUser,
				setHighlightedUser,
				hoveredPoint,
				setHoveredPoint,
			}}
		>
			<Chart entries={totalData} />
		</ChartContext>
	);
}
