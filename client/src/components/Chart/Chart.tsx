import type { PointOrSliceMouseHandler } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMonthlyRanking, type MonthlyRanking } from "@/api/monthlyRanking";
import { windows } from "@/utils/iter";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./ChartControls";
import { ChartLegend } from "./ChartLegend";
import { ChartLine } from "./ChartLine";
import { getSeriesColor } from "./colors";
import { ChartContext } from "./context";

const cx = classNames.bind(styles);

export type ChartSeries = {
	id: string;
	data: { x: Date; y: number | null }[];
};

export function Chart() {
	const [params] = useChartControls();
	const [queryData = {}, setQueryData] = useState<MonthlyRanking>();
	useEffect(() => {
		getMonthlyRanking(params).then(setQueryData);
	}, [params]);

	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const [hoveredPoint, setHoveredPoint] = useState<{
		x: Date;
		y: number;
	} | null>(null);

	const isolatedPoints = useMemo(() => {
		return mapValues(queryData, ({ monthlyCount }) => {
			return new Set(
				Array.from(windows(monthlyCount, 3))
					.filter(
						([prev, , next]) => prev?.count == null && next?.count == null,
					)
					.map(([, current]) => current.month),
			);
		});
	}, [queryData]);

	// workaround for nivo's bug of not exposing seriesId for each point
	const idByColor = useMemo(() => {
		// requires number of users <= 10 = number of colors
		return Object.fromEntries(
			Object.entries(queryData).map(([userId, userData]) => [
				getSeriesColor(userData),
				userId,
			]),
		);
	}, [queryData]);

	const chartData = useMemo(() => {
		return mapValues(queryData, ({ monthlyCount }) => {
			return monthlyCount.map(({ month, count }) => ({
				x: new Date(month),
				y: count,
			}));
		});
	}, [queryData]);

	const sortedChartData = useMemo<ChartSeries[]>(() => {
		const sortedData = (() => {
			if (!highlightedUser) {
				return chartData;
			}
			const { [highlightedUser]: first, ...rest } = chartData;
			if (!first) {
				return chartData;
			}
			return { [highlightedUser]: first, ...rest };
		})();

		return Object.entries(sortedData).map(([id, data]) => ({ id, data }));
	}, [chartData, highlightedUser]);

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
		setHighlightedUser(null);
		setHoveredPoint(null);
	}, []);

	return (
		<ChartContext.Provider
			value={{
				queryData,
				hoveredPoint,
				isolatedPoints,
				idByColor,
				highlightedUser,
			}}
		>
			<div className={cx("container")}>
				<ChartLine
					data={sortedChartData}
					onMouseMove={onMouseMove}
					onMouseLeave={onMouseLeave}
				/>
				<ChartLegend />
				<ChartControls />
			</div>
		</ChartContext.Provider>
	);
}
