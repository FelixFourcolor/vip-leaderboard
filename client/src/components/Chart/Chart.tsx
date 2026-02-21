import type { PointOrSliceMouseHandler } from "@nivo/line";
import classNames from "classnames/bind";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMonthlyRanking, type MonthlyRanking } from "@/api/monthlyRanking";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./ChartControls";
import { ChartLegend } from "./ChartLegend";
import { ChartLine } from "./ChartLine";
import { COLORS } from "./colors";
import { ChartContext } from "./context";

const cx = classNames.bind(styles);

export type ChartSeries = {
	id: string;
	data: { x: Date; y: number | null }[];
};

export function Chart() {
	const [params] = useChartControls();
	const [data = {}, setData] = useState<MonthlyRanking>();
	useEffect(() => {
		getMonthlyRanking(params).then(setData);
	}, [params]);

	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const [hoveredPoint, setHoveredPoint] = useState<{
		x: Date;
		y: number;
	} | null>(null);

	const colorById = useMemo(() => {
		return Object.fromEntries(
			Object.keys(data).map((k, i) => [k, COLORS[i % COLORS.length]!]),
		);
	}, [data]);

	const chartData = useMemo<ChartSeries[]>(() => {
		const orderedData = (() => {
			if (!highlightedUser) {
				return data;
			}
			const { [highlightedUser]: first, ...rest } = data;
			if (!first) {
				return data;
			}
			return { [highlightedUser]: first, ...rest };
		})();

		return Object.entries(orderedData).map(([id, { monthlyCount }]) => ({
			id,
			data: monthlyCount.map(({ month, count }) => ({
				x: new Date(month),
				y: count,
			})),
		}));
	}, [data, highlightedUser]);

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
			value={{ data, hoveredPoint, colorById, highlightedUser }}
		>
			<div className={cx("container")}>
				<ChartLine
					chartData={chartData}
					onMouseMove={onMouseMove}
					onMouseLeave={onMouseLeave}
				/>
				<ChartLegend />
				<ChartControls />
			</div>
		</ChartContext.Provider>
	);
}
