import type { PointOrSliceMouseHandler } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useMemo, useState } from "react";
import { useGetMonthlyData, useGetRanking } from "@/api/hooks";
import { useLastDefined } from "@/hooks/useLastDefined";
import { slidingWindow } from "@/utils/iter";
import { monthsInRange, offset } from "@/utils/time";
import styles from "./Chart.module.css";
import { ChartControls, useChartControls } from "./ChartControls";
import { ChartLine } from "./ChartLine";
import { ChartContext } from "./context";

const cx = classNames.bind(styles);

type Props = { height: number };

export type ChartSeries = {
	id: string;
	data: { x: Date; y: number | null }[];
};

export function Chart({ height }: Props) {
	const [{ to, from, cumulative, top }] = useChartControls();
	const inclusiveTo = offset(to, { months: 1 });
	const userData =
		useLastDefined(useGetRanking({ top, from, to: inclusiveTo })) ?? {};
	const monthlyData =
		useLastDefined(
			useGetMonthlyData({ cumulative, top, from, to: inclusiveTo }),
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
	// workaround for nivo's bug of not exposing seriesId for each point
	const idByColor = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(colorById).map(([id, color]) => [color, id]),
			),
		[colorById],
	);

	const months = useMemo(() => monthsInRange(from, to), [from, to]);

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

	const isolatedPoints = useMemo(() => {
		return mapValues(monthlyData, (ticketsByMonth) => {
			return new Set(
				Array.from(slidingWindow(ticketsByMonth, 3))
					.filter(
						([prev, , next]) => prev?.count == null && next?.count == null,
					)
					.map(([, { month }]) => month),
			);
		});
	}, [monthlyData]);

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
				idByColor,
				isolatedPoints,
				colorById,
				monthlyData,
				months,
				userData,
				highlightedUser,
			}}
		>
			<div className={cx("container")}>
				<div style={{ height }} onMouseLeave={onMouseLeave}>
					<ChartLine data={chartData} onMouseMove={onMouseMove} />
				</div>
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
