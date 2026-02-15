import type { PointOrSliceMouseHandler } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useMemo, useState } from "react";
import { useGetMonthlyData } from "@/api/hooks";
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

	const queryData =
		useLastDefined(
			useGetMonthlyData({
				cumulative,
				top,
				from,
				to: offset(to, { months: 1 }), // make "to" inclusive
			}),
		) ?? {};

	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const [hoveredPoint, setHoveredPoint] = useState<{
		x: Date;
		y: number;
	} | null>(null);

	const colorById = useMemo(() => {
		return Object.fromEntries(
			Object.keys(queryData).map((userId, i) => [
				userId,
				colorSchemes[i % colorSchemes.length]!,
			]),
		);
	}, [queryData]);

	// workaround for nivo's bug for not exposing seriesId for each point
	const idByColor = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(colorById).map(([id, color]) => [color, id]),
			),
		[colorById],
	);

	const months = useMemo(() => monthsInRange(from, to), [from, to]);

	const data = useMemo(
		() =>
			mapValues(queryData, ({ tickets }) => {
				const ticketsByMonth = Object.fromEntries(
					tickets.map(({ month, count }) => [month, count]),
				);
				let previous: number | null = null;
				const data = months.map((month) => {
					const tickets = ticketsByMonth[month];
					if (tickets !== undefined) {
						previous = tickets;
						return [month, tickets] as const;
					}
					if (cumulative) {
						return [month, previous ?? 0] as const;
					}
					return [month, null] as const;
				});
				return Object.fromEntries(data);
			}),
		[queryData, cumulative, months],
	);

	const chartData = useMemo<ChartSeries[]>(() => {
		const orderedData = highlightedUser
			? (() => {
					const { [highlightedUser]: first, ...rest } = data;
					return first ? { [highlightedUser]: first, ...rest } : data;
				})()
			: data;

		return Object.entries(orderedData).map(([id, ticketsByMonth]) => ({
			id,
			data: Object.entries(ticketsByMonth).map(([x, y]) => ({
				x: new Date(x),
				y,
			})),
		}));
	}, [data, highlightedUser]);

	const isolatedPoints = useMemo(() => {
		const windows = Array.from(slidingWindow(months, 3, true));
		return mapValues(
			data,
			(ticketsByMonth) =>
				new Set(
					windows
						.filter(([prev, , next]) => {
							const prevMissing = !prev || ticketsByMonth[prev] === null;
							const nextMissing = !next || ticketsByMonth[next] === null;
							return prevMissing && nextMissing;
						})
						.map(([, value]) => value),
				),
		);
	}, [data, months]);

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
				queryData,
				highlightedUser,
			}}
		>
			<div className={cx("container")}>
				<div style={{ height }} onMouseLeave={onMouseLeave}>
					<ChartLine data={chartData} onMouseMove={onMouseMove} />
				</div>
				<br />
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
