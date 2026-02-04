import { ResponsiveLine } from "@nivo/line";
import type { PartialTheme } from "@nivo/theming";
import classNames from "classnames/bind";
import { useMemo, useState } from "react";
import type { MonthlyData } from "@/api/types";
import { Toggle } from "@/components/Toggle";
import { useZackMode } from "@/hooks/zackMode";
import styles from "./Chart.module.css";
import { Tooltip } from "./Tooltip";

const cx = classNames.bind(styles);

type Props = {
	data: MonthlyData;
	height: number;
	setCumulative: (cumulative: boolean) => void;
};

export function Chart({ data, height, setCumulative }: Props) {
	const [highlightedUser, setHighlightedUser] = useState<string | null>(null);
	const [isZack] = useZackMode();

	const lineColor = useMemo(
		() =>
			Object.fromEntries(
				Object.keys(data).map((userId, i) => [
					userId,
					colorSchemes[i % colorSchemes.length],
				]),
			),
		[data],
	);

	const chartData = useMemo(() => {
		const orderedData = highlightedUser
			? (() => {
					const { [highlightedUser]: first, ...rest } = data;
					return first ? { [highlightedUser]: first, ...rest } : data;
				})()
			: data;

		return Object.entries(orderedData).map(([id, { tickets }]) => ({
			id,
			data: tickets.map(({ month: x, count: y }) => ({ x, y })),
		}));
	}, [data, highlightedUser]);

	const seriesLength = Object.values(data)[0]?.tickets.length || 0;
	const labelInterval = Math.ceil(seriesLength / 24);

	return (
		<div className={cx("container")}>
			<Toggle onChange={setCumulative} className={cx("toggle")}>
				Cumulative
			</Toggle>
			<div
				role="none"
				className={cx("chart")}
				style={{ height }}
				onMouseLeave={() => setHighlightedUser(null)}
			>
				<CustomResponsiveLine
					data={chartData}
					colors={({ id }) => {
						const color = lineColor[id] ?? colorSchemes[0];
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
					tooltip={({
						point: {
							seriesId,
							data: { x, y },
							seriesColor,
						},
					}) => {
						const { color, avatarUrl, name } = data[seriesId]!;
						return (
							<Tooltip
								name={name}
								color={color}
								avatarUrl={avatarUrl}
								seriesColor={seriesColor}
								month={new Date(x).toISOString().slice(0, 7)}
								count={y}
								onMount={() => setHighlightedUser(seriesId)}
							/>
						);
					}}
				/>
			</div>
		</div>
	);
}

const CustomResponsiveLine: typeof ResponsiveLine = (props) => (
	<ResponsiveLine
		theme={themeConfig}
		curve="monotoneX"
		useMesh
		pointSize={8}
		enablePointLabel
		xFormat="time:%Y-%m"
		xScale={{ format: "%Y-%m", type: "time", useUTC: false }}
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
		fontSize: "var(--text-small)",
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
				fontSize: "var(--text-mini)",
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
