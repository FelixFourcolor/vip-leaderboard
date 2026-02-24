import type { PointOrSliceMouseHandler } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMonthlyData, type MonthlyRanking } from "@/db/monthlyRanking";
import { windows } from "@/utils/iter";
import { monthsInRange } from "@/utils/time";
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
	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const [hoveredPoint, setHoveredPoint] = useState<{
		x: Date;
		y: number;
	} | null>(null);

	const [params] = useChartControls();
	const months = useMemo(
		() => monthsInRange(params.since, params.until),
		[params.since, params.until],
	);
	const [queryData = {}, setQueryData] = useState<MonthlyRanking>();

	useEffect(() => {
		getMonthlyData(params).then((data) => {
			const { cumulative } = params;
			setQueryData(
				mapValues(data, ({ monthlyCount, ...userData }) => {
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

					return {
						...userData,
						monthlyCount: Array.from(accumulate(months, countByMonth)),
					};
				}),
			);
		});
	}, [params, months]);

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

function* accumulate(
	months: string[],
	countByMonth: Record<string, number | null>,
) {
	let accumulator = 0;
	for (const [month, nextMonth] of windows(months, 2)) {
		if (!month) {
			continue;
		}
		const count = countByMonth[month];
		if (count != null) {
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
