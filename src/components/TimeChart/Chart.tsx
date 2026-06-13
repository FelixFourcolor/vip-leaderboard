import { ResponsiveLine } from "@nivo/line";
import classNames from "classnames/bind";
import { partition, range } from "es-toolkit";
import { type ComponentProps, useMemo } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toDate } from "@/utils/time";
import type { Maybe } from "@/utils/types";
import { useChart } from "./chartContext";
import { Areas } from "./layers/Areas";
import { Interaction } from "./layers/Interaction";
import { Labels } from "./layers/Labels";
import { Lines } from "./layers/Lines";
import { Points } from "./layers/Points";
import styles from "./TimeChart.module.css";
import { useChartZoom } from "./zoomContext";

const cx = classNames.bind(styles);

export type ChartSeries = { id: string; data: ChartPoint[] };
export type ChartPoint = {
	x: Date;
	y: number | null;
	value: number;
	rank?: number;
};

type NivoProps = ComponentProps<typeof ResponsiveLine<ChartSeries>>;
type ChartProps = {
	margin?: NivoProps["margin"];
	axisLeft?: Pick<
		NonNullable<NivoProps["axisLeft"]>,
		"legendOffset" | "legend"
	>;
	className?: string;
};

export function Chart({ className, ...configs }: ChartProps) {
	const { renderReady } = useChart();
	const { clipPathId } = useChartZoom();
	const data = useDataOrdering();
	const colors = useColors();
	const { yScale, axisLeft, gridYValues } = useVerticalScale(configs);
	const { xScale, axisBottom, gridXValues } = useHorizontalScale();

	return (
		<div
			className={cx("chart", className)}
			style={{ ["--clip-path-url" as string]: `url(#${clipPathId})` }}
		>
			{renderReady && data ? (
				<ResponsiveLine
					{...DEFAULT_CONFIGS}
					margin={{ ...DEFAULT_CONFIGS.margin, ...configs.margin }}
					data={data}
					colors={colors}
					gridXValues={gridXValues}
					axisBottom={axisBottom}
					xScale={xScale}
					yScale={yScale}
					axisLeft={axisLeft}
					gridYValues={gridYValues}
				/>
			) : (
				<LoadingSpinner size={48} />
			)}
		</div>
	);
}

const DEFAULT_CONFIGS = {
	curve: "monotoneX",
	xFormat: "time:%Y-%m",
	xScale: { type: "time" },
	yScale: { type: "linear", nice: false },
	axisBottom: { format: "%Y-%m", tickSize: 8 },
	axisLeft: { tickSize: 8 },
	margin: { top: 32, right: 32, bottom: 32, left: 32 },
	layers: ["grid", "axes", Areas, Lines, Points, Labels, Interaction],
	theme: {
		background: "var(--bg-secondary)",
		text: { fontFamily: "inherit" },
		axis: {
			ticks: {
				line: {
					stroke: "var(--text-tertiary)",
					strokeWidth: 0.3,
				},
				text: {
					fill: "var(--text-secondary)",
					fontSize: "var(--text-small)",
					fontWeight: "var(--weight-semi-bold)",
				},
			},
			legend: {
				text: {
					fill: "var(--text-primary)",
					fontSize: "var(--text-semi-large)",
				},
			},
		},
		grid: {
			line: {
				stroke: "var(--text-tertiary)",
				strokeWidth: 0.3,
			},
		},
	},
} satisfies Partial<ComponentProps<typeof ResponsiveLine<ChartSeries>>>;

function useDataOrdering(): Maybe<readonly ChartSeries[]> {
	const { chartData, activeSeries, area, ranked } = useChart();
	const stacked = area && !ranked;

	// To draw the active series on top
	// Except in stacked mode where the bands never overlap anyway
	return useMemo(() => {
		if (!chartData || !activeSeries || stacked) {
			return chartData;
		}
		const [active, others] = partition(chartData, (s) => s.id === activeSeries);
		return [...others, ...active];
	}, [chartData, activeSeries, stacked]);
}

