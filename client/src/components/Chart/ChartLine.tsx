import { type Point, type PointTooltipProps, ResponsiveLine } from "@nivo/line";
import { useCallback } from "react";
import { useZackMode } from "@/hooks/useZackMode";
import { useSearch } from "@/routes/index";
import { toYyyyMm } from "@/utils/time";
import type { ChartSeries } from "./Chart";
import { ChartPoint } from "./ChartPoint";
import { useChart } from "./context";

export const ChartLine = ({
	data,
	tooltip,
}: {
	data: ChartSeries[];
	tooltip: (_: PointTooltipProps<ChartSeries>) => null;
}) => {
	const [{ cumulative }] = useSearch();
	const [isZack] = useZackMode();
	const { queryData, colorById, highlightedUser, isolatedPoints } = useChart();

	const pointLabel = useCallback(
		({
			seriesId,
			seriesIndex,
			indexInSeries,
			data: { x: date, y },
		}: Point<ChartSeries>) => {
			if (highlightedUser !== seriesId || y === null) {
				return "";
			}

			const seriesLength = cumulative
				? (data[seriesIndex]?.data.length ?? 0)
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
		[highlightedUser, cumulative, data, queryData, isolatedPoints],
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
		<ResponsiveLine
			data={data}
			colors={lineColor}
			pointLabel={pointLabel}
			pointSymbol={ChartPoint}
			tooltip={tooltip}
			curve="monotoneX"
			useMesh
			enableCrosshair={false}
			enablePointLabel
			xFormat="time:%Y-%m"
			xScale={{ type: "time", useUTC: false }}
			margin={{ top: 24, right: 24, bottom: 24, left: 60 }}
			axisLeft={{ legend: "Tickets handled", legendOffset: -44 }}
			axisBottom={{ format: "%Y-%m" }}
			theme={{
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
			}}
		/>
	);
};
