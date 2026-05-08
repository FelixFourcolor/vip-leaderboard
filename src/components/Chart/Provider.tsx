import { mapValues } from "es-toolkit";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { getMonthlyData, type MonthlyRanking } from "@/db/monthlyRanking";
import { windows3 } from "@/utils/array";
import { monthsInRange, type YyyyMm } from "@/utils/time";
import { useChartControls } from "./Controls";
import { colorsCount } from "./colors";
import { ChartContext, type PointId } from "./context";

type Props = {
	children: (_: { entries: MonthlyRanking }) => ReactNode;
};
export function ChartProvider({ children: Chart }: Props) {
	const [{ since, until, cumulative, stacked }] = useChartControls();
	const [startingRank, setStartingRank] = useState(1);
	const [visibleRanks, setVisibleRanks] = useState(colorsCount);

	const [totalData = {}, setTotalData] = useState<MonthlyRanking>();
	useEffect(() => {
		getMonthlyData({ since, until }).then(setTotalData);
	}, [since, until]);

	const chartData = useMemo<MonthlyRanking>(() => {
		const months = monthsInRange(since, until);
		const filteredData = Object.fromEntries(
			Object.entries(totalData).filter(
				([, { rank }]) =>
					startingRank <= rank && rank < startingRank + visibleRanks,
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
						count: countByMonth[month] ?? (stacked ? 0 : null),
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
					}
					return {
						month,
						count: stacked || accumulator !== 0 ? accumulator : null,
					};
				}),
			};
		});
	}, [
		totalData,
		cumulative,
		startingRank,
		visibleRanks,
		since,
		until,
		stacked,
	]);

	const isolatedPoints = useMemo<Record<string, Set<YyyyMm>>>(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			if (cumulative || stacked) {
				return new Set();
			}
			return new Set(
				windows3(monthlyCount)
					.filter(
						([pre, cur, nex]) =>
							pre?.count == null && cur.count != null && nex?.count == null,
					)
					.map(([, cur]) => cur.month),
			);
		});
	}, [chartData, cumulative, stacked]);

	const [highlightedUser, setHighlightedUser] = useState<string>();
	const [hoveredPoint, setHoveredPoint] = useState<PointId>();
	useEffect(() => {
		if (highlightedUser && !chartData[highlightedUser]) {
			setHighlightedUser(undefined);
		} else if (hoveredPoint && chartData[hoveredPoint.seriesId]) {
			setHighlightedUser(hoveredPoint.seriesId);
		}
	}, [highlightedUser, hoveredPoint, chartData]);

	return (
		<ChartContext
			value={{
				chartData,
				isolatedPoints,
				setStartingRank,
				visibleRanks,
				setVisibleRanks,
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
