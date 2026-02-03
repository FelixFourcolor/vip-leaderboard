import { ResponsiveLine } from "@nivo/line";
import type { PartialTheme } from "@nivo/theming";
import { useMemo, useState } from "react";
import type { MonthlyData } from "@/types";
import { Tooltip } from "./Tooltip";

type Props = {
	data: MonthlyData;
};

export function Chart({ data }: Props) {
	const [prioritizedUser, setPrioritizedUser] = useState<string | null>(null);
	const [cumulative, _] = useState(false);

	const userRanks = useMemo(
		() =>
			Object.fromEntries(Object.keys(data).map((k, index) => [k, index + 1])),
		[data],
	);

	const chartData = useMemo(() => {
		const orderedData = prioritizedUser
			? (() => {
					const { [prioritizedUser]: first, ...rest } = data;
					return first ? { [prioritizedUser]: first, ...rest } : data;
				})()
			: data;

		return Object.entries(orderedData).map(([id, { tickets }]) => ({
			id,
			data: tickets.map(({ month: x, count: y }) => ({ x, y })),
		}));
	}, [data, prioritizedUser]);

	console.log({ prioritizedUser });

	const cumulativeChartData = useMemo(
		() =>
			chartData.map(({ id, data }) => {
				let cumulativeY = 0;
				return {
					id,
					data: data.map(({ x, y }) => {
						cumulativeY += y;
						return { x, y: cumulativeY };
					}),
				};
			}),
		[chartData],
	);

	return (
		<ResponsiveLine
			data={cumulative ? cumulativeChartData : chartData}
			colors={({ id }) => colorSchemes[userRanks[id] % colorSchemes.length]}
			theme={themeConfig}
			curve="monotoneX"
			useMesh
			enableCrosshair={false}
			pointSize={7}
			xFormat="time:%Y-%m"
			xScale={{ format: "%Y-%m", type: "time", useUTC: false }}
			margin={{
				top: 12,
				right: 24,
				bottom: 24,
				left: 56,
			}}
			axisLeft={{
				legend: "Tickets handled",
				legendOffset: -42,
			}}
			axisBottom={{ format: "%Y-%m" }}
			tooltip={({
				point: {
					seriesId,
					data: { x, y },
					seriesColor,
				},
			}) => {
				const { color, avatarUrl, name } = data[seriesId];
				return (
					<Tooltip
						name={name}
						color={color}
						avatarUrl={avatarUrl}
						seriesColor={seriesColor}
						month={new Date(x).toISOString().slice(0, 7)}
						count={y}
						onMount={() => setPrioritizedUser(seriesId)}
					/>
				);
			}}
		/>
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
];

const themeConfig: PartialTheme = {
	background: "var(--bg-secondary)",
	text: { fill: "var(--text-primary)" },
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
			text: { fontSize: "var(--text-small)" },
		},
	},
	grid: {
		line: {
			stroke: "var(--text-tertiary)",
			strokeWidth: 0.5,
		},
	},
} as const;
