import type { PointOrSliceMouseHandler } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useMemo, useState } from "react";
import { useGetMonthlyData, useGetRanking } from "@/api/hooks";
import { useLastDefined } from "@/hooks/useLastDefined";
import { offset } from "@/utils/time";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./ChartControls";
import { ChartLegend } from "./ChartLegend";
import { ChartLine } from "./ChartLine";
import { ChartContext } from "./context";

const cx = classNames.bind(styles);

export type ChartSeries = {
	id: string;
	data: { x: Date; y: number | null }[];
};

export function Chart() {
	const [{ until, since, cumulative, from, to }] = useChartControls();
	const inclusiveUntil = offset(until, { months: 1 });
	const userData =
		useLastDefined(
			useGetRanking({
				from,
				to,
				since,
				until: inclusiveUntil,
			}),
		) ?? {};
	const monthlyData =
		useLastDefined(
			useGetMonthlyData({
				cumulative,
				from,
				to,
				since,
				until: inclusiveUntil,
			}),
		) ?? {};

	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const [hoveredPoint, setHoveredPoint] = useState<{
		x: Date;
		y: number;
	} | null>(null);

	const colorById = useMemo(() => {
		return mapValues(
			userData,
			({ rank }) => colorSchemes[(rank - 1) % colorSchemes.length]!,
		);
	}, [userData]);

	const chartData = useMemo<ChartSeries[]>(() => {
		const orderedData = (() => {
			if (!highlightedUser) {
				return monthlyData;
			}
			const { [highlightedUser]: first, ...rest } = monthlyData;
			if (!first) {
				return monthlyData;
			}
			return { [highlightedUser]: first, ...rest };
		})();

		return Object.entries(orderedData).map(([id, monthlyCount]) => ({
			id,
			data: monthlyCount.map(({ month, count }) => ({
				x: new Date(month),
				y: count,
			})),
		}));
	}, [monthlyData, highlightedUser]);

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
				hoveredPoint,
				colorById,
				monthlyData,
				userData,
				highlightedUser,
			}}
		>
			<div className={cx("container")}>
				<ChartLine
					data={chartData}
					onMouseMove={onMouseMove}
					onMouseLeave={onMouseLeave}
				/>
				<ChartLegend />
				<ChartControls />
			</div>
		</ChartContext.Provider>
	);
}

const colorSchemes = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#8c564b",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#17becf",
] as const;
