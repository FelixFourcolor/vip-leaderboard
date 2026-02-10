import { ResponsiveLine } from "@nivo/line";
import type { PartialTheme } from "@nivo/theming";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";
import { useGetLastUpdated } from "@/api/queries";
import type { MonthlyData } from "@/api/types";
import { TimeSlider } from "@/components/TimeSlider";
import { Toggle } from "@/components/Toggle";
import { useZackMode } from "@/hooks/useZackMode";
import { slidingWindow } from "@/utils/iter";
import { monthsInRange, toYyyyMm } from "@/utils/time";
import styles from "./Chart.module.css";
import { Tooltip } from "./Tooltip";

const cx = classNames.bind(styles);

type State<T> = [initial: T, onChange: Dispatch<SetStateAction<T>>];

type Props = {
	data: MonthlyData;
	height: number;
	cumulative: State<boolean>;
	from: State<string>;
	to: State<string>;
};

export function Chart({ data, height, cumulative, from, to }: Props) {
	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const [hoveredPoint, setHoveredPoint] = useState<{
		x: Date;
		y: number;
	} | null>(null);

	const [isZack] = useZackMode();

	const colorById = useMemo(() => {
		return Object.fromEntries(
			Object.keys(data).map((userId, i) => [
				userId,
				colorSchemes[i % colorSchemes.length]!,
			]),
		);
	}, [data]);

	const idByColor = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(colorById).map(([id, color]) => [color, id]),
			),
		[colorById],
	);

	const dataByMonth = useMemo(
		() =>
			mapValues(data, ({ tickets }) =>
				Object.fromEntries(tickets.map(({ month, count }) => [month, count])),
			),
		[data],
	);

	const months = useMemo(
		// query "to" is exclusive, but monthsInRange is inclusive
		() => monthsInRange(from[0], to[0]).slice(0, -1),
		[from[0], to[0]],
	);

	const chartData = useMemo(() => {
		const orderedData = highlightedUser
			? (() => {
					const { [highlightedUser]: first, ...rest } = dataByMonth;
					return first ? { [highlightedUser]: first, ...rest } : dataByMonth;
				})()
			: dataByMonth;

		return Object.entries(orderedData).map(([id, ticketsByMonth]) => {
			const data = months
				.map((month) => {
					const tickets = ticketsByMonth[month];
					if (tickets !== undefined) {
						return { x: month, y: tickets };
					}
					if (cumulative[0]) {
						return null;
					}
					return { x: month, y: null };
				})
				.filter((x) => x !== null);

			return { id, data };
		});
	}, [dataByMonth, months, cumulative[0], highlightedUser]);

	const isolatedPoints = useMemo(() => {
		const windows = Array.from(slidingWindow(months, 3, true));
		return mapValues(
			dataByMonth,
			(ticketsByMonth) =>
				new Set(
					windows
						.filter(([prev, , next]) => {
							const prevMissing =
								prev === undefined || ticketsByMonth[prev] === undefined;
							const nextMissing =
								next === undefined || ticketsByMonth[next] === undefined;
							return prevMissing && nextMissing;
						})
						.map(([, value]) => value),
				),
		);
	}, [dataByMonth, months]);
	console.log(isolatedPoints);

	const seriesLength = getAnyValue(data)?.tickets.length || 0;
	const labelInterval = Math.ceil(seriesLength / 16);

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
			pointLabel={({ seriesId, indexInSeries, data: { y } }) => {
				if (
					highlightedUser === seriesId &&
					(seriesLength - 1 - indexInSeries) % labelInterval === 0
				) {
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

				const seriesId = idByColor[color]; // nivo's bug for not exposing seriesId
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

				const { color, avatarUrl, name } = data[seriesId]!;
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

	const controls = (
		<div className={cx("controls")}>
			<Toggle
				initial={cumulative[0]}
				onChange={cumulative[1]}
				className={cx("toggle")}
			>
				Cumulative
			</Toggle>
			<TimeSlider
				domain={{
					// hardcoded earliest month with "meaningful" data
					from: "2020-10",
					to: useGetLastUpdated().toISOString().slice(0, 7),
				}}
				initial={{
					from: from[0],
					to: to[0],
				}}
				onChange={{
					from: from[1],
					to: to[1],
				}}
			/>
		</div>
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

function getAnyValue<T>(obj: Record<any, T>): T | undefined {
	for (const key in obj) {
		return obj[key];
	}
}

const CustomResponsiveLine: typeof ResponsiveLine = (props) => (
	<ResponsiveLine
		theme={themeConfig}
		curve="monotoneX"
		useMesh
		enableCrosshair={false}
		enablePointLabel
		xFormat="time:%Y-%m"
		xScale={{
			format: "%Y-%m",
			type: "time",
			// useUTC means convert input date to local time for display.Set to false to not apply any timezone conversion
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
