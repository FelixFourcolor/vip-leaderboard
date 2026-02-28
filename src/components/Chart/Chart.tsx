import type { PointOrSliceMouseHandler } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMonthlyData, type MonthlyRanking } from "@/db/monthlyRanking";
import { windows3 } from "@/utils/array";
import { monthsInRange } from "@/utils/time";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./ChartControls";
import { ChartLegend, useVisibleCount } from "./ChartLegend";
import { ChartLine } from "./ChartLine";
import { getSeriesColor } from "./colors";
import { ChartContext } from "./context";

const cx = classNames.bind(styles);

export type ChartSeries = {
	id: string;
	data: { x: Date; y: number | null }[];
};

export function Chart() {
	const [{ since, until, fromRank, cumulative }] = useChartControls();
	const [visibleCount, legendRef] = useVisibleCount();
	const [totalData = {}, setTotalData] = useState<MonthlyRanking>();

	useEffect(() => {
		getMonthlyData({ since, until }).then(setTotalData);
	}, [since, until]);

	const chartData = useMemo<MonthlyRanking>(() => {
		const months = monthsInRange(since, until);
		const filteredData = Object.fromEntries(
			Object.entries(totalData).filter(
				([, { rank }]) => fromRank <= rank && rank < fromRank + visibleCount,
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
	}, [totalData, cumulative, fromRank, visibleCount, since, until]);

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

	const linesData = useMemo(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			return monthlyCount.map(({ month, count }) => ({
				x: new Date(month),
				y: count,
			}));
		});
	}, [chartData]);

	const sortedLinesData = useMemo<ChartSeries[]>(() => {
		const sortedData = (() => {
			if (!highlightedUser) {
				return linesData;
			}
			const { [highlightedUser]: highlighted, ...rest } = linesData;
			if (!highlighted) {
				return linesData;
			}
			return { [highlightedUser]: highlighted, ...rest };
		})();

		return Object.entries(sortedData).map(([id, data]) => ({ id, data }));
	}, [linesData, highlightedUser]);

	const onMouseMove = useCallback<PointOrSliceMouseHandler<ChartSeries>>(
		(datum) => {
			if (!("seriesId" in datum)) {
				return;
			}
			const { seriesId, data } = datum;
			setHighlightedUser(seriesId);
			const { x, y } = data;
			if (y !== null) {
				setHoveredPoint({ x, y });
			}
		},
		[],
	);

	const onMouseLeave = useCallback(() => {
		setHighlightedUser(undefined);
		setHoveredPoint(undefined);
	}, []);

	return (
		<ChartContext
			value={{
				chartData,
				hoveredPoint,
				isolatedPoints,
				idByColor,
				highlightedUser,
				setHighlightedUser,
			}}
		>
			<div className={cx("container")}>
				<ChartLine
					linesData={sortedLinesData}
					onMouseMove={onMouseMove}
					onMouseLeave={onMouseLeave}
				/>
				<ChartLegend
					entries={totalData}
					visibleCount={visibleCount}
					ref={legendRef}
				/>
				<ChartControls />
			</div>
		</ChartContext>
	);
}
