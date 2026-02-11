import { ResponsiveLine } from "@nivo/line";
import type { PartialTheme } from "@nivo/theming";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { useMemo, useState } from "react";
import { useGetLastUpdated, useGetMonthlyData } from "@/api/queries";
import { TimeSlider } from "@/components/TimeSlider";
import { Toggle } from "@/components/Toggle";
import { useLastDefined } from "@/hooks/useLastDefined";
import { useZackMode } from "@/hooks/useZackMode";
import { slidingWindow } from "@/utils/iter";
import { monthsInRange, offset, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";
import { Tooltip } from "./Tooltip";

const cx = classNames.bind(styles);

type Props = {
	height: number;
};

export function Chart({ height }: Props) {
	const lastUpdated = useGetLastUpdated();
	const [to, setTo] = useState(() => toYyyyMm(lastUpdated));
	const [from, setFrom] = useState(() => offset(to, { years: -2 }));
	const [cumulative, setCumulative] = useState(false);

	const queryData =
		useLastDefined(
			useGetMonthlyData({
				cumulative,
				top: 10,
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
						return [month, previous] as const;
					}
					return [month, null] as const;
				});
				return Object.fromEntries(data);
			}),
		[queryData, cumulative, months],
	);

	const chartData = useMemo(() => {
		const orderedData = highlightedUser
			? (() => {
					const { [highlightedUser]: first, ...rest } = data;
					return first ? { [highlightedUser]: first, ...rest } : data;
				})()
			: data;

		return Object.entries(orderedData).map(([id, ticketsByMonth]) => ({
			id,
			data: Object.entries(ticketsByMonth).map(([x, y]) => ({ x, y })),
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
							const prevMissing =
								prev === undefined || ticketsByMonth[prev] === null;
							const nextMissing =
								next === undefined || ticketsByMonth[next] === null;
							return prevMissing && nextMissing;
						})
						.map(([, value]) => value),
				),
		);
	}, [data, months]);

	const controls = (
		<div className={cx("controls")}>
			<Toggle
				initial={cumulative}
				onChange={setCumulative}
				className={cx("toggle")}
			>
				Cumulative
			</Toggle>
			<TimeSlider
				domain={[
					"2020-10", // earliest month with "meaningful" data
					// kinda hard to define "meaningful", so just hardcode a value
					toYyyyMm(useGetLastUpdated()),
				]}
				initial={[from, to]}
				onChange={[setFrom, setTo]}
			/>
		</div>
	);

	const line = (
		<CustomResponsiveLine
			data={chartData}
			colors={({ id }) => {
				const color = colorById[id] ?? colorSchemes[0];
				if (!highlightedUser || highlightedUser === id) {
					return color;
				}
				return `rgb(from ${color} r g b / ${isZack ? 0.25 : 0.1})`;
			}}
			pointLabel={({ seriesId, indexInSeries, data: { x, y } }) => {
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

				const date = x as any as Date; // nivo type is wrong
				if (isolatedPoints[seriesId]?.has(toYyyyMm(date))) {
					return String(y);
				}

				return "";
			}}
			pointSymbol={({ color, datum: { x, y } }) => {
				const date = x as any as Date; // nivo type is wrong
				if (
					hoveredPoint &&
					hoveredPoint.x.getTime() === date.getTime() &&
					hoveredPoint.y === y
				) {
					return <circle r={6} fill={color} />;
				}
				// nivo's bug for not exposing seriesId,
				// requires a stupid workaround to determine seriesId from color
				const seriesId = idByColor[color];
				if (seriesId && isolatedPoints[seriesId]?.has(toYyyyMm(date))) {
					return <circle r={3} fill={color} />;
				}
			}}
			tooltip={({
				point: {
					seriesId,
					data: { x, y },
					seriesColor,
				},
			}) => {
				if (y === null) {
					return null;
				}

				const { color, avatarUrl, name } = queryData[seriesId]!;
				const date = x as any as Date; // nivo type is wrong
				const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

				return (
					<Tooltip
						name={name}
						color={color}
						avatarUrl={avatarUrl}
						seriesColor={seriesColor}
						month={month}
						count={y}
						onMount={() => {
							setHighlightedUser(seriesId);
							setHoveredPoint({ x: date, y });
						}}
					/>
				);
			}}
		/>
	);

	return (
		<div className={cx("container")}>
			<div
				role="none"
				className={cx("chart")}
				style={{ height }}
				onMouseLeave={() => {
					setHighlightedUser(null);
					setHoveredPoint(null);
				}}
			>
				{line}
			</div>
			<br />
			{controls}
		</div>
	);
}

const CustomResponsiveLine: typeof ResponsiveLine = (props) => (
	<ResponsiveLine
		theme={themeConfig}
		curve="monotoneX"
		animate={false} // nivo's animation looks nice but is buggy
		useMesh
		enableCrosshair={false}
		enablePointLabel
		xFormat="time:%Y-%m"
		xScale={{
			format: "%Y-%m",
			type: "time",
			// useUTC means convert input date to local time for display. False to not apply any timezone conversion
			useUTC: false,
		}}
		margin={{ top: 12, right: 24, bottom: 24, left: 60 }}
		axisLeft={{ legend: "Tickets handled", legendOffset: -44 }}
		axisBottom={{ format: "%Y-%m" }}
		{...props}
	/>
);

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

const themeConfig: PartialTheme = {
	background: "var(--bg-secondary)",
	text: {
		fill: "var(--text-primary)",
		fontSize: "var(--text-mini)",
	},
	crosshair: {
		line: { stroke: "var(--text-secondary)" },
	},
	axis: {
		ticks: {
			line: {
				stroke: "var(--text-tertiary)",
				strokeWidth: 0.5,
			},
			text: {
				fill: "var(--text-secondary)",
				fontWeight: "bold",
			},
		},
		legend: {
			text: { fontSize: "var(--text-regular)" },
		},
	},
	grid: {
		line: {
			stroke: "var(--text-tertiary)",
			strokeWidth: 0.5,
		},
	},
} as const;
