import { useAnimatedPath } from "@nivo/core";
import {
	type LineCustomSvgLayerProps,
	type Point,
	type PointOrSliceMouseHandler,
	ResponsiveLine,
} from "@nivo/line";
import { animated } from "@react-spring/web";
import classNames from "classnames/bind";
import { mapValues } from "es-toolkit";
import {
	type ComponentProps,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useZackMode } from "@/hooks/useZackMode";
import { getAnyValue } from "@/utils/object";
import { toDate } from "@/utils/time";
import type { ChartSeries } from "./Chart";
import styles from "./Chart.module.css";
import { useChartControls } from "./ChartControls";
import { ChartPoint } from "./ChartPoint";
import { getSeriesColor } from "./colors";
import { useChart } from "./context";

const cx = classNames.bind(styles);

type Props = {
	linesData: ChartSeries[];
	onMouseMove: PointOrSliceMouseHandler<ChartSeries>;
	onMouseLeave: () => void;
};

export const ChartLine = ({ linesData, onMouseMove, onMouseLeave }: Props) => {
	const [{ cumulative }] = useChartControls();
	const [isZack] = useZackMode();
	const { chartData, highlightedUser } = useChart();

	const chartRef = useRef<HTMLDivElement | null>(null);
	const [chartWidth, setChartWidth] = useState(0);
	const [animate, setAnimate] = useState(false);

	const xLabels = useMemo(
		() => getAnyValue(chartData)?.monthlyCount.map(({ month }) => month) ?? [],
		[chartData],
	);

	const pointsCount = useMemo(() => {
		return mapValues(chartData, ({ monthlyCount }) => {
			return monthlyCount.filter(({ count }) => count !== null).length;
		});
	}, [chartData]);

	useEffect(() => {
		const chart = chartRef.current;
		if (!chart) {
			return;
		}

		// prevent animation of the grid and axis ticks on load
		setTimeout(() => setAnimate(true), 400);

		setChartWidth(chart.clientWidth);
		const observer = new ResizeObserver(
			([entry]) => entry && setChartWidth(entry.contentRect.width),
		);
		observer.observe(chart);
		return () => observer.disconnect();
	}, []);

	const pointLabel = useCallback(
		({ seriesId, indexInSeries, data: { y } }: Point<ChartSeries>) => {
			if (highlightedUser !== seriesId || y === null) {
				return "";
			}
			const interval = Math.ceil(xLabels.length / (cumulative ? 8 : 16));
			const count = pointsCount[seriesId] ?? xLabels.length;
			if ((count - 1 - indexInSeries) % interval === 0) {
				return String(y);
			}
			return "";
		},
		[highlightedUser, cumulative, pointsCount, xLabels.length],
	);

	const lineColor = useCallback(
		({ id }: { id: string }) => {
			const color = getSeriesColor(chartData[id]!);
			if (highlightedUser === id) {
				return color;
			}
			if (!highlightedUser) {
				return `rgb(from ${color} r g b / 0.8)`;
			}
			return `rgb(from ${color} r g b / ${isZack ? 0.5 : 0.4})`;
		},
		[chartData, highlightedUser, isZack],
	);

	const [gridXValues, axisBottom] = useMemo(() => {
		const count = xLabels.length;
		const { left, right } = chartConfigs.margin;
		const innerWidth = Math.max(0, chartWidth - left - right);
		const fontSize = 12;
		const labelWidth = 7 * fontSize * 0.6;
		const safetyGap = 12;
		const minSpacing = labelWidth + safetyGap;
		const maxLabels = Math.max(2, Math.floor(innerWidth / minSpacing));
		const interval = Math.max(1, Math.ceil((count - 1) / (maxLabels - 1)));

		const tickValues = xLabels
			.filter((_, index) => (count - 1 - index) % interval === 0)
			.map(toDate);
		const axisBottom = { format: "%Y-%m", tickValues };
		return [tickValues, axisBottom];
	}, [xLabels, chartWidth]);

	return (
		<div ref={chartRef} className={cx("chart")} onMouseLeave={onMouseLeave}>
			<ResponsiveLine
				data={linesData}
				colors={lineColor}
				pointLabel={pointLabel}
				onMouseMove={onMouseMove}
				gridXValues={gridXValues}
				axisBottom={axisBottom}
				animate={animate}
				{...chartConfigs}
			/>
		</div>
	);
};

function CustomLinesLayer({
	series,
	lineGenerator,
}: LineCustomSvgLayerProps<ChartSeries>) {
	return (
		<g>
			{series.map(({ id, data, color }) => (
				<Line
					key={id}
					id={id}
					path={lineGenerator(data.map((d) => d.position)) ?? ""}
					color={color}
				/>
			))}
		</g>
	);
}

function Line({
	id,
	path,
	color,
}: {
	id: string;
	path: string;
	color: string;
}) {
	const animatedPath = useAnimatedPath(path);

	const { highlightedUser } = useChart();
	const highlighted = highlightedUser === id;
	const dimmed = highlightedUser && !highlighted;

	return (
		<g>
			{highlighted && (
				<path
					d={path}
					fill="none"
					stroke={color}
					strokeWidth={6}
					strokeOpacity={0.25}
					style={{ filter: "blur(3px)" }}
				/>
			)}
			<animated.path
				d={animatedPath}
				fill="none"
				stroke={color}
				strokeWidth={dimmed ? 1 : 2}
			/>
		</g>
	);
}

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
	pointSymbol: ChartPoint,
	layers: ["grid", "axes", "areas", CustomLinesLayer, "points", "mesh"],
	theme: {
		background: "var(--bg-secondary)",
		text: {
			fill: "var(--text-primary)",
			fontSize: "var(--text-mini)",
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
