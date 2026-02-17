import {
	type Point,
	type PointOrSliceMouseHandler,
	ResponsiveLine,
} from "@nivo/line";
import {
	type ComponentProps,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useZackMode } from "@/hooks/useZackMode";
import { toDate, toYyyyMm } from "@/utils/time";
import type { ChartSeries } from "./Chart";
import { useChartControls } from "./ChartControls";
import { ChartPoint } from "./ChartPoint";
import { useChart } from "./context";

export const ChartLine = ({
	data,
	onMouseMove,
}: {
	data: ChartSeries[];
	onMouseMove: PointOrSliceMouseHandler<ChartSeries>;
}) => {
	const [{ cumulative }] = useChartControls();
	const [isZack] = useZackMode();
	const { monthlyData, months, colorById, highlightedUser, isolatedPoints } =
		useChart();

	const containerRef = useRef<HTMLDivElement | null>(null);
	const [containerWidth, setContainerWidth] = useState(0);
	const [animate, setAnimate] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return;
		}

		// prevent animation of the grid and axis ticks on load
		setTimeout(() => setAnimate(true), 400);

		setContainerWidth(container.clientWidth);
		const observer = new ResizeObserver(
			([entry]) => entry && setContainerWidth(entry.contentRect.width),
		);
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

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
			const count = cumulative
				? (data[seriesIndex]?.data.length ?? 0)
				: (monthlyData[seriesId]?.length ?? 0);
			const interval = Math.ceil(count / (cumulative ? 8 : 16));
			if (
				(count - 1 - indexInSeries) % interval === 0 ||
				isolatedPoints[seriesId]?.has(toYyyyMm(date))
			) {
				return String(y);
			}
			return "";
		},
		[highlightedUser, cumulative, data, monthlyData, isolatedPoints],
	);

	const lineColor = useCallback(
		({ id }: { id: string }) => {
			const color = colorById[id] ?? "var(--text-secondary)";
			if (!highlightedUser || highlightedUser === id) {
				return color;
			}
			return `rgb(from ${color} r g b / ${isZack ? 0.2 : 0.1})`;
		},
		[colorById, highlightedUser, isZack],
	);

	const [gridXValues, axisBottom] = useMemo(() => {
		const count = months.length;
		const { left, right } = chartConfigs.margin;
		const innerWidth = Math.max(0, containerWidth - left - right);
		const fontSize = 12;
		const labelWidth = 7 * fontSize * 0.6;
		const safetyGap = 12;
		const minSpacing = labelWidth + safetyGap;
		const maxLabels = Math.max(2, Math.floor(innerWidth / minSpacing));
		const interval = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));

		const tickValues = months
			.filter((_, index) => (count - 1 - index) % interval === 0)
			.map(toDate);
		const axisBottom = { format: "%Y-%m", tickValues };
		return [tickValues, axisBottom];
	}, [months, containerWidth]);

	return (
		<div ref={containerRef} style={{ width: "100%", height: "100%" }}>
			<ResponsiveLine
				data={data}
				colors={lineColor}
				pointLabel={pointLabel}
				pointSymbol={ChartPoint}
				onMouseMove={onMouseMove}
				gridXValues={gridXValues}
				axisBottom={axisBottom}
				animate={animate}
				{...chartConfigs}
			/>
		</div>
	);
};

const chartConfigs = {
	tooltip: () => null,
	curve: "monotoneX",
	useMesh: true,
	enableCrosshair: false,
	enablePointLabel: true,
	xFormat: "time:%Y-%m",
	xScale: { type: "time", useUTC: false },
	margin: { top: 24, right: 28, bottom: 24, left: 64 },
	axisLeft: { legend: "Tickets handled", legendOffset: -48 },
	theme: {
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
	},
} satisfies Partial<ComponentProps<typeof ResponsiveLine<ChartSeries>>>;
