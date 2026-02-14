import type { Point, PointTooltipProps } from "@nivo/line";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useCallback, useMemo, useState } from "react";
import { useGetMonthlyData } from "@/api/hooks";
import { TimeSlider } from "@/components/TimeSlider";
import { Toggle } from "@/components/Toggle";
import { useLastDefined } from "@/hooks/useLastDefined";
import { useZackMode } from "@/hooks/useZackMode";
import { paramDefaults, Route } from "@/routes/index";
import { slidingWindow } from "@/utils/iter";
import { monthsInRange, offset, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";
import { ChartContext } from "./context";
import { Line } from "./Line";
import { PointSymbol } from "./PointSymbol";

const cx = classNames.bind(styles);

type Props = {
	height: number;
};

export type ChartPoint = {
	id: string;
	data: { x: Date; y: number | null }[];
};

export function Chart({ height }: Props) {
	const { to, from, cumulative, top } = {
		...paramDefaults,
		...Route.useSearch(),
	};
	const navigate = Route.useNavigate();

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

	const [isZack] = useZackMode();

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

	const chartData = useMemo<ChartPoint[]>(() => {
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

	const controls = (
		<div className={cx("controls")}>
			<Toggle
				value={cumulative}
				onChange={(cumulative) => navigate({ search: { cumulative } })}
				className={cx("toggle")}
			>
				Cumulative
			</Toggle>
			<TimeSlider
				domain={[
					// earliest month with meaningful data
					"2020-01",
					// kinda hard to define "meaningful",
					// so just hardcode a value instead of querying it
					paramDefaults.to,
				]}
				selected={[from, to]}
				onChange={[
					(from) => navigate({ search: { from } }),
					(to) => navigate({ search: { to } }),
				]}
			/>
		</div>
	);

	const onMouseMove = useCallback(
		({ point: { seriesId, data } }: PointTooltipProps<ChartPoint>) => {
			const { x, y } = data;
			if (y !== null) {
				setHighlightedUser(seriesId);
				setHoveredPoint({ x, y });
			}
			return null;
		},
		[],
	);

	const pointLabel = useCallback(
		({ seriesId, indexInSeries, data: { x: date, y } }: Point<ChartPoint>) => {
			if (highlightedUser !== seriesId || y === null) {
				return "";
			}

			const seriesLength = cumulative
				? months.length
				: (queryData[seriesId]?.tickets.length ?? 0);
			const labelInterval = Math.ceil(seriesLength / (cumulative ? 8 : 16));
			if ((seriesLength - 1 - indexInSeries) % labelInterval === 0) {
				return String(y);
			}

			if (isolatedPoints[seriesId]?.has(toYyyyMm(date))) {
				return String(y);
			}

			return "";
		},
		[highlightedUser, cumulative, months.length, queryData, isolatedPoints],
	);

	const lineColor = useCallback(
		({ id }: { id: string }) => {
			const color = colorById[id]!;
			if (!highlightedUser || highlightedUser === id) {
				return color;
			}
			return `rgb(from ${color} r g b / ${isZack ? 0.25 : 0.1})`;
		},
		[colorById, highlightedUser, isZack],
	);

	return (
		<ChartContext.Provider
			value={{
				hoveredPoint,
				idByColor,
				isolatedPoints,
				colorById,
				queryData,
			}}
		>
			<div className={cx("container")}>
				<div
					style={{ height }}
					onMouseLeave={() => {
						setHighlightedUser(null);
						setHoveredPoint(null);
					}}
				>
					<Line
						data={chartData}
						colors={lineColor}
						pointLabel={pointLabel}
						pointSymbol={PointSymbol}
						tooltip={onMouseMove}
					/>
				</div>
				<br />
				{controls}
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