function useColors() {
	const { seriesData, colors } = useChart();

	const colorMapping = useMemo(() => {
		if (!seriesData) {
			return {};
		}
		return Object.fromEntries(
			seriesData.map(({ id }, i) => [id, colors[i % colors.length]]),
		);
	}, [seriesData, colors]);

	// Cannot use array index because of useDataOrdering
	return (series: ChartSeries) => colorMapping[series.id]!;
}

const LABEL_WIDTH = 64; // estimate based on current styles
function useHorizontalScale() {
	const { chartWidth, xValues, xZoom } = useChartZoom();

	const labelsCount = chartWidth
		? Math.max(Math.floor(chartWidth / LABEL_WIDTH), 2)
		: undefined;

	const visibleXValues = useMemo(() => {
		const [startOffset, endOffset] = xZoom;
		return xValues.slice(startOffset, -endOffset || undefined);
	}, [xValues, xZoom]);

	const gridXValues = useMemo(() => {
		if (!labelsCount) {
			return undefined;
		}
		const xLength = visibleXValues.length;
		const interval = Math.ceil((xLength - 1) / (labelsCount - 1));
		return range(xLength - 1, -1, -Math.max(interval, 1))
			.map((i) => visibleXValues[i]!)
			.map(toDate);
	}, [visibleXValues, labelsCount]);

	const xScale = useMemo(() => {
		const since = visibleXValues[0];
		const min = since ? toDate(since) : undefined;
		const until = visibleXValues.at(-1)!;
		const max = until ? toDate(until) : undefined;
		return { ...DEFAULT_CONFIGS.xScale, min, max };
	}, [visibleXValues]);

	const axisBottom = useMemo(() => {
		return { ...DEFAULT_CONFIGS.axisBottom, tickValues: gridXValues };
	}, [gridXValues]);

	return { axisBottom, xScale, gridXValues };
}

const LABEL_HEIGHT = 32; // estimate based on current styles
const NICE_INTERVALS = [
	1, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000,
] as const;
function useVerticalScale(configs: ChartProps) {
	const { area, ranked } = useChart();
	const { chartHeight, yRange, yZoom } = useChartZoom();

	const labelsCount = chartHeight
		? Math.min(Math.max(Math.floor(chartHeight / LABEL_HEIGHT), 2), 12)
		: undefined;

	const [startOffset, endOffset] = yZoom;
	const min = yRange.min + startOffset;
	const max = yRange.max - endOffset;

	const interval = labelsCount
		? Math.ceil((max - min) / (labelsCount - 1))
		: undefined;

	const niceInterval = useMemo(() => {
		if (interval) {
			for (const i of NICE_INTERVALS) {
				if (interval <= i) {
					return i;
				}
			}
		}
		return interval;
	}, [interval]);

	const gridYValues = useMemo(() => {
		if (!interval || !niceInterval) {
			return undefined;
		}

		const values = range(
			niceInterval * Math.ceil(min / niceInterval),
			niceInterval * Math.floor(max / niceInterval) + 1,
			niceInterval,
		);
		return [
			...((values[0] ?? min) - min >= interval ? [min] : []),
			...values,
			...(max - (values.at(-1) ?? max) >= interval ? [max] : []),
		];
	}, [min, max, interval, niceInterval]);

	const reverse = !area && ranked;
	const yScale = useMemo(
		() => ({ ...DEFAULT_CONFIGS.yScale, min, max, reverse }),
		[min, max, reverse],
	);

	const { legend, legendOffset } = configs.axisLeft ?? {};
	const axisLeft = useMemo(
		() => ({
			...DEFAULT_CONFIGS.axisLeft,
			legend,
			legendOffset,
			tickValues: gridYValues,
		}),
		[legend, legendOffset, gridYValues],
	);

	return { yScale, axisLeft, gridYValues };
}
